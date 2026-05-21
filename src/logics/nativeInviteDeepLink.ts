import type { Router } from 'vue-router';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';

/** normalizeInviteCode */
const normalizeInviteCode = (value: unknown): string => {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, 8);
};

/** 方法：routeFromOpenUrl */
const routeFromOpenUrl = async (openUrl: string, router: Router): Promise<void> => {
  if (!openUrl) return;
  try {
    const parsed = new URL(openUrl);
    const pathname = parsed.pathname || '/';
    const inviteCode = normalizeInviteCode(
      parsed.searchParams.get('InviteCode') || parsed.searchParams.get('inviteCode')
    );
    // 邀请注册链接：强制跳转注册页并回填邀请码
    if (pathname.toLowerCase() === '/register') {
      await router.replace({
        path: '/Register',
        query: inviteCode ? { InviteCode: inviteCode } : {}
      });
      return;
    }
    // 其它站内路径：尽量按 pathname + query 跳转
    await router.replace({
      path: pathname,
      query: Object.fromEntries(parsed.searchParams.entries())
    });
  } catch (e) {
    console.warn('[deeplink] parse url failed:', openUrl, e);
  }
};

/** 方法：setupNativeInviteDeepLink */
export const setupNativeInviteDeepLink = async (router: Router): Promise<void> => {
  if (!Capacitor.isNativePlatform()) return;
  // 冷启动（应用被链接拉起）
  try {
    const launch = await CapacitorApp.getLaunchUrl();
    if (launch?.url) {
      await routeFromOpenUrl(launch.url, router);
    }
  } catch (e) {
    console.warn('[deeplink] getLaunchUrl:', e);
  }
  // 热启动（应用已在前后台）
  CapacitorApp.addListener('appUrlOpen', ({ url }) => {
    void routeFromOpenUrl(url, router);
  });
};
