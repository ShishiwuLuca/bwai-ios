<template>
  <NavBar :title="t('download_title')" :border="false" />
  <PageWrap>
    <div class="download-page__body">
      <div class="download-page__logo-wrap">
        <VanImage :src="Logo" width="2rem" />
      </div>
      <div class="download-page__img-wrap">
        <VanImage :src="DownloadIcon" width="80%" fit="contain" />
      </div>
    </div>
    <div class="download-page__footer">
      <Button
        block
        round
        class="download-page__btn-primary"
        @click="downloadApp"
      >{{ t('download_btn_open') }}</Button>
      <div class="download-page__btn-secondary" @click="downloadApp">
        {{ t('download_btn_get') }}
      </div>
    </div>
  </PageWrap>
  <Popup v-model:show="ShowSafariModel" position="bottom">
    <div class="p-1 text-center">
      <div class="w-full text-right p-0.5 !pr-0">
        <Icon @click="ShowSafariModel = !ShowSafariModel" color="#000" name="cross" :size="20" />
      </div>
      <div class="text-[0.3rem] text-[#333] mb-1">{{ t('str_app_download_safari_tips_1') }}</div>
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
  import DownloadIcon from '/@/assets/images/download_bg.png';
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

<style lang="less" scoped>
  .download-page__body {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 0.48rem;
    padding-bottom: 2.4rem;
  }

  .download-page__logo-wrap {
    margin-bottom: 0.48rem;
  }

  .download-page__img-wrap {
    width: 100%;
    display: flex;
    justify-content: center;
  }

  .download-page__footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 0.32rem 0.48rem;
    padding-bottom: calc(0.32rem + env(safe-area-inset-bottom));
    background: transparent;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.28rem;
  }

  .download-page__btn-primary {
    background: linear-gradient(180deg, #92b6ff 0%, #2a61f9 100%) !important;
    border: none !important;
    color: #fff !important;
    font-size: 0.32rem !important;
    font-weight: 600 !important;
  }

  .download-page__btn-secondary {
    font-size: 0.28rem;
    color: #2071f8;
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
  }
</style>
