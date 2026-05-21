<template>
  <div class="personal">
    <NavBar :show-left="false" :fixed="false" placeholder :border="false">
      <template #left>
        <VanImage :src="Logo" height="0.6rem" />
      </template>
      <template #right>
        <div class="flex items-center justify-between gap-1">
          <Icon name="chat-o" :size="28" @click="$router.push('/Notice')" />
          <Icon name="service" :size="28" @click="OpenService" />
        </div>
      </template>
    </NavBar>
    <PageWrap class="p-1">
      <div class="flex items-center justify-start gap-1.5">
        <div class="avatar" @click="$router.push('/UserBenefits')">
          <VanImage :src="UserInfo.avatar || Avatar" width="1.4rem" />
        </div>
        <div>
          <div class="text-[0.4rem] text-[#EDD59C] font-bold">{{ UserInfo.nickname }}</div>
          <div class="text-[0.32rem] font-bold flex items-center justify-start gap-0.5">
            <div>ID: {{ UserInfo.id }}</div>
            <div @click="CopyText(UserInfo.id)">
              <Icon
                class-prefix="exchange-icon"
                name="copy"
                :size="22"
                color="var(--van-primary-color)"
              />
            </div>
          </div>
        </div>
      </div>
      <div class="mt-1">
        <div class="text-[0.32rem]">{{ t('account_settings_title') }}</div>
        <!-- <Cell clickable center size="large" :border="false" class="rounded mt-1 !pt-1 !pb-1 mb-1"
            :title="t('notification_settings_title')" :value="t('other_settings_value')"
            value-class="!text-[var(--van-text-color)]" is-link>
            <template #icon>
              <Icon name="volume" class="mr-0.7" :size="25" color="var(--van-primary-color)" />
            </template>
          </Cell> -->
        <Cell
          clickable
          center
          size="large"
          :border="false"
          class="rounded mt-1 !pt-1 !pb-1 mb-1"
          :title="t('security_settings_title')"
          is-link
          to="/SecuritySettings"
        >
          <template #icon>
            <Icon name="lock" class="mr-0.7" :size="25" color="var(--van-primary-color)" />
          </template>
        </Cell>
      </div>
      <div class="mt-1">
        <div class="text-[0.32rem]">{{ t('other_settings_title') }}</div>
        <Cell
          clickable
          center
          size="large"
          :border="false"
          class="rounded mt-1 !pt-1 !pb-1 mb-1"
          :title="t('language_title')"
          @click="emitEvent('ShowLocales')"
          value-class="!text-[var(--van-text-color)]"
          is-link
        >
          <template #icon>
            <Icon
              class-prefix="exchange-icon"
              name="locale"
              class="mr-0.7"
              :size="25"
              color="var(--van-primary-color)"
            />
          </template>
          <template #value>
            <div class="flex items-center justify-end gap-0.5">
              <Icon :name="Locale.icon" :size="25" color="var(--van-primary-color)" />
              <div>{{ Locale.label }}</div>
            </div>
          </template>
        </Cell>
      </div>
      <div class="mt-2" v-if="isLogin">
        <Button type="danger" block @click="onLogout" round>{{ t('logout_title') }}</Button>
      </div>
      <div class="mt-1 text-center flex items-center justify-center gap-1">
        <div v-if="isApp">{{ t('app_version_title') }}: {{ AppVersion }}</div>
        <div>{{
          isApp
            ? t('resource_version_title') + ': ' + VITE_GLOB_SYSTEM_VERSION
            : t('version_number', [VITE_GLOB_SYSTEM_VERSION])
        }}</div>
      </div>
    </PageWrap>
    <AppTabBar />
  </div>
</template>

<script setup lang="ts">
  import { App } from '@capacitor/app';
  import { useRouter } from 'vue-router';
  import { logout } from '/@/service/Auth';
  import { Capacitor } from '@capacitor/core';
  import { useCopyToClipboard } from '/@/utils';
  import { emitEvent } from '/@/utils/eventBus';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { getAppEnvConfig } from '/@/utils/env';
  import Avatar from '/@/assets/images/avatar.png';
  import { computed, onBeforeMount, ref } from 'vue';
  // import Logo from '/@/assets/images/home_logo.png';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { openInBrowser } from '/@/hooks/useAppLauncher';
  import { Icon, Image as VanImage, Cell, Button } from 'vant';
  import { useUserStoreWithOut } from '/@/stores/modules/UserConfig';
  import { useSystemStoreWithOut } from '/@/stores/modules/SystemConfig';
  import { NavBar, PageWrap, AppTabBar } from '/@/components';

  /** 从 useI18n 解构的文案与能力 */
  const { t } = useI18n();

  /** 路由实例：编程式导航 */
  const router = useRouter();

  /** 解构赋值：组合式 API 返回的一组方法或状态 */
  const { VITE_GLOB_SYSTEM_VERSION } = getAppEnvConfig();

  /** 从 useMessage 解构的 Toast / Dialog 能力 */
  const { CreateToast, CreateConfirmDialog } = useMessage();

  /** 用户：UserStore */
  const UserStore = useUserStoreWithOut();

  /** SystemStore */
  const SystemStore = useSystemStoreWithOut();

  // APP版本号

  /** 响应式状态：AppVersion 相关 UI 或数据 */
  const AppVersion = ref<string>('');

  // 用户信息

  /** 计算属性：用户 */
  const UserInfo: any = computed(() => {
    return UserStore.getUserInfo;
  });

  // 当前系统语言

  /** 计算属性：由其它状态派生的展示或判断 */
  const Locale = computed(() => {
    return SystemStore.getLocaleInfo;
  });

  // 是否登录

  /** 计算属性：由其它状态派生的展示或判断 */
  const isLogin = computed(() => {
    return UserStore.getToken;
  });

  // 是否APP环境

  /** 计算属性：由其它状态派生的展示或判断 */
  const isApp = computed(() => {
    return Capacitor.isNativePlatform();
  });

  // logo

  /** 计算属性：由其它状态派生的展示或判断 */
  const Logo = computed(() => {
    return SystemStore.getSiteLogo;
  });

  // 客服链接

  /** 计算属性：由其它状态派生的展示或判断 */
  const CustomerService = computed(() => {
    return SystemStore.getCustomerService;
  });

  /**
   * 读取当前安装包版本（versionName / CFBundleShortVersionString）。
   * 请用 @capacitor/app 的 App.getInfo()，不要只用 @capawesome/capacitor-app-update 的 getAppUpdateInfo 来展示版本：
   * - Android：该接口依赖 Google Play 的 AppUpdateManager，调试包/侧载/无GMS 时常失败或 reject；
   * - 商店更新检测仍可用 AppUpdate，与「展示本地版本」是两件不同的事。
   */
  const getInstalledAppVersion = (): Promise<string> => {
    return App.getInfo().then((info) => (info.version || '').trim());
  };

  // 复制文字

  /** CopyText */
  const CopyText = (text: string) => {
    useCopyToClipboard(text);
    CreateToast(t('copy_success'));
  };

  // 退出登录

  /** 事件或回调处理：onLogout */
  const onLogout = () => {
    CreateConfirmDialog({
      title: t('common_title_text'),
      message: t('logout_message')
    }).then(() => {
      logout().then((res) => {
        const { code } = res;
        if (code === 0) {
          UserStore.LoginOut();
          router.push('/Login');
        }
      });
    });
  };

  // 打开客服

  /** OpenService */
  const OpenService = () => {
    if (CustomerService.value) {
      openInBrowser(CustomerService.value);
    }
  };

  // 初始化
  onBeforeMount((): void => {
    UserStore.setActiveTab(1);
    UserStore.fetchUserInfo();

    if (isApp.value) {
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
  });
</script>

<style lang="less" scoped>
  :deep(.van-nav-bar__left) {
    padding: 0 var(--van-padding-md);
  }

  :deep(.van-nav-bar) {
    background: transparent !important;
  }

  :deep(.van-cell__title) {
    flex: auto !important;
  }

  :deep(.van-cell__value) {
    flex: auto !important;
  }

  .page-wrap {
    background: transparent !important;
    min-height: auto;
  }

  .personal {
    background-image: url('/@/assets/images/user_bg.png');
    background-size: 100% 100%;
    background-position: center;
    background-repeat: no-repeat;
    // width: 100%;
    height: 100vh;
  }
</style>
