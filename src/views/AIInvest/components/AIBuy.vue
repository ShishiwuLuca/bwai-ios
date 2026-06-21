<template>
  <ConfigProvider theme="light">
    <PageWrap class="ai-buy-page">
    <NavBar :title="t('ab_title')" fixed placeholder :border="false" :ShowLeft="false">
      <template #left>
        <div class="ai-buy-page__nav-back" @click="goBackToInvest">
          <Icon name="arrow-left" :size="22" color="#000" />
        </div>
      </template>
    </NavBar>

    <div class="ai-buy-page__content">
      <div class="ai-buy-page__banner">
        <img
          :src="rawProduct?.appLogo ? rawProduct.appLogo : Mask"
          alt=""
          class="ai-buy-page__banner-img"
        />
      </div>

      <div class="ai-buy-page__section-title">{{ t('ab_section_ai') }}</div>

      <div class="ai-buy-page__card ai-buy-page__card--form">
        <div class="ai-buy-page__form-row">
          <div class="ai-buy-page__account" @click="showAccountPicker = true">
            <span class="ai-buy-page__account-text">{{ accountLabel }}</span>
            <Icon name="arrow-down" class="ai-buy-page__account-arrow" />
          </div>

          <span class="ai-buy-page__amount-divider" aria-hidden="true"></span>

          <input
            v-model="amount"
            class="ai-buy-page__amount"
            inputmode="decimal"
            autocomplete="off"
            :placeholder="t('ab_placeholder_amount')"
          />

          <button type="button" class="ai-buy-page__all" @click="fillAll">{{ t('ab_all') }}</button>
        </div>

        <div class="ai-buy-page__available">
          <span class="ai-buy-page__available-label">{{ t('ab_available') }}</span>
          <span class="ai-buy-page__available-value">{{ available }}</span>
          <span class="ai-buy-page__available-unit">{{ currency }}</span>
        </div>
      </div>

      <div
        v-if="rawProduct?.condition != null && rawProduct?.condition?.status == 1"
        class="ai-buy-page__detail-tabs"
      >
        <div
          v-for="tab in detailTabs"
          :key="tab.value"
          class="ai-buy-page__detail-tab"
          :class="{ 'ai-buy-page__detail-tab--active': activeDetailTab === tab.value }"
          @click="activeDetailTab = tab.value"
        >
          {{ t(tab.labelKey) }}
        </div>
      </div>

      <div
        v-show="rawProduct?.condition == null || activeDetailTab === 'detail'"
        class="ai-buy-page__card ai-buy-page__detail"
      >
        <div class="ai-buy-page__detail-row">
          <span class="ai-buy-page__detail-key">{{ t('ab_detail_project') }}</span>
          <span class="ai-buy-page__detail-val">{{ rawProduct?.name }}</span>
        </div>
        <div class="ai-buy-page__detail-row">
          <span class="ai-buy-page__detail-key">{{ t('ab_detail_period') }}</span>
          <span class="ai-buy-page__detail-val">{{ investPeriod }}</span>
        </div>
        <div class="ai-buy-page__detail-row">
          <span class="ai-buy-page__detail-key">{{ t('ab_detail_amount') }}</span>
          <span class="ai-buy-page__detail-val">{{ investAmountRange }} {{ rawProduct?.gainCoin }}</span>
        </div>
        <div class="ai-buy-page__detail-row">
          <span class="ai-buy-page__detail-key">{{ t('ab_detail_tag') }}</span>
          <span class="ai-buy-page__detail-val">{{ investTag }}</span>
        </div>
        <div class="ai-buy-page__detail-row">
          <span class="ai-buy-page__detail-key">{{ t('ab_detail_rate') }}</span>
          <span class="ai-buy-page__detail-val">{{ investRate }}</span>
        </div>
        <div class="ai-buy-page__detail-row">
          <span class="ai-buy-page__detail-key">{{ t('ab_detail_coin') }}</span>
          <span class="ai-buy-page__detail-val">{{ rawProduct?.gainCoin }}</span>
        </div>
        <div class="ai-buy-page__detail-row">
          <span class="ai-buy-page__detail-key">{{ t('ab_detail_cycle') }}</span>
          <span class="ai-buy-page__detail-val">{{
            rawProduct?.gainCycleType === 0
              ? rawProduct?.gainCycleValue + ' ' + t('ab_day_unit')
              : rawProduct?.gainCycleValue + ' ' + t('ab_hour_unit')
          }}</span>
        </div>
        <div class="ai-buy-page__detail-row">
          <span class="ai-buy-page__detail-key">{{ t('ab_detail_reinvest') }}</span>
          <span class="ai-buy-page__detail-val">{{
            rawProduct?.isReinvest === 1 ? t('ab_yes') : t('ab_no')
          }}</span>
        </div>
      </div>

      <div
        v-if="
          rawProduct?.condition != null &&
          activeDetailTab === 'limit' &&
          rawProduct?.condition?.status == 1
        "
        class="ai-buy-page__card ai-buy-page__limit"
      >
        <div class="ai-buy-page__limit-row">
          <span class="ai-buy-page__limit-key">{{ t('ab_limit_projects') }}</span>
          <div class="ai-buy-page__limit-scroll">
            <span class="ai-buy-page__limit-scroll-text">{{ limitProjectsText }}</span>
          </div>
        </div>
        <div class="ai-buy-page__limit-row">
          <span class="ai-buy-page__limit-key">{{ t('ab_limit_staking') }}</span>
          <span class="ai-buy-page__limit-val">
            <span
              class="ai-buy-page__limit-val--current"
              :class="
                limitStakingBelowRequired
                  ? 'ai-buy-page__limit-val--current--low'
                  : 'ai-buy-page__limit-val--current--met'
              "
            >{{ limitStakingCurrent }}</span>
            <span> / {{ limitStakingRequired }} {{ currency }}</span>
          </span>
        </div>
      </div>

      <div class="ai-buy-page__card ai-buy-page__tip">
        <div class="ai-buy-page__tip-title">{{ t('ab_tip_title') }}</div>
        <div class="ai-buy-page__tip-text">{{ t('ab_tip_text') }}</div>
        <div class="ai-buy-page__tip-text">{{ t('ab_tip_text_2') }}</div>
      </div>
    </div>

    <div class="ai-buy-page__footer">
      <button
        type="button"
        class="ai-buy-page__btn"
        :disabled="!productCanBuy"
        @click="onSubmit"
      >
        {{ productCanBuy ? t('ab_join_now') : t('ab_invest_unavailable') }}
      </button>
    </div>

    <nav class="ai-buy-page__dock" :aria-label="t('ab_tab_invest')">
      <div class="ai-buy-page__dock-inner">
        <button type="button" class="ai-buy-page__dock-tab ai-buy-page__dock-tab--active">
          <img :src="AI1" alt="" class="ai-buy-page__dock-icon" />
          <span>{{ t('ab_tab_invest') }}</span>
        </button>
        <button type="button" class="ai-buy-page__dock-tab" @click="goOrder">
          <Icon name="notes-o" class="ai-buy-page__dock-van-icon" />
          <span>{{ t('ab_tab_order') }}</span>
        </button>
      </div>
    </nav>

    <Popup
      :show="showAccountPicker"
      class="ai-buy-page__account-popup"
      position="bottom"
      round
      @update:show="(v) => (showAccountPicker = v)"
    >
      <div class="ai-buy-page__popup">
        <div class="ai-buy-page__popup-title">{{ t('ab_select_account') }}</div>
        <div class="ai-buy-page__popup-list">
          <button
            v-for="item in accounts"
            :key="item.value"
            type="button"
            class="ai-buy-page__popup-item"
            :class="{ 'ai-buy-page__popup-item--active': account.value === item.value }"
            @click="selectAccount(item)"
          >
            {{ t(item.labelKey) }}
          </button>
        </div>
      </div>
    </Popup>
  </PageWrap>
  </ConfigProvider>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { useRoute, useRouter } from 'vue-router';
  import { NavBar, PageWrap } from '/@/components';
  import { Icon, Popup, ConfigProvider } from 'vant';
  import Mask from '/@/assets/images/AI/Mask1.png';
  import AI1 from '/@/assets/images/AI/touzi.png';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { getStakeBalance, type AppBalanceRespVO } from '/@/service/Balance';
  import { productInvest, type AppProductRespVO } from '/@/service/Product';
  import { getStakeOverview } from '/@/service/Overview';

  const route = useRoute();
  const router = useRouter();
  const { t } = useI18n();
  const { CreateSuccessToast, CreateErrorToast, CreateLoadingToast } = useMessage();

  const PRODUCT_CACHE_KEY = 'ai-buy:last-product';
  const currency = 'USDT';

  const rawProduct = ref<AppProductRespVO | null>(null);
  const balanceData = ref<AppBalanceRespVO | null>(null);
  const amount = ref('');
  const submitting = ref(false);

  const accounts = [
    { labelKey: 'ab_account_ai', value: 'ai' },
    { labelKey: 'ab_account_lp', value: 'spot' }
  ] as const;

  const account = ref<(typeof accounts)[number]>(accounts[0]);
  const showAccountPicker = ref(false);

  const detailTabs = [
    { labelKey: 'ab_detail_title', value: 'detail' },
    { labelKey: 'ab_limit_title', value: 'limit' }
  ] as const;

  const activeDetailTab = ref<'detail' | 'limit'>('detail');
  const overviewStakingAmount = ref(0);

  const limitProjectsText = computed(() => {
    const list = rawProduct.value?.condition?.products;
    if (!Array.isArray(list) || list.length === 0) return '';
    return list
      .map((x) => String(x?.productName ?? '').trim())
      .filter(Boolean)
      .join('\n');
  });

  const limitStakingRequired = computed(() => rawProduct.value?.condition?.conditionAmount ?? 1000);

  const limitStakingCurrent = computed(() =>
    String(rawProduct.value?.condition?.processAmount ?? 0)
  );

  const limitStakingBelowRequired = computed(() => {
    const cur = Number(limitStakingCurrent.value);
    const req = Number(limitStakingRequired.value);
    if (!Number.isFinite(cur) || !Number.isFinite(req)) return true;
    return cur < req;
  });

  const investPeriod = computed(() =>
    rawProduct.value?.lockDay != null
      ? `${rawProduct.value.lockDay} ${t('ab_day_unit')}`
      : t('ab_default_period')
  );

  const investAmountRange = computed(() => {
    const p = rawProduct.value;
    if (!p) return t('ab_default_range');
    if (p.buyAmountMin != null && p.buyAmountMax != null) {
      return `${p.buyAmountMin}-${p.buyAmountMax}`;
    }
    if (p.buyAmountMin != null) return String(p.buyAmountMin);
    return t('ab_default_range');
  });

  const investTag = computed(() => rawProduct.value?.tagName);
  const investRate = computed(() =>
    rawProduct.value?.gainDayRateMinStr == rawProduct.value?.gainDayRateMaxStr
      ? rawProduct.value?.gainDayRateMinStr
      : rawProduct.value?.gainDayRateMinStr + '-' + rawProduct.value?.gainDayRateMaxStr
  );

  const productCanBuy = computed(() => Number(rawProduct.value?.canBuy) === 1);
  const accountLabel = computed(() => t(account.value.labelKey));

  const available = computed(() => {
    const data = balanceData.value;
    if (!data) return '0';
    const item = account.value.value === 'ai' ? data.ai : data.lp;
    const num = item?.availableBalance;
    if (num == null || Number.isNaN(num)) return '0';
    return String(num);
  });

  onMounted(() => {
    const raw = Array.isArray(route.query.product) ? route.query.product[0] : route.query.product;
    if (typeof raw === 'string' && raw) {
      try {
        const fromQuery = JSON.parse(decodeURIComponent(raw)) as AppProductRespVO;
        rawProduct.value = fromQuery;
        window.sessionStorage.setItem(PRODUCT_CACHE_KEY, JSON.stringify(fromQuery));
      } catch {
        rawProduct.value = null;
      }
    } else {
      try {
        const cached = window.sessionStorage.getItem(PRODUCT_CACHE_KEY);
        rawProduct.value = cached ? (JSON.parse(cached) as AppProductRespVO) : null;
      } catch {
        rawProduct.value = null;
      }
    }
    void fetchBalance();
    void fetchOverview();
  });

  const fetchOverview = () => {
    getStakeOverview()
      .then((res) => {
        if (res?.data?.stakingAmount != null) {
          overviewStakingAmount.value = Number(res.data.stakingAmount) || 0;
        }
      })
      .catch(() => {
        overviewStakingAmount.value = 0;
      });
  };

  const fetchBalance = () => {
    getStakeBalance()
      .then((res) => {
        if (res?.code === 0 && res.data) {
          balanceData.value = res.data;
        }
      })
      .catch(() => {
        balanceData.value = null;
      });
  };

  const fillAll = () => {
    amount.value = available.value;
  };

  const selectAccount = (item: (typeof accounts)[number]) => {
    account.value = item;
    showAccountPicker.value = false;
  };

  const onSubmit = () => {
    const value = (amount.value || '').trim();
    if (!value) {
      CreateErrorToast(t('ab_toast_enter_amount'));
      return;
    }
    const num = Number(value);
    if (Number.isNaN(num) || num <= 0) {
      CreateErrorToast(t('ab_toast_valid_amount'));
      return;
    }
    const product = rawProduct.value;
    if (!product?.id) {
      CreateErrorToast(t('ab_toast_product_error'));
      return;
    }
    if (Number(product.canBuy) !== 1) {
      CreateErrorToast(t('ab_invest_unavailable'));
      return;
    }
    if (submitting.value) return;
    submitting.value = true;
    const toast = CreateLoadingToast(t('ab_toast_submitting'));
    const accountType = account.value.value === 'ai' ? 0 : 1;
    productInvest({
      accountType,
      productId: product.id,
      amount: num
    })
      .then((res) => {
        toast.close();
        if (res && res.code !== 0) {
          CreateErrorToast(res.msg || t('ab_toast_invest_fail'));
          return;
        }
        CreateSuccessToast(t('ab_toast_invest_success'));
        amount.value = '';
        router.push('/MyOrder');
      })
      .catch((e: unknown) => {
        toast.close();
        const msg =
          (
            e as {
              msg?: string;
            }
          )?.msg ?? t('ab_toast_invest_fail');
        CreateErrorToast(msg);
      })
      .finally(() => {
        submitting.value = false;
      });
  };

  const goOrder = () => {
    router.push('/MyOrder');
  };

  const goBackToInvest = () => {
    router.push('/AIInvest');
  };
</script>

<style scoped lang="less">
  @blue: #1a37fd;
  @text: #000;
  @label: #999;
  @value: #333;
  @white: #fff;
  @border: #e8ecf5;
  @input-bg: #f3f6ff;
  @shadow: 0 0.04rem 0.2rem rgba(51, 102, 255, 0.08);
  @btn-gradient: linear-gradient(180deg, #92b6ff 0%, #2a61f9 100%);

  .card() {
    background: @white;
    border-radius: 0.24rem;
    box-shadow: @shadow;
  }

  .ai-buy-page {
    --ai-buy-dock-offset: calc(1.08rem + env(safe-area-inset-bottom, 0px));
    min-height: 100vh;
    padding-bottom: calc(var(--ai-buy-dock-offset) + 1.2rem);
    color: @text;
  }

  .ai-buy-page__content {
    padding: 0.24rem 0.32rem calc(2.2rem + var(--ai-buy-dock-offset));
  }

  .ai-buy-page__nav-back {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 0.8rem;
    height: 0.8rem;
    cursor: pointer;
  }

  .ai-buy-page__banner {
    margin-bottom: 0.24rem;
    border-radius: 0.24rem;
    overflow: hidden;
    box-shadow: @shadow;
  }

  .ai-buy-page__banner-img {
    display: block;
    width: 100%;
    height: auto;
    object-fit: cover;
  }

  .ai-buy-page__section-title {
    margin: 0.18rem 0;
    font-size: 0.3rem;
    font-weight: 700;
    color: @text;
  }

  .ai-buy-page__card {
    .card();
    margin-bottom: 0.24rem;
    padding: 0.28rem;
  }

  .ai-buy-page__card--form {
    padding: 0.24rem 0.28rem 0.2rem;
  }

  .ai-buy-page__form-row {
    display: grid;
    grid-template-columns: 1.55rem 0.08rem 1fr 0.86rem;
    align-items: center;
    gap: 0.1rem;
    height: 0.88rem;
    padding: 0 0.2rem;
    border-radius: 0.16rem;
    background: @input-bg;
  }

  .ai-buy-page__account {
    display: flex;
    align-items: center;
    gap: 0.08rem;
    font-size: 0.26rem;
    font-weight: 600;
    color: @text;
    cursor: pointer;
  }

  .ai-buy-page__account-arrow {
    font-size: 0.22rem;
    color: @label;
  }

  .ai-buy-page__amount-divider {
    display: block;
    width: 0.06rem;
    height: 0.48rem;
    border-radius: 0.03rem;
    background: linear-gradient(180deg, #92b6ff 0%, #2a61f9 100%);
  }

  .ai-buy-page__amount {
    width: 100%;
    height: 0.72rem;
    padding: 0 0.16rem;
    border: none;
    outline: none;
    background: transparent;
    color: @text;
    font-size: 0.26rem;
    font-weight: 600;

    &::placeholder {
      color: #b0b8cc;
      font-weight: 500;
    }
  }

  .ai-buy-page__all {
    border: none;
    background: transparent;
    padding: 0;
    font-size: 0.26rem;
    font-weight: 700;
    color: @blue;
    text-align: right;
    cursor: pointer;
  }

  .ai-buy-page__available {
    display: flex;
    justify-content: flex-end;
    align-items: baseline;
    gap: 0.08rem;
    margin-top: 0.16rem;
    font-size: 0.24rem;
  }

  .ai-buy-page__available-label {
    color: @label;
  }

  .ai-buy-page__available-value {
    font-weight: 700;
    color: @blue;
  }

  .ai-buy-page__available-unit {
    color: @value;
    font-weight: 600;
  }

  .ai-buy-page__detail-tabs {
    display: flex;
    gap: 0.32rem;
    margin-bottom: 0.2rem;
    border-bottom: 1px solid @border;
  }

  .ai-buy-page__detail-tab {
    position: relative;
    padding-bottom: 0.16rem;
    font-size: 0.28rem;
    font-weight: 500;
    color: @label;
    cursor: pointer;

    &--active {
      font-weight: 700;
      color: @blue;

      &::after {
        content: '';
        position: absolute;
        left: 0;
        right: 0;
        bottom: -1px;
        height: 0.06rem;
        border-radius: 0.03rem;
        background: @blue;
      }
    }
  }

  .ai-buy-page__detail,
  .ai-buy-page__limit {
    padding: 0.08rem 0.28rem;
  }

  .ai-buy-page__detail-row,
  .ai-buy-page__limit-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.24rem;
    padding: 0.2rem 0;
    border-bottom: 1px solid @border;
    font-size: 0.26rem;

    &:last-child {
      border-bottom: none;
    }
  }

  .ai-buy-page__detail-key,
  .ai-buy-page__limit-key {
    flex-shrink: 0;
    color: @label;
  }

  .ai-buy-page__detail-val,
  .ai-buy-page__limit-val {
    text-align: right;
    font-weight: 600;
    color: @value;
    word-break: break-word;
  }

  .ai-buy-page__limit-scroll {
    flex: 1;
    min-width: 0;
    max-height: 2.4rem;
    overflow-y: auto;
    text-align: right;
  }

  .ai-buy-page__limit-scroll-text {
    display: block;
    white-space: pre-line;
    font-weight: 600;
    color: @value;
    line-height: 1.45;
    word-break: break-word;
  }

  .ai-buy-page__limit-val--current--low {
    color: #e54545;
  }

  .ai-buy-page__limit-val--current--met {
    color: @blue;
  }

  .ai-buy-page__tip {
    padding: 0.24rem 0.28rem;
  }

  .ai-buy-page__tip-title {
    margin-bottom: 0.12rem;
    font-size: 0.26rem;
    font-weight: 700;
    color: @text;
  }

  .ai-buy-page__tip-text {
    font-size: 0.22rem;
    line-height: 1.55;
    color: @label;

    & + & {
      margin-top: 0.08rem;
    }
  }

  .ai-buy-page__footer {
    position: fixed;
    left: 0;
    right: 0;
    bottom: var(--ai-buy-dock-offset);
    z-index: 10;
    padding: 0.18rem 0.32rem 0.22rem;
    background: linear-gradient(180deg, rgba(238, 242, 253, 0) 0%, rgba(238, 242, 253, 0.96) 40%, #eef2fd 100%);
  }

  .ai-buy-page__btn {
    display: block;
    width: 100%;
    height: 0.92rem;
    border: none;
    border-radius: 0.46rem;
    background: @btn-gradient;
    color: @white;
    font-size: 0.32rem;
    font-weight: 700;
    box-shadow: 0 0.08rem 0.24rem rgba(42, 97, 249, 0.28);

    &:disabled {
      background: #e8edf5;
      color: @label;
      box-shadow: none;
    }
  }

  .ai-buy-page__dock {
    position: fixed;
    left: 0.32rem;
    right: 0.32rem;
    bottom: calc(0.16rem + env(safe-area-inset-bottom, 0px));
    z-index: 11;
  }

  .ai-buy-page__dock-inner {
    display: flex;
    gap: 0.08rem;
    padding: 0.08rem;
    border-radius: 0.48rem;
    background: rgba(255, 255, 255, 0.96);
    box-shadow:
      0 0.08rem 0.28rem rgba(26, 55, 253, 0.12),
      0 0 0 1px rgba(232, 236, 245, 0.95);
    backdrop-filter: blur(12px);
  }

  .ai-buy-page__dock-tab {
    flex: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.1rem;
    height: 0.76rem;
    border: none;
    border-radius: 0.38rem;
    background: transparent;
    color: @label;
    font-size: 0.26rem;
    font-weight: 500;
    line-height: 1;
    cursor: pointer;
    transition:
      color 0.2s ease,
      background 0.2s ease,
      box-shadow 0.2s ease,
      transform 0.2s ease;

    &:active {
      transform: scale(0.98);
    }

    &--active {
      color: @blue;
      font-weight: 700;
      background: linear-gradient(180deg, #f3f6ff 0%, #e3eaff 100%);
      box-shadow:
        inset 0 0 10px 0 #fff,
        0 2px 6px rgba(26, 55, 253, 0.16);
    }
  }

  .ai-buy-page__dock-icon {
    display: block;
    width: 0.4rem;
    height: 0.4rem;
    object-fit: contain;
  }

  .ai-buy-page__dock-van-icon {
    font-size: 0.4rem;
    color: inherit;
  }

  .ai-buy-page__popup {
    padding: 0.28rem 0.32rem calc(0.32rem + env(safe-area-inset-bottom, 0px));
    background: @white;
  }

  .ai-buy-page__popup-title {
    margin-bottom: 0.2rem;
    padding-bottom: 0.16rem;
    border-bottom: 1px solid @border;
    font-size: 0.3rem;
    font-weight: 700;
    color: @text;
  }

  .ai-buy-page__popup-list {
    display: flex;
    flex-direction: column;
    gap: 0.12rem;
  }

  .ai-buy-page__popup-item {
    width: 100%;
    height: 0.76rem;
    padding: 0 0.24rem;
    border: 1px solid @border;
    border-radius: 0.16rem;
    background: @white;
    font-size: 0.26rem;
    font-weight: 500;
    color: @value;
    text-align: left;

    &--active {
      border-color: @blue;
      background: #f3f6ff;
      color: @blue;
      font-weight: 600;
    }
  }

  @media screen and (min-width: 600px) {
    .ai-buy-page__footer,
    .ai-buy-page__dock {
      left: 50%;
      right: auto;
      width: 100%;
      max-width: 8rem;
      transform: translateX(-50%);
    }
  }
</style>

<style lang="less">
  .ai-buy-page__account-popup.van-popup {
    background: #fff;
  }
</style>
