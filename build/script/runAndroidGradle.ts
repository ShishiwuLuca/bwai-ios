/**
 * 在已解析的 JDK 21 + JAVA_HOME 下执行 `android/gradlew`，供本地与 CI 直接跑任意 Gradle 任务。
 *
 * 用法:
 *   pnpm android:gradle -- :app:compileDebugJavaWithJavac
 *   pnpm android:gradle -- tasks
 *
 * 说明: 裸跑 `android/./gradlew` 依赖本机 PATH 中的 `java`；本脚本与 `buildAndroid.ts` 共用
 * `androidGradleEnv.ts`（macOS `java_home`、Homebrew openjdk@21、Windows 常见路径、可选 brew/winget 安装）。
 */
import { spawn } from 'node:child_process';
import {
  androidDir,
  gradlew,
  isWin,
  ensureJdk21HomeForAndroidGradle,
  patchCordovaAndroidPluginsBuildGradle
} from './androidGradleEnv';

const main = (): void => {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('用法: pnpm android:gradle -- <Gradle 参数…>');
    console.error('示例: pnpm android:gradle -- :app:compileDebugJavaWithJavac');
    process.exit(1);
  }

  const javaHome = ensureJdk21HomeForAndroidGradle();
  patchCordovaAndroidPluginsBuildGradle();

  const child = spawn(gradlew, args, {
    cwd: androidDir,
    stdio: 'inherit',
    shell: isWin,
    env: { ...process.env, JAVA_HOME: javaHome }
  });

  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });
};

main();
