<template>
  <div class="my-community-shell">
    <NavBar
      :title="t('mc_nav_title')"
      fixed
      placeholder
      :border="false"
      class="my-community-page__navbar"
    >
      <template #right>
        <Icon name="chat-o" :size="28" @click="$router.push('/MyMessage')" />
      </template>
    </NavBar>

    <PageWrap class="my-community-page">
      <!-- 第一行：分享 / 线下 — Tab 必须用 name 与 mainTab 一致，底部才有指示条 -->
      <!-- ellipsis 勿关：关后 nav 变 scrollable，指示条 translate 易与文字错位 -->
      <Tabs
        :key="'main-' + mainTabsKey"
        v-model:active="mainTab"
        class="my-community-page__tabs my-community-page__tabs--main"
        color="#4db3ff"
        :animated="iosNativeTabsAnimated()"
        @click-tab="onTabClickReload"
      >
        <Tab
          v-for="c in mainCategoryTabs"
          :key="c.id"
          :title="c.categoryName"
          :name="String(c.id)"
        />
      </Tabs>

      <!-- 第二行：全部 / 审核中 / 已通过 / 已拒绝 — 下划线位置由 Vant 按 Tab 区域测量，格内文字需居中才与线对齐 -->
      <Tabs
        v-model:active="statusTab"
        class="my-community-page__tabs my-community-page__tabs--status"
        color="#4db3ff"
        :animated="iosNativeTabsAnimated()"
        @click-tab="onTabClickReload"
      >
        <Tab :title="t('mc_status_all')" name="all" />
        <Tab :title="t('mc_status_pending')" name="pending" />
        <Tab :title="t('mc_tab_passed')" name="passed" />
        <Tab :title="t('mc_tab_rejected')" name="rejected" />
      </Tabs>

      <div class="my-community-page__body">
        <PullRefresh
          v-model="feedRefreshing"
          class="my-community-page__pull"
          :class="{ 'my-community-page__pull--refreshing': feedRefreshing }"
          @refresh="onRefresh"
        >
          <List
            v-model:loading="feedLoading"
            :finished="feedFinished"
            :immediate-check="true"
            :loading-text="feedRefreshing ? ' ' : undefined"
            :finished-text="t('no_more')"
            class="my-community-page__list"
            @load="onLoad"
          >
            <div class="my-community-page__feed">
              <CommunityPostSwipeRow
                v-for="post in posts"
                :key="post.id"
                class="my-community-page__row"
                :post="post"
                @open-detail="goDetail(post)"
                @delete="onDeletePost(post)"
              />
            </div>
            <Empty
              v-if="posts.length === 0 && feedFinished && !feedLoading"
              image="search"
              :description="t('sd_no_data')"
            />
          </List>
        </PullRefresh>
      </div>
    </PageWrap>
  </div>
</template>

<script setup lang="ts">
  import { ref, watch, computed } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { NavBar, PageWrap } from '/@/components';
  import { Tabs, Tab, Icon, PullRefresh, List, Empty } from 'vant';
  import {
    deleteMarketingPost,
    getMyPostPage,

    /** AppMarketingPostPageReqVO：类型别名 */
    type AppMarketingPostPageReqVO,

    /** AppMarketingCategoryRespVO：类型别名 */
    type AppMarketingCategoryRespVO
  } from '/@/service/MarketingPost';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { isApiSuccess } from '/@/utils/apiResult';
  import { notifyApiRequestFailed } from '/@/utils/apiErrorNotify';
  import { iosNativeTabsAnimated } from '/@/utils/iosUiAnimations';
  import CommunityPostSwipeRow from './CommunityPostSwipeRow.vue';
  import {
    mapPostToDisplay,
    mergePostsUnique,

    /** CommunityPostItem：类型别名 */
    type CommunityPostItem
  } from './communityPostDisplay';

  /** 当前路由：读取 query、params、meta 等 */
  const route = useRoute();

  /** 路由实例：编程式导航 */
  const router = useRouter();

  /** 从 useI18n 解构的文案与能力 */
  const { t } = useI18n();

  /** 从 useMessage 解构的 Toast / Dialog 能力 */
  const { CreateErrorToast, CreateSuccessToast, CreateConfirmDialog } = useMessage();

  // —— Tab：第一行类目（分享/线下）+ 第二行审核状态；列表分页与代次丢弃 ——

  /** 与 Tab 的 name（类目 id 字符串）一致 */
  const mainTab = ref<string>('1');

  /** 响应式状态：Tab 状态 */
  const statusTab = ref<'all' | 'pending' | 'passed' | 'rejected'>('all');

  /** 响应式状态：marketingCategories 相关 UI 或数据 */
  const marketingCategories = ref<AppMarketingCategoryRespVO[]>([]);

  /** Tab 状态：isOfflineCategoryTab */
  const isOfflineCategoryTab = (c: { id: number; categoryName: string }): boolean => {
    /** n */
    const n = c.categoryName;
    return c.id === 2 || n.includes('线下') || /offline/i.test(n);
  };

  /** Tab 状态：mainCategoryTabs */
  const mainCategoryTabs = computed<AppMarketingCategoryRespVO[]>(() => {
    if (marketingCategories.value.length) return marketingCategories.value;
    return [
      { id: 1, categoryName: t('mc_cat_share') },
      { id: 2, categoryName: t('mc_cat_offline') }
    ];
  });

  /** Tabs 子项变化后强制重挂载，便于 Vant 重新测量 offset 对齐指示条 */
  const mainTabsKey = computed(() => mainCategoryTabs.value.map((c) => c.id).join('-'));

  /** 响应式状态：categoryId 相关 UI 或数据 */
  const categoryId = ref<number | null>(null);

  /** 响应式状态：categoryName 相关 UI 或数据 */
  const categoryName = ref('');

  /** PAGE_SIZE */
  const PAGE_SIZE = 10;

  /** 响应式状态：分页 */
  const feedPageNo = ref(1);

  /** 响应式状态：加载中状态 */
  const feedLoading = ref(false);

  /** 响应式状态：列表是否已全部加载 */
  const feedFinished = ref(false);

  /** 响应式状态：下拉刷新 */
  const feedRefreshing = ref(false);

  /** 响应式状态：posts 相关 UI 或数据 */
  const posts = ref<CommunityPostItem[]>([]);

  /** 仅整表重置（Tab/路由/下拉）时递增，用于丢弃重置前的上拉请求 */
  const listFetchGeneration = ref(0);

  /** 上拉追加同一时间只允许一个在途，避免与 List 的 loading 叠加导致重复页、死循环 */
  const listAppendInFlight = ref(false);

  /** parseCategoriesQuery */
  const parseCategoriesQuery = (raw: unknown): AppMarketingCategoryRespVO[] => {
    if (typeof raw !== 'string' || !raw) return [];
    try {
      const parsed = JSON.parse(decodeURIComponent(raw));
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((x: unknown) => x != null && typeof x === 'object')
        .map((x: any) => ({
          id: Number(x.id),
          categoryName: String(x.categoryName ?? '').trim()
        }))
        .filter((x) => x.id > 0 && x.categoryName);
    } catch {
      return [];
    }
  };

  /** 当前路由：syncMainTabFromRoute */
  const syncMainTabFromRoute = () => {
    /** q */
    const q = route.query;

    /** cats */
    const cats = mainCategoryTabs.value;

    /** rawId */
    const rawId = q.categoryId;
    if (rawId != null && rawId !== '') {
      const id = Number(Array.isArray(rawId) ? rawId[0] : rawId);
      if (Number.isFinite(id) && id > 0 && cats.some((c) => c.id === id)) {
        mainTab.value = String(id);
        return;
      }
    }

    /** pt */
    const pt = q.publishTarget;
    if (pt === 'offline') {
      const off = cats.find((x) => isOfflineCategoryTab(x));
      mainTab.value = String(off?.id ?? cats[cats.length - 1]?.id ?? 2);
    } else {
      const sh = cats.find((x) => !isOfflineCategoryTab(x));
      mainTab.value = String(sh?.id ?? cats[0]?.id ?? 1);
    }
  };

  /** applyRouteQuery */
  const applyRouteQuery = () => {
    /** q */
    const q = route.query;
    marketingCategories.value = parseCategoriesQuery(q.categories);

    /** rawId */
    const rawId = q.categoryId;
    if (rawId == null || rawId === '') {
      categoryId.value = null;
      categoryName.value = '';
    } else {
      const id = Number(Array.isArray(rawId) ? rawId[0] : rawId);
      categoryId.value = Number.isFinite(id) && id > 0 ? id : null;
      const rawName = q.categoryName;
      let name = '';
      if (typeof rawName === 'string' && rawName) {
        try {
          name = decodeURIComponent(rawName);
        } catch {
          name = rawName;
        }
      } else if (Array.isArray(rawName) && rawName[0]) {
        try {
          name = decodeURIComponent(String(rawName[0]));
        } catch {
          name = String(rawName[0]);
        }
      }
      categoryName.value = name;
    }
    syncMainTabFromRoute();

    /** 当前选中项：active */
    const active = mainCategoryTabs.value.find((c) => String(c.id) === mainTab.value);
    if (active) {
      categoryId.value = active.id;
      categoryName.value = active.categoryName;
    }
  };

  /** 首次仅同步 query，列表交给 List onLoad，避免与路由改 mainTab 重复请求 */
  let routeQueryHydrated = false;

  /** 侦听依赖变化并触发副作用 */
  watch(
    () => ({ ...route.query }),
    () => {
      applyRouteQuery();
      if (routeQueryHydrated) {
        void fetchMyList(true);
      } else {
        routeQueryHydrated = true;
      }
    },
    { immediate: true }
  );

  /** 侦听依赖变化并触发副作用 */
  watch(mainTab, (name) => {
    /** c */
    const c = mainCategoryTabs.value.find((x) => String(x.id) === String(name));
    if (c) {
      categoryId.value = c.id;
      categoryName.value = c.categoryName;
    }
  });

  /** Tab 状态：statusTabToApiStatus */
  const statusTabToApiStatus = (tab: Exclude<typeof statusTab.value, 'all'>): number => {
    if (tab === 'pending') return 1;
    if (tab === 'passed') return 2;
    return 3;
  };

  /** buildListParams */
  const buildListParams = (): AppMarketingPostPageReqVO => {
    /** cid */
    const cid = Number(mainTab.value);

    /** 常量或静态配置：base */
    const base: AppMarketingPostPageReqVO = {
      pageNo: feedPageNo.value,
      pageSize: PAGE_SIZE,
      categoryId: Number.isFinite(cid) && cid > 0 ? cid : undefined
    };
    if (statusTab.value !== 'all') {
      base.status = statusTabToApiStatus(statusTab.value);
    }
    return base;
  };

  /** 列表数据（fetchMyList） */
  const fetchMyList = async (reset: boolean, skipListLoading = false) => {
    if (!reset && feedFinished.value) {
      if (!skipListLoading) feedLoading.value = false;
      return;
    }
    if (reset) {
      listFetchGeneration.value += 1;
      listAppendInFlight.value = false;
      feedPageNo.value = 1;
      posts.value = [];
      feedFinished.value = false;
    } else if (listAppendInFlight.value) {
      // 已有在途追加请求；本次被 List 再次触发时必须关掉 loading，否则会一直转圈
      if (!skipListLoading) feedLoading.value = false;
      return;
    }

    /** myGeneration */
    const myGeneration = listFetchGeneration.value;
    if (!reset) listAppendInFlight.value = true;
    if (!skipListLoading) feedLoading.value = true;
    try {
      const res = await getMyPostPage(buildListParams());
      if (myGeneration !== listFetchGeneration.value) return;
      if (!isApiSuccess(res)) {
        feedFinished.value = true;
        if (res?.msg) CreateErrorToast(res.msg);
        return;
      }
      const list = res.data.list ?? [];
      const total = Number(res.data.total) || 0;
      const mapped = list.map(mapPostToDisplay);
      const prevLen = posts.value.length;
      posts.value = mergePostsUnique(posts.value, mapped, reset);
      const added = posts.value.length - prevLen;
      const noMore =
        list.length === 0 ||
        list.length < PAGE_SIZE ||
        (total > 0 && posts.value.length >= total) ||
        (!reset && mapped.length > 0 && added === 0);
      feedFinished.value = noMore;
      if (!noMore) feedPageNo.value += 1;
    } catch (e: unknown) {
      feedFinished.value = true;
      notifyApiRequestFailed(e);
    } finally {
      // 仅当前代次的请求能收尾，避免「后返回的旧请求」在整表重置后误关 loading
      if (myGeneration === listFetchGeneration.value) {
        if (!reset) listAppendInFlight.value = false;
        if (!skipListLoading) feedLoading.value = false;
      }
    }
  };

  /** 拉取接口数据：onLoad */
  const onLoad = () => {
    // List 触发 load 时会把 v-model:loading 置为 true；若这里直接 return，必须手动关掉，否则会一直加载中
    if (feedFinished.value || feedRefreshing.value) {
      feedLoading.value = false;
      return;
    }
    void fetchMyList(false);
  };

  /** 下拉刷新（onRefresh） */
  const onRefresh = async () => {
    feedRefreshing.value = true;
    try {
      await fetchMyList(true, true);
    } finally {
      feedRefreshing.value = false;
    }
  };

  /** 页面跳转：goDetail */
  const goDetail = (post: CommunityPostItem) => {
    router.push({ name: 'PostDetail', query: { id: String(post.id) } });
  };

  /** 事件或回调处理（onDeletePost） */
  const onDeletePost = async (post: CommunityPostItem) => {
    /** id */
    const id = post.id;
    if (!id) return;
    try {
      await CreateConfirmDialog({
        title: t('dt_dialog_title'),
        message: t('mc_delete_post_confirm'),
        confirmButtonText: t('pd_comment_delete'),
        cancelButtonText: t('cancel')
      });
    } catch {
      return;
    }
    try {
      const res = await deleteMarketingPost({ id });
      if (isApiSuccess(res) && res.data === true) {
        posts.value = posts.value.filter((p) => p.id !== id);
        CreateSuccessToast(t('pd_comment_delete_success'));
      } else {
        CreateErrorToast(res?.msg || t('pd_comment_delete_fail'));
      }
    } catch {
      CreateErrorToast(t('cm_network_error'));
    }
  };

  /** Tab 状态：onTabClickReload */
  const onTabClickReload = () => {
    void fetchMyList(true);
  };
</script>

<style scoped lang="less">
  /* 双行 Tab + 列表（左滑删帖） */

  @bg-page: #060b19;
  @blue-active: #4db3ff;
  @text-muted: #828282;

  .my-community-shell {
    min-height: 100vh;
    background: @bg-page;
  }

  .my-community-page__navbar {
    :deep(.van-nav-bar) {
      background: @bg-page;
    }

    :deep(.van-nav-bar__title) {
      font-size: 0.36rem;
      font-weight: 700;
      color: #fff;
    }

    :deep(.van-nav-bar .van-icon) {
      color: #fff;
    }

    :deep(.van-nav-bar__right) {
      padding-right: 0.32rem;
    }
  }

  .my-community-page {
    padding: 0 0.2rem 0.4rem;
    box-sizing: border-box;
    background: @bg-page;
    color: rgba(255, 255, 255, 0.92);
  }

  /* 两行 Tab：选中天蓝 + 底部短圆角胶囊指示条（设计图） */
  .my-community-page__tabs {
    margin-bottom: 0;

    :deep(.van-tabs__wrap) {
      height: 0.88rem;
    }

    :deep(.van-tabs__nav) {
      background: @bg-page;
    }

    :deep(.van-tab) {
      color: @text-muted;
      font-size: 0.3rem;
      font-weight: 400;
    }

    :deep(.van-tab--active) {
      color: @blue-active;
      font-weight: 600;
    }

    /* 不覆盖 line 的 width/height/transform/bottom，交给 Vant 默认测量 */
    :deep(.van-tabs__line) {
      border-radius: 999px;
    }
  }

  /*
 * 第一行与第二行按同一「四列栅格」对齐：
 * 分享 = 第 1 列(25%)，线下 = 第 2 列(25%)，与下面「全部 / 审核中 / …」列宽一致。
 */
  @tab-col-pct: 25%;

  .my-community-page__tabs--main {
    margin-top: 0.08rem;

    :deep(.van-tabs__nav) {
      width: 100%;
      justify-content: flex-start;
    }

    :deep(.van-tab) {
      flex: 0 0 @tab-col-pct;
      max-width: @tab-col-pct;
      box-sizing: border-box;
      padding: 0 0.04rem;
      /* 与指示条同轴：Vant 按 Tab 盒子居中画线，格内标题需居中 */
      justify-content: center;
    }
  }

  /* 第二行：四等分，与上行列宽一致 */
  .my-community-page__tabs--status {
    margin-top: 0;

    :deep(.van-tabs__nav) {
      width: 100%;
      justify-content: flex-start;
    }

    :deep(.van-tab) {
      flex: 0 0 @tab-col-pct;
      max-width: @tab-col-pct;
      min-width: 0;
      box-sizing: border-box;
      padding: 0 0.04rem;
      justify-content: center;
    }
  }

  .my-community-page__body {
    min-height: 50vh;
    padding-top: 0.24rem;
  }

  .my-community-page__pull {
    min-height: 40vh;
  }

  .my-community-page__pull--refreshing :deep(.van-list__loading) {
    display: none !important;
  }

  .my-community-page__pull :deep(.van-pull-refresh__track) {
    min-height: inherit;
  }

  .my-community-page__list :deep(.van-list__finished-text),
  .my-community-page__list :deep(.van-list__loading) {
    color: rgba(255, 255, 255, 0.45);
  }

  .my-community-page__list :deep(.van-empty__description) {
    color: rgba(255, 255, 255, 0.45);
  }

  .my-community-page__feed {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .my-community-page__row {
    border-radius: 0.2rem;
    overflow: hidden;
  }
</style>
