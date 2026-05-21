/**
 * iOS Xcode 构建路径与签名配置（仅 macOS 可执行 archive/export）。
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const root = resolve(process.cwd());
export const iosDir = resolve(root, 'ios');
export const iosAppDir = resolve(iosDir, 'App');
export const xcodeProject = resolve(iosAppDir, 'App.xcodeproj');
export const scheme = 'App';

export const iosBuildDir = resolve(iosDir, 'build');
export const archivePath = resolve(iosBuildDir, 'App.xcarchive');
export const exportDir = resolve(iosBuildDir, 'export');
export const exportOptionsPlist = resolve(iosBuildDir, 'ExportOptions.plist');
export const packageIosDir = resolve(root, 'PackageIOS');

const signingPropsPath = resolve(iosDir, 'signing.properties');

export const assertDarwin = (): void => {
  if (process.platform !== 'darwin') {
    throw new Error(
      '[buildIos] 生成 .ipa 必须在 macOS 上执行（需 Xcode）。Windows/Linux 可先 pnpm run build-only:app，再在 Mac 上运行 pnpm run build:ios:release。'
    );
  }
};

export const assertXcodeProject = (): void => {
  if (!existsSync(xcodeProject)) {
    throw new Error(`[buildIos] 未找到 Xcode 工程: ${xcodeProject}，请先执行: pnpm cap add ios 或从仓库拉取 ios/ 目录`);
  }
};

export const loadSigningProperties = (): Record<string, string> => {
  const out: Record<string, string> = {};
  if (!existsSync(signingPropsPath)) {
    return out;
  }
  const text = readFileSync(signingPropsPath, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i <= 0) continue;
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return out;
};

export const readTeamId = (): string => {
  const fromEnv = process.env.IOS_TEAM_ID?.trim();
  if (fromEnv) return fromEnv;

  const props = loadSigningProperties();
  const teamId = props.teamId?.trim();
  if (teamId && teamId !== 'YOUR_TEAM_ID') {
    return teamId;
  }

  throw new Error(
    '[buildIos] 缺少 Apple Team ID。请复制 ios/signing.properties.example 为 ios/signing.properties 并填写 teamId，或设置环境变量 IOS_TEAM_ID。'
  );
};

export const readExportMethod = (): string => {
  const fromEnv = process.env.IOS_EXPORT_METHOD?.trim();
  if (fromEnv) return fromEnv;
  const props = loadSigningProperties();
  return props.exportMethod?.trim() || 'app-store';
};

export const ensureIosBuildDirs = (): void => {
  mkdirSync(iosBuildDir, { recursive: true });
  mkdirSync(exportDir, { recursive: true });
  mkdirSync(packageIosDir, { recursive: true });
};

/** 写入 xcodebuild -exportArchive 所需的 ExportOptions.plist */
export const writeExportOptionsPlist = (teamId: string, method: string): void => {
  const allowed = new Set(['app-store', 'ad-hoc', 'development', 'enterprise']);
  const m = allowed.has(method) ? method : 'app-store';

  const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key>
  <string>${m}</string>
  <key>teamID</key>
  <string>${teamId}</string>
  <key>signingStyle</key>
  <string>automatic</string>
  <key>uploadSymbols</key>
  <true/>
</dict>
</plist>
`;
  writeFileSync(exportOptionsPlist, plist, 'utf8');
};

export const readCapacitorAppName = (): string => {
  const p = resolve(root, 'capacitor.config.ts');
  if (!existsSync(p)) {
    throw new Error(`[buildIos] 未找到 capacitor.config.ts: ${p}`);
  }
  const text = readFileSync(p, 'utf8');
  const m = text.match(/appName\s*:\s*['"]([^'"]*)['"]/);
  if (!m?.[1]) {
    throw new Error('[buildIos] 无法在 capacitor.config.ts 中解析 appName');
  }
  return m[1];
};

export const readIosMarketingVersion = (): string => {
  const p = resolve(iosAppDir, 'App.xcodeproj', 'project.pbxproj');
  if (!existsSync(p)) {
    throw new Error(`[buildIos] 未找到 project.pbxproj: ${p}`);
  }
  const text = readFileSync(p, 'utf8');
  const m = text.match(/MARKETING_VERSION = ([^;]+);/);
  if (!m?.[1]) {
    throw new Error('[buildIos] 无法在 project.pbxproj 中解析 MARKETING_VERSION');
  }
  return m[1].trim().replace(/^"|"$/g, '');
};

export const sanitizeFileSegment = (s: string): string => {
  const t = s
    .trim()
    .replace(/[/\\:*?"<>|]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return t.length > 0 ? t : 'app';
};

export const releasePackageIpaFileName = (
  appName: string,
  versionName: string,
  time: number
): string => {
  const safeApp = sanitizeFileSegment(appName);
  const safeVer = sanitizeFileSegment(versionName);
  return `${safeApp}-V${safeVer}-${time}-release.ipa`;
};
