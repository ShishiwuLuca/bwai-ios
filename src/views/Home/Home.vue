<template>
  <NavBar :show-left="false" fixed placeholder :border="false">
    <template #left>
      <VanImage :src="Logo" height="0.6rem" width="2.2rem" />
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
        <img :src="BetterIcon" width="22" height="22" @click="$router.push('/Notice')" />
         <div class="home-nav__avatar" @click="$router.push('/Personal')">
          <VanImage :src="userAvatarSrc" fit="cover" round width="100%" height="100%"/>
        </div>
      </div>

    </template>
  </NavBar>

  <PageWrap class="home-page">
    <div class="p-1 !pt-0">
      <Swipe
        class="home-banner"
        :autoplay="3000"
        :show-indicators="bannerList.length > 1"
      >
        <SwipeItem v-for="(item, index) in bannerList" :key="index">
          <div class="home-banner__slide">
            <VanImage
              v-if="item.imageUrl"
              :src="item.imageUrl"
              class="home-banner__img"
              width="100%"
              height="100%"
              fit="cover"
            />
            <div v-else class="home-banner__placeholder" ></div>
          </div>
        </SwipeItem>
        <SwipeItem v-if="!bannerList.length">
          <div class="home-banner__slide">
            <div class="home-banner__placeholder" ></div>
          </div>
        </SwipeItem>
      </Swipe>

      <NoticeBar
        :scrollable="false"
        class="home-notice mt-1 rounded-sm overflow-hidden"
        color="#333"
        background="#fff"
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
              <span class="home-notice__tag">{{ t('home_notice_tag') }}</span>
              <span class="home-notice__text">{{ item.title }}</span>
              <button type="button" class="home-notice__more" @click="ToNotice(item)">
                {{ t('home_notice_more') }}
                <Icon name="arrow" :size="12" color="#1a37fd" />
              </button>
            </div>
          </SwipeItem>
          <SwipeItem v-if="!NoticeList.length">
            <div class="home-notice__row">
              <span class="home-notice__tag">{{ t('home_notice_tag') }}</span>
              <span class="home-notice__text home-notice__text--muted">{{ t('home_notice_empty') }}</span>
            </div>
          </SwipeItem>
        </Swipe>
        <template #left-icon>
          <img class="home-notice__icon" :src="NoticeIcon" alt="" />
        </template>
      </NoticeBar>

      <Grid
        center
        clickable
        :border="false"
        :column-num="MenuList.length >= 5 ? 5 : 4"
        icon-size="0.9rem"
        class="home-menu-grid mt-1 mb-1 rounded-sm"
      >
        <GridItem
          v-for="(item, index) in MenuList"
          :key="index"
          :icon="item.imageUrl"
          :text="item.name"
          :to="item.path"
        />
      </Grid>

      <div class="home-ai-card mb-1" role="button" tabindex="0" @click="openAiMenu">
        <img class="home-ai-card__bg" :src="AIHomeBg" alt="" />
        <div class="home-ai-card__content">
          <p class="home-ai-card__label">{{ t('home_ai_label') }}</p>
          <h3 class="home-ai-card__title">
            {{ t('home_ai_title') }}<span class="home-ai-card__highlight">{{ t('home_ai_title_highlight') }}</span>
          </h3>
          <p class="home-ai-card__desc">{{ t('home_ai_desc') }}</p>
          <button type="button" class="home-ai-card__btn">
            {{ t('home_ai_learn_more') }}
            <Icon name="arrow" :size="12" />
          </button>
        </div>
      </div>

      <!-- <div class="home-cards mt-0.5">
        <div class="home-card task_bg" @click="$router.push('/DailyTask')">
          <h3 class="home-card__title">{{ t('str_daily_tasks') }}</h3>
          <div class="flex items-center gap-0.5">
            <p class="home-card__desc">{{ t('str_daily_tasks_desc') }}</p>
            <VanImage :src="DailyTasks" width="1.2rem" />
          </div>
        </div>
        <div class="home-card task_bg" @click="$router.push('/Rank')">
          <h3 class="home-card__title">{{ t('str_rankings') }}</h3>
          <div class="flex items-center gap-0.5">
            <p class="home-card__desc">{{ t('str_rankings_desc') }}</p>
            <VanImage :src="Rankings" width="1.2rem" />
          </div>
        </div>
      </div> -->

      <Tabs v-model:active="TabActive" class="home-market-tabs mt-1" shrink :ellipsis="false">
        <Tab v-for="(group, groupIndex) in tradingPairList" :key="group.label" :name="groupIndex">
          <template #title>
            <span class="home-market-tabs__title flex items-center gap-0.2">
              <Icon
                v-if="groupIndex === 0"
                :name="HotIcon"
                :size="20"
                color="var(--van-danger-color)"
              />
              <Icon
                v-if="groupIndex === 1"
                :name="RWAIcon"
                :size="20"
                color="var(--van-primary-color)"
              />
              <span>{{ group.label }}</span>
            </span>
          </template>

          <div class="flex items-center py-0.5 text-[0.2rem] font-bold">
            <div class="flex-1">{{ t('str_trading_pair') }}</div>
            <div class="flex-1 text-right mr-2">{{ t('str_latest_price') }}</div>
            <div class="w-[1.2rem] text-center">{{ t('str_today_price_change') }}</div>
          </div>

          <div
            v-for="item in group.children"
            :key="item.symbol"
            class="flex items-center pt-0.5 pb-0.3"
          >
            <div class="flex-1 flex items-center gap-0.5">
              <img
                :src="item.iconUrl ?? item.logo"
                referrerpolicy="no-referrer"
                class="w-[0.65rem] h-[0.65rem] rounded-full object-cover flex-shrink-0"
                alt=""
              />
              <div class="line-height-[0.35rem]">
                <div class="text-[0.3rem] font-bold">{{ item.symbol }}</div>
                <div class="text-[0.24rem] text-[#999]">
                  {{ formatTradeVolume(item.totalVolume ?? item.volume24h) }}
                </div>
              </div>
            </div>
            <div class="flex-1 text-right mr-2 line-height-[0.35rem]">
              <div class="text-[0.3rem] font-bold">
                <CountTo
                  :start-val="0"
                  :decimals="2"
                  :end-val="Number(ReturnPrecision(item.currentPrice ?? item.price, 4))"
                />
              </div>
              <div class="text-[0.24rem] text-[#999]">
                <CountTo
                  prefix="$"
                  :start-val="0"
                  :decimals="2"
                  :end-val="
                    Number(
                      ReturnPrecision(
                        item.currentPrice ?? item.price * (FiatExchangeRate['USD'] ?? 0),
                        4
                      )
                    )
                  "
                />
              </div>
            </div>
            <div class="w-[1.2rem] text-center">
              <Button
                class="w-5 !text-[0.25rem]"
                size="small"
                :color="
                  Number(item.changePercent) >= 0
                    ? 'var(--van-top-color)'
                    : 'var(--van-down-color)'
                "
              >
                <span v-if="Number(item.changePercent) >= 0">+</span
                >{{ ReturnPrecision(item.changePercent, 2) }}%
              </Button>
            </div>
          </div>
        </Tab>
      </Tabs>
    </div>
  </PageWrap>

  <AppTabBar />
</template>

<script setup lang="ts">
  import { onBeforeMount, ref, computed, watch } from 'vue';
  import { useRouter } from 'vue-router';
  import Avatar from '/@/assets/images/avatar_default.png';
  import { emitEvent } from '/@/utils/eventBus';
  import { useI18n } from '/@/hooks/web/useI18n';
  import HotIcon from '/@/assets/images/hot.png';
  import AIHomeBg from '/@/assets/images/AIhome.png';
  import Rankings from '/@/assets/images/Ranking.png';
  import RWAIcon from '/@/assets/images/RWA.png';
  import BetterIcon from '/@/assets/images/bell.png';
  import NoticeIcon from '/@/assets/images/notice.png';
  import DailyTasks from '/@/assets/images/daily_tasks.png';
  import { getHomeData, getRawList } from '/@/service/Home';
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
    Grid,
    GridItem,
    Button,
    Tabs,
    Tab
  } from 'vant';

  defineOptions({ name: 'Home' });

  const { t } = useI18n();
  const router = useRouter();
  const UserStore = useUserStoreWithOut();
  const SystemStore = useSystemStoreWithOut();

  const bannerList = ref<any[]>([]);
  const NoticeList = ref<any[]>([]);
  const MenuList = ref<any[]>([]);
  const TabActive = ref(0);

  type TradingPairGroup = { label: string; children: any[] };

  const tradingPairList = ref<TradingPairGroup[]>([
    { label: t('str_hot_trading'), children: [] },
    { label: t('str_rwa'), children: [] }
  ]);

  /** 与个人中心一致：用户头像，无则默认图 */
  const userAvatarSrc = computed(() => {
    const userInfo = UserStore.getUserInfo as { avatar?: string } | null | undefined;
    return userInfo?.avatar || Avatar;
  });

  const FiatExchangeRate = computed(() => SystemStore.getFiatExchangeRate);
  const Locale = computed(() => SystemStore.getLocaleInfo);
  const Logo = computed(() => SystemStore.getSiteLogo);

  const openAiMenu = () => emitEvent('OpenAiMenu');

  const mapTradingPairChildren = (list: any[]) =>
    list.map((child: any) => ({
      ...child,
      changePercent: ReturnPrecision(child.changePercent, 2)
    }));

  const getRawListData = () => {
    getRawList().then((res: any) => {
      if (res.code !== 0) return;
      const list = Array.isArray(res.data) ? res.data : (res.data?.coins ?? []);
      tradingPairList.value[1].children = mapTradingPairChildren(list);
    });
  };

  const getHomeDataList = () => {
    getHomeData().then((res: any) => {
      if (res.code !== 0 || !res.data?.modules) return;
      res.data.modules.forEach((item: any) => {
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
    });
  };

  const ToNotice = (item: any) => {
    UserStore.setNoticeContent(item);
    router.push('/Notice/Detail');
  };

  watch(Locale, () => {
    tradingPairList.value[0].label = t('str_hot_trading');
    tradingPairList.value[1].label = t('str_rwa');
    getHomeDataList();
  });

  onBeforeMount(() => {
    SystemStore.setLoading(true);
    UserStore.setActiveTab(0);
    getHomeDataList();
    getRawListData();
  });
</script>

<style scoped lang="less">
  @accent-cyan: #73bcff;
  @home-primary: #1a37fd;
  @home-radius: 0.24rem;
  @home-shadow: 0 0.08rem 0.28rem rgba(32, 113, 248, 0.08);

  .home-page {
    color: var(--van-text-color);
  }

  :deep(.van-nav-bar__left) {
    padding: 0 var(--van-padding-md);
  }

  /* 轮播：左下角条形指示器，激活项加长 */
  .home-banner {
    margin-top: 0.12rem;
    border-radius: @home-radius;
    overflow: hidden;

    :deep(.van-swipe__track) {
      border-radius: @home-radius;
    }

    :deep(.van-swipe__indicators) {
      left: 0.28rem;
      right: auto;
      bottom: 0.22rem;
      transform: none;
      justify-content: flex-start;
    }

    :deep(.van-swipe__indicator) {
      width: 0.14rem;
      height: 0.06rem;
      border-radius: 0.06rem;
      background: rgba(26, 55, 253, 0.22);
      opacity: 1;
      transition: width 0.25s ease, background 0.25s ease;
    }

    :deep(.van-swipe__indicator:not(:last-child)) {
      margin-right: 0.08rem;
    }

    :deep(.van-swipe__indicator--active) {
      width: 0.28rem;
      background: @home-primary;
    }
  }

  .home-banner__slide {
    position: relative;
    height: 3rem;
    border-radius: @home-radius;
    overflow: hidden;
    background: linear-gradient(135deg, #e8f2ff 0%, #cfe3ff 100%);
  }

  .home-banner__img {
    display: block;
    width: 100%;
    height: 100%;
  }

  .home-banner__placeholder {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #e8f2ff 0%, #cfe3ff 55%, #b8d4ff 100%);
  }

  :deep(.van-notice-bar) {
    padding: 0 var(--van-padding-xs);
  }

  :deep(.van-notice-bar__content) {
    width: 100%;
  }

  .home-notice {
    height: 0.88rem;
    background: #fff;
    box-shadow: @home-shadow;

    :deep(.van-notice-bar__left-icon) {
      margin-right: 0.12rem;
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
    font-weight: 700;
  }

  .home-notice__text {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #333;

    &--muted {
      color: #999;
    }
  }

  .home-notice__more {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    gap: 0.04rem;
    padding: 0;
    border: none;
    background: transparent;
    color: @home-primary;
    font-size: 0.24rem;
  }

  .home-notice__icon {
    display: block;
    width: 0.56rem;
    height: 0.56rem;
    object-fit: contain;
  }

  .home-menu-grid {
    background: #f9faff;
    overflow: hidden;

    :deep(.van-grid-item__content) {
      padding: var(--van-padding-md) 0.1rem;
      background: #f9faff;

      .van-grid-item__icon {
        border-radius: 50%;
        padding: 0.15rem;
      }
    }
  }

  .home-cards {
    display: flex;
    gap: 0.24rem;
    width: 100%;
  }

  .home-card {
    flex: 1;
    min-width: 0;
    padding: 0.2rem;
    border-radius: 0.2rem;
    overflow: hidden;
  }

  .home-card__title {
    margin: 0 0 0.12rem;
    font-size: 0.27rem;
    color: #000;
    line-height: 1.25;
  }

  .home-card__desc {
    margin: 0;
    font-size: 0.23rem;
    color: #000;
    line-height: 1.4;
    opacity: 0.95;
  }

  .task_bg {
    background: url('../../assets/images/task_bg.png') center / 100% 100% no-repeat;
  }

  .home-ai-card {
    position: relative;
    margin-top: 0.28rem;
    min-height: 2rem;
    border-radius: @home-radius;
    overflow: hidden;
    box-shadow: @home-shadow;
    cursor: pointer;
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
    color: #fff;
  }

  .home-ai-card__highlight {
    color: #ffc56b;
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
    background: linear-gradient(180deg, #fff 0%, #fff 30%, #ffc56b 100%);
    color: #02196a;
    font-size: 0.22rem;
    font-weight: 600;
  }

  .home-market-tabs {
    :deep(.van-tabs__wrap) {
      height: 0.88rem;
    }

    :deep(.van-tabs__nav) {
      background: transparent;
      justify-content: flex-start;
    }

    :deep(.van-tabs__content) {
      padding-top: 0.08rem;
    }

    :deep(.van-tabs__line) {
      background: @accent-cyan;
    }

    :deep(.van-tab) {
      flex: none;
      padding: 0 0.28rem;
      font-size: 0.28rem;
      font-weight: 400;
      color: #000;

      &:first-child {
        padding-left: 0;
      }

      .van-tab__text {
        color: #000;
      }

      &--active {
        font-weight: 700;
      }
    }
  }

  .home-market-tabs__title {
    line-height: 1.2;
    color: #000;
  }

  .home-nav__avatar {
    flex-shrink: 0;
    width: 0.55rem;
    height: 0.55rem;
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
</style>
