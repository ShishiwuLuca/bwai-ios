import axios from 'axios';
import { useI18n } from '/@/hooks/web/useI18n';
import { useMessage } from '/@/hooks/web/useMessage';
import { repairIOSWebViewLayers } from '/@/utils/iosWebViewRepaint';

/** axios 响应拦截器已对网络/超时弹过 Toast 时，页面 catch 不再重复弹 */
export const isAxiosNetworkOrTimeoutError = (error: unknown): boolean => {
  if (!axios.isAxiosError(error)) return false;
  const message = error.message || '';
  if (error.code === 'ECONNABORTED' && message.includes('timeout')) return true;
  if (message.includes('Network Error')) return true;
  return false;
};

/**
 * 社区列表等场景的统一失败提示：避免与 defHttp 拦截器双 Toast，并在 iOS 上促发重绘。
 */
export const notifyApiRequestFailed = (error?: unknown): void => {
  if (isAxiosNetworkOrTimeoutError(error)) {
    repairIOSWebViewLayers();
    return;
  }
  const { t } = useI18n();
  const { CreateErrorToast } = useMessage();
  CreateErrorToast(t('apiRequestFailed'));
};
