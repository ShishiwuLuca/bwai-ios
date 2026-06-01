import { defHttp } from '/@/utils/http/axios';

/**
 * 我的奖励信息（POST /app-api/member/app/reward/get 返回的 data）
 * 类型说明：amount1 直推, amount2 越级(超级), amount3 平级, amount4 极差
 */
export interface MyRewardVo {
  /** 类型1：直推奖励金额 */
  amount1?: number;
  /** 直推有效用户数 */
  directActiveCount?: number;
  /** 类型2：越级奖励（对应 UI 超级奖励） */
  amount2?: number;
  /** 类型3：平级奖励 */
  amount3?: number;
  /** 类型4：极差奖励 */
  amount4?: number;
  /** VIP 奖励汇总（amount2+amount3+amount4），对应 UI 累计奖励 */
  vipAmount?: number;
  /** 等级比例列表，用于奖励比例表 */
  rebatSettingLevelList?: RebatSettingLevelItem[];
}

/** 等级比例项：直推有效用户数量、下级代表、奖励比例 */
export interface RebatSettingLevelItem {
  id?: number;
  directCount?: number;
  agentLevel?: number;
  rate?: number;
  etime?: string;
  eby?: string;
}

/** 极差奖励订单单条记录（POST /app-api/member/app/reward/getTeamOrderPage 返回的 data.list 项） */
export interface TeamRewardOrderVo {
  id?: number;
  /** 周期时间（发放时间） */
  orderTime?: string;
  /** 会员ID */
  uid?: number;
  /** 奖励类型：1 直推, 2 越级, 3 平级, 4 极差 */
  itemType?: number;
  /** 奖励金额 */
  rewardAmount?: number;
}

/** 获取极差奖励订单分页请求体 */
export interface TeamRewardOrderPageReq {
  pageNo: number;
  pageSize: number;
  /** 会员ID，可选，默认取当前登录用户 */
  uid?: number;
  /** 周期开始时间（yyyy-MM-dd 字符串） */
  dateFrom?: string;
  /** 周期结束时间（yyyy-MM-dd 字符串） */
  dateTo?: string;
  offset?: number;
}

/** PageResultTeamRewardOrderVo：接口数据结构定义（订单） */
export interface PageResultTeamRewardOrderVo {
  total: number;
  list: TeamRewardOrderVo[];
}

/** CommonResult：接口数据结构定义（事件或回调处理） */
interface CommonResult<T = unknown> {
  code: number;
  msg: string;
  data: T;
}

/**
 * 获取我的奖励信息（VIP 奖励、推荐奖励等）
 * POST /app-api/member/app/reward/get，无入参
 */
export const getRewardInfo = () => {
  return defHttp.post<CommonResult<MyRewardVo>>({
    url: '/member/app/reward/get'
  });
};

/**
 * 获取极差奖励订单分页
 * POST /app-api/member/app/reward/getTeamOrderPage
 * 请求示例：{ pageNo, pageSize, uid, dateFrom, dateTo, offset }
 */
export const getTeamRewardOrderPage = (data: TeamRewardOrderPageReq) => {
  return defHttp.post<CommonResult<PageResultTeamRewardOrderVo>>({
    url: '/member/app/reward/getTeamOrderPage',
    data
  });
};

/**
 * 获取分润订单分页（推荐奖励明细）
 * POST /app-api/member/app/reward/getRebatOrderPage
 * 返回体结构与 getTeamOrderPage 一致
 */
export const getRebatOrderPage = (data: TeamRewardOrderPageReq) => {
  return defHttp.post<CommonResult<PageResultTeamRewardOrderVo>>({
    url: '/member/app/reward/getRebatOrderPage',
    data
  });
};
