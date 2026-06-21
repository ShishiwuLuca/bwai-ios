/**
 * 跨平台执行 Android Gradle 构建（assembleDebug / assembleRelease）
 * 用法: esno ./build/script/buildAndroid.ts [debug|release]
 * release 成功后会把 APK 复制到仓库根目录 PackageAndroid/，文件名为
 * ${appName}-V${versionName}-${Date.now()}-release.apk（appName 来自 capacitor.config.ts，versionName 来自 android/app/build.gradle）。
 *
 * 默认使用 JDK 21 运行 Gradle（Capacitor 8 子模块为 Java 21）。
 * - macOS：优先 `/usr/libexec/java_home -v 21`；若未检测到且已安装 Homebrew，将自动 `brew install openjdk@21`。
 * - Windows：若未检测到，将尝试 `winget` 安装 Microsoft OpenJDK 21。
 * - 跳过自动安装：设置环境变量 ANDROID_SKIP_AUTO_JDK21=1
 */
import { spawn } from 'node:child_process';
import { existsSync, readdirSync, mkdirSync, copyFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  androidDir,
  gradlew,
  isWin,
  root,
  ensureJdk21HomeForAndroidGradle,
  patchCordovaAndroidPluginsBuildGradle
} from './androidGradleEnv';

const task = process.argv[2] === 'release' ? 'assembleRelease' : 'assembleDebug';

export const main = (): void => {
  const javaHome = ensureJdk21HomeForAndroidGradle();

  patchCordovaAndroidPluginsBuildGradle();

  const child = spawn(gradlew, [task], {
    cwd: androidDir,
    stdio: 'inherit',
    shell: isWin,
    env: { ...process.env, JAVA_HOME: javaHome }
  });

  child.on('exit', (code) => {
    if (code === 0) {
      logApkOutputs();
    }
    process.exit(code ?? 0);
  });
};

export const readCapacitorAppName = (): string => {
  const p = resolve(root, 'capacitor.config.ts');
  if (!existsSync(p)) {
    throw new Error(`[buildAndroid] 未找到 capacitor.config.ts: ${p}`);
  }
  const text = readFileSync(p, 'utf8');
  const m = text.match(/appName\s*:\s*['"]([^'"]*)['"]/);
  if (!m?.[1]) {
    throw new Error('[buildAndroid] 无法在 capacitor.config.ts 中解析 appName');
  }
  return m[1];
};

export const readAndroidVersionName = (): string => {
  const p = resolve(androidDir, 'app', 'build.gradle');
  if (!existsSync(p)) {
    throw new Error(`[buildAndroid] 未找到 android/app/build.gradle: ${p}`);
  }
  const text = readFileSync(p, 'utf8');
  const m = text.match(/versionName\s*=?\s*["']([^"']+)["']/);
  if (!m?.[1]) {
    throw new Error('[buildAndroid] 无法在 android/app/build.gradle 中解析 versionName');
  }
  return m[1];
};

/** 文件名片段：去掉路径非法字符，避免空串 */
export const sanitizeFileSegment = (s: string): string => {
  const t = s
    .trim()
    .replace(/[/\\:*?"<>|]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return t.length > 0 ? t : 'app';
};

/**
 * 单 APK：${appName}-V${versionName}-${time}-release.apk
 * 多 APK（分包等）：中间插入 Gradle 产物 stem，避免互相覆盖。
 */
export const releasePackageApkFileName = (
  sourceBaseName: string,
  total: number,
  appName: string,
  versionName: string,
  time: number
): string => {
  const safeApp = sanitizeFileSegment(appName);
  const safeVer = sanitizeFileSegment(versionName);
  const prefix = `${safeApp}-V${safeVer}-${time}`;
  if (total === 1) {
    return `${prefix}-release.apk`;
  }
  const stem = sourceBaseName.replace(/\.apk$/i, '').replace(/-release$/i, '');
  const safeStem = sanitizeFileSegment(stem);
  return `${prefix}-${safeStem}-release.apk`;
};

/** Gradle 默认把 APK 放在 app/build/outputs/apk/<variant>/，脚本原先不打印路径，容易误以为未生成。 */
export const logApkOutputs = (): void => {
  const variant = task === 'assembleRelease' ? 'release' : 'debug';
  const outDir = resolve(androidDir, 'app', 'build', 'outputs', 'apk', variant);
  if (!existsSync(outDir)) {
    return;
  }
  const apks = readdirSync(outDir).filter((f) => f.endsWith('.apk'));
  if (apks.length === 0) {
    return;
  }
  console.log('[buildAndroid] 安装包输出:');
  for (const name of apks) {
    console.log(`  ${resolve(outDir, name)}`);
  }
  if (variant === 'release') {
    let appName: string;
    let versionName: string;
    try {
      appName = readCapacitorAppName();
      versionName = readAndroidVersionName();
    } catch (e) {
      console.error(e instanceof Error ? e.message : e);
      process.exit(1);
    }
    const time = Date.now();
    const pkgDir = resolve(root, 'PackageAndroid');
    mkdirSync(pkgDir, { recursive: true });
    const total = apks.length;
    apks.forEach((name) => {
      const src = resolve(outDir, name);
      const destName = releasePackageApkFileName(name, total, appName, versionName, time);
      const dest = resolve(pkgDir, destName);
      copyFileSync(src, dest);
      console.log(`  (已复制到根目录 PackageAndroid) ${dest}`);
    });
  }
};

main();
