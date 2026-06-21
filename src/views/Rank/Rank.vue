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
        <span class="rank-page__nav-right" @click="handleShowRule">{{ t('rank_reward_desc') }}</span>
      </template>
    </NavBar>

    <div class="rank-page__content">
      <div class="rank-page__banner">
        <Image :src="bannerImage" class="rank-page__banner-img" width="100%" fit="cover" />
      </div>

      <div class="rank-page__records-wrap">
        <div class="rank-page__records-entry" @click="goPrizeRecords">
          <span>{{ t('rank_prize_records') }}</span>
          <Icon name="arrow" />
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
            <div class="rank-page__podium">
              <div class="rank-page__podium-stage">
                <div class="rank-page__top3">
                  <div
                    v-for="item in topThreeOrder"
                    :key="item.id"
                    class="rank-page__top3-item"
                    :class="`rank-page__top3-item--${item.rank}`"
                  >
                    <div class="rank-page__top3-avatar-wrap">
                      <Image :src="item.avatar" class="rank-page__top3-avatar" fit="cover" round />
                      <Image
                        :src="getTopRankBadge(item.rank - 1)"
                        class="rank-page__top3-badge"
                        fit="contain"
                      />
                    </div>
                    <div class="rank-page__top3-card">
                      <div class="rank-page__top3-info">
                        <div class="rank-page__top3-name">{{ item.name }}</div>
                        <div class="rank-page__top3-metric">
                          <span class="rank-page__top3-metric-val">{{ item.metric }}</span>
                          <span class="rank-page__top3-metric-lbl">{{ t('rank_metric_unit') }}</span>
                        </div>
                        <div class="rank-page__top3-metric">
                          <span class="rank-page__top3-metric-val">{{ item.amount }}</span>
                          <span class="rank-page__top3-metric-lbl">{{ t('rank_reward_unit') }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="rank-page__podium-base" aria-hidden="true"></div>
              </div>
            </div>

            <div class="rank-page__table-header rank-page__table-header--list">
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
          <span class="rank-page__footer-name">{{ footerUser?.name ?? '--' }}</span>
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

    <!-- 奖励说明弹窗：浅色卡片样式 -->
    <Popup
      v-model:show="showRule"
      round
      position="center"
      class="rank-page__rule-popup"
      overlay-class="rank-page__rule-overlay"
      :close-on-click-overlay="true"
    >
      <div class="rank-page__rule-popup-wrap">
        <!-- <button
          type="button"
          class="rank-page__rule-close"
          aria-label="close"
          @click.stop="handleHideRule"
        >
          <Icon name="cross" />
        </button> -->
        <div class="rank-page__rule-card">
          <div class="rank-page__rule-title">{{ t('rank_rule_title') }}</div>
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
              <p>{{ t('rank_condition_desc') }}{{ explainRankThreshold }}{{ t('rank_person') }}</p>
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
          </div>

          <Button type="primary" round block class="rank-page__rule-confirm" @click="handleHideRule">
            {{ t('confirm') }}
          </Button>
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
  @primary: #1a37fd;
  @primary-light: #4a86ff;
  @page-bg: #eef2fd;
  @text: #1a1d26;
  @muted: #8c93a6;
  @value: #5c6378;
  @white: #fff;
  @card-shadow: 0 0.04rem 0.2rem rgba(51, 102, 255, 0.08);

  .rank-page :deep(.van-nav-bar) {
    background: linear-gradient(180deg, #e8eeff 0%, @page-bg 100%);
  }

  .rank-page :deep(.van-nav-bar__title) {
    font-size: 0.32rem;
    font-weight: 600;
    color: @text;
  }

  .rank-page :deep(.van-nav-bar .van-icon) {
    color: @text;
  }

  .rank-page__nav-right {
    font-size: 0.26rem;
    font-weight: 500;
    color: @primary;
    cursor: pointer;
  }

  .rank-page__records-wrap {
    display: flex;
    justify-content: flex-end;
    margin: 0.16rem 0 0.04rem;
  }

  .rank-page__records-entry {
    display: inline-flex;
    align-items: center;
    gap: 0.08rem;
    padding: 0.12rem 0.28rem;
    border-radius: 999px;
    font-size: 0.26rem;
    font-weight: 600;
    color: @primary;
    background: @white;
    border: 1px solid rgba(26, 55, 253, 0.12);
    box-shadow: @card-shadow;
    cursor: pointer;
    user-select: none;
  }

  .rank-page__records-entry:active {
    opacity: 0.85;
  }



  .rank-page {
    min-height: 100vh;
    background: @page-bg;
    color: @text;
    padding-bottom: calc(1.6rem + env(safe-area-inset-bottom));
    position: relative;
    width: 100%;
    max-width: 8rem;
    margin: 0 auto;
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'PingFang SC', sans-serif;
  }

  .rank-page__content {
    padding: 0 0.32rem 0.4rem;
  }

  .rank-page__banner {
    margin-top: 0.08rem;
    border-radius: 0.24rem;
    overflow: hidden;
    box-shadow: @card-shadow;
  }

  .rank-page__banner-img {
    width: 100%;
    height: 3.2rem;
    display: block;
    object-fit: cover;
  }

  .rank-page__pull {
    min-height: 50vh;
  }

  .rank-page :deep(.van-list__finished-text),
  .rank-page :deep(.van-list__loading-text) {
    color: @muted;
    font-size: 0.24rem;
  }

  .rank-page__list-wrap {
    min-height: 1rem;
  }

  .rank-page__tabs {
    margin-top: 0.24rem;
    margin-bottom: 0.2rem;
  }

  .rank-page__tabs :deep(.van-tabs__wrap) {
    height: auto;
    overflow: visible;
  }

  .rank-page__tabs :deep(.van-tabs__nav--card) {
    display: flex;
    align-items: center;
    margin: 0;
    padding: 0.06rem;
    height: 0.76rem !important;
    border: none;
    border-radius: 999px;
    background: @white;
    box-shadow: @card-shadow;
    gap: 0.06rem;
  }

  .rank-page__tabs :deep(.van-tab--card) {
    flex: 1;
    min-width: 0;
    height: 0.64rem;
    padding: 0 0.2rem;
    box-sizing: border-box;
    border-radius: 999px;
    border: none;
    background: transparent;
    color: @muted;
    font-size: 0.26rem;
    font-weight: 400;
    text-align: center;
  }

  .rank-page__tabs :deep(.van-tab--active) {
    background: #e3eaff;
    color: @primary;
    font-weight: 600;
    box-shadow:
      inset 0 0 0.1rem 0 #fff,
      0 0.02rem 0.02rem 0 rgba(26, 55, 253, 0.2);
  }

  .rank-page__tab-title {
    font-size: 0.26rem !important;
    font-weight: inherit !important;
    white-space: nowrap;
  }

  .rank-page__table-header {
    padding: 0.08rem 0.12rem 0.16rem;
    display: flex;
    align-items: center;
    font-size: 0.22rem;
    font-weight: 400;
    color: @muted;

    &--list {
      margin-top: 0.28rem;
      padding-top: 0.04rem;
    }
  }

  .rank-page__table-header-col {
    flex-shrink: 0;
  }

  .rank-page__table-header-col--rank {
    width: 0.72rem;
  }

  .rank-page__table-header-col--user {
    flex: 1;
  }

  .rank-page__table-header-col--value {
    width: 1.56rem;
    text-align: right;
  }

  .rank-page__table-header-col--metric {
    width: 1.2rem;
    text-align: center;
  }

  .rank-page__empty {
    margin-top: 0.32rem;
    border-radius: 0.24rem;
    background: @white;
    box-shadow: @card-shadow;
  }

  .rank-page__empty-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 1.2rem 0.4rem 1rem;
    border-radius: 0.24rem;
    background: @white;
  }

  .rank-page__empty-figure {
    position: relative;
    width: 1.6rem;
    height: 1.6rem;
    margin-bottom: 0.32rem;
  }

  .rank-page__empty-orbit {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 2px solid rgba(26, 55, 253, 0.15);
    border-top-color: rgba(74, 134, 255, 0.75);
    animation: rank-empty-spin 1.35s linear infinite;
  }

  .rank-page__empty-icon-wrap {
    position: absolute;
    inset: 0.22rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(180deg, #eef2ff 0%, #e2ebff 100%);
  }

  .rank-page__empty-icon {
    font-size: 0.68rem;
    color: @primary-light;
  }

  .rank-page__rule-desc {
    white-space: pre-line;
  }

  .rank-page__empty-title {
    margin: 0;
    font-size: 0.28rem;
    font-weight: 600;
    color: @text;
    text-align: center;
    line-height: 1.45;
  }

  .rank-page__empty-dots {
    display: flex;
    gap: 0.12rem;
    margin: 0.24rem 0 0;
    padding: 0;
    list-style: none;
  }

  .rank-page__empty-dots span {
    width: 0.1rem;
    height: 0.1rem;
    border-radius: 50%;
    background: @primary-light;
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

  .rank-page__podium {
    margin-top: 0.16rem;
    overflow: visible;
  }

  .rank-page__podium-stage {
    position: relative;
    padding: 0.56rem 0.16rem 0.36rem;
    border-radius: 0.28rem;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.72) 0%, rgba(255, 255, 255, 0.38) 100%);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.95),
      0 0.06rem 0.24rem rgba(26, 55, 253, 0.07);
    overflow: visible;
  }

  .rank-page__podium-base {
    position: absolute;
    left: 0.2rem;
    right: 0.2rem;
    bottom: 0.12rem;
    height: 0.08rem;
    border-radius: 0.04rem;
    background: linear-gradient(
      90deg,
      rgba(26, 55, 253, 0.08) 0%,
      rgba(74, 134, 255, 0.22) 50%,
      rgba(26, 55, 253, 0.08) 100%
    );
  }

  .rank-page__top3 {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    gap: 0.14rem;
    position: relative;
    z-index: 1;
  }

  .rank-page__top3-item {
    position: relative;
    flex: 1;
    min-width: 0;
    max-width: 2.34rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow: visible;
  }

  .rank-page__top3-card {
    position: relative;
    width: 100%;
    padding: 0.66rem 0.1rem 0.28rem;
    border-radius: 0.28rem;
    text-align: center;
    box-sizing: border-box;
    overflow: visible;

    &::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      border: 1px solid rgba(255, 255, 255, 0.14);
      pointer-events: none;
    }
  }

  .rank-page__top3-item--1 {
    order: 2;
    z-index: 3;
    transform: translateY(-0.1rem);

    .rank-page__top3-card {
      min-height: 2.76rem;
      padding-top: 0.74rem;
      background: linear-gradient(180deg, #1a6a9e 0%, #0e4676 48%, #0a3558 100%);
      box-shadow:
        0 0.14rem 0.36rem rgba(14, 70, 118, 0.38),
        0 0 0.24rem rgba(74, 134, 255, 0.18);
    }

    .rank-page__top3-avatar-wrap::before {
      background: linear-gradient(135deg, #ffe9a8 0%, #ffc94d 45%, #e8a820 100%);
      box-shadow: 0 0 0.16rem rgba(255, 201, 77, 0.45);
    }

    .rank-page__top3-avatar-wrap {
      margin-bottom: -0.7rem;
    }

    .rank-page__top3-avatar {
      width: 1.36rem;
      height: 1.36rem;
      border-width: 0.07rem;
    }

    .rank-page__top3-badge {
      width: 0.52rem;
      height: 0.52rem;
    }

    .rank-page__top3-name {
      font-size: 0.32rem;
    }

    .rank-page__top3-metric-val {
      font-size: 0.24rem;
    }
  }

  .rank-page__top3-item--2 {
    order: 1;
    z-index: 2;

    .rank-page__top3-card {
      min-height: 2.36rem;
      background: linear-gradient(180deg, #254880 0%, #1a3766 50%, #122a52 100%);
      box-shadow: 0 0.1rem 0.28rem rgba(26, 55, 102, 0.3);
    }

    .rank-page__top3-avatar-wrap::before {
      background: linear-gradient(135deg, #f0f4ff 0%, #c8d4e8 50%, #a8b8d0 100%);
      box-shadow: 0 0 0.12rem rgba(200, 212, 232, 0.35);
    }
  }

  .rank-page__top3-item--3 {
    order: 3;
    z-index: 1;

    .rank-page__top3-card {
      min-height: 2.08rem;
      background: linear-gradient(180deg, #203060 0%, #162455 50%, #0f1a42 100%);
      box-shadow: 0 0.08rem 0.24rem rgba(22, 36, 85, 0.28);
    }

    .rank-page__top3-avatar-wrap::before {
      background: linear-gradient(135deg, #ffd4b8 0%, #e8a060 50%, #c87840 100%);
      box-shadow: 0 0 0.12rem rgba(232, 160, 96, 0.3);
    }
  }

  .rank-page__top3-avatar-wrap {
    position: relative;
    z-index: 3;
    flex-shrink: 0;
    margin-bottom: -0.62rem;

    &::before {
      content: '';
      position: absolute;
      inset: -0.07rem;
      border-radius: 50%;
      z-index: -1;
    }
  }

  .rank-page__top3-avatar {
    width: 1.22rem;
    height: 1.22rem;
    display: block;
    border: 0.06rem solid #fff;
    box-shadow: 0 0.08rem 0.22rem rgba(0, 0, 0, 0.2);
    background: #fff;
  }

  .rank-page__top3-badge {
    position: absolute;
    right: -0.02rem;
    bottom: 0.02rem;
    width: 0.46rem;
    height: 0.46rem;
    filter: drop-shadow(0 0.04rem 0.1rem rgba(0, 0, 0, 0.28));
  }

  .rank-page__top3-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.06rem;
  }

  .rank-page__top3-name {
    max-width: 100%;
    font-size: 0.3rem;
    font-weight: 700;
    color: #fff;
    line-height: 1.25;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-shadow: 0 0.02rem 0.06rem rgba(0, 0, 0, 0.18);
  }

  .rank-page__top3-metric {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 0;
    max-width: 100%;
    line-height: 1.4;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .rank-page__top3-metric-val {
    font-size: 0.22rem;
    font-weight: 600;
    color: #fff;
  }

  .rank-page__top3-metric-lbl {
    font-size: 0.2rem;
    font-weight: 400;
    color: rgba(196, 218, 248, 0.88);
  }

  .rank-page__list {
    margin-top: 0.12rem;
    display: flex;
    flex-direction: column;
    gap: 0.12rem;
  }

  .rank-page__row {
    display: flex;
    align-items: center;
    padding: 0.22rem 0.24rem;
    font-size: 0.26rem;
    color: @text;
    border-radius: 0.2rem;
    background: @white;
    box-shadow: @card-shadow;
  }

  .rank-page__row--self {
    border: 1px solid rgba(26, 55, 253, 0.22);
    background: #f5f8ff;
  }

  .rank-page__row-rank {
    width: 0.72rem;
    text-align: left;
    font-weight: 600;
    font-size: 0.28rem;
    color: @primary;
  }

  .rank-page__row-user {
    flex: 1;
    display: flex;
    align-items: center;
    min-width: 0;
  }

  .rank-page__row-avatar {
    width: 0.52rem;
    height: 0.52rem;
    border-radius: 50%;
    margin-right: 0.12rem;
    flex-shrink: 0;
  }

  .rank-page__row-name {
    font-size: 0.26rem;
    font-weight: 500;
    color: @text;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .rank-page__row-metric {
    width: 1.2rem;
    text-align: center;
    font-size: 0.26rem;
    font-weight: 500;
    color: @text;
  }

  .rank-page__row-value {
    width: 1.56rem;
    text-align: right;
    font-size: 0.26rem;
    font-weight: 500;
    color: @text;
  }

  .rank-page__footer {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 0;
    padding-bottom: env(safe-area-inset-bottom);
    z-index: 10;
  }

  .rank-page__footer-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.22rem 0.32rem;
    border-radius: 0;
    background: linear-gradient(90deg, @primary-light 0%, #6ba3ff 100%);
    box-shadow: 0 -0.04rem 0.16rem rgba(26, 55, 253, 0.12);
    color: @white;
  }

  .rank-page__footer-label {
    font-size: 0.26rem;
    font-weight: 500;
    color: @white;
    flex-shrink: 0;
  }

  .rank-page__footer-user {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.2rem;
    min-width: 0;
    margin-left: 0.2rem;
  }

  .rank-page__footer-avatar {
    width: 0.4rem;
    height: 0.4rem;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.65);
    flex-shrink: 0;
  }

  .rank-page__footer-name {
    font-size: 0.26rem;
    font-weight: 500;
    color: @white;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 1.4rem;
  }

  .rank-page__footer-metric {
    font-size: 0.26rem;
    font-weight: 500;
    color: @white;
    text-align: center;
    min-width: 0.72rem;
  }

  .rank-page__footer-value {
    font-size: 0.26rem;
    font-weight: 500;
    color: @white;
    text-align: right;
    min-width: 1.4rem;
  }

  .rank-page__footer--ended {
    background: @white;
    box-shadow: 0 -0.06rem 0.2rem rgba(26, 55, 253, 0.08);

    .rank-page__footer-bar {
      opacity: 0.88;
    }
  }

  .rank-page__footer-btn {
    display: block;
    width: calc(100% - 0.64rem);
    height: 0.8rem;
    margin: 0.12rem auto 0.16rem;
    font-size: 0.28rem;
    font-weight: 500;
    border-radius: 999px;
  }

  .rank-page__footer-btn--disabled {
    background: linear-gradient(180deg, #f3f6fd 0%, #e8eef9 100%) !important;
    color: @muted !important;
    border: 1px solid rgba(26, 55, 253, 0.12) !important;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.95),
      0 0.04rem 0.12rem rgba(26, 55, 253, 0.06) !important;
    opacity: 1 !important;
  }

  .rank-page__footer-btn--disabled :deep(.van-button__text) {
    color: @muted;
    font-weight: 500;
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

  .rank-page__rule-popup {
    width: 86% !important;
    max-width: 6.4rem;
    height: auto !important;
    max-height: 85vh;
    overflow: visible;
    background: transparent !important;
  }

  .rank-page__rule-popup :deep(.van-popup__content) {
    overflow: visible;
    position: relative;
    background: transparent;
  }

  .rank-page__rule-popup-wrap {
    position: relative;
    width: 100%;
    padding-top: 0.88rem;
  }

  .rank-page__rule-overlay {
    background: rgba(0, 0, 0, 0.55);
  }

  .rank-page__rule-card {
    display: flex;
    flex-direction: column;
    max-height: calc(85vh - 0.88rem);
    padding: 0.4rem 0.4rem 0.36rem;
    border-radius: 0.2rem;
    background: linear-gradient(180deg, #e2d3fc 0%, #fff 35%, #fff 65%, #c5edfd 100%);
    color: @text;
    box-shadow: 0 0.12rem 0.48rem rgba(26, 55, 253, 0.1);
  }

  .rank-page__rule-title {
    flex-shrink: 0;
    margin: 0 0 0.08rem;
    font-size: 0.36rem;
    font-weight: 600;
    line-height: 1.4;
    text-align: center;
    color: @text;
  }

  .rank-page__rule-scroll {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 0.08rem 0 0.12rem;
    -webkit-overflow-scrolling: touch;
  }

  .rank-page__rule-section {
    margin-top: 0.32rem;

    p {
      margin: 0.06rem 0 0;
      font-size: 0.26rem;
      font-weight: 400;
      line-height: 1.65;
      color: @muted;
    }
  }

  .rank-page__rule-section--first {
    margin-top: 0.16rem;
  }

  .rank-page__rule-section-title {
    margin-bottom: 0.08rem;
    font-size: 0.28rem;
    font-weight: 600;
    line-height: 1.45;
    color: @text;
  }

  .rank-page__rule-confirm {
    flex-shrink: 0;
    margin-top: 0.32rem;
    height: 0.88rem;
    font-size: 0.3rem;
    font-weight: 600;
    color: #fff !important;
    border: none !important;
    background: linear-gradient(180deg, #92b6ff 0%, #2a61f9 100%) !important;
    box-shadow: 0 0.08rem 0.2rem rgba(26, 55, 253, 0.22);
  }

  .rank-page__rule-confirm :deep(.van-button__text) {
    font-weight: 600;
  }

  .rank-page__rule-close {
    position: absolute;
    top: 0;
    right: 0;
    width: 0.64rem;
    height: 0.64rem;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: @primary;
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0.06rem 0.16rem rgba(26, 55, 253, 0.28);

    .van-icon {
      font-size: 0.32rem;
      font-weight: 700;
    }
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
