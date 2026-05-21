<template>
  <div class="app-card-linear" :class="[customClass]">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
  defineOptions({ name: 'AppCardLinear' });

  // 渐变卡片容器：可选自定义类名，使用主题渐变背景
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
  .app-card-linear {
    background: var(--van-card-linear-background);
    border-radius: 0.24rem;
    overflow: hidden;
  }
</style>
