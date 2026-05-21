import { defHttp } from '/@/utils/http/axios';

/** RankAppLatestRankReqVO：类型别名 */
export type RankAppLatestRankReqVO = {
  activityId: number;
};

/** RankAppLatestRankItemVO：类型别名 */
export type RankAppLatestRankItemVO = {
  rankNo: number;
  uid: number;
  uidMask: string;
  nickname: string;
  avatar: string;
  metricValue: number;
  rewardAmount: number;
  isRobot: number;
};

/** 当前用户在榜快照（与列表项字段相近）；null 表示未上榜 */
export type RankAppCurrentUserRankVO = {
  rankNo: number;
  nickname?: string;
  uidMask?: string;
  avatar?: string | null;
  metricValue?: number;
  rewardAmount?: number;
  uid?: number;
};

/** RankAppLatestRankRespVO：类型别名 */
export type RankAppLatestRankRespVO = {
  activityId: number;
  activityName: string;
  activityImage: string;
  periodId: number;
  /** 周期版本，分页拉榜与摘要需与之一致 */
  periodVersion?: number;
  periodNo: number;
  periodCode: string;
  periodStartTime: number;
  periodEndTime: number;
  rankList: RankAppLatestRankItemVO[];
  /** 上榜时为对象；null 表示未上榜 */
  currentUserRank?: RankAppCurrentUserRankVO | null;
};

/** 排行榜分页请求 */
export type RankLatestRankPageReqVO = {
  activityId: number;
  /** 当前活动周期，与 latest-rank 返回对齐 */
  periodId?: number;
  periodVersion?: number;
  pageNo: number;
  pageSize: number;
};

/** 排行榜分页响应（兼容 list / records / MyBatis 分页字段） */
export type RankLatestRankPageRespVO = {
  list?: RankAppLatestRankItemVO[];
  records?: RankAppLatestRankItemVO[];
  rankList?: RankAppLatestRankItemVO[];
  total?: number;
  totalCount?: number;
  totalElements?: number;
  current?: number;
  pages?: number;
};

/** RankAppExplainRewardVO：类型别名 */
export type RankAppExplainRewardVO = {
  rankNo: number;
  rewardAmount: number;
};

/** RankAppExplainRespVO：类型别名 */
export type RankAppExplainRespVO = {
  activityId: number;
  activityName: string;
  activityImage: string;
  startTime: number;
  endTime?: number;
  periodNum: number;
  cycleDays: number;
  rankStatType: number;
  rankThreshold: number;
  activityDesc: string;
  rewardList: RankAppExplainRewardVO[];
  /** 总上榜人数：>10 时第 4 名及以后走 latest-rank/page；≤10 仅用摘要 rankList */
  rankTotal?: number;
  rank_total?: number;
};

/** CommonResult：类型别名 */
export type CommonResult<T> = {
  code: number;
  msg: string;
  data: T;
  traceId?: string;
};

/** 获奖记录分页请求 POST /rank/reward-record/page */
export type RankAppRewardRecordPageReqVO = {
  pageNo: number;
  pageSize: number;
  activityId?: number;
  periodId?: number;
  /** 0 发放中 1 已发放 2 发放失败 */
  rewardStatus?: number;
  offset?: number;
};

/** 单条获奖记录（字段名兼容后端驼峰/下划线） */
export type RankAppRewardRecordItemVO = {
  id?: string | number;
  activityId?: number;
  activityName?: string;
  activity_name?: string;
  periodNo?: number;
  periodNum?: number;
  period_no?: number;
  rankNo?: number;
  rank_no?: number;
  rewardAmount?: number;
  reward_amount?: number;
  rewardCoin?: string;
  reward_coin?: string;
  createTime?: number;
  create_time?: number;
  activityStartTime?: number;
  activity_start_time?: number;
  startTime?: number;
  activityEndTime?: number;
  activity_end_time?: number;
  endTime?: number;
  rewardStatus?: number;
  reward_status?: number;
};

/** RankAppRewardRecordPageRespVO：类型别名 */
export type RankAppRewardRecordPageRespVO = {
  list?: RankAppRewardRecordItemVO[];
  records?: RankAppRewardRecordItemVO[];
  total?: number;
  totalCount?: number;
  totalElements?: number;
};

// -----------------------------------------------------------------------------
// 排行榜模块 API 封装
// - 最新一期排行榜信息
// - 活动说明 / 奖励配置
// -----------------------------------------------------------------------------

/** RankApi：枚举取值说明 */
enum RankApi {
  // 最新一期排行榜信息
  GetLatestRank = '/rank/latest-rank',

  // 活动说明 / 奖励配置
  GetRankExplain = '/rank/explain',

  // 活动最新一期排行榜分页接口
  GetRankLatestRankPage = '/rank/latest-rank/page',

  // 获奖记录分页
  GetRankRewardRecordPage = '/rank/reward-record/page'
}

/**
 * 最新一期排行榜信息
 * POST /app-api/rank/latest-rank
 */
export const getLatestRank = (data: RankAppLatestRankReqVO) => {
  return defHttp.post<CommonResult<RankAppLatestRankRespVO>>({
    url: RankApi.GetLatestRank,
    data
  });
};

/**
 * 活动说明 / 奖励配置
 * POST /app-api/rank/explain
 * 接口文档截图：活动ID、名称、说明、奖励档位等
 */
export const getRankExplain = () => {
  return defHttp.post<CommonResult<RankAppExplainRespVO>>({
    url: RankApi.GetRankExplain
  });
};

/**
 * 活动最新一期排行榜分页
 * POST /app-api/rank/latest-rank/page
 */
export const getRankLatestRankPage = (data: RankLatestRankPageReqVO) => {
  return defHttp.post<CommonResult<RankLatestRankPageRespVO | RankAppLatestRankItemVO[]>>({
    url: RankApi.GetRankLatestRankPage,
    data
  });
};

/**
 * 获奖记录分页
 * POST /app-api/rank/reward-record/page
 */
export const getRankRewardRecordPage = (data: RankAppRewardRecordPageReqVO) => {
  return defHttp.post<CommonResult<RankAppRewardRecordPageRespVO | RankAppRewardRecordItemVO[]>>({
    url: RankApi.GetRankRewardRecordPage,
    data
  });
};
