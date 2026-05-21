/** 事件或回调处理：parseRegionFromBcp47 */
const parseRegionFromBcp47 = (locale: string): string => {
  const tag = locale.trim().replace(/_/g, '-');
  if (!tag) return '';
  const parts = tag.split('-').filter(Boolean);
  // 从右向左找首个 2 位字母段（地区）；跳过 4 位 script（如 Hans）
  for (let i = parts.length - 1; i >= 0; i--) {
    const s = parts[i];
    if (/^[A-Za-z]{2}$/.test(s)) {
      if (i === 0 && parts.length === 1) return '';
      return s.toUpperCase();
    }
  }
  return '';
};

/** getDeviceCountryCode */
export const getDeviceCountryCode = (): string => {
  if (typeof window === 'undefined') return '';
  const candidates: string[] = [];
  try {
    const intl = Intl.DateTimeFormat().resolvedOptions().locale;
    if (intl) candidates.push(intl);
  } catch {
    /* ignore */
  }
  if (typeof navigator !== 'undefined') {
    if (navigator.language) candidates.push(navigator.language);
    navigator.languages?.forEach((l) => {
      if (l) candidates.push(l);
    });
  }
  for (const loc of candidates) {
    const region = parseRegionFromBcp47(loc);
    if (region && /^[A-Z]{2}$/.test(region)) return region;
  }
  return '';
};
