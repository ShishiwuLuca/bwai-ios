<template>
  <PageWrap class="invest-join-page">
    <NavBar title="参与投资" fixed placeholder :border="false" />
    <div class="invest-join-page__content">
      <AppCardLinear class="invest-join-page__banner">
        <span>Flexible asset management</span>
      </AppCardLinear>
      <div class="invest-join-page__form">
        <Field label="参与人信息" readonly class="field-bg" />
        <Field v-model="form.currency" label="投资币种" readonly class="field-bg" />
        <Field v-model="form.lockDays" label="锁仓周期" readonly class="field-bg" />
        <Field v-model="form.arriveDate" label="到账日期" readonly class="field-bg" />
        <Field v-model="form.arriveType" label="到账类型" readonly class="field-bg" />
        <Field v-model="form.income" label="预计收益" readonly class="field-bg" />
        <Field v-model="form.remark" label="订单备注" placeholder="选填" class="field-bg" />
        <Field
          v-model="form.redeemAmount"
          type="digit"
          label="赎回金额"
          placeholder="请输入赎回金额"
          class="field-bg"
        />
        <Field v-model="form.redeemable" label="可赎回金额" readonly class="field-bg" />
        <Field v-model="form.autoReinvest" label="自动续投" readonly>
          <template #input>
            <Switch v-model="form.autoReinvestBool" size="20" />
          </template>
        </Field>
      </div>
      <p class="invest-join-page__tips">免责声明...</p>
      <Button type="primary" block round class="invest-join-page__btn" @click="onSubmit"
        >申购</Button
      >
    </div>
    <Dialog
      v-model:show="showPwdTip"
      title="交易密码验证"
      show-cancel-button
      confirm-button-text="去验证"
      @confirm="showPwdInput = true"
    >
      <p class="invest-join-page__dialog-tip">请先验证交易密码</p>
    </Dialog>
    <Dialog
      v-model:show="showPwdInput"
      title="交易密码验证"
      show-cancel-button
      confirm-button-text="验证"
      @confirm="onVerify"
    >
      <Field v-model="tradePwd" type="password" placeholder="交易密码" class="field-bg" />
    </Dialog>
  </PageWrap>
</template>

<script setup lang="ts">
  import { ref, reactive } from 'vue';
  import type { InvestJoinForm } from '/#/views';
  import { NavBar, PageWrap, AppCardLinear } from '/@/components';
  import { Field, Button, Dialog, Switch } from 'vant';

  /** 是否显示“去设置交易密码”提示弹窗、是否显示密码输入弹窗 */
  const showPwdTip = ref<boolean>(false);

  /** 响应式状态：显隐控制 */
  const showPwdInput = ref<boolean>(false);

  /** 交易密码输入 */
  const tradePwd = ref<string>('');

  /** 申购表单：币种、锁仓天数、到账日、到账方式、预计收益、备注、赎回金额、可赎回、自动复投等 */
  const form = reactive<InvestJoinForm>({
    currency: 'USDT',
    lockDays: '300天',
    arriveDate: '2024-xx-xx',
    arriveType: '到期本息',
    income: '0',
    remark: '',
    redeemAmount: '',
    redeemable: '10000',
    autoReinvest: '',
    autoReinvestBool: false
  });

  /** 提交申购：先弹出交易密码验证 */
  const onSubmit = (): void => {
    showPwdTip.value = true;
  };

  /** 验证交易密码后发起申购（待对接接口） */
  const onVerify = (): void => {
    console.log('verify', tradePwd.value);
  };
</script>

<style scoped lang="less">
  .invest-join-page {
    color: var(--van-text-color);
  }

  .invest-join-page__content {
    padding: 0.32rem;
  }

  .invest-join-page__banner {
    padding: 0.28rem;
    margin-bottom: 0.24rem;
  }

  .field-bg :deep(.van-cell) {
    background: var(--van-field-background);
  }

  .invest-join-page__tips {
    font-size: 0.22rem;
    opacity: 0.8;
    margin: 0.2rem 0;
  }

  .invest-join-page__btn {
    margin-top: 0.24rem;
    height: 0.88rem;
  }

  .invest-join-page__dialog-tip {
    padding: 0.24rem 0;
  }
</style>
