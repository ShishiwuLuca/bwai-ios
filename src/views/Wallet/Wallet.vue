<template>
  <div class="wallet-page">
  <NavBar :title="t('my_wallet_title')" fixed placeholder :border="false">
    <!-- <template #right>
      <div class="" @click="$router.push('/Wallet/TransactionHistory')">
        <Icon name="records-o" :size="22" color="#000000" />
      </div>
    </template> -->
  </NavBar>
  <PageWrap class="p-1">
    <div class="p-1 overflow-hidden wallet-page__card">
      <div class="flex items-center text-[0.25rem]">
        <div class="mr-0.5 rtl:mr-0 rtl:ml-0.5 text-[#fff]">{{
          t('str_total_assets_equivalent', ['USDT'])
          }}</div>
        <Icon color="#fff" v-if="!ShowUserBalance" @click="ShowUserBalance = true" name="eye-o" :size="20" />
        <Icon color="#fff" v-else @click="ShowUserBalance = false" name="closed-eye" :size="20" />
      </div>
      <div class="text-[0.45rem] font-bold mt-0.5">
        <div v-if="!ShowUserBalance">
          <CountTo class="text-[#ffffff]" :startVal="0"
            :endVal="UserBalance.totalAmount ? parseFloat(UserBalance.totalAmount) : 0.0" :decimals="4" />
          <span class="text-[0.25rem] text-[#E6E6E6]">
            ≈
            <CountTo prefix="$" :startVal="0" :endVal="parseFloat(UserBalance.totalAmount)" :decimals="2"
              class="mr-0.5 rtl:mr-0 rtl:ml-0.5 text-[#E6E6E6]" />
          </span>
        </div>
        <span class="text-[#fff]" v-else>****</span>
        <div class="text-[0.25rem] text-[#E6E6E6]">{{ t('str_available_balance') }}: <span v-if="!ShowUserBalance">{{ UserBalance.totalBalance }}</span><span v-else>****</span></div>
        <div class="text-[0.25rem] text-[#E6E6E6]">{{ t('str_investing') }}: <span v-if="!ShowUserBalance">{{ UserBalance.totalInvest }}</span><span v-else>****</span></div>
        <div class="text-[0.25rem] text-[#E6E6E6]">{{ t('str_frozen') }}: <span v-if="!ShowUserBalance">{{ UserBalance.ff }}</span><span v-else>****</span></div>
      </div>
    </div>
    <div class="flex items-center gap-2 justify-around mt-2">
      <div v-for="(item, index) in List" :key="index" class="text-center text-[#333]" @click="$router.push(item.path)">
        <div class="rounded-full w-[1.1rem] h-[1.1rem] mx-auto flex items-center justify-center mb-0.5"
          :style="{ background: '#ffff' }">
          <Icon :name="item.icon" :size="35" color="#2F6AEC" />
        </div>
        <div>{{ item.title }}</div>
      </div>
    </div>
    <div class="mt-2">
      <div class="text-[0.3rem] text-[#000] font-semibold mb-1">{{ t('str_my_account') }}</div>
      <Cell clickable center size="large" class="wallet-page__account-cell rounded-sm !p-0.5 mb-1" :border="false"
        v-for="item in MyAccount" :key="item.title" :title="item.title"
        title-class="!text-[#000] !font-medium"
        is-link @click="$router.push({ name: 'Account', query: { title: item.title, type: item.accountType } })">
        <template #icon>
          <Icon :name="item.icon" :size="50" />
        </template>
        <template #label>
          <CountTo class="text-[#000] font-medium" :startVal="0" :endVal="item.value ? parseFloat(item.value) : 0.0" :decimals="4" />
          <span class="text-[#8c8c8c]">
            ≈
            <CountTo prefix="$" :startVal="0" :endVal="parseFloat(item.value * (FiatExchangeRate['USD'] ?? 0))"
              :decimals="2" class="mr-0.5 rtl:mr-0 rtl:ml-0.5" />
          </span>
        </template>
      </Cell>
    </div>
  </PageWrap>
  </div>
</template>

<script setup lang="ts">
import { Icon, Cell } from 'vant';
import { useI18n } from 'vue-i18n';
import { ref, onBeforeMount, computed } from 'vue';
import { getMyWalletInfo } from '/@/service/Wallet';
import { NavBar, PageWrap, CountTo } from '/@/components';
import RechargeIcon from '/@/assets/images/desipt.png';
import WithdrawIcon from '/@/assets/images/tixian.png';
import TransferIcon from '/@/assets/images/duihuan.png';
import { useUserStoreWithOut } from '/@/stores/modules/UserConfig';
import { useSystemStoreWithOut } from '/@/stores/modules/SystemConfig';

/** 从 useI18n 解构的文案与能力 */
const { t } = useI18n();

/** 用户：UserStore */
const UserStore = useUserStoreWithOut();

/** SystemStore */
const SystemStore = useSystemStoreWithOut();

// 是否显示总资产

/** 响应式状态：显隐控制 */
const ShowUserBalance = ref<boolean>(false);

// 用户总资产

/** 响应式状态：余额 */
const UserBalance = ref<any>({
  totalBalance: 0
});

// 列表

/** 响应式状态：列表数据 */
const List = ref<any[]>([
  {
    title: t('str_recharge'),
    icon: RechargeIcon,
    path: '/Wallet/Recharge'
  },
  {
    title: t('str_withdraw'),
    icon: WithdrawIcon,
    path: '/Wallet/Withdraw'
  },
  {
    title: t('str_transfer'),
    icon: TransferIcon,
    path: '/Wallet/Transfer'
  },
  {
    title: t('str_transfer_st'),
    icon: 'sort',
    path: '/Wallet/TransferST'
  }
]);

// 我的账户列表

/** 响应式状态：MyAccount 相关 UI 或数据 */
const MyAccount = ref<any[]>([]);

// 获取法币汇率

/** 计算属性：由其它状态派生的展示或判断 */
const FiatExchangeRate = computed(() => {
  return SystemStore.getFiatExchangeRate;
});

// 获取账户图标

/** getAccountIcon */
const getAccountIcon = (accountType: string) => {
  return new URL(`../../assets/images/${accountType}.png`, import.meta.url).href;
};

// 获取我的钱包信息

/** 拉取接口数据：fetchMyWalletInfo */
const fetchMyWalletInfo = () => {
  getMyWalletInfo({}).then((res) => {
    const { code } = res;
    if (code === 0) {
      const { data } = res;
      if (data) {
        const { balanceList } = data;
        if (balanceList.length > 0) {
          MyAccount.value = balanceList.map((item: any) => {
            return {
              title: t('str_my_account_value', [item.accountType]),
              value: item.balance,
              accountType: item.accountType,
              symbol: item.symbol,
              icon: getAccountIcon(item.accountType)
            };
          });
        }

        delete data.balanceList;

        UserBalance.value = data;
      }
    }
  });
};

// 初始化
onBeforeMount((): void => {
  UserStore.fetchAssetCurrencyList();
  fetchMyWalletInfo();
});
</script>

<style lang="less" scoped>
  .wallet-page {
    background: #f2f5fe;
    min-height: 100vh;

    :deep(.van-nav-bar) {
      background: transparent !important;
    }

    :deep(.van-nav-bar__title) {
      font-size: 16px;
      font-weight: 600;
      color: #000000;
    }

    :deep(.van-nav-bar .van-icon) {
      color: #000000 !important;
    }

    :deep(.page-wrap) {
      background: transparent;
    }
  }

  .wallet-page__card {
    background: #2F6AEC;
    border-radius: 20px;
    box-shadow: 0px 6px 10px 0px rgba(87, 119, 251, 0.25);
  }

  .wallet-page__account-cell {
    background: #f9faff !important;
    box-shadow: 0 0 2px rgba(87, 119, 251, 0.25);
    border: none !important;
  }

  :deep(.van-grid-item__content) {
    background: transparent !important;
  }
</style>
