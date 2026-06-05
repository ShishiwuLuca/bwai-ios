/**
 * 视图层公共类型：表单、列表项等，供 .vue 使用
 */

/** 登录/注册/忘记密码 表单 */
export interface AuthForm {
  email: string;
  phone: string;
  password: string;
  code?: string;
  password2?: string;
  inviteCode?: string;
}

/** 修改地址（编辑/新增）表单 */
export interface AddressForm {
  type?: string;
  remark: string;
  address: string;
}

/** 转账表单 */
export interface TransferForm {
  currency: string;
  address: string;
  amount: string;
}

/** 提币表单 */
export interface WithdrawForm {
  currency: string;
  network: string;
  address: string;
  amount: string;
  fee: string;
  receive: string;
  password: string;
  googleCode: string;
}

/** 登录/交易密码修改表单（旧密码、新密码、确认密码） */
export interface PasswordForm {
  old: string;
  new: string;
  confirm: string;
}

/** 设置交易密码表单 */
export interface SetTradePasswordForm {
  newPwd: string;
  confirmPwd: string;
}

/** 申购表单 */
export interface InvestJoinForm {
  currency: string;
  lockDays: string;
  arriveDate: string;
  arriveType: string;
  income: string;
  remark: string;
  redeemAmount: string;
  redeemable: string;
  autoReinvest: string;
  autoReinvestBool: boolean;
}

/** ECharts K 线/成交量 数据源 */
export interface EChartsSourceData {
  dataList?: unknown[];
  price?: [number, number, number, number][];
  volumes?: unknown[];
}
