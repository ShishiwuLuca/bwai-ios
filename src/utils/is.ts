/** toString */
const toString = Object.prototype.toString;

/** 判断值是否为指定 `[object Type]` 类型标签 */
export const is = (val: unknown, type: string) => {
  return toString.call(val) === `[object ${type}]`;
};

/** 值是否已定义（非 `undefined`） */
export const isDef = <T = unknown>(val?: T): val is T => {
  return typeof val !== 'undefined';
};

/** 值是否为 `undefined` */
export const isUnDef = <T = unknown>(val?: T): val is T => {
  return !isDef(val);
};

/** 是否为非 null 的普通对象 */
export const isObject = (val: any): val is Record<any, any> => {
  return val !== null && is(val, 'Object');
};

/** 空字符串、空数组、空 Map/Set、空对象键 */
export const isEmpty = <T = unknown>(val: T): val is T => {
  if (isArray(val) || isString(val)) {
    return val.length === 0;
  }

  if (val instanceof Map || val instanceof Set) {
    return val.size === 0;
  }

  if (isObject(val)) {
    return Object.keys(val).length === 0;
  }

  return false;
};

/** 是否为 `Date` 实例 */
export const isDate = (val: unknown): val is Date => {
  return is(val, 'Date');
};

/** 是否为 `null` */
export const isNull = (val: unknown): val is null => {
  return val === null;
};

/** 是否同时为 `undefined` 与 `null`（极少用） */
export const isNullAndUnDef = (val: unknown): val is null | undefined => {
  return isUnDef(val) && isNull(val);
};

/** 是否为 `null` 或 `undefined` */
export const isNullOrUnDef = (val: unknown): val is null | undefined => {
  return isUnDef(val) || isNull(val);
};

/** 是否为数字类型（含 `NaN`；需另判 `Number.isFinite` 时自行处理） */
export const isNumber = (val: unknown): val is number => {
  return is(val, 'Number');
};

/** 是否像 `Promise`（含 then/catch） */
export const isPromise = <T = any>(val: unknown): val is Promise<T> => {
  return is(val, 'Promise') && isObject(val) && isFunction(val.then) && isFunction(val.catch);
};

/** 是否为字符串 */
export const isString = (val: unknown): val is string => {
  return is(val, 'String');
};

/** 是否为函数 */
export const isFunction = (val: unknown): val is (...args: unknown[]) => unknown => {
  return typeof val === 'function';
};

/** 是否为布尔 */
export const isBoolean = (val: unknown): val is boolean => {
  return is(val, 'Boolean');
};

/** 是否为正则 */
export const isRegExp = (val: unknown): val is RegExp => {
  return is(val, 'RegExp');
};

/** 是否为数组 */
export const isArray = (val: any): val is Array<any> => {
  return val && Array.isArray(val);
};

/** 是否为 `window`（浏览器环境） */
export const isWindow = (val: any): val is Window => {
  return typeof window !== 'undefined' && is(val, 'Window');
};

/** 是否为 DOM 元素 */
export const isElement = (val: unknown): val is Element => {
  return isObject(val) && !!val.tagName;
};

/** 是否为 `Map` */
export const isMap = (val: unknown): val is Map<any, any> => {
  return is(val, 'Map');
};

/** isServer */
export const isServer = typeof window === 'undefined';

/** isClient */
export const isClient = !isServer;

/** 是否为 http(s) 或相对站内 URL 形态（宽松校验） */
export const isUrl = (path: string): boolean => {
  const reg =
    /(((^https?:(?:\/\/)?)(?:[-;:&=+$,\w]+@)?[A-Za-z0-9.-]+(?::\d+)?|(?:www.|[-;:&=+$,\w]+@)[A-Za-z0-9.-]+)((?:\/[+~%/.\w-_]*)?\??(?:[-+=&;%@.\w_]*)#?(?:[\w]*))?)$/;
  return reg.test(path);
};

/** isEmail */
export const isEmail = (email: string): boolean => {
  const RegExp = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return RegExp.test(email);
};

/** isPassword */
export const isPassword = (password: string): boolean => {
  const RegExp = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+]{8,20}$/;
  return RegExp.test(password);
};

// 去除邮箱外的非法符号

/** ReplaceEmail */
export const ReplaceEmail = /[^a-zA-Z0-9@._-]/g;
