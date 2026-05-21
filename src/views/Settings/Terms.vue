<template>
  <PageWrap class="terms-page">
    <NavBar title="服务条款" fixed placeholder :border="false" />
    <div class="terms-page__content">
      <p
        >服务条款详细内容。Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
        exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p
      >
      <p
        >Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat
        nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia
        deserunt mollit anim id est laborum.
      </p>
    </div>
  </PageWrap>
</template>

<script setup lang="ts">
  // 服务条款/隐私政策展示页，仅展示文案
  import { NavBar, PageWrap } from '/@/components';
</script>

<style scoped lang="less">
  .terms-page {
    color: var(--van-text-color);
  }

  .terms-page__content {
    padding: 0.32rem;
    font-size: 0.28rem;
    line-height: 1.6;
  }
</style>
