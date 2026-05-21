<template>
  <div class="page-wrap" :class="[customClass]">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
  defineOptions({ name: 'PageWrap' });

  // 页面根容器：可选自定义类名，用于扩展样式
  withDefaults(
    defineProps<{
      customClass?: string;
    }>(),
    {
      customClass: ''
    }
  );
</script>

<style scoped lang="less">
  .page-wrap {
    // min-height: 100vh;
    background: var(--van-background);
    color: var(--van-text-color);
  }
</style>
