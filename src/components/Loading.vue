<template>
  <Overlay
    :show="isShowLoading"
    :z-index="24000"
    :duration="isShowLoading ? 0 : 0.5"
    class="!bg-[var(--van-background)] !bg-opacity-50"
  >
    <div class="h-100% w-100% flex items-center justify-center">
      <div :style="{ display: 'ruby-text' }" class="text-center w-full text-[#aaa]">
        <VanImage :src="Logo" width="2.5rem" />
        <div>LOADING</div>
      </div>
    </div>
  </Overlay>
</template>

<script setup lang="ts">
  // Vant 遮罩与图片
  import { Overlay, Image as VanImage } from 'vant';
  import { onUnmounted, ref, watchEffect, computed } from 'vue';
  import { useSystemStoreWithOut } from '/@/stores/modules/SystemConfig';

  /** SystemStore */
  const SystemStore = useSystemStoreWithOut();

  // 是否显示加载动画

  /** 响应式状态：加载中状态 */
  const isShowLoading = ref<boolean>(false);

  // 定时器

  /** 响应式状态：TimeInterval 相关 UI 或数据 */
  const TimeInterval = ref<any>();

  // 动画以执行秒数
  // const AnimationTime = ref<number>(0);

  // 主题色
  // const ThemeColor: any = computed(() => {
  //   return SystemStore.getThemeColor;
  // });

  // 主题模式
  // const ThemeMode = computed(() => {
  //   return SystemStore.getDarkMode;
  // });

  // // 获取logo
  // const getLogoImages = computed(() => {
  //   return new URL(`../assets/images/header_logo.png`, import.meta.url).href;
  // });

  // logo

  /** 计算属性：由其它状态派生的展示或判断 */
  const Logo = computed(() => {
    return SystemStore.getLoginLogo;
  });

  // 启动定时器

  /** StartInterval */
  const StartInterval = (): void => {
    TimeInterval.value = setInterval(() => {
      // // 如果动画执行秒数小于5秒
      // if (AnimationTime.value < 5) {
      //   // 更新动画执行秒数
      //   AnimationTime.value = AnimationTime.value + 1;
      // } else {
      // 关闭加载动画
      SystemStore.setLoading(false);
      clearInterval(TimeInterval.value);
      isShowLoading.value = false;
      // }
    }, 1000);
  };

  // 监听当前游戏动画状态

  /** 自动追踪依赖并执行副作用 */
  watchEffect(() => {
    // 如果加载动画已开启
    if (SystemStore.Loading) {
      isShowLoading.value = true;
      // 启动定时器
      StartInterval();
    } else {
      // 如果当前动画执行秒数小于1秒
      // if (AnimationTime.value < 1) {
      //   setTimeout(() => {
      //     isShowLoading.value = false;
      //   }, 500);
      // } else {
      isShowLoading.value = false;
      // }
      // 清除定时器
      clearInterval(TimeInterval.value);
    }
  });

  // 销毁

  /** 组件卸载时清理副作用 */
  onUnmounted((): void => {
    // 关闭加载动画
    SystemStore.setLoading(false);
    clearInterval(TimeInterval.value);
    isShowLoading.value = false;
  });
</script>

<style lang="less" scoped></style>
