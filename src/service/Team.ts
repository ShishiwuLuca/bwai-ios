import { defHttp } from '/@/utils/http/axios';
import type { CommonResult } from './Task';

/** 团队信息（POST /app-api/member/app/team/get 返回的 data） */
export interface MyTeamVo {
  /** 直推人数 */
  dcount1?: number;
  /** 直推有效用户数 */
  dcount2?: number;
  /** 团队总人数 */
  tcount1?: number;
  /** 团队有效用户数 */
  tcount2?: number;
  /** 团队投资中的金额 */
  teamInvestAmount?: number;
  /** 个人投资中的金额 */
  myInvestAmount?: number;
  uid?: number;
  pid?: number;
  level?: string;
  email?: string;
  mobileNumber?: number;
  /** 注册时间 */
  ctime?: string;
  /** 是否有效用户 0/1 */
  active?: number;
  /** 邀请码 */
  myInviteCode?: string;
  /** 我的晋级点 */
  directPoint?: number;
}

/** 下级成员单条（POST /app-api/member/app/team/getChildren 返回的 data.list 项） */
export interface TeamMemberVo {
  uid?: number;
  level?: string;
  email?: string;
  mobileNumber?: number;
  /** 注册时间 */
  ctime?: string;
  /** 是否有效用户 0/1 */
  active?: number;
  /** 团队人数 */
  teamCount?: number;
  /** 团队有效人数 */
  teamActiveCount?: number;
  /** 个人投资中的金额 */
  myInvestAmount?: number;
  /** 团队投资中的金额 */
  teamInvestAmount?: number;
  stat?: Record<string, unknown>;
  traceId?: string;
}

/** 下级成员分页请求（getChildren 入参） */
export interface GetTeamChildrenReqVO {
  pageNo: number;
  pageSize: number;
  uid?: number;
  offset?: number;
}

/** 分页结果 */
export interface PageResultTeamMemberVo {
  total: number;
  list: TeamMemberVo[];
}

/** TeamApi：枚举取值说明 */
enum TeamApi {
  /** 获取团队信息（团队总览、邀请码等） */
  GetTeamInfo = '/member/app/team/get',
  /** 下级成员列表分页 */
  GetTeamChildren = '/member/app/team/getChildren',

  /** 获取团队奖励配置 */
  GetTeamRewardConfig = '/member/app/reward/getTeamRewardLevelSetting'
}

/**
 * 获取团队信息（团队总览、邀请码等）
 * POST /app-api/member/app/team/get，无入参
 */
export const getTeamInfo = () => {
  return defHttp.post<CommonResult<MyTeamVo>>({
    url: TeamApi.GetTeamInfo
  });
};

/**
 * 下级成员列表分页
 * POST /app-api/member/app/team/getChildren，body: pageNo、pageSize 必填，uid、offset 选填
 */
export const getTeamChildren = (data: GetTeamChildrenReqVO) => {
  return defHttp.post<CommonResult<PageResultTeamMemberVo>>({
    url: TeamApi.GetTeamChildren,
    data
  });
};

/**
 * 获取团队奖励配置
 * POST /app-api/member/app/reward/getTeamRewardLevelSetting，无入参
 */
export const getTeamRewardConfig = () => {
  return defHttp.post<CommonResult<Record<string, unknown>>>({
    url: TeamApi.GetTeamRewardConfig
  });
};
