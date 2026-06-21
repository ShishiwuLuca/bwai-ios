<template>
  <div class="account-page">
    <NavBar :title="$route.query.title" />
    <PageWrap class="p-1">
      <div class="account-page__card">
        <div class="account-page__balance-grid">
          <div class="account-page__balance-item">
            <div class="account-page__balance-label">{{ t('str_available_balance') }}(USDT)</div>
            <CountTo
              class="account-page__balance-value"
              :start-val="0"
              :end-val="parseBalance(UserBalance.balance)"
              :decimals="4"
            />
          </div>
          <div class="account-page__balance-item account-page__balance-item--right">
            <div class="account-page__balance-label">{{ t('str_investing') }}(USDT)</div>
            <CountTo
              class="account-page__balance-value"
              :start-val="0"
              :end-val="parseBalance(UserBalance.ff)"
              :decimals="4"
            />
          </div>
        </div>

        <button type="button" class="account-page__toggle" @click="actionsExpanded = !actionsExpanded">
          <Icon :name="actionsExpanded ? 'arrow-up' : 'arrow-down'" class="account-page__toggle-icon" />
        </button>

        <div v-show="actionsExpanded" class="account-page__actions">
          <button
            v-if="route.query.type === 'AI'"
            type="button"
            class="account-page__action-btn account-page__action-btn--primary"
            @click="$router.push('/Wallet/Recharge')"
          >
            {{ t('str_recharge') }}
          </button>
          <button
            v-if="route.query.type === 'LP'"
            type="button"
            class="account-page__action-btn account-page__action-btn--primary"
            @click="$router.push('/Wallet/Withdraw')"
          >
            {{ t('str_withdraw') }}
          </button>
            <button
            v-if="route.query.type === 'LP'"
            type="button"
            class="account-page__action-btn account-page__action-btn--primary"
            @click="$router.push('/Wallet/Transfer')"
          >
            {{ t('str_transfer') }}
          </button>
          <button
            type="button"
            class="account-page__action-btn account-page__action-btn--primary"
            @click="
              $router.push({ name: 'TransferST', query: { from: String(route.query.type || '') } })
            "
          >
            {{ t('str_transfer_st') }}
          </button>
          <button
            type="button"
            class="account-page__action-btn account-page__action-btn--ghost"
            @click="
              $router.push({
                name: 'TransactionHistory',
                query: { title: route.query.title, type: route.query.type }
              })
            "
          >
            {{ t('str_flow') }}
          </button>
        </div>
      </div>

      <div class="mt-2">
        <div class="text-[0.3rem] text-[#000] font-semibold mb-1">{{ t('str_token') }}</div>
        <Cell
          clickable
          center
          size="large"
          class="account-page__cell rounded-sm !p-0.5 mb-1"
          :border="false"
          title="USDT"
          title-class="!text-[#000] !font-medium"
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
            <CountTo class="text-[#2071f8]" :start-val="0" :end-val="listDisplayBalance" :decimals="4" />
            ≈
            <CountTo
              prefix="$"
              :start-val="0"
              :end-val="listDisplayFiat"
              :decimals="2"
              class="mr-0.5 rtl:mr-0 rtl:ml-0.5"
            />
          </template>
        </Cell>
      </div>
    </PageWrap>
  </div>
</template>

<script setup lang="ts">
  import { useI18n } from 'vue-i18n';
  import { useRoute } from 'vue-router';
  import USDT from '/@/assets/images/USDT.png';
  import { NavBar, PageWrap, CountTo } from '/@/components';
  import { ref, onBeforeMount, computed } from 'vue';
  import { getMyWalletInfo } from '/@/service/Wallet';
  import { Cell, Icon } from 'vant';
  import { useUserStoreWithOut } from '/@/stores/modules/UserConfig';
  import { useSystemStoreWithOut } from '/@/stores/modules/SystemConfig';

  const { t } = useI18n();
  const route = useRoute();
  const UserStore = useUserStoreWithOut();
  const SystemStore = useSystemStoreWithOut();

  const actionsExpanded = ref(true);

  const UserBalance = ref<any>({
    balance: 0,
    ff: 0,
    listBalance: 0
  });

  const FiatExchangeRate = computed(() => SystemStore.getFiatExchangeRate);

  const parseBalance = (val: unknown) =>
    val != null && val !== '' ? parseFloat(String(val)) : 0;

  const listDisplayBalance = computed((): number => {
    const v = UserBalance.value?.listBalance ?? UserBalance.value?.balance;
    return parseBalance(v);
  });

  const listDisplayFiat = computed(
    (): number => listDisplayBalance.value * (FiatExchangeRate.value['USD'] ?? 0)
  );

  const fetchMyWalletInfo = () => {
    const { type } = route.query;
    getMyWalletInfo({}).then((res) => {
      const { code } = res;
      if (code !== 0) return;
      const { data } = res;
      if (!data) return;
   console.log(data,1111);
      const { balanceList, lp_if, ai_if, ff, lp_fa, ai_fa,st_if,st_fa } = data as any;
      if (!balanceList?.length) return;

      const row = balanceList.find((item: any) => item.accountType === route.query.type);
      if (!row) return;
      UserBalance.value = { ...row, listBalance: row.balance };

      const accountType = String(type || '').toUpperCase();
      if (accountType === 'AI') UserBalance.value.balance = ai_fa;
      else if (accountType === 'LP') UserBalance.value.balance = lp_fa;
      else if (accountType === 'ST') UserBalance.value.balance = st_fa;

      if (type === 'LP') UserBalance.value.ff = lp_if;
      else if (type === 'AI') UserBalance.value.ff = ai_if;
      else if (type === 'ST') UserBalance.value.ff = st_if;
      else UserBalance.value.ff = ff;
    });
  };

  onBeforeMount((): void => {
    UserStore.fetchAssetCurrencyList();
    fetchMyWalletInfo();
  });
</script>

<style lang="less" scoped>
  @card-blue: #2f6aec;
  @card-blue-dark: #1a37fd;

  .account-page {
    background: #f2f5fe;
    min-height: 100vh;

    :deep(.van-nav-bar) {
      background: transparent !important;
    }
    :deep(.van-nav-bar__title) {
      font-size: 16px;
      font-weight: 600;
      color: #000;
    }
    :deep(.van-nav-bar .van-icon) {
      color: #000 !important;
    }
    :deep(.nav-back-button .van-icon) {
      color: #000 !important;
    }
    :deep(.page-wrap) {
      background: transparent;
    }
  }

  .account-page__card {
    padding: 0.32rem 0.28rem 0.28rem;
    border-radius: 0.24rem;
    background: @card-blue;
    box-shadow: 0 0.08rem 0.24rem rgba(47, 106, 236, 0.28);
    overflow: hidden;
  }

  .account-page__balance-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.2rem;
    padding-bottom: 0.08rem;
  }

  .account-page__balance-item {
    min-width: 0;

    &--right {
      text-align: right;
    }
  }

  .account-page__balance-label {
    font-size: 0.24rem;
    line-height: 1.35;
    color: rgba(255, 255, 255, 0.82);
    font-weight: 400;
  }

  .account-page__balance-value {
    display: block;
    margin-top: 0.06rem;
    font-size: 0.44rem;
    line-height: 1.15;
    font-weight: 700;
    color: #fff;
  }

  .account-page__toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 0.12rem 0 0.16rem;
    border: none;
    background: transparent;
    cursor: pointer;
  }

  .account-page__toggle-icon {
    font-size: 0.28rem;
    color: rgba(255, 255, 255, 0.9);
  }

  .account-page__actions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.16rem;
    padding-top: 0.04rem;
  }

  .account-page__action-btn {
    flex: 1;
    min-width: 0;
    height: 0.72rem;
    border: none;
    border-radius: 0.16rem;
    font-size: 0.28rem;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.15s ease, transform 0.15s ease;

    &:active {
      opacity: 0.88;
      transform: scale(0.98);
    }

    &--primary {
      background: #fff;
      color: @card-blue-dark;
    }

    &--ghost {
      background: rgba(255, 255, 255, 0.22);
      color: #fff;
    }
  }

  .account-page__cell {
    background: #f9faff !important;
    box-shadow: 0 0 2px rgba(87, 119, 251, 0.25);
  }
</style>
