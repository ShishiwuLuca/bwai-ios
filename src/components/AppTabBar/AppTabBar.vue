<template>
  <div class="app-tabbar">
    <Tabbar
      class="app-tabbar__van"
      v-model="activeTab"
      placeholder
      fixed
      :border="false"
      :safe-area-inset-bottom="false"
      @change="onTabChange"
    >
      <TabbarItem
        v-for="(tab, index) in tabs"
        :key="tab.name"
        :name="index"
        :to="tab.path"
        @click="onTabItemClick(index)"
      >
        <template #icon>
          <img :src="tabIcon(tab, index)" class="tab-icon" alt="" />
        </template>
        <span>{{ t(tab.label) }}</span>
      </TabbarItem>
    </Tabbar>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Tabbar, TabbarItem } from 'vant';
import { useI18n } from '/@/hooks/web/useI18n';
import { useUserStoreWithOut } from '/@/stores/modules/UserConfig';

defineOptions({ name: 'AppTabBar' });

/** tabs 数组下标：community(0) mine(1) */
const TAB_COMMUNITY = 0;
const TAB_MINE = 1;

const COMMUNITY_ROUTE_PREFIXES = [
  '/Community',
  '/MyCommunity',
  '/MyMessage',
  '/PublishPost',
  '/PostDetail',
  '/Report'
];

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const userStore = useUserStoreWithOut();

const activeTab = computed({
  get: () => userStore.getActiveTab,
  set: (v) => userStore.setActiveTab(v)
});

const img = (name: string) => new URL(`../../assets/tabbar/${name}.png`, import.meta.url).href;

const makeTab = (name: string, label: string, path: string, imgName = name) => ({
  name,
  label,
  path,
  icon: img(imgName),
  activeIcon: img(`${imgName}_active`)
});

const tabs = [
  makeTab('community', 'tabbar_community', '/Community'),
  makeTab('mine', 'tabbar_mine', '/Personal', 'user')
];

const tabIcon = (item: (typeof tabs)[number], index: number) =>
  activeTab.value === index ? item.activeIcon : item.icon;

const isCommunityRoute = (path: string) =>
  COMMUNITY_ROUTE_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));

const isMineRoute = (path: string) => path === '/Personal' || path.startsWith('/Personal/');

watch(
  () => route.path,
  (path) => {
    if (isMineRoute(path)) {
      userStore.setActiveTab(TAB_MINE);
    } else if (isCommunityRoute(path)) {
      userStore.setActiveTab(TAB_COMMUNITY);
    }
  },
  { immediate: true }
);

const onTabChange = (index: number) => {
  userStore.setActiveTab(index);
};

/** 当前路由是否属于该 Tab 对应页面 */
const isTabRoute = (tabPath: string, currentPath: string) =>
  currentPath === tabPath || currentPath.startsWith(`${tabPath}/`);

/** Tab 已高亮但路由不在对应页时，@change 不会触发，需在 click 里补一次跳转。 */
const onTabItemClick = (index: number) => {
  const tab = tabs[index];
  if (!tab?.path) return;
  if (activeTab.value === index && !isTabRoute(tab.path, route.path)) {
    router.push(tab.path);
  }
};
</script>

<style lang="less">
@blue: #1a37fd;
@inactive: #9096a8;
@tabbar-h: 0.88rem;
@tabbar-icon: 0.44rem;
@tabbar-text: 0.2rem;
@tabbar-gap: 0.04rem;
@tabbar-bottom: 0.16rem;
@tabbar-side: 0.32rem;
@tabbar-px: 0.08rem;
@tabbar-safe: max(0px, env(safe-area-inset-bottom, 0px), var(--safe-area-inset-bottom, 0px));
@tabbar-offset: calc(@tabbar-h + @tabbar-bottom + @tabbar-safe);
@tabbar-max-w: calc(100vw - (@tabbar-side * 2));

.app-tabbar {
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  box-sizing: border-box;
}

.tab-icon {
  display: block;
  width: @tabbar-icon;
  height: @tabbar-icon;
  object-fit: contain;
  flex-shrink: 0;
}

/* Vant placeholder 模式下 class 落在外层占位节点，内层才是 fixed 的 .van-tabbar */
.app-tabbar .van-tabbar__placeholder.app-tabbar__van,
.app-tabbar__van.van-tabbar__placeholder {
  width: 100% !important;
  max-width: 100% !important;
  height: @tabbar-offset !important;
  box-sizing: border-box;
  overflow: hidden;
  background: transparent;
}

.app-tabbar .van-tabbar,
.app-tabbar__van > .van-tabbar {
  --van-tabbar-height: @tabbar-h;
  --van-tabbar-item-text-color: @inactive;
  --van-tabbar-item-active-color: @blue;
  --van-tabbar-item-icon-size: @tabbar-icon;
  --van-tabbar-item-active-background: transparent;
  --van-tabbar-item-font-size: @tabbar-text;
  --van-tabbar-item-icon-margin-bottom: @tabbar-gap;
  --van-tabbar-item-line-height: 1;
  --van-tabbar-background: #fff;
  --van-tabbar-z-index: 100;

  position: fixed !important;
  left: @tabbar-side !important;
  right: @tabbar-side !important;
  width: auto !important;
  max-width: @tabbar-max-w !important;
  margin: 0 auto;
  bottom: calc(@tabbar-bottom + @tabbar-safe) !important;
  height: @tabbar-h !important;
  min-height: @tabbar-h;
  max-height: @tabbar-h;
  display: flex !important;
  align-items: center !important;
  padding: 0 @tabbar-px !important;
  padding-bottom: 0 !important;
  box-sizing: border-box !important;
  border-radius: 999px;
  border: 1px solid rgba(214, 224, 255, 0.95);
  box-shadow:
    0 0.06rem 0.28rem rgba(51, 102, 255, 0.14),
    0 0 0.2rem rgba(108, 169, 255, 0.1);
  background: #fff !important;
  background-image: none !important;
  overflow: visible;
  z-index: var(--van-tabbar-z-index);
}

.app-tabbar .van-tabbar-item {
  display: flex;
  flex-direction: column;
  flex: 1;
  flex-shrink: 1;
  min-width: 0;
  justify-content: center;
  align-items: center;
  align-self: stretch;
  height: 100%;
  min-height: 0;
  padding: 0 !important;
  color: @inactive;
  background: transparent !important;
  overflow: hidden;
  line-height: 1;
}

.app-tabbar .van-tabbar-item--active {
  color: @blue;
  background: transparent !important;
}

.app-tabbar .van-tabbar-item__text {
  font-size: @tabbar-text;
  font-weight: 500;
  line-height: 1.1;
  margin-top: 0;
  flex-shrink: 0;
  white-space: nowrap;
}

.app-tabbar .van-tabbar-item--active .van-tabbar-item__text {
  font-weight: 600;
  color: @blue;
}

.app-tabbar .van-tabbar-item__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: @tabbar-icon;
  height: @tabbar-icon;
  margin-bottom: @tabbar-gap !important;
  flex-shrink: 0;
  line-height: 0;

  img {
    display: block;
    width: @tabbar-icon;
    height: @tabbar-icon;
  }
}

html.cap-native .app-tabbar .van-tabbar,
html.cap-native .app-tabbar__van > .van-tabbar {
  left: @tabbar-side !important;
  right: @tabbar-side !important;
  width: auto !important;
  max-width: @tabbar-max-w !important;
  padding-bottom: 0 !important;
  bottom: calc(@tabbar-bottom + @tabbar-safe) !important;
}

html.cap-native .app-tabbar .van-tabbar-item {
  justify-content: center !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
}

html.cap-native .app-tabbar .van-tabbar__placeholder.app-tabbar__van,
html.cap-native .app-tabbar__van.van-tabbar__placeholder {
  width: 100% !important;
  max-width: 100% !important;
  overflow: hidden;
}

html[data-theme='dark'] .app-tabbar .van-tabbar,
html[data-theme='dark'] .app-tabbar__van > .van-tabbar {
  --van-tabbar-background: #fff;
  background: #fff !important;
  background-image: none !important;
}
</style>
