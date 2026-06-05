<template>
  <NavBar :title="t('about_us_title')" fixed placeholder :border="false" />
  <PageWrap>
    <div class="text-center mt-1">
      <VanImage :src="Logo" width="2.5rem" />
      <!-- <div class="text-[0.6rem] font-bold">{{ SiteName }}</div> -->
      <div class="text-[0.3rem]">{{ t('about_us_slogan') }}</div>
    </div>
    <div class="p-1">
      <Cell
        v-if="!isApp"
        clickable
        center
        size="large"
        :border="false"
        class="rounded mt-1 !pt-1 !pb-1 mb-1"
        :title="t('download_title')"
        is-link
        to="/Download"
      />
      <template v-if="isApp">
        <Cell
          clickable
          center
          size="large"
          :border="false"
          class="rounded mt-1 !pt-1 !pb-1 mb-1"
          :title="t('app_version_title')"
          :value="'V' + AppVersion"
          value-class="!text-[var(--van-primary-color)]"
          is-link
        />
        <Cell
          clickable
          center
          size="large"
          :border="false"
          class="rounded mt-1 !pt-1 !pb-1 mb-1"
          :title="t('resource_version_title')"
          :value="'V' + VITE_GLOB_SYSTEM_VERSION"
          value-class="!text-[var(--van-primary-color)]"
          is-link
        />
      </template>
      <Cell
        v-else
        clickable
        center
        size="large"
        :border="false"
        class="rounded mt-1 !pt-1 !pb-1 mb-1"
        :title="t('version_info_title')"
        :value="'V' + VITE_GLOB_SYSTEM_VERSION"
        value-class="!text-[var(--van-primary-color)]"
        is-link
      />
      <Cell
        clickable
        center
        size="large"
        :border="false"
        class="rounded mt-1 !pt-1 !pb-1 mb-1"
        :title="t('contact_us_title')"
        to="/ArticleDetail?urlName=linkus"
        is-link
      />
      <Cell
        clickable
        center
        size="large"
        :border="false"
        class="rounded mt-1 !pt-1 !pb-1 mb-1"
        :title="t('register_agree_text_link_text_2')"
        to="/ArticleDetail?urlName=privacy"
        is-link
      />
      <Cell
        clickable
        center
        size="large"
        :border="false"
        class="rounded mt-1 !pt-1 !pb-1 mb-1"
        :title="t('register_agree_text_link')"
        to="/ArticleDetail?urlName=agreement"
        is-link
      />
      <Cell
        clickable
        center
        size="large"
        :border="false"
        class="rounded mt-1 !pt-1 !pb-1 mb-1"
        :title="t('about_clear_cache_title')"
        is-link
        @click="onClearCache"
      />
    </div>
    <div class="fixed bottom-1 w-full p-1" v-if="isApp">
      <Button type="primary" block round :loading="checkUpdateLoading" @click="onCheckAppUpdate">
        {{ t('app_version_check_action') }}
      </Button>
    </div>
  </PageWrap>
</template>

<script setup lang="ts">
  import { useI18n } from 'vue-i18n';
  import { App } from '@capacitor/app';
  import { Capacitor } from '@capacitor/core';
  import { getAppEnvConfig } from '/@/utils/env';
  import { NavBar, PageWrap } from '/@/components';
  import { clearAppCache } from '/@/utils/appUpdate';
  import { getArticleList } from '/@/service/Article';
  import { useMessage } from '/@/hooks/web/useMessage';
  // import Logo from '/@/assets/images/header_logo.png';
  import { Cell, Image as VanImage, Button } from 'vant';
  import { onBeforeMount, ref, computed } from 'vue';
  import { checkServerAppVersion } from '/@/utils/serverAppVersionCheck';
  import { useSystemStoreWithOut } from '/@/stores/modules/SystemConfig';
  import { ClearCacheAll, clearWebViewPersistentData } from '/@/utils/index';

  /** 从 useI18n 解构的文案与能力 */
  const { t } = useI18n();

  /** 解构赋值：组合式 API 返回的一组方法或状态 */
  const {
    CreateConfirmDialog,
    CreateErrorToast,
    CreateLoadingToast,
    CreateCloseToast,
    CreateToast
  } = useMessage();

  /** SystemStore */
  const SystemStore = useSystemStoreWithOut();

  // 是否APP环境

  /** isApp */
  const isApp = Capacitor.isNativePlatform();

  // APP版本号

  /** 响应式状态：AppVersion 相关 UI 或数据 */
  const AppVersion = ref<string>('');

  // 资源版本号

  /** 解构赋值：组合式 API 返回的一组方法或状态 */
  const { VITE_GLOB_SYSTEM_VERSION } = getAppEnvConfig();

  // 文章类型列表

  /** 响应式状态：列表数据 */
  const ArticleTypeList = ref<any[]>([]);

  /** 响应式状态：加载中状态 */
  const checkUpdateLoading = ref(false);

  /** 手动「检查更新」最小间隔（毫秒） */
  const APP_VERSION_MANUAL_CHECK_COOLDOWN_MS = 60_000;

  /** 响应式状态：事件或回调处理 */
  const lastManualAppVersionCheckAt = ref(0);

  // logo

  /** 计算属性：由其它状态派生的展示或判断 */
  const Logo = computed(() => {
    return SystemStore.getSiteLogo;
  });

  // 站点名称
  // const SiteName = computed(() => {
  //   return SystemStore.getSiteName;
  // });

  // 获取文章类型列表

  /** 列表数据（getArticleTypeList） */
  const getArticleTypeList = async () => {
    getArticleList({}).then((res: any) => {
      const { code } = res;
      if (code === 0) {
        const {
          data: { children }
        } = res;
        ArticleTypeList.value = children;
      }
    });
  };

  /**
   * 读取当前安装包版本（versionName / CFBundleShortVersionString）。
   * 请用 @capacitor/app 的 App.getInfo()，不要只用 @capawesome/capacitor-app-update 的 getAppUpdateInfo 来展示版本：
   * - Android：该接口依赖 Google Play 的 AppUpdateManager，调试包/侧载/无GMS 时常失败或 reject；
   * - 商店更新检测仍可用 AppUpdate，与「展示本地版本」是两件不同的事。
   */
  const getInstalledAppVersion = (): Promise<string> => {
    return App.getInfo().then((info) => (info.version || '').trim());
  };

  /**
   * 清除缓存
   */
  const onClearCache = (): void => {
    const message = isApp ? t('about_clear_cache_message_app') : t('about_clear_cache_message_web');
    CreateConfirmDialog({
      title: t('common_title_text'),
      message,
      confirmButtonText: t('confirm'),
      cancelButtonText: t('cancel')
    }).then(() => {
      if (isApp) {
        void (async () => {
          const fs = await clearAppCache();
          if (!fs.success && fs.error) {
            CreateErrorToast(fs.error);
            return;
          }
          clearWebViewPersistentData();
          try {
            const { App } = await import('@capacitor/app');
            await App.exitApp();
          } catch {
            window.location.reload();
          }
        })();
        return;
      }
      ClearCacheAll();
    });
  };

  /** 与手动检查共用服务端检测逻辑 */
  const runCheckServerAppVersion = async (options: {
    withBlockingLoading: boolean;
    notifyWhenLatest: boolean;
  }): Promise<void> => {
    if (!isApp || checkUpdateLoading.value) return;
    checkUpdateLoading.value = true;
    if (options.withBlockingLoading) {
      CreateLoadingToast({ message: t('app_version_checking'), forbidClick: true, duration: 0 });
    }
    try {
      await checkServerAppVersion({ silent: false, notifyWhenLatest: options.notifyWhenLatest });
    } finally {
      if (options.withBlockingLoading) {
        CreateCloseToast();
      }
      checkUpdateLoading.value = false;
    }
  };

  /**
   * 检查 App 是否有新版本（60 秒内仅允许发起一次，避免频繁请求）
   */
  const onCheckAppUpdate = (): void => {
    if (!isApp) return;
    const now = Date.now();
    const since = now - lastManualAppVersionCheckAt.value;
    if (lastManualAppVersionCheckAt.value > 0 && since < APP_VERSION_MANUAL_CHECK_COOLDOWN_MS) {
      const sec = Math.ceil((APP_VERSION_MANUAL_CHECK_COOLDOWN_MS - since) / 1000);
      CreateToast(t('app_version_check_throttle', { n: sec }));
      return;
    }
    lastManualAppVersionCheckAt.value = now;
    void runCheckServerAppVersion({ withBlockingLoading: true, notifyWhenLatest: true });
  };

  // 初始化
  onBeforeMount((): void => {
    if (isApp) {
      getInstalledAppVersion()
        .then((version) => {
          AppVersion.value = version || VITE_GLOB_SYSTEM_VERSION;
        })
        .catch(() => {
          AppVersion.value = VITE_GLOB_SYSTEM_VERSION;
        });
    } else {
      AppVersion.value = VITE_GLOB_SYSTEM_VERSION;
    }

    getArticleTypeList();
  });
</script>

<style lang="less" scoped></style>
