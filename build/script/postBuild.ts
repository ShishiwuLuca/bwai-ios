#!/usr/bin/env node
import chalk from 'chalk';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import pkg from '../../package.json';
import { OUTPUT_DIR } from '../constant';

/** 给 dist/manifest.json 里的 PWA 图标加版本参数，避免桌面/主屏幕图标长期缓存旧图 */
const patchManifestIcons = () => {
  const manifestPath = join(process.cwd(), OUTPUT_DIR, 'manifest.json');
  let manifestRaw: string;
  try {
    manifestRaw = readFileSync(manifestPath, 'utf-8');
  } catch {
    return;
  }

  const manifest = JSON.parse(manifestRaw) as {
    icons?: Array<{ src?: string; [key: string]: unknown }>;
    [key: string]: unknown;
  };
  if (!Array.isArray(manifest.icons)) return;

  const version = Date.now().toString(36);
  manifest.icons = manifest.icons.map((icon) => {
    const src = String(icon.src ?? '');
    if (!src || src.includes('?v=')) return icon;
    return { ...icon, src: `${src}?v=${version}` };
  });

  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf-8');
};

export const runBuild = async () => {
  try {
    patchManifestIcons();
    console.log(`✨ ${chalk.cyan(`[${pkg.name}]`)}` + ' - 编译成功!');
  } catch (error) {
    console.log(chalk.red('编译出错:\n' + error));
    process.exit(1);
  }
};
runBuild();
