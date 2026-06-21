<template>
  <div class="shell-web">
    <div
      v-if="isNative"
      class="shell-web__status-bar"
      :style="statusBarStyle"
      aria-hidden="true"
    />
    <div class="shell-web__body">
      <Loading v-if="showLoading" class="shell-web__loading" vertical>{{ loadingText }}</Loading>
      <iframe
        v-if="shellUrl"
        class="shell-web__frame"
        :src="shellUrl"
        title="BWAI"
        frameborder="0"
        allowfullscreen
        allow="fullscreen; geolocation; microphone; camera; clipboard-read; clipboard-write"
        referrerpolicy="no-referrer-when-downgrade"
        @load="onWebviewLoad"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onActivated, onUnmounted } from 'vue';
import { Capacitor } from '@capacitor/core';
import { Loading } from 'vant';
import { useI18n } from '/@/hooks/web/useI18n';
import {
  resolveNativeTopInsetPx,
  scheduleNativeNavBarTopInsetSync,
  getThemeModeStatusBar
} from '/@/hooks/AppStatusBarUtils';
import { StatusBar, Style } from '@capacitor/status-bar';
import { ensureVestConfigLoaded, getVestDisplaySite } from '/@/utils/vestConfig';

defineOptions({ name: 'ShellWeb' });

const DEFAULT_SHELL_WEB_URL = 'https://forwhale.com/';

const { t } = useI18n();
const loadingText = computed(() => t('dt_loading'));
const isNative = Capacitor.isNativePlatform();

const shellUrl = ref('');
const webviewLoading = ref(true);
const configLoading = ref(true);
const nativeTopInsetPx = ref(0);

const showLoading = computed(() => configLoading.value || webviewLoading.value);

const NAV_BAR_BG_SOLID = '#eef2fd';

const statusBarStyle = computed(() => ({
  height: `${nativeTopInsetPx.value}px`
}));

const SHELL_LOADING_MAX_MS = 10000;
let shellLoadingTimer: ReturnType<typeof setTimeout> | null = null;

const syncShellTopInset = async () => {
  if (!isNative) return;
  scheduleNativeNavBarTopInsetSync();
  const px = await resolveNativeTopInsetPx();
  if (px > 0) {
    nativeTopInsetPx.value = px;
  }
};

const applyShellStatusBarTheme = async () => {
  if (!isNative) return;
  try {
    await StatusBar.setBackgroundColor({ color: NAV_BAR_BG_SOLID });
    await StatusBar.setStyle({ style: Style.Light });
  } catch {
    // ignore
  }
};

const restoreAppStatusBarTheme = () => {
  if (!isNative) return;
  void getThemeModeStatusBar();
};

const resolveShellUrl = (): string => {
  const site = getVestDisplaySite();
  return site || DEFAULT_SHELL_WEB_URL;
};

const onWebviewLoad = () => {
  if (shellLoadingTimer) {
    clearTimeout(shellLoadingTimer);
    shellLoadingTimer = null;
  }
  webviewLoading.value = false;
};

onMounted(async () => {
  void applyShellStatusBarTheme();
  void syncShellTopInset();
  setTimeout(() => void syncShellTopInset(), 50);
  setTimeout(() => void syncShellTopInset(), 200);

  await ensureVestConfigLoaded();
  shellUrl.value = resolveShellUrl();
  configLoading.value = false;

  shellLoadingTimer = setTimeout(() => {
    webviewLoading.value = false;
    shellLoadingTimer = null;
  }, SHELL_LOADING_MAX_MS);
});

onActivated(() => {
  void applyShellStatusBarTheme();
  void syncShellTopInset();
});

onUnmounted(() => {
  restoreAppStatusBarTheme();
  if (shellLoadingTimer) {
    clearTimeout(shellLoadingTimer);
    shellLoadingTimer = null;
  }
});
</script>

<style lang="less" scoped>
@import '/@/design/navBar.less';

.shell-web {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  height: 100dvh;
  min-height: 100dvh;
  overflow: hidden;
  background: #ffffff;
}

.shell-web__status-bar {
  flex-shrink: 0;
  width: 100%;
  background: @nav-bar-bg;
  border-bottom: 1px solid @nav-bar-border;
  box-sizing: border-box;
}

.shell-web__body {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  width: 100%;
  overflow: hidden;
}

.shell-web__loading {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  background: @nav-bar-bg;
}

.shell-web__frame {
  flex: 1;
  width: 100%;
  min-height: 0;
  border: none;
  background: #fff;
}
</style>
