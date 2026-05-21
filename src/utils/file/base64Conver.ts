/** dataURLtoBlob */
export const dataURLtoBlob = (base64Buf: string): Blob => {
  const arr = base64Buf.split(',');
  const typeItem = arr[0];
  const arr1 = arr[1];
  if (!typeItem || arr1 === undefined) throw new Error('Invalid base64 data URL');
  const mimeMatch = typeItem.match(/:(.*?);/);
  const mime = mimeMatch?.[1];
  if (!mime) throw new Error('Invalid base64 mime');
  const bstr = window.atob(arr1);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

/** urlToBase64 */
export const urlToBase64 = (url: string, mineType?: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    let canvas = document.createElement('CANVAS') as Nullable<HTMLCanvasElement>;
    const ctx = canvas!.getContext('2d');
    const img = new Image();
    img.crossOrigin = '';
    img.onload = function () {
      if (!canvas || !ctx) {
        return reject();
      }
      canvas.height = img.height;
      canvas.width = img.width;
      ctx.drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL(mineType || 'image/png');
      canvas = null;
      resolve(dataURL);
    };
    img.src = url;
  });
};
