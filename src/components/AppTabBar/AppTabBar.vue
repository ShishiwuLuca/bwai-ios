<template>
  <Tabbar
    teleport=".van-config-provider"
    v-model="ActiveTab"
    placeholder
    safe-area-inset-bottom
    fixed
    :border="false"
    @change="onChange"
  >
    <TabbarItem
      v-for="(item, index) in TabBar"
      :key="index"
      :name="index"
      :icon="ActiveTab === index ? item.activeIcon : item.icon"
      :to="item.path"
    >
      {{ t(item.label) }}
    </TabbarItem>
  </Tabbar>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue';
  import { Tabbar, TabbarItem } from 'vant';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useUserStoreWithOut } from '/@/stores/modules/UserConfig';

  /** 从 useI18n 解构的文案与能力 */
  const { t } = useI18n();

  /** 用户：UserStore */
  const UserStore = useUserStoreWithOut();

  defineOptions({ name: 'AppTabBar' });

  // 获取底部TabBar当前选中项（可写 computed，供 v-model 双向绑定）

  /** 计算属性：当前选中项 */
  const ActiveTab = computed({
    get: () => UserStore.getActiveTab,
    set: (value: number) => UserStore.setActiveTab(value)
  });

  // 引入图片

  /** Tab 状态：getTabBarIcon */
  const getTabBarIcon = (name: string) => {
    return new URL(`../../assets/tabbar/${name}.png`, import.meta.url).href;
  };

  // 当前选中的 tab 名称、tab 配置项（名称/文案/图标）

  /** 响应式状态：Tab 状态 */
  const TabBar = ref<
    { name: string; label: string; path: string; icon: string; activeIcon: string }[]
  >([
    {
      name: 'community',
      label: 'tabbar_community',
      path: '/',
      icon: getTabBarIcon('community'),
      activeIcon: getTabBarIcon('community_active')
    },
    {
      name: 'mine',
      label: 'tabbar_mine',
      path: '/Personal',
      icon: getTabBarIcon('user'),
      activeIcon: getTabBarIcon('user_active')
    }
  ]);

  // 用户切换 tab 时，将选中项名称通过 emit 回传

  /** 事件或回调处理：onChange */
  const onChange = (name: number): void => {
    // 保存选中项到store
    UserStore.setActiveTab(name);
  };
</script>

<style scoped lang="less">
  :deep(.van-icon__image) {
    width: 0.5rem;
    height: 0.5rem;
  }

  :deep(.van-tabbar) {
    border-radius: 0.2rem 0.2rem 0 0;
    overflow: hidden;
  }
</style>
