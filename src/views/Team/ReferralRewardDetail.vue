<template>
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
      <!-- 发放时间筛选：风格与 VIP 奖励一致 -->
      <div class="reward-detail-page__filter">
        <span class="reward-detail-page__filter-label">{{ t('rrd_release_time') }}:</span>
        <Icon name="calendar-o" class="reward-detail-page__filter-icon" />
        <Field
          v-model="dateStart"
          readonly
          is-link
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
          is-link
          input-align="center"
          class="reward-detail-page__date-field"
          :placeholder="t('rrd_end_date')"
          @click="openDatePicker('end')"
          :border="false"
        />
        <Icon name="arrow-down" class="reward-detail-page__filter-arrow" />
      </div>

      <!-- 明细表格：蓝色表头固定，刷新/加载仅作用于表头下方数据区 -->
      <AppCard class="reward-detail-page__card card">
        <div class="reward-detail-page__table">
          <div class="reward-detail-page__row reward-detail-page__row--head">
            <span>{{ t('rrd_release_time') }}</span>
            <span>{{ t('rrd_reward_name') }}</span>
            <span>{{ t('rrd_reward_amount') }}</span>
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
                <span>{{ row.time }}</span>
                <span>{{ row.name }}</span>
                <span class="reward-detail-page__amount">{{ row.amount }}</span>
              </div>
            </List>
          </PullRefresh>
        </div>
      </AppCard>

      <!-- 日期选择弹窗（与 VIP 奖励一致） -->
      <Popup
        :show="showPicker"
        position="bottom"
        round
        class="modal !w-full"
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
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { useRouter } from 'vue-router';
  import { NavBar, PageWrap, AppCard } from '/@/components';
  import { Icon, Field, Popup, DatePicker, PullRefresh, List } from 'vant';
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
  .reward-detail-page {
    min-height: 100vh;
    background: #141b2c;
    color: #fff;
  }

  .reward-detail-page :deep(.van-nav-bar) {
    background: #141b2c;
    color: #fff;
  }

  .reward-detail-page :deep(.van-nav-bar__title),
  .reward-detail-page :deep(.van-icon) {
    color: #fff;
  }

  .reward-detail-page__body {
    padding: 0.32rem;
  }

  .reward-detail-page__filter {
    display: flex;
    align-items: center;
    gap: 0.16rem;
    margin-bottom: 0.24rem;
    font-size: 0.26rem;
    color: #fff;
  }

  .reward-detail-page__filter-label {
    flex-shrink: 0;
  }

  .reward-detail-page__filter-icon,
  .reward-detail-page__filter-arrow {
    font-size: 0.32rem;
    color: #fff;
    flex-shrink: 0;
  }

  .reward-detail-page__date-field {
    flex: 1;
    min-width: 0;
  }

  .reward-detail-page__date-field :deep(.van-cell) {
    height: 0.64rem;
    padding: 0 0.2rem;
    font-size: 0.26rem;
    color: #fff;
    background: #1a2332;
    border-radius: 0.12rem;
  }

  .reward-detail-page__date-field :deep(.van-field__control),
  .reward-detail-page__date-field :deep(.van-field__label),
  .reward-detail-page__date-field :deep(.van-icon-arrow) {
    color: #fff;
  }

  .reward-detail-page__filter-to {
    flex-shrink: 0;
    color: #fff;
  }

  .reward-detail-page__card {
    padding: 0;
    border-radius: 0.22rem;
    overflow: hidden;
    // background: #1a2332;
  }

  .reward-detail-page__table {
    width: 100%;
  }

  .reward-detail-page__row {
    display: grid;
    grid-template-columns: 1.2fr 1fr 0.8fr;
    align-items: center;
    padding: 0.22rem 0.28rem;
    font-size: 0.26rem;
    color: #fff;
  }

  .reward-detail-page__row--head {
    position: sticky;
    top: 0;
    z-index: 2;
    font-weight: 700;
    color: #fff;
    background: linear-gradient(180deg, #2a5a9e 0%, #1e4a8c 50%, #0f2d5c 100%);
    padding: 0.24rem 0.28rem;
  }

  .reward-detail-page__row:not(.reward-detail-page__row--head) {
    background: #1a2332;
  }

  .reward-detail-page__row:not(.reward-detail-page__row--head) span:first-child {
    text-align: left;
  }

  .reward-detail-page__row:not(.reward-detail-page__row--head) span:nth-child(2) {
    text-align: left;
  }

  .reward-detail-page__amount {
    text-align: center;
  }
</style>
