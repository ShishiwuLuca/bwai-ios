<template>
  <div class="app-tabbar">
    <!-- 底部 Tab：teleport 到 van-config-provider，与页面同宽居中 -->
    <Tabbar teleport=".van-config-provider" v-model="activeTab" placeholder safe-area-inset-bottom fixed :border="false"
      @change="onTabChange">
      <TabbarItem v-for="(tab, index) in tabs" :key="tab.name" :name="index"
        :to="tab.name === 'ai' ? undefined : tab.path">
        <template #icon>
          <!-- AI 弹窗打开时显示 X，用于关闭 -->
          <Icon v-if="tab.name === 'ai' && showAiMenu" name="cross" :size="28" color="#1989fa" />
          <img v-else :src="tabIcon(tab, index)" class="tab-icon" />
        </template>
        {{ t(tab.label) }}
      </TabbarItem>
    </Tabbar>
  
    <!-- AI 多入口选择：挂到 body，避免被页面 overflow 裁剪 -->
    <Teleport to="body">
      <Transition name="ai-fade">
        <div v-if="showAiMenu" class="ai-popup">
          <div class="ai-mask" @click="closeAiMenu"></div>
          <div class="ai-panel">
            <button v-for="(item, index) in aiItems" :key="item.page" type="button" class="ai-panel__item"
              @click="goPage(item.page)">
              <span class="ai-panel__icon" :class="`ai-panel__icon--${index % 2}`">
                <Icon :name="index === 0 ? 'setting-o' : 'chart-trending-o'" :size="22" color="#fff" />
              </span>
              <span class="ai-panel__text">
                <span class="ai-panel__title">{{ item.desc }}</span>
              </span>
              <Icon name="arrow-down" class="ai-panel__arrow" color="rgba(255,255,255,0.35)" />
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { Tabbar, TabbarItem, Icon } from 'vant';
import { useI18n } from '/@/hooks/web/useI18n';
import { useUserStoreWithOut } from '/@/stores/modules/UserConfig';
import { getAIPageConfig, type AIPageConfigItem } from '/@/service/Home';
import { isApiSuccess } from '/@/utils/apiResult';

defineOptions({ name: 'AppTabBar' });

/** tabs 数组下标：home(0) community(1) ai(2) team(3) mine(4) */
const AI_TAB = 2;
/** 接口无配置时的默认 AI 页 */
const AI_DEFAULT = '/AIInvest';

const { t } = useI18n();
const router = useRouter();
const userStore = useUserStoreWithOut();

/** AI 入口弹窗显隐 */
const showAiMenu = ref(false);
/** 接口返回的可选 AI 页面：{ page, desc } */
const aiItems = ref<AIPageConfigItem[]>([]);
/** 记录点击 AI 前的 Tab，AI 本身不作为「当前页」高亮 */
const prevTab = ref(userStore.getActiveTab === AI_TAB ? 0 : userStore.getActiveTab);

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
  makeTab('home', 'tabbar_home', '/'),
  makeTab('community', 'tabbar_community', '/Community'),
  makeTab('ai', 'tabbar_ai', AI_DEFAULT),
  makeTab('team', 'tabbar_team', '/Team'),
  makeTab('mine', 'tabbar_mine', '/Personal', 'user')
];

const tabIcon = (item: (typeof tabs)[number], index: number) =>
  activeTab.value === index ? item.activeIcon : item.icon;

/** 拉取 AI 入口配置：items 长度 >1 弹窗选择，=1 直接跳转 */
onMounted(async () => {
  const res = await getAIPageConfig().catch(() => null);
  if (isApiSuccess(res)) {
    aiItems.value = (res.data.items ?? []).filter((x) => x.page);
  }
});

/** 弹窗打开时给 html 加类，把 TabBar 提到遮罩层之上（TabBar 被 teleport 走了） */
watch(showAiMenu, (open) => {
  document.documentElement.classList.toggle('ai-menu-open', open);
});

onUnmounted(() => {
  document.documentElement.classList.remove('ai-menu-open');
});

/** AI 是动作入口不是页面，选中态始终回到 prevTab */
const keepPrevTab = () => userStore.setActiveTab(prevTab.value);

const closeAiMenu = () => {
  showAiMenu.value = false;
  keepPrevTab();
};

const goPage = (path: string) => {
  closeAiMenu();
  router.push(path);
};

/** 点击中间 AI Tab 的逻辑 */
const onAiTab = () => {
  keepPrevTab();

  if (showAiMenu.value) {
    closeAiMenu();
    return;
  }

  if (aiItems.value.length > 1) {
    showAiMenu.value = true;
    return;
  }

  goPage(aiItems.value[0]?.page || AI_DEFAULT);
};

const onTabChange = (index: number) => {
  if (index === AI_TAB) return onAiTab();
  showAiMenu.value = false;
  prevTab.value = index;
  userStore.setActiveTab(index);
};
</script>

<style scoped lang="less">
/** TabBar 高度 + 安全区，用于面板定位在 TabBar 上方 */
@above-tabbar: calc(1.28rem + env(safe-area-inset-bottom));
@item-bg: linear-gradient(90deg, rgba(9, 31, 74, 0.95) 0%, rgba(10, 15, 41, 0.95) 100%);

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

/* 层级：遮罩 1000 < TabBar 1001 < 面板 1002（TabBar 的 z-index 见下方全局样式） */
.ai-popup {
  position: fixed;
  inset: 0;
  z-index: 1000;
  pointer-events: none;
}

.ai-mask {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(5, 9, 23, 0.72);
  backdrop-filter: blur(4px);
  pointer-events: auto;
}

.ai-panel {
  position: fixed;
  left: 50%;
  bottom: calc(@above-tabbar + 0.24rem);
  z-index: 1002;
  width: 7.4rem;
  padding: 0.24rem;
  transform: translateX(-50%);
  border-radius: 0.28rem;
  box-shadow:
    0 0.16rem 0.48rem rgba(0, 0, 0, 0.45),
    0 0 0.24rem rgba(30, 94, 255, 0.12);
  pointer-events: auto;
  box-sizing: border-box;
}

.ai-panel__item {
  display: flex;
  align-items: center;
  gap: 0.24rem;
  width: 100%;
  padding: 0.28rem 0.24rem;
  border: 1px solid rgba(63, 114, 177, 0.35);
  border-radius: 0.2rem;
  background: @item-bg;
  color: #fff;
  cursor: pointer;
  box-sizing: border-box;
  transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;

  &+& {
    margin-top: 0.16rem;
  }

  &:active {
    transform: scale(0.98);
    border-color: rgba(77, 179, 255, 0.55);
    box-shadow: 0 0 0.16rem rgba(77, 179, 255, 0.2);
  }
}

.ai-panel__icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 0.72rem;
  height: 0.72rem;
  border-radius: 0.18rem;

  &--0 {
    background: linear-gradient(135deg, #2563eb 0%, #4db3ff 100%);
    box-shadow: 0 0.06rem 0.16rem rgba(37, 99, 235, 0.45);
  }

  &--1 {
    background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%);
    box-shadow: 0 0.06rem 0.16rem rgba(124, 58, 237, 0.4);
  }
}

.ai-panel__text {
  flex: 1;
  min-width: 0;
  text-align: left;
}

.ai-panel__title {
  font-size: 0.3rem;
  font-weight: 600;
  line-height: 1.35;
  letter-spacing: 0.02em;
}

.ai-panel__arrow {
  flex-shrink: 0;
  font-size: 0.28rem;
  transform: rotate(-90deg);
}

.ai-fade-enter-active,
.ai-fade-leave-active {
  transition: opacity 0.22s ease;

  .ai-panel {
    transition: transform 0.22s ease, opacity 0.22s ease;
  }
}

.ai-fade-enter-from,
.ai-fade-leave-to {
  opacity: 0;

  .ai-panel {
    opacity: 0;
    transform: translateX(-50%) translateY(0.2rem);
  }
}
</style>

<style lang="less">
/* Tabbar teleport 到 .van-config-provider，弹窗打开时置于遮罩之上，保证 X 可点 */
html.ai-menu-open {

  .van-tabbar,
  .van-tabbar__placeholder {
    z-index: 1001 !important;
  }
}
</style>
