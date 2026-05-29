import { Capacitor } from '@capacitor/core';

/** 是否在 iOS 原生 WebView 内运行 */
export const isIOSNativeWebView = (): boolean =>
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';

/**
 * 轻量触发 WKWebView 重绘，缓解 Toast/合成层后「可点不可见」。
 * 勿长期保留 translateZ，仅一帧后还原。
 */
export const nudgeIOSWebViewRepaint = (): void => {
  if (!isIOSNativeWebView() || typeof document === 'undefined') return;
  const el = document.documentElement;
  const prev = el.style.transform;
  el.style.transform = 'translateZ(0)';
  requestAnimationFrame(() => {
    el.style.transform = prev;
  });
};
