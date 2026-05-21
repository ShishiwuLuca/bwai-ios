<template>
  <div class="wallet">
    <div class="center mt-10">
      <Empty image="search" :description="t('subTitle404')" />
      <div class="m-5">
        <Button block round type="primary" to="/">{{ t('backHome') }}</Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  // Vant 空状态与按钮
  import { Button, Empty } from 'vant';
  import { useI18n } from '/@/hooks/web/useI18n';

  /** 从 useI18n 解构的文案与能力 */
  const { t } = useI18n();
</script>

<style lang="less" scoped>
  .wallet {
    position: fixed;
    width: -webkit-fill-available;
    height: 100%;
    overflow: hidden;
    left: 0;
    top: 0;
    .color_a9 {
      color: #999ba9;
    }
  }
</style>
