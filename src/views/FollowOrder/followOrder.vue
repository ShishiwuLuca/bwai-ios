<template>
  <div>
    <NavBar :show-left="false" fixed placeholder :border="false">
      <template #left>
        <VanImage :src="Logo" height="0.6rem" width="2.2rem" />
      </template>
      <template #right>
        <Icon name="chat-o" :size="28" @click="$router.push('/Notice')" />
      </template>
    </NavBar>

    <PageWrap class="follow-order-page">
      <div class="follow-order-page__content">
        <!-- AI策略总览 -->
        <div class="follow-order-page__overview-wrap">
          <div class="follow-order-page__overview-head">
            <div class="follow-order-page__overview-head-left" @click="overviewExpanded = !overviewExpanded">
              <span class="follow-order-page__overview-title">{{ t('fo_overview_title') }}</span>
              <Icon :name="overviewExpanded ? 'arrow-up' : 'arrow-down'" class="follow-order-page__overview-arrow" />
            </div>
            <Icon
              name="description"
              class="follow-order-page__overview-history-icon"
              @click="goFollowOrderDetail"
            />
          </div>

          <div v-show="overviewExpanded" class="follow-order-page__overview-swipe-wrap">
            <Swipe
              ref="overviewSwipeRef"
              :loop="true"
              :show-indicators="false"
              class="follow-order-page__overview-swipe"
            >
              <SwipeItem
                v-for="(group, groupIndex) in summaryCardGroups"
                :key="groupIndex"
                class="follow-order-page__overview-swipe-item"
              >
                <div class="follow-order-page__overview-cards">
                  <div
                    v-for="card in group"
                    :key="card.title"
                    class="follow-order-page__summary-card"
                    :class="{ 'follow-order-page__summary-card--arrow': card.showArrow }"
                    @click="card.showArrow && onOverviewNextSlide()"
                  >
                    <div class="follow-order-page__summary-head">
                      <img :src="card.icon" alt="" />
                      <span>{{ card.title }}</span>
                    </div>
                    <CountTo
                      :start-val="0"
                      :end-val="card.endVal"
                      :decimals="card.decimals"
                      :separator="card.separator || ''"
                      class="follow-order-page__summary-value"
                    />
                    <Icon v-if="card.showArrow" name="arrow" class="follow-order-page__summary-arrow" />
                  </div>
                </div>
              </SwipeItem>
            </Swipe>
          </div>
        </div>

        <!-- 策略 Tab + 特点 + 参数 -->
        <div v-if="planTabs.length" class="follow-order-page__main-card">
          <Tabs
            v-model:active="activePlanTab"
            class="follow-order-page__tabs"
            :class="{ 'follow-order-page__tabs--scroll': planTabs.length > 3 }"
            :scrollable="planTabs.length > 3"
            :ellipsis="false"
            :line-width="28"
            color="#1a37fd"
            title-inactive-color="#999999"
            title-active-color="#1a37fd"
          >
            <Tab v-for="tab in planTabs" :key="tab.id" :title="tab.name" :name="tab.id" />
          </Tabs>

          <div class="follow-order-page__features">
            <div class="follow-order-page__section-title">{{ t('fo_strategy_features') }}</div>
            <div class="follow-order-page__features-grid">
              <div v-for="(feat, i) in featureList" :key="feat" class="follow-order-page__feature-item">
                <Icon :name="feat.icon" :class="`follow-order-page__feature-icon follow-order-page__feature-icon--${i + 1}`" />
                <span>{{ feat.text }}</span>
              </div>
            </div>
          </div>

          <div v-if="showComingSoon" class="follow-order-page__empty">
            <img :src="NoOpenImg" alt="" class="follow-order-page__empty-img" />
            <p class="follow-order-page__empty-text">{{ t('fo_coming_soon') }}</p>
          </div>

          <div v-else-if="currentStrategy" class="follow-order-page__params">
            <div class="follow-order-page__section-title">{{ t('fo_strategy_params') }}</div>
            <div class="follow-order-page__params-list">
              <div v-for="item in currentStrategy.params" :key="item.label" class="follow-order-page__param-row">
                <span class="follow-order-page__param-label">{{ item.label }}</span>
                <span class="follow-order-page__param-value" :class="{ 'is-accent': item.accent }">{{ item.value }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="follow-order-page__empty follow-order-page__empty--page">
          <img :src="NoOpenImg" alt="" class="follow-order-page__empty-img" />
          <p class="follow-order-page__empty-text">{{ t('fo_coming_soon') }}</p>
        </div>

        <!-- 参与策略 -->
        <div v-if="!showComingSoon && planTabs.length" class="follow-order-page__block">
          <div class="follow-order-page__available">
            <span class="follow-order-page__available-label">{{ t('ab_available') }}</span>
            <span class="follow-order-page__available-value">{{ stBalanceText }}</span>
            <button type="button" class="follow-order-page__available-transfer" @click="goTransferSt">
              <Icon name="exchange" class="follow-order-page__available-transfer-icon" />
            </button>
          </div>

          <div class="follow-order-page__action-card">
            <div class="follow-order-page__section-title">{{ t('fo_strategy_params') }}</div>

            <div v-if="showStrategyCode" class="follow-order-page__update-status">
              <Icon name="clock-o" class="follow-order-page__update-icon" />
              <span>{{ t('fo_strategy_updated_today') }}</span>
            </div>

            <div class="follow-order-page__join-bar">
              <input
                v-if="showStrategyCode"
                v-model="strategyCode"
                class="follow-order-page__join-input"
                type="text"
                autocomplete="off"
                :placeholder="t('fo_strategy_code_input_placeholder')"
              />

            </div>
          <button
            v-if="isLoggedIn"
            type="button"
            class="follow-order-page__transfer-btn"
            :disabled="joinBtn.disabled"
            @click="onJoinClick"
          >
               {{ joinBtn.text }}
          </button>
            <p class="follow-order-page__join-tip">{{ t('fo_join_tip') }}</p>
          </div>

    
        </div>
      </div>
    </PageWrap>

    <AppTabBar />

    <Popup
      v-model:show="showConfirmOrder"
      round
      teleport="body"
      overlay-class="follow-order-page__confirm-overlay"
      class="follow-order-page__confirm-popup"
    >
      <div class="follow-order-page__confirm-shell">
        <button
          type="button"
          class="follow-order-page__confirm-close"
          :aria-label="t('common_text_btnCancel')"
          @click="showConfirmOrder = false"
        >
          <Icon name="cross" color="#fff" :size="14" />
        </button>
        <div class="follow-order-page__confirm">
          <div class="follow-order-page__confirm-title">{{ t('fo_confirm_order') }}</div>
          <div class="follow-order-page__confirm-body">
            <div v-if="showStrategyCode" class="follow-order-page__confirm-row">
              <span class="follow-order-page__confirm-label">{{ t('fo_strategy_code') }}</span>
              <span class="follow-order-page__confirm-value">{{ confirmCode }}</span>
            </div>
            <div class="follow-order-page__confirm-row">
              <span class="follow-order-page__confirm-label">{{ t('fo_order_amount') }}</span>
              <span class="follow-order-page__confirm-value">{{ confirmOrderAmountText }}</span>
            </div>
          </div>
          <div class="follow-order-page__confirm-actions">
            <button
              type="button"
              class="follow-order-page__confirm-btn follow-order-page__confirm-btn--cancel"
              @click="showConfirmOrder = false"
            >
              {{ t('common_text_btnCancel') }}
            </button>
            <button
              type="button"
              class="follow-order-page__confirm-btn follow-order-page__confirm-btn--ok"
              :disabled="submitting"
              @click="onConfirmOrder"
            >
              {{ t('common_text_btnConfirm') }}
            </button>
          </div>
        </div>
      </div>
    </Popup>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { NavBar, PageWrap, AppTabBar, CountTo } from '/@/components';
  import { Tabs, Tab, Icon, Swipe, SwipeItem, Popup } from 'vant';
  import { useSystemStoreWithOut } from '/@/stores/modules/SystemConfig';
  import { useUserStoreWithOut } from '/@/stores/modules/UserConfig';
  import SummaryIconPeople from '/@/assets/images/follow1.png';
  import SummaryIconProfit from '/@/assets/images/follow2.png';
  import NoOpenImg from '/@/assets/images/noopen.png';
  import { getTradePlanPage, getTradePlanOverview, createTradeOrder } from '/@/service/TradePlan';
  import { getMyWalletInfo } from '/@/service/Wallet';
  import { TimeToFormat } from '/@/utils/TimeZone';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { useI18n } from '/@/hooks/web/useI18n';

  type PlanPeriodStatus = 'pending' | 'active' | 'expired';

  interface JoinBtn {
    text: string;
    disabled: boolean;
  }

  interface PlanParam {
    label: string;
    value: string;
    accent?: boolean;
  }

  interface PlanTab {
    id: number | string;
    name: string;
    type: number;
    symbol?: string;
    codeId?: number | string;
    startTime?: number | string;
    endTime?: number | string;
    tradeAmountMax?: number;
    params: PlanParam[];
  }

  interface SummaryCard {
    title: string;
    endVal: number;
    decimals: number;
    icon: string;
    separator?: string;
    showArrow?: boolean;
  }

  const router = useRouter();
  const route = useRoute();
  const { t } = useI18n();
  const { CreateToast, CreateSuccessToast, CreateErrorToast, CreateLoadingToast } = useMessage();
  const SystemStore = useSystemStoreWithOut();
  const userStore = useUserStoreWithOut();

  const featureList = computed(() => [
    { icon: 'bulb-o', text: t('fo_feat_ai_exec') },
    { icon: 'shield-o', text: t('fo_feat_risk_control') },
    { icon: 'clock-o', text: t('fo_feat_market_monitor') },
    { icon: 'chart-trending-o', text: t('fo_feat_position_mgmt') }
  ] as const);

  const overviewExpanded = ref(true);
  const activePlanTab = ref<string | number | undefined>(undefined);
  const overviewSwipeRef = ref<{ next?: () => void } | null>(null);
  const planTabs = ref<PlanTab[]>([]);
  const rawPlanList = ref<any[]>([]);
  const strategyCode = ref('');
  const stBalance = ref(0);
  const stCoin = ref('USDT');
  const showConfirmOrder = ref(false);
  const submitting = ref(false);
  const overviewData = ref<any>(null);

  const Logo = computed(() => SystemStore.getSiteLogo);
  const isLoggedIn = computed(() => !!userStore.getToken);

  // 当前选中的跟单计划
  const currentStrategy = computed(
    () => planTabs.value.find((item) => item.id === activePlanTab.value) || planTabs.value[0] || null
  );

  const showStrategyCode = computed(() => currentStrategy.value?.type == 0);
  const coin = computed(() => currentStrategy.value?.symbol || stCoin.value);
  const stBalanceText = computed(() => `${stBalance.value || 0} ${coin.value}`);
  const confirmCode = computed(() =>
    showStrategyCode.value ? strategyCode.value.trim().toUpperCase() || '--' : '--'
  );

  // 判断计划是否在有效期内
  const toPlanTime = (time: any) => {
    const n = Number(time);
    return n ? (n < 1e12 ? n * 1000 : n) : 0;
  };

  const getPlanPeriodStatus = (plan: PlanTab | null): PlanPeriodStatus => {
    const now = Date.now();
    const start = toPlanTime(plan?.startTime);
    const end = toPlanTime(plan?.endTime);
    if (start && now < start) return 'pending';
    if (end && now > end) return 'expired';
    return 'active';
  };

  /** 无计划或当前计划未开始时展示空状态 */
  const showComingSoon = computed(() => {
    if (!planTabs.value.length) return true;
    return getPlanPeriodStatus(currentStrategy.value) === 'pending';
  });

  // 参与按钮：未登录 / 未开始 / 已结束 / 可参与
  const joinBtn = computed((): JoinBtn => {
    if (!isLoggedIn.value) return { text: t('fo_login_now'), disabled: false };
    const plan = currentStrategy.value;
    if (!plan) return { text: t('ab_join_now'), disabled: true };
    const status = getPlanPeriodStatus(plan);
    if (status === 'pending') return { text: t('fo_status_pending'), disabled: true };
    if (status === 'expired') return { text: t('fo_status_expired'), disabled: true };
    return { text: t('ab_join_now'), disabled: false };
  });

  const toNum = (val: any) => {
    const n = Number(val);
    return Number.isFinite(n) ? n : 0;
  };

  /** 确认下单金额：不超过计划最大仓位，否则取可用余额 */
  const confirmOrderAmount = computed(() => {
    const balance = stBalance.value || 0;
    const max = toNum(currentStrategy.value?.tradeAmountMax);
    if (max > 0 && balance > max) return max;
    return balance;
  });
  const confirmOrderAmountText = computed(() => `${confirmOrderAmount.value} ${coin.value}`);

  const getProfitDecimals = (val: number) => {
    if (!val) return 4;
    const text = String(val);
    const dot = text.indexOf('.');
    return dot >= 0 ? Math.min(4, text.length - dot - 1) : 0;
  };

  const makeSummaryCard = (title: string, val: any, kind: 'people' | 'profit'): SummaryCard => {
    const endVal = toNum(val);
    if (kind === 'people') {
      return {
        title,
        endVal,
        decimals: 0,
        separator: ',',
        icon: SummaryIconPeople
      };
    }
    return {
      title,
      endVal,
      decimals: getProfitDecimals(endVal),
      icon: SummaryIconProfit,
      showArrow: true
    };
  };

  const summaryCardGroups = computed((): SummaryCard[][] => {
    const data = overviewData.value || {};
    return [
      [
        makeSummaryCard(t('fo_trade_user_count'), data.tradeUserCount, 'people'),
        makeSummaryCard(t('fo_last30_profit'), data.last30DaysProfit, 'profit')
      ],
      [
        makeSummaryCard(t('fo_my_order_count'), data.myTradeOrderCount, 'people'),
        makeSummaryCard(t('fo_my_profit'), data.myTradeProfit, 'profit')
      ]
    ];
  });

  const formatRange = (min: any, max: any, unit = '') => {
    if (min == null && max == null) return '--';
    if (min != null && max != null) {
      return (min === max ? `${min}` : `${min}-${max}`) + unit;
    }
    return `${min ?? max}${unit}`;
  };

  // 组装策略参数展示行
  const buildPlanParams = (item: any): PlanParam[] => {
    const symbol = item.symbol || 'USDT';
    const fmtTime = (time: any) => (time ? TimeToFormat(toPlanTime(time), 'MM/DD HH:mm:ss') : '--');
    const start = fmtTime(item.startTime);
    const end = fmtTime(item.endTime);

    return [
      { label: t('fo_strategy_name'), value: item.name || '--' },
      { label: t('fo_strategy_position'), value: formatRange(item.tradeAmountMin, item.tradeAmountMax, ` ${symbol}`) },
      { label: t('fo_strategy_type'), value: item.label || '--', accent: true },
      { label: t('fo_expected_rate'), value: formatRange(item.tradeRateMin*100, item.tradeRateMax*100, '%') },
      {
        label: t('fo_strategy_cycle'),
        value: item.tradeCycle != null ? `${item.tradeCycle}${t('ai_invest_day_unit')}` : '--'
      },
      { label: t('fo_strategy_validity'), value: start === '--' && end === '--' ? '--' : `${start} - ${end}` }
    ];
  };

  // 从路由 query 恢复选中的计划 Tab（订单页跳转回来）
  const applyPlanTabFromQuery = () => {
    const raw = route.query.planId;
    if (raw == null || raw === '') {
      activePlanTab.value = planTabs.value[0]?.id;
      return;
    }
    const planId = Number(Array.isArray(raw) ? raw[0] : raw);
    const matched = planTabs.value.find((item) => Number(item.id) === planId);
    activePlanTab.value = matched?.id ?? planTabs.value[0]?.id;
  };

  const mapPlanTabs = (list: any[]) =>
    list.map((item: any) => ({
      id: item.id,
      name: item.name,
      type: item.type,
      symbol: item.symbol,
      codeId: item.codeId,
      startTime: item.startTime,
      endTime: item.endTime,
      tradeAmountMax: toNum(item.tradeAmountMax) || undefined,
      params: buildPlanParams(item)
    }));

  const fetchPlanList = () => {
    getTradePlanPage({ pageNo: 1, pageSize: 50 }).then((res: any) => {
      if (Number(res?.code) !== 0) {
        rawPlanList.value = [];
        planTabs.value = [];
        activePlanTab.value = undefined;
        return;
      }
      rawPlanList.value = res?.data?.list || [];
      planTabs.value = mapPlanTabs(rawPlanList.value);
      applyPlanTabFromQuery();
    });
  };

  const fetchOverview = () => {
    getTradePlanOverview({}).then((res: any) => {
      if (Number(res?.code) !== 0) return;
      overviewData.value = res?.data || {};
      const available = res?.data?.st?.availableBalance;
      if (available != null) stBalance.value = toNum(available);
    });
  };

  // 钱包接口补充 ST 余额与币种
  const fetchStBalance = () => {
    if (!isLoggedIn.value) return;
    getMyWalletInfo({}).then((res: any) => {
      if (Number(res?.code) !== 0) return;
      const data = res?.data || {};
      stBalance.value = Number(data.st_fa ?? 0);
      const stRow = (data.balanceList || []).find(
        (item: any) => String(item?.accountType).toUpperCase() === 'ST'
      );
      if (stRow?.symbol) stCoin.value = stRow.symbol;
    });
  };

  const onOverviewNextSlide = () => {
    overviewSwipeRef.value?.next?.();
  };

  const goTransferSt = () => {
    router.push({ name: 'TransferST', query: { from: 'ST' } });
  };

  const goFollowOrderDetail = () => {
    router.push('/followOrderDetail');
  };

  const onJoinClick = () => {
    if (!isLoggedIn.value) {
      router.push({ name: 'Login' });
      return;
    }
    if (joinBtn.value.disabled) return;
    if (showStrategyCode.value && !strategyCode.value.trim()) {
      CreateToast(t('fo_toast_enter_code'));
      return;
    }
    showConfirmOrder.value = true;
  };

  // 提交跟单订单：type=0 传 followCode，否则传 codeId；planId 为计划列表 id
  const onConfirmOrder = () => {
    if (submitting.value) return;

    const plan = currentStrategy.value;
    const data: { planId?: number | string; followCode?: string; codeId?: number | string } = {
      planId: plan?.id,
      ...(showStrategyCode.value
        ? { followCode: strategyCode.value.trim().toUpperCase() }
        : { codeId: plan?.codeId })
    };

    if (!data.planId) {
      CreateErrorToast(t('fo_toast_info_error'));
      return;
    }
    if (showStrategyCode.value && !data.followCode) {
      CreateToast(t('fo_toast_enter_code'));
      return;
    }
    if (!showStrategyCode.value && !data.codeId) {
      CreateErrorToast(t('fo_toast_info_error'));
      return;
    }

    submitting.value = true;
    const toast = CreateLoadingToast({ message: t('ab_toast_submitting'), forbidClick: true });
    createTradeOrder(data)
      .then((res: any) => {
        toast.close();
        if (res?.code !== 0) {
          CreateErrorToast(res?.msg);
          return;
        }
        strategyCode.value = '';
        CreateSuccessToast(t('fo_toast_join_success'));
        router.push('/followOrderDetail');
      })
      .catch((e: any) => {
        toast.close();
        CreateErrorToast(e?.msg || e?.message);
      })
      .finally(() => {
        submitting.value = false;
        showConfirmOrder.value = false;
      });
  };

  watch(
    () => SystemStore.getLocaleInfo?.locale,
    () => {
      if (!rawPlanList.value.length) return;
      planTabs.value = mapPlanTabs(rawPlanList.value);
    }
  );

  // 切换计划时清空策略码
  watch(activePlanTab, () => {
    strategyCode.value = '';
  });

  onMounted(() => {
    fetchOverview();
    fetchPlanList();
    fetchStBalance();
  });
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
  @btn-gradient: linear-gradient(90deg, #6ca9ff 0%, @blue 100%);

  .card() {
    background: @white;
    border-radius: 0.24rem;
    box-shadow: @shadow;
  }

  :deep(.van-nav-bar__left) {
    padding: 0 var(--van-padding-md);
  }

  :deep(.van-nav-bar .van-icon) {
    color: @text;
  }

  .follow-order-page {
    min-height: 100vh;
    padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
    color: @text;
  }

  .follow-order-page__content {
    padding: 0 0.32rem calc(0.4rem + env(safe-area-inset-bottom, 0px));
  }

  .follow-order-page__section-title {
    margin-bottom: 0.16rem;
    font-size: 0.3rem;
    font-weight: 700;
    color: @text;
  }

  .follow-order-page__block {
    margin-bottom: 0.28rem;
  }

  /* 总览 */
  .follow-order-page__overview-wrap {
    margin: 0.08rem 0 0.24rem;
  }

  .follow-order-page__overview-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.16rem;
  }

  .follow-order-page__overview-head-left {
    display: inline-flex;
    align-items: center;
    gap: 0.08rem;
    cursor: pointer;
  }

  .follow-order-page__overview-history-icon {
    font-size: 0.32rem;
    color: @blue;
    cursor: pointer;
  }

  .follow-order-page__overview-title {
    font-size: 0.28rem;
    font-weight: 700;
  }

  .follow-order-page__overview-arrow {
    font-size: 0.28rem;
  }

  .follow-order-page__overview-swipe-wrap {
    overflow: hidden;
  }

  .follow-order-page__overview-cards {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.2rem;
  }

  .follow-order-page__summary-card {
    .card();
    position: relative;
    min-height: 1.56rem;
    padding: 0.24rem 0.2rem;

    &--arrow {
      cursor: pointer;

      .follow-order-page__summary-value {
        padding-right: 0.36rem;
      }
    }
  }

  .follow-order-page__summary-head {
    display: flex;
    align-items: center;
    gap: 0.08rem;
    margin-bottom: 0.12rem;
    font-size: 0.22rem;
    color: @label;
    line-height: 1.3;

    img {
      width: 0.32rem;
      height: 0.32rem;
      object-fit: contain;
      flex-shrink: 0;
    }
  }

  .follow-order-page__summary-value {
    font-size: 0.34rem;
    font-weight: 700;
    color: @blue;
    line-height: 1.2;
  }

  .follow-order-page__summary-arrow {
    position: absolute;
    right: 0.12rem;
    top: 50%;
    font-size: 0.24rem;
    color: @blue;
    transform: translateY(-50%);
  }

  /* 主卡片 */
  .follow-order-page__main-card {
    .card();
    margin-bottom: 0.28rem;
    padding: 0.08rem 0.28rem 0.28rem;
  }

  .follow-order-page__tabs {
    margin-bottom: 0.24rem;

    :deep(.van-tabs__wrap) {
      height: auto;
      border-bottom: none;
    }

    :deep(.van-tabs__nav) {
      background: transparent;
      padding: 0;
    }

    :deep(.van-tab) {
      padding: 0.2rem 0.08rem 0.18rem;
      font-size: 0.26rem;
      font-weight: 500;
      color: @label;
    }

    :deep(.van-tab__text) {
      white-space: nowrap;
    }

    :deep(.van-tab--active) {
      font-weight: 700;
      color: @blue;
    }

    :deep(.van-tabs__line) {
      height: 0.06rem;
      border-radius: 0.03rem;
      bottom: 0;
      background: @blue;
    }

    &:not(.follow-order-page__tabs--scroll) :deep(.van-tab) {
      flex: 1;
    }

    &--scroll :deep(.van-tabs__wrap) {
      overflow-x: auto;
    }

    &--scroll :deep(.van-tab) {
      flex: none;
      flex-shrink: 0;
      padding: 0.2rem 0.28rem 0.18rem;
    }
  }

  .follow-order-page__features {
    margin-bottom: 0.28rem;
  }

  .follow-order-page__features-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.08rem;
    padding: 0.2rem 0.12rem;
    border: 1px solid @border;
    border-radius: 0.16rem;
    background: #f8faff;
  }

  .follow-order-page__feature-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.08rem;
    text-align: center;
    font-size: 0.18rem;
    color: @label;
    line-height: 1.3;
  }

  .follow-order-page__feature-icon {
    font-size: 0.36rem;

    &--1 { color: #ffb020; }
    &--2 { color: #34c759; }
    &--3 { color: #ff9500; }
    &--4 { color: @blue; }
  }

  .follow-order-page__param-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.24rem;
    padding: 0.22rem 0;
    border-bottom: 1px solid @border;
    font-size: 0.26rem;

    &:last-child {
      border-bottom: none;
    }
  }

  .follow-order-page__param-label {
    flex-shrink: 0;
    color: @label;
  }

  .follow-order-page__param-value {
    text-align: right;
    font-weight: 500;
    color: @value;
    word-break: break-word;

    &.is-accent {
      color: @blue;
    }
  }

  .follow-order-page__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0.48rem 0.32rem 0.56rem;
    text-align: center;

    &--page {
      margin-top: 0.16rem;
      min-height: 4.8rem;
    }
  }

  .follow-order-page__empty-img {
    width: 3.2rem;
    height: auto;
    object-fit: contain;
    pointer-events: none;
    user-select: none;
  }

  .follow-order-page__empty-text {
    margin-top: 0.28rem;
    font-size: 0.34rem;
    font-weight: 700;
    letter-spacing: 0.02rem;
  }

  /* 参与区 */
  .follow-order-page__available {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 0.08rem;
    margin-bottom: 0.16rem;
    font-size: 0.26rem;
  }

  .follow-order-page__available-value {
    font-weight: 700;
    color: @blue;
  }

  .follow-order-page__available-transfer {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 0.44rem;
    height: 0.44rem;
    padding: 0;
    margin-left: 0.04rem;
    border: none;
    border-radius: 50%;
    background: @btn-gradient;
    box-shadow: 0 0.04rem 0.1rem rgba(26, 55, 253, 0.22);
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease;

    &:active {
      transform: scale(0.92);
      box-shadow: 0 0.02rem 0.06rem rgba(26, 55, 253, 0.16);
    }
  }

  .follow-order-page__available-transfer-icon {
    font-size: 0.22rem;
    color: #fff;
    line-height: 1;
  }

  .follow-order-page__action-card {
    .card();
    padding: 0.28rem;
  }

  .follow-order-page__update-status {
    display: flex;
    align-items: center;
    gap: 0.1rem;
    margin-bottom: 0.2rem;
    font-size: 0.28rem;
    font-weight: 700;
    color: @blue;
  }

  .follow-order-page__update-icon {
    font-size: 0.32rem;
    color: @blue;
  }

  .follow-order-page__join-bar {
    display: flex;
    align-items: center;
    gap: 0.16rem;
  }

  .follow-order-page__join-input {
    flex: 1;
    min-width: 0;
    height: 0.8rem;
    padding: 0 0.24rem;
    border: none;
    border-radius: 0.4rem;
    background: @input-bg;
    color: @text;
    font-size: 0.26rem;
    outline: none;

    &::placeholder {
      color: #b0b8cc;
    }
  }



  .follow-order-page__join-tip {
    margin-top: 0.2rem;
    font-size: 0.22rem;
    color: @label;
    line-height: 1.4;
  }

  .follow-order-page__transfer-btn {
    display: block;
    width: 100%;
    margin-top: 0.28rem;
    height: 0.92rem;
    border: none;
    border-radius: 0.46rem;
    background: @btn-gradient;
    color: @white;
    font-size: 0.32rem;
    font-weight: 700;
    box-shadow: 0 0.08rem 0.24rem rgba(26, 55, 253, 0.25);
        &:disabled {
      background: #d8dde8;
      color: @white;
    }
  }

  /* 确认弹窗 315×264 */
  @confirm-w: 315px;
  @confirm-h: 264px;

  .follow-order-page__confirm-shell {
    position: relative;
  }

  .follow-order-page__confirm {
    width: 315px;
    height: 264px;
    box-sizing: border-box;
    padding: 32px 24px 24px;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    border-radius: 24px;
    background: linear-gradient(145deg, #e2d3fc 0%, #fff 38%, #fff 72%, #c5edfd 100%);
    box-shadow: 0 8px 24px rgba(51, 102, 255, 0.18);
    text-align: left;
  }

  .follow-order-page__confirm-close {
    position: absolute;
    top: -.42rem;
    right: .2rem;
    z-index: 3;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: linear-gradient(145deg, @blue 0%, #4d8bff 52%, #8ed4ff 100%);
    box-shadow: 0 2px 8px rgba(26, 55, 253, 0.35);
    transform: translate(50%, -50%);
    cursor: pointer;

    &:active {
      opacity: 0.88;
      transform: translate(50%, -50%) scale(0.94);
    }
  }

  .follow-order-page__confirm-title {
    margin-bottom: 4px;
    font-size: 18px;
    font-weight: 700;
    text-align: center;
    color: @text;
  }

  .follow-order-page__confirm-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: center;
    gap: 16px;
    width: 100%;
    padding: 8px 0 12px;
  }

  .follow-order-page__confirm-row {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    font-size: 15px;
    line-height: 21px;
    text-align: left;
  }

  .follow-order-page__confirm-label {
    flex-shrink: 0;
    color: @text;
    font-weight: 500;
  }

  .follow-order-page__confirm-value {
    color: @blue;
    font-weight: 700;
    word-break: break-all;
  }

  .follow-order-page__confirm-actions {
    display: flex;
    gap: 12px;
  }

  .follow-order-page__confirm-btn {
    flex: 1;
    height: 44px;
    border-radius: 22px;
    font-size: 15px;
    font-weight: 700;

    &--cancel {
      border: 1px solid @blue;
      background: @white;
      color: @blue;
    }

    &--ok {
      border: none;
      color: @white;
      background: @btn-gradient;
      box-shadow: 0 3px 10px rgba(26, 55, 253, 0.28);

      &:disabled {
        opacity: 0.6;
      }
    }
  }
</style>

<style lang="less">
  .follow-order-page__confirm-overlay {
    background: rgba(0, 0, 0, 0.45) !important;
  }

  .follow-order-page__confirm-popup.van-popup,
  .follow-order-page__confirm-popup .van-popup__content {
    overflow: visible !important;
    background: transparent !important;
  }

  .follow-order-page__confirm-popup .van-popup__content {
    padding: 16px 16px 0 0 !important;
    box-sizing: content-box !important;
  }
</style>
