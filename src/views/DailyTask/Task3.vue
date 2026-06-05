<template>
  <PageWrap class="task-page">
    <NavBar title="每日任务" fixed placeholder :border="false" />
    <div class="task-page__banner">（任务插图）</div>
    <Button type="primary" block round class="task-page__btn">领取工资</Button>
    <AppCard class="task-page__card">
      <div class="task-page__card-title">首次登陆分享</div>
      <p class="task-page__card-desc">新用户可获得专属奖励</p>
      <div class="task-page__icons">（TikTok / YouTube / Facebook / Instagram）</div>
      <div class="task-page__actions">
        <Button size="small" plain>复制链接</Button>
        <Button size="small" type="primary">一键分享</Button>
      </div>
    </AppCard>
    <AppCard class="task-page__card task-page__card--rule">
      <div class="task-page__card-title">邀请规则</div>
      <p class="task-page__card-desc">规则说明内容...</p>
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
  // 每日任务-首次登陆分享：分享与邀请规则展示
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

  .task-page__icons {
    font-size: 0.24rem;
    margin: 0.16rem 0;
  }

  .task-page__actions {
    display: flex;
    gap: 0.2rem;
    margin-top: 0.16rem;
  }

  .task-page__card--rule {
    margin-top: 0.16rem;
  }

  .task-page__btn2 {
    margin: 0 0.32rem;
    height: 0.8rem;
  }
</style>
