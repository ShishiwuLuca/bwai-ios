/**
 * 封装 useI18n：统一 t 函数签名、%s 占位替换，并兼容 i18n 未就绪
 * 从 i18nInstance 读取实例，避免 HMR 后 setupI18n 模块重执行导致 i18n 为 undefined
 */
import { getI18n } from '/@/locales/i18nInstance';

/** t 函数多种调用方式的重载类型 */
type I18nGlobalTranslation = {
  (key: string): string;
  (key: string, locale: string): string;
  (key: string, locale: string, list: unknown[]): string;
  (key: string, locale: string, named: Record<string, unknown>): string;
  (key: string, list: unknown[]): string;
  (key: string, named: Record<string, unknown>): string;
};

/** 规范化 key（便于与 i18n Ally 等工具配合） */
const getKey = (key: string): string => key;

/** 使用 %s 占位符替换翻译结果 */
const replacePlaceholders = (raw: string, values: unknown[]): string =>
  values.reduce<string>((acc, val) => acc.replace('%s', String(val)), raw);

/**
 * 获取 i18n 的 t 及全局方法；若 i18n 未初始化则返回仅返回 key 的兜底 t
 */
export const useI18n = (): { t: I18nGlobalTranslation } => {
  const fallback = {
    t: (key: string) => getKey(key)
  };

  const i18n = getI18n();
  if (!i18n) {
    return fallback;
  }

  const { t: rawT, ...methods } = i18n.global;
  const translate = rawT as (key: string, ...args: unknown[]) => string;

  const t: I18nGlobalTranslation = (key: string, ...args: unknown[]) => {
    if (!key) return '';
    if (key.includes('.')) return key;

    const k = getKey(key);

    // 兼容多种调用签名：
    // - t(key)
    // - t(key, list)
    // - t(key, named)
    // - t(key, locale)
    // - t(key, locale, list)
    // - t(key, locale, named)
    if (typeof args[0] === 'string') {
      const locale = args[0];
      if (Array.isArray(args[1])) {
        const list = args[1];
        const res = translate(k, locale, list);
        // 兼容历史语言包的 %s 占位
        return res.includes('%s') ? replacePlaceholders(res, list) : res;
      }
      if (typeof args[1] === 'object' && args[1] !== null) {
        return translate(k, locale, args[1] as Record<string, unknown>);
      }
      return translate(k, locale);
    }

    if (Array.isArray(args[0])) {
      const list = args[0];
      // 支持 vue-i18n 的 {0}/{1}… 列表占位
      const res = translate(k, list);
      // 兼容历史语言包的 %s 占位
      return res.includes('%s') ? replacePlaceholders(res, list) : res;
    }

    if (typeof args[0] === 'object' && args[0] !== null) {
      return translate(k, args[0] as Record<string, unknown>);
    }

    return translate(k);
  };

  return {
    ...methods,
    t
  };
};

/**
 * 供 VSCode i18n Ally 等插件使用，仅返回 key 本身（用于路由、菜单等静态 key）。
 * 业务文案请使用 useI18n().t。
 */
export const t = (key: string): string => key;
