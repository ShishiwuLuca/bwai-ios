import { defHttp } from '/@/utils/http/axios';
import { getAppEnvConfig } from '/@/utils/env';
import type { SystemCommonResult } from '/@/service/System';

/** AppClientApi：枚举取值说明 */
enum AppClientApi {
  // 记录启动日志
  RecordStartupLog = '/system/app-base/startup-log',
  // 马甲包展示配置
  VestConfig = '/system/app-base/vest-config'
}

/** GET `/app-api/system/app-base/vest-config` 返回的 data */
export interface VestConfigData {
  displaySite: string;
  status: number;
}

/** 版本检测接口 path（不含 /app-api；开发环境由 joinPrefix 拼接前缀） */
const VERSION_CHECK_PATH = '/system/app-base/version-check';

/** 拉取接口数据：resolveVersionCheckRequest */
const resolveVersionCheckRequest = (): {
  url: string;
  joinPrefix: boolean;
} => {
  const { VITE_GLOB_API_URL, VITE_GLOB_API_URL_PREFIX } = getAppEnvConfig();
  const absoluteApi = (VITE_GLOB_API_URL || '').trim();
  const prefix = (VITE_GLOB_API_URL_PREFIX?.trim() || '/app-api').replace(/\/+$/, '') || '/app-api';
  if (absoluteApi) {
    return { url: `${prefix}${VERSION_CHECK_PATH}`, joinPrefix: false };
  }
  return { url: VERSION_CHECK_PATH, joinPrefix: true };
};
/** POST `/app-api/system/app-base/version-check`（或开发下等价路径）请求体（字段名与接口文档一致） */
export interface AppCheckVersionBody {
  package_version: string;
  source_version: string;
  platform_name: string;
  /** 未登录传空串，与 WS `subscribe_update` 约定一致 */
  uid: string;
  timezone: string;
  lang: string;
  network: string;
  system_version: string;
  ua: string;
  /** 设备生产厂商，如 Xiaomi、Google */
  vendor_name: string;
  /** 设备型号名称 */
  device_name: string;
  /** 定制系统 UI 名称，如 HyperOS、OriginOS */
  system_ui_name: string;
  /** 定制 UI 版本号 */
  ui_version: string;
}
/**
 * 记录启动日志
 * POST /system/app-base/startup-log
 */
export const recordStartupLog = (data: any) => {
  return defHttp.post({
    url: AppClientApi.RecordStartupLog,
    data
  });
};
/**
 * 获取马甲包展示配置
 * GET `/app-api/system/app-base/vest-config`
 */
export const fetchVestConfig = () => {
  return defHttp.get<SystemCommonResult<VestConfigData>>(
    {
      url: AppClientApi.VestConfig
    },
    { errorMessageMode: 'none' }
  );
};
/**
 * 检测 App 是否有新版本（安装包 / 资源包策略由服务端 data 决定）
 * POST `/app-api/system/app-base/version-check`
 */
export const checkVersion = (data: AppCheckVersionBody) => {
  const { url, joinPrefix } = resolveVersionCheckRequest();
  return defHttp.post<SystemCommonResult<unknown>>(
    {
      url,
      data
    },
    { errorMessageMode: 'none', joinPrefix }
  );
};
