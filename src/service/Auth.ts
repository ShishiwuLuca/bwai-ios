import { defHttp } from '/@/utils/http/axios';

/** 邮箱+密码登录 请求参数 */
export type AppAuthEmailLoginReqVO = {
  email: string;
  password: string;
};

/** 手机+密码登录 请求参数 */
export type AppAuthLoginReqVO = {
  mobile: string;
  password: string;
  countryCode?: string;
};

/** 发送验证码 请求参数 */
export type AppAuthSendSmsCodeReqVO = {
  target?: string;
  type?: string;
  scene?: string;
  countryCode?: string;
  mobile?: string;
  email?: string;
};

/** 校验手机验证码 请求参数 */
export type AppAuthValidateSmsCodeReqVO = {
  mobile: string;
  code: string;
};

/** 登录成功返回数据（按常见后端约定，可据实际接口调整） */
export type AppAuthLoginRespVO = {
  accessToken?: string;
  token?: string;
  refreshToken?: string;
  userId?: number;
  [key: string]: unknown;
};

/** CommonResult：类型别名 */
export type CommonResult<T> = {
  code: number;
  msg: string;
  data: T;
  traceId?: string;
};

// -----------------------------------------------------------------------------
// 认证模块 API 封装
// - 登录
// - 注册
// - 退出登录
// - 获取用户信息
// -----------------------------------------------------------------------------

/** AuthApi：枚举取值说明 */
enum AuthApi {
  // 登录
  Login = '/member/auth/login',

  // 邮箱 + 密码登录
  LoginByEmail = '/member/auth/login-by-email',

  // 发送验证码
  SendSmsCode = '/member/verify/send-public',

  // 登录状态发送验证码
  SendLoginSmsCode = '/member/verify/send',

  // 校验手机验证码
  ValidateSmsCode = '/member/auth/validate-sms-code',

  // 邮箱注册
  RegisterByEmail = '/member/app/user/regedit/email',

  // 手机注册
  RegisterByPhone = '/member/app/user/regedit/phone',

  // 退出登录
  Logout = '/member/auth/logout',

  // 获取用户信息
  GetUserInfo = '/member/app/user/get'
}

/**
 * 手机 + 密码登录
 * POST /member/auth/login
 */
export const login = (params: AppAuthLoginReqVO) => {
  return defHttp.post<CommonResult<AppAuthLoginRespVO>>({
    url: AuthApi.Login,
    data: params
  });
};

/**
 * 邮箱 + 密码登录
 * POST /member/auth/login-by-email
 */
export const loginByEmail = (params: AppAuthEmailLoginReqVO) => {
  return defHttp.post<CommonResult<AppAuthLoginRespVO>>({
    url: AuthApi.LoginByEmail,
    data: params
  });
};

/**
 * 发送验证码
 * POST /member/auth/send-sms-code
 */
export const sendSmsCode = (params: AppAuthSendSmsCodeReqVO) => {
  return defHttp.post<CommonResult<unknown>>({ url: AuthApi.SendSmsCode, data: params });
};

/**
 * 登录状态发送验证码
 * @param params
 * @returns
 */
export const sendLoginSmsCode = (params: AppAuthSendSmsCodeReqVO) => {
  return defHttp.post<CommonResult<unknown>>({ url: AuthApi.SendLoginSmsCode, data: params });
};

/**
 * 校验手机验证码
 * POST /member/auth/validate-sms-code
 */
export const validateSmsCode = (params: AppAuthValidateSmsCodeReqVO) => {
  return defHttp.post<CommonResult<unknown>>({
    url: AuthApi.ValidateSmsCode,
    data: params
  });
};

/** 公共注册基础字段 */
type AppRegisterBaseReqVO = {
  /** 登录密码 */
  loginPword: string;
  /** 邀请码（可选） */
  inviteCode?: string;
};

/** 邮箱注册请求参数 */
export type AppRegisterByEmailReqVO = AppRegisterBaseReqVO & {
  email: string;
};

/** 手机注册请求参数 */
export type AppRegisterByPhoneReqVO = AppRegisterBaseReqVO & {
  mobileNumber: string;
  /** 短信验证码 */
  code: string;
};

/** 邮箱注册：POST /member/app/user/regedit/email */
export const RegisterByEmail = (params: AppRegisterByEmailReqVO) => {
  return defHttp.post<CommonResult<AppAuthLoginRespVO>>({
    url: AuthApi.RegisterByEmail,
    data: params
  });
};

/** 手机注册：POST /member/app/user/regedit/phone */
export const RegisterByPhone = (params: AppRegisterByPhoneReqVO) => {
  return defHttp.post<CommonResult<AppAuthLoginRespVO>>({
    url: AuthApi.RegisterByPhone,
    data: params
  });
};

/**
 * 退出登录
 * POST /member/auth/logout
 */
export const logout = () => {
  return defHttp.post<CommonResult<unknown>>({ url: AuthApi.Logout });
};

/**
 * 获取用户信息
 * GET /member/app/user/get
 */
export const getUserInfo = () => {
  return defHttp.post<CommonResult<AppAuthLoginRespVO>>({ url: AuthApi.GetUserInfo });
};
