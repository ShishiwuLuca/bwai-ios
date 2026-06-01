import { defHttp } from '/@/utils/http/axios';

// -----------------------------------------------------------------------------
// 首页模块 API 封装
// - 获取首页数据
// -----------------------------------------------------------------------------

/** HomeApi：枚举取值说明 */
enum HomeApi {
  GetHomeData = '/app/render?path=/app/homepage'
}

/**
 * 获取首页数据
 * GET /app/render?path=/app/homepage
 */
export const getHomeData = () => {
  return defHttp.get<any>({ url: HomeApi.GetHomeData });
};
