/**
 * Android Gradle 运行环境：解析 JDK 21（与 Capacitor 8 子模块一致）、可选自动安装、Cordova 插件目录补丁。
 * 供 `buildAndroid.ts` 与任意直接调用 `./gradlew` 的脚本复用（避免仅装 JRE/未配 JAVA_HOME 时失败）。
 */
import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const root = resolve(process.cwd());
export const androidDir = resolve(root, 'android');
export const isWin = process.platform === 'win32';
export const gradlew = isWin ? 'gradlew.bat' : './gradlew';

const SKIP_AUTO_JDK =
  process.env.ANDROID_SKIP_AUTO_JDK21 === '1' || process.env.ANDROID_SKIP_AUTO_JDK21 === 'true';

export const javaMajorAtHome = (home: string): number | null => {
  const bin = resolve(home, 'bin', isWin ? 'java.exe' : 'java');
  if (!existsSync(bin)) return null;
  try {
    const verOut = execSync(`"${bin}" -version 2>&1`, { encoding: 'utf8' });
    const m = verOut.match(/version "(\d+)/) ?? verOut.match(/version (\d+)/);
    if (!m) return null;
    return Number(m[1]);
  } catch {
    return null;
  }
};

/** macOS：Apple 注册的 JDK 21 */
export const javaHomeFromMacJavaHome = (): string | undefined => {
  if (process.platform !== 'darwin') return undefined;
  try {
    const home = execSync('/usr/libexec/java_home -v 21', { encoding: 'utf8' }).trim();
    const major = home ? javaMajorAtHome(home) : null;
    if (major != null && major >= 21) return home;
  } catch {
    // 无 21
  }
  return undefined;
};

/** macOS：Android Studio 自带 JBR（多数开发者已安装，含 jlink） */
export const javaHomeFromAndroidStudioJbr = (): string | undefined => {
  if (process.platform !== 'darwin') return undefined;
  const candidates = [
    '/Applications/Android Studio.app/Contents/jbr/Contents/Home',
    resolve(process.env.HOME ?? '', 'Applications/Android Studio.app/Contents/jbr/Contents/Home')
  ];
  for (const home of candidates) {
    const major = javaMajorAtHome(home);
    if (major != null && major >= 21) return home;
  }
  return undefined;
};

/** Homebrew 已安装的 openjdk@21 路径 */
export const javaHomeFromHomebrewOpenJdk21 = (): string | undefined => {
  try {
    const prefix = execSync('brew --prefix openjdk@21', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
    if (!prefix) return undefined;
    const candidates = [
      resolve(prefix),
      resolve(prefix, 'libexec/openjdk.jdk/Contents/Home'),
      resolve(prefix, 'libexec/openjdk.jdk/Home')
    ];
    for (const c of candidates) {
      const major = javaMajorAtHome(c);
      if (major != null && major >= 21) return c;
    }
  } catch {
    // 未通过 brew 安装 openjdk@21
  }
  return undefined;
};

export const hasBrew = (): boolean => {
  try {
    execSync('command -v brew', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    return true;
  } catch {
    return false;
  }
};

export const autoInstallJdk21WithBrew = (): void => {
  console.warn(
    '[androidGradleEnv] 未检测到 JDK 21，正在通过 Homebrew 安装 openjdk@21（需联网，首次可能较久）…'
  );
  execSync('brew install openjdk@21', {
    stdio: 'inherit',
    env: { ...process.env, HOMEBREW_NO_ENV_HINTS: '1' }
  });
};

export const autoInstallJdk21WithWinget = (): void => {
  console.warn('[androidGradleEnv] 未检测到 JDK 21，正在通过 winget 安装 Microsoft OpenJDK 21…');
  execSync(
    'cmd.exe /c winget install -e --id Microsoft.OpenJDK.21 --accept-package-agreements --accept-source-agreements',
    { stdio: 'inherit' }
  );
};

/** Windows：扫描常见安装目录下的 jdk-21* */
export const javaHomeFromWindowsCandidates = (): string | undefined => {
  const programFiles = process.env['ProgramFiles'] ?? 'C:\\Program Files';
  const bases = [resolve(programFiles, 'Microsoft'), resolve(programFiles, 'Eclipse Adoptium')];
  for (const base of bases) {
    if (!existsSync(base)) continue;
    let names: string[] = [];
    try {
      names = readdirSync(base);
    } catch {
      continue;
    }
    const jdk21Dirs = names
      .filter((n) => /^jdk-21/i.test(n))
      .sort()
      .reverse();
    for (const name of jdk21Dirs) {
      const home = resolve(base, name);
      const major = javaMajorAtHome(home);
      if (major != null && major >= 21) return home;
    }
  }
  return undefined;
};

/** 解析 JDK 21 的 JAVA_HOME（不触发安装） */
export const discoverJdk21Home = (): string | undefined => {
  const mac = javaHomeFromMacJavaHome();
  if (mac) return mac;

  const studioJbr = javaHomeFromAndroidStudioJbr();
  if (studioJbr) return studioJbr;

  const brew = javaHomeFromHomebrewOpenJdk21();
  if (brew) return brew;

  if (isWin) {
    const win = javaHomeFromWindowsCandidates();
    if (win) return win;
  }

  const fromEnv = process.env.JAVA_HOME;
  if (fromEnv) {
    const major = javaMajorAtHome(fromEnv);
    if (major != null && major >= 21) return fromEnv;
  }

  return undefined;
};

export const tryAutoInstallJdk21 = (): void => {
  if (SKIP_AUTO_JDK) {
    console.error(
      '[androidGradleEnv] 未找到 JDK 21，且已设置 ANDROID_SKIP_AUTO_JDK21，跳过自动安装。请手动安装并设置 JAVA_HOME。'
    );
    process.exit(1);
  }

  if (process.platform === 'darwin' || process.platform === 'linux') {
    if (!hasBrew()) {
      console.error(
        '[androidGradleEnv] 未找到 JDK 21，且未检测到 Homebrew，无法自动安装。\n' +
          '请安装 JDK 21 或先安装 Homebrew 后重试: https://brew.sh\n' +
          '或设置 ANDROID_SKIP_AUTO_JDK21=1 并手动配置 JAVA_HOME。'
      );
      process.exit(1);
    }
    try {
      autoInstallJdk21WithBrew();
    } catch (e) {
      console.error('[androidGradleEnv] Homebrew 安装 openjdk@21 失败:', e);
      process.exit(1);
    }
    return;
  }

  if (isWin) {
    try {
      autoInstallJdk21WithWinget();
    } catch (e) {
      console.error('[androidGradleEnv] winget 安装 JDK 21 失败:', e);
      process.exit(1);
    }
    return;
  }

  console.error('[androidGradleEnv] 当前平台无法自动安装 JDK 21，请手动安装并设置 JAVA_HOME。');
  process.exit(1);
};

/**
 * 返回用于运行 `android/gradlew` 的 JAVA_HOME（JDK 21+）；找不到时尝试自动安装；失败则 `process.exit(1)`。
 */
export const ensureJdk21HomeForAndroidGradle = (): string => {
  let javaHome = discoverJdk21Home();

  if (!javaHome) {
    tryAutoInstallJdk21();
    javaHome = discoverJdk21Home();
  }

  if (!javaHome) {
    console.error(
      '[androidGradleEnv] 自动安装后仍未检测到 JDK 21，请检查 brew / winget 输出，或手动设置 JAVA_HOME。'
    );
    process.exit(1);
  }

  const major = javaMajorAtHome(javaHome);
  if (major == null || major < 21) {
    console.error(`[androidGradleEnv] 无法确认 Java 版本为 21+。JAVA_HOME=${javaHome}`);
    process.exit(1);
  }

  if (process.env.JAVA_HOME && process.env.JAVA_HOME !== javaHome) {
    console.warn(
      `[androidGradleEnv] 环境变量 JAVA_HOME 为 ${process.env.JAVA_HOME}，本次 Android Gradle 默认改用 JDK 21: ${javaHome}`
    );
  }

  return javaHome;
};

/**
 * Capacitor 生成的 `capacitor-cordova-android-plugins/build.gradle` 默认含 flatDir，AGP 会告警。
 * `cap sync` 可能覆盖该文件，因此在每次 Gradle 构建前按需打补丁。
 */
export const patchCordovaAndroidPluginsBuildGradle = (): void => {
  const p = resolve(androidDir, 'capacitor-cordova-android-plugins', 'build.gradle');
  if (!existsSync(p)) return;
  const raw = readFileSync(p, 'utf8');
  if (!/flatDir\s*\{/.test(raw)) return;

  let text = raw.replace(/\r\n/g, '\n');
  text = text.replace(/\n[ \t]*flatDir[ \t]*\{[^}]*\}[ \t]*\r?\n?/m, '\n');

  text = text.replace(
    /implementation\s+fileTree\s*\(\s*dir:\s*['"]src\/main\/libs['"],\s*include:\s*\[\s*['"]\*\.jar['"]\s*\]\s*\)/g,
    "implementation fileTree(dir: 'src/main/libs', include: ['*.jar', '*.aar'])"
  );

  if (!/fileTree\s*\(\s*dir:\s*['"]libs['"]/.test(text)) {
    text = text.replace(
      /(implementation\s+fileTree\s*\(\s*dir:\s*['"]src\/main\/libs['"],\s*include:\s*\[[^\]]*\]\s*\)\s*\n)/,
      "$1    implementation fileTree(dir: 'libs', include: ['*.jar', '*.aar'])\n"
    );
  }

  const out = raw.includes('\r\n') ? text.replace(/\n/g, '\r\n') : text;
  if (out !== raw) {
    writeFileSync(p, out, 'utf8');
    console.log(
      '[androidGradleEnv] 已修正 capacitor-cordova-android-plugins/build.gradle：移除 flatDir，改用 fileTree'
    );
    return;
  }

  if (/flatDir\s*\{/.test(text)) {
    console.warn(
      '[androidGradleEnv] capacitor-cordova-android-plugins/build.gradle 仍含 flatDir，自动补丁未生效；请手动删除 flatDir 或升级 @capacitor/cli。'
    );
  }
};
