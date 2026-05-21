/// <reference types="vite/client" />

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.jpeg' {
  const src: string;
  export default src;
}

declare module '*.svg' {
  const src: string;
  export default src;
}

// 在模板中使用 this.$router / $route 的类型声明
import 'vue-router';
import type { Router, RouteLocationNormalizedLoaded } from 'vue-router';

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $router: Router;
    $route: RouteLocationNormalizedLoaded;
  }
}

/**
 * `@capacitor/share`：依赖需在本地安装后 `cap sync`。
 * 若尚未安装到 node_modules，用此声明避免 ts(2307)；安装官方包后类型会与之合并。
 */
declare module '@capacitor/share' {
  export interface ShareOptions {
    title?: string;
    text?: string;
    url?: string;
    files?: string[];
    dialogTitle?: string;
  }
  export interface ShareResult {
    activityType?: string;
  }
  export const Share: {
    canShare(): Promise<{ value: boolean }>;
    share(options: ShareOptions): Promise<ShareResult>;
  };
}
