<template>
  <PageWrap class="order-page">
    <NavBar :title="t('od_title')" left-arrow fixed placeholder :border="false" />

    <div class="order-page__content">
      <!-- 顶部筛选：全部 / 进行中 / 已赎回 + 类型下拉 -->
      <div class="order-page__filter">
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
      </div>

      <!-- 订单卡片列表 -->
      <div class="order-page__list">
        <template v-if="displayList.length === 0">
          <div class="order-page__empty">
            <Icon name="orders-o" class="order-page__empty-icon" />
            <span class="order-page__empty-text">{{ t('od_no_data') }}</span>
          </div>
        </template>
        <template v-else>
          <AppCard v-for="(item, i) in displayList" :key="i" class="order-page__card">
            <div class="order-page__card-head">
              <span class="order-page__card-tag">{{
                typeList.find((t) => t.id === item.productType)?.name || item.productTypeName
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
              <span class="order-page__card-tag2">{{
                item.isValidUser === 0 ? t('od_tag_experience') : ''
              }}</span>
            </div>

            <div class="order-page__card-row">
              <span class="order-page__label">{{ t('od_period_day') }}</span>
              <span class="order-page__value">{{ item.lockDay }}{{ t('od_day_unit') }}</span>
            </div>
            <div class="order-page__card-row" v-if="item.orderStatus == 1 || item.orderStatus == 2">
              <span class="order-page__label">{{ t('od_est_daily_rate') }}</span>
              <span class="order-page__value">{{
                item.gainDayRateMinStr == item.gainDayRateMaxStr
                  ? item.gainDayRateMinStr
                  : item.gainDayRateMinStr + '-' + item.gainDayRateMaxStr
              }}</span>
            </div>
            <div class="order-page__card-row">
              <span class="order-page__label">{{ t('od_invest_amount') }}</span>
              <span class="order-page__value">{{ item.buyAmount }} USDT</span>
            </div>
            <div class="order-page__card-row">
              <span class="order-page__label">{{ t('ai_invest_total_profit') }}</span>
              <span class="order-page__value">{{ item.pendingGainAmount }} USDT</span>
            </div>

            <div
              class="order-page__card-row"
              v-if="item.productReinvest !== 0 && showSmartReinvestRow(item.orderStatus)"
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
            <div class="order-page__card-row" v-if="item.orderStatus == 3 || item.orderStatus == 4">
              <span class="order-page__label">{{ t('od_redemption_time') }}</span>
              <span class="order-page__value">{{ item.redemptionTimeStr }}</span>
            </div>
            <Button type="primary" block round class="order-page__btn" @click="viewDetail(item)">
              {{ t('mo_view') }}
            </Button>
          </AppCard>
        </template>
      </div>
    </div>

    <!-- 底部 Tab：投资(跳 AIBuy) / 订单(当前页) -->
    <Tabbar v-model="bottomTab" class="ai-buy-page__bottom-tabbar">
      <TabbarItem name="invest" @click="goInvest">
        <template #icon>
          <img
            :src="AI1"
            alt=""
            class="ai-buy-page__tab-icon"
            :class="{ 'ai-buy-page__tab-icon--active': bottomTab === 'invest' }"
          />
        </template>
        <span>{{ t('od_tab_invest') }}</span>
      </TabbarItem>
      <TabbarItem name="order" icon="notes-o">{{ t('od_tab_order') }}</TabbarItem>
    </Tabbar>

    <!-- 类型选择：从接口动态获取，"全部"查所有 -->
    <Popup
      :show="showTypePopup"
      class="modal !w-full"
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
            v-for="item in typeList"
            :key="item.id"
            type="button"
            class="order-page__type-popup-item"
            :class="{ 'order-page__type-popup-item--active': activeTypeId === item.id }"
            @click="onTypeSelect(item.id)"
          >
            {{ item.name }}
          </button>
        </div>
      </div>
    </Popup>
  </PageWrap>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { NavBar, PageWrap, AppCard } from '/@/components';
  import { Button, Icon, Popup, Switch, Tabbar, TabbarItem } from 'vant';
  import AI1 from '/@/assets/images/AI/touzi.png';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { getOrderPage, orderReinvest, type AppOrderRespVO } from '/@/service/Order';
  import { getTypeList, type AppTypeRespVO } from '/@/service/Type';

  /** 页面路由：跳转订单详情、底部 Tab 返回投资栈 */
  const router = useRouter();

  /** Toast 与二次确认（复投开关失败回滚、说明弹窗等） */
  const { CreateSuccessToast, CreateErrorToast, CreateConfirmDialog } = useMessage();

  /** 国际化文案：状态、筛选、按钮与提示语 */
  const { t } = useI18n();

  /** 顶部状态 Tab 与列表接口 orderStatus 的联合取值 */
  type StatusTab = 'all' | 'running' | 'done' | 'forced';

  /** 将接口 orderStatus 映射为列表卡片上的状态文案 */
  const getOrderStatusText = (status: number) => {
    const map: Record<number, string> = {
      1: t('od_status_running'),
      2: t('od_status_running'),
      3: t('od_status_done'),
      4: t('od_status_forced')
    };
    return map[status] ?? t('od_status_ended');
  };

  /** 将 orderStatus 映射为角标样式类名，用于不同状态配色 */
  const getOrderStatusClass = (status: number): string => {
    const map: Record<number, string> = {
      1: 'running',
      2: 'running',
      3: 'done',
      4: 'forced'
    };
    return map[status] ?? 'ended';
  };

  /**
   * 是否展示「智能复投」行：仅进行中类订单展示，与模板 v-if 一致
   */
  const showSmartReinvestRow = (orderStatus: number | undefined): boolean => {
    return Number(orderStatus) === 1 || Number(orderStatus) === 2;
  };

  // ========== 状态 Tab（全部 / 进行中 / 已赎回 / 强制结束） ==========

  /** 顶部状态筛选 Tab 的标签与取值，供模板 v-for 渲染 */
  const statusTabs = computed<
    {
      label: string;
      value: StatusTab;
    }[]
  >(() => [
    { label: t('mo_all'), value: 'all' },
    { label: t('od_status_running'), value: 'running' },
    { label: t('od_status_done'), value: 'done' }
  ]);

  /** 当前选中的状态 Tab，参与构造 getOrderPage 的 orderStatus */
  const activeStatus = ref<StatusTab>('all');

  /** 与 POST /stake/order/page 入参一致：all 不传、running=1、done=3、forced=4 */
  const statusMap: Record<StatusTab, number | undefined> = {
    all: undefined,
    running: 1,
    done: 3,
    forced: 4
  };

  // ========== 类型筛选（从 /stake/type/list 获取，按 productType id 过滤） ==========

  /** 产品类型列表，来自 getTypeList，用于类型按钮与底部弹窗 */
  const typeList = ref<AppTypeRespVO[]>([]);

  /** 当前选中的产品类型 id；null 表示不按类型筛选（「全部」） */
  const activeTypeId = ref<number | null>(null);

  /** 控制底部「选择产品类型」弹层显隐 */
  const showTypePopup = ref(false);

  /** 类型按钮展示文案：未选具体类型时显示「全部」 */
  const activeTypeLabel = computed(() => {
    if (activeTypeId.value == null) return t('mo_all');
    const found = typeList.value.find((item) => item.id === activeTypeId.value);
    return found?.name || t('mo_all');
  });

  // ========== 订单列表（POST /stake/order/page） ==========

  /** 当前筛选条件下的订单列表（本页第一页数据） */
  const orders = ref<AppOrderRespVO[]>([]);

  /** 列表请求进行中，用于防重复请求与按钮态 */
  const loading = ref(false);

  /** 正在提交复投开关的订单 id，用于 Switch 防连点 */
  const reinvestLoadingOrderId = ref<number | null>(null);

  /** 列表渲染数据源：本页无额外前端过滤时等同于 orders */
  const displayList = computed(() => orders.value);

  /** 底部 Tab：投资 / 订单；本页默认停留在订单 */
  const bottomTab = ref<'invest' | 'order'>('order');

  /** 请求 /stake/type/list 并填充 typeList */
  const fetchTypeList = () => {
    getTypeList()
      .then((res) => {
        typeList.value = (res?.data || []) as AppTypeRespVO[];
      })
      .catch(() => {
        typeList.value = [];
      });
  };

  // ========== 生命周期 ==========

  /** 进入页面时并行拉取类型列表与订单分页 */
  onMounted(() => {
    void fetchTypeList();
    void fetchOrders();
  });

  /** 按状态 Tab、类型筛选请求订单第一页并写入 orders */
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

  /** 切换状态 Tab 后刷新订单列表 */
  const onStatusChange = (value: StatusTab) => {
    activeStatus.value = value;
    void fetchOrders();
  };

  /** 选择产品类型（含「全部」）后关闭弹窗并重新拉单 */
  const onTypeSelect = (id: number | null) => {
    activeTypeId.value = id;
    showTypePopup.value = false;
    void fetchOrders();
  };

  /** 列表行内切换智能复投：调用 orderReinvest，失败时回滚 UI */
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

  /** 点击问号图标：展示智能复投规则说明 */
  const onReinvestTip = () => {
    CreateConfirmDialog({
      title: t('ab_tip_title'),
      message: t('od_reinvest_tip'),
      confirmButtonText: t('confirm'),
      cancelButtonText: t('cancel')
    }).catch(() => {});
  };

  /** 跳转订单详情页（路由 name + query.id） */
  const viewDetail = (item: AppOrderRespVO) => {
    void router.push({ name: 'OrderDetails', query: { id: item.orderId } });
  };

  /** 底部「投资」Tab：返回上一页以进入投资流程 */
  const goInvest = () => {
    history.back();
  };
</script>

<style scoped lang="less">
  /* ---------- 页面与内容区 ---------- */
  .order-page {
    min-height: 100vh;
    padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
    color: var(--van-text-color);
  }

  .order-page__content {
    padding: 0.32rem 0.32rem calc(1.4rem + env(safe-area-inset-bottom, 0px));
  }

  /* ---------- 顶部筛选：状态 Tab + 类型按钮 ---------- */
  .order-page__filter {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.22rem;
  }

  .order-page__tabs {
    display: flex;
    gap: 0.18rem;
  }

  .order-page__tab {
    font-size: 0.26rem;
    color: rgba(255, 255, 255, 0.6);
  }

  .order-page__tab--active {
    color: #1989fa;
    font-weight: 700;
  }

  .order-page__type-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.06rem;
    padding: 0.08rem 0.18rem;
    border-radius: 0.22rem;
    border: 1px solid rgba(255, 255, 255, 0.18);
    background: transparent;
    font-size: 0.24rem;
    color: rgba(255, 255, 255, 0.9);
  }

  .order-page__type-arrow {
    font-size: 0.2rem;
  }

  /* ---------- 订单卡片列表 ---------- */
  .order-page__list {
    margin-top: 0.14rem;
  }

  .order-page__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 1.2rem 0;
    color: rgba(255, 255, 255, 0.55);
  }

  .order-page__empty-icon {
    font-size: 1.2rem;
    margin-bottom: 0.24rem;
    opacity: 0.6;
  }

  .order-page__empty-text {
    font-size: 0.28rem;
  }

  .order-page__card {
    padding: 0.28rem 0.28rem 0.3rem;
    margin-bottom: 0.24rem;
    border-radius: 0.24rem;
    background: #171d3a;
    box-shadow: 0 0.12rem 0.36rem rgba(0, 0, 0, 0.55);
  }

  .order-page__card-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.18rem;
    font-size: 0.24rem;
  }

  .order-page__card-tag {
    color: rgba(255, 255, 255, 0.78);
  }

  .order-page__card-status {
    min-width: 1.1rem;
    text-align: center;
    padding: 0.04rem 0.18rem;
    border-radius: 0.24rem;
    font-size: 0.22rem;
    font-weight: 600;
  }

  .order-page__card-status--running {
    background: rgba(25, 137, 250, 0.18);
    color: #1989fa;
  }

  .order-page__card-status--done {
    background: rgba(0, 160, 120, 0.18);
    color: #00c48c;
  }

  .order-page__card-status--forced {
    background: rgba(255, 152, 0, 0.18);
    color: #ff9800;
  }

  .order-page__card-status--ended {
    background: rgba(158, 158, 158, 0.18);
    color: #9e9e9e;
  }

  .order-page__card-split {
    height: 0.02rem;
    margin-bottom: 0.2rem;
    border-bottom: 0.02rem dashed rgba(255, 255, 255, 0.18);
  }

  .order-page__card-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.24rem;
    padding: 0.15rem 0;
  }

  .order-page__card-row--title {
    margin-bottom: 0.08rem;
  }

  .order-page__card-name {
    font-size: 0.26rem;
    font-weight: 700;
  }

  .order-page__card-tag2 {
    font-size: 0.22rem;
    color: rgba(255, 255, 255, 0.8);
  }

  .order-page__label {
    color: rgba(255, 255, 255, 0.72);
  }

  .order-page__label--accent {
    color: rgba(25, 137, 250, 0.98);
    display: inline-flex;
    align-items: center;
    gap: 0.06rem;
  }

  .order-page__label-icon-wrap {
    display: inline-flex;
    align-items: center;
    cursor: pointer;
  }

  .order-page__label-icon {
    font-size: 0.25rem;
  }

  .order-page__value {
    color: rgba(255, 255, 255, 0.96);
    font-weight: 600;
  }

  .order-page__btn {
    margin-top: 0.26rem;
    height: 0.88rem;
    font-size: 0.3rem;
    font-weight: 700;
  }

  /* ---------- 类型选择弹层 ---------- */
  .order-page__type-popup {
    padding: 0.32rem 0.3rem 0.4rem;
    background: #020824;
  }

  .order-page__type-popup-title {
    text-align: center;
    font-size: 0.3rem;
    font-weight: 700;
    margin-bottom: 0.24rem;
    color: rgba(255, 255, 255, 0.9);
  }

  .order-page__type-popup-list {
    display: flex;
    flex-direction: column;
    gap: 0.18rem;
  }

  .order-page__type-popup-item {
    padding: 0.2rem 0.16rem;
    border-radius: 0.2rem;
    border: 1px solid rgba(255, 255, 255, 0.18);
    background: transparent;
    color: rgba(255, 255, 255, 0.9);
    font-size: 0.26rem;
    text-align: center;
  }

  .order-page__type-popup-item--active {
    border-color: #1989fa;
    background: rgba(25, 137, 250, 0.16);
    color: #ffffff;
  }

  /* ---------- 底部 TabBar（与购买页共用类名） ---------- */
  .ai-buy-page__bottom-tabbar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9;
  }

  .ai-buy-page__bottom-tabbar :deep(.van-tabbar) {
    background: #fff !important;
    border-top: 1px solid var(--van-border-color, #ffffff);
  }

  @media screen and (min-width: 600px) {
    .ai-buy-page__bottom-tabbar {
      left: 50%;
      right: auto;
      width: 100%;
      max-width: 8rem;
      transform: translateX(-50%);
      bottom: 0;
    }

    .ai-buy-page__bottom-tabbar :deep(.van-tabbar) {
      left: 50% !important;
      transform: translateX(-50%) !important;
      width: 100% !important;
      max-width: 8rem !important;
      bottom: 0 !important;
      top: auto !important;
      max-height: none !important;
      overflow: hidden !important;
    }
  }

  .ai-buy-page__tab-icon {
    width: 0.46rem;
    height: 0.46rem;
    display: block;
    filter: grayscale(1) opacity(0.6);
    transition:
      filter 0.2s ease,
      opacity 0.2s ease;
  }

  .ai-buy-page__tab-icon--active {
    filter: none;
    opacity: 1;
  }
</style>
