import { defHttp } from '/@/utils/http/axios';

// -----------------------------------------------------------------------------
// 钱包模块 API 封装
// - 获取我的钱包信息
// -----------------------------------------------------------------------------

/** WalletApi：枚举取值说明 */
enum WalletApi {
  // 获取我的钱包信息
  GetMyWalletInfo = '/member/app/wallet/get',

  // 获取钱包交易记录
  GetWalletTransactionHistory = '/member/app/wallet/getTransactionPage',

  // 获取充值地址
  GetRechargeAddress = '/manager/user-deposit-addr/get-by',

  // 获取账户余额和手续费
  GetAccountBalanceAndFee = '/manager/withdraw-addr/withdraw-info',

  // 提交提现
  SubmitWithdraw = '/manager/withdraw-addr/submit-withdraw',

  // 获取地址簿列表
  GetAddressBookList = '/manager/withdraw-addr/list',

  // 新增地址
  AddAddress = '/manager/withdraw-addr/create',

  // 修改地址
  UpdateAddress = '/manager/withdraw-addr/update',

  // 删除地址
  DeleteAddress = '/manager/withdraw-addr/delete',

  // 获取转账手续费
  GetTransferFee = '/manager/transfer/fee-config',

  // 提交转账
  SubmitTransfer = '/manager/transfer/create'
}

/**
 * 获取我的钱包信息
 * POST /member/app/wallet/get
 */
export const getMyWalletInfo = (data: any) => {
  return defHttp.post({ url: WalletApi.GetMyWalletInfo, data });
};

/**
 * 获取钱包交易记录
 * POST /member/app/wallet/getTransactionPage
 */
export const getWalletTransactionHistory = (data: any) => {
  return defHttp.post({ url: WalletApi.GetWalletTransactionHistory, data });
};

/**
 * 获取充值地址
 * POST /manager/user-deposit-addr/get-by
 */
export const getRechargeAddress = (data: any) => {
  return defHttp.post({ url: WalletApi.GetRechargeAddress, data });
};

/**
 * 获取账户余额和手续费
 * POST /member/app/wallet/getAccountBalanceAndFee
 */
export const getAccountBalanceAndFee = (data: any) => {
  return defHttp.post({ url: WalletApi.GetAccountBalanceAndFee, data });
};

/**
 * 提交提现
 * POST /manager/withdraw-addr/submit-withdraw
 */
export const submitWithdraw = (data: any) => {
  return defHttp.post({ url: WalletApi.SubmitWithdraw, data });
};

/**
 * 获取地址簿列表
 * POST /manager/withdraw-addr/list
 */
export const getAddressBookList = (data: any) => {
  return defHttp.get({ url: WalletApi.GetAddressBookList, params: data });
};

/**
 * 新增地址
 * POST /manager/withdraw-addr/create
 */
export const addAddress = (data: any) => {
  return defHttp.post({ url: WalletApi.AddAddress, data });
};

/**
 * 修改地址
 * POST /manager/withdraw-addr/update
 */
export const updateAddress = (data: any) => {
  return defHttp.post({ url: WalletApi.UpdateAddress, data });
};

/**
 * 删除地址
 * POST /manager/withdraw-addr/delete
 */
export const deleteAddress = (data: any) => {
  return defHttp.post({ url: WalletApi.DeleteAddress, data });
};

/**
 * 获取转账手续费
 * POST /manager/transfer/fee-config
 */
export const getTransferFee = (data: any) => {
  return defHttp.post({ url: WalletApi.GetTransferFee, data });
};

/**
 * 提交转账
 * POST /manager/transfer/create
 */
export const submitTransfer = (data: any) => {
  return defHttp.post({ url: WalletApi.SubmitTransfer, data });
};
