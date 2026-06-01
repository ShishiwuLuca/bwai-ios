import { defHttp } from '/@/utils/http/axios';

// 投资项目分页请求

/** AppProductPageReqVO：接口数据结构定义 */
export interface AppProductPageReqVO {
  pageNo: number;
  pageSize: number;
  typeId?: number; // 项目类型ID
  offset?: number;
}

/** 投资限制条件（与后端结构对齐，字段按需扩展） */
export interface AppProductConditionVO {
  status?: number;
  products?: Array<{ productName?: string }>;
  conditionAmount?: number;
  processAmount?: number;
}

// 投资项目单条记录（根据文档截图只挑常用字段）

/** AppProductRespVO：接口数据结构定义 */
export interface AppProductRespVO {
  id: number;
  name: string;
  tagName: string;
  lockDay: number;
  gainDayRateMinStr: string;
  gainDayRateMaxStr: string;
  isReinvest: number;
  isValidUser: number;
  buyAmountMin?: number;
  buyAmountMax?: number;
  canBuy?: number;
  appLogo?: string;
  gainCoin?: string;
  gainCycleType?: number;
  gainCycleValue?: number;
  /** 投资限制条件，有值时才显示投资限制 Tab */
  condition?: AppProductConditionVO;
  /** 限购关联项目列表（展示各项目 productName） */
  products?: Array<{ productName?: string }>;
}

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

/** 投资项目请求：扣款账户类型 0-AI账户 1-LP账户 */
export interface AppProductInvestReqVO {
  accountType: number;
  productId: number;
  amount: number;
}

// -----------------------------------------------------------------------------
// 投资项目模块 API 封装
// - 获取投资项目列表
// - 投资项目
// -----------------------------------------------------------------------------

/** ProductApi：枚举取值说明 */
enum ProductApi {
  // 获取投资项目列表（前缀 /app-api 由 axios urlPrefix 统一添加）
  GetProductList = '/stake/product/page',

  // 投资项目
  ProductInvest = '/stake/product/invest'
}

/**
 * 投资项目列表
 * POST /app-api/stake/product/page
 */
export const getProductPage = (data: AppProductPageReqVO) => {
  return defHttp.post<CommonResult<PageResult<AppProductRespVO>>>({
    url: ProductApi.GetProductList,
    data
  });
};

/**
 * 投资项目
 * POST /app-api/stake/product/invest
 */
export const productInvest = (data: AppProductInvestReqVO) => {
  return defHttp.post<CommonResult<boolean>>({
    url: ProductApi.ProductInvest,
    data
  });
};
