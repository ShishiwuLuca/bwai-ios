# BWAI H5（Fundex 社区版）

English: [README.en.md](./README.en.md)

**BWAI**（Capacitor 应用名 `com.bwai.io`）是一套面向移动端的 **H5 + 原生壳** 工程：基于 **Vue 3**、**Vite**、**TypeScript** 与 **Capacitor 8**，可部署为 Web，也可打包 **Android / iOS**。

当前仓库（`fundex`）为 **社区 + 账号** 子集：以社区信息流与个人中心为主，**不包含** WebSocket 实时推送、钱包、投资、团队等完整金融模块 UI（部分 `src/service/` 接口封装仍保留供后续扩展）。

---

## 一、业务功能概览

### 1. 底部主导航（`AppTabBar`）

| Tab  | 路由         | 说明                                   |
| ---- | ------------ | -------------------------------------- |
| 社区 | `/`          | 帖子流、轮播、分类 Tab（`keepAlive`）  |
| 我的 | `/Personal`  | 个人中心、安全设置、语言、公告入口等   |

`/Community` 会重定向到 `/`。

### 2. 账号与认证

- 登录、注册、忘记密码（`Login`、`Register`、`ForgotPassword`）
- 邮箱 / 手机号验证（`VerifyEmail`、`VerifyPhone`）
- 路由 `meta.requiresAuth` 控制需登录页；未登录跳转 `/Login`

### 3. 社区与内容

- 社区首页、我的社区、消息：`/`、`/MyCommunity`、`/MyMessage`
- 发帖、详情、举报：`/PublishPost`、`/PostDetail`、`/Report`
- 公告与站内信：`/Notice`、`/Notice/Detail`
- 文章（协议等）：`/ArticleDetail`

### 4. 设置与安全

- 安全总览：`/SecuritySettings`（改密、绑手机/邮箱）
- 用户权益、资料升级：`/UserBenefits`、`/UpgradeUserInfo`
- 服务条款：`/Terms`

### 5. 全局与壳能力（`App.vue`、`main.ts`、`nativeAppShell` 等）

- **主题**：亮 / 暗模式；Vant `ConfigProvider` 与 Less 变量（`src/design/`）；原生状态栏与安全区（`viewport-fit=cover`）
- **布局**：`index.html` 内 **rem** 根字号脚本，适配窄屏
- **国际化**：`LocaleModal`；`src/locales/lang/` 下约 **39 种** JSON + Vant 语言包；可选 RTL
- **更新**：`CheckUpdates`（H5 静态资源轮询，默认关闭）；应用内升级弹窗已移除
- **角标**：未读与桌面角标（`@capawesome/capacitor-badge`）
- **埋点**：启动日志（`recordStartupLog`）
- **404**：通配路由与 `EmptyView`

---

## 二、UI 与交互要点

| 方面 | 说明 |
| --- | --- |
| 组件库 | **Vant 4**；`@vant/touch-emulator` 便于桌面调试 |
| 导航 | 顶部 `NavBar`、底部 `AppTabBar`；`keepAlive` 用于社区首页 |
| 视觉 | 全局深色为主；UnoCSS 原子类与 Less 并存 |
| 启动 | Splash 由前端就绪后 `hideSplashScreenIfNative` 关闭 |

---

## 三、原生能力

自定义原生插件：**`BWAIAppControl`** — ROM 信息、设备上报等（APK 侧载安装能力保留在原生层，前端未再接入升级弹窗）。

---

## 四、Capacitor 与原生插件

Web 资源目录：`dist`。`capacitor.config.ts` 含 **CapacitorHttp**、Splash、StatusBar、Badge、FileTransfer、Filesystem 等。

---

## 五、前端技术栈

| 类别 | 技术 |
| --- | --- |
| 框架 | Vue 3、Vue Router 5、Pinia |
| UI | Vant 4、UnoCSS、Less |
| 构建 | Vite、TypeScript、`vue-tsc` |
| 国际化 | Vue I18n |
| HTTP | Axios（`src/utils/http/`） |
| 持久化 | pinia-plugin-persistedstate |

---

## 六、目录结构（精简）

```
├── android/、ios/           # Capacitor 原生工程
├── build/                   # Vite 插件、代理、构建脚本
├── public/
├── src/
│   ├── views/               # 社区、账号、设置、公告等
│   ├── service/             # API 封装（含部分未挂 UI 的模块）
│   ├── stores/、router/、utils/、components/
│   ├── App.vue、main.ts
├── types/
├── capacitor.config.ts、vite.config.ts
└── package.json
```

---

## 七、环境要求

- **Node.js**：`^20.19.0` 或 `>=22.12.0`
- **pnpm**：与 `package.json` → `packageManager` 一致

---

## 八、快速开始

```bash
pnpm install
pnpm dev
```

```bash
pnpm type-check
pnpm build
pnpm preview
```

---

## 九、常用脚本

| 脚本 | 说明 |
| --- | --- |
| `pnpm cap:sync` | 同步 Web 产物到原生 |
| `pnpm cap:android` / `pnpm cap:ios` | 同步并打开 IDE |
| `pnpm build:android` / `pnpm build:android:release` | 构建 + Gradle → APK（`PackageAndroid/`） |
| `pnpm build:ios:release` | app 构建 + sync + **Mac 上** 导出 `.ipa`（`PackageIOS/`） |
| `pnpm build:ios:ipa` | 仅导出 `.ipa`（需已 `cap sync ios`，**仅 macOS**） |
| `pnpm lint` | oxlint + eslint |

### iOS 导出 `.ipa`（仅 macOS）

1. 复制 `ios/signing.properties.example` → `ios/signing.properties`，填写 Apple **Team ID**（10 位）。
2. 本机安装 Xcode，并用 Apple ID 登录（**Signing & Capabilities** 使用 Automatic）。
3. 在 Mac 项目根目录执行：

```bash
pnpm run build:ios:release
```

成功后安装包在 **`PackageIOS/`**，文件名形如 `BWAI-V1.0.0-<时间戳>-release.ipa`，可自行用 Transporter 等上传 App Store。

**无 Mac、用 Codemagic 云打包**：见 **[docs/CODEMAGIC.md](./docs/CODEMAGIC.md)**（根目录 `codemagic.yaml`，构建产物在 Artifacts 中下载 `.ipa`）。

---

## 十、环境变量

根目录 **`.env`**、**`.env.development`**、**`.env.production`**、**`.env.test`**、**`.env.app`** 等。

| 变量 | 说明 |
| --- | --- |
| `VITE_PUBLIC_PATH` | 部署子路径 / 资源 base |
| `VITE_GLOB_APP_TITLE` | 应用标题 |
| `VITE_GLOB_SYSTEM_VERSION` | 资源版本号（构建命名、请求头等） |
| `VITE_GLOB_API_URL` / `VITE_GLOB_API_URL_PREFIX` | 接口基址与前缀 |
| `VITE_GLOB_PROXY` | 开发代理（如 `/app-api` → 后端） |
| `VITE_BUILD_COMPRESS` | Capacitor 包建议 `none`（`.env.app`） |

开发环境示例（`.env.development`）：`VITE_GLOB_PROXY` 将 `/app-api` 转发到配置的后端域名。

---

## 十一、多语言与代码质量

- 基准键：`src/locales/lang/zh_CN.json`
- `pnpm lint`、`pnpm format`

---

## 十二、参考文档

- [Vite](https://vite.dev/)
- [Capacitor](https://capacitorjs.com/docs)
- [Vant 4](https://vant-ui.github.io/vant/)

---

## 十三、许可证

**Private**（私有项目）。
