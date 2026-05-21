import { fetchVestConfig, type VestConfigData } from '/@/service/AppClient';

let cached: VestConfigData | null = null;
let loadPromise: Promise<VestConfigData | null> | null = null;

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

/** status === 1 时展示 Home 马甲页 */
export const isVestHomeMode = (): boolean => cached?.status === 1;

/** 马甲页 iframe 地址（displaySite） */
export const getVestDisplaySite = (): string => (cached?.displaySite || '').trim();
