<template>
  <div class="post-detail-shell">
    <NavBar
      :title="t('pd_nav_title')"
      left-arrow
      fixed
      placeholder
      :border="false"
      class="post-detail-page__navbar"
    />

    <PageWrap class="post-detail-page">
      <div v-if="loading" class="post-detail-page__loading">
        <Loading type="spinner" vertical>{{ t('dt_loading') }}</Loading>
      </div>

      <template v-else-if="detail">
        <div class="post-detail-page__card">
          <div class="post-detail-page__head">
            <div class="post-detail-page__avatar">
              <VanImage :src="avatarSrc" width="100%" height="100%" round />
            </div>
            <div class="post-detail-page__meta">
              <div class="post-detail-page__meta-row">
                <div class="post-detail-page__name-block">
                  <span class="post-detail-page__name-text">{{ userName }}</span>
                  <span v-if="vipLevel != null && vipLevel > 0" class="post-detail-page__badge"
                    >VIP{{ vipLevel }}</span
                  >
                </div>
                <span class="post-detail-page__time">{{ timeText }}</span>
              </div>
            </div>
          </div>

          <div v-if="tags.length" class="post-detail-page__tags">
            <span v-for="(tag, ti) in tags" :key="ti" class="post-detail-page__tag">{{ tag }}</span>
          </div>

          <div v-if="headline" class="post-detail-page__title">{{ headline }}</div>
          <div v-if="bodyText" class="post-detail-page__content">{{ bodyText }}</div>

          <div v-if="hasMediaContent" class="post-detail-page__media" :class="detailMediaClass">
            <div
              v-if="isImageGallery"
              class="post-detail-page__gallery"
              :class="{ 'post-detail-page__gallery--single': isGallerySingle }"
              @click.stop
            >
              <div
                v-for="cell in galleryCells"
                :key="cell.startIndex"
                class="post-detail-page__gallery-cell"
                @click.stop="openGalleryPreview(cell.startIndex)"
              >
                <VanImage :src="cell.url" fit="cover" width="100%" height="100%" />
                <div v-if="cell.moreCount" class="post-detail-page__gallery-more"
                  >+{{ cell.moreCount }}</div
                >
              </div>
            </div>
            <template v-else-if="hasVideoCover">
              <video
                ref="detailCoverVideoRef"
                class="post-detail-page__cover post-detail-page__cover--video"
                :src="displayPost?.coverUrl ?? ''"
                muted
                playsinline
                preload="metadata"
                @play="detailCoverVideoPlaying = true"
                @pause="detailCoverVideoPlaying = false"
                @click.stop="toggleDetailCoverVideo"
              ></video>
              <div
                v-if="showDetailCoverPlayBadge"
                class="post-detail-page__play-btn"
                aria-hidden="true"
                @click.stop="toggleDetailCoverVideo"
              >
                <span class="post-detail-page__play-tri"></span>
              </div>
            </template>
            <VanImage
              v-else-if="displayPost?.coverUrl"
              :src="displayPost.coverUrl"
              class="post-detail-page__cover"
              fit="cover"
              width="100%"
              height="100%"
            />
          </div>

          <div class="post-detail-page__foot">
            <button type="button" class="post-detail-page__report" @click="onReport">
              <Icon name="warning-o" :size="15" color="#f56c6c" />
              <span class="post-detail-page__report-text">{{ t('cm_report') }}</span>
            </button>
            <div class="post-detail-page__stats">
              <span class="post-detail-page__stat">
                <Icon name="chat-o" :size="16" />
                <span>{{ commentCount }}</span>
              </span>
              <span
                class="post-detail-page__stat post-detail-page__stat--like"
                :class="{ 'post-detail-page__stat--liked': postLiked }"
                @click.stop="onTogglePostLike"
              >
                <Icon :name="postLiked ? 'like' : 'like-o'" :size="16" />
                <span>{{ postLikeCount }}</span>
              </span>
            </div>
          </div>
        </div>

        <div class="post-detail-page__comments-wrap">
          <div class="post-detail-page__comments-title">{{
            t('pd_comments_count', [commentTitleCount])
          }}</div>
          <PullRefresh
            v-model="commentsRefreshing"
            class="post-detail-page__cmt-refresh"
            @refresh="onCommentsRefresh"
          >
            <List
              v-model:loading="commentsListLoading"
              class="post-detail-page__cmt-list"
              :finished="commentsFinished"
              :finished-text="t('no_more')"
              :loading-text="commentsRefreshing ? ' ' : undefined"
              :immediate-check="true"
              @load="onCommentsLoadMore"
            >
              <div
                v-if="!commentsLoaded && commentsListLoading"
                class="post-detail-page__cmt-loading"
                >{{ t('pd_comments_loading') }}</div
              >
              <div
                v-else-if="commentsLoaded && !rootComments.length"
                class="post-detail-page__cmt-empty"
                >{{ t('pd_no_comments') }}</div
              >
              <template v-else>
                <div v-for="c in rootComments" :key="c.id" class="post-detail-page__cmt-thread">
                  <div class="post-detail-page__cmt">
                    <div class="post-detail-page__cmt-avatar">
                      <VanImage :src="commentAvatar(c)" width="100%" height="100%" round />
                    </div>
                    <div class="post-detail-page__cmt-main">
                      <div class="post-detail-page__cmt-head">
                        <span class="post-detail-page__cmt-name-row">
                          <span class="post-detail-page__cmt-name">{{
                            c.userNickname?.trim() || '--'
                          }}</span>
                          <span
                            v-if="isCommentByPostAuthor(c)"
                            class="post-detail-page__cmt-author"
                            >{{ t('pd_comment_author') }}</span
                          >
                          <span v-if="isCommentBySelf(c)" class="post-detail-page__cmt-self">{{
                            t('pd_comment_self')
                          }}</span>
                        </span>
                        <span
                          v-if="formatRelativeTime(c.createTime)"
                          class="post-detail-page__cmt-time"
                          >{{ formatRelativeTime(c.createTime) }}</span
                        >
                      </div>
                      <div class="post-detail-page__cmt-text">{{ c.content ?? '' }}</div>
                      <div class="post-detail-page__cmt-actions">
                        <span
                          class="post-detail-page__cmt-act post-detail-page__cmt-act--like"
                          :class="{ 'post-detail-page__cmt-act--liked': c.liked }"
                          @click.stop="onToggleCommentLike(c)"
                        >
                          <Icon :name="c.liked ? 'like' : 'like-o'" :size="14" />
                          <span>{{ Number(c.likeCount) || 0 }}</span>
                        </span>
                        <span
                          class="post-detail-page__cmt-act post-detail-page__cmt-act--reply"
                          :class="{ 'post-detail-page__cmt-act--muted': !commentHasThread(c) }"
                          @click.stop="onReplyCountClick(c)"
                        >
                          <Icon name="chat-o" :size="14" />
                          <span>{{ Number(c.replyCount) || 0 }}</span>
                        </span>
                        <span
                          class="post-detail-page__cmt-act post-detail-page__cmt-act--replyto"
                          @click.stop="onReplyToComment(c)"
                        >
                          {{ t('pd_reply') }}
                        </span>
                        <span
                          v-if="canDeleteComment(c)"
                          class="post-detail-page__cmt-act post-detail-page__cmt-act--delete"
                          :class="{ 'post-detail-page__cmt-act--busy': commentDeleteBusy[c.id] }"
                          @click.stop="onDeleteComment(c)"
                        >
                          {{ t('pd_comment_delete') }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div v-show="isRepliesExpanded(c.id)" class="post-detail-page__cmt-replies">
                    <div
                      v-if="replyLoadingByParent[c.id]"
                      class="post-detail-page__cmt-replies-loading"
                      >{{ t('dt_loading') }}</div
                    >
                    <template v-else>
                      <div
                        v-for="r in repliesOf(c.id)"
                        :key="r.id"
                        class="post-detail-page__cmt-reply-group"
                      >
                        <div class="post-detail-page__cmt post-detail-page__cmt--reply">
                          <div class="post-detail-page__cmt-avatar">
                            <VanImage :src="commentAvatar(r)" width="100%" height="100%" round />
                          </div>
                          <div class="post-detail-page__cmt-main">
                            <div class="post-detail-page__cmt-head">
                              <span class="post-detail-page__cmt-name-row">
                                <span class="post-detail-page__cmt-name">{{
                                  r.userNickname?.trim() || '--'
                                }}</span>
                                <span
                                  v-if="isCommentByPostAuthor(r)"
                                  class="post-detail-page__cmt-author"
                                  >{{ t('pd_comment_author') }}</span
                                >
                                <span
                                  v-if="isCommentBySelf(r)"
                                  class="post-detail-page__cmt-self"
                                  >{{ t('pd_comment_self') }}</span
                                >
                              </span>
                              <span
                                v-if="formatRelativeTime(r.createTime)"
                                class="post-detail-page__cmt-time"
                                >{{ formatRelativeTime(r.createTime) }}</span
                              >
                            </div>
                            <div class="post-detail-page__cmt-text">{{ r.content ?? '' }}</div>
                            <div class="post-detail-page__cmt-actions">
                              <span
                                class="post-detail-page__cmt-act post-detail-page__cmt-act--like"
                                :class="{ 'post-detail-page__cmt-act--liked': r.liked }"
                                @click.stop="onToggleCommentLike(r)"
                              >
                                <Icon :name="r.liked ? 'like' : 'like-o'" :size="14" />
                                <span>{{ Number(r.likeCount) || 0 }}</span>
                              </span>
                              <span
                                class="post-detail-page__cmt-act post-detail-page__cmt-act--reply"
                                :class="{
                                  'post-detail-page__cmt-act--muted': !commentHasThread(r)
                                }"
                                @click.stop="onReplyCountClick(r)"
                              >
                                <Icon name="chat-o" :size="14" />
                                <span>{{ Number(r.replyCount) || 0 }}</span>
                              </span>
                              <span
                                class="post-detail-page__cmt-act post-detail-page__cmt-act--replyto"
                                @click.stop="onReplyToComment(r)"
                              >
                                {{ t('pd_reply') }}
                              </span>
                              <span
                                v-if="canDeleteComment(r)"
                                class="post-detail-page__cmt-act post-detail-page__cmt-act--delete"
                                :class="{
                                  'post-detail-page__cmt-act--busy': commentDeleteBusy[r.id]
                                }"
                                @click.stop="onDeleteComment(r)"
                              >
                                {{ t('pd_comment_delete') }}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div
                          v-show="isRepliesExpanded(r.id)"
                          class="post-detail-page__cmt-replies post-detail-page__cmt-replies--nested"
                        >
                          <div
                            v-if="replyLoadingByParent[r.id]"
                            class="post-detail-page__cmt-replies-loading"
                            >{{ t('dt_loading') }}</div
                          >
                          <template v-else>
                            <div
                              v-for="rr in repliesOf(r.id)"
                              :key="rr.id"
                              class="post-detail-page__cmt post-detail-page__cmt--reply post-detail-page__cmt--reply-deep"
                            >
                              <div class="post-detail-page__cmt-avatar">
                                <VanImage
                                  :src="commentAvatar(rr)"
                                  width="100%"
                                  height="100%"
                                  round
                                />
                              </div>
                              <div class="post-detail-page__cmt-main">
                                <div class="post-detail-page__cmt-head">
                                  <span class="post-detail-page__cmt-name-row">
                                    <span class="post-detail-page__cmt-name">{{
                                      rr.userNickname?.trim() || '--'
                                    }}</span>
                                    <span
                                      v-if="isCommentByPostAuthor(rr)"
                                      class="post-detail-page__cmt-author"
                                      >{{ t('pd_comment_author') }}</span
                                    >
                                    <span
                                      v-if="isCommentBySelf(rr)"
                                      class="post-detail-page__cmt-self"
                                      >{{ t('pd_comment_self') }}</span
                                    >
                                  </span>
                                  <span
                                    v-if="formatRelativeTime(rr.createTime)"
                                    class="post-detail-page__cmt-time"
                                    >{{ formatRelativeTime(rr.createTime) }}</span
                                  >
                                </div>
                                <div class="post-detail-page__cmt-text">{{ rr.content ?? '' }}</div>
                                <div class="post-detail-page__cmt-actions">
                                  <span
                                    class="post-detail-page__cmt-act post-detail-page__cmt-act--like"
                                    :class="{ 'post-detail-page__cmt-act--liked': rr.liked }"
                                    @click.stop="onToggleCommentLike(rr)"
                                  >
                                    <Icon :name="rr.liked ? 'like' : 'like-o'" :size="14" />
                                    <span>{{ Number(rr.likeCount) || 0 }}</span>
                                  </span>
                                  <span
                                    class="post-detail-page__cmt-act post-detail-page__cmt-act--replyto"
                                    @click.stop="onReplyToComment(rr)"
                                  >
                                    {{ t('pd_reply') }}
                                  </span>
                                  <span
                                    v-if="canDeleteComment(rr)"
                                    class="post-detail-page__cmt-act post-detail-page__cmt-act--delete"
                                    :class="{
                                      'post-detail-page__cmt-act--busy': commentDeleteBusy[rr.id]
                                    }"
                                    @click.stop="onDeleteComment(rr)"
                                  >
                                    {{ t('pd_comment_delete') }}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </template>
                        </div>
                      </div>
                    </template>
                  </div>
                </div>
              </template>
            </List>
          </PullRefresh>
        </div>
      </template>

      <div v-else class="post-detail-page__empty">{{ t('pd_empty') }}</div>

      <!-- 占位：底部输入条高度 -->
      <div class="post-detail-page__bottom-spacer"></div>
    </PageWrap>

    <div class="post-detail-page__input-bar">
      <div v-if="replyTargetParentId != null" class="post-detail-page__reply-hint">
        <span class="post-detail-page__reply-hint-text">{{ replyHintLine }}</span>
        <span class="post-detail-page__reply-hint-cancel" @click="clearReplyTarget">{{
          t('cancel')
        }}</span>
      </div>
      <div class="post-detail-page__input-row">
        <Field
          v-model="commentDraft"
          type="textarea"
          rows="1"
          autosize
          :border="false"
          maxlength="500"
          :placeholder="commentFieldPlaceholder"
          class="post-detail-page__field"
        />
        <Button
          type="primary"
          size="small"
          class="post-detail-page__send-btn"
          :loading="commentSubmitting"
          :disabled="commentSubmitting"
          @click="submitComment"
        >
          {{ t('pd_send') }}
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { NavBar, PageWrap } from '/@/components';
  import {
    Field,
    Image as VanImage,
    Icon,
    Loading,
    Button,
    showImagePreview,
    PullRefresh,
    List
  } from 'vant';
  import AvatarImg from '/@/assets/avatar.png';
  import {
    getMarketingPostDetail,
    getPostCommentPage,
    getPostCommentReplies,
    createPostComment,
    likeMarketingPost,
    unlikeMarketingPost,
    likeMarketingPostComment,
    unlikeMarketingPostComment,
    deleteMarketingPostComment,

    /** AppMarketingPostRespVO：类型别名 */
    type AppMarketingPostRespVO,

    /** AppMarketingCommentRespVO：类型别名 */
    type AppMarketingCommentRespVO
  } from '/@/service/MarketingPost';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { useUserStoreWithOut } from '/@/stores/modules/UserConfig';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { isApiSuccess } from '/@/utils/apiResult';
  import {
    mapPostToDisplay,
    formatRelativeTime,

    /** CommunityPostItem：类型别名 */
    type CommunityPostItem
  } from './communityPostDisplay';

  /**
   * 帖子详情：query.id 拉详情 + 顶层评论分页 + 回复展开与缓存。
   * 代码顺序：用户与权限 → 各 ref → 正文/媒体展示 → 点赞与评论交互 → 请求与生命周期。
   */
  const COMMENT_PAGE_SIZE = 20;

  /** REPLY_PAGE_SIZE */
  const REPLY_PAGE_SIZE = 20;

  /** 当前路由：读取 query、params、meta 等 */
  const route = useRoute();

  /** 路由实例：编程式导航 */
  const router = useRouter();

  /** 从 useMessage 解构的 Toast / Dialog 能力 */
  const { CreateErrorToast, CreateSuccessToast, CreateConfirmDialog } = useMessage();

  /** 从 useI18n 解构的文案与能力 */
  const { t } = useI18n();

  /** 用户：UserStore */
  const UserStore = useUserStoreWithOut();

  // —— 当前用户、作者身份（用于删评与「作者本人」标）——

  /** 计算属性：用户 */
  const currentUserId = computed(() => {
    /** u */
    const u = (UserStore.getUserInfo ?? {}) as Record<string, unknown>;

    /** id */
    const id = Number(u.uid ?? u.userId ?? u.id);
    return Number.isFinite(id) && id > 0 ? id : 0;
  });

  /** isCommentBySelf */
  const isCommentBySelf = (c: AppMarketingCommentRespVO): boolean => {
    /** 用户或路由 uid：uid */
    const uid = Number(c.userId);
    if (!Number.isFinite(uid) || uid <= 0) return false;
    return currentUserId.value > 0 && uid === currentUserId.value;
  };

  /** isCommentByPostAuthor */
  const isCommentByPostAuthor = (c: AppMarketingCommentRespVO): boolean => {
    /** d */
    const d = detail.value;
    if (!d) return false;

    /** authorId */
    const authorId = Number(d.userId);

    /** 用户或路由 uid：uid */
    const uid = Number(c.userId);
    if (!Number.isFinite(authorId) || authorId <= 0) return false;
    if (!Number.isFinite(uid) || uid <= 0) return false;
    return authorId === uid;
  };

  /** 当前用户是否为帖子作者（可删任意评论） */
  const isPostOwner = computed(() => {
    /** d */
    const d = detail.value;
    if (!d) return false;

    /** authorId */
    const authorId = Number(d.userId);
    if (!Number.isFinite(authorId) || authorId <= 0) return false;
    return currentUserId.value > 0 && authorId === currentUserId.value;
  });

  /** 是否允许某操作：canDeleteComment */
  const canDeleteComment = (c: AppMarketingCommentRespVO): boolean => {
    return isCommentBySelf(c) || isPostOwner.value;
  };

  // —— 详情、评论列表、回复目标、busy 锁 ——

  /** 响应式状态：加载中状态 */
  const loading = ref(true);

  /** 响应式状态：详情 */
  const detail = ref<AppMarketingPostRespVO | null>(null);

  /** 响应式状态：commentDraft 相关 UI 或数据 */
  const commentDraft = ref('');

  /** 响应式状态：comments 相关 UI 或数据 */
  const comments = ref<AppMarketingCommentRespVO[]>([]);

  /** 顶层评论总数（分页接口 data.total） */
  const commentsTotal = ref(0);

  /** 评论列表：首屏与分页加载 */
  const commentsListLoading = ref(false);

  /** 响应式状态：下拉刷新 */
  const commentsRefreshing = ref(false);

  /** 响应式状态：列表是否已全部加载 */
  const commentsFinished = ref(false);

  /** 响应式状态：分页 */
  const commentPageNo = ref(1);

  /** 响应式状态：拉取接口数据 */
  const commentsLoaded = ref(false);

  /** 父评论 id -> 已加载的子评论列表；无键表示未请求过 */
  const replyCache = ref<Record<number, AppMarketingCommentRespVO[]>>({});

  /** 响应式状态：加载中状态 */
  const replyLoadingByParent = ref<Record<number, boolean>>({});

  /** 回复评论时为目标评论 id；null 表示回复帖子 */
  const replyTargetParentId = ref<number | null>(null);

  /** 响应式状态：replyTargetNickname 相关 UI 或数据 */
  const replyTargetNickname = ref('');

  /** 响应式状态：提交中 */
  const commentSubmitting = ref(false);

  /** 帖子点赞（与列表卡片一致，接口同步后写回 detail） */
  const postLiked = ref(false);

  /** 响应式状态：postLikeCount 相关 UI 或数据 */
  const postLikeCount = ref(0);

  /** 响应式状态：加载中状态 */
  const postLikeLoading = ref(false);

  /** 评论点赞防重复：commentId -> busy */
  const commentLikeBusy = ref<Record<number, boolean>>({});

  /** 评论删除中：commentId -> busy */
  const commentDeleteBusy = ref<Record<number, boolean>>({});

  /** 详情页封面视频播放（去掉 CSS pointer-events:none 后需手动切换） */
  const detailCoverVideoRef = ref<HTMLVideoElement | null>(null);

  /** 响应式状态：详情 */
  const detailCoverVideoPlaying = ref(false);

  /** 切换展开/折叠等：toggleDetailCoverVideo */
  const toggleDetailCoverVideo = () => {
    /** el */
    const el = detailCoverVideoRef.value;
    if (!el) return;
    if (el.paused) void el.play().catch(() => {});
    else el.pause();
  };

  /** 计算属性：由其它状态派生的展示或判断 */
  const postId = computed(() => {
    /** id */
    const id = route.query.id;
    if (id == null || id === '') return '';
    return String(id);
  });

  /** 用户：pickUserVipLevel */
  const pickUserVipLevel = (raw: AppMarketingPostRespVO): number | null => {
    /** parse */
    const parse = (v: unknown): number | null => {
      if (v === undefined || v === null || v === '') return null;
      if (typeof v === 'number' && Number.isFinite(v)) return Math.max(0, Math.floor(v));
      const s = String(v).trim();
      if (!s || s === 'null' || s === 'undefined') return null;
      const n = parseInt(s, 10);
      if (!Number.isNaN(n)) return Math.max(0, n);
      const m = s.match(/(\d+)/);
      return m ? Math.max(0, parseInt(m[1], 10)) : null;
    };

    /** r */
    const r = raw as AppMarketingPostRespVO & Record<string, unknown>;

    /** direct */
    const direct = r.userVipLevel ?? r.vipLevel ?? r.userVip ?? r.vip;
    if (direct !== undefined && direct !== null && direct !== '') return parse(direct);

    /** u */
    const u = r.user;
    if (u && typeof u === 'object') {
      const nested =
        (
          u as {
            vipLevel?: unknown;
          }
        ).vipLevel ??
        (
          u as {
            userVipLevel?: unknown;
          }
        ).userVipLevel ??
        (
          u as {
            vip?: unknown;
          }
        ).vip;
      if (nested !== undefined && nested !== null && nested !== '') return parse(nested);
    }
    return null;
  };

  /** 计算属性：用户 */
  const userName = computed(() => detail.value?.userNickname?.trim() || '--');

  /** 计算属性：由其它状态派生的展示或判断 */
  const avatarSrc = computed(() =>
    detail.value?.userAvatar?.trim() ? detail.value.userAvatar : AvatarImg
  );

  /** 计算属性：由其它状态派生的展示或判断 */
  const vipLevel = computed(() => (detail.value ? pickUserVipLevel(detail.value) : null));

  /** 计算属性：由其它状态派生的展示或判断 */
  const timeText = computed(() => formatRelativeTime(detail.value?.createTime) || '--');

  /** 计算属性：由其它状态派生的展示或判断 */
  const tags = computed(() =>
    (detail.value?.tagList ?? [])
      .map((x) => {
        const n = x?.tagName?.trim();
        if (!n) return '';
        return n.startsWith('#') ? n : `#${n}`;
      })
      .filter(Boolean)
  );
  /** 无标题时用正文首段作标题样式展示 */
  const headline = computed(() => {
    /** titleStr */
    const titleStr = detail.value?.title?.trim();

    /** contentStr */
    const contentStr = detail.value?.content?.trim();
    if (titleStr) return titleStr;
    if (contentStr) return contentStr;
    return '';
  });
  const bodyText = computed(() => {
    /** titleStr */
    const titleStr = detail.value?.title?.trim();

    /** contentStr */
    const contentStr = detail.value?.content?.trim();
    if (!titleStr || !contentStr) return '';
    if (contentStr === titleStr) return '';
    return contentStr;
  });
  const commentCount = computed(() => Number(detail.value?.commentCount) || 0);
  watch(
    detail,
    (d) => {
      if (!d) {
        postLiked.value = false;
        postLikeCount.value = 0;
        return;
      }
      postLiked.value = Boolean(d.isLiked);
      postLikeCount.value = Number(d.likeCount) || 0;
    },
    { deep: true, immediate: true }
  );
  const onTogglePostLike =
    // —— 帖子点赞、评论点赞/删 ——
    async () => {
      if (postLikeLoading.value || !detail.value?.id) return;
      const id = Number(detail.value.id);
      if (!Number.isFinite(id) || id <= 0) return;
      postLikeLoading.value = true;
      try {
        const willLike = !postLiked.value;
        const res = willLike ? await likeMarketingPost({ id }) : await unlikeMarketingPost({ id });
        if (isApiSuccess(res) && res.data === true) {
          postLiked.value = willLike;
          postLikeCount.value = Math.max(0, postLikeCount.value + (willLike ? 1 : -1));
          detail.value.isLiked = willLike;
          detail.value.likeCount = postLikeCount.value;
        } else {
          CreateErrorToast(res?.msg || t('od_op_fail'));
        }
      } catch {
        CreateErrorToast(t('cm_network_error'));
      } finally {
        postLikeLoading.value = false;
      }
    };
  const onDeleteComment = async (c: AppMarketingCommentRespVO) => {
    if (!canDeleteComment(c)) return;

    /** id */
    const id = Number(c.id);
    if (!Number.isFinite(id) || id <= 0) return;
    if (commentDeleteBusy.value[id]) return;
    try {
      await CreateConfirmDialog({
        message: t('pd_comment_delete_confirm'),
        confirmButtonText: t('pd_comment_delete'),
        cancelButtonText: t('cancel')
      });
    } catch {
      return;
    }
    commentDeleteBusy.value = { ...commentDeleteBusy.value, [id]: true };
    try {
      const res = await deleteMarketingPostComment({ id });
      if (isApiSuccess(res) && res.data === true) {
        CreateSuccessToast(t('pd_comment_delete_success'));
        if (replyTargetParentId.value === id) clearReplyTarget();
        await fetchCommentPage(true);
        if (postId.value) {
          const dres = await getMarketingPostDetail({ id: postId.value });
          if (isApiSuccess(dres)) detail.value = dres.data;
        }
      } else {
        CreateErrorToast(res?.msg || t('pd_comment_delete_fail'));
      }
    } catch {
      CreateErrorToast(t('cm_network_error'));
    } finally {
      const next = { ...commentDeleteBusy.value };
      delete next[id];
      commentDeleteBusy.value = next;
    }
  };
  const onToggleCommentLike = async (c: AppMarketingCommentRespVO) => {
    /** id */
    const id = Number(c.id);
    if (!Number.isFinite(id) || id <= 0) return;
    if (commentLikeBusy.value[id]) return;
    commentLikeBusy.value = { ...commentLikeBusy.value, [id]: true };
    try {
      const willLike = !c.liked;
      const res = willLike
        ? await likeMarketingPostComment({ id })
        : await unlikeMarketingPostComment({ id });
      if (isApiSuccess(res) && res.data === true) {
        c.liked = willLike;
        c.likeCount = Math.max(0, (Number(c.likeCount) || 0) + (willLike ? 1 : -1));
      } else {
        CreateErrorToast(res?.msg || t('od_op_fail'));
      }
    } catch {
      CreateErrorToast(t('cm_network_error'));
    } finally {
      const next = { ...commentLikeBusy.value };
      delete next[id];
      commentLikeBusy.value = next;
    }
  };
  const commentFieldPlaceholder = computed(() => {
    if (replyTargetParentId.value != null) {
      const name = replyTargetNickname.value.trim() || t('pd_user_fallback');
      return t('pd_reply_line', [name]);
    }
    return t('pd_placeholder_civil');
  });
  const replyHintLine = computed(() =>
    t('pd_reply_line', [replyTargetNickname.value.trim() || t('pd_user_fallback')])
  );
  const clearReplyTarget = () => {
    replyTargetParentId.value = null;
    replyTargetNickname.value = '';
  };
  const onReplyToComment = (c: AppMarketingCommentRespVO) => {
    replyTargetParentId.value = Number(c.id);
    replyTargetNickname.value = c.userNickname?.trim() || '--';
  };
  // —— 顶层评论排序、子回复缓存与展开 ——
  /** 顶层评论列表（接口 parentCommentId=0） */
  const rootComments = computed(() => {
    /** 常量或静态配置：列表数据 */
    const list = [...comments.value];
    list.sort((a, b) => {
      const ta = a.createTime ? new Date(a.createTime).getTime() : 0;
      const tb = b.createTime ? new Date(b.createTime).getTime() : 0;
      if (ta !== tb) return ta - tb;
      return Number(a.id) - Number(b.id);
    });
    return list;
  });
  const repliesOf = (parentId: number): AppMarketingCommentRespVO[] => {
    /** pid */
    const pid = Number(parentId);

    /** raw */
    const raw = replyCache.value[pid];
    if (!raw?.length) return [];

    /** 常量或静态配置：列表数据 */
    const list = [...raw];
    list.sort((a, b) => {
      const ta = a.createTime ? new Date(a.createTime).getTime() : 0;
      const tb = b.createTime ? new Date(b.createTime).getTime() : 0;
      if (ta !== tb) return ta - tb;
      return Number(a.id) - Number(b.id);
    });
    return list;
  };
  const hasLoadedReplies = (parentId: number): boolean => {
    return Object.prototype.hasOwnProperty.call(replyCache.value, Number(parentId));
  };
  const commentHasThread = (c: AppMarketingCommentRespVO): boolean => {
    if (c.hasReplies === true) return true;

    /** n */
    const n = Number(c.replyCount) || 0;
    if (n > 0) return true;
    return repliesOf(c.id).length > 0;
  };
  const expandedReplyIds = ref<Record<number, boolean>>({});
  const isRepliesExpanded = (id: number): boolean => {
    return !!expandedReplyIds.value[id];
  };
  const toggleReplyExpand = (id: number) => {
    expandedReplyIds.value = { ...expandedReplyIds.value, [id]: !expandedReplyIds.value[id] };
  };
  const fetchRepliesForParent = async (parentId: number) => {
    /** id */
    const id = Number(parentId);
    replyLoadingByParent.value = { ...replyLoadingByParent.value, [id]: true };
    try {
      const res = await getPostCommentReplies({
        parentCommentId: id,
        pageNo: 1,
        pageSize: REPLY_PAGE_SIZE
      });
      if (isApiSuccess(res)) {
        replyCache.value = { ...replyCache.value, [id]: [...(res.data.list ?? [])] };
      } else {
        replyCache.value = { ...replyCache.value, [id]: [] };
      }
    } catch {
      // 不写入 cache，下次展开可重试
    } finally {
      replyLoadingByParent.value = { ...replyLoadingByParent.value, [id]: false };
    }
  };
  const onReplyCountClick = async (c: AppMarketingCommentRespVO) => {
    if (!commentHasThread(c)) return;

    /** id */
    const id = Number(c.id);
    if (isRepliesExpanded(id)) {
      toggleReplyExpand(id);
      return;
    }
    if (!hasLoadedReplies(id)) {
      await fetchRepliesForParent(id);
    }
    expandedReplyIds.value = { ...expandedReplyIds.value, [id]: true };
  };
  const submitComment = async () => {
    /** text */
    const text = commentDraft.value.trim();
    if (!text) {
      CreateErrorToast(t('pd_enter_comment'));
      return;
    }
    if (!postId.value) return;
    commentSubmitting.value = true;

    /** parentId */
    const parentId = replyTargetParentId.value;
    try {
      const res = await createPostComment({
        postId: Number(postId.value),
        content: text,
        ...(parentId != null && parentId > 0 ? { parentCommentId: parentId } : {})
      });
      if (isApiSuccess(res)) {
        CreateSuccessToast(t('pd_send_success'));
        commentDraft.value = '';
        clearReplyTarget();
        await fetchCommentPage(true);
        const dres = await getMarketingPostDetail({ id: postId.value });
        if (isApiSuccess(dres)) {
          detail.value = dres.data;
        }
      } else {
        CreateErrorToast(res?.msg || t('pd_send_fail'));
      }
    } catch {
      CreateErrorToast(t('cm_network_error'));
    } finally {
      commentSubmitting.value = false;
    }
  };
  /** 标题展示条数：分页 total，否则用帖子上的统计 */
  const commentTitleCount = computed(() =>
    commentsLoaded.value ? commentsTotal.value : commentCount.value
  );
  const commentAvatar = (c: AppMarketingCommentRespVO): string => {
    return c.userAvatar?.trim() ? c.userAvatar : AvatarImg;
  };
  /** 与列表 CommunityPostCard / communityPostDisplay 一致 */
  const displayPost = computed<CommunityPostItem | null>(() =>
    detail.value ? mapPostToDisplay(detail.value) : null
  );
  const isImageGallery = computed(
    () =>
      displayPost.value != null &&
      displayPost.value.postType === 2 &&
      (displayPost.value.galleryImages?.length ?? 0) > 0
  );
  const isGallerySingle = computed(
    () => isImageGallery.value && (displayPost.value?.galleryImages?.length ?? 0) === 1
  );
  const galleryCells = computed(() => {
    /** post */
    const post = displayPost.value;
    if (!post)
      return [] as Array<{
        url: string;
        startIndex: number;
        moreCount?: number;
      }>;

    /** imgs */
    const imgs = post.galleryImages ?? [];

    /** n */
    const n = imgs.length;
    if (!n) return [];

    /** maxCells */
    const maxCells = 6;

    /** count */
    const count = Math.min(maxCells, n);

    /** cells */
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
  const openGalleryPreview = (startIndex: number) => {
    /** images */
    const images = displayPost.value?.galleryImages ?? [];
    if (!images.length) return;
    showImagePreview({
      images,
      startPosition: startIndex,
      closeOnPopstate: true
    });
  };
  const hasVideoCover = computed(
    () =>
      displayPost.value != null &&
      !isImageGallery.value &&
      !!(displayPost.value.coverUrl && displayPost.value.coverIsVideo)
  );
  const hasMediaContent = computed(() => isImageGallery.value || !!displayPost.value?.coverUrl);
  const detailMediaClass = computed(() => ({
    'post-detail-page__media--dark': !hasMediaContent.value,
    'post-detail-page__media--video': hasVideoCover.value,
    'post-detail-page__media--gallery': isImageGallery.value
  }));
  /** 暂停时显示中央播放钮，播放中隐藏 */
  const showDetailCoverPlayBadge = computed(
    () => !!(displayPost.value?.showPlay && hasVideoCover.value && !detailCoverVideoPlaying.value)
  );
  const fetchCommentPage =
    // —— 评论分页、刷新、首屏详情 ——
    async (reset: boolean) => {
      if (!postId.value) return;
      // 注意：List 触发 @load 时会先把 v-model:loading 置为 true，不能在此处因 loading 而 return，否则上拉永远不会请求下一页
      if (reset) {
        commentPageNo.value = 1;
        commentsFinished.value = false;
        comments.value = [];
        commentsTotal.value = 0;
        expandedReplyIds.value = {};
        replyCache.value = {};
        replyLoadingByParent.value = {};
        commentsLoaded.value = false;
      }
      commentsListLoading.value = true;
      try {
        const page = reset ? 1 : commentPageNo.value;
        const res = await getPostCommentPage({
          postId: postId.value,
          parentCommentId: 0,
          pageNo: page,
          pageSize: COMMENT_PAGE_SIZE
        });
        if (isApiSuccess(res)) {
          const list = res.data.list ?? [];
          const total = Number(res.data.total) || 0;
          commentsTotal.value = total;
          if (reset) {
            comments.value = list;
          } else {
            comments.value = [...comments.value, ...list];
          }
          const len = comments.value.length;
          commentsFinished.value = (total > 0 && len >= total) || list.length < COMMENT_PAGE_SIZE;
          if (!commentsFinished.value) {
            commentPageNo.value = page + 1;
          }
        } else {
          if (reset) {
            comments.value = [];
            commentsTotal.value = 0;
          }
          commentsFinished.value = true;
        }
      } catch {
        if (reset) {
          comments.value = [];
          commentsTotal.value = 0;
        }
        commentsFinished.value = true;
      } finally {
        commentsListLoading.value = false;
        commentsLoaded.value = true;
      }
    };
  const onCommentsRefresh = async () => {
    try {
      await fetchCommentPage(true);
      if (postId.value) {
        const dres = await getMarketingPostDetail({ id: postId.value });
        if (isApiSuccess(dres)) detail.value = dres.data;
      }
    } finally {
      commentsRefreshing.value = false;
    }
  };
  const onCommentsLoadMore = () => {
    if (commentsFinished.value || commentsRefreshing.value) return;
    void fetchCommentPage(false);
  };
  const loadDetail = async () => {
    if (!postId.value) {
      CreateErrorToast(t('pd_missing_post'));
      router.back();
      return;
    }
    loading.value = true;
    detail.value = null;
    comments.value = [];
    commentsTotal.value = 0;
    replyCache.value = {};
    replyLoadingByParent.value = {};
    clearReplyTarget();
    commentsLoaded.value = false;
    try {
      const res = await getMarketingPostDetail({ id: postId.value });
      if (!isApiSuccess(res)) {
        CreateErrorToast(res?.msg || t('pd_load_fail'));
        return;
      }
      detail.value = res.data;
      void fetchCommentPage(true);
    } catch {
      CreateErrorToast(t('cm_network_error'));
    } finally {
      loading.value = false;
    }
  };
  const onReport = () => {
    /** id */
    const id = postId.value;
    if (!id) return;
    router.push({ name: 'Report', query: { id: String(id) } }).catch(() => {});
  };
  watch(
    () => detail.value?.id,
    () => {
      detailCoverVideoPlaying.value = false;
      const el = detailCoverVideoRef.value;
      if (el) {
        el.pause();
        el.currentTime = 0;
      }
    }
  );
  onMounted(() => {
    void loadDetail();
  });
  watch(postId, (id, prev) => {
    if (id && prev !== undefined && id !== prev) void loadDetail();
  });
</script>

<style scoped lang="less">
  /* 结构：壳层 → 导航 → 帖子卡片 → 评论区 → 底部输入 */

  @bg: #050917;
  @card: #111827;
  @accent: #4db3ff;

  .post-detail-shell {
    min-height: 100vh;
    background: @bg;
  }

  .post-detail-page__navbar {
    :deep(.van-nav-bar) {
      background: @bg;
    }

    :deep(.van-nav-bar__title) {
      font-size: 0.36rem;
      font-weight: 700;
      color: #fff;
    }

    :deep(.van-nav-bar .van-icon) {
      color: #fff;
    }
  }

  .post-detail-page {
    background: @bg;
    color: #fff;
    padding-bottom: 0;
    min-height: calc(100vh - 1.2rem);
  }

  .post-detail-page__loading {
    display: flex;
    justify-content: center;
    padding: 1.2rem 0;
  }

  .post-detail-page__loading :deep(.van-loading__text) {
    color: rgba(255, 255, 255, 0.55);
  }

  .post-detail-page__empty {
    text-align: center;
    padding: 1rem;
    color: rgba(255, 255, 255, 0.45);
    font-size: 0.28rem;
  }

  .post-detail-page__card {
    margin: 0.32rem;
    padding: 0.32rem 0.28rem;
    border-radius: 0.2rem;
    background: @card;
    border: 1px solid rgba(255, 255, 255, 0.06);
    box-shadow: 0 0.06rem 0.2rem rgba(0, 0, 0, 0.35);
  }

  .post-detail-page__head {
    display: flex;
    align-items: flex-start;
    gap: 0.2rem;
    margin-bottom: 0.16rem;
  }

  .post-detail-page__avatar {
    width: 0.72rem;
    height: 0.72rem;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
    border: 1px solid rgba(255, 255, 255, 0.12);
  }

  .post-detail-page__meta {
    flex: 1;
    min-width: 0;
  }

  .post-detail-page__meta-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.16rem;
  }

  .post-detail-page__name-block {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.08rem;
    min-width: 0;
  }

  .post-detail-page__name-text {
    font-size: 0.28rem;
    font-weight: 600;
    color: #fff;
    line-height: 1.3;
  }

  .post-detail-page__badge {
    font-size: 0.2rem;
    padding: 0.02rem 0.1rem;
    border-radius: 0.06rem;
    background: linear-gradient(90deg, #1e5a9e, #0a7ee8);
    color: #fff;
    font-weight: 600;
  }

  .post-detail-page__time {
    flex-shrink: 0;
    font-size: 0.22rem;
    color: rgba(255, 255, 255, 0.45);
  }

  .post-detail-page__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.12rem;
    margin-bottom: 0.16rem;
  }

  .post-detail-page__tag {
    font-size: 0.22rem;
    padding: 0.06rem 0.14rem;
    border-radius: 0.08rem;
    background: rgba(15, 75, 85, 0.75);
    color: #5eead4;
    font-weight: 500;
  }

  .post-detail-page__tag:nth-child(2) {
    background: rgba(65, 45, 110, 0.65);
    color: #c4b5fd;
  }

  .post-detail-page__title {
    font-size: 0.3rem;
    font-weight: 600;
    color: #fff;
    line-height: 1.45;
    margin-bottom: 0.12rem;
  }

  .post-detail-page__content {
    font-size: 0.28rem;
    color: rgba(255, 255, 255, 0.88);
    line-height: 1.55;
    margin-bottom: 0.16rem;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .post-detail-page__media {
    position: relative;
    min-height: 2.8rem;
    border-radius: 0.16rem;
    overflow: hidden;
    margin-bottom: 0.16rem;
    background: #050810;
  }

  .post-detail-page__media--gallery {
    min-height: 0;
    height: auto;
    overflow: visible;
  }

  .post-detail-page__gallery {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.08rem;
    width: 100%;
  }

  .post-detail-page__gallery--single {
    grid-template-columns: 1fr;
  }

  .post-detail-page__gallery-cell {
    position: relative;
    aspect-ratio: 1;
    border-radius: 0.08rem;
    overflow: hidden;
    background: #050810;
    cursor: pointer;
  }

  .post-detail-page__gallery-cell :deep(.van-image) {
    width: 100%;
    height: 100%;
    display: block;
  }

  .post-detail-page__gallery--single .post-detail-page__gallery-cell {
    aspect-ratio: auto;
    width: 100%;
    height: 2.8rem;
  }

  .post-detail-page__gallery-more {
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

  .post-detail-page__media--empty {
    min-height: 0;
    margin-bottom: 0;
  }

  .post-detail-page__cover {
    display: block;
    width: 100%;
    min-height: 2.8rem;
    height: auto;
    max-height: 5rem;
  }

  .post-detail-page__cover--video {
    position: relative;
    z-index: 0;
    object-fit: cover;
    background: #000;
    cursor: pointer;
    max-height: 5rem;
  }

  .post-detail-page__media :deep(.van-image) {
    width: 100%;
    min-height: 2.8rem;
  }

  .post-detail-page__media :deep(.van-image__img) {
    min-height: 2.8rem;
    object-fit: cover;
  }

  .post-detail-page__play-btn {
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

  .post-detail-page__play-tri {
    display: block;
    width: 0;
    height: 0;
    border-style: solid;
    border-width: 0.14rem 0 0.14rem 0.22rem;
    border-color: transparent transparent transparent #1a2338;
    margin-left: 0.05rem;
  }

  .post-detail-page__foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 0.04rem;
  }

  .post-detail-page__report {
    display: inline-flex;
    align-items: center;
    gap: 0.06rem;
    margin: 0;
    padding: 0;
    border: none;
    font: inherit;
    color: inherit;
    background: transparent;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  .post-detail-page__report-text {
    font-size: 0.24rem;
    color: rgba(255, 255, 255, 0.55);
  }

  .post-detail-page__stats {
    display: flex;
    align-items: center;
    gap: 0.32rem;
  }

  .post-detail-page__stat {
    display: inline-flex;
    align-items: center;
    gap: 0.08rem;
    font-size: 0.24rem;
    color: rgba(255, 255, 255, 0.88);
  }

  .post-detail-page__stat--like {
    cursor: pointer;
    user-select: none;
  }

  .post-detail-page__stat--like:active {
    opacity: 0.85;
  }

  .post-detail-page__stat--liked {
    color: #ff6b9d;
  }

  .post-detail-page__comments-wrap {
    margin: 0 0.32rem 0.24rem;
    padding: 0.24rem 0.28rem;
    border-radius: 0.2rem;
    background: @card;
    border: 1px solid rgba(255, 255, 255, 0.06);
  }

  .post-detail-page__cmt-refresh {
    :deep(.van-pull-refresh__track) {
      min-height: 1.2rem;
    }
  }

  .post-detail-page__comments-title {
    font-size: 0.28rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
  }

  .post-detail-page__cmt-loading {
    font-size: 0.24rem;
    color: rgba(255, 255, 255, 0.45);
    padding: 0.2rem 0 0;
  }

  .post-detail-page__cmt-list {
    margin-top: 0.16rem;

    :deep(.van-list__finished-text),
    :deep(.van-list__loading) {
      color: rgba(255, 255, 255, 0.45);
    }
  }

  .post-detail-page__cmt-empty {
    font-size: 0.24rem;
    color: rgba(255, 255, 255, 0.4);
    padding: 0.12rem 0 0;
  }

  .post-detail-page__cmt-thread + .post-detail-page__cmt-thread {
    margin-top: 0.24rem;
    padding-top: 0.24rem;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }

  .post-detail-page__cmt {
    display: flex;
    gap: 0.16rem;
  }

  .post-detail-page__cmt-replies {
    margin-top: 0.16rem;
    margin-left: 0.04rem;
    padding-left: 0.28rem;
    border-left: 2px solid rgba(77, 179, 255, 0.28);
  }

  .post-detail-page__cmt-replies--nested {
    margin-top: 0.12rem;
    margin-left: 0;
    padding-left: 0.24rem;
    border-left: 2px solid rgba(255, 255, 255, 0.1);
  }

  .post-detail-page__cmt-replies-loading {
    font-size: 0.24rem;
    color: rgba(255, 255, 255, 0.45);
    padding: 0.16rem 0 0.08rem;
  }

  .post-detail-page__cmt-replies
    > .post-detail-page__cmt-reply-group
    + .post-detail-page__cmt-reply-group {
    margin-top: 0.16rem;
    padding-top: 0.16rem;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }

  .post-detail-page__cmt--reply {
    padding-left: 0.12rem;
  }

  .post-detail-page__cmt--reply-deep {
    opacity: 0.98;
  }

  .post-detail-page__cmt-avatar {
    width: 0.56rem;
    height: 0.56rem;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .post-detail-page__cmt-main {
    flex: 1;
    min-width: 0;
  }

  .post-detail-page__cmt-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.12rem;
    margin-bottom: 0.06rem;
  }

  .post-detail-page__cmt-name-row {
    display: inline-flex;
    align-items: center;
    gap: 0.1rem;
    min-width: 0;
  }

  .post-detail-page__cmt-name {
    font-size: 0.26rem;
    font-weight: 600;
    color: #fff;
  }

  .post-detail-page__cmt-author {
    flex-shrink: 0;
    font-size: 0.2rem;
    font-weight: 600;
    padding: 0.02rem 0.1rem;
    border-radius: 0.06rem;
    background: rgba(245, 158, 11, 0.22);
    color: #fbbf24;
    line-height: 1.2;
  }

  .post-detail-page__cmt-self {
    flex-shrink: 0;
    font-size: 0.2rem;
    font-weight: 600;
    padding: 0.02rem 0.1rem;
    border-radius: 0.06rem;
    background: rgba(77, 179, 255, 0.22);
    color: @accent;
    line-height: 1.2;
  }

  .post-detail-page__cmt-time {
    font-size: 0.2rem;
    color: rgba(255, 255, 255, 0.4);
    flex-shrink: 0;
  }

  .post-detail-page__cmt-text {
    font-size: 0.26rem;
    color: rgba(255, 255, 255, 0.88);
    line-height: 1.5;
    word-break: break-word;
  }

  .post-detail-page__cmt-actions {
    display: flex;
    align-items: center;
    gap: 0.28rem;
    margin-top: 0.1rem;
  }

  .post-detail-page__cmt-act {
    display: inline-flex;
    align-items: center;
    gap: 0.06rem;
    font-size: 0.22rem;
    color: rgba(255, 255, 255, 0.55);
  }

  .post-detail-page__cmt-act--like {
    cursor: pointer;
    user-select: none;
  }

  .post-detail-page__cmt-act--like:active {
    opacity: 0.85;
  }

  .post-detail-page__cmt-act--liked {
    color: #ff6b9d;
  }

  .post-detail-page__cmt-act--reply {
    cursor: pointer;
    color: rgba(255, 255, 255, 0.72);
  }

  .post-detail-page__cmt-act--reply:active {
    opacity: 0.85;
  }

  .post-detail-page__cmt-act--muted {
    cursor: default;
    pointer-events: none;
    opacity: 0.42;
  }

  .post-detail-page__cmt-act--replyto {
    cursor: pointer;
    color: @accent;
    font-size: 0.22rem;
  }

  .post-detail-page__cmt-act--replyto:active {
    opacity: 0.85;
  }

  .post-detail-page__cmt-act--delete {
    cursor: pointer;
    color: rgba(245, 108, 108, 0.95);
  }

  .post-detail-page__cmt-act--delete:active {
    opacity: 0.85;
  }

  .post-detail-page__cmt-act--busy {
    pointer-events: none;
    opacity: 0.45;
  }

  .post-detail-page__bottom-spacer {
    height: calc(1.2rem + env(safe-area-inset-bottom));
  }

  .post-detail-page__input-bar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 100;
    padding: 0.2rem 0.32rem calc(0.2rem + env(safe-area-inset-bottom));
    background: linear-gradient(180deg, rgba(5, 9, 23, 0.92) 0%, @bg 40%);
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    box-sizing: border-box;
  }

  .post-detail-page__reply-hint {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.24rem;
    margin-bottom: 0.16rem;
    padding: 0 0.04rem;
    font-size: 0.24rem;
    color: rgba(255, 255, 255, 0.55);
  }

  .post-detail-page__reply-hint-text {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .post-detail-page__reply-hint-cancel {
    flex-shrink: 0;
    color: @accent;
    cursor: pointer;
  }

  .post-detail-page__input-row {
    display: flex;
    align-items: flex-end;
    gap: 0.2rem;
  }

  .post-detail-page__field {
    flex: 1;
    min-width: 0;
    margin: 0;
    padding: 0.18rem 0.28rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .post-detail-page__send-btn {
    flex-shrink: 0;
    height: 0.72rem;
    padding: 0 0.28rem;
    border-radius: 999px;
    font-size: 0.26rem;
  }

  .post-detail-page__field :deep(.van-field__control) {
    color: rgba(255, 255, 255, 0.92);
    font-size: 0.28rem;
    line-height: 1.4;
  }

  .post-detail-page__field :deep(.van-field__control::placeholder) {
    color: rgba(255, 255, 255, 0.35);
  }
</style>
