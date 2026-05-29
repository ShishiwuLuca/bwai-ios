# Apply BGAI icon + splash to native/web asset paths (run from repo root)
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

Add-Type -AssemblyName System.Drawing

function Save-PngResize {
    param(
        [string]$Src,
        [string]$Dest,
        [int]$Width,
        [int]$Height
    )
    $dir = Split-Path $Dest -Parent
    if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    $img = [System.Drawing.Image]::FromFile((Resolve-Path $Src))
    $bmp = New-Object System.Drawing.Bitmap $Width, $Height
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::White)
    $g.DrawImage($img, 0, 0, $Width, $Height)
    $bmp.Save($Dest, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $bmp.Dispose(); $img.Dispose()
}

function Copy-File {
    param([string]$Src, [string]$Dest)
    $dir = Split-Path $Dest -Parent
    if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    Copy-Item -Path $Src -Destination $Dest -Force
}

$iconSrc = Join-Path $root 'public\bgai.png'
$splashSrc = Join-Path $root 'public\splash-2732x2732.png'

# --- iOS ---
Copy-File $iconSrc (Join-Path $root 'ios\App\App\Assets.xcassets\AppIcon.appiconset\AppIcon-512@2x.png')
$splashIos = Join-Path $root 'ios\App\App\Assets.xcassets\Splash.imageset'
Copy-File $splashSrc (Join-Path $splashIos 'splash-2732x2732.png')
Copy-File $splashSrc (Join-Path $splashIos 'splash-2732x2732-1.png')
Copy-File $splashSrc (Join-Path $splashIos 'splash-2732x2732-2.png')

# --- Android launcher ---
$mipmapSizes = @{
    'mipmap-mdpi'    = 48
    'mipmap-hdpi'    = 72
    'mipmap-xhdpi'   = 96
    'mipmap-xxhdpi'  = 144
    'mipmap-xxxhdpi' = 192
}
foreach ($folder in $mipmapSizes.Keys) {
    $size = $mipmapSizes[$folder]
    $base = Join-Path $root "android\app\src\main\res\$folder"
    Save-PngResize $iconSrc (Join-Path $base 'ic_launcher.png') $size $size
    Save-PngResize $iconSrc (Join-Path $base 'ic_launcher_foreground.png') $size $size
    Save-PngResize $iconSrc (Join-Path $base 'ic_launcher_round.png') $size $size
}

# --- Android splash (copy master; OS scales) ---
$splashDirs = @(
    'drawable',
    'drawable-port-mdpi', 'drawable-port-hdpi', 'drawable-port-xhdpi',
    'drawable-port-xxhdpi', 'drawable-port-xxxhdpi',
    'drawable-land-mdpi', 'drawable-land-hdpi', 'drawable-land-xhdpi',
    'drawable-land-xxhdpi', 'drawable-land-xxxhdpi'
)
foreach ($d in $splashDirs) {
    Copy-File $splashSrc (Join-Path $root "android\app\src\main\res\$d\splash.png")
}

# --- Web / PWA ---
$iconsDir = Join-Path $root 'public\icons'
New-Item -ItemType Directory -Path $iconsDir -Force | Out-Null
Save-PngResize $iconSrc (Join-Path $iconsDir 'Icon-180.png') 180 180
Save-PngResize $iconSrc (Join-Path $iconsDir 'Icon-192.png') 192 192
Save-PngResize $iconSrc (Join-Path $iconsDir 'Icon-512.png') 512 512
Save-PngResize $iconSrc (Join-Path $iconsDir 'Icon-maskable-192.png') 192 192
Save-PngResize $iconSrc (Join-Path $iconsDir 'Icon-maskable-512.png') 512 512
Save-PngResize $iconSrc (Join-Path $root 'public\favicon.ico') 32 32

Write-Host 'Branding assets applied.'
