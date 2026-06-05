import { Capacitor } from '@capacitor/core';

/** 清除 Pinia 持久化里卡死的 Loading=true */
const clearPersistedLoadingFlag = (): void => {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.endsWith('_System')) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const data = JSON.parse(raw) as { Loading?: boolean };
      if (data.Loading === true) {
        data.Loading = false;
        localStorage.setItem(key, JSON.stringify(data));
      }
    }
  } catch {
    // ignore
  }
};

/** 非 builtin OTA 包回滚（坏包会导致重启后一直空白） */
const resetOtaIfNotBuiltin = async (): Promise<boolean> => {
  try {
    const { CapacitorUpdater } = await import('@capgo/capacitor-updater');
    const { bundle } = await CapacitorUpdater.current();
    if ((bundle?.id ?? '').trim() === 'builtin') return false;
    await CapacitorUpdater.reset();
    return true;
  } catch {
    return false;
  }
};

/** iOS 冷启动：清 Loading 持久化；坏 OTA 则 reset（原生会重载） */
export const runNativeIosBootRecovery = async (): Promise<'reload' | 'continue'> => {
  if (Capacitor.getPlatform() !== 'ios') return 'continue';

  clearPersistedLoadingFlag();

  if (await resetOtaIfNotBuiltin()) {
    return 'reload';
  }

  return 'continue';
};
