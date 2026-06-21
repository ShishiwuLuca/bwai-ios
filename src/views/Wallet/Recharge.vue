<template>
  <div class="recharge-page">
  <NavBar :title="t('str_recharge')" fixed placeholder :border="false" />
  <PageWrap>
    <div class="flex flex-col gap-[0.32rem] p-[0.32rem]">
      <div class="flex flex-col gap-[0.16rem]">
        <label class="text-[0.28rem] text-[#000] font-medium">{{ t('str_recharge_currency') }}</label>
        <Popover v-model:show="showCurrencyPopover" :offset="[0, 8]" placement="bottom">
          <template #reference>
            <Cell
              clickable
              center
              size="large"
              :border="false"
              is-link
              :title="SelectedNetworkCoin.assetCode"
              class="recharge-page__cell !rounded-sm"
              title-class="!text-[#000] !font-medium"
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
            class="w-28 max-h-17 !bg-white overflow-auto p-0.5 border-1 border-solid border-[#e0e1fd] rounded-sm"
          >
            <Cell
              v-for="item in AssetCurrencyList"
              :key="item.text"
              clickable
              center
              size="large"
              :border="true"
              :title="item.assetCode"
              title-class="!text-[#000]"
              class="!bg-white !pl-0.5 !pr-0"
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
                  :icon-size="16"
                  checked-color="#2071f8"
                  :checked="SelectedNetworkType.assetCode === item.assetCode"
                  :name="item.assetCode"
                />
              </template>
            </Cell>
          </div>
        </Popover>
      </div>
      <div class="flex flex-col gap-[0.16rem]">
        <label class="text-[0.28rem] text-[#000] font-medium">{{ t('str_recharge_chain') }}</label>
        <Popover v-model:show="showNetworkPopover" :offset="[0, 8]" placement="bottom">
          <template #reference>
            <Cell
              clickable
              center
              size="large"
              :border="false"
              is-link
              :title="SelectedNetworkType.text"
              class="recharge-page__cell !rounded-sm"
              title-class="!text-[#000] !font-medium"
            />
          </template>
          <div
            class="w-28 max-h-17 !bg-white overflow-auto p-0.5 border-1 border-solid border-[#e0e1fd] rounded-sm"
          >
            <Cell
              v-for="item in RechargeNetworkList"
              :key="item.text"
              clickable
              center
              size="large"
              :border="true"
              :title="item.text"
              title-class="!text-[#000]"
              class="recharge-page__option !pl-0.5 !pr-0"
              @click="onSelectNetwork(item)"
            >
              <template #right-icon>
                <Icon
                  v-if="SelectedNetworkType.chainTypeCode === item.chainTypeCode"
                  name="success"
                  class="recharge-page__option-check"
                />
              </template>
            </Cell>
          </div>
        </Popover>
      </div>
      <div class="flex flex-col gap-[0.16rem]">
        <label class="text-[0.28rem] text-[#000] font-medium">{{ t('add_address_wallet_address') }}</label>
        <div
          class="flex items-center gap-0.5 bg-[#f9faff] rounded-sm overflow-hidden p-1"
          style="box-shadow: 0 0 2px rgba(87,119,251,0.25);"
        >
          <QrcodeVue
            class="rounded-sm"
            :value="RechargeAddress"
            :margin="2"
            :size="100"
            level="L"
          />
          <div>
            <div class="flex items-center gap-1">
              <div class="max-w-16 whitespace-pre-wrap break-all text-[#000] text-[0.26rem]">{{ RechargeAddress }}</div>
              <div @click="CopyText(RechargeAddress)">
                <Icon
                  class-prefix="exchange-icon"
                  name="copy"
                  :size="22"
                  color="var(--van-primary-color)"
                />
              </div>
            </div>
            <div class="text-[0.24rem] text-[#8c8c8c] mt-1">{{
              t('str_recharge_tips_value_1', [MinDepositAmount])
            }}</div>
          </div>
        </div>
        <div class="bg-[#f9faff] rounded-sm overflow-hidden p-1" style="box-shadow: 0 0 2px rgba(87,119,251,0.25);">
          <label class="text-[0.28rem] text-[#000] font-medium">{{ t('str_recharge_tips') }}</label>
          <div class="text-[0.24rem] text-[#8c8c8c]">
            <div>{{ t('str_recharge_tips_value') }}</div>
            <div class="mt-1">{{ t('str_recharge_tips_value_2') }}</div>
          </div>
        </div>
      </div>
    </div>
    <!-- <div class="fixed bottom-0 left-0 right-0 p-1">
      <Button type="primary" block round @click="onSubmit">
        {{ t('str_recharge_confirm') }}
      </Button>
    </div> -->
  </PageWrap>
  </div>
</template>

<script setup lang="ts">
  import { useI18n } from 'vue-i18n';
  import QrcodeVue from 'qrcode.vue';
  import type { PopoverAction } from 'vant';
  import { useDebounceFn } from '@vueuse/core';
  import { useCopyToClipboard } from '/@/utils';
  import { NavBar, PageWrap } from '/@/components';
  import { Cell, Popover, Icon, Radio } from 'vant';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { getRechargeAddress } from '/@/service/Wallet';
  import { computed, onBeforeMount, ref, watch } from 'vue';
  import { useUserStoreWithOut } from '/@/stores/modules/UserConfig';
  import { useSystemStoreWithOut } from '/@/stores/modules/SystemConfig';

  /** 从 useI18n 解构的文案与能力 */
  const { t } = useI18n();

  /** 用户：UserStore */
  const UserStore = useUserStoreWithOut();

  /** SystemStore */
  const SystemStore = useSystemStoreWithOut();

  /** 从 useMessage 解构的 Toast / Dialog 能力 */
  const { CreateToast } = useMessage();

  // 是否显示网络选择弹窗

  /** 响应式状态：显隐控制 */
  const showNetworkPopover = ref(false);

  // 是否显示币种选择弹窗

  /** 响应式状态：显隐控制 */
  const showCurrencyPopover = ref(false);

  // 最小充值金额

  /** 响应式状态：金额输入 */
  const MinDepositAmount = ref<number>(0.000001);

  // 获取资产币种

  /** 计算属性：列表数据 */
  const AssetCurrencyList = computed(() => {
    return UserStore.getAssetCurrencyList;
  });

  // 获取网络币种

  /** 计算属性：列表数据 */
  const NetworkCoinList = computed(() => {
    return SystemStore.getNetworkCoinList;
  });

  // 获取网络类型列表

  /** 计算属性：列表数据 */
  const NetworkTypeList = computed(() => {
    return SystemStore.getNetworkTypeList;
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

  // 充值地址

  /** 响应式状态：RechargeAddress 相关 UI 或数据 */
  const RechargeAddress = ref<string>('');

  // 复制文字

  /** CopyText */
  const CopyText = (text: string) => {
    useCopyToClipboard(text);
    CreateToast(t('copy_success'));
  };

  // 获取充值地址

  /** getRechargeAddressData */
  const getRechargeAddressData = useDebounceFn(() => {
    getRechargeAddress({
      assetCode: SelectedNetworkCoin.value.assetCode,
      networkCode: SelectedNetworkType.value.networkCode
    }).then((res) => {
      const { code, msg } = res;
      if (code === 0) {
        const { address, minDepositAmount } = res.data;
        RechargeAddress.value = address;

        // 设置最小充值金额
        MinDepositAmount.value = minDepositAmount || 0.000001;
      } else {
        CreateToast(msg);
      }
    });
  }, 500);

  /** 事件或回调处理：onSelectNetwork */
  const onSelectNetwork = (action: PopoverAction) => {
    SelectedNetworkType.value = action;
    showNetworkPopover.value = false;

    // 获取充值地址
    getRechargeAddressData();
  };

  /** 事件或回调处理：onSelectNetworkCoin */
  const onSelectNetworkCoin = (action: PopoverAction) => {
    SelectedNetworkCoin.value = action;

    // 初始化默认币种后筛选网络公链
    RechargeNetworkList.value = NetworkCoinList.value
      .filter(
        (item: any) =>
          item.assetCode === SelectedNetworkCoin.value.assetCode && item.allowDeposit === 1
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

  // 初始化
  onBeforeMount((): void => {
    UserStore.fetchAssetCurrencyList();
  });
</script>

<style lang="less" scoped>
  .recharge-page {
    background: #f2f5fe;
    min-height: 100vh;

    :deep(.van-nav-bar) { background: transparent !important; }
    :deep(.van-nav-bar__title) { font-size: 16px; font-weight: 600; color: #000; }
    :deep(.van-nav-bar .van-icon) { color: #000 !important; }
    :deep(.nav-back-button .van-icon) { color: #000 !important; }
    :deep(.page-wrap) { background: transparent; }
  }

  .recharge-page__cell {
    background: #f9faff !important;
    box-shadow: 0 0 2px rgba(87, 119, 251, 0.25);
  }

  .recharge-page__option {
    background: #fff !important;
  }

  .recharge-page__option-check {
    font-size: 0.36rem;
    color: #2071f8;
  }

  :deep(.van-popover__wrapper) {
    width: 100%;
  }

  :deep(.van-popover__content) {
    background: transparent;
    box-shadow: 0 2px 8px rgba(87, 119, 251, 0.15);
  }

  :deep(.van-radio__icon--checked) {
    border-color: #2071f8 !important;
  }

  :deep(.van-radio__icon--dot__icon) {
    background: #2071f8 !important;
  }
</style>
