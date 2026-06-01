/**
 * 请求头 vendor / model：
 * - APP：@capacitor/device + iOS 硬件标识映射市场名 + 厂商名规范化
 * - H5：**优先根据浏览器 UA 推断厂商**（如 iPhone → Apple），再用 Client Hints 补 model / Android 厂商
 */
import { Capacitor } from '@capacitor/core';
import { Device, type DeviceInfo } from '@capacitor/device';
import { getAppleHardwareMarketingName } from '/@/constants/appleHardwareMarketingNames';
import { normalizeOemVendorName } from '/@/utils/deviceOemNormalizer';

/** VendorModel：接口数据结构定义 */
export interface VendorModel {
  vendor: string;
  model: string;
}

/** resolveNativeVendorModel */
export const resolveNativeVendorModel = (info: DeviceInfo | null): VendorModel => {
  if (!info) return { vendor: '', model: '' };
  const platform = info.platform;
  const os = info.operatingSystem;
  const rawModel = (info.model ?? '').trim();
  const rawManufacturer = (info.manufacturer ?? '').trim();
  const deviceName = (info.name ?? '').trim();
  if (platform === 'ios' || os === 'ios') {
    const marketing = getAppleHardwareMarketingName(rawModel);
    const model = marketing || rawModel || deviceName;
    return { vendor: 'Apple', model };
  }
  if (platform === 'android' || os === 'android') {
    const vendor = normalizeOemVendorName(rawManufacturer);
    let model = rawModel;
    if (!model && deviceName) model = deviceName;
    return { vendor, model };
  }
  return {
    vendor: normalizeOemVendorName(rawManufacturer),
    model: rawModel || deviceName
  };
};

/** webVendorModelCache */
let webVendorModelCache: VendorModel | null = null;

/** webVendorModelInflight */
let webVendorModelInflight: Promise<VendorModel> | null = null;

/** SKIP_UA_BRAND */
const SKIP_UA_BRAND =
  /chromium|microsoft edge|google chrome|edg|edgios|opr|opera|firefox|safari|version|webkit|android webview|samsungbrowser|miuibrowser|qqbrowser|ucbrowser|^google$/i;

/** Tab 状态：isNotABrandPlaceholder */
const isNotABrandPlaceholder = (brand: string): boolean => {
  const compact = brand.toLowerCase().replace(/[^a-z]/g, '');
  return compact === 'notabrand';
};

/** shouldSkipClientHintBrand */
const shouldSkipClientHintBrand = (brand: string): boolean => {
  const b = brand.trim();
  if (!b) return true;
  if (isNotABrandPlaceholder(b)) return true;
  return SKIP_UA_BRAND.test(b);
};

/** parseAndroidUaModel */
const parseAndroidUaModel = (ua: string): string => {
  const m = ua.match(/Android\s+[\d.]+;\s*([^)]+?)(?:\s+Build|\))/i);
  if (!m?.[1]) return '';
  const s = m[1].trim();
  if (/^linux armv/i.test(s)) return '';
  if (/^[a-z]{2}(-[a-z]{2})?$/i.test(s)) return '';
  return s.replace(/\s*Build\/.*$/i, '').trim();
};

/** guessIosWebModel */
const guessIosWebModel = (ua: string): string => {
  if (/iPad/.test(ua)) return 'iPad';
  if (/iPhone/.test(ua)) return 'iPhone';
  if (/iPod/.test(ua)) return 'iPod touch';
  return '';
};

/** 用户：inferDeviceVendorFromUserAgent */
export const inferDeviceVendorFromUserAgent = (ua: string): string => {
  const s = ua.trim();
  if (!s) return '';
  // Apple：iPhone / iPad / iPod / iOS WebView（含 CPU iPhone OS、iPadOS 的 like Mac OS X）
  if (
    /iPhone|iPad|iPod/i.test(s) ||
    /CPU iPhone OS/i.test(s) ||
    /CPU OS [\d_]+ like Mac OS X/i.test(s)
  ) {
    return 'Apple';
  }
  // macOS 桌面
  if (/Macintosh|Mac OS X/i.test(s)) return 'Apple';
  if (/Windows NT/i.test(s)) return 'Microsoft';
  // Android 生态：部分 UA 含品牌关键字（无则留给 Client Hints）
  if (/Android/i.test(s)) {
    if (/\bSamsung\b|SamsungBrowser|SM-[A-Z0-9]{2,}/i.test(s)) return 'Samsung';
    if (/\bHuawei\b|HUAWEI|HarmonyOS/i.test(s)) return 'Huawei';
    if (/\bHONOR\b|\bHonor\b/i.test(s)) return 'HONOR';
    if (/\bXiaomi\b|Redmi|POCO|MIX/i.test(s)) return 'Xiaomi';
    if (/\bOPPO\b/i.test(s)) return 'OPPO';
    if (/\bOnePlus\b/i.test(s)) return 'OnePlus';
    if (/\bvivo\b/i.test(s)) return 'vivo';
    if (/\brealme\b/i.test(s)) return 'realme';
    if (/\bMotorola\b|\bmoto\b/i.test(s)) return 'Motorola';
    if (/\bSony\b/i.test(s)) return 'Sony';
    if (/\bLG\b|LG-|\bLGE\b/i.test(s)) return 'LG';
    if (/\bGoogle\b|Pixel/i.test(s)) return 'Google';
  }
  return '';
};

/** Tab 状态：pickVendorFromUserAgentDataBrands */
const pickVendorFromUserAgentDataBrands = (
  brands:
    | Array<{
        brand: string;
        version: string;
      }>
    | undefined
): string => {
  if (!brands?.length) return '';
  for (const { brand } of brands) {
    const b = brand?.trim();
    if (!b || shouldSkipClientHintBrand(b)) continue;
    return normalizeOemVendorName(b);
  }
  return '';
};

/** sanitizeWebVendor */
const sanitizeWebVendor = (v: string): string => {
  const t = v.trim();
  if (!t) return '';
  if (isNotABrandPlaceholder(t)) return '';
  if (/^(android|windows|macos|linux|ios)$/i.test(t)) return '';
  return t;
};

/** 拉取接口数据（fetchWebVendorModel） */
const fetchWebVendorModel = async (): Promise<VendorModel> => {
  if (typeof navigator === 'undefined') {
    return { vendor: '', model: '' };
  }
  const ua = navigator.userAgent ?? '';
  // 厂商：UA 优先（iPhone → Apple 等），再考虑 Client Hints（多为 Android OEM）
  let vendor = inferDeviceVendorFromUserAgent(ua);
  let model = '';
  type UAD = {
    brands?: {
      brand: string;
      version: string;
    }[];
    mobile?: boolean;
    platform?: string;
    getHighEntropyValues?: (hints: string[]) => Promise<Record<string, unknown>>;
  };
  const uad = (
    navigator as Navigator & {
      userAgentData?: UAD;
    }
  ).userAgentData;
  if (uad?.getHighEntropyValues) {
    try {
      const hi = await uad.getHighEntropyValues(['model', 'platform']);
      const m = hi.model;
      if (typeof m === 'string' && m.trim()) model = m.trim();
      if (!vendor && typeof hi.platform === 'string' && hi.platform.trim()) {
        const p = hi.platform.trim();
        if (/^windows/i.test(p)) vendor = 'Microsoft';
        else if (/mac/i.test(p)) vendor = 'Apple';
        else if (!/^android$/i.test(p) && !isNotABrandPlaceholder(p)) {
          vendor = normalizeOemVendorName(p);
        }
      }
    } catch {
      /* Client Hints 可能不可用 */
    }
  }
  if (!vendor && uad?.brands?.length) {
    vendor = pickVendorFromUserAgentDataBrands(uad.brands);
  }
  if (!vendor && uad?.platform) {
    const p = uad.platform.trim();
    if (/^windows/i.test(p)) vendor = 'Microsoft';
    else if (/mac/i.test(p)) vendor = 'Apple';
    else if (!/^android$/i.test(p) && !isNotABrandPlaceholder(p)) {
      vendor = normalizeOemVendorName(p);
    }
  }
  // 型号与厂商兜底（与 UA 推断一致）
  if (
    /iPhone|iPad|iPod/i.test(ua) ||
    /CPU iPhone OS/i.test(ua) ||
    /CPU OS [\d_]+ like Mac OS X/i.test(ua)
  ) {
    vendor = 'Apple';
    if (!model) model = guessIosWebModel(ua);
  } else if (/Android/i.test(ua)) {
    if (!model) model = parseAndroidUaModel(ua);
    if (!vendor) vendor = pickVendorFromUserAgentDataBrands(uad?.brands);
  } else if (/Windows NT/i.test(ua)) {
    if (!vendor) vendor = 'Microsoft';
  } else if (/Mac OS X|Macintosh/i.test(ua)) {
    if (!vendor) vendor = 'Apple';
    if (!model) model = 'Mac';
  }
  vendor = sanitizeWebVendor(vendor);
  return { vendor, model };
};

/** 方法：getWebVendorModelCached */
export const getWebVendorModelCached = async (): Promise<VendorModel> => {
  // 升级后丢弃历史上误缓存的 Chromium 占位品牌
  if (webVendorModelCache && isNotABrandPlaceholder(webVendorModelCache.vendor)) {
    webVendorModelCache = null;
  }
  if (webVendorModelCache) return webVendorModelCache;
  if (!webVendorModelInflight) {
    webVendorModelInflight = fetchWebVendorModel()
      .then((r) => {
        webVendorModelCache = r;
        return r;
      })
      .finally(() => {
        webVendorModelInflight = null;
      });
  }
  return webVendorModelInflight;
};

/** 拉取接口数据（resolveRequestVendorModel） */
export const resolveRequestVendorModel = async (
  nativeSnap: VendorModel | null
): Promise<VendorModel> => {
  if (Capacitor.isNativePlatform()) {
    if (nativeSnap !== null) {
      return {
        vendor: nativeSnap.vendor,
        model: nativeSnap.model
      };
    }
    try {
      const info = await Device.getInfo();
      return resolveNativeVendorModel(info);
    } catch {
      return { vendor: '', model: '' };
    }
  }
  return getWebVendorModelCached();
};
