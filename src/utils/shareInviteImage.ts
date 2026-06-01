import { Capacitor } from '@capacitor/core';
import { FileOpener } from '@capacitor-community/file-opener';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

/** isCapacitorNative */
export const isCapacitorNative = (): boolean => {
  return Capacitor.isNativePlatform();
};

/** 拉取接口数据：downloadCanvasPngWeb */
export const downloadCanvasPngWeb = (
  canvas: HTMLCanvasElement,
  filename: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('toBlob failed'));
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      resolve();
    }, 'image/png');
  });
};

/** 用户：isUserCanceledShare */
const isUserCanceledShare = (err: unknown): boolean => {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return (
    msg.includes('cancel') ||
    msg.includes('canceled') ||
    msg.includes('cancelled') ||
    msg.includes('dismiss') ||
    msg.includes('user did not share')
  );
};

/** 方法：shareCanvasPngNative */
export const shareCanvasPngNative = async (
  canvas: HTMLCanvasElement,
  options: {
    fileName: string;
    title?: string;
    dialogTitle?: string;
  }
): Promise<void> => {
  const dataUrl = canvas.toDataURL('image/png', 1);
  const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1]! : dataUrl;
  const path = options.fileName.replace(/^\/+/, '');
  await Filesystem.writeFile({
    path,
    data: base64,
    directory: Directory.Cache
  });
  const { uri } = await Filesystem.getUri({
    directory: Directory.Cache,
    path
  });
  try {
    await Share.share({
      title: options.title,
      files: [uri],
      dialogTitle: options.dialogTitle ?? options.title
    });
  } catch (e: unknown) {
    if (isUserCanceledShare(e)) {
      return;
    }
    await FileOpener.open({
      filePath: uri,
      contentType: 'image/png',
      openWithDefault: true
    });
  }
};
