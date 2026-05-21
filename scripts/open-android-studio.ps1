# 同步最新 Web 资源并打开 Android Studio（打开 android 子工程，勿打开仓库根目录）
$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$AndroidDir = Join-Path $Root "android"

$StudioCandidates = @(
  "E:\developers\bin\studio64.exe",
  "$env:ProgramFiles\Android\Android Studio\bin\studio64.exe",
  "${env:ProgramFiles(x86)}\Android\Android Studio\bin\studio64.exe",
  "$env:LOCALAPPDATA\Programs\Android\Android Studio\bin\studio64.exe"
)

Write-Host ">>> 构建 Web (app 模式) ..." -ForegroundColor Cyan
Push-Location $Root
try {
  corepack pnpm run build-only:app
  Write-Host ">>> Capacitor sync android ..." -ForegroundColor Cyan
  npx cap sync android
} finally {
  Pop-Location
}

$studio = $StudioCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $studio) {
  Write-Host "未找到 studio64.exe，请手动：Android Studio -> Open -> 选择文件夹:`n  $AndroidDir" -ForegroundColor Yellow
  exit 1
}

Write-Host ">>> 启动 Android Studio: $studio" -ForegroundColor Cyan
Write-Host "    工程目录: $AndroidDir" -ForegroundColor Gray
Start-Process -FilePath $studio -ArgumentList $AndroidDir

Write-Host @"

已在 Android Studio 中打开原生工程。首次请等待 Gradle Sync 完成。

运行调试：
  1. 顶部设备下拉框：选模拟器或 USB 真机
  2. 运行配置选 app
  3. 点击 Run (Debug) 绿色三角

Web Console 调试（应用跑起来后）：
  Chrome 打开 chrome://inspect -> inspect WebView

修改 Vue 代码后需重新执行本脚本或：
  corepack pnpm run build-only:app && npx cap sync android

"@ -ForegroundColor Green
