import { defHttp } from '/@/utils/http/axios';

/** CommonResult：类型别名 */
export type CommonResult<T> = {
  code: number;
  msg: string;
  data: T;
  traceId?: string;
};

/** 玩法说明请求体：文档要求 body 必传，默认可传空对象 */
export type AppActTaskDescReqVO = Record<string, unknown>;

/** 玩法说明响应体 */
export type AppActTaskDescRespVO = {
  description?: string;
};

/** 领取状态：0已结束 1可领取 2不可领取 4已领取 5进行中 */
export const ClaimStatus = {
  Ended: 0,
  Claimable: 1,
  NotClaimable: 2,
  Claimed: 4,
  InProgress: 5
} as const;

/** 工资领取状态项：最近 7 天 */
export type AppActTaskWageStatusRespVO = {
  bizDate: string; // 日期 YYYY-MM-DD
  claimStatus: number; // 领取状态 0:已结束 1:可领取 2:不可领取 4:已领取 5:进行中
};

/** 任务接口路径前缀，若 404 可尝试：'/app/act/task' | '/member/app/act/task' */
const TASK_BASE = '/act/task';

/** 工资明细领取/审核状态（后端 actTaskWageClaimStatus） */
export const WageRecordClaimStatus = {
  Pending: 0,
  Success: 10,
  Failed: 20
} as const;

/** 工资记录项 */
export type AppActTaskWageRecordItemVO = {
  userId?: number;
  bizDate: string | number[];
  totalEarned: number;
  totalClaimed: number;
  /** 审核状态：0 待审核 / 10 审核成功 / 20 审核失败 */
  claimStatus?: number;
  stat?: Record<string, unknown>;
  /** 当日已审核积分（进度条等） */
  todayAuditedPoints?: number;
};

/** 工资记录分页响应 */
export type AppActTaskWageRecordRespVO = {
  total: number;
  list: AppActTaskWageRecordItemVO[];
  stat?: Record<string, unknown>;
};

/** GET enable-status：每日任务是否已激活（未激活时返回条件说明） */
export type AppDailyTaskEnableStatusVO = {
  activated: boolean;
  settingEnabled?: boolean;
  currentAmount?: number;
  limitAmount?: number;
  limitType?: number;
  limitTypeText?: string;
  productIds?: number[];
  productNames?: string[];
};

/** TaskApi：枚举取值说明 */
enum TaskApi {
  /** 获取玩法说明 */
  GetTaskDesc = `${TASK_BASE}/getDesc`,
  /** 获取最近七天工资领取状态列表 */
  GetWageStatusList = `${TASK_BASE}/wage-status-list`,
  /** 获取每日工资汇总 */
  GetDailyWageSummary = `${TASK_BASE}/daily-summary`,
  /** 获取工资设置列表及当日积分信息 */
  GetDailyWageSettingList = `${TASK_BASE}/wage-info`,
  /** 获取任务配置列表 */
  GetTaskConfigList = `${TASK_BASE}/config-list`,
  /** 领取近七天的工资 */
  ClaimWage = `${TASK_BASE}/claim-recent`,
  /** 提交任务 */
  SubmitTask = `${TASK_BASE}/submit`,
  /** 获取用户工资记录（分页，支持下拉刷新、上拉加载） */
  GetWageRecord = `${TASK_BASE}/wage-record`,
  /** 获取指定日期的工资领取状态，bizDate 为数组 [年,月,日] 或字符串，传参格式 bizDate=2026-03-14 */
  GetWageRecordByDate = `${TASK_BASE}/wage-status`,
  /** 领取每日工资 */
  ClaimDailyWage = `${TASK_BASE}/claim`,
  /** 每日任务是否已激活（enable-status） */
  IsActiveDailyTask = `${TASK_BASE}/enable-status`
}

/**
 * 获取玩法说明
 * POST /app-api/app/act/task/getDesc（与其他页面请求方式一致，使用默认 joinPrefix）
 */
export const getTaskDesc = (data: AppActTaskDescReqVO = {}) => {
  return defHttp.get<CommonResult<AppActTaskDescRespVO>>({
    url: TaskApi.GetTaskDesc,
    data
  });
};
/**
 * 每日任务是否已激活（enable-status）
 * data.activated=false 时带 productNames、金额条件等，供 DailyTask 弹窗展示
 */
export const isActiveDailyTask = () => {
  return defHttp.get<CommonResult<AppDailyTaskEnableStatusVO>>({
    url: TaskApi.IsActiveDailyTask,
    data: {}
  });
};

/**
 * 获取最近七天工资领取状态列表
 * POST /app-api/app/act/task/wage-status-list（与其他页面请求方式一致）
 */
export const getWageStatusList = () => {
  return defHttp.get<CommonResult<AppActTaskWageStatusRespVO[]>>({
    url: TaskApi.GetWageStatusList,
    data: {}
  });
};

/** 日薪档位（wage-info 返回的 wageRules 项） */
export type AppActTaskWageRuleVO = {
  id: number;
  minPoints: number;
  wageAmount: number;
  sort: number;
};

/** GET wage-info 响应 data */
export type AppActTaskWageInfoRespVO = {
  continueClaimDays?: number;
  todayAuditedPoints?: number;
  todayPendingPoints?: number;
  todayTotalAvailablePoints?: number;
  wageRules?: AppActTaskWageRuleVO[];
};

//获得每日工资汇总

/** getDailyWageSummary */
export const getDailyWageSummary = () => {
  return defHttp.get<CommonResult<any>>({
    url: TaskApi.GetDailyWageSummary,
    data: {}
  });
};

//获取工资设置列表及当日积分信息

/** 列表数据：getDailyWageSettingList */
export const getDailyWageSettingList = () => {
  return defHttp.get<CommonResult<AppActTaskWageInfoRespVO>>({
    url: TaskApi.GetDailyWageSettingList,
    data: {}
  });
};

//获得任务配置列表

/** 列表数据：getTaskConfigList */
export const getTaskConfigList = () => {
  return defHttp.get<CommonResult<any>>({
    url: TaskApi.GetTaskConfigList,
    data: {}
  });
};

//领取近七天的工资

/** claimWage */
export const claimWage = () => {
  return defHttp.post<CommonResult<any>>({
    url: TaskApi.ClaimWage,
    data: {}
  });
};

//提交任务

/** 提交中：submitTask */
export const submitTask = (data: any) => {
  return defHttp.post<CommonResult<any>>({
    url: TaskApi.SubmitTask,
    data: data
  });
};

/** 获取用户工资记录（分页，支持下拉刷新、上拉加载） */
export const getWageRecord = (params: { pageNo?: number; pageSize?: number }) => {
  return defHttp.get<CommonResult<AppActTaskWageRecordRespVO>>({
    url: TaskApi.GetWageRecord,
    params
  });
};

/** 获取指定日期的工资领取状态，bizDate 为数组 [年,月,日] 或字符串，传参格式 bizDate=2026-03-14 */
export const getWageRecordByDate = (params: { bizDate: string | number[] }) => {
  const pad2 = (n: number) => String(n).padStart(2, '0');
  const bizDate =
    Array.isArray(params.bizDate) && params.bizDate.length >= 3
      ? `${params.bizDate[0]}-${pad2(Number(params.bizDate[1]))}-${pad2(Number(params.bizDate[2]))}`
      : String(params.bizDate ?? '');
  return defHttp.get<CommonResult<AppActTaskWageRecordItemVO>>({
    url: TaskApi.GetWageRecordByDate,
    params: { bizDate }
  });
};

//领取每日工资

/** claimDailyWage */
export const claimDailyWage = (params: { bizDate: string | number[] }) => {
  const pad2 = (n: number) => String(n).padStart(2, '0');
  const bizDate =
    Array.isArray(params.bizDate) && params.bizDate.length >= 3
      ? `${params.bizDate[0]}-${pad2(Number(params.bizDate[1]))}-${pad2(Number(params.bizDate[2]))}`
      : String(params.bizDate ?? '');
  return defHttp.post<CommonResult<any>>({
    url: TaskApi.ClaimDailyWage,
    data: { bizDate }
  });
};
