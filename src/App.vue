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
</template>

<script setup lang="ts">
  import { parse } from 'tldts';
  // import VConsole from 'vconsole';
  import { RouterView } from 'vue-router';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { getAppEnvConfig, isProdMode } from '/@/utils/env';
  import { getClientDeviceIdAsync } from '/@/utils/clientDeviceId';
  import { useUserStoreWithOut } from '/@/stores/modules/UserConfig';
  import { type ConfigProviderThemeVars, ConfigProvider } from 'vant';
  import { useSystemStoreWithOut } from '/@/stores/modules/SystemConfig';
  import { computed, onBeforeMount, watch, nextTick, ref } from 'vue';
  import { CheckUpdates, Loading, LocaleModal } from '/@/components';
  import { ensureDeviceClientReportFields } from '/@/utils/deviceClientReportFields';
  import { initAppNativeIntegrationWatchers, runAppNativePostMountTasks } from '/@/logics/appNativeIntegration';

  /** 用户：UserStore */
  const UserStore = useUserStoreWithOut();

  /** SystemStore */
  const SystemStore = useSystemStoreWithOut();

  /** 从 useI18n 解构的文案与能力 */
  const { t } = useI18n();

  initAppNativeIntegrationWatchers(t);

  /** 解构赋值：组合式 API 返回的一组方法或状态 */
  const { VITE_GLOB_SYSTEM_VERSION } = getAppEnvConfig();

  // 初始化 VConsole
  // new VConsole();

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

    // 厂商 / 型号 / 定制 UI（供启动日志、版本检测与 HTTP 头复用）
    await ensureDeviceClientReportFields();

    await runAppNativePostMountTasks();
  });
</script>

<style>
  .van-toast__icon {
    font-size: 0.4rem !important;
  }
</style>
