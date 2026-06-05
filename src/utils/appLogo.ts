import fallbackLogo from '/@/assets/images/app-logo.png';

/** 站点 Logo 远程地址为空或加载失败时的本地兜底图 */
export const FALLBACK_APP_LOGO = fallbackLogo;

/** 优先使用远程 Logo，无效时回退本地图 */
export const resolveAppLogoUrl = (remote?: string | null): string => {
  const url = (remote ?? '').trim();
  return url || FALLBACK_APP_LOGO;
};
