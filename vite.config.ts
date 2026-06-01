import dayjs from 'dayjs';
import { resolve } from 'path';
import pkg from './package.json';
import type { AliasOptions } from 'vite';
import { wrapperEnv } from './build/utils';
import { OUTPUT_DIR } from './build/constant';
import { createProxy } from './build/vite/proxy';
import { createVitePlugins } from './build/vite/plugin';
import { defineConfig, loadEnv, normalizePath } from 'vite';
import type { UserConfig, ConfigEnv, ProxyOptions } from 'vite';
// ---------------------------------------------------------------------------
// 常量与路径
// ---------------------------------------------------------------------------

// 构建时间戳
const BUILD_TIMESTAMP = Date.now();

// 项目根目录
const ROOT = process.cwd();

// 包信息
const { dependencies, devDependencies, name, version } = pkg;

// 应用信息
const APP_INFO = {
  pkg: { dependencies, devDependencies, name, version },
  lastBuildTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
};

// 路径解析
const pathResolve = (dir: string): string => {
  return resolve(ROOT, '.', dir);
};

// ---------------------------------------------------------------------------
// 解析与别名
// ---------------------------------------------------------------------------

const getResolveAlias = (): AliasOptions => {
  const srcPath = pathResolve('src') + '/';
  const typesPath = pathResolve('types') + '/';
  return [
    {
      find: 'vue-i18n',
      replacement: 'vue-i18n/dist/vue-i18n.runtime.esm-bundler.js'
    },
    // 支持 '@/...' 形式的路径别名
    { find: '@', replacement: srcPath },
    { find: /\/@\//, replacement: srcPath },
    { find: /\/#\//, replacement: typesPath }
  ];
};

// ---------------------------------------------------------------------------
// 开发服务
// ---------------------------------------------------------------------------

const getServerConfig = (port: number, proxy: ReturnType<typeof createProxy>) => {
  return {
    // HTTPS 配置
    https: { allowHalfOpen: true },
    // 主机
    host: true,
    // 端口
    port,
    // 打开
    open: false,
    // 代理
    proxy,
    // 文件系统
    fs: { strict: false }
  };
};

// ---------------------------------------------------------------------------
// 构建：Rollup 输出
// ---------------------------------------------------------------------------

const getRollupOutput = (systemVersion: string) => {
  const baseName = `${pkg.name}.v${systemVersion}`;
  const ts = BUILD_TIMESTAMP;
  return {
    chunkFileNames: () => `js/${baseName}.[name].[hash].${ts}.js`,
    entryFileNames: () => `js/${baseName}.[name].[hash].${ts}.js`,
    assetFileNames: (assetInfo: any) => {
      // CSS 必须与 url() 引用的图片等同目录（均在 assets），否则 Rollup 会生成 url(./xxx.png)，
      // 浏览器按「相对当前 CSS 路径」解析为 /css/xxx.png，而实际文件在 /assets/xxx.png，APP WebView 严格 404。
      if (assetInfo.name && assetInfo.name.endsWith('.css')) {
        return `assets/${baseName}.[name].[hash].${ts}.[ext]`;
      } else if (
        (assetInfo.name && assetInfo.name.endsWith('.woff2')) ||
        (assetInfo.name && assetInfo.name.endsWith('.woff')) ||
        (assetInfo.name && assetInfo.name.endsWith('.ttf'))
      ) {
        // 字体文件
        return `font/${baseName}.[name].[hash].${ts}.[ext]`;
      } else {
        // 其他资产文件
        return `assets/${baseName}.[name].[hash].${ts}.[ext]`;
      }
    },
    manualChunks: getManualChunks()
  };
};

// ---------------------------------------------------------------------------
// 构建：手动分包
// ---------------------------------------------------------------------------
const getManualChunks = (): ((id: string) => string | undefined) => {
  // 手动分包标识
  const VENDOR_VUE_CORE = 'vendor_vue_core';
  // Vue 生态系统
  const VENDOR_VUE_ECOSYSTEM = 'vendor_vue_ecosystem';
  // UI 框架
  const VENDOR_UI = 'vendor_framework_ui';
  // ECharts
  const VENDOR_ECHARTS = 'vendor_echarts';
  // ZRender
  const VENDOR_ZRENDER = 'vendor_zrender';
  // 网络
  const VENDOR_NETWORK = 'vendor_network';
  // 工具库
  const VENDOR_UTILS = 'vendor_utils';
  // 默认
  const VENDOR_DEFAULT = 'vendor_framework';

  // 手动分包函数
  return (id: string): string | undefined => {
    // 排除非 node_modules 目录
    if (!id.includes('node_modules')) return undefined;

    // Vue 核心
    if (id.includes('node_modules/vue/') || id === 'vue') return VENDOR_VUE_CORE;

    // Vue 生态系统
    if (
      id.includes('vue-router') ||
      id.includes('vue-i18n') ||
      id.includes('pinia') ||
      id.includes('@vueuse') ||
      id.includes('qrcode.vue')
    ) {
      return VENDOR_VUE_ECOSYSTEM;
    }
    // UI 框架
    if (id.includes('vant') || id.includes('@vant')) return VENDOR_UI;
    // ECharts
    if (id.includes('echarts')) return VENDOR_ECHARTS;
    // ZRender
    if (id.includes('zrender')) return VENDOR_ZRENDER;
    // 核心库
    if (id.includes('core-js')) return 'core-js';
    // 网络
    if (id.includes('axios')) return 'axios';
    // 网络
    if (id.includes('socket.io') || id.includes('mqtt') || id.includes('web3'))
      return VENDOR_NETWORK;
    // 工具库
    if (id.includes('dayjs') || id.includes('lodash') || id.includes('crypto-js'))
      return VENDOR_UTILS;
    // 默认
    return VENDOR_DEFAULT;
  };
};

// ---------------------------------------------------------------------------
// 构建：Rolldown 选项（Vite 8 由 Rolldown 打包；原 rollupOptions 与此合并）
// ---------------------------------------------------------------------------
const getRolldownOptions = (systemVersion: string) => {
  return {
    /** 关闭「插件耗时占比」告警（UnoCSS 全量扫描等在大项目上易误报，见 https://rolldown.rs/options/checks#plugintimings） */
    checks: {
      pluginTimings: false
    },
    output: getRollupOutput(systemVersion)
  };
};

// ---------------------------------------------------------------------------
// 构建：主配置
// ---------------------------------------------------------------------------

const getBuildConfig = (systemVersion: string) => {
  return {
    // 压缩
    minify: 'esbuild' as const,
    // 目标浏览器
    cssTarget: 'chrome122',
    // 输出目录
    outDir: OUTPUT_DIR,
    // 资产目录
    assetsDir: 'assets',
    // 资产内联限制
    assetsInlineLimit: 600,
    // CSS 代码分割
    cssCodeSplit: true,
    // 源映射
    sourcemap: false,
    // 块大小警告限制
    chunkSizeWarningLimit: 1000,
    // Rolldown 选项（含 output 分包；关闭 PLUGIN_TIMINGS 提示）
    rolldownOptions: getRolldownOptions(systemVersion)
  };
};

// ---------------------------------------------------------------------------
// 全局注入与 CSS
// ---------------------------------------------------------------------------

const getDefineConfig = () => {
  return {
    __INTLIFY_PROD_DEVTOOLS__: false,
    __APP_INFO__: JSON.stringify(APP_INFO),
    global: 'window',
    'process.env': JSON.stringify({})
  };
};

// ---------------------------------------------------------------------------
// 构建：CSS 配置
// ---------------------------------------------------------------------------
const getCssConfig = () => {
  // 变量路径
  const variablePath = normalizePath(resolve(ROOT, 'src/design/variable.less'));
  // CSS 配置
  return {
    // 预处理器选项
    preprocessorOptions: {
      less: {
        additionalData: `@import "${variablePath}";`,
        javascriptEnabled: true
      }
    }
  };
};

// ---------------------------------------------------------------------------
// 主配置
// ---------------------------------------------------------------------------

export default defineConfig(({ command, mode }: ConfigEnv): UserConfig => {
  // 加载环境变量
  const env = loadEnv(mode, ROOT);
  // 包装环境变量
  const viteEnv = wrapperEnv(env);
  // 环境变量
  const { VITE_PORT, VITE_PUBLIC_PATH, VITE_GLOB_PROXY, VITE_GLOB_SYSTEM_VERSION } = viteEnv;
  // 开发语言包 S3 origin
  const devLocaleS3Origin = String(env.VITE_DEV_LOCALE_S3_ORIGIN ?? '').trim();
  // 是否构建
  const isBuild = command === 'build';
  // 基础代理
  const baseProxy = createProxy(VITE_GLOB_PROXY);
  // 开发语言包 S3 代理
  const devLocaleS3Proxy: Record<string, ProxyOptions> = {};
  // 如果需要开发语言包 S3 代理
  if (!isBuild && devLocaleS3Origin) {
    // 开发语言包 S3 代理
    devLocaleS3Proxy['/dev-locale-s3'] = {
      // 目标
      target: devLocaleS3Origin.replace(/\/$/, ''),
      // 改变源
      changeOrigin: true,
      // 安全
      secure: true,
      // 重写
      rewrite: (path: string) => path.replace(/^\/dev-locale-s3/, '')
    };
  }

  // 主配置
  return {
    // 基础路径
    base: VITE_PUBLIC_PATH,
    // 项目根目录
    root: ROOT,
    // 路径别名
    resolve: { alias: getResolveAlias() },
    // 开发服务器
    server: getServerConfig(VITE_PORT, { ...baseProxy, ...devLocaleS3Proxy }),
    // 构建配置
    build: getBuildConfig(VITE_GLOB_SYSTEM_VERSION),
    // 全局定义
    define: getDefineConfig(),
    // CSS 配置
    css: getCssConfig(),
    // 插件
    plugins: createVitePlugins(viteEnv, isBuild),
    // 优化依赖
    optimizeDeps: {
      include: ['vant/es', '@vue/shared', 'vant/es/image/style/index', '@capacitor/network', 'qrcode.vue']
    }
  };
});
