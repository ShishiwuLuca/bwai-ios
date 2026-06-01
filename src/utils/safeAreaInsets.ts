/**
 * APP 端安全区：为 iOS 注入底部安全区 CSS 变量（头部安全区已移除）
 */
import { Capacitor } from '@capacitor/core';

/** FALLBACK_INSET_BOTTOM */
const FALLBACK_INSET_BOTTOM = 5;

/** CSS_VAR_BOTTOM */
const CSS_VAR_BOTTOM = '--safe-area-inset-bottom';

/** initSafeAreaInsets */
export const initSafeAreaInsets = (): void => {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') return;
  const root = document.documentElement;
  root.style.setProperty(CSS_VAR_BOTTOM, `${FALLBACK_INSET_BOTTOM}px`);
  root.classList.add('cap-native');
};
