import { Device } from '@capacitor/device';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { getAppEnvConfig } from '/@/utils/env';

/** 是否运行在原生 APP 环境（Capacitor Android/iOS） */
export const isNative = Capacitor.isNativePlatform();

/** getResourcePackageVersion */
export const getResourcePackageVersion = (): string => {
  const v = getAppEnvConfig().VITE_GLOB_SYSTEM_VERSION;
  return typeof v === 'string' ? v.trim() : '';
};

/** 当前系统平台 */
export type Platform = 'android' | 'ios' | 'web';

/** APP 端设备与系统信息（仅原生有值，Web 返回空对象或默认值） */
export interface DeviceSystemInfo {
  /** 操作系统版本，如 "14"、"17.2.1" */
  osVersion: string;
  /** 手机厂商，如 "Samsung"、"Apple"、"Huawei" */
  manufacturer: string;
  /** 设备型号，如 "SM-G9980"、"iPhone14,2" */
  model: string;
  /** 系统 / UI 版本：Android 为 API 等级（如 "34"），iOS 与 osVersion 一致 */
  systemUIVersion: string;
  /** Android 专属：SDK/API 等级 */
  androidApiLevel?: number;
  /** WebView 内核版本 */
  webViewVersion: string;
}

/** useAppInfo */
export const useAppInfo = () => {
  /** 是否为原生环境 */
  const isApp = isNative;

  /**
   * 获取当前系统平台
   * @returns 'android' | 'ios' | 'web'
   */
  const getPlatform = (): Platform => {
    return Capacitor.getPlatform() as Platform;
  };

  /**
   * 获取 APP 版本号（原生安装包版本）
   * - 原生环境：返回 Android versionName / iOS CFBundleShortVersionString 及 Android versionCode
   * - Web 环境：返回 undefined
   */
  const getAppVersion = async (): Promise<
    | {
        versionName: string;
        versionCode?: string;
      }
    | undefined
  > => {
    if (!isNative) return undefined;
    try {
      const info = await App.getInfo();
      return {
        versionName: (info.version ?? '').trim(),
        versionCode: (info.build ?? '').trim()
      };
    } catch {
      return undefined;
    }
  };

  /**
   * 获取资源版本号（前端 / Web 包版本）
   * - 来源：.env 的 `VITE_GLOB_SYSTEM_VERSION`（见 {@link getResourcePackageVersion}）
   */
  const getResourceVersion = (): string => {
    return getResourcePackageVersion();
  };

  /**
   * 获取 APP 端操作系统版本、手机厂商、系统 UI 版本等
   * - 原生环境：返回 Device 插件提供的 osVersion、manufacturer、model、androidSDKVersion、webViewVersion
   * - Web 环境：返回空字符串字段
   */
  const getDeviceSystemInfo = async (): Promise<DeviceSystemInfo> => {
    const empty: DeviceSystemInfo = {
      osVersion: '',
      manufacturer: '',
      model: '',
      systemUIVersion: '',
      webViewVersion: ''
    };
    if (!isNative) return empty;
    try {
      const info = await Device.getInfo();
      const androidApiLevel = info.androidSDKVersion;
      const systemUIVersion =
        androidApiLevel != null ? String(androidApiLevel) : (info.osVersion ?? '');
      return {
        osVersion: info.osVersion ?? '',
        manufacturer: info.manufacturer ?? '',
        model: info.model ?? '',
        systemUIVersion,
        androidApiLevel,
        webViewVersion: info.webViewVersion ?? ''
      };
    } catch {
      return empty;
    }
  };

  return {
    isApp,
    getPlatform,
    getAppVersion,
    getResourceVersion,
    getDeviceSystemInfo
  };
};
