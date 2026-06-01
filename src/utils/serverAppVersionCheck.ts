/**
 * 服务端 App 版本检测（`/app-api/system/app-base/version-check`，见 AppClient.checkVersion）
 * - 公共入口：`checkServerAppVersion`
 * - 仅原生环境会请求；Web 直接返回 skipped
 */
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Device } from '@capacitor/device';
import { checkVersion as postCheckVersion, type AppCheckVersionBody } from '/@/service/AppClient';
import {
  useSystemStoreWithOut,

  /** AppUpdateDialogPayload：类型别名 */
  type AppUpdateDialogPayload,

  /** AppUpdateDialogUpdateType：类型别名 */
  type AppUpdateDialogUpdateType
} from '/@/stores/modules/SystemConfig';
import { useUserStoreWithOut } from '/@/stores/modules/UserConfig';
import { getResourcePackageVersion } from '/@/hooks/useAppInfo';
import { getNativeNetworkLabelForApi } from '/@/utils/http/nativeClientHeaders';
import { getNavigatorNetworkTypeLabel } from '/@/utils/networkType';
import { ResultEnum } from '/@/enums/httpEnum';
import { downloadAndApplyOTAFromUrl } from '/@/utils/appUpdate';
import {
  clearAppUpdatePendingBadgeAndSync,
  postAppUpdateReminderNative
} from '/@/utils/appNativeNotify';
import { showToast } from 'vant';
import { getI18n } from '/@/locales/i18nInstance';
import { normalizeApiPlatformName } from '/@/utils/http/clientTypeLabel';
import { ensureDeviceClientReportFields } from '/@/utils/deviceClientReportFields';

/** translate */
const translate = (key: string): string => {
  /** inst */
  const inst = getI18n();

  /** tFn */
  const tFn = inst?.global?.t as ((k: string) => unknown) | undefined;

  /** raw */
  const raw = tFn?.(key);
  return raw != null && String(raw) !== '' ? String(raw) : key;
};

/** CheckServerAppVersionOptions：接口数据结构定义（事件或回调处理） */
export interface CheckServerAppVersionOptions {
  /** 为 true 时不弹出「检查失败」等 Toast（仍会 console） */
  silent?: boolean;
  /** 无新版本时是否提示「已是最新」 */
  notifyWhenLatest?: boolean;
}

/** ServerAppVersionCheckResult：类型别名 */
export type ServerAppVersionCheckResult =
  | {
      skipped: true;
      reason: 'not_native';
    }
  | {
      skipped: false;
      ok: boolean;
      hasUpdate: boolean;
      appliedResource: boolean;
      message?: string;
    };

/** firstString */
const firstString = (...vals: unknown[]): string => {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
};

/** 格式化展示：formatVersionBadgeForUpdate */
export const formatVersionBadgeForUpdate = (v: string): string => {
  /** s */
  const s = (v ?? '').trim();
  if (!s) return '';
  if (/^v/i.test(s)) return s;
  if (/^\d/.test(s)) return `V${s}`;
  return s;
};
const parseBool = (v: unknown): boolean | undefined => {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v === 1;
  if (typeof v === 'string') {
    const s = v.toLowerCase();
    if (s === 'true' || s === '1' || s === 'yes') return true;
    if (s === 'false' || s === '0' || s === 'no') return false;
  }
  return undefined;
};
const normalizeVersionCheckData = (
  data: unknown
): {
  hasUpdate: boolean;
  forceUpdate: boolean;
  updateType: '' | 'resource' | 'package';
  contractDownloadUrl: string;
  contractVersion: string;
  latestVersion: string;
  androidApkUrl: string;
  iosStoreUrl: string;
  iosAppStoreId: string;
  resourceUrl: string;
  resourceVersion: string;
  resourceNeedUpdate: boolean;
  contentList: string[];
} => {
  if (!data || typeof data !== 'object') {
    return {
      hasUpdate: false,
      forceUpdate: false,
      updateType: '',
      contractDownloadUrl: '',
      contractVersion: '',
      latestVersion: '',
      androidApkUrl: '',
      iosStoreUrl: '',
      iosAppStoreId: '',
      resourceUrl: '',
      resourceVersion: '',
      resourceNeedUpdate: false,
      contentList: []
    };
  }

  /** d */
  const d = data as Record<string, unknown>;

  /** explicitHas */
  const explicitHas = parseBool(d.hasUpdate) ?? parseBool(d.has_update);

  /** legacyNeed */
  const legacyNeed =
    parseBool(d.needUpdate) ??
    parseBool(d.need_update) ??
    parseBool(d.upgrade) ??
    parseBool(d.needUpgrade);

  /** hasUpdate */
  const hasUpdate = explicitHas !== undefined ? explicitHas === true : legacyNeed === true;

  /** forceUpdate */
  const forceUpdate =
    parseBool(d.forceUpdate) ??
    parseBool(d.force_update) ??
    parseBool(d.mustUpdate) ??
    parseBool(d.must_update) ??
    false;

  /** updateTypeRaw */
  const updateTypeRaw = firstString(d.updateType, d.update_type).toLowerCase();

  /** updateType */
  const updateType: '' | 'resource' | 'package' =
    updateTypeRaw === 'resource' ? 'resource' : updateTypeRaw === 'package' ? 'package' : '';

  /** 拉取接口数据：contractDownloadUrl */
  const contractDownloadUrl = firstString(d.downloadUrl, d.download_url);

  /** contractVersion */
  const contractVersion = firstString(d.version, d.versionName, d.version_name);

  /** resourceNeedUpdate */
  const resourceNeedUpdate =
    parseBool(d.resourceNeedUpdate) ??
    parseBool(d.resource_need_update) ??
    parseBool(d.needResourceUpdate) ??
    parseBool(d.need_hot_update) ??
    parseBool(d.hotUpdate) ??
    false;

  /** latestVersion */
  const latestVersion = firstString(
    contractVersion,
    d.latestPackageVersion,
    d.latest_package_version,
    d.targetVersion,
    d.target_version,
    d.newVersion,
    d.new_version,
    d.latestVersion,
    d.latest_version,
    d.versionName,
    d.version
  );

  /** androidApkUrl */
  const androidApkUrl =
    updateType === 'resource'
      ? firstString(d.androidDownloadUrl, d.android_download_url, d.apkUrl, d.apk_url)
      : firstString(
          d.androidDownloadUrl,
          d.android_download_url,
          d.apkUrl,
          d.apk_url,
          updateType === 'package' ? contractDownloadUrl : '',
          d.downloadUrl,
          d.download_url,
          d.packageDownloadUrl,
          d.package_download_url
        );

  /** iosStoreUrl */
  const iosStoreUrl = firstString(
    updateType === 'package' ? contractDownloadUrl : '',
    d.iosDownloadUrl,
    d.ios_download_url,
    d.iosStoreUrl,
    d.ios_store_url,
    d.appleStoreUrl,
    d.appStoreUrl
  );

  /** iosAppStoreId */
  const iosAppStoreId = firstString(d.iosAppId, d.ios_app_id, d.appStoreId, d.app_store_id);

  /** resourceUrl */
  const resourceUrl = firstString(
    updateType === 'resource' ? contractDownloadUrl : '',
    d.resourceUrl,
    d.resource_url,
    d.otaUrl,
    d.ota_url,
    d.hotUpdateUrl,
    d.hot_update_url,
    d.sourcePackageUrl,
    d.source_package_url
  );

  /** resourceVersion */
  const resourceVersion = firstString(
    updateType === 'resource' ? contractVersion : '',
    d.resourceVersion,
    d.resource_version,
    d.otaVersion,
    d.ota_version,
    d.sourceVersion,
    d.source_version
  );

  /** 常量或静态配置：列表数据 */
  const contentList: string[] = [];
  if (Array.isArray(d.updateLogList)) {
    for (const item of d.updateLogList) {
      if (typeof item === 'string' && item.trim()) contentList.push(item.trim());
    }
  } else if (Array.isArray(d.updateContentList)) {
    for (const item of d.updateContentList) {
      if (typeof item === 'string' && item.trim()) contentList.push(item.trim());
    }
  } else {
    const raw =
      d.updateContent ??
      d.update_content ??
      d.versionDesc ??
      d.version_desc ??
      d.remark ??
      d.changeLog ??
      d.change_log;
    if (typeof raw === 'string' && raw.trim()) {
      contentList.push(
        ...raw
          .split(/\r?\n/)
          .map((s) => s.trim())
          .filter(Boolean)
      );
    }
  }
  return {
    hasUpdate,
    forceUpdate,
    updateType,
    contractDownloadUrl,
    contractVersion,
    latestVersion,
    androidApkUrl,
    iosStoreUrl,
    iosAppStoreId,
    resourceUrl,
    resourceVersion,
    resourceNeedUpdate,
    contentList
  };
};
export const collectCheckVersionRequestBody = async (): Promise<AppCheckVersionBody> => {
  /** SystemStore */
  const SystemStore = useSystemStoreWithOut();

  /** 用户：UserStore */
  const UserStore = useUserStoreWithOut();

  /** platform_name */
  const platform_name = normalizeApiPlatformName(Capacitor.getPlatform());

  /** 解构赋值：组合式 API 返回的一组方法或状态 */
  const [appInfo, devInfo, networkLabel] = await Promise.all([
    App.getInfo().catch(() => null),
    Device.getInfo().catch(() => null),
    getNativeNetworkLabelForApi().catch(() => getNavigatorNetworkTypeLabel())
  ]);

  /** package_version */
  const package_version =
    (appInfo?.version ?? '').trim() || (appInfo?.build ?? '').trim() || getResourcePackageVersion();

  /** source_version */
  const source_version = getResourcePackageVersion();

  /** 用户：user */
  const user = UserStore.getUserInfo as Record<string, unknown>;

  /** 令牌：token */
  const token = UserStore.getToken;

  /** 用户或路由 uid：rawUid */
  const rawUid = user?.id ?? user?.uid;
  /** 未登录或与 WS subscribe_update 约定：无 uid 时用空串（不用 null） */
  const uid = token && rawUid != null && String(rawUid).trim() !== '' ? String(rawUid).trim() : '';

  /** timezone */
  const timezone = (() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
    } catch {
      return '';
    }
  })();

  /** lang */
  const lang =
    (SystemStore.getLocaleInfo?.locale ?? '').trim() ||
    (typeof navigator !== 'undefined' ? navigator.language || navigator.languages?.[0] || '' : '');

  /** network */
  const network = (networkLabel ?? '').trim() || getNavigatorNetworkTypeLabel();

  /** system_version */
  const system_version = (devInfo?.osVersion ?? '').trim();

  /** ua */
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';

  /** dcr */
  const dcr = await ensureDeviceClientReportFields();
  return {
    package_version,
    source_version,
    platform_name,
    uid,
    timezone,
    lang,
    network,
    system_version,
    ua,
    vendor_name: dcr.vendor_name,
    device_name: dcr.device_name,
    system_ui_name: dcr.system_ui_name,
    ui_version: dcr.ui_version
  };
};
export const checkServerAppVersion = async (
  options: CheckServerAppVersionOptions = {}
): Promise<ServerAppVersionCheckResult> => {
  /** 解构赋值：组合式 API 返回的一组方法或状态 */
  const { silent = false, notifyWhenLatest = false } = options;
  if (!Capacitor.isNativePlatform()) {
    return { skipped: true, reason: 'not_native' };
  }

  /** SystemStore */
  const SystemStore = useSystemStoreWithOut();
  try {
    const body = await collectCheckVersionRequestBody();
    const res = await postCheckVersion(body);
    console.log('检测结果: ', JSON.stringify(res));
    if (!res || res.code !== ResultEnum.SUCCESS) {
      const msg =
        (
          res as {
            msg?: string;
          }
        )?.msg ?? 'checkVersion failed';
      if (!silent) {
        showToast(translate('app_version_check_failed'));
      } else {
        console.warn('[checkServerAppVersion]', msg, res);
      }
      return { skipped: false, ok: false, hasUpdate: false, appliedResource: false, message: msg };
    }
    const normalized = normalizeVersionCheckData(res.data);
    if (!normalized.hasUpdate) {
      // 服务端已确认无更新：若升级弹窗仍开着（含强更残留），一律收起并清空 payload
      if (SystemStore.showAppUpdateDialog || SystemStore.appUpdateDialogPayload) {
        SystemStore.setShowAppUpdateDialog(false, { bypassForceGuard: true });
      }
      void clearAppUpdatePendingBadgeAndSync();
      if (notifyWhenLatest) {
        showToast(translate('version_info_value_latest'));
      }
      return { skipped: false, ok: true, hasUpdate: false, appliedResource: false };
    }
    const pkgHints = normalized.androidApkUrl || normalized.iosStoreUrl || normalized.iosAppStoreId;
    const isNewContract =
      normalized.updateType === 'resource' || normalized.updateType === 'package';
    const tryResource =
      !isNewContract &&
      !!normalized.resourceUrl &&
      !!normalized.resourceVersion &&
      (normalized.resourceNeedUpdate || !pkgHints);
    if (tryResource) {
      const ota = await downloadAndApplyOTAFromUrl(
        normalized.resourceUrl,
        normalized.resourceVersion
      );
      if (ota.applied) {
        void clearAppUpdatePendingBadgeAndSync();
        return { skipped: false, ok: true, hasUpdate: true, appliedResource: true };
      }
      if (ota.error) {
        console.warn('[checkServerAppVersion] OTA apply failed:', ota.error);
      }
    }
    const appInfo = await App.getInfo().catch(() => null);
    const currentVersion =
      (appInfo?.version ?? '').trim() ||
      (appInfo?.build ?? '').trim() ||
      body.package_version ||
      '';
    const newVersion =
      normalized.contractVersion ||
      normalized.latestVersion ||
      (normalized.androidApkUrl || normalized.iosStoreUrl || normalized.iosAppStoreId
        ? translate('app_version_new_available')
        : '');
    const rawOtaOrPackageVersion = (
      normalized.contractVersion ||
      normalized.latestVersion ||
      (normalized.updateType === 'resource' ? normalized.resourceVersion : '') ||
      ''
    ).replace(/^v/i, '');
    const contentList =
      normalized.contentList.length > 0
        ? normalized.contentList
        : [translate('app_version_update_hint')];
    const dialogPayload: AppUpdateDialogPayload = {
      currentVersion: formatVersionBadgeForUpdate(currentVersion),
      newVersion: formatVersionBadgeForUpdate(newVersion),
      contentList,
      forceUpdate: normalized.forceUpdate,
      updateType: isNewContract ? (normalized.updateType as AppUpdateDialogUpdateType) : undefined,
      downloadUrl: isNewContract ? normalized.contractDownloadUrl || undefined : undefined,
      serverVersion:
        isNewContract && rawOtaOrPackageVersion.trim() ? rawOtaOrPackageVersion.trim() : undefined,
      androidApkUrl: normalized.androidApkUrl || undefined,
      iosStoreUrl: normalized.iosStoreUrl || undefined,
      iosAppStoreId: normalized.iosAppStoreId || undefined
    };
    SystemStore.openAppUpdateDialog(dialogPayload);
    const notifyTitle = [
      translate('app_version_new_available'),
      dialogPayload.newVersion ? String(dialogPayload.newVersion) : ''
    ]
      .filter((s) => String(s).trim())
      .join(' · ');
    const notifyBody = (
      contentList.length > 0 ? contentList : [translate('app_version_update_hint')]
    )
      .map((s) => String(s).trim())
      .filter(Boolean)
      .join('\n');
    void postAppUpdateReminderNative(
      notifyTitle || translate('app_version_new_available'),
      notifyBody
    );
    return { skipped: false, ok: true, hasUpdate: true, appliedResource: false };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!silent) {
      showToast(translate('app_version_check_failed'));
    } else {
      console.warn('[checkServerAppVersion]', msg, e);
    }
    return { skipped: false, ok: false, hasUpdate: false, appliedResource: false, message: msg };
  }
};
