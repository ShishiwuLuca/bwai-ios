import { Capacitor } from '@capacitor/core';
import { isNative } from '/@/hooks/useAppInfo';
import { syncCombinedAppIconBadge } from '/@/utils/appNativeNotify';

/** skipCapawesomeBadgeOnThisRuntime */
const skipCapawesomeBadgeOnThisRuntime = (): boolean => {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
};

/** 方法：ensureBadgePlugin */
const ensureBadgePlugin = async () => {
  const mod = await import('@capawesome/capacitor-badge').catch(() => null);
  return mod?.Badge ?? null;
};

/** 事件或回调处理：normalizeAppIconBadgeCount */
export const normalizeAppIconBadgeCount = (n: unknown): number => {
  const v = typeof n === 'number' ? n : Number(n);
  return Number.isFinite(v) ? Math.max(0, Math.min(Math.floor(v), 99999)) : 0;
};

/** 清除角标（登出等场景） */
export const clearAppIconBadge = async (): Promise<void> => {
  if (!isNative) return;
  if (skipCapawesomeBadgeOnThisRuntime()) return;
  try {
    const Badge = await ensureBadgePlugin();
    if (!Badge) return;
    const { isSupported } = await Badge.isSupported();
    if (!isSupported) return;
    await Badge.clear();
  } catch {
    /* 插件未同步或权限异常时忽略 */
  }
};

/**
 * 将已知未读数写到桌面角标（已请求过 unread-count 时调用，避免重复请求）
 */
export const setAppIconBadgeCount = async (raw: unknown): Promise<void> => {
  if (!isNative) return;
  if (skipCapawesomeBadgeOnThisRuntime()) return;
  try {
    const Badge = await ensureBadgePlugin();
    if (!Badge) return;
    const { isSupported } = await Badge.isSupported();
    if (!isSupported) return;
    await Badge.set({ count: normalizeAppIconBadgeCount(raw) });
  } catch {
    /* 忽略 */
  }
};

/**
 * 请求服务端「我的消息」未读数并同步桌面角标（含「待处理应用更新」+1，见 appNativeNotify）
 */
export const syncAppIconBadgeWithUnreadCount = async (): Promise<void> => {
  await syncCombinedAppIconBadge();
};
