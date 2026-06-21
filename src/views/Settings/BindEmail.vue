<template>
  <div class="bind-email-page">
  <NavBar :title="t('bind_email_title')" />
  <PageWrap>
    <div class="p-1">
      <div class="mt-1">
        <!-- <template v-if="UserInfo.email">
          <div class="mt-1 text-[0.3rem] text-[#000] font-medium">
            {{ t('old_email_verify_code_title') }}
          </div>
          <Field v-model="inputParams.old_verify_code" center clearable size="large" :border="false"
            class="bind-email-page__field rounded-sm overflow-hidden mt-1" type="digit" maxlength="6" autocomplete="off"
            :placeholder="t('old_email_verify_code_placeholder')">
            <template #button>
              <Button size="small" block class="bind-email-page__send-btn min-w-[1rem]"
                :disabled="oldEmailCountdown > 0" @click="onSendOldVerifyCode">
                {{ oldEmailCountdown > 0 ? `${oldEmailCountdown}s` : t('register_verify_code_button_text') }}
              </Button>
            </template>
</Field>
</template> -->
        <div class="mt-1 text-[0.3rem] text-[#000] font-medium">
          {{ t('new_email_title') }}
        </div>
        <Field
          v-model="inputParams.email"
          center
          clearable
          size="large"
          :border="false"
          class="bind-email-page__field rounded-sm overflow-hidden mt-1"
          autocomplete="off"
          type="text"
          :placeholder="t('new_email_placeholder')"
        />
        <div class="mt-1 text-[0.3rem] text-[#000] font-medium">
          {{ t('new_email_verify_code_title') }}
        </div>
        <Field
          v-model="inputParams.code"
          center
          clearable
          size="large"
          :border="false"
          class="bind-email-page__field rounded-sm overflow-hidden mt-1"
          type="digit"
          maxlength="6"
          autocomplete="off"
          :placeholder="t('new_email_verify_code_placeholder')"
          :formatter="(v) => (v || '').replace(/\D/g, '')"
          inputmode="numeric"
        >
          <template #button>
            <Button
              size="small"
              block
              class="bind-email-page__send-btn min-w-[1rem]"
              :disabled="newEmailCountdown > 0"
              @click="onSendNewVerifyCode"
            >
              {{
                newEmailCountdown > 0
                  ? `${newEmailCountdown}s`
                  : t('register_verify_code_button_text')
              }}
            </Button>
          </template>
        </Field>
      </div>
      <div class="mt-2">
        <Button block round class="bind-email-page__submit-btn" :loading="loading" @click="onSubmit">
          {{ t('confirm') }}
        </Button>
      </div>
    </div>
  </PageWrap>
  </div>
</template>

<script setup lang="ts">
  import { useI18n } from 'vue-i18n';
  import { ref, computed } from 'vue';
  import { Field, Button } from 'vant';
  import { isEmail } from '/@/utils/is';
  import { bindEmail } from '/@/service/User';
  import { NavBar, PageWrap } from '/@/components';
  import { sendLoginSmsCode } from '/@/service/Auth';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { useUserStoreWithOut } from '/@/stores/modules/UserConfig';

  // 国际化、路由与全局消息

  /** 从 useI18n 解构的文案与能力 */
  const { t } = useI18n();

  /** 用户：userStore */
  const userStore = useUserStoreWithOut();

  // 全局消息

  /** 从 useMessage 解构的 Toast / Dialog 能力 */
  const { CreateToast } = useMessage();

  // 会员信息

  /** 计算属性：用户 */
  const UserInfo: any = computed(() => {
    return userStore.getUserInfo;
  });

  // 按钮 loading 状态

  /** 响应式状态：加载中状态 */
  const loading = ref<boolean>(false);

  // 旧邮箱倒计时
  // const oldEmailCountdown = ref<number>(0);

  // 新邮箱倒计时

  /** 响应式状态：newEmailCountdown 相关 UI 或数据 */
  const newEmailCountdown = ref<number>(0);

  // 旧邮箱定时器
  // const oldEmailTimer = ref<ReturnType<typeof setInterval> | null>(null);

  // 新邮箱定时器

  /** 响应式状态：newEmailTimer 相关 UI 或数据 */
  const newEmailTimer = ref<ReturnType<typeof setInterval> | null>(null);

  // 参数

  /** 响应式状态：inputParams 相关 UI 或数据 */
  const inputParams = ref<any>({
    // 旧邮箱验证码
    // old_verify_code: '',
    // 新邮箱
    email: '',
    // 新邮箱验证码
    code: ''
  });

  // // 发送旧邮箱验证码
  // const onSendOldVerifyCode = (): void => {
  //   const email = UserInfo.value.email.trim();
  //   if (!email) {
  //     CreateToast(t('email_placeholder'));
  //     return;
  //   }
  //   sendSmsCode({ email: email, scene: 'MEMBER_BIND_EMAIL', type: 'EMAIL' }).then(() => {
  //     CreateToast(t('verifyCodeSentSuccess'));
  //     oldEmailCountdown.value = 120;
  //     if (oldEmailTimer.value) clearInterval(oldEmailTimer.value);
  //     oldEmailTimer.value = setInterval(() => {
  //       oldEmailCountdown.value -= 1;
  //       if (oldEmailCountdown.value <= 0 && oldEmailTimer.value) {
  //         clearInterval(oldEmailTimer.value);
  //         oldEmailTimer.value = null;
  //       }
  //     }, 1000);
  //   })
  //     .catch((e: unknown) => {
  //       const msg = e instanceof Error ? e.message : (e as { msg?: string })?.msg || t('apiRequestFailed');
  //       CreateToast(msg);
  //     });
  // };

  // 发送新邮箱验证码

  /** 事件或回调处理：onSendNewVerifyCode */
  const onSendNewVerifyCode = (): void => {
    const email = inputParams.value.email.trim();
    if (!email) {
      CreateToast(t('new_email_placeholder'));
      return;
    }

    if (!isEmail(email)) {
      CreateToast(t('new_email_placeholder'));
      return;
    }

    sendLoginSmsCode({ target: email, scene: 'MEMBER_BIND_EMAIL', type: 'EMAIL' })
      .then((res: any) => {
        const { code, msg } = res;
        if (code === 0) {
          CreateToast(t('verifyCodeSentSuccess'));
          newEmailCountdown.value = 120;
          if (newEmailTimer.value) clearInterval(newEmailTimer.value);
          newEmailTimer.value = setInterval(() => {
            newEmailCountdown.value -= 1;
            if (newEmailCountdown.value <= 0 && newEmailTimer.value) {
              clearInterval(newEmailTimer.value);
              newEmailTimer.value = null;
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
    if (UserInfo.value.email) {
      inputParams.value.oldEmail = UserInfo.value.email;
    }

    // 新邮箱地址
    if (!inputParams.value.email.trim()) {
      CreateToast(t('new_email_placeholder'));
      return;
    }

    if (!isEmail(inputParams.value.email.trim())) {
      CreateToast(t('new_email_placeholder'));
      return;
    }

    // 新邮箱验证码
    if (!inputParams.value.code.trim()) {
      CreateToast(t('new_email_verify_code_placeholder'));
      return;
    }

    loading.value = true;

    bindEmail(inputParams.value)
      .then((res: any) => {
        const { code, msg } = res;
        if (code === 0) {
          // 修改成功重新登录
          CreateToast(UserInfo.value.email ? t('change_email_success') : t('bind_email_success'));
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
  .bind-email-page {
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

  .bind-email-page__field {
    background: #f9faff !important;
    box-shadow: 0 0 2px rgba(87, 119, 251, 0.25);

    :deep(.van-field__control) { color: #000; }
    :deep(.van-field__control::placeholder) { color: #bbb; }
  }

  .bind-email-page__send-btn {
    background: linear-gradient(180deg, #92b6ff 0%, #2a61f9 100%) !important;
    border: none !important;
    border-radius: 4px !important;
    color: #fff !important;
  }

  .bind-email-page__submit-btn {
    background: linear-gradient(180deg, #92b6ff 0%, #2a61f9 100%) !important;
    border: none !important;
    color: #fff !important;
  }
</style>
