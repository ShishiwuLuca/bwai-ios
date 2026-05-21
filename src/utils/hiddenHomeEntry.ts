/** 发布页隐藏入口：输入指定口令并发布后解锁 Home 页，下次冷启动直达 */
export const HIDDEN_HOME_ENTRY_CODE = '88888888';

const LS_KEY = 'fundex_hidden_home_entry_v1';

export const isHiddenHomeEntryEnabled = (): boolean => {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(LS_KEY) === '1';
};

export const setHiddenHomeEntryEnabled = (): void => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(LS_KEY, '1');
};
