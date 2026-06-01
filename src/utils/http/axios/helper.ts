import { isObject, isString } from '/@/utils/is';

/** 格式化展示：DATE_TIME_FORMAT */
const DATE_TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

/** `joinTimestamp` 调用签名（含泛型条件返回类型） */
export type JoinTimestampFn = {
  <T extends boolean>(join: boolean, restful: T): T extends true ? string : object;
  (join: boolean, restful?: boolean): string | number | Record<string, never>;
};

/** joinTimestamp */
export const joinTimestamp = ((join: boolean, restful = false) => {
  if (!join) {
    return restful ? '' : {};
  }
  const now = new Date().getTime();
  if (restful) {
    return `?_t=${now}`;
  }
  return now;
}) as JoinTimestampFn;

/**
 * @description: Format request parameter time
 */
export const formatRequestDate = (params: Recordable): void => {
  if (Object.prototype.toString.call(params) !== '[object Object]') {
    return;
  }

  for (const key in params) {
    const format = params[key]?.format ?? null;
    if (format && typeof format === 'function') {
      params[key] = params[key].format(DATE_TIME_FORMAT);
    }
    if (isString(key)) {
      const value = params[key];
      if (value) {
        try {
          params[key] = isString(value) ? value.trim() : value;
        } catch (error: any) {
          throw new Error(error);
        }
      }
    }
    if (isObject(params[key])) {
      formatRequestDate(params[key]);
    }
  }
};
