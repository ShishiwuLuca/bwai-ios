<template>
  <NavBar :title="t('str_withdraw')" fixed placeholder :border="false" />
  <PageWrap>
    <div class="flex flex-col gap-[0.32rem] p-[0.32rem] mb-10">
      <div class="flex flex-col gap-[0.16rem]">
        <label class="text-[0.28rem] text-white">{{ t('str_withdraw_currency') }}</label>
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
        <label class="text-[0.28rem] text-white">{{ t('str_withdraw_chain') }}</label>
        <Popover v-model:show="showNetworkPopover" :offset="[0, 8]" placement="bottom">
          <template #reference>
            <Cell
              clickable
              center
              size="large"
              :border="false"
              is-link
              :title="SelectedNetworkType.text"
              class="!rounded-sm"
            />
          </template>
          <div
            class="w-28 max-h-17 !bg-[var(--van-background)] overflow-auto p-0.5 border-1 border-solid border-[var(--van-border-color)] rounded-sm"
          >
            <Cell
              v-for="item in RechargeNetworkList"
              :key="item.text"
              clickable
              center
              size="large"
              :border="true"
              :title="item.text"
              class="!bg-transparent !pl-0.5 !pr-0"
              @click="onSelectNetwork(item)"
            >
              <template #right-icon>
                <Radio
                  shape="dot"
                  :icon-size="23"
                  :checked="SelectedNetworkType.chainTypeCode === item.chainTypeCode"
                  :name="item.chainTypeCode"
                />
              </template>
            </Cell>
          </div>
        </Popover>
      </div>
      <div class="flex flex-col gap-[0.16rem]">
        <label class="text-[0.28rem] text-white">{{ t('str_withdraw_address') }}</label>
        <Field
          clickable
          center
          clearable
          size="large"
          v-model="inputParams.address"
          :placeholder="t('str_withdraw_placeholder_address')"
          :border="false"
          autocomplete="off"
          class="add-address-field !rounded-sm"
        >
          <template #button>
            <div
              class="text-[var(--van-tab-active-text-color)]"
              @click="showAddressBookPopup = true"
              >{{ t('address_book_title') }}</div
            >
          </template>
        </Field>
      </div>
      <div class="flex flex-col gap-[0.16rem]">
        <label class="text-[0.28rem] text-white">{{ t('str_withdraw_amount') }}</label>
        <Field
          clickable
          center
          clearable
          size="large"
          v-model="inputParams.amount"
          :placeholder="t('str_withdraw_placeholder_amount')"
          type="text"
          :maxlength="18"
          :min="AccountBalance.withdrawMin || 0.0000001"
          :max="AccountBalance.withdrawMax || 10000"
          :border="false"
          autocomplete="off"
          :formatter="formatAmountMax4Decimals"
          inputmode="decimal"
          class="add-address-field !rounded-sm"
          @update:model-value="onChangeAmount"
        >
          <template #button>
            <div class="text-[var(--van-tab-active-text-color)]"
              >USDT | <span @click="SaveAll">{{ t('common_action_sendall') }}</span></div
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
        <div class="bg-[var(--van-card-background)] rounded-sm overflow-hidden p-1 mt-2">
          <label class="text-[0.28rem] text-white">{{ t('str_recharge_tips') }}</label>
          <div class="text-[0.24rem] text-gray">
            <div>{{
              t('str_withdraw_tips', [
                AccountBalance.withdrawMin,
                AccountBalance.withdrawMax,
                'USDT'
              ])
            }}</div>
            <div class="mt-1">{{ t('str_withdraw_tips_value') }}</div>
          </div>
        </div>
      </div>
    </div>
    <div class="fixed bottom-0 left-0 right-0 p-1 bg-[var(--van-background)]">
      <div class="flex items-center justify-between pb-0.5">
        <div>{{ t('str_withdraw_fee_tips') }}</div>
        <div class="text-[var(--van-tab-active-text-color)]"
          >{{ CurrentWithdrawFeeRule.fee_val }}
          {{ CurrentWithdrawFeeRule.mode === 'fixed' ? 'USDT' : '%' }}</div
        >
      </div>
      <div class="flex items-center justify-between pb-0.5">
        <div>{{ t('str_withdraw_actual_amount') }}</div>
        <div class="text-[var(--van-tab-active-text-color)]"
          >{{ ReturnPrecision(ActualWithdrawAmount, 2) }} USDT</div
        >
      </div>
      <Button v-if="isLoading" :loading="isLoading" type="primary" block round />
      <Button v-else type="primary" block round @click="onSubmit">
        {{ t('str_withdraw_confirm') }}
      </Button>
    </div>
  </PageWrap>
  <Popup
    v-model:show="showAddressBookPopup"
    position="bottom"
    class="w-full p-1 !max-h-[90%] !min-h-[50%] modal"
  >
    <div class="flex items-center justify-between pb-1">
      <div class="text-[0.3rem] font-bold text-[var(--van-text-color)]">{{
        t('address_book_placeholder')
      }}</div>
      <div @click="showAddressBookPopup = false">
        <Icon name="cross" :size="25" color="var(--van-text-color)" />
      </div>
    </div>
    <PullRefresh
      v-model="refreshing"
      @refresh="onRefresh"
      class="!overflow-auto !max-h-[87%]"
      :style="{ minHeight: '40vh' }"
    >
      <List v-model:loading="loading" :finished="finished" :immediate-check="false" @load="onLoad">
        <template #finished>
          <Empty v-if="AddressBookList.length < 1" :image="EmptyImg" image-size="4rem">
            <template #description>
              <span class="text-[0.32rem] text-white">{{ t('address_book_empty_text') }}</span>
            </template>
          </Empty>
          <Button
            v-if="AddressBookList.length < 1"
            type="primary"
            block
            round
            class="!mx-auto !w-[4rem]"
            to="/AddAddress?type=add"
          >
            {{ t('address_book_add_btn') }}
          </Button>
        </template>
        <Cell
          v-for="(item, index) in AddressBookList"
          :key="index"
          clickable
          center
          size="large"
          :border="false"
          class="rounded !pt-1 !pb-1 mb-1"
          :title="item.label"
          :label="item.address"
          @click="SelectAddress(item)"
        />
      </List>
    </PullRefresh>
  </Popup>
</template>

<script setup lang="ts">
  import { useI18n } from 'vue-i18n';
  import { useRouter } from 'vue-router';
  import type { PopoverAction } from 'vant';
  import { ReturnPrecision } from '/@/utils';
  import { useDebounceFn } from '@vueuse/core';
  import { NavBar, PageWrap } from '/@/components';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { getAddressBookList } from '/@/service/Wallet';
  import EmptyImg from '/@/assets/images/empty_address.png';
  import { computed, ref, watch, onBeforeMount } from 'vue';
  import { isValidWithdrawAddress } from '/@/utils/walletAddress';
  import { useUserStoreWithOut } from '/@/stores/modules/UserConfig';
  import { useSystemStoreWithOut } from '/@/stores/modules/SystemConfig';
  import { getAccountBalanceAndFee, submitWithdraw } from '/@/service/Wallet';
  import { Cell, Button, Popover, Field, Icon, Popup, Empty, PullRefresh, List, Radio } from 'vant';

  /** 从 useI18n 解构的文案与能力 */
  const { t } = useI18n();

  /** 路由实例：编程式导航 */
  const router = useRouter();

  /** 用户：UserStore */
  const UserStore = useUserStoreWithOut();

  /** SystemStore */
  const SystemStore = useSystemStoreWithOut();

  /** 从 useMessage 解构的 Toast / Dialog 能力 */
  const { CreateToast, CreateConfirmDialog } = useMessage();

  // 是否显示网络选择弹窗

  /** 响应式状态：显隐控制 */
  const showNetworkPopover = ref(false);

  // 是否显示币种选择弹窗

  /** 响应式状态：显隐控制 */
  const showCurrencyPopover = ref(false);

  // 是否显示交易密码明文

  /** 响应式状态：显隐控制 */
  const ShowPassword = ref<boolean>(false);

  // 加载状态

  /** 响应式状态：加载中状态 */
  const isLoading = ref<boolean>(false);

  // 是否显示地址簿弹窗

  /** 响应式状态：显隐控制 */
  const showAddressBookPopup = ref<boolean>(false);

  // 下拉刷新状态

  /** 响应式状态：下拉刷新 */
  const refreshing = ref<boolean>(false);

  // 上啦加载状态

  /** 响应式状态：加载中状态 */
  const loading = ref<boolean>(false);

  // 是否已加载完所有数据

  /** 响应式状态：列表是否已全部加载 */
  const finished = ref<boolean>(false);

  // 查询参数

  /** 响应式状态：AddressBookParams 相关 UI 或数据 */
  const AddressBookParams = ref<any>({
    pageNo: 0,
    pageSize: 10
  });

  // 充值公链选项列表

  /** 响应式状态：列表数据 */
  const RechargeNetworkList = ref<any[]>([]);

  // 当前选择的网络币种

  /** 响应式状态：SelectedNetworkCoin 相关 UI 或数据 */
  const SelectedNetworkCoin = ref<any>({});

  // 当前选择的网络类型

  /** 响应式状态：SelectedNetworkType 相关 UI 或数据 */
  const SelectedNetworkType = ref<any>({});

  // 表单数据

  /** 响应式状态：inputParams 相关 UI 或数据 */
  const inputParams = ref<any>({
    symbol: null,
    networkCode: null,
    address: null,
    amount: null,
    password: null
  });

  // 账户余额

  /** 响应式状态：余额 */
  const AccountBalance = ref<any>({
    balance: 0
  });

  // 手续费配置

  /** 响应式状态：WithdrawFeeRules 相关 UI 或数据 */
  const WithdrawFeeRules = ref<any[]>([]);

  // 地址簿列表

  /** 响应式状态：列表数据 */
  const AddressBookList = ref<any[]>([]);

  // 当前金额的手续费配置

  /** 响应式状态：CurrentWithdrawFeeRule 相关 UI 或数据 */
  const CurrentWithdrawFeeRule = ref<any>({
    fee_val: 0,
    mode: 'fixed',
    amount: 0
  });

  // 扣除手续费后的实际提币金额

  /** 响应式状态：金额输入 */
  const ActualWithdrawAmount = ref<number>(0);

  /** 当前登录用户信息 */
  const UserInfo: any = computed(() => {
    return UserStore.getUserInfo;
  });

  /** 资产币种列表（提币可选币种） */
  const AssetCurrencyList = computed(() => {
    return UserStore.getAssetCurrencyList;
  });

  /** 网络与币种关系列表 */
  const NetworkCoinList = computed(() => {
    return SystemStore.getNetworkCoinList;
  });

  /** 公链 / 网络类型列表 */
  const NetworkTypeList = computed(() => {
    return SystemStore.getNetworkTypeList;
  });

  // 默认手续费配置（find 未命中时使用）

  /** 常量或静态配置：defaultFeeRule */
  const defaultFeeRule = { fee_val: 0, mode: 'fixed', amount: 0 };

  /** 将提现手续费规则按 amount 升序排列，便于按阈值匹配档位 */
  const getSortedFeeRules = () => {
    return [...WithdrawFeeRules.value].sort(
      (a: any, b: any) => Number(a.amount) - Number(b.amount)
    );
  };

  /** 地址簿下拉刷新：重置分页并拉取第一页 */
  const onRefresh = (): void => {
    AddressBookParams.value.pageNo = 1;
    finished.value = false;
    getAddressBookListData();
  };

  /** 地址簿列表触底加载下一页 */
  const onLoad = () => {
    loading.value = true;
    AddressBookParams.value.pageNo++;
    getAddressBookListData(true);
  };

  /** 请求地址簿分页数据并更新列表与加载状态 */
  const getAddressBookListData = (type: boolean = false) => {
    getAddressBookList(AddressBookParams.value).then((res) => {
      const { code, data } = res;
      if (Number(code) === 0 && data) {
        const {
          data: { list }
        } = res;
        if (list.length > 0) {
          // 如果是刷新
          if (!type) {
            AddressBookList.value = list;
          } else {
            // 加载更多
            AddressBookList.value = [...AddressBookList.value, ...list];
          }
        }

        // 如果返回的数据条数与分页的一致则允许加载更多
        if (list.length < AddressBookParams.value.pageSize) {
          finished.value = true;
        }

        // 延迟关闭
        setTimeout(() => {
          // 关闭刷新状态
          refreshing.value = false;

          // 关闭加载状态
          loading.value = false;
        }, 500);
      }
    });
  };

  /** 从地址簿选中一条并填入提币地址 */
  const SelectAddress = (item: any) => {
    inputParams.value.address = item.address;
    showAddressBookPopup.value = false;
  };

  /** 提币金额输入格式化：仅保留数字与小数点，小数最多 4 位 */
  const formatAmountMax4Decimals = (v: string) => {
    if (v === '' || v == null) return '';
    let s = String(v).replace(/[^\d.]/g, '');
    const parts = s.split('.');
    if (parts.length > 1) {
      s = parts[0] + '.' + parts.slice(1).join('').slice(0, 4);
    }
    return s;
  };

  /** 读取可用余额与单笔提现上限（缺省上限视为无限制） */
  const getWithdrawNumericCaps = (): { balance: number; withdrawMax: number } => {
    const balance = Number(AccountBalance.value.balance ?? 0);
    const wmRaw = AccountBalance.value.withdrawMax;
    const withdrawMax =
      wmRaw != null && String(wmRaw).trim() !== '' && Number.isFinite(Number(wmRaw))
        ? Number(wmRaw)
        : Number.POSITIVE_INFINITY;
    return { balance, withdrawMax };
  };

  /** 将输入金额收束在余额与 withdrawMax 之内：超出余额则压到余额，否则超出上限则压到 withdrawMax */
  const clampWithdrawNumber = (n: number): number => {
    if (!Number.isFinite(n)) return n;
    const { balance, withdrawMax } = getWithdrawNumericCaps();
    let capped = n;
    if (capped > balance) capped = balance;
    else if (capped > withdrawMax) capped = withdrawMax;
    return capped;
  };

  /** 提币金额变更：自动封顶、匹配手续费档位并计算实际到账金额 */
  const onChangeAmount = (value: any) => {
    let working = value;
    if (working != null && String(working).trim() !== '' && String(working) !== '.') {
      const num = Number(working);
      if (Number.isFinite(num)) {
        const capped = clampWithdrawNumber(num);
        if (capped !== num) {
          const next = formatAmountMax4Decimals(String(capped));
          inputParams.value.amount = next;
          working = next;
        }
      }
    }

    // 如果金额不为空，则根据金额获取手续费配置
    if (working) {
      const amount = Number(working);
      const sortedRules = getSortedFeeRules();
      if (sortedRules.length > 0) {
        // 规则：
        // 1) 小于最小 amount => 取最小 amount 对应配置
        // 2) 介于两个 amount 之间 => 取“上一个阈值”（即第一个 >= amount 的配置）
        // 3) 大于最大 amount => 取最大 amount 对应配置
        const found = sortedRules.find((item: any) => Number(item.amount) >= amount);
        CurrentWithdrawFeeRule.value = found ?? sortedRules[sortedRules.length - 1];
      } else {
        CurrentWithdrawFeeRule.value = defaultFeeRule;
      }
    } else {
      CurrentWithdrawFeeRule.value = defaultFeeRule;
    }

    // 根据手续费类型计算实际到账金额
    if (CurrentWithdrawFeeRule.value.mode === 'fixed') {
      // 固定手续费
      ActualWithdrawAmount.value = Number(working) - CurrentWithdrawFeeRule.value.fee_val;
    } else {
      // 百分比手续费
      ActualWithdrawAmount.value =
        Number(working) * (1 - CurrentWithdrawFeeRule.value.fee_val / 100);
    }
  };

  /** 拉取当前币种与网络的余额、上下限及手续费规则（防抖） */
  const getAccountBalanceAndFeeData = useDebounceFn(() => {
    getAccountBalanceAndFee({
      symbol: SelectedNetworkCoin.value.assetCode + '-' + SelectedNetworkType.value.networkCode,
      networkCode: SelectedNetworkType.value.networkCode
    }).then((res) => {
      const { code } = res;
      if (code === 0) {
        const { data } = res;
        if (data) {
          const { balanceList, withdrawMax, withdrawMin, withdrawFeeRules } = data;

          AccountBalance.value = {
            withdrawMin: withdrawMin,
            withdrawMax: withdrawMax,
            balance: 0
          };

          if (balanceList.length > 0) {
            AccountBalance.value = {
              ...balanceList[0],
              withdrawMin: withdrawMin,
              withdrawMax: withdrawMax
            };
          }

          if (withdrawFeeRules.length > 0) {
            WithdrawFeeRules.value = withdrawFeeRules;
          }

          // 公链切换后手续费规则变更，但用户输入的提现金额可能不变；
          // 需要立刻按新规则重新计算手续费与实际到账金额。
          onChangeAmount(inputParams.value.amount);
        }
      }
    });
  }, 500);

  /** 切换提币网络 / 公链并刷新余额与手续费 */
  const onSelectNetwork = (action: PopoverAction) => {
    SelectedNetworkType.value = action;
    inputParams.value.symbol = action.assetCode + '-' + action.networkCode;
    inputParams.value.networkCode = action.networkCode;
    showNetworkPopover.value = false;

    // 获取账户余额和手续费
    getAccountBalanceAndFeeData();
  };

  /** 切换提币资产币种，生成可提公链列表并默认选中首条 */
  const onSelectNetworkCoin = (action: PopoverAction) => {
    SelectedNetworkCoin.value = action;

    // 初始化默认币种后筛选网络公链
    RechargeNetworkList.value = NetworkCoinList.value
      .filter(
        (item: any) =>
          item.assetCode === SelectedNetworkCoin.value.assetCode && item.allowWithdraw === 1
      )
      .map((item: any) => {
        item.chainName = NetworkTypeList.value.find(
          (networkTypeItem: any) => networkTypeItem.chainTypeCode === item.chainTypeCode
        )?.chainName;
        item.text = item.chainName + '(' + item.networkCode + ')';
        return item;
      });

    showCurrencyPopover.value = false;

    // 设置默认选择的充值公链
    if (RechargeNetworkList.value.length > 0) {
      onSelectNetwork(RechargeNetworkList.value[0]);
    }
  };

  /** 资产币种列表就绪时默认选中第一项并联动公链 */
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

  /** 一键填入最大可提金额：min(可用余额, 单笔上限) */
  const SaveAll = () => {
    const { balance, withdrawMax } = getWithdrawNumericCaps();
    const maxAll = Math.min(balance, withdrawMax);
    if (!Number.isFinite(maxAll) || maxAll <= 0) {
      inputParams.value.amount = '';
      onChangeAmount('');
      return;
    }
    inputParams.value.amount = formatAmountMax4Decimals(String(maxAll));
    onChangeAmount(inputParams.value.amount);
  };

  /** 校验表单项并提交提币申请 */
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

    // 校验提现地址
    if (!inputParams.value.address) {
      CreateToast(t('str_withdraw_placeholder_address'));
      return;
    }

    const trimmedAddress = String(inputParams.value.address).trim();
    if (
      !isValidWithdrawAddress(trimmedAddress, {
        networkCode: SelectedNetworkType.value?.networkCode,
        chainTypeCode: SelectedNetworkType.value?.chainTypeCode,
        chainName: SelectedNetworkType.value?.chainName,
        text: SelectedNetworkType.value?.text
      })
    ) {
      CreateToast(t('str_withdraw_invalid_address_format'));
      return;
    }
    inputParams.value.address = trimmedAddress;

    // 校验提现数量
    if (!inputParams.value.amount) {
      CreateToast(t('str_withdraw_placeholder_amount'));
      return;
    }

    // 验证最大和最小提币数量
    if (
      Number(inputParams.value.amount) < AccountBalance.value.withdrawMin ||
      Number(inputParams.value.amount) > AccountBalance.value.withdrawMax
    ) {
      CreateToast(
        t('str_withdraw_amount_range', [
          AccountBalance.value.withdrawMin,
          AccountBalance.value.withdrawMax
        ])
      );
      return;
    }

    // 验证账户余额
    if (Number(inputParams.value.amount) > AccountBalance.value.balance) {
      CreateToast(t('str_withdraw_exceed_balance'));
      return;
    }

    // 校验交易密码
    if (!inputParams.value.password) {
      CreateToast(t('str_set_trade_password_placeholder'));
      return;
    }

    // 加载状态
    isLoading.value = true;

    // 提交提现
    submitWithdraw(inputParams.value)
      .then((res) => {
        const { code, msg } = res;
        if (code === 0) {
          CreateToast(t('str_withdraw_success'));
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

  /** 进入页面前拉取资产币种并刷新地址簿 */
  onBeforeMount((): void => {
    UserStore.fetchAssetCurrencyList();
    onRefresh();
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
