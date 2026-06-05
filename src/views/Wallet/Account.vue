<template>
  <NavBar :title="$route.query.title" />
  <PageWrap class="p-1">
    <div class="p-1 rounded-sm overflow-hidden card">
      <Row align="center">
        <Col class="text-center mt-1" span="12">
          <div class="text-[0.25rem]"> {{ t('str_available_balance') }}(USDT) </div>
          <div class="text-[0.45rem]">
            <CountTo
              class="text-[var(--van-tab-active-text-color)]"
              :startVal="0"
              :endVal="UserBalance.balance ? parseFloat(UserBalance.balance) : 0.0"
              :decimals="4"
            />
          </div>
        </Col>
        <Col class="text-center mt-1" span="12">
          <div class="text-[0.25rem]"> {{ t('str_investing') }}(USDT) </div>
          <div class="text-[0.45rem]">
            <CountTo
              class="text-[var(--van-tab-active-text-color)]"
              :startVal="0"
              :endVal="UserBalance.ff ? parseFloat(UserBalance.ff) : 0.0"
              :decimals="4"
            />
          </div>
        </Col>
      </Row>
      <div class="flex items-center justify-center gap-1 mt-2">
        <Button class="w-10" type="primary" round to="/Wallet/Recharge">{{
          t('str_recharge')
        }}</Button>
        <Button class="w-10" type="primary" round to="/Wallet/Withdraw">{{
          t('str_withdraw')
        }}</Button>
        <Button
          class="w-10"
          type="primary"
          round
          @click="
            $router.push({
              name: 'TransactionHistory',
              query: { title: route.query.title, type: route.query.type }
            })
          "
          >{{ t('str_flow') }}</Button
        >
      </div>
    </div>
    <div class="mt-2">
      <div class="text-[0.3rem] mb-1">{{ t('str_token') }}</div>
      <Cell
        clickable
        center
        size="large"
        class="rounded-sm !p-0.5 mb-1"
        :border="false"
        title="USDT"
        value-class="!mt-0"
        is-link
        @click="
          $router.push({
            name: 'TransactionHistory',
            query: { title: 'USDT', type: route.query.type }
          })
        "
      >
        <template #icon>
          <Icon :name="USDT" :size="50" class="mr-0.5" />
        </template>
        <template #label>
          <CountTo class="text-color" :startVal="0" :endVal="listDisplayBalance" :decimals="4" />
          ≈
          <CountTo
            prefix="$"
            :startVal="0"
            :endVal="listDisplayFiat"
            :decimals="2"
            class="mr-0.5 rtl:mr-0 rtl:ml-0.5"
          />
        </template>
      </Cell>
    </div>
  </PageWrap>
</template>

<script setup lang="ts">
  import { useI18n } from 'vue-i18n';
  import { useRoute } from 'vue-router';
  import USDT from '/@/assets/images/USDT.png';
  import { NavBar, PageWrap } from '/@/components';
  import { ref, onBeforeMount, computed } from 'vue';
  import { getMyWalletInfo } from '/@/service/Wallet';
  import { Row, Col, Button, Cell, Icon } from 'vant';
  import { useUserStoreWithOut } from '/@/stores/modules/UserConfig';
  import { useSystemStoreWithOut } from '/@/stores/modules/SystemConfig';

  /** 从 useI18n 解构的文案与能力 */
  const { t } = useI18n();

  /** 当前路由：读取 query、params、meta 等 */
  const route = useRoute();

  /** 用户：UserStore */
  const UserStore = useUserStoreWithOut();

  /** SystemStore */
  const SystemStore = useSystemStoreWithOut();

  // 用户总资产（可用余额用 ai_fa/lp_fa 等；USDT 行用 balanceList 项的 balance）

  /** 响应式状态：余额 */
  const UserBalance = ref<any>({
    balance: 0,
    listBalance: 0
  });

  // 获取法币汇率

  /** 计算属性：由其它状态派生的展示或判断 */
  const FiatExchangeRate = computed(() => {
    return SystemStore.getFiatExchangeRate;
  });

  // USDT 行：用 balanceList[].balance（与 data.ai_fa/lp_fa 分开）

  /** 计算属性：余额 */
  const listDisplayBalance = computed((): number => {
    const v = UserBalance.value?.listBalance ?? UserBalance.value?.balance;
    return v != null && v !== '' ? parseFloat(String(v)) : 0;
  });

  /** 计算属性：由其它状态派生的展示或判断 */
  const listDisplayFiat = computed((): number => {
    return listDisplayBalance.value * (FiatExchangeRate.value['USD'] ?? 0);
  });

  // 获取我的钱包信息

  /** 拉取接口数据：fetchMyWalletInfo */
  const fetchMyWalletInfo = () => {
    const { type } = route.query;
    getMyWalletInfo({}).then((res) => {
      const { code } = res;
      if (code === 0) {
        const { data } = res;
        if (data) {
          const { balanceList, lp_if, ai_if, ff, lp_fa, ai_fa } = data as any;
          if (balanceList?.length > 0) {
            const row = balanceList.find((item: any) => item.accountType === route.query.type);
            if (!row) return;
            UserBalance.value = { ...row, listBalance: row.balance };

            // 可用余额与钱包页一致：用 data 上 ai_fa / lp_fa
            const accountType = String(type || '').toUpperCase();
            if (accountType === 'AI') UserBalance.value.balance = ai_fa;
            else if (accountType === 'LP') UserBalance.value.balance = lp_fa;

            if (type === 'LP') UserBalance.value.ff = lp_if;
            else if (type === 'AI') UserBalance.value.ff = ai_if;
            else UserBalance.value.ff = ff;
          }
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

<style lang="less" scoped></style>
