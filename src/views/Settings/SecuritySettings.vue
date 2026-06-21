<template>
  <PageWrap class="security-page">
    <NavBar :title="t('security_settings_title')" fixed placeholder :border="false" />
    <div class="p-1">
      <Cell
        clickable
        center
        size="large"
        :border="false"
        class="security-page__cell rounded !pt-1 !pb-1 mb-1"
        :title="t('change_password_title')"
        title-class="security-page__cell-title"
        is-link
        :to="'/ChangePassword'"
      />
      <Cell
        clickable
        center
        size="large"
        :border="false"
        class="security-page__cell rounded !pt-1 !pb-1 mb-1"
        :title="t('trade_password_title')"
        title-class="security-page__cell-title"
        :value="UserInfo.capitalPasswordSet === true ? t('set_text') : t('unset_text')"
        value-class="security-page__cell-value"
        is-link
        :to="'/TradePassword'"
      />
      <Cell
        clickable
        center
        size="large"
        :border="false"
        class="security-page__cell rounded !pt-1 !pb-1 mb-1"
        :title="t('google_code_title')"
        title-class="security-page__cell-title"
        :value="UserInfo.googleCodeSet ? t('bind_text') : t('unbind_text')"
        value-class="security-page__cell-value"
        is-link
        :to="'/GoogleCode'"
      />
      <Cell
        clickable
        center
        size="large"
        :border="false"
        class="security-page__cell rounded !pt-1 !pb-1 mb-1"
        :title="t('bind_email_title')"
        title-class="security-page__cell-title"
        :value="UserInfo.email ? t('bind_text') : t('unbind_text')"
        value-class="security-page__cell-value"
        is-link
        :to="'/BindEmail'"
      />
      <Cell
        clickable
        center
        size="large"
        :border="false"
        class="security-page__cell rounded !pt-1 !pb-1 mb-1"
        :title="t('bind_phone_title')"
        title-class="security-page__cell-title"
        :value="UserInfo.mobile ? t('bind_text') : t('unbind_text')"
        value-class="security-page__cell-value"
        is-link
        :to="'/BindPhone'"
      />
      <Cell
        clickable
        center
        size="large"
        :border="false"
        class="security-page__cell rounded !pt-1 !pb-1 mb-1"
        :title="t('address_book_title')"
        title-class="security-page__cell-title"
        is-link
        :to="'/AddressBook'"
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
    background: #f2f5fe;
    min-height: 100vh;

    :deep(.van-nav-bar__title) {
      font-size: 16px;
      font-weight: 600;
      color: #000000;
    }

    :deep(.van-nav-bar .van-icon) {
      color: #000000 !important;
    }
  }

  .security-page__cell {
    background: #f9faff !important;
    box-shadow: 0 0 2px rgba(87, 119, 251, 0.25);
  }

  .security-page__cell-title {
    font-size: 12px !important;
    font-weight: 500 !important;
    color: #000000 !important;
  }

  .security-page__cell-value {
    font-size: 12px !important;
    font-weight: 500 !important;
    color: #797979 !important;
  }
</style>
