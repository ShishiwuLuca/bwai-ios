import type { AxiosRequestConfig } from 'axios';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { defHttp } from '/@/utils/http/axios';

/** 拉取接口数据：resolveLocaleFetchUrlForDev */
const resolveLocaleFetchUrlForDev = (urlString: string): string => {
  const raw = (import.meta.env.VITE_DEV_LOCALE_S3_ORIGIN as string | undefined)?.trim();
  if (!import.meta.env.DEV || !raw) return urlString;
  try {
    const u = new URL(urlString);
    const base = new URL(raw.endsWith('/') ? raw.slice(0, -1) : raw);
    if (u.origin === base.origin) {
      return `/dev-locale-s3${u.pathname}${u.search}`;
    }
  } catch {
    /* ignore */
  }
  return urlString;
};

/** toAbsoluteUrlForNative */
const toAbsoluteUrlForNative = (fetchUrl: string): string => {
  if (/^https?:\/\//i.test(fetchUrl)) {
    return fetchUrl;
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return new URL(fetchUrl, window.location.origin).href;
  }
  return fetchUrl;
};
// 获取语言包内容（保留原有逻辑）
// 绝对地址（如 S3/CDN）不走 defHttp：axios 会带上 Lang、trace 等自定义头，触发 CORS 预检；
// 无 CORS 时开发环境可配置 VITE_DEV_LOCALE_S3_ORIGIN，走 /dev-locale-s3 代理。
// 安卓/iOS WebView 下 fetch 仍受 CORS 限制（origin 多为 https://localhost），远端 S3 未放行时会失败；
// 原生壳内改用 CapacitorHttp（系统网络栈），不受浏览器 CORS 约束。

/** 提示与弹窗：getLocalesMessage */
export const getLocalesMessage = (params: string, mtime?: string) => {
  const url = new URL(params);
  if (mtime) {
    url.searchParams.set('mtime', mtime);
  } else {
    url.searchParams.set('mtime', String(new Date().getTime()));
  }
  const urlString = url.toString();
  if (/^https?:\/\//i.test(params)) {
    const fetchUrl = resolveLocaleFetchUrlForDev(urlString);
    if (Capacitor.isNativePlatform()) {
      const absoluteUrl = toAbsoluteUrlForNative(fetchUrl);
      return CapacitorHttp.get({
        url: absoluteUrl,
        responseType: 'json'
      }).then((res) => {
        if (res.status < 200 || res.status >= 300) {
          throw new Error(`Locale request failed: ${res.status}`);
        }
        return res.data as any;
      });
    }
    return fetch(fetchUrl, {
      method: 'GET',
      credentials: 'omit',
      cache: 'no-store'
    }).then(async (res) => {
      if (!res.ok) {
        throw new Error(`Locale request failed: ${res.status}`);
      }
      return res.json() as Promise<any>;
    });
  }
  return defHttp.get<any>(
    {
      url: urlString,
      responseType: 'json',
      headers: { 'Content-Type': 'application/json' }
    },
    {
      withToken: false
    }
  );
};
// 国家区号接口返回的单项数据结构（尽量兼容常见字段）

/** AppCountryItem：接口数据结构定义 */
export interface AppCountryItem {
  code?: string;
  name?: string;
  enName?: string;
  areaCode?: string;
  index?: string;
}
// 通用接口返回结构

/** SystemCommonResult：接口数据结构定义（事件或回调处理） */
export interface SystemCommonResult<T> {
  code: number;
  msg: string;
  data: T;
  traceId?: string;
}
/**
 * 按 code 首字母 A-Z 归类后的树节点
 */
export interface CountryTreeGroup<T = AppCountryItem> {
  /** 首字母（A-Z 或 #） */
  letter: string;
  /** 该组下的国家列表 */
  children: T[];
}
/**
 * 从国家项中解析 code 字段（兼容 code / countryCode / alpha2）
 */
const getCodeFromItem = (item: AppCountryItem): string => {
  return item.code?.toUpperCase() || '';
};
/** 固定 A-Z 字母序（用于生成完整 tree） */
const LETTERS_A_Z = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
/**
 * 生成从 A 到 Z 的固定 tree 数组：共 26 项，每项 letter 为当前字母，children 为 code 首字母等于该字母的国家
 * - 仅当国家的 code 字段首字母与当前字母一致时，才放入该字母的 children
 * - 无国家的字母其 children 为 []
 */
export const buildCountryTreeByCode = <T extends AppCountryItem>(
  list: T[]
): CountryTreeGroup<T>[] => {
  const map = new Map<string, T[]>();
  list.forEach((item) => {
    const code = getCodeFromItem(item as AppCountryItem);
    const first = code.charAt(0);
    const letter = /[A-Z]/.test(first) ? first : '#';
    if (!map.has(letter)) {
      map.set(letter, []);
    }
    map.get(letter)!.push(item);
  });
  const result: CountryTreeGroup<T>[] = LETTERS_A_Z.map((letter) => ({
    letter,
    children: map.get(letter) ?? []
  }));
  const other = map.get('#');
  if (other && other.length > 0) {
    result.push({ letter: '#', children: other });
  }
  return result;
};
// -----------------------------------------------------------------------------
// 系统模块 API 封装
// - 获取国家区号列表
// - 获取系统配置
// -----------------------------------------------------------------------------

/** SystemApi：枚举取值说明 */
enum SystemApi {
  // 获取国家区号列表
  GetCountryList = '/system/country/list',
  // 获取系统配置
  GetSystemConfig = '/system/app-base/init',
  // 文件上传
  UploadFile = '/infra/file/upload/detail',
  /** 分片上传：初始化 */
  MultipartInit = '/infra/file/multipart/init',
  /** 分片上传：上传单个分片 */
  MultipartUpload = '/infra/file/multipart/upload',
  /** 分片上传：合并完成 */
  MultipartComplete = '/infra/file/multipart/complete',
  // 获取充值/提币/网络类型
  GetWithdrawalNetworkType = '/system/asset-selector/options'
}
/**
 * 获取国家区号列表
 * 对应文档：App - 国家区号 / getCountryList
 * GET /system/country/list
 * 使用方可根据返回的 data 通过 buildCountryTreeByCode(data) 得到按 code 首字母 A-Z 归类的 tree 数组
 */
export const getCountryList = () => {
  return defHttp.get<SystemCommonResult<AppCountryItem[]>>({
    url: SystemApi.GetCountryList
  });
};
/**
 * 获取系统配置
 * GET /system/app-base/init
 */
export const getSystemConfig = (params: any) => {
  return defHttp.get<SystemCommonResult<AppCountryItem[]>>({
    url: SystemApi.GetSystemConfig,
    params: params
  });
};
/**
 * 文件上传
 * POST /infra/file/upload/detail
 * 默认 timeout: 0（不限制等待时间），覆盖全局 axios 30s，避免大视频上传被客户端提前中断
 */
export const uploadFile = (params: any, axiosConfig?: AxiosRequestConfig) => {
  return defHttp.uploadFile(
    { url: SystemApi.UploadFile, params, timeout: 0, ...axiosConfig },
    params
  );
};
// --- 分片上传（大文件 / 视频）---

/** FileMultipartInitReqVO：接口数据结构定义 */
export interface FileMultipartInitReqVO {
  filename: string;
  fileSize: number;
  contentType?: string;
  directory?: string;
  chunkSize?: number;
}

/** FileMultipartInitResVO：接口数据结构定义 */
export interface FileMultipartInitResVO {
  fileId: number;
  uploadId: string;
  filename: string;
  totalChunks: number;
  chunkSize: number;
}

/** FileMultipartUploadReqVO：接口数据结构定义（拉取接口数据） */
export interface FileMultipartUploadReqVO {
  fileId: number;
  uploadId: string;
  chunkIndex: number;
  chunkData: string;
}

/** FileMultipartUploadResVO：接口数据结构定义（拉取接口数据） */
export interface FileMultipartUploadResVO {
  chunkIndex: number;
  uploadedChunks: number;
  totalChunks: number;
  progress: number;
}

/** FileMultipartCompleteReqVO：接口数据结构定义 */
export interface FileMultipartCompleteReqVO {
  fileId: number;
  uploadId: string;
}
/** 合并完成后的文件信息 */
export interface FileRespVO {
  id: number;
  configId?: number;
  path?: string;
  name?: string;
  url: string;
  type?: string;
  size?: number;
  createTime?: string;
}
/** POST /infra/file/multipart/init */
export const initMultipartUpload = (
  data: FileMultipartInitReqVO,
  axiosConfig?: AxiosRequestConfig
) => {
  return defHttp.post<SystemCommonResult<FileMultipartInitResVO>>(
    { url: SystemApi.MultipartInit, data, timeout: 0, ...axiosConfig },
    { errorMessageMode: 'none' }
  );
};
/** POST /infra/file/multipart/upload */
export const uploadMultipartChunk = (
  data: FileMultipartUploadReqVO,
  axiosConfig?: AxiosRequestConfig
) => {
  return defHttp.post<SystemCommonResult<FileMultipartUploadResVO>>(
    { url: SystemApi.MultipartUpload, data, timeout: 0, ...axiosConfig },
    { errorMessageMode: 'none' }
  );
};
/** POST /infra/file/multipart/complete */
export const completeMultipartUpload = (
  data: FileMultipartCompleteReqVO,
  axiosConfig?: AxiosRequestConfig
) => {
  return defHttp.post<SystemCommonResult<FileRespVO>>(
    { url: SystemApi.MultipartComplete, data, timeout: 0, ...axiosConfig },
    { errorMessageMode: 'none' }
  );
};
/**
 * 获取充值/提币/网络类型
 * GET /system/asset-selector/options
 */
export const getWithdrawalNetworkType = (params: any) => {
  return defHttp.get<
    SystemCommonResult<{
      assetCoins: any[];
      networkCoins: any[];
      networkTypes: any[];
    }>
  >({
    url: SystemApi.GetWithdrawalNetworkType,
    params: params
  });
};
