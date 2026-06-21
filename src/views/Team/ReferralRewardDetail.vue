<template>
  <ConfigProvider theme="light" class="reward-detail-page-provider">
    <div class="reward-detail-page-shell">
      <PageWrap class="reward-detail-page">
        <NavBar
          :title="t('rrd_title')"
          left-arrow
          fixed
          placeholder
          :border="false"
          @click-left="onBack"
        />
        <div class="reward-detail-page__body">
          <div class="reward-detail-page__filter">
            <span class="reward-detail-page__filter-label">{{ t('rrd_release_time') }}:</span>
            <div class="reward-detail-page__filter-box">
              <Icon name="calendar-o" class="reward-detail-page__filter-icon" />
              <Field
                v-model="dateStart"
                readonly
                input-align="center"
                class="reward-detail-page__date-field"
                :placeholder="t('rrd_start_date')"
                @click="openDatePicker('start')"
                :border="false"
              />
              <span class="reward-detail-page__filter-to">{{ t('rrd_to') }}</span>
              <Field
                v-model="dateEnd"
                readonly
                input-align="center"
                class="reward-detail-page__date-field"
                :placeholder="t('rrd_end_date')"
                @click="openDatePicker('end')"
                :border="false"
              />
              <Icon name="arrow-down" class="reward-detail-page__filter-arrow" />
            </div>
          </div>

          <div class="reward-detail-page__card">
            <div class="reward-detail-page__table">
              <div class="reward-detail-page__row reward-detail-page__row--head">
                <span class="reward-detail-page__col reward-detail-page__col--time">{{ t('rrd_release_time') }}</span>
                <span class="reward-detail-page__col reward-detail-page__col--name">{{ t('rrd_reward_name') }}</span>
                <span class="reward-detail-page__col reward-detail-page__col--amount">{{ t('rrd_reward_amount') }}</span>
              </div>
              <PullRefresh v-model="refreshing" @refresh="onRefresh">
                <List
                  :loading="loading"
                  :finished="finished"
                  :immediate-check="false"
                  :finished-text="t('rrd_no_more')"
                  @update:loading="(v) => (loading = v)"
                  @load="onLoad"
                >
                  <div
                    v-for="(row, i) in rows"
                    :key="`${row.time}-${row.amount}-${i}`"
                    class="reward-detail-page__row"
                  >
                    <span class="reward-detail-page__col reward-detail-page__col--time">{{ row.time }}</span>
                    <span class="reward-detail-page__col reward-detail-page__col--name">{{ row.name }}</span>
                    <span class="reward-detail-page__col reward-detail-page__col--amount">{{ row.amount }}</span>
                  </div>
                </List>
              </PullRefresh>
            </div>
          </div>

          <Popup
            :show="showPicker"
            position="bottom"
            round
            overlay-class="reward-detail-page__overlay"
            class="reward-detail-page__date-popup modal !w-full"
            @update:show="(v) => (showPicker = v)"
          >
            <DatePicker
              v-model="pickerDate"
              :title="t('rrd_select_date')"
              :columns-type="['year', 'month', 'day']"
              @confirm="onConfirmDate"
              @cancel="showPicker = false"
            />
          </Popup>
        </div>
      </PageWrap>
    </div>
  </ConfigProvider>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { useRouter } from 'vue-router';
  import { NavBar, PageWrap } from '/@/components';
  import { Icon, Field, Popup, DatePicker, PullRefresh, List, ConfigProvider } from 'vant';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { getRebatOrderPage, type TeamRewardOrderPageReq } from '/@/service/Reward';

  /** 路由实例：编程式导航 */
  const router = useRouter();

  /** 从 useI18n 解构的文案与能力 */
  const { t } = useI18n();

  /** 事件或回调处理：onBack */
  const onBack = () => {
    router.replace({ name: 'Team', query: { tab: 'reward' } });
  };

  /** 从 useMessage 解构的 Toast / Dialog 能力 */
  const { CreateErrorToast } = useMessage();

  /** 格式化展示：formatDate */
  const formatDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  /** 筛选开始/结束日期：默认前7天到今天 */
  const today = new Date();

  /** sevenDaysAgo */
  const sevenDaysAgo = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);

  /** 响应式状态：dateStart 相关 UI 或数据 */
  const dateStart = ref(formatDate(sevenDaysAgo));

  /** 响应式状态：dateEnd 相关 UI 或数据 */
  const dateEnd = ref(formatDate(today));

  /** 响应式状态：显隐控制 */
  const showPicker = ref(false);

  /** 响应式状态：pickerTarget 相关 UI 或数据 */
  const pickerTarget = ref<'start' | 'end'>('start');

  /** 响应式状态：pickerDate 相关 UI 或数据 */
  const pickerDate = ref<string[]>([]);

  /** 响应式状态：分页 */
  const pageNo = ref(1);

  /** 分页：pageSize */
  const pageSize = 20;

  /** 响应式状态：总条数 */
  const total = ref(0);

  /** 响应式状态：加载中状态 */
  const loading = ref(false);

  /** 响应式状态：列表是否已全部加载 */
  const finished = ref(false);

  /** 响应式状态：下拉刷新 */
  const refreshing = ref(false);

  /** openDatePicker */
  const openDatePicker = (target: 'start' | 'end') => {
    pickerTarget.value = target;
    const base = target === 'start' ? dateStart.value : dateEnd.value;
    const d = new Date(base.replace(/-/g, '/'));
    const cur = Number.isNaN(d.getTime()) ? new Date() : d;
    pickerDate.value = [
      String(cur.getFullYear()),
      String(cur.getMonth() + 1),
      String(cur.getDate())
    ];
    showPicker.value = true;
  };
  /** 推荐奖励明细原始列表（来自 getRebatOrderPage） */
  const rawList = ref<
    {
      orderTime?: string;
      realAmount?: number;
    }[]
  >([]);

  /** 计算属性：由其它状态派生的展示或判断 */
  const rows = computed(() =>
    rawList.value.map((item) => ({
      time: item.orderTime || '-',
      name: t('rrd_reward_label'),
      amount: (item.realAmount ?? 0).toFixed(2)
    }))
  );

  /** 事件或回调处理：onConfirmDate */
  const onConfirmDate = (value: unknown) => {
    const arr = Array.isArray(value)
      ? value
      : (
          value as {
            selectedValues?: string[];
          }
        )?.selectedValues || pickerDate.value;
    const [y, m, day] = arr;
    const d = new Date(Number(y), Number(m) - 1, Number(day));
    const text = formatDate(d);
    if (pickerTarget.value === 'start') {
      dateStart.value = text;
    } else {
      dateEnd.value = text;
    }
    showPicker.value = false;
    refreshing.value = true;
    void fetchRebateList(true);
  };

  /** 列表数据：fetchRebateList */
  const fetchRebateList = (reset = false) => {
    if (loading.value && !reset) return;
    if (reset) {
      pageNo.value = 1;
      total.value = 0;
      finished.value = false;
      rawList.value = [];
    }
    loading.value = true;
    const payload: TeamRewardOrderPageReq = {
      pageNo: pageNo.value,
      pageSize,
      dateFrom: dateStart.value,
      dateTo: dateEnd.value
    };
    getRebatOrderPage(payload)
      .then((res) => {
        if (res.code === 0 && res.data) {
          const list = res.data.list || [];
          total.value = Number(res.data.total) || 0;
          rawList.value = reset ? list : rawList.value.concat(list);
          if (!list.length || (total.value > 0 && rawList.value.length >= total.value)) {
            finished.value = true;
          } else {
            pageNo.value += 1;
          }
        } else {
          if (reset) rawList.value = [];
          finished.value = true;
          CreateErrorToast(res.msg || t('rrd_fetch_fail'));
        }
      })
      .catch((e: unknown) => {
        if (reset) rawList.value = [];
        finished.value = true;
        const msg =
          (
            e as {
              msg?: string;
            }
          )?.msg ?? t('rrd_fetch_fail');
        CreateErrorToast(msg);
      })
      .finally(() => {
        loading.value = false;
        if (refreshing.value) refreshing.value = false;
      });
  };

  /** 拉取接口数据：onLoad */
  const onLoad = () => {
    void fetchRebateList(false);
  };

  /** 下拉刷新：onRefresh */
  const onRefresh = () => {
    void fetchRebateList(true);
  };

  /** 组件挂载后执行：初始化数据或订阅 */
  onMounted(() => {
    void fetchRebateList(true);
  });
</script>

<style scoped lang="less">
  @primary-blue: #1a37fd;
  @page-bg: #eef2fd;
  @text-primary: #000;
  @text-secondary: #666;
  @text-muted: #999;
  @card-bg: #fff;
  @filter-bg: #fff;
  @filter-border: #dbe6ff;
  @card-border: rgba(26, 55, 253, 0.28);
  @card-shadow: 0 0.04rem 0.2rem rgba(51, 102, 255, 0.08);
  @header-divider: #dbe6ff;

  .reward-detail-page-provider {
    background: transparent !important;
  }

  .reward-detail-page-shell {
    min-height: 100vh;
    background: transparent;
    color: @text-primary;
    --van-card-background: @card-bg;
    --van-cell-background: transparent;
    --van-field-background: transparent;
    --van-cell-text-color: @text-primary;
    --van-text-color: @text-primary;
    --van-text-color-2: @text-muted;
    --van-background: @page-bg;
    --van-background-2: @card-bg;
    --van-border-color: @filter-border;
    --van-popup-background: @card-bg;
  }

  .reward-detail-page {
    min-height: 100vh;
    background: transparent;
    color: @text-primary;
  }

  .reward-detail-page :deep(.page-wrap) {
    background: transparent;
    color: @text-primary;
  }

  .reward-detail-page :deep(.van-nav-bar),
  .reward-detail-page :deep(.van-nav-bar__placeholder) {
    background: transparent !important;
  }

  .reward-detail-page :deep(.van-nav-bar__title) {
    color: @text-primary;
    font-weight: 700;
    font-size: 0.34rem;
  }

  .reward-detail-page :deep(.nav-back-button .van-icon),
  .reward-detail-page :deep(.van-nav-bar .van-icon) {
    color: @text-primary !important;
  }

  .reward-detail-page__body {
    padding: 0.16rem 0.32rem 0.32rem;
    color: @text-primary;
  }

  .reward-detail-page__filter {
    display: flex;
    align-items: center;
    gap: 0.12rem;
    margin-bottom: 0.28rem;
    font-size: 0.28rem;
    color: @text-primary;
  }

  .reward-detail-page__filter-label {
    flex-shrink: 0;
    color: @text-primary;
  }

  .reward-detail-page__filter-box {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 0.06rem;
    padding: 0.14rem 0.2rem;
    background: @filter-bg;
    border: 1px solid @filter-border;
    border-radius: 0.2rem;
    box-shadow: none;
  }

  .reward-detail-page__filter-icon,
  .reward-detail-page__filter-arrow {
    font-size: 0.28rem;
    color: @primary-blue;
    flex-shrink: 0;
  }

  .reward-detail-page__date-field {
    flex: 1;
    min-width: 0;
    padding: 0;
    background: transparent;
    color: @text-primary;
  }

  .reward-detail-page__date-field :deep(.van-cell) {
    padding: 0;
    background: transparent !important;
    line-height: 1.2;
    color: @text-primary;
  }

  .reward-detail-page__date-field :deep(.van-field__body) {
    padding: 0;
  }

  .reward-detail-page__date-field :deep(.van-field__control) {
    font-size: 0.26rem;
    color: @text-primary;
    text-align: center;
  }

  .reward-detail-page__date-field :deep(.van-field__control::placeholder) {
    color: @text-muted;
  }

  .reward-detail-page__date-field :deep(.van-icon-arrow) {
    display: none;
  }

  .reward-detail-page__filter-to {
    flex-shrink: 0;
    color: @primary-blue;
    font-size: 0.26rem;
  }

  .reward-detail-page__card {
    padding: 0;
    border-radius: 0.32rem;
    overflow: hidden;
    background: #F9FAFF !important;
    box-shadow: @card-shadow;
    color: @text-secondary;
  }

  .reward-detail-page__table {
    width: 100%;
    background: @card-bg;
    color: @text-secondary;
  }

  .reward-detail-page__table :deep(.van-pull-refresh),
  .reward-detail-page__table :deep(.van-pull-refresh__track),
  .reward-detail-page__table :deep(.van-list) {
    background: @card-bg !important;
    color: @text-secondary;
  }

  .reward-detail-page__table :deep(.van-pull-refresh__head) {
    color: @text-muted;
  }

  .reward-detail-page__table :deep(.van-loading__text) {
    color: @text-muted;
  }

  .reward-detail-page__row {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    align-items: center;
    padding: 0.24rem 0.28rem;
    font-size: 0.26rem;
    color: @text-secondary;
  }

  .reward-detail-page__row--head {
    position: sticky;
    top: 0;
    z-index: 2;
    font-weight: 700;
    font-size: 0.28rem;
    color: @primary-blue;
    background: @card-bg;
    padding: 0.28rem 0.28rem 0.22rem;
    border-bottom: 1px dashed @header-divider;
  }

  .reward-detail-page__row--head .reward-detail-page__col {
    color: @primary-blue;
  }

  .reward-detail-page__row:not(.reward-detail-page__row--head) {
    background: transparent;
    padding: 0.26rem 0.28rem;
  }

  .reward-detail-page__row:not(.reward-detail-page__row--head) .reward-detail-page__col {
    color: @text-secondary;
  }

  .reward-detail-page__col--time {
    text-align: left;
  }

  .reward-detail-page__col--name {
    text-align: center;
  }

  .reward-detail-page__col--amount {
    text-align: right;
  }

  .reward-detail-page__table :deep(.van-list__finished-text),
  .reward-detail-page__table :deep(.van-list__loading) {
    color: @text-muted;
    font-size: 0.24rem;
    padding: 0.24rem 0;
    background: @card-bg;
  }

  .reward-detail-page__date-popup {
    --van-text-color: @text-primary;
    --van-text-color-2: @text-muted;
    --van-background: @card-bg;
    --van-background-2: @card-bg;
    --van-popup-background: @card-bg;
    background: @card-bg !important;
  }

  .reward-detail-page__date-popup :deep(.van-picker) {
    --van-picker-background: @card-bg;
    --van-picker-option-text-color: @text-primary;
    --van-picker-cancel-action-color: @text-muted;
    --van-picker-confirm-action-color: @primary-blue;
    --van-picker-mask-color: linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.4)),
      linear-gradient(0deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.4));
    --van-picker-loading-mask-color: rgba(255, 255, 255, 0.92);
    background: @card-bg !important;
  }

  .reward-detail-page__date-popup :deep(.van-picker__title),
  .reward-detail-page__date-popup :deep(.van-picker-column__item) {
    color: @text-primary;
  }

  .reward-detail-page__date-popup :deep(.van-picker__cancel) {
    color: @text-muted;
  }

  .reward-detail-page__date-popup :deep(.van-picker__confirm) {
    color: @primary-blue;
  }
</style>

<style lang="less">
  .reward-detail-page__overlay {
    background: rgba(238, 242, 253, 0.78) !important;
  }

  .reward-detail-page__date-popup.van-popup {
    background: #fff !important;
  }
</style>
