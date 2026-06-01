/**
 * APP 端调用浏览器打开网页 & 唤起其他 APP
 * - 在 APP 内使用 Capacitor Browser / App Launcher，非 APP 时使用浏览器 window.open / location
 */
import { NewOpenWindow } from '/@/utils';
import { Capacitor } from '@capacitor/core';

/** isNative */
const isNative = Capacitor.isNativePlatform();

/** 打开网页时的可选配置（APP 端部分生效） */
export interface OpenInBrowserOptions {
  /** 工具栏颜色，如 '#ffffff'（iOS/Android 内嵌浏览器） */
  toolbarColor?: string;
  /** iOS：展示样式，'fullscreen' | 'popover' */
  presentationStyle?: 'fullscreen' | 'popover';
}

/** 方法：openInBrowser */
export const openInBrowser = async (url: string, options?: OpenInBrowserOptions): Promise<void> => {
  const normalized = url.trim();
  if (!normalized) return;
  if (isNative) {
    try {
      interface BrowserPlugin {
        open(options: {
          url: string;
          toolbarColor?: string;
          presentationStyle?: string;
        }): Promise<void>;
      }
      const moduleId = '@capacitor/browser';
      const mod = (await import(/* @vite-ignore */ moduleId).catch(() => null)) as Promise<{
        Browser: BrowserPlugin;
      } | null>;
      const plugin = (await mod)?.Browser;
      if (!plugin) {
        NewOpenWindow(normalized);
        return;
      }
      await plugin.open({
        url: normalized,
        toolbarColor: options?.toolbarColor,
        presentationStyle: options?.presentationStyle
      });
    } catch {
      NewOpenWindow(normalized);
    }
    return;
  }
  window.open(normalized, '_blank', 'noopener,noreferrer');
};

/** 方法：launchApp */
export const launchApp = async (
  url: string
): Promise<{
  completed: boolean;
}> => {
  const normalized = url.trim();
  if (!normalized) return { completed: false };
  if (isNative) {
    try {
      interface AppLauncherPlugin {
        openUrl(options: { url: string }): Promise<{
          completed: boolean;
        }>;
      }
      const moduleId = '@capacitor/app-launcher';
      const mod = (await import(/* @vite-ignore */ moduleId).catch(() => null)) as Promise<{
        AppLauncher: AppLauncherPlugin;
      } | null>;
      const plugin = (await mod)?.AppLauncher;
      if (!plugin) {
        NewOpenWindow(normalized);
        return { completed: true };
      }
      return await plugin.openUrl({ url: normalized });
    } catch {
      NewOpenWindow(normalized);
      return { completed: true };
    }
  }
  NewOpenWindow(normalized);
  return { completed: true };
};

/** 是否允许某操作（canOpenUrl） */
export const canOpenUrl = async (url: string): Promise<boolean> => {
  const normalized = url.trim();
  if (!normalized) return false;
  if (isNative) {
    try {
      interface AppLauncherPlugin {
        canOpenUrl(options: { url: string }): Promise<{
          value: boolean;
        }>;
      }
      const moduleId = '@capacitor/app-launcher';
      const mod = (await import(/* @vite-ignore */ moduleId).catch(() => null)) as Promise<{
        AppLauncher: AppLauncherPlugin;
      } | null>;
      const plugin = (await mod)?.AppLauncher;
      if (!plugin) return isHttpOrHttps(normalized);
      const { value } = await plugin.canOpenUrl({ url: normalized });
      return value;
    } catch {
      return isHttpOrHttps(normalized);
    }
  }
  return isHttpOrHttps(normalized);
};

/** isHttpOrHttps */
const isHttpOrHttps = (u: string): boolean => {
  return /^https?:\/\//i.test(u);
};

/** useAppLauncher */
export const useAppLauncher = () => {
  return {
    isNative,
    openInBrowser,
    launchApp,
    canOpenUrl
  };
};
