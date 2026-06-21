<template>
  <div class="page-shell">
  <NavBar :title="t('login_button_text')">
    <template #right>
      <Icon
        class-prefix="exchange-icon"
        name="locale"
        :size="25"
        color="rgb(24 12 12)"
        @click="emitEvent('ShowLocales')"
      />
    </template>
  </NavBar>
  <PageWrap>
    <div class="page-shell__logo-wrap">
      <VanImage :src="Logo" width="3rem" />
      <!-- <div class="text-[0.55rem] font-bold">{{ SiteName }}</div> -->
      <div class="page-shell__welcome">{{ t('login_welcome_text') }}</div>
    </div>
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
        <div v-else class="page-shell__phone-row">
          <div class="page-shell__country-code" @click="showCountryPicker = true">
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
            class="page-shell__phone-field rounded-sm overflow-hidden"
            type="tel"
            :placeholder="t('login_phone_placeholder')"
            :formatter="(v) => (v || '').replace(/\D/g, '')"
            inputmode="tel"
            :maxlength="11"
          />
        </div>
        <CountryPicker
          v-model:show="showCountryPicker"
          :selected-area-code="selectedCountry.areaCode"
          @select="onCountrySelect"
        />
        <div class="page-shell__label mt-1 text-[0.29rem]">{{
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
            <PasswordEyeToggle :visible="ShowPassword" @click="ShowPassword = !ShowPassword" />
          </template>
        </Field>
      </div>
      <div class="mt-1 flex justify-between items-center">
        <div
          class="page-shell__accent text-[0.23rem]"
          @click="$router.push('/ForgotPassword')"
          >{{ t('login_forgot_password') }}</div
        >
        <div class="flex items-center">
          <Checkbox v-model="RememberPassword" :icon-size="14">{{
            t('login_remember_password')
          }}</Checkbox>
        </div>
      </div>
      <div class="mt-6">
        <Button
          class="page-shell__submit-btn"
          type="primary"
          block
          round
          :loading="loading"
          @click="onSubmit"
        >
          {{ t('login_button_text') }}
        </Button>
      </div>
      <div class="page-shell__footer mt-1 text-center text-[0.27rem]">
        {{ t('login_no_account') }}
        <span class="page-shell__accent" @click="$router.push('/Register')">{{
          t('login_register')
        }}</span>
      </div>
    </div>
  </PageWrap>
  </div>
</template>

<script setup lang="ts">
  import { useI18n } from 'vue-i18n';
  import { emitEvent } from '/@/utils/eventBus';
  import { useRouter, useRoute } from 'vue-router';
  import { isPassword, isEmail } from '/@/utils/is';
  // import Logo from '/@/assets/images/header_logo.png';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { login, loginByEmail } from '/@/service/Auth';
  import { ref, onMounted, computed, watch } from 'vue';
  import { NavBar, PageWrap, CountryPicker, PasswordEyeToggle } from '/@/components';
  import { useUserStoreWithOut } from '/@/stores/modules/UserConfig';
  import { useSystemStoreWithOut } from '/@/stores/modules/SystemConfig';
  import { Image as VanImage, Tab, Tabs, Field, Button, Icon, Checkbox } from 'vant';
  import type { NormalizedCountryItem } from '/@/components/CountryPicker/CountryPicker.vue';

  /** 从 useI18n 解构的文案与能力 */
  const { t } = useI18n();

  /** 当前路由：读取 query、params、meta 等 */
  const route = useRoute();

  /** 路由实例：编程式导航 */
  const router = useRouter();

  // 用户 Store 与全局消息能力

  /** 用户：userStore */
  const userStore = useUserStoreWithOut();

  /** SystemStore */
  const SystemStore = useSystemStoreWithOut();

  /** 从 useMessage 解构的 Toast / Dialog 能力 */
  const { CreateSuccessToast, CreateToast } = useMessage();

  // 当前选中的登录类型：0 = 邮箱登录，1 = 手机号登录

  /** 响应式状态：当前选中项 */
  const ActiveTab = ref<number>(0);

  // 国家区号选择：默认中国 +86

  /** 响应式状态：selectedCountry 相关 UI 或数据 */
  const selectedCountry = ref<any>({});

  // 是否显示国家区号选择器

  /** 响应式状态：显隐控制 */
  const showCountryPicker = ref<boolean>(false);

  // 选择国家区号

  /** 事件或回调处理：onCountrySelect */
  const onCountrySelect = (item: NormalizedCountryItem): void => {
    selectedCountry.value = item;
    showCountryPicker.value = false;
  };

  // 系统语言

  /** 计算属性：由其它状态派生的展示或判断 */
  const currentLanguage = computed(() => SystemStore.localInfo.locale);

  // 是否展示明文密码

  /** 响应式状态：显隐控制 */
  const ShowPassword = ref<boolean>(false);

  // 是否记住账号密码

  /** 响应式状态：RememberPassword 相关 UI 或数据 */
  const RememberPassword = ref<boolean>(false);

  // 登录按钮 loading 状态

  /** 响应式状态：加载中状态 */
  const loading = ref<boolean>(false);

  // 登录表单数据：邮箱 / 手机号 / 密码

  /** 响应式状态：inputParams 相关 UI 或数据 */
  const inputParams = ref<any>({
    email: '',
    mobile: '',
    password: ''
  });

  // Tab 配置：与文案 key 对应，方便后续扩展

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
    return SystemStore.getLoginLogo;
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

  // 点击登录按钮时触发：根据当前 Tab 选择邮箱登录或手机登录

  /** 提交中：onSubmit */
  const onSubmit = (): void => {
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
      if (!inputParams.value.mobile.trim()) {
        CreateToast(t('login_phone_placeholder'));
        return;
      }
    }

    if (!inputParams.value.password) {
      CreateToast(t('login_password_placeholder'));
      return;
    }

    if (!isPassword(inputParams.value.password)) {
      CreateToast(t('login_password_error'));
      return;
    }

    loading.value = true;
    const request =
      ActiveTab.value === 0
        ? loginByEmail({
            email: inputParams.value.email.trim(),
            password: inputParams.value.password
          })
        : login({
            mobile: inputParams.value.mobile.trim(),
            password: inputParams.value.password,
            countryCode: selectedCountry.value.areaCode
          });

    request
      .then((res) => {
        const { code, msg } = res;
        if (code === 0) {
          const {
            data: { accessToken }
          } = res;
          if (accessToken) {
            userStore.setToken(accessToken);
            userStore.fetchUserInfo();
            userStore.fetchAssetCurrencyList();
          }
          if (RememberPassword.value) {
            userStore.setSaveAccount(
              ActiveTab.value === 0
                ? { email: inputParams.value.email.trim(), password: inputParams.value.password }
                : { mobile: inputParams.value.mobile.trim(), password: inputParams.value.password }
            );
          } else {
            userStore.setSaveAccount({});
          }
          CreateSuccessToast(t('loginSuccess'));
          setTimeout(() => {
            const redirect = (route.query?.redirect as string) || '/';
            router.push(redirect);
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

  // 组件挂载时，根据用户配置回填上次记住的账号密码与登录方式

  /** 组件挂载后执行：初始化数据或订阅 */
  onMounted(() => {
    // 获取上次记住的账号密码与登录方式
    const saved = userStore.getSaveAccount as {
      email?: string;
      mobile?: string;
      password?: string;
    };
    // 如果上次记住的账号密码与登录方式为邮箱登录，则回填邮箱账号密码
    if (saved?.email && saved?.password) {
      inputParams.value.email = saved.email;
      inputParams.value.password = saved.password;
      RememberPassword.value = true;
      ActiveTab.value = 0;
    } else if (saved?.mobile && saved?.password) {
      inputParams.value.mobile = saved.mobile;
      inputParams.value.password = saved.password;
      RememberPassword.value = true;
      ActiveTab.value = 1;
    }
  });
</script>
