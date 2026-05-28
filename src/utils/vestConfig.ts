import { Capacitor } from '@capacitor/core';
import { fetchVestConfig, type VestConfigData } from '/@/service/AppClient';

let cached: VestConfigData | null = null;
let loadPromise: Promise<VestConfigData | null> | null = null;

const normalizeVestFlag = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
};

/** 当前运行平台对应的马甲开关（iosStatus / androidStatus） */
export const getVestStatusForCurrentPlatform = (data?: VestConfigData | null): number => {
  const cfg = data ?? cached;
  if (!cfg) return 0;
  const platform = Capacitor.getPlatform();
  if (platform === 'ios') return normalizeVestFlag(cfg.iosStatus);
  if (platform === 'android') return normalizeVestFlag(cfg.androidStatus);
  return 0;
};

/** 拉取并缓存 vest-config（仅请求一次） */
export const ensureVestConfigLoaded = async (): Promise<VestConfigData | null> => {
  if (cached) return cached;
  if (!loadPromise) {
    loadPromise = fetchVestConfig()
      .then((res) => {
        if (res?.code === 0 && res.data) {
          cached = res.data;
          return cached;
        }
        return null;
      })
      .catch(() => null);
  }
  return loadPromise;
};

/** 当前平台对应 status === 1 时展示 Home 马甲页 */
export const isVestHomeMode = (): boolean => getVestStatusForCurrentPlatform() === 1;

/** 马甲页 iframe 地址（displaySite） */
export const getVestDisplaySite = (): string => (cached?.displaySite || '').trim();
