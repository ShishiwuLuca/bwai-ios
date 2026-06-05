import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { notifyAppReady } from '/@/utils/appUpdate';
import {
  markNativeIosEnteredBackground,
  recoverNativeIosFromBackground
} from '/@/logics/nativeIosForegroundRecovery';
import {
  pauseAppWebSocketsOnNativeBackground,
  resumeAppWebSocketsOnNativeForeground
} from '/@/logics/appWebSocketSync';
import { useSystemStoreWithOut } from '/@/stores/modules/SystemConfig';

let resumeListenersInited = false;

/** 前后台恢复（禁止 location.replace；iOS 回前台走 nativeIosForegroundRecovery） */
export const initNativeResumeRecovery = (): void => {
  if (!Capacitor.isNativePlatform() || resumeListenersInited) return;
  resumeListenersInited = true;

  void App.addListener('appStateChange', ({ isActive }) => {
    if (!isActive) {
      markNativeIosEnteredBackground();
      pauseAppWebSocketsOnNativeBackground();
      return;
    }

    useSystemStoreWithOut().setLoading(false);

    if (Capacitor.getPlatform() === 'ios') {
      recoverNativeIosFromBackground();
    }

    void notifyAppReady();

    setTimeout(() => resumeAppWebSocketsOnNativeForeground(), Capacitor.getPlatform() === 'ios' ? 400 : 0);
  });
};
