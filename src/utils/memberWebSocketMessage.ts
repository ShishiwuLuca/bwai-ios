import { router } from '/@/router';
import { emitEvent } from '/@/utils/eventBus';
import { isNative } from '/@/hooks/useAppInfo';
import { useI18n } from '/@/hooks/web/useI18n';
import { useMessage } from '/@/hooks/web/useMessage';
import { useUserStoreWithOut } from '/@/stores/modules/UserConfig';
import { syncAppIconBadgeWithUnreadCount } from '/@/utils/appIconBadge';
import { presentWsSystemPushOnNative } from '/@/utils/appNativeNotify';
import { reloadCurrentLocaleFromServerIfMatchesPushedLocale } from '/@/locales/useLocale';

/** 站内信未读/收件箱刷新（NoticeList 等页面订阅） */
export const MEMBER_WS_REFRESH_MY_MESSAGES = 'MemberWsRefreshMyMessages';

/** 解析事件键 */
const parseEventKey = (obj: Record<string, unknown>): string => {
  let raw = String(obj.event ?? obj.type ?? obj.cmd ?? '').trim();
  if (!raw && obj.data && typeof obj.data === 'object') {
    const d = obj.data as Record<string, unknown>;
    raw = String(d.event ?? d.type ?? d.cmd ?? '').trim();
  }
  return raw.toLowerCase();
};

/** 提取站内信文本 */
const pickNoticeText = (obj: Record<string, unknown>): string => {
  const keys = ['title', 'content', 'message', 'body', 'msg'] as const;
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  const data = obj.data;
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    for (const k of keys) {
      const v = d[k];
      if (typeof v === 'string' && v.trim()) return v.trim();
    }
  }
  return '';
};

/** 多语言包更新推送：从各层 payload 中尽量解析语言码 */
const extractPushedLocaleFromMemberWsPayload = (obj: Record<string, unknown>): string => {
  const tryPick = (r: Record<string, unknown>): string => {
    const keys = ['locale', 'lang', 'langCode', 'language', 'localeCode', 'lang_code'] as const;
    for (const k of keys) {
      const v = r[k];
      if (typeof v === 'string' && v.trim()) return v.trim();
    }
    return '';
  };
  const content = obj.content;
  if (content && typeof content === 'object') {
    const c = content as Record<string, unknown>;
    const data = c.data;
    if (data && typeof data === 'object') {
      const hit = tryPick(data as Record<string, unknown>);
      if (hit) return hit;
    }
    const hit2 = tryPick(c);
    if (hit2) return hit2;
  }
  const data = obj.data;
  if (data && typeof data === 'object') {
    const hit3 = tryPick(data as Record<string, unknown>);
    if (hit3) return hit3;
  }
  return tryPick(obj);
};

/** 清除登录并重定向 */
const clearLoginAndRedirect = (reasonKey: 'ExpiredLoginOut' | 'KillLoginOut'): void => {
  const userStore = useUserStoreWithOut();
  const { CreateAlertDialog } = useMessage();
  const { t } = useI18n();
  presentWsSystemPushOnNative(t('common_title_text'), t(reasonKey), 'warning');
  userStore.LoginOut();
  CreateAlertDialog({
    title: t('common_title_text'),
    message: t(reasonKey)
  }).then(() => {
    if (router.currentRoute.value.path !== '/Login') {
      router.replace('/Login');
    }
  });
};

/**
 * 会员通道推送：事件名与后端约定一致（见 WS 事件表）
 */
export const handleMemberWsMessage = (raw: string | ArrayBuffer | null): void => {
  if (!raw || typeof raw !== 'string') return;

  let payload: unknown = null;
  try {
    payload = JSON.parse(raw) as unknown;
  } catch {
    return;
  }

  if (!payload || typeof payload !== 'object') return;

  const obj = payload as Record<string, unknown>;
  const eventKey = parseEventKey(obj);
  if (!eventKey) return;

  const userStore = useUserStoreWithOut();
  const { t } = useI18n();

  const { CreateToast } = useMessage();

  switch (eventKey) {
    /** 会话过期 */
    case 'session.expired':
      clearLoginAndRedirect('ExpiredLoginOut');
      break;

    /** 远程登录/踢出登录 */
    case 'session.remote-login':
    case 'session.kickout':
      clearLoginAndRedirect('KillLoginOut');
      break;

    /** 账户余额变化 */
    case 'account.balance.change':
      userStore.fetchUserInfo();
      userStore.fetchAssetCurrencyList();
      presentWsSystemPushOnNative(t('common_title_text'), pickNoticeText(obj), 'success');
      break;

    /** 我的消息 */
    case 'notify-unread-update':
    case 'message.inbox':
      emitEvent(MEMBER_WS_REFRESH_MY_MESSAGES);
      presentWsSystemPushOnNative(t('str_my_message'), pickNoticeText(obj), 'success');
      void syncAppIconBadgeWithUnreadCount();
      break;

    /** 站内信 */
    case 'message.notice': {
      const text = pickNoticeText(obj) || t('str_my_message');
      if (isNative) {
        presentWsSystemPushOnNative(t('str_my_message'), text, 'success');
      } else {
        CreateToast(text);
      }
      emitEvent(MEMBER_WS_REFRESH_MY_MESSAGES);
      void syncAppIconBadgeWithUnreadCount();
      break;
    }

    /** 充值成功 */
    case 'member.recharge.success':
      userStore.fetchUserInfo();
      userStore.fetchAssetCurrencyList();
      presentWsSystemPushOnNative(t('str_recharge'), pickNoticeText(obj), 'success');
      break;

    /** 提现成功 */
    case 'wallet.withdraw.success':
      userStore.fetchUserInfo();
      userStore.fetchAssetCurrencyList();
      presentWsSystemPushOnNative(t('str_withdraw'), pickNoticeText(obj), 'success');
      break;

    /** 服务端多语言文案更新：仅当推送语言与当前界面语言一致时重新拉取并应用 */
    case 'app.locale.updated':
    case 'locale.updated':
    case 'i18n.updated':
    case 'app.i18n.updated': {
      const loc = extractPushedLocaleFromMemberWsPayload(obj);
      if (loc) void reloadCurrentLocaleFromServerIfMatchesPushedLocale(loc);
      break;
    }
  }
};
