import App from './App.vue';
import { createApp } from 'vue';
import { Lazyload } from 'vant';

// 低版本兼容与样式
import 'core-js/stable';

// 样式
import 'virtual:uno.css';

// Vant 样式
import 'vant/lib/index.css';

// Vant 触摸模拟
import '@vant/touch-emulator';

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

// 原生：启动后通知应用已准备好
import { notifyAppReady } from '/@/utils/appUpdate';

// 初始化应用配置
import { initAppConfigStore } from '/@/logics/initAppConfig';

// 创建 HTTP 守卫/消息守卫
import { createHttpGuard, createMessageGuard } from '/@/hooks/setting';

// 系统配置
import { useSystemStoreWithOut } from '/@/stores/modules/SystemConfig';

// 原生：应用状态栏主题适配
import { applyNativeStatusBarForTheme } from '/@/hooks/AppStatusBarUtils';

// 原生邀请码 deep link
import { setupNativeInviteDeepLink } from '/@/logics/nativeInviteDeepLink';

// 原生：启动后服务端版本检测（checkVersion）
import { scheduleNativePostBootUpdates } from '/@/logics/nativePostBootUpdates';

// 原生壳能力（safe-area / 状态栏 / splash hide 等）
import {
  applyNativeSafeArea,
  initNativeShell,
  hideSplashScreenIfNative
} from '/@/logics/nativeAppShell';

// 创建并启动 Vue 应用

/** 方法：bootstrapApp */
const bootstrapApp = async () => {
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

  // 初始化邀请码 deep link
  await router.isReady();

  // 初始化邀请码 deep link
  await setupNativeInviteDeepLink(router);

  // 切换界面的时候是否取消已经发送但是未响应的 http 请求
  createHttpGuard(router);

  // 切换界面的时候是否删除未关闭的 Dialog / Toast / Notify
  createMessageGuard(router);

  // 注册 Vant 懒加载
  app.use(Lazyload, {
    lazyComponent: true
  });

  // 挂载应用
  app.mount('#app');

  // 原生环境：Vue 挂载完成后再隐藏启动图，避免启动图和首屏内容之间出现白屏
  await hideSplashScreenIfNative();

  // 启动图关闭后再 ack 一次：Capgo OTA reload 后 native 侧可能在 WebView 首帧后才挂好「等 notifyAppReady」，
  // 仅 initNativeShell 里过早调用可能被错过，导致超时回滚与黑屏。
  if (Capacitor.isNativePlatform()) {
    void notifyAppReady();
    void applyNativeStatusBarForTheme(useSystemStoreWithOut().getDarkMode);
  }
};

// 原生 safe-area 适配
applyNativeSafeArea();

// 初始化原生 shell
initNativeShell();

// 启动应用
void bootstrapApp();

// 启动后检查服务端版本（仅原生环境，懒加载避免启动时插件异常闪退）
scheduleNativePostBootUpdates();
