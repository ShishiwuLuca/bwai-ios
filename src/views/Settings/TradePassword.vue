<template>
  <NavBar :title="t('change_trade_password_title')" />
  <PageWrap>
    <div class="p-1">
      <Tabs v-model:active="ActiveTab" :line-height="0" swipeable shrink :border="false">
        <Tab
          v-for="(option, index) in LoginOptions"
          :key="index"
          :title="option.title"
          :name="index"
        />
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
              >{{ currentLanguage === 'zh_CN' ? CountryInfo.name : CountryInfo.nameEn }}&nbsp;{{
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
          :maxlength="6"
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
        <!-- <div class="mt-1 text-[0.3rem] text-[var(--van-tab-active-text-color)]">{{ t('old_password_title') }}</div>
        <Field v-model="inputParams.old_password" center clearable size="large"
          :type="ShowOldPassword ? 'text' : 'password'" autocomplete="off" :border="false"
          class="rounded-sm overflow-hidden mt-1" :placeholder="t('old_password_placeholder')">
          <template #button>
            <Icon color="var(--van-tab-active-text-color)" size="0.35rem"
              :name="ShowOldPassword ? 'eye-o' : 'closed-eye'" @click="ShowOldPassword = !ShowOldPassword" />
          </template>
        </Field> -->
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
          :maxlength="6"
          class="rounded-sm overflow-hidden mt-1"
          :placeholder="t('new_password_placeholder')"
          :formatter="(v) => (v || '').replace(/\D/g, '')"
          inputmode="numeric"
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
          :maxlength="6"
          :placeholder="t('register_confirm_pwd_placeholder')"
          :formatter="(v) => (v || '').replace(/\D/g, '')"
          inputmode="numeric"
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
  import { isEmail } from '/@/utils/is';
  import { useRouter } from 'vue-router';
  import { ref, computed, watch } from 'vue';
  import { NavBar, PageWrap } from '/@/components';
  import { sendLoginSmsCode } from '/@/service/Auth';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { Tab, Tabs, Field, Button, Icon } from 'vant';
  import { changeTradePassword } from '/@/service/User';
  import { useUserStoreWithOut } from '/@/stores/modules/UserConfig';
  import { useSystemStoreWithOut } from '/@/stores/modules/SystemConfig';

  // 国际化、路由与全局消息

  /** 从 useI18n 解构的文案与能力 */
  const { t } = useI18n();

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
  const currentLanguage = computed(() => {
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
  // const ShowOldPassword = ref<boolean>(false);

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
    // old_password: '',
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
    { title: t('login_email'), icon: 'email' },
    { title: t('login_phone'), icon: 'phone' }
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
    // 参数
    const Params: any = {
      scene: 'MEMBER_UPDATE_PASSWORD'
    };

    // 如果是邮箱
    if (ActiveTab.value === 0) {
      // 如果没有绑定邮箱
      const email = UserInfo.value.email.trim();
      if (!email) {
        CreateToast(t('bind_email_tip'));
        return;
      }

      if (!isEmail(email)) {
        CreateToast(t('bind_email_tip'));
        return;
      }

      Params.target = email;
      Params.type = 'EMAIL';
    } else {
      // 如果没有绑定手机号
      if (!UserInfo.value.mobile) {
        CreateToast(t('bind_phone_tip'));
        return;
      }

      Params.target = UserInfo.value.mobile;
      Params.type = 'SMS';
      Params.countryCode = UserInfo.value.countryCode;
    }

    sendLoginSmsCode(Params)
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

    if (!inputParams.value.password.trim()) {
      CreateToast(t('login_password_placeholder'));
      return;
    }

    if (!inputParams.value.confirmPword) {
      CreateToast(t('register_confirm_pwd_placeholder'));
      return;
    }

    if (inputParams.value.password !== inputParams.value.confirmPword) {
      CreateToast(t('new_password_not_match'));
      return;
    }

    loading.value = true;

    changeTradePassword(inputParams.value)
      .then((res) => {
        const { code, msg } = res;
        if (code === 0) {
          // 修改成功重新登录
          CreateToast(t('confirm_password_button_success'));
          // 重新获取用户信息
          userStore.fetchUserInfo();
          setTimeout(() => {
            router.back();
          }, 1000);
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
