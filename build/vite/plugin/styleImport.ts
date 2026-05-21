/**
 *  Introduces component library styles on demand.
 * https://github.com/anncwb/vite-plugin-style-import
 */
import type { PluginOption } from 'vite';
import Components from 'unplugin-vue-components/vite';
import { VantResolver } from 'unplugin-vue-components/resolvers';

export const configStyleImportPlugin = (): PluginOption => {
  return Components({
    resolvers: [VantResolver()]
  });
};
