<template>
  <div ref="cardRootRef" class="community-post-card" @click="onCardClick">
    <!-- 头部 -->
    <div class="community-post-card__head">
      <div class="community-post-card__avatar">
        <VanImage :src="post.userAvatar" width="100%" height="100%" round />
      </div>
      <div class="community-post-card__meta">
        <div class="community-post-card__meta-row">
          <span class="community-post-card__name">
            <span class="community-post-card__name-text">{{ post.userName }}</span>
            <span class="community-post-card__badge">{{ vipBadgeLabel }}</span>
          </span>
          <span class="community-post-card__time">{{ post.timeText }}</span>
        </div>
      </div>
    </div>

    <div v-if="post.tags.length" class="community-post-card__tags">
      <span v-for="(tag, ti) in post.tags" :key="ti" class="community-post-card__tag">{{
        tag
      }}</span>
    </div>

    <div class="community-post-card__body">{{ post.title }}</div>

    <!-- 动态多图：3 列×2 行最多 6 张，点击全屏预览；视频：可点播放 -->
    <div class="community-post-card__media" :class="mediaSectionClass">
      <div
        v-if="isImageGallery"
        class="community-post-card__gallery"
        :class="{ 'community-post-card__gallery--single': isGallerySingle }"
        @click.stop
      >
        <div
          v-for="cell in galleryCells"
          :key="cell.startIndex"
          class="community-post-card__gallery-cell"
          @click.stop="openGalleryPreview(cell.startIndex)"
        >
          <VanImage
            :src="cell.url"
            fit="cover"
            width="100%"
            height="100%"
            class="community-post-card__gallery-img"
            @load="onGalleryImageLoad(cell.startIndex)"
          />
          <div v-if="cell.moreCount" class="community-post-card__gallery-more"
            >+{{ cell.moreCount }}</div
          >
        </div>
      </div>
      <template v-else-if="hasVideoCover">
        <video
          ref="coverVideoRef"
          class="community-post-card__cover community-post-card__cover--video"
          :src="post.coverUrl"
          muted
          playsinline
          preload="metadata"
          @play="coverVideoPlaying = true"
          @pause="coverVideoPlaying = false"
          @loadeddata="tryEmitVisualReadyAfterPaint"
          @loadedmetadata="tryEmitVisualReadyAfterPaint"
        ></video>
        <div v-if="showCoverPlayBadge" class="community-post-card__play" aria-hidden="true">
          <span class="community-post-card__play-tri"></span>
        </div>
      </template>
      <VanImage
        v-else-if="post.coverUrl"
        :src="post.coverUrl"
        class="community-post-card__cover"
        fit="cover"
        width="100%"
        height="100%"
        @load="tryEmitVisualReadyAfterPaint"
      />
    </div>

    <!-- 底部：举报 / 评论数 / 点赞 -->
    <div class="community-post-card__foot">
      <div v-if="showReport" class="community-post-card__foot-cell" @click.stop="emit('report')">
        <span class="community-post-card__report">
          <Icon name="warning-o" :size="15" color="#f56c6c" />
          <span class="community-post-card__report-text">{{ t('cm_report') }}</span>
        </span>
      </div>
      <div v-else class="community-post-card__foot-cell"></div>
      <div class="community-post-card__foot-cell">
        <span class="community-post-card__stat">
          <Icon name="chat-o" :size="16" />
          <span>{{ post.commentCount }}</span>
        </span>
      </div>
      <div class="community-post-card__foot-cell" @click.stop="onToggleLike">
        <span
          class="community-post-card__stat"
          :class="{ 'community-post-card__stat--liked': liked }"
        >
          <Icon :name="liked ? 'like' : 'like-o'" :size="16" />
          <span>{{ likeCount }}</span>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref, watch, onMounted, nextTick } from 'vue';
  import { Icon, Image as VanImage, showImagePreview } from 'vant';
  import { likeMarketingPost, unlikeMarketingPost } from '/@/service/MarketingPost';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { isApiSuccess } from '/@/utils/apiResult';
  import type { CommunityPostItem } from './communityPostDisplay';

  /** 视频区域带此类名，onCardClick 用 closest 判断是否点封面（避免只靠子元素 stop 在部分机型上不可靠） */
  const VIDEO_MEDIA_AREA_SELECTOR = '.community-post-card__media--video';

  /** emitIfMediaImagesAlreadyComplete 里查图用，与模板根上 class 一致 */
  const MEDIA_ROOT_SELECTOR = '.community-post-card__media';

  /** props */
  const props = defineProps<{
    post: CommunityPostItem;
    /** 云社区首页显示举报；我的帖子可不显示 */
    showReport?: boolean;
  }>();

  /** emit */
  const emit = defineEmits<{
    click: [];
    report: [];
    /** 主区域首帧可展示（首图/视频或纯文布局就绪），供左滑删除层延后显示 */
    'visual-ready': [];
  }>();

  /** 从 useMessage 解构的 Toast / Dialog 能力 */
  const { CreateErrorToast } = useMessage();

  /** 从 useI18n 解构的文案与能力 */
  const { t } = useI18n();

  // —— 内容展示：类型、宫格、封面样式类 ——

  /** 接口未给等级时与 0 一样展示 VIP0 */
  const vipBadgeLabel = computed(() => `VIP${props.post.vipLevel ?? 0}`);

  /** 计算属性：由其它状态派生的展示或判断 */
  const isImageGallery = computed(
    () => props.post.postType === 2 && (props.post.galleryImages?.length ?? 0) > 0
  );
  /** 仅 1 张图时与单图封面一致：整行占满宽度 */
  const isGallerySingle = computed(
    () => isImageGallery.value && (props.post.galleryImages?.length ?? 0) === 1
  );
  /** 最多 6 格（3×2）；第 6 格可叠「+剩余张数」 */
  const galleryCells = computed(() => {
    const imgs = props.post.galleryImages ?? [];
    const n = imgs.length;
    if (!n) return [];
    const maxCells = 6;
    const count = Math.min(maxCells, n);
    const cells: Array<{
      url: string;
      startIndex: number;
      moreCount?: number;
    }> = [];
    for (let i = 0; i < count; i++) {
      const moreCount = i === 5 && n > 6 ? n - 6 : undefined;
      cells.push({ url: imgs[i], startIndex: i, moreCount });
    }
    return cells;
  });

  /** openGalleryPreview */
  const openGalleryPreview = (startIndex: number) => {
    const images = props.post.galleryImages ?? [];
    if (!images.length) return;
    showImagePreview({
      images,
      startPosition: startIndex,
      closeOnPopstate: true
    });
  };

  /** 计算属性：由其它状态派生的展示或判断 */
  const hasVideoCover = computed(
    () => !isImageGallery.value && !!(props.post.coverUrl && props.post.coverIsVideo)
  );
  /** 是否有图/视频区域（无则 media 块用深色占位高度） */
  const hasMediaContent = computed(() => isImageGallery.value || !!props.post.coverUrl);

  /** 计算属性：事件或回调处理 */
  const mediaSectionClass = computed(() => ({
    'community-post-card__media--dark': !hasMediaContent.value,
    'community-post-card__media--video': hasVideoCover.value,
    'community-post-card__media--gallery': isImageGallery.value
  }));
  // —— 点赞：接口结果与列表 props 深变更同步到本地 ——

  /** 响应式状态：liked 相关 UI 或数据 */
  const liked = ref(props.post.liked);

  /** 响应式状态：likeCount 相关 UI 或数据 */
  const likeCount = ref(props.post.likeCount);

  /** 响应式状态：加载中状态 */
  const likeLoading = ref(false);
  // —— 封面视频与整卡点击 ——

  /** 响应式状态：coverVideoRef 相关 UI 或数据 */
  const coverVideoRef = ref<HTMLVideoElement | null>(null);

  /** 响应式状态：cardRootRef 相关 UI 或数据 */
  const cardRootRef = ref<HTMLElement | null>(null);

  /** 响应式状态：coverVideoPlaying 相关 UI 或数据 */
  const coverVideoPlaying = ref(false);
  /** 暂停时显示中央播放三角；播放中隐藏 */
  const showCoverPlayBadge = computed(() => props.post.showPlay && !coverVideoPlaying.value);
  // —— visual-ready：父组件（如左滑行）等主内容就绪后再铺交互层，避免闪层压在空白上 ——

  /** visualReadyEmitted */
  let visualReadyEmitted = false;

  /** visualReadyPending */
  let visualReadyPending = false;

  /** visualReadyFallbackTimer */
  let visualReadyFallbackTimer: ReturnType<typeof setTimeout> | null = null;

  /** clearVisualReadyFallback */
  const clearVisualReadyFallback = () => {
    if (visualReadyFallbackTimer != null) {
      clearTimeout(visualReadyFallbackTimer);
      visualReadyFallbackTimer = null;
    }
  };

  /** runAfterDoubleRaf */
  const runAfterDoubleRaf = (run: () => void) => {
    void nextTick(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(run);
      });
    });
  };

  /** tryEmitVisualReadyAfterPaint */
  const tryEmitVisualReadyAfterPaint = () => {
    if (visualReadyEmitted || visualReadyPending) return;
    visualReadyPending = true;
    runAfterDoubleRaf(() => {
      visualReadyPending = false;
      if (visualReadyEmitted) return;
      visualReadyEmitted = true;
      clearVisualReadyFallback();
      emit('visual-ready');
    });
  };

  /** emitIfMediaImagesAlreadyComplete */
  const emitIfMediaImagesAlreadyComplete = () => {
    if (visualReadyEmitted || visualReadyPending) return;
    const root = cardRootRef.value;
    if (!root) return;
    const media = root.querySelector(MEDIA_ROOT_SELECTOR);
    if (!media) {
      tryEmitVisualReadyAfterPaint();
      return;
    }
    const imgs = Array.from(media.querySelectorAll('img'));
    if (imgs.length === 0) return;
    if (!imgs.every((img) => img.complete)) return;
    tryEmitVisualReadyAfterPaint();
  };

  /** 拉取接口数据：onGalleryImageLoad */
  const onGalleryImageLoad = (startIndex: number) => {
    if (startIndex === 0) tryEmitVisualReadyAfterPaint();
  };

  /** scheduleVisualReadyForPost */
  const scheduleVisualReadyForPost = () => {
    visualReadyEmitted = false;
    visualReadyPending = false;
    clearVisualReadyFallback();
    void nextTick(() => {
      if (!hasMediaContent.value) {
        tryEmitVisualReadyAfterPaint();
        return;
      }
      visualReadyFallbackTimer = setTimeout(() => tryEmitVisualReadyAfterPaint(), 900);
      setTimeout(() => emitIfMediaImagesAlreadyComplete(), 0);
    });
  };

  /** 切换展开/折叠等：toggleCoverVideoPlayback */
  const toggleCoverVideoPlayback = () => {
    const el = coverVideoRef.value;
    if (!el) return;
    if (el.paused) void el.play().catch(() => {});
    else el.pause();
  };

  /** resetCoverVideoForNewPost */
  const resetCoverVideoForNewPost = () => {
    coverVideoPlaying.value = false;
    const el = coverVideoRef.value;
    if (!el) return;
    el.pause();
    el.currentTime = 0;
  };

  /** 事件或回调处理：onCardClick */
  const onCardClick = (e: MouseEvent) => {
    const target = e.target;
    if (target instanceof Element && target.closest(VIDEO_MEDIA_AREA_SELECTOR)) {
      toggleCoverVideoPlayback();
      return;
    }
    emit('click');
  };
  // 同一条帖子在列表里被更新（例如点赞数）时同步 UI

  /** 侦听依赖变化并触发副作用 */
  watch(
    () => props.post,
    (p) => {
      liked.value = p.liked;
      likeCount.value = p.likeCount;
    },
    { deep: true }
  );
  // 换成另一条帖子：重置视频并重算 visual-ready

  /** 侦听依赖变化并触发副作用 */
  watch(
    () => props.post.id,
    () => {
      resetCoverVideoForNewPost();
      scheduleVisualReadyForPost();
    }
  );

  /** 组件挂载后执行：初始化数据或订阅 */
  onMounted(() => {
    scheduleVisualReadyForPost();
  });

  /** 事件或回调处理（onToggleLike） */
  const onToggleLike = async () => {
    if (likeLoading.value) return;
    const id = props.post.id;
    if (!id) return;
    likeLoading.value = true;
    try {
      const willLike = !liked.value;
      const res = willLike ? await likeMarketingPost({ id }) : await unlikeMarketingPost({ id });
      if (isApiSuccess(res) && res.data === true) {
        liked.value = willLike;
        likeCount.value = Math.max(0, likeCount.value + (willLike ? 1 : -1));
      } else {
        CreateErrorToast(res?.msg || t('od_op_fail'));
      }
    } catch {
      CreateErrorToast(t('cm_network_error'));
    } finally {
      likeLoading.value = false;
    }
  };
</script>

<style scoped lang="less">
  /* 卡片：头 / 标签 / 正文 / 媒体区 / 底栏，与 communityPostDisplay 映射字段对应 */

  @bg-card: #0c1428;

  .community-post-card {
    padding: 0.29rem 0.28rem;
    border-radius: 0.2rem;
    background: @bg-card;
    box-shadow: 0 0.06rem 0.18rem rgba(0, 0, 0, 0.35);
    border: 1px solid rgba(255, 255, 255, 0.04);
  }

  .community-post-card__head {
    display: flex;
    align-items: flex-start;
    gap: 0.2rem;
    margin-bottom: 0.16rem;
  }

  .community-post-card__avatar {
    width: 0.72rem;
    height: 0.72rem;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
    border: 1px solid rgba(255, 255, 255, 0.12);
  }

  .community-post-card__meta {
    flex: 1;
    min-width: 0;
  }

  .community-post-card__meta-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.16rem;
  }

  .community-post-card__name {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.08rem;
    min-width: 0;
  }

  .community-post-card__name-text {
    font-size: 0.28rem;
    font-weight: 600;
    color: #fff;
    line-height: 1.3;
  }

  .community-post-card__badge {
    font-size: 0.22rem;
    padding: 0.02rem 0.1rem;
    border-radius: 0.06rem;
    background: linear-gradient(90deg, #1e5a9e, #0a7ee8);
    color: #fff;
    font-weight: 600;
  }

  .community-post-card__time {
    flex-shrink: 0;
    font-size: 0.22rem;
    color: rgba(255, 255, 255, 0.45);
  }

  .community-post-card__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.12rem;
    margin-bottom: 0.14rem;
  }

  .community-post-card__tag {
    font-size: 0.22rem;
    padding: 0.06rem 0.14rem;
    border-radius: 0.08rem;
    background: rgba(15, 75, 85, 0.75);
    color: #5eead4;
    font-weight: 500;
  }

  .community-post-card__tag:nth-child(2) {
    background: rgba(65, 45, 110, 0.65);
    color: #c4b5fd;
  }

  .community-post-card__body {
    font-size: 0.3rem;
    font-weight: 600;
    color: #fff;
    line-height: 1.45;
    margin-bottom: 0.16rem;
  }

  .community-post-card__media {
    position: relative;
    height: 2.52rem;
    border-radius: 0.16rem;
    margin-bottom: 0.16rem;
    overflow: hidden;
  }

  .community-post-card__media--dark {
    background: #050810;
  }

  .community-post-card__media--gallery {
    height: auto;
    min-height: 0;
    overflow: visible;
  }

  .community-post-card__gallery {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.08rem;
    width: 100%;
  }

  .community-post-card__gallery--single {
    grid-template-columns: 1fr;
  }

  .community-post-card__gallery-cell {
    position: relative;
    aspect-ratio: 1;
    border-radius: 0.08rem;
    overflow: hidden;
    background: #050810;
    cursor: pointer;
  }

  .community-post-card__gallery--single .community-post-card__gallery-cell {
    aspect-ratio: auto;
    width: 100%;
    height: 2.52rem;
  }

  .community-post-card__gallery-cell :deep(.van-image) {
    width: 100%;
    height: 100%;
    display: block;
  }

  .community-post-card__gallery-more {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.45);
    color: #fff;
    font-size: 0.36rem;
    font-weight: 700;
    pointer-events: none;
  }

  .community-post-card__cover {
    display: block;
    width: 100%;
    height: 100%;
  }

  .community-post-card__cover--video {
    position: relative;
    z-index: 0;
    object-fit: cover;
    background: #000;
    vertical-align: top;
    cursor: pointer;
  }

  .community-post-card__media :deep(.van-image) {
    width: 100%;
    height: 100%;
  }

  .community-post-card__play {
    position: absolute;
    left: 50%;
    top: 50%;
    z-index: 1;
    transform: translate(-50%, -50%);
    width: 0.96rem;
    height: 0.96rem;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.96);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0.08rem 0.24rem rgba(0, 0, 0, 0.35);
    cursor: pointer;
    pointer-events: auto;
  }

  .community-post-card__play-tri {
    display: block;
    width: 0;
    height: 0;
    border-style: solid;
    border-width: 0.14rem 0 0.14rem 0.22rem;
    border-color: transparent transparent transparent #1a2338;
    margin-left: 0.05rem;
  }

  .community-post-card__foot {
    display: flex;
    align-items: center;
    width: 100%;
    font-size: 0.24rem;
    margin-top: 0.2rem;
    padding-top: 0.24rem;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    box-sizing: border-box;
  }

  .community-post-card__foot-cell {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .community-post-card__foot-cell:first-child {
    justify-content: flex-start;
  }

  .community-post-card__foot-cell:last-child {
    justify-content: flex-end;
  }

  .community-post-card__report {
    display: inline-flex;
    align-items: center;
    gap: 0.06rem;
  }

  .community-post-card__report-text {
    color: rgba(255, 255, 255, 0.55);
  }

  .community-post-card__stat {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.08rem;
    color: rgba(255, 255, 255, 0.88);
  }

  .community-post-card__stat--liked {
    color: #ff6b9d;
  }

  .community-post-card__foot-cell:active .community-post-card__stat {
    opacity: 0.85;
  }
</style>
