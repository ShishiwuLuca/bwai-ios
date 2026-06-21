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

  <PageWrap class="ai-invest-page">
    <div class="ai-invest-page__content">
      <!-- 投资总览 -->
      <div class="ai-invest-page__overview-wrap">
        <div class="ai-invest-page__overview-head">
          <div class="ai-invest-page__overview-head-left" @click="overviewExpanded = !overviewExpanded">
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
            <SwipeItem class="ai-invest-page__overview-swipe-item">
              <div class="ai-invest-page__overview-cards">
                <div class="ai-invest-page__summary-card">
                  <div class="ai-invest-page__summary-head">
                    <img :src="AI2" alt="" />
                    <span>{{ t('ai_invest_total_invest') }}</span>
                  </div>
                  <CountTo
                    :start-val="0"
                    :decimals="2"
                    class="ai-invest-page__summary-value"
                    :end-val="Number(overviewTotalInvest)"
                  />
                </div>
                <div
                  class="ai-invest-page__summary-card ai-invest-page__summary-card--arrow"
                  @click="onOverviewNextSlide"
                >
                  <div class="ai-invest-page__summary-head">
                    <img :src="AI1" alt="" />
                    <span>{{ t('ai_invest_total_profit') }}</span>
                  </div>
                  <CountTo
                    :start-val="0"
                    :decimals="4"
                    class="ai-invest-page__summary-value"
                    :end-val="Number(overviewTotalProfit)"
                  />
                  <Icon name="arrow" class="ai-invest-page__summary-arrow" />
                </div>
              </div>
            </SwipeItem>

            <SwipeItem class="ai-invest-page__overview-swipe-item">
              <div class="ai-invest-page__overview-cards">
                <div class="ai-invest-page__summary-card">
                  <div class="ai-invest-page__summary-head">
                    <img :src="AI2" alt="" />
                    <span>{{ t('ai_invest_staking_amount') }}</span>
                  </div>
                  <CountTo
                    :start-val="0"
                    :decimals="2"
                    class="ai-invest-page__summary-value"
                    :end-val="Number(overviewStakingAmount)"
                  />
                </div>
                <div
                  class="ai-invest-page__summary-card ai-invest-page__summary-card--arrow"
                  @click="onOverviewNextSlide"
                >
                  <div class="ai-invest-page__summary-head">
                    <img :src="AI1" alt="" />
                    <span>{{ t('ai_invest_pending_gain') }}</span>
                  </div>
                  <CountTo
                    :start-val="0"
                    :decimals="4"
                    class="ai-invest-page__summary-value"
                    :end-val="Number(overviewPendingGain)"
                  />
                  <Icon name="arrow" class="ai-invest-page__summary-arrow" />
                </div>
              </div>
            </SwipeItem>
          </Swipe>
        </div>
      </div>

      <!-- 投资类型 Tab -->
      <Tabs
        :active="activeTypeTab ?? 0"
        class="ai-invest-page__tabs"
        :class="{ 'ai-invest-page__tabs--scroll': typeTabs.length > 3 }"
        :scrollable="typeTabs.length > 3"
        :ellipsis="false"
        :line-width="28"
        color="#1a37fd"
        title-inactive-color="#8c93a6"
        title-active-color="#1a37fd"
        @update:active="onTypeChange"
      >
        <Tab v-for="tab in typeTabs" :key="tab.id" :title="tab.name" :name="tab.id" />
      </Tabs>

      <!-- 项目列表 -->
      <PullRefresh v-if="typeLoaded" v-model="refreshing" @refresh="onRefresh">
        <List
          v-model:loading="loading"
          :finished="finished"
          :finished-text="t('ai_invest_no_more')"
          @load="onLoad"
        >
          <div class="ai-invest-page__list">
            <div
              v-for="(item, i) in projectList"
              :key="item.id ?? i"
              class="ai-invest-page__project-card"
            >
              <div class="ai-invest-page__project-head">
                <span class="ai-invest-page__project-tag">{{ item.tagName || '--' }}</span>
                <span v-if="item.isValidUser === 0" class="ai-invest-page__project-exp">
                  {{ t('ai_invest_experience') }}
                </span>
              </div>

              <div class="ai-invest-page__project-split"></div>

              <div class="ai-invest-page__project-name">{{ item.title }}</div>

              <div class="ai-invest-page__project-metrics">
                <div class="ai-invest-page__project-col">
                  <span class="ai-invest-page__project-num">{{ item.period }}</span>
                  <span class="ai-invest-page__project-label">{{ t('ai_invest_period') }}</span>
                </div>
                <div class="ai-invest-page__project-col">
                  <span class="ai-invest-page__project-num">{{ item.rate }}</span>
                  <span class="ai-invest-page__project-label">{{ t('ai_invest_daily_rate') }}</span>
                </div>
              </div>

              <div class="ai-invest-page__project-foot">
                <button
                  v-if="item.canInvest"
                  type="button"
                  class="ai-invest-page__project-btn"
                  @click="goBuy(item)"
                >
                  {{ t('ai_invest_btn') }}
                </button>
                <button
                  v-else
                  type="button"
                  class="ai-invest-page__project-btn ai-invest-page__project-btn--disabled"
                  @click="goBuy(item)"
                >
                  {{ t('ab_invest_unavailable') }}
                  <!-- <Icon name="question-o" class="ai-invest-page__project-question" /> -->
                </button>
              </div>
            </div>
          </div>
        </List>
      </PullRefresh>
    </div>
  </PageWrap>

  <AppTabBar />
  </div>
</template>

<script setup lang="ts">
  import { useRouter } from 'vue-router';
  import { ref, onMounted, computed } from 'vue';
  import { NavBar, PageWrap, AppTabBar, CountTo } from '/@/components';
  import { Tabs, Tab, Icon, PullRefresh, List, Swipe, SwipeItem } from 'vant';
  import { useI18n } from '/@/hooks/web/useI18n';
  import AI1 from '/@/assets/images/AI/AI1.png';
  import AI2 from '/@/assets/images/AI/AI2.png';
  import { useSystemStoreWithOut } from '/@/stores/modules/SystemConfig';
  import { getProductPage, type AppProductRespVO } from '/@/service/Product';
  import { getTypeList, type AppTypeRespVO } from '/@/service/Type';
  import { getStakeOverview } from '/@/service/Overview';

  const { t } = useI18n();
  const router = useRouter();
  const SystemStore = useSystemStoreWithOut();

  const overviewExpanded = ref(true);
  const overviewSwipeRef = ref<{ next: () => void } | null>(null);
  const overviewTotalInvest = ref('0');
  const overviewTotalProfit = ref('0');
  const overviewStakingAmount = ref('0');
  const overviewPendingGain = ref('0');

  const typeTabs = ref<AppTypeRespVO[]>([]);
  const activeTypeTab = ref<number | null>(null);
  const typeLoaded = ref(false);

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

  const projectList = ref<ProjectCard[]>([]);
  const pageNo = ref(1);
  const pageSize = 10;
  const finished = ref(false);
  const loading = ref(false);
  const refreshing = ref(false);
  const latestListRequestId = ref(0);

  const Logo = computed(() => SystemStore.getSiteLogo);

  const mergeUniqueProjects = (base: ProjectCard[], incoming: ProjectCard[]) => {
    const map = new Map<number, ProjectCard>();
    [...base, ...incoming].forEach((item) => map.set(item.id, item));
    return Array.from(map.values());
  };

  const resetListState = () => {
    pageNo.value = 1;
    finished.value = false;
    projectList.value = [];
  };

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
        if (requestId !== latestListRequestId.value) return;
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

  onMounted(() => {
    void fetchOverview();
    void fetchTypeTabs();
  });

  const onTypeChange = (v: string | number) => {
    const next = Number(v);
    if (activeTypeTab.value === next) return;
    activeTypeTab.value = next;
    void fetchProductList(true);
  };

  const onRefresh = () => {
    refreshing.value = true;
    fetchProductList(true).finally(() => {
      refreshing.value = false;
    });
  };

  const onLoad = () => {
    if (!typeLoaded.value || finished.value || refreshing.value || loading.value) return;
    loading.value = true;
    fetchProductList().finally(() => {
      loading.value = false;
    });
  };

  const goBuy = (item: ProjectCard) => {
    router.push({
      name: 'AIBuy',
      query: {
        id: String(item.id),
        product: encodeURIComponent(JSON.stringify(item.raw))
      }
    });
  };

  const onOverviewNextSlide = () => {
    overviewSwipeRef.value?.next?.();
  };
</script>

<style scoped lang="less">
  @blue: #1a37fd;
  @text: #1a1d26;
  @label: #8c93a6;
  @value: #5c6378;
  @white: #fff;
  @border: #e8ecf5;
  @shadow: 0 0.04rem 0.2rem rgba(51, 102, 255, 0.08);
  @btn-gradient: linear-gradient(180deg, #92b6ff 0%, #2a61f9 100%);

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

  .ai-invest-page {
    min-height: 100vh;
    padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
    color: @text;
  }

  .ai-invest-page__content {
    padding: 0 0.32rem calc(1.32rem + env(safe-area-inset-bottom, 0px));
  }

  /* 投资总览 */
  .ai-invest-page__overview-wrap {
    margin: 0.08rem 0 0.24rem;
  }

  .ai-invest-page__overview-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.16rem;
  }

  .ai-invest-page__overview-head-left {
    display: inline-flex;
    align-items: center;
    gap: 0.08rem;
    cursor: pointer;
  }

  .ai-invest-page__overview-title {
    font-size: 0.28rem;
    font-weight: 600;
    color: @text;
  }

  .ai-invest-page__overview-arrow {
    font-size: 0.28rem;
    color: @blue;
  }

  .ai-invest-page__overview-doc-icon {
    font-size: 0.32rem;
    color: @blue;
    cursor: pointer;
  }

  .ai-invest-page__overview-swipe-wrap {
    overflow: hidden;
  }

  .ai-invest-page__overview-cards {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.2rem;
  }

  .ai-invest-page__summary-card {
    .card();
    position: relative;
    min-height: 1.56rem;
    padding: 0.24rem 0.2rem;

    &--arrow {
      cursor: pointer;

      .ai-invest-page__summary-value {
        padding-right: 0.36rem;
      }
    }
  }

  .ai-invest-page__summary-head {
    display: flex;
    align-items: center;
    gap: 0.08rem;
    margin-bottom: 0.1rem;
    font-size: 0.22rem;
    font-weight: 400;
    color: @label;
    line-height: 1.35;

    img {
      width: 0.28rem;
      height: 0.28rem;
      object-fit: contain;
      flex-shrink: 0;
    }
  }

  .ai-invest-page__summary-value {
    font-size: 0.32rem;
    font-weight: 600;
    color: @blue;
    line-height: 1.25;

    :deep(span) {
      font-weight: inherit;
    }
  }

  .ai-invest-page__summary-arrow {
    position: absolute;
    right: 0.12rem;
    top: 50%;
    font-size: 0.24rem;
    color: @blue;
    transform: translateY(-50%);
  }

  /* 投资类型 Tab */
  .ai-invest-page__tabs {
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
      font-weight: 400;
      color: @label;
    }

    :deep(.van-tab__text) {
      white-space: nowrap;
    }

    :deep(.van-tab--active) {
      font-weight: 600;
      color: @blue;
    }

    :deep(.van-tabs__line) {
      height: 0.06rem;
      border-radius: 0.03rem;
      bottom: 0;
      background: @blue;
    }

    &:not(.ai-invest-page__tabs--scroll) :deep(.van-tab) {
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

  /* 项目卡片 */
  .ai-invest-page__list {
    display: flex;
    flex-direction: column;
    gap: 0.24rem;
  }

  .ai-invest-page__project-card {
    .card();
    padding: 0.28rem;
  }

  .ai-invest-page__project-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.16rem;
  }

  .ai-invest-page__project-tag {
    font-size: 0.24rem;
    font-weight: 500;
    color: @blue;
  }

  .ai-invest-page__project-exp {
    flex-shrink: 0;
    padding: 0.04rem 0.14rem;
    border-radius: 0.08rem;
    background: @blue;
    color: @white;
    font-size: 0.2rem;
    font-weight: 500;
    line-height: 1.4;
  }

  .ai-invest-page__project-split {
    margin: 0.16rem 0 0.18rem;
    border-bottom: 1px dashed #dbe6ff;
  }

  .ai-invest-page__project-name {
    margin-bottom: 0.18rem;
    font-size: 0.28rem;
    font-weight: 600;
    color: @text;
    line-height: 1.35;
  }

  .ai-invest-page__project-metrics {
    display: flex;
    justify-content: space-between;
    gap: 0.24rem;
    margin-bottom: 0.24rem;
  }

  .ai-invest-page__project-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.08rem;
    text-align: center;
  }

  .ai-invest-page__project-num {
    font-size: 0.32rem;
    font-weight: 600;
    color: @blue;
    line-height: 1.25;
  }

  .ai-invest-page__project-label {
    font-size: 0.22rem;
    font-weight: 400;
    color: @label;
    line-height: 1.35;
  }

  .ai-invest-page__project-foot {
    margin-top: 0.04rem;
  }

  .ai-invest-page__project-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.1rem;
    width: 100%;
    height: 0.8rem;
    border: none;
    border-radius: 0.4rem;
    background: @btn-gradient;
    color: @white;
    font-size: 0.28rem;
    font-weight: 600;
    box-shadow: 0 0.06rem 0.18rem rgba(42, 97, 249, 0.28);

    &--disabled {
      background: #e8edf5;
      color: @value;
      font-weight: 500;
      box-shadow: none;
    }
  }

  .ai-invest-page__project-question {
    font-size: 0.28rem;
    color: @blue;
  }
</style>
