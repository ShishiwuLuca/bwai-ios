/**
 * 客户端环境 Hooks：网络类型、时区、语言
 * - 在 APP 端（Capacitor）使用原生能力获取，非 APP 则从浏览器 API 获取
 */
import { ref, onMounted } from 'vue';
import { Capacitor } from '@capacitor/core';

/** 是否为原生环境 */
const isNative = Capacitor.isNativePlatform();

/** 网络类型：2G/3G/4G/5G/WiFi 等 */
export type NetworkType = '2G' | '3G' | '4G' | '5G' | 'WiFi' | 'Cellular' | 'none' | 'unknown';

/** 浏览器 Network Information API（部分浏览器支持） */
interface NetworkInformation {
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g' | '5g';
  type?: string;
}
declare global {
  interface Navigator {
    connection?: NetworkInformation;
    mozConnection?: NetworkInformation;
    webkitConnection?: NetworkInformation;
  }
}

/** getBrowserConnection */
const getBrowserConnection = (): NetworkInformation | undefined => {
  return navigator.connection ?? navigator.mozConnection ?? navigator.webkitConnection;
};

/** 拉取接口数据：fetchNetworkType */
const fetchNetworkType =
  // 获取网络类型
  async (): Promise<NetworkType> => {
    if (isNative) {
      try {
        interface NetworkPlugin {
          Network: {
            getStatus(): Promise<{
              connected: boolean;
              connectionType: string;
            }>;
          };
        }
        const moduleId = '@capacitor/network';
        const mod = (await import(/* @vite-ignore */ moduleId).catch(
          () => null
        )) as Promise<NetworkPlugin | null>;
        const plugin = (await mod)?.Network;
        if (!plugin) return 'unknown';
        const status = await plugin.getStatus();
        if (!status.connected) return 'none';
        const t = status.connectionType?.toLowerCase();
        if (t === 'wifi') return 'WiFi';
        if (t === 'cellular') return 'Cellular';
        if (t === 'none') return 'none';
        return 'unknown';
      } catch {
        return 'unknown';
      }
    }
    const conn = getBrowserConnection();
    if (!conn) return 'unknown';
    const type = (conn.type ?? '').toLowerCase();
    const effectiveType = conn.effectiveType ?? '';
    if (type === 'wifi' || type === 'ethernet' || type === 'wimax') return 'WiFi';
    if (type === 'none') return 'none';
    if (type === 'cellular' || effectiveType) {
      if (effectiveType === '5g') return '5G';
      if (effectiveType === '4g') return '4G';
      if (effectiveType === '3g') return '3G';
      if (effectiveType === '2g' || effectiveType === 'slow-2g') return '2G';
      return 'Cellular';
    }
    return 'unknown';
  };

/** resolveTimezone */
const resolveTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
  } catch {
    const offset = -new Date().getTimezoneOffset();
    const h = Math.floor(Math.abs(offset) / 60);
    const m = Math.abs(offset) % 60;
    const sign = offset >= 0 ? '+' : '-';
    return `UTC${sign}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
};

/** resolveLanguage */
const resolveLanguage = (): string => {
  if (typeof navigator === 'undefined') return '';
  return navigator.language ?? navigator.languages?.[0] ?? '';
};

/** 环境变量：useDeviceEnv */
export const useDeviceEnv = () => {
  const networkType = ref<NetworkType>('unknown');
  const timezone = ref(resolveTimezone());
  const language = ref(resolveLanguage());

  const refreshNetworkType = async () => {
    networkType.value = await fetchNetworkType();
  };

  onMounted(() => {
    refreshNetworkType();
  });
  return {
    networkType,
    timezone,
    language,
    refreshNetworkType
  };
};
