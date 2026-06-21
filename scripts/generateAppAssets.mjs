import sharp from 'sharp';
import { mkdir, copyFile } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const iconSourcePath = resolve(root, 'resources/icon-source.png');
const iconPath = resolve(root, 'resources/icon.png');
const androidRes = resolve(root, 'android/app/src/main/res');
const iosAppIconDir = resolve(root, 'ios/App/App/Assets.xcassets/AppIcon.appiconset');
const iosSplashDir = resolve(root, 'ios/App/App/Assets.xcassets/Splash.imageset');

const MASTER_ICON_SIZE = 1024;
/** 普通 launcher 图标：图形约占 72%，四周留白 */
const ICON_GRAPHIC_RATIO = 0.72;
/** Android 自适应前景：安全区约 66% */
const ADAPTIVE_FOREGROUND_RATIO = 0.66;
const SPLASH_SIZE = 2732;
const ICON_ON_SPLASH_RATIO = 0.38;

const launcherSizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192
};

const foregroundSizes = {
  'mipmap-mdpi': 108,
  'mipmap-hdpi': 162,
  'mipmap-xhdpi': 216,
  'mipmap-xxhdpi': 324,
  'mipmap-xxxhdpi': 432
};

const splashTargets = [
  { dir: 'drawable', width: 480, height: 320 },
  { dir: 'drawable-port-mdpi', width: 320, height: 480 },
  { dir: 'drawable-port-hdpi', width: 480, height: 800 },
  { dir: 'drawable-port-xhdpi', width: 720, height: 1280 },
  { dir: 'drawable-port-xxhdpi', width: 960, height: 1600 },
  { dir: 'drawable-port-xxxhdpi', width: 1280, height: 1920 },
  { dir: 'drawable-land-mdpi', width: 480, height: 320 },
  { dir: 'drawable-land-hdpi', width: 800, height: 480 },
  { dir: 'drawable-land-xhdpi', width: 1280, height: 720 },
  { dir: 'drawable-land-xxhdpi', width: 1600, height: 960 },
  { dir: 'drawable-land-xxxhdpi', width: 1920, height: 1280 }
];

/** 将源图居中缩放到指定比例，四周补白 */
const renderPaddedIcon = async (size, graphicRatio, source = iconSourcePath) => {
  const graphicSize = Math.max(1, Math.round(size * graphicRatio));
  const iconBuffer = await sharp(source)
    .resize(graphicSize, graphicSize, { fit: 'contain', background: '#ffffff' })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 3,
      background: '#ffffff'
    }
  })
    .composite([{ input: iconBuffer, gravity: 'center' }])
    .png();
};

const savePaddedIcon = async (size, graphicRatio, outPath, source = iconSourcePath) => {
  await (await renderPaddedIcon(size, graphicRatio, source)).toFile(outPath);
};

const makeSplash = async (width, height, outPath) => {
  const iconSize = Math.round(Math.min(width, height) * ICON_ON_SPLASH_RATIO);
  const iconBuffer = await (await renderPaddedIcon(iconSize, ICON_GRAPHIC_RATIO)).toBuffer();
  await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: '#ffffff'
    }
  })
    .composite([{ input: iconBuffer, gravity: 'center' }])
    .png()
    .toFile(outPath);
};

const writeLauncherSet = async (folder, launcherSize, foregroundSize) => {
  const dir = join(androidRes, folder);
  await mkdir(dir, { recursive: true });
  await savePaddedIcon(launcherSize, ICON_GRAPHIC_RATIO, join(dir, 'ic_launcher.png'));
  await savePaddedIcon(launcherSize, ICON_GRAPHIC_RATIO, join(dir, 'ic_launcher_round.png'));
  await savePaddedIcon(foregroundSize, ADAPTIVE_FOREGROUND_RATIO, join(dir, 'ic_launcher_foreground.png'));
};

await mkdir(resolve(root, 'resources'), { recursive: true });

await savePaddedIcon(MASTER_ICON_SIZE, ICON_GRAPHIC_RATIO, iconPath);
console.log('[generateAppAssets] resources/icon.png (padded master)');

const splashMaster = resolve(root, 'resources/splash.png');
await makeSplash(SPLASH_SIZE, SPLASH_SIZE, splashMaster);
console.log('[generateAppAssets] resources/splash.png');

for (const [folder, size] of Object.entries(launcherSizes)) {
  await writeLauncherSet(folder, size, foregroundSizes[folder]);
  console.log(`[generateAppAssets] ${folder}`);
}

for (const { dir, width, height } of splashTargets) {
  const outDir = join(androidRes, dir);
  await mkdir(outDir, { recursive: true });
  await makeSplash(width, height, join(outDir, 'splash.png'));
  console.log(`[generateAppAssets] ${dir} ${width}x${height}`);
}

await mkdir(iosAppIconDir, { recursive: true });
await copyFile(iconPath, join(iosAppIconDir, 'AppIcon-512@2x.png'));
console.log('[generateAppAssets] iOS AppIcon');

await mkdir(iosSplashDir, { recursive: true });
for (const name of ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png']) {
  await copyFile(splashMaster, join(iosSplashDir, name));
}
console.log('[generateAppAssets] iOS Splash');

console.log('[generateAppAssets] done');
