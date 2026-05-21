import { defHttp } from '/@/utils/http/axios';

// -----------------------------------------------------------------------------
// 文章模块 API 封装
// - 获取文章列表
// -----------------------------------------------------------------------------

/** ArticleApi：枚举取值说明 */
enum ArticleApi {
  // 获取文章分类树形列表
  GetArticleList = '/marketing/article/typelist',

  // 获取文章列表
  GetArticlePage = '/marketing/article/list',

  // 获取文章详情
  GetArticleDetail = '/marketing/article/detail',

  // 根据URL名称获取文章详情
  GetArticleDetailByUrl = '/marketing/article/detail/url-name'
}

/**
 * 获取文章分类树形列表
 * GET /marketing/article/typelist
 */
export const getArticleList = (params: any) => {
  return defHttp.get<any>({ url: ArticleApi.GetArticleList, params });
};

/**
 * 获取文章列表
 * GET /marketing/article/list
 */
export const getArticlePage = (params: any) => {
  return defHttp.get<any>({ url: ArticleApi.GetArticlePage, params });
};

/**
 * 获取文章详情
 * GET /marketing/article/detail
 */
export const getArticleDetail = (params: any) => {
  return defHttp.get<any>({ url: ArticleApi.GetArticleDetail, params });
};

/**
 * 根据URL名称获取文章详情
 * GET /marketing/article/detail/url
 */
export const getArticleDetailByUrl = (params: any) => {
  return defHttp.get<any>({ url: ArticleApi.GetArticleDetailByUrl, params });
};
