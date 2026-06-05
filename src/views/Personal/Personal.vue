<template>
  <div class="personal">
    <NavBar :show-left="false" :fixed="false" placeholder :border="false">
      <template #left>
        <VanImage :src="Logo" height="0.6rem" fit="contain" class="nav-bar-logo" />
      </template>
      <template #right>
        <Icon name="chat-o" :size="28" @click="$router.push('/Notice')" />
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
        <Cell
          clickable
          center
          size="large"
          :border="false"
          class="rounded mt-1 !pt-1 !pb-1 mb-1"
          :title="t('about_us_title')"
          is-link
          to="/About"
        >
          <template #icon>
            <Icon name="info" class="mr-0.7" :size="25" color="var(--van-primary-color)" />
          </template>
        </Cell>
      </div>
      <div class="mt-2" v-if="isLogin">
        <Button type="danger" block @click="onLogout" round>{{ t('logout_title') }}</Button>
      </div>
    </PageWrap>
    <AppTabBar />
  </div>
</template>

<script setup lang="ts">
  import { useRouter } from 'vue-router';
  import { logout } from '/@/service/Auth';
  import { useCopyToClipboard } from '/@/utils';
  import { emitEvent } from '/@/utils/eventBus';
  import { useI18n } from '/@/hooks/web/useI18n';
  import Avatar from '/@/assets/images/avatar.png';
  import { computed, onBeforeMount } from 'vue';
  // import Logo from '/@/assets/images/home_logo.png';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { Icon, Image as VanImage, Cell, Button } from 'vant';
  import { useUserStoreWithOut } from '/@/stores/modules/UserConfig';
  import { useSystemStoreWithOut } from '/@/stores/modules/SystemConfig';
  import { NavBar, PageWrap, AppTabBar } from '/@/components';

  /** 从 useI18n 解构的文案与能力 */
  const { t } = useI18n();

  /** 路由实例：编程式导航 */
  const router = useRouter();

  /** 从 useMessage 解构的 Toast / Dialog 能力 */
  const { CreateToast, CreateConfirmDialog } = useMessage();

  /** 用户：UserStore */
  const UserStore = useUserStoreWithOut();

  /** SystemStore */
  const SystemStore = useSystemStoreWithOut();

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

  // logo

  /** 计算属性：由其它状态派生的展示或判断 */
  const Logo = computed(() => {
    return SystemStore.getSiteLogo;
  });

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

  // 初始化
  onBeforeMount((): void => {
    UserStore.setActiveTab(1);
    UserStore.fetchUserInfo();
  });
</script>

<style lang="less" scoped>
  :deep(.van-nav-bar__left) {
    padding: 0 var(--van-padding-md);
    width: auto;
    max-width: none;
  }

  .nav-bar-logo {
    width: auto !important;
    flex-shrink: 0;

    :deep(.van-image__img) {
      width: auto !important;
      object-fit: contain;
    }
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
