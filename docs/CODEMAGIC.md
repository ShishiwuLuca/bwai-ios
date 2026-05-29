# Codemagic 云打包 iOS（.ipa）

在 **Windows** 上开发，用 [Codemagic](https://codemagic.io/) 的 macOS 机构建 **BGAI**（显示名；包名 `com.bwai.io`）。构建成功后会 **自动上传至 App Store Connect / TestFlight**（见 `codemagic.yaml` 的 `publishing.app_store_connect`）；仍可从 **Artifacts** 下载 `.ipa` 备份。

---

## 零、每次 iOS 打包标准流程（开发机 / Cursor）

1. **提交并 push** 到 Codemagic 已连接的远程仓库（如 `origin/main`）。未 push 的代码不会参与云构建。
2. 打开 [Codemagic](https://codemagic.io/) → 本应用 → 工作流 **BWAI iOS Release (.ipa)** → 选择刚 push 的分支 → **Start new build**。
3. 等待构建与 post-processing（约 10～25 分钟）；在 Connect **TestFlight** 或 **Artifacts** 查看结果。

> Cursor Agent 规则：`.cursor/rules/ios-codemagic-build.mdc`（要求 iOS 打包时先 push，再提示使用 Codemagic）。

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
| `APP_STORE_APPLE_ID` | Connect 里应用的 **Apple ID**（纯数字）。CI 会读 ASC **最高营销版本**，与工程 `MARKETING_VERSION` 取较大值后 **patch +0.0.1**（如 `1.0.0`→`1.0.1`），并在该版本下 **Build +1**（见 `scripts/codemagic-set-ios-versions.sh`） |
| `publishing.email.recipients` | 改成你的邮箱，构建成功/失败会通知 |
| `publishing.app_store_connect` | 已开启：`submit_to_testflight: true`（自动上传并提交 Beta 审核）；`submit_to_app_store: false`（不自动提正式上架） |
| `beta_groups` | 可选：在 yaml 里取消注释并填写 Connect 里**外部测试组**的准确名称，Beta 审核通过后自动分发给该组 |
| 触发方式 | 默认在 Codemagic 网页 **Start new build** 手动触发；也可在 yaml 增加 `triggering` 绑定分支 push |

---

## 五、发起构建

1. 打开应用 → 选择工作流 **BWAI iOS Release (.ipa)**
2. 选择分支 → **Start new build**
3. 等待约 10～25 分钟（视队列与依赖安装而定）

成功后会自动进入 **post-processing**（不占用 build 分钟）：上传 `.ipa` 到 App Store Connect，并调用 `submit_to_testflight` 提交 **TestFlight Beta 审核**。可在 Connect → **TestFlight** 查看处理进度；Apple 处理构建通常需数分钟到半小时。

仍可在 **Artifacts** 下载 `build/ios/ipa/*.ipa` 作备份。

---

## 六、构建在做什么（与本地脚本对应）

| 步骤 | 命令 / 动作 |
| --- | --- |
| 安装依赖 | `pnpm install` |
| 前端生产包 | `pnpm run build-only:app`（`.env.app`） |
| 同步原生 | `npx cap sync ios` |
| 签名 | `fetch-signing-files` + `xcode-project use-profiles` |
| 版本号 | `scripts/codemagic-set-ios-versions.sh`（ASC 最高版本 patch +1 + Build +1） |
| 打 ipa | `xcode-project build-ipa`（工程 `ios/App/App.xcodeproj`，Scheme `App`） |

本地 Mac 仍可使用 `pnpm run build:ios:release`（输出到 `PackageIOS/`）；Codemagic 使用官方 CLI，产物路径为 `build/ios/ipa/`。

---

## 七、常见问题

### `Fetch signing files` 失败（exit 9 等）

- 检查 API Key 的 Issuer ID、Key ID、`.p8` 是否正确  
- Key 权限是否含 App Manager  
- Bundle ID `com.bwai.io` 是否已在 Developer 后台创建  

### `No matching profiles found for bundle identifier ... app_store`

`codemagic.yaml` 里配置了 **`ios_signing`**，但 **Codemagic → Code signing identities** 里没有上传匹配的 App Store 描述文件。

**处理：** 使用本仓库当前配置（已去掉 `ios_signing`，改由 `fetch-signing-files` 自动创建证书与描述文件）。若仍报错，请确认 Apple **Identifiers** 中已注册 **`com.bwai.io`**。

参考：[Codemagic Common iOS issues](https://docs.codemagic.io/troubleshooting/common-ios-issues/)

### `Cannot save Signing Certificates without certificate private key` / `409 ... already have a current Distribution certificate`

Apple 上已有 **Distribution 证书**（Xcode、其他 Mac 或历史 Codemagic 构建创建），但 Codemagic **没有对应私钥**。构建会尝试 `--create` 新证书，若账号已有 3 张分发证书则报 **409**。

**一次性配置（推荐，与当前 `codemagic.yaml` 一致）：**

1. **生成分发私钥**（本地任意终端，只做一次）：
   ```bash
   openssl genrsa 2048
   ```
   复制完整输出（含 `-----BEGIN RSA PRIVATE KEY-----` / `-----END RSA PRIVATE KEY-----`）。

2. **写入 Codemagic 安全变量（须归入变量组）**  
   Codemagic → 本应用 → **Environment variables** → **Add variable**  
   - **Variable name**：`CERTIFICATE_PRIVATE_KEY`  
   - **Value**：上一步 PEM 全文  
   - **Group**：`bwai-ios-release`（与 `codemagic.yaml` 里 `environment.groups` 一致）
   - 勾选 **Secret**（密钥标记）

   > **重要**：Codemagic 要求变量必须放在组里，且 yaml 中 `groups: - bwai-ios-release` 才会注入构建机。组名须与控制台完全一致。

3. **清理 Apple 旧证书（若报 409）**  
   打开 [Certificates](https://developer.apple.com/account/resources/certificates/list) → 撤销**不再使用**的 **Apple Distribution**（账号最多 3 张；保留仍在 Xcode/其他环境使用的证书）。

4. **Push 最新 `codemagic.yaml` 并重新 Start new build**  
   首次成功后会用 `CERTIFICATE_PRIVATE_KEY` 创建一张新 Distribution 证书；之后构建自动复用，无需再改私钥。

**备选：** Codemagic → **Code signing identities** → **iOS certificates** → **Generate certificate**（Distribution，API Key `bwai_asc`）→ 下载 `.p12` 并上传；此时需改 yaml 使用 `ios_signing` 引用证书，与当前 `fetch-signing-files` 流程不同。

### Build 号冲突（上传 Transporter 时报已存在）

在 `codemagic.yaml` 配置 `APP_STORE_APPLE_ID`，或每次构建前在 Xcode 工程里增大 **CURRENT_PROJECT_VERSION**（`ios/App/App.xcodeproj`）。

### 仓库未推送到 Git

Codemagic 只构建远程仓库代码。请先把项目 push 到 GitHub/GitLab 等，再在 Codemagic 连接。

---

## 八、TestFlight 与正式上架

### 自动上传 TestFlight（已配置）

1. 推送含最新 `codemagic.yaml` 的代码 → **Start new build**  
2. 主机构建完成后，在构建日志末尾查看 **post-processing** 是否成功  
3. 打开 [App Store Connect](https://appstoreconnect.apple.com/) → **TestFlight** → 等待构建「可供测试」  
4. **外部测试**：首次需在 Connect 里完成 Beta 版审核信息；若已在 yaml 配置 `beta_groups`，审核通过后会自动进入对应组  
5. 测试员通过 **TestFlight** App 或公开链接安装  

若 post-processing 失败，可仍从 Artifacts 下载 `.ipa`，用 **Transporter** 手动上传。

### 提交 App Store 正式审核

当前 **`submit_to_app_store: false`**，不会自动提审。正式上架仍在 Connect 里选择构建版本后手动提交，或将 yaml 中该项改为 `true`（慎用，会与 TestFlight 流程叠加）。

### post-processing 说明

- 上传与 `submit_to_testflight` 在**主构建结束后**异步执行，Codemagic 可能不单独推送 post-processing 状态，请查看构建日志或 Apple 邮件  
- 若 15 分钟内 Connect 未出现构建，post-processing 会超时；可改用手动 Transporter  
- 参考：[App Store Connect publishing](https://docs.codemagic.io/yaml-publishing/app-store-connect/)

---

## 参考

- [Codemagic iOS 签名](https://docs.codemagic.io/yaml-code-signing/signing-ios/)
- [Ionic / Capacitor on Codemagic](https://docs.codemagic.io/yaml-quick-start/building-an-ionic-app/)
- 本仓库 `package.json` → `build:ios:release`（本地 Mac）
