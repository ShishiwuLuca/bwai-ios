# BWAI：启动 Android 模拟器 → 安装 Debug APK → 提示 Chrome 远程调试
# 用法（PowerShell 管理员仅首次启用虚拟化时需要）:
#   .\scripts\android-emulator-debug.ps1

$ErrorActionPreference = "Stop"
$SdkRoot = "$env:LOCALAPPDATA\Android\Sdk"
$Adb = Join-Path $SdkRoot "platform-tools\adb.exe"
$Emulator = Join-Path $SdkRoot "emulator\emulator.exe"
$AvdName = "fundex_api34"
$Apk = Join-Path $PSScriptRoot "..\PackageAndroid\BWAI-V1.0.1-debug.apk"
if (-not (Test-Path $Apk)) {
  $Apk = Join-Path $PSScriptRoot "..\android\app\build\outputs\apk\debug\app-debug.apk"
}

foreach ($p in @($Adb, $Emulator)) {
  if (-not (Test-Path $p)) {
    Write-Host "缺少: $p`n请先安装 Android SDK / Emulator（见 README 或联系开发）" -ForegroundColor Red
    exit 1
  }
}

Write-Host ">>> 启动模拟器 AVD: $AvdName ..." -ForegroundColor Cyan
Start-Process -FilePath $Emulator -ArgumentList "-avd", $AvdName

Write-Host ">>> 等待模拟器开机（约 1～3 分钟）..." -ForegroundColor Cyan
$deadline = (Get-Date).AddMinutes(6)
$ready = $false
while ((Get-Date) -lt $deadline) {
  $devices = & $Adb devices 2>&1 | Out-String
  if ($devices -match "emulator-\d+\s+device") {
    $boot = (& $Adb shell getprop sys.boot_completed 2>&1) -join ""
    if ($boot.Trim() -eq "1") { $ready = $true; break }
  }
  Start-Sleep -Seconds 5
}

if (-not $ready) {
  Write-Host @"

模拟器未就绪。常见原因：
  1. 未开启 CPU 虚拟化（BIOS 里 Intel VT-x / AMD-V）
  2. 未启用 Windows 功能：「虚拟机平台」「Windows 超管理器平台」
  3. 未安装模拟器加速驱动（以管理员运行）：
     $SdkRoot\extras\google\Android_Emulator_Hypervisor_Driver\silent_install_safe.bat
  完成后重启电脑，再运行本脚本。

"@ -ForegroundColor Yellow
  exit 1
}

Write-Host ">>> 安装 APK: $Apk" -ForegroundColor Cyan
& $Adb install -r $Apk

Write-Host @"

完成。下一步调试前端 Console：
  1. 在模拟器里打开 BWAI 应用
  2. 电脑 Chrome 打开: chrome://inspect/#devices
  3. 找到 com.bwai.io WebView，点击 inspect

查看原生日志（另开终端）:
  & `"$Adb`" logcat | Select-String -Pattern 'chromium|Capacitor|Console'

"@ -ForegroundColor Green
