import { md5 } from 'js-md5';
import CryptoJS from 'crypto-js';
import { getAppEnvConfig } from '/@/utils/env';
import { useUserStoreWithOut } from '/@/stores/modules/UserConfig';
// 获取密钥

/** 解构赋值：组合式 API 返回的一组方法或状态 */
const { VITE_GLOB_PUBLICKEY } = getAppEnvConfig();

/** EncryptionParams：接口数据结构定义（事件或回调处理） */
export interface EncryptionParams {
  key: string;
  iv: string;
}
export class AesEncryption {
  private key;
  private iv;
  constructor(opt: Partial<EncryptionParams> = {}) {
    const { key = '_11111000001111', iv = '11111000001111_' } = opt;
    if (key) {
      this.key = CryptoJS.enc.Utf8.parse(key);
    }
    if (iv) {
      this.iv = CryptoJS.enc.Utf8.parse(iv);
    }
  }
  get getOptions(): {
    mode: unknown;
    padding: unknown;
    iv: unknown;
  } {
    return {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
      iv: this.iv
    };
  }
  encryptByAES(cipherText: string) {
    if (!this.key) throw new Error('AES key not set');
    return CryptoJS.AES.encrypt(
      cipherText,
      this.key,
      this.getOptions as Parameters<typeof CryptoJS.AES.encrypt>[2]
    ).toString();
  }
  decryptByAES(cipherText: string) {
    if (!this.key) throw new Error('AES key not set');
    return CryptoJS.AES.decrypt(
      cipherText,
      this.key,
      this.getOptions as Parameters<typeof CryptoJS.AES.decrypt>[2]
    ).toString(CryptoJS.enc.Utf8);
  }
}

/** encryptByBase64 */
export const encryptByBase64 = (cipherText: string) => {
  return CryptoJS.enc.Utf8.parse(cipherText).toString(CryptoJS.enc.Base64);
};

/** decodeByBase64 */
export const decodeByBase64 = (cipherText: string) => {
  return CryptoJS.enc.Base64.parse(cipherText).toString(CryptoJS.enc.Utf8);
};

/** encryptByMd5 */
export const encryptByMd5 = (password: string) => {
  return md5(password);
};

/** EncryptParams */
export const EncryptParams = (data: string) => {
  const userStore = useUserStoreWithOut();
  // 获取Token
  const token: any = userStore.getToken;
  // 加密
  let Md5Key: any = md5(VITE_GLOB_PUBLICKEY);
  // 验证Token是否存在
  if (token) {
    Md5Key = md5(VITE_GLOB_PUBLICKEY + token);
  }
  // 截取 16位字符串
  const SubString = Md5Key.substring(0, 16);
  // 转换截取后的16位密钥
  const Key = CryptoJS.enc.Utf8.parse(SubString);
  // 转换参数
  const Params = CryptoJS.enc.Utf8.parse(data);
  // 加密参数
  const Encrypted = CryptoJS.AES.encrypt(Params, Key, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7
  });
  // 返回加密后的参数
  return Encrypted.toString();
};
