/**
 * 从浏览器 / WebView 的 Network Information API 解析网络展示文案（与网页端 useNetworkType 一致）
 */
/** Network Information API 子集（不依赖 lib.dom 中的 NetworkInformation 名称） */
interface NavigatorNetworkConnection {
  type?: string;
  effectiveType?: string;
  downlinkMax?: number;
}

/** getNavigatorConnection */
const getNavigatorConnection = (): NavigatorNetworkConnection | undefined => {
  if (typeof navigator === 'undefined') return undefined;
  return (
    (
      navigator as Navigator & {
        connection?: NavigatorNetworkConnection;
      }
    ).connection ??
    (
      navigator as Navigator & {
        mozConnection?: NavigatorNetworkConnection;
      }
    ).mozConnection ??
    (
      navigator as Navigator & {
        webkitConnection?: NavigatorNetworkConnection;
      }
    ).webkitConnection
  );
};

/** getNavigatorNetworkTypeLabel */
export const getNavigatorNetworkTypeLabel = (): string => {
  const connection = getNavigatorConnection();
  if (connection) {
    const type = connection.type;
    const effectiveType = connection.effectiveType;
    if (type === 'wifi') return 'WiFi';
    if (type === 'ethernet') return 'WiFi';
    if (type === 'cellular') {
      if (effectiveType === '5g') return '5G';
      if (effectiveType === '4g') return '4G';
      if (effectiveType === '3g') return '3G';
      if (effectiveType === '2g' || effectiveType === 'slow-2g') return '2G';
      return '5G';
    }
    if (effectiveType) {
      switch (effectiveType) {
        case '5g':
          return '5G';
        case '4g':
          return '4G';
        case '3g':
          return '3G';
        case '2g':
        case 'slow-2g':
          return '2G';
        case 'wifi':
          return 'WiFi';
      }
    }
    return 'Unknown';
  }
  if (typeof navigator === 'undefined') return 'Unknown';
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'WiFi';
  if (/android/.test(ua)) return '5G';
  if (/macintosh/.test(ua)) return 'WiFi';
  if (/windows/.test(ua)) return 'WiFi';
  return 'Unknown';
};

/** 事件或回调处理：getNavigatorCellularGenerationLabel */
export const getNavigatorCellularGenerationLabel = (): string | null => {
  const connection = getNavigatorConnection();
  if (!connection) return null;
  const type = (connection.type ?? '').toLowerCase();
  const effectiveType = (connection.effectiveType ?? '').toLowerCase();
  if (type === 'wifi' || type === 'ethernet' || effectiveType === 'wifi') return null;
  if (type === 'cellular' || effectiveType) {
    if (effectiveType === '5g') return '5G';
    if (effectiveType === '4g') return '4G';
    if (effectiveType === '3g') return '3G';
    if (effectiveType === '2g' || effectiveType === 'slow-2g') return '2G';
  }
  // 部分 Android WebView：仅有 downlinkMax（Mbps）可参考
  if (type === 'cellular') {
    const dm = connection.downlinkMax;
    if (typeof dm === 'number' && dm > 0) {
      if (dm >= 100) return '5G';
      if (dm >= 10) return '4G';
    }
  }
  return null;
};
