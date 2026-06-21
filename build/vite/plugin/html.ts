/**
 * Plugin to minimize and use ejs template syntax in index.html.
 * https://github.com/anncwb/vite-plugin-html
 */
import type { PluginOption } from 'vite';
import { createHtmlPlugin } from 'vite-plugin-html';

export const configHtmlPlugin = (env: ViteEnv, isBuild: boolean): PluginOption[] => {
  const { VITE_GLOB_APP_TITLE, VITE_GLOB_SYSTEM_VERSION } = env;
  const systemVersion = String(VITE_GLOB_SYSTEM_VERSION ?? '').trim().replace(/['"]/g, '');
  /** 构建时写入，避免 favicon / PWA 图标被 CDN、浏览器长期缓存 */
  const assetVersion = isBuild
    ? `${systemVersion || '1'}_${Date.now().toString(36)}`
    : 'dev';

  const htmlPlugin: PluginOption[] = createHtmlPlugin({
    minify: isBuild,
    inject: {
      // Inject data into ejs template
      data: {
        title: VITE_GLOB_APP_TITLE,
        assetVersion
      }
    }
  });
  return htmlPlugin;
};
