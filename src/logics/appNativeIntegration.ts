/**
 * App.vue 中与原生壳（Capacitor）、升级弹窗、沉浸式状态栏/安全区、启动埋点相关的逻辑。
 */
import { ref, watch } from 'vue';
import { usePageVisibility } from '@vant/use';
import { Capacitor } from '@capacitor/core';
import { showToast } from 'vant';
import { useSystemStoreWithOut, type AppUpdateDialogPayload } from '/@/stores/modules/SystemConfig';
import { useUserStoreWithOut } from '/@/stores/modules/UserConfig';
import { recordStartupLog } from '/@/service/AppClient';
import { getNavigatorNetworkTypeLabel } from '/@/utils/networkType';
import { getResourcePackageVersion, useAppInfo } from '/@/hooks/useAppInfo';
import { getRequestClientTypeLabel } from '/@/utils/http/clientTypeLabel';
import {
  performNativeUpdate,
  downloadAndApplyOTAFromUrl,
  formatBytesToMb2,
  resolveUpdateCacheVersionFromDialogFields,

  /** FileTransferProgressPayload：类型别名 */
  type FileTransferProgressPayload
} from '/@/utils/appUpdate';
import { openInBrowser } from '/@/hooks/useAppLauncher';
import { BWAIAppControl } from '/@/plugins/BwaiAppControl';
import { syncAppIconBadgeWithUnreadCount } from '/@/utils/appIconBadge';
import { clearAppUpdatePendingBadgeAndSync } from '/@/utils/appNativeNotify';
import { ensureDeviceClientReportFields } from '/@/utils/deviceClientReportFields';
import {
  applyNativeStatusBarForTheme,
  scheduleNativeNavBarTopInsetSync
} from '/@/hooks/AppStatusBarUtils';

/**
 * 不在模块顶层调用 `useXxxStoreWithOut()` / `useAppInfo()` / `usePageVisibility()`：
 * App.vue 在 main.ts 中往往先于 `setupStore(app)` 被静态 import，顶层会过早实例化带 persist 的 store，
 * 可能干扰 pinia-plugin-persistedstate 的订阅与 hydration。改为在首次需要时（setup / 事件回调内）再取。
 */
/** 与 `useI18n().t` 一致：至少支持单 key */
export type AppRootTranslate = (key: string) => string;

/** 弹窗出现后自动开始更新：同一套弹窗数据只触发一次（仅强制更新时自动；非强更须用户点「立即更新」） */
const appUpdateAutoStartedKey = ref('');

/** 响应式状态：事件或回调处理 */
const appUpdateActionInFlight = ref(false);

/** translate */
let translate: AppRootTranslate | undefined;

/** Android：安装会话失败只注册一次 listener */
let bwaiApkInstallSessionListenerAttached = false;

/** 拉取接口数据：applyDownloadProgress */
const applyDownloadProgress = (evt: FileTransferProgressPayload): void => {
  /** SystemStore */
  const SystemStore = useSystemStoreWithOut();

  /** 拉取接口数据：loadedMb */
  const loadedMb = formatBytesToMb2(evt.bytes);

  /** 总条数：totalMb */
  const totalMb =
    evt.lengthComputable && evt.totalBytes > 0 ? formatBytesToMb2(evt.totalBytes) : '--';
  SystemStore.setAppUpdateDownloadProgress({
    active: true,
    percent: Math.min(100, Math.max(0, evt.percent)),
    loadedMb,
    totalMb
  });
};

/**
 * 按升级弹窗数据执行下载/安装（新接口 updateType + downloadUrl；旧接口走商店与配置地址）
 */
const runAppUpdateFromDialogPayload = async (
  pArg?: AppUpdateDialogPayload | null
): Promise<void> => {
  /** SystemStore */
  const SystemStore = useSystemStoreWithOut();

  /** p */
  const p = pArg ?? SystemStore.appUpdateDialogPayload;
  if (!p || !Capacitor.isNativePlatform()) return;
  if (appUpdateActionInFlight.value) return;
  appUpdateActionInFlight.value = true;

  /** clearProgress */
  const clearProgress = (): void => {
    SystemStore.setAppUpdateDownloadProgress(null);
  };

  /** tFail */
  const tFail = (): string =>
    translate ? String(translate('app_version_check_failed')) : 'app_version_check_failed';
  try {
    if (p.updateType === 'resource') {
      SystemStore.setAppUpdateDownloadProgress({
        active: true,
        percent: 0,
        loadedMb: '0.00',
        totalMb: '--'
      });
      const url = (p.downloadUrl ?? '').trim();
      const ver = resolveUpdateCacheVersionFromDialogFields({
        serverVersion: p.serverVersion,
        newVersion: p.newVersion
      });
      if (!url || !ver) {
        clearProgress();
        showToast({ message: tFail(), position: 'middle' });
        if (!p.forceUpdate) {
          SystemStore.setShowAppUpdateDialog(false, { bypassForceGuard: true });
        }
        return;
      }
      const res = await downloadAndApplyOTAFromUrl(url, ver, applyDownloadProgress);
      if (res.applied) {
        clearProgress();
        void clearAppUpdatePendingBadgeAndSync();
        return;
      }
      clearProgress();
      if (res.error) {
        showToast({ message: tFail(), position: 'middle' });
      }
      if (!p.forceUpdate) {
        SystemStore.setShowAppUpdateDialog(false, { bypassForceGuard: true });
      }
      return;
    }
    if (p.updateType === 'package') {
      SystemStore.setAppUpdateDownloadProgress({
        active: true,
        percent: 0,
        loadedMb: '0.00',
        totalMb: '--'
      });
      if (Capacitor.getPlatform() === 'android') {
        const url = (p.downloadUrl ?? p.androidApkUrl ?? SystemStore.getAndroidPackageUrl).trim();
        if (!url) {
          clearProgress();
          showToast({ message: tFail(), position: 'middle' });
          if (!p.forceUpdate) {
            SystemStore.setShowAppUpdateDialog(false, { bypassForceGuard: true });
          }
          return;
        }
        await performNativeUpdate({
          androidApkUrl: url,
          androidApkCacheVersion:
            resolveUpdateCacheVersionFromDialogFields({
              serverVersion: p.serverVersion,
              newVersion: p.newVersion
            }) || undefined,
          onApkDownloadProgress: applyDownloadProgress
        });
      } else {
        clearProgress();
        const iosUrl = (p.downloadUrl ?? p.iosStoreUrl ?? SystemStore.getIosPackageUrl).trim();
        const appId = (p.iosAppStoreId || '').trim();
        if (appId) {
          await performNativeUpdate({ iosAppId: appId });
        } else if (iosUrl) {
          await openInBrowser(iosUrl);
        } else {
          await performNativeUpdate();
        }
      }
      clearProgress();
      void clearAppUpdatePendingBadgeAndSync();
      SystemStore.setShowAppUpdateDialog(false, { bypassForceGuard: true });
      return;
    }
    clearProgress();
    if (Capacitor.getPlatform() === 'android') {
      const url = (p.androidApkUrl || SystemStore.getAndroidPackageUrl).trim();
      if (url) {
        SystemStore.setAppUpdateDownloadProgress({
          active: true,
          percent: 0,
          loadedMb: '0.00',
          totalMb: '--'
        });
        await performNativeUpdate({
          androidApkUrl: url,
          androidApkCacheVersion:
            resolveUpdateCacheVersionFromDialogFields({
              serverVersion: p.serverVersion,
              newVersion: p.newVersion
            }) || undefined,
          onApkDownloadProgress: applyDownloadProgress
        });
      } else {
        await performNativeUpdate();
      }
    } else {
      const iosUrl = (p.iosStoreUrl || SystemStore.getIosPackageUrl).trim();
      const appId = (p.iosAppStoreId || '').trim();
      if (appId) {
        await performNativeUpdate({ iosAppId: appId });
      } else if (iosUrl) {
        await openInBrowser(iosUrl);
      } else {
        await performNativeUpdate();
      }
    }
    clearProgress();
    void clearAppUpdatePendingBadgeAndSync();
    SystemStore.setShowAppUpdateDialog(false, { bypassForceGuard: true });
  } catch (e: unknown) {
    console.warn('[runAppUpdateFromDialogPayload]', e);
    clearProgress();
    showToast({ message: tFail(), position: 'middle' });
    if (!p.forceUpdate) {
      SystemStore.setShowAppUpdateDialog(false, { bypassForceGuard: true });
    }
  } finally {
    appUpdateActionInFlight.value = false;
  }
};

/** 拉取接口数据：tryAutoStartAppUpdateFromWsPayload */
export const tryAutoStartAppUpdateFromWsPayload = (p: AppUpdateDialogPayload): void => {
  if (!Capacitor.isNativePlatform()) return;
  if (!p.forceUpdate) return;

  /** url */
  const url = (p.downloadUrl ?? '').trim();
  if (!url || !p.updateType) return;
  if (p.updateType === 'resource') {
    const ver = resolveUpdateCacheVersionFromDialogFields({
      serverVersion: p.serverVersion,
      newVersion: p.newVersion
    });
    if (!ver) return;
  } else if (p.updateType !== 'package') {
    return;
  }
  void runAppUpdateFromDialogPayload(p);
};

/** 升级弹窗确认：非强制更新时由用户点击触发 */
export const onAppUpdateDialogPerformUpdate = (): void => {
  void runAppUpdateFromDialogPayload(useSystemStoreWithOut().appUpdateDialogPayload);
};

/** 方法：recordStartupLogAsync */
const recordStartupLogAsync = async (): Promise<void> => {
  /** 用户：UserStore */
  const UserStore = useUserStoreWithOut();

  /** 解构赋值：组合式 API 返回的一组方法或状态 */
  const { getAppVersion, getDeviceSystemInfo } = useAppInfo();

  /** lang */
  const lang = navigator.language || navigator.languages?.[0] || '';

  /** tz */
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';

  /** ua */
  const ua = navigator.userAgent || '';

  /** rsVersion */
  const rsVersion = getResourcePackageVersion();

  /** networkTp */
  const networkTp = getNavigatorNetworkTypeLabel();

  /** appVersion */
  let appVersion = '';

  /** sysVersion */
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

  /** 用户：user */
  const user = UserStore.getUserInfo as {
    id?: unknown;
  };

  /** 用户或路由 uid：uidRaw */
  const uidRaw = user?.id;

  /** 用户或路由 uid：uid */
  const uid = uidRaw != null && String(uidRaw).trim() !== '' ? String(uidRaw) : '';

  /** dcr */
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

/** 事件或回调处理：initAppNativeIntegrationWatchers */
export const initAppNativeIntegrationWatchers = (t: AppRootTranslate): void => {
  translate = t;

  /** SystemStore */
  const SystemStore = useSystemStoreWithOut();

  /** PageVisibility */
  const PageVisibility = usePageVisibility();
  if (Capacitor.getPlatform() === 'android' && !bwaiApkInstallSessionListenerAttached) {
    bwaiApkInstallSessionListenerAttached = true;
    void BWAIAppControl.addListener('apkInstallSessionResult', (evt) => {
      if (evt.status === 0) return;
      const msg = String(evt.message ?? '');
      const incompatible =
        evt.status === 5 ||
        /INSTALL_FAILED_UPDATE_INCOMPATIBLE|signatures do not match|UPDATE_INCOMPATIBLE/i.test(msg);
      const key = incompatible
        ? 'app_version_install_signature_mismatch'
        : 'app_version_install_failed';
      const fallback = incompatible
        ? 'This APK was signed with a different key than the installed app. Uninstall the test build or upload an APK signed with the same key.'
        : 'App install did not complete. Please try again or get the update from the store.';
      const tr = translate;
      const text = tr ? String(tr(key)) : fallback;
      showToast({ message: text === key ? fallback : text, position: 'middle' });
    });
  }

  /** 侦听依赖变化并触发副作用 */
  watch(
    () => ({
      show: SystemStore.showAppUpdateDialog,
      payload: SystemStore.appUpdateDialogPayload
    }),
    ({ show, payload }) => {
      if (!show) {
        appUpdateAutoStartedKey.value = '';
        return;
      }
      if (!Capacitor.isNativePlatform() || !payload?.updateType) return;
      const url = (payload.downloadUrl || '').trim();
      if (!url) return;
      // 非强制更新：不自动拉包，弹窗可关闭，由用户点击「立即更新」
      if (!payload.forceUpdate) return;
      let key: string;
      if (payload.updateType === 'resource') {
        const ver = resolveUpdateCacheVersionFromDialogFields({
          serverVersion: payload.serverVersion,
          newVersion: payload.newVersion
        });
        if (!ver) return;
        key = `resource|${url}|${ver}`;
      } else {
        const pkgVer = resolveUpdateCacheVersionFromDialogFields({
          serverVersion: payload.serverVersion,
          newVersion: payload.newVersion
        });
        key = `package|${url}|${pkgVer}`;
      }
      if (appUpdateAutoStartedKey.value === key) return;
      appUpdateAutoStartedKey.value = key;
      void runAppUpdateFromDialogPayload(payload);
    },
    { flush: 'post' }
  );

  /** 侦听依赖变化并触发副作用 */
  watch(
    () => PageVisibility.value,
    (newVal: string) => {
      if (newVal === 'visible' && Capacitor.isNativePlatform()) {
        scheduleNativeNavBarTopInsetSync();
      }
    },
    { deep: true }
  );

  /** 侦听依赖变化并触发副作用 */
  watch(
    () => SystemStore.getDarkMode,
    (mode) => {
      if (!Capacitor.isNativePlatform()) return;
      void applyNativeStatusBarForTheme(mode);
    },
    { immediate: true }
  );
};
export const runAppNativePostMountTasks = async (isLogin: boolean): Promise<void> => {
  if (isLogin && Capacitor.isNativePlatform()) {
    void syncAppIconBadgeWithUnreadCount();
  }
  if (Capacitor.isNativePlatform()) {
    void recordStartupLogAsync();
  }
};
