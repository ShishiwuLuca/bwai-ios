<template>
  <PageWrap class="rank-records-page">
    <NavBar
      :title="t('rank_prize_records')"
      left-arrow
      fixed
      placeholder
      :border="false"
      @click-left="handleBack"
    />
    <div class="rank-records-page__content">
      <PullRefresh v-model="refreshing" class="rank-records-page__pull" @refresh="onRefresh">
        <List
          v-model:loading="loading"
          class="rank-records-page__list"
          :immediate-check="false"
          :finished="finished"
          :finished-text="finishedText"
          @load="onLoad"
        >
          <template v-if="list.length === 0 && !loading">
            <div class="rank-records-page__empty">
              <Icon name="description" class="rank-records-page__empty-icon" />
              <span class="rank-records-page__empty-text">{{ t('rr_no_data') }}</span>
            </div>
          </template>
          <div
            v-for="(rec, i) in list"
            v-else
            :key="String(rec.id ?? i) + '-' + i"
            class="rank-records-card"
          >
            <div class="rank-records-card__head">
              <span class="rank-records-card__title">{{ rec.activityName }}</span>
              <span class="rank-records-card__status" :class="statusClass(rec.rewardStatus)">{{
                rewardStatusText(rec.rewardStatus)
              }}</span>
            </div>
            <div class="rank-records-card__divider"></div>
            <div class="rank-records-card__body">
              <div class="rank-records-card__row">
                <span class="rank-records-card__k">{{ t('rr_period') }}</span>
                <span class="rank-records-card__v">{{ displayNum(rec.period) }}</span>
              </div>
              <div class="rank-records-card__row">
                <span class="rank-records-card__k">{{ t('rr_rank') }}</span>
                <span class="rank-records-card__v">{{ displayNum(rec.rank) }}</span>
              </div>
              <div class="rank-records-card__row">
                <span class="rank-records-card__k">{{ t('rr_reward_amount') }}</span>
                <span class="rank-records-card__v">{{ formatAmount(rec.amount, rec.coin) }}</span>
              </div>
              <div class="rank-records-card__row">
                <span class="rank-records-card__k">{{ t('rr_create_time') }}</span>
                <span class="rank-records-card__v">{{ formatDateTime(rec.createTime) }}</span>
              </div>
              <div class="rank-records-card__row">
                <span class="rank-records-card__k">{{ t('rr_activity_start') }}</span>
                <span class="rank-records-card__v">{{ formatDateTime(rec.activityStart) }}</span>
              </div>
              <div class="rank-records-card__row">
                <span class="rank-records-card__k">{{ t('rr_activity_end') }}</span>
                <span class="rank-records-card__v">{{ formatDateTime(rec.activityEnd) }}</span>
              </div>
            </div>
          </div>
        </List>
      </PullRefresh>
    </div>
  </PageWrap>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { NavBar, PageWrap } from '/@/components';
  import { PullRefresh, List, Icon } from 'vant';
  import { useI18n } from '/@/hooks/web/useI18n';
  import {
    getRankRewardRecordPage,

    /** RankAppRewardRecordItemVO：类型别名 */
    type RankAppRewardRecordItemVO,

    /** RankAppRewardRecordPageReqVO：类型别名 */
    type RankAppRewardRecordPageReqVO
  } from '/@/service/Rank';

  /** 从 useI18n 解构的文案与能力 */
  const { t } = useI18n();

  /** 路由实例：编程式导航 */
  const router = useRouter();

  /** 当前路由：读取 query、params、meta 等 */
  const route = useRoute();

  /** RecordRow：类型别名 */
  type RecordRow = {
    id?: string | number;
    activityName: string;
    period?: number;
    rank?: number;
    amount?: number;
    coin: string;
    createTime?: number;
    activityStart?: number;
    activityEnd?: number;
    rewardStatus?: number;
  };

  /** normalizeRecord */
  const normalizeRecord = (row: RankAppRewardRecordItemVO): RecordRow => {
    /** activityName */
    const activityName = row.activityName ?? row.activity_name ?? '-';

    /** period */
    const period = row.periodNo ?? row.periodNum ?? row.period_no;

    /** rank */
    const rank = row.rankNo ?? row.rank_no;

    /** 金额输入：amount */
    const amount = row.rewardAmount ?? row.reward_amount;

    /** coin */
    const coin = row.rewardCoin ?? row.reward_coin ?? 'USDT';

    /** createTime */
    const createTime = row.createTime ?? row.create_time;

    /** activityStart */
    const activityStart = row.activityStartTime ?? row.activity_start_time ?? row.startTime;

    /** activityEnd */
    const activityEnd = row.activityEndTime ?? row.activity_end_time ?? row.endTime;

    /** rewardStatus */
    const rewardStatus = row.rewardStatus ?? row.reward_status;
    return {
      id: row.id,
      activityName,
      period: typeof period === 'number' ? period : Number(period) || undefined,
      rank: typeof rank === 'number' ? rank : Number(rank) || undefined,
      amount: typeof amount === 'number' ? amount : Number(amount) || undefined,
      coin,
      createTime: typeof createTime === 'number' ? createTime : Number(createTime) || undefined,
      activityStart:
        typeof activityStart === 'number' ? activityStart : Number(activityStart) || undefined,
      activityEnd: typeof activityEnd === 'number' ? activityEnd : Number(activityEnd) || undefined,
      rewardStatus:
        typeof rewardStatus === 'number' ? rewardStatus : Number(rewardStatus) || undefined
    };
  };

  /** 列表数据：extractList */
  const extractList = (data: unknown): RankAppRewardRecordItemVO[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data as RankAppRewardRecordItemVO[];

    /** o */
    const o = data as Record<string, unknown>;
    if (Array.isArray(o.list)) return o.list as RankAppRewardRecordItemVO[];
    if (Array.isArray(o.records)) return o.records as RankAppRewardRecordItemVO[];
    return [];
  };

  /** 总条数：extractTotal */
  const extractTotal = (data: unknown): number => {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return 0;

    /** o */
    const o = data as Record<string, unknown>;

    /** x */
    const x = o.total ?? o.totalCount ?? o.totalElements;

    /** n */
    const n = Number(x);
    return Number.isFinite(n) ? n : 0;
  };

  /** 格式化展示：formatDateTime */
  const formatDateTime = (raw: unknown): string => {
    /** n */
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return '-';

    /** ms */
    const ms = n > 1e12 ? n : n * 1000;

    /** d */
    const d = new Date(ms);

    /** y */
    const y = d.getFullYear();

    /** m */
    const m = String(d.getMonth() + 1).padStart(2, '0');

    /** day */
    const day = String(d.getDate()).padStart(2, '0');

    /** h */
    const h = String(d.getHours()).padStart(2, '0');

    /** min */
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${y}/${m}/${day} ${h}:${min}`;
  };
  const formatAmount = (amount: number | undefined, coin: string): string => {
    /** n */
    const n = Number(amount);
    if (!Number.isFinite(n)) return '-';

    /** s */
    const s = Number.isInteger(n) ? String(n) : String(n);

    /** unit */
    const unit = (coin || 'USDT').trim() || 'USDT';
    return `${s} ${unit}`;
  };
  const displayNum = (n: number | undefined): string => {
    if (n == null || !Number.isFinite(Number(n))) return '-';
    return String(n);
  };
  const rewardStatusText = (s: number | undefined): string => {
    if (s === 0) return t('rr_status_issuing');
    if (s === 1) return t('rr_status_issued');
    if (s === 2) return t('rr_status_failed');
    return '-';
  };
  const statusClass = (s: number | undefined): string => {
    if (s === 0) return 'rank-records-card__status--issuing';
    if (s === 1) return 'rank-records-card__status--issued';
    if (s === 2) return 'rank-records-card__status--failed';
    return '';
  };
  const queryNum = (q: unknown): number | undefined => {
    /** raw */
    const raw = Array.isArray(q) ? q[0] : q;

    /** n */
    const n = typeof raw === 'string' ? Number(raw) : Number(raw);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  };
  const list = ref<RecordRow[]>([]);
  const pageNo = ref(1);
  const pageSize = 10;
  const total = ref(0);
  const loading = ref(false);
  const refreshing = ref(false);
  const finished = ref(false);
  const activityIdFilter = computed(() => queryNum(route.query.activityId));
  const periodIdFilter = computed(() => queryNum(route.query.periodId));
  const finishedText = computed(() => (list.value.length === 0 ? '' : t('no_more')));
  const fetchList = (isRefresh: boolean) => {
    if (isRefresh) {
      pageNo.value = 1;
      finished.value = false;
    }
    if (loading.value) return;
    loading.value = true;

    /** 常量或静态配置：拉取接口数据 */
    const payload: RankAppRewardRecordPageReqVO = {
      pageNo: pageNo.value,
      pageSize
    };

    /** aid */
    const aid = activityIdFilter.value;

    /** pid */
    const pid = periodIdFilter.value;
    if (aid !== undefined) payload.activityId = aid;
    if (pid !== undefined) payload.periodId = pid;
    getRankRewardRecordPage(payload)
      .then((res) => {
        if (res?.code !== 0) {
          finished.value = true;
          return;
        }
        const raw = res.data;
        const items = extractList(raw).map(normalizeRecord);
        const totalCount = extractTotal(raw);
        if (isRefresh) {
          list.value = items;
          console.log(list.value);
        } else {
          list.value = list.value.concat(items);
          console.log(list.value);
        }
        total.value = totalCount;
        const noMore =
          items.length === 0 ||
          items.length < pageSize ||
          (totalCount > 0 && list.value.length >= totalCount);
        finished.value = noMore;
        if (!noMore) {
          pageNo.value += 1;
        }
      })
      .catch(() => {
        finished.value = true;
      })
      .finally(() => {
        loading.value = false;
        refreshing.value = false;
      });
  };
  const onRefresh = () => {
    refreshing.value = true;
    void fetchList(true);
  };
  const onLoad = () => {
    void fetchList(false);
  };
  const handleBack = () => {
    router.push('/Rank');
  };
  onMounted(() => {
    onLoad();
  });
</script>

<style scoped lang="less">
  /* 与排行页全局一致：深底 + 略浅卡片，无白底；版式仍为左标题右状态 + 键值行 */
  @rr-bg: #050914;
  @rr-card: #121a2e;
  @rr-card-border: rgba(100, 160, 255, 0.14);
  @rr-title: #f2f6ff;
  @rr-label: rgba(255, 255, 255, 0.5);
  @rr-value: rgba(255, 255, 255, 0.92);
  @rr-orange: #ffb74d;
  @rr-green: #69f0ae;
  @rr-red: #ff8a80;

  .rank-records-page {
    min-height: 100vh;
    background: @rr-bg;
    color: #fff;
  }

  .rank-records-page :deep(.van-nav-bar) {
    background: transparent;
  }

  .rank-records-page :deep(.van-nav-bar__title),
  .rank-records-page :deep(.van-icon) {
    color: #fff;
  }

  .rank-records-page :deep(.van-list__finished-text),
  .rank-records-page :deep(.van-loading__text) {
    color: rgba(255, 255, 255, 0.45) !important;
  }

  .rank-records-page__content {
    padding: 0.24rem 0.32rem calc(0.4rem + env(safe-area-inset-bottom));
  }

  .rank-records-page__pull {
    min-height: 70vh;
  }

  .rank-records-page__list {
    min-height: 40vh;
  }

  .rank-records-card {
    margin-bottom: 0.24rem;
    border-radius: 0.2rem;
    overflow: hidden;
    background: @rr-card;
    border: 1px solid @rr-card-border;
    box-shadow: 0 0.06rem 0.2rem rgba(0, 20, 60, 0.35);
  }

  .rank-records-card:last-of-type {
    margin-bottom: 0.12rem;
  }

  .rank-records-card__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.2rem;
    padding: 0.26rem 0.28rem 0.22rem;
    background: @rr-card;
  }

  .rank-records-card__title {
    flex: 1;
    min-width: 0;
    font-size: 0.3rem;
    font-weight: 700;
    color: @rr-title;
    line-height: 1.35;
  }

  .rank-records-card__status {
    flex-shrink: 0;
    font-size: 0.26rem;
    font-weight: 600;
  }

  .rank-records-card__status--issuing {
    color: @rr-orange;
  }

  .rank-records-card__status--issued {
    color: @rr-green;
  }

  .rank-records-card__status--failed {
    color: @rr-red;
  }

  .rank-records-card__divider {
    height: 1px;
    margin: 0 0.28rem;
    background: rgba(255, 255, 255, 0.08);
  }

  .rank-records-card__body {
    padding: 0.12rem 0.28rem 0.24rem;
    background: @rr-card;
  }

  .rank-records-card__row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.24rem;
    padding: 0.18rem 0;
    font-size: 0.26rem;
    line-height: 1.45;
  }

  .rank-records-card__k {
    flex-shrink: 0;
    color: @rr-label;
  }

  .rank-records-card__v {
    text-align: right;
    color: @rr-value;
    font-weight: 500;
    word-break: break-all;
  }

  .rank-records-page__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 1.4rem 0.32rem;
    color: rgba(255, 255, 255, 0.5);
  }

  .rank-records-page__empty-icon {
    font-size: 1.1rem;
    margin-bottom: 0.2rem;
    opacity: 0.65;
  }

  .rank-records-page__empty-text {
    font-size: 0.28rem;
  }
</style>
