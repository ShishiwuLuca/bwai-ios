/**
 * App 更新 WebSocket(`/user/ws` 会员通道):上行根级 `action: "subscribe_update"` + snake_case 字段；
 * 处理 `subscribe_update_result`；下行版本推送 `app.resource.updated`（及兼容 `app.package.updated`），
 * 业务体多在 `content.data`（`type` / `action` 可在根或嵌套）。
 * 对接说明见「会员端 WebSocket 订阅app更新」文档（勿再使用 `{ type, content }` 订阅格式）。
 */
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import {
  collectCheckVersionRequestBody,
  formatVersionBadgeForUpdate
} from '/@/utils/serverAppVersionCheck';
import {
  useSystemStoreWithOut,

  /** AppUpdateDialogPayload：类型别名 */
  type AppUpdateDialogPayload,

  /** AppUpdateDialogUpdateType：类型别名 */
  type AppUpdateDialogUpdateType
} from '/@/stores/modules/SystemConfig';
import { useUserStoreWithOut } from '/@/stores/modules/UserConfig';
import { useWebSocketStoreWithOut } from '/@/stores/modules/WebSocket';
import { WS_CHANNEL_MEMBER } from '/@/utils/websocketUrl';
import { getI18n } from '/@/locales/i18nInstance';
import { normalizeApiPlatformName } from '/@/utils/http/clientTypeLabel';
import { tryAutoStartAppUpdateFromWsPayload } from '/@/logics/appNativeIntegration';
import { postAppUpdateReminderNative } from '/@/utils/appNativeNotify';

/** wsTranslate */
const wsTranslate = (key: string): string => {
  /** inst */
  const inst = getI18n();

  /** tFn */
  const tFn = inst?.global?.t as ((k: string) => unknown) | undefined;

  /** raw */
  const raw = tFn?.(key);
  return raw != null && String(raw) !== '' ? String(raw) : key;
};

/**
 * 会员 TCP 会话代数:仅在会员 WS 断开时递增,用于丢弃断线后仍到达的 `subscribe_update_result`。
 * `subscribe_update` 策略:同一连接上最多发一帧；进入 pending 后禁止重复发；收到成功 ack 后本会话永久不再发,直至下次断开重连。
 */
let otaMemberWsSubscribeSessionGen = 0;

/** 当前会话内 `subscribe_update` 状态 */
let otaSubscribePhase: 'idle' | 'pending' | 'success' = 'idle';

/** 已发出订阅、等待 ack 时的会话代数(与 {@link otaMemberWsSubscribeSessionGen} 一致才处理 ack) */
let otaSubscribeSentSessionGen = -1;

/** 防止并行两次 `collectCheckVersionRequestBody` 导致双发 */
let otaSubscribeSendLocked = false;

/** resetOtaMemberAppUpdateSubscribeSession */
export const resetOtaMemberAppUpdateSubscribeSession = (): void => {
  otaMemberWsSubscribeSessionGen += 1;
  otaSubscribePhase = 'idle';
  otaSubscribeSentSessionGen = -1;
  otaSubscribeSendLocked = false;
};

/** firstString */
const firstString = (...vals: unknown[]): string => {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
};

/** parseBool */
const parseBool = (...vals: unknown[]): boolean | undefined => {
  for (const v of vals) {
    if (typeof v === 'boolean') return v;
    if (typeof v === 'number') return v === 1;
    if (typeof v === 'string') {
      const s = v.toLowerCase();
      if (s === 'true' || s === '1' || s === 'yes') return true;
      if (s === 'false' || s === '0' || s === 'no') return false;
    }
  }
  return undefined;
};

/** asRecord */
const asRecord = (v: unknown): Record<string, unknown> | undefined => {
  return v && typeof v === 'object' ? (v as Record<string, unknown>) : undefined;
};

/** collectWsEventTypeCandidates */
const collectWsEventTypeCandidates = (obj: Record<string, unknown>): string[] => {
  /** 常量或静态配置：out */
  const out: string[] = [];

  /** push */
  const push = (s: unknown): void => {
    const t = String(s ?? '').trim();
    if (t) out.push(t);
  };
  push(obj.type);
  push(obj.event);
  push(obj.cmd);
  push(obj.action);

  /** c */
  const c = asRecord(obj.content);
  if (c) {
    push(c.type);
    push(c.event);
    push(c.cmd);
    push(c.action);
    const cd = asRecord(c.data);
    if (cd) {
      push(cd.type);
      push(cd.event);
      push(cd.cmd);
      push(cd.action);
    }
  }

  /** d */
  const d = asRecord(obj.data);
  if (d) {
    push(d.type);
    push(d.event);
    push(d.cmd);
    push(d.action);
    const dd = asRecord(d.data);
    if (dd) {
      push(dd.type);
      push(dd.event);
      push(dd.action);
    }
  }
  return out;
};

/** frameHasEventTypeNorm */
const frameHasEventTypeNorm = (obj: Record<string, unknown>, want: string): boolean => {
  /** w */
  const w = want.toLowerCase();
  return collectWsEventTypeCandidates(obj).some((t) => t.toLowerCase() === w);
};

/** 事件或回调处理：resolveMemberWsVersionFrameTypeKey */
const resolveMemberWsVersionFrameTypeKey = (obj: Record<string, unknown>): string => {
  for (const c of collectWsEventTypeCandidates(obj)) {
    const low = c.toLowerCase();
    if (low === 'app.resource.updated' || low === 'app.package.updated') return low;
  }

  /** first */
  const first = collectWsEventTypeCandidates(obj)[0];
  return (first ?? '').toLowerCase();
};

/** extractAppUpdateInner */
const extractAppUpdateInner = (root: Record<string, unknown>): Record<string, unknown> | null => {
  /** c */
  const c = asRecord(root.content);
  if (c) {
    const data = asRecord(c.data);
    if (data && Object.keys(data).length > 0) return data;
    return c;
  }

  /** d0 */
  const d0 = asRecord(root.data);
  if (d0 && Object.keys(d0).length > 0) return d0;
  return root;
};

/** wsAppUpdateAppliesToThisDevice */
const wsAppUpdateAppliesToThisDevice = (data: Record<string, unknown>): boolean => {
  /** cap */
  const cap = Capacitor.getPlatform();
  if (cap !== 'android' && cap !== 'ios') return false;

  /** target */
  const target = asRecord(data.target);
  if (!target) return true;

  /** platforms */
  const platforms = target.platforms;
  if (Array.isArray(platforms) && platforms.length > 0) {
    const allowed = platforms.map((p) => String(p).trim().toLowerCase());
    if (!allowed.includes(cap)) return false;
  }

  /** 用户或路由 uid：uids */
  const uids = target.uids;
  if (Array.isArray(uids) && uids.length > 0) {
    const UserStore = useUserStoreWithOut();
    const user = UserStore.getUserInfo as Record<string, unknown>;
    const rawUid = user?.id ?? user?.uid;
    const uid = rawUid != null && String(rawUid).trim() !== '' ? String(rawUid).trim() : '';
    if (!uid) return false;
    const set = new Set(uids.map((u) => String(u).trim()));
    if (!set.has(uid)) return false;
  }
  return true;
};

/** buildSubscribeUpdateContent */
export const buildSubscribeUpdateContent = (
  body: Awaited<ReturnType<typeof collectCheckVersionRequestBody>>
): Record<string, string> => {
  return {
    package_version: body.package_version,
    source_version: body.source_version,
    platform_name: normalizeApiPlatformName(body.platform_name),
    uid: body.uid != null && String(body.uid).trim() !== '' ? String(body.uid).trim() : '',
    timezone: body.timezone,
    lang: body.lang,
    network: body.network.trim().toLowerCase(),
    system_version: body.system_version,
    ua: body.ua,
    vendor_name: body.vendor_name,
    device_name: body.device_name,
    system_ui_name: body.system_ui_name,
    ui_version: body.ui_version
  };
};

/** buildSubscribeUpdateFrame */
export const buildSubscribeUpdateFrame = (
  body: Awaited<ReturnType<typeof collectCheckVersionRequestBody>>
): string => {
  /** fields */
  const fields = buildSubscribeUpdateContent(body);
  return JSON.stringify({ action: 'subscribe_update', ...fields });
};

/** 方法：sendAppUpdateSubscribeIfConnected */
export const sendAppUpdateSubscribeIfConnected = async (): Promise<void> => {
  if (!Capacitor.isNativePlatform()) return;

  /** WebSocketStore */
  const WebSocketStore = useWebSocketStoreWithOut();

  /** st */
  const st = WebSocketStore.getChannelState(WS_CHANNEL_MEMBER);
  if (!st?.connected) {
    return;
  }
  if (otaSubscribePhase === 'success') {
    return;
  }
  if (otaSubscribePhase === 'pending') {
    return;
  }
  if (otaSubscribeSendLocked) {
    return;
  }

  /** 事件或回调处理：sessionAtEnter */
  const sessionAtEnter = otaMemberWsSubscribeSessionGen;
  otaSubscribeSendLocked = true;
  try {
    const body = await collectCheckVersionRequestBody();
    if (sessionAtEnter !== otaMemberWsSubscribeSessionGen) {
      return;
    }
    const st2 = WebSocketStore.getChannelState(WS_CHANNEL_MEMBER);
    if (!st2?.connected) {
      return;
    }
    if (otaSubscribePhase !== 'idle') {
      return;
    }
    const fields = buildSubscribeUpdateContent(body);
    const frame = JSON.stringify({ action: 'subscribe_update', ...fields });
    otaSubscribePhase = 'pending';
    otaSubscribeSentSessionGen = otaMemberWsSubscribeSessionGen;
    WebSocketStore.sendChannel(WS_CHANNEL_MEMBER, frame);
  } catch {
    otaSubscribePhase = 'idle';
    otaSubscribeSentSessionGen = -1;
  } finally {
    otaSubscribeSendLocked = false;
  }
};

/** 方法：openUpdateDialogFromWsData */
const openUpdateDialogFromWsData = async (
  inner: Record<string, unknown>,
  frameTypeKey: string
): Promise<void> => {
  /** SystemStore */
  const SystemStore = useSystemStoreWithOut();

  /** frameNorm */
  const frameNorm = frameTypeKey.toLowerCase();

  /** updateTypeRaw */
  const updateTypeRaw = firstString(inner.updateType, inner.update_type).toLowerCase();

  /** updateType */
  let updateType: AppUpdateDialogUpdateType | '' =
    updateTypeRaw === 'resource' ? 'resource' : updateTypeRaw === 'package' ? 'package' : '';
  if (!updateType) {
    if (frameNorm === 'app.package.updated') updateType = 'package';
    else if (frameNorm === 'app.resource.updated') updateType = 'resource';
  }
  if (!updateType) {
    return;
  }

  /** version */
  const version = firstString(
    inner.version,
    inner.resourceVersion,
    inner.resource_version,
    inner.packageVersion,
    inner.package_version,
    inner.targetVersion,
    inner.target_version,
    inner.otaVersion,
    inner.ota_version,
    inner.build
  );

  /** 拉取接口数据：downloadUrl */
  const downloadUrl = firstString(
    inner.resourceUrl,
    inner.resource_url,
    inner.downloadUrl,
    inner.download_url,
    inner.packageDownloadUrl,
    inner.package_download_url,
    inner.apkUrl,
    inner.apk_url,
    inner.otaUrl,
    inner.ota_url,
    inner.hotUpdateUrl,
    inner.hot_update_url,
    inner.sourcePackageUrl,
    inner.source_package_url
  );
  if (!downloadUrl) {
    return;
  }

  /** forceUpdate */
  const forceUpdate =
    parseBool(inner.forceUpdate, inner.force_update) ??
    parseBool(inner.mustUpdate, inner.must_update) ??
    false;

  /** 提示与弹窗：message */
  const message = firstString(inner.message);

  /** 列表数据：contentList */
  const contentList = message ? [message] : [wsTranslate('app_version_update_hint')];

  /** 解构赋值：组合式 API 返回的一组方法或状态 */
  const [appInfo, body] = await Promise.all([
    App.getInfo().catch(() => null),
    collectCheckVersionRequestBody().catch(() => null)
  ]);

  /** currentVersion */
  const currentVersion =
    (appInfo?.version ?? '').trim() ||
    (appInfo?.build ?? '').trim() ||
    (body?.package_version ?? '').trim() ||
    '';

  /** rawVer */
  const rawVer = version.replace(/^v/i, '');

  /** newVersion */
  const newVersion =
    version.trim() !== ''
      ? formatVersionBadgeForUpdate(version)
      : formatVersionBadgeForUpdate(wsTranslate('app_version_new_available'));

  /** platform */
  const platform = Capacitor.getPlatform();

  /** isAndroid */
  const isAndroid = platform === 'android';

  /** 常量或静态配置：拉取接口数据 */
  const dialogPayload: AppUpdateDialogPayload = {
    currentVersion: formatVersionBadgeForUpdate(currentVersion),
    newVersion,
    contentList,
    forceUpdate,
    updateType,
    downloadUrl,
    serverVersion: rawVer.trim() || undefined,
    androidApkUrl: updateType === 'package' && isAndroid ? downloadUrl : undefined,
    iosStoreUrl: updateType === 'package' && !isAndroid ? downloadUrl : undefined,
    iosAppStoreId:
      firstString(inner.iosAppStoreId, inner.ios_app_id, inner.appStoreId, inner.app_store_id) ||
      undefined
  };
  SystemStore.openAppUpdateDialog(dialogPayload);

  /** 常量或静态配置：notifyTitle */
  const notifyTitle = [
    wsTranslate('app_version_new_available'),
    dialogPayload.newVersion ? String(dialogPayload.newVersion) : ''
  ]
    .filter((s) => String(s).trim())
    .join(' · ');

  /** notifyBody */
  const notifyBody = (
    contentList.length > 0 ? contentList : [wsTranslate('app_version_update_hint')]
  )
    .map((s) => String(s).trim())
    .filter(Boolean)
    .join('\n');
  void postAppUpdateReminderNative(
    notifyTitle || wsTranslate('app_version_new_available'),
    notifyBody
  );
  tryAutoStartAppUpdateFromWsPayload(dialogPayload);
};

/** 环境变量（handleAppResourceUpdatedEnvelope） */
const handleAppResourceUpdatedEnvelope = async (root: Record<string, unknown>): Promise<void> => {
  /** 键名或缓存键：typeKey */
  const typeKey = resolveMemberWsVersionFrameTypeKey(root);

  /** inner */
  const inner = extractAppUpdateInner(root);
  if (!inner || Object.keys(inner).length === 0) {
    return;
  }
  if (!wsAppUpdateAppliesToThisDevice(inner)) {
    return;
  }

  /** cWrap */
  const cWrap = asRecord(root.content);

  /** dialogInner */
  let dialogInner = inner;
  if (cWrap && Array.isArray(cWrap.bizIds) && cWrap.bizIds.length >= 2) {
    const fromBiz = String(cWrap.bizIds[1] ?? '').trim();
    const hasVer =
      firstString(inner.version, inner.resource_version, inner.package_version, inner.build) !== '';
    if (fromBiz && !hasVer) {
      dialogInner = { ...inner, version: fromBiz };
    }
  }
  await openUpdateDialogFromWsData(dialogInner, typeKey);
};

/** handleSubscribeUpdateResult */
const handleSubscribeUpdateResult = (root: Record<string, unknown>): void => {
  if (otaSubscribePhase !== 'pending') {
    return;
  }
  if (otaSubscribeSentSessionGen !== otaMemberWsSubscribeSessionGen) {
    return;
  }

  /** actRoot */
  const actRoot = String(root.action ?? '')
    .trim()
    .toLowerCase();

  /** content */
  let content =
    asRecord(root.content) ??
    asRecord(root.data) ??
    (actRoot === 'subscribe_update_result' ? root : undefined);
  if (!content) {
    otaSubscribePhase = 'idle';
    otaSubscribeSentSessionGen = -1;
    return;
  }

  /** err */
  const err = firstString(content.error, root.error);
  if (err) {
    otaSubscribePhase = 'idle';
    otaSubscribeSentSessionGen = -1;
  } else {
    otaSubscribePhase = 'success';
    otaSubscribeSentSessionGen = -1;
  }
};

/** 提示与弹窗：handleAppUpdateWsMessage */
export const handleAppUpdateWsMessage = (raw: string | ArrayBuffer | null): void => {
  if (!Capacitor.isNativePlatform()) return;
  if (!raw || typeof raw !== 'string') return;

  /** 拉取接口数据：payload */
  let payload: unknown;
  try {
    payload = JSON.parse(raw) as unknown;
  } catch {
    return;
  }
  if (!payload || typeof payload !== 'object') return;

  /** obj */
  const obj = payload as Record<string, unknown>;
  if (frameHasEventTypeNorm(obj, 'subscribe_update_result')) {
    handleSubscribeUpdateResult(obj);
    return;
  }
  if (
    frameHasEventTypeNorm(obj, 'app.resource.updated') ||
    frameHasEventTypeNorm(obj, 'app.package.updated')
  ) {
    void handleAppResourceUpdatedEnvelope(obj);
  }
};
