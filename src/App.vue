<template>
  <ConfigProvider :theme="ThemeMode" :theme-vars="ThemeVars" theme-vars-scope="global">
    <RouterView v-slot="{ Component, route }">
      <!-- <Transition :name="transitionName" mode="out-in" appear> -->
      <KeepAlive v-if="route.meta.keepAlive">
        <component :is="Component" :key="route.fullPath" />
      </KeepAlive>
      <component :is="Component" :key="route.fullPath" v-else />
      <!-- </Transition> -->
    </RouterView>
    <LocaleModal />
    <Loading />
  </ConfigProvider>
  <CheckUpdates v-if="isOpenDefaultCheckUpdate" />
  <AppUpdateDialog @update="onAppUpdateDialogPerformUpdate" />
</template>

<script setup lang="ts">
  import { parse } from 'tldts';
  // import VConsole from 'vconsole';
  import { RouterView } from 'vue-router';
  import { Capacitor } from '@capacitor/core';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { getAppEnvConfig, isProdMode } from '/@/utils/env';
  import { getClientDeviceIdAsync } from '/@/utils/clientDeviceId';
  import { useUserStoreWithOut } from '/@/stores/modules/UserConfig';
  import { type ConfigProviderThemeVars, ConfigProvider } from 'vant';
  import { useSystemStoreWithOut } from '/@/stores/modules/SystemConfig';
  import { useWebSocketStoreWithOut } from '/@/stores/modules/WebSocket';
  import { handleMemberWsMessage } from '/@/utils/memberWebSocketMessage';
  import { computed, onBeforeMount, onUnmounted, watch, nextTick, ref } from 'vue';
  import { CheckUpdates, Loading, AppUpdateDialog, LocaleModal } from '/@/components';
  import { ensureDeviceClientReportFields, hasDeviceClientReportFieldsCache } from '/@/utils/deviceClientReportFields';
  import { initAppNativeIntegrationWatchers, onAppUpdateDialogPerformUpdate, runAppNativePostMountTasks } from '/@/logics/appNativeIntegration';
  import { handleAppUpdateWsMessage, resetOtaMemberAppUpdateSubscribeSession, sendAppUpdateSubscribeIfConnected } from '/@/utils/appUpdateWebSocket';
  import { buildWebSocketConnectUrl, DEFAULT_WEBSOCKET_CLIENT_OPTIONS, WS_CHANNEL_MEMBER, WS_PATH_INFRA_MARKET_SPOT, WS_PATH_USER_WS } from '/@/utils/websocketUrl';

  /** 用户：UserStore */
  const UserStore = useUserStoreWithOut();

  /** SystemStore */
  const SystemStore = useSystemStoreWithOut();

  /** 从 useI18n 解构的文案与能力 */
  const { t } = useI18n();

  initAppNativeIntegrationWatchers(t);

  /** WebSocketStore */
  const WebSocketStore = useWebSocketStoreWithOut();

  /** 解构赋值：组合式 API 返回的一组方法或状态 */
  const { VITE_GLOB_SYSTEM_VERSION } = getAppEnvConfig();

  // 初始化 VConsole
  // new VConsole();

  /**
   * 统一：行情 WebSocket（默认通道 default）与 WebSocketStore 同步。
   * - 无登录 token 时 query 传空字符串 `token=`，不使用兜底。
   * - 地址未变且已连接时跳过重复 connect。
   */
  const syncAppWebSocket = (): void => {
    // 须等设备 query 稳定后再建连，否则 URL 从「空厂商/型号」变为有值会反复 disconnect+connect
    if (!hasDeviceClientReportFieldsCache()) return;

    // 行情 WebSocket 地址
    const url = buildWebSocketConnectUrl(WS_PATH_INFRA_MARKET_SPOT, UserStore.Token);

    // 如果地址未变且已连接时跳过重复 connect
    if (WebSocketStore.currentUrl === url && WebSocketStore.isConnected) {
      return;
    }

    // 连接 WebSocket
    WebSocketStore.connect(url, DEFAULT_WEBSOCKET_CLIENT_OPTIONS);
  };

  /**
   * 会员信息 WebSocket（独立通道 member，不可再调 connect()，否则会拆掉 default 行情连接）
   */
  const syncMemberWebSocket = (): void => {
    if (!hasDeviceClientReportFieldsCache()) return;

    // 会员信息 WebSocket 地址
    const url = buildWebSocketConnectUrl(WS_PATH_USER_WS, UserStore.Token);

    // 如果地址未变且已连接时跳过重复 connect
    const st = WebSocketStore.getChannelState(WS_CHANNEL_MEMBER);
    if (st?.url === url && st?.connected) {
      return;
    }

    // 连接 WebSocket
    WebSocketStore.connectChannel(WS_CHANNEL_MEMBER, url, DEFAULT_WEBSOCKET_CLIENT_OPTIONS);
  };

  // 是否启用默认版本更新检测程序（H5 热更新提示）

  /** 响应式状态：isOpenDefaultCheckUpdate 相关 UI 或数据 */
  const isOpenDefaultCheckUpdate = ref<boolean>(false);

  // 是否登录

  /** 计算属性：由其它状态派生的展示或判断 */
  const isLogin = computed(() => {
    return UserStore.getToken;
  });

  // 是否倒置组件

  /** 计算属性：由其它状态派生的展示或判断 */
  const isRTL = computed(() => {
    return UserStore.getIsRTL;
  });

  // 当前主题模式

  /** 计算属性：由其它状态派生的展示或判断 */
  const ThemeMode = computed(() => {
    return SystemStore.getDarkMode;
  });

  // 主题变量配置

  /** ThemeVars */
  const ThemeVars = computed<ConfigProviderThemeVars>(() => {
    return SystemStore.getThemeVars;
  });

  // 监听语言模式

  /** 侦听依赖变化并触发副作用 */
  watch(
    () => isRTL.value,
    () => {
      document.body.setAttribute('dir', isRTL.value ? 'rtl' : 'ltr');
    },
    { immediate: true, deep: true }
  );

  // 登录 token 变化时重连两条 WebSocket（通道不同，需分别同步）
  // 会员 /user/ws：未登录也连接（token 空 query），供原生 OTA subscribe_update；登录后带 token 重连

  /** 侦听依赖变化并触发副作用 */
  watch(
    () => UserStore.Token,
    (newToken, oldToken) => {
      if (newToken === oldToken) return;
      syncAppWebSocket();
      syncMemberWebSocket();
    }
  );

  // 监听会员通道推送并统一交给专用处理函数（App 版本更新 WS 仅原生处理，网页端不解析、不订阅）

  /** 侦听依赖变化并触发副作用 */
  watch(
    () => WebSocketStore.getChannelState(WS_CHANNEL_MEMBER)?.lastMessage ?? null,
    (raw) => {
      handleMemberWsMessage(raw);
      if (Capacitor.isNativePlatform()) {
        handleAppUpdateWsMessage(raw);
      }
    }
  );

  /** 会员通道连上后订阅 App 更新推送（仅原生；H5 不依赖会员连接状态，也不发送 subscribe_update） */
  // 只依赖 channels.member.connected，避免走 getter + sendChannel(pushMessage) 时误触发整段 OTA 逻辑

  /** 侦听依赖变化并触发副作用 */
  watch(
    () =>
      Capacitor.isNativePlatform()
        ? !!(WebSocketStore.channels[WS_CHANNEL_MEMBER]?.connected ?? false)
        : false,
    (connected, wasConnected) => {
      if (Capacitor.isNativePlatform() && wasConnected === true && !connected) {
        resetOtaMemberAppUpdateSubscribeSession();
        return;
      }
      if (!connected) return;
      if (wasConnected === true) return;
      void nextTick(() => {
        void sendAppUpdateSubscribeIfConnected();
      });
    },
    { flush: 'post', immediate: true }
  );

  // 写入谷歌搜索

  /** setGoogleSearchMeta */
  const setGoogleSearchMeta = (): void => {
    if (isProdMode() === true) {
      const result = parse(location.origin);

      // 创建一个 link 标签
      const link = document.createElement('link');

      // 设置属性
      link.rel = 'canonical';
      link.href = location.protocol + '//www.' + result.domain;

      // 插入到 head 的最后
      document.head.appendChild(link);
    }
  };

  // 打印信息

  /** OutInfo */
  const OutInfo = (): void => {
    // 打印当前环境信息
    console.log(
      `%cEnvironment: ${isProdMode() ? '%cProduction' : '%cDevelopment'}`,
      'color: #ee0a24; font-size: 16px; font-weight: bold;',
      `color: ${isProdMode() ? '#07c160' : '#1989fa'}; font-size: 16px; font-weight: bold;`
    );

    // 打印当前版本号
    console.log(
      `%cVersion: V${VITE_GLOB_SYSTEM_VERSION}`,
      'color: #07c160; font-size: 16px; font-weight: bold;'
    );
  };

  // 阻止双指缩放

  /** CloseTouchOpen */
  const CloseTouchOpen = (): void => {
    document.addEventListener(
      'touchstart',
      function (event) {
        if (event.touches.length > 1) {
          event.preventDefault(); // 阻止双指缩放
        }
      },
      { passive: false }
    );
  };

  // 阻止双击缩放

  /** CloseTouchMove */
  const CloseTouchMove = (): void => {
    let lastTouchEnd = 0;
    document.addEventListener(
      'touchend',
      function (event) {
        const now = new Date().getTime();
        if (now - lastTouchEnd <= 300) {
          event.preventDefault(); // 阻止双击缩放
        }
        lastTouchEnd = now;
      },
      { passive: false }
    );
  };

  // 初始化
  onBeforeMount(async (): Promise<void> => {
    // 等待 i18n 初始化完成后再调用系统配置
    await nextTick();

    // 调用系统配置
    SystemStore.setSystemConfigData();

    // 获取国家区号列表
    SystemStore.setCountryList();

    // 获取法币汇率
    SystemStore.setFiatExchangeRate();

    SystemStore.setLoading(true);

    // 如果已登录则获取用户信息
    if (isLogin.value) {
      UserStore.fetchUserInfo();
    }

    setGoogleSearchMeta();

    OutInfo();

    CloseTouchOpen();

    CloseTouchMove();

    // 设备 ID：原生走 Device.getId；网页走 IndexedDB + localStorage 持久化（与 HTTP 头 device 一致）
    await getClientDeviceIdAsync();

    // 厂商 / 型号 / 定制 UI（供 WS URL query、启动日志与版本检测体复用）
    await ensureDeviceClientReportFields();

    // 同步行情 WebSocket
    syncAppWebSocket();

    // 会员 /user/ws：启动即连（未登录 token= 空），原生 OTA 依赖此通道发 subscribe_update
    syncMemberWebSocket();

    await runAppNativePostMountTasks(!!isLogin.value);
  });

  // 卸载时断开所有通道（含 default 行情 + member）

  /** 组件卸载时清理副作用 */
  onUnmounted(() => {
    WebSocketStore.disconnect();
  });
</script>

<style>
  .van-toast__icon {
    font-size: 0.4rem !important;
  }
</style>
