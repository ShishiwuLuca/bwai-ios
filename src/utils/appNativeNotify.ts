/**
 * 原生 APP：系统本地通知 + 桌面角标（未读消息 + 待处理应用更新）的统一入口。
 * - 业务侧优先调用本模块方法，避免分散调用角标/通知插件。
 */
import { isNative } from '/@/hooks/useAppInfo';
import {
  cancelAppUpdateAvailableNativeNotification,
  notifyAppUpdateAvailableNative,
  useAppNotification
} from '/@/hooks/useAppNotification';
import { useMessage } from '/@/hooks/web/useMessage';
import { getMyMessageUnreadCount } from '/@/service/Notice';
import { useUserStoreWithOut } from '/@/stores/modules/UserConfig';
import { normalizeAppIconBadgeCount, setAppIconBadgeCount } from '/@/utils/appIconBadge';

/** 桌面角标：在「我的消息」未读数基础上，有待处理的应用更新时再 +1 */
let appPendingUpdateForBadge = false;

/** setAppPendingUpdateForBadge */
export const setAppPendingUpdateForBadge = (pending: boolean): void => {
  appPendingUpdateForBadge = pending;
};

/** getAppPendingUpdateForBadge */
export const getAppPendingUpdateForBadge = (): boolean => {
  return appPendingUpdateForBadge;
};

/** 事件或回调处理（syncCombinedAppIconBadge） */
export const syncCombinedAppIconBadge = async (): Promise<void> => {
  if (!isNative) return;
  try {
    if (!useUserStoreWithOut().getToken) {
      const base = 0;
      const extra = appPendingUpdateForBadge ? 1 : 0;
      await setAppIconBadgeCount(base + extra);
      return;
    }
    const res = await getMyMessageUnreadCount();
    if (Number(res.code) !== 0) return;
    const base = normalizeAppIconBadgeCount(res.data);
    const extra = appPendingUpdateForBadge ? 1 : 0;
    await setAppIconBadgeCount(base + extra);
  } catch {
    /* 未登录 401、网络异常、角标插件异常等：不向外抛，避免 Uncaught (in promise) */
  }
};

/** 提示与弹窗（applyAppIconBadgeFromMessageUnreadCount） */
export const applyAppIconBadgeFromMessageUnreadCount = async (raw: unknown): Promise<void> => {
  if (!isNative) return;
  try {
    const base = normalizeAppIconBadgeCount(raw);
    const extra = appPendingUpdateForBadge ? 1 : 0;
    await setAppIconBadgeCount(base + extra);
  } catch {
    /* 角标插件异常等不向外抛 */
  }
};

/** 方法：postAppUpdateReminderNative */
export const postAppUpdateReminderNative = async (title: string, body: string): Promise<void> => {
  setAppPendingUpdateForBadge(true);
  await notifyAppUpdateAvailableNative(title, body);
  await syncCombinedAppIconBadge();
};

/** 方法：clearAppUpdatePendingBadgeAndSync */
export const clearAppUpdatePendingBadgeAndSync = async (): Promise<void> => {
  setAppPendingUpdateForBadge(false);
  await cancelAppUpdateAvailableNativeNotification();
  await syncCombinedAppIconBadge();
};

/** 方法：resetNativeUpdateReminderOnLogout */
export const resetNativeUpdateReminderOnLogout = async (): Promise<void> => {
  setAppPendingUpdateForBadge(false);
  await cancelAppUpdateAvailableNativeNotification();
};

/** clipText */
const clipText = (s: string, max: number): string => {
  const v = s.trim();
  if (v.length <= max) return v;
  return `${v.slice(0, Math.max(0, max - 1))}…`;
};

/** WsSystemPushTone：类型别名 */
export type WsSystemPushTone = 'success' | 'warning' | 'danger';

/** presentWsSystemPushOnNative */
export const presentWsSystemPushOnNative = (
  title: string,
  body: string,
  tone: WsSystemPushTone = 'success'
): void => {
  if (!isNative) return;
  const { CreateSuccessNotify, CreateWarningNotify, CreateErrorNotify } = useMessage();
  const { send } = useAppNotification();
  const bubbleText = clipText(body || title, 120);
  if (!bubbleText) return;
  if (tone === 'success') CreateSuccessNotify(bubbleText);
  else if (tone === 'warning') CreateWarningNotify(bubbleText);
  else CreateErrorNotify(bubbleText);
  void send({
    title: clipText(title || body, 48),
    body: clipText(body || title, 200),
    extra: { source: 'member_ws' }
  });
};
