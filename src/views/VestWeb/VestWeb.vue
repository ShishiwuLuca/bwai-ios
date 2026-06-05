<template>
  <div class="vest-web-shell" :style="shellStyle">
    <Loading v-if="webviewLoading" class="vest-web__loading" vertical>{{ loadingText }}</Loading>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onActivated, onUnmounted } from 'vue';
import { Capacitor } from '@capacitor/core';
import { Loading } from 'vant';
import { useI18n } from '/@/hooks/web/useI18n';
import { openInBrowser } from '/@/hooks/useAppLauncher';
import {
  resolveNativeTopInsetPx,
  scheduleNativeNavBarTopInsetSync
} from '/@/hooks/AppStatusBarUtils';
import { getVestDisplaySite, isVestHomeMode } from '/@/utils/vestConfig';

defineOptions({ name: 'VestWeb' });

const DEFAULT_HOME_WEB_URL = 'https://forwhale.com/';

const HOME_WEB_URL = computed(() => {
  if (isVestHomeMode()) {
    const site = getVestDisplaySite();
    if (site) return site;
  }
  return DEFAULT_HOME_WEB_URL;
});

const { t } = useI18n();
const loadingText = computed(() => t('dt_loading'));

const webviewLoading = ref(true);
const nativeTopInsetPx = ref(0);
const HOME_LOADING_MAX_MS = 10000;
let homeLoadingTimer: ReturnType<typeof setTimeout> | null = null;
let opening = false;

const shellStyle = computed(() => {
  if (!Capacitor.isNativePlatform() || nativeTopInsetPx.value <= 0) {
    return undefined;
  }
  return { paddingTop: `${nativeTopInsetPx.value}px` };
});

const syncTopInset = async () => {
  if (!Capacitor.isNativePlatform()) return;
  scheduleNativeNavBarTopInsetSync();
  const px = await resolveNativeTopInsetPx();
  if (px > 0) {
    nativeTopInsetPx.value = px;
  }
};

const clearHomeLoadingTimer = () => {
  if (homeLoadingTimer) {
    clearTimeout(homeLoadingTimer);
    homeLoadingTimer = null;
  }
};

const finishLoading = () => {
  clearHomeLoadingTimer();
  webviewLoading.value = false;
};

const openVestSite = async () => {
  if (opening) return;
  opening = true;
  webviewLoading.value = true;
  clearHomeLoadingTimer();
  homeLoadingTimer = setTimeout(finishLoading, HOME_LOADING_MAX_MS);

  try {
    await openInBrowser(HOME_WEB_URL.value, {
      toolbarColor: '#060b1e',
      presentationStyle: 'fullscreen'
    });
  } finally {
    opening = false;
    finishLoading();
  }
};

onActivated(() => {
  void syncTopInset();
  void openVestSite();
});

onUnmounted(() => {
  clearHomeLoadingTimer();
});
</script>

<style scoped lang="less">
@vest-safe-top: max(
  0px,
  constant(safe-area-inset-top),
  env(safe-area-inset-top),
  var(--safe-area-inset-top, 0px)
);

.vest-web-shell {
  position: relative;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  height: 100dvh;
  min-height: 100dvh;
  overflow: hidden;
  padding-top: constant(safe-area-inset-top);
  padding-top: @vest-safe-top;
  background: #060b1e;
}

.vest-web__loading {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #060b1e;
}
</style>
