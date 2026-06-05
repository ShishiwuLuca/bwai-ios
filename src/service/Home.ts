import { defHttp } from '/@/utils/http/axios';

// -----------------------------------------------------------------------------
// 首页模块 API 封装
// - 获取首页数据
// -----------------------------------------------------------------------------

/** HomeApi：枚举取值说明 */
enum HomeApi {
  GetHomeData = '/app/render?path=/app/homepage',

  // 获取RAW币种列表
  GetRawList = '/marketing/market/rwa'
}

//
// 获取 AI 页面配置
// -----------------------------------------------------------------------------

enum AIConfigApi {
  GetAIPageConfig = '/system/app-base/ai-page-config'
}

/** AI 入口配置项 */
export interface AIPageConfigItem {
  page: string;
  desc: string;
}

/** AI 入口配置 */
export interface AIPageConfigData {
  items: AIPageConfigItem[];
}
/**
 * 获取首页数据
 * GET /app/render?path=/app/homepage
 */


export const getHomeData = () => {
  return defHttp.get<any>({ url: HomeApi.GetHomeData });
};

/** 获取 AI 页面入口配置 */
export const getAIPageConfig = () => {
  return defHttp.get<{ code: number; msg: string; data: AIPageConfigData }>({
    url: AIConfigApi.GetAIPageConfig
  });
};
/**
 * 获取RAW币种列表
 * GET /marketing/market/rwa
 */
export const getRawList = () => {
  return defHttp.get<any>({ url: HomeApi.GetRawList });
};
