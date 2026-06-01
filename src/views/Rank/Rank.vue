<template>
  <div class="rank-page">
    <NavBar
      :title="t('rank_title')"
      left-arrow
      fixed
      placeholder
      :border="false"
      @click-left="handleBack"
    >
      <template #right>
        <span class="rank-page__nav-right" @click="handleShowRule">{{
          t('rank_reward_desc')
        }}</span>
      </template>
    </NavBar>

    <div class="rank-page__content">
      <Image :src="bannerImage" width="100%" />
      <div class="rank-page__prize-records" @click="goPrizeRecords">
        <div class="rank-page__prize-records-inner">
          <span class="rank-page__prize-records-text">{{ t('rank_prize_records') }}</span>
          <Icon name="arrow" class="rank-page__prize-records-arrow" />
        </div>
      </div>
      <Tabs
        :active="activeTab"
        class="rank-page__tabs"
        type="card"
        shrink
        swipeable
        animated
        @update:active="onActivityTabChange"
      >
        <Tab
          v-for="item in activityData"
          :key="item.activityId"
          :name="item.activityId"
          :title="item.activityName"
          title-class="rank-page__tab-title"
        />
      </Tabs>

      <PullRefresh v-model="rankRefreshing" class="rank-page__pull" @refresh="onRankPullRefresh">
        <List
          v-model:loading="rankListLoading"
          :finished="rankListFinished"
          :disabled="rankPageLazyDisabled"
          :immediate-check="false"
          :finished-text="t('no_more')"
          class="rank-page__list-wrap"
          @load="onRankListLoad"
        >
          <!-- 无排名数据：数据统计中 -->
          <div v-if="!hasRankData" class="rank-page__empty">
            <div class="rank-page__empty-inner">
              <div class="rank-page__empty-figure" aria-hidden="true">
                <div class="rank-page__empty-orbit"></div>
                <div class="rank-page__empty-icon-wrap">
                  <Icon name="medal-o" class="rank-page__empty-icon" />
                </div>
              </div>
              <p class="rank-page__empty-title">{{ t('rank_stat_loading') }}</p>
              <p class="rank-page__empty-dots"><span></span><span></span><span></span></p>
            </div>
          </div>

          <template v-else>
            <div class="rank-page__table-header mt-1">
              <span class="rank-page__table-header-col rank-page__table-header-col--rank">{{
                t('rank_col_rank')
              }}</span>
              <span class="rank-page__table-header-col rank-page__table-header-col--user">{{
                t('rank_col_uid')
              }}</span>
              <span class="rank-page__table-header-col rank-page__table-header-col--metric">{{
                t('rank_col_metric')
              }}</span>
              <span class="rank-page__table-header-col rank-page__table-header-col--value">{{
                t('rank_col_reward')
              }}</span>
            </div>

            <div class="rank-page__top3">
              <div
                v-for="item in topThreeOrder"
                :key="item.id"
                class="rank-page__top3-item"
                :class="`rank-page__top3-item--${item.rank}`"
              >
                <div class="rank-page__top3-avatar-wrapper">
                  <Image :src="item.avatar" class="rank-page__top3-avatar" fit="cover" />
                  <Image
                    :src="getTopRankBadge(item.rank - 1)"
                    class="rank-page__top3-rank-badge"
                    fit="contain"
                  />
                </div>
                <div class="ps-relative top-[-1.2rem]">
                  <div class="rank-page__top3-name">{{ item.name }}</div>
                  <div class="rank-page__top3-metric">
                    <span class="rank-page__top3-metric-value">{{ item.metric }}</span>
                    <span class="rank-page__top3-metric-unit">{{ t('rank_metric_unit') }}</span>
                  </div>
                  <div class="rank-page__top3-reward">
                    <span class="rank-page__top3-reward-value">{{ item.amount }}</span>
                    <span class="rank-page__top3-reward-unit">{{ t('rank_reward_unit') }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="rank-page__list">
              <div
                v-for="(item, index) in rankList"
                :key="`${item.rankNo ?? ''}-${item.id}-${index}`"
                class="rank-page__row"
                :class="[{ 'rank-page__row--self': item.isSelf }]"
              >
                <div class="rank-page__row-rank">{{ displayRowRank(item, index) }}</div>
                <div class="rank-page__row-user">
                  <Image :src="item.avatar" class="rank-page__row-avatar" fit="cover" />
                  <div class="rank-page__row-user-info">
                    <div class="rank-page__row-name">{{ item.name }}</div>
                  </div>
                </div>
                <div class="rank-page__row-metric">{{ item.metric }}</div>
                <div class="rank-page__row-value">{{ item.amount }}</div>
              </div>
            </div>
          </template>
        </List>
      </PullRefresh>
    </div>

    <!-- 底部固定栏：用户当前排名状态，蓝色渐变 -->
    <div class="rank-page__footer" :class="{ 'rank-page__footer--ended': isActivityEnded }">
      <div class="rank-page__footer-bar">
        <span class="rank-page__footer-label">{{ footerLabel }}</span>
        <div class="rank-page__footer-user">
          <Image :src="footerUser?.avatar" class="rank-page__footer-avatar" fit="cover" />
          <span class="rank-page__footer-name">{{ t('rank_footer_self') }}</span>
          <span class="rank-page__footer-metric">{{ footerUser?.metric ?? '0' }}</span>
          <span class="rank-page__footer-value">{{ footerUser?.amount ?? '0' }}</span>
        </div>
      </div>
      <Button
        v-if="isActivityEnded"
        type="default"
        round
        block
        disabled
        class="rank-page__footer-btn rank-page__footer-btn--disabled"
      >
        {{ t('rank_ended') }}
      </Button>
    </div>

    <!-- 活动说明弹窗：根据设计图重做，关闭按钮和吉祥物放在弹窗内以跟随弹窗且可点击 -->
    <div class="rank-page__rule-close" @click.stop="handleHideRule" v-show="showRule">
      <img :src="closeIcon" alt="" />
    </div>
    <img :src="rankMascot" alt="" class="rank-page__rule-mascot" v-show="showRule" />
    <Popup
      v-model:show="showRule"
      round
      position="center"
      class="rank-page__rule-popup modal !w-full"
      overlay-class="rank-page__rule-overlay"
    >
      <div class="rank-page__rule-popup-wrap">
        <div class="rank-page__rule-card">
          <div class="rank-page__rule-inner">
            <div class="rank-page__rule-header">
              <div class="rank-page__rule-tab">
                <img :src="rankTabBg" alt="" class="rank-page__rule-tab-bg" />
                <span class="rank-page__rule-tab-text">{{ t('rank_rule_title') }}</span>
              </div>
            </div>
            <div class="rank-page__rule-scroll">
              <div class="rank-page__rule-section rank-page__rule-section--first">
                <div class="rank-page__rule-section-title">{{ t('rank_section_time') }}</div>
                <p v-if="explainStartTime"
                  >{{ t('rank_start_time') }}{{ explainStartTime }}{{ localTimezoneLabel }}</p
                >
                <p>{{ t('rank_period_num') }}{{ explainPeriodNum || '-' }}</p>
                <p>{{ t('rank_cycle_days') }}{{ explainCycleDays || '-' }}</p>
              </div>

              <div class="rank-page__rule-section">
                <div class="rank-page__rule-section-title">{{ t('rank_section_condition') }}</div>
                <p
                  >{{ t('rank_condition_desc') }}{{ explainRankThreshold }}{{ t('rank_person') }}</p
                >
              </div>

              <div class="rank-page__rule-section">
                <div class="rank-page__rule-section-title">{{ t('rank_section_reward') }}</div>
                <template v-if="rewardExplainList.length">
                  <p v-for="item in rewardExplainList" :key="item.rankNo">
                    {{ t('rank_reward_item', [item.rankNo, item.rewardAmount]) }}
                  </p>
                </template>
                <p v-else>{{ t('rank_reward_default') }}</p>
              </div>

              <div class="rank-page__rule-section">
                <div class="rank-page__rule-section-title">{{ t('rank_section_desc') }}</div>
                <p v-if="explainDesc" class="rank-page__rule-desc"
                  ><span v-html="explainDesc"></span
                ></p>
                <p v-else>{{ t('rank_desc_default') }}</p>
              </div>

              <Button
                type="primary"
                round
                block
                class="rank-page__rule-confirm"
                @click="handleHideRule"
              >
                {{ t('confirm') }}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Popup>
  </div>
</template>

<script setup lang="ts">
  import { NavBar } from '/@/components';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useRoute, useRouter } from 'vue-router';
  import { computed, onMounted, onUnmounted, ref } from 'vue';
  import { Button, Popup, Tab, Tabs, Image, Icon, PullRefresh, List } from 'vant';
  import { useUserStoreWithOut } from '/@/stores/modules/UserConfig';
  import {
    getLatestRank,
    getRankExplain,
    getRankLatestRankPage,

    /** RankAppCurrentUserRankVO：类型别名 */
    type RankAppCurrentUserRankVO,

    /** RankAppExplainRewardVO：类型别名 */
    type RankAppExplainRewardVO,

    /** RankAppLatestRankItemVO：类型别名 */
    type RankAppLatestRankItemVO
  } from '/@/service/Rank';
  import rankMascot from '/@/assets/images/Rank/rank1.png';
  import rankTabBg from '/@/assets/images/Rank/Vector 4.png';
  import closeIcon from '/@/assets/images/Rank/close.png';
  import rankBanner from '/@/assets/images/Rank/rank.png';
  import rankBadge1 from '/@/assets/images/Rank/one1.png';
  import rankBadge2 from '/@/assets/images/Rank/one0.png';
  import rankBadge3 from '/@/assets/images/Rank/one3.png';
  import Avatar from '/@/assets/images/avatar.png';

  /** 与个人中心一致：无头像时使用本地默认图 */
  const DEFAULT_AVATAR = Avatar;

  /** RANK_PAGE_SIZE */
  const RANK_PAGE_SIZE = 20;

  /** 常量或静态配置：topRankBadges */
  const topRankBadges = [rankBadge2, rankBadge1, rankBadge3];

  /** 排行榜单项：id、昵称、描述、副文案、头像、直推有效、奖励金额、是否当前用户 */
  type RankItem = {
    id: number;
    name: string;
    avatar: string;
    metric: string;
    amount: string;
    isSelf?: boolean;
    /** 接口 rankNo，列表区展示名次 */
    rankNo?: number;
  };

  /** 路由实例：编程式导航 */
  const router = useRouter();

  /** 当前路由：读取 query、params、meta 等 */
  const route = useRoute();

  /** 从 useI18n 解构的文案与能力 */
  const { t } = useI18n();

  /** 用户：userStore */
  const userStore = useUserStoreWithOut();

  /** 从路由 query 获取 activityId */
  const getRouteActivityId = () => {
    /** raw */
    const raw = route.query.activityId;

    /** n */
    const n =
      typeof raw === 'string' ? Number(raw) : Array.isArray(raw) ? Number(raw[0]) : Number(raw);
    return Number.isFinite(n) ? n : 0;
  };

  /** 活动 Tab 列表（来自 getRankExplain） */
  const activityData = ref<any[]>([]);

  /** 当前活动 Tab（activityId）、当前切换项（排行/奖励/规则）、是否显示规则弹窗 */
  const activeTab = ref<string | number>(getRouteActivityId() || 0);

  /** 响应式状态：显隐控制 */
  const showRule = ref(false);

  /** 当前 Banner 图片：默认本地图，命中 activityImage 后替换 */
  const bannerImage = ref<string>(rankBanner);

  /** 活动说明：活动名、描述、时间范围、奖励说明列表 */
  const explainActivityName = ref('');

  /** 响应式状态：explainDesc 相关 UI 或数据 */
  const explainDesc = ref('');

  /** 响应式状态：explainStartTime 相关 UI 或数据 */
  const explainStartTime = ref('');

  /** 响应式状态：explainEndTime 相关 UI 或数据 */
  const explainEndTime = ref(0);

  /** 响应式状态：explainPeriodNum 相关 UI 或数据 */
  const explainPeriodNum = ref(0);

  /** 响应式状态：explainCycleDays 相关 UI 或数据 */
  const explainCycleDays = ref(0);

  /** 响应式状态：explainRankThreshold 相关 UI 或数据 */
  const explainRankThreshold = ref(10);

  /** 响应式状态：列表数据 */
  const rewardExplainList = ref<RankAppExplainRewardVO[]>([]);

  /** 响应式状态：isActivityEnded 相关 UI 或数据 */
  const isActivityEnded = ref(false);

  /** 前三名、其余名次列表 */
  const topThreeList = ref<RankItem[]>([]);

  /** 响应式状态：列表数据 */
  const rankList = ref<RankItem[]>([]);

  /** latest-rank 的 currentUserRank：undefined=未带字段（沿用列表推断），null=未上榜，对象=在榜信息 */
  const latestCurrentUserRank = ref<RankAppCurrentUserRankVO | null | undefined>(undefined);

  /** 响应式状态：加载中状态 */
  const isLoading = ref(false);

  /** 响应式状态：分页 */
  const rankPageNo = ref(1);

  /** 响应式状态：总条数 */
  const rankListTotal = ref(0);

  /** 响应式状态：加载中状态 */
  const rankListLoading = ref(false);

  /** 响应式状态：列表是否已全部加载 */
  const rankListFinished = ref(true);

  /** 响应式状态：下拉刷新 */
  const rankRefreshing = ref(false);

  /** 响应式状态：rankListBoundActivityId 相关 UI 或数据 */
  const rankListBoundActivityId = ref(0);

  /** 分页且首屏未滚动：禁用 List 自动 check，避免内容不足一屏时误触 getRankLatestRankPage */
  const rankPageLazyDisabled = ref(false);

  /** 响应式状态：rankSummaryListLen 相关 UI 或数据 */
  const rankSummaryListLen = ref(0);

  /** 响应式状态：rankExplainInFlight 相关 UI 或数据 */
  const rankExplainInFlight = ref<Promise<number> | null>(null);

  /** latestRankInFlight */
  let latestRankInFlight: {
    id: number;
    promise: Promise<void>;
  } | null = null;

  /** getTopRankBadge */
  const getTopRankBadge = (index: number) =>
    topRankBadges[index] ?? topRankBadges[topRankBadges.length - 1];

  /** 统一时间戳为毫秒：兼容秒/毫秒，非法返回 0 */
  const toMsTimestamp = (raw: unknown) => {
    /** n */
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return 0;
    return n > 1e12 ? n : n * 1000;
  };

  /** getLocalTimezoneDisplay */
  const getLocalTimezoneDisplay = (): string => {
    /** offsetMin */
    const offsetMin = -new Date().getTimezoneOffset();

    /** sign */
    const sign = offsetMin >= 0 ? '+' : '-';

    /** abs */
    const abs = Math.abs(offsetMin);

    /** h */
    const h = Math.floor(abs / 60);

    /** m */
    const m = abs % 60;

    /** utcPart */
    const utcPart =
      m === 0
        ? `UTC${sign}${h}`
        : `UTC${sign}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    return ` (${utcPart})`;
  };
  const localTimezoneLabel = computed(() => getLocalTimezoneDisplay());
  /** 金额展示：不强制补零，去掉无意义尾随 0 */
  const formatAmount = (val: unknown) => {
    /** n */
    const n = typeof val === 'number' ? val : Number(val);
    if (!Number.isFinite(n)) return '0';
    return Number.isInteger(n) ? String(n) : String(n).replace(/(?:\.0+|(\.\d*?[1-9])0+)$/, '$1');
  };
  /** 从用户 store 取当前用户 uid */
  const getMyUid = () => {
    /** info */
    const info = (userStore.getUserInfo ?? {}) as Record<string, unknown>;

    /** 用户或路由 uid：uid */
    const uid = info.uid ?? info.userId ?? info.id;
    return typeof uid === 'number' ? uid : Number(uid);
  };
  /** 将接口排行项转为页面展示的 RankItem */
  const mapRankItem = (item: any): RankItem => {
    /** 用户或路由 uid：myUid */
    const myUid = getMyUid();

    /** 用户或路由 uid：uid */
    const uid = Number(item?.uid);

    /** name */
    const name = item?.uidMask as string;

    /** metricValue */
    const metricValue = Number(item?.metricValue) || 0;

    /** 金额输入：rewardAmount */
    const rewardAmount = item?.rewardAmount;

    /** rankNoRaw */
    const rankNoRaw = Number(item?.rankNo);

    /** rawAv */
    const rawAv = item?.avatar;

    /** avatar */
    const avatar = typeof rawAv === 'string' && rawAv.trim() ? rawAv : DEFAULT_AVATAR;
    return {
      id: uid || Number(item?.rankNo) || Math.random(),
      rankNo: Number.isFinite(rankNoRaw) ? rankNoRaw : undefined,
      name,
      avatar,
      metric: String(metricValue),
      amount: formatAmount(rewardAmount),
      isSelf: Number.isFinite(myUid) && Number.isFinite(uid) ? myUid === uid : false
    };
  };
  const mapCurrentUserRankToFooterUser = (cur: RankAppCurrentUserRankVO): RankItem => {
    /** 用户或路由 uid：uid */
    const uid = Number(cur.uid);

    /** name */
    const name =
      (cur.nickname as string) ||
      (cur.uidMask as string) ||
      (Number.isFinite(uid) ? String(uid) : '--');

    /** rawAvatar */
    const rawAvatar = cur.avatar;

    /** avatar */
    const avatar = typeof rawAvatar === 'string' && rawAvatar.trim() ? rawAvatar : DEFAULT_AVATAR;
    return {
      id: Number.isFinite(uid) ? uid : Number(cur.rankNo) || 0,
      name,
      avatar,
      metric: String(Number(cur.metricValue) || 0),
      amount: formatAmount(cur.rewardAmount),
      isSelf: true
    };
  };
  const findSelfInRankLists = () =>
    [...topThreeList.value, ...rankList.value].find((r) => r.isSelf);
  const footerRankLabelFromLists = () => {
    /** self */
    const self = findSelfInRankLists();
    if (!self) return t('rank_not_on_list');

    /** topIdx */
    const topIdx = topThreeList.value.findIndex((r) => r.id === self.id);

    /** listIdx */
    const listIdx = rankList.value.findIndex((r) => r.id === self.id);
    if (topIdx >= 0) return t('rank_rank_n', [String(topIdx + 1)]);
    if (listIdx >= 0) return t('rank_rank_n', [String(listIdx + 4)]);
    return t('rank_not_on_list');
  };
  const footerUser = computed(() => {
    /** cur */
    const cur = latestCurrentUserRank.value;
    if (cur && typeof cur === 'object') return mapCurrentUserRankToFooterUser(cur);

    /** self */
    const self = findSelfInRankLists();
    if (self) return self;

    /** info */
    const info = (userStore.getUserInfo ?? {}) as Record<string, unknown>;

    /** name */
    const name = (info.nickname as string) || (info.userName as string) || '--';
    return {
      id: 0,
      name,
      avatar: (info.avatar as string) || DEFAULT_AVATAR,
      metric: '0',
      amount: '0'
    };
  });
  const footerLabel = computed(() => {
    /** apiRank */
    const apiRank = latestCurrentUserRank.value;
    if (apiRank !== undefined) {
      if (apiRank === null) return t('rank_not_on_list');
      const no = Number(apiRank.rankNo);
      return Number.isFinite(no) ? t('rank_rank_n', [String(no)]) : t('rank_not_on_list');
    }
    return footerRankLabelFromLists();
  });
  /** 前三名展示顺序：左=2 中=1 右=3 */
  const topThreeOrder = computed(() => {
    /** 列表数据：list */
    const list = topThreeList.value;
    if (list.length < 2) return list.map((item, i) => ({ ...item, rank: i + 1 }));

    /** 解构赋值：组合式 API 返回的一组方法或状态 */
    const [first, second, third] = list;
    return [
      second ? { ...second, rank: 2 } : null,
      first ? { ...first, rank: 1 } : null,
      third ? { ...third, rank: 3 } : null
    ].filter(Boolean) as (RankItem & {
      rank: number;
    })[];
  });
  const hasRankData = computed(() => topThreeList.value.length > 0 || rankList.value.length > 0);
  const extractRankPageList = (data: unknown): RankAppLatestRankItemVO[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data as RankAppLatestRankItemVO[];

    /** o */
    const o = data as Record<string, unknown>;
    if (Array.isArray(o.list)) return o.list as RankAppLatestRankItemVO[];
    if (Array.isArray(o.records)) return o.records as RankAppLatestRankItemVO[];
    if (Array.isArray(o.rankList)) return o.rankList as RankAppLatestRankItemVO[];
    return [];
  };
  const extractRankPageTotal = (data: unknown): number => {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return 0;

    /** o */
    const o = data as Record<string, unknown>;

    /** 国际化文案：t */
    const t = o.total ?? o.totalCount ?? o.totalElements;

    /** n */
    const n = Number(t);
    return Number.isFinite(n) ? n : 0;
  };
  const activityFromExplain = (activityId: number) => {
    /** id */
    const id = Number(activityId);
    return activityData.value.find(
      (a: any) => Number(a?.activityId ?? a?.activeId ?? a?.activeID ?? a?.id) === id
    );
  };
  const explainRankTotal = (activityId: number): number | undefined => {
    /** row */
    const row = activityFromExplain(activityId);
    if (!row) return undefined;

    /** raw */
    const raw =
      row.rankTotal ??
      row.rank_total ??
      row.totalRank ??
      row.rankCount ??
      row.rank_total_count ??
      row.total ??
      row.rankListTotal;

    /** n */
    const n = Number(raw);
    return Number.isFinite(n) ? n : undefined;
  };
  const shouldFetchRankLatestRankPage = (activityId: number): boolean => {
    if (!activityId) return false;

    /** rt */
    const rt = explainRankTotal(activityId);

    /** len */
    const len = rankSummaryListLen.value;
    if (Number.isFinite(len) && len > 10) return true;
    if (rt !== undefined && rt > 10) return true;
    if (rt === undefined && Number.isFinite(len) && len >= 10) return true;
    return false;
  };
  const filterBeyondPodium = (rows: RankAppLatestRankItemVO[]): RankAppLatestRankItemVO[] => {
    if (topThreeList.value.length < 3) return rows;
    return rows.filter((row) => {
      const no = Number(row.rankNo);
      return !Number.isFinite(no) || no > 3;
    });
  };
  const advanceRankPageAfterSuccess = (rawLen: number) => {
    if (!rawLen || rawLen < RANK_PAGE_SIZE) {
      rankListFinished.value = true;
      return;
    }
    if (rankListTotal.value > 0) {
      const maxRest = Math.max(0, rankListTotal.value - 3);
      if (rankList.value.length >= maxRest) {
        rankListFinished.value = true;
        return;
      }
    }
    rankPageNo.value += 1;
  };
  const endRankListFetch = () => {
    rankListFinished.value = true;
    rankListLoading.value = false;
  };
  const fetchRankListPage = async (reset: boolean): Promise<void> => {
    /** activityId */
    const activityId = Number(activeTab.value) || 0;
    if (!activityId || !shouldFetchRankLatestRankPage(activityId)) {
      endRankListFetch();
      return;
    }
    if (!reset && rankListFinished.value) {
      rankListLoading.value = false;
      return;
    }
    if (reset) {
      rankPageNo.value = 1;
      rankList.value = [];
      rankListFinished.value = false;
      rankListTotal.value = 0;
    }
    rankListLoading.value = true;
    try {
      const res = await getRankLatestRankPage({
        activityId,
        periodId: periodId.value,
        periodVersion: periodVersion.value,
        pageNo: rankPageNo.value,
        pageSize: RANK_PAGE_SIZE
      });
      if (!res || res.code !== 0 || res.data === undefined || res.data === null) {
        rankListFinished.value = true;
        return;
      }
      const raw = extractRankPageList(res.data);
      const total = extractRankPageTotal(res.data);
      if (total > 0) rankListTotal.value = total;
      const sorted = [...raw].sort((a, b) => Number(a.rankNo) - Number(b.rankNo));
      const mapped = filterBeyondPodium(sorted).map(mapRankItem);
      rankList.value = reset ? mapped : [...rankList.value, ...mapped];
      advanceRankPageAfterSuccess(raw.length);
    } catch {
      rankListFinished.value = true;
    } finally {
      rankListLoading.value = false;
    }
  };
  const displayRowRank = (item: RankItem, index: number) => {
    /** n */
    const n = item.rankNo;
    if (n != null && Number.isFinite(n)) return String(n);
    return String(index + 4);
  };
  /** 从活动对象提取 activityImage 并更新 Banner */
  const updateBannerByActivity = (activity: any | null | undefined) => {
    /** img */
    const img = activity?.activityImage;
    bannerImage.value = typeof img === 'string' && img.trim() ? img : rankBanner;
  };
  /** 说明弹窗数据统一使用第一个接口（getRankExplain）的活动对象 */
  const applyExplainActivity = (activity: any | null | undefined) => {
    if (!activity) {
      explainActivityName.value = '';
      explainDesc.value = '';
      explainStartTime.value = '';
      explainEndTime.value = 0;
      explainPeriodNum.value = 0;
      explainCycleDays.value = 0;
      explainRankThreshold.value = 10;
      rewardExplainList.value = [];
      isActivityEnded.value = false;
      return;
    }
    explainActivityName.value = activity.activityName || '';
    explainDesc.value = activity.activityDesc || '';

    /** rawStart */
    const rawStart = Number(activity.startTime);
    if (Number.isFinite(rawStart) && rawStart > 0) {
      const ts = toMsTimestamp(rawStart);
      explainStartTime.value = new Date(ts).toLocaleString();
    } else {
      explainStartTime.value = '';
    }
    explainEndTime.value = toMsTimestamp(activity.endTime);
    isActivityEnded.value = explainEndTime.value > 0 && Date.now() >= explainEndTime.value;
    explainPeriodNum.value = Number(activity.periodNum) || 0;
    explainCycleDays.value = Number(activity.cycleDays) || 0;
    explainRankThreshold.value = Number(activity.rankThreshold) || 10;
    rewardExplainList.value = Array.isArray(activity.rewardList) ? activity.rewardList : [];
  };
  const applyLatestCurrentUserRank = (activity: any) => {
    if (!Object.prototype.hasOwnProperty.call(activity, 'currentUserRank')) {
      latestCurrentUserRank.value = undefined;
      return;
    }

    /** v */
    const v = activity.currentUserRank;
    if (v == null) {
      latestCurrentUserRank.value = null;
      return;
    }
    if (typeof v === 'object' && !Array.isArray(v)) {
      latestCurrentUserRank.value = v as RankAppCurrentUserRankVO;
      return;
    }

    /** n */
    const n = typeof v === 'number' ? v : Number(v);
    latestCurrentUserRank.value = Number.isFinite(n) ? { rankNo: n } : null;
  };
  const applyActivity = (activity: any | null | undefined) => {
    if (!activity) {
      topThreeList.value = [];
      rankList.value = [];
      latestCurrentUserRank.value = undefined;
      bannerImage.value = rankBanner;
      rankPageNo.value = 1;
      rankListTotal.value = 0;
      rankListFinished.value = true;
      rankSummaryListLen.value = 0;
      rankPageLazyDisabled.value = false;
      return;
    }
    applyLatestCurrentUserRank(activity);
    updateBannerByActivity(activity);

    /** rankRaw */
    const rankRaw = Array.isArray(activity.rankList) ? [...activity.rankList] : [];
    rankRaw.sort((a: any, b: any) => Number(a?.rankNo) - Number(b?.rankNo));
    topThreeList.value = rankRaw.map(mapRankItem).slice(0, 3);

    /** aid */
    const aid = Number(activity.activityId ?? activity.activeId ?? activity.activeID) || 0;
    rankSummaryListLen.value = rankRaw.length;
    if (aid && !shouldFetchRankLatestRankPage(aid)) {
      const rest = rankRaw.filter((r: any) => Number(r?.rankNo) > 3);
      rankList.value = rest.map(mapRankItem);
      const rt = explainRankTotal(aid);
      rankListTotal.value = rt !== undefined ? rt : rankRaw.length;
      rankListFinished.value = true;
      rankPageNo.value = 1;
      rankPageLazyDisabled.value = false;
    } else {
      rankList.value = [];
      rankListTotal.value = 0;
      rankListFinished.value = false;
      rankPageNo.value = 1;
      /* 需分页：先禁用 List，等用户滚动后再允许 check（否则 watch 会在 loading 置 false 时立刻误判触底） */
      rankPageLazyDisabled.value = Boolean(aid) && shouldFetchRankLatestRankPage(aid);
    }
  };
  const unwrapLatestRankPayload = (data: unknown) => {
    return Array.isArray(data) ? data[0] : data;
  };
  const periodId = ref(0);
  const periodVersion = ref(0);
  const fetchLatestRank = (activityId: number): Promise<void> => {
    if (!activityId) {
      applyActivity(null);
      return Promise.resolve();
    }
    if (latestRankInFlight && latestRankInFlight.id === activityId) {
      return latestRankInFlight.promise;
    }

    /** boundId */
    const boundId = activityId;

    /** promiseRef */
    const promiseRef: {
      v?: Promise<void>;
    } = {};
    promiseRef.v = (async (): Promise<void> => {
      isLoading.value = true;
      try {
        const res = await getLatestRank({ activityId: boundId });
        if (!res || res.code !== 0) {
          applyActivity(null);
          return;
        }
        periodId.value = res.data.periodId;
        periodVersion.value = res.data.periodVersion ?? 0;
        applyActivity(unwrapLatestRankPayload(res.data));
        /* 多于 10 人走分页：不在此处请求 getRankLatestRankPage，由用户下滑 List 触发 onRankListLoad */
        rankListLoading.value = false;
      } catch {
        applyActivity(null);
      } finally {
        isLoading.value = false;
        if (latestRankInFlight?.id === boundId && latestRankInFlight.promise === promiseRef.v) {
          latestRankInFlight = null;
        }
      }
    })();

    /** runPromise */
    const runPromise = promiseRef.v!;
    latestRankInFlight = { id: activityId, promise: runPromise };
    return runPromise;
  };
  const onRankListLoad = () => {
    void fetchRankListPage(false);
  };
  const onRankPullRefresh = async () => {
    rankRefreshing.value = true;

    /** id */
    const id = Number(activeTab.value) || 0;
    if (!id) {
      rankRefreshing.value = false;
      return;
    }
    try {
      await fetchLatestRank(id);
    } finally {
      rankRefreshing.value = false;
    }
  };
  const fetchRankExplain = (): Promise<number> => {
    /** existing */
    const existing = rankExplainInFlight.value;
    if (existing) return existing;

    /** routeActivityId */
    const routeActivityId = getRouteActivityId();

    /** p */
    const p = getRankExplain()
      .then((res) => {
        if (!res || res.code !== 0) {
          rankListBoundActivityId.value = 0;
          return routeActivityId || 0;
        }
        const data = res.data;
        const list = Array.isArray(data) ? data : data ? [data] : [];
        const first = list[0];
        const byRoute =
          routeActivityId > 0
            ? list.find((a: any) => Number(a?.activityId) === routeActivityId)
            : undefined;
        const selectedId =
          Number(byRoute?.activityId) ||
          Number(first?.activeId ?? first?.activeID ?? first?.activityId) ||
          0;
        rankListBoundActivityId.value = selectedId > 0 ? selectedId : 0;
        activityData.value = list;
        if (!list.length) return routeActivityId || 0;
        const selectedActivity = byRoute ?? first;
        updateBannerByActivity(selectedActivity);
        applyExplainActivity(selectedActivity);
        return selectedId;
      })
      .finally(() => {
        if (rankExplainInFlight.value === p) {
          rankExplainInFlight.value = null;
        }
      });
    rankExplainInFlight.value = p;
    return p;
  };
  /** 返回上一页 */
  const handleBack = () => {
    router.push('/');
  };
  const goPrizeRecords = () => {
    /** id */
    const id = Number(activeTab.value) || 0;
    if (id > 0) {
      void router.push({ path: '/Rank/Record', query: { activityId: String(id) } });
    } else {
      void router.push('/Rank/Record');
    }
  };
  /** 显示活动规则弹窗 */
  const handleShowRule = () => {
    showRule.value = true;
  };
  /** 关闭活动规则弹窗 */
  const handleHideRule = () => {
    showRule.value = false;
  };
  const onActivityTabChange = (name: string | number) => {
    activeTab.value = name;

    /** activityId */
    const activityId = Number(name) || 0;

    /** selected */
    const selected = activityData.value.find((a: any) => Number(a?.activityId) === activityId);
    updateBannerByActivity(selected);
    applyExplainActivity(selected);
    if (activityId > 0 && rankListBoundActivityId.value !== activityId) {
      rankListBoundActivityId.value = activityId;
      void fetchLatestRank(activityId);
    }
  };
  const tryUnlockRankPageLazyList = () => {
    if (!rankPageLazyDisabled.value) return;

    /** y */
    const y = window.scrollY || document.documentElement.scrollTop || 0;
    if (y > 2) {
      rankPageLazyDisabled.value = false;
    }
  };
  let touchStartYForRank = 0;
  const onRankTouchStart = (e: TouchEvent) => {
    touchStartYForRank = e.touches[0]?.clientY ?? 0;
  };
  const onRankTouchMove = (e: TouchEvent) => {
    if (!rankPageLazyDisabled.value) return;

    /** y */
    const y = e.touches[0]?.clientY ?? 0;
    /* 手指上移 = 内容上滚，即向下浏览 */
    if (touchStartYForRank - y > 16) {
      rankPageLazyDisabled.value = false;
    }
  };
  onMounted(() => {
    window.addEventListener('scroll', tryUnlockRankPageLazyList, { passive: true });
    window.addEventListener('touchstart', onRankTouchStart, { passive: true });
    window.addEventListener('touchmove', onRankTouchMove, { passive: true });
    fetchRankExplain().then((activityId) => {
      if (activityId > 0) {
        void fetchLatestRank(activityId);
      } else {
        applyActivity(null);
      }
      activeTab.value = activityId;
    });
  });
  onUnmounted(() => {
    window.removeEventListener('scroll', tryUnlockRankPageLazyList);
    window.removeEventListener('touchstart', onRankTouchStart);
    window.removeEventListener('touchmove', onRankTouchMove);
  });
</script>

<style scoped lang="less">
  @rank-bg: #050914;
  @rank-accent: #0066ff;
  @rank-muted: #7e8daa;
  @rank-card-bg: rgba(255, 255, 255, 0.05);

  .rank-page :deep(.van-nav-bar__title),
  .rank-page :deep(.van-icon),
  .rank-page :deep(.van-nav-bar__text) {
    color: #ffffff;
  }

  .rank-page__nav-right {
    font-size: 0.28rem;
    color: @rank-accent;
    cursor: pointer;
  }

  .rank-page__banner-img {
    width: 100%;
    height: 3.8rem;
    display: block;
    object-fit: cover;
  }

  .rank-page {
    min-height: 100vh;
    background: @rank-bg;
    color: #ffffff;
    padding-bottom: calc(1.8rem + env(safe-area-inset-bottom));
    position: relative;
    width: 100%;
    max-width: 8rem;
    margin: 0 auto;
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'PingFang SC', sans-serif;
  }

  .rank-page__content {
    padding: 0.2rem 0.32rem 0.4rem;
  }

  .rank-page__prize-records {
    display: flex;
    justify-content: flex-end;
    margin-top: 0.2rem;
    margin-bottom: 0.1rem;
  }

  .rank-page__prize-records-inner {
    display: inline-flex;
    align-items: center;
    gap: 0.08rem;
    padding: 0.08rem 0.2rem 0.08rem 0.24rem;
    border-radius: 999px;
    background: rgba(0, 102, 255, 0.12);
    border: 1px solid rgba(120, 185, 255, 0.28);
  }

  .rank-page__prize-records-text {
    font-size: 0.26rem;
    font-weight: 600;
    color: rgba(210, 232, 255, 0.95);
    line-height: 1.2;
  }

  .rank-page__prize-records-arrow {
    font-size: 0.22rem;
    color: @rank-accent;
    opacity: 0.88;
  }

  .rank-page__pull {
    min-height: 50vh;
  }

  .rank-page__list-wrap {
    min-height: 1rem;
  }

  .rank-page__banner {
    position: relative;
    margin-top: 0.24rem;
    border-radius: 0.24rem;
    overflow: hidden;
    background: linear-gradient(135deg, #0a1628 0%, #0d1f3c 50%, #061528 100%);
    box-shadow: 0 0.12rem 0.36rem rgba(0, 102, 255, 0.15);
    height: 3.8rem;
  }

  .rank-page__banner-dots {
    position: absolute;
    bottom: 0.16rem;
    left: 0.24rem;
    display: flex;
    gap: 0.12rem;
  }

  .rank-page__banner-dot {
    width: 0.24rem;
    height: 0.06rem;
    border-radius: 0.03rem;
    background: rgba(255, 255, 255, 0.25);
    transition: background 0.2s;
  }

  .rank-page__banner-dot--active {
    background: #ffffff;
  }

  .rank-page__tabs {
    margin-top: 0.22rem;
    margin-bottom: 0.16rem;
  }

  .rank-page__tabs :deep(.van-tabs__wrap) {
    height: auto;
    overflow: visible;
  }

  .rank-page__tabs :deep(.van-tabs__nav--card) {
    display: flex;
    align-items: center;
    border: none;
    background: transparent;
    gap: 0.2rem;
    padding: 0;
    height: 0.88rem !important;
  }

  .rank-page__tabs :deep(.van-tab--card) {
    flex: 1;
    min-width: 0;
    height: 0.88rem;
    padding: 0 0.2rem;
    box-sizing: border-box;
    border-radius: 0.2rem;
    border: none;
    background: rgba(30, 40, 65, 0.6);
    color: @rank-muted;
    font-size: 0.3rem;
    font-weight: 600;
    text-align: center;
  }

  .rank-page__tabs :deep(.van-tab--active) {
    background: linear-gradient(180deg, #006ed2 0%, #012688 100%);
    color: #ffffff;
  }

  .rank-page__tab-title {
    font-size: 0.3rem !important;
    font-weight: 600 !important;
    white-space: nowrap;
  }

  .rank-page__table-header {
    padding: 0 0.2rem 0.12rem;
    display: flex;
    align-items: center;
    font-size: 0.22rem;
    color: @rank-muted;
  }

  .rank-page__table-header-col {
    flex-shrink: 0;
  }

  .rank-page__table-header-col--rank {
    width: 0.9rem;
  }

  .rank-page__table-header-col--user {
    flex: 1;
  }

  .rank-page__table-header-col--value {
    width: 1.6rem;
    text-align: right;
  }

  .rank-page__table-header-col--metric {
    // width: 1.4rem;
    text-align: center;
  }

  .rank-page__empty {
    margin-top: 0.36rem;
    padding: 0.08rem;
    border-radius: 0.28rem;
    background: linear-gradient(
      145deg,
      rgba(0, 136, 255, 0.35) 0%,
      rgba(0, 68, 255, 0.12) 45%,
      rgba(5, 9, 20, 0.4) 100%
    );
    box-shadow:
      0 0.16rem 0.48rem rgba(0, 102, 255, 0.12),
      inset 0 1px 0 rgba(255, 255, 255, 0.06);
  }

  .rank-page__empty-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 1.35rem 0.4rem 1.1rem;
    border-radius: 0.22rem;
    background: linear-gradient(180deg, rgba(13, 31, 60, 0.95) 0%, rgba(5, 9, 20, 0.98) 100%);
    border: 1px solid rgba(120, 180, 255, 0.12);
  }

  .rank-page__empty-figure {
    position: relative;
    width: 1.76rem;
    height: 1.76rem;
    margin-bottom: 0.36rem;
  }

  .rank-page__empty-orbit {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 2px solid rgba(0, 136, 255, 0.2);
    border-top-color: rgba(0, 200, 255, 0.85);
    border-right-color: rgba(0, 102, 255, 0.5);
    animation: rank-empty-spin 1.35s linear infinite;
    box-shadow: 0 0 0.24rem rgba(0, 136, 255, 0.15);
  }

  .rank-page__empty-icon-wrap {
    position: absolute;
    inset: 0.22rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: radial-gradient(
      circle at 35% 30%,
      rgba(100, 200, 255, 0.25) 0%,
      rgba(0, 68, 180, 0.35) 55%,
      rgba(5, 9, 20, 0.9) 100%
    );
    box-shadow:
      inset 0 0.06rem 0.2rem rgba(255, 255, 255, 0.08),
      0 0.12rem 0.28rem rgba(0, 0, 0, 0.35);
  }

  .rank-page__empty-icon {
    font-size: 0.72rem;
    color: #b8e4ff;
    filter: drop-shadow(0 0.04rem 0.12rem rgba(0, 180, 255, 0.45));
  }

  .rank-page__rule-desc {
    white-space: pre-line;
  }

  .rank-page__empty-title {
    margin: 0;
    font-size: 0.3rem;
    font-weight: 600;
    color: #e8f0ff;
    letter-spacing: 0.04em;
    text-align: center;
    line-height: 1.45;
  }

  .rank-page__empty-dots {
    display: flex;
    gap: 0.12rem;
    margin: 0.28rem 0 0;
    padding: 0;
    list-style: none;
  }

  .rank-page__empty-dots span {
    width: 0.1rem;
    height: 0.1rem;
    border-radius: 50%;
    background: linear-gradient(180deg, #66c4ff 0%, #0088ff 100%);
    opacity: 0.35;
    animation: rank-empty-bounce 1.1s ease-in-out infinite;
  }

  .rank-page__empty-dots span:nth-child(2) {
    animation-delay: 0.15s;
  }

  .rank-page__empty-dots span:nth-child(3) {
    animation-delay: 0.3s;
  }

  @keyframes rank-empty-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes rank-empty-bounce {
    0%,
    80%,
    100% {
      opacity: 0.3;
      transform: scale(0.85);
    }

    40% {
      opacity: 1;
      transform: scale(1);
    }
  }

  .rank-page__top3 {
    display: flex;
    justify-content: center;
    align-items: flex-end;
    gap: 0.2rem;
    margin-top: 1rem;
  }

  .rank-page__top3-item {
    flex: 1;
    max-width: 2.2rem;
    min-width: 0;
    padding: 0.3rem 0.16rem 0.24rem;
    border-radius: 0.2rem;
    background: @rank-card-bg;
    text-align: center;
    position: relative;
  }

  .rank-page__top3-item--1 {
    height: 3.05rem;
    order: 2;
    border-bottom: none !important;
    border: 1px solid #e7b368;
    background: linear-gradient(180deg, #4c463f 0%, rgba(80, 74, 65, 0) 100%);
  }

  .rank-page__top3-item--2 {
    height: 2.63rem;
    order: 1;
    background: linear-gradient(180deg, #3b3b5b 0%, #353555 50%, #050914 100%);
    border-bottom: none !important;
    border: 1px solid #59599d;
  }

  .rank-page__top3-item--3 {
    height: 2.3rem;
    order: 3;
    border-bottom: none !important;
    border: 1px solid #84347d;
    background: linear-gradient(180deg, #462f42 0%, rgba(70, 47, 66, 0) 100%);
  }

  .rank-page__top3-avatar-wrapper {
    position: relative;
    display: inline-block;
    margin-bottom: 0.16rem;
    top: -1rem;
  }

  .rank-page__top3-avatar {
    width: 1.44rem;
    height: 1.44rem;
    border-radius: 50%;
    display: block;
  }

  .rank-page__top3-rank-badge {
    position: absolute;
    right: -0.06rem;
    bottom: -0.06rem;
    width: 0.48rem;
    height: 0.48rem;
  }

  .rank-page__top3-name {
    font-size: 0.3rem;
    font-weight: 700;
    color: #ffffff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .rank-page__top3-metric,
  .rank-page__top3-reward {
    margin-top: 0.06rem;
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 0.04rem;
    color: #ffffff;
  }

  .rank-page__top3-metric-value,
  .rank-page__top3-reward-value {
    font-size: 0.24rem;
    font-weight: 700;
  }

  .rank-page__top3-metric-unit,
  .rank-page__top3-reward-unit {
    font-size: 0.18rem;
    color: @rank-muted;
  }

  .rank-page__list {
    margin-top: 0.24rem;
    display: flex;
    flex-direction: column;
    gap: 0.16rem;
  }

  .rank-page__row {
    display: flex;
    align-items: center;
    padding: 0.24rem 0.28rem;
    font-size: 0.26rem;
    color: #ffffff;
    border-radius: 0.24rem;
    background: #171d3a;
  }

  .rank-page__row--self {
    border: 1px solid rgba(0, 102, 255, 0.4);
    background: rgba(0, 102, 255, 0.12);
  }

  .rank-page__row-rank {
    width: 0.9rem;
    text-align: center;
    font-weight: 700;
    font-size: 0.28rem;
  }

  .rank-page__row-user {
    flex: 1;
    display: flex;
    align-items: center;
    min-width: 0;
  }

  .rank-page__row-avatar {
    width: 0.56rem;
    height: 0.56rem;
    border-radius: 50%;
    margin-right: 0.14rem;
    flex-shrink: 0;
  }

  .rank-page__row-name {
    font-size: 0.26rem;
    font-weight: 600;
    color: #ffffff;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .rank-page__row-metric {
    width: 1.4rem;
    text-align: center;
    font-size: 0.26rem;
    font-weight: 700;
    color: #ffffff;
  }

  .rank-page__row-value {
    width: 1.6rem;
    text-align: right;
    font-size: 0.26rem;
    font-weight: 700;
    color: #ffffff;
  }

  /* 底部栏：岛式悬浮，垂直蓝渐变，不贴边 */
  .rank-page__footer {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 0.2rem 0.32rem;
    padding-bottom: calc(0.2rem + env(safe-area-inset-bottom));
    z-index: 10;
  }

  .rank-page__footer-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.24rem 0.4rem;
    border-radius: 0.2rem;
    background: linear-gradient(180deg, #3165f9 0%, #1b3fb3 100%);
    box-shadow: 0 0.08rem 0.2rem rgba(0, 0, 0, 0.3);
    color: #ffffff;
  }

  .rank-page__footer-label {
    font-size: 0.28rem;
    font-weight: 500;
    color: #ffffff;
    flex-shrink: 0;
  }

  .rank-page__footer-user {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.24rem;
    min-width: 0;
    margin-left: 0.24rem;
  }

  .rank-page__footer-avatar {
    width: 0.36rem;
    height: 0.36rem;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.5);
    flex-shrink: 0;
  }

  .rank-page__footer-name {
    font-size: 0.28rem;
    font-weight: 500;
    color: #ffffff;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .rank-page__footer-metric {
    font-size: 0.28rem;
    font-weight: 600;
    color: #ffffff;
    text-align: center;
    min-width: 0.8rem;
  }

  .rank-page__footer-value {
    font-size: 0.28rem;
    font-weight: 600;
    color: #ffffff;
    text-align: right;
    min-width: 1.6rem;
  }

  .rank-page__footer--ended .rank-page__footer-bar {
    opacity: 0.9;
  }

  @media screen and (min-width: 600px) {
    .rank-page {
      max-width: 8rem;
      margin: 0 auto;
    }

    .rank-page__footer {
      left: 50%;
      right: auto;
      width: 100%;
      max-width: 8rem;
      transform: translateX(-50%);
    }
  }

  .rank-page__footer-btn {
    font-size: 0.28rem;
    margin-top: 0.16rem;
  }

  .rank-page__footer-btn--disabled {
    background: #2b3143 !important;
    color: rgba(255, 255, 255, 0.7) !important;
    border: none !important;
  }

  .rank-page__rule-popup {
    width: 90% !important;
    height: 76%;
    top: 53%;
  }

  .rank-page__rule-popup :deep(.van-popup__content) {
    overflow: visible;
    position: relative;
    z-index: 1;
  }

  .rank-page__rule-popup-wrap {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .rank-page__rule-overlay {
    background: rgba(0, 0, 0, 0.8);
    z-index: 0;
  }

  /* 设计：描边渐变 #006ED2→#012688，填充渐变 #091F4A→#0A0F29 */
  .rank-page__rule-card {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    padding: 1px;
    box-sizing: border-box;
    border-radius: 0.44rem;
    background: linear-gradient(180deg, #091f4a 0%, #0a0f29 100%);
    color: #ffffff;
  }

  .rank-page__rule-inner {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    padding: 0;
    border-radius: 0.42rem;
    overflow: hidden;
    background: linear-gradient(180deg, #091f4a 0%, #0a0f29 100%);
  }

  /* 顶部标题图固定，不随正文滚动 */
  .rank-page__rule-header {
    flex-shrink: 0;
    padding: 0.48rem 0.2rem 0.12rem;
    background: #091f4a;
  }

  .rank-page__rule-scroll {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 0 0.4rem 0.36rem;
    -webkit-overflow-scrolling: touch;
  }

  .rank-page__rule-tab {
    position: relative;
    width: 3.7rem;
    height: 0.8rem;
    top: -0.5rem;
  }

  .rank-page__rule-tab-bg {
    display: block;
    width: 100%;
    height: 100%;
  }

  .rank-page__rule-tab-text {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.3rem;
    font-weight: 600;
    color: #ffffff;
  }

  .rank-page__rule-section {
    margin-top: 0.42rem;
    font-size: 0.24rem;
    line-height: 1.7;
  }

  .rank-page__rule-section--first {
    margin-top: 0.2rem;
  }

  .rank-page__rule-section-title {
    margin-bottom: 0.12rem;
    font-size: 0.28rem;
    font-weight: 600;
    color: #fff;
  }

  /* 设计：填充 #006ED2→#012688，1px 内描边渐变 #01298C→#316AE5 */
  .rank-page__rule-confirm {
    margin-top: 0.48rem;
    height: 0.9rem;
    font-size: 0.3rem;
    color: #fff !important;
    border: 1px solid transparent !important;
    background-image:
      linear-gradient(180deg, #006ed2 0%, #012688 100%),
      linear-gradient(180deg, #01298c 0%, #316ae5 100%) !important;
    background-origin: padding-box, border-box !important;
    background-clip: padding-box, border-box !important;
  }

  .rank-page__rule-confirm :deep(.van-button__text) {
    position: relative;
    z-index: 1;
  }

  .rank-page__rule-mascot {
    position: fixed;
    top: 1rem;
    right: -0.25rem;
    width: 3.1rem;
    height: auto;
    z-index: 99999;
    pointer-events: none;
    transform: rotate(-15deg);
  }

  .rank-page__rule-close {
    position: fixed;
    top: 1rem;
    right: 0.5rem;
    width: 0.72rem;
    height: 0.72rem;
    min-width: 0.72rem;
    min-height: 0.72rem;
    z-index: 99999;
    cursor: pointer;
    border-radius: 50%;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: auto;
  }

  .rank-page__rule-close img {
    width: 0.4rem;
    height: 0.4rem;
    pointer-events: none;
  }

  :deep(.van-popup) {
    background: transparent !important;
  }

  // :deep(.van-image__img) {
  //   border-radius: 50% !important;
  // }

  :deep(.van-tabs__nav--card) {
    margin: 0;
  }
</style>
