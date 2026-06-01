import { useRouter } from 'vue-router';
import { useI18n } from '/@/hooks/web/useI18n';
import type { ErrorMessageMode } from '/#/axios';
import { useMessage } from '/@/hooks/web/useMessage';
import { useUserStoreWithOut } from '/@/stores/modules/UserConfig';

/** 从 useMessage 解构的 Toast / Dialog 能力 */
const { CreateAlertDialog, CreateToast } = useMessage();

/** checkStatus */
export const checkStatus = (
  status: number,
  msg: string,
  errorMessageMode: ErrorMessageMode = 'message'
): void => {
  const { t } = useI18n();
  const userStore = useUserStoreWithOut();
  let errMessage = '';
  const router = useRouter();
  switch (status) {
    case 400:
      errMessage = `${msg}`;
      break;
    // 401: Not logged in
    // Jump to the login page if not logged in, and carry the path of the current page
    // Return to the current page after successful login. This step needs to be operated on the login page.
    case 401:
      userStore.setToken(null);
      errMessage = msg || t('errMsg401');
      router.push('/Login');
      break;
    case 403:
      errMessage = t('errMsg403');
      break;
    // 404请求不存在
    case 404:
      errMessage = t('errMsg404');
      break;
    case 405:
      errMessage = t('errMsg405');
      break;
    case 408:
      errMessage = t('errMsg408');
      break;
    case 500:
      // errMessage = t('errMsg500');
      router.push('/Login');
      break;
    case 501:
      // errMessage = t('errMsg501');
      break;
    case 502:
      // errMessage = t('errMsg502');
      break;
    case 503:
      // errMessage = t('errMsg503');
      break;
    case 504:
      // errMessage = t('errMsg504');
      break;
    case 505:
      // errMessage = t('errMsg505');
      break;
    default:
  }
  if (errMessage) {
    if (errorMessageMode === 'modal') {
      CreateAlertDialog({ title: t('common_title_text'), message: errMessage });
    } else if (errorMessageMode === 'message') {
      CreateToast(errMessage);
    }
  }
};
