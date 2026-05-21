<template>
  <PageWrap class="security-page">
    <NavBar :title="t('security_settings_title')" fixed placeholder :border="false" />
    <div class="p-1">
      <Cell
        clickable
        center
        size="large"
        :border="false"
        class="rounded !pt-1 !pb-1 mb-1"
        :title="t('change_password_title')"
        is-link
        :to="'/ChangePassword'"
      />
      <Cell
        clickable
        center
        size="large"
        :border="false"
        class="rounded !pt-1 !pb-1 mb-1"
        :title="t('bind_email_title')"
        :value="UserInfo.email ? t('bind_text') : t('unbind_text')"
        is-link
        :to="'/BindEmail'"
      />
      <Cell
        clickable
        center
        size="large"
        :border="false"
        class="rounded !pt-1 !pb-1 mb-1"
        :title="t('bind_phone_title')"
        :value="UserInfo.mobile ? t('bind_text') : t('unbind_text')"
        is-link
        :to="'/BindPhone'"
      />
    </div>
  </PageWrap>
</template>

<script setup lang="ts">
  import { Cell } from 'vant';
  import { computed } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { NavBar, PageWrap } from '/@/components';
  import { useUserStoreWithOut } from '/@/stores/modules/UserConfig';

  /** 从 useI18n 解构的文案与能力 */
  const { t } = useI18n();

  /** 用户：UserStore */
  const UserStore = useUserStoreWithOut();

  // 会员信息

  /** 计算属性：用户 */
  const UserInfo: any = computed(() => {
    return UserStore.getUserInfo;
  });
</script>

<style scoped lang="less">
  .security-page {
    color: var(--van-text-color);
  }
</style>
