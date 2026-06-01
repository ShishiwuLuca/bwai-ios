import UnoCSS from 'unocss/vite';
import vue from '@vitejs/plugin-vue';
import { configHtmlPlugin } from './html';
import legacy from '@vitejs/plugin-legacy';
import vueJsx from '@vitejs/plugin-vue-jsx';
// import { configDevTools } from './DevTools';
import { configCompressPlugin } from './compress';
import { configVisualizerConfig } from './visualizer';
import VitePluginCertificate from 'vite-plugin-mkcert';
import { configStyleImportPlugin } from './styleImport';
import EnvironmentPlugin from 'vite-plugin-environment';
import vueSetupExtend from 'vite-plugin-vue-setup-extend';
import { readFileSync } from 'fs';
import { join } from 'path';

export const createVitePlugins = (viteEnv: ViteEnv, isBuild: boolean) => {
  const { VITE_BUILD_COMPRESS } = viteEnv;

  // 自定义插件：确保 /luckeywheel/ 路径直接返回静态文件，不被 HTML 转换中间件拦截
  const staticFilePlugin: any = {
    name: 'static-file-plugin',
    apply: 'serve', // 仅开发环境
    enforce: 'pre', // 确保在其他插件之前执行
    configureServer(server: any) {
      // 在 configureServer 中直接添加中间件，这样会在服务器初始化时执行
      server.middlewares.use((req: any, res: any, next: any) => {
        const url = req.url || '';

        // 处理 /luckeywheel/ 路径的 HTML 文件
        if (url.startsWith('/luckeywheel/')) {
          try {
            let filePath: string;

            // 如果是目录路径或 index.html，读取 index.html
            if (
              url === '/luckeywheel/' ||
              url === '/luckeywheel' ||
              url === '/luckeywheel/index.html' ||
              url.endsWith('/index.html')
            ) {
              filePath = join(process.cwd(), 'public', 'luckeywheel', 'index.html');
            } else if (url.endsWith('.html')) {
              // 其他 HTML 文件
              filePath = join(process.cwd(), 'public', url);
            } else {
              // 非 HTML 文件，交给后续中间件处理（静态资源）
              return next();
            }

            const content = readFileSync(filePath, 'utf-8');

            // 设置正确的 Content-Type
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache');

            // 直接返回文件内容，不经过任何转换
            res.statusCode = 200;
            res.end(content);
            return; // 阻止后续中间件处理
          } catch {
            // 如果读取失败，继续后续处理
            return next();
          }
        }

        next(); // 其他路径正常处理
      });
    }
  };

  const vitePlugins = [
    // 静态文件插件（必须在最前面，仅开发环境）
    ...(!isBuild ? [staticFilePlugin] : []),
    // have to
    vue(),
    vueJsx(),
    // support name
    vueSetupExtend(),
    VitePluginCertificate({
      source: 'coding'
    }),
    UnoCSS(),
    EnvironmentPlugin('all', { prefix: 'VITE_' }), // 定义环境变量
    // 低版本兼容
    legacy({
      targets: ['Chrome >= 49', 'Android >= 8', 'iOS >= 9'],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
      modernPolyfills: true,
      // 减少内存使用
      renderLegacyChunks: true
    })
  ].filter(Boolean) as any[]; // 过滤掉 null 值

  // vitePlugins.push(configDevTools(isBuild));

  // vite-plugin-html
  vitePlugins.push(configHtmlPlugin(viteEnv, isBuild));

  // unplugin-vue-components
  vitePlugins.push(configStyleImportPlugin());

  // rollup-plugin-visualizer
  vitePlugins.push(configVisualizerConfig());

  // The following plugins only work in the production environment
  if (isBuild) {
    // rollup-plugin-gzip
    vitePlugins.push(configCompressPlugin(VITE_BUILD_COMPRESS));
  }

  return vitePlugins;
};
