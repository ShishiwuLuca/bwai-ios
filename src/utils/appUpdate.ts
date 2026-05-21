/**
 * APP 更新服务
 * - 资源包（OTA）：向 Capgo 传入 `http(s)` 直链下载；**仅在** `CapacitorUpdater` 的 **`set` 成功事件** 之后删除其它 bundle（见 `initAppUpdateInstallLifecycleListeners`），避免 set 失败时已删旧包。**Android**：先 **`scheduleProcessExit`** 再 **`void set`**。**iOS** `await set` 后同样由该事件清理。
 * - 安装包：
 *   - Android：APK 直链「下载完成 → **openApkInstaller**」；URL 文件名与本地一致才跳过下载；**Session** 成功见 `apkInstallSessionResult`（status=0）；**Intent** 由 `MainActivity` 的 ActivityResult 在用户返回且判定成功后再发 `apkInstallIntentResult` 删包；Play **立即 / 灵活更新**见 `performNativeUpdate`。
 *   - iOS：整包更新走 App Store / 浏览器打开分发链（系统限制无法静默安装 IPA）
 */
import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { FileTransfer } from '@capacitor/file-transfer';
import { CapacitorUpdater, type BundleInfo } from '@capgo/capacitor-updater';
import { BWAIAppControl } from '/@/plugins/BwaiAppControl';
import { Filesystem, Directory } from '@capacitor/filesystem';
import {
  AppUpdate,
  AppUpdateAvailability,
  AppUpdateResultCode,
  FlexibleUpdateInstallStatus
} from '@capawesome/capacitor-app-update';

/** isNative */
const isNative = Capacitor.isNativePlatform();

/** isAndroid */
const isAndroid = () => Capacitor.getPlatform() === 'android';

/** Capgo 插件 `download` 事件（原生侧 WorkManager 进度） */
type CapgoDownloadProgressEvent = {
  bytes?: number;
  contentLength?: number;
  lengthComputable?: boolean;
  percent?: number;
};

/** 格式化展示：formatBytesToMb2 */
export const formatBytesToMb2 = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes < 0) return '0.00';
  return (bytes / (1024 * 1024)).toFixed(2);
};

/** 文件传输 / 下载进度（含不可获知总大小时） */
export interface FileTransferProgressPayload {
  percent: number;
  bytes: number;
  totalBytes: number;
  lengthComputable: boolean;
}

/** 资源包（OTA）有可用的新版本 */
export interface OTAUpdateAvailable {
  version: string;
  url: string;
  message?: string;
}

/** 安装包有可用的新版本 */
export interface NativeUpdateAvailable {
  currentVersion: string;
  availableVersion: string;
  /** Android 是否支持立即更新（弹窗并安装） */
  immediateAllowed: boolean;
  /** Android 是否支持灵活更新（后台下载，完成后由本模块自动触发安装并重启） */
  flexibleAllowed: boolean;
}

/** 方法：notifyAppReady */
export const notifyAppReady = async (): Promise<void> => {
  if (!isNative) return;
  try {
    await CapacitorUpdater.notifyAppReady();
  } catch {
    // 非 OTA 场景或未配置时可能不可用，忽略
  }
};

/** 方法：checkAndApplyOTAUpdate */
export const checkAndApplyOTAUpdate = async (): Promise<{
  hasUpdate: boolean;
  version?: string;
  applied: boolean;
  error?: string;
}> => {
  if (!isNative) return { hasUpdate: false, applied: false };
  try {
    const latest = await CapacitorUpdater.getLatest();
    if (!latest?.url) {
      return { hasUpdate: false, applied: false };
    }
    return downloadAndApplyOTAFromUrl(latest.url, latest.version);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (
      msg.includes('No new version') ||
      (
        e as {
          error?: string;
        }
      )?.error === 'no_new_version_available'
    ) {
      return { hasUpdate: false, applied: false };
    }
    return { hasUpdate: false, applied: false, error: msg };
  }
};

/** normalizeUpdateArtifactVersion */
export const normalizeUpdateArtifactVersion = (raw: string): string => {
  return (raw ?? '').trim().replace(/^v+/i, '');
};

/** 事件或回调处理：looksLikeArtifactVersionToken */
const looksLikeArtifactVersionToken = (raw: string): boolean => {
  const t = normalizeUpdateArtifactVersion(raw);
  if (!t || t.length > 64) return false;
  if (!/\d/.test(t)) return false;
  if (/[\s\u4e00-\u9fff]/.test(t)) return false;
  return /^[\w.+-]+$/.test(t);
};

/** 事件或回调处理：resolveUpdateCacheVersionFromDialogFields */
export const resolveUpdateCacheVersionFromDialogFields = (fields: {
  serverVersion?: string;
  newVersion?: string;
}): string => {
  const s = (fields.serverVersion ?? '').trim();
  if (s && looksLikeArtifactVersionToken(s)) return normalizeUpdateArtifactVersion(s);
  const n = (fields.newVersion ?? '').trim();
  if (n && looksLikeArtifactVersionToken(n)) return normalizeUpdateArtifactVersion(n);
  return '';
};

/** apkCacheKeySegment */
const apkCacheKeySegment = (version: string): string => {
  return normalizeUpdateArtifactVersion(version).replace(/[^a-zA-Z0-9._-]+/g, '_');
};

/** apkPrimaryCacheFileNameForPackage */
const apkPrimaryCacheFileNameForPackage = (version: string): string => {
  const key = apkCacheKeySegment(version);
  return key ? `apk_cached_package_${key}.apk` : '';
};

/** apkLegacyCacheFileNameForPackage */
const apkLegacyCacheFileNameForPackage = (version: string): string => {
  const key = apkCacheKeySegment(version);
  return key ? `apk_cached_${key}.apk` : '';
};

/** 是否为 APK 缓存文件名中的非法字符 */
const hasIllegalApkStorageNameChars = (name: string): boolean => {
  if (/[\\/:*?"<>|]/.test(name)) return true;
  for (let i = 0; i < name.length; i++) {
    if (name.charCodeAt(i) < 32) return true;
  }
  return false;
};

/**
 * 从安装包下载地址解析用于落盘与「本地是否已下好」比对的文件名（路径最后一段，不含 query/hash，已 decode）。
 * 须为单层名且以 `.apk` 结尾、无路径穿越与非法字符；否则返回空串（走版本名或时间戳落盘，且不按 URL 复用）。
 */
export const getSanitizedApkFileNameFromDownloadUrl = (rawUrl: string): string => {
  const u = (rawUrl ?? '').trim();
  if (!u) return '';
  let pathPart = '';
  try {
    pathPart = new URL(u).pathname;
  } catch {
    pathPart = u.split('?')[0]?.split('#')[0] ?? '';
  }
  const segments = pathPart.split(/[/\\]/).filter(Boolean);
  let name = segments[segments.length - 1] ?? '';
  try {
    name = decodeURIComponent(name);
  } catch {
    // 保留未 decode 片段
  }
  name = name.trim();
  if (!name || !/\.apk$/i.test(name)) return '';
  if (name.includes('..') || hasIllegalApkStorageNameChars(name)) return '';
  if (name.length > 200) return '';
  return name;
};

/** Tab 状态：findCachedSuccessfulOtaBundle */
const findCachedSuccessfulOtaBundle =
  /** 本地是否已有可激活的 OTA bundle（同版本、已成功下载） */
  async (version: string): Promise<BundleInfo | null> => {
    const want = normalizeUpdateArtifactVersion(version);
    if (!want) return null;
    try {
      const { bundles } = await CapacitorUpdater.list();
      const hit = (bundles ?? []).find((b) => {
        if (!b?.id || b.id === 'builtin') return false;
        if (b.status !== 'success') return false;
        return normalizeUpdateArtifactVersion(b.version) === want;
      });
      return hit ?? null;
    } catch {
      return null;
    }
  };

/** 当前选中项：isOtaVersionAlreadyActive */
const isOtaVersionAlreadyActive =
  /** 当前运行的 Web bundle 是否已是该资源版本（无需再下载 / set） */
  async (version: string): Promise<boolean> => {
    const want = normalizeUpdateArtifactVersion(version);
    if (!want) return false;
    try {
      const { bundle } = await CapacitorUpdater.current();
      return normalizeUpdateArtifactVersion(bundle.version) === want;
    } catch {
      return false;
    }
  };

/** Android {@link android.content.pm.PackageInstaller#STATUS_SUCCESS} */
const APK_INSTALL_SESSION_STATUS_SUCCESS = 0;

/** OTA：`set` 成功后删除非当前 bundle，避免多版本残留 */
const pruneNonTargetOtaBundles = async (keepBundleId: string): Promise<void> => {
  const keep = (keepBundleId ?? '').trim();
  if (!keep || !isNative) return;
  try {
    const { bundles } = await CapacitorUpdater.list();
    for (const b of bundles ?? []) {
      const id = (b?.id ?? '').trim();
      if (!id || id === 'builtin' || id === keep) continue;
      try {
        await CapacitorUpdater.delete({ id });
      } catch {
        // 当前运行包、next 队列、下载中等不可删时忽略
      }
    }
  } catch {
    // list 失败忽略
  }
};

/** 是否为 APK 缓存文件名 */
const isApkCacheDataFileName = (name: string): boolean => {
  if (
    /^apk_cached_package_.+\.apk$/i.test(name) ||
    /^apk_cached_.+\.apk$/i.test(name) ||
    /^apk_update_\d+\.apk$/i.test(name)
  ) {
    return true;
  }
  if (!/\.apk$/i.test(name) || name.length > 200) return false;
  if (name.includes('..') || hasIllegalApkStorageNameChars(name)) return false;
  return name.length > 4;
};

/** 删除 `Directory.Data` 下指定路径的文件 */
const deleteDataRelativeFile = async (path: string): Promise<void> => {
  const p = (path ?? '').trim();
  if (!p) return;
  try {
    await Filesystem.deleteFile({ directory: Directory.Data, path: p });
  } catch {
    // 不存在或正占用
  }
};

/** 删除 `Directory.Data` 下与本次安装无关的 APK 缓存（立即） */
const pruneOtherApkCachesInData = async (keepRelativeNames: string[]): Promise<void> => {
  if (!isNative || !isAndroid()) return;
  const keep = new Set(keepRelativeNames.map((s) => s.trim()).filter(Boolean));
  try {
    const { files } = await Filesystem.readdir({ directory: Directory.Data, path: '' });
    for (const f of files ?? []) {
      if (f.type !== 'file') continue;
      const n = f.name;
      if (!isApkCacheDataFileName(n)) continue;
      if (keep.has(n)) continue;
      await deleteDataRelativeFile(n);
    }
  } catch {
    // readdir 失败忽略
  }
};

/** 仅 `packageInstallerSession` 成功回调后再删；Intent 路径系统可能迟延读文件，不登记删本次包 */
let pendingApkRelativeNamesForSessionSuccess: string[] = [];

/** 仅 `apkInstallIntentResult` 成功回调后再删；Intent 路径系统可能迟延读文件，不登记删本次包 */
let appUpdateInstallLifecycleListenersInited = false;

/** 仅 `packageInstallerSession` 成功回调后再删；Intent 路径系统可能迟延读文件，不登记删本次包 */
const registerPendingApkDeleteOnSessionInstallSuccess = (relativeNames: string[]): void => {
  pendingApkRelativeNamesForSessionSuccess = [
    ...new Set(relativeNames.map((s) => s.trim()).filter(Boolean))
  ];
};

/** 仅 `packageInstallerSession` 成功回调后再删；Intent 路径系统可能迟延读文件，不登记删本次包 */
const runDeferredApkSuccessCleanup = async (): Promise<void> => {
  const names = [...pendingApkRelativeNamesForSessionSuccess];
  pendingApkRelativeNamesForSessionSuccess = [];
  if (!names.length) return;
  await pruneOtherApkCachesInData(names);
  for (const n of names) {
    await deleteDataRelativeFile(n);
  }
};

/** 安装器界面已调起：可立即删「其它」旧包；本次文件在 Session / Intent 成功回调后再删 */
const onApkInstallerOpened = async (installedRelativePath: string, via?: string): Promise<void> => {
  if (!isNative || !isAndroid()) return;
  const rel = installedRelativePath.trim();
  if (!rel) return;
  await pruneOtherApkCachesInData([rel]);
  if (via === 'packageInstallerSession') {
    registerPendingApkDeleteOnSessionInstallSuccess([rel]);
  }
};

/** 仅 `apkInstallIntentResult` 成功回调后再删；Intent 路径系统可能迟延读文件，不登记删本次包 */
const runIntentApkInstallSuccessCleanup = async (fileName: string): Promise<void> => {
  const name = fileName.trim();
  if (!name) return;
  await pruneOtherApkCachesInData([name]);
  await deleteDataRelativeFile(name);
};

/**
 * 注册 OTA `set` 成功后的旧 bundle 清理、以及 Android Session 安装成功后的 APK 文件删除。
 * 须在 App 启动尽早调用（已由 `initNativeShell` 触发）。
 */
export const initAppUpdateInstallLifecycleListeners = (): void => {
  if (!Capacitor.isNativePlatform() || appUpdateInstallLifecycleListenersInited) return;
  appUpdateInstallLifecycleListenersInited = true;

  void CapacitorUpdater.addListener('set', (evt) => {
    const id = (evt.bundle?.id ?? '').trim();
    if (id) void pruneNonTargetOtaBundles(id);
  });

  if (Capacitor.getPlatform() === 'android') {
    void BWAIAppControl.addListener('apkInstallSessionResult', (evt) => {
      if (evt.status === APK_INSTALL_SESSION_STATUS_SUCCESS) {
        void runDeferredApkSuccessCleanup();
        return;
      }
      pendingApkRelativeNamesForSessionSuccess = [];
    });
    void BWAIAppControl.addListener('apkInstallIntentResult', (evt) => {
      const fn = (evt.fileName ?? '').trim();
      if (!fn) return;
      void runIntentApkInstallSuccessCleanup(fn);
    });
  }
};

/** Tab 状态（activateOtaBundleAndExitApp） */
const activateOtaBundleAndExitApp = async (bundleId: string): Promise<void> => {
  if (!isNative) return;
  if (isAndroid()) {
    try {
      await BWAIAppControl.scheduleProcessExit({ delayMs: 2400 });
    } catch (err: unknown) {
      console.warn('[activateOtaBundleAndExitApp] scheduleProcessExit failed', err);
    }
    try {
      void CapacitorUpdater.set({ id: bundleId }).catch((err: unknown) => {
        console.warn('[activateOtaBundleAndExitApp] set failed', err);
      });
    } catch (err: unknown) {
      console.warn('[activateOtaBundleAndExitApp] set threw', err);
    }
    return;
  }
  try {
    await CapacitorUpdater.set({ id: bundleId });
  } catch (err: unknown) {
    console.warn('[activateOtaBundleAndExitApp] set failed', err);
  }
};

/** 拉取接口数据（downloadAndApplyOTAFromUrl） */
export const downloadAndApplyOTAFromUrl = async (
  url: string,
  version: string,
  onProgress?: (p: FileTransferProgressPayload) => void
): Promise<{
  hasUpdate: boolean;
  version?: string;
  applied: boolean;
  error?: string;
}> => {
  if (!isNative) return { hasUpdate: false, applied: false };
  const u = (url ?? '').trim();
  const v = (version ?? '').trim();
  if (!u || !v) {
    return { hasUpdate: false, applied: false };
  }
  try {
    if (await isOtaVersionAlreadyActive(v)) {
      if (onProgress) {
        onProgress({ percent: 100, bytes: 0, totalBytes: 0, lengthComputable: false });
      }
      return { hasUpdate: false, applied: false };
    }
    const cached = await findCachedSuccessfulOtaBundle(v);
    if (cached) {
      if (onProgress) {
        onProgress({ percent: 100, bytes: 0, totalBytes: 0, lengthComputable: false });
      }
      await activateOtaBundleAndExitApp(cached.id);
      return {
        hasUpdate: true,
        version: v,
        applied: true
      };
    }
    const bundle = onProgress
      ? await capgoDownloadOtaWithProgress(u, v, onProgress)
      : await CapacitorUpdater.download({
          url: u,
          version: v
        });
    if (onProgress) {
      onProgress({ percent: 100, bytes: 0, totalBytes: 0, lengthComputable: false });
    }
    await activateOtaBundleAndExitApp(bundle.id);
    return {
      hasUpdate: true,
      version: v,
      applied: true
    };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (
      msg.includes('No new version') ||
      (
        e as {
          error?: string;
        }
      )?.error === 'no_new_version_available'
    ) {
      return { hasUpdate: false, applied: false };
    }
    return { hasUpdate: true, version: v, applied: false, error: msg };
  }
};

/** 拉取接口数据：capgoDownloadOtaWithProgress */
const capgoDownloadOtaWithProgress =
  /**
   * 使用 Capgo 从 `http(s)` 下载 OTA（与 FileTransfer 分路径不同：Android 上 Capgo 无法用 `file://` 再「下载」本地 zip）。
   * 通过插件 `download` 事件把 WorkManager 进度映射为 UI 进度。
   */
  async (
    url: string,
    version: string,
    onProgress: (p: FileTransferProgressPayload) => void
  ): Promise<{
    id: string;
  }> => {
    let listener: PluginListenerHandle | undefined;
    try {
      listener = await CapacitorUpdater.addListener(
        'download',
        (evt: CapgoDownloadProgressEvent) => {
          const bytes = evt.bytes ?? 0;
          const total = evt.contentLength ?? 0;
          const lengthComputable = !!(evt.lengthComputable && total > 0);
          let percent = 0;
          if (typeof evt.percent === 'number' && Number.isFinite(evt.percent)) {
            percent = Math.min(100, Math.max(0, Math.round(evt.percent)));
          } else if (lengthComputable) {
            percent = Math.min(100, Math.round((bytes / total) * 100));
          }
          onProgress({
            percent,
            bytes,
            totalBytes: total,
            lengthComputable
          });
        }
      );
      onProgress({ percent: 0, bytes: 0, totalBytes: 0, lengthComputable: false });
      return await CapacitorUpdater.download({ url, version });
    } finally {
      try {
        await listener?.remove();
      } catch {
        // ignore
      }
    }
  };

/** 拉取接口数据（reloadToApplyOTA） */
export const reloadToApplyOTA = async (): Promise<void> => {
  if (!isNative) return;
  void CapacitorUpdater.reload().catch(() => {
    // ignore
  });
};

/** 方法：checkNativeUpdate */
export const checkNativeUpdate = async (): Promise<{
  available: boolean;
  info?: NativeUpdateAvailable;
  error?: string;
}> => {
  if (!isNative) return { available: false };
  try {
    const result = await AppUpdate.getAppUpdateInfo();
    if (result.updateAvailability !== AppUpdateAvailability.UPDATE_AVAILABLE) {
      return { available: false };
    }
    const current =
      Capacitor.getPlatform() === 'android' ? result.currentVersionName : result.currentVersionName;
    const available =
      Capacitor.getPlatform() === 'android'
        ? (result.availableVersionName ?? result.availableVersionCode ?? '')
        : (result.availableVersionName ?? result.availableVersionCode ?? '');
    return {
      available: true,
      info: {
        currentVersion: current,
        availableVersion: available,
        immediateAllowed: result.immediateUpdateAllowed ?? false,
        flexibleAllowed: result.flexibleUpdateAllowed ?? false
      }
    };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { available: false, error: msg };
  }
};

/** 拉取接口数据（downloadAndInstallApk） */
export const downloadAndInstallApk = async (
  downloadUrl: string,
  onProgress?: (p: FileTransferProgressPayload) => void,
  /**
   * 仅当下载 URL **无法**解析出合法 `.apk` 文件名时参与落盘/缓存：`apk_cached_package_*` / `apk_cached_*`。
   * 能解析出 URL 文件名时，**仅以「本地文件名与 URL 文件名完全一致」** 判定是否跳过下载。
   */
  cacheVersion?: string
): Promise<void> => {
  if (!isNative || !isAndroid()) return;
  const MIN_APK_BYTES = 64 * 1024;
  const urlFileName = getSanitizedApkFileNameFromDownloadUrl(downloadUrl);
  const v = (cacheVersion ?? '').trim();
  const primaryName = v ? apkPrimaryCacheFileNameForPackage(v) : '';
  const legacyName = v ? apkLegacyCacheFileNameForPackage(v) : '';
  // 存于应用 files 目录（非 Cache）；有 URL 文件名时落盘名与 URL 一致，便于下次严格复用
  const destFileName = urlFileName || primaryName || `apk_update_${Date.now()}.apk`;
  const fileInfo = await Filesystem.getUri({
    directory: Directory.Data,
    path: destFileName
  });
  const destUri = fileInfo.uri;
  const tryOpenCached = async (path: string, fallbackUri: string): Promise<boolean> => {
    try {
      const st = await Filesystem.stat({
        directory: Directory.Data,
        path
      });
      if (st.type === 'file' && st.size >= MIN_APK_BYTES) {
        if (onProgress) {
          onProgress({
            percent: 100,
            bytes: st.size,
            totalBytes: st.size,
            lengthComputable: true
          });
        }
        const pathToOpen = (st.uri ?? fallbackUri).trim();
        const res = await BWAIAppControl.openApkInstaller({ filePath: pathToOpen });
        await onApkInstallerOpened(path, res?.via);
        return true;
      }
    } catch {
      // 无缓存或 stat 失败
    }
    return false;
  };
  if (urlFileName) {
    if (await tryOpenCached(urlFileName, destUri)) return;
  } else if (v) {
    if (primaryName && (await tryOpenCached(primaryName, destUri))) return;
    if (legacyName && legacyName !== primaryName && (await tryOpenCached(legacyName, destUri)))
      return;
  }
  const doDownloadAndInstall = async (progress: boolean) => {
    const result = await FileTransfer.downloadFile({
      url: downloadUrl,
      path: destUri,
      progress
    });
    const pathToOpen = (result.path ?? destUri).trim();
    const res = await BWAIAppControl.openApkInstaller({ filePath: pathToOpen });
    await onApkInstallerOpened(destFileName, res?.via);
  };
  if (onProgress) {
    const handle = await FileTransfer.addListener(
      'progress',
      (p: { bytes: number; contentLength: number; lengthComputable: boolean }) => {
        const total = p.lengthComputable && p.contentLength > 0 ? p.contentLength : 0;
        const percent =
          p.lengthComputable && p.contentLength > 0
            ? Math.min(100, Math.round((p.bytes / p.contentLength) * 100))
            : 0;
        onProgress({
          percent,
          bytes: p.bytes,
          totalBytes: total,
          lengthComputable: !!(p.lengthComputable && p.contentLength > 0)
        });
      }
    );
    try {
      await doDownloadAndInstall(true);
    } finally {
      await handle.remove();
    }
    onProgress({ percent: 100, bytes: 0, totalBytes: 0, lengthComputable: false });
  } else {
    await doDownloadAndInstall(false);
  }
};

/** startFlexibleUpdateAndAutoCompleteInstall */
const startFlexibleUpdateAndAutoCompleteInstall =
  /**
   * Android：灵活更新下载完成后自动调用 completeFlexibleUpdate，完成安装并重启应用（无需用户再点）
   */
  async (): Promise<void> => {
    let completed = false;
    const handle = await AppUpdate.addListener('onFlexibleUpdateStateChange', async (state) => {
      if (completed) return;
      const { installStatus } = state;
      if (
        installStatus === FlexibleUpdateInstallStatus.FAILED ||
        installStatus === FlexibleUpdateInstallStatus.CANCELED
      ) {
        completed = true;
        try {
          await handle.remove();
        } catch {
          // ignore
        }
        return;
      }
      if (installStatus !== FlexibleUpdateInstallStatus.DOWNLOADED) return;
      completed = true;
      try {
        await handle.remove();
      } catch {
        // ignore
      }
      try {
        await AppUpdate.completeFlexibleUpdate();
      } catch {
        // 无待安装任务等场景忽略
      }
    });
    try {
      const res = await AppUpdate.startFlexibleUpdate();
      if (res.code !== AppUpdateResultCode.OK) {
        await handle.remove();
      }
    } catch {
      try {
        await handle.remove();
      } catch {
        // ignore
      }
    }
  };

/** 方法：performNativeUpdate */
export const performNativeUpdate = async (options?: {
  /** iOS 的 App Store 应用 ID（如 123456789），不传则用当前应用） */
  iosAppId?: string;
  /** Android 安装包下载链接（由后端或配置提供）；传入则优先执行「下载 → 安装」 */
  androidApkUrl?: string;
  /**
   * Android：当 `androidApkUrl` **无法**解析出合法 `.apk` 文件名时，用此版本生成 `apk_cached_package_*` 等缓存名；
   * 能解析出 URL 文件名时，仅以「本地文件名与 URL 文件名完全一致」复用缓存，此字段不参与命中判断。
   */
  androidApkCacheVersion?: string;
  /** 下载进度回调（仅 Android 使用 androidApkUrl 时有效） */
  onApkDownloadProgress?: (p: FileTransferProgressPayload) => void;
}): Promise<void> => {
  if (!isNative) return;
  const platform = Capacitor.getPlatform();
  if (platform === 'ios') {
    await AppUpdate.openAppStore(options?.iosAppId ? { appId: options.iosAppId } : undefined);
    return;
  }
  if (platform === 'android') {
    if (options?.androidApkUrl) {
      await downloadAndInstallApk(
        options.androidApkUrl,
        options.onApkDownloadProgress,
        options.androidApkCacheVersion
      );
      return;
    }
    const { available, info } = await checkNativeUpdate();
    if (!available || !info) {
      await AppUpdate.openAppStore();
      return;
    }
    if (info.immediateAllowed) {
      await AppUpdate.performImmediateUpdate();
      return;
    }
    if (info.flexibleAllowed) {
      await startFlexibleUpdateAndAutoCompleteInstall();
      return;
    }
    await AppUpdate.openAppStore();
  }
};

/** 方法：completeFlexibleUpdate */
export const completeFlexibleUpdate = async (): Promise<void> => {
  if (!isNative || Capacitor.getPlatform() !== 'android') return;
  try {
    await AppUpdate.completeFlexibleUpdate();
  } catch {
    // 无待安装的灵活更新时会报错，忽略
  }
};

/** 方法：checkForUpdates */
export const checkForUpdates = async (): Promise<{
  native: {
    available: boolean;
    info?: NativeUpdateAvailable;
  };
  ota: {
    hasUpdate: boolean;
    version?: string;
    applied: boolean;
  };
}> => {
  const [native, ota] = await Promise.all([checkNativeUpdate(), checkAndApplyOTAUpdate()]);
  return {
    native: {
      available: native.available,
      info: native.info
    },
    ota: {
      hasUpdate: ota.hasUpdate,
      version: ota.version,
      applied: ota.applied
    }
  };
};

/** isAppNative */
export const isAppNative = (): boolean => {
  return isNative;
};

/** 方法：clearAppCache */
export const clearAppCache = async (): Promise<{
  success: boolean;
  clearedCount?: number;
  error?: string;
}> => {
  if (!isNative) return { success: true, clearedCount: 0 };
  try {
    const { files } = await Filesystem.readdir({
      directory: Directory.Cache,
      path: ''
    });
    let cleared = 0;
    for (const f of files ?? []) {
      try {
        if (f.type === 'directory') {
          await Filesystem.rmdir({
            directory: Directory.Cache,
            path: f.name,
            recursive: true
          });
        } else {
          await Filesystem.deleteFile({
            directory: Directory.Cache,
            path: f.name
          });
        }
        cleared += 1;
      } catch {
        // 单条删除失败（如被占用）时跳过，继续清理其余
      }
    }
    return { success: true, clearedCount: cleared };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, error: msg };
  }
};
