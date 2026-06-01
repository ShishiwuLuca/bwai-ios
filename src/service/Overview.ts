import { defHttp } from '/@/utils/http/axios';

// 投资总览响应体

/** AppIndexOverviewRespVO：接口数据结构定义 */
export interface AppIndexOverviewRespVO {
  totalOrderCount: number;
  stakingOrderCount: number;
  totalOrderAmount: number;
  stakingAmount: number;
  totalGainAmount: number;
  pendingGainAmount: number;
  releaseGainAmount: number;
}

/** CommonResult：接口数据结构定义（事件或回调处理） */
interface CommonResult<T = unknown> {
  code: number;
  msg: string;
  data: T;
}

// -----------------------------------------------------------------------------
// 投资总览模块 API 封装
// - 获取投资总览
// -----------------------------------------------------------------------------

/** OverviewApi：枚举取值说明 */
enum OverviewApi {
  // 获取投资总览（前缀 /app-api 由 axios urlPrefix 统一添加）
  GetStakeOverview = '/stake/index/overview'
}

/**
 * 投资总览
 * POST /app-api/stake/index/overview
 */
export const getStakeOverview = () => {
  return defHttp.post<CommonResult<AppIndexOverviewRespVO>>({
    url: OverviewApi.GetStakeOverview
  });
};
