<template>
  <NavBar
    placeholder
    :fixed="true"
    :safe-area-inset-top="useNativeTopSafeArea"
    clickable
    v-bind="$attrs"
    :border="false"
  >
    <template #left>
      <slot v-if="$slots.left" name="left"></slot>
      <div v-else-if="isShowLeft" class="nav-back-button" @click="ToBack">
        <Icon name="arrow-left" :size="22" color="#fff" />
      </div>
    </template>
    <template v-if="$slots.title" #title>
      <slot name="title"></slot>
    </template>
    <template v-if="$slots.right" #right>
      <slot name="right"></slot>
    </template>
  </NavBar>
</template>

<script setup lang="ts">
  import { ref, watch, useAttrs } from 'vue';
  import { NavBar, Icon } from 'vant';
  // import { useRouter } from 'vue-router';
  import { Capacitor } from '@capacitor/core';
  // import { useUserStoreWithOut } from '/@/stores/modules/UserConfig';

  /** APP 内为顶栏补充安全区（与 index.less / syncNativeNavBarTopInset 配合） */
  const useNativeTopSafeArea = Capacitor.isNativePlatform();

  // const router = useRouter();

  // const UserStore = useUserStoreWithOut();

  /** attrs */
  const attrs = useAttrs();

  // 是否显示左侧返回按钮

  /** props */
  const props = defineProps({
    ShowLeft: {
      type: Boolean,
      default: () => {
        return true;
      }
    }
  });

  // 是否显示返回按钮

  /** 响应式状态：显隐控制 */
  const isShowLeft = ref<boolean>(true);

  // 监听

  /** 侦听依赖变化并触发副作用 */
  watch(
    () => props.ShowLeft,
    (newVal: boolean) => {
      isShowLeft.value = newVal;
    },
    { immediate: true, deep: true }
  );

  // 是否登录
  // const isLogin = computed(() => {
  //   return UserStore.getToken;
  // });

  /** ToBack */
  const ToBack = (): void => {
    /** 页面传入 @click-left 时须优先执行（默认左侧槽会拦截 Vant 的 click-left，原先从未触发） */
    const custom = attrs.onClickLeft as ((_event?: Event) => void) | undefined;
    if (typeof custom === 'function') {
      custom();
      return;
    }
    history.back();
  };
</script>

<style lang="less" scoped>
  // 返回按钮样式
  .nav-back-button {
    width: 0.8rem;
    height: 0.8rem;
    min-width: 0.8rem;
    min-height: 0.8rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    // 确保可点击
    pointer-events: auto;
    position: relative;
    z-index: 10002;
    // 增加点击区域
    padding: 0;
    margin: -0.1rem;
  }

  &:deep(.van-nav-bar__left) {
    padding: 0;
    // 确保返回按钮有足够的点击区域
    min-width: 0.8rem;
    min-height: 0.8rem;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    // 确保点击区域可点击
    pointer-events: auto;
    position: absolute;
    // z-index: 10001;
    left: 0;
    top: 0;

    .van-icon-arrow-left {
      font-size: 0.45rem;
    }
  }

  &:deep(.van-nav-bar--fixed) {
    position: fixed !important;
    // 确保 NavBar 在最上层
    // z-index: 10000 !important;
  }

  // 仅非 fixed 根节点用 relative，避免影响 fixed 定位与顶栏安全区
  &:deep(.van-nav-bar:not(.van-nav-bar--fixed)) {
    pointer-events: auto;
    position: relative;
  }

  &:deep(.van-nav-bar.van-nav-bar--fixed) {
    pointer-events: auto;
  }

  // 确保 NavBar 左侧区域可点击
  &:deep(.van-nav-bar__content) {
    position: relative;
    // z-index: 10001;
    pointer-events: auto;
  }
</style>
