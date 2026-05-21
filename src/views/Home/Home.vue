<template>
  <div class="home-page-shell" :style="shellStyle">
    <Loading v-if="webviewLoading" class="home-page__loading" vertical>{{ t('dt_loading') }}</Loading>
    <iframe
      class="home-page__webview"
      :src="HOME_WEB_URL"
      title="BWAI"
      frameborder="0"
      allowfullscreen
      allow="fullscreen; geolocation; microphone; camera"
      referrerpolicy="no-referrer-when-downgrade"
      @load="onWebviewLoad"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onActivated } from 'vue';
import { Capacitor } from '@capacitor/core';
import { Loading } from 'vant';
import { useI18n } from '/@/hooks/web/useI18n';
import {
  resolveNativeTopInsetPx,
  scheduleNativeNavBarTopInsetSync
} from '/@/hooks/AppStatusBarUtils';
import { getVestDisplaySite, isVestHomeMode } from '/@/utils/vestConfig';

const DEFAULT_HOME_WEB_URL = 'https://forwhale.com/';

const HOME_WEB_URL = computed(() => {
  if (isVestHomeMode()) {
    const site = getVestDisplaySite();
    if (site) return site;
  }
  return DEFAULT_HOME_WEB_URL;
});

const { t } = useI18n();

const webviewLoading = ref(true);
const nativeTopInsetPx = ref(0);

const shellStyle = computed(() => {
  if (!Capacitor.isNativePlatform() || nativeTopInsetPx.value <= 0) {
    return undefined;
  }
  return { paddingTop: `${nativeTopInsetPx.value}px` };
});

const syncHomeTopInset = async () => {
  if (!Capacitor.isNativePlatform()) return;
  scheduleNativeNavBarTopInsetSync();
  const px = await resolveNativeTopInsetPx();
  if (px > 0) {
    nativeTopInsetPx.value = px;
  }
};

const onWebviewLoad = () => {
  webviewLoading.value = false;
};

onMounted(() => {
  void syncHomeTopInset();
});

onActivated(() => {
  void syncHomeTopInset();
});
</script>

<style scoped lang="less">
/* 与 NavBar / index.less 一致：env + --safe-area-inset-top（App 内由 StatusBar 同步） */
@home-safe-top: max(0px, constant(safe-area-inset-top), env(safe-area-inset-top), var(--safe-area-inset-top, 0px));

.home-page-shell {
  position: relative;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  height: 100dvh;
  min-height: 100dvh;
  overflow: hidden;
  padding-top: constant(safe-area-inset-top);
  padding-top: @home-safe-top;
  background: #060b1e;
}

.home-page__loading {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #060b1e;
}

.home-page__webview {
  flex: 1;
  width: 100%;
  min-height: 0;
  border: 0;
  background: #fff;
}
</style>
