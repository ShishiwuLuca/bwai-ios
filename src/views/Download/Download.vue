<template>
  <NavBar :title="t('download_title')" :border="false" />
  <PageWrap>
    <div class="text-center mt-1">
      <VanImage :src="Logo" width="2rem" />
      <!-- <div class="text-[0.35rem] font-bold">{{ SiteName }}</div> -->
      <!-- <div class="text-[0.55rem]">{{ t('download_desc', [SiteName]) }}</div> -->
      <div class="text-[0.28rem]">{{ t('download_desc_2') }}</div>
    </div>
    <div class="text-center mb-10">
      <VanImage :src="DownloadIcon" width="70%" class="mt-2" />
    </div>
    <div class="fixed bottom-0 p-1 w-full bg-[var(--van-background)]">
      <Button type="primary" block round @click="downloadApp">{{ t('download_btn') }}</Button>
    </div>
  </PageWrap>
  <Popup v-model:show="ShowSafariModel" position="bottom">
    <div class="p-1 text-center">
      <div class="w-full text-right p-0.5 !pr-0">
        <Icon @click="ShowSafariModel = !ShowSafariModel" color="white" name="cross" :size="20" />
      </div>
      <div class="text-[0.3rem] text-white mb-1">{{ t('str_app_download_safari_tips_1') }}</div>
      <VanImage :src="Safari" width="60%" />
    </div>
  </Popup>
</template>

<script setup lang="ts">
  import { NewOpenWindow } from '/@/utils';
  import Safari from '/@/assets/Safari.png';
  import { computed, ref, watch } from 'vue';
  import { useWindowSize } from '@vueuse/core';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { NavBar, PageWrap } from '/@/components';
  // import Logo from '/@/assets/images/header_logo.png';
  import DownloadIcon from '/@/assets/images/download.png';
  import { Image as VanImage, Button, Icon, Popup } from 'vant';
  import { useSystemStoreWithOut } from '/@/stores/modules/SystemConfig';

  /** 从 useI18n 解构的文案与能力 */
  const { t } = useI18n();

  /** SystemStore */
  const SystemStore = useSystemStoreWithOut();

  // 是否显示引导弹窗
  const ShowSafariModel = ref<boolean>(false);

  // 是否iOS
  const isIphone = ref<boolean>(/iPad|iPhone|iPod/.test(navigator.userAgent));

  // 窗口大小
  const { width, height } = useWindowSize();

  // 安卓APP下载地址

  /** 计算属性：由其它状态派生的展示或判断 */
  const AndroidPackageUrl = computed(() => {
    return SystemStore.getAndroidPackageUrl;
  });

  // iOS APP下载地址

  /** 计算属性：由其它状态派生的展示或判断 */
  // const IosPackageUrl = computed(() => {
  //   return SystemStore.getIosPackageUrl;
  // });

  // logo

  /** 计算属性：由其它状态派生的展示或判断 */
  const Logo = computed(() => {
    return SystemStore.getSiteLogo;
  });

  // 站点名称
  // const SiteName = computed(() => {
  //   return SystemStore.getSiteName;
  // });

  // 监听
  watch([width, height], () => {
    setTimeout(() => {
      isIphone.value = /iPad|iPhone|iPod/.test(navigator.userAgent);
    }, 500);
  });

  // 下载APP

  /** 拉取接口数据：downloadApp */
  const downloadApp = () => {
    // 根据浏览器UA判断系统平台
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('android')) {
      NewOpenWindow(AndroidPackageUrl.value);
    } else if (ua.includes('iphone') || ua.includes('ipad')) {
      InstallPWA();
    } else if (window.pwaDeferredPrompt) {
      window.pwaDeferredPrompt.prompt();
    }
  };

  // 安装PWA
  const InstallPWA = () => {

    // 如果是Safari浏览器
    if (isIphone.value) {
      ShowSafariModel.value = true;
      return false;
    }

    if (window.pwaDeferredPrompt) {
      console.log('window.pwaDeferredPrompt', window.pwaDeferredPrompt);
      window.pwaDeferredPrompt.prompt();
    }
  };
</script>

<style lang="less" scoped></style>
