import { Capacitor } from '@capacitor/core';
import { applyNativeIosViewportHeight } from '/@/logics/nativeIosViewportFix';
import { forceIosWebViewContentPaint } from '/@/logics/nativeIosWebViewPaint';
import { hideSplashScreenIfNative } from '/@/logics/nativeAppShell';

let wasInBackground = false;

/** 进后台标记（仅 iOS） */
export const markNativeIosEnteredBackground = (): void => {
  if (Capacitor.getPlatform() !== 'ios') return;
  wasInBackground = true;
};

/** 从后台回前台：重算高度 + 强制重绘 + 藏 Splash（不 reload，避免闪屏） */
export const recoverNativeIosFromBackground = (): void => {
  if (Capacitor.getPlatform() !== 'ios' || !wasInBackground) return;
  wasInBackground = false;

  void hideSplashScreenIfNative();
  setTimeout(() => void hideSplashScreenIfNative(), 80);
  setTimeout(() => void hideSplashScreenIfNative(), 400);

  const repaint = (): void => {
    applyNativeIosViewportHeight();
    forceIosWebViewContentPaint(true);
  };

  repaint();
  requestAnimationFrame(repaint);
  setTimeout(repaint, 100);
  setTimeout(repaint, 350);
};
