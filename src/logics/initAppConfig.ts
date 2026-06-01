import { deepMerge } from '/@/utils';
import { ThemeEnum } from '/@/enums/appEnum';
import type { ProjectConfig } from '/#/config';
import type { ConfigProviderThemeVars } from 'vant';
import { updateDarkTheme } from '/@/logics/theme/dark';
import { getThemeVars } from '/@/logics/theme/getThemeVars';
import { updateGrayMode } from '/@/logics/theme/updateGrayMode';
import { useSystemStore } from '/@/stores/modules/SystemConfig';
import { updateColorWeak } from '/@/logics/theme/updateColorWeak';
import { localeList, localeSetting } from '/@/settings/localeSetting';
import { getCommonStoragePrefix, getStorageShortName } from '/@/utils/env';
import projectSetting, { APP_PRESET_COLOR_LIST } from '/@/settings/projectSetting';
// 语言项接口

/** LocaleItem：接口数据结构定义 */
interface LocaleItem {
  value: string;
  icon: string;
  label: string;
}

// 查找最佳语言匹配

/** findBestLocaleMatch */
const findBestLocaleMatch = (targetLocale: string, localeList: any[]): any => {
  if (!targetLocale || !localeList || localeList.length === 0) {
    console.warn('Invalid language matching parameter, using default language');
    // 获取本地的英语
    const enUS = localeList.filter((item: any) => item.value === 'en_US')[0];
    if (enUS) {
      return enUS;
    }
    return localeList[1] || null;
  }
  const normalizedTarget = targetLocale.toLowerCase().trim();
  // 1. 精确匹配
  const exactMatch = localeList.find(
    (item: LocaleItem) => item.value.toLowerCase() === normalizedTarget
  );
  if (exactMatch) {
    console.log(`Exact match to language: ${exactMatch.value}`);
    return exactMatch;
  }
  // 2. 前缀匹配（例如：zh_CN 匹配 zh）
  const targetPrefix = normalizedTarget.split('_')[0];
  const prefixMatch = localeList.find((item: LocaleItem) => {
    const itemPrefix = (item.value.split('_')[0] ?? '').toLowerCase();
    return itemPrefix === targetPrefix;
  });
  if (prefixMatch) {
    console.log(`Prefix matches language: ${prefixMatch.value} (Target: ${targetLocale})`);
    return prefixMatch;
  }
  // 3. 包含匹配（向后兼容）
  const containsMatch = localeList.find(
    (item: LocaleItem) =>
      item.value.toLowerCase().includes(normalizedTarget) ||
      normalizedTarget.includes(item.value.toLowerCase())
  );
  if (containsMatch) {
    console.log(`Contains matching language: ${containsMatch.value} (Target: ${targetLocale})`);
    return containsMatch;
  }
  // 4. 默认返回第一个可用的语言
  console.warn(
    `No matching languages found: ${targetLocale}, using the default language: ${localeList[0]?.value || 'unknown'}`
  );
  // 获取本地的英语
  const enUS = localeList.filter((item: any) => item.value === 'en_US')[0];
  if (enUS) {
    return enUS;
  }
  return localeList[1] || null;
};
// 初始化基础数据

/** 配置：initAppConfigStore */
export const initAppConfigStore = (): void => {
  const SystemStore = useSystemStore();
  const ProjectConfigStore: ProjectConfig = deepMerge(projectSetting, {});
  const themeColor: any = SystemStore.getThemeColor ?? APP_PRESET_COLOR_LIST[0];
  // 主题模式
  ProjectConfigStore.themeDark = SystemStore.getDarkMode ?? ThemeEnum.DARK;
  // 色弱模式
  ProjectConfigStore.colorWeak = SystemStore.getColorWeak ?? false;
  // 灰色模式setThemeColor
  ProjectConfigStore.grayMode = SystemStore.getGrayMode ?? false;
  // 获取主题变量
  const themeVars: ConfigProviderThemeVars = getThemeVars(themeColor.value);
  // 初始化主题
  SystemStore.setThemeColor(themeColor);
  // 修改主题变量配置
  SystemStore.setThemeVars(themeVars);
  // 写入基础数据
  SystemStore.setProjectConfig(ProjectConfigStore);
  // 导出
  const { colorWeak, grayMode, themeDark } = ProjectConfigStore;
  let Locales: any = {};
  // 语言配置
  let LocaleConfig: any = {};
  // 语言标识
  let LocaleCode: any = 'en_US';
  // 如果用户没有设置过了语言
  if (!SystemStore.localInfo.locale) {
    // 读取浏览器语言
    try {
      LocaleCode = navigator.language.includes('-')
        ? navigator.language.replace('-', '_')
        : navigator.language;
    } catch (error) {
      console.warn('Unable to get browser language:', error);
    }
  } else {
    LocaleCode = SystemStore.localInfo.locale;
  }
  // 优化语言匹配逻辑：先精确匹配，再前缀匹配
  Locales = findBestLocaleMatch(LocaleCode, localeList);
  // 设置语言配置
  const selectedLocale = Locales || localeList[1] || localeList[0];
  LocaleConfig = {
    // 是否显示语言选择器
    showPicker: true,
    // 当前语言
    locale: selectedLocale.value,
    // 默认语言
    fallback: selectedLocale.value,
    // 图标
    icon: selectedLocale.icon,
    // 语言名称
    label: selectedLocale.label,
    // 允许的语言
    availableLocales: localeSetting.availableLocales,
    // 语言包版本号
    version: selectedLocale.version
  };
  // 设置初始化语言
  SystemStore.setLocaleInfo(LocaleConfig);
  // 设置
  try {
    if (grayMode) updateGrayMode(grayMode);
    if (colorWeak) updateColorWeak(colorWeak);
  } catch (error) {
    console.log(error);
  }
  // 设置主题模式
  updateDarkTheme(themeDark);
  setTimeout(() => {
    clearObsoleteStorage();
  }, 16);
};

/** clearObsoleteStorage */
export const clearObsoleteStorage = () => {
  const commonPrefix = getCommonStoragePrefix();
  const shortPrefix = getStorageShortName();
  [localStorage, sessionStorage].forEach((item: Storage) => {
    Object.keys(item).forEach((key) => {
      if (key && key.startsWith(commonPrefix) && !key.startsWith(shortPrefix)) {
        item.removeItem(key);
      }
    });
  });
};
