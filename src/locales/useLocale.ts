/**
 * Multi-language related operations
 */
import { computed } from 'vue';
import { getI18n } from './i18nInstance';
import type { LocaleType } from '/#/config';
import { getServiceLocaleConfig } from './utils';
import { loadLocalePool, setHtmlPageLang } from './helper';
import { useSystemStoreWithOut } from '/@/stores/modules/SystemConfig';

/** normalizeLocaleKeyForCompare */
export const normalizeLocaleKeyForCompare = (raw: string): string => {
  return (raw ?? '').trim().toLowerCase().replace(/-/g, '_');
};

/** setI18nLanguage */
const setI18nLanguage = (locale: LocaleType) => {
  const systemStore = useSystemStoreWithOut();
  const i18n = getI18n();
  // 检查 i18n 是否已初始化
  if (!i18n || !i18n.global) {
    console.error('i18n is not initialized, unable to set language');
    return;
  }
  if (i18n.mode === 'legacy') {
    i18n.global.locale = locale;
  } else {
    (i18n.global.locale as any).value = locale;
  }
  systemStore.setLocaleInfo({ locale });
  setHtmlPageLang(locale);
};

/** 提示与弹窗（applyLocaleMessages） */
const applyLocaleMessages = async (locale: LocaleType): Promise<void> => {
  const i18n = getI18n();
  if (!i18n) return;
  const globalI18n = i18n.global;
  const langModule = await getServiceLocaleConfig(locale);
  if (!langModule) return;
  globalI18n.setLocaleMessage(locale, langModule);
  loadLocalePool.push(locale);
  setI18nLanguage(locale);
};

/** 拉取接口数据（reloadCurrentLocaleFromServerIfMatchesPushedLocale） */
export const reloadCurrentLocaleFromServerIfMatchesPushedLocale = async (
  pushedLocale: string
): Promise<void> => {
  const systemStore = useSystemStoreWithOut();
  const current = String(systemStore.getLocaleInfo?.locale ?? '').trim();
  if (!pushedLocale.trim() || !current) {
    return;
  }
  if (normalizeLocaleKeyForCompare(pushedLocale) !== normalizeLocaleKeyForCompare(current)) {
    return;
  }
  await applyLocaleMessages(current as LocaleType);
};

/** useLocale */
export const useLocale = () => {
  const systemStore = useSystemStoreWithOut();
  const getLocale = computed(() => systemStore.getLocaleInfo.locale);
  const getShowLocalePicker = computed(() => systemStore.getLocaleInfo.showPicker);
  // Switching the language will change the locale of useI18n
  // And submit to configuration modification
  const changeLocale = async (locale: LocaleType) => {
    await applyLocaleMessages(locale);
    return locale;
  };

  return {
    getLocale,
    getShowLocalePicker,
    changeLocale
  };
};
