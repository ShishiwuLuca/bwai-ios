<template>
  <NavBar :title="t('my_wallet_title')" fixed placeholder :border="false" />
  <PageWrap class="p-1">
    <div class="p-1 rounded-sm overflow-hidden card">
      <div class="flex items-center text-[0.25rem]">
        <div class="mr-0.5 rtl:mr-0 rtl:ml-0.5 text-color">{{
          t('str_total_assets_equivalent', ['USDT'])
        }}</div>
        <Icon
          color="var(--van-primary-color)"
          v-if="!ShowUserBalance"
          @click="ShowUserBalance = true"
          name="eye-o"
          :size="20"
        />
        <Icon
          color="var(--van-primary-color)"
          v-else
          @click="ShowUserBalance = false"
          name="closed-eye"
          :size="20"
        />
      </div>
      <div class="text-[0.45rem] font-bold mt-0.5">
        <div v-if="!ShowUserBalance">
          <CountTo
            class="text-[var(--van-tab-active-text-color)]"
            :startVal="0"
            :endVal="UserBalance.totalAmount ? parseFloat(UserBalance.totalAmount) : 0.0"
            :decimals="4"
          />
          <span class="text-[0.25rem] text-[#aaa]">
            ≈
            <CountTo
              prefix="$"
              :startVal="0"
              :endVal="parseFloat(UserBalance.totalAmount)"
              :decimals="2"
              class="mr-0.5 rtl:mr-0 rtl:ml-0.5"
            />
          </span>
        </div>
        <span class="text-color" v-else>****</span>
        <div class="text-[0.25rem]"
          >{{ t('str_available_balance') }}: {{ UserBalance.totalBalance }}</div
        >
        <div class="text-[0.25rem]">{{ t('str_investing') }}: {{ UserBalance.totalInvest }}</div>
        <div class="text-[0.25rem]">{{ t('str_frozen') }}: {{ UserBalance.ff }}</div>
      </div>
    </div>
    <div class="flex items-center gap-2 justify-around mt-2">
      <div
        v-for="(item, index) in List"
        :key="index"
        class="text-center"
        @click="$router.push(item.path)"
      >
        <div
          class="rounded-full w-[1.1rem] h-[1.1rem] mx-auto flex items-center justify-center mb-0.5"
          :style="{
            background: 'var(--van-gradient-background)',
            border: '1px solid var(--van-border-color)'
          }"
        >
          <Icon :name="item.icon" :size="30" color="var(--van-text-color)" />
        </div>
        <div>{{ item.title }}</div>
      </div>
    </div>
    <div class="mt-2">
      <div class="text-[0.3rem] mb-1">{{ t('str_my_account') }}</div>
      <Cell
        clickable
        center
        size="large"
        class="rounded-sm !p-0.5 mb-1"
        :border="false"
        v-for="item in MyAccount"
        :key="item.title"
        :title="item.title"
        is-link
        @click="
          $router.push({ name: 'Account', query: { title: item.title, type: item.accountType } })
        "
      >
        <template #icon>
          <Icon :name="item.icon" :size="50" />
        </template>
        <template #label>
          <CountTo
            class="text-color"
            :startVal="0"
            :endVal="item.value ? parseFloat(item.value) : 0.0"
            :decimals="4"
          />
          ≈
          <CountTo
            prefix="$"
            :startVal="0"
            :endVal="parseFloat(item.value * (FiatExchangeRate['USD'] ?? 0))"
            :decimals="2"
            class="mr-0.5 rtl:mr-0 rtl:ml-0.5"
          />
        </template>
      </Cell>
    </div>
  </PageWrap>
</template>

<script setup lang="ts">
  import { Icon, Cell } from 'vant';
  import { useI18n } from 'vue-i18n';
  import { ref, onBeforeMount, computed } from 'vue';
  import { getMyWalletInfo } from '/@/service/Wallet';
  import { NavBar, PageWrap, CountTo } from '/@/components';
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
      icon: 'peer-pay',
      path: '/Wallet/Recharge'
    },
    {
      title: t('str_withdraw'),
      icon: 'back-top',
      path: '/Wallet/Withdraw'
    },
    {
      title: t('str_transfer'),
      icon: 'exchange',
      path: '/Wallet/Transfer'
    },
    {
      title: t('str_flow'),
      icon: 'records-o',
      path: '/Wallet/TransactionHistory'
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
    return new URL(`/src/assets/images/${accountType}.png`, import.meta.url).href;
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
  :deep(.van-grid-item__content) {
    background: transparent !important;
  }

  :deep(.van-cell) {
    background: var(--van-card-linear-background) !important;
    border: 1px solid var(--van-border-color) !important;
  }
</style>
