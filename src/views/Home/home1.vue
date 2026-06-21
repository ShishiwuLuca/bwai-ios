<template>
  <div class="home-root">
  <NavBar :show-left="false" fixed placeholder :border="false" class="home-nav">
    <template #left>
      <VanImage v-if="Logo" :src="Logo" height="0.6rem" width="2.2rem" />
      <div v-else class="home-nav__logo-placeholder"></div>
    </template>
    <template #right>
      <div class="home-nav__actions">
        <Icon
          class-prefix="exchange-icon"
          name="locale"
          :size="22"
          color="#2071f8"
          @click="emitEvent('ShowLocales')"
        />
        <Icon name="bell" :size="23" color="#006ED2" @click="$router.push('/Notice')" />
        <div class="home-nav__avatar" @click="$router.push('/Personal')">
          <VanImage :src="userAvatarSrc" fit="cover" round width="100%" height="100%" />
        </div>
      </div>
    </template>
  </NavBar>

  <PageWrap class="home-page">
    <div class="home-page__inner">
      <!-- 顶部轮播 -->
      <Swipe
        class="home-hero"
        :autoplay="3000"
        :show-indicators="true"
        indicator-color="#2071f8"
      >
        <SwipeItem v-for="(item, index) in bannerList" :key="index">
          <div class="home-hero__slide">
            <div v-if="item.imageUrl" class="home-hero__media">
              <VanImage :src="item.imageUrl" width="100%" height="100%" fit="cover" />
            </div>
            <div v-else class="home-hero__media home-hero__media--placeholder"></div>
          </div>
        </SwipeItem>
        <SwipeItem v-if="!bannerList.length">
          <div class="home-hero__slide">
            <div class="home-hero__media home-hero__media--placeholder"></div>
          </div>
        </SwipeItem>
      </Swipe>

      <!-- 公告 -->
      <NoticeBar
        :scrollable="false"
        class="home-notice"
        color="#333333"
        background="#ffffff"
      >
        <Swipe
          :loop="true"
          vertical
          :show-indicators="false"
          :autoplay="5000"
          :touchable="false"
          class="home-notice__swipe"
        >
          <SwipeItem v-for="(item, index) in NoticeList" :key="index">
            <div class="home-notice__row">
              <span class="home-notice__tag">公告</span>
              <span class="home-notice__text">{{ item.title }}</span>
              <button type="button" class="home-notice__more" @click="ToNotice(item)">
                更多
                <Icon name="arrow" :size="12" color="#2071f8" />
              </button>
            </div>
          </SwipeItem>
          <SwipeItem v-if="!NoticeList.length">
            <div class="home-notice__row">
              <span class="home-notice__tag">公告</span>
              <span class="home-notice__text">暂无公告</span>
            </div>
          </SwipeItem>
        </Swipe>
        <template #left-icon>
          <img class="home-notice__icon" :src="NoticeIcon" alt="" />
        </template>
      </NoticeBar>

      <!-- 快捷入口 -->
      <div class="home-menu">
        <router-link
          v-for="(item, index) in MenuList"
          :key="index"
          :to="item.path"
          class="home-menu__item"
        >
          <div class="home-menu__icon-wrap">
            <img v-if="item.imageUrl" :src="item.imageUrl" class="home-menu__icon" alt="" />
            <div v-else class="home-img-placeholder home-img-placeholder--menu"></div>
          </div>
          <span class="home-menu__label">{{ item.name }}</span>
        </router-link>
      </div>

      <!-- AI 推广卡 -->
      <div class="home-ai-card">
        <img class="home-ai-card__bg" :src="AIHomeBg" alt="" />
        <div class="home-ai-card__content">
          <p class="home-ai-card__label">AI智能交易</p>
          <h3 class="home-ai-card__title">把握每一次投资<span style="color: #FFC56B;">机会</span></h3>
          <p class="home-ai-card__desc">AI驱动 · 数据赋能</p>
          <button type="button" class="home-ai-card__btn">
            了解更多
            <Icon name="arrow" :size="12" />
          </button>
        </div>
      </div>

      <!-- 资产概览（布局占位，后续接数据） -->
      <div class="home-stats">
        <div
          v-for="(item, index) in statCards"
          :key="item.label"
          class="home-stats__item"
          :class="{ 'home-stats__item--rank': item.type === 'rank' }"
        >
          <div class="home-stats__head">
            <img class="home-stats__icon" :src="item.icon" alt="" />
            <span class="home-stats__label">{{ item.label }}</span>
          </div>
          <div class="home-stats__value-row" :style="{ color: item.valueColor }">
            <span class="home-stats__value">{{ item.value }}</span>
            <Icon v-if="item.showArrow" name="arrow-up" :size="10" :color="item.valueColor" />
          </div>
          <svg
            v-if="item.chartData"
            class="home-stats__chart"
            viewBox="0 0 100 40"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient :id="`home-sparkline-fill-${index}`" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" :stop-color="item.fillColor" />
                <stop offset="100%" stop-color="rgba(255, 255, 255, 0)" />
              </linearGradient>
            </defs>
            <path
              :d="getSparklineArea(item.chartData)"
              :fill="`url(#home-sparkline-fill-${index})`"
            />
            <path
              :d="getSparklineLine(item.chartData)"
              fill="none"
              :stroke="item.lineColor"
              stroke-width="1.2"
              stroke-linecap="round"
              stroke-linejoin="round"
              vector-effect="non-scaling-stroke"
            />
          </svg>
          <div v-else class="home-stats__rank-deco">
            <div class="home-stats__rank-ripples" aria-hidden="true"></div>
            <img class="home-stats__rank-medal" :src="PamingIcon" alt="" />
          </div>
        </div>
      </div>

      <!-- 每日任务 / 排行榜 -->
      <div class="home-cards">
        <div class="home-card home-card--tasks" @click="$router.push('/DailyTask')">
          <div class="home-card__head">
            <div class="home-card__title-icon home-img-placeholder home-img-placeholder--xs"></div>
            <h3 class="home-card__title">{{ t('str_daily_tasks') }}</h3>
          </div>
          <p class="home-card__desc">{{ t('str_daily_tasks_desc') }}</p>
          <div class="home-card__illus home-img-placeholder home-img-placeholder--card"></div>
          <div class="home-card__progress">
            <div class="home-card__progress-bar">
              <span class="home-card__progress-fill" style="width: 60%"></span>
            </div>
            <span class="home-card__progress-text">3/5 已完成</span>
          </div>
        </div>

        <div class="home-card home-card--rank" @click="$router.push('/Rank')">
          <div class="home-card__badge">VIP 1</div>
          <p class="home-card__rank-label">{{ t('str_rankings') }}</p>
          <p class="home-card__desc home-card__desc--dark">{{ t('str_rankings_desc') }}</p>
          <div class="home-card__rank-exp">
            <span>经验值</span>
            <span>18,555/25,000</span>
          </div>
          <div class="home-card__progress-bar home-card__progress-bar--orange">
            <span class="home-card__progress-fill" style="width: 74%"></span>
          </div>
          <div class="home-card__tags">
            <span>更高奖励</span>
            <span>更低手续费</span>
            <span>优先客服</span>
          </div>
          <button type="button" class="home-card__upgrade-btn">立即升级</button>
        </div>
      </div>

      <!-- 热门行情 -->
      <div class="home-market">
        <div class="home-market__head">
          <h3 class="home-market__title">{{ t('str_hot_trading') }}</h3>
          <button type="button" class="home-market__more">
            全部
            <Icon name="arrow" :size="12" color="#2071f8" />
          </button>
        </div>

        <Tabs v-model:active="TabActive" class="home-market-tabs" shrink :ellipsis="false">
          <Tab
            v-for="(group, groupIndex) in tradingPairList"
            :key="group.label"
            :name="groupIndex"
          >
            <template #title>
              <div class="home-market-tabs__title">
                <Icon
                  v-if="groupIndex === 0"
                  :name="HotIcon"
                  :size="16"
                  color="#f54336"
                />
                <span>{{ group.label }}</span>
              </div>
            </template>

            <div class="home-market__scroll">
              <div
                v-for="item in group.children"
                :key="item.symbol"
                class="home-market-card"
              >
                <div class="home-market-card__head">
                  <div class="home-market-card__coin">
                    <img
                      v-if="item.iconUrl ?? item.logo"
                      :src="item.iconUrl ?? item.logo"
                      referrerpolicy="no-referrer"
                      class="home-market-card__coin-img"
                      alt=""
                    />
                    <div v-else class="home-img-placeholder home-img-placeholder--coin"></div>
                    <span class="home-market-card__symbol">{{ item.symbol }}</span>
                  </div>
                  <span
                    class="home-market-card__change"
                    :class="
                      Number(item.changePercent) >= 0
                        ? 'home-market-card__change--up'
                        : 'home-market-card__change--down'
                    "
                  >
                    <span v-if="Number(item.changePercent) >= 0">+</span
                    >{{ ReturnPrecision(item.changePercent, 2) }}%
                  </span>
                </div>
                <p class="home-market-card__price">
                  <CountTo
                    :start-val="0"
                    :decimals="2"
                    :end-val="Number(ReturnPrecision(item.currentPrice ?? item.price, 4))"
                  />
                </p>
                <p class="home-market-card__volume">
                  {{ formatTradeVolume(item.totalVolume ?? item.volume24h) }}
                </p>
                <div class="home-market-card__chart home-img-placeholder home-img-placeholder--chart"></div>
              </div>

              <div v-if="!group.children.length" class="home-market__empty">暂无行情数据</div>
            </div>
          </Tab>
        </Tabs>
      </div>
    </div>
  </PageWrap>

  <AppTabBar />
  </div>
</template>

<script setup lang="ts">
  import { useRouter } from 'vue-router';
  import { emitEvent } from '/@/utils/eventBus';
  import { useI18n } from '/@/hooks/web/useI18n';
  import HotIcon from '/@/assets/images/hot.png';
  import Avatar from '/@/assets/images/avatar.png';
  import NoticeIcon from '/@/assets/images/notice.png';
  import AIHomeBg from '/@/assets/images/AIhome.png';
  import ZichanIcon from '/@/assets/images/zichan.png';
  import ShouyiIcon from '/@/assets/images/shouyi.png';
  import AlphaIcon from '/@/assets/images/AIpha.png';
  import PamingIcon from '/@/assets/images/paming.png';
  import { getHomeData, getRawList } from '/@/service/Home';
  import { onBeforeMount, ref, computed, watch } from 'vue';
  import { ReturnPrecision, formatTradeVolume } from '/@/utils';
  import { useUserStoreWithOut } from '/@/stores/modules/UserConfig';
  import { NavBar, PageWrap, AppTabBar, CountTo } from '/@/components';
  import { useSystemStoreWithOut } from '/@/stores/modules/SystemConfig';
  import {
    Image as VanImage,
    Icon,
    Swipe,
    SwipeItem,
    NoticeBar,
    Tabs,
    Tab
  } from 'vant';

  const { t } = useI18n();
  const router = useRouter();
  const UserStore = useUserStoreWithOut();
  const SystemStore = useSystemStoreWithOut();

  const bannerList = ref<any[]>([]);
  const NoticeList = ref<any[]>([]);
  const MenuList = ref<any[]>([]);

  type TradingPairGroup = { label: string; children: any[] };

  const tradingPairList = ref<TradingPairGroup[]>([
    { label: t('str_hot_trading'), children: [] },
    { label: 'RAW', children: [] }
  ]);

  const TabActive = ref<number>(0);

  /** 资产概览占位（仅布局，后续接接口） */
  const STAT_CHART_DATA = [32, 35, 33, 37, 34, 39, 36, 40, 37, 42, 39, 44, 41, 45, 42, 47, 44, 49];

  const statCards = [
    {
      label: '总资产',
      value: '8,555.00',
      icon: ZichanIcon,
      valueColor: '#02196A',
      lineColor: '#4A63E8',
      fillColor: 'rgba(74, 99, 232, 0.3)',
      showArrow: true,
      chartData: STAT_CHART_DATA
    },
    {
      label: '今日收益',
      value: '8,555.00',
      icon: ShouyiIcon,
      valueColor: '#27C174',
      lineColor: '#27C174',
      fillColor: 'rgba(39, 193, 116, 0.3)',
      showArrow: true,
      chartData: STAT_CHART_DATA
    },
    {
      label: 'Alpha积分',
      value: '8,555.00 P',
      icon: AlphaIcon,
      valueColor: '#4A3D9E',
      lineColor: '#5B4FC7',
      fillColor: 'rgba(91, 79, 199, 0.3)',
      chartData: STAT_CHART_DATA
    },
    {
      label: '我的排名',
      value: '前3.2%',
      icon: PamingIcon,
      valueColor: '#000000',
      type: 'rank'
    }
  ];

  const getSparklinePoints = (data: number[], width = 100, height = 40) => {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const domainPad = range * 1.8;
    const domainMin = min - domainPad;
    const domainMax = max + domainPad;
    const domainRange = domainMax - domainMin;
    const paddingX = 1;
    const paddingY = height * 0.18;
    const plotHeight = height - paddingY * 2;
    const step = data.length > 1 ? (width - paddingX * 2) / (data.length - 1) : 0;

    return data.map((value, index) => ({
      x: paddingX + index * step,
      y: paddingY + plotHeight * (1 - (value - domainMin) / domainRange)
    }));
  };

  const getSparklineLine = (data: number[]) => {
    const points = getSparklinePoints(data);
    return points
      .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)},${point.y.toFixed(2)}`)
      .join(' ');
  };

  const getSparklineArea = (data: number[]) => {
    const points = getSparklinePoints(data);
    if (!points.length) return '';

    const line = points
      .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)},${point.y.toFixed(2)}`)
      .join(' ');
    const last = points[points.length - 1];
    const first = points[0];

    return `${line} L${last.x.toFixed(2)},40 L${first.x.toFixed(2)},40 Z`;
  };

  const mapTradingPairChildren = (list: any[]) =>
    list.map((child: any) => ({
      ...child,
      changePercent: ReturnPrecision(child.changePercent, 2)
    }));

  const Locale = computed(() => SystemStore.getLocaleInfo);
  const Logo = computed(() => SystemStore.getSiteLogo);

  /** 与个人中心一致：用户头像，无则默认图 */
  const userAvatarSrc = computed(() => {
    const userInfo = UserStore.getUserInfo as { avatar?: string } | null | undefined;
    return userInfo?.avatar || Avatar;
  });

  const getRawListData = () => {
    getRawList().then((res: any) => {
      const { code, data } = res;
      if (code === 0) {
        const list = Array.isArray(data) ? data : (data?.coins ?? []);
        tradingPairList.value[1].children = mapTradingPairChildren(list);
      }
    });
  };

  const getHomeDataList = () => {
    getHomeData().then((res: any) => {
      const { code } = res;
      if (code === 0) {
        const {
          data: { modules }
        } = res;
        if (modules) {
          console.log(modules);
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
                tradingPairList.value[0].children = mapTradingPairChildren(item.data ?? []);
                break;
            }
          });
        }
      }
    });
  };

  watch(
    () => Locale.value,
    () => {
      tradingPairList.value[0].label = t('str_hot_trading');
      getHomeDataList();
    }
  );

  const ToNotice = (item: any) => {
    UserStore.setNoticeContent(item);
    router.push('/Notice/Detail');
  };

  onBeforeMount((): void => {
    SystemStore.setLoading(true);
    UserStore.setActiveTab(0);
    getHomeDataList();
    getRawListData();
  });
</script>

<style scoped lang="less">
  @home-bg: #f5f8ff;
  @home-card: #ffffff;
  @home-text: #333333;
  @home-text-secondary: #999999;
  @home-primary: #2071f8;
  @home-link: #0052ff;
  @home-up: #27c174;
  @home-down: #f54336;
  @home-orange: #ff8c00;
  @home-radius: 0.24rem;
  @home-shadow: 0 0.08rem 0.28rem rgba(32, 113, 248, 0.08);

  .home-page {
    color: @home-text;
    background: transparent;
  }

  .home-page__inner {
    padding: 0 0.32rem 0.32rem;
  }

  .home-nav__actions {
    display: flex;
    align-items: center;
    gap: 0.1rem;
  }

  .home-nav__avatar {
    flex-shrink: 0;
    width: 0.48rem;
    height: 0.48rem;
    border-radius: 50%;
    overflow: hidden;
    border: 1px solid rgba(32, 113, 248, 0.2);
    background: #e8eefb;

    :deep(.van-image),
    :deep(.van-image__img) {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .home-nav__logo-placeholder {
    width: 2.2rem;
    height: 0.6rem;
    border-radius: 0.12rem;
    background: linear-gradient(180deg, #d8e6ff 0%, #b8cff9 100%);
  }

  /* 图片占位 */
  .home-img-placeholder {
    background: linear-gradient(135deg, #e8eefb 0%, #d4e2fa 100%);
    border: 1px dashed rgba(32, 113, 248, 0.18);

    &--sm {
      width: 0.56rem;
      height: 0.56rem;
      border-radius: 50%;
    }

    &--xs {
      width: 0.36rem;
      height: 0.36rem;
      border-radius: 0.08rem;
    }

    &--menu {
      width: 0.88rem;
      height: 0.88rem;
      border-radius: 50%;
    }

    &--ai {
      position: absolute;
      inset: 0;
      border: none;
      border-radius: @home-radius;
      background: linear-gradient(135deg, #1a2a4f 0%, #0f1a35 100%);
    }

    &--stat {
      width: 0.44rem;
      height: 0.44rem;
      border-radius: 0.1rem;
      margin: 0 auto 0.12rem;
    }

    &--chart {
      width: 100%;
      height: 0.56rem;
      border-radius: 0.08rem;
      margin-top: 0.12rem;
      border-style: dashed;
    }

    &--card {
      width: 1.4rem;
      height: 1.1rem;
      border-radius: 0.12rem;
      margin: 0.16rem auto;
    }

    &--coin {
      width: 0.48rem;
      height: 0.48rem;
      border-radius: 50%;
      flex-shrink: 0;
    }
  }

  /* 轮播 */
  .home-hero {
    margin-top: 0.12rem;
    border-radius: @home-radius;
    overflow: hidden;

    :deep(.van-swipe__indicators) {
      left: 0.36rem;
      bottom: 0.32rem;
      transform: none;
      justify-content: flex-start;
    }

    :deep(.van-swipe__indicator) {
      width: 0.35rem;
      height: 0.08rem;
      border-radius: 0.08rem;
      background: rgba(32, 113, 248, 0.2);
      opacity: 1;
    }

    :deep(.van-swipe__indicator:not(:last-child)) {
      margin-right: 0.12rem;
    }

    :deep(.van-swipe__indicator--active) {
      background: @home-primary;
    }
  }

  .home-hero__slide {
    position: relative;
    height: 3.2rem;
    border-radius: @home-radius;
    overflow: hidden;
    background: linear-gradient(135deg, #e8f2ff 0%, #cfe3ff 100%);
  }

  .home-hero__media {
    position: absolute;
    inset: 0;

    &--placeholder {
      background: linear-gradient(135deg, #e8f2ff 0%, #cfe3ff 55%, #b8d4ff 100%);
      border: 1px dashed rgba(32, 113, 248, 0.2);
    }
  }

  /* 公告 */
  .home-notice {
    margin-top: 0.24rem;
    height: 0.75rem;
    border-radius: 0.15rem;
    box-shadow: 0 0.08rem 0.4rem rgba(160, 175, 255, 0.2);

    :deep(.van-notice-bar__left-icon) {
      margin-right: 0.16rem;
    }

    :deep(.van-notice-bar__content) {
      width: 100%;
    }
  }

  .home-notice__swipe {
    width: 100%;
    height: 0.88rem;
    line-height: 0.88rem;
  }

  .home-notice__row {
    display: flex;
    align-items: center;
    gap: 0.12rem;
    width: 100%;
    font-size: 0.24rem;
  }

  .home-notice__tag {
    flex-shrink: 0;
    color: @home-primary;
    font-weight: 600;
  }

  .home-notice__text {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: @home-text;
  }

  .home-notice__more {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    gap: 0.04rem;
    padding: 0;
    border: none;
    background: transparent;
    color: @home-link;
    font-size: 0.24rem;
  }

  .home-notice__icon {
    display: block;
    width: 0.56rem;
    height: 0.56rem;
  }

  /* 快捷菜单 */
  .home-menu {
    display: flex;
    justify-content: space-between;
    gap: 0.12rem;
    margin-top: 0.28rem;
    padding: .26rem 0;
    background: #F9FAFF;
    border-radius: 0.15rem;
    box-shadow: 0 0.08rem 0.4rem rgba(160, 175, 255, 0.2);
  }

  .home-menu__item {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.12rem;
    text-decoration: none;
    color: @home-text;
  }

  .home-menu__icon-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .home-menu__icon {
    width: 0.62rem;
    height: 0.62rem;
    object-fit: contain;
  }

  .home-menu__label {
    font-size: 0.22rem;
    text-align: center;
    line-height: 1.3;
  }

  /* AI 推广 */
  .home-ai-card {
    position: relative;
    margin-top: 0.28rem;
    min-height: 2rem;
    border-radius: @home-radius;
    overflow: hidden;
    box-shadow: @home-shadow;
  }

  .home-ai-card__bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: @home-radius;
  }

  .home-ai-card__content {
    position: relative;
    z-index: 1;
    padding: 0.32rem;
  }

  .home-ai-card__label {
    margin: 0;
    font-size: 0.24rem;
    color: rgba(255, 255, 255, 0.82);
  }

  .home-ai-card__title {
    width: 2.4rem;
    margin: 0.1rem 0;
    font-size: 0.3rem;
    font-weight: 900;
    color: #ffffff;
  }

  .home-ai-card__desc {
    margin: 0;
    font-size: 0.22rem;
    color: rgba(255, 255, 255, 0.72);
  }

  .home-ai-card__btn {
    display: inline-flex;
    align-items: center;
    gap: 0.06rem;
    margin-top: 0.2rem;
    padding: 0.1rem 0.24rem;
    border: none;
    border-radius: 0.28rem;
    background: linear-gradient(180deg, #ffffff 0%,#ffffff 30%,#ffc56b 100%);
    color: #02196A;
    font-size: 0.22rem;
    font-weight: 600;
  }

  /* 资产四宫格 */
  .home-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.16rem;
    margin-top: 0.28rem;
  }

  .home-stats__item {
    position: relative;
    padding: 0.16rem 0.12rem 0.12rem;
    border-radius: 0.2rem;
    background: @home-card;
    box-shadow: @home-shadow;
    text-align: left;
    overflow: hidden;

    &--rank {
      .home-stats__value {
        font-size: 0.22rem;
      }
    }
  }

  .home-stats__head {
    display: flex;
    align-items: center;
    gap: 0.06rem;
  }

  .home-stats__icon {
    width: 0.26rem;
    height: 0.26rem;
    object-fit: contain;
    flex-shrink: 0;
  }

  .home-stats__label {
    margin: 0;
    font-size: 0.18rem;
    color: @home-text-secondary;
    line-height: 1.2;
    white-space: nowrap;
  }

  .home-stats__value-row {
    display: flex;
    align-items: center;
    gap: 0.04rem;
    margin-top: 0.1rem;
    min-height: 0.32rem;
  }

  .home-stats__value {
    margin: 0;
    font-size: 0.22rem;
    font-weight: 700;
    line-height: 1.2;
    word-break: break-all;
  }

  .home-stats__chart {
    display: block;
    width: 100%;
    height: 0.52rem;
    margin-top: 0.08rem;
  }

  .home-stats__rank-deco {
    position: relative;
    height: 0.52rem;
    margin-top: 0.08rem;
  }

  .home-stats__rank-ripples {
    position: absolute;
    right: 0.08rem;
    bottom: -0.12rem;
    width: 0.72rem;
    height: 0.72rem;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(74, 99, 232, 0.08) 0%, rgba(74, 99, 232, 0) 70%);
    box-shadow:
      0 0 0 0.06rem rgba(74, 99, 232, 0.05),
      0 0 0 0.14rem rgba(74, 99, 232, 0.04),
      0 0 0 0.22rem rgba(74, 99, 232, 0.03);
  }

  .home-stats__rank-medal {
    position: absolute;
    right: 0;
    bottom: 0;
    width: 0.48rem;
    height: 0.48rem;
    object-fit: contain;
    z-index: 1;
  }

  /* 任务 / 排行榜 */
  .home-cards {
    display: flex;
    gap: 0.2rem;
    margin-top: 0.28rem;
  }

  .home-card {
    flex: 1;
    min-width: 0;
    position: relative;
    padding: 0.24rem;
    border-radius: @home-radius;
    overflow: hidden;
    box-shadow: @home-shadow;
  }

  .home-card--tasks {
    background: linear-gradient(180deg, #eef4ff 0%, #ffffff 100%);
    border: 1px solid rgba(32, 113, 248, 0.1);
  }

  .home-card--rank {
    background: @home-card;
    border: 1px solid rgba(255, 140, 0, 0.12);
  }

  .home-card__head {
    display: flex;
    align-items: center;
    gap: 0.1rem;
    margin-bottom: 0.08rem;
  }

  .home-card__title {
    margin: 0;
    font-size: 0.28rem;
    font-weight: 700;
    color: @home-text;
  }

  .home-card__desc {
    margin: 0;
    font-size: 0.22rem;
    line-height: 1.45;
    color: @home-text-secondary;

    &--dark {
      color: @home-text-secondary;
    }
  }

  .home-card__badge {
    display: inline-block;
    margin-bottom: 0.12rem;
    padding: 0.04rem 0.16rem;
    border-radius: 0.08rem;
    background: linear-gradient(90deg, #ffb347 0%, @home-orange 100%);
    color: #ffffff;
    font-size: 0.22rem;
    font-weight: 700;
  }

  .home-card__rank-label {
    margin: 0 0 0.08rem;
    font-size: 0.28rem;
    font-weight: 700;
    color: @home-text;
  }

  .home-card__rank-exp {
    display: flex;
    justify-content: space-between;
    margin-top: 0.16rem;
    font-size: 0.2rem;
    color: @home-text-secondary;
  }

  .home-card__progress {
    margin-top: 0.16rem;
  }

  .home-card__progress-bar {
    height: 0.1rem;
    border-radius: 0.1rem;
    background: rgba(32, 113, 248, 0.12);
    overflow: hidden;

    &--orange {
      background: rgba(255, 140, 0, 0.15);
    }
  }

  .home-card__progress-fill {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #6ca9ff 0%, @home-primary 100%);
  }

  .home-card__progress-bar--orange .home-card__progress-fill {
    background: linear-gradient(90deg, #ffc266 0%, @home-orange 100%);
  }

  .home-card__progress-text {
    display: block;
    margin-top: 0.1rem;
    font-size: 0.2rem;
    color: @home-primary;
    text-align: center;
  }

  .home-card__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.08rem;
    margin-top: 0.16rem;

    span {
      padding: 0.06rem 0.12rem;
      border-radius: 0.08rem;
      background: rgba(255, 140, 0, 0.1);
      color: @home-orange;
      font-size: 0.18rem;
    }
  }

  .home-card__upgrade-btn {
    width: 100%;
    margin-top: 0.16rem;
    padding: 0.14rem 0;
    border: none;
    border-radius: 0.16rem;
    background: linear-gradient(180deg, #3d4f7a 0%, #1f2d52 100%);
    color: #ffffff;
    font-size: 0.24rem;
    font-weight: 600;
  }

  /* 热门行情 */
  .home-market {
    margin-top: 0.32rem;
  }

  .home-market__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.16rem;
  }

  .home-market__title {
    margin: 0;
    font-size: 0.32rem;
    font-weight: 700;
    color: @home-text;
  }

  .home-market__more {
    display: inline-flex;
    align-items: center;
    gap: 0.04rem;
    padding: 0;
    border: none;
    background: transparent;
    color: @home-link;
    font-size: 0.24rem;
  }

  .home-market-tabs {
    :deep(.van-tabs__wrap) {
      height: auto;
      margin-bottom: 0.16rem;
    }

    :deep(.van-tabs__nav) {
      background: transparent;
      padding: 0;
    }

    :deep(.van-tab) {
      flex: none;
      padding: 0 0.2rem 0.12rem;
      font-size: 0.26rem;
      color: @home-text-secondary;
    }

    :deep(.van-tab:first-child) {
      padding-left: 0;
    }

    :deep(.van-tab--active) {
      color: @home-text;
      font-weight: 700;
    }

    :deep(.van-tabs__line) {
      background: @home-primary;
    }

    :deep(.van-tabs__content) {
      padding: 0;
    }
  }

  .home-market-tabs__title {
    display: inline-flex;
    align-items: center;
    gap: 0.08rem;
    line-height: 1.2;
  }

  .home-market__scroll {
    display: flex;
    gap: 0.2rem;
    overflow-x: auto;
    padding-bottom: 0.08rem;
    -webkit-overflow-scrolling: touch;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  .home-market-card {
    flex: 0 0 2.4rem;
    padding: 0.24rem;
    border-radius: 0.2rem;
    background: @home-card;
    box-shadow: @home-shadow;
  }

  .home-market-card__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.12rem;
  }

  .home-market-card__coin {
    display: flex;
    align-items: center;
    gap: 0.1rem;
    min-width: 0;
  }

  .home-market-card__coin-img {
    width: 0.48rem;
    height: 0.48rem;
    border-radius: 50%;
    object-fit: cover;
  }

  .home-market-card__symbol {
    font-size: 0.26rem;
    font-weight: 700;
    color: @home-text;
  }

  .home-market-card__change {
    font-size: 0.22rem;
    font-weight: 600;

    &--up {
      color: @home-up;
    }

    &--down {
      color: @home-down;
    }
  }

  .home-market-card__price {
    margin: 0.16rem 0 0.06rem;
    font-size: 0.32rem;
    font-weight: 700;
    color: @home-text;
    line-height: 1.2;
  }

  .home-market-card__volume {
    margin: 0;
    font-size: 0.2rem;
    color: @home-text-secondary;
  }

  .home-market__empty {
    width: 100%;
    padding: 0.48rem 0;
    text-align: center;
    font-size: 0.24rem;
    color: @home-text-secondary;
  }

  :deep(.van-nav-bar__left) {
    padding: 0 var(--van-padding-md);
  }
</style>
