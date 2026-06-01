import { set } from 'lodash-es';
import type { LocaleType } from '/#/config';

/** 常量或静态配置：拉取接口数据 */
export const loadLocalePool: LocaleType[] = [];

/** setHtmlPageLang */
export const setHtmlPageLang = (locale: LocaleType) => {
  document.querySelector('html')?.setAttribute('lang', locale);
  // 禁用浏览器自动翻译
  document.querySelector('html')?.setAttribute('translate', 'no');
};

/** 拉取接口数据：setLoadLocalePool */
export const setLoadLocalePool = (cb: (loadLocalePool: LocaleType[]) => void) => {
  cb(loadLocalePool);
};

/** 提示与弹窗：genMessage */
export const genMessage = (langs: Record<string, any>, prefix = 'lang') => {
  const obj: Recordable = {};
  Object.keys(langs).forEach((key) => {
    const langFileModule = langs[key].default;
    let fileName = key.replace(`./${prefix}/`, '').replace(/^\.\//, '');
    const lastIndex = fileName.lastIndexOf('.');
    fileName = fileName.substring(0, lastIndex);
    const keyList = fileName.split('/');
    const moduleName = keyList.shift();
    const objKey = keyList.join('.');
    if (moduleName) {
      if (objKey) {
        set(obj, moduleName, obj[moduleName] || {});
        set(obj[moduleName], objKey, langFileModule);
      } else {
        set(obj, moduleName, langFileModule || {});
      }
    }
  });
  return obj;
};
