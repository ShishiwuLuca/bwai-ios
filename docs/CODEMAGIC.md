# Codemagic 云打包 iOS（.ipa）

在 **Windows** 上开发，用 [Codemagic](https://codemagic.io/) 的 macOS 机构建 **BWAI**（`com.bwai.io`），构建结束后从控制台下载 `.ipa`，自行用 Transporter 上传 App Store。

---

## 一、Apple 侧（你已有开发者账号）

按顺序确认：

1. **Identifiers** 已创建 App ID：`com.bwai.io`
2. **App Store Connect** 已创建应用，Bundle ID 为 `com.bwai.io`
3. 创建 **App Store Connect API Key**（只需做一次）  
   - 路径：App Store Connect → **用户和访问** → **集成** → **App Store Connect API**  
   - 点击 **+**，权限建议 **App 管理器（App Manager）**  
   - 下载 **`.p8`**（只能下载一次）  
   - 记下 **Issuer ID**、**Key ID**

---

## 二、Codemagic 账号与仓库

1. 注册 / 登录 [codemagic.io](https://codemagic.io/)
2. **Applications** → **Add application**
3. 连接 Git 仓库（GitHub / GitLab / Bitbucket 等），选中本仓库
4. 项目类型选 **Other** 或 **Ionic/Capacitor** 均可
5. 确保仓库根目录已提交 **`codemagic.yaml`**（本仓库已包含）

首次可在分支列表点 **Check for configuration file**，选中含 `codemagic.yaml` 的分支。

---

## 三、配置 App Store Connect API Key（必做）

1. Codemagic → **Team settings** → **Team integrations** → **Developer Portal** → **Manage keys**
2. **Add key**：
   - **Key name（名称）**：填 **`bwai_asc`**（须与 `codemagic.yaml` 里 `integrations.app_store_connect` 一致；若改名，两处一起改）
   - **Issuer ID**、**Key ID**：来自 App Store Connect
   - 上传 **`.p8`** 文件
3. 保存

构建时会自动：`fetch-signing-files` → 生成/拉取证书与描述文件 → 打出 App Store 用 `.ipa`。

---

## 四、修改 `codemagic.yaml`（可选）

| 项 | 说明 |
| --- | --- |
| `integrations.app_store_connect` | 默认 `bwai_asc`，与上一步 Key 名称一致 |
| `APP_STORE_APPLE_ID` | 在 `environment.vars` 里取消注释并填 Connect 里应用的 **Apple ID**（纯数字），可自动在 TestFlight 最新 Build 号上 +1 |
| `publishing.email.recipients` | 改成你的邮箱，构建成功/失败会通知 |
| 触发方式 | 默认在 Codemagic 网页 **Start new build** 手动触发；也可在 yaml 增加 `triggering` 绑定分支 push |

---

## 五、发起构建

1. 打开应用 → 选择工作流 **BWAI iOS Release (.ipa)**
2. 选择分支 → **Start new build**
3. 等待约 10～25 分钟（视队列与依赖安装而定）

成功后在 **Artifacts** 下载：

- `build/ios/ipa/*.ipa`

即为可上传 App Store / TestFlight 的安装包。

---

## 六、构建在做什么（与本地脚本对应）

| 步骤 | 命令 / 动作 |
| --- | --- |
| 安装依赖 | `pnpm install` |
| 前端生产包 | `pnpm run build-only:app`（`.env.app`） |
| 同步原生 | `npx cap sync ios` |
| 签名 | `fetch-signing-files` + `xcode-project use-profiles` |
| 打 ipa | `xcode-project build-ipa`（工程 `ios/App/App.xcodeproj`，Scheme `App`） |

本地 Mac 仍可使用 `pnpm run build:ios:release`（输出到 `PackageIOS/`）；Codemagic 使用官方 CLI，产物路径为 `build/ios/ipa/`。

---

## 七、常见问题

### `Fetch signing files` 失败（exit 9 等）

- 检查 API Key 的 Issuer ID、Key ID、`.p8` 是否正确  
- Key 权限是否含 App Manager  
- Bundle ID `com.bwai.io` 是否已在 Developer 后台创建  

### 证书数量已满

Apple 分发证书上限 3 个。在 [Developer Certificates](https://developer.apple.com/account/resources/certificates/list) 删除旧 **Apple Distribution** 证书后重试，或在 Codemagic **Code signing identities** 上传已有 `.p12`。

### Build 号冲突（上传 Transporter 时报已存在）

在 `codemagic.yaml` 配置 `APP_STORE_APPLE_ID`，或每次构建前在 Xcode 工程里增大 **CURRENT_PROJECT_VERSION**（`ios/App/App.xcodeproj`）。

### 仓库未推送到 Git

Codemagic 只构建远程仓库代码。请先把项目 push 到 GitHub/GitLab 等，再在 Codemagic 连接。

---

## 八、你上传 App Store 时

1. Mac 安装 **Transporter**，登录与 API Key 同一团队账号  
2. 拖入 Codemagic 下载的 `.ipa`  
3. 在 App Store Connect 选择该构建 → 填元数据 → 提交审核  

Codemagic 的 `publishing.app_store_connect` 可配置自动上传；当前仓库**仅打 ipa**，上传由你自行完成。

---

## 参考

- [Codemagic iOS 签名](https://docs.codemagic.io/yaml-code-signing/signing-ios/)
- [Ionic / Capacitor on Codemagic](https://docs.codemagic.io/yaml-quick-start/building-an-ionic-app/)
- 本仓库 `package.json` → `build:ios:release`（本地 Mac）
