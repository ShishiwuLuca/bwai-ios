import { defHttp } from '/@/utils/http/axios';

// 投资类型

/** AppTypeRespVO：接口数据结构定义 */
export interface AppTypeRespVO {
  id: number;
  name: string;
  sort: number;
}

/** CommonResult：接口数据结构定义（事件或回调处理） */
interface CommonResult<T = unknown> {
  code: number;
  msg: string;
  data: T;
}

// -----------------------------------------------------------------------------
// 投资类型模块 API 封装
// - 获取投资类型列表
// -----------------------------------------------------------------------------

/** TypeApi：枚举取值说明 */
enum TypeApi {
  // 获取投资类型列表（前缀 /app-api 由 axios urlPrefix 统一添加）
  GetTypeList = '/stake/type/list'
}

/**
 * 投资类型列表
 * POST /app-api/stake/type/list
 */
export const getTypeList = () => {
  return defHttp.post<CommonResult<AppTypeRespVO[]>>({
    url: TypeApi.GetTypeList
  });
};
