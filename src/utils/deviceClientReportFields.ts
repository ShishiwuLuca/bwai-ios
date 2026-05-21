/**
 * 启动日志 / 版本检测 / HTTP 请求头共用的设备上报字段（厂商、型号、定制 UI 名与版本）。
 * 原生 Android 的 UI 层通过 BWAIAppControl.getDeviceRomLayer 读取；其余环境 JS 兜底。
 */
import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';
import { BWAIAppControl } from '/@/plugins/BwaiAppControl';
import { normalizeApiPlatformName } from '/@/utils/http/clientTypeLabel';
import { getWebVendorModelCached, resolveNativeVendorModel } from '/@/utils/deviceVendorModel';

/** DeviceClientReportFields：接口数据结构定义 */
export interface DeviceClientReportFields {
  vendor_name: string;
  device_name: string;
  system_ui_name: string;
  ui_version: string;
}

/** 常量或静态配置：EMPTY */
const EMPTY: DeviceClientReportFields = {
  vendor_name: '',
  device_name: '',
  system_ui_name: '',
  ui_version: ''
};

/** cached */
let cached: DeviceClientReportFields | null = null;

/** inflight */
let inflight: Promise<DeviceClientReportFields> | null = null;

/** parseHarmonyFromUa */
const parseHarmonyFromUa = (
  ua: string
): {
  system_ui_name: string;
  ui_version: string;
} => {
  const m = ua.match(/HarmonyOS\s*([\d.]+)?/i);
  if (!m) return { system_ui_name: '', ui_version: '' };
  return { system_ui_name: 'HarmonyOS', ui_version: (m[1] ?? '').trim() };
};

/** 拉取接口数据（load） */
const load = async (): Promise<DeviceClientReportFields> => {
  if (!Capacitor.isNativePlatform()) {
    const vm = await getWebVendorModelCached();
    let system_ui_name = '';
    let ui_version = '';
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent || '';
      const h = parseHarmonyFromUa(ua);
      if (h.system_ui_name) {
        system_ui_name = h.system_ui_name;
        ui_version = h.ui_version;
      }
    }
    cached = {
      vendor_name: vm.vendor,
      device_name: vm.model,
      system_ui_name,
      ui_version
    };
    return cached;
  }
  const devInfo = await Device.getInfo().catch(() => null);
  const { vendor, model } = resolveNativeVendorModel(devInfo);
  let system_ui_name = '';
  let ui_version = '';
  if (Capacitor.getPlatform() === 'ios') {
    system_ui_name = 'iOS';
    ui_version = (devInfo?.osVersion ?? '').trim();
  } else if (Capacitor.getPlatform() === 'android') {
    try {
      const rom = await BWAIAppControl.getDeviceRomLayer();
      const rawUi = String(rom?.system_ui_name ?? '').trim();
      system_ui_name = rawUi ? normalizeApiPlatformName(rawUi) : '';
      ui_version = String(rom?.ui_version ?? '').trim();
    } catch {
      /* 无原生实现或非 Android */
    }
  }
  cached = {
    vendor_name: vendor,
    device_name: model,
    system_ui_name,
    ui_version
  };
  return cached;
};

/** 方法：ensureDeviceClientReportFields */
export const ensureDeviceClientReportFields = async (): Promise<DeviceClientReportFields> => {
  if (cached) return cached;
  if (!inflight) {
    inflight = load().finally(() => {
      inflight = null;
    });
  }
  return inflight;
};

/** getDeviceClientReportFieldsSync */
export const getDeviceClientReportFieldsSync = (): DeviceClientReportFields => {
  return cached ?? { ...EMPTY };
};

/** hasDeviceClientReportFieldsCache */
export const hasDeviceClientReportFieldsCache = (): boolean => {
  return cached != null;
};
