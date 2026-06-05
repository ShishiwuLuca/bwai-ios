<template>
  <NavBar :show-left="false" fixed placeholder :border="false">
    <template #left>
      <VanImage :src="Logo" height="0.6rem" />
    </template>
    <template #right>
      <Icon name="chat-o" :size="28" @click="$router.push('/Notice')" />
    </template>
  </NavBar>
  <PageWrap class="ai-invest-page">
    <div class="ai-invest-page__content mt-1">
      <!-- 投资总览：点击标题展开/收起，右侧图标跳转我的订单 -->
      <div class="ai-invest-page__overview-wrap">
        <div class="ai-invest-page__overview-head">
          <div
            class="ai-invest-page__overview-head-left"
            @click="overviewExpanded = !overviewExpanded"
          >
            <span class="ai-invest-page__overview-title">{{ t('ai_invest_overview') }}</span>
            <Icon
              :name="overviewExpanded ? 'arrow-up' : 'arrow-down'"
              class="ai-invest-page__overview-arrow"
            />
          </div>
          <Icon
            name="description"
            class="ai-invest-page__overview-doc-icon"
            @click="router.push('/MyOrder')"
          />
        </div>
        <div v-show="overviewExpanded" class="ai-invest-page__overview-swipe-wrap">
          <Swipe
            ref="overviewSwipeRef"
            :loop="true"
            :show-indicators="false"
            class="ai-invest-page__overview-swipe"
          >
            <!-- 第 1 页：累计投资 / 累计收益 -->
            <SwipeItem class="ai-invest-page__overview-swipe-item">
              <div class="ai-invest-page__overview-cards">
                <AppCard class="ai-invest-page__summary-card ai-invest-page__summary-card--invest">
                  <div class="ai-invest-page__summary-head">
                    <Image :src="AI2" />
                    <span>{{ t('ai_invest_total_invest') }}</span>
                  </div>
                  <CountTo
                    :startVal="0"
                    :decimals="2"
                    class="ai-invest-page__summary-value"
                    :endVal="Number(overviewTotalInvest)"
                  />
                  <img :src="SummaryBgInvest" alt="" class="ai-invest-page__summary-bg" />
                </AppCard>
                <AppCard
                  class="ai-invest-page__summary-card ai-invest-page__summary-card--profit ai-invest-page__summary-card--has-arrow"
                  @click="onOverviewNextSlide"
                >
                  <div class="ai-invest-page__summary-head">
                    <Image :src="AI1" />
                    <span>{{ t('ai_invest_total_profit') }}</span>
                  </div>
                  <CountTo
                    :startVal="0"
                    :decimals="4"
                    class="ai-invest-page__summary-value"
                    :endVal="Number(overviewTotalProfit)"
                  />
                  <Icon name="arrow" class="ai-invest-page__summary-arrow" />
                  <img :src="SummaryBgProfit" alt="" class="ai-invest-page__summary-bg" />
                </AppCard>
              </div>
            </SwipeItem>
            <!-- 第 2 页：投资中金额 / 待领取收益 -->
            <SwipeItem class="ai-invest-page__overview-swipe-item">
              <div class="ai-invest-page__overview-cards">
                <AppCard class="ai-invest-page__summary-card ai-invest-page__summary-card--invest">
                  <div class="ai-invest-page__summary-head">
                    <Image :src="AI2" />
                    <span>{{ t('ai_invest_staking_amount') }}</span>
                  </div>
                  <CountTo
                    :startVal="0"
                    :decimals="2"
                    class="ai-invest-page__summary-value"
                    :endVal="Number(overviewStakingAmount)"
                  />
                  <img :src="SummaryBgInvest" alt="" class="ai-invest-page__summary-bg" />
                </AppCard>
                <AppCard
                  class="ai-invest-page__summary-card ai-invest-page__summary-card--profit ai-invest-page__summary-card--has-arrow"
                  @click="onOverviewNextSlide"
                >
                  <div class="ai-invest-page__summary-head">
                    <Image :src="AI1" />
                    <span>{{ t('ai_invest_pending_gain') }}</span>
                  </div>
                  <CountTo
                    :startVal="0"
                    :decimals="4"
                    class="ai-invest-page__summary-value"
                    :endVal="Number(overviewPendingGain)"
                  />
                  <Icon name="arrow" class="ai-invest-page__summary-arrow" />
                  <img :src="SummaryBgProfit" alt="" class="ai-invest-page__summary-bg" />
                </AppCard>
              </div>
            </SwipeItem>
          </Swipe>
        </div>
      </div>

      <!-- 投资类型 Tab：切换后重新拉取项目列表 -->
      <Tabs :active="activeTypeTab ?? 0" class="ai-invest-page__tabs" @update:active="onTypeChange">
        <Tab v-for="tab in typeTabs" :key="tab.id" :title="tab.name" :name="tab.id" />
      </Tabs>

      <!-- 投资项目列表，下拉刷新 + 上拉加载 -->
      <PullRefresh v-if="typeLoaded" v-model="refreshing" @refresh="onRefresh">
        <List
          v-model:loading="loading"
          :finished="finished"
          :finished-text="t('ai_invest_no_more')"
          @load="onLoad"
        >
          <div class="ai-invest-page__list">
            <template v-if="projectList.length">
              <AppCard
                v-for="(item, i) in projectList"
                :key="item.id ?? i"
                class="ai-invest-page__project-card"
              >
                <div class="ai-invest-page__project-head">
                  <span class="ai-invest-page__project-title">{{ item.title }} </span>
                  <Button v-if="item.isValidUser === 0" size="small" type="primary">
                    {{ t('ai_invest_experience') }}
                  </Button>
                </div>
                <div class="ai-invest-page__project-split"></div>
                <div class="ai-invest-page__project-body">
                  <div class="ai-invest-page__project-row">
                    <div class="ai-invest-page__project-col">
                      <span class="ai-invest-page__project-meta">{{ item.tagName }}</span>
                      <span class="ai-invest-page__project-num">{{ item.period }}</span>
                      <span class="ai-invest-page__project-label">{{ t('ai_invest_period') }}</span>
                    </div>
                    <div class="ai-invest-page__project-col">
                      <span class="ai-invest-page__project-meta">&nbsp;</span>
                      <span class="ai-invest-page__project-num">{{ item.rate }}</span>
                      <span class="ai-invest-page__project-label">{{
                        t('ai_invest_daily_rate')
                      }}</span>
                    </div>
                  </div>
                </div>
                <div class="ai-invest-page__project-foot flex items-center justify-center">
                  <Button
                    v-if="item.canInvest"
                    type="primary"
                    size="small"
                    block
                    round
                    class="ai-invest-page__project-btn"
                    @click="goBuy(item)"
                  >
                    {{ t('ai_invest_btn') }}
                  </Button>

                  <Button
                    v-else
                    block
                    round
                    size="small"
                    class="ai-invest-page__project-btn"
                    type="primary"
                    @click="goBuy(item)"
                  >
                    {{ t('ab_invest_unavailable') }}
                  </Button>
                </div>
              </AppCard>
            </template>
          </div>
        </List>
      </PullRefresh>
    </div>
  </PageWrap>
  <AppTabBar />
</template>

<script setup lang="ts">
  import { useRouter } from 'vue-router';
  import { ref, onMounted, computed } from 'vue';
  import { NavBar, PageWrap, AppCard, AppTabBar, CountTo } from '/@/components';
  import { Tabs, Tab, Button, Icon, Image, PullRefresh, List, Swipe, SwipeItem } from 'vant';
  import { useUserStoreWithOut } from '/@/stores/modules/UserConfig';
  import { useI18n } from '/@/hooks/web/useI18n';

  /** 从 useI18n 解构的文案与能力 */
  const { t } = useI18n();
  import AI1 from '/@/assets/images/AI/AI1.png';
  import AI2 from '/@/assets/images/AI/AI2.png';
  import SummaryBgInvest from '/@/assets/images/AI/AI.png';
  import SummaryBgProfit from '/@/assets/images/AI/AI3.png';
  // import Logo from '/@/assets/images/home_logo.png';
  import { useSystemStoreWithOut } from '/@/stores/modules/SystemConfig';
  import { getProductPage, type AppProductRespVO } from '/@/service/Product';
  import { getTypeList, type AppTypeRespVO } from '/@/service/Type';
  import { getStakeOverview } from '/@/service/Overview';

  /** 路由实例：编程式导航 */
  const router = useRouter();

  /** 用户：userStore */
  const userStore = useUserStoreWithOut();

  /** SystemStore */
  const SystemStore = useSystemStoreWithOut();

  // ========== 投资总览（/stake/index/overview） ==========

  /** 响应式状态：overviewExpanded 相关 UI 或数据 */
  const overviewExpanded = ref(true);

  /** 响应式状态：overviewSwipeRef 相关 UI 或数据 */
  const overviewSwipeRef = ref<{
    next: () => void;
  } | null>(null);

  /** 响应式状态：总条数 */
  const overviewTotalInvest = ref('0');

  /** 响应式状态：总条数 */
  const overviewTotalProfit = ref('0');

  /** 响应式状态：金额输入 */
  const overviewStakingAmount = ref('0');

  /** 响应式状态：overviewPendingGain 相关 UI 或数据 */
  const overviewPendingGain = ref('0');

  // ========== 投资类型 Tab（/stake/type/list） ==========

  /** 响应式状态：Tab 状态 */
  const typeTabs = ref<AppTypeRespVO[]>([]);

  /** 响应式状态：当前选中项 */
  const activeTypeTab = ref<number | null>(null);

  /** 类型接口已返回，可开始请求项目列表 */
  const typeLoaded = ref(false);

  // ========== 项目列表（/stake/product/page） ==========

  /** 列表项结构：接口字段映射为展示用 + 保留 raw 供跳转传参 */
  interface ProjectCard {
    id: number;
    title: string;
    period: string;
    rate: string;
    isValidUser: number;
    canInvest: boolean;
    experience: boolean;
    tagName: string;
    raw: AppProductRespVO;
  }

  /** 响应式状态：列表数据 */
  const projectList = ref<ProjectCard[]>([]);

  /** 响应式状态：分页 */
  const pageNo = ref(1);

  /** 分页：pageSize */
  const pageSize = 10;

  /** 响应式状态：列表是否已全部加载 */
  const finished = ref(false);

  /** 响应式状态：加载中状态 */
  const loading = ref(false);

  /** 响应式状态：下拉刷新 */
  const refreshing = ref(false);

  /** 列表请求版本号：只接收最后一次请求结果，避免并发串数据 */
  const latestListRequestId = ref(0);

  // logo

  /** 计算属性：由其它状态派生的展示或判断 */
  const Logo = computed(() => {
    return SystemStore.getSiteLogo;
  });

  /** mergeUniqueProjects */
  const mergeUniqueProjects = (base: ProjectCard[], incoming: ProjectCard[]) => {
    const map = new Map<number, ProjectCard>();
    [...base, ...incoming].forEach((item) => map.set(item.id, item));
    return Array.from(map.values());
  };

  /** resetListState */
  const resetListState = () => {
    pageNo.value = 1;
    finished.value = false;
    projectList.value = [];
  };

  /** 拉取接口数据：fetchOverview */
  const fetchOverview = () => {
    getStakeOverview()
      .then((res) => {
        const data = res.data;
        if (data) {
          overviewTotalInvest.value = String(data.totalOrderAmount ?? 0);
          overviewTotalProfit.value = String(data.totalGainAmount ?? 0);
          overviewStakingAmount.value = String(data.stakingAmount ?? 0);
          overviewPendingGain.value = String(data.pendingGainAmount ?? 0);
        }
      })
      .catch(() => {
        overviewTotalInvest.value = '0';
        overviewTotalProfit.value = '0';
        overviewStakingAmount.value = '0';
        overviewPendingGain.value = '0';
      });
  };

  /** Tab 状态：fetchTypeTabs */
  const fetchTypeTabs = () => {
    getTypeList()
      .then((res) => {
        const list = (res.data || []) as AppTypeRespVO[];
        typeTabs.value = list;
        const first = list[0];
        if (!activeTypeTab.value && first) {
          activeTypeTab.value = first.id;
        }
        fetchProductList(true).finally(() => {
          typeLoaded.value = true;
        });
      })
      .catch(() => {
        typeTabs.value = [];
        typeLoaded.value = true;
      });
  };

  /** mapProductToCard */
  const mapProductToCard = (item: AppProductRespVO): ProjectCard => {
    return {
      id: item.id,
      title: item.name,
      tagName: item.tagName || '',
      period: `${item.lockDay ?? 0}${t('ai_invest_day_unit')}`,
      rate:
        item.gainDayRateMinStr === item.gainDayRateMaxStr
          ? item.gainDayRateMinStr
          : item.gainDayRateMinStr + '-' + item.gainDayRateMaxStr,
      isValidUser: Number(item.isValidUser ?? 1),
      canInvest: Boolean(item.canBuy),
      experience: (item.tagName || '').includes('体验'),
      raw: item
    };
  };

  /** 列表数据：fetchProductList */
  const fetchProductList = (reset = false): Promise<void> => {
    const requestId = ++latestListRequestId.value;
    const requestTypeId = activeTypeTab.value ?? undefined;
    const requestPageNo = reset ? 1 : pageNo.value;
    if (reset) {
      resetListState();
    }
    return getProductPage({
      pageNo: requestPageNo,
      pageSize,
      typeId: requestTypeId,
      offset: 0
    })
      .then((res) => {
        // 只处理“当前最新一次”请求，旧请求直接丢弃
        if (requestId !== latestListRequestId.value) return;
        // 切换类型后旧请求返回，直接丢弃，避免串页/重复
        if ((activeTypeTab.value ?? undefined) !== requestTypeId) return;
        const list = (res.data?.list || []) as AppProductRespVO[];
        const mapped = list.map(mapProductToCard);
        projectList.value = reset ? mapped : mergeUniqueProjects(projectList.value, mapped);
        finished.value = !list.length || list.length < pageSize;
        if (list.length >= pageSize) {
          pageNo.value = requestPageNo + 1;
        }
      })
      .catch(() => {
        projectList.value = [];
        finished.value = true;
      });
  };
  // ========== 生命周期 ==========

  /** 组件挂载后执行：初始化数据或订阅 */
  onMounted(() => {
    userStore.setActiveTab(2);
    void fetchOverview();
    void fetchTypeTabs();
  });

  /** 事件或回调处理：onTypeChange */
  const onTypeChange = (v: string | number) => {
    const next = Number(v);
    if (activeTypeTab.value === next) return;
    activeTypeTab.value = next;
    void fetchProductList(true);
  };

  /** 下拉刷新：onRefresh */
  const onRefresh = () => {
    refreshing.value = true;
    fetchProductList(true).finally(() => {
      refreshing.value = false;
    });
  };

  /** 拉取接口数据：onLoad */
  const onLoad = () => {
    if (!typeLoaded.value || finished.value || refreshing.value || loading.value) return;
    loading.value = true;
    fetchProductList().finally(() => {
      loading.value = false;
    });
  };

  /** 页面跳转：goBuy */
  const goBuy = (item: ProjectCard) => {
    router.push({
      name: 'AIBuy',
      query: {
        id: String(item.id),
        product: encodeURIComponent(JSON.stringify(item.raw))
      }
    });
  };

  /** 事件或回调处理：onOverviewNextSlide */
  const onOverviewNextSlide = () => {
    const swipe = overviewSwipeRef.value as {
      next?: () => void;
    } | null;
    swipe?.next?.();
  };
</script>

<style scoped lang="less">
  :deep(.van-nav-bar__left) {
    padding: 0 var(--van-padding-md);
  }

  /* ---------- 页面与导航 ---------- */
  .ai-invest-page {
    min-height: 100vh;
    padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
    color: var(--van-text-color);
  }

  .ai-invest-page__brand,
  .ai-invest-page__logo-row {
    display: flex;
    align-items: center;
    gap: 0.12rem;
  }

  .ai-invest-page__brand {
    flex-direction: column;
    gap: 0.04rem;
  }

  .ai-invest-page__content {
    padding: 0 0.32rem calc(1.32rem + env(safe-area-inset-bottom, 0px));
  }

  /* ---------- 投资总览 ---------- */
  .ai-invest-page__overview-wrap {
    margin-bottom: 0.24rem;
  }

  .ai-invest-page__overview-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.16rem;
  }

  .ai-invest-page__overview-head-left {
    display: flex;
    align-items: center;
    gap: 0.12rem;
    cursor: pointer;
  }

  .ai-invest-page__overview-title {
    font-size: 0.3rem;
    font-weight: bold;
    color: var(--van-text-color);
  }

  .ai-invest-page__overview-arrow {
    font-size: 0.28rem;
    color: var(--van-primary-color, #1989fa);
  }

  .ai-invest-page__overview-doc-icon {
    font-size: 0.48rem;
    color: rgba(255, 255, 255, 0.95);
  }

  .ai-invest-page__overview-swipe-wrap {
    overflow: hidden;
    border-radius: var(--van-radius-md, 0.16rem);
  }

  .ai-invest-page__overview-swipe {
    border-radius: var(--van-radius-md, 0.16rem);
  }

  .ai-invest-page__overview-swipe-item {
    padding: 0 0.02rem;
  }

  .ai-invest-page__overview-cards {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.2rem;
  }

  .ai-invest-page__summary-card {
    padding: 0.28rem;
    position: relative;
    overflow: hidden;
  }

  .ai-invest-page__summary-card--has-arrow {
    cursor: pointer;
  }

  .ai-invest-page__summary-arrow {
    position: absolute;
    right: 0.12rem;
    top: 50%;
    transform: translateY(-50%);
    font-size: 0.28rem;
    color: #f56c6c;
    z-index: 2;
  }

  .ai-invest-page__summary-head {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 0.12rem;
    margin-bottom: 0.12rem;
    font-size: 0.24rem;
    color: var(--van-text-color);
    opacity: 0.9;
  }

  .ai-invest-page__summary-value {
    position: relative;
    z-index: 1;
    font-size: 0.36rem;
    font-weight: bold;
    color: var(--van-text-color);
  }

  .ai-invest-page__summary-bg {
    position: absolute;
    right: 0.1rem;
    bottom: 0.1rem;
    width: 0.92rem;
    height: 0.92rem;
    opacity: 0.48;
    object-fit: contain;
    pointer-events: none;
    z-index: 0;
    filter: brightness(1.25) contrast(1.2) saturate(1.08);
  }

  /* ---------- 投资类型 Tabs ---------- */
  .ai-invest-page__tabs {
    margin-bottom: 0.24rem;
  }

  .ai-invest-page__tabs :deep(.van-tabs__nav) {
    background: transparent;
  }

  .ai-invest-page__tabs :deep(.van-tab) {
    font-size: 0.26rem;
    color: var(--van-text-color);
    opacity: 0.7;
  }

  .ai-invest-page__tabs :deep(.van-tab--active) {
    font-weight: 600;
    color: #73bcff;
    opacity: 1;
  }

  .ai-invest-page__tabs :deep(.van-tabs__line) {
    background: #73bcff;
  }

  /* ---------- 项目卡片列表 ---------- */
  .ai-invest-page__list {
    display: flex;
    flex-direction: column;
    gap: 0.24rem;
  }

  .ai-invest-page__project-card {
    padding: 0.28rem;
  }

  .ai-invest-page__project-split {
    margin: 0.16rem 0 0.18rem;
    border-top: 0.02rem dashed rgba(90, 140, 255, 0.6);
  }

  .ai-invest-page__project-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.2rem;
  }

  .ai-invest-page__project-title {
    font-size: 0.3rem;
    font-weight: bold;
    color: #73bcff;
  }

  .ai-invest-page__project-exp-btn {
    font-size: 0.22rem;
  }

  .ai-invest-page__project-body {
    margin-bottom: 0.2rem;
  }

  .ai-invest-page__project-row {
    display: flex;
    justify-content: space-between;
  }

  .ai-invest-page__project-col {
    display: flex;
    flex-direction: column;
    gap: 0.04rem;
  }

  .ai-invest-page__project-meta {
    font-size: 0.24rem;
    color: var(--van-text-color);
    opacity: 0.9;
  }

  .ai-invest-page__project-num {
    font-size: 0.34rem;
    font-weight: bold;
    color: #73bcff;
  }

  .ai-invest-page__project-label {
    font-size: 0.22rem;
    color: var(--van-text-color);
    opacity: 0.8;
  }

  .ai-invest-page__project-foot {
    margin-top: 0.16rem;
  }

  .ai-invest-page__project-btn {
    height: 0.8rem;
    font-size: 0.28rem;
  }

  .ai-invest-page__project-disabled {
    display: flex;
    align-items: center;
    gap: 0.16rem;
  }

  .ai-invest-page__project-btn--disabled {
    flex: 1;
    height: 0.8rem;
    font-size: 0.28rem;
    background: var(--van-gray-3, #ebedf0) !important;
    color: var(--van-gray-6, #969799) !important;
    border: none;
  }

  .ai-invest-page__project-question {
    font-size: 0.4rem;
    color: var(--van-primary-color, #1989fa);
  }

  :deep(.ai-invest-page__summary-arrow) {
    color: #1989fa !important;
  }
</style>
