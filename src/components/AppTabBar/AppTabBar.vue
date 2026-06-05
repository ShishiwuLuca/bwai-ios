<template>
  <div class="app-tabbar">
    <Tabbar
      teleport=".van-config-provider"
      v-model="activeTab"
      placeholder
      safe-area-inset-bottom
      fixed
      :border="false"
      @change="onTabChange"
    >
      <TabbarItem
        v-for="(tab, index) in tabs"
        :key="tab.name"
        :name="index"
        :to="tab.path"
      >
        <template #icon>
          <img :src="tabIcon(tab, index)" class="tab-icon" />
        </template>
        {{ t(tab.label) }}
      </TabbarItem>
    </Tabbar>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Tabbar, TabbarItem } from 'vant';
import { useI18n } from '/@/hooks/web/useI18n';
import { useUserStoreWithOut } from '/@/stores/modules/UserConfig';

defineOptions({ name: 'AppTabBar' });

/** tabs 数组下标：community(0) mine(1) */
const { t } = useI18n();
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

const onTabChange = (index: number) => {
  userStore.setActiveTab(index);
};
</script>

<style scoped lang="less">
.tab-icon {
  width: 0.5rem;
  height: 0.5rem;
}

:deep(.van-icon__image) {
  width: 0.5rem;
  height: 0.5rem;
}

:deep(.van-tabbar) {
  border-radius: 0.2rem 0.2rem 0 0;
  overflow: hidden;
}
</style>
