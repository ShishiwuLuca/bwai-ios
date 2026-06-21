/**
 * Gradle 8.13+：Groovy DSL 中 `propName value` 将弃用，需改为 `propName = value`。
 * @capgo/capacitor-updater 的 android/build.gradle 会在 configure 阶段打弃用告警，postinstall 打补丁直至上游修复。
 */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SNIPPETS = [
  [
    `    lintOptions {
        abortOnError false
    }`,
    `    lintOptions {
        abortOnError = false
    }`
  ],
  [
    `        events "passed", "skipped", "failed", "standardOut", "standardError"
        exceptionFormat "full"`,
    `        events = ["passed", "skipped", "failed", "standardOut", "standardError"]
        exceptionFormat = "full"`
  ]
];

function patchContent(s) {
  let next = s;
  for (const [from, to] of SNIPPETS) {
    if (next.includes(from)) next = next.split(from).join(to);
  }
  return next;
}

function patchFile(gradlePath) {
  const s = readFileSync(gradlePath, 'utf8');
  const next = patchContent(s);
  if (next === s) return false;
  writeFileSync(gradlePath, next, 'utf8');
  return true;
}

const cwd = process.cwd();
const pnpmDir = join(cwd, 'node_modules', '.pnpm');
if (!existsSync(pnpmDir)) {
  process.exit(0);
}

let patched = 0;
for (const name of readdirSync(pnpmDir)) {
  if (!name.startsWith('@capgo+capacitor-updater@')) continue;
  const gradlePath = join(
    pnpmDir,
    name,
    'node_modules',
    '@capgo',
    'capacitor-updater',
    'android',
    'build.gradle'
  );
  if (!existsSync(gradlePath)) continue;
  try {
    if (statSync(gradlePath).isFile() && patchFile(gradlePath)) {
      patched += 1;
      console.log(`[patchCapgoUpdaterAndroidGradle] patched: ${gradlePath}`);
    }
  } catch {
    // ignore
  }
}

if (patched === 0) {
  const flat = join(cwd, 'node_modules', '@capgo', 'capacitor-updater', 'android', 'build.gradle');
  if (existsSync(flat) && patchFile(flat)) {
    console.log(`[patchCapgoUpdaterAndroidGradle] patched: ${flat}`);
  }
}
