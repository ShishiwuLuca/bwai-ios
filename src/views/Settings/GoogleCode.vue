<template>
  <PageWrap class="google-code-page min-h-screen bg-color-0D101C">
    <!-- Unbind UI -->
    <template v-if="isBound">
      <NavBar
        :title="t('unbind_google_title')"
        fixed
        placeholder
        :border="false"
        left-arrow
        @click-left="router.back()"
      />
      <div class="flex flex-col items-center p-1 pt-10">
        <VanImage :src="AuthenticatorIcon" width="1.6rem" class="mb-4" />
        <div class="flex items-center gap-0.5 mb-1">
          <Icon name="checked" color="var(--van-success-color)" size="20" />
          <span class="text-white text-[0.32rem] font-bold">{{ t('unbind_google_status') }}</span>
        </div>
      </div>
      <div class="p-1">
        <div class="mb-2">
          <div class="text-white text-[0.28rem] mb-1">{{ t('unbind_google_code') }}</div>
          <Field
            clearable
            center
            size="large"
            v-model="unbindCode"
            type="digit"
            :maxlength="6"
            :placeholder="t('unbind_google_code_placeholder')"
            autocomplete="off"
            class="!rounded-sm"
            :border="false"
            :formatter="(v) => (v || '').replace(/\D/g, '')"
            inputmode="numeric"
          >
            <template #button>
              <span
                class="text-[var(--van-primary-color)] text-[0.28rem]"
                @click="pasteUnbindCode"
                >{{ t('unbind_google_paste') }}</span
              >
            </template>
          </Field>
        </div>
        <div class="w-full fixed bottom-0 left-0 p-1 bg-color-0D101C">
          <Button type="primary" block round :loading="loading" @click="submitUnbind">
            {{ t('common_text_btnConfirm') }}
          </Button>
        </div>
      </div>
    </template>
    <template v-else>
      <!-- Step 1: Download -->
      <template v-if="step === 1">
        <NavBar
          :title="t('bind_google_title')"
          fixed
          placeholder
          :border="false"
          left-arrow
          @click-left="router.back()"
        />
        <div class="flex flex-col items-center pt-10 px-4 pb-10">
          <VanImage :src="AuthenticatorIcon" width="2rem" class="mb-6" />
          <div class="text-white text-[0.36rem] font-bold mb-4">{{
            t('bind_google_step1_title')
          }}</div>
          <div class="text-[#9DA8E1] text-[0.26rem] text-center mb-10">{{
            t('bind_google_step1_desc')
          }}</div>

          <div class="w-full fixed bottom-0 left-0 p-4 bg-color-0D101C">
            <div class="mb-1">
              <Button type="primary" block round @click="downloadApp">
                {{ t('bind_google_step1_btn') }}
              </Button>
            </div>
            <Button
              block
              round
              plain
              type="primary"
              class="!bg-transparent !border-[#1C2032] !text-white"
              @click="step = 2"
            >
              {{ t('bind_google_next') }}
            </Button>
          </div>
        </div>
      </template>

      <!-- Step 2: Show QR & Secret -->
      <template v-if="step === 2">
        <NavBar
          :title="t('bind_google_title')"
          fixed
          placeholder
          :border="false"
          left-arrow
          @click-left="step = 1"
        />
        <div class="flex flex-col items-center pt-6 p-1 pb-10">
          <VanImage :src="AuthenticatorIcon" width="1.2rem" class="mb-4" />
          <div class="text-white text-[0.36rem] font-bold mb-2">{{
            t('bind_google_step2_title')
          }}</div>
          <div class="text-[#9DA8E1] text-[0.26rem] text-center mb-6">{{
            t('bind_google_step2_desc')
          }}</div>

          <div class="bg-white p-1 rounded-sm mb-4">
            <QrcodeVue v-if="googleInfo.secret" :value="qrCodeValue" :size="160" level="M" />
          </div>
          <Field
            clearable
            center
            size="large"
            v-model="googleInfo.secret"
            readonly
            class="!rounded-sm !text-white mb-1"
            :border="false"
          >
            <template #button>
              <Icon
                class-prefix="exchange-icon"
                name="copy"
                :size="20"
                color="var(--van-primary-color)"
                @click="copySecret"
              />
            </template>
          </Field>
          <div
            class="w-full bg-[#2A171D] border border-[#E61546] rounded-sm p-1 flex items-start gap-0.5"
          >
            <Icon name="info-o" color="#E61546" size="18" class="mt-0.5" />
            <div class="text-[#E61546] text-[0.24rem] whitespace-pre-wrap leading-relaxed">{{
              t('bind_google_step2_warning')
            }}</div>
          </div>

          <div class="w-full fixed bottom-0 left-0 p-1 bg-color-0D101C">
            <Button
              block
              round
              plain
              type="primary"
              class="!bg-transparent !text-white"
              @click="step = 3"
            >
              {{ t('bind_google_next') }}
            </Button>
          </div>
        </div>
      </template>

      <!-- Step 3: Tutorial -->
      <template v-if="step === 3">
        <NavBar
          :title="t('bind_google_step3_title')"
          fixed
          placeholder
          :border="false"
          left-arrow
          @click-left="step = 2"
        />
        <div class="p-1 pb-10">
          <div class="mb-1">
            <div class="text-white text-[0.28rem] mb-1">{{
              t('bind_google_step3_account_name')
            }}</div>
            <Field v-model="userInfo.email" readonly class="!rounded-sm" :border="false" />
          </div>
          <div class="mb-1">
            <div class="text-white text-[0.28rem] mb-1">{{ t('bind_google_step3_your_key') }}</div>
            <Field
              clearable
              center
              size="large"
              v-model="googleInfo.secret"
              readonly
              class="!rounded-sm"
              :border="false"
            >
              <template #button>
                <Icon
                  class-prefix="exchange-icon"
                  name="copy"
                  :size="20"
                  color="var(--van-primary-color)"
                  @click="copySecret"
                />
              </template>
            </Field>
          </div>
          <Button type="primary" block round @click="step = 4">
            {{ t('bind_google_step3_add') }}
          </Button>
        </div>
      </template>
      <!-- Step 4: Bind -->
      <template v-if="step === 4">
        <NavBar
          :title="t('bind_google_title')"
          fixed
          placeholder
          :border="false"
          left-arrow
          @click-left="step = 3"
        />
        <div class="p-1 pb-10">
          <div class="mb-4">
            <div class="text-white text-[0.28rem] mb-2">{{ t('bind_google_step4_code') }}</div>
            <Field
              v-model="code"
              type="digit"
              :maxlength="6"
              :placeholder="t('bind_google_step4_code_placeholder')"
              autocomplete="off"
              class="!rounded-sm"
              :border="false"
              :formatter="(v) => (v || '').replace(/\D/g, '')"
              inputmode="numeric"
            >
              <template #button>
                <span class="text-[var(--van-primary-color)] text-[0.28rem]" @click="pasteCode">{{
                  t('bind_google_step4_paste')
                }}</span>
              </template>
            </Field>
          </div>
          <Button type="primary" block round :loading="loading" @click="submitBind">
            {{ t('bind_google_step4_bind') }}
          </Button>
        </div>
      </template>
    </template>
  </PageWrap>
</template>

<script setup lang="ts">
  import { useI18n } from 'vue-i18n';
  import QrcodeVue from 'qrcode.vue';
  import { useRouter } from 'vue-router';
  import { Capacitor } from '@capacitor/core';
  import { getAppEnvConfig } from '/@/utils/env';
  import { NavBar, PageWrap } from '/@/components';
  import { ref, computed, onBeforeMount } from 'vue';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { openInBrowser } from '/@/hooks/useAppLauncher';
  import { NewOpenWindow, useCopyToClipboard } from '/@/utils';
  import { Button, Image as VanImage, Icon, Field } from 'vant';
  import { useUserStoreWithOut } from '/@/stores/modules/UserConfig';
  import AuthenticatorIcon from '/@/assets/images/Authenticator.png';
  import { generateGoogleCode, bindGoogleCode, unbindGoogleCode } from '/@/service/User';

  /** 从 useI18n 解构的文案与能力 */
  const { t } = useI18n();

  /** 路由实例：编程式导航 */
  const router = useRouter();

  /** 从 useMessage 解构的 Toast / Dialog 能力 */
  const { CreateToast } = useMessage();

  /** 用户：UserStore */
  const UserStore = useUserStoreWithOut();

  const { VITE_GLOB_APP_TITLE } = getAppEnvConfig();

  // 步骤

  /** 响应式状态：step 相关 UI 或数据 */
  const step = ref<number>(1);

  // 加载状态

  /** 响应式状态：加载中状态 */
  const loading = ref<boolean>(false);

  // 谷歌验证码

  /** 响应式状态：code 相关 UI 或数据 */
  const code = ref<string>('');

  // 解绑谷歌验证码

  /** 响应式状态：unbindCode 相关 UI 或数据 */
  const unbindCode = ref<string>('');

  // 谷歌验证码信息

  /** 响应式状态：googleInfo 相关 UI 或数据 */
  const googleInfo = ref<any>({
    secret: '',
    qrcode: ''
  });

  // 用户信息

  /** 计算属性：用户 */
  const userInfo: any = computed(() => {
    return UserStore.getUserInfo;
  });

  // 是否已绑定谷歌验证码

  /** 计算属性：由其它状态派生的展示或判断 */
  const isBound = computed(() => userInfo.value.googleCodeSet === true);

  // 二维码值

  /** 计算属性：由其它状态派生的展示或判断 */
  const qrCodeValue = computed(() => {
    // 如果二维码值存在，则直接返回
    if (googleInfo.value.qrcode) return googleInfo.value.qrcode;
    // 如果二维码值不存在，则生成二维码值
    // 默认账号名称
    const accountName = userInfo.value.nickname || VITE_GLOB_APP_TITLE;
    // 生成二维码值
    return `otpauth://totp/${VITE_GLOB_APP_TITLE}:${accountName}?secret=${googleInfo.value.secret}&issuer=${VITE_GLOB_APP_TITLE}`;
  });

  // 获取谷歌验证码

  /** 拉取接口数据：fetchGoogleCode */
  const fetchGoogleCode = () => {
    generateGoogleCode()
      .then((res: any) => {
        if (res.code === 0 && res.data) {
          googleInfo.value.secret = res.data.secret || res.data;
          googleInfo.value.qrcode = res.data.qrcode || '';
        }
      })
      .catch((error) => {
        console.error('Failed to generate google code', error);
      });
  };

  // 下载谷歌验证码

  /** 拉取接口数据：downloadApp */
  const downloadApp = () => {
    const ua = navigator.userAgent.toLowerCase();
    const isNative = Capacitor.isNativePlatform();

    // 如果是APP
    if (isNative) {
      // 如果是安卓
      if (Capacitor.getPlatform() === 'android') {
        openInBrowser(
          'https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2'
        );
      } else {
        openInBrowser('https://apps.apple.com/app/google-authenticator/id388497605');
      }
    } else {
      // 如果是iOS
      if (ua.includes('iphone') || ua.includes('ipad')) {
        NewOpenWindow('https://apps.apple.com/app/google-authenticator/id388497605');
      } else {
        NewOpenWindow(
          'https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2'
        );
      }
    }
  };

  // 复制谷歌验证码

  /** copySecret */
  const copySecret = () => {
    if (!googleInfo.value.secret) return;
    useCopyToClipboard(googleInfo.value.secret);
    CreateToast(t('copy_success'));
  };

  // 粘贴绑定谷歌验证码

  /** pasteCode */
  const pasteCode = () => {
    navigator.clipboard
      .readText()
      .then((text) => {
        if (text && /^\d{6}$/.test(text.trim())) {
          code.value = text.trim();
        } else {
          CreateToast('粘贴内容格式不正确');
        }
      })
      .catch((err) => {
        console.error('Failed to read clipboard', err);
      });
  };

  // 粘贴解绑谷歌验证码

  /** pasteUnbindCode */
  const pasteUnbindCode = () => {
    navigator.clipboard
      .readText()
      .then((text) => {
        if (text && /^\d{6}$/.test(text.trim())) {
          unbindCode.value = text.trim();
        } else {
          CreateToast('粘贴内容格式不正确');
        }
      })
      .catch((err) => {
        console.error('Failed to read clipboard', err);
      });
  };

  // 提交绑定谷歌验证码

  /** 提交中：submitBind */
  const submitBind = () => {
    if (!code.value || code.value.length !== 6) {
      CreateToast(t('bind_google_step4_code_placeholder'));
      return;
    }

    loading.value = true;
    bindGoogleCode({ code: code.value, secret: googleInfo.value.secret })
      .then((res: any) => {
        if (res.code === 0) {
          CreateToast(t('bind_google_success'));
          UserStore.fetchUserInfo();
          setTimeout(() => {
            router.back();
          }, 1500);
        }
      })
      .catch((error) => {
        console.error('Failed to bind google code', error);
      })
      .finally(() => {
        loading.value = false;
      });
  };

  // 提交解绑谷歌验证码

  /** 提交中：submitUnbind */
  const submitUnbind = () => {
    if (!unbindCode.value || unbindCode.value.length !== 6) {
      CreateToast(t('unbind_google_code_placeholder'));
      return;
    }

    loading.value = true;
    unbindGoogleCode({ code: unbindCode.value })
      .then((res: any) => {
        if (res.code === 0) {
          CreateToast(t('unbind_google_success'));
          UserStore.fetchUserInfo();
          setTimeout(() => {
            router.back();
          }, 1500);
        }
      })
      .catch((error) => {
        console.error('Failed to unbind google code', error);
      })
      .finally(() => {
        loading.value = false;
      });
  };

  // 初始化
  onBeforeMount(() => {
    // 如果未绑定谷歌验证码，则获取谷歌验证码
    if (!isBound.value) {
      fetchGoogleCode();
    }
  });
</script>

<style scoped lang="less">
  .google-code-page {
    :deep(.van-field__control) {
      color: inherit;
    }
    :deep(.van-field__control:read-only) {
      color: inherit;
    }
  }
</style>
