/**
 * WebSocket 封装：连接、断开、自动重连、心跳、消息收发
 */

export interface WebSocketOptions {
  /** 自动重连最大次数，0 表示不重连 */
  reconnectLimit?: number;
  /** 重连间隔（毫秒） */
  reconnectInterval?: number;
  /** 心跳间隔（毫秒），0 表示不心跳 */
  heartbeatInterval?: number;
  /** 心跳消息（字符串或返回字符串的函数），仅当 heartbeatInterval > 0 时生效 */
  heartbeatMessage?: string | (() => string);
}

/** 发送数据类型（与常见用法一致；实际 send 处按 DOM 签名断言） */
export type WebSocketMessage = string | ArrayBuffer | Blob | ArrayBufferView;

/** open 回调 */
type OpenHandler = () => void;

/** message 回调 */
type MessageHandler = (data: string | ArrayBuffer) => void;

/** error 回调 */
type ErrorHandler = (event: Event) => void;

/** close 回调 */
type CloseHandler = (event: CloseEvent) => void;

/** 解析后的配置 */
type ResolvedOptions = Required<Omit<WebSocketOptions, 'heartbeatMessage'>> & {
  heartbeatMessage?: string | (() => string);
};

/** 默认配置 */
const DEFAULT_OPTIONS: ResolvedOptions = {
  reconnectLimit: 3,
  reconnectInterval: 3000,
  heartbeatInterval: 10,
  heartbeatMessage: 'ping'
};

export class WebSocketClient {
  /** 连接地址 */
  private url: string;
  /** 配置 */
  private options: ResolvedOptions;
  /** WebSocket 实例 */
  private ws: WebSocket | null = null;
  /** 重连计数 */
  private reconnectCount = 0;
  /** 心跳定时器 */
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  /** 是否手动关闭 */
  private isManualClose = false;
  /** open 回调 */
  private onOpenHandlers: OpenHandler[] = [];
  /** message 回调 */
  private onMessageHandlers: MessageHandler[] = [];
  /** error 回调 */
  private onErrorHandlers: ErrorHandler[] = [];
  /** close 回调 */
  private onCloseHandlers: CloseHandler[] = [];
  /** 构造函数 */
  constructor(url: string, options: WebSocketOptions = {}) {
    this.url = url;
    this.options = { ...DEFAULT_OPTIONS, ...options } as ResolvedOptions;
  }

  /** 连接 */
  connect(): void {
    this.isManualClose = false;
    this.reconnectCount = 0;
    this.doConnect();
  }

  /** 内部：连接 */
  private doConnect(): void {
    try {
      this.ws = new WebSocket(this.url);
    } catch (e) {
      this.emitError(e as Event);
      this.tryReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.reconnectCount = 0;
      this.startHeartbeat();
      this.onOpenHandlers.forEach((h) => h());
    };

    this.ws.onmessage = (event: MessageEvent) => {
      const data = typeof event.data === 'string' ? event.data : event.data;
      this.onMessageHandlers.forEach((h) => h(data));
    };

    this.ws.onerror = (event: Event) => {
      this.onErrorHandlers.forEach((h) => h(event));
    };

    this.ws.onclose = (event: CloseEvent) => {
      this.stopHeartbeat();
      this.onCloseHandlers.forEach((h) => h(event));
      if (!this.isManualClose) {
        this.tryReconnect();
      }
    };
  }

  private tryReconnect(): void {
    const { reconnectLimit, reconnectInterval } = this.options;
    if (reconnectLimit <= 0 || this.reconnectCount >= reconnectLimit) {
      return;
    }
    this.reconnectCount += 1;
    setTimeout(() => {
      this.doConnect();
    }, reconnectInterval);
  }

  private startHeartbeat(): void {
    const { heartbeatInterval, heartbeatMessage } = this.options;
    if (heartbeatInterval <= 0 || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        const msg =
          typeof heartbeatMessage === 'function'
            ? heartbeatMessage()
            : (heartbeatMessage ?? 'ping');
        this.ws.send(msg);
      }
    }, heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private emitError(event: Event): void {
    this.onErrorHandlers.forEach((h) => h(event));
  }

  /** 断开连接（不会触发自动重连） */
  disconnect(): void {
    this.isManualClose = true;
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /** 发送数据 */
  send(data: WebSocketMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      /* lib.dom 的 send 使用 BufferSource，其 ArrayBufferView 约束过窄；本项目仅发 JSON 字符串等常规负载 */
      this.ws.send(data as unknown as Parameters<WebSocket['send']>[0]);
    }
  }

  /** 是否已连接 */
  get readyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /** 注册 open 回调 */
  onOpen(handler: OpenHandler): () => void {
    this.onOpenHandlers.push(handler);
    return () => {
      this.onOpenHandlers = this.onOpenHandlers.filter((h) => h !== handler);
    };
  }

  /** 注册 message 回调 */
  onMessage(handler: MessageHandler): () => void {
    this.onMessageHandlers.push(handler);
    return () => {
      this.onMessageHandlers = this.onMessageHandlers.filter((h) => h !== handler);
    };
  }

  /** 注册 error 回调 */
  onError(handler: ErrorHandler): () => void {
    this.onErrorHandlers.push(handler);
    return () => {
      this.onErrorHandlers = this.onErrorHandlers.filter((h) => h !== handler);
    };
  }

  /** 注册 close 回调 */
  onClose(handler: CloseHandler): () => void {
    this.onCloseHandlers.push(handler);
    return () => {
      this.onCloseHandlers = this.onCloseHandlers.filter((h) => h !== handler);
    };
  }
}
