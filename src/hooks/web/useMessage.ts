import { useI18n } from '/@/hooks/web/useI18n';
import type { ToastOptions } from 'vant';
import {
  showConfirmDialog,
  showDialog,
  showSuccessToast,
  showLoadingToast,
  showFailToast,
  showToast,
  showNotify,
  closeToast
} from 'vant';
import { isIOSNativeWebView, nudgeIOSWebViewRepaint } from '/@/utils/iosWebViewRepaint';

/** 同文案短时只弹一次，减轻 iOS WKWebView 上 Toast 合成层堆积 */
const FAIL_TOAST_THROTTLE_MS = 1500;
let lastFailToastMessage = '';
let lastFailToastAt = 0;

// 处理参数

/** getOptions */
const getOptions = (options: any) => {
  const { t } = useI18n();
  options.title = options.title ?? t('common_title_text');
  options.theme = 'round-button';
  return {
    ...options
  };
};

// 确认/取消弹窗

/** CreateConfirmDialog */
const CreateConfirmDialog = (option: any) => {
  const Options = getOptions(option);
  return showConfirmDialog(Options);
};

// 确认弹窗

/** CreateAlertDialog */
const CreateAlertDialog = (option: any) => {
  const Options = getOptions(option);
  return showDialog(Options);
};

// 成功提示

/** 提示与弹窗：CreateSuccessToast */
const CreateSuccessToast = (message: string) => {
  return showSuccessToast(message);
};

// 失败提示

/** 提示与弹窗：CreateErrorToast */
const CreateErrorToast = (message: string) => {
  const now = Date.now();
  if (message === lastFailToastMessage && now - lastFailToastAt < FAIL_TOAST_THROTTLE_MS) {
    return;
  }
  lastFailToastMessage = message;
  lastFailToastAt = now;

  if (isIOSNativeWebView()) {
    closeToast(true);
  }

  return showFailToast({
    message,
    onClose: () => {
      if (isIOSNativeWebView()) {
        nudgeIOSWebViewRepaint();
      }
    }
  });
};

// 加载提示（支持文案或 Vant Toast 配置，便于 forbidClick / duration 等与官方一致）

/** 加载中状态：CreateLoadingToast */
const CreateLoadingToast = (message: string | ToastOptions) => {
  return showLoadingToast(message);
};

/** 关闭当前 Toast（与 CreateLoadingToast 等配对使用） */
const CreateCloseToast = () => {
  closeToast();
};

// 自定义提示

/** 提示与弹窗：CreateToast */
const CreateToast = (message: string) => {
  return showToast(message);
};

// 网络重连头部提示

/** CreateConnectNotify */
const CreateConnectNotify = (message: string) => {
  return showNotify({
    message: message,
    color: '#ad0000',
    background: '#ffe1e1',
    duration: 3000
  });
};

// 成功头部提示

/** CreateSuccessNotify */
const CreateSuccessNotify = (message: string) => {
  return showNotify({
    message: message,
    type: 'success',
    duration: 3000
  });
};

// 失败头部提示

/** CreateErrorNotify */
const CreateErrorNotify = (message: string) => {
  return showNotify({
    message: message,
    type: 'danger',
    duration: 3000
  });
};

// 警告头部提示

/** CreateWarningNotify */
const CreateWarningNotify = (message: string) => {
  return showNotify({
    message: message,
    type: 'warning',
    duration: 3000
  });
};

/** 提示与弹窗：useMessage */
export const useMessage = () => {
  return {
    CreateConfirmDialog,
    CreateAlertDialog,
    CreateSuccessToast,
    CreateErrorToast,
    CreateLoadingToast,
    CreateCloseToast,
    CreateToast,
    CreateConnectNotify,
    CreateSuccessNotify,
    CreateErrorNotify,
    CreateWarningNotify
  };
};
