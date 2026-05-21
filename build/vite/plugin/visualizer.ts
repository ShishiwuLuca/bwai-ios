/**
 * Package file volume analysis
 */
import type { Plugin } from 'vite';
import { isReportMode } from '../../utils';
import visualizer from 'rollup-plugin-visualizer';

export const configVisualizerConfig = (): Plugin | Plugin[] => {
  if (isReportMode()) {
    return visualizer({
      filename: './node_modules/.cache/visualizer/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true
    }) as Plugin;
  }
  return [];
};
