/**
 * App.vue 中与原生壳相关的逻辑：启动埋点、沉浸式状态栏、页面可见性。
 */
import { watch } from 'vue';
import { usePageVisibility } from '@vant/use';
import { Capacitor } from '@capacitor/core';
import { useUserStoreWithOut } from '/@/stores/modules/UserConfig';
import { recordStartupLog } from '/@/service/AppClient';
import { getNavigatorNetworkTypeLabel } from '/@/utils/networkType';
import { getResourcePackageVersion, useAppInfo } from '/@/hooks/useAppInfo';
import { getRequestClientTypeLabel } from '/@/utils/http/clientTypeLabel';
import { ensureDeviceClientReportFields } from '/@/utils/deviceClientReportFields';
import {
  applyNativeStatusBarForTheme,
  scheduleNativeNavBarTopInsetSync
} from '/@/hooks/AppStatusBarUtils';
import { useSystemStoreWithOut } from '/@/stores/modules/SystemConfig';

/** 与 `useI18n().t` 一致：至少支持单 key */
export type AppRootTranslate = (key: string) => string;

/** 方法：recordStartupLogAsync */
const recordStartupLogAsync = async (): Promise<void> => {
  const UserStore = useUserStoreWithOut();
  const { getAppVersion, getDeviceSystemInfo } = useAppInfo();

  const lang = navigator.language || navigator.languages?.[0] || '';
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  const ua = navigator.userAgent || '';
  const rsVersion = getResourcePackageVersion();
  const networkTp = getNavigatorNetworkTypeLabel();

  let appVersion = '';
  let sysVersion = '';
  if (Capacitor.isNativePlatform()) {
    try {
      const appInfo = await getAppVersion();
      const versionName = (appInfo?.versionName || '').trim();
      const versionCode = (appInfo?.versionCode || '').trim();
      appVersion = versionName || versionCode;
    } catch {
      appVersion = '';
    }
    try {
      const deviceInfo = await getDeviceSystemInfo();
      sysVersion = (deviceInfo.osVersion || '').trim();
    } catch {
      sysVersion = '';
    }
  }

  const user = UserStore.getUserInfo as { id?: unknown };
  const uidRaw = user?.id;
  const uid = uidRaw != null && String(uidRaw).trim() !== '' ? String(uidRaw) : '';

  const dcr = await ensureDeviceClientReportFields();
  recordStartupLog({
    uid,
    system: getRequestClientTypeLabel(),
    sysVersion,
    appVersion,
    rsVersion,
    ua,
    lang,
    tz,
    networkTp,
    ts: new Date().getTime(),
    vendor_name: dcr.vendor_name,
    device_name: dcr.device_name,
    system_ui_name: dcr.system_ui_name,
    ui_version: dcr.ui_version
  }).then((res: unknown) => {
    console.log(res);
  });
};

/** 原生壳：状态栏主题、页面回到前台时同步 safe-area */
export const initAppNativeIntegrationWatchers = (_t: AppRootTranslate): void => {
  const SystemStore = useSystemStoreWithOut();
  const PageVisibility = usePageVisibility();

  watch(
    () => PageVisibility.value,
    (newVal: string) => {
      if (newVal === 'visible' && Capacitor.isNativePlatform()) {
        scheduleNativeNavBarTopInsetSync();
      }
    },
    { deep: true }
  );

  watch(
    () => SystemStore.getDarkMode,
    (mode) => {
      if (!Capacitor.isNativePlatform()) return;
      void applyNativeStatusBarForTheme(mode);
    },
    { immediate: true }
  );
};

export const runAppNativePostMountTasks = async (): Promise<void> => {
  if (Capacitor.isNativePlatform()) {
    void recordStartupLogAsync();
  }
};
