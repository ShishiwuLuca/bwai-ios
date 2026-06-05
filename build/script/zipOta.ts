/**
 * 将构建产物 dist 打包为 OTA 资源 zip，便于上传至 Capgo / 自托管更新服务
 * 版本号优先从 .env.production 的 VITE_GLOB_SYSTEM_VERSION 读取，否则用 package.json version
 */
import chalk from 'chalk';
import { ZipArchive } from 'archiver';
import { config } from 'dotenv';
import { resolve } from 'node:path';
import pkg from '../../package.json';
import { pathExists } from 'fs-extra';
import { mkdir } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';

const ROOT = resolve(process.cwd());
const DIST_DIR = resolve(ROOT, 'dist');
const OTA_OUT_DIR = resolve(ROOT, 'OTA');

const getVersion = async (): Promise<string> => {
  config({ path: resolve(ROOT, '.env.app') });
  const envVersion = process.env.VITE_GLOB_SYSTEM_VERSION?.trim();
  if (envVersion) return envVersion;
  return (pkg.version as string) || '0.0.0';
};

const run = async (): Promise<void> => {
  if (!(await pathExists(DIST_DIR))) {
    console.error(
      chalk.red('[zipOta] dist 目录不存在，请先执行 pnpm run build 或 pnpm run build:ota')
    );
    process.exit(1);
  }

  const version = await getVersion();
  const name = (pkg.name as string) || 'app';
  const zipName = `${name}-OTA-Release-V${version}.zip`;
  const zipPath = resolve(OTA_OUT_DIR, zipName);

  await mkdir(OTA_OUT_DIR, { recursive: true });

  const output = createWriteStream(zipPath);
  const archive = new ZipArchive({ zlib: { level: 9 } });

  output.on('close', () => {
    console.log(chalk.cyan(`[OTA] 资源包已生成: ${zipPath}`));
    console.log(
      chalk.gray(`      版本: ${version}，大小: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`)
    );
  });

  archive.on('error', (err: unknown) => {
    console.error(chalk.red('[zipOta] 打包失败:'), err);
    process.exit(1);
  });

  archive.pipe(output);
  // 将 dist 内容放入 zip 根目录（不包含 dist 这一层目录名）
  archive.directory(DIST_DIR, false);
  await archive.finalize();
};

run();
