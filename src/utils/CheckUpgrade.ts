// import { getAppEnvConfig } from './env';
// import { useI18n } from '/@/hooks/web/useI18n';
// import { getUpgradeVersion } from '/@/service/Home';
// import { useMessage } from '/@/hooks/web/useMessage';

/** 版本号格式：major.minor.patch（如 1.0.1），只比较前 3 段，不足补 0 */
const parseVersion = (v: string): [number, number, number] => {
  const parts = v.split('.').map((s) => parseInt(s, 10) || 0);
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
};

/**
 * 比较两个版本号（格式 1.0.1：major.minor.patch）
 * @param local 本地版本号
 * @param server 服务器版本号
 * @returns 是否需要更新（本地 < 服务器 时 true）
 */
export const CompareVersion = (local: string, server: string): boolean => {
  const [major1, minor1, patch1] = parseVersion(local);
  const [major2, minor2, patch2] = parseVersion(server);
  if (major1 !== major2) return major1 < major2;
  if (minor1 !== minor2) return minor1 < minor2;
  return patch1 < patch2;
};

/** CheckUpgradeVersion */
export const CheckUpgradeVersion = (): void => {
  // const { t } = useI18n();
  // const { VITE_GLOB_SYSTEM_VERSION } = getAppEnvConfig();
  // const { CreateAlertDialog } = useMessage();
  // // 获取服务端最新版本号
  // getUpgradeVersion().then((res: any) => {
  //   const { data, code } = res;
  //   if (Number(code) === 0) {
  //     // 判断是否有更新
  //     if (CompareVersion(VITE_GLOB_SYSTEM_VERSION, data) === true) {
  //       // 如果本地版本号小于服务器版本号则提示更新
  //       CreateAlertDialog({ width: '90%', title: t('common_title_text'), message: `<div class="pt-1 mode_color">${t('system_update_message')}<span class="!text-[red]">V${data}</span></div>`, allowHtml: true }).then(() => {
  //         // 如果包含window
  //         if (typeof window !== 'undefined') {
  //           window.location.reload();
  //         } else {
  //           location.reload();
  //         }
  //       });
  //     } else {
  //       // 没有检测到更新
  //       console.log('Already the latest version');
  //     }
  //   }
  // });
};
