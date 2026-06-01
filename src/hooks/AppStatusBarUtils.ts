import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { ThemeEnum } from '/@/enums/appEnum';
import { useSystemStoreWithOut } from '/@/stores/modules/SystemConfig';

/** 启动时默认与 SystemStore 默认主题一致（持久化主题在 App.vue watch 里再同步） */
export const defaultStatusBarTheme = ThemeEnum.DARK;

/** 运行时 getInfo 可能含 height（iOS/Android 原生实现有，TS 定义未列出） */
type StatusBarInfoRuntime = {
  overlays?: boolean;
  height?: number;
};

/** 环境变量：measureEnvSafeAreaInsetTopPx */
const measureEnvSafeAreaInsetTopPx = (): number => {
  if (typeof document === 'undefined') {
    return 0;
  }
  const el = document.createElement('div');
  el.style.cssText =
    'position:absolute;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;padding-top:env(safe-area-inset-top);';
  document.documentElement.appendChild(el);
  const v = parseFloat(getComputedStyle(el).paddingTop) || 0;
  document.documentElement.removeChild(el);
  return v;
};

/** 方法：syncNativeNavBarTopInset */
export const syncNativeNavBarTopInset = async (): Promise<void> => {
  if (!Capacitor.isNativePlatform() || typeof document === 'undefined') {
    return;
  }
  const root = document.documentElement;
  const envTop = measureEnvSafeAreaInsetTopPx();
  try {
    const info = (await StatusBar.getInfo()) as StatusBarInfoRuntime;
    const h = Number(info.height) || 0;
    const overlays = info.overlays === true;
    let px = envTop;
    if (h > 0) {
      if (overlays) {
        px = Math.max(px, h);
      } else if (px < 1) {
        px = h;
      }
    }
    if (px > 0) {
      root.style.setProperty('--safe-area-inset-top', `${px}px`);
    } else {
      root.style.removeProperty('--safe-area-inset-top');
    }
  } catch {
    if (envTop > 0) {
      root.style.setProperty('--safe-area-inset-top', `${envTop}px`);
    } else {
      root.style.removeProperty('--safe-area-inset-top');
    }
  }
};

/** scheduleNativeNavBarTopInsetSync */
export const scheduleNativeNavBarTopInsetSync = (): void => {
  if (!Capacitor.isNativePlatform() || typeof document === 'undefined') {
    return;
  }
  const run = () => {
    void syncNativeNavBarTopInset();
  };
  run();
  requestAnimationFrame(run);
  requestAnimationFrame(() => requestAnimationFrame(run));
  setTimeout(run, 50);
  setTimeout(run, 200);
};

/** 方法：applyNativeStatusBarForTheme */
export const applyNativeStatusBarForTheme = async (_themeMode: ThemeEnum): Promise<void> => {
  if (!Capacitor.isNativePlatform()) {
    return;
  }
  try {
    await StatusBar.setOverlaysWebView({ overlay: true });
    try {
      // 沉浸式：状态栏区域透明，避免与页面内容出现「双色条」
      await StatusBar.setBackgroundColor({ color: '#00000000' });
    } catch {
      // iOS 等可能不支持 setBackgroundColor
    }
    // 始终浅色内容（白）：Capacitor Style.Dark = light text/icons on dark background
    await StatusBar.setStyle({ style: Style.Dark });
    scheduleNativeNavBarTopInsetSync();
  } catch (error) {
    console.error('[applyNativeStatusBarForTheme]', error);
  }
};
/** 与 applyNativeStatusBarForTheme 行为一致（沉浸式） */
export const enableImmersiveMode = async () => {
  await applyNativeStatusBarForTheme(defaultStatusBarTheme);
};
// 获取状态栏高度

/** 方法：getStatusBarHeight */
export const getStatusBarHeight = async () => {
  if (!Capacitor.isNativePlatform()) {
    return false;
  }
  try {
    const info: any = await StatusBar.getInfo();
    console.log('状态栏高度:', info.height);
    return info.height;
  } catch (error) {
    console.error('获取状态栏信息失败:', error);
    return 0;
  }
};
// 获取底部安全区高度

/** 方法：getSafeAreaInsets */
export const getSafeAreaInsets = async () => {
  if (!Capacitor.isNativePlatform()) {
    return false;
  }
  try {
    const info: any = await StatusBar.getInfo();
    console.log('底部安全区高度:', info.safeAreaInsets);
    return info.safeAreaInsets;
  } catch (error) {
    console.error('获取底部安全区高度失败:', error);
    return 0;
  }
};
// 根据当前的主题模式设置状态栏主题模式

/** 方法：getThemeModeStatusBar */
export const getThemeModeStatusBar = async () => {
  if (!Capacitor.isNativePlatform()) {
    return false;
  }
  const systemStore = useSystemStoreWithOut();
  await applyNativeStatusBarForTheme(systemStore.getDarkMode);
};
