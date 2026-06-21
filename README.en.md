# BWAI H5

Simplified Chinese: [README.md](./README.md)

**BWAI** (Capacitor app id `com.bwai.io`) is a **mobile-first, multilingual** finance and community **H5 + native shell** project built with **Vue 3**, **Vite**, **TypeScript**, and **Capacitor 8**. It ships as a website or as **Android / iOS** apps. Features include wallet and on-chain flows, **AI** and **classic** investing, community, team, daily tasks, **OTA updates (Capgo)**, **store update checks**, **dual WebSocket channels** (market + member push), and a **native HTTP bridge**.

---

## 1. Product features

### 1.1 Bottom navigation (`AppTabBar`)

| Tab       | Route        | Description                                                      |
| --------- | ------------ | ---------------------------------------------------------------- |
| Home      | `/`          | Market, announcements, shortcuts (`Home`, `keepAlive`)           |
| Community | `/Community` | Feed and community entry                                         |
| AI        | `/AIInvest`  | AI product list                                                    |
| Team      | `/Team`      | Team stats, invites, rewards                                       |
| Mine      | `/Personal`  | Profile hub                                                      |

### 1.2 Account

- Login, register, forgot password; email / phone verification
- `meta.requiresAuth` guards; withdraw checks **fund password** with dialog if missing

### 1.3 AI investment

- `/AIInvest`, `/AIBuy`, `/MyOrder`, `/OrderDetails` (redeem, earnings, reinvest, …)

### 1.4 Classic investment

- `/Invest`, `/Invest/Join`; overlapping order routes with AI — **first match in `src/router/index.ts` wins** (today **AI `/MyOrder`**)

### 1.5 Wallet

- `/Wallet`, recharge / withdraw / transfer, address book, fund password, withdraw verify, transaction history

### 1.6 Team & rank

- `/Team`, `/Rank`, reward detail routes

### 1.7 Daily tasks

- `/DailyTask`, `/SalaryDetail`, `/Task/2`, `/Task/3`

### 1.8 Community & content

- Community, posts, notices, announcements, `/ArticleDetail`, `/About`
- **`/Download`**: app landing copy plus **iOS Safari “Add to Home Screen”** hints (`str_app_download_safari_tips_1`, many locales)

### 1.9 Settings & security

- Security hub, bind phone/email, passwords, profile, Google Authenticator, invite, benefits, terms

### 1.10 Shell & globals (`App.vue`, `main.ts`, `nativeAppShell`, …)

- **Theming**: light/dark, Vant `ConfigProvider`, Less tokens; status bar + **SystemBars** safe-area (`viewport-fit=cover`)
- **Layout**: **rem** root font scaling in `index.html` for responsive mobile layout
- **i18n**: `LocaleModal`; **~39** JSON locales under `src/locales/lang/` plus Vant locales; optional RTL
- **Updates**: `CheckUpdates`, `AppUpdateDialog`; server version check, Capgo OTA, store updates, Android APK sideload (see §3)
- **WebSocket**: default + `member` channel; empty token when logged out (see `App.vue`)
- **Badge**, **startup telemetry**, **404** / `EmptyView`

---

## 2. UI highlights

| Area | Notes |
| --- | --- |
| Components | **Vant 4** forms, dialogs, lists, progress; `@vant/touch-emulator` for desktop |
| Navigation | `NavBar`, `AppTabBar`, `keepAlive` where configured |
| Look & feel | Dark-first shell aligned with splash / WebView background; UnoCSS + Less |
| Splash | Auto-hide off until the web layer calls `hideSplashScreenIfNative` |
| Download | Platform-specific copy; iOS Safari PWA install tip string |

---

## 3. Updates & APK policy (`src/utils/appUpdate.ts`, native)

| Kind | Summary |
| --- | --- |
| **OTA** | Zip URL → `CapacitorUpdater.download` / `set`. **Other bundles are deleted only after a successful `set` event** (`initAppUpdateInstallLifecycleListeners`), so a failed `set` does not wipe the previous bundle. Android may use `scheduleProcessExit` before `set`; user cold-starts again. |
| **APK** | Prefer **`PackageInstaller.Session`**; fallback **Intent**. Cache skip: **URL basename** (last path segment, `.apk`) must **exactly match** a file under `Directory.Data`; otherwise version-based names (`apk_cached_package_*`, …) when the URL has no usable filename. |
| **When to delete APK** | **Session**: `PackageInstaller.STATUS_SUCCESS` (`status === 0`) via `apkInstallSessionResult`. **Intent**: **`MainActivity` + `ActivityResultLauncher`**; after the system installer returns, treat **success** if `RESULT_OK` **or** `versionCode` increased, then fire **`apkInstallIntentResult`** so JS deletes the file—avoids “package missing” if the user stays on the install screen for a long time. |
| **Capgo** | `autoUpdate: false` in `capacitor.config.ts` (server-driven checks); `autoDeletePrevious` etc. can align with your backend. |

Custom plugin: **`BWAIAppControl`** (`BwaiAppControlPlugin.java`) — ROM layer info, `openApkInstaller`, `scheduleProcessExit`, install session / intent events.

---

## 4. Capacitor & native plugins

Web dir: `dist`. `capacitor.config.ts` enables **CapacitorHttp** (helps WebView ↔ API origin / CORS), splash, status bar, SystemBars, badge, Capgo updater, file transfer/filesystem, local notifications, etc.

| Package | Role |
| --- | --- |
| `@capacitor/core` / CLI | Core + tooling |
| `@capacitor/android` / iOS | Native shells |
| **CapacitorHttp** (`@capacitor/core`) | Native-backed fetch/XHR (`plugins.CapacitorHttp` in config) |
| `@capacitor/filesystem` / `file-transfer` | APK on disk + downloads |
| `@capawesome/capacitor-app-update` | Store update APIs |
| `@capgo/capacitor-updater` | Web OTA |
| `@capawesome/capacitor-badge` | Icon badge |
| Others | Browser, Device, Network, Share, Splash, StatusBar, File Opener, Local Notifications, … |

---

## 5. Frontend stack

Vue 3, Vue Router 5, Pinia, Vant 4, UnoCSS, Less, Vite, TypeScript, Vue I18n, Axios, ECharts, decimal.js, web3, mqtt, pinia-plugin-persistedstate, qrcode.vue, html2canvas, … (see `package.json`).

---

## 6. Vite plugins (`build/vite/plugin`)

Vue/JSX, setup-extend, mkcert, UnoCSS, environment inject, legacy, html inject, VantResolver, visualizer, **vite-plugin-compression** (`.gz` / `.br` **sidecars** for nginx-style hosts; **Capacitor bundles should use `VITE_BUILD_COMPRESS=none`** in `.env.app`), dev `static-file-plugin` for `public/luckeywheel/`.

Post-build: `postBuild.ts`, `zipOta.ts`, `buildAndroid.ts`; `vite.config.ts` uses manual chunks + timestamped asset names to reduce WebView CSS/asset path issues.

---

## 7. Repository layout (short)

```
android/, ios/          # Capacitor + BWAIAppControl, install callbacks, …
build/                  # Vite plugins, proxy, scripts
public/
scripts/
src/                    # assets, components, design, hooks, locales, router, service, stores, utils, views, App.vue, main.ts
types/
capacitor.config.ts, vite.config.ts, uno.config.ts
pnpm-workspace.yaml, package.json
```

---

## 8. Requirements

- **Node.js**: `^20.19.0` or `>=22.12.0` (`engines`)
- **pnpm**: match `packageManager`

---

## 9. Quick start

```bash
pnpm install
pnpm dev
```

```bash
pnpm type-check
pnpm build
pnpm build:test
pnpm preview
```

---

## 10. npm scripts

| Script | Description |
| --- | --- |
| `pnpm cap:sync` | Sync web build into native projects |
| `pnpm cap:android` / `pnpm cap:ios` | Sync + open IDE |
| `pnpm build:cap` | `pnpm build` + `cap sync` |
| `pnpm build:ota` | App-mode build + OTA zip |
| `pnpm build:android` / `:release` | Build + sync + Gradle debug/release |
| `pnpm lint` / `pnpm format` | oxlint + eslint / Prettier |
| `pnpm android:compile` | `:app:compileDebugJavaWithJavac` helper |

---

## 11. Environment variables

`.env`, `.env.development`, `.env.production`, `.env.test`, `.env.app`, … — `wrapperEnv` parses values.

| Variable | Meaning |
| --- | --- |
| `VITE_PUBLIC_PATH` | Base path |
| `VITE_GLOB_APP_TITLE` | HTML title inject |
| `VITE_GLOB_SYSTEM_VERSION` | Bundle version (filenames, OTA, headers) |
| API / upload / proxy / encrypt keys | See `src/utils/env.ts` |
| `VITE_BUILD_COMPRESS` | `gzip` / `brotli` / `none` — **prefer `none` for in-app bundles** |

Runtime overrides may come from `window` (see `env.ts`).

---

## 12. Locales & quality

- Use `zh_CN.json` as a key reference; helper scripts under `scripts/`.
- `pnpm lint`, `pnpm format`

---

## 13. References

- [Vite](https://vite.dev/) · [Capacitor](https://capacitorjs.com/docs) · [Vant 4](https://vant-ui.github.io/vant/) · [Vue Router](https://router.vuejs.org/) · [UnoCSS](https://unocss.dev/)

---

## 14. License

**Private** — no open-source license declared.
