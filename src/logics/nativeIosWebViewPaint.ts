import { Capacitor } from '@capacitor/core';

/** 轻量触发重排；strong=true 时闪断 body 以迫使合成层刷新 */
export const forceIosWebViewContentPaint = (strong = false): void => {
  if (Capacitor.getPlatform() !== 'ios' || typeof document === 'undefined') return;

  if (strong && document.body) {
    const prev = document.body.style.display;
    document.body.style.display = 'none';
    void document.body.offsetHeight;
    document.body.style.display = prev || '';
  }

  void document.documentElement.offsetHeight;
  const y = window.scrollY;
  window.scrollTo(0, y + 1);
  window.scrollTo(0, y);
};
