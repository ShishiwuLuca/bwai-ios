<template>
  <div class="page-shell notice-detail">
    <NavBar :title="t('notice_detail_title')" fixed placeholder :border="false" />
    <PageWrap class="notice-detail-page">
      <div class="notice-detail__body">
        <h1 v-if="NoticeContent.title" class="notice-detail__title">{{ NoticeContent.title }}</h1>
        <time v-if="NoticeContent.publishTime" class="notice-detail__time">{{
          TimeToFormat(NoticeContent.publishTime, 'YYYY-MM-DD HH:mm')
        }}</time>
        <Divider dashed class="notice-detail__divider" />
        <div class="notice-detail__content" v-html="NoticeContent.content"></div>
      </div>
    </PageWrap>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import { Divider } from 'vant';
  import { useI18n } from 'vue-i18n';
  import { NavBar, PageWrap } from '/@/components';
  import { TimeToFormat } from '/@/utils/TimeZone';
  import { useUserStoreWithOut } from '/@/stores/modules/UserConfig';

  const { t } = useI18n();

  const UserStore = useUserStoreWithOut();

  const NoticeContent: any = computed(() => {
    return UserStore.getNoticeContent;
  });
</script>

<style lang="less" scoped></style>
