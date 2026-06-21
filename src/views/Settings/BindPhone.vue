<template>
  <div class="bind-phone-page">
  <NavBar :title="t('bind_phone_title')" />
  <PageWrap>
    <div class="p-1">
      <div class="mt-1">
        <!-- <template v-if="UserInfo.mobile">
          <div class="mt-1 text-[0.3rem] text-[#000] font-medium">
            {{ t('old_phone_verify_code_title') }}
          </div>
          <Field v-model="inputParams.old_verify_code" center clearable size="large" :border="false"
            class="bind-phone-page__field rounded-sm overflow-hidden mt-1" type="digit" maxlength="6" autocomplete="off"
            :placeholder="t('old_phone_verify_code_placeholder')">
            <template #button>
              <Button size="small" block class="bind-phone-page__send-btn min-w-[1rem]"
                :disabled="oldPhoneCountdown > 0" @click="onSendOldVerifyCode">
                {{ oldPhoneCountdown > 0 ? `${oldPhoneCountdown}s` : t('register_verify_code_button_text') }}
              </Button>
            </template>
</Field>
</template> -->
        <div class="mt-1 text-[0.3rem] text-[#000] font-medium">
          {{ t('new_phone_title') }}
        </div>
        <Field
          v-model="inputParams.mobile"
          center
          clearable
          size="large"
          :border="false"
          class="bind-phone-page__field rounded-sm overflow-hidden mt-1"
          autocomplete="off"
          type="tel"
          :placeholder="t('new_phone_placeholder')"
          :formatter="(v) => (v || '').replace(/\D/g, '')"
          inputmode="tel"
          :maxlength="11"
        >
          <template #left-icon>
            <div class="flex items-center gap-0.5 text-[#333]" @click="showCountryPicker = true">
              <span>{{
                currentLanguage === 'zh_CN' ? selectedCountry.name : selectedCountry.nameEn
              }}&nbsp;{{ selectedCountry.areaCode }}</span>
              <Icon name="arrow-down" size="14" color="#333" />
            </div>
          </template>
        </Field>
        <div class="mt-1 text-[0.3rem] text-[#000] font-medium">
          {{ t('new_phone_verify_code_title') }}
        </div>
        <Field
          v-model="inputParams.code"
          center
          clearable
          size="large"
          :border="false"
          class="bind-phone-page__field rounded-sm overflow-hidden mt-1"
          type="digit"
          :maxlength="6"
          autocomplete="off"
          :placeholder="t('new_phone_verify_code_placeholder')"
          :formatter="(v) => (v || '').replace(/\D/g, '')"
          inputmode="numeric"
        >
          <template #button>
            <Button
              size="small"
              block
              class="bind-phone-page__send-btn min-w-[1rem]"
              :disabled="newPhoneCountdown > 0"
              @click="onSendNewVerifyCode"
            >
              {{
                newPhoneCountdown > 0
                  ? `${newPhoneCountdown}s`
                  : t('register_verify_code_button_text')
              }}
            </Button>
          </template>
        </Field>
      </div>
      <div class="mt-2">
        <Button block round class="bind-phone-page__submit-btn" :loading="loading" @click="onSubmit">
          {{ t('confirm') }}
        </Button>
      </div>
    </div>
  </PageWrap>
  </div>
  <CountryPicker
    v-model:show="showCountryPicker"
    :selected-area-code="selectedCountry.areaCode"
    @select="onCountrySelect"
  />
</template>

<script setup lang="ts">
  import { useI18n } from 'vue-i18n';
  import { Field, Button, Icon } from 'vant';
  import { ref, computed, watch } from 'vue';
  import { bindPhone } from '/@/service/User';
  import { sendLoginSmsCode } from '/@/service/Auth';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { NavBar, PageWrap, CountryPicker } from '/@/components';
  import { useUserStoreWithOut } from '/@/stores/modules/UserConfig';
  import { useSystemStoreWithOut } from '/@/stores/modules/SystemConfig';

  // 国际化、路由与全局消息

  /** 从 useI18n 解构的文案与能力 */
  const { t } = useI18n();

  /** 用户：userStore */
  const userStore = useUserStoreWithOut();

  /** SystemStore */
  const SystemStore = useSystemStoreWithOut();

  // 全局消息

  /** 从 useMessage 解构的 Toast / Dialog 能力 */
  const { CreateToast } = useMessage();

  // 按钮 loading 状态

  /** 响应式状态：加载中状态 */
  const loading = ref<boolean>(false);

  // 是否显示国家选择器

  /** 响应式状态：显隐控制 */
  const showCountryPicker = ref<boolean>(false);

  // 旧手机倒计时
  // const oldPhoneCountdown = ref<number>(0);

  // 新手机倒计时

  /** 响应式状态：newPhoneCountdown 相关 UI 或数据 */
  const newPhoneCountdown = ref<number>(0);

  // 旧手机定时器
  // const oldPhoneTimer = ref<ReturnType<typeof setInterval> | null>(null);

  // 新手机定时器

  /** 响应式状态：newPhoneTimer 相关 UI 或数据 */
  const newPhoneTimer = ref<ReturnType<typeof setInterval> | null>(null);

  // 参数

  /** 响应式状态：inputParams 相关 UI 或数据 */
  const inputParams = ref<any>({
    // 旧手机验证码
    // old_verify_code: '',
    // 新手机
    mobile: '',
    // 新邮箱验证码
    code: ''
  });

  // 会员信息

  /** 计算属性：用户 */
  const UserInfo: any = computed(() => {
    return userStore.getUserInfo;
  });

  // 当前系统语言

  /** 计算属性：由其它状态派生的展示或判断 */
  const currentLanguage = computed(() => {
    return SystemStore.localInfo.locale;
  });

  // 国家区号列表

  /** 计算属性：列表数据 */
  const CountryList = computed(() => {
    return SystemStore.getCountryList;
  });

  // 当前国家区号选择：默认中国 +86

  /** 响应式状态：selectedCountry 相关 UI 或数据 */
  const selectedCountry = ref<any>({});

  // 监听个人信息

  /** 侦听依赖变化并触发副作用 */
  watch(
    UserInfo.value,
    (newVal: any) => {
      if (newVal) {
        selectedCountry.value = CountryList.value.find(
          (item: any) => item.areaCode === newVal.countryCode
        );
      }
    },
    { immediate: true, deep: true }
  );

  // 选择国家区号

  /** 事件或回调处理：onCountrySelect */
  const onCountrySelect = (item: any): void => {
    console.log(item);
    selectedCountry.value = item;
    showCountryPicker.value = false;
  };

  // 发送旧手机验证码
  // const onSendOldVerifyCode = (): void => {
  //   const mobile = UserInfo.value.mobile.trim();
  //   if (!mobile) {
  //     CreateToast(t('mobile_placeholder'));
  //     return;
  //   }
  //   sendSmsCode({ mobile: mobile }).then(() => {
  //     CreateToast(t('verifyCodeSentSuccess'));
  //     oldPhoneCountdown.value = 120;
  //     if (oldPhoneTimer.value) clearInterval(oldPhoneTimer.value);
  //     oldPhoneTimer.value = setInterval(() => {
  //       oldPhoneCountdown.value -= 1;
  //       if (oldPhoneCountdown.value <= 0 && oldPhoneTimer.value) {
  //         clearInterval(oldPhoneTimer.value);
  //         oldPhoneTimer.value = null;
  //       }
  //     }, 1000);
  //   })
  //     .catch((e: unknown) => {
  //       const msg = e instanceof Error ? e.message : (e as { msg?: string })?.msg || t('apiRequestFailed');
  //       CreateToast(msg);
  //     });
  // };

  // 发送新手机验证码

  /** 事件或回调处理：onSendNewVerifyCode */
  const onSendNewVerifyCode = (): void => {
    const mobile = inputParams.value.mobile.trim();
    if (!mobile) {
      CreateToast(t('new_phone_placeholder'));
      return;
    }
    sendLoginSmsCode({
      target: mobile,
      scene: 'MEMBER_UPDATE_MOBILE',
      type: 'SMS',
      countryCode: selectedCountry.value?.areaCode
    })
      .then((res: any) => {
        const { code, msg } = res;
        if (code === 0) {
          CreateToast(t('verifyCodeSentSuccess'));
          newPhoneCountdown.value = 120;
          if (newPhoneTimer.value) clearInterval(newPhoneTimer.value);
          newPhoneTimer.value = setInterval(() => {
            newPhoneCountdown.value -= 1;
            if (newPhoneCountdown.value <= 0 && newPhoneTimer.value) {
              clearInterval(newPhoneTimer.value);
              newPhoneTimer.value = null;
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
    // 如果是换绑
    if (UserInfo.value.mobile) {
      inputParams.value.oldMobile = UserInfo.value.mobile;
      inputParams.value.oldCountryCode = UserInfo.value.countryCode;
    }

    // 新手机
    if (!inputParams.value.mobile.trim()) {
      CreateToast(t('new_phone_placeholder'));
      return;
    }

    // 新手机验证码
    if (!inputParams.value.code.trim()) {
      CreateToast(t('new_phone_verify_code_placeholder'));
      return;
    }

    loading.value = true;

    bindPhone(inputParams.value)
      .then((res: any) => {
        const { code, msg } = res;
        if (code === 0) {
          // 修改成功重新登录
          CreateToast(UserInfo.value.mobile ? t('change_phone_success') : t('bind_phone_success'));
          userStore.fetchUserInfo();
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

<style lang="less" scoped>
  .bind-phone-page {
    background: #f2f5fe;
    min-height: 100vh;
    --van-field-background: #f9faff;
    --van-cell-background: #f9faff;

    :deep(.van-nav-bar) { background: transparent !important; }
    :deep(.van-nav-bar__title) { font-size: 16px; font-weight: 600; color: #000; }
    :deep(.van-nav-bar .van-icon) { color: #000 !important; }
    :deep(.nav-back-button .van-icon) { color: #000 !important; }
    :deep(.page-wrap) { background: transparent; }
  }

  .bind-phone-page__field {
    background: #f9faff !important;
    box-shadow: 0 0 2px rgba(87, 119, 251, 0.25);

    :deep(.van-field__control) { color: #000; }
    :deep(.van-field__control::placeholder) { color: #bbb; }
    :deep(.van-field__left-icon) { color: #333; }
  }

  .bind-phone-page__send-btn {
    background: linear-gradient(180deg, #92b6ff 0%, #2a61f9 100%) !important;
    border: none !important;
    border-radius: 4px !important;
    color: #fff !important;
  }

  .bind-phone-page__submit-btn {
    background: linear-gradient(180deg, #92b6ff 0%, #2a61f9 100%) !important;
    border: none !important;
    color: #fff !important;
  }
</style>
