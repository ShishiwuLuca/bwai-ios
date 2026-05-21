import { defHttp } from '/@/utils/http/axios';

// 分页请求体（我的订单列表）

/** AppOrderPageReqVO：接口数据结构定义（订单） */
export interface AppOrderPageReqVO {
  pageNo: number;
  pageSize: number;
  orderStatus?: number; // 订单状态
  productType?: number; // 项目类型
  offset?: number;
}

// 接口返回的单条订单（字段根据文档截图提取，保留常用部分）

/** AppOrderRespVO：接口数据结构定义（订单） */
export interface AppOrderRespVO {
  orderId: number;
  orderNo: string;
  productName: string;
  productType: number;
  productTypeName: string;
  productTagName: string;
  lockDay: number;
  gainDayRateStr: string;
  gainDayRateMinStr?: string;
  gainDayRateMaxStr?: string;
  buyAmount: number;
  pendingGainAmount: number;
  releaseGainAmount: number;
  totalGainAmount: number;
  productReinvest: number;
  orderReinvest: number;
  buyTime: string;
  buyTimeStr: string;
  orderStatus: number;
  isValidUser?: number;
  claimableGainAmount?: number;
  /** 赎回完成时间展示文案 */
  redemptionTimeStr?: string;
}

// 通用包装（仅声明用到的字段，方便类型推断）

/** CommonResult：接口数据结构定义（事件或回调处理） */
interface CommonResult<T = unknown> {
  code: number;
  msg: string;
  data: T;
}

/** PageResult：接口数据结构定义 */
interface PageResult<T> {
  total: number;
  list: T[];
}

/**
 * 订单列表
 * POST /app-api/stake/order/page
 */
export const getOrderPage = (data: AppOrderPageReqVO) => {
  return defHttp.post<CommonResult<PageResult<AppOrderRespVO>>>({
    // 只写业务路径，基础前缀交给 apiUrl=/app-api 处理
    url: '/stake/order/page',
    data
  });
};

// 订单详情 - 收益明细单条记录

/** AppOrderGainDetailItemVO：接口数据结构定义（详情） */
export interface AppOrderGainDetailItemVO {
  id: number;
  orderId: number;
  gainNo: string;
  gainAmount: number;
  gainTimeStr: string;
  gainRateStr: string;
  reinvestStatus: number;
  receiveStatus: number;
  releaseStatus: number;
  receiveTimeStr: string;
}

// 订单详情 - 交易所账户信息

/** AppOrderExchangeAccountVO：接口数据结构定义（订单） */
export interface AppOrderExchangeAccountVO {
  name: string;
  website: string;
  username: string;
  password: string;
  transactions: {
    type: number;
    txnHash: string;
    txnTime: number;
    txnTimeStr: string;
  }[];
  addresses?: { id?: number; address?: string }[];
}

// 订单详情响应

/** AppOrderDetailRespVO：接口数据结构定义（详情） */
export interface AppOrderDetailRespVO extends AppOrderRespVO {
  claimableGainAmount: number;
  exchangeAccount: AppOrderExchangeAccountVO;
  gainDetailPage: PageResult<AppOrderGainDetailItemVO>;
  gainDay?: number;
  isValidUser?: number;
  /** 赎回费率 0-1，退本到账 = buyAmount * (1 - redemptionRate) */
  redemptionRate?: number;
}

// 订单详情请求体

/** AppOrderDetailReqVO：接口数据结构定义（详情） */
export interface AppOrderDetailReqVO {
  pageNo: number;
  pageSize: number;
  orderId: number;
  offset?: number;
}

/** 智能复投开关请求体 */
export interface AppOrderReinvestReqVO {
  orderId: number;
  orderReinvest: number; // 0-关闭 1-开启
}

/** 订单 ID 请求体（申请赎回等） */
export interface AppOrderIdReqVO {
  orderId: number;
}

// -----------------------------------------------------------------------------
// 订单模块 API 封装
// - 获取订单列表
// - 获取订单详情
// - 智能复投开关
// - 申请赎回
// - 领取收益
// -----------------------------------------------------------------------------

/** OrderApi：枚举取值说明 */
enum OrderApi {
  // 获取订单列表（前缀 /app-api 由 axios urlPrefix 统一添加）
  GetOrderList = '/stake/order/page',

  GetOrderDetail = '/stake/order/detail',
  OrderReinvest = '/stake/order/reinvest',
  OrderRedeem = '/stake/order/redeem',
  OrderClaim = '/stake/order/claim'
}

/**
 * 订单详情
 * POST /app-api/stake/order/detail
 */
export const getOrderDetail = (data: AppOrderDetailReqVO) => {
  return defHttp.post<CommonResult<AppOrderDetailRespVO>>({
    url: OrderApi.GetOrderDetail,
    data
  });
};

/**
 * 智能复投开关
 * POST /app-api/stake/order/reinvest
 */
export const orderReinvest = (data: AppOrderReinvestReqVO) => {
  return defHttp.post<CommonResult<boolean>>({
    url: OrderApi.OrderReinvest,
    data
  });
};

/**
 * 申请赎回
 * POST /app-api/stake/order/redeem
 */
export const orderRedeem = (data: AppOrderIdReqVO) => {
  return defHttp.post<CommonResult<boolean>>({
    url: OrderApi.OrderRedeem,
    data
  });
};

/**
 * 领取收益
 * POST /app-api/stake/order/claim
 * 请求体：AppOrderIdReqVO { orderId }
 */
export const orderClaim = (data: AppOrderIdReqVO) => {
  return defHttp.post<CommonResult<boolean>>({
    url: OrderApi.OrderClaim,
    data
  });
};
