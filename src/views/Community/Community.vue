<template>
  <div class="community-page-shell">
    <NavBar :title="t('cm_nav_title')" :show-left="false" fixed placeholder :border="false"
      class="community-page__navbar">
      <template #left>
        <div class="community-page__nav-avatar" aria-hidden="true" @click="goMyCommunity">
          <VanImage :src="userAvatarSrc" />
        </div>
      </template>
      <template #right>
        <span class="community-page__nav-publish" @click="goPublish">{{ t('cm_go_publish') }}</span>
      </template>
    </NavBar>
    <PageWrap class="community-page pt-1">
      <div class="community-page__content">
        <Swipe class="pt-0.5" :autoplay="3000" show-indicators indicator-color="white">
          <SwipeItem v-for="(item, index) in bannerList" :key="index" class="rounded-sm">
            <VanImage :src="item.imageUrl" class="overflow-hidden rounded-sm" width="100%" height="100%" />
          </SwipeItem>
        </Swipe>
  
        <Tabs v-model:active="activeTab" class="community-page__tabs" :line-width="lineWidthPx" :ellipsis="false">
          <Tab v-for="c in categories" :key="getCategoryTabName(c.id)" :title="c.categoryName"
            :name="getCategoryTabName(c.id)" />
          <Tab v-if="categoryTabsReady" :title="t('cm_tab_recommend')" :name="RECOMMEND_TAB" />
        </Tabs>
  
        <PullRefresh v-if="categoryTabsReady" v-model="feedRefreshing" class="community-page__pull"
          :class="{ 'community-page__pull--refreshing': feedRefreshing }" @refresh="onFeedRefresh">
          <List v-model:loading="feedLoading" :finished="feedFinished" :immediate-check="false"
            :loading-text="feedRefreshing ? ' ' : undefined" :finished-text="t('no_more')" class="community-page__list"
            @load="onFeedLoad">
            <div class="community-page__feed">
              <CommunityPostCard v-for="post in posts" :key="post.id" :post="post" show-report @click="goDetail(post)"
                @report="onReport(post)" />
            </div>
            <Empty v-if="posts.length === 0 && feedFinished && !feedLoading" image="search"
              :description="t('sd_no_data')" />
          </List>
        </PullRefresh>
      </div>
    </PageWrap>
    <AppTabBar />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { ref, computed, onBeforeMount, watch } from 'vue';
import Avatar from '/@/assets/images/avatar.png';
import { Tabs, Tab, Swipe, SwipeItem, PullRefresh, List, Empty, Image as VanImage } from 'vant';
import { useUserStoreWithOut } from '/@/stores/modules/UserConfig';
import { NavBar, PageWrap, AppTabBar } from '/@/components';
import { getHomeData } from '/@/service/Home';
import {
  getRecommendPostPage,
  getMarketingPostPage,
  getMarketingPostCategoryList,
  type AppMarketingPostPageReqVO,
  type AppMarketingCategoryRespVO
} from '/@/service/MarketingPost';
import CommunityPostCard from './CommunityPostCard.vue';
import {
  mapPostToDisplay,
  mergePostsUnique,
  type CommunityPostItem
} from './communityPostDisplay';
import { useI18n } from '/@/hooks/web/useI18n';
import { useMessage } from '/@/hooks/web/useMessage';
import { isApiSuccess } from '/@/utils/apiResult';

const router = useRouter();
const UserStore = useUserStoreWithOut();
const { t } = useI18n();
const { CreateErrorToast } = useMessage();

const RECOMMEND_TAB = 'rec';
const CATEGORY_TAB_PREFIX = 'cat-';
const PAGE_SIZE = 10;
const lineWidthPx = 18;

type CommunityTabName = '' | typeof RECOMMEND_TAB | `${typeof CATEGORY_TAB_PREFIX}${number}`;

const activeTab = ref<CommunityTabName>('');
const categories = ref<AppMarketingCategoryRespVO[]>([]);
const categoryTabsReady = ref(false);
const feedPageNo = ref(1);
const feedLoading = ref(false);
const feedFinished = ref(false);
const feedRefreshing = ref(false);
const posts = ref<CommunityPostItem[]>([]);
const bannerList = ref<{ imageUrl?: string }[]>([]);

const getCategoryTabName = (id: number): CommunityTabName => `${CATEGORY_TAB_PREFIX}${id}`;

const parseCategoryIdFromTab = (tab: CommunityTabName): number | null => {
  if (!tab || tab === RECOMMEND_TAB) return null;
  return Number(tab.slice(CATEGORY_TAB_PREFIX.length));
};

const isRecommendTab = computed(() => activeTab.value === RECOMMEND_TAB);

/** 与「我的」页一致：头像来自用户信息，无则默认图 */
const userAvatarSrc = computed(() => {
  const userInfo = UserStore.getUserInfo as { avatar?: string } | null | undefined;
  return userInfo?.avatar || Avatar;
});

const fetchPostPage = async (reset: boolean, skipListLoading = false) => {
  if (!activeTab.value) {
    feedLoading.value = false;
    return;
  }
  if (!reset && feedFinished.value) {
    feedLoading.value = false;
    return;
  }
  if (reset) {
    feedPageNo.value = 1;
    posts.value = [];
    feedFinished.value = false;
  }
  if (!skipListLoading) {
    feedLoading.value = true;
  }

  const categoryId = parseCategoryIdFromTab(activeTab.value);
  const pageQuery: AppMarketingPostPageReqVO = {
    pageNo: feedPageNo.value,
    pageSize: PAGE_SIZE,
    ...(categoryId != null ? { categoryId } : {})
  };
  try {
    const res = isRecommendTab.value
      ? await getRecommendPostPage(pageQuery)
      : await getMarketingPostPage(pageQuery);
    if (!isApiSuccess(res)) {
      feedFinished.value = true;
      if (res?.msg) CreateErrorToast(res.msg);
      return;
    }
    const list = res.data.list ?? [];
    const total = Number(res.data.total) || 0;
    const mapped = list.map(mapPostToDisplay);
    posts.value = mergePostsUnique(posts.value, mapped, reset);
    const noMore =
      list.length === 0 || list.length < PAGE_SIZE || (total > 0 && posts.value.length >= total);
    feedFinished.value = noMore;
    if (!noMore) {
      feedPageNo.value += 1;
    }
  } catch {
    feedFinished.value = true;
    CreateErrorToast(t('apiRequestFailed'));
  } finally {
    if (!skipListLoading) {
      feedLoading.value = false;
    }
  }
};

const onFeedLoad = () => {
  void fetchPostPage(false);
};

const onFeedRefresh = async () => {
  feedRefreshing.value = true;
  try {
    // 下拉刷新只显示 PullRefresh，不再让 List 显示 loading，避免两个加载动画叠在一起
    await fetchPostPage(true, true);
  } finally {
    feedRefreshing.value = false;
  }
};

watch(activeTab, () => {
  if (!categoryTabsReady.value || !activeTab.value) return;
  void fetchPostPage(true);
});

const goDetail = (post: CommunityPostItem) => {
  router.push({ name: 'PostDetail', query: { id: String(post.id) } });
};

const getCommunityTabQuery = (): Record<string, string> => {
  const categoryId = parseCategoryIdFromTab(activeTab.value);
  if (categoryId == null) {
    return { publishTarget: 'share' };
  }

  const category = categories.value.find((c) => c.id === categoryId);
  const categoryName = category?.categoryName.trim() ?? '';
  const query: Record<string, string> = {
    categoryId: String(categoryId),
    publishTarget: categoryName.includes('线下') ? 'offline' : 'share'
  };
  if (categoryName) {
    query.categoryName = encodeURIComponent(categoryName);
  }
  return query;
};

const goPublish = () => {
  const categoryId = parseCategoryIdFromTab(activeTab.value);
  if (categoryId == null) {
    router.push({ name: 'PublishPost' });
    return;
  }
  router.push({ name: 'PublishPost', query: getCommunityTabQuery() });
};

const goMyCommunity = () => {
  const query: Record<string, string> = { ...getCommunityTabQuery() };
  if (categories.value.length > 0) {
    try {
      query.categories = encodeURIComponent(JSON.stringify(categories.value));
    } catch {
      // 与原先一致：序列化失败仍跳转，仅不带 categories
    }
  }
  router.push({ name: 'MyCommunity', query });
};

const onReport = (post: CommunityPostItem) => {
  router.push({ name: 'Report', query: { id: String(post.id) } });
};

const loadBanners = () => {
  getHomeData().then((res) => {
    if (!isApiSuccess(res)) return;
    const modules = res.data.modules as { moduleType?: string; data?: { imageUrl?: string }[] }[] | undefined;
    if (!modules?.length) return;
    modules.forEach((m) => {
      if (m.moduleType === 'banner') {
        bannerList.value = m.data ?? [];
      }
    });
  });
};

const normalizeCategories = (list: AppMarketingCategoryRespVO[]): AppMarketingCategoryRespVO[] => {
  return list
    .map((item) => ({
      id: Number(item.id),
      categoryName: item.categoryName.trim()
    }))
    .filter((item) => item.id > 0 && item.categoryName.length > 0);
};

const setInitialActiveTab = () => {
  activeTab.value = categories.value[0] ? getCategoryTabName(categories.value[0].id) : RECOMMEND_TAB;
};

const loadCategoryTabs = async () => {
  let nextCategories: AppMarketingCategoryRespVO[] = [];
  try {
    const res = await getMarketingPostCategoryList();
    if (isApiSuccess(res)) {
      nextCategories = normalizeCategories(res.data);
    }
  } catch {
    nextCategories = [];
  } finally {
    categories.value = nextCategories;
    categoryTabsReady.value = true;
    setInitialActiveTab();
  }
};

onBeforeMount(() => {
  UserStore.fetchUserInfo();
  loadBanners();
  UserStore.setActiveTab(1);
  void loadCategoryTabs();
});
</script>

<style scoped lang="less">
@bg-page: #060b1e;
@blue-accent: #4db3ff;

.community-page-shell {
  min-height: 100vh;
  background: @bg-page;
}

.community-page__navbar {
  :deep(.van-nav-bar) {
    background: @bg-page;
  }

  :deep(.van-nav-bar__title) {
    font-size: 0.36rem;
    font-weight: 700;
    color: #fff;
  }

  :deep(.van-nav-bar__right) {
    padding-right: 0.32rem;
  }
}

:deep(.van-nav-bar__left) {
  padding-left: 0.32rem;
}

.community-page__nav-avatar {
  flex-shrink: 0;
  width: 0.6rem;
  height: 0.6rem;
  box-sizing: border-box;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.42);
  background: rgba(5, 12, 35, 0.35);
}

.community-page__nav-avatar :deep(.van-image__img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.community-page__nav-publish {
  font-size: 0.28rem;
  color: @blue-accent;
  font-weight: 500;
}

.community-page {
  padding-bottom: calc(1rem + env(safe-area-inset-bottom));
  color: #fff;
  background: @bg-page;
}

.community-page__content {
  padding: 0 0.32rem;
}

.community-page__tabs {
  margin-bottom: 0.24rem;
}

.community-page__tabs :deep(.van-tabs__wrap) {
  height: 0.88rem;
}

.community-page__tabs :deep(.van-tabs__nav) {
  background: @bg-page;
  justify-content: flex-start;
}

.community-page__tabs :deep(.van-tab) {
  flex: none;
  padding: 0 0.28rem;
  color: rgba(255, 255, 255, 0.45);
  font-size: 0.3rem;
  font-weight: 400;
}

.community-page__tabs :deep(.van-tab:first-child) {
  padding-left: 0;
}

.community-page__tabs :deep(.van-tab--active) {
  color: #fff;
  font-weight: 700;
}

.community-page__tabs :deep(.van-tabs__line) {
  height: 0.06rem;
  border-radius: 0.03rem;
  background: @blue-accent;
  bottom: 0.2rem;
}

.community-page__pull {
  min-height: 40vh;
}

.community-page__pull--refreshing :deep(.van-list__loading) {
  display: none !important;
}

.community-page__pull :deep(.van-pull-refresh__track) {
  min-height: inherit;
}

.community-page__list :deep(.van-list__finished-text),
.community-page__list :deep(.van-list__loading) {
  color: rgba(255, 255, 255, 0.45);
}

.community-page__list :deep(.van-empty__description) {
  color: rgba(255, 255, 255, 0.45);
}

.community-page__feed {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
</style>
