# BWAI H5

English: [README.en.md](./README.en.md)

**BWAI**（Capacitor 应用名 `com.bwai.io`）是一套面向移动端的多语言金融与社区类 **H5 + 原生壳** 工程：基于 **Vue 3**、**Vite**、**TypeScript** 与 **Capacitor 8**，可部署为 Web，也可打包 **Android / iOS**。涵盖钱包与链上相关能力、AI 投资、经典投资、社区、团队与每日任务等，并集成 **OTA 热更新（Capgo）**、**应用商店更新检测**、**双通道 WebSocket**（行情与会员推送）、**原生 HTTP 桥** 等。

---

## 一、业务功能概览

### 1. 底部主导航（`AppTabBar`）

| Tab  | 路由         | 说明                                               |
| ---- | ------------ | -------------------------------------------------- |
| 首页 | `/`          | 行情、公告与常用入口等（`Home`，支持 `keepAlive`） |
| 社区 | `/Community` | 帖子流与社区入口                                   |
| AI   | `/AIInvest`  | AI 投资产品列表                                    |
| 团队 | `/Team`      | 团队数据、邀请与奖励相关                           |
| 我的 | `/Personal`  | 个人中心与各功能跳转                               |

### 2. 账号与认证

- 登录、注册、忘记密码（`Login`、`Register`、`ForgotPassword`）
- 邮箱 / 手机号验证（`VerifyEmail`、`VerifyPhone`）
- 路由 `meta.requiresAuth` 控制需登录页；未登录跳转登录
- 进入提币页前校验是否已设置交易密码（未设置则弹窗引导）

### 3. AI 投资

- 产品列表：`/AIInvest`；申购：`/AIBuy`
- 我的订单：`/MyOrder`；订单详情：`/OrderDetails`（赎回、收益、复投等）

### 4. 经典投资（与 AI 模块并存）

- 投资列表：`/Invest`；申购：`/Invest/Join`
- 说明：路由中存在与 AI 重叠的「我的订单 / 订单详情」路径，**以 `src/router/index.ts` 注册顺序为准**，当前 **AI 的 `/MyOrder` 优先匹配**。

### 5. 钱包与资产

- 钱包总览、单币种账户：`/Wallet`、`/Wallet/Account`
- 充币、提币、转账：`/Wallet/Recharge`、`/Wallet/Withdraw`、`/Wallet/Transfer`
- 地址簿：`/AddressBook`、`/AddAddress`、`/EditAddress`
- 钱包内设置交易密码：`/SetTradePassword`；提现校验：`/WithdrawVerify`
- 流水与详情：`/Wallet/TransactionHistory`、`/TransactionDetail`

### 6. 团队与排行榜

- 团队页、下级：`/Team`、`/Team/Sub`
- VIP / 推荐奖励：`/Team/VIPReward`、`/Team/ReferralReward`
- 排行榜：`/Rank`、`/Rank/Record`

### 7. 每日任务

- `/DailyTask`、`/SalaryDetail`、`/Task/2`、`/Task/3`

### 8. 社区与内容

- 社区、我的社区、消息：`/Community`、`/MyCommunity`、`/MyMessage`
- 发帖、详情、举报：`/PublishPost`、`/PostDetail`、`/Report`
- 公告与站内信：`/Announcement`、`/Notice` 及详情页
- 文章（协议等）：`/ArticleDetail`；关于：`/About`
- **APP 下载页** `/Download`：含应用说明与 **iOS Safari「添加到主屏幕」** 等多语言提示（`str_app_download_safari_tips_1`）

### 9. 设置与安全

- 安全总览：`/SecuritySettings`；绑定手机/邮箱、修改密码、交易密码、资料升级、谷歌验证器等
- 邀请、用户权益、服务条款：`/Invite`、`/UserBenefits`、`/Terms`

### 10. 全局与壳能力（`App.vue`、`main.ts`、`nativeAppShell` 等）

- **主题**：亮 / 暗模式；Vant `ConfigProvider` 与 Less 变量（`src/design/`）；原生状态栏与 **SystemBars** 安全区（`viewport-fit=cover`）
- **布局**：`index.html` 内 **rem** 根字号脚本（以设计宽度为基准缩放），适配窄屏与横竖屏
- **国际化**：`LocaleModal`；语言包 `src/locales/lang/` 下 **约 39 种** JSON + Vant 语言包；可选 RTL
- **更新**：`CheckUpdates`、`AppUpdateDialog`；服务端版本检测、Capgo OTA、商店更新、Android APK 直链安装（详见下文「更新与安装包」）
- **WebSocket**：默认通道行情；`member` 通道会员推送；未登录时 token 传空（见 `App.vue` 注释）
- **角标**：未读与桌面角标（`@capawesome/capacitor-badge`）
- **埋点**：启动日志（`recordStartupLog`）
- **404**：通配路由与 `EmptyView`

---

## 二、UI 与交互要点

| 方面 | 说明 |
| --- | --- |
| 组件库 | **Vant 4** 按钮、表单、弹窗、进度条、列表等；`@vant/touch-emulator` 便于桌面调试 |
| 导航 | 顶部 `NavBar`、底部 `AppTabBar`；路由切换与 `keepAlive` 配合首屏缓存 |
| 视觉 | 全局深色为主（与启动图、WebView 底色一致）；UnoCSS 原子类与 Less 并存 |
| 启动 | Splash 可关闭自动隐藏，由前端就绪后 `hideSplashScreenIfNative` |
| 下载页 | 区分平台展示；iOS 展示 Safari 添加到主屏幕的步骤文案 |

---

## 三、更新与安装包策略（`src/utils/appUpdate.ts` 等）

| 类型 | 行为摘要 |
| --- | --- |
| **OTA（资源包）** | 服务端下发 zip 直链，走 `CapacitorUpdater.download` / `set`；**仅在 `set` 成功事件之后** 删除其它本地 bundle（`initAppUpdateInstallLifecycleListeners`），避免 set 失败时已删旧包。Android 可先 `scheduleProcessExit` 再 `set`，需用户再次冷启动。 |
| **APK（安装包）** | 优先 **`PackageInstaller.Session`**；失败则 **Intent** 安装。缓存命中：**下载 URL 路径中的 `.apk` 文件名** 与 `Directory.Data` 下**文件名完全一致**时才跳过下载；否则可按版本生成 `apk_cached_package_*` 等（无 URL 文件名时）。 |
| **删包时机** | Session：**`STATUS_SUCCESS`（status=0）** 经 `apkInstallSessionResult` 后再删本地 APK。Intent：**`MainActivity` + `ActivityResultLauncher`**，用户从系统安装界面返回且判定成功（`RESULT_OK` 或 `versionCode` 上升）后通过 **`apkInstallIntentResult`** 通知 JS 删除；避免用户久未点安装时文件已被删。 |
| **Capgo 配置** | `capacitor.config.ts` 中 `autoUpdate: false`（由业务接口驱动检查）；可配置 `autoDeletePrevious` 等与云端策略配合。 |

自定义原生插件：**`BWAIAppControl`**（`BwaiAppControlPlugin.java`）— 设备 ROM 信息、`openApkInstaller`、`scheduleProcessExit`、安装会话/Intent 结果事件等。

---

## 四、Capacitor 与原生插件

Web 资源目录：`dist`。`capacitor.config.ts` 含 **CapacitorHttp**（解决 WebView 与业务域跨域）、Splash、StatusBar、SystemBars、Badge、Capgo Updater、FileTransfer、Filesystem、LocalNotifications 等。

| 依赖 | 用途 |
| --- | --- |
| `@capacitor/core` / `@capacitor/cli` | 核心与 CLI |
| `@capacitor/android` / `ios` | 原生工程 |
| `@capacitor/app` | 生命周期 |
| **CapacitorHttp**（`@capacitor/core` 能力） | 原生网络栈代理 fetch/XHR（`capacitor.config.ts` 中 `plugins.CapacitorHttp`） |
| `@capacitor/filesystem` / `@capacitor/file-transfer` | 本地文件与 APK 下载 |
| `@capawesome/capacitor-app-update` | Play / App Store 更新检测 |
| `@capgo/capacitor-updater` | Web 资源 OTA |
| `@capawesome/capacitor-badge` | 桌面角标 |
| 其它 | Browser、Device、Network、Share、Splash、StatusBar、File Opener、Local Notifications 等 |

---

## 五、前端技术栈

| 类别 | 技术 |
| --- | --- |
| 框架 | Vue 3（Composition API、`<script setup>`）、Vue Router 5、Pinia |
| UI | Vant 4、`@vant/use`、`@vant/touch-emulator` |
| 样式 | **UnoCSS**、**Less**（`src/design/`） |
| 构建 | **Vite**、**TypeScript**、`vue-tsc` |
| 国际化 | **Vue I18n**，`src/locales/lang/` |
| HTTP | **Axios**（`src/utils/http/`） |
| 图表 / 链 / 工具 | ECharts、decimal.js、web3、dayjs、crypto-js、qs、pako、tldts 等 |
| 二维码 / 画布 | qrcode.vue、html2canvas、browser-image-compression |
| 实时 | **mqtt**（`MqttService.ts`） |
| 持久化 | **pinia-plugin-persistedstate** |

---

## 六、Vite 与工程插件（`build/vite/plugin`）

| 插件 | 作用 |
| --- | --- |
| `@vitejs/plugin-vue` / `plugin-vue-jsx` | Vue 与 JSX |
| `vite-plugin-vue-setup-extend` | SFC `name` 等 |
| `vite-plugin-mkcert` | 本地 HTTPS |
| **UnoCSS** | 原子化 CSS |
| `vite-plugin-environment` | 注入 `VITE_*` |
| `@vitejs/plugin-legacy` | 旧浏览器兼容 |
| `vite-plugin-html` | 标题等 EJS 注入 |
| `unplugin-vue-components` + **VantResolver** | Vant 按需 |
| `rollup-plugin-visualizer` | 体积分析 |
| `vite-plugin-compression` | 生成 `.gz` / `.br` **侧车文件**（供 Nginx `gzip_static` 等；**打进 APK / OTA 的构建建议 `VITE_BUILD_COMPRESS=none`**，见 `.env.app`） |
| `static-file-plugin` | 开发服：`public/luckeywheel/` 直出 |

**脚本**：`postBuild.ts`、`zipOta.ts`（OTA 输出 `OTA/`）、`buildAndroid.ts`、`proxy.ts`；`vite.config.ts` 含手动分包与时间戳资源名，减轻 WebView 下 CSS 与静态资源路径错位。

---

## 七、目录结构（精简）

```
├── android/、ios/           # Capacitor 原生（含 BWAIAppControl、安装结果回调等）
├── build/                   # Vite 插件、代理、常量、构建脚本
├── public/                  # 静态资源、PWA manifest 等
├── scripts/                 # 多语言补丁、Cap 相关 patch 等
├── src/
│   ├── assets/、components/、design/、hooks/、locales/
│   ├── router/、service/、stores/、utils/、views/
│   ├── App.vue、main.ts
├── types/
├── capacitor.config.ts、vite.config.ts、uno.config.ts
├── pnpm-workspace.yaml
└── package.json
```

---

## 八、环境要求

- **Node.js**：`^20.19.0` 或 `>=22.12.0`（`package.json` → `engines`）
- **pnpm**：与 `packageManager` 字段一致

---

## 九、快速开始

```bash
pnpm install
pnpm dev
```

`dev`：`vite --host --open`，便于局域网调试（HTTPS 依赖 mkcert 插件）。

```bash
pnpm type-check    # vue-tsc --build
pnpm build         # 先类型检查，再 vite build + postBuild
pnpm build:test
pnpm preview
```

---

## 十、常用脚本

| 脚本 | 说明 |
| --- | --- |
| `pnpm cap:sync` | 同步 Web 产物到原生 |
| `pnpm cap:android` / `pnpm cap:ios` | 同步并打开 IDE |
| `pnpm build:cap` | `pnpm build` + `cap sync` |
| `pnpm build:ota` | app 模式构建 + OTA zip |
| `pnpm build:android` / `pnpm build:android:release` | 构建 + 同步 + Gradle debug/release |
| `pnpm lint` | oxlint + eslint |
| `pnpm format` | Prettier（`src/`） |
| `pnpm android:compile` | 仅编译 Java（调试原生改动） |

---

## 十一、环境变量

根目录 **`.env`**、**`.env.development`**、**`.env.production`**、**`.env.test`**、**`.env.app`** 等区分环境。`wrapperEnv` 解析布尔、端口、代理 JSON 等。

| 变量 | 说明 |
| --- | --- |
| `VITE_PUBLIC_PATH` | 部署子路径 / 资源 base |
| `VITE_GLOB_APP_TITLE` | 应用标题（注入 HTML） |
| `VITE_GLOB_SYSTEM_VERSION` | 资源版本号（构建命名、OTA、请求头等） |
| `VITE_GLOB_API_URL` / 前缀 | 接口基址与路径 |
| `VITE_BUILD_COMPRESS` | `gzip` / `brotli` / `none` — **Capacitor 包建议 `none`**（`.env.app`） |

生产可通过 `window` 全局配置覆盖（见 `env.ts`）。

---

## 十二、多语言与代码质量

- 基准键可参考 `zh_CN.json`；`scripts/` 下含补丁、合并等辅助脚本。
- `pnpm lint`、`pnpm format`

---

## 十三、参考文档

- [Vite](https://vite.dev/)
- [Capacitor](https://capacitorjs.com/docs)
- [Vant 4](https://vant-ui.github.io/vant/)
- [Vue Router](https://router.vuejs.org/)
- [UnoCSS](https://unocss.dev/)

---

## 十四、许可证

**Private**（私有项目，未声明开源许可证）。
