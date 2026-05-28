import { registerPlugin, type PluginListenerHandle } from '@capacitor/core';

/**
 * {@link PackageInstaller.Session} 回调经原生转发到 JS。
 * `status === 0`（{@code PackageInstaller#STATUS_SUCCESS}）表示安装成功，可安全删除已拷贝进会话前的本地 APK；
 * 其它为失败/拒绝等（原逻辑：`STATUS_PENDING_USER_ACTION` 不转发，失败才转发；成功现已一并转发）。
 */
export type ApkInstallSessionResultPayload = {
  status: number;
  packageName?: string;
  message?: string;
};

/** Intent 安装（ActivityResult）关闭且判定成功后：可删 `Directory.Data` 下同名文件 */
export type ApkInstallIntentResultPayload = {
  ok?: boolean;
  /** 与 Capacitor `Directory.Data` 根下文件名一致 */
  fileName?: string;
};

/** DeviceRomLayerPayload：接口数据结构定义（拉取接口数据） */
export interface DeviceRomLayerPayload {
  /** 系统定制 UI 名称，如 HyperOS、OriginOS、HarmonyOS */
  system_ui_name: string;
  /** 定制 UI 版本号（厂商口径，如 MIUI/HyperOS 属性值） */
  ui_version: string;
}

/** BWAIAppControlPlugin：接口数据结构定义 */
export interface BWAIAppControlPlugin {
  /**
   * Android：读取定制系统 UI 名称与版本（SystemProperties / Build，各厂商分支）。
   * iOS 未实现，调用方应 catch 后走 JS 兜底。
   */
  getDeviceRomLayer(): Promise<DeviceRomLayerPayload>;
  /**
   * Android：下载 APK 到本地后调用，用 FileProvider + 系统安装器直接打开安装界面。
   * `filePath` 为 `file://` 绝对路径、`content://` 或无前缀的绝对路径（与 FileTransfer 返回一致）。
   * `via`：Session 成功见 `apkInstallSessionResult`（status=0）；Intent 成功见 `apkInstallIntentResult`（`MainActivity` + ActivityResult）。
   */
  openApkInstaller(options: { filePath: string }): Promise<{ ok?: boolean; via?: string }>;
  /**
   * Android：在主线程延迟后结束当前进程（不自动重启）。
   */
  scheduleProcessExit(options?: { delayMs?: number }): Promise<void>;

  addListener(
    eventName: 'apkInstallSessionResult',
    listenerFunc: (payload: ApkInstallSessionResultPayload) => void
  ): Promise<PluginListenerHandle>;

  addListener(
    eventName: 'apkInstallIntentResult',
    listenerFunc: (payload: ApkInstallIntentResultPayload) => void
  ): Promise<PluginListenerHandle>;
}

/** BWAIAppControl */
export const BWAIAppControl = registerPlugin<BWAIAppControlPlugin>('BWAIAppControl');
