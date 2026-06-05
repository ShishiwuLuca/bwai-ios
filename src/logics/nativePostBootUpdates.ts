import { Capacitor } from '@capacitor/core';
import { checkServerAppVersion } from '/@/utils/serverAppVersionCheck';

/** scheduleNativePostBootUpdates */
export const scheduleNativePostBootUpdates = (): void => {
  if (!Capacitor.isNativePlatform()) return;
  setTimeout(() => {
    void checkServerAppVersion({ silent: true, notifyWhenLatest: false }).catch((e: unknown) =>
      console.warn('[serverAppVersionCheck] boot check:', e)
    );
  }, 2000);
};
