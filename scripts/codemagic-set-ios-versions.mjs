#!/usr/bin/env node
/**
 * Codemagic：读取 App Store Connect 最高营销版本，递增 Build 号，写回 project.pbxproj。
 * 环境变量：CM_BUILD_DIR, IOS_APP_DIR, APP_STORE_APPLE_ID, BUILD_NUMBER
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const buildDir = process.env.CM_BUILD_DIR || process.cwd();
const iosAppDir = process.env.IOS_APP_DIR || 'ios/App';
const appStoreAppleId = process.env.APP_STORE_APPLE_ID || '';
const buildNumberOverride = process.env.BUILD_NUMBER || '';

const pbxprojPath = path.join(buildDir, iosAppDir, 'App.xcodeproj/project.pbxproj');

function readPbxprojValue(key) {
  const content = fs.readFileSync(pbxprojPath, 'utf8');
  const match = content.match(new RegExp(`${key} = ([^;]+);`));
  return match ? match[1].trim().replace(/^["']|["']$/g, '') : '';
}

function setPbxprojVersions(marketing, build) {
  let content = fs.readFileSync(pbxprojPath, 'utf8');
  content = content.replace(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${marketing};`);
  content = content.replace(/CURRENT_PROJECT_VERSION = [^;]+;/g, `CURRENT_PROJECT_VERSION = ${build};`);
  fs.writeFileSync(pbxprojPath, content, 'utf8');
}

/** 与原生 MARKETING_VERSION 对齐，供 build-only:app 打入 dist（服务端 OTA / version-check 用） */
function syncEnvAppVersion(marketing) {
  const envPath = path.join(buildDir, '.env.app');
  if (!fs.existsSync(envPath)) {
    console.warn('[ios-version] .env.app not found, skip sync');
    return;
  }
  let content = fs.readFileSync(envPath, 'utf8');
  if (/VITE_GLOB_SYSTEM_VERSION\s*=/.test(content)) {
    content = content.replace(
      /VITE_GLOB_SYSTEM_VERSION\s*=\s*['"]?[^'"\n]+['"]?/,
      `VITE_GLOB_SYSTEM_VERSION = '${marketing}'`
    );
  } else {
    content += `\nVITE_GLOB_SYSTEM_VERSION = '${marketing}'\n`;
  }
  fs.writeFileSync(envPath, content, 'utf8');
  console.log(`[ios-version] Synced .env.app VITE_GLOB_SYSTEM_VERSION → ${marketing}`);
}

function bumpPatch(input) {
  const parts = String(input).trim().split('.').map((s) => parseInt(s, 10) || 0);
  while (parts.length < 3) parts.push(0);
  parts[2] += 1;
  return parts.slice(0, 3).join('.');
}

function maxSemver(a, b) {
  const parse = (s) => String(s).trim().split('.').map((x) => parseInt(x, 10) || 0);
  const pa = parse(a);
  const pb = parse(b);
  while (pa.length < 3) pa.push(0);
  while (pb.length < 3) pb.push(0);
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] > pb[i] ? pa.join('.') : pb.join('.');
  }
  return pa.join('.');
}

function maxInt(...nums) {
  const values = nums.map((s) => parseInt(String(s), 10)).filter((n) => Number.isFinite(n));
  return values.length ? Math.max(...values) : 0;
}

function runAsc(args) {
  try {
    return execFileSync('app-store-connect', args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    }).trim();
  } catch {
    return '';
  }
}

function parseVersionFromJson(raw, keys) {
  if (!raw) return '';
  try {
    const j = JSON.parse(raw);
    for (const key of keys) {
      const parts = key.split('.');
      let cur = j;
      for (const p of parts) {
        cur = cur?.[p];
      }
      if (cur) return String(cur).trim();
    }
  } catch {
    /* ignore */
  }
  return '';
}

function bumpLatestBuild(label, latestBuild, args) {
  const out = runAsc([...args, '-s']);
  if (/^\d+$/.test(out)) {
    console.log(`[ios-version] Latest build from ${label}: ${out}`);
    return maxInt(latestBuild, out);
  }
  return latestBuild;
}

let localVersion = readPbxprojValue('MARKETING_VERSION');
if (!localVersion || localVersion.includes('$(')) {
  localVersion = '1.0.0';
}

let ascVersion = '';
let tfVersion = '';

if (appStoreAppleId && appStoreAppleId !== '0000000000') {
  const tfJson = runAsc([
    'get-latest-testflight-build-number',
    appStoreAppleId,
    '--include-version',
    '--json'
  ]);
  tfVersion = parseVersionFromJson(tfJson, [
    'version',
    'version_string',
    'pre_release_version',
    'attributes.version'
  ]);
  if (tfVersion) {
    console.log(`[ios-version] TestFlight latest pre-release version: ${tfVersion}`);
  }

  const ascJson = runAsc(['get-latest-app-store-build-number', appStoreAppleId, '--include-version', '--json']);
  ascVersion = parseVersionFromJson(ascJson, [
    'version',
    'version_string',
    'app_store_version',
    'attributes.versionString'
  ]);
}

let baseVersion = maxSemver(localVersion, ascVersion || '1.0.0');
if (tfVersion) {
  baseVersion = maxSemver(baseVersion, tfVersion);
}
if (ascVersion) {
  console.log(`[ios-version] App Store latest marketing version: ${ascVersion}`);
}

let newMarketing;
if (tfVersion || ascVersion) {
  newMarketing = baseVersion;
  console.log(`[ios-version] Marketing version (continue): ${newMarketing}`);
} else {
  newMarketing = bumpPatch(localVersion);
  console.log(`[ios-version] Marketing version (first release): ${localVersion} → ${newMarketing}`);
}

let latestBuild = 0;
if (appStoreAppleId && appStoreAppleId !== '0000000000') {
  latestBuild = bumpLatestBuild(`TestFlight(${newMarketing})`, latestBuild, [
    'get-latest-testflight-build-number',
    appStoreAppleId,
    '--pre-release-version',
    newMarketing,
    '--platform',
    'IOS'
  ]);
  latestBuild = bumpLatestBuild('TestFlight(global)', latestBuild, [
    'get-latest-testflight-build-number',
    appStoreAppleId,
    '--platform',
    'IOS'
  ]);
  latestBuild = bumpLatestBuild(`AppStore(${newMarketing})`, latestBuild, [
    'get-latest-app-store-build-number',
    appStoreAppleId,
    '--version-string',
    newMarketing
  ]);
  latestBuild = bumpLatestBuild('AppStore(global)', latestBuild, [
    'get-latest-app-store-build-number',
    appStoreAppleId
  ]);
  latestBuild = bumpLatestBuild('Build(global)', latestBuild, [
    'get-latest-build-number',
    appStoreAppleId,
    '--platform',
    'IOS'
  ]);
}

const current = readPbxprojValue('CURRENT_PROJECT_VERSION');
latestBuild = maxInt(latestBuild, /^\d+$/.test(current) ? current : 0);

if (buildNumberOverride && /^\d+$/.test(buildNumberOverride)) {
  latestBuild = maxInt(latestBuild, buildNumberOverride);
}

const nextBuild = latestBuild + 1;
console.log(`[ios-version] Build number → ${nextBuild} (marketing ${newMarketing}, latest seen ${latestBuild})`);
setPbxprojVersions(newMarketing, String(nextBuild));
syncEnvAppVersion(newMarketing);
