import { Capacitor } from '@capacitor/core';
import type { BadgePlugin } from '@capawesome/capacitor-badge';
import { isNative } from '/@/hooks/useAppInfo';
import { syncCombinedAppIconBadge } from '/@/utils/appNativeNotify';

/** skipCapawesomeBadgeOnThisRuntime */
const skipCapawesomeBadgeOnThisRuntime = (): boolean => {
  if (!Capacitor.isNativePlatform()) return false;
  // Android 侧由通知渠道等处理，不走 capawesome Badge
  if (Capacitor.getPlatform() === 'android') return true;
  // iOS 原生未同步进安装包时，Capacitor 会报 "Badge.* is not implemented"
  if (!Capacitor.isPluginAvailable('Badge')) return true;
  return false;
};

/**
 * 加载 Badge 插件。勿用 async 直接 return 插件代理：Capacitor Proxy 带 .then，
 * async 返回时会被当成 thenable 再展开，从而触发 "Badge.then() is not implemented"。
 */
const ensureBadgePlugin = (): Promise<BadgePlugin | null> => {
  if (skipCapawesomeBadgeOnThisRuntime()) return Promise.resolve(null);
  return import('@capawesome/capacitor-badge')
    .then((mod) => mod?.Badge ?? null)
    .catch(() => null);
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
  try {
    await syncCombinedAppIconBadge();
  } catch {
    /* 避免 void syncAppIconBadgeWithUnreadCount() 产生 Uncaught (in promise) */
  }
};
