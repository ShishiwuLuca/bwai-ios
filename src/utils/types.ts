import type { CSSProperties, Plugin } from 'vue';

/** OptionalKeys：类型别名 */
type OptionalKeys<T extends Record<string, unknown>> = {
  [K in keyof T]: T extends Record<K, T[K]> ? never : K;
}[keyof T];

/** RequiredKeys：类型别名 */
type RequiredKeys<T extends Record<string, unknown>> = Exclude<keyof T, OptionalKeys<T>>;

/** MonoArgEmitter：类型别名 */
type MonoArgEmitter<T, Keys extends keyof T> = <K extends Keys>(evt: K, arg?: T[K]) => void;

/** BiArgEmitter：类型别名 */
type BiArgEmitter<T, Keys extends keyof T> = <K extends Keys>(evt: K, arg: T[K]) => void;

/** EventEmitter：类型别名 */
export type EventEmitter<T extends Record<string, unknown>> = MonoArgEmitter<T, OptionalKeys<T>> &
  BiArgEmitter<T, RequiredKeys<T>>;

/** AnyFunction：类型别名 */
export type AnyFunction<T> = (...args: any[]) => T;

/** PartialReturnType：类型别名 */
export type PartialReturnType<T extends (...args: unknown[]) => unknown> = Partial<ReturnType<T>>;

/** SFCWithInstall：类型别名 */
export type SFCWithInstall<T> = T & Plugin;

/** Nullable：类型别名 */
export type Nullable<T> = T | null;

/** RefElement：类型别名 */
export type RefElement = Nullable<HTMLElement>;

/** CustomizedHTMLElement：类型别名 */
export type CustomizedHTMLElement<T> = HTMLElement & T;

/** Indexable：类型别名 */
export type Indexable<T> = {
  [key: string]: T;
};

/** Hash：类型别名 */
export type Hash<T> = Indexable<T>;

/** TimeoutHandle：类型别名 */
export type TimeoutHandle = ReturnType<typeof global.setTimeout>;

/** ComponentSize：类型别名 */
export type ComponentSize = 'large' | 'medium' | 'small' | 'mini';

/** StyleValue：类型别名 */
export type StyleValue = string | CSSProperties | Array<StyleValue>;

/** Mutable：类型别名 */
export type Mutable<T> = { -readonly [P in keyof T]: T[P] };

/** PostMessageTypes：枚举取值说明 */
export enum PostMessageTypes {
  // 登录
  CheckLogin = 'check_login',

  // 关闭加载动画
  CloseLoading = 'close_loading',

  // 更新账户余额
  UpgradeBalance = 'upgrade_balance'
}
