import { isNative } from './useAppInfo';
import { StatusBar, Style } from '@capacitor/status-bar';

/** 状态栏样式：Dark=浅色图标/文字，Light=深色图标/文字 */
export type StatusBarStyleType = 'dark' | 'light' | 'default';

/** useStatusBar */
export const useStatusBar = () => {
  /** 是否为原生环境 */
  const isApp = isNative;

  /**
   * 设置状态栏背景色
   * @param color 十六进制颜色，如 '#1b2132' 或 '#ff1b2132'（带透明度）
   * 注意：overlay 为 true（沉浸式）时背景透明，此设置无效；Android 15+ 系统不支持
   */
  const setBackgroundColor = async (color: string): Promise<void> => {
    if (!isNative) return;
    const hex = color.startsWith('#') ? color : `#${color}`;
    await StatusBar.setBackgroundColor({ color: hex });
  };

  /**
   * 设置状态栏图标/文字样式（用于适配深色/浅色背景）
   * @param style dark=浅色图标（适合深色背景），light=深色图标（适合浅色背景），default=跟随系统
   */
  const setStyle = async (style: StatusBarStyleType): Promise<void> => {
    if (!isNative) return;
    const map: Record<StatusBarStyleType, Style> = {
      dark: Style.Dark,
      light: Style.Light,
      default: Style.Default
    };
    await StatusBar.setStyle({ style: map[style] });
  };

  /**
   * 设置是否沉浸式（状态栏叠加在内容上、透明）
   * @param overlay true=内容顶到屏幕最上（易滚动穿透），false=状态栏独立占位（推荐）
   */
  const setOverlay = async (overlay: boolean): Promise<void> => {
    if (!isNative) return;
    await StatusBar.setOverlaysWebView({ overlay });
  };

  /**
   * 一次设置背景色与样式（非沉浸式时背景色才可见）
   * @param options.color 背景色，如 '#1b2132'
   * @param options.style 图标样式，默认 'dark'
   * @param options.overlay 默认 false（与全局一致）；true 时易出现滚动穿透
   */
  const setStatusBar = async (options: {
    color: string;
    style?: StatusBarStyleType;
    overlay?: boolean;
  }): Promise<void> => {
    if (!isNative) return;
    const { color, style = 'dark', overlay = false } = options; // overlay 默认 false，避免透明穿透
    await setOverlay(overlay);
    await setBackgroundColor(color);
    await setStyle(style);
  };

  return {
    isApp,
    setBackgroundColor,
    setStyle,
    setOverlay,
    setStatusBar
  };
};
