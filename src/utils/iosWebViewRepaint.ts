import { Capacitor } from '@capacitor/core';

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

/** 启动 / 路由切换后多次促发重绘，缓解冷启动整页不可见 */
export const scheduleIOSWebViewRepaint = (): void => {
  if (!isIOSNativeWebView()) return;
  const run = (): void => {
    nudgeIOSWebViewRepaint();
  };
  run();
  requestAnimationFrame(run);
  requestAnimationFrame(() => requestAnimationFrame(run));
  window.setTimeout(run, 50);
  window.setTimeout(run, 200);
  window.setTimeout(run, 500);
};
