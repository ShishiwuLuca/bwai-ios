import { defHttp } from '/@/utils/http/axios';

// -----------------------------------------------------------------------------
// 用户模块 API 封装
// - 修改密码
// -----------------------------------------------------------------------------

/** UserApi：枚举取值说明 */
enum UserApi {
  // 修改密码
  ChangePassword = '/member/app/user/update-password',

  // 修改交易密码
  ChangeTradePassword = '/member/app/user/updateCapitalPword',

  // 找回密码
  FindPassword = '/member/app/user/reset-password',

  // 生成谷歌验证码
  GenerateGoogleCode = '/member/app/user/createGoogleCode',

  // 绑定谷歌验证码
  BindGoogleCode = '/member/app/user/bindGoogleCode',

  // 解绑谷歌验证码
  UnbindGoogleCode = '/member/app/user/unbindGoogleCode',

  // 绑定手机
  BindPhone = '/member/app/user/bindPhoneNum',

  // 绑定邮箱
  BindEmail = '/member/app/user/bindEmail',

  // 修改个人信息
  UpdateUserInfo = '/member/app/user/update',

  // 获取我的流水信息
  GetMyTransactionHistory = '/member/app/wallet/transactionHistory'
}

/**
 * 修改密码
 * POST /member/app/user/change-password
 */
export const changePassword = (data: any) => {
  return defHttp.post({ url: UserApi.ChangePassword, data });
};

/**
 * 修改交易密码
 * POST /member/app/user/updateCapitalPword
 */
export const changeTradePassword = (data: any) => {
  return defHttp.post({ url: UserApi.ChangeTradePassword, data });
};

/**
 * 找回密码
 * POST /member/app/user/findPassword
 */
export const findPassword = (data: any) => {
  return defHttp.post({ url: UserApi.FindPassword, data });
};

/**
 * 生成谷歌验证码
 * POST /member/app/user/createGoogleCode
 */
export const generateGoogleCode = (data?: any) => {
  return defHttp.post({ url: UserApi.GenerateGoogleCode, data });
};

/**
 * 绑定谷歌验证码
 * POST /member/app/user/bindGoogleCode
 */
export const bindGoogleCode = (data: any) => {
  return defHttp.post({ url: UserApi.BindGoogleCode, data });
};

/**
 * 解绑谷歌验证码
 * POST /member/app/user/unbindGoogleCode
 */
export const unbindGoogleCode = (data: any) => {
  return defHttp.post({ url: UserApi.UnbindGoogleCode, data });
};

/**
 * 绑定手机
 * POST /member/app/user/bindPhoneNum
 */
export const bindPhone = (data: any) => {
  return defHttp.post({ url: UserApi.BindPhone, data });
};

/**
 * 绑定邮箱
 * POST /member/app/user/bindEmail
 */
export const bindEmail = (data: any) => {
  return defHttp.post({ url: UserApi.BindEmail, data });
};

/**
 * 修改个人信息
 * POST /member/app/user/update
 */
export const updateUserInfo = (data: any) => {
  return defHttp.post({ url: UserApi.UpdateUserInfo, data });
};

/**
 * 获取我的流水信息
 * POST /member/app/wallet/transactionHistory
 */
export const getMyTransactionHistory = (data: any) => {
  return defHttp.post({ url: UserApi.GetMyTransactionHistory, data });
};
