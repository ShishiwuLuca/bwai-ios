import { Capacitor } from '@capacitor/core';
import { closeDialog, closeNotify, closeToast } from 'vant';

/** 是否在 iOS 原生 WebView 内运行 */
export const isIOSNativeWebView = (): boolean =>
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';

const repaintTargets = (): HTMLElement[] => {
  if (typeof document === 'undefined') return [];
  return [document.documentElement, document.body].filter(
    (el): el is HTMLElement => el instanceof HTMLElement
  );
};

const REPAIR_DEBOUNCE_MS = 180;
let repairTimer: ReturnType<typeof setTimeout> | null = null;

/** 仅通过 Vant API 清理浮层，不直接删除 overlay DOM，避免状态错位 */
export const cleanupVantOverlayLayers = (): void => {
  if (!isIOSNativeWebView() || typeof document === 'undefined') return;

  closeToast(true);
  closeDialog();
  closeNotify();
};

/**
 * 清理遮罩并轻量 nudge 重绘（网络异常等场景）。
 * 勿在每次路由切换调用；勿使用 body opacity 0.99（易触发 WKWebView 整页不可见）。
 */
export const repairIOSWebViewLayers = (): void => {
  if (!isIOSNativeWebView() || typeof document === 'undefined') return;

  cleanupVantOverlayLayers();
  nudgeIOSWebViewRepaint();
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

/** 冷启动 / 网络恢复后单次 nudge，不在路由切换重复调用 */
export const scheduleIOSWebViewRepaint = (): void => {
  if (!isIOSNativeWebView()) return;
  if (repairTimer) {
    clearTimeout(repairTimer);
  }
  repairTimer = setTimeout(() => {
    repairTimer = null;
    repairIOSWebViewLayers();
  }, REPAIR_DEBOUNCE_MS);
};

/** iOS 原生 Toast 默认关闭 overlay，避免全屏遮罩合成层导致整页不绘制 */
export const iosNativeToastOptions = <T extends Record<string, unknown>>(
  options: T
): T & { overlay: false } => {
  if (!isIOSNativeWebView()) return options as T & { overlay: false };
  return { ...options, overlay: false };
};
