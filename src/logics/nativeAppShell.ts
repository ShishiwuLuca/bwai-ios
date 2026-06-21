import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { initAppUpdateInstallLifecycleListeners, notifyAppReady } from '/@/utils/appUpdate';
// 与页面中 `--safe-area-inset-*` 配套的兜底值（顶栏；底栏勿写死，避免与 Tabbar+env 叠加过高）

/** HEAD_SAFE_AREA_PX */
const HEAD_SAFE_AREA_PX = 5;

/** BOTTOM_SAFE_AREA_FALLBACK_PX */
const BOTTOM_SAFE_AREA_FALLBACK_PX = 20;

/** applyNativeSafeArea */
export const applyNativeSafeArea = (): void => {
  if (!Capacitor.isNativePlatform()) return;
  if (typeof document === 'undefined') return;
  try {
    const root = document.documentElement;
    root.classList.add('cap-native');
    root.style.setProperty('--safe-area-inset-top', `${HEAD_SAFE_AREA_PX}px`);
    if (Capacitor.getPlatform() !== 'ios') {
      root.style.paddingTop = `${HEAD_SAFE_AREA_PX}px`;
    }
    if (Capacitor.getPlatform() === 'android') {
      root.style.setProperty('--safe-area-inset-bottom', `${BOTTOM_SAFE_AREA_FALLBACK_PX}px`);
    }
  } catch {
    // ignore
  }
};

/** initNativeShell */
export const initNativeShell = (): void => {
  if (!Capacitor.isNativePlatform()) return;
  initAppUpdateInstallLifecycleListeners();
  if (Capacitor.getPlatform() !== 'ios') {
    try {
      void StatusBar.setOverlaysWebView({ overlay: true });
      void StatusBar.setStyle({ style: Style.Dark });
    } catch (e) {
      console.warn('[initNativeShell] StatusBar:', e);
    }
  }
  void notifyAppReady().catch((e) => console.warn('[initNativeShell] notifyAppReady:', e));
};

/** 方法：hideSplashScreenIfNative */
export const hideSplashScreenIfNative = async (): Promise<void> => {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    await SplashScreen.hide({ fadeOutDuration: 0 });
  } catch {
    // 插件不存在时静默失败
  }
};
