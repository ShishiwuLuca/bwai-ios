import { defHttp } from '/@/utils/http/axios';
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
  /** 1：iOS 展示马甲 Home 页 */
  iosStatus: number;
  /** 1：Android 展示马甲 Home 页 */
  androidStatus: number;
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
