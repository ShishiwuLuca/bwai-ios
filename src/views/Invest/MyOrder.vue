<template>
  <PageWrap class="my-order-page">
    <NavBar title="我的订单" fixed placeholder :border="false" />
    <Tabs v-model:active="activeTab" class="my-order-page__tabs">
      <Tab title="进行中" name="ing" />
      <Tab title="已完成" name="done" />
    </Tabs>
    <div class="my-order-page__list">
      <AppCard v-for="(item, i) in list" :key="i" class="my-order-page__card">
        <div class="my-order-page__head">
          <span class="my-order-page__title">Flexible asset management.</span>
          <span class="my-order-page__status">投资中</span>
        </div>
        <div class="my-order-page__row"
          ><span>订单编号</span><span>{{ item.orderNo }}</span></div
        >
        <div class="my-order-page__row"
          ><span>投资币种</span><span>{{ item.currency }}</span></div
        >
        <div class="my-order-page__row"
          ><span>锁仓周期</span><span>{{ item.lockDays }}</span></div
        >
        <div class="my-order-page__row"
          ><span>投资金额</span><span>{{ item.amount }}</span></div
        >
        <div class="my-order-page__row"
          ><span>投资日期</span><span>{{ item.date }}</span></div
        >
        <div class="my-order-page__row"
          ><span>到账日期</span><span>{{ item.arriveDate }}</span></div
        >
        <div class="my-order-page__row"
          ><span>预计收益</span><span>{{ item.income }}</span></div
        >
        <Button
          type="primary"
          block
          round
          size="small"
          class="my-order-page__btn"
          @click="$router.push({ name: 'OrderDetail' })"
          >详情</Button
        >
      </AppCard>
    </div>
    <AppTabBar v-model="activeTabBar" @update:model-value="onTabChange" />
  </PageWrap>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { NavBar, PageWrap, AppCard, AppTabBar } from '/@/components';
  import { Tabs, Tab, Button } from 'vant';

  /** 路由实例：编程式导航 */
  const router = useRouter();

  /** 订单 Tab：进行中 / 已完成 */
  const activeTab = ref('ing');

  /** 底部 TabBar 当前项 */
  const activeTabBar = ref('mine');

  /** 订单列表（待接接口） */
  const list = ref([
    {
      orderNo: '202401150001',
      currency: 'USDT',
      lockDays: '30天',
      amount: '100',
      date: '2024-01-15',
      arriveDate: '2024-02-15',
      income: '5'
    }
  ]);

  /** Tab 状态：onTabChange */
  const onTabChange = (name: string) => {
    if (name === 'home') router.push({ name: 'Home' });
    if (name === 'mine') router.push({ name: 'Mine' });
  };
</script>

<style scoped lang="less">
  .my-order-page {
    padding-bottom: calc(1rem + env(safe-area-inset-bottom));
    color: var(--van-text-color);
  }

  .my-order-page__tabs :deep(.van-tabs__nav) {
    background: var(--van-background);
  }

  .my-order-page__list {
    padding: 0.32rem;
  }

  .my-order-page__card {
    padding: 0.28rem;
    margin-bottom: 0.24rem;
  }

  .my-order-page__head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.16rem;
  }

  .my-order-page__title {
    font-size: 0.3rem;
    font-weight: bold;
  }

  .my-order-page__status {
    font-size: 0.22rem;
    padding: 0.04rem 0.12rem;
    background: var(--van-card-linear-background);
    border-radius: 0.08rem;
  }

  .my-order-page__row {
    display: flex;
    justify-content: space-between;
    font-size: 0.26rem;
    padding: 0.08rem 0;
    opacity: 0.9;
  }

  .my-order-page__btn {
    margin-top: 0.16rem;
  }
</style>
