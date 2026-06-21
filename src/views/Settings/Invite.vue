<template>
  <PageWrap class="invite-page">
    <NavBar title="邀请好友" fixed placeholder :border="false" />
    <div class="invite-page__content">
      <AppCardLinear class="invite-page__banner">
        <p class="invite-page__slogan">Share with friends, & drive qualitative dividends</p>
        <div class="invite-page__img">（插图）</div>
      </AppCardLinear>
      <div class="invite-page__link-row">
        <Field v-model="inviteLink" readonly class="invite-page__field" />
        <Button size="small" type="primary" @click="copyLink">复制</Button>
      </div>
      <div class="invite-page__qrcode">
        <p>邀请码</p>
        <div class="invite-page__qrcode-img">（二维码）</div>
      </div>
      <Button type="primary" block round class="invite-page__btn">立即邀请</Button>
    </div>
  </PageWrap>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { NavBar, PageWrap, AppCardLinear } from '/@/components';
  import { Field, Button } from 'vant';

  /** 邀请链接（待从接口或用户信息获取） */
  const inviteLink = ref('https://example.com/invite/xxx');

  /** copyLink */
  const copyLink = () => {
    console.log('copy', inviteLink.value);
  };
</script>

<style scoped lang="less">
  .invite-page {
    color: var(--van-text-color);
  }

  .invite-page__content {
    padding: 0.32rem;
  }

  .invite-page__banner {
    padding: 0.4rem;
    margin-bottom: 0.32rem;
  }

  .invite-page__slogan {
    font-size: 0.28rem;
    margin-bottom: 0.16rem;
  }

  .invite-page__img {
    height: 1.6rem;
    font-size: 0.24rem;
    opacity: 0.8;
  }

  .invite-page__link-row {
    display: flex;
    align-items: center;
    gap: 0.16rem;
    margin-bottom: 0.32rem;
  }

  .invite-page__field {
    flex: 1;
  }

  .invite-page__field :deep(.van-cell) {
    background: var(--van-field-background);
  }

  .invite-page__qrcode {
    text-align: center;
    margin-bottom: 0.32rem;
  }

  .invite-page__qrcode-img {
    width: 2rem;
    height: 2rem;
    margin: 0.16rem auto 0;
    background: var(--van-card-background);
    border-radius: 0.16rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.24rem;
  }

  .invite-page__btn {
    height: 0.88rem;
  }
</style>
