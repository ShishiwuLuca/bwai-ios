#!/usr/bin/env bash
# Codemagic：读取 App Store Connect 最高营销版本，patch +0.0.1，并递增 Build 号。
# 依赖：ios/App 已 cap sync；环境变量 APP_STORE_APPLE_ID（可选）、BUILD_NUMBER（兜底）。
set -euo pipefail

IOS_APP_DIR="${IOS_APP_DIR:-ios/App}"
APP_STORE_APPLE_ID="${APP_STORE_APPLE_ID:-}"

cd "$CM_BUILD_DIR/$IOS_APP_DIR"

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

LOCAL_VERSION="$(agvtool what-marketing-version -terse1 2>/dev/null | tr -d '\r' || echo "1.0.0")"
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
agvtool new-marketing-version -all "$NEW_MARKETING" >/dev/null

# ---------- Build 号：在 NEW_MARKETING 下取该版本最新 build +1 ----------
NEXT_BUILD=""
if [ -n "$APP_STORE_APPLE_ID" ] && [ "$APP_STORE_APPLE_ID" != "0000000000" ]; then
  LATEST_BUILD="$(app-store-connect get-latest-app-store-build-number "$APP_STORE_APPLE_ID" \
    --version-string "$NEW_MARKETING" -s 2>/dev/null || echo "")"
  if [ -n "$LATEST_BUILD" ] && [[ "$LATEST_BUILD" =~ ^[0-9]+$ ]]; then
    NEXT_BUILD=$((LATEST_BUILD + 1))
  fi
fi

if [ -z "$NEXT_BUILD" ]; then
  if [ -n "$APP_STORE_APPLE_ID" ] && [ "$APP_STORE_APPLE_ID" != "0000000000" ]; then
    GLOBAL_BUILD="$(app-store-connect get-latest-app-store-build-number "$APP_STORE_APPLE_ID" -s 2>/dev/null || echo "")"
    if [ -n "$GLOBAL_BUILD" ] && [[ "$GLOBAL_BUILD" =~ ^[0-9]+$ ]]; then
      NEXT_BUILD=$((GLOBAL_BUILD + 1))
    fi
  fi
  if [ -z "$NEXT_BUILD" ]; then
    if [ -n "${BUILD_NUMBER:-}" ]; then
      NEXT_BUILD="$BUILD_NUMBER"
    else
      CURRENT="$(agvtool what-version -terse 2>/dev/null | tr -d '\r' || echo "0")"
      NEXT_BUILD=$((CURRENT + 1))
    fi
  fi
fi

echo "[ios-version] Build number → $NEXT_BUILD (marketing $NEW_MARKETING)"
agvtool new-version -all "$NEXT_BUILD" >/dev/null
