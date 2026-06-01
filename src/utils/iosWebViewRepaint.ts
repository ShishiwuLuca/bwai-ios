import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { App } from '@capacitor/app';

const IOS_REPAINT_BG_FALLBACK = '#090d20';

let inited = false;
let appStateHandle: PluginListenerHandle | null = null;

const ensureRootVisible = (): void => {
  if (typeof document === 'undefined') return;
  const html = document.documentElement;
  const body = document.body;
  const app = document.getElementById('app');

  // iOS 某些机型/系统在回前台后会出现 WebView 内容层不重绘，显得整页“透明”。
  // 这里主动恢复关键容器可见属性，避免残留到下一次冷启动。
  [html, body, app].forEach((el) => {
    if (!el) return;
    el.style.opacity = '1';
    el.style.visibility = 'visible';
  });

  // 给背景色兜底，避免 CSS 变量未及时生效时出现透明底。
  html.style.backgroundColor = `var(--van-background, ${IOS_REPAINT_BG_FALLBACK})`;
  body.style.backgroundColor = `var(--van-background, ${IOS_REPAINT_BG_FALLBACK})`;
  if (app) {
    app.style.backgroundColor = `var(--van-background, ${IOS_REPAINT_BG_FALLBACK})`;
  }
};

const forceRepaint = (): void => {
  if (typeof document === 'undefined') return;
  const app = document.getElementById('app');
  if (!app) return;

  app.style.willChange = 'transform, opacity';
  app.style.transform = 'translate3d(0, 0, 0)';
  app.style.opacity = '0.9999';

  requestAnimationFrame(() => {
    app.style.opacity = '1';
    app.style.transform = '';
    app.style.willChange = '';
    // 某些 WebView 需要 resize 才会真正触发重排重绘。
    window.dispatchEvent(new Event('resize'));
  });
};

const recoverIOSWebViewOnForeground = (): void => {
  ensureRootVisible();
  forceRepaint();
  // 分帧再补一次，覆盖慢设备/低电量模式下的延迟恢复。
  setTimeout(() => {
    ensureRootVisible();
    forceRepaint();
  }, 160);
};

export const initIOSWebViewRepaint = (): void => {
  if (inited) return;
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') return;
  inited = true;

  void App.addListener('appStateChange', ({ isActive }) => {
    if (!isActive) return;
    recoverIOSWebViewOnForeground();
  }).then((handle) => {
    appStateHandle = handle;
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    recoverIOSWebViewOnForeground();
  });

  window.addEventListener('pageshow', () => {
    recoverIOSWebViewOnForeground();
  });

  // 首次启动先执行一次，清掉可能遗留的透明状态。
  recoverIOSWebViewOnForeground();
};

export const disposeIOSWebViewRepaint = async (): Promise<void> => {
  if (!inited) return;
  inited = false;
  try {
    await appStateHandle?.remove();
  } catch {
    // ignore
  }
  appStateHandle = null;
};
