import { Capacitor } from '@capacitor/core';
import { closeDialog, closeNotify, closeToast } from 'vant';

/** 是否在 iOS 原生 WebView 内运行 */
export const isIOSNativeWebView = (): boolean =>
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';

const repaintTargets = (): HTMLElement[] => {
  if (typeof document === 'undefined') return [];
  return [document.documentElement, document.body, document.getElementById('app')].filter(
    (el): el is HTMLElement => el instanceof HTMLElement
  );
};

/**
 * 清理 Toast/Dialog 残留遮罩并促发重绘。
 * iOS WKWebView 上 van-overlay 合成层异常时会出现「可点不可见」。
 */
export const repairIOSWebViewLayers = (): void => {
  if (!isIOSNativeWebView() || typeof document === 'undefined') return;

  closeToast(true);
  closeDialog();
  closeNotify();

  document.querySelectorAll('.van-overlay').forEach((node) => {
    node.parentElement?.removeChild(node);
  });

  const body = document.body;
  const prevOpacity = body.style.opacity;
  body.style.opacity = '0.99';
  void body.offsetHeight;
  requestAnimationFrame(() => {
    body.style.opacity = prevOpacity;
    nudgeIOSWebViewRepaint();
  });
};

/**
 * 轻量触发 WKWebView 重绘，缓解 Toast/合成层后「可点不可见」。
 * 勿长期保留 translateZ，仅一帧后还原。
 */
export const nudgeIOSWebViewRepaint = (): void => {
  if (!isIOSNativeWebView()) return;
  for (const el of repaintTargets()) {
    const prev = el.style.transform;
    el.style.transform = 'translateZ(0)';
    requestAnimationFrame(() => {
      el.style.transform = prev;
    });
  }
};

/** 启动 / 路由切换后多次修复合成层，缓解冷启动整页不可见 */
export const scheduleIOSWebViewRepaint = (): void => {
  if (!isIOSNativeWebView()) return;
  const run = (): void => {
    repairIOSWebViewLayers();
  };
  run();
  requestAnimationFrame(run);
  requestAnimationFrame(() => requestAnimationFrame(run));
  window.setTimeout(run, 50);
  window.setTimeout(run, 200);
  window.setTimeout(run, 800);
};

/** iOS 原生 Toast 默认关闭 overlay，避免全屏遮罩合成层导致整页不绘制 */
export const iosNativeToastOptions = <T extends Record<string, unknown>>(
  options: T
): T & { overlay: false } => {
  if (!isIOSNativeWebView()) return options as T & { overlay: false };
  return { ...options, overlay: false };
};
