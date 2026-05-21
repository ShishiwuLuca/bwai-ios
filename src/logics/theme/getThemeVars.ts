// 获取主题变量配置信息

/** getThemeVars */
export const getThemeVars = (Color: string) => {
  return {
    primaryColor: Color,
    primaryBgColor: `linear-gradient(180deg, #006ED2 0%, #012688 100%)`,
    switchOnBackground: Color,
    checkboxCheckedIconColor: Color,
    tabsBottomBarColor: Color,
    tabsDefaultColor: Color,
    navBarIconColor: Color,
    popoverDarkBackground: Color,
    backTopBackground: Color,
    navBarTextColor: Color,
    // navBarTitleTextColor: Color,
    buttonDefaultBorderColor: Color
  };
};
