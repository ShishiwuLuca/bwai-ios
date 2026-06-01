# Codemagic 云打包 iOS（.ipa）

在 **Windows** 上开发，用 [Codemagic](https://codemagic.io/) 的 macOS 机构建 **BWAI**（包名 `com.bwai.io`）。构建成功后会 **自动上传至 App Store Connect / TestFlight**（见 `codemagic.yaml` 的 `publishing.app_store_connect`）；仍可从 **Artifacts** 下载 `.ipa` 备份。

---

## 每次 iOS 内测包标准流程（开发机 / Cursor）

1. **提交并 push** 到 Codemagic 已连接的远程仓库（如 `origin/main`）。未 push 的代码不会参与云构建。
2. 打开 [Codemagic](https://codemagic.io/) → 本应用 → 工作流 **BWAI iOS Release (.ipa)** → 选择刚 push 的分支 → **Start new build**。
3. 等待构建与 post-processing（约 10～25 分钟）；在 Connect **TestFlight** 或 **Artifacts** 查看结果。

---

## 必配项

1. App Store Connect 已创建应用，Bundle ID 为 `com.bwai.io`
2. Codemagic 已连接本仓库并可读取根目录 `codemagic.yaml`
3. Codemagic Team integrations 已配置 API Key，名称与 yaml 一致（默认 `bwai_asc`）
4. Codemagic Environment variables 已配置：
   - `CERTIFICATE_PRIVATE_KEY`（Secret）
   - 变量组：`bwai-ios-release`

---

## 触发后会自动执行

- `pnpm install --frozen-lockfile`
- `pnpm run build-only:app`
- `npx cap sync ios`
- `fetch-signing-files` + `xcode-project use-profiles`
- `scripts/codemagic-set-ios-versions.sh` 自动递增版本与 Build
- `xcode-project build-ipa`
- 上传 `build/ios/ipa/App.ipa` 到 TestFlight

---

## 常见问题

- **看不到最新代码**：未 push，Codemagic 只构建远程仓库代码。
- **签名失败**：检查 `CERTIFICATE_PRIVATE_KEY` 是否放在 `bwai-ios-release` 组并勾选 Secret。
- **上传冲突（build 已存在）**：确认 `APP_STORE_APPLE_ID` 填写正确，自动版本脚本可避免大多数冲突。
