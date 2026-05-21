import { parse } from 'tldts';
import pkg from '../../package.json';
import type { GlobEnvConfig } from '/#/config';
import { getConfigFileName } from '../../build/getConfigFileName';

/** 事件或回调处理：getCommonStoragePrefix */
export const getCommonStoragePrefix = () => {
  const { VITE_GLOB_APP_SHORT_NAME } = getAppEnvConfig();
  return `${VITE_GLOB_APP_SHORT_NAME}__${getEnv()}`.toUpperCase();
};

/** getStorageShortName */
export const getStorageShortName = () => {
  return `${getCommonStoragePrefix()}${`__${pkg.version}`}__`.toUpperCase();
};

/** getServicePath */
export const getServicePath = () => {
  const { VITE_GLOB_API_URL } = getAppEnvConfig();
  const result = parse(location.origin);
  // 开发环境
  if (import.meta.env.DEV) {
    return VITE_GLOB_API_URL;
  } else {
    // 生产环境：使用当前访问域名的一级域名
    if (result && result.domain) {
      // 返回完整的一级域名（包含协议）
      return result.domain;
    } else {
      return VITE_GLOB_API_URL;
    }
  }
};

/** 配置：getAppEnvConfig */
export const getAppEnvConfig = () => {
  const ENV_NAME = getConfigFileName(import.meta.env);
  // 开发环境直接使用 import.meta.env，生产环境优先读取 window 中注入的全局配置
  // 某些运行环境（如内嵌 WebView / 原生容器）可能未注入 window[ENV_NAME]，此时回退到 import.meta.env
  let ENV = import.meta.env.DEV
    ? (import.meta.env as unknown as GlobEnvConfig)
    : (window[ENV_NAME as any] as unknown as GlobEnvConfig | undefined);
  if (!ENV) {
    ENV = import.meta.env as unknown as GlobEnvConfig;
  }
  const {
    VITE_GLOB_APP_TITLE,
    VITE_GLOB_API_URL,
    VITE_GLOB_APP_SHORT_NAME,
    VITE_GLOB_API_URL_PREFIX,
    VITE_GLOB_UPLOAD_URL,
    VITE_GLOB_ENCRYPT,
    VITE_GLOB_PUBLICKEY,
    VITE_API_PATH,
    VITE_PUBLIC_PATH,
    VITE_GLOB_SYSTEM_VERSION,
    VITE_GLOB_PROXY
  } = ENV;
  return {
    VITE_GLOB_APP_TITLE,
    VITE_GLOB_API_URL,
    VITE_GLOB_APP_SHORT_NAME,
    VITE_GLOB_API_URL_PREFIX,
    VITE_GLOB_UPLOAD_URL,
    VITE_GLOB_ENCRYPT,
    VITE_GLOB_PUBLICKEY,
    VITE_API_PATH,
    VITE_PUBLIC_PATH,
    VITE_GLOB_SYSTEM_VERSION,
    VITE_GLOB_PROXY
  };
};
/**
 * @description: Development mode
 */
export const devMode = 'development';
/**
 * @description: Production mode
 */
export const prodMode = 'production';

/** 环境变量：getEnv */
export const getEnv = (): string => {
  return import.meta.env.MODE;
};

/** isDevMode */
export const isDevMode = (): boolean => {
  return import.meta.env.DEV;
};

/** isProdMode */
export const isProdMode = (): boolean => {
  return import.meta.env.PROD;
};
