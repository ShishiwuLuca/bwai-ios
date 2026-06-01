import type { LocaleType } from '/#/config';
import { ThemeEnum } from '/@/enums/appEnum';
import { useLocale } from '/@/locales/useLocale';
import { setVantLocales } from '/@/locales/VantLocale';
import { useUserStoreWithOut } from '/@/stores/modules/UserConfig';
import { useSystemStoreWithOut } from '/@/stores/modules/SystemConfig';

/**
 * 检测APP端传递的参数
 */
export const getAppParamsLogin = (params: any): void => {
  const { changeLocale } = useLocale();

  const UserStore = useUserStoreWithOut();

  const SystemStore = useSystemStoreWithOut();

  // 路由参数
  const { authorization, theme, lang } = params;

  if (authorization !== undefined) {
    // 保存为APP引入状态
    SystemStore.setIsApp(true);
  } else {
    // 保存为取消APP引入状态
    SystemStore.setIsApp(false);
  }

  // 如果有传递Token
  if (authorization) {
    // 使用整个项目的Token保存方法
    UserStore.setToken(authorization as string);

    // 获取账户信息
    UserStore.setUserInfo({ token: authorization, time: new Date().getTime() });
    // 获取当前用户余额信息
    UserStore.setUserBalance();
    // 获取账户配置
    UserStore.setUserConfig();
  }

  // 设置主题模式
  if (theme) {
    // 使用整个项目的主题切换方法
    if (theme === ThemeEnum.DARK) {
      // 使用整个项目的主题切换方法
      SystemStore.setDarkMode(ThemeEnum.DARK);
    } else {
      // 使用整个项目的主题切换方法
      SystemStore.setDarkMode(ThemeEnum.LIGHT);
    }
  }

  // 设置语言
  if (lang) {
    // 使用整个项目的语言切换方法
    try {
      // 使用整个项目的语言切换方法
      changeLocale(lang as LocaleType);

      // 同时更新Vant UI库的语言
      setVantLocales(lang as LocaleType);

      // 更新系统store中的语言信息
      SystemStore.setLocaleInfo({ locale: lang as LocaleType });
    } catch (error) {
      console.error('语言切换失败:', error);
    }
  }
};
