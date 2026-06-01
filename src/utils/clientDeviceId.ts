/**
 * 客户端设备标识（HTTP 头 device、与业务侧 DeviceUUID 对齐）
 * - 原生：Capacitor Device.getId()（系统级安装维度 ID）
 * - 网页：IndexedDB 为主、localStorage 为备，双写；尽量在「仅清缓存」时仍可从 IDB 恢复
 */
import { Capacitor } from '@capacitor/core';
import { isServer } from '/@/utils/is';
import { useUserStoreWithOut } from '/@/stores/modules/UserConfig';

/** IDB_NAME */
const IDB_NAME = 'bwai_client_device';

/** IDB_VERSION */
const IDB_VERSION = 1;

/** IDB_STORE */
const IDB_STORE = 'kv';

/** 键名或缓存键：IDB_KEY */
const IDB_KEY = 'client_device_id';

/** 键名或缓存键：LS_KEY */
const LS_KEY = 'bwai_client_device_id_v1';

/** memoryCache */
let memoryCache: string | null = null;

/** inflight */
let inflight: Promise<string> | null = null;

/** 用户或路由 uid：generateUuid */
const generateUuid = (): string => {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    /* ignore */
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}-${Math.random().toString(36).slice(2, 8)}`;
};

/** readLocalStorage */
const readLocalStorage = (): string | null => {
  try {
    if (typeof localStorage === 'undefined') return null;
    const v = localStorage.getItem(LS_KEY);
    return v?.trim() || null;
  } catch {
    return null;
  }
};

/** writeLocalStorage */
const writeLocalStorage = (id: string): void => {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(LS_KEY, id);
  } catch {
    /* 隐私模式等 */
  }
};

/** openIdb */
const openIdb = (): Promise<IDBDatabase | null> => {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onerror = () => resolve(null);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
  });
};

/** 方法：idbGet */
const idbGet = async (): Promise<string | null> => {
  const db = await openIdb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const g = store.get(IDB_KEY);
      g.onerror = () => resolve(null);
      g.onsuccess = () => {
        const v = g.result;
        resolve(typeof v === 'string' && v.trim() ? v.trim() : null);
      };
    } catch {
      resolve(null);
    }
  });
};

/** 方法：idbSet */
const idbSet = async (id: string): Promise<void> => {
  const db = await openIdb();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.put(id, IDB_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    } catch {
      resolve();
    }
  });
};

/** 方法：resolveNativeDeviceId */
const resolveNativeDeviceId = async (): Promise<string> => {
  const { Device } = await import('@capacitor/device');
  const { identifier } = await Device.getId();
  const id = identifier?.trim();
  if (!id) return generateUuid();
  return id;
};

/** 方法：resolveWebDeviceId */
const resolveWebDeviceId = async (): Promise<string> => {
  let id = await idbGet();
  if (!id) {
    id = readLocalStorage();
  }
  if (!id) {
    id = generateUuid();
    await idbSet(id);
    writeLocalStorage(id);
  } else {
    await idbSet(id);
    writeLocalStorage(id);
  }
  return id;
};

/** 用户：syncToUserStore */
const syncToUserStore = (id: string): void => {
  try {
    useUserStoreWithOut().setDeviceUUID(id, true);
  } catch {
    /* Pinia 未初始化等 */
  }
};

/**
 * 获取当前客户端设备 ID（带内存缓存与并发合并）
 */
export const getClientDeviceIdAsync = (): Promise<string> => {
  if (isServer) return Promise.resolve('');
  if (memoryCache) return Promise.resolve(memoryCache);
  inflight ??= (async () => {
    let id: string;
    if (Capacitor.isNativePlatform()) {
      id = await resolveNativeDeviceId();
    } else {
      id = await resolveWebDeviceId();
    }
    memoryCache = id;
    syncToUserStore(id);
    return id;
  })().finally(() => {
    inflight = null;
  });
  return inflight;
};
