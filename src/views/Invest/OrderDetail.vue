<template>
  <PageWrap class="order-detail-page">
    <NavBar title="我的订单" fixed placeholder :border="false" />
    <div class="order-detail-page__content">
      <AppCard class="order-detail-page__card">
        <div class="order-detail-page__head">
          <span>Flexible asset management</span>
          <span class="order-detail-page__status">投资中</span>
        </div>
        <div class="order-detail-page__row"
          ><span>订单编号</span><span>{{ order.orderNo }}</span></div
        >
        <div class="order-detail-page__row"
          ><span>投资币种</span><span>{{ order.currency }}</span></div
        >
        <div class="order-detail-page__row"
          ><span>锁仓周期</span><span>{{ order.lockDays }}</span></div
        >
        <div class="order-detail-page__row"
          ><span>投资金额</span><span>{{ order.amount }}</span></div
        >
        <div class="order-detail-page__row"
          ><span>投资日期</span><span>{{ order.date }}</span></div
        >
        <div class="order-detail-page__row"
          ><span>到账日期</span><span>{{ order.arriveDate }}</span></div
        >
        <div class="order-detail-page__row"
          ><span>预计收益</span><span>{{ order.income }}</span></div
        >
        <div class="order-detail-page__row"
          ><span>日化</span><span>{{ order.daily }}</span></div
        >
        <div class="order-detail-page__row"
          ><span>收益率</span><span>{{ order.rate }}</span></div
        >
        <div class="order-detail-page__row"
          ><span>投资周期</span><span>{{ order.cycle }}</span></div
        >
        <div class="order-detail-page__row"
          ><span>投资状态</span><span>{{ order.status }}</span></div
        >
        <div class="order-detail-page__btns">
          <Button type="primary" round @click="showRedeem = true">申请赎回</Button>
          <Button plain round>分享海报</Button>
        </div>
      </AppCard>
      <AppCard class="order-detail-page__card">
        <div class="order-detail-page__section-title">交易详情</div>
        <div class="order-detail-page__row"
          ><span>Hash</span><span>{{ order.hash }}</span></div
        >
        <div class="order-detail-page__row"
          ><span>交易时间</span><span>{{ order.txTime }}</span></div
        >
        <div class="order-detail-page__row"><span>交易链接</span><span>链接 复制</span></div>
      </AppCard>
      <AppCard class="order-detail-page__card">
        <div class="order-detail-page__section-title">派息详情</div>
        <div class="order-detail-page__row order-detail-page__row--head"
          ><span>日期</span><span>每日派息</span></div
        >
        <div v-for="(row, i) in payoutList" :key="i" class="order-detail-page__row">
          <span>{{ row.date }}</span
          ><span>{{ row.amount }}</span>
        </div>
      </AppCard>
    </div>
    <Dialog
      v-model:show="showRedeem"
      title="申请赎回"
      show-cancel-button
      confirm-button-text="确定"
      @confirm="onRedeem"
    >
      <div class="order-detail-page__redeem-content">
        <p>订单编号 {{ order.orderNo }}</p>
        <p>投资币种 {{ order.currency }} 锁仓周期 {{ order.lockDays }}</p>
        <p>可赎回金额 1000 USDT</p>
        <p>预计赎回日期 2024-02-15</p>
        <p class="order-detail-page__redeem-tip"
          >申请赎回后将进入审核阶段，预计2个工作日内完成审核并到账</p
        >
      </div>
    </Dialog>
  </PageWrap>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { NavBar, PageWrap, AppCard } from '/@/components';
  import { Button, Dialog } from 'vant';

  /** 是否显示申请赎回弹窗 */
  const showRedeem = ref(false);

  /** 订单详情（可从路由 id 请求接口） */
  const order = ref({
    orderNo: '202401150001',
    currency: 'USDT',
    lockDays: '30天',
    amount: '100 USDT',
    date: '2024-01-15',
    arriveDate: '2024-02-15',
    income: '5',
    daily: '0.xx',
    rate: '5%',
    cycle: '30天',
    status: '投资中',
    hash: '0x...',
    txTime: '2024-01-15 10:00'
  });

  /** 收益发放记录列表 */
  const payoutList = ref([
    { date: '2024-01-16', amount: '0.0524 USDT' },
    { date: '2024-01-17', amount: '0.0524 USDT' }
  ]);

  /** 事件或回调处理：onRedeem */
  const onRedeem = () => {
    console.log('redeem');
  };
</script>

<style scoped lang="less">
  .order-detail-page {
    color: var(--van-text-color);
  }

  .order-detail-page__content {
    padding: 0.32rem;
  }

  .order-detail-page__card {
    padding: 0.28rem;
    margin-bottom: 0.24rem;
  }

  .order-detail-page__head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.16rem;
  }

  .order-detail-page__status {
    font-size: 0.22rem;
    padding: 0.04rem 0.12rem;
    background: var(--van-card-linear-background);
    border-radius: 0.08rem;
  }

  .order-detail-page__row {
    display: flex;
    justify-content: space-between;
    font-size: 0.26rem;
    padding: 0.1rem 0;
    border-bottom: 1px solid var(--van-border-color);
  }

  .order-detail-page__row--head {
    font-weight: bold;
  }

  .order-detail-page__section-title {
    font-size: 0.28rem;
    font-weight: bold;
    margin-bottom: 0.12rem;
  }

  .order-detail-page__btns {
    display: flex;
    gap: 0.24rem;
    margin-top: 0.24rem;
  }

  .order-detail-page__redeem-content {
    padding: 0.24rem 0;
    font-size: 0.26rem;
  }

  .order-detail-page__redeem-tip {
    margin-top: 0.16rem;
    font-size: 0.24rem;
    opacity: 0.9;
  }
</style>
