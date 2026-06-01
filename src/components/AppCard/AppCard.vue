<template>
  <div class="app-card" :class="[customClass]">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
  defineOptions({ name: 'AppCard' });

  // 卡片容器：可选自定义类名，使用主题卡片背景
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
  .app-card {
    background: var(--van-card-background);
    border-radius: 0.24rem;
    overflow: hidden;
  }
</style>
