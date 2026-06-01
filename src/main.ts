import App from './App.vue';
import { createApp } from 'vue';
import { Lazyload } from 'vant';

// 低版本兼容与样式
import 'core-js/stable';

// 样式
import 'virtual:uno.css';

// Vant 样式
import 'vant/lib/index.css';

// 全局样式
import '/@/design/index.less';

// 运行时
import 'regenerator-runtime/runtime';

// 应用基础能力
import { setupStore } from '/@/stores';

// 原生平台
import { Capacitor } from '@capacitor/core';

// 路由
import { setupRouter, router } from '/@/router';

// 国际化
import { setupI18n } from '/@/locales/setupI18n';

// 初始化应用配置
import { initAppConfigStore } from '/@/logics/initAppConfig';

// 创建 HTTP 守卫/消息守卫
import { createHttpGuard, createMessageGuard } from '/@/hooks/setting';

// 系统配置
import { useSystemStoreWithOut } from '/@/stores/modules/SystemConfig';

// 原生：应用状态栏主题适配
import { applyNativeStatusBarForTheme } from '/@/hooks/AppStatusBarUtils';
import { isIOSNativeWebView, scheduleIOSWebViewRepaint } from '/@/utils/iosWebViewRepaint';

// 原生邀请码 deep link
import { setupNativeInviteDeepLink } from '/@/logics/nativeInviteDeepLink';

// 马甲包配置（冷启动路由判断用）
import { ensureVestConfigLoaded } from '/@/utils/vestConfig';

// 原生壳能力（safe-area / 状态栏 / splash hide 等）
import {
  applyNativeSafeArea,
  initNativeShell,
  hideSplashScreenIfNative
} from '/@/logics/nativeAppShell';
import { initIOSNetworkChangeRepair } from '/@/logics/iosNetworkRepair';

// 创建并启动 Vue 应用

/** 方法：bootstrapApp */
const bootstrapApp = async () => {
  if (!Capacitor.isNativePlatform()) {
    await import('@vant/touch-emulator');
  }

  const app = createApp(App);

  // 全局错误处理
  app.config.errorHandler = (err: unknown, _instance: unknown, info: string) => {
    console.error('[Vue Error]', info, err);
  };

  // 初始化 Pinia Store
  setupStore(app);

  // 初始化基础数据
  initAppConfigStore();

  // 初始化国际语言
  await setupI18n(app);

  // 初始化路由
  setupRouter(app);

  // 预拉马甲包配置，减少首屏路由守卫等待
  void ensureVestConfigLoaded();

  // 初始化邀请码 deep link
  await router.isReady();

  // 初始化邀请码 deep link
  await setupNativeInviteDeepLink(router);

  // 切换界面的时候是否取消已经发送但是未响应的 http 请求
  createHttpGuard(router);

  // 切换界面的时候是否删除未关闭的 Dialog / Toast / Notify
  createMessageGuard(router);

  // 注册 Vant 懒加载（iOS 原生关闭 lazyComponent，避免首屏合成层异常）
  app.use(Lazyload, {
    lazyComponent: !isIOSNativeWebView()
  });

  // 挂载应用
  app.mount('#app');

  // 原生环境：Vue 挂载完成后再隐藏启动图，避免启动图和首屏内容之间出现白屏
  await hideSplashScreenIfNative();

  if (Capacitor.isNativePlatform()) {
    void applyNativeStatusBarForTheme(useSystemStoreWithOut().getDarkMode);
  }

  if (isIOSNativeWebView()) {
    scheduleIOSWebViewRepaint();
  }
};

// 原生 safe-area 适配
applyNativeSafeArea();

// 初始化原生 shell
initNativeShell();

// iOS：VPN / 网络切换后修复 WebView 合成层
initIOSNetworkChangeRepair();

// 启动应用
void bootstrapApp();
