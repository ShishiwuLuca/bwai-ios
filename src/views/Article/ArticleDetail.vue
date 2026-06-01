<template>
  <NavBar :title="ArticleDetailData.title" fixed placeholder :border="false" />
  <PageWrap class="pl-1 pr-1">
    <div v-html="ArticleDetailData.content"></div>
  </PageWrap>
</template>

<script setup lang="ts">
  import { useRoute } from 'vue-router';
  import { onBeforeMount, ref } from 'vue';
  import { NavBar, PageWrap } from '/@/components';
  import { getArticleDetailByUrl } from '/@/service/Article';

  /** 当前路由：读取 query、params、meta 等 */
  const route = useRoute();

  // 文章详情数据

  /** 响应式状态：详情 */
  const ArticleDetailData = ref<any>({});

  // 获取文章详情

  /** 详情：getArticleDetailByUrlData */
  const getArticleDetailByUrlData = (): void => {
    const { urlName } = route.query;

    getArticleDetailByUrl({ urlName: urlName }).then((res: any) => {
      const { code } = res;
      if (code === 0) {
        const { data } = res;
        ArticleDetailData.value = data;
      }
    });
  };

  // 初始化
  onBeforeMount((): void => {
    getArticleDetailByUrlData();
  });
</script>

<style lang="less" scoped></style>
