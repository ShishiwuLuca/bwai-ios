import { Capacitor } from '@capacitor/core';
import { isNative } from '/@/hooks/useAppInfo';

const skipCapawesomeBadgeOnThisRuntime = (): boolean => {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
};

const ensureBadgePlugin = async () => {
  const mod = await import('@capawesome/capacitor-badge').catch(() => null);
  return mod?.Badge ?? null;
};

export const normalizeAppIconBadgeCount = (n: unknown): number => {
  const v = typeof n === 'number' ? n : Number(n);
  return Number.isFinite(v) ? Math.max(0, Math.min(Math.floor(v), 99999)) : 0;
};

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
    // ignore
  }
};

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
    // ignore
  }
};

/** 同步桌面角标（不再请求服务端未读数，默认清零） */
export const syncAppIconBadgeWithUnreadCount = async (): Promise<void> => {
  await setAppIconBadgeCount(0);
};
