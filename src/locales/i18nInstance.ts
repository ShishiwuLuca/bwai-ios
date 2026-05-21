/**
 * 独立保存 i18n 实例，避免 HMR 时 setupI18n 模块被重新执行导致 i18n 变量重置为 undefined，
 * 从而出现「保存后多语言显示为 key」的问题。
 */
import type { I18n } from 'vue-i18n';

/** instance */
let instance: I18n | null = null;

/** setI18n */
export const setI18n = (i18n: I18n): void => {
  instance = i18n;
};

/** getI18n */
export const getI18n = (): I18n | null => {
  return instance;
};
