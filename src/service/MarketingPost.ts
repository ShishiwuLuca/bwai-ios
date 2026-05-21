import { defHttp } from '/@/utils/http/axios';
import { ContentTypeEnum } from '/@/enums/httpEnum';

/** GET /marketing/post/recommend-page */
export type AppMarketingPostPageReqVO = {
  pageNo: number;
  pageSize: number;
  /** 1-视频 2-动态 */
  postType?: number;
  categoryId?: number;
  userId?: number;
  /** 1-待审 2-通过 3-驳回 4-已发布 5-下架 */
  status?: number;
};

/** AppMarketingPostTagVO：类型别名 */
export type AppMarketingPostTagVO = {
  id?: number;
  tagName?: string;
  tagType?: number;
  status?: number;
  createTime?: string;
};

/** AppMarketingPostMediaVO：类型别名 */
export type AppMarketingPostMediaVO = {
  id?: number;
  /** 1-图片 2-视频 */
  mediaType?: number;
  mediaUrl?: string;
  mediaSort?: number;
  mediaWidth?: number;
  mediaHeight?: number;
  mediaSize?: number;
};

/** AppMarketingPostRespVO：类型别名 */
export type AppMarketingPostRespVO = {
  id: number;
  userId?: number;
  userNickname?: string;
  userAvatar?: string;
  /** 用户 VIP 等级（部分接口可能用 vipLevel / userVip） */
  userVipLevel?: number;
  vipLevel?: number;
  userVip?: number;
  user?: { vipLevel?: number; userVipLevel?: number; vip?: number };
  /** 1-视频 2-动态 */
  postType?: number;
  title?: string;
  picture?: string;
  content?: string;
  categoryId?: number;
  categoryName?: string;
  tagList?: AppMarketingPostTagVO[];
  mediaList?: AppMarketingPostMediaVO[];
  likeCount?: number;
  commentCount?: number;
  isLiked?: boolean;
  createTime?: string;
};

/** PageResultAppMarketingPostRespVO：类型别名 */
export type PageResultAppMarketingPostRespVO = {
  total: number;
  list: AppMarketingPostRespVO[];
  stat?: Record<string, unknown>;
};

/** CommonResultPageMarketingPost：类型别名 */
export type CommonResultPageMarketingPost = {
  code: number;
  msg: string;
  data: PageResultAppMarketingPostRespVO;
  traceId?: string;
};

/** CommonResultData：类型别名 */
export type CommonResultData<T> = {
  code: number;
  msg: string;
  data: T;
  traceId?: string;
};

/** 私聊会话列表项（会话列表 / 点赞/评论通知分页） */
export type AppPrivateConversationRespVO = {
  conversationId: string;
  otherUserId?: number;
  otherUserNickname?: string;
  otherUserAvatar?: string;
  lastMessageContent?: string;
  /** 1 私信 2 点赞提醒 3 评论提醒 */
  lastMessageType?: number;
  unreadCount?: number;
  lastMessageTime?: string;
  lastMessageId?: number;
  hasUnreadMessage?: boolean;
};

/** 点赞/评论通知分页 POST /marketing/private-message/notifications */
export type AppPrivateMessageNotificationsPageReqVO = {
  pageNo: number;
  pageSize: number;
  /** 可选，游标等场景 */
  offset?: number;
};

/** 删除会话 query：conversationId */
export type AppPrivateMessageConversationIdReqVO = {
  conversationId: string;
};

/** 标记消息已读 query：otherUserId */
export type AppPrivateMessageMarkReadReqVO = {
  otherUserId: number;
};

/** PageResultAppPrivateConversationRespVO：类型别名 */
export type PageResultAppPrivateConversationRespVO = {
  total: number;
  list: AppPrivateConversationRespVO[];
  stat?: Record<string, unknown>;
};

/** CommonResultPagePrivateConversation：类型别名 */
export type CommonResultPagePrivateConversation = {
  code: number;
  msg: string;
  data: PageResultAppPrivateConversationRespVO;
  traceId?: string;
};

/** 帖子评论项 */
export type AppMarketingCommentRespVO = {
  id: number;
  postId?: number;
  userId?: number;
  userNickname?: string;
  userAvatar?: string;
  userVipLevel?: number;
  /** 父评论 ID，>0 表示回复 */
  parentCommentId?: number;
  content?: string;
  /** 评论配图 */
  picUrl?: string;
  likeCount?: number;
  replyCount?: number;
  hasReplies?: boolean;
  /** 当前用户是否已点赞 */
  liked?: boolean;
  createTime?: string;
};

/** PageResultAppMarketingCommentRespVO：类型别名 */
export type PageResultAppMarketingCommentRespVO = {
  total: number;
  list: AppMarketingCommentRespVO[];
  stat?: Record<string, unknown>;
};

/** CommonResultPageMarketingComment：类型别名 */
export type CommonResultPageMarketingComment = {
  code: number;
  msg: string;
  data: PageResultAppMarketingCommentRespVO;
  traceId?: string;
};

/** 创建评论接口 data 为新评论 id */
export type CommonResultLong = {
  code: number;
  msg: string;
  data: number;
  traceId?: string;
};

/** 创建评论请求：回复帖子只传 postId+content；回复评论再传 parentCommentId */
export type AppMarketingPostCommentCreateReqVO = {
  postId: number;
  content: string;
  parentCommentId?: number;
};

/** 创建/保存标签 */
export type MarketingTagSaveReqVO = {
  id?: number;
  tagName: string;
  /** 1 系统标签 2 自定义标签 */
  tagType?: number;
  /** 0 未发布 1 已发布 */
  status?: number;
};

/** 标签项（我的标签列表等） */
export type AppMarketingTagRespVO = {
  id: number;
  tagName: string;
  /** 1 系统 2 自定义 */
  tagType?: number;
  /** 0 未发布 1 已发布 */
  status?: number;
  createTime?: string;
};

/** 帖子分类（类目） */
export type AppMarketingCategoryRespVO = {
  id: number;
  categoryName: string;
};

/** 创建举报 POST /marketing/post-report/create */
export type AppMarketingPostReportCreateReqVO = {
  postId: number;
  /** 1 色情低俗 2 违法违规 3 虚假诈骗 4 侵权内容 5 其他 */
  reportType: number;
  reportReason?: string;
};

/** 创建帖子 POST /marketing/post/create — mediaList 单项 */
export type AppMarketingPostMediaSaveItemVO = {
  /** 1 图片 2 视频 */
  type: number;
  url: string;
  sort?: number;
};

/** 创建帖子请求 appMarketingPostSaveReqVO */
export type AppMarketingPostSaveReqVO = {
  /** 1 视频 2 动态（图文） */
  postType: number;
  title?: string;
  /** 图文封面；视频帖可不传 */
  picture?: string;
  content?: string;
  categoryId: number;
  tagIds?: number[];
  mediaList?: AppMarketingPostMediaSaveItemVO[];
};

/** MarketingPostApi：枚举取值说明 */
enum MarketingPostApi {
  RecommendPage = '/marketing/post/recommend-page',
  /** 帖子分页（分类 Tab：分享 / 线下等，与 recommend-page 区分） */
  PostPage = '/marketing/post/page',
  /** 我的帖子分页 */
  MyList = '/marketing/post/my-list',
  /** 帖子详情，参数 id 与后端约定一致 */
  GetPost = '/marketing/post/get',
  /** 评论分页：顶层传 parentCommentId=0 */
  CommentPage = '/marketing/post-comment/page',
  /** 某条评论下的回复分页 */
  CommentReplies = '/marketing/post-comment/replies',
  /** 点赞评论 POST ?id= */
  CommentLike = '/marketing/post-comment/like',
  /** 取消点赞评论 POST ?id= */
  CommentUnlike = '/marketing/post-comment/unlike',
  /** 创建评论 */
  CommentCreate = '/marketing/post-comment/create',
  /** 删除评论 POST ?id= */
  CommentDelete = '/marketing/post-comment/delete',
  /** 创建标签 */
  TagCreate = '/marketing/post-tag/create',
  /** 我的标签列表 */
  TagMyList = '/marketing/post-tag/my-list',
  /** 删除标签 */
  TagDelete = '/marketing/post-tag/delete',
  /** 帖子分类列表 */
  CategoryList = '/marketing/post/category-list',
  /** 创建举报 */
  PostReportCreate = '/marketing/post-report/create',
  /** 点赞帖子 POST ?id= */
  PostLike = '/marketing/post/like',
  /** 取消点赞 POST ?id= */
  PostUnlike = '/marketing/post/unlike',
  /** 创建帖子 */
  PostCreate = '/marketing/post/create',
  /** 删除帖子（我的帖子等）POST ?id= */
  PostDelete = '/marketing/post/delete',
  /** 私聊会话列表 */
  PrivateMessageConversations = '/marketing/private-message/conversations',
  /** 点赞/评论通知分页（我的消息列表） */
  PrivateMessageNotifications = '/marketing/private-message/notifications',
  /** 标记消息已读 POST ?otherUserId= */
  PrivateMessageRead = '/marketing/private-message/read',
  /** 根据会话删除消息 POST ?conversationId= */
  PrivateMessageDeleteConversation = '/marketing/private-message/delete',
  /** 批量标记已读 POST ?messageIds=（可重复） */
  PrivateMessageReadBatch = '/marketing/private-message/read-batch'
}

/**
 * 创建帖子
 * POST /app-api/marketing/post/create
 */
export const createMarketingPost = (data: AppMarketingPostSaveReqVO) => {
  return defHttp.post<CommonResultLong>({
    url: MarketingPostApi.PostCreate,
    data
  });
};

/**
 * 删除帖子
 * POST /app-api/marketing/post/delete
 * Query: id（必填）；Content-Type: application/x-www-form-urlencoded（与接口文档一致；id 仅走 query，见 deleteMarketingPostTag 说明）
 */
export const deleteMarketingPost = (params: { id: number }) => {
  const id = Number(params.id);
  return defHttp.post<CommonResultData<boolean>>(
    {
      url: `${MarketingPostApi.PostDelete}?id=${encodeURIComponent(String(id))}`,
      headers: {
        'Content-Type': ContentTypeEnum.FORM_URLENCODED
      }
    },
    { errorMessageMode: 'none' }
  );
};

/**
 * 获取帖子分类列表
 * GET /app-api/marketing/post/category-list
 * 不传 categoryId 时由后端默认处理；需要按父级筛选时再传 categoryId
 */
export const getMarketingPostCategoryList = (params?: { categoryId?: number }) => {
  const cid = params?.categoryId;
  return defHttp.get<CommonResultData<AppMarketingCategoryRespVO[]>>({
    url: MarketingPostApi.CategoryList,
    ...(cid != null && Number.isFinite(Number(cid)) ? { params: { categoryId: Number(cid) } } : {})
  });
};

/**
 * 推荐帖子分页
 * GET /app-api/marketing/post/recommend-page
 */
export const getRecommendPostPage = (params: AppMarketingPostPageReqVO) => {
  return defHttp.get<CommonResultPageMarketingPost>({
    url: MarketingPostApi.RecommendPage,
    params
  });
};

/**
 * 帖子分页列表（云社区「分享」「线下」等分类 Tab）
 * GET /app-api/marketing/post/page
 */
export const getMarketingPostPage = (params: AppMarketingPostPageReqVO) => {
  return defHttp.get<CommonResultPageMarketingPost>({
    url: MarketingPostApi.PostPage,
    params
  });
};

/**
 * 私聊会话列表
 * GET /app-api/marketing/private-message/conversations
 */
export const getPrivateMessageConversations = () => {
  return defHttp.post<CommonResultData<AppPrivateConversationRespVO[]>>({
    url: MarketingPostApi.PrivateMessageConversations
  });
};

/**
 * 点赞/评论通知分页列表（我的消息）
 * POST /app-api/marketing/private-message/notifications
 */
export const getPrivateMessageNotificationsPage = (
  data: AppPrivateMessageNotificationsPageReqVO
) => {
  return defHttp.post<CommonResultPagePrivateConversation>({
    url: MarketingPostApi.PrivateMessageNotifications,
    data
  });
};

/**
 * 标记消息为已读
 * POST /app-api/marketing/private-message/read
 * Query: otherUserId（必填）；Content-Type: application/x-www-form-urlencoded
 */
export const markPrivateConversationRead = (params: AppPrivateMessageMarkReadReqVO) => {
  const otherUserId = Number(params.otherUserId);
  return defHttp.post<CommonResultData<boolean>>(
    {
      url: `${MarketingPostApi.PrivateMessageRead}?otherUserId=${encodeURIComponent(String(otherUserId))}`,
      headers: {
        'Content-Type': ContentTypeEnum.FORM_URLENCODED
      }
    },
    { errorMessageMode: 'none' }
  );
};

/**
 * 根据会话删除消息
 * POST /app-api/marketing/private-message/delete-conversation
 * Query: conversationId（必填）；Content-Type: application/x-www-form-urlencoded
 */
export const deletePrivateConversation = (params: AppPrivateMessageConversationIdReqVO) => {
  const conversationId = String(params.conversationId ?? '').trim();
  return defHttp.post<CommonResultData<boolean>>(
    {
      url: `${MarketingPostApi.PrivateMessageDeleteConversation}?conversationId=${encodeURIComponent(conversationId)}`,
      headers: {
        'Content-Type': ContentTypeEnum.FORM_URLENCODED
      }
    },
    { errorMessageMode: 'none' }
  );
};

/**
 * 批量标记消息为已读
 * POST /app-api/marketing/private-message/read-batch
 * Body: application/json，形如 {"messageIds":[1,2,3]}（form-urlencoded 无法以单字段展示数组，故用 JSON）
 */
export const markPrivateMessagesReadBatch = (params: { messageIds: number[] }) => {
  const ids = params.messageIds.filter((n) => Number.isFinite(n) && n > 0);
  if (!ids.length) {
    return Promise.reject(new Error('messageIds empty'));
  }
  return defHttp.post<CommonResultData<boolean>>(
    {
      url: MarketingPostApi.PrivateMessageReadBatch,
      data: { messageIds: ids },
      headers: {
        'Content-Type': ContentTypeEnum.JSON
      }
    },
    { errorMessageMode: 'none' }
  );
};

/**
 * 我的帖子分页
 * GET /app-api/marketing/post/my-list
 * categoryId、status、postType、userId 均为可选筛选
 */
export const getMyPostPage = (params: AppMarketingPostPageReqVO) => {
  return defHttp.get<CommonResultPageMarketingPost>({
    url: MarketingPostApi.MyList,
    params
  });
};

/**
 * 帖子详情
 * GET /app-api/marketing/post/get?id=
 */
export const getMarketingPostDetail = (params: { id: number | string }) => {
  return defHttp.get<CommonResultData<AppMarketingPostRespVO>>({
    url: MarketingPostApi.GetPost,
    params
  });
};

/**
 * 评论分页列表
 * GET /app-api/marketing/post-comment/page?postId=&parentCommentId=&pageNo=&pageSize=
 * 顶层评论：parentCommentId 传 0
 */
export const getPostCommentPage = (params: {
  postId: number | string;
  /** 顶层为 0 */
  parentCommentId: number;
  pageNo: number;
  pageSize: number;
}) => {
  return defHttp.get<CommonResultPageMarketingComment>({
    url: MarketingPostApi.CommentPage,
    params
  });
};

/**
 * 某条评论的回复分页列表
 * GET /app-api/marketing/post-comment/replies?parentCommentId=&pageNo=&pageSize=
 */
export const getPostCommentReplies = (params: {
  parentCommentId: number;
  pageNo: number;
  pageSize: number;
}) => {
  return defHttp.get<CommonResultPageMarketingComment>({
    url: MarketingPostApi.CommentReplies,
    params
  });
};

/**
 * 点赞评论
 * POST /app-api/marketing/post-comment/like?id=
 */
export const likeMarketingPostComment = (params: { id: number }) => {
  const id = Number(params.id);
  return defHttp.post<CommonResultData<boolean>>(
    {
      url: `${MarketingPostApi.CommentLike}?id=${encodeURIComponent(String(id))}`
    },
    { errorMessageMode: 'none' }
  );
};

/**
 * 取消点赞评论
 * POST /app-api/marketing/post-comment/unlike?id=
 */
export const unlikeMarketingPostComment = (params: { id: number }) => {
  const id = Number(params.id);
  return defHttp.post<CommonResultData<boolean>>(
    {
      url: `${MarketingPostApi.CommentUnlike}?id=${encodeURIComponent(String(id))}`
    },
    { errorMessageMode: 'none' }
  );
};

/**
 * 创建评论 / 回复
 * POST /app-api/marketing/post-comment/create
 * 回复帖子不传 parentCommentId；回复某条评论传其 id
 */
export const createPostComment = (data: AppMarketingPostCommentCreateReqVO) => {
  const body: Record<string, unknown> = {
    postId: Number(data.postId),
    content: data.content
  };
  const p = data.parentCommentId;
  if (p != null && Number(p) > 0) {
    body.parentCommentId = Number(p);
  }
  return defHttp.post<CommonResultLong>({
    url: MarketingPostApi.CommentCreate,
    data: body
  });
};

/**
 * 删除评论
 * POST /app-api/marketing/post-comment/delete?id=
 */
export const deleteMarketingPostComment = (params: { id: number }) => {
  const id = Number(params.id);
  return defHttp.post<CommonResultData<boolean>>(
    {
      url: `${MarketingPostApi.CommentDelete}?id=${encodeURIComponent(String(id))}`,
      headers: {
        'Content-Type': ContentTypeEnum.FORM_URLENCODED
      }
    },
    { errorMessageMode: 'none' }
  );
};

/**
 * 创建标签
 * POST /app-api/marketing/post-tag/create
 * 用户自定义话题：tagType=2，status=1；新建不传 id
 */
export const createMarketingPostTag = (data: MarketingTagSaveReqVO) => {
  const body: Record<string, unknown> = {
    tagName: String(data.tagName ?? '').trim(),
    tagType: data.tagType ?? 2,
    status: data.status ?? 1
  };
  if (data.id != null && Number(data.id) > 0) {
    body.id = Number(data.id);
  }
  return defHttp.post<CommonResultLong>({
    url: MarketingPostApi.TagCreate,
    data: body
  });
};

/**
 * 获取我的标签列表
 * GET /app-api/marketing/post-tag/my-list
 */
export const getMarketingPostTagMyList = () => {
  return defHttp.get<CommonResultData<AppMarketingTagRespVO[]>>({
    url: MarketingPostApi.TagMyList
  });
};

/**
 * 删除标签
 * POST /app-api/marketing/post-tag/delete?id=
 * 注意：项目 axios 对仅传 params 的 POST 会把参数放进 body，后端要求 query 上的 id，故拼到 url
 */
export const deleteMarketingPostTag = (params: { id: number }) => {
  const id = Number(params.id);
  return defHttp.post<CommonResultData<boolean>>({
    url: `${MarketingPostApi.TagDelete}?id=${encodeURIComponent(String(id))}`
  });
};

/**
 * 创建举报
 * POST /app-api/marketing/post-report/create
 */
export const createMarketingPostReport = (data: AppMarketingPostReportCreateReqVO) => {
  const body: Record<string, unknown> = {
    postId: Number(data.postId),
    reportType: Number(data.reportType)
  };
  const reason = String(data.reportReason ?? '').trim();
  if (reason) body.reportReason = reason;
  return defHttp.post<CommonResultLong>({
    url: MarketingPostApi.PostReportCreate,
    data: body
  });
};

/**
 * 点赞帖子
 * POST /app-api/marketing/post/like?id=
 * 与 deleteMarketingPostTag 相同：仅 query 传 id，拼到 url
 */
export const likeMarketingPost = (params: { id: number }) => {
  const id = Number(params.id);
  return defHttp.post<CommonResultData<boolean>>(
    {
      url: `${MarketingPostApi.PostLike}?id=${encodeURIComponent(String(id))}`
    },
    { errorMessageMode: 'none' }
  );
};

/**
 * 取消点赞
 * POST /app-api/marketing/post/unlike?id=
 */
export const unlikeMarketingPost = (params: { id: number }) => {
  const id = Number(params.id);
  return defHttp.post<CommonResultData<boolean>>(
    {
      url: `${MarketingPostApi.PostUnlike}?id=${encodeURIComponent(String(id))}`
    },
    { errorMessageMode: 'none' }
  );
};
