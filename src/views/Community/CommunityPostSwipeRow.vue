<template>
  <div class="cps-row">
    <!-- 就绪后挂载；默认 opacity:0，仅左滑/横向拖动时显示，避免合成层与布局盒差 1px 时透出红 -->
    <div
      v-if="showDeleteLayer"
      class="cps-row__behind"
      :class="{ 'cps-row__behind--shown': showRedStrip }"
      :style="{ width: `${DELETE_WIDTH_PX}px` }"
    >
      <button type="button" class="cps-row__del" @click.stop="emit('delete')">{{
        t('pd_comment_delete')
      }}</button>
    </div>
    <!-- 上层：卡片整体左移 -->
    <div
      ref="frontRef"
      class="cps-row__front"
      :class="{ 'cps-row__front--dragging': dragging }"
      :style="frontStyle"
      @touchstart.passive="onTouchStart"
      @touchend="onTouchEnd"
      @touchcancel="onTouchEnd"
      @click.capture="onFrontClickCapture"
    >
      <CommunityPostCard :post="post" @click="onCardClick" @visual-ready="onCardVisualReady" />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
  import CommunityPostCard from './CommunityPostCard.vue';
  import type { CommunityPostItem } from './communityPostDisplay';
  import { runAfterDoubleRaf } from './communitySwipeReveal';
  import { useI18n } from '/@/hooks/web/useI18n';

  /** 从 useI18n 解构的文案与能力 */
  const { t } = useI18n();

  /** 左侧露出删除区的宽度（px），与 clamp 一致 */
  const DELETE_WIDTH_PX = 80;

  /** props */
  const props = defineProps<{
    post: CommunityPostItem;
  }>();

  /** emit */
  const emit = defineEmits<{
    delete: [];
    /** 进入详情（仅在未滑出删除、且未发生横滑时触发） */
    'open-detail': [];
  }>();

  /** 响应式状态：frontRef 相关 UI 或数据 */
  const frontRef = ref<HTMLElement | null>(null);

  /** 主卡片绘制后再露出红色删除区，避免上拉加载时红底抢先出现 */
  const showDeleteLayer = ref(false);

  /** 上层位移，0 为关，负值向左露出删除 */
  const offsetX = ref(0);

  /** 响应式状态：dragging 相关 UI 或数据 */
  const dragging = ref(false);

  /** startX */
  let startX = 0;

  /** startY */
  let startY = 0;

  /** startOffset */
  let startOffset = 0;

  /** axisLocked */
  let axisLocked: 'h' | 'v' | null = null;

  /** 本次触摸是否发生过横向拖动（用于抑制误触进详情） */
  let dragMoved = false;

  /** 阻止下一次冒泡的 card click（滑动手势后浏览器会合成 click） */
  let suppressNextClick = false;

  /** 计算属性：由其它状态派生的展示或判断 */
  const frontStyle = computed(() => ({
    transform: `translate3d(${offsetX.value}px, 0, 0)`,
    transition: dragging.value ? 'none' : 'transform 0.22s ease-out'
  }));
  /** 正在拖或已左滑时把背后条 opacity 拉到 1，否则保持 0 避免缝露红 */
  const showRedStrip = computed(() => offsetX.value < 0 || dragging.value);

  /** clampOffset */
  const clampOffset = (v: number) => {
    if (v > 0) return 0;
    if (v < -DELETE_WIDTH_PX) return -DELETE_WIDTH_PX;
    return v;
  };

  /** 事件或回调处理：onTouchStart */
  const onTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    startOffset = offsetX.value;
    axisLocked = null;
    dragMoved = false;
  };

  /** 事件或回调处理：onTouchMove */
  const onTouchMove = (e: TouchEvent) => {
    const touch = e.touches[0];
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;
    if (axisLocked == null) {
      const ax = Math.abs(dx);
      const ay = Math.abs(dy);
      if (ax < 8 && ay < 8) return;
      axisLocked = ax > ay ? 'h' : 'v';
    }
    if (axisLocked === 'v') return;
    dragging.value = true;
    dragMoved = true;
    e.preventDefault();
    offsetX.value = clampOffset(startOffset + dx);
  };

  /** 事件或回调处理：onTouchEnd */
  const onTouchEnd = () => {
    if (axisLocked === 'h' && dragging.value) {
      suppressNextClick = true;
      setTimeout(() => {
        suppressNextClick = false;
      }, 380);
      const o = offsetX.value;
      if (o < -DELETE_WIDTH_PX / 2) {
        offsetX.value = -DELETE_WIDTH_PX;
      } else {
        offsetX.value = 0;
      }
    }
    dragging.value = false;
    axisLocked = null;
  };

  /** 事件或回调处理：onFrontClickCapture */
  const onFrontClickCapture = (e: MouseEvent) => {
    if (suppressNextClick) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  /** 事件或回调处理：onCardClick */
  const onCardClick = () => {
    if (suppressNextClick) return;
    if (dragMoved) return;
    if (offsetX.value < -20) {
      offsetX.value = 0;
      return;
    }
    emit('open-detail');
  };

  /** removeTouchMove */
  let removeTouchMove: (() => void) | null = null;

  /** 事件或回调处理：onCardVisualReady */
  const onCardVisualReady = () => {
    runAfterDoubleRaf(() => {
      showDeleteLayer.value = true;
    });
  };

  /** 组件挂载后执行：初始化数据或订阅 */
  onMounted(() => {
    const el = frontRef.value;
    if (!el) return;
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    removeTouchMove = () => el.removeEventListener('touchmove', onTouchMove);
  });

  /** 组件卸载时清理副作用 */
  onUnmounted(() => {
    removeTouchMove?.();
  });

  /** 侦听依赖变化并触发副作用 */
  watch(
    () => props.post.id,
    () => {
      offsetX.value = 0;
      showDeleteLayer.value = false;
    }
  );
</script>

<style scoped lang="less">
  /* 背后删除条 + 前景卡片位移；与卡片同底色防缝露红 */

  .cps-row {
    position: relative;
    border-radius: 0.2rem;
    overflow: hidden;
    touch-action: pan-y;
    /* 与主卡片同色：亚像素缝隙、圆角抗锯齿时也不会透出红底 */
    background: #0c1428;
  }

  .cps-row__behind {
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    z-index: 0;
    background: #ee0a24;
    display: flex;
    align-items: stretch;
    justify-content: center;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.04s linear;
  }

  .cps-row__behind--shown {
    opacity: 1;
    pointer-events: auto;
  }

  .cps-row__del {
    flex: 1;
    margin: 0;
    padding: 0 0.12rem;
    border: none;
    font-size: 16px;
    font-weight: 600;
    color: #fff;
    background: transparent;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  .cps-row__del:active {
    opacity: 0.88;
  }

  .cps-row__front {
    position: relative;
    z-index: 2;
    width: 100%;
    min-width: 100%;
    box-sizing: border-box;
    background: #0c1428;
    will-change: transform;
    isolation: isolate;
    /* 与卡片同圆角，前景背景盖住四角，避免裁掉卡片 box-shadow 不用 overflow:hidden */
    border-radius: 0.2rem;
  }

  .cps-row__front--dragging {
    transition: none !important;
  }
</style>
