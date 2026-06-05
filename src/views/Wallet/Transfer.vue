<template>
  <NavBar :title="t('str_transfer')" fixed placeholder :border="false" />
  <PageWrap>
    <div class="flex flex-col gap-[0.32rem] p-[0.32rem] mb-10">
      <div class="flex flex-col gap-[0.16rem]">
        <label class="text-[0.28rem] text-white">{{ t('str_currency') }}</label>
        <Popover v-model:show="showCurrencyPopover" :offset="[0, 8]" placement="bottom">
          <template #reference>
            <Cell
              clickable
              center
              size="large"
              :border="false"
              is-link
              :title="SelectedNetworkCoin.assetCode"
              class="!rounded-sm"
            >
              <template #icon>
                <Icon
                  :name="SelectedNetworkCoin.assetIcon"
                  :size="30"
                  class="mr-1 rounded-full overflow-hidden"
                  color="var(--van-primary-color)"
                />
              </template>
            </Cell>
          </template>
          <div
            class="w-28 max-h-17 !bg-[var(--van-background)] overflow-auto p-0.5 border-1 border-solid border-[var(--van-border-color)] rounded-sm"
          >
            <Cell
              v-for="item in AssetCurrencyList"
              :key="item.text"
              clickable
              center
              size="large"
              :border="true"
              :title="item.assetCode"
              class="!bg-transparent !pl-0.5 !pr-0"
              @click="onSelectNetworkCoin(item)"
            >
              <template #icon>
                <Icon
                  :name="item.assetIcon"
                  :size="30"
                  class="mr-1 rounded-full overflow-hidden"
                  color="var(--van-primary-color)"
                />
              </template>
              <template #right-icon>
                <Radio
                  shape="dot"
                  :icon-size="23"
                  :checked="SelectedNetworkCoin.assetCode === item.assetCode"
                  :name="item.assetCode"
                />
              </template>
            </Cell>
          </div>
        </Popover>
      </div>
      <div class="flex flex-col gap-[0.16rem]">
        <label class="text-[0.28rem] text-white">{{ t('str_target_account_id') }}</label>
        <Field
          clickable
          center
          clearable
          size="large"
          v-model="inputParams.toUid"
          type="digit"
          :placeholder="t('str_target_account_id_placeholder')"
          :border="false"
          autocomplete="off"
          :formatter="(v) => (v || '').replace(/\D/g, '')"
          inputmode="numeric"
          class="add-address-field !rounded-sm"
        />
      </div>
      <div class="flex flex-col gap-[0.16rem]">
        <label class="text-[0.28rem] text-white">{{ t('str_transfer_amount') }}</label>
        <Field
          clickable
          center
          clearable
          size="large"
          v-model="inputParams.transferAmount"
          :placeholder="t('str_transfer_amount_placeholder')"
          type="text"
          :maxlength="18"
          :min="transferMin()"
          :max="transferMax()"
          :border="false"
          autocomplete="off"
          :formatter="formatAmountMax4Decimals"
          inputmode="decimal"
          class="add-address-field !rounded-sm"
          @update:model-value="onChangeAmount"
        >
          <template #button>
            <div class="text-[var(--van-tab-active-text-color)]"
              ><span @click="SaveAll">{{ t('common_action_sendall') }}</span></div
            >
          </template>
        </Field>
        <div class="flex items-center justify-between">
          <div class="text-[var(--van-text-color)] text-[0.25rem]">{{
            t('str_available_Lpbalance')
          }}</div>
          <div class="text-[var(--van-tab-active-text-color)] text-[0.25rem]"
            >{{ AccountBalance.balance }} USDT</div
          >
        </div>
      </div>
      <div class="flex flex-col gap-[0.16rem]">
        <label class="text-[0.28rem] text-white">{{ t('str_withdraw_password') }}</label>
        <Field
          v-model="inputParams.password"
          center
          clearable
          size="large"
          :type="ShowPassword ? 'digit' : 'password'"
          autocomplete="off"
          :border="false"
          :maxlength="6"
          class="rounded-sm overflow-hidden"
          :placeholder="t('str_set_trade_password_placeholder')"
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
      </div>
      <div class="flex flex-col gap-[0.16rem]">
        <label class="text-[0.28rem] text-white">{{ t('transfer_remark') }}</label>
        <Field
          clickable
          center
          clearable
          size="large"
          v-model="inputParams.remark"
          :placeholder="t('transfer_remark_placeholder')"
          :border="false"
          autocomplete="off"
          class="add-address-field !rounded-sm"
        />
        <div class="bg-[var(--van-card-background)] rounded-sm overflow-hidden p-1 mt-2">
          <label class="text-[0.28rem] text-white">{{ t('str_recharge_tips') }}</label>
          <div class="text-[0.24rem] text-gray">
            <div>{{ t('str_transfer_tips', transferRangeTip) }}</div>
            <div class="mt-1">{{ t('str_transfer_tips_value') }}</div>
          </div>
        </div>
      </div>
    </div>
    <div class="fixed bottom-0 left-0 right-0 p-1 bg-[var(--van-background)]">
      <div class="flex items-center justify-between pb-0.5">
        <div>{{ t('str_transfer_fee') }}</div>
        <div class="text-[var(--van-tab-active-text-color)]"
          >{{ ReturnPrecision(CurrentWithdrawFeeRule.feeAmount, 4) }} USDT</div
        >
      </div>
      <div class="flex items-center justify-between pb-0.5">
        <div>{{ t('str_transfer_actual_amount') }}</div>
        <div class="text-[var(--van-tab-active-text-color)]"
          >{{ ReturnPrecision(ActualWithdrawAmount, 2) }} USDT</div
        >
      </div>
      <Button v-if="isLoading" :loading="isLoading" type="primary" block round />
      <Button v-else type="primary" block round @click="onSubmit">
        {{ t('common_text_btnConfirm') }}
      </Button>
    </div>
  </PageWrap>
</template>

<script setup lang="ts">
  import { useI18n } from 'vue-i18n';
  import { useRouter } from 'vue-router';
  import type { PopoverAction } from 'vant';
  import { ReturnPrecision } from '/@/utils';
  import { useDebounceFn } from '@vueuse/core';
  import { NavBar, PageWrap } from '/@/components';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { computed, ref, watch, onBeforeMount } from 'vue';
  import { Cell, Button, Popover, Field, Icon, Radio } from 'vant';
  import { useUserStoreWithOut } from '/@/stores/modules/UserConfig';
  import { getTransferFee, submitTransfer } from '/@/service/Wallet';

  /** 从 useI18n 解构的文案与能力 */
  const { t } = useI18n();

  /** 路由实例：编程式导航 */
  const router = useRouter();

  /** 用户：UserStore */
  const UserStore = useUserStoreWithOut();

  /** 从 useMessage 解构的 Toast / Dialog 能力 */
  const { CreateToast, CreateConfirmDialog } = useMessage();

  // 是否显示币种选择弹窗

  /** 响应式状态：显隐控制 */
  const showCurrencyPopover = ref(false);

  // 是否显示交易密码明文

  /** 响应式状态：显隐控制 */
  const ShowPassword = ref<boolean>(false);

  // 加载状态

  /** 响应式状态：加载中状态 */
  const isLoading = ref<boolean>(false);

  // 当前选择的网络币种

  /** 响应式状态：SelectedNetworkCoin 相关 UI 或数据 */
  const SelectedNetworkCoin = ref<any>({});

  // 表单数据

  /** 响应式状态：inputParams 相关 UI 或数据 */
  const inputParams = ref<any>({
    symbol: null,
    // 目标用户ID
    toUid: null,
    // 转账金额
    transferAmount: null,
    // 备注
    remark: null,
    // 交易密码
    password: null
  });

  // 账户余额

  /** 响应式状态：余额 */
  const AccountBalance = ref<any>({
    balance: null
  });

  // 手续费配置（按接口 tier1/tier2/tier3 字段）

  /** 响应式状态：配置 */
  const TransferFeeConfig = ref<any>({});

  // 当前金额的手续费配置

  /** 响应式状态：CurrentWithdrawFeeRule 相关 UI 或数据 */
  const CurrentWithdrawFeeRule = ref<any>({
    tier: 1,
    feeType: 1,
    feeValue: 0,
    feeAmount: 0
  });

  // 扣除手续费后的实际提币金额

  /** 响应式状态：金额输入 */
  const ActualWithdrawAmount = ref<number>(0);

  // 用户信息

  /** 计算属性：用户 */
  const UserInfo: any = computed(() => {
    return UserStore.getUserInfo;
  });

  // 获取资产币种

  /** 计算属性：列表数据 */
  const AssetCurrencyList = computed(() => {
    return UserStore.getAssetCurrencyList;
  });

  // 默认手续费配置（未命中时使用）

  /** 常量或静态配置：defaultFeeRule */
  const defaultFeeRule = { tier: 1, feeType: 1, feeValue: 0, feeAmount: 0 };

  /** toNum */
  const toNum = (v: unknown) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  // 说明里「单次可转」区间，来自 fee-config

  /** 计算属性：由其它状态派生的展示或判断 */
  const transferRangeTip = computed(() => {
    const min = toNum(TransferFeeConfig.value?.minAmount);
    const max = toNum(TransferFeeConfig.value?.maxAmount);
    return [min > 0 ? min : '—', max > 0 ? max : '—'] as (number | string)[];
  });

  /** transferMin */
  const transferMin = () => {
    const m = toNum(TransferFeeConfig.value?.minAmount);
    return m > 0 ? m : 0.0000001;
  };

  /** transferMax */
  const transferMax = () => {
    const cap = toNum(TransferFeeConfig.value?.maxAmount);
    const bal = toNum(AccountBalance.value?.balance);
    if (cap > 0) return bal > 0 ? Math.min(cap, bal) : cap;
    return bal;
  };

  // 按金额匹配手续费档位：
  // amount <= tier1UpperAmount => 1档
  // tier1UpperAmount < amount <= tier2UpperAmount => 2档
  // amount > tier2UpperAmount => 3档（使用 tier3UpperAmount 对应配置）

  /** 金额输入：pickFeeRuleByAmount */
  const pickFeeRuleByAmount = (amount: number) => {
    const cfg = TransferFeeConfig.value || {};
    const tier1UpperAmount = toNum(cfg.tier1UpperAmount);
    const tier2UpperAmount = toNum(cfg.tier2UpperAmount);
    if (amount <= tier1UpperAmount) {
      return {
        tier: 1,
        feeType: toNum(cfg.tier1FeeType),
        feeValue: toNum(cfg.tier1FeeValue)
      };
    }
    if (amount <= tier2UpperAmount) {
      return {
        tier: 2,
        feeType: toNum(cfg.tier2FeeType),
        feeValue: toNum(cfg.tier2FeeValue)
      };
    }
    return {
      tier: 3,
      feeType: toNum(cfg.tier3FeeType),
      feeValue: toNum(cfg.tier3FeeValue)
    };
  };

  // 提币数量：最多 4 位小数

  /** 金额输入：formatAmountMax4Decimals */
  const formatAmountMax4Decimals = (v: string) => {
    if (v === '' || v == null) return '';
    let s = String(v).replace(/[^\d.]/g, '');
    const parts = s.split('.');
    if (parts.length > 1) {
      s = parts[0] + '.' + parts.slice(1).join('').slice(0, 4);
    }
    return s;
  };

  // 监听金额变化

  /** 金额输入：onChangeAmount */
  const onChangeAmount = (value: any) => {
    const amount = toNum(value);
    // 如果金额为空，重置手续费和到账金额
    if (!amount) {
      CurrentWithdrawFeeRule.value = defaultFeeRule;
      ActualWithdrawAmount.value = 0;
      return;
    }
    // 先按金额匹配档位，再按手续费类型计算手续费金额
    const matchedRule = pickFeeRuleByAmount(amount);
    const feeType = matchedRule.feeType;
    const feeValue = matchedRule.feeValue;
    const feeAmount = feeType === 1 ? feeValue : amount * (feeValue / 100);
    CurrentWithdrawFeeRule.value = {
      ...matchedRule,
      feeAmount
    };
    ActualWithdrawAmount.value = Math.max(amount - feeAmount, 0);
  };

  // 获取账户余额和手续费

  /** getTransferFeeData */
  const getTransferFeeData = useDebounceFn(() => {
    getTransferFee({
      symbol: SelectedNetworkCoin.value.assetCode
    }).then((res) => {
      const { code } = res;
      if (code === 0) {
        const { data } = res;
        if (data) {
          const { balance } = data;
          AccountBalance.value = {
            balance: balance
          };
          // 设置手续费配置
          TransferFeeConfig.value = data;
          // 拉到新手续费配置后，立刻按当前输入重算一次
          onChangeAmount(inputParams.value.transferAmount);
        }
      }
    });
  }, 500);

  /** 事件或回调处理：onSelectNetworkCoin */
  const onSelectNetworkCoin = (action: PopoverAction) => {
    SelectedNetworkCoin.value = action;
    inputParams.value.symbol = action.assetCode;
    showCurrencyPopover.value = false;
    // 获取账户余额和手续费
    getTransferFeeData();
  };

  // 监听资产币种列表设置默认选中资产币种

  /** 侦听依赖变化并触发副作用 */
  watch(
    AssetCurrencyList,
    (newVal: any) => {
      // 初始化默认币种后筛选网络公链
      if (newVal.length > 0) {
        onSelectNetworkCoin(newVal[0]);
      }
    },
    { immediate: true, deep: true }
  );

  // 全部 = 和输入框「最大可转」一样

  /** SaveAll */
  const SaveAll = () => {
    const str = formatAmountMax4Decimals(String(transferMax() > 0 ? transferMax() : 0));
    inputParams.value.transferAmount = str;
    onChangeAmount(str);
  };

  /**
   * 提交提现
   */
  const onSubmit = () => {
    // 校验是否设置交易密码
    if (UserInfo.value.capitalPasswordSet === false) {
      CreateConfirmDialog({
        title: t('common_title_text'),
        message: t('str_set_trade_password_value'),
        confirmButtonText: t('str_set_trade_password_button'),
        cancelButtonText: t('common_text_btnCancel')
      }).then(() => {
        router.push('/TradePassword');
      });
      return;
    }
    // 校验目标用户ID
    if (!inputParams.value.toUid) {
      CreateToast(t('str_target_account_id_placeholder'));
      return;
    }
    // 校验转账金额
    if (!inputParams.value.transferAmount) {
      CreateToast(t('str_transfer_amount_placeholder'));
      return;
    }
    const amount = toNum(inputParams.value.transferAmount);
    const minA = toNum(TransferFeeConfig.value?.minAmount);
    const maxA = toNum(TransferFeeConfig.value?.maxAmount);
    const bal = toNum(AccountBalance.value?.balance);
    if (minA > 0 && amount < minA) {
      CreateToast(t('str_transfer_below_min', [minA]));
      return;
    }
    if (maxA > 0 && amount > maxA) {
      CreateToast(t('str_transfer_above_max', [maxA]));
      return;
    }
    if (amount > bal) {
      CreateToast(t('str_transfer_exceed_balance'));
      return;
    }
    // 校验交易密码
    if (!inputParams.value.password) {
      CreateToast(t('str_set_trade_password_placeholder'));
      return;
    }
    // 加载状态
    isLoading.value = true;
    // 提交转账
    submitTransfer(inputParams.value)
      .then((res) => {
        const { code, msg } = res;
        if (code === 0) {
          CreateToast(t('transfer_success'));
          setTimeout(() => {
            router.back();
          }, 1000);
        } else {
          CreateToast(msg);
        }
        isLoading.value = false;
      })
      .catch(() => {
        isLoading.value = false;
      });
  };

  // 初始化
  onBeforeMount((): void => {
    UserStore.fetchAssetCurrencyList();
  });
</script>

<style lang="less" scoped>
  .add-address-field :deep(.van-cell) {
    background: #1e2540;
    color: #fff;
  }

  .add-address-field :deep(.van-field__control) {
    color: #fff;
  }

  .add-address-field :deep(.van-field__control::placeholder) {
    color: rgba(255, 255, 255, 0.5);
  }

  .add-address-field :deep(.van-icon) {
    color: #fff;
  }

  :deep(.van-popover__wrapper) {
    width: 100%;
  }

  :deep(.van-popover__content) {
    background: transparent;
  }

  :deep(.van-radio__icon--checked) {
    border: none;
  }
</style>
