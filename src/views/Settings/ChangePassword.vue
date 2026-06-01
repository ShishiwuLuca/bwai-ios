<template>
  <NavBar :title="t('change_password_title')" />
  <PageWrap>
    <div class="p-1">
      <Tabs
        v-if="UserInfo.mobile"
        v-model:active="ActiveTab"
        :line-height="0"
        swipeable
        shrink
        :border="false"
      >
        <Tab v-for="option in LoginOptions" :key="option.title" :title="option.title" />
      </Tabs>
      <div class="mt-1">
        <Field
          v-if="ActiveTab === 0"
          v-model="UserInfo.email"
          center
          clearable
          size="large"
          :border="false"
          class="rounded-sm overflow-hidden"
          autocomplete="off"
          type="text"
          :placeholder="t('login_email_placeholder')"
          disabled
        />
        <div v-else class="register-page__phone-row">
          <div class="register-page__country-code">
            <span
              >{{ Locales === 'zh_CN' ? CountryInfo.name : CountryInfo.nameEn }}&nbsp;{{
                UserInfo.countryCode
              }}</span
            >
            <Icon name="arrow-down" size="14" />
          </div>
          <Field
            v-model="UserInfo.mobile"
            disabled
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
          t('old_password_title')
        }}</div>
        <Field
          v-model="inputParams.oldPassword"
          center
          clearable
          size="large"
          :type="ShowOldPassword ? 'text' : 'password'"
          autocomplete="off"
          :border="false"
          class="rounded-sm overflow-hidden mt-1"
          :placeholder="t('login_password_error')"
        >
          <template #button>
            <Icon
              color="var(--van-tab-active-text-color)"
              size="0.35rem"
              :name="ShowOldPassword ? 'eye-o' : 'closed-eye'"
              @click="ShowOldPassword = !ShowOldPassword"
            />
          </template>
        </Field>
        <div class="mt-1 text-[0.3rem] text-[var(--van-tab-active-text-color)]">{{
          t('new_password_title')
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
          :placeholder="t('register_confirm_pwd_placeholder')"
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
      <div class="mt-2">
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
  import { changePassword } from '/@/service/User';
  import { NavBar, PageWrap } from '/@/components';
  import { isPassword, isEmail } from '/@/utils/is';
  import { sendLoginSmsCode } from '/@/service/Auth';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { Tab, Tabs, Field, Button, Icon } from 'vant';
  import { ref, computed, watch, onBeforeMount } from 'vue';
  import { useUserStoreWithOut } from '/@/stores/modules/UserConfig';
  import { useSystemStoreWithOut } from '/@/stores/modules/SystemConfig';

  // 国际化、路由与全局消息

  /** 从 useI18n 解构的文案与能力 */
  const { t } = useI18n();

  // 路由与全局消息

  /** 路由实例：编程式导航 */
  const router = useRouter();

  /** 用户：userStore */
  const userStore = useUserStoreWithOut();

  /** SystemStore */
  const SystemStore = useSystemStoreWithOut();

  // 全局消息

  /** 从 useMessage 解构的 Toast / Dialog 能力 */
  const { CreateToast } = useMessage();

  // 当前选中的注册类型：0 = 邮箱注册，1 = 手机号注册

  /** 响应式状态：当前选中项 */
  const ActiveTab = ref<number>(0);

  // 会员信息

  /** 计算属性：用户 */
  const UserInfo: any = computed(() => {
    return userStore.getUserInfo;
  });

  // 系统语言

  /** 计算属性：由其它状态派生的展示或判断 */
  const Locales = computed(() => {
    return SystemStore.localInfo.locale;
  });

  // 国家区号列表

  /** 计算属性：列表数据 */
  const CountryList = computed(() => {
    return SystemStore.getCountryList;
  });

  // 是否显示密码明文

  /** 响应式状态：显隐控制 */
  const ShowPassword = ref<boolean>(false);

  // 是否显示确认密码明文

  /** 响应式状态：显隐控制 */
  const ShowConfirmPassword = ref<boolean>(false);

  // 是否显示旧密码明文

  /** 响应式状态：显隐控制 */
  const ShowOldPassword = ref<boolean>(false);

  // 按钮 loading 状态

  /** 响应式状态：加载中状态 */
  const loading = ref<boolean>(false);

  // 短信验证码倒计时（单位：秒）

  /** 响应式状态：countdown 相关 UI 或数据 */
  const countdown = ref<number>(0);

  // 短信验证码倒计时定时器

  /** countdownTimer */
  let countdownTimer: ReturnType<typeof setInterval> | null = null;

  // 参数

  /** 响应式状态：inputParams 相关 UI 或数据 */
  const inputParams = ref<any>({
    // 旧密码
    oldPassword: '',
    // 新密码
    password: '',
    // 确认密码
    confirmPword: '',
    // 验证码
    code: ''
  });

  // Tab 配置：邮箱注册 / 手机注册

  /** 响应式状态：LoginOptions 相关 UI 或数据 */
  const LoginOptions = ref<Array<{ title: string; icon: string }>>([
    // { title: t('login_email'), icon: 'email' },
    // { title: t('login_phone'), icon: 'phone' }
  ]);

  // 国家信息

  /** 响应式状态：CountryInfo 相关 UI 或数据 */
  const CountryInfo = ref<any>({});

  // 监听用户信息变化

  /** 侦听依赖变化并触发副作用 */
  watch(
    UserInfo.value,
    (newVal: any) => {
      if (newVal) {
        // 根据国家区号找到国家信息
        CountryInfo.value = CountryList.value.find(
          (item: any) => item.areaCode === newVal.countryCode
        );
      }
    },
    { immediate: true, deep: true }
  );

  // 发送手机验证码：仅在手机注册 Tab 生效

  /** 事件或回调处理：onSendVerifyCode */
  const onSendVerifyCode = (): void => {
    // 如果是发送邮箱验证码
    if (ActiveTab.value < 1) {
      const email = UserInfo.value.email.trim();
      if (!email) {
        CreateToast(t('bind_email_tip'));
        return;
      }

      if (!isEmail(email)) {
        CreateToast(t('bind_email_tip'));
        return;
      }
    } else {
      if (!UserInfo.value.mobile.trim()) {
        CreateToast(t('bind_phone_tip'));
        return;
      }
    }

    // 参数
    const params: any = {
      scene: 'MEMBER_UPDATE_PASSWORD',
      target: ActiveTab.value === 0 ? UserInfo.value.email : UserInfo.value.mobile,
      type: ActiveTab.value === 0 ? 'EMAIL' : 'SMS'
    };

    // 手机注册加传国家区号
    if (ActiveTab.value === 1) {
      params.countryCode = UserInfo.value.countryCode;
    }
    sendLoginSmsCode(params)
      .then((res: any) => {
        const { code, msg } = res;
        if (code === 0) {
          CreateToast(t('verifyCodeSentSuccess'));
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
    if (ActiveTab.value === 0) {
      const email = UserInfo.value.email.trim();
      if (!email) {
        CreateToast(t('bind_email_tip'));
        return;
      }

      if (!isEmail(email)) {
        CreateToast(t('bind_email_tip'));
        return;
      }
    } else {
      if (!UserInfo.value.mobile.trim()) {
        CreateToast(t('bind_phone_tip'));
        return;
      }
    }

    if (!inputParams.value.code.trim()) {
      CreateToast(t('register_verify_code_placeholder'));
      return;
    }

    if (!inputParams.value.oldPassword.trim()) {
      CreateToast(t('old_password_placeholder'));
      return;
    }

    if (!inputParams.value.password.trim()) {
      CreateToast(t('new_password_placeholder'));
      return;
    }

    if (!inputParams.value.confirmPword.trim()) {
      CreateToast(t('register_confirm_pwd_placeholder'));
      return;
    }

    if (inputParams.value.password.trim() !== inputParams.value.confirmPword.trim()) {
      CreateToast(t('new_password_not_match'));
      return;
    }

    if (!isPassword(inputParams.value.password) || !isPassword(inputParams.value.confirmPword)) {
      CreateToast(t('login_password_error'));
      return;
    }

    loading.value = true;

    changePassword(inputParams.value)
      .then((res) => {
        const { code, msg } = res;
        if (code === 0) {
          // 修改成功重新登录
          CreateToast(t('confirm_password_button_success'));
          userStore.LoginOut();
          setTimeout(() => {
            router.push('/Login');
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

  // 监听用户信息变化

  /** 侦听依赖变化并触发副作用 */
  watch(
    UserInfo.value,
    (newVal: any) => {
      if (newVal) {
        // 如果没有绑定邮箱同时没有绑定手机号则不显示Tabs
        if (newVal.email.length === 0 && newVal.mobile.length === 0) {
          LoginOptions.value = [];
        }

        // 如果绑定了邮箱则显示邮箱注册Tab
        if (newVal.email.length > 0 && newVal.mobile.length === 0) {
          LoginOptions.value.push({ title: t('login_email'), icon: 'email' });
          ActiveTab.value = 0;
        }

        // 如果绑定了手机号则显示手机注册Tab
        if (newVal.mobile.length > 0 && newVal.email.length === 0) {
          LoginOptions.value.push({ title: t('login_phone'), icon: 'phone' });
          ActiveTab.value = 1;
        }

        // 如果绑定了邮箱和手机号则显示Tabs
        if (newVal.email.length > 0 && newVal.mobile.length > 0) {
          LoginOptions.value.push({ title: t('login_email'), icon: 'email' });
          LoginOptions.value.push({ title: t('login_phone'), icon: 'phone' });
          ActiveTab.value = 0;
        }
      }
    },
    { immediate: true, deep: true }
  );

  // 初始化
  onBeforeMount((): void => {
    userStore.fetchUserInfo();
  });
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
    font-size: 0.3rem;
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
