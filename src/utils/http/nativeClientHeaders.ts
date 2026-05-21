/**
 * 原生 APP（Capacitor）请求头字段：从 App / Device / Network 插件读取并缓存，
 * 供 axios 请求拦截器使用（避免每个请求重复 await）。
 */
import { App } from '@capacitor/app';
import { Device } from '@capacitor/device';
import { Capacitor } from '@capacitor/core';
import {
  getNavigatorCellularGenerationLabel,
  getNavigatorNetworkTypeLabel
} from '/@/utils/networkType';
import { getRequestClientTypeLabel, normalizeApiPlatformName } from '/@/utils/http/clientTypeLabel';
import { resolveNativeVendorModel } from '/@/utils/deviceVendorModel';

/** NativeRequestHeaderFields：接口数据结构定义（拉取接口数据） */
export interface NativeRequestHeaderFields {
  client: string;
  network: string;
  clienttype: string;
  platform: string;
  os: string;
  osversion: string;
  version: string;
  PackageVersion: string;
  /** 设备生产厂商（Device.manufacturer） */
  vendor: string;
  /** 设备型号（Device.model） */
  model: string;
}

/** cached */
let cached: NativeRequestHeaderFields | null = null;

/** inflight */
let inflight: Promise<void> | null = null;

/** 拉取接口数据：fetchNativeNetworkLabel */
const fetchNativeNetworkLabel =
  /**
   * APP 端网络展示：WiFi / 2G–5G 等。
   * - 先用 @capacitor/network 区分 WiFi、蜂窝、离线；
   * - 蜂窝时再读 WebView 的 Network Information（与 H5 同源逻辑）解析 4G/5G；
   * - 无代际信息时（常见于部分 iOS WebView）返回 Cellular。
   */
  async (): Promise<string> => {
    try {
      const { Network } = await import(/* @vite-ignore */ '@capacitor/network');
      const status = await Network.getStatus();
      if (!status.connected) return 'none';
      const t = status.connectionType?.toLowerCase();
      if (t === 'none') return 'none';
      if (t === 'wifi') return 'WiFi';
      if (t === 'ethernet') return 'WiFi';
      if (t === 'cellular') {
        const generation = getNavigatorCellularGenerationLabel();
        if (generation) return generation;
        return 'Cellular';
      }
      // unknown：用 WebView 能力兜底（与网页 getNavigatorNetworkTypeLabel 一致）
      return getNavigatorNetworkTypeLabel();
    } catch {
      return getNavigatorNetworkTypeLabel();
    }
  };

/** 拉取接口数据：loadNativeHeaders */
const loadNativeHeaders =
  /** @param globSystemVersion 来自 .env 的 VITE_GLOB_SYSTEM_VERSION，用于请求头 version */
  async (globSystemVersion: string): Promise<void> => {
    const [appInfo, devInfo, network] = await Promise.all([
      App.getInfo().catch(() => null),
      Device.getInfo().catch(() => null),
      fetchNativeNetworkLabel()
    ]);
    const capPlatform = Capacitor.getPlatform();
    const normalizedPlatform = normalizeApiPlatformName(capPlatform);
    const osLabel =
      normalizedPlatform === 'Android' || normalizedPlatform === 'iOS'
        ? normalizedPlatform
        : capPlatform
          ? capPlatform.charAt(0).toUpperCase() + capPlatform.slice(1).toLowerCase()
          : '';
    const appVersion = (appInfo?.version ?? '').trim();
    const appBuild = (appInfo?.build ?? '').trim();
    const { vendor: headerVendor, model: headerModel } = resolveNativeVendorModel(devInfo);
    cached = {
      /** 请求头 client：原生固定为 App（与 axios 一致） */
      client: 'App',
      network,
      /** 请求头 clienttype：与 getRequestClientTypeLabel 一致，仅平台名 */
      clienttype: getRequestClientTypeLabel(),
      platform: osLabel,
      os: osLabel,
      osversion: (devInfo?.osVersion ?? '').trim(),
      /** 与 H5 一致：请求头 version 使用 .env 中 VITE_GLOB_SYSTEM_VERSION */
      version: globSystemVersion,
      /** 安装包对外版本号（Android versionName / iOS CFBundleShortVersionString，如 1.0.1） */
      PackageVersion: appVersion || appBuild || globSystemVersion,
      vendor: headerVendor,
      model: headerModel
    };
  };

/** 拉取接口数据（ensureNativeRequestHeaders） */
export const ensureNativeRequestHeaders = async (globSystemVersion: string): Promise<void> => {
  if (!Capacitor.isNativePlatform()) return;
  if (cached) return;
  if (!inflight) {
    inflight = loadNativeHeaders(globSystemVersion).finally(() => {
      inflight = null;
    });
  }
  await inflight;
};

/** 拉取接口数据：getNativeRequestHeadersSnapshot */
export const getNativeRequestHeadersSnapshot = (): NativeRequestHeaderFields | null => {
  return cached;
};

/** getNativeNetworkLabelForApi */
export const getNativeNetworkLabelForApi = (): Promise<string> => {
  return fetchNativeNetworkLabel();
};
