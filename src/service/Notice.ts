import { defHttp } from '/@/utils/http/axios';

/** AppNoticePageReqVO：类型别名 */
export type AppNoticePageReqVO = {
  pageNo: number;
  pageSize: number;
};

/** AppNoticeRespVO：类型别名 */
export type AppNoticeRespVO = {
  id: number;
  title: string;
  content: string;
  createTime: string;
};

/** 分页列表类接口 */
export type CommonResult<T> = {
  code: number;
  msg: string;
  data: {
    list: T[];
    total: number;
  };
  traceId?: string;
};

/** 标量 data（如未读条数） */
export type NoticeScalarResult<T> = {
  code: number;
  msg: string;
  data: T;
  traceId?: string;
};

// -----------------------------------------------------------------------------
// 公告模块 API 封装
// - 获取公告列表
// -----------------------------------------------------------------------------

/** NoticeApi：枚举取值说明 */
enum NoticeApi {
  // 获取公告列表
  GetNoticeList = '/marketing/notice/list',

  // 获取我的消息
  GetMyMessage = '/system/user-message/list',

  // 更新消息已读状态
  UpdateMessageReadStatus = '/system/user-message/read',

  // 我的消息未读数量
  GetMyMessageUnreadCount = '/system/user-message/unread-count',

  // 更新公告已读状态
  UpdateNoticeReadStatus = '/marketing/notice/batch-mark-as-read'
}

/**
 * 获取公告列表
 * GET /marketing/notice/list
 */
export const getNoticePage = (params: AppNoticePageReqVO) => {
  return defHttp.get<CommonResult<AppNoticeRespVO[]>>({
    url: NoticeApi.GetNoticeList,
    params: params
  });
};

/**
 * 获取我的消息
 * GET /system/user-message/list
 */
export const getMyMessage = (params: any) => {
  return defHttp.post<CommonResult<any[]>>({
    url: NoticeApi.GetMyMessage,
    data: params
  });
};

/**
 * 更新消息已读状态
 * POST /system/user-message/read
 */
export const updateMessageReadStatus = (data: any) => {
  return defHttp.post({ url: NoticeApi.UpdateMessageReadStatus, data });
};

/**
 * 获取我的消息未读数量
 * GET /system/user-message/unread-count
 */
export const getMyMessageUnreadCount = () => {
  return defHttp.get<NoticeScalarResult<number>>({ url: NoticeApi.GetMyMessageUnreadCount });
};

/**
 * 更新公告已读状态
 * POST /marketing/notice/batch-mark-as-read
 */
export const updateNoticeReadStatus = (data: any) => {
  return defHttp.post({ url: NoticeApi.UpdateNoticeReadStatus, data });
};
