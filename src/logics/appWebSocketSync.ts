/**
 * 统一行情 / 会员 WebSocket 建连（App.vue 与原生前后台恢复共用）
 */
import { Capacitor } from '@capacitor/core';
import { useUserStoreWithOut } from '/@/stores/modules/UserConfig';
import { useWebSocketStoreWithOut } from '/@/stores/modules/WebSocket';
import { hasDeviceClientReportFieldsCache } from '/@/utils/deviceClientReportFields';
import {
  buildWebSocketConnectUrl,
  DEFAULT_WEBSOCKET_CLIENT_OPTIONS,
  WS_CHANNEL_MEMBER,
  WS_PATH_INFRA_MARKET_SPOT,
  WS_PATH_USER_WS
} from '/@/utils/websocketUrl';

/** 同步行情 + 会员两条 WebSocket（地址未变且已连接则跳过） */
export const syncAppWebSockets = (): void => {
  if (!hasDeviceClientReportFieldsCache()) return;

  const UserStore = useUserStoreWithOut();
  const WebSocketStore = useWebSocketStoreWithOut();
  const token = UserStore.Token;

  const marketUrl = buildWebSocketConnectUrl(WS_PATH_INFRA_MARKET_SPOT, token);
  if (
    WebSocketStore.currentUrl !== marketUrl ||
    !WebSocketStore.isConnected
  ) {
    WebSocketStore.connect(marketUrl, DEFAULT_WEBSOCKET_CLIENT_OPTIONS);
  }

  const memberUrl = buildWebSocketConnectUrl(WS_PATH_USER_WS, token);
  const memberState = WebSocketStore.getChannelState(WS_CHANNEL_MEMBER);
  if (memberState?.url !== memberUrl || !memberState?.connected) {
    WebSocketStore.connectChannel(
      WS_CHANNEL_MEMBER,
      memberUrl,
      DEFAULT_WEBSOCKET_CLIENT_OPTIONS
    );
  }
};

/** 原生进后台：Android 断开 WS；iOS 由系统挂起连接，避免回前台 disconnect 风暴加重白屏 */
export const pauseAppWebSocketsOnNativeBackground = (): void => {
  if (!Capacitor.isNativePlatform()) return;
  if (Capacitor.getPlatform() === 'ios') return;
  useWebSocketStoreWithOut().disconnect();
};

/** 原生回前台：重新建连 */
export const resumeAppWebSocketsOnNativeForeground = (): void => {
  if (!Capacitor.isNativePlatform()) return;
  syncAppWebSockets();
};
