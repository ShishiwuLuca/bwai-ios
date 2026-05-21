import { addClass, hasClass, removeClass } from '/@/utils/domUtils';

/** 方法：updateDarkTheme */
export const updateDarkTheme = async (mode: string = 'light') => {
  const htmlRoot = document.getElementById('htmlRoot');
  // 获取Meta
  let MetaThemeColor = document.querySelector(`meta[name="theme-color"]`);
  // Safari状态栏背景色
  let StatusBarColor = '#ffffff';
  if (!htmlRoot) {
    return;
  }
  const hasDarkClass = hasClass(htmlRoot, 'dark');
  if (mode === 'dark') {
    htmlRoot.setAttribute('data-theme', 'dark');
    if (!hasDarkClass) {
      addClass(htmlRoot, 'dark');
    }
    StatusBarColor = '#131722';
  } else {
    htmlRoot.setAttribute('data-theme', 'light');
    if (hasDarkClass) {
      removeClass(htmlRoot, 'dark');
    }
    StatusBarColor = '#ffffff';
  }
  // 如果已经设置了主题模式
  if (MetaThemeColor) {
    // 更新
    MetaThemeColor.setAttribute('content', StatusBarColor);
  } else {
    // 创建
    MetaThemeColor = document.createElement('meta');
    MetaThemeColor.setAttribute('name', 'theme-color');
    MetaThemeColor.setAttribute('content', StatusBarColor);
    document.head.appendChild(MetaThemeColor);
  }
};
