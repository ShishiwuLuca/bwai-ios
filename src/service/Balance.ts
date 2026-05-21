import { defHttp } from '/@/utils/http/axios';

/** 单个账户余额（AI / LP） */
export interface AppBalanceItemRespVO {
  totalBalance: number;
  availableBalance: number;
  frozenBalance: number;
}

/** 余额接口返回 data */
export interface AppBalanceRespVO {
  ai: AppBalanceItemRespVO;
  lp: AppBalanceItemRespVO;
}

/** CommonResult：接口数据结构定义（事件或回调处理） */
interface CommonResult<T = unknown> {
  code: number;
  msg: string;
  data: T;
}

// -----------------------------------------------------------------------------
// 质押模块 API 封装
// - 获取质押账户余额
// -----------------------------------------------------------------------------

/** BalanceApi：枚举取值说明 */
enum BalanceApi {
  // 获取质押账户余额（前缀 /app-api 由 axios urlPrefix 统一添加）
  GetStakeBalance = '/stake/balance'
}

/**
 * 获取质押账户余额（AI 账户 + LP 账户）
 * POST /app-api/stake/balance
 */
export const getStakeBalance = () => {
  return defHttp.post<CommonResult<AppBalanceRespVO>>({
    url: BalanceApi.GetStakeBalance
  });
};
