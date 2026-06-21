<template>
  <Overlay
    v-if="!isNativeApp"
    :show="isShowLoading"
    :z-index="24000"
    :duration="isShowLoading ? 0 : 0.5"
    :class="'!bg-[var(--van-background)] !bg-opacity-50'"
  >
    <div class="h-100% w-100% flex items-center justify-center">
      <div class="text-center w-full flex flex-col items-center text-[#aaa]">
        <VanImage :src="Logo" width="2.5rem" />
        <div>LOADING</div>
      </div>
    </div>
  </Overlay>
</template>

<script setup lang="ts">
  import { Overlay, Image as VanImage } from 'vant';
  import { Capacitor } from '@capacitor/core';
  import { onUnmounted, ref, watchEffect, computed } from 'vue';
  import { useSystemStoreWithOut } from '/@/stores/modules/SystemConfig';
  import { removePageShellSplash } from '/@/utils/pageShellBg';

  const isNativeApp = Capacitor.isNativePlatform();

  const SystemStore = useSystemStoreWithOut();

  const isShowLoading = ref<boolean>(false);

  const TimeInterval = ref<any>();

  const Logo = computed(() => {
    return SystemStore.getLoginLogo;
  });

  const StartInterval = (): void => {
    clearInterval(TimeInterval.value);
    TimeInterval.value = setInterval(() => {
      SystemStore.setLoading(false);
      clearInterval(TimeInterval.value);
      isShowLoading.value = false;
      removePageShellSplash();
    }, 1000);
  };

  watchEffect(() => {
    if (SystemStore.Loading) {
      isShowLoading.value = true;
      StartInterval();
    } else {
      isShowLoading.value = false;
      clearInterval(TimeInterval.value);
      removePageShellSplash();
    }
  });

  onUnmounted((): void => {
    SystemStore.setLoading(false);
    clearInterval(TimeInterval.value);
    isShowLoading.value = false;
    removePageShellSplash();
  });
</script>

<style lang="less" scoped></style>
