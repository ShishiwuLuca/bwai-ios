import type { App } from 'vue';
import { createI18n } from 'vue-i18n';
import { setI18n } from './i18nInstance';
import type { I18nOptions } from 'vue-i18n';
import { getServiceLocaleConfig } from './utils';
import { localeSetting } from '/@/settings/localeSetting';
import { setHtmlPageLang, setLoadLocalePool } from './helper';
import { useSystemStoreWithOut } from '/@/stores/modules/SystemConfig';

/** 解构赋值：组合式 API 返回的一组方法或状态 */
const { fallback, availableLocales } = localeSetting;

/** i18n */
export let i18n: ReturnType<typeof createI18n>;

/** 方法：createI18nOptions */
const createI18nOptions = async (): Promise<I18nOptions> => {
  const SystemStore = useSystemStoreWithOut();
  const locale = SystemStore.getLocaleInfo.locale;
  // 默认语言包
  const langModule = await getServiceLocaleConfig(locale);
  setHtmlPageLang(locale);
  setLoadLocalePool((loadLocalePool) => {
    if (!loadLocalePool.includes(locale)) {
      loadLocalePool.push(locale);
    }
  });
  return {
    // 使用 Composition API 模式，避免 legacy 模式的弃用警告
    legacy: false,
    // 允许在组合式 API 中通过 useI18n 注入
    globalInjection: true,
    locale,
    fallbackLocale: fallback,
    messages: {
      [locale]: langModule as any
    },
    availableLocales: availableLocales,
    sync: true,
    silentTranslationWarn: true, // true - warning off
    missingWarn: false,
    silentFallbackWarn: true
  } as I18nOptions;
};

/** 方法：setupI18n */
export const setupI18n = async (app: App) => {
  const options = await createI18nOptions();
  i18n = createI18n(options) as ReturnType<typeof createI18n>;
  setI18n(i18n as Parameters<typeof setI18n>[0]);
  app.use(i18n);
};
