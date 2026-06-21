#!/usr/bin/env bash
# Codemagic：设置 iOS 营销版本与 Build 号（逻辑见 codemagic-set-ios-versions.mjs）
set -euo pipefail
exec node "$CM_BUILD_DIR/scripts/codemagic-set-ios-versions.mjs"
