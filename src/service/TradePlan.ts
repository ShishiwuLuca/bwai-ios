import { defHttp } from '/@/utils/http/axios';

enum TradePlanApi {
  GetPlanPage = '/trade/app/plan/page',
  GetPlanOverview = '/trade/app/plan/overview',
  CreateOrder = '/trade/app/order/create',
  GetOrderPage = '/trade/app/order/page',
  CancelOrder = '/trade/app/order/cancel'
}

/** 获取跟单计划列表 POST /app-api/trade/app/plan/page */
export const getTradePlanPage = (data: any) => {
  return defHttp.post({ url: TradePlanApi.GetPlanPage, data });
};

/** 获取 AI 策略总览 POST /app-api/trade/app/plan/overview */
export const getTradePlanOverview = (data: any = {}) => {
  return defHttp.post({ url: TradePlanApi.GetPlanOverview, data });
};

/** 创建跟单订单 POST /app-api/trade/app/order/create */
export const createTradeOrder = (data: any) => {
  return defHttp.post({ url: TradePlanApi.CreateOrder, data });
};

/** 我的跟单订单分页 POST /app-api/trade/app/order/page */
export const getTradeOrderPage = (data: any) => {
  return defHttp.post({ url: TradePlanApi.GetOrderPage, data });
};

/** 撤销跟单订单 POST /app-api/trade/app/order/cancel */
export const cancelTradeOrder = (data: any) => {
  return defHttp.post({ url: TradePlanApi.CancelOrder, data });
};
