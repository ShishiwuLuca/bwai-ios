/**
 * 跨平台执行 Android Gradle 构建（assembleDebug / assembleRelease / bundleRelease）
 * 用法: esno ./build/script/buildAndroid.ts [debug|release|bundle]
 * release 成功后会把 APK 复制到仓库根目录 PackageAndroid/
 * bundle（Google Play AAB）成功后复制 .aab 到 PackageAndroid/
 * 文件名为 ${appName}-V${versionName}-${Date.now()}-release.apk|.aab
 *
 * 默认使用 JDK 21 运行 Gradle（Capacitor 8 子模块为 Java 21）。
 * - macOS：优先 `/usr/libexec/java_home -v 21`；若未检测到且已安装 Homebrew，将自动 `brew install openjdk@21`。
 * - Windows：若未检测到，将尝试 `winget` 安装 Microsoft OpenJDK 21。
 * - 跳过自动安装：设置环境变量 ANDROID_SKIP_AUTO_JDK21=1
 */
import { spawn } from 'node:child_process';
import { existsSync, readdirSync, mkdirSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  androidDir,
  gradlew,
  isWin,
  root,
  ensureJdk21HomeForAndroidGradle,
  patchCordovaAndroidPluginsBuildGradle
} from './androidGradleEnv';

const mode = process.argv[2] ?? 'debug';
const task =
  mode === 'bundle' ? 'bundleRelease' : mode === 'release' ? 'assembleRelease' : 'assembleDebug';
const isBundle = mode === 'bundle';

/** 若未配置 keystore.properties，可从环境变量生成（勿提交该文件） */
export const ensureKeystorePropertiesFromEnv = (): void => {
  const propsPath = resolve(androidDir, 'keystore.properties');
  if (existsSync(propsPath)) return;
  const storePassword = process.env.ANDROID_STORE_PASSWORD?.trim();
  if (!storePassword) return;
  const keyPassword = (process.env.ANDROID_KEY_PASSWORD ?? storePassword).trim();
  const keyAlias = (process.env.ANDROID_KEY_ALIAS ?? 'fundex').trim();
  const storeFile = (process.env.ANDROID_KEYSTORE_FILE ?? 'fundex.jks').trim();
  writeFileSync(
    propsPath,
    `storeFile=${storeFile}\nstorePassword=${storePassword}\nkeyAlias=${keyAlias}\nkeyPassword=${keyPassword}\n`,
    'utf8'
  );
  console.log('[buildAndroid] 已从环境变量生成 android/keystore.properties');
};

export const main = (): void => {
  ensureKeystorePropertiesFromEnv();
  const keystoreProps = resolve(androidDir, 'keystore.properties');
  if (
    (mode === 'release' || mode === 'bundle') &&
    !existsSync(keystoreProps) &&
    !existsSync(resolve(androidDir, 'fundex.jks'))
  ) {
    console.error(
      '[buildAndroid] 缺少签名：请配置 android/keystore.properties（参考 keystore.properties.example）' +
        '，或设置环境变量 ANDROID_STORE_PASSWORD / ANDROID_KEY_PASSWORD'
    );
    process.exit(1);
  }
  if ((mode === 'release' || mode === 'bundle') && !existsSync(keystoreProps)) {
    console.warn(
      '[buildAndroid] 警告: 未找到 keystore.properties，release 包可能未使用正式签名，无法上传 Google Play'
    );
  }

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
      if (isBundle) {
        logAabOutputs();
      } else {
        logApkOutputs();
      }
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

export const releasePackageAabFileName = (
  appName: string,
  versionName: string,
  time: number
): string => {
  const safeApp = sanitizeFileSegment(appName);
  const safeVer = sanitizeFileSegment(versionName);
  return `${safeApp}-V${safeVer}-${time}-release.aab`;
};

/** Gradle 默认把 AAB 放在 app/build/outputs/bundle/release/ */
export const logAabOutputs = (): void => {
  const outDir = resolve(androidDir, 'app', 'build', 'outputs', 'bundle', 'release');
  if (!existsSync(outDir)) {
    return;
  }
  const aabs = readdirSync(outDir).filter((f) => f.endsWith('.aab'));
  if (aabs.length === 0) {
    return;
  }
  console.log('[buildAndroid] AAB 输出:');
  for (const name of aabs) {
    console.log(`  ${resolve(outDir, name)}`);
  }
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
  const destName = releasePackageAabFileName(appName, versionName, time);
  const src = resolve(outDir, aabs[0]!);
  const dest = resolve(pkgDir, destName);
  copyFileSync(src, dest);
  console.log(`  (已复制到根目录 PackageAndroid) ${dest}`);
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
