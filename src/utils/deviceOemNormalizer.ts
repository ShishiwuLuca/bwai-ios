/**
 * 将系统上报的厂商名规范为常见英文商标（Huawei、Xiaomi、Samsung 等）
 */
const OEM_CANONICAL: Record<string, string> = {
  apple: 'Apple',
  samsung: 'Samsung',
  xiaomi: 'Xiaomi',
  redmi: 'Redmi',
  huawei: 'Huawei',
  honor: 'HONOR',
  oppo: 'OPPO',
  realme: 'realme',
  vivo: 'vivo',
  oneplus: 'OnePlus',
  google: 'Google',
  motorola: 'Motorola',
  lge: 'LG',
  lg: 'LG',
  sony: 'Sony',
  asus: 'ASUS',
  nokia: 'Nokia',
  meizu: 'Meizu',
  lenovo: 'Lenovo',
  'hmd global': 'HMD Global',
  nothing: 'Nothing',
  tcl: 'TCL',
  zte: 'ZTE',
  sharp: 'Sharp',
  sonyericsson: 'Sony Ericsson',
  amazon: 'Amazon',
  microsoft: 'Microsoft'
};

/** normalizeOemVendorName */
export const normalizeOemVendorName = (raw: string): string => {
  const t = raw.trim();
  if (!t) return '';
  const key = t.toLowerCase();
  if (OEM_CANONICAL[key]) return OEM_CANONICAL[key];
  const compact = key.replace(/\./g, '').replace(/\s+/g, ' ').trim();
  if (OEM_CANONICAL[compact]) return OEM_CANONICAL[compact];
  return t
    .split(/\s+/)
    .map((w) => (w.length ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(' ');
};
