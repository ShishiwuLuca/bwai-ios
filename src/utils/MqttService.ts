/**
 * MQTT 客户端封装
 * - 单连接、多 topic 订阅、多回调 per topic
 * - 断线重连后自动恢复订阅
 */
import { onBeforeUnmount } from 'vue';
import mqtt from 'mqtt';
import type { MqttClient, IClientOptions, IClientPublishOptions } from 'mqtt';

/** UseMqttClientOptions：接口数据结构定义 */
export interface UseMqttClientOptions {
  /** 组件卸载时是否自动断开连接（默认 false，由业务在适当时机主动 disconnect） */
  disconnectOnUnmount?: boolean;
}

/** 消息回调：payload 为解析后的 JSON 或原始 Buffer 转字符串 */
export type MqttMessageCallback<T = unknown> = (payload: T) => void;

/** 默认连接选项 */
const DEFAULT_OPTIONS: IClientOptions = {
  reconnectPeriod: 1000,
  keepalive: 30,
  username: 'wsgateway',
  password: 'wsgateway'
};

/** 是否输出调试日志（生产可关） */
const DEBUG = import.meta.env.DEV;

/** log */
const log = (level: 'info' | 'warn' | 'error', ...args: unknown[]) => {
  if (!DEBUG && level === 'info') return;
  const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  fn('[MQTT]', ...args);
};

/** 解析消息：优先 JSON，否则返回字符串 */
const parsePayload = (message: Buffer): unknown => {
  const raw = message.toString();
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return raw;
  }
};

/** 创建并管理一个 MQTT 连接（可复用） */
const createMqttManager = () => {
  let client: MqttClient | null = null;
  const subscriptions = new Map<string, Set<MqttMessageCallback>>();
  let reconnecting = false;
  let lastOptions: IClientOptions = {};

  const bindEvents = () => {
    if (!client) return;

    client.on('connect', () => {
      log('info', 'connected');
      if (reconnecting) {
        log('info', 'reconnected, restoring subscriptions');
        restoreSubscriptions();
        reconnecting = false;
      }
    });

    client.on('reconnect', () => {
      log('info', 'reconnecting...');
      reconnecting = true;
    });

    client.on('error', (err) => {
      log('error', err);
    });

    client.on('close', () => {
      log('warn', 'connection closed');
    });

    client.on('message', (topic, message) => {
      const callbacks = subscriptions.get(topic);
      if (!callbacks?.size) return;
      const data = parsePayload(message);
      callbacks.forEach((cb) => {
        try {
          cb(data);
        } catch (e) {
          log('error', 'callback error', topic, e);
        }
      });
    });
  };

  const restoreSubscriptions = () => {
    if (!client) return;
    subscriptions.forEach((_, topic) => {
      client!.subscribe(topic, (err) => {
        if (err) log('error', `resubscribe failed: ${topic}`, err);
        else if (DEBUG) log('info', `resubscribed: ${topic}`);
      });
    });
  };

  return {
    connect: (url: string, options: IClientOptions = {}) => {
      if (client) return;
      lastOptions = { ...DEFAULT_OPTIONS, ...options };
      client = mqtt.connect(url, lastOptions);
      bindEvents();
    },

    subscribe: <T = unknown>(topic: string, callback: MqttMessageCallback<T>) => {
      if (!client) return;
      const cb = callback as MqttMessageCallback;
      if (!subscriptions.has(topic)) {
        subscriptions.set(topic, new Set());
        client.subscribe(topic, (err) => {
          if (err) log('error', `subscribe failed: ${topic}`, err);
          else if (DEBUG) log('info', `subscribed: ${topic}`);
        });
      }
      subscriptions.get(topic)!.add(cb);
    },

    unsubscribe: (topic: string, callback?: MqttMessageCallback) => {
      if (!client || !subscriptions.has(topic)) return;
      const callbacks = subscriptions.get(topic)!;
      if (callback) callbacks.delete(callback);
      if (!callback || callbacks.size === 0) {
        client.unsubscribe(topic, () => {
          subscriptions.delete(topic);
          if (DEBUG) log('info', `unsubscribed: ${topic}`);
        });
      }
    },

    publish: (
      topic: string,
      message: string | Record<string, unknown>,
      options: IClientPublishOptions = {}
    ) => {
      if (!client) return;
      const payload = typeof message === 'string' ? message : JSON.stringify(message);
      client.publish(topic, payload, options, (err) => {
        if (err) log('error', `publish failed: ${topic}`, err);
      });
    },

    disconnect: () => {
      if (client) {
        client.end(false, () => {
          if (DEBUG) log('info', 'disconnected');
        });
        subscriptions.clear();
        client = null;
      }
    },

    isConnected: (): boolean => client?.connected ?? false
  };
};

/** 单例 manager，供多处 useMqttClient 共享同一连接 */
const sharedManager = createMqttManager();

/**
 * Vue 组合式 API：获取共享 MQTT 客户端（单例连接）。
 * @param options.disconnectOnUnmount 为 true 时，当前组件卸载会自动断开连接
 */
export const useMqttClient = (options: UseMqttClientOptions = {}) => {
  const { disconnectOnUnmount = false } = options;
  if (disconnectOnUnmount) {
    onBeforeUnmount(() => sharedManager.disconnect());
  }
  return {
    connect: sharedManager.connect,
    subscribe: sharedManager.subscribe,
    unsubscribe: sharedManager.unsubscribe,
    publish: sharedManager.publish,
    disconnect: sharedManager.disconnect,
    isConnected: sharedManager.isConnected
  };
};
