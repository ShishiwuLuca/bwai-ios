<template>
  <ConfigProvider theme="light">
    <PageWrap class="follow-order-detail">
      <NavBar :title="t('od_title')" left-arrow fixed placeholder :border="false">
        <template #right>
          <Icon name="chat-o" :size="28" @click="$router.push('/Notice')" />
        </template>
      </NavBar>

      <div class="follow-order-detail__content mt-1">
        <div class="follow-order-detail__tabs">
          <span
            v-for="tab in statusTabs"
            :key="tab.value"
            class="follow-order-detail__tab"
            :class="{ 'follow-order-detail__tab--active': activeStatus === tab.value }"
            @click="changeStatus(tab.value)"
          >
            {{ tab.label }}
          </span>
        </div>

        <button type="button" class="follow-order-detail__filter" @click="showTypePopup = true">
          <span>{{ activeTypeLabel }}</span>
          <Icon name="arrow-down" />
        </button>

        <PullRefresh v-model="refreshing" class="follow-order-detail__refresh" @refresh="onRefresh">
          <List v-model:loading="loading" :immediate-check="false" :finished="finished" @load="onLoad">
            <template #finished>
              <div v-if="!orderList.length" class="follow-order-detail__empty">
                <Icon name="orders-o" />
                <span>{{ t('fo_order_empty') }}</span>
              </div>
              <span v-else class="follow-order-detail__finished">{{ t('no_more') }}</span>
            </template>

            <div class="follow-order-detail__list">
              <div v-for="item in orderList" :key="item.id" class="follow-order-detail__card">
                <div class="follow-order-detail__card-head">
                  <span class="follow-order-detail__plan-name">{{ item.planName }}</span>
                  <span
                    class="follow-order-detail__status"
                    :class="`follow-order-detail__status--${item.statusKey}`"
                  >
                    {{ item.statusText }}
                  </span>
                </div>

                <div class="follow-order-detail__split"></div>

                <div v-for="row in item.rows" :key="row.label" class="follow-order-detail__row">
                  <span class="follow-order-detail__label">{{ row.label }}</span>
                  <span
                    class="follow-order-detail__value"
                    :class="{
                      'follow-order-detail__value--code': row.type === 'code',
                      'follow-order-detail__value--muted': String(row.value).startsWith('--')
                    }"
                  >
                    {{ row.value }}
                  </span>
                </div>

                <div class="follow-order-detail__foot">
                  <button
                    type="button"
                    class="follow-order-detail__action-btn"
                    :class="{ 'follow-order-detail__action-btn--disabled': item.cancelBtn.disabled }"
                    :disabled="item.cancelBtn.disabled || cancelingOrderNo === item.orderNo"
                    @click="onCancelOrder(item)"
                  >
                    {{ cancelingOrderNo === item.orderNo ? t('fo_order_processing') : item.cancelBtn.text }}
                  </button>
                  <button v-if="item.planStatus == 1" type="button" class="follow-order-detail__detail-btn" @click="goPlanDetail(item)">
                    {{ t('fo_strategy_detail') }}
                  </button>
                </div>
              </div>
            </div>
          </List>
        </PullRefresh>
      </div>

      <Popup v-model:show="showTypePopup" round position="bottom" class="follow-order-detail__type-popup">
        <div class="follow-order-detail__type-panel">
          <div class="follow-order-detail__type-head">
            <span>{{ t('fo_select_plan') }}</span>
            <button type="button" class="follow-order-detail__type-close" @click="showTypePopup = false">
              <Icon name="cross" :size="14" />
            </button>
          </div>
          <div class="follow-order-detail__type-list">
            <button
              v-for="item in planOptions"
              :key="item.value ?? 'all'"
              type="button"
              class="follow-order-detail__type-item"
              :class="{ 'follow-order-detail__type-item--active': activePlanId === item.value }"
              @click="selectPlan(item.value)"
            >
              {{ item.label }}
            </button>
          </div>
        </div>
      </Popup>
    </PageWrap>
  </ConfigProvider>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref, watch } from 'vue';
  import { useRouter } from 'vue-router';
  import { NavBar, PageWrap } from '/@/components';
  import { Icon, Popup, PullRefresh, List, ConfigProvider } from 'vant';
  import { getTradePlanPage, getTradeOrderPage, cancelTradeOrder } from '/@/service/TradePlan';
  import { TimeToFormat } from '/@/utils/TimeZone';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useSystemStoreWithOut } from '/@/stores/modules/SystemConfig';

  type StatusTabValue = 'all' | 'pending' | 'settled';

  interface StatusTab {
    label: string;
    value: StatusTabValue;
    status?: number;
  }

  interface CancelBtn {
    text: string;
    disabled: boolean;
  }

  interface OrderRow {
    label: string;
    value: string;
    type?: 'code';
  }

  interface OrderItem {
    id: number | string;
    orderNo: string;
    planId?: number | string;
    planName: string;
    statusKey: string;
    statusText: string;
    cancelBtn: CancelBtn;
    rows: OrderRow[];
    planStatus: number;
  }

  interface PlanOption {
    label: string;
    value: number | null;
  }

  const { CreateSuccessToast, CreateErrorToast, CreateConfirmDialog } = useMessage();
  const { t } = useI18n();
  const router = useRouter();
  const SystemStore = useSystemStoreWithOut();

  const statusTabs = computed((): StatusTab[] => [
    { label: t('common_action_sendall'), value: 'all' },
    { label: t('fo_order_tab_pending'), value: 'pending', status: 0 },
    { label: t('fo_order_tab_settled'), value: 'settled', status: 2 }
  ]);

  const statusKeyMap: Record<number, string> = { 0: 'pending', 2: 'settled', 3: 'cancelled' };

  const getCancelBtn = (item: any): CancelBtn => {
    const status = Number(item.status);
    const btnMap: Record<number, CancelBtn> = {
      0: { text: t('fo_order_cancel'), disabled: false },
      1: { text: t('fo_order_cancel'), disabled: false },
      2: { text: t('fo_order_tab_settled'), disabled: true },
      3: { text: t('fo_order_status_cancelled'), disabled: true }
    };
    return btnMap[status] || { text: item.statusDesc || '--', disabled: true };
  };

  const pageSize = 10;
  const activeStatus = ref<StatusTabValue>('all');
  const activePlanId = ref<number | null>(null);
  const showTypePopup = ref(false);
  const orderList = ref<OrderItem[]>([]);
  const rawPlanList = ref<any[]>([]);
  const planOptions = ref<PlanOption[]>([]);
  const refreshing = ref(false);
  const loading = ref(false);
  const finished = ref(false);
  const cancelingOrderNo = ref('');
  const pageNo = ref(1);

  const activeTypeLabel = computed(
    () => planOptions.value.find((item) => item.value === activePlanId.value)?.label || t('common_action_sendall')
  );

  const buildPlanOptions = (): PlanOption[] => [
    { label: t('common_action_sendall'), value: null },
    ...rawPlanList.value.map((item: any) => ({ label: item.name, value: item.id }))
  ];

  const formatTime = (time: any) => {
    const n = Number(time);
    if (!n) return '--';
    return TimeToFormat(n < 1e12 ? n * 1000 : n, 'YYYY/MM/DD HH:mm');
  };

  const buildOrderRows = (item: any): OrderRow[] => {
    const symbol = item.symbol || 'USDT';
    const pending = Number(item.status) === 0;
    const amount = item.followAmount != null && item.followAmount !== '' ? `${item.followAmount} ${symbol}` : '--';
    const rows: OrderRow[] = [{ label: t('fo_strategy_name'), value: item.codeName || item.planName || '--' }];

    if (item.showFollowCode && item.followCode) {
      rows.push({ label: t('fo_strategy_code'), value: item.followCode, type: 'code' });
    }

    rows.push({ label: t('fo_order_strategy_amount'), value: amount });
    rows.push({
      label: pending ? t('fo_expected_rate') : t('fo_order_rate'),
      value: item.rateText || '--'
    });
    rows.push({ label: t('fo_order_profit'), value: item.profitText || '--' });
    rows.push({ label: t('fo_order_time'), value: formatTime(item.orderTime) });
    rows.push({ label: t('fo_settle_time'), value: formatTime(item.displaySettleTime) });
    return rows;
  };

  const mapOrderItem = (item: any): OrderItem => ({
    id: item.id,
    orderNo: item.orderNo,
    planId: item.planId,
    planStatus:item.planStatus,
    planName: item.planName || '--',
    statusKey: statusKeyMap[Number(item.status)] || 'default',
    statusText: item.statusDesc || '--',
    cancelBtn: getCancelBtn(item),
    rows: buildOrderRows(item)
  });

  const fetchPlanOptions = () => {
    getTradePlanPage({ pageNo: 1, pageSize: 50, offset: 0 }).then((res: any) => {
      if (Number(res?.code) !== 0) return;
      rawPlanList.value = res?.data?.list || [];
      planOptions.value = buildPlanOptions();
    });
  };

  const fetchOrders = (isLoadMore = false) => {
    const tab = statusTabs.value.find((item) => item.value === activeStatus.value);
    const params: Record<string, any> = { pageNo: pageNo.value, pageSize, offset: 0 };
    if (tab?.status != null) params.status = tab.status;
    if (activePlanId.value != null) params.planId = activePlanId.value;

    getTradeOrderPage(params)
      .then((res: any) => {
        if (Number(res?.code) !== 0) {
          if (!isLoadMore) orderList.value = [];
          finished.value = true;
          return;
        }
        const list = (res?.data?.list || []).map(mapOrderItem);
        orderList.value = isLoadMore ? [...orderList.value, ...list] : list;
        finished.value = list.length < pageSize;
      })
      .catch(() => {
        if (!isLoadMore) orderList.value = [];
        finished.value = true;
      })
      .finally(() => {
        setTimeout(() => {
          refreshing.value = false;
          loading.value = false;
        }, 300);
      });
  };

  const onRefresh = () => {
    pageNo.value = 1;
    finished.value = false;
    fetchOrders();
  };

  const onLoad = () => {
    loading.value = true;
    pageNo.value += 1;
    fetchOrders(true);
  };

  const changeStatus = (value: StatusTabValue) => {
    activeStatus.value = value;
    onRefresh();
  };

  const selectPlan = (value: number | null) => {
    activePlanId.value = value;
    showTypePopup.value = false;
    onRefresh();
  };

  const goPlanDetail = (item: OrderItem) => {
    if (!item?.planId) return;
    router.push({ name: 'followOrder', query: { planId: String(item.planId) } });
  };

  const onCancelOrder = async (item: OrderItem) => {
    if (!item?.orderNo || item.cancelBtn?.disabled || cancelingOrderNo.value === item.orderNo) return;
    try {
      await CreateConfirmDialog({
        title: t('fo_cancel_confirm_title'),
        message: t('fo_cancel_confirm_msg'),
        confirmButtonText: t('common_text_btnConfirm'),
        cancelButtonText: t('common_text_btnCancel')
      });
    } catch {
      return;
    }

    cancelingOrderNo.value = item.orderNo;
    cancelTradeOrder({ orderNo: item.orderNo })
      .then((res: any) => {
        if (Number(res?.code) !== 0) {
          CreateErrorToast(res?.msg || t('fo_cancel_fail'));
          return;
        }
        CreateSuccessToast(t('fo_cancel_success'));
        onRefresh();
      })
      .catch((e: any) => CreateErrorToast(e?.msg || e?.message || t('fo_cancel_fail')))
      .finally(() => {
        cancelingOrderNo.value = '';
      });
  };

  watch(
    () => SystemStore.getLocaleInfo?.locale,
    () => {
      planOptions.value = buildPlanOptions();
      onRefresh();
    }
  );

  onMounted(() => {
    fetchPlanOptions();
    onRefresh();
  });
</script>

<style scoped lang="less">
  @blue: #1a37fd;
  @text: #000;
  @label: #999;
  @value: #333;
  @white: #fff;
  @border: #e8ecf5;
  @shadow: 0 0.04rem 0.2rem rgba(51, 102, 255, 0.08);
  @btn-gradient: linear-gradient(180deg, #92b6ff 0%, #2a61f9 100%);

  .follow-order-detail {
    min-height: 100vh;
    color: @text;
  }

  .follow-order-detail__content {
    display: flex;
    flex-direction: column;
    height: calc(100vh - var(--van-nav-bar-height));
    padding: 0 0.32rem 0.24rem;
  }

  /* 状态 Tab 胶囊 */
  .follow-order-detail__tabs {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 0.08rem;
    margin-bottom: 0.2rem;
    padding: 0.08rem;
    border-radius: 0.4rem;
    background: #e8edf8;
  }

  .follow-order-detail__tab {
    flex: 1;
    height: 0.64rem;
    line-height: 0.64rem;
    border-radius: 0.32rem;
    font-size: 0.26rem;
    font-weight: 500;
    color: @label;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;

    &--active {
      font-weight: 700;
      color: @blue;
      background: #e3eaff;
      box-shadow:
        inset 0 0 10px 0 #fff,
        0 2px 2px 0 rgba(26, 55, 253, 0.2);
    }
  }

  .follow-order-detail__filter {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    align-self: flex-end;
    gap: 0.06rem;
    height: 0.52rem;
    margin-bottom: 0.2rem;
    padding: 0 0.2rem;
    border: 1px solid @border;
    border-radius: 0.26rem;
    background: @white;
    color: @value;
    font-size: 0.24rem;

    :deep(.van-icon) {
      font-size: 0.2rem;
      color: @label;
    }
  }

  .follow-order-detail__refresh {
    flex: 1;
    min-height: 0;
    overflow: auto;
  }

  .follow-order-detail__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.2rem;
    padding: 1.2rem 0;
    font-size: 0.28rem;
    color: @label;

    :deep(.van-icon) {
      font-size: 1rem;
      opacity: 0.45;
    }
  }

  .follow-order-detail__finished {
    display: block;
    padding: 0.24rem 0 0.4rem;
    font-size: 0.24rem;
    color: @label;
    text-align: center;
  }

  .follow-order-detail__list {
    display: flex;
    flex-direction: column;
    gap: 0.24rem;
    padding-bottom: 0.24rem;
  }

  /* 订单卡片 */
  .follow-order-detail__card {
    padding: 0.28rem;
    border-radius: 0.24rem;
    background: @white;
    box-shadow: @shadow;
  }

  .follow-order-detail__card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.2rem;
  }

  .follow-order-detail__plan-name {
    font-size: 0.3rem;
    font-weight: 700;
    color: @text;
  }

  .follow-order-detail__status {
    flex-shrink: 0;
    min-width: 1rem;
    padding: 0.06rem 0.16rem;
    border-radius: 0.08rem;
    font-size: 0.22rem;
    font-weight: 600;
    text-align: center;

    &--pending {
      color: #2e9e5a;
      background: #e8f8ef;
    }

    &--settled {
      color: #e54545;
      background: #fdeeee;
    }

    &--cancelled,
    &--default {
      color: @label;
      background: #f2f3f5;
    }
  }

  .follow-order-detail__split {
    margin: 0.18rem 0 0.04rem;
    border-bottom: 1px dashed #dbe6ff;
  }

  .follow-order-detail__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.24rem;
    padding: 0.2rem 0;
    border-bottom: 1px solid @border;
    font-size: 0.26rem;

    &:last-of-type {
      border-bottom: none;
    }
  }

  .follow-order-detail__label {
    flex-shrink: 0;
    color: @label;
  }

  .follow-order-detail__value {
    text-align: right;
    font-weight: 500;
    color: @value;
    word-break: break-word;

    &--code {
      color: @blue;
      font-weight: 700;
    }

    &--muted {
      color: #b0b8cc;
    }
  }

  .follow-order-detail__foot {
    margin-top: 0.24rem;
  }

  .follow-order-detail__action-btn {
    display: block;
    width: 100%;
    height: 0.8rem;
    margin-bottom: 0.12rem;
    border: none;
    border-radius: 0.4rem;
    background: @btn-gradient;
    color: @white;
    font-size: 0.28rem;
    font-weight: 700;
    box-shadow: 0 0.06rem 0.18rem rgba(42, 97, 249, 0.28);

    &--disabled,
    &:disabled {
      color: @label;
      background: #e8edf5;
      box-shadow: none;
    }
  }

  .follow-order-detail__detail-btn {
    display: block;
    width: 100%;
    padding: 0.12rem 0;
    border: none;
    background: transparent;
    font-size: 0.26rem;
    font-weight: 500;
    color: @blue;
    text-align: center;
  }

  /* 计划筛选弹窗 */
  .follow-order-detail__type-panel {
    padding: 0.28rem 0.32rem calc(0.32rem + env(safe-area-inset-bottom, 0px));
    background: @white;
  }

  .follow-order-detail__type-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.2rem;
    padding-bottom: 0.16rem;
    border-bottom: 1px solid @border;
    font-size: 0.3rem;
    font-weight: 700;
    color: @text;
  }

  .follow-order-detail__type-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 0.44rem;
    height: 0.44rem;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: #f2f4f8;
    color: @label;
  }

  .follow-order-detail__type-list {
    display: flex;
    flex-direction: column;
    gap: 0.12rem;
    max-height: 50vh;
    overflow-y: auto;
  }

  .follow-order-detail__type-item {
    width: 100%;
    height: 0.76rem;
    padding: 0 0.24rem;
    border: 1px solid @border;
    border-radius: 0.16rem;
    background: @white;
    font-size: 0.26rem;
    color: @value;
    text-align: left;

    &--active {
      border-color: @blue;
      background: #f3f6ff;
      color: @blue;
      font-weight: 600;
    }
  }
</style>
