/**
 * macOS：Xcode archive + 导出 .ipa，并复制到仓库根目录 PackageIOS/
 *
 * 用法: esno ./build/script/buildIos.ts [release]
 * 前置: 已执行 build-only:app + cap sync ios；已配置 ios/signing.properties 的 teamId
 * 需本机 Xcode、Apple 开发者账号，且 Xcode 已登录（Automatic Signing）
 */
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, readdirSync } from 'node:fs';
import {
  assertDarwin,
  assertXcodeProject,
  archivePath,
  exportDir,
  exportOptionsPlist,
  iosAppDir,
  packageIosDir,
  readCapacitorAppName,
  readExportMethod,
  readIosMarketingVersion,
  readTeamId,
  releasePackageIpaFileName,
  scheme,
  writeExportOptionsPlist,
  ensureIosBuildDirs
} from './iosXcodeEnv';

const run = (label: string, args: string[], extraEnv?: Record<string, string>): void => {
  console.log(`[buildIos] ${label}`);
  const r = spawnSync('xcodebuild', args, {
    cwd: iosAppDir,
    stdio: 'inherit',
    env: { ...process.env, ...extraEnv }
  });
  if (r.status !== 0) {
    console.error(`[buildIos] 失败: xcodebuild ${args.join(' ')}`);
    process.exit(r.status ?? 1);
  }
};

const copyIpaToPackageIos = (): void => {
  if (!existsSync(exportDir)) {
    console.error('[buildIos] 导出目录不存在:', exportDir);
    process.exit(1);
  }
  const ipas = readdirSync(exportDir).filter((f) => f.endsWith('.ipa'));
  if (ipas.length === 0) {
    console.error('[buildIos] 未在导出目录找到 .ipa:', exportDir);
    process.exit(1);
  }

  const appName = readCapacitorAppName();
  const versionName = readIosMarketingVersion();
  const time = Date.now();
  const destName = releasePackageIpaFileName(appName, versionName, time);

  console.log('[buildIos] 安装包输出:');
  for (const name of ipas) {
    const src = `${exportDir}/${name}`;
    console.log(`  ${src}`);
  }

  const src = `${exportDir}/${ipas[0]}`;
  const dest = `${packageIosDir}/${destName}`;
  copyFileSync(src, dest);
  console.log(`  (已复制到根目录 PackageIOS) ${dest}`);
};

export const main = (): void => {
  assertDarwin();
  assertXcodeProject();

  const teamId = readTeamId();
  const exportMethod = readExportMethod();
  ensureIosBuildDirs();
  writeExportOptionsPlist(teamId, exportMethod);

  const signEnv = {
    DEVELOPMENT_TEAM: teamId,
    CODE_SIGN_STYLE: 'Automatic'
  };

  run('解析 Swift Package 依赖', [
    '-project',
    'App.xcodeproj',
    '-scheme',
    scheme,
    '-resolvePackageDependencies'
  ]);

  run('Archive (Release)', [
    '-project',
    'App.xcodeproj',
    '-scheme',
    scheme,
    '-configuration',
    'Release',
    '-destination',
    'generic/platform=iOS',
    '-archivePath',
    archivePath,
    '-allowProvisioningUpdates',
    'archive'
  ], signEnv);

  run('Export .ipa', [
    '-exportArchive',
    '-archivePath',
    archivePath,
    '-exportPath',
    exportDir,
    '-exportOptionsPlist',
    exportOptionsPlist,
    '-allowProvisioningUpdates'
  ]);

  copyIpaToPackageIos();
};

main();
