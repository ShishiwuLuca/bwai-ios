#!/usr/bin/env bash
# Codemagic：读取 App Store Connect 最高营销版本，patch +0.0.1，并递增 Build 号。
# 版本写在 project.pbxproj（Info.plist 使用 $(MARKETING_VERSION)，agvtool 不适用）。
# 依赖：ios/App 已 cap sync；环境变量 APP_STORE_APPLE_ID（可选）、BUILD_NUMBER（兜底）。
set -euo pipefail

IOS_APP_DIR="${IOS_APP_DIR:-ios/App}"
APP_STORE_APPLE_ID="${APP_STORE_APPLE_ID:-}"
PBXPROJ="App.xcodeproj/project.pbxproj"

cd "$CM_BUILD_DIR/$IOS_APP_DIR"

read_pbxproj_value() {
  local key="$1"
  grep -m1 "${key} = " "$PBXPROJ" | sed -E "s/.*${key} = ([^;]+);/\\1/" | tr -d ' "'\''\r'
}

set_pbxproj_versions() {
  local marketing="$1"
  local build="$2"
  sed -i '' -E "s/MARKETING_VERSION = [^;]+;/MARKETING_VERSION = ${marketing};/g" "$PBXPROJ"
  sed -i '' -E "s/CURRENT_PROJECT_VERSION = [^;]+;/CURRENT_PROJECT_VERSION = ${build};/g" "$PBXPROJ"
}

# ---------- semver：取较大者，patch +1 ----------
bump_patch() {
  node -e '
const input = process.argv[1];
const parts = String(input).trim().split(".").map((s) => parseInt(s, 10) || 0);
while (parts.length < 3) parts.push(0);
parts[2] += 1;
console.log(parts.slice(0, 3).join("."));
' "$1"
}

max_semver() {
  node -e '
const a = process.argv[1];
const b = process.argv[2];
const parse = (s) => String(s).trim().split(".").map((x) => parseInt(x, 10) || 0);
const pa = parse(a);
const pb = parse(b);
while (pa.length < 3) pa.push(0);
while (pb.length < 3) pb.push(0);
const cmp = (x, y) => {
  for (let i = 0; i < 3; i++) {
    if (x[i] !== y[i]) return x[i] - y[i];
  }
  return 0;
};
process.stdout.write(cmp(pa, pb) >= 0 ? pa.join(".") : pb.join("."));
' "$1" "$2"
}

LOCAL_VERSION="$(read_pbxproj_value MARKETING_VERSION)"
if [ -z "$LOCAL_VERSION" ] || [[ "$LOCAL_VERSION" == *'$('* ]]; then
  LOCAL_VERSION="1.0.0"
fi
ASC_VERSION=""

if [ -n "$APP_STORE_APPLE_ID" ] && [ "$APP_STORE_APPLE_ID" != "0000000000" ]; then
  JSON_OUT="$(app-store-connect get-latest-app-store-build-number "$APP_STORE_APPLE_ID" \
    --include-version --json -s 2>/dev/null || true)"
  if [ -n "$JSON_OUT" ]; then
    ASC_VERSION="$(node -e '
const raw = process.argv[1];
try {
  const j = JSON.parse(raw);
  const v =
    j.version ??
    j.version_string ??
    j.app_store_version ??
    j.attributes?.versionString ??
    "";
  if (v) process.stdout.write(String(v).trim());
} catch {
  /* ignore */
}
' "$JSON_OUT")"
  fi
fi

BASE_VERSION="$LOCAL_VERSION"
if [ -n "$ASC_VERSION" ]; then
  BASE_VERSION="$(max_semver "$LOCAL_VERSION" "$ASC_VERSION")"
  echo "[ios-version] App Store latest marketing version: $ASC_VERSION"
fi

NEW_MARKETING="$(bump_patch "$BASE_VERSION")"
echo "[ios-version] Local marketing version: $LOCAL_VERSION → $NEW_MARKETING"

# Build 号：取 TestFlight / App Store / 全局最高值 +1，避免仅查 app-store 版本时漏掉已上传的 TestFlight build（如 duplicate build 5）
max_int() {
  node -e '
const nums = process.argv.slice(1).map((s) => parseInt(String(s), 10)).filter((n) => Number.isFinite(n));
process.stdout.write(String(nums.length ? Math.max(...nums) : 0));
' "$@"
}

bump_latest_build() {
  local label="$1"
  shift
  local out
  out="$("$@" -s 2>/dev/null || true)"
  if [[ "$out" =~ ^[0-9]+$ ]]; then
    echo "[ios-version] Latest build from $label: $out"
    LATEST_BUILD="$(max_int "$LATEST_BUILD" "$out")"
  fi
}

LATEST_BUILD=0
if [ -n "$APP_STORE_APPLE_ID" ] && [ "$APP_STORE_APPLE_ID" != "0000000000" ]; then
  bump_latest_build "TestFlight($NEW_MARKETING)" \
    app-store-connect get-latest-testflight-build-number "$APP_STORE_APPLE_ID" \
    --pre-release-version "$NEW_MARKETING" --platform IOS
  bump_latest_build "TestFlight(global)" \
    app-store-connect get-latest-testflight-build-number "$APP_STORE_APPLE_ID" --platform IOS
  bump_latest_build "AppStore($NEW_MARKETING)" \
    app-store-connect get-latest-app-store-build-number "$APP_STORE_APPLE_ID" \
    --version-string "$NEW_MARKETING"
  bump_latest_build "AppStore(global)" \
    app-store-connect get-latest-app-store-build-number "$APP_STORE_APPLE_ID"
  bump_latest_build "Build(global)" \
    app-store-connect get-latest-build-number "$APP_STORE_APPLE_ID" --platform IOS
fi

CURRENT="$(read_pbxproj_value CURRENT_PROJECT_VERSION)"
if ! [[ "$CURRENT" =~ ^[0-9]+$ ]]; then
  CURRENT=0
fi
LATEST_BUILD="$(max_int "$LATEST_BUILD" "$CURRENT")"

if [ -n "${BUILD_NUMBER:-}" ] && [[ "${BUILD_NUMBER}" =~ ^[0-9]+$ ]]; then
  if [ "$BUILD_NUMBER" -gt "$LATEST_BUILD" ]; then
    LATEST_BUILD="$BUILD_NUMBER"
  fi
fi

NEXT_BUILD=$((LATEST_BUILD + 1))

echo "[ios-version] Build number → $NEXT_BUILD (marketing $NEW_MARKETING, latest seen $LATEST_BUILD)"
set_pbxproj_versions "$NEW_MARKETING" "$NEXT_BUILD"
