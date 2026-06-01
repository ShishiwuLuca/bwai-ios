<template>
  <NavBar
    :title="route.query.type === 'add' ? t('add_address_title') : t('edit_address_title')"
    fixed
    placeholder
    :border="false"
  >
    <template #right>
      <Icon
        v-if="route.query.type === 'edit'"
        name="delete-o"
        :size="22"
        color="var(--van-text-color)"
        @click="onDelete"
      />
    </template>
  </NavBar>
  <PageWrap>
    <div class="flex flex-col gap-[0.32rem] p-[0.32rem]">
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
              class="!bg-transparent !rounded-sm !pl-0.5 !pr-0"
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
        <label class="text-[0.28rem] text-white">{{ t('add_address_network') }}</label>
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
              class="!bg-transparent !rounded-sm !pl-0.5 !pr-0"
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
        <label class="text-[0.28rem] text-white">{{ t('add_address_wallet_address') }}</label>
        <Field
          clickable
          center
          clearable
          size="large"
          class="!rounded-sm"
          v-model="inputParams.address"
          :placeholder="t('add_address_placeholder_address')"
          :border="false"
          autocomplete="off"
        />
      </div>
      <div class="flex flex-col gap-[0.16rem]">
        <label class="text-[0.28rem] text-white">{{ t('add_address_wallet_name') }}</label>
        <Field
          clickable
          center
          clearable
          size="large"
          v-model="inputParams.label"
          :placeholder="t('add_address_placeholder_name')"
          type="text"
          autocomplete="off"
          class="add-address-field !rounded-sm"
        />
      </div>
    </div>
    <div class="fixed bottom-0 left-0 right-0 p-1 bg-[var(--van-background)]">
      <Button v-if="isLoading" :loading="isLoading" type="primary" block round />
      <Button v-else type="primary" block round @click="onSubmit">
        {{ t('add_address_save') }}
      </Button>
    </div>
  </PageWrap>
</template>

<script setup lang="ts">
  import { useI18n } from 'vue-i18n';
  import type { PopoverAction } from 'vant';
  import { useRoute, useRouter } from 'vue-router';
  import { NavBar, PageWrap } from '/@/components';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { computed, ref, watch, onBeforeMount } from 'vue';
  import { isValidWithdrawAddress } from '/@/utils/walletAddress';
  import { Cell, Button, Popover, Field, Icon, Radio } from 'vant';
  import { useUserStoreWithOut } from '/@/stores/modules/UserConfig';
  import { useSystemStoreWithOut } from '/@/stores/modules/SystemConfig';
  import { addAddress, updateAddress, deleteAddress } from '/@/service/Wallet';

  /** 从 useI18n 解构的文案与能力 */
  const { t } = useI18n();

  /** 当前路由：读取 query、params、meta 等 */
  const route = useRoute();

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

  // 加载状态

  /** 响应式状态：加载中状态 */
  const isLoading = ref<boolean>(false);

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
    label: null
  });

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

  // 需要编辑的地址数据

  /** 计算属性：由其它状态派生的展示或判断 */
  const EditAddress = computed(() => {
    return UserStore.getEditAddress;
  });

  // 监听需要编辑的地址数据

  /** 侦听依赖变化并触发副作用 */
  watch(
    EditAddress,
    (newVal: any) => {
      const { type } = route.query;
      if (newVal && type === 'edit') {
        inputParams.value.symbol = newVal.symbol;
        inputParams.value.networkCode = newVal.networkCode;
        inputParams.value.address = newVal.address;
        inputParams.value.label = newVal.label;
      }
    },
    { immediate: true, deep: true }
  );

  /** 事件或回调处理：onSelectNetwork */
  const onSelectNetwork = (action: PopoverAction) => {
    SelectedNetworkType.value = action;
    inputParams.value.symbol = action.assetCode + '-' + action.networkCode;
    inputParams.value.networkCode = action.networkCode;
    showNetworkPopover.value = false;
  };

  /** 事件或回调处理：onSelectNetworkCoin */
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

  /**
   * 提交
   */
  const onSubmit = () => {
    // 校验地址
    if (!inputParams.value.address) {
      CreateToast(t('add_address_placeholder_address'));
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

    // 校验名称
    if (!inputParams.value.label) {
      CreateToast(t('add_address_placeholder_name'));
      return;
    }

    // 加载状态
    isLoading.value = true;

    const { type } = route.query;

    // 如果是新增
    if (type === 'add') {
      onAddAddress();
    } else {
      onUpdateAddress();
    }
  };

  // 新增

  /** 事件或回调处理：onAddAddress */
  const onAddAddress = () => {
    addAddress(inputParams.value)
      .then((res) => {
        const { code, msg } = res;
        if (code === 0) {
          CreateToast(t('add_address_success'));
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

  // 修改

  /** 事件或回调处理：onUpdateAddress */
  const onUpdateAddress = () => {
    inputParams.value.id = EditAddress.value.id;
    updateAddress(inputParams.value)
      .then((res) => {
        const { code, msg } = res;
        if (code === 0) {
          CreateToast(t('confirm_password_button_success'));
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

  // 删除地址

  /** 事件或回调处理：onDelete */
  const onDelete = () => {
    CreateConfirmDialog({
      title: t('common_title_text'),
      message: t('address_book_delete_message'),
      confirmButtonText: t('address_book_delete_confirm'),
      cancelButtonText: t('address_book_delete_cancel')
    }).then(() => {
      // 删除地址
      deleteAddress({ id: EditAddress.value.id }).then((res) => {
        const { code, msg } = res;
        if (code === 0) {
          CreateToast(t('address_book_delete_success'));
          setTimeout(() => {
            router.back();
          }, 1000);
        } else {
          CreateToast(msg);
        }
      });
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
