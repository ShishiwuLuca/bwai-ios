<template>
  <PageWrap class="invest-list-page">
    <NavBar title="投资列表" fixed placeholder :border="false" />
    <div class="invest-list-page__content">
      <AppCardLinear class="invest-list-page__banner">
        <div class="invest-list-page__banner-inner">
          <span>Flexible asset management</span>
          <span>（图标）</span>
        </div>
      </AppCardLinear>
      <div class="invest-list-page__list">
        <AppCard v-for="(item, i) in list" :key="i" class="invest-list-page__card">
          <div class="invest-list-page__title">{{ item.title }}</div>
          <div class="invest-list-page__meta">{{ item.meta }}</div>
          <div class="invest-list-page__progress">
            <Progress :percentage="0" stroke-width="6" />
          </div>
          <Button
            type="primary"
            block
            round
            size="small"
            @click="$router.push({ name: 'InvestJoin' })"
            >申购</Button
          >
        </AppCard>
      </div>
    </div>
    <AppTabBar v-model="activeTabBar" @update:model-value="onTabChange" />
  </PageWrap>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { NavBar, PageWrap, AppCard, AppCardLinear, AppTabBar } from '/@/components';
  import { Button, Progress } from 'vant';

  /** 路由实例：编程式导航 */
  const router = useRouter();

  /** 底部 TabBar 当前项 */
  const activeTabBar = ref('mine');

  /** 投资产品列表（待接接口） */
  const list = ref([
    { title: '定期理财', meta: '3天 5% 日化' },
    { title: '灵活理财', meta: '随存随取' }
  ]);

  /** Tab 状态：onTabChange */
  const onTabChange = (name: string) => {
    if (name === 'home') router.push({ name: 'Home' });
    if (name === 'mine') router.push({ name: 'Mine' });
  };
</script>

<style scoped lang="less">
  .invest-list-page {
    padding-bottom: calc(1rem + env(safe-area-inset-bottom));
    color: var(--van-text-color);
  }

  .invest-list-page__content {
    padding: 0.32rem;
  }

  .invest-list-page__banner {
    padding: 0.32rem;
    margin-bottom: 0.24rem;
  }

  .invest-list-page__banner-inner {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .invest-list-page__list {
    display: flex;
    flex-direction: column;
    gap: 0.24rem;
  }

  .invest-list-page__card {
    padding: 0.28rem;
  }

  .invest-list-page__title {
    font-size: 0.3rem;
    font-weight: bold;
    margin-bottom: 0.08rem;
  }

  .invest-list-page__meta {
    font-size: 0.24rem;
    opacity: 0.9;
    margin-bottom: 0.16rem;
  }

  .invest-list-page__progress {
    margin-bottom: 0.16rem;
  }
</style>
