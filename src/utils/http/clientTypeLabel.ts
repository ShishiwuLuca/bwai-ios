import { Capacitor } from '@capacitor/core';
import { getOSNameModern } from '/@/utils';

/** normalizeApiPlatformName */
export const normalizeApiPlatformName = (raw: string | null | undefined): string => {
  const t = String(raw ?? '').trim();
  if (!t) return '';
  const low = t.toLowerCase();
  if (low === 'android') return 'Android';
  if (low === 'ios') return 'iOS';
  return t;
};

/** 拉取接口数据：getRequestClientTypeLabel */
export const getRequestClientTypeLabel = (): string => {
  if (Capacitor.isNativePlatform()) {
    const slug = Capacitor.getPlatform();
    const normalized = normalizeApiPlatformName(slug);
    if (normalized === 'Android' || normalized === 'iOS') return normalized;
    return slug ? slug.charAt(0).toUpperCase() + slug.slice(1).toLowerCase() : 'Unknown';
  }
  return getOSNameModern();
};
