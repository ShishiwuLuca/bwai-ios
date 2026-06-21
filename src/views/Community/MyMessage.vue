<template>
  <div class="message-page-shell">
    <NavBar
      :title="batchMode ? t('msg_nav_select') : t('str_my_message')"
      left-arrow
      fixed
      placeholder
      :border="false"
      class="message-page__navbar"
      @click-left="onNavLeftClick"
    >
      <template #right>
        <span
          v-if="list.length > 0 && !batchMode"
          class="message-page__nav-action"
          @click="enterBatchMode"
          >{{ t('msg_batch') }}</span
        >
        <span
          v-else-if="batchMode"
          class="message-page__nav-action message-page__nav-action--muted"
          @click="exitBatchMode"
          >{{ t('cancel') }}</span
        >
      </template>
    </NavBar>
    <PageWrap class="message-page" :class="{ 'message-page--batch': batchMode }">
      <PullRefresh
        v-model="refreshing"
        class="message-page__pull"
        :class="{ 'message-page__pull--refreshing': refreshing }"
        @refresh="onRefresh"
      >
        <List
          v-model:loading="feedLoading"
          :finished="feedFinished"
          :immediate-check="true"
          :loading-text="refreshing ? ' ' : undefined"
          :finished-text="t('no_more')"
          class="message-page__list-wrap"
          @load="onLoad"
        >
          <div class="message-page__list">
            <MessageSwipeRow
              v-for="item in list"
              :key="item.rowKey"
              :conversation-id="item.conversationId"
              :instance-key="item.rowKey"
              :show-read-action="rowShowsUnread(item)"
              :disable-swipe="batchMode"
              class="message-page__row-wrap"
              @open="onRowOpen(item)"
              @read="onMarkRead(item)"
              @remove="onDeleteConversation(item)"
            >
              <div
                class="message-page__item"
                :class="{
                  'message-page__item--unread': rowShowsUnread(item),
                  'message-page__item--batch': batchMode,
                  'message-page__item--selected': batchMode && selectedRowKeys.includes(item.rowKey)
                }"
                role="button"
                tabindex="0"
              >
                <div v-if="batchMode" class="message-page__batch-check" @click.stop>
                  <Checkbox
                    :model-value="selectedRowKeys.includes(item.rowKey)"
                    :disabled="!canSelectForBatch(item)"
                    shape="square"
                    icon-size="18px"
                    @update:model-value="(v) => onRowCheckChange(item, Boolean(v))"
                  />
                </div>
                <div class="message-page__avatar-wrap">
                  <Badge
                    v-if="rowShowsUnread(item)"
                    :content="item.unread"
                    max="99"
                    position="top-right"
                    :offset="[0, 2]"
                    class="message-page__badge"
                  >
                    <VanImage
                      :src="item.avatar || defaultAvatar"
                      class="message-page__avatar"
                      width="100%"
                      height="100%"
                      fit="cover"
                    />
                  </Badge>
                  <VanImage
                    v-else
                    :src="item.avatar || defaultAvatar"
                    class="message-page__avatar"
                    width="100%"
                    height="100%"
                    fit="cover"
                  />
                </div>
                <div class="message-page__body">
                  <div class="message-page__row-top">
                    <span class="message-page__name">{{ item.name }}</span>
                    <span class="message-page__time">{{ item.time }}</span>
                  </div>
                  <div class="message-page__preview">{{ item.preview }}</div>
                </div>
              </div>
            </MessageSwipeRow>
          </div>
          <Empty
            v-if="list.length === 0 && feedFinished && !feedLoading"
            image="search"
            class="message-page__empty"
            :description="t('sd_no_data')"
          />
        </List>
      </PullRefresh>
    </PageWrap>

    <Transition name="message-batch-bar">
      <div v-if="batchMode" class="message-page__batch-bar">
        <div class="message-page__batch-bar-inner">
          <div class="message-page__batch-meta message-page__batch-meta--solo">
            <span class="message-page__batch-count">{{
              t('msg_batch_selected', [selectedEligibleCount])
            }}</span>
            <span v-if="selectableCount > 0" class="message-page__batch-tip">{{
              t('msg_batch_read_hint', [selectableCount])
            }}</span>
          </div>
          <button
            type="button"
            class="message-page__batch-submit"
            :disabled="selectedEligibleCount === 0"
            @click="onBatchMarkRead"
          >
            {{ t('msg_mark_as_read') }}
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue';
  import { NavBar, PageWrap } from '/@/components';
  import { Badge, Image as VanImage, PullRefresh, Empty, List, Checkbox } from 'vant';
  import {
    getPrivateMessageNotificationsPage,
    markPrivateMessagesReadBatch,
    deletePrivateConversation,

    /** AppPrivateConversationRespVO：类型别名 */
    type AppPrivateConversationRespVO
  } from '/@/service/MarketingPost';
  import MessageSwipeRow from './MessageSwipeRow.vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { isApiSuccess } from '/@/utils/apiResult';
  import defaultAvatar from '/@/assets/avatar.png';

  /** 从 useI18n 解构的文案与能力 */
  const { t } = useI18n();

  /** 从 useMessage 解构的 Toast / Dialog 能力 */
  const { CreateErrorToast, CreateSuccessToast, CreateConfirmDialog } = useMessage();

  // —— 会话列表：分页、代次丢弃、批量已读 ——

  /** PAGE_SIZE */
  const PAGE_SIZE = 10;

  /** 列表行（由接口映射后用于展示） */
  export type MessageRow = {
    /** 行唯一键（同一会话可能多条通知，不能用 conversationId 作唯一选中） */
    rowKey: string;
    conversationId: string;
    otherUserId?: number;
    /** 批量已读接口所需，对应会话最后一条消息 ID */
    lastMessageId?: number;
    name: string;
    preview: string;
    time: string;
    avatar?: string;
    unread: number;
    /** 后端未读标记；为 false 时视为已读，不展示红点与角标 */
    hasUnreadMessage?: boolean;
  };

  /** 响应式状态：列表数据 */
  const list = ref<MessageRow[]>([]);

  /** 响应式状态：分页 */
  const feedPageNo = ref(1);

  /** 响应式状态：加载中状态 */
  const feedLoading = ref(false);

  /** 响应式状态：列表是否已全部加载 */
  const feedFinished = ref(false);

  /** 响应式状态：下拉刷新 */
  const refreshing = ref(false);

  /** 响应式状态：拉取接口数据 */
  const listFetchGeneration = ref(0);

  /** 响应式状态：appendInFlight 相关 UI 或数据 */
  const appendInFlight = ref(false);

  /** 批量标已读：多选模式（存 rowKey，勿用 conversationId） */
  const batchMode = ref(false);

  /** 响应式状态：selectedRowKeys 相关 UI 或数据 */
  const selectedRowKeys = ref<string[]>([]);

  /** 显隐控制：rowShowsUnread */
  const rowShowsUnread = (item: MessageRow): boolean => {
    if (item.hasUnreadMessage === false) return false;
    return item.unread > 0;
  };

  /** 是否允许某操作：canSelectForBatch */
  const canSelectForBatch = (item: MessageRow): boolean => {
    if (item.hasUnreadMessage === false) return false;
    return item.unread > 0 && item.lastMessageId != null && Number(item.lastMessageId) > 0;
  };

  /** 计算属性：Tab 状态 */
  const selectableRowKeys = computed(() =>
    list.value.filter((i) => canSelectForBatch(i)).map((i) => i.rowKey)
  );

  /** 计算属性：Tab 状态 */
  const selectableCount = computed(() => selectableRowKeys.value.length);

  /** 计算属性：由其它状态派生的展示或判断 */
  const selectedEligibleCount = computed(
    () => selectedRowKeys.value.filter((k) => selectableRowKeys.value.includes(k)).length
  );

  /** enterBatchMode */
  const enterBatchMode = () => {
    if (selectableCount.value === 0) {
      CreateErrorToast(t('msg_no_unread'));
      return;
    }
    batchMode.value = true;
    /** 不默认全选，仅通过每行左侧方框逐条勾选 */
    selectedRowKeys.value = [];
  };

  /** exitBatchMode */
  const exitBatchMode = () => {
    batchMode.value = false;
    selectedRowKeys.value = [];
  };

  /** 事件或回调处理：onNavLeftClick */
  const onNavLeftClick = () => {
    if (batchMode.value) {
      exitBatchMode();
      return;
    }
    history.back();
  };

  /** 事件或回调处理：onRowCheckChange */
  const onRowCheckChange = (item: MessageRow, checked: boolean) => {
    if (!batchMode.value) return;
    if (!canSelectForBatch(item)) return;

    /** 键名或缓存键：key */
    const key = item.rowKey;

    /** i */
    const i = selectedRowKeys.value.indexOf(key);
    if (checked) {
      if (i < 0) selectedRowKeys.value.push(key);
    } else if (i >= 0) {
      selectedRowKeys.value.splice(i, 1);
    }
  };

  /** 事件或回调处理：onRowOpen */
  const onRowOpen = (item: MessageRow) => {
    if (batchMode.value) return;
    goChat(item);
  };

  /** 事件或回调处理（onBatchMarkRead） */
  const onBatchMarkRead = async () => {
    /** 常量或静态配置：ids */
    const ids: number[] = [];
    for (const rk of selectedRowKeys.value) {
      const row = list.value.find((p) => p.rowKey === rk);
      const mid = row?.lastMessageId;
      if (mid != null && Number(mid) > 0) ids.push(Number(mid));
    }
    if (!ids.length) {
      CreateErrorToast(t('msg_pick_to_mark'));
      return;
    }
    try {
      const res = await markPrivateMessagesReadBatch({ messageIds: ids });
      if (isApiSuccess(res) && res.data === true) {
        for (const rk of selectedRowKeys.value) {
          const row = list.value.find((p) => p.rowKey === rk);
          if (row) {
            row.unread = 0;
            row.hasUnreadMessage = false;
          }
        }
        CreateSuccessToast(t('msg_mark_read_done'));
        exitBatchMode();
      } else {
        CreateErrorToast(res?.msg || t('od_op_fail'));
      }
    } catch {
      CreateErrorToast(t('apiRequestFailed'));
    }
  };

  /** 格式化展示：formatConversationTime */
  const formatConversationTime = (raw: string | undefined): string => {
    if (raw == null || String(raw).trim() === '') return '';

    /** d */
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return String(raw).trim();

    /** m */
    const m = String(d.getMonth() + 1).padStart(2, '0');

    /** day */
    const day = String(d.getDate()).padStart(2, '0');

    /** hh */
    const hh = String(d.getHours()).padStart(2, '0');

    /** mm */
    const mm = String(d.getMinutes()).padStart(2, '0');

    /** ss */
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${m}-${day} ${hh}:${mm}:${ss}`;
  };
  const previewFromApi = (row: AppPrivateConversationRespVO): string => {
    /** c */
    const c = String(row.lastMessageContent ?? '').trim();
    if (c) return c;

    /** mt */
    const mt = row.lastMessageType;
    if (mt === 2) return t('msg_preview_like');
    if (mt === 3) return t('msg_preview_comment');
    return '';
  };
  const mapConversation = (
    row: AppPrivateConversationRespVO,
    listIndex: number
  ): MessageRow | null => {
    /** id */
    const id = String(row.conversationId ?? '').trim();
    if (!id) return null;

    /** unread */
    const unread = Math.max(0, Number(row.unreadCount) || 0);

    /** lastMid */
    const lastMid = row.lastMessageId;

    /** 提示与弹窗：lastMessageId */
    const lastMessageId =
      lastMid != null && Number(lastMid) > 0 ? Math.floor(Number(lastMid)) : undefined;
    /** 同一会话、同一人可能多行，必须按行唯一 */
    const rowKey = `${id}::${lastMessageId ?? 'na'}::${listIndex}`;
    return {
      rowKey,
      conversationId: id,
      otherUserId: row.otherUserId,
      lastMessageId,
      name: String(row.otherUserNickname ?? '').trim() || '--',
      preview: previewFromApi(row),
      time: formatConversationTime(row.lastMessageTime),
      avatar: row.otherUserAvatar?.trim() || undefined,
      unread,
      hasUnreadMessage: row.hasUnreadMessage
    };
  };
  const fetchNotifications = async (reset: boolean, skipListLoading = false) => {
    if (!reset && feedFinished.value) {
      if (!skipListLoading) feedLoading.value = false;
      return;
    }
    if (reset) {
      listFetchGeneration.value += 1;
      appendInFlight.value = false;
      feedPageNo.value = 1;
      list.value = [];
      feedFinished.value = false;
    } else if (appendInFlight.value) {
      if (!skipListLoading) feedLoading.value = false;
      return;
    }

    /** myGeneration */
    const myGeneration = listFetchGeneration.value;
    if (!reset) appendInFlight.value = true;
    if (!skipListLoading) feedLoading.value = true;
    try {
      const res = await getPrivateMessageNotificationsPage({
        pageNo: feedPageNo.value,
        pageSize: PAGE_SIZE
      });
      if (myGeneration !== listFetchGeneration.value) return;
      if (!isApiSuccess(res) || res.data == null) {
        feedFinished.value = true;
        if (reset) list.value = [];
        if (res?.msg) CreateErrorToast(res.msg);
        return;
      }
      const rawList = res.data.list ?? [];
      const total = Number(res.data.total) || 0;
      const prevLen = list.value.length;
      const baseIndex = reset ? 0 : prevLen;
      const mapped = rawList
        .map((row, idx) => mapConversation(row, baseIndex + idx))
        .filter((x): x is MessageRow => x != null);
      list.value = reset ? mapped : [...list.value, ...mapped];
      const added = list.value.length - prevLen;
      const noMore =
        rawList.length === 0 ||
        rawList.length < PAGE_SIZE ||
        (total > 0 && list.value.length >= total) ||
        (!reset && mapped.length > 0 && added === 0);
      feedFinished.value = noMore;
      if (!noMore) feedPageNo.value += 1;
    } catch {
      feedFinished.value = true;
      if (reset) list.value = [];
      CreateErrorToast(t('apiRequestFailed'));
    } finally {
      if (myGeneration === listFetchGeneration.value) {
        if (!reset) appendInFlight.value = false;
        if (!skipListLoading) feedLoading.value = false;
      }
    }
  };
  const onLoad = () => {
    if (feedFinished.value || refreshing.value) {
      feedLoading.value = false;
      return;
    }
    void fetchNotifications(false);
  };
  const onRefresh = async () => {
    refreshing.value = true;
    try {
      await fetchNotifications(true, true);
    } finally {
      refreshing.value = false;
    }
  };
  const goChat = (_item: MessageRow) => {
    // TODO: router.push({ name: 'Chat', query: { conversationId: _item.conversationId } })
  };
  const onMarkRead = async (item: MessageRow) => {
    /** mid */
    const mid = item.lastMessageId;
    if (mid == null || !Number.isFinite(Number(mid)) || Number(mid) <= 0) {
      CreateErrorToast(t('msg_missing_id_read'));
      return;
    }
    try {
      const res = await markPrivateMessagesReadBatch({ messageIds: [Number(mid)] });
      if (isApiSuccess(res) && res.data === true) {
        const row = list.value.find((p) => p.rowKey === item.rowKey);
        if (row) {
          row.unread = 0;
          row.hasUnreadMessage = false;
        }
      } else {
        CreateErrorToast(res?.msg || t('od_op_fail'));
      }
    } catch {
      CreateErrorToast(t('apiRequestFailed'));
    }
  };
  const onDeleteConversation = async (item: MessageRow) => {
    try {
      await CreateConfirmDialog({
        title: t('dt_dialog_title'),
        message: t('msg_remove_conv_confirm'),
        confirmButtonText: t('pd_comment_delete'),
        cancelButtonText: t('cancel')
      });
    } catch {
      return;
    }
    try {
      const res = await deletePrivateConversation({ conversationId: item.conversationId });
      if (isApiSuccess(res) && res.data === true) {
        list.value = list.value.filter((p) => p.conversationId !== item.conversationId);
        CreateSuccessToast(t('pd_comment_delete_success'));
      } else {
        CreateErrorToast(res?.msg || t('pd_comment_delete_fail'));
      }
    } catch {
      CreateErrorToast(t('cm_network_error'));
    }
  };
</script>

<style scoped lang="less">
  @primary-blue: #3366ff;
  @text-primary: #000;
  @text-muted: #999;
  .message-page-shell {
    position: relative;
    min-height: 100vh;
    background: transparent;
    --van-nav-bar-title-text-color: #000;
    --van-nav-bar-icon-color: #000;

    :deep(.van-nav-bar),
    :deep(.van-nav-bar__placeholder) {
      background: transparent;
    }

    :deep(.van-nav-bar__title) {
      font-size: 0.36rem;
      font-weight: 700;
      color: #000;
    }

    :deep(.van-nav-bar .van-icon) {
      color: #000;
    }
  }

  .message-page {
    position: relative;
    z-index: 1;
    background: transparent;
    color: @text-primary;
    padding-bottom: env(safe-area-inset-bottom);
  }

  .message-page--batch {
    padding-bottom: calc(1.45rem + env(safe-area-inset-bottom));
  }

  .message-page__nav-action {
    font-size: 0.28rem;
    font-weight: 500;
    color: @primary-blue;
    padding: 0.12rem 0.12rem 0.12rem 0.2rem;
  }

  .message-page__nav-action--muted {
    color: @text-muted;
  }

  .message-page__pull {
    min-height: 40vh;
  }

  .message-page__pull--refreshing :deep(.van-list__loading) {
    display: none !important;
  }

  .message-page__pull :deep(.van-pull-refresh__track) {
    min-height: inherit;
  }

  .message-page__list-wrap :deep(.van-list__finished-text),
  .message-page__list-wrap :deep(.van-list__loading) {
    color: @text-muted;
  }

  .message-page__empty {
    padding: 0.8rem 0.32rem 0;
  }

  .message-page__empty :deep(.van-empty__description) {
    color: @text-muted;
  }

  .message-page__list {
    display: flex;
    flex-direction: column;
    padding: 0 0.32rem 0.48rem;
  }

  .message-page__row-wrap {
    flex-shrink: 0;

    &:not(:last-child) .message-page__item {
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    }
  }

  .message-page__item {
    display: flex;
    align-items: center;
    gap: 0.24rem;
    padding: 0.28rem 0;
    background: transparent;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  .message-page__item:active {
    opacity: 0.88;
  }

  .message-page__avatar-wrap {
    position: relative;
    flex-shrink: 0;
    width: 0.96rem;
    height: 0.96rem;
  }

  .message-page__badge {
    display: block;
    width: 100%;
    height: 100%;
  }

  .message-page__badge :deep(.van-badge__wrapper) {
    width: 100%;
    height: 100%;
  }

  .message-page__avatar {
    display: block;
    width: 100%;
    height: 100%;
    border-radius: 0.16rem;
    overflow: hidden;
    background: #f0f2f5;
  }

  .message-page__badge :deep(.van-badge--fixed) {
    min-width: 0.32rem;
    height: 0.32rem;
    padding: 0 0.06rem;
    font-size: 0.2rem;
    font-weight: 600;
    line-height: 0.32rem;
    background: #ff4d4f;
    border: 2px solid #fff;
    box-shadow: none;
  }

  .message-page__body {
    flex: 1;
    min-width: 0;
  }

  .message-page__row-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.2rem;
    margin-bottom: 0.08rem;
  }

  .message-page__name {
    flex: 1;
    min-width: 0;
    font-size: 0.3rem;
    font-weight: 700;
    color: @text-primary;
    line-height: 1.35;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .message-page__time {
    flex-shrink: 0;
    font-size: 0.22rem;
    color: @text-primary;
    line-height: 1.35;
    font-variant-numeric: tabular-nums;
    opacity: 0.85;
  }

  .message-page__preview {
    font-size: 0.24rem;
    color: @text-muted;
    line-height: 1.45;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .message-page__batch-check {
    flex-shrink: 0;
    padding-right: 0.08rem;
  }

  .message-page__batch-check :deep(.van-checkbox__icon--checked) {
    background-color: @primary-blue;
    border-color: @primary-blue;
  }

  .message-page__item--batch {
    padding-left: 0;
  }

  .message-page__item--selected {
    background: rgba(51, 102, 255, 0.06);
    border-radius: 0.12rem;
    padding-left: 0.12rem;
    padding-right: 0.12rem;
    margin: 0 -0.12rem;
  }

  .message-page__batch-bar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 100;
    padding-bottom: env(safe-area-inset-bottom);
    background: linear-gradient(180deg, rgba(245, 248, 255, 0) 0%, #f5f8ff 28%, #fff 100%);
    border-top: 1px solid rgba(0, 0, 0, 0.06);
  }

  .message-page__batch-bar-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.12rem;
    padding: 0.22rem 0.28rem 0.28rem;
    box-sizing: border-box;
  }

  .message-page__batch-meta {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.04rem;
  }

  .message-page__batch-meta--solo {
    padding-right: 0.12rem;
  }

  .message-page__batch-count {
    font-size: 0.24rem;
    color: @text-primary;
    font-weight: 600;
  }

  .message-page__batch-tip {
    font-size: 0.2rem;
    color: @text-muted;
  }

  .message-page__batch-submit {
    flex-shrink: 0;
    margin: 0;
    padding: 0 0.34rem;
    height: 0.72rem;
    border: none;
    border-radius: 999px;
    font-size: 0.28rem;
    font-weight: 600;
    color: #fff;
    background: linear-gradient(180deg, #6eb4ff 0%, #4090ff 100%);
    box-shadow: 0 0.06rem 0.2rem rgba(51, 102, 255, 0.22);
    -webkit-tap-highlight-color: transparent;
  }

  .message-page__batch-submit:disabled {
    opacity: 0.4;
    box-shadow: none;
  }

  .message-page__batch-submit:active:not(:disabled) {
    opacity: 0.92;
  }

  .message-batch-bar-enter-active,
  .message-batch-bar-leave-active {
    transition:
      transform 0.26s cubic-bezier(0.33, 1, 0.68, 1),
      opacity 0.22s ease;
  }

  .message-batch-bar-enter-from,
  .message-batch-bar-leave-to {
    opacity: 0;
    transform: translateY(110%);
  }
</style>
