/**
 * 路由参数临时存储工具
 * 用于在不显示在地址栏的情况下传递路由参数
 * 使用 sessionStorage 存储，刷新页面后仍然保留，关闭标签页后清除
 */

const STORAGE_KEY_PREFIX = 'route_param_';

/**
 * 生成唯一 key
 */
const generateKey = (): string => {
  return `route_param_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * 存储路由参数并返回 key
 * @param params 要存储的参数
 * @returns 唯一 key
 */
export const setRouteParams = (params: any): string => {
  const key = generateKey();
  const storageKey = `${STORAGE_KEY_PREFIX}${key}`;

  try {
    sessionStorage.setItem(storageKey, JSON.stringify(params));
  } catch (e) {
    console.error('Failed to store route params:', e);
  }

  return key;
};

/**
 * 获取路由参数
 * @param key 参数 key
 * @returns 存储的参数，如果不存在或已过期则返回 null
 */
export const getRouteParams = (key: string): any => {
  const storageKey = `${STORAGE_KEY_PREFIX}${key}`;

  try {
    const paramsStr = sessionStorage.getItem(storageKey);
    if (paramsStr) {
      return JSON.parse(paramsStr);
    }
  } catch (e) {
    console.error('Failed to get route params:', e);
  }

  return null;
};

/**
 * 清理所有路由参数缓存
 */
export const clearRouteParams = (): void => {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => sessionStorage.removeItem(key));
  } catch (e) {
    console.error('Failed to clear route params:', e);
  }
};
