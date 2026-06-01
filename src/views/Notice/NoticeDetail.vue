<template>
  <NavBar :title="t('notice_detail_title')" fixed placeholder :border="false" />
  <PageWrap class="notice-detail-page">
    <div class="p-1">
      <div class="text-[0.32rem] text-[var(--van-tab-active-text-color)] font-bold">{{
        NoticeContent.title
      }}</div>
      <div class="text-[0.28rem]">{{ TimeToFormat(NoticeContent.publishTime) }}</div>
      <Divider dashed class="!mt-0.5 !mb-0.5" />
      <div v-html="NoticeContent.content"></div>
    </div>
  </PageWrap>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import { Divider } from 'vant';
  import { useI18n } from 'vue-i18n';
  import { NavBar, PageWrap } from '/@/components';
  import { TimeToFormat } from '/@/utils/TimeZone';
  import { useUserStoreWithOut } from '/@/stores/modules/UserConfig';

  /** 从 useI18n 解构的文案与能力 */
  const { t } = useI18n();

  /** 用户：UserStore */
  const UserStore = useUserStoreWithOut();

  /** 计算属性：由其它状态派生的展示或判断 */
  const NoticeContent: any = computed(() => {
    return UserStore.getNoticeContent;
  });
</script>

<style lang="less" scoped></style>
