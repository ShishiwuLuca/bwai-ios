<template>
  <div class="transfer-st-page-wrap transfer-st-page">
    <NavBar :title="t('str_transfer_st')" fixed placeholder :border="false" />
    <PageWrap class="p-1 mb-10">
      <!-- 账户选择 -->
      <div class="p-1 rounded-sm overflow-hidden transfer-st-page__card">
        <div class="transfer-st-accounts__body">
          <div class="transfer-st-accounts__rows">
            <template v-for="(row, index) in accountRows" :key="row.key">
              <div v-if="index > 0" class="transfer-st-accounts__divider"></div>
              <div class="transfer-st-accounts__row">
                <span
                  class="transfer-st-accounts__dot"
                  :class="`transfer-st-accounts__dot--${row.dot}`"
                ></span>
                <span class="transfer-st-accounts__label">{{ t(row.labelKey) }}</span>
                <Popover
                  v-model:show="accountPopover[row.key]"
                  :actions="row.options"
                  placement="bottom"
                  @select="onSelectAccount(row.key, $event)"
                >
                  <template #reference>
                    <div class="transfer-st-accounts__select">
                      <span class="truncate">{{ row.display }}</span>
                      <Icon name="arrow-down" :size="14" />
                    </div>
                  </template>
                </Popover>
              </div>
            </template>
          </div>
          <button type="button" class="transfer-st-accounts__swap" @click="swapAccounts">
            <Icon name="sort" :size="22" color="var(--van-primary-color)" />
          </button>
        </div>
      </div>

      <!-- 币种 -->
      <div class="flex flex-col gap-[0.16rem] mt-2">
        <label class="text-[0.28rem] text-[#000] font-medium">{{ t('str_currency') }}</label>
        <Cell center size="large" :border="false" title="USDT" class="!rounded-sm">
          <template #icon>
            <Icon :name="USDTIcon" :size="30" class="mr-1 rounded-full overflow-hidden" />
          </template>
        </Cell>
      </div>

      <!-- 数量 -->
      <div class="flex flex-col gap-[0.16rem] mt-2">
        <label class="text-[0.28rem] text-[#000] font-medium">{{ t('str_transfer_st_amount') }}</label>
        <Field
          clickable
          center
          clearable
          size="large"
          v-model="inputAmount"
          :placeholder="t('str_transfer_st_amount_placeholder')"
          type="text"
          :maxlength="18"
          :border="false"
          autocomplete="off"
          :formatter="formatAmountMax4Decimals"
          inputmode="decimal"
          class="add-address-field !rounded-sm"
          @update:model-value="onAmountInput"
          @blur="onAmountBlur"
        >
          <template #button>
            <div class="text-[#2071f8]">
              USDT |
              <span @click="fillAll">{{ t('common_action_sendall') }}</span>
            </div>
          </template>
        </Field>
        <div class="flex items-center justify-end">
          <div class="text-[#333] text-[0.25rem] mr-.5">
            {{ t('str_available_balance') }} :
          </div>
          <div class="text-[#2071f8] text-[0.25rem]">
            {{ formatUsdt(availableBalance) }}
          </div>
        </div>
      </div>

      <!-- 划转须知 -->
      <div class="p-1 rounded-sm overflow-hidden transfer-st-page__card mt-2">
        <label class="text-[0.28rem] text-[#000] font-medium">{{ t('str_transfer_st_notice') }}</label>
        <div class="text-[0.24rem] text-gray mt-0.5">
          <div v-if="showRemainingVolume" class="text-[var(--van-text-color)] mb-0.5">
            {{ t('str_transfer_st_remaining_volume') }}:
            {{ formatUsdt(remainingVolume) }}
          </div>
          <div>{{ t('str_transfer_st_tips') }}</div>
        </div>
      </div>

      <!-- 底部操作栏 -->
      <div class="fixed bottom-0 left-0 right-0 p-1 bg-[#f2f5fe]">
        <div v-if="showTransferFee" class="flex items-center justify-between pb-0.5">
          <div class="text-[0.28rem] text-[#333]">{{ t('str_transfer_st_fee') }}</div>
          <div class="text-[#2071f8] text-[0.28rem]">{{ feeDisplayText }}</div>
        </div>
        <div class="flex items-center justify-between pb-0.5" >
          <div class="text-[0.28rem] text-[#333]">{{ t('str_transfer_st_actual_amount') }}</div>
          <div class="text-[#2071f8] text-[0.28rem]">{{ actualAmountDisplay }}</div>
        </div>
        <Button v-if="isLoading" :loading="isLoading" type="primary" block round />
        <Button v-else type="primary" block round :disabled="!canSubmit" @click="onSubmit">
          {{ t('str_transfer_st_submit') }}
        </Button>
      </div>
    </PageWrap>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import type { PopoverAction } from 'vant';
import { ReturnPrecision } from '/@/utils';
import USDTIcon from '/@/assets/images/USDT.png';
import { NavBar, PageWrap } from '/@/components';
import { useMessage } from '/@/hooks/web/useMessage';
import { computed, reactive, ref, onBeforeMount } from 'vue';
import { Cell, Button, Popover, Field, Icon } from 'vant';
import { useUserStoreWithOut } from '/@/stores/modules/UserConfig';
import {
  getMyWalletInfo,
  getTransferChannelList,
  getTransferSTFee,
  getTransferTradeAmount,
  submitTransferST,
  type TransferSettingVo
} from '/@/service/Wallet';

/** 划转固定币种 */
const SYMBOL = 'USDT';

type AccountSide = 'from' | 'to';

/** 从 useI18n 解构的文案与能力 */
const { t } = useI18n();

/** 路由实例：编程式导航 */
const router = useRouter();

/** 当前路由：读取来源账户等 query */
const route = useRoute();

/** 用户：UserStore */
const UserStore = useUserStoreWithOut();

/** 从 useMessage 解构的 Toast / Dialog 能力 */
const { CreateToast } = useMessage();

/** 响应式状态：显隐控制 */
const accountPopover = reactive<Record<AccountSide, boolean>>({
  from: false,
  to: false
});

/** 响应式状态：加载中状态 */
const isLoading = ref(false);

/** 响应式状态：划转通道列表 */
const transferChannels = ref<TransferSettingVo[]>([]);

/** 响应式状态：转出 / 转入账户 */
const fromAccount = ref('');
const toAccount = ref('');

/** 响应式状态：钱包原始数据 */
const walletData = ref<any>({});

/** 响应式状态：表单 */
const inputAmount = ref('');

/** 响应式状态：可用余额 */
const availableBalance = ref(0);

/** 响应式状态：剩余交易量 */
const remainingVolume = ref(0);

/** 响应式状态：手续费金额（getFee 接口返回） */
const transferFeeAmount = ref(0);

/** 响应式状态：手续费是否已请求完成 */
const feeLoaded = ref(false);

/** 响应式状态：实际到账 */
const actualAmount = ref(0);

/** toNum */
const toNum = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/** 账户展示文案 */
const getAccountLabel = (account: string) => {
  const key = String(account || '').toUpperCase();
  if (['ST', 'AI', 'LP'].includes(key)) {
    return t('str_my_account_value', [key]);
  }
  return account;
};

/** 构建账户 Popover 选项 */
const buildAccountOptions = (accounts: string[]) =>
  accounts.map((account) => ({
    text: getAccountLabel(account),
    value: account
  }));

/** 计算属性：转出账户选项（通道 fromAccount 去重） */
const fromAccountOptions = computed(() =>
  buildAccountOptions([...new Set(transferChannels.value.map((item) => item.fromAccount))])
);

/** 计算属性：转入账户选项（当前转出账户对应的 toAccount） */
const toAccountOptions = computed(() => {
  const accounts = [
    ...new Set(
      transferChannels.value
        .filter((item) => item.fromAccount === fromAccount.value)
        .map((item) => item.toAccount)
    )
  ];
  return buildAccountOptions(accounts);
});

/** 计算属性：转出账户文案 */
const fromAccountLabel = computed(() => getAccountLabel(fromAccount.value) || '--');

/** 计算属性：转入账户文案 */
const toAccountLabel = computed(() => getAccountLabel(toAccount.value) || '--');

/** 账户选择行配置 */
const accountRows = computed(() => [
  {
    key: 'from' as AccountSide,
    dot: 'from',
    labelKey: 'str_transfer_st_from',
    display: fromAccountLabel.value,
    options: fromAccountOptions.value
  },
  {
    key: 'to' as AccountSide,
    dot: 'to',
    labelKey: 'str_transfer_st_to',
    display: toAccountLabel.value,
    options: toAccountOptions.value
  }
]);

/** 当前匹配的划转通道 */
const currentChannel = computed(() =>
  transferChannels.value.find(
    (item) => item.fromAccount === fromAccount.value && item.toAccount === toAccount.value
  )
);

/** 格式化 USDT 展示 */
const formatUsdt = (amount: number, decimals = 4) => `${ReturnPrecision(amount, decimals)} ${SYMBOL}`;

/** 计算属性：是否展示剩余交易量（仅从 ST 转出时） */
const showRemainingVolume = computed(
  () => String(fromAccount.value || '').toUpperCase() === 'ST'
);

/** 计算属性：是否展示手续费（等于 0 时不显示，且需请求完成） */
const showTransferFee = computed(() => feeLoaded.value && transferFeeAmount.value > 0);

/** 计算属性：手续费展示文案（来自 getFee 接口） */
const feeDisplayText = computed(() => formatUsdt(transferFeeAmount.value));

/** 计算属性：实际划转金额展示（未填写数量或手续费未返回时展示 --） */
const actualAmountDisplay = computed(() => {
  if (!toNum(inputAmount.value) || !feeLoaded.value) return '--';
  return formatUsdt(actualAmount.value);
});

/** 计算属性：是否可提交（实际划转金额大于 0 时高亮） */
const canSubmit = computed(() => feeLoaded.value && actualAmount.value > 0);

/** 清空手续费汇总展示 */
const resetFeeSummary = () => {
  transferFeeAmount.value = 0;
  feeLoaded.value = false;
  actualAmount.value = 0;
};

/** 手续费防抖定时器 */
let feeDebounceTimer: ReturnType<typeof setTimeout> | null = null;

/** 取消待执行的手续费请求 */
const cancelFeeDebounce = () => {
  if (feeDebounceTimer) {
    clearTimeout(feeDebounceTimer);
    feeDebounceTimer = null;
  }
};

/** 拉取划转手续费（立即请求） */
const fetchTransferFeeNow = () => {
  const channel = currentChannel.value;
  const amount = toNum(inputAmount.value);
  const uid = toNum((UserStore.getUserInfo as any)?.id);

  if (!channel?.id || !amount || !uid) {
    resetFeeSummary();
    return;
  }

  getTransferSTFee({
    uid,
    amount,
    settingId: channel.id
  }).then((res) => {
    if (res?.code !== 0) return;
    // 避免旧请求覆盖新输入
    if (toNum(inputAmount.value) !== amount) return;
    transferFeeAmount.value = toNum(res.data);
    feeLoaded.value = true;
    actualAmount.value = Math.max(amount - transferFeeAmount.value, 0);
  });
};

/** 输入停止后再请求手续费 */
const fetchTransferFeeDebounced = () => {
  cancelFeeDebounce();
  feeDebounceTimer = setTimeout(() => {
    feeDebounceTimer = null;
    fetchTransferFeeNow();
  }, 800);
};

/** 路由带入的默认转出账户（AI / LP / ST 等） */
const getRouteFromAccount = () => {
  const raw = route.query.from ?? route.query.type ?? route.query.accountType;
  return String(raw || '').trim().toUpperCase();
};

/** 应用默认通道：优先使用来源页账户，否则取列表首项 */
const applyDefaultChannel = () => {
  const preferred = getRouteFromAccount();

  if (preferred) {
    const channel = transferChannels.value.find(
      (item) => String(item.fromAccount).toUpperCase() === preferred
    );
    if (channel) {
      fromAccount.value = channel.fromAccount;
      toAccount.value = channel.toAccount;
      refreshBalance();
      return;
    }

    const fromOptions = [
      ...new Set(transferChannels.value.map((item) => item.fromAccount))
    ];
    const matchedFrom = fromOptions.find((account) => String(account).toUpperCase() === preferred);
    if (matchedFrom) {
      fromAccount.value = matchedFrom;
      ensureValidToAccount();
      refreshBalance();
      return;
    }
  }

  const first = transferChannels.value[0];
  if (!first) return;
  fromAccount.value = first.fromAccount;
  toAccount.value = first.toAccount;
  refreshBalance();
};

/** 校验并修正转入账户 */
const ensureValidToAccount = () => {
  const validTos = toAccountOptions.value.map((item) => item.value);
  if (!validTos.length) {
    toAccount.value = '';
    return;
  }
  if (!validTos.includes(toAccount.value)) {
    toAccount.value = validTos[0];
  }
};

/** 从钱包数据读取账户可用余额 */
const readAccountBalance = (data: any, account: string) => {
  const upper = String(account || '').toUpperCase();
  if (upper === 'AI') return toNum(data?.ai_fa);
  if (upper === 'LP') return toNum(data?.lp_fa);
  if (upper === 'ST') return toNum(data?.st_fa ?? data?.totalBalance);
  const row = data?.balanceList?.find(
    (item: any) => String(item?.accountType).toUpperCase() === upper
  );
  return toNum(row?.balance);
};

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

/** 将输入金额限制在可用余额内 */
const clampAmountToBalance = (n: number) => {
  if (!Number.isFinite(n) || n <= 0) return n;
  const max = availableBalance.value;
  if (max <= 0) return 0;
  return Math.min(n, max);
};

/** 超出可用余额时回写输入框 */
const normalizeAmountInput = (value: string | number | null) => {
  if (value === '' || value == null || String(value).trim() === '' || String(value) === '.') {
    return '';
  }
  const num = toNum(value);
  if (!num) return formatAmountMax4Decimals(String(value));
  const capped = clampAmountToBalance(num);
  if (capped !== num) {
    return formatAmountMax4Decimals(String(capped > 0 ? capped : ''));
  }
  return formatAmountMax4Decimals(String(value));
};

/** 同步输入金额上限，账户切换后可能需压回可用余额 */
const syncAmountWithinBalance = () => {
  const normalized = normalizeAmountInput(inputAmount.value);
  if (normalized !== inputAmount.value) {
    inputAmount.value = normalized;
  }
  if (!toNum(normalized)) {
    cancelFeeDebounce();
    resetFeeSummary();
  }
};

/** 刷新可用余额 */
const refreshBalance = () => {
  availableBalance.value = readAccountBalance(walletData.value, fromAccount.value);
  syncAmountWithinBalance();
  if (toNum(inputAmount.value) > 0) {
    fetchTransferFeeNow();
  }
};

/** 金额输入中：限制不超过可用余额，输入停止后再请求手续费 */
const onAmountInput = (value: string | number | null) => {
  const normalized = normalizeAmountInput(value);
  if (normalized !== value) {
    inputAmount.value = normalized;
  }

  if (!toNum(normalized)) {
    cancelFeeDebounce();
    resetFeeSummary();
    return;
  }

  feeLoaded.value = false;
  actualAmount.value = 0;
  fetchTransferFeeDebounced();
};

/** 失焦后立即请求手续费 */
const onAmountBlur = () => {
  if (toNum(inputAmount.value) <= 0) return;
  cancelFeeDebounce();
  fetchTransferFeeNow();
};

/** 事件或回调处理：选择转出 / 转入账户 */
const onSelectAccount = (side: AccountSide, action: PopoverAction & { value?: string }) => {
  if (!action.value) return;

  if (side === 'from') {
    fromAccount.value = action.value;
    ensureValidToAccount();
  } else {
    toAccount.value = action.value;
  }

  accountPopover[side] = false;
  refreshBalance();
};

/** 交换转出 / 转入账户（仅当存在反向通道时生效） */
const swapAccounts = () => {
  const reversed = transferChannels.value.find(
    (item) => item.fromAccount === toAccount.value && item.toAccount === fromAccount.value
  );
  if (!reversed) {
    CreateToast(t('str_transfer_st_no_reverse_channel'));
    return;
  }
  fromAccount.value = reversed.fromAccount;
  toAccount.value = reversed.toAccount;
  refreshBalance();
};

/** 全部填充 */
const fillAll = () => {
  inputAmount.value = formatAmountMax4Decimals(
    String(availableBalance.value > 0 ? availableBalance.value : 0)
  );
  cancelFeeDebounce();
  fetchTransferFeeNow();
};

/** 拉取划转通道列表 */
const fetchTransferChannelList = () => {
  getTransferChannelList().then((res) => {
    if (res?.code !== 0 || !Array.isArray(res?.data)) return;
    transferChannels.value = res.data;
    if (transferChannels.value.length > 0) {
      applyDefaultChannel();
    }
  });
};

/** 拉取钱包信息 */
const fetchMyWalletInfo = () => {
  getMyWalletInfo({}).then((res) => {
    if (res?.code !== 0 || !res?.data) return;
    walletData.value = res.data;
    refreshBalance();
  });
};

/** 拉取剩余交易量 */
const fetchRemainingVolume = () => {
  getTransferTradeAmount().then((res) => {
    if (res?.code !== 0) return;
    remainingVolume.value = toNum(res.data);
  });
};

/** 提交划转 */
const onSubmit = () => {
  if (!currentChannel.value) {
    CreateToast(t('str_transfer_st_invalid_channel'));
    return;
  }
  if (fromAccount.value === toAccount.value) {
    CreateToast(t('str_transfer_st_same_account'));
    return;
  }

  const amount = toNum(inputAmount.value);
  if (!amount) {
    CreateToast(t('str_transfer_st_amount_required'));
    return;
  }
  if (amount > availableBalance.value) {
    CreateToast(t('str_transfer_st_exceed_balance'));
    return;
  }

  isLoading.value = true;
  submitTransferST({
    amount,
    settingId: currentChannel.value.id
  })
    .then((res) => {
      const { code, msg } = res;
      if (code === 0) {
        CreateToast(t('str_transfer_st_success'));
        setTimeout(() => router.back(), 1000);
      } else {
        CreateToast(msg);
      }
    })
    .finally(() => {
      isLoading.value = false;
    });
};

onBeforeMount((): void => {
  fetchTransferChannelList();
  fetchMyWalletInfo();
  fetchRemainingVolume();
});
</script>

<style lang="less" scoped>
.transfer-st-page {
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

.transfer-st-page__card {
  background: #f9faff;
  box-shadow: 0 0 2px rgba(87, 119, 251, 0.25);
}

.transfer-st-accounts__body {
  display: flex;
  align-items: center;
}

.transfer-st-accounts__rows {
  flex: 1;
  min-width: 0;
}

.transfer-st-accounts__row {
  display: flex;
  align-items: center;
  gap: 0.16rem;
  min-height: 0.72rem;
}

.transfer-st-accounts__dot {
  flex-shrink: 0;
  width: 0.12rem;
  height: 0.12rem;
  border-radius: 50%;

  &--from {
    background: var(--van-tab-active-text-color);
  }

  &--to {
    background: #ff6b6b;
  }
}

.transfer-st-accounts__label {
  flex-shrink: 0;
  width: 0.36rem;
  font-size: 0.28rem;
  color: var(--van-text-color);
}

.transfer-st-accounts__select {
  flex: 1;
  min-width: 0;
  height: 0.72rem;
  padding: 0 0.24rem;
  border-radius: 0.12rem;
  color: var(--van-text-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.12rem;
  font-size: 0.28rem;
}

.transfer-st-accounts__divider {
  height: 1px;
  margin: 0.16rem 0 0.16rem 0.28rem;
  background: var(--van-border-color);
  opacity: 0.6;
}

.transfer-st-accounts__swap {
  flex-shrink: 0;
  width: 0.72rem;
  height: 0.72rem;
  border: none;
  border-radius: 50%;
  background: none;
  display: flex;
  align-items: center;
  justify-content: right;
  cursor: pointer;
  padding: 0;
}

:deep(.van-cell) {
  background: #f9faff !important;
  box-shadow: 0 0 2px rgba(87, 119, 251, 0.25);
  border: none !important;
}

.add-address-field :deep(.van-cell) {
  color: #000;
}

.add-address-field :deep(.van-field__control) {
  color: #000;
}

.add-address-field :deep(.van-field__control::placeholder) {
  color: #bbb;
}

.add-address-field :deep(.van-icon) {
  color: #8c8c8c;
}

:deep(.van-popover__wrapper) {
  flex: 1;
  min-width: 0;
}

:deep(.van-popover__content) {
  background: #fff !important;
  border: 1px solid #e0e1fd !important;
}

:deep(.van-popover__arrow) {
  border-bottom-color: #fff !important;
}
</style>
