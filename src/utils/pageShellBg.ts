import type { RouteLocationNormalized } from 'vue-router';

export const PageShellBgUrl = '/images/login_bg.png';
export const PageShellLogoUrl = '/images/logo_bitgo.png';
export const PageShellBgPaths = [
  '/Login',
  '/Register',
  '/ForgotPassword',
  '/ArticleDetail',
  '/Notice',
  '/Notice/Detail'
];
export const PageShellSplashId = 'page-shell-splash';

const PageShellBgClass = 'page-shell-bg';
const PageShellBgColor = '#eef2fd';

const PageShellBgColorStyle = {
  backgroundColor: PageShellBgColor
};

const PageShellBgImageStyle = {
  backgroundImage: `url(${PageShellBgUrl})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center top',
  backgroundRepeat: 'no-repeat'
};

let bgApplyPromise: Promise<void> | null = null;

export const isPageShellBgPath = (path: string): boolean => {
  const normalized = path.replace(/\/$/, '') || '/';
  return PageShellBgPaths.includes(normalized);
};

/** 路由 meta.pageShellBg === true 时使用壳层背景图 */
export const isPageShellBgRoute = (route: Pick<RouteLocationNormalized, 'matched'>): boolean => {
  return route.matched.some((record) => record.meta?.pageShellBg === true);
};

/** 移除 index.html 注入的首屏 Logo */
export const removePageShellSplash = (): void => {
  document.getElementById(PageShellSplashId)?.remove();
};

const applyPageShellBgToDom = (): void => {
  document.documentElement.classList.add(PageShellBgClass);
  document.body.classList.add(PageShellBgClass);
  Object.assign(document.body.style, PageShellBgColorStyle, PageShellBgImageStyle);
  Object.assign(document.documentElement.style, PageShellBgColorStyle, PageShellBgImageStyle);
  if (document.documentElement.classList.contains('cap-native')) return;
  const appEl = document.getElementById('app');
  if (appEl) Object.assign(appEl.style, PageShellBgColorStyle, PageShellBgImageStyle);
};

/**
 * 应用壳层背景：先保持纯色，预加载背景图后再注入，避免刷新时图片闪现。
 * 原生端 #app 保持透明以露出 html/body 背景。
 */
export const applyPageShellBg = (): Promise<void> => {
  if (bgApplyPromise) return bgApplyPromise;

  bgApplyPromise = new Promise((resolve) => {
    let applied = false;
    const apply = () => {
      if (applied) return;
      applied = true;
      applyPageShellBgToDom();
      resolve();
    };

    const img = new Image();
    img.onload = apply;
    img.onerror = apply;
    img.src = PageShellBgUrl;
    if (img.complete) apply();
  });

  return bgApplyPromise;
};

/** 离开壳层页面：全局背景由 CSS 固定，无需重置 */
export const resetPageShellBg = (): void => {};
