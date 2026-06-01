<template>
  <div class="msw-row">
    <div
      v-if="showActionsLayer && !disableSwipe"
      class="msw-row__behind"
      :class="{ 'msw-row__behind--shown': showActionsStrip }"
      :style="{ width: `${actionsWidthPx}px` }"
    >
      <button
        v-if="showReadAction"
        type="button"
        class="msw-row__btn msw-row__btn--read"
        @click.stop="onReadClick"
      >
        <Icon name="passed" class="msw-row__btn-ic" :size="22" />
        <span class="msw-row__btn-txt">{{ t('msg_read') }}</span>
      </button>
      <button type="button" class="msw-row__btn msw-row__btn--del" @click.stop="emit('remove')">
        <Icon name="delete-o" class="msw-row__btn-ic" :size="22" />
        <span class="msw-row__btn-txt">{{ t('pd_comment_delete') }}</span>
      </button>
    </div>
    <div
      ref="frontRef"
      class="msw-row__front"
      :class="{ 'msw-row__front--dragging': dragging }"
      :style="frontStyle"
      @touchstart.passive="onTouchStart"
      @touchend="onTouchEnd"
      @touchcancel="onTouchEnd"
      @click.capture="onFrontClickCapture"
      @click="onFrontClick"
    >
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
  import { Icon } from 'vant';
  import { runAfterDoubleRaf } from './communitySwipeReveal';
  import { useI18n } from '/@/hooks/web/useI18n';

  /** 从 useI18n 解构的文案与能力 */
  const { t } = useI18n();

  /** 单个操作按钮宽度（px），总宽 = 按钮数 × BTN_W */
  const BTN_W = 80;

  /** props */
  const props = withDefaults(
    defineProps<{
      conversationId: string;
      /** 列表行唯一键（同一会话可能多行，用于重置滑动状态；不传则用 conversationId） */
      instanceKey?: string;
      /** 批量选择模式：禁用左滑与操作条 */
      disableSwipe?: boolean;
      /** 为 false 时隐藏「已读」（已读行只保留删除） */
      showReadAction?: boolean;
    }>(),
    { showReadAction: true }
  );

  /** 已读 + 删除 各 80px；无已读时仅删除 80px */
  const actionsWidthPx = computed(() => (props.showReadAction !== false ? BTN_W * 2 : BTN_W));

  /** emit */
  const emit = defineEmits<{
    /** 进入详情 / 会话 */
    open: [];
    /** 标记已读 */
    read: [];
    /** 删除会话 */
    remove: [];
  }>();

  /** 响应式状态：frontRef 相关 UI 或数据 */
  const frontRef = ref<HTMLElement | null>(null);

  /** 响应式状态：显隐控制 */
  const showActionsLayer = ref(false);

  /** 响应式状态：offsetX 相关 UI 或数据 */
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

  /** dragMoved */
  let dragMoved = false;

  /** suppressNextClick */
  let suppressNextClick = false;

  /** 计算属性：由其它状态派生的展示或判断 */
  const frontStyle = computed(() => ({
    transform: `translate3d(${offsetX.value}px, 0, 0)`,
    transition: dragging.value ? 'none' : 'transform 0.22s ease-out'
  }));

  /** 计算属性：显隐控制 */
  const showActionsStrip = computed(
    () => !props.disableSwipe && (offsetX.value < 0 || dragging.value)
  );

  /** clampOffset */
  const clampOffset = (v: number) => {
    const w = actionsWidthPx.value;
    if (v > 0) return 0;
    if (v < -w) return -w;
    return v;
  };

  /** 事件或回调处理：onTouchStart */
  const onTouchStart = (e: TouchEvent) => {
    if (props.disableSwipe) return;
    const touch = e.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    startOffset = offsetX.value;
    axisLocked = null;
    dragMoved = false;
  };

  /** 事件或回调处理：onTouchMove */
  const onTouchMove = (e: TouchEvent) => {
    if (props.disableSwipe) return;
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
    if (!props.disableSwipe && axisLocked === 'h' && dragging.value) {
      suppressNextClick = true;
      setTimeout(() => {
        suppressNextClick = false;
      }, 380);
      const o = offsetX.value;
      const w = actionsWidthPx.value;
      if (o < -w / 2) {
        offsetX.value = -w;
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

  /** 事件或回调处理：onFrontClick */
  const onFrontClick = () => {
    if (suppressNextClick) return;
    if (dragMoved) return;
    if (offsetX.value < -20) {
      offsetX.value = 0;
      return;
    }
    emit('open');
  };

  /** 事件或回调处理：onReadClick */
  const onReadClick = () => {
    offsetX.value = 0;
    emit('read');
  };

  /** revealActionsLayer */
  const revealActionsLayer = () => {
    runAfterDoubleRaf(() => {
      showActionsLayer.value = true;
    });
  };

  /** removeTouchMove */
  let removeTouchMove: (() => void) | null = null;

  /** 组件挂载后执行：初始化数据或订阅 */
  onMounted(() => {
    revealActionsLayer();
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
    () => props.instanceKey ?? props.conversationId,
    () => {
      offsetX.value = 0;
      showActionsLayer.value = false;
      revealActionsLayer();
    }
  );

  /** 侦听依赖变化并触发副作用 */
  watch(
    () => props.disableSwipe,
    (v) => {
      if (v) {
        offsetX.value = 0;
        dragging.value = false;
      }
    }
  );

  /** 侦听依赖变化并触发副作用 */
  watch(actionsWidthPx, () => {
    offsetX.value = clampOffset(offsetX.value);
  });
</script>

<style scoped lang="less">
  /* 已读 / 删除双按钮或仅删除；前景为 slot */

  @bg-row: #060b19;

  .msw-row {
    position: relative;
    overflow: hidden;
    touch-action: pan-y;
    background: @bg-row;
    border-radius: 0.22rem;
  }

  .msw-row__behind {
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    z-index: 0;
    display: flex;
    flex-direction: row;
    align-items: stretch;
    border-radius: 0 0.22rem 0.22rem 0;
    overflow: hidden;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.04s linear;
  }

  .msw-row__behind--shown {
    opacity: 1;
    pointer-events: auto;
  }

  .msw-row__btn {
    flex: 1;
    min-width: 0;
    margin: 0;
    padding: 0.12rem 0.06rem;
    border: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.08rem;
    color: #fff;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  .msw-row__btn-ic {
    opacity: 0.95;
    flex-shrink: 0;
  }

  .msw-row__btn-txt {
    font-size: 0.22rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    line-height: 1.2;
  }

  .msw-row__btn--read {
    background: linear-gradient(160deg, #2b8cff 0%, #1677ff 45%, #0d5bd4 100%);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.15);
  }

  .msw-row__btn--read + .msw-row__btn--del {
    box-shadow: inset 1px 0 0 rgba(255, 255, 255, 0.12);
  }

  .msw-row__btn--del {
    background: linear-gradient(160deg, #ff6b6b 0%, #ee0a24 50%, #c5081c 100%);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12);
  }

  .msw-row__btn:active {
    filter: brightness(1.06);
  }

  .msw-row__front {
    position: relative;
    z-index: 2;
    width: 100%;
    min-width: 100%;
    box-sizing: border-box;
    background: @bg-row;
    border-radius: 0.22rem;
    will-change: transform;
    isolation: isolate;
  }

  .msw-row__front--dragging {
    transition: none !important;
  }
</style>
