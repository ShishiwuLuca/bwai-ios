<template>
  <NavBar :title="t('register_button_text')">
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
    <div class="text-center mt-1">
      <VanImage :src="Logo" width="2rem" />
      <!-- <div class="text-[0.6rem] font-bold">{{ SiteName }}</div> -->
      <div class="text-[0.3rem]">{{ t('register_welcome_text') }}</div>
    </div>
    <div class="p-1 pb-3">
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
          autocomplete="off"
          type="text"
          :placeholder="t('login_email_placeholder')"
        />
        <div v-else class="register-page__phone-row">
          <div class="register-page__country-code" @click="showCountryPicker = true">
            <span
              >{{
                currentLanguage === 'zh_CN' ? selectedCountry.name : selectedCountry.nameEn
              }}&nbsp;{{ selectedCountry.areaCode }}</span
            >
            <Icon name="arrow-down" size="14" />
          </div>
          <Field
            v-model="inputParams.mobileNumber"
            center
            clearable
            size="large"
            autocomplete="off"
            :border="false"
            class="register-page__phone-field rounded-sm overflow-hidden"
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
          autocomplete="off"
          :placeholder="t('register_verify_code_placeholder')"
          :formatter="(v) => (v || '').replace(/\D/g, '')"
          inputmode="numeric"
        >
          <template #button>
            <Button
              type="primary"
              size="small"
              block
              round
              class="rounded-sm overflow-hidden min-w-[1rem]"
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
          v-model="inputParams.confirmPassword"
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
        <div class="mt-1 text-[0.3rem] text-[var(--van-tab-active-text-color)]">
          {{ t('register_invite_code_title') }}
        </div>
        <Field
          v-model="inputParams.inviteCode"
          center
          clearable
          size="large"
          autocomplete="off"
          :border="false"
          class="rounded-sm overflow-hidden mt-1"
          type="text"
          :placeholder="t('register_invite_code_placeholder')"
          :maxlength="8"
        />
      </div>
      <div class="mt-2">
        <Button type="primary" block round :loading="loading" @click="onSubmit">
          {{ t('register_button_text') }}
        </Button>
      </div>
      <div class="mt-1 text-center text-[0.27rem] text-[var(--van-text-color-2)]">
        {{ t('register_no_account') }}
        <span class="text-[var(--van-tab-active-text-color)]" @click="$router.push('/Login')">{{
          t('register_login')
        }}</span>
      </div>
      <div
        class="mt-1 flex items-center justify-center text-[0.27rem] text-[var(--van-text-color-2)]"
      >
        <Checkbox v-model="Agree" :icon-size="14">
          {{ t('register_agree_text') }}
          <span
            class="text-[var(--van-tab-active-text-color)]"
            @click="$router.push('/ArticleDetail?urlName=agreement')"
            >{{ t('register_agree_text_link') }}</span
          >
          {{ t('register_agree_text_link_text') }}
          <span
            class="text-[var(--van-tab-active-text-color)]"
            @click="$router.push('/ArticleDetail?urlName=privacy')"
            >{{ t('register_agree_text_link_text_2') }}</span
          >
        </Checkbox>
      </div>
    </div>
  </PageWrap>
</template>

<script setup lang="ts">
  import { useI18n } from 'vue-i18n';
  import { ref, computed, watch } from 'vue';
  import { emitEvent } from '/@/utils/eventBus';
  import { useRouter, useRoute } from 'vue-router';
  import { isPassword, isEmail } from '/@/utils/is';
  // import Logo from '/@/assets/images/header_logo.png';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { NavBar, PageWrap, CountryPicker } from '/@/components';
  import { useUserStoreWithOut } from '/@/stores/modules/UserConfig';
  import { useSystemStoreWithOut } from '/@/stores/modules/SystemConfig';
  import { RegisterByPhone, RegisterByEmail, sendSmsCode } from '/@/service/Auth';
  import { Image as VanImage, Tab, Tabs, Field, Button, Icon, Checkbox } from 'vant';

  // 国际化、路由与全局消息

  /** 从 useI18n 解构的文案与能力 */
  const { t } = useI18n();

  /** 当前路由：读取 query、params、meta 等 */
  const route = useRoute();

  /** 路由实例：编程式导航 */
  const router = useRouter();

  /** 用户：userStore */
  const userStore = useUserStoreWithOut();

  /** SystemStore */
  const SystemStore = useSystemStoreWithOut();

  /** 从 useMessage 解构的 Toast / Dialog 能力 */
  const { CreateSuccessToast, CreateToast } = useMessage();

  // 当前选中的注册类型：0 = 邮箱注册，1 = 手机号注册

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

  // 选择国家区号

  /** 事件或回调处理：onCountrySelect */
  const onCountrySelect = (item: any): void => {
    selectedCountry.value = item;
    showCountryPicker.value = false;
  };

  // 是否显示密码明文

  /** 响应式状态：显隐控制 */
  const ShowPassword = ref<boolean>(false);

  // 是否显示确认密码明文

  /** 响应式状态：显隐控制 */
  const ShowConfirmPassword = ref<boolean>(false);

  // 是否勾选同意用户协议

  /** 响应式状态：Agree 相关 UI 或数据 */
  const Agree = ref<boolean>(false);

  // 注册按钮 loading 状态

  /** 响应式状态：加载中状态 */
  const loading = ref<boolean>(false);

  // 短信验证码倒计时（单位：秒）

  /** 响应式状态：countdown 相关 UI 或数据 */
  const countdown = ref<number>(0);

  // 短信验证码倒计时定时器

  /** countdownTimer */
  let countdownTimer: ReturnType<typeof setInterval> | null = null;

  // 注册表单数据：邮箱 / 手机号 / 验证码 / 密码 / 确认密码 / 邀请码

  /** 响应式状态：inputParams 相关 UI 或数据 */
  const inputParams = ref<any>({
    email: '',
    mobileNumber: '',
    code: '',
    password: '',
    confirmPassword: '',
    inviteCode: ''
  });

  // Tab 配置：邮箱注册 / 手机注册

  /** 响应式状态：LoginOptions 相关 UI 或数据 */
  const LoginOptions = ref<Array<{ title: string; icon: string }>>([
    { title: 'login_email', icon: 'email' },
    { title: 'login_phone', icon: 'phone' }
  ]);

  // 默认国家区号

  /** 计算属性：由其它状态派生的展示或判断 */
  const DefaultCountryInfo = computed(() => {
    return SystemStore.getDefaultCountryInfo;
  });

  // logo

  /** 计算属性：由其它状态派生的展示或判断 */
  const Logo = computed(() => {
    return SystemStore.getRegisterLogo;
  });

  // 站点名称
  // const SiteName = computed(() => {
  //   return SystemStore.getSiteName;
  // });

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

  // 发送验证码：仅在手机注册 Tab 生效

  /** 事件或回调处理：onSendVerifyCode */
  const onSendVerifyCode = (): void => {
    // 如果是发送邮箱验证码
    if (ActiveTab.value < 1) {
      const email = inputParams.value.email.trim();
      if (!email) {
        CreateToast(t('login_email_placeholder'));
        return;
      }

      if (!isEmail(email)) {
        CreateToast(t('login_email_placeholder'));
        return;
      }
    } else {
      if (!inputParams.value.mobileNumber) {
        CreateToast(t('login_phone_placeholder'));
        return;
      }
    }

    // 参数
    const params: any = {
      scene: 'MEMBER_REGISTER',
      target: ActiveTab.value === 0 ? inputParams.value.email : inputParams.value.mobileNumber,
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

  // 提交注册表单：根据当前 Tab 选择邮箱注册或手机注册

  /** 提交中：onSubmit */
  const onSubmit = (): void => {
    Agree.value = true;
    // if (!Agree.value) {
    //   CreateToast(t('register_agree_text_error'));
    //   return;
    // }
    if (ActiveTab.value === 0) {
      const email = inputParams.value.email.trim();
      if (!email) {
        CreateToast(t('login_email_placeholder'));
        return;
      }

      if (!isEmail(email)) {
        CreateToast(t('login_email_placeholder'));
        return;
      }
    } else {
      if (!inputParams.value.mobileNumber.trim()) {
        CreateToast(t('login_phone_placeholder'));
        return;
      }
    }

    if (!inputParams.value.code.trim()) {
      CreateToast(t('register_verify_code_placeholder'));
      return;
    }

    if (!inputParams.value.password) {
      CreateToast(t('login_password_placeholder'));
      return;
    }

    if (inputParams.value.password !== inputParams.value.confirmPassword) {
      CreateToast(t('password_not_match'));
      return;
    }

    if (!isPassword(inputParams.value.password) || !isPassword(inputParams.value.confirmPassword)) {
      CreateToast(t('login_password_error'));
      return;
    }

    // 验证邀请码
    if (inputParams.value.inviteCode) {
      if (!inputParams.value.inviteCode.trim()) {
        CreateToast(t('register_invite_code_placeholder'));
        return;
      }
    }

    loading.value = true;

    // 根据当前 Tab 选择邮箱注册或手机注册
    if (ActiveTab.value === 0) {
      onRegisterByEmail();
    } else {
      onRegisterByPhone();
    }
  };

  // 邮箱注册

  /** 事件或回调处理：onRegisterByEmail */
  const onRegisterByEmail = (): void => {
    // 处理参数
    const params: any = {
      email: inputParams.value.email,
      code: inputParams.value.code,
      loginPword: inputParams.value.password,
      confirmPword: inputParams.value.confirmPassword,
      inviteCode: inputParams.value.inviteCode
    };

    RegisterByEmail(params)
      .then((res) => {
        handleRegister(res);
      })
      .catch((e: unknown) => {
        const msg =
          e instanceof Error ? e.message : (e as { msg?: string })?.msg || t('apiRequestFailed');
        CreateToast(msg);
        loading.value = false;
      })
      .finally(() => {
        loading.value = false;
      });
  };

  // 手机号注册

  /** 事件或回调处理：onRegisterByPhone */
  const onRegisterByPhone = (): void => {
    // 处理参数
    const params: any = {
      mobile: inputParams.value.mobileNumber,
      code: inputParams.value.code,
      loginPword: inputParams.value.password,
      confirmPword: inputParams.value.confirmPassword,
      countryCode: selectedCountry.value.areaCode,
      inviteCode: inputParams.value.inviteCode
    };

    RegisterByPhone(params)
      .then((res) => {
        handleRegister(res);
      })
      .catch((e: unknown) => {
        const msg =
          e instanceof Error ? e.message : (e as { msg?: string })?.msg || t('apiRequestFailed');
        CreateToast(msg);
        loading.value = false;
      })
      .finally(() => {
        loading.value = false;
      });
  };

  // 处理返回数据

  /** handleRegister */
  const handleRegister = (res: any): void => {
    const { code, msg } = res;
    if (code === 0) {
      const {
        data,
        data: { accessToken }
      } = res;
      if (accessToken) {
        userStore.setToken(accessToken);
        if (data && typeof data === 'object') {
          userStore.setUserInfo(data as object);
          userStore.fetchAssetCurrencyList();
        }
        CreateSuccessToast(t('registerSuccess'));
        setTimeout(() => {
          router.push('/');
        }, 1500);
      } else {
        CreateSuccessToast(t('registerSuccess'));
        setTimeout(() => {
          router.push('/Login');
        }, 1500);
      }

      loading.value = false;
    } else {
      CreateToast(msg);
      loading.value = false;
    }
  };

  // 邀请码支持 deep link / query 实时回填

  /** 侦听依赖变化并触发副作用 */
  watch(
    () => route.query.InviteCode ?? route.query.inviteCode,
    (code) => {
      const val = Array.isArray(code) ? code[0] : code;
      if (val) {
        inputParams.value.inviteCode = val;
      }
    },
    { immediate: true, deep: true }
  );
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

  .register-page__phone-row {
    display: flex;
    align-items: center;
    margin-top: 0.25rem;
    background: var(--van-cell-background);
    border-radius: 0.08rem;
    overflow: hidden;
  }

  .register-page__country-code {
    display: flex;
    align-items: center;
    gap: 0.06rem;
    padding: 0 0.2rem;
    color: var(--van-text-color);
    font-size: 0.28rem;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .register-page__phone-field {
    flex: 1;
    min-width: 0;
  }

  .register-page__phone-field :deep(.van-field__body) {
    padding-left: 0;
  }
</style>
