import { store } from '/@/stores';
import { defineStore } from 'pinia';
import { WebSocketClient, type WebSocketOptions } from '/@/utils/websocket';

/** StoreKeyName */
const StoreKeyName = 'WebSocket';

/** 默认通道名：与历史 `connect` / `disconnect` / `send` 行为一致 */
export const DEFAULT_WEBSOCKET_CHANNEL = 'default';

/** 单通道展示结构 */
export interface WebSocketChannelState {
  url: string | null;
  connected: boolean;
  lastMessage: string | ArrayBuffer | null;
  error: string | null;
}

/** 单条消息记录（用于历史列表） */
export interface WebSocketMessageRecord {
  data: string | ArrayBuffer;
  time: number;
  direction: 'send' | 'receive';
  /** 所属通道，缺省为 default */
  channel?: string;
}

/** emptyChannel */
const emptyChannel = (): WebSocketChannelState => {
  return {
    url: null,
    connected: false,
    lastMessage: null,
    error: null
  };
};

/** WebSocketState：接口数据结构定义 */
interface WebSocketState {
  /** 多路连接状态，key 为通道名（如 default、market、user） */
  channels: Record<string, WebSocketChannelState>;
  /** 消息历史（可选，用于调试或展示） */
  messageList: WebSocketMessageRecord[];
  /** 最大保留条数，0 表示不限制 */
  messageListLimit: number;
}

/** 各通道 WebSocket 客户端（不放入 state） */
const wsClients = new Map<string, WebSocketClient>();

/** ensureChannelState */
const ensureChannelState = (
  channels: Record<string, WebSocketChannelState>,
  key: string
): WebSocketChannelState => {
  if (!channels[key]) {
    channels[key] = emptyChannel();
  }
  return channels[key];
};

/** useWebSocketStore */
export const useWebSocketStore = defineStore(StoreKeyName, {
  state: (): WebSocketState => ({
    channels: {
      [DEFAULT_WEBSOCKET_CHANNEL]: emptyChannel()
    },
    messageList: [],
    messageListLimit: 100
  }),
  getters: {
    /** 默认通道是否已连接（兼容旧代码） */
    isConnected(state): boolean {
      return state.channels[DEFAULT_WEBSOCKET_CHANNEL]?.connected ?? false;
    },
    /** 默认通道当前地址 */
    currentUrl(state): string | null {
      return state.channels[DEFAULT_WEBSOCKET_CHANNEL]?.url ?? null;
    },
    /** 默认通道最后一条下行消息 */
    lastMessage(state): string | ArrayBuffer | null {
      return state.channels[DEFAULT_WEBSOCKET_CHANNEL]?.lastMessage ?? null;
    },
    /** 消息历史（只读） */
    getMessageList(state): WebSocketMessageRecord[] {
      return state.messageList;
    },
    /** 指定通道状态 */
    getChannelState:
      (state) =>
      (key: string): WebSocketChannelState | undefined => {
        return state.channels[key];
      }
  },
  actions: {
    /**
     * 建立连接（仅默认通道 `default`）
     * 会先断开默认通道已有连接，不影响其它命名通道。
     */
    connect(url: string, options?: WebSocketOptions): void {
      this.connectChannel(DEFAULT_WEBSOCKET_CHANNEL, url, options);
    },
    /**
     * 按通道名建立第二条（或多条）不同地址的连接。
     * 仅会断开并替换同名通道，其它通道互不影响。
     * @param channel 通道标识，如 `'market'`、`'user'`
     */
    connectChannel(channel: string, url: string, options?: WebSocketOptions): void {
      this.disconnectChannel(channel);
      const ch = ensureChannelState(this.channels, channel);
      ch.url = url;
      ch.error = null;
      ch.connected = false;
      const client = new WebSocketClient(url, options);
      wsClients.set(channel, client);
      client.onOpen(() => {
        const c = ensureChannelState(this.channels, channel);
        c.connected = true;
        c.error = null;
      });
      client.onMessage((data: string | ArrayBuffer) => {
        const c = ensureChannelState(this.channels, channel);
        c.lastMessage = data;
        this.pushMessage(data, 'receive', channel);
      });
      client.onError(() => {
        const c = ensureChannelState(this.channels, channel);
        c.error = 'WebSocket 错误';
      });
      client.onClose(() => {
        const c = ensureChannelState(this.channels, channel);
        c.connected = false;
      });
      client.connect();
    },
    /** 断开所有通道 */
    disconnect(): void {
      for (const key of Array.from(wsClients.keys())) {
        const c = wsClients.get(key);
        if (c) {
          c.disconnect();
          wsClients.delete(key);
        }
      }
      this.channels = {
        [DEFAULT_WEBSOCKET_CHANNEL]: emptyChannel()
      };
      this.messageList = [];
    },
    /** 仅断开指定通道 */
    disconnectChannel(channel: string): void {
      const c = wsClients.get(channel);
      if (c) {
        c.disconnect();
        wsClients.delete(channel);
      }
      if (this.channels[channel]) {
        this.channels[channel] = emptyChannel();
      }
    },
    /**
     * 向默认通道发送
     */
    send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
      this.sendChannel(DEFAULT_WEBSOCKET_CHANNEL, data);
    },
    /**
     * 向指定通道发送
     */
    sendChannel(channel: string, data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
      const client = wsClients.get(channel);
      if (client?.isConnected) {
        client.send(data as string | ArrayBuffer);
        const str = typeof data === 'string' ? data : '[Binary]';
        this.pushMessage(str, 'send', channel);
      }
    },
    /** 发送 JSON（默认通道） */
    sendJSON(obj: object): void {
      this.sendChannel(DEFAULT_WEBSOCKET_CHANNEL, JSON.stringify(obj));
    },
    sendJSONChannel(channel: string, obj: object): void {
      this.sendChannel(channel, JSON.stringify(obj));
    },
    /** 清空消息历史与各通道 lastMessage */
    clearMessages(): void {
      for (const key of Object.keys(this.channels)) {
        this.channels[key].lastMessage = null;
      }
      this.messageList = [];
    },
    setMessageListLimit(limit: number): void {
      this.messageListLimit = limit;
      if (limit > 0 && this.messageList.length > limit) {
        this.messageList = this.messageList.slice(-limit);
      }
    },
    pushMessage(
      data: string | ArrayBuffer,
      direction: 'send' | 'receive',
      channel = DEFAULT_WEBSOCKET_CHANNEL
    ): void {
      const record: WebSocketMessageRecord = {
        data,
        time: Date.now(),
        direction,
        channel
      };
      this.messageList.push(record);
      if (this.messageListLimit > 0 && this.messageList.length > this.messageListLimit) {
        this.messageList = this.messageList.slice(-this.messageListLimit);
      }
    }
  }
});

/** useWebSocketStoreWithOut */
export const useWebSocketStoreWithOut = () => {
  return useWebSocketStore(store);
};
