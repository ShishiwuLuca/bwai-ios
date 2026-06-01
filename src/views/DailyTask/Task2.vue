<template>
  <PageWrap class="task-page">
    <NavBar title="每日任务" fixed placeholder :border="false" />
    <div class="task-page__banner">（任务插图）</div>
    <Button type="primary" block round class="task-page__btn">领取工资</Button>
    <AppCard class="task-page__card">
      <div class="task-page__card-title">邀请用户参与任务</div>
      <p class="task-page__card-desc">邀请好友参与任务，获得更多奖励。按要求完成邀请流程即可。</p>
    </AppCard>
    <Button
      type="primary"
      block
      round
      class="task-page__btn2"
      @click="$router.push({ name: 'Invite' })"
      >邀请好友</Button
    >
  </PageWrap>
</template>

<script setup lang="ts">
  // 每日任务-邀请用户：玩法说明与跳转邀请页
  import { NavBar, PageWrap, AppCard } from '/@/components';
  import { Button } from 'vant';
</script>

<style scoped lang="less">
  .task-page {
    color: var(--van-text-color);
  }

  .task-page__banner {
    height: 1.8rem;
    background: var(--van-card-linear-background);
    margin: 0 0.32rem 0.24rem;
    border-radius: 0.24rem;
  }

  .task-page__btn {
    margin: 0 0.32rem 0.24rem;
    height: 0.8rem;
  }

  .task-page__card {
    margin: 0 0.32rem 0.24rem;
    padding: 0.28rem;
  }

  .task-page__card-title {
    font-size: 0.3rem;
    font-weight: bold;
    margin-bottom: 0.16rem;
  }

  .task-page__card-desc {
    font-size: 0.26rem;
    opacity: 0.9;
  }

  .task-page__btn2 {
    margin: 0 0.32rem;
    height: 0.8rem;
  }
</style>
