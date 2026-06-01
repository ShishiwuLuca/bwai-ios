/// <reference types="@capacitor/status-bar" />
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bwai.io',
  appName: 'BWAI',
  webDir: 'dist',
  /** WebView 底色：与 --van-background 深色一致，沉浸式时刘海/状态栏区不露出纯黑 */
  backgroundColor: '#090d20',
  // Android WebView配置
  android: {
    backgroundColor: '#090d20',
    // 允许混合内容（HTTP和HTTPS）
    allowMixedContent: true,
    // 启用硬件加速
    webContentsDebuggingEnabled: true
  },
  // iOS WebView 配置（allowsInlineMediaPlayback 等为原生支持的扩展项，类型中未声明，用断言保留）
  ios: {
    // 允许内联媒体播放
    allowsInlineMediaPlayback: true,
    // 上架包关闭 WebView 远程调试（Debug 需排查时可在本地临时改为 true 后勿提交）
    webContentsDebuggingEnabled: false
  } as CapacitorConfig['ios'],
  plugins: {
    /**
     * 原生网络栈接管 fetch/XHR：
     * - 解决 WebView(https://localhost) 跨域到业务域名时的 CORS/预检拦截（常见表现：HTTP Status=0）
     * - 对 axios（XHR）同样生效，减少“网页正常、App 无响应”的环境差异
     */
    CapacitorHttp: {
      enabled: true
    },
    // 启动画面：关闭自动隐藏，等前端就绪后手动隐藏，避免白屏过渡
    SplashScreen: {
      launchAutoHide: false
    },
    StatusBar: {
      // 沉浸式：WebView 延伸至状态栏下；启动时即透明，避免插件初始化前闪白
      overlaysWebView: true,
      backgroundColor: '#00000000',
      style: 'DARK'
    },
    /**
     * 应用更新：使用 Capgo 云时在 Capgo 后台配置；自托管时填 channelUrl，例如：
     * channelUrl: 'https://your-server.com/api/channel_self',
     * 应用就绪超时（毫秒），超时未调用 notifyAppReady 可能触发回滚
     * appReadyTimeout: 20000
     */
    CapacitorUpdater: {
      // 关闭原生轮询 getLatest：本应用由服务端 `/app-api/.../version-check` 下发 OTA 直链并走
      // `downloadAndApplyOTAFromUrl`（见 `serverAppVersionCheck`）。与 autoUpdate 并行会反复请求
      // Capgo，开发期频繁冷启动时易 429（rate_limit_exceeded）。若你**仅**依赖 Capgo Channel、
      // 从不走服务端直链，再把此项改回 true。
      autoUpdate: false,
      /** 成功切换 bundle 后由原生删旧包（与 `appUpdate.ts` 中 set 前 JS 侧 `delete` 互补） */
      autoDeletePrevious: true,
      // 关闭统计上报，减轻对 plugin.capgo.app 的请求量（与 429 无关但可略减负载）
      statsUrl: '',
      // 应用就绪超时（毫秒），超时未调用 notifyAppReady 可能触发回滚（首包较大 / GC 卡顿时适当放宽）
      appReadyTimeout: 60000
    },
    // 文件传输插件
    FileTransfer: {
      // 是否启用文件传输
      enabled: true,
      // 文件传输最大速度（字节/秒）
      maxSpeed: 5 * 1024 * 1024,
      // 文件传输超时时间（毫秒）
      timeout: 30000
    },
    // 文件系统插件
    Filesystem: {
      // 是否启用文件系统
      enabled: true,
      // 文件系统最大容量（字节）
      maxSize: 50 * 1024 * 1024,
      // 文件系统超时时间（毫秒）
      timeout: 30000
    },
    // 本地通知插件
    LocalNotifications: {
      // 是否启用本地通知
      enabled: true,
      // 本地通知最大数量
      maxNotifications: 100,
      // 本地通知超时时间（毫秒）
      timeout: 30000
    },
    // 桌面图标角标（站内信未读数等）
    Badge: {
      persist: true,
      autoClear: false
    },
    /**
     * Capacitor 8 内置：与 viewport-fit=cover 配合注入 safe-area。
     * 不在此改 style，避免与 @capacitor/status-bar 重复；窗口色在 MainActivity 覆写。
     */
    SystemBars: {
      insetsHandling: 'css'
    }
  }
};

export default config;
