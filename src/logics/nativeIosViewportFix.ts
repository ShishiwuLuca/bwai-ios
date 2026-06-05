import { Capacitor } from '@capacitor/core';

const APP_HEIGHT_VAR = '--app-height';

/** 用 innerHeight 固定可视高度（iOS 26 上 100dvh / env 常算出 0，DOM 有、画面无） */
export const applyNativeIosViewportHeight = (): void => {
  if (Capacitor.getPlatform() !== 'ios' || typeof document === 'undefined') return;

  const root = document.documentElement;
  root.classList.add('cap-native');

  const apply = (): void => {
    const h = Math.max(window.innerHeight, 1);
    const px = `${h}px`;
    root.style.setProperty(APP_HEIGHT_VAR, px);
    root.style.height = px;
    document.body.style.height = px;
    const app = document.getElementById('app');
    if (app) app.style.height = px;
    const provider = document.querySelector('.van-config-provider') as HTMLElement | null;
    if (provider) provider.style.minHeight = px;
  };

  apply();
  window.addEventListener('resize', apply, { passive: true });
  window.addEventListener('orientationchange', apply, { passive: true });
  requestAnimationFrame(apply);
  setTimeout(apply, 0);
  setTimeout(apply, 100);
  setTimeout(apply, 400);
};
