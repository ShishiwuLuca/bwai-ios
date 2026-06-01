/**
 * Gradle 9 + AGP 9：`:capacitor-file-transfer` 在已有 `kotlin` extension 时再次 `apply kotlin-android` 会失败。
 * 在 `apply com.android.library` 之后改为按需应用 Kotlin（与 patches/@capacitor__file-transfer@2.0.4.patch 一致）。
 * 通过 postinstall 执行，避免仅改 workspace 而未刷新 lockfile 时补丁不生效。
 */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const NEEDLE =
  /apply plugin: 'com\.android\.library'\r?\napply plugin: 'kotlin-android'/;

const REPLACEMENT = `apply plugin: 'com.android.library'
if (project.extensions.findByName('kotlin') == null) {
    apply plugin: 'kotlin-android'
}`;

function patchFile(gradlePath) {
  let s = readFileSync(gradlePath, 'utf8');
  if (!NEEDLE.test(s)) return false;
  s = s.replace(NEEDLE, REPLACEMENT);
  writeFileSync(gradlePath, s, 'utf8');
  return true;
}

const cwd = process.cwd();
const pnpmDir = join(cwd, 'node_modules', '.pnpm');
if (!existsSync(pnpmDir)) {
  process.exit(0);
}

let patched = 0;
for (const name of readdirSync(pnpmDir)) {
  if (!name.includes('file-transfer') || !name.includes('2.0.4')) continue;
  const gradlePath = join(
    pnpmDir,
    name,
    'node_modules',
    '@capacitor',
    'file-transfer',
    'android',
    'build.gradle'
  );
  if (!existsSync(gradlePath)) continue;
  try {
    if (statSync(gradlePath).isFile() && patchFile(gradlePath)) {
      patched += 1;
      console.log(`[patchCapacitorFileTransferAndroid] patched: ${gradlePath}`);
    }
  } catch {
    // ignore
  }
}

if (patched === 0) {
  const flat = join(cwd, 'node_modules', '@capacitor', 'file-transfer', 'android', 'build.gradle');
  if (existsSync(flat) && patchFile(flat)) {
    console.log(`[patchCapacitorFileTransferAndroid] patched: ${flat}`);
  }
}
