/// <reference types="@capacitor/status-bar" />
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bwai.io',
  appName: 'BGAI',
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
