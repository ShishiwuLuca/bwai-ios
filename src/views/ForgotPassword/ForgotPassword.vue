<template>
  <NavBar :title="t('forgot_password_title')">
    <template #right>
      <Icon
        class-prefix="exchange-icon"
        name="locale"
        :size="25"
        color="var(--van-text-color)"
        @click="emitEvent('ShowLocales')"
      />
    </template>
  </NavBar>
  <PageWrap>
    <div class="p-1">
      <Tabs v-model:active="ActiveTab" :line-height="0" swipeable shrink :border="false">
        <Tab v-for="(item, index) in LoginOptions" :key="index" :title="t(item.title)" />
      </Tabs>
      <div class="mt-1">
        <Field
          v-if="ActiveTab === 0"
          v-model="inputParams.email"
          center
          clearable
          size="large"
          :border="false"
          class="rounded-sm overflow-hidden"
          type="text"
          autocomplete="off"
          :placeholder="t('login_email_placeholder')"
        />
        <div v-else class="forgot-page__phone-row">
          <div class="forgot-page__country-code" @click="showCountryPicker = true">
            <span
              >{{
                currentLanguage === 'zh_CN' ? selectedCountry.name : selectedCountry.nameEn
              }}&nbsp;{{ selectedCountry.areaCode }}</span
            >
            <Icon name="arrow-down" size="14" />
          </div>
          <Field
            v-model="inputParams.mobile"
            center
            clearable
            size="large"
            autocomplete="off"
            :border="false"
            class="forgot-page__phone-field rounded-sm overflow-hidden"
            type="tel"
            :placeholder="t('login_phone_placeholder')"
            :formatter="(v) => (v || '').replace(/\D/g, '')"
            inputmode="tel"
            :maxlength="11"
          />
        </div>
        <CountryPicker v-model:show="showCountryPicker" @select="onCountrySelect" />
        <div class="mt-1 text-[0.3rem] text-[var(--van-tab-active-text-color)]">
          {{ t('register_verify_code_title') }}
        </div>
        <Field
          v-model="inputParams.code"
          center
          clearable
          size="large"
          :border="false"
          class="rounded-sm overflow-hidden mt-1"
          type="digit"
          maxlength="6"
          :placeholder="t('register_verify_code_placeholder')"
          autocomplete="off"
          :formatter="(v) => (v || '').replace(/\D/g, '')"
          inputmode="numeric"
        >
          <template #button>
            <Button
              type="primary"
              size="small"
              block
              round
              class="rounded-sm overflow-hidden"
              :disabled="countdown > 0"
              @click="onSendVerifyCode"
            >
              {{ countdown > 0 ? `${countdown}s` : t('register_verify_code_button_text') }}
            </Button>
          </template>
        </Field>
        <div class="mt-1 text-[0.3rem] text-[var(--van-tab-active-text-color)]">{{
          t('login_password_title')
        }}</div>
        <Field
          v-model="inputParams.password"
          center
          clearable
          size="large"
          :type="ShowPassword ? 'text' : 'password'"
          autocomplete="off"
          :border="false"
          class="rounded-sm overflow-hidden mt-1"
          :placeholder="t('login_password_error')"
        >
          <template #button>
            <Icon
              color="var(--van-tab-active-text-color)"
              size="0.35rem"
              :name="ShowPassword ? 'eye-o' : 'closed-eye'"
              @click="ShowPassword = !ShowPassword"
            />
          </template>
        </Field>
        <div class="mt-1 text-[0.3rem] text-[var(--van-tab-active-text-color)]">
          {{ t('register_confirm_pwd_title') }}
        </div>
        <Field
          v-model="inputParams.confirmPword"
          center
          clearable
          size="large"
          :type="ShowConfirmPassword ? 'text' : 'password'"
          autocomplete="off"
          :border="false"
          class="rounded-sm overflow-hidden mt-1"
          :placeholder="t('login_password_error')"
        >
          <template #button>
            <Icon
              color="var(--van-tab-active-text-color)"
              size="0.35rem"
              :name="ShowConfirmPassword ? 'eye-o' : 'closed-eye'"
              @click="ShowConfirmPassword = !ShowConfirmPassword"
            />
          </template>
        </Field>
      </div>
      <div class="mt-6">
        <Button type="primary" block round :loading="loading" @click="onSubmit">
          {{ t('confirm') }}
        </Button>
      </div>
    </div>
  </PageWrap>
</template>

<script setup lang="ts">
  import { useI18n } from 'vue-i18n';
  import { useRouter } from 'vue-router';
  import { ref, computed, watch } from 'vue';
  import { sendSmsCode } from '/@/service/Auth';
  import { emitEvent } from '/@/utils/eventBus';
  import { findPassword } from '/@/service/User';
  import { isPassword, isEmail } from '/@/utils/is';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { Tab, Tabs, Field, Button, Icon } from 'vant';
  import { NavBar, PageWrap, CountryPicker } from '/@/components';
  import { useSystemStoreWithOut } from '/@/stores/modules/SystemConfig';

  // 国际化、路由与全局消息

  /** 从 useI18n 解构的文案与能力 */
  const { t } = useI18n();

  /** 路由实例：编程式导航 */
  const router = useRouter();

  /** SystemStore */
  const SystemStore = useSystemStoreWithOut();

  /** 从 useMessage 解构的 Toast / Dialog 能力 */
  const { CreateSuccessToast, CreateToast } = useMessage();

  // 当前选项卡：0 = 邮箱（暂不支持），1 = 手机

  /** 响应式状态：当前选中项 */
  const ActiveTab = ref<number>(0);

  // 系统语言

  /** 计算属性：由其它状态派生的展示或判断 */
  const currentLanguage = computed(() => SystemStore.localInfo.locale);

  // 国家区号选择：默认中国 +86

  /** 响应式状态：selectedCountry 相关 UI 或数据 */
  const selectedCountry = ref<any>({});

  // 是否显示国家区号选择器

  /** 响应式状态：显隐控制 */
  const showCountryPicker = ref<boolean>(false);

  // 系统默认国家

  /** 计算属性：由其它状态派生的展示或判断 */
  const DefaultCountryInfo = computed(() => {
    return SystemStore.getDefaultCountryInfo;
  });

  // 监听国家列表加载

  /** 侦听依赖变化并触发副作用 */
  watch(
    DefaultCountryInfo,
    (newVal) => {
      if (newVal && Object.keys(newVal).length > 0) {
        selectedCountry.value = newVal;
      }
    },
    { immediate: true, deep: true }
  );

  // 选择国家区号

  /** 事件或回调处理：onCountrySelect */
  const onCountrySelect = (item: any): void => {
    selectedCountry.value = item;
    showCountryPicker.value = false;
  };

  // 是否显示新密码明文

  /** 响应式状态：显隐控制 */
  const ShowPassword = ref<boolean>(false);

  // 是否显示确认密码明文

  /** 响应式状态：显隐控制 */
  const ShowConfirmPassword = ref<boolean>(false);

  // 提交按钮 loading 状态

  /** 响应式状态：加载中状态 */
  const loading = ref<boolean>(false);

  // 短信验证码倒计时

  /** 响应式状态：countdown 相关 UI 或数据 */
  const countdown = ref<number>(0);

  // 短信验证码倒计时定时器

  /** countdownTimer */
  let countdownTimer: ReturnType<typeof setInterval> | null = null;

  // 表单数据：邮箱 / 手机号 / 验证码 / 新密码 / 确认密码

  /** 响应式状态：inputParams 相关 UI 或数据 */
  const inputParams = ref<any>({
    email: '',
    mobile: '',
    code: '',
    password: '',
    confirmPword: ''
  });

  // Tab 配置：与登录保持一致

  /** 响应式状态：LoginOptions 相关 UI 或数据 */
  const LoginOptions = ref<Array<{ title: string; icon: string }>>([
    { title: 'login_email', icon: 'email' },
    { title: 'login_phone', icon: 'phone' }
  ]);

  // 发送手机验证码，仅在手机号 Tab 生效

  /** 事件或回调处理：onSendVerifyCode */
  const onSendVerifyCode = (): void => {
    // 如果是发送邮箱验证码
    if (ActiveTab.value < 1) {
      const email = inputParams.value.email.trim();
      if (!email) {
        CreateToast(t('email_placeholder'));
        return;
      }

      if (!isEmail(email)) {
        CreateToast(t('email_placeholder'));
        return;
      }
    } else {
      if (!inputParams.value.mobile.trim()) {
        CreateToast(t('mobile_placeholder'));
        return;
      }
    }

    // 参数
    const params: any = {
      scene: 'MEMBER_RESET_PASSWORD',
      target: ActiveTab.value === 0 ? inputParams.value.email : inputParams.value.mobile,
      type: ActiveTab.value === 0 ? 'EMAIL' : 'SMS'
    };

    // 手机注册加传国家区号
    if (ActiveTab.value === 1) {
      params.countryCode = selectedCountry.value.areaCode;
    }

    sendSmsCode(params)
      .then((res: any) => {
        const { code, msg } = res;
        if (code === 0) {
          CreateSuccessToast(t('verifyCodeSentSuccess'));
          countdown.value = 120;
          if (countdownTimer) clearInterval(countdownTimer);
          countdownTimer = setInterval(() => {
            countdown.value -= 1;
            if (countdown.value <= 0 && countdownTimer) {
              clearInterval(countdownTimer);
              countdownTimer = null;
            }
          }, 1000);
        } else {
          CreateToast(msg);
        }
      })
      .catch((e: unknown) => {
        const msg =
          e instanceof Error ? e.message : (e as { msg?: string })?.msg || t('apiRequestFailed');
        CreateToast(msg);
      });
  };

  /** 提交中：onSubmit */
  const onSubmit = (): void => {
    const mobile = inputParams.value.mobile.trim();
    const email = inputParams.value.email.trim();
    const code = inputParams.value.code.trim();
    const password = inputParams.value.password;
    const confirmPword = inputParams.value.confirmPword;

    const Params: any = {
      code,
      password,
      confirmPword
    };

    if (ActiveTab.value < 1) {
      if (!email.trim()) {
        CreateToast(t('email_placeholder'));
        return;
      }

      if (!isEmail(email)) {
        CreateToast(t('email_placeholder'));
        return;
      }
    } else {
      if (!mobile) {
        CreateToast(t('mobile_placeholder'));
        return;
      }
    }

    if (!code) {
      CreateToast(t('register_verify_code_placeholder'));
      return;
    }

    if (!password) {
      CreateToast(t('new_password_placeholder'));
      return;
    }

    if (password !== confirmPword) {
      CreateToast(t('new_password_not_match'));
      return;
    }

    if (!isPassword(password) || !isPassword(confirmPword)) {
      CreateToast(t('login_password_error'));
      return;
    }

    if (ActiveTab.value < 1) {
      Params.email = email;
    } else {
      Params.mobile = mobile;
      Params.countryCode = selectedCountry.value.areaCode;
    }

    loading.value = true;
    findPassword(Params)
      .then((res: any) => {
        const { code, msg } = res;
        if (code === 0) {
          CreateSuccessToast(t('passwordResetSuccess'));
          setTimeout(() => {
            router.replace('/Login');
          }, 1500);
        } else {
          CreateToast(msg);
        }
      })
      .catch((e: unknown) => {
        const msg =
          e instanceof Error ? e.message : (e as { msg?: string })?.msg || t('apiRequestFailed');
        CreateToast(msg);
      })
      .finally(() => {
        loading.value = false;
      });
  };
</script>

<style lang="css" scoped>
  :deep(.van-tabs__nav) {
    padding-left: 0;
    padding-right: 0;

    .van-tab {
      padding-left: 0;
    }

    .van-tab--active {
      .van-tab__text {
        font-size: 0.3rem !important;
      }
    }

    .van-tab__text {
      font-size: 0.27rem;
    }
  }

  .forgot-page__phone-row {
    display: flex;
    align-items: center;
    margin-top: 0.25rem;
    background: var(--van-cell-background);
    border-radius: 0.08rem;
    overflow: hidden;
  }

  .forgot-page__country-code {
    display: flex;
    align-items: center;
    gap: 0.06rem;
    padding: 0 0.2rem;
    color: var(--van-text-color);
    font-size: 0.3rem;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .forgot-page__phone-field {
    flex: 1;
    min-width: 0;
  }

  .forgot-page__phone-field :deep(.van-field__body) {
    padding-left: 0;
  }
</style>
