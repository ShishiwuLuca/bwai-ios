<template>
  <div class="vest-web-shell" :style="shellStyle">
    <Loading v-if="webviewLoading" class="vest-web__loading" vertical>{{ loadingText }}</Loading>
    <iframe
      v-if="!useNativeDirectLoad"
      class="vest-web__frame"
      :src="HOME_WEB_URL"
      title="BGAI"
      frameborder="0"
      allowfullscreen
      allow="*"
      referrerpolicy="unsafe-url"
      @load="onWebviewLoad"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onActivated, onUnmounted } from 'vue';
import { Capacitor } from '@capacitor/core';
import { Loading } from 'vant';
import { useI18n } from '/@/hooks/web/useI18n';
import {
  resolveNativeTopInsetPx,
  scheduleNativeNavBarTopInsetSync
} from '/@/hooks/AppStatusBarUtils';
import { getVestDisplaySite, isVestHomeMode } from '/@/utils/vestConfig';

defineOptions({ name: 'VestWeb' });

const DEFAULT_HOME_WEB_URL = 'https://forwhale.com/';

const useNativeDirectLoad = Capacitor.isNativePlatform();

const resolveHomeWebUrl = (): string => {
  if (isVestHomeMode()) {
    const site = getVestDisplaySite();
    if (site) return site;
  }
  return DEFAULT_HOME_WEB_URL;
};

const HOME_WEB_URL = computed(() => resolveHomeWebUrl());

const openExternalSiteInNativeWebView = (): void => {
  const url = resolveHomeWebUrl();
  if (!url) return;
  try {
    const target = new URL(url);
    const current = new URL(window.location.href);
    if (current.origin === target.origin && current.pathname === target.pathname) {
      webviewLoading.value = false;
      return;
    }
  } catch {
    // ignore malformed URL comparison
  }
  window.location.replace(url);
};

const { t } = useI18n();
const loadingText = computed(() => t('dt_loading'));

const webviewLoading = ref(true);
const nativeTopInsetPx = ref(0);
const HOME_LOADING_MAX_MS = 10000;
let homeLoadingTimer: ReturnType<typeof setTimeout> | null = null;

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

const onWebviewLoad = () => {
  if (homeLoadingTimer) {
    clearTimeout(homeLoadingTimer);
    homeLoadingTimer = null;
  }
  webviewLoading.value = false;
};

onMounted(() => {
  void syncTopInset();
  if (useNativeDirectLoad) {
    openExternalSiteInNativeWebView();
    return;
  }
  homeLoadingTimer = setTimeout(() => {
    webviewLoading.value = false;
    homeLoadingTimer = null;
  }, HOME_LOADING_MAX_MS);
});

onActivated(() => {
  void syncTopInset();
});

onUnmounted(() => {
  if (homeLoadingTimer) {
    clearTimeout(homeLoadingTimer);
    homeLoadingTimer = null;
  }
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

.vest-web__frame {
  flex: 1;
  width: 100%;
  min-height: 0;
  border: 0;
  background: #fff;
}
</style>
