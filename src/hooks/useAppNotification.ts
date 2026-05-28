import { ref } from 'vue';
import { isNative } from './useAppInfo';

/** 本地通知项（与插件 PendingResult 中的 notification 对应） */
export interface PendingNotificationItem {
  id: number;
  title: string;
  body: string;
  schedule?: {
    at: Date;
  };
  extra?: Record<string, unknown>;
}

/** 发送即时通知参数 */
export interface SendNotificationOptions {
  /** 标题 */
  title: string;
  /** 正文 */
  body: string;
  /** 通知 ID，不传则用时间戳，Android 需在 32 位有符号整数范围内 */
  id?: number;
  /** 附加数据，点击通知时可拿到 */
  extra?: Record<string, unknown>;
}

/** 定时通知参数 */
export interface ScheduleNotificationOptions extends SendNotificationOptions {
  /** 触发时间 */
  at: Date;
  /** 是否重复（按 at 重复） */
  repeats?: boolean;
}

/** 权限状态 */
export type NotificationPermissionStatus = 'granted' | 'denied' | 'prompt';

/** 本地通知插件 API 形状（与 @capacitor/local-notifications 一致，便于未安装依赖时类型检查通过） */
interface LocalNotificationsPlugin {
  checkPermissions(): Promise<{
    display: string;
  }>;
  requestPermissions(): Promise<{
    display: string;
  }>;
  schedule(options: {
    notifications: Array<{
      id: number;
      title: string;
      body: string;
      schedule?: {
        at: Date;
        repeats?: boolean;
      };
      extra?: Record<string, unknown>;
    }>;
  }): Promise<unknown>;
  getPending(): Promise<{
    notifications: PendingNotificationItem[];
  }>;
  cancel(options: {
    notifications: Array<{
      id: number;
    }>;
  }): Promise<void>;
  addListener(
    event: 'localNotificationReceived',
    cb: (n: PendingNotificationItem) => void
  ): Promise<{
    remove: () => Promise<void>;
  }>;
  addListener(
    event: 'localNotificationActionPerformed',
    cb: (e: {
      notification: {
        id: number;
      };
      actionId: string;
      inputValue?: string;
    }) => void
  ): Promise<{
    remove: () => Promise<void>;
  }>;
}

/** 拉取接口数据（loadLocalNotificationsPlugin） */
const loadLocalNotificationsPlugin = async (): Promise<LocalNotificationsPlugin | null> => {
  if (!isNative) return null;
  const mod = (await import(/* @vite-ignore */ '@capacitor/local-notifications').catch(
    () => null
  )) as {
    LocalNotifications: LocalNotificationsPlugin;
  } | null;
  return mod?.LocalNotifications ?? null;
};

/** useAppNotification */
export const useAppNotification = () => {
  const permissionStatus = ref<NotificationPermissionStatus>('prompt');

  const ensurePlugin = async (): Promise<LocalNotificationsPlugin | null> => {
    return loadLocalNotificationsPlugin();
  };

  /** 检查通知权限 */
  const checkPermissions = async (): Promise<NotificationPermissionStatus> => {
    const plugin = await ensurePlugin();
    if (!plugin) {
      permissionStatus.value = 'denied';
      return 'denied';
    }
    const { display } = await plugin.checkPermissions();
    permissionStatus.value = display as NotificationPermissionStatus;
    return display as NotificationPermissionStatus;
  };

  /** 请求通知权限（Android 13+ / iOS 需用户授权） */
  const requestPermissions = async (): Promise<NotificationPermissionStatus> => {
    const plugin = await ensurePlugin();
    if (!plugin) {
      permissionStatus.value = 'denied';
      return 'denied';
    }
    const { display } = await plugin.requestPermissions();
    permissionStatus.value = display as NotificationPermissionStatus;
    return display as NotificationPermissionStatus;
  };

  /** 确保有权限，无权限时先请求一次 */
  const ensurePermissions = async (): Promise<boolean> => {
    let status = await checkPermissions();
    if (status !== 'granted') {
      status = await requestPermissions();
    }
    return status === 'granted';
  };

  /** 发送即时通知（马上展示） */
  const send = async (options: SendNotificationOptions): Promise<void> => {
    const plugin = await ensurePlugin();
    if (!plugin) return;
    const granted = await ensurePermissions();
    if (!granted) return;
    const id = options.id ?? Math.floor(Date.now() % 2147483647);
    await plugin.schedule({
      notifications: [
        {
          id,
          title: options.title,
          body: options.body,
          extra: options.extra,
          schedule: { at: new Date(Date.now() + 100) }
        }
      ]
    });
  };

  /** 定时发送通知 */
  const schedule = async (options: ScheduleNotificationOptions): Promise<void> => {
    const plugin = await ensurePlugin();
    if (!plugin) return;
    const granted = await ensurePermissions();
    if (!granted) return;
    const id = options.id ?? Math.floor(Date.now() % 2147483647);
    await plugin.schedule({
      notifications: [
        {
          id,
          title: options.title,
          body: options.body,
          extra: options.extra,
          schedule: {
            at: options.at,
            repeats: options.repeats ?? false
          }
        }
      ]
    });
  };

  /** 获取待触发的通知列表 */
  const getPending = async (): Promise<PendingNotificationItem[]> => {
    const plugin = await ensurePlugin();
    if (!plugin) return [];
    const { notifications } = await plugin.getPending();
    return (notifications ?? []).map(
      (n: {
        id: number;
        title: string;
        body: string;
        schedule?: {
          at: Date;
        };
        extra?: Record<string, unknown>;
      }) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        schedule: n.schedule,
        extra: n.extra
      })
    );
  };

  /** 取消指定 ID 的通知 */
  const cancel = async (ids: number[]): Promise<void> => {
    const plugin = await ensurePlugin();
    if (!plugin) return;
    if (ids.length === 0) return;
    await plugin.cancel({ notifications: ids.map((id) => ({ id })) });
  };

  /** 取消所有待触发的通知 */
  const cancelAll = async (): Promise<void> => {
    const pending = await getPending();
    if (pending.length > 0) {
      await cancel(pending.map((n) => n.id));
    }
  };

  /** 监听通知被展示（前台也会触发） */
  const onReceived = async (
    callback: (notification: {
      id: number;
      title: string;
      body: string;
      extra?: Record<string, unknown>;
    }) => void
  ): Promise<() => void> => {
    const plugin = await ensurePlugin();
    if (!plugin) return () => {};
    const h = await plugin.addListener(
      'localNotificationReceived',
      (n: PendingNotificationItem) => {
        callback({
          id: n.id,
          title: n.title,
          body: n.body,
          extra: n.extra as Record<string, unknown> | undefined
        });
      }
    );
    return () => h.remove();
  };

  /** 监听用户点击通知 */
  const onActionPerformed = async (
    callback: (payload: { notificationId: number; actionId: string; inputValue?: string }) => void
  ): Promise<() => void> => {
    const plugin = await ensurePlugin();
    if (!plugin) return () => {};
    const h = await plugin.addListener(
      'localNotificationActionPerformed',
      (e: {
        notification: {
          id: number;
        };
        actionId: string;
        inputValue?: string;
      }) => {
        callback({
          notificationId: e.notification.id,
          actionId: e.actionId,
          inputValue: e.inputValue
        });
      }
    );
    return () => h.remove();
  };

  return {
    isNative,
    permissionStatus,
    checkPermissions,
    requestPermissions,
    ensurePermissions,
    send,
    schedule,
    getPending,
    cancel,
    cancelAll,
    onReceived,
    onActionPerformed
  };
};
