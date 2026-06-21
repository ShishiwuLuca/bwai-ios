<template>
  <ConfigProvider theme="light">
  <PageWrap class="order-page">
    <NavBar :title="t('od_title')" left-arrow fixed placeholder :border="false" />

    <div class="order-page__content">
        <div class="order-page__tabs">
          <span
            v-for="item in statusTabs"
            :key="item.value"
            class="order-page__tab"
            :class="{ 'order-page__tab--active': activeStatus === item.value }"
            @click="onStatusChange(item.value)"
          >
            {{ item.label }}
          </span>
        </div>

        <button class="order-page__type-btn" type="button" @click="showTypePopup = true">
          <span>{{ activeTypeLabel }}</span>
          <Icon name="arrow-down" class="order-page__type-arrow" />
        </button>

      <div class="order-page__list">
        <template v-if="displayList.length === 0">
          <div class="order-page__empty">
            <Icon name="orders-o" class="order-page__empty-icon" />
            <span class="order-page__empty-text">{{ t('od_no_data') }}</span>
          </div>
        </template>
        <template v-else>
            <div v-for="(item, i) in displayList" :key="i" class="order-page__card">
            <div class="order-page__card-head">
              <span class="order-page__card-tag">{{
                  typeList.find((type) => type.id === item.productType)?.name || item.productTypeName
              }}</span>
              <span
                class="order-page__card-status"
                :class="`order-page__card-status--${getOrderStatusClass(item.orderStatus)}`"
              >
                {{ getOrderStatusText(item.orderStatus) }}
              </span>
            </div>

            <div class="order-page__card-split"></div>

            <div class="order-page__card-row order-page__card-row--title">
              <span class="order-page__card-name">{{ item.productName }}</span>
                <span v-if="item.isValidUser === 0" class="order-page__card-exp">{{
                  t('od_tag_experience')
              }}</span>
            </div>

            <div class="order-page__card-row">
              <span class="order-page__label">{{ t('od_period_day') }}</span>
              <span class="order-page__value">{{ item.lockDay }}{{ t('od_day_unit') }}</span>
            </div>
              <div v-if="item.orderStatus == 1 || item.orderStatus == 2" class="order-page__card-row">
              <span class="order-page__label">{{ t('od_est_daily_rate') }}</span>
              <span class="order-page__value">{{
                item.gainDayRateMinStr == item.gainDayRateMaxStr
                  ? item.gainDayRateMinStr
                  : item.gainDayRateMinStr + '-' + item.gainDayRateMaxStr
              }}</span>
            </div>
            <div class="order-page__card-row">
              <span class="order-page__label">{{ t('od_invest_amount') }}</span>
                <span class="order-page__value order-page__value--accent">{{ item.buyAmount }} USDT</span>
            </div>
            <div class="order-page__card-row">
              <span class="order-page__label">{{ t('ai_invest_total_profit') }}</span>
                <span class="order-page__value order-page__value--accent">{{ item.pendingGainAmount }} USDT</span>
            </div>

            <div
                v-if="item.productReinvest !== 0 && showSmartReinvestRow(item.orderStatus)"
              class="order-page__card-row"
            >
              <span class="order-page__label order-page__label--accent">
                {{ t('od_smart_reinvest') }}
                <span class="order-page__label-icon-wrap" @click.stop="onReinvestTip">
                  <Icon name="question-o" class="order-page__label-icon" />
                </span>
              </span>
              <span class="order-page__value">
                <Switch
                  :model-value="item.orderReinvest === 1"
                  size="18"
                  :disabled="reinvestLoadingOrderId === item.orderId"
                  @update:model-value="(checked) => onReinvestChange(item, checked)"
                />
              </span>
            </div>
            <div class="order-page__card-row">
              <span class="order-page__label">{{ t('od_invest_time') }}</span>
              <span class="order-page__value">{{ item.buyTimeStr }}</span>
            </div>
              <div v-if="item.orderStatus == 3 || item.orderStatus == 4" class="order-page__card-row">
              <span class="order-page__label">{{ t('od_redemption_time') }}</span>
              <span class="order-page__value">{{ item.redemptionTimeStr }}</span>
            </div>

              <button type="button" class="order-page__btn" @click="viewDetail(item)">
              {{ t('mo_view') }}
              </button>
            </div>
        </template>
      </div>
    </div>

      <nav class="order-page__dock" :aria-label="t('od_tab_order')">
        <div class="order-page__dock-inner">
          <button type="button" class="order-page__dock-tab" @click="goInvest">
            <img :src="AI1" alt="" class="order-page__dock-icon" />
        <span>{{ t('od_tab_invest') }}</span>
          </button>
          <button type="button" class="order-page__dock-tab order-page__dock-tab--active">
            <Icon name="notes-o" class="order-page__dock-van-icon" />
            <span>{{ t('od_tab_order') }}</span>
          </button>
        </div>
      </nav>

    <Popup
      :show="showTypePopup"
        class="order-page__type-popup-wrap"
      round
      position="bottom"
      @update:show="(v) => (showTypePopup = v)"
    >
      <div class="order-page__type-popup">
        <div class="order-page__type-popup-title">{{ t('mo_select_type') }}</div>
        <div class="order-page__type-popup-list">
          <button
            type="button"
            class="order-page__type-popup-item"
            :class="{ 'order-page__type-popup-item--active': activeTypeId === null }"
            @click="onTypeSelect(null)"
          >
            {{ t('mo_all') }}
          </button>
          <button
              v-for="typeItem in typeList"
              :key="typeItem.id"
            type="button"
            class="order-page__type-popup-item"
              :class="{ 'order-page__type-popup-item--active': activeTypeId === typeItem.id }"
              @click="onTypeSelect(typeItem.id)"
          >
              {{ typeItem.name }}
          </button>
        </div>
      </div>
    </Popup>
  </PageWrap>
  </ConfigProvider>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { NavBar, PageWrap } from '/@/components';
  import { Icon, Popup, Switch, ConfigProvider } from 'vant';
  import AI1 from '/@/assets/images/AI/touzi.png';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { getOrderPage, orderReinvest, type AppOrderRespVO } from '/@/service/Order';
  import { getTypeList, type AppTypeRespVO } from '/@/service/Type';

  const router = useRouter();
  const { CreateSuccessToast, CreateErrorToast, CreateConfirmDialog } = useMessage();
  const { t } = useI18n();

  type StatusTab = 'all' | 'running' | 'done' | 'forced';

  const getOrderStatusText = (status: number) => {
    const map: Record<number, string> = {
      1: t('od_status_running'),
      2: t('od_status_running'),
      3: t('od_status_done'),
      4: t('od_status_forced')
    };
    return map[status] ?? t('od_status_ended');
  };

  const getOrderStatusClass = (status: number): string => {
    const map: Record<number, string> = {
      1: 'running',
      2: 'running',
      3: 'done',
      4: 'forced'
    };
    return map[status] ?? 'ended';
  };

  const showSmartReinvestRow = (orderStatus: number | undefined): boolean => {
    return Number(orderStatus) === 1 || Number(orderStatus) === 2;
  };

  const statusTabs = computed<{ label: string; value: StatusTab }[]>(() => [
    { label: t('mo_all'), value: 'all' },
    { label: t('od_status_running'), value: 'running' },
    { label: t('od_status_done'), value: 'done' }
  ]);

  const activeStatus = ref<StatusTab>('all');

  const statusMap: Record<StatusTab, number | undefined> = {
    all: undefined,
    running: 1,
    done: 3,
    forced: 4
  };

  const typeList = ref<AppTypeRespVO[]>([]);
  const activeTypeId = ref<number | null>(null);
  const showTypePopup = ref(false);

  const activeTypeLabel = computed(() => {
    if (activeTypeId.value == null) return t('mo_all');
    const found = typeList.value.find((item) => item.id === activeTypeId.value);
    return found?.name || t('mo_all');
  });

  const orders = ref<AppOrderRespVO[]>([]);
  const loading = ref(false);
  const reinvestLoadingOrderId = ref<number | null>(null);
  const displayList = computed(() => orders.value);

  const fetchTypeList = () => {
    getTypeList()
      .then((res) => {
        typeList.value = (res?.data || []) as AppTypeRespVO[];
      })
      .catch(() => {
        typeList.value = [];
      });
  };

  onMounted(() => {
    void fetchTypeList();
    void fetchOrders();
  });

  const fetchOrders = () => {
    if (loading.value) return;
    loading.value = true;
    getOrderPage({
      pageNo: 1,
      pageSize: 20,
      orderStatus: statusMap[activeStatus.value],
      productType: activeTypeId.value ?? undefined,
      offset: 0
    })
      .then((res) => {
        orders.value = res?.code === 0 && res.data ? res.data.list || [] : [];
      })
      .catch(() => {
        orders.value = [];
      })
      .finally(() => {
        loading.value = false;
      });
  };

  const onStatusChange = (value: StatusTab) => {
    activeStatus.value = value;
    void fetchOrders();
  };

  const onTypeSelect = (id: number | null) => {
    activeTypeId.value = id;
    showTypePopup.value = false;
    void fetchOrders();
  };

  const onReinvestChange = (item: AppOrderRespVO, checked: boolean) => {
    if (!item?.orderId) return;
    if (reinvestLoadingOrderId.value === item.orderId) return;
    const next = checked ? 1 : 0;
    const prev = item.orderReinvest;
    item.orderReinvest = next;
    reinvestLoadingOrderId.value = item.orderId;
    orderReinvest({ orderId: item.orderId, orderReinvest: next })
      .then((res) => {
        if (res?.code === 0) {
          CreateSuccessToast(next === 1 ? t('od_reinvest_on') : t('od_reinvest_off'));
        } else {
          item.orderReinvest = prev;
          CreateErrorToast(res?.msg || t('od_op_fail'));
        }
      })
      .catch((e: unknown) => {
        item.orderReinvest = prev;
        const msg =
          (
            e as {
              msg?: string;
            }
          )?.msg ?? t('od_op_fail');
        CreateErrorToast(msg);
      })
      .finally(() => {
        reinvestLoadingOrderId.value = null;
      });
  };

  const onReinvestTip = () => {
    CreateConfirmDialog({
      title: t('ab_tip_title'),
      message: t('od_reinvest_tip'),
      confirmButtonText: t('confirm'),
      cancelButtonText: t('cancel')
    }).catch(() => {});
  };

  const viewDetail = (item: AppOrderRespVO) => {
    void router.push({ name: 'OrderDetails', query: { id: item.orderId } });
  };

  const goInvest = () => {
    history.back();
  };
</script>

<style scoped lang="less">
  @blue: #1a37fd;
  @text: #000;
  @label: #8c93a6;
  @value: #222;
  @white: #fff;
  @border: #e8ecf5;
  @shadow: 0 0.04rem 0.2rem rgba(51, 102, 255, 0.08);
  @btn-gradient: linear-gradient(180deg, #92b6ff 0%, #2a61f9 100%);

  .order-page {
    --order-dock-offset: calc(1.08rem + env(safe-area-inset-bottom, 0px));
    min-height: 100vh;
    padding-bottom: var(--order-dock-offset);
    color: @text;
  }

  .order-page__content {
    padding: 0.24rem 0.32rem calc(0.32rem + var(--order-dock-offset));
  }

  .order-page__tabs {
    display: flex;
    align-items: center;
    gap: 0.08rem;
    margin-bottom: 0.2rem;
    padding: 0.08rem;
    border-radius: 0.4rem;
    background: #e8edf8;
  }

  .order-page__tab {
    flex: 1;
    height: 0.64rem;
    line-height: 0.64rem;
    border-radius: 0.32rem;
    font-size: 0.28rem;
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

  .order-page__type-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.06rem;
    height: 0.52rem;
    margin-bottom: 0.2rem;
    padding: 0 0.2rem;
    border: 1px solid @border;
    border-radius: 0.26rem;
    background: @white;
    color: #666;
    font-size: 0.26rem;
    font-weight: 500;
    cursor: pointer;
  }

  .order-page__type-arrow {
    font-size: 0.2rem;
    color: @label;
  }

  .order-page__list {
    display: flex;
    flex-direction: column;
    gap: 0.24rem;
  }

  .order-page__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 1.2rem 0;
    color: @label;
  }

  .order-page__empty-icon {
    font-size: 1.2rem;
    margin-bottom: 0.24rem;
    opacity: 0.45;
  }

  .order-page__empty-text {
    font-size: 0.28rem;
    color: @label;
  }

  .order-page__card {
    padding: 0.28rem 0.28rem 0.24rem;
    border-radius: 0.24rem;
    background: @white;
    box-shadow: @shadow;
  }

  .order-page__card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.2rem;
    margin-bottom: 0.14rem;
  }

  .order-page__card-tag {
    font-size: 0.26rem;
    font-weight: 500;
    color: @blue;
    line-height: 1.3;
  }

  .order-page__card-status {
    flex-shrink: 0;
    min-width: 1rem;
    padding: 0.06rem 0.14rem;
    border-radius: 0.08rem;
    font-size: 0.22rem;
    font-weight: 600;
    line-height: 1.3;
    text-align: center;

    &--running {
      color: @blue;
      background: #e8f0ff;
    }

    &--done {
      color: #2e9e5a;
      background: #e8f8ef;
    }

    &--forced {
      color: #e58a00;
      background: #fff4e5;
    }

    &--ended {
      color: @label;
      background: #f2f3f5;
    }
  }

  .order-page__card-split {
    margin-bottom: 0.14rem;
    border-bottom: 1px dashed #dbe6ff;
  }

  .order-page__card-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.24rem;
    padding: 0.2rem 0;
    border-bottom: 1px solid @border;

    &:last-of-type {
      border-bottom: none;
    }

    &--title {
      padding: 0.04rem 0 0.16rem;
      border-bottom: none;
    }
  }

  .order-page__card-name {
    font-size: 0.32rem;
    font-weight: 700;
    color: @text;
    line-height: 1.35;
  }

  .order-page__card-exp {
    flex-shrink: 0;
    padding: 0.04rem 0.12rem;
    border-radius: 0.08rem;
    background: @blue;
    color: @white;
    font-size: 0.2rem;
    font-weight: 600;
    line-height: 1.3;
  }

  .order-page__label {
    flex-shrink: 0;
    font-size: 0.24rem;
    font-weight: 400;
    color: @label;
    line-height: 1.4;

    &--accent {
    display: inline-flex;
    align-items: center;
    gap: 0.06rem;
      font-size: 0.26rem;
      font-weight: 500;
      color: @blue;
    }
  }

  .order-page__label-icon-wrap {
    display: inline-flex;
    align-items: center;
    cursor: pointer;
  }

  .order-page__label-icon {
    font-size: 0.28rem;
    color: @blue;
  }

  .order-page__value {
    text-align: right;
    font-size: 0.26rem;
    font-weight: 600;
    color: @value;
    line-height: 1.4;
    word-break: break-word;

    &--accent {
      color: @blue;
      font-weight: 700;
    }

    :deep(.van-switch--on) {
      background: @blue;
    }
  }

  .order-page__btn {
    display: block;
    width: 100%;
    height: 0.8rem;
    margin-top: 0.2rem;
    border: none;
    border-radius: 0.4rem;
    background: @btn-gradient;
    color: @white;
    font-size: 0.3rem;
    font-weight: 700;
    letter-spacing: 0.01em;
    box-shadow: 0 0.06rem 0.18rem rgba(42, 97, 249, 0.28);
    cursor: pointer;
  }

  .order-page__type-popup {
    padding: 0.28rem 0.32rem calc(0.32rem + env(safe-area-inset-bottom, 0px));
    background: @white;
  }

  .order-page__type-popup-title {
    margin-bottom: 0.2rem;
    padding-bottom: 0.16rem;
    border-bottom: 1px solid @border;
    font-size: 0.3rem;
    font-weight: 700;
    color: @text;
    text-align: center;
  }

  .order-page__type-popup-list {
    display: flex;
    flex-direction: column;
    gap: 0.12rem;
    max-height: 50vh;
    overflow-y: auto;
  }

  .order-page__type-popup-item {
    width: 100%;
    height: 0.76rem;
    padding: 0 0.24rem;
    border: 1px solid @border;
    border-radius: 0.16rem;
    background: @white;
    font-size: 0.28rem;
    color: @value;
    text-align: left;

    &--active {
      border-color: @blue;
      background: #f3f6ff;
      color: @blue;
      font-weight: 600;
    }
  }

  .order-page__dock {
    position: fixed;
    left: 0.32rem;
    right: 0.32rem;
    bottom: calc(0.16rem + env(safe-area-inset-bottom, 0px));
    z-index: 11;
  }

  .order-page__dock-inner {
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

  .order-page__dock-tab {
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

  .order-page__dock-icon {
    display: block;
    width: 0.4rem;
    height: 0.4rem;
    object-fit: contain;
    filter: grayscale(1) opacity(0.55);
  }

  .order-page__dock-tab--active .order-page__dock-icon {
    filter: none;
    opacity: 1;
  }

  .order-page__dock-van-icon {
    font-size: 0.4rem;
    color: inherit;
  }

  @media screen and (min-width: 600px) {
    .order-page__dock {
      left: 50%;
      right: auto;
      width: 100%;
      max-width: 8rem;
      transform: translateX(-50%);
    }
  }
</style>

<style lang="less">
  .order-page__type-popup-wrap.van-popup {
    background: #fff;
  }
</style>
