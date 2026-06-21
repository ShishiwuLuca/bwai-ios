<template>
  <div class="page-shell article-detail">
    <NavBar :title="navTitle" fixed placeholder :border="false" />
    <PageWrap>
      <div class="article-detail__body">
        <h1 v-if="ArticleDetailData.title" class="article-detail__title">
          {{ ArticleDetailData.title }}
        </h1>
        <time v-if="publishTimeText" class="article-detail__time">{{ publishTimeText }}</time>
        <Divider dashed class="article-detail__divider" />
        <div class="article-detail__content" v-html="ArticleDetailData.content"></div>
      </div>
    </PageWrap>
  </div>
</template>

<script setup lang="ts">
  import { computed, onBeforeMount, ref } from 'vue';
  import { useRoute } from 'vue-router';
  import { Divider } from 'vant';
  import { NavBar, PageWrap } from '/@/components';
  import { getArticleDetailByUrl } from '/@/service/Article';
  import { TimeToFormat } from '/@/utils/TimeZone';

  const route = useRoute();

  const ArticleDetailData = ref<Record<string, any>>({});

  const navTitle = computed(() => ArticleDetailData.value.title || '');

  const publishTimeText = computed(() => {
    const data = ArticleDetailData.value;
    const time = data.publishTime ?? data.createTime ?? data.updateTime;
    return time ? TimeToFormat(time, 'YYYY-MM-DD HH:mm') : '';
  });

  const getArticleDetailByUrlData = (): void => {
    const { urlName } = route.query;

    getArticleDetailByUrl({ urlName: urlName }).then((res: any) => {
      const { code } = res;
      if (code === 0) {
        const { data } = res;
        ArticleDetailData.value = data ?? {};
      }
    });
  };

  onBeforeMount((): void => {
    getArticleDetailByUrlData();
  });
</script>

<style lang="less" scoped>
  .article-detail {
    &:deep(.van-nav-bar__title) {
      font-size: 16px;
      font-weight: 600;
    }
  }

  .article-detail__body {
    padding: 0.14rem 0.28rem 0.6rem;
  }

  .article-detail__title {
    margin: 0;
    font-size: 16px;
    font-weight: bold;
    line-height: 1.5;
    background: linear-gradient(169deg, #6ca9ff 9%, #2071f8 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    color: transparent;
  }

  .article-detail__time {
    display: block;
    margin-top: 0.12rem;
    font-size: 12px;
    font-weight: 500;
    color: #000000;
  }

  .article-detail__divider {
    margin: 0.16rem 0 !important;
    border-color: #dadada !important;
  }

  .article-detail__content {
    font-size: 12px;
    font-weight: 500;
    line-height: 1.6;
    color: #000000;
    word-break: break-word;

    :deep(p),
    :deep(li),
    :deep(span),
    :deep(div) {
      font-size: 12px;
      font-weight: 500;
      line-height: 1.6;
      color: #000000;
    }

    :deep(p) {
      margin: 0 0 0.2rem;
    }

    :deep(img) {
      display: block;
      max-width: 100%;
      margin: 0.28rem 0;
      border-radius: 10px;
    }

    :deep(a) {
      color: #2071f8;
    }

    :deep(h1),
    :deep(h2),
    :deep(h3),
    :deep(h4),
    :deep(h5),
    :deep(h6) {
      margin: 0.2rem 0;
      font-weight: bold;
      color: #000000;
    }
  }
</style>
