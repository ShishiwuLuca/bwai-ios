import { Capacitor } from '@capacitor/core';
import type { WebSocketOptions } from '/@/utils/websocket';
import { getDeviceClientReportFieldsSync } from '/@/utils/deviceClientReportFields';
// ---------- 路径常量（与后端约定） ----------

/** 行情 spot */
export const WS_PATH_INFRA_MARKET_SPOT = '/infra/market/spot';

/** 会员 / 用户私有通道 */
export const WS_PATH_USER_WS = '/user/ws';

/** 与 {@link useWebSocketStore#connectChannel} 使用的会员通道名一致（App.vue / 推送处理） */
export const WS_CHANNEL_MEMBER = 'member';

// ---------- 默认连接参数（重连、心跳） ----------

/** 常量或静态配置：DEFAULT_WEBSOCKET_CLIENT_OPTIONS */
export const DEFAULT_WEBSOCKET_CLIENT_OPTIONS: WebSocketOptions = {
  /** 重连次数 */
  reconnectLimit: 10,
  /** 重连间隔，单位：毫秒 */
  reconnectInterval: 3000,
  /** 心跳间隔，单位：毫秒 */
  heartbeatInterval: 30000,
  /** 心跳消息 */
  heartbeatMessage: 'ping'
};

/** normalizeWebSocketOrigin */
const normalizeWebSocketOrigin = (raw: string): string => {
  return raw.trim().replace(/\/+$/, '');
};

/** 将 VITE_WS_FIXED_ORIGIN 规范为 ws(s)://host（支持误写 http(s):// 或无协议主机名）。 */
const toWebSocketSchemeOrigin = (normalized: string): string => {
  if (!normalized) return '';
  const lower = normalized.toLowerCase();
  if (lower.startsWith('https://')) return `wss://${normalized.slice(8)}`;
  if (lower.startsWith('http://')) return `ws://${normalized.slice(7)}`;
  if (lower.startsWith('wss://') || lower.startsWith('ws://')) return normalized;
  return `wss://${normalized}`;
};

/**
 * WS 根地址来自 Vite 按当前 `mode` 注入的 `VITE_WS_FIXED_ORIGIN`（勿在根 `.env` 配该项）：
 * `pnpm dev` → `.env.development`；`vite build` → `.env.production`；`vite build --mode app` → `.env.app`；`--mode test` → `.env.test`。
 */
export const getWebSocketOrigin = (): string => {
  const fromEnvRaw = normalizeWebSocketOrigin(String(import.meta.env.VITE_WS_FIXED_ORIGIN || ''));
  const fromEnv = toWebSocketSchemeOrigin(fromEnvRaw);

  if (import.meta.env.DEV) {
    return fromEnv;
  }

  const isNative = Capacitor.isNativePlatform();

  if (typeof window !== 'undefined' && !isNative && !fromEnv) {
    const https = window.location.protocol === 'https:';
    return `${https ? 'wss:' : 'ws:'}//${window.location.host}`;
  }

  return fromEnv;
};

/** buildWebSocketUrl */
export const buildWebSocketUrl = (path: string): string => {
  const origin = getWebSocketOrigin();
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${origin}${p}`;
};

/** 令牌：normalizeWebSocketQueryToken */
export const normalizeWebSocketQueryToken = (raw: string | null | undefined): string => {
  return raw?.trim() ?? '';
};

/** buildWebSocketConnectUrl */
export const buildWebSocketConnectUrl = (
  path: string,
  token: string | null | undefined
): string => {
  const base = buildWebSocketUrl(path);
  const t = normalizeWebSocketQueryToken(token);
  const d = getDeviceClientReportFieldsSync();
  const qs = new URLSearchParams();
  qs.set('token', t);
  qs.set('vendor_name', d.vendor_name);
  qs.set('device_name', d.device_name);
  qs.set('system_ui_name', d.system_ui_name);
  qs.set('ui_version', d.ui_version);
  return `${base}?${qs.toString()}`;
};
