/**
 * axios 请求中与客户端环境相关的通用头（client / network / platform / vendor 等）
 */
import { Capacitor } from '@capacitor/core';
import { ThisZoneCode } from '/@/utils/TimeZone';
import { getOSNameModern, getOSVersion } from '/@/utils';
import { getRequestClientTypeLabel } from '/@/utils/http/clientTypeLabel';
import {
  ensureNativeRequestHeaders,
  getNativeRequestHeadersSnapshot
} from '/@/utils/http/nativeClientHeaders';
import { resolveRequestVendorModel } from '/@/utils/deviceVendorModel';
import { getDeviceCountryCode } from '/@/utils/deviceCountryCode';
import { getClientDeviceIdAsync } from '/@/utils/clientDeviceId';

/** 与后端约定的客户端追踪请求头字段 */
export interface HttpClientTraceHeaders {
  client: string;
  network: string;
  clienttype: string;
  platform: string;
  timezone: string;
  os: string;
  osversion: string;
  device: string;
  version: string;
  PackageVersion: string;
  vendor: string;
  model: string;
  /** ISO 3166-1 alpha-2，如 CN（来自系统区域/语言，非 GPS） */
  country: string;
}

/** BuildHttpClientTraceHeadersParams：接口数据结构定义 */
export interface BuildHttpClientTraceHeadersParams {
  /** 网页端初始网络类型（useNetworkType） */
  webNetworkType: string;
  /** .env VITE_GLOB_SYSTEM_VERSION */
  globSystemVersion: string;
}

/** 方法：buildHttpClientTraceHeaders */
export const buildHttpClientTraceHeaders = async (
  params: BuildHttpClientTraceHeadersParams
): Promise<HttpClientTraceHeaders> => {
  const { webNetworkType, globSystemVersion } = params;
  const traceDeviceId = await getClientDeviceIdAsync();
  let platformOsName = getOSNameModern();
  let systemVersion = getOSVersion();
  const headerClient = Capacitor.isNativePlatform() ? 'App' : 'H5';
  let headerNetwork = webNetworkType;
  let headerClientType = getRequestClientTypeLabel();
  const headerVersion = globSystemVersion;
  let headerPackageVersion = globSystemVersion;
  let nativeSnapForVendor: {
    vendor: string;
    model: string;
  } | null = null;
  if (Capacitor.isNativePlatform()) {
    try {
      await ensureNativeRequestHeaders(globSystemVersion);
      const snap = getNativeRequestHeadersSnapshot();
      if (snap) {
        headerNetwork = snap.network;
        headerClientType = snap.clienttype;
        platformOsName = snap.platform;
        systemVersion = snap.osversion;
        headerPackageVersion = snap.PackageVersion;
        nativeSnapForVendor = { vendor: snap.vendor, model: snap.model };
      }
    } catch {
      /* 插件异常时回退 Web 逻辑 */
    }
  }
  const { vendor: headerVendor, model: headerModel } = await resolveRequestVendorModel(
    Capacitor.isNativePlatform() ? nativeSnapForVendor : null
  );
  const headerCountry = getDeviceCountryCode();
  return {
    // 请求头 client：原生固定 App，网页固定 H5
    client: headerClient,
    // 请求头 network：与 getNavigatorNetworkTypeLabel 一致，仅网络类型
    network: headerNetwork,
    // 请求头 clienttype：与 getRequestClientTypeLabel 一致，仅平台名
    clienttype: headerClientType,
    // 请求头 platform：与 getOSNameModern 一致，仅系统/平台名称
    platform: platformOsName,
    // 请求头 timezone：与 ThisZoneCode 一致，仅时区代码
    timezone: ThisZoneCode,
    // 请求头 os：与 getOSNameModern 一致，仅系统/平台名称
    os: platformOsName,
    // 请求头 osversion：与 getOSVersion 一致，仅系统/平台版本
    osversion: systemVersion,
    // 请求头 device：原生 Device.getId；H5 为 IDB+localStorage 持久化 UUID
    device: traceDeviceId,
    // 请求头 version：与 globSystemVersion 一致，仅系统版本
    version: headerVersion,
    // 请求头 PackageVersion：与 globSystemVersion 一致，仅系统版本
    PackageVersion: headerPackageVersion,
    // 请求头 vendor：与 resolveRequestVendorModel 一致，仅设备生产厂商
    vendor: headerVendor,
    // 请求头 model：与 resolveRequestVendorModel 一致，仅设备型号
    model: headerModel,
    // 请求头 country：系统区域/语言推断的 ISO 3166-1 alpha-2（如 CN）
    country: headerCountry
  };
};
