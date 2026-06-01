<template>
  <NavBar :show-left="false" fixed placeholder :border="false">
    <template #left>
      <VanImage :src="Logo" height="0.6rem" />
    </template>
    <template #right>
      <div class="flex items-center gap-1">
        <Icon
          class-prefix="exchange-icon"
          name="locale"
          :size="25"
          color="var(--van-primary-color)"
          @click="emitEvent('ShowLocales')"
        />
        <Icon name="chat-o" :size="28" @click="$router.push('/Notice')" />
      </div>
    </template>
  </NavBar>
  <PageWrap class="home-page">
    <div class="p-1 !pt-0">
      <Swipe class="pt-0.5" :autoplay="3000" :show-indicators="true" indicator-color="white">
        <SwipeItem v-for="(item, index) in bannerList" :key="index" class="rounded-sm">
          <VanImage
            :src="item.imageUrl"
            class="overflow-hidden rounded-sm"
            width="100%"
            height="100%"
          />
        </SwipeItem>
      </Swipe>
      <NoticeBar
        :scrollable="false"
        class="mt-1 rounded-sm overflow-hidden border-1 border-solid border-[var(--van-border-color)]"
        :style="{ background: 'var(--van-card-linear-background)' }"
        color="var(--van-text-color)"
      >
        <Swipe
          :loop="true"
          vertical
          :show-indicators="false"
          :autoplay="5000"
          :touchable="false"
          class="!w-full !h-[0.9rem] !line-height-[0.9rem] !mr-2"
        >
          <SwipeItem v-for="(item, index) in NoticeList" :key="index">
            <div class="flex items-center justify-between">
              <div>{{ item.title }}</div>
              <div @click="ToNotice(item)">
                <span class="text-[0.24rem]">{{ t('str_view_more') }}</span>
                <Icon color="var(--van-text-color)" name="arrow" :size="14" />
              </div>
            </div>
          </SwipeItem>
        </Swipe>
        <template #left-icon>
          <Icon :name="NoticeIcon" :size="38" />
        </template>
      </NoticeBar>
      <Grid
        center
        clickable
        :border="false"
        :column-num="MenuList.length >= 5 ? 5 : 4"
        icon-size="0.9rem"
      >
        <GridItem
          v-for="(item, index) in MenuList"
          :key="index"
          :icon="item.imageUrl"
          :text="item.name"
          :to="item.path"
        />
      </Grid>
      <div class="home-cards mt-0.5">
        <div class="home-card task_bg" @click="$router.push('/DailyTask')">
          <div class="home-card__head">
            <h3 class="home-card__title">{{ t('str_daily_tasks') }}</h3>
          </div>
          <div class="flex items-center gap-0.5">
            <div class="home-card__desc">{{ t('str_daily_tasks_desc') }}</div>
            <div class="home-card__illus--tasks">
              <VanImage :src="DailyTasks" width="1.2rem" />
            </div>
          </div>
        </div>
        <div class="home-card task_bg" @click="$router.push('/Rank')">
          <div class="home-card__head">
            <h3 class="home-card__title">{{ t('str_rankings') }}</h3>
          </div>
          <div class="flex items-center gap-0.5">
            <div class="home-card__desc">{{ t('str_rankings_desc') }}</div>
            <div class="home-card__illus--rankings">
              <VanImage :src="Rankings" width="1.2rem" />
            </div>
          </div>
        </div>
      </div>
      <div class="mt-1">
        <div class="flex items-center">
          <div>
            <Icon :name="HotIcon" :size="25" color="var(--van-danger-color)" />
          </div>
          <div class="text-[0.28rem] font-bold">{{ t('str_hot_trading') }}</div>
        </div>
        <div
          class="market-table-header flex items-center py-0.5 text-[var(--van-text-color)] text-[0.2rem] font-bold"
        >
          <div class="flex-1">{{ t('str_trading_pair') }}</div>
          <div class="flex-1 text-right mr-2">{{ t('str_latest_price') }}</div>
          <div class="w-[1.2rem] text-center">{{ t('str_today_price_change') }}</div>
        </div>
        <div
          class="flex items-center pt-0.5 pb-0.3"
          v-for="item in tradingPairList"
          :key="item.symbol"
        >
          <div class="flex-1">
            <div class="flex items-center gap-0.5">
              <div
                class="w-3 h-3 rounded-full flex items-center justify-center text-white text-[0.4rem] font-semibold flex-shrink-0"
              >
                <VanImage
                  :src="item.iconUrl"
                  class="rounded-full overflow-hidden"
                  width="0.65rem"
                />
              </div>
              <div class="line-height-[0.35rem]">
                <div>
                  <span class="text-[0.3rem] font-bold">{{ item.symbol }}</span>
                </div>
                <div class="text-[0.24rem] text-[#999]">{{
                  formatTradeVolume(item.totalVolume)
                }}</div>
              </div>
            </div>
          </div>
          <div class="flex-1 text-right mr-2 line-height-[0.35rem]">
            <div class="text-[0.3rem] font-bold">
              <CountTo
                :startVal="0"
                :decimals="2"
                :endVal="Number(ReturnPrecision(item.currentPrice, 4))"
              />
            </div>
            <div class="text-[0.24rem] text-[#999]">
              <CountTo
                prefix="$"
                :startVal="0"
                :decimals="2"
                :endVal="
                  Number(ReturnPrecision(item.currentPrice * (FiatExchangeRate['USD'] ?? 0), 4))
                "
              />
            </div>
          </div>
          <div class="w-[1.2rem] text-center">
            <Button
              class="w-5 !text-[0.25rem]"
              :color="
                Number(item.changePercent) >= 0 ? 'var(--van-top-color)' : 'var(--van-down-color)'
              "
              size="small"
            >
              <span v-if="Number(item.changePercent) >= 0">+</span
              >{{ ReturnPrecision(item.changePercent, 2) }}%
            </Button>
          </div>
        </div>
      </div>
    </div>
  </PageWrap>
  <AppTabBar />
</template>

<script setup lang="ts">
  import { useRouter } from 'vue-router';
  import { emitEvent } from '/@/utils/eventBus';
  import { getHomeData } from '/@/service/Home';
  import { useI18n } from '/@/hooks/web/useI18n';
  import HotIcon from '/@/assets/images/hot.png';
  // import Logo from '/@/assets/images/home_logo.png';
  import Rankings from '/@/assets/images/Ranking.png';
  import NoticeIcon from '/@/assets/images/notice.png';
  import DailyTasks from '/@/assets/images/daily_tasks.png';
  import { onBeforeMount, ref, computed, watch } from 'vue';
  import { ReturnPrecision, formatTradeVolume } from '/@/utils';
  import { useUserStoreWithOut } from '/@/stores/modules/UserConfig';
  import { useWebSocketStoreWithOut } from '/@/stores/modules/WebSocket';
  import { NavBar, PageWrap, AppTabBar, CountTo } from '/@/components';
  import { useSystemStoreWithOut } from '/@/stores/modules/SystemConfig';
  import {
    Image as VanImage,
    Icon,
    Swipe,
    SwipeItem,
    NoticeBar,
    Grid,
    GridItem,
    Button
  } from 'vant';

  // 国际化

  /** 从 useI18n 解构的文案与能力 */
  const { t } = useI18n();

  /** 路由实例：编程式导航 */
  const router = useRouter();

  /** 用户：UserStore */
  const UserStore = useUserStoreWithOut();

  /** SystemStore */
  const SystemStore = useSystemStoreWithOut();

  /** 与 App.vue 共用的全局 WebSocket（推送在 store.lastMessage 更新） */
  const WebSocketStore = useWebSocketStoreWithOut();

  // 轮播图

  /** 响应式状态：列表数据 */
  const bannerList = ref<any[]>([]);

  // 公告列表

  /** 响应式状态：列表数据 */
  const NoticeList = ref<any[]>([]);

  // 功能区菜单

  /** 响应式状态：列表数据 */
  const MenuList = ref<any[]>([]);

  // 热门交易对列表

  /** 响应式状态：列表数据 */
  const tradingPairList = ref<any[]>([]);

  // 获取法币汇率

  /** 计算属性：由其它状态派生的展示或判断 */
  const FiatExchangeRate = computed(() => {
    return SystemStore.getFiatExchangeRate;
  });

  // 系统语言

  /** 计算属性：由其它状态派生的展示或判断 */
  const Locale = computed(() => {
    return SystemStore.getLocaleInfo;
  });

  // logo

  /** 计算属性：由其它状态派生的展示或判断 */
  const Logo = computed(() => {
    return SystemStore.getSiteLogo;
  });

  // 获取首页数据

  /** 列表数据：getHomeDataList */
  const getHomeDataList = () => {
    getHomeData().then((res: any) => {
      const { code } = res;
      if (code === 0) {
        const {
          data: { modules }
        } = res;
        if (modules) {
          modules.forEach((item: any) => {
            switch (item.moduleType) {
              case 'banner':
                bannerList.value = item.data;
                break;
              case 'notice':
                NoticeList.value = item.data;
                break;
              case 'feature':
                MenuList.value = item.data;
                break;
              case 'hot_symbol':
                tradingPairList.value = item.data.map((child: any) => {
                  child.changePercent = ReturnPrecision(child.changePercent, 2);
                  return child;
                });
                break;
            }
          });
        }
      }
    });
  };

  // 监听系统语言切换

  /** 侦听依赖变化并触发副作用 */
  watch(
    () => Locale.value,
    () => {
      getHomeDataList();
    }
  );

  /** 行情 WS 下行中与热门列表相关的 content（字段以后端为准） */
  interface WsSpotTickerContent {
    symbol?: string;
    currentPrice?: number;
    changePercent?: number;
    totalVolume?: number;
    highPrice?: number;
  }

  /** parseSpotTickerContent */
  const parseSpotTickerContent = (msg: string | ArrayBuffer | null): WsSpotTickerContent | null => {
    if (msg == null || typeof msg !== 'string') return null;
    try {
      const body = JSON.parse(msg) as { content?: WsSpotTickerContent };
      const c = body?.content;
      return c?.symbol ? c : null;
    } catch {
      return null;
    }
  };

  /** default 通道行情推送：按 symbol 合并更新热门交易对（无匹配则不改列表引用） */
  watch(
    () => WebSocketStore.lastMessage,
    (msg) => {
      const content = parseSpotTickerContent(msg);
      if (!content?.symbol) return;

      const { symbol } = content;
      const list = tradingPairList.value;
      let changed = false;
      const next = list.map((item) => {
        if (item.symbol !== symbol) return item;
        changed = true;
        return {
          ...item,
          currentPrice: content.currentPrice ?? item.currentPrice,
          changePercent:
            content.changePercent != null
              ? ReturnPrecision(content.changePercent, 2)
              : item.changePercent,
          totalVolume: content.totalVolume ?? item.totalVolume,
          highPrice: content.highPrice ?? item.highPrice
        };
      });
      if (changed) tradingPairList.value = next;
    }
  );

  // 查看公告内容

  /** ToNotice */
  const ToNotice = (item: any) => {
    UserStore.setNoticeContent(item);
    router.push('/Notice/Detail');
  };

  // 初始化
  onBeforeMount((): void => {
    SystemStore.setLoading(true);
    UserStore.setActiveTab(0);
    getHomeDataList();
  });
</script>

<style scoped lang="less">
  // 设计图配色：深色背景、卡片内背景、青蓝强调、橙黄进度
  @card-outline: rgba(255, 255, 255, 0.08);
  @accent-cyan: #73bcff;

  .home-page {
    color: var(--van-text-color);
  }

  :deep(.van-nav-bar__left) {
    padding: 0 var(--van-padding-md);
  }

  :deep(.van-notice-bar) {
    padding: 0 var(--van-padding-xs);
  }

  // 双卡片容器：左右并排，留间距
  .home-cards {
    display: flex;
    gap: 0.24rem;
    width: 100%;
  }

  .home-card {
    flex: 1;
    min-width: 0;
    position: relative;
    border-radius: 0.2rem;
    // background: var(--van-card-linear-background);
    padding: 0.2rem;
    // border: 1px solid var(--van-border-color);
    overflow: hidden;
  }

  .home-card__head {
    margin-bottom: 0.12rem;
  }

  .home-card__title {
    margin: 0;
    font-size: 0.27rem;
    // font-weight: 700;
    color: #ffffff;
    line-height: 1.25;
  }

  .home-card__underline {
    width: 0.6rem;
    height: 0.04rem;
    margin-top: 0.08rem;
    background: @accent-cyan;
    border-radius: 0.03rem;
  }

  .home-card__desc {
    font-size: 0.23rem;
    color: #ffffff;
    line-height: 1.4;
    opacity: 0.95;
  }

  .home-card__progress {
    display: flex;
    align-items: center;
    gap: 0.08rem;
    margin-bottom: 0.16rem;
  }

  .home-card__bar {
    width: 0.05rem;
    height: 0.28rem;
    background: rgba(177, 219, 255, 1);
    flex-shrink: 0;
  }

  .home-card__bar--filled {
    background: rgba(255, 208, 156, 1);
  }

  .home-card__illus {
    position: absolute;
    right: 0.4rem;
    bottom: -0.1rem;
    width: 1rem;
    pointer-events: none;
  }

  :deep(.van-notice-bar__content) {
    width: 100%;
  }

  :deep(.van-grid-item__content) {
    padding: var(--van-padding-md) 0.1rem;
    .van-grid-item__icon {
      background: var(--van-tabbar-background);
      border-radius: 50%;
      padding: 0.15rem;
    }
  }

  .task_bg {
    background-image: url('../../assets/images/task_bg.png');
    background-size: 100% 100%;
    background-repeat: no-repeat;
    background-position: center;
  }
</style>
