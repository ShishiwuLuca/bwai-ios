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
import {
  iosNativeToastOptions,
  isIOSNativeWebView,
  repairIOSWebViewLayers
} from '/@/utils/iosWebViewRepaint';

/** 临时全局关闭 Toast / Notify 弹层（排查 iOS WKWebView 等）；恢复时改为 false */
const TOAST_FEEDBACK_DISABLED = false;

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
  if (TOAST_FEEDBACK_DISABLED) return;
  return showSuccessToast(
    iosNativeToastOptions({
      message,
      onClose: () => {
        if (isIOSNativeWebView()) repairIOSWebViewLayers();
      }
    })
  );
};

// 失败提示

/** 提示与弹窗：CreateErrorToast */
const CreateErrorToast = (message: string) => {
  if (TOAST_FEEDBACK_DISABLED) return;

  const now = Date.now();
  if (message === lastFailToastMessage && now - lastFailToastAt < FAIL_TOAST_THROTTLE_MS) {
    return;
  }
  lastFailToastMessage = message;
  lastFailToastAt = now;

  if (isIOSNativeWebView()) {
    closeToast(true);
    repairIOSWebViewLayers();
    return showNotify({
      type: 'danger',
      message,
      duration: 3000,
      onClose: () => {
        repairIOSWebViewLayers();
      }
    });
  }

  return showFailToast(
    iosNativeToastOptions({
      message,
      onClose: () => {
        if (isIOSNativeWebView()) {
          repairIOSWebViewLayers();
        }
      }
    })
  );
};

// 加载提示（支持文案或 Vant Toast 配置，便于 forbidClick / duration 等与官方一致）

/** 加载中状态：CreateLoadingToast */
const CreateLoadingToast = (message: string | ToastOptions) => {
  if (TOAST_FEEDBACK_DISABLED) return;
  if (typeof message === 'string') {
    return showLoadingToast(iosNativeToastOptions({ message }));
  }
  return showLoadingToast(iosNativeToastOptions(message));
};

/** 关闭当前 Toast（与 CreateLoadingToast 等配对使用） */
const CreateCloseToast = () => {
  closeToast();
  if (isIOSNativeWebView()) {
    repairIOSWebViewLayers();
  }
};

// 自定义提示

/** 提示与弹窗：CreateToast */
const CreateToast = (message: string) => {
  if (TOAST_FEEDBACK_DISABLED) return;
  return showToast(
    iosNativeToastOptions({
      message,
      onClose: () => {
        if (isIOSNativeWebView()) repairIOSWebViewLayers();
      }
    })
  );
};

// 网络重连头部提示

/** CreateConnectNotify */
const CreateConnectNotify = (message: string) => {
  if (TOAST_FEEDBACK_DISABLED) return;
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
  if (TOAST_FEEDBACK_DISABLED) return;
  return showNotify({
    message: message,
    type: 'success',
    duration: 3000
  });
};

// 失败头部提示

/** CreateErrorNotify */
const CreateErrorNotify = (message: string) => {
  if (TOAST_FEEDBACK_DISABLED) return;
  if (isIOSNativeWebView()) {
    repairIOSWebViewLayers();
  }
  return showNotify({
    message: message,
    type: 'danger',
    duration: 3000,
    onClose: () => {
      if (isIOSNativeWebView()) repairIOSWebViewLayers();
    }
  });
};

// 警告头部提示

/** CreateWarningNotify */
const CreateWarningNotify = (message: string) => {
  if (TOAST_FEEDBACK_DISABLED) return;
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
