/**
 * iOS：VPN / 网络切换后 API 失败常触发 Toast 合成层卡死，需监听网络变化并修复 WebView 绘制层。
 */
import { Capacitor } from '@capacitor/core';
import { closeToast } from 'vant';
import { isIOSNativeWebView, scheduleIOSWebViewRepaint } from '/@/utils/iosWebViewRepaint';

let started = false;

/** 注册原生网络变化与应用回前台时的 WebView 修复（仅 iOS，只初始化一次） */
export const initIOSNetworkChangeRepair = (): void => {
  if (!isIOSNativeWebView() || started || typeof window === 'undefined') return;
  started = true;

  const repair = (): void => {
    closeToast(true);
    scheduleIOSWebViewRepaint();
  };

  void import('@capacitor/network')
    .then(({ Network }) =>
      Network.addListener('networkStatusChange', ({ connected }) => {
        if (connected) repair();
      })
    )
    .catch(() => {
      /* 插件不可用时忽略 */
    });

  void import('@capacitor/app')
    .then(({ App }) =>
      App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) repair();
      })
    )
    .catch(() => {
      /* 插件不可用时忽略 */
    });

  if (Capacitor.isNativePlatform()) {
    window.addEventListener('online', repair);
  }
};
