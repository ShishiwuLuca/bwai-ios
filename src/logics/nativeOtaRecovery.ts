import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { notifyAppReady } from '/@/utils/appUpdate';
import {
  markNativeIosEnteredBackground,
  recoverNativeIosFromBackground
} from '/@/logics/nativeIosForegroundRecovery';
import { useSystemStoreWithOut } from '/@/stores/modules/SystemConfig';

let resumeListenersInited = false;

/** 前后台恢复（禁止 location.replace；iOS 回前台走 nativeIosForegroundRecovery） */
export const initNativeResumeRecovery = (): void => {
  if (!Capacitor.isNativePlatform() || resumeListenersInited) return;
  resumeListenersInited = true;

  void App.addListener('appStateChange', ({ isActive }) => {
    if (!isActive) {
      markNativeIosEnteredBackground();
      return;
    }

    useSystemStoreWithOut().setLoading(false);

    if (Capacitor.getPlatform() === 'ios') {
      recoverNativeIosFromBackground();
    }

    void notifyAppReady();
  });
};
