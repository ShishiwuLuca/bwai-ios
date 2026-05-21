# BWAI H5 (Fundex Community)

Simplified Chinese: [README.md](./README.md)

**BWAI** (Capacitor app id `com.bwai.io`) is a **mobile-first H5 + native shell** project built with **Vue 3**, **Vite**, **TypeScript**, and **Capacitor 8**. It ships as a website or as **Android / iOS** apps.

This workspace (`fundex`) is a **community + account** slice: feed and profile are in scope; **no WebSocket** push, and no wallet / invest / team UI (some `src/service/` clients remain for future use).

---

## 1. Product features

### 1.1 Bottom navigation (`AppTabBar`)

| Tab       | Route       | Description                          |
| --------- | ----------- | ------------------------------------ |
| Community | `/`         | Feed, banners, categories (`keepAlive`) |
| Mine      | `/Personal` | Profile, security, language, notices |

`/Community` redirects to `/`.

### 1.2 Account

- Login, register, forgot password; email / phone verification
- `meta.requiresAuth` → redirect to `/Login` when logged out

### 1.3 Community & content

- `/`, `/MyCommunity`, `/MyMessage`, `/PublishPost`, `/PostDetail`, `/Report`
- `/Notice`, `/Notice/Detail`, `/ArticleDetail`

### 1.4 Settings

- `/SecuritySettings`, `/UserBenefits`, `/UpgradeUserInfo`, `/Terms`

### 1.5 Shell & globals

- Light/dark theme, i18n (~39 locales), RTL
- Updates via **HTTP version check**, Capgo OTA, store / APK flows (**not** WebSocket push)
- App icon badge, startup telemetry, `EmptyView` 404

---

## 2. Tech stack

Vue 3, Vue Router 5, Pinia, Vant 4, UnoCSS, Less, Vite, TypeScript, Axios, vue-i18n.

---

## 3. Quick start

```bash
pnpm install
pnpm dev
```

```bash
pnpm type-check
pnpm build
```

---

## 4. Environment variables

See `.env.development`, `.env.production`, `.env.app`, etc.

| Variable | Purpose |
| --- | --- |
| `VITE_GLOB_API_URL` / `VITE_GLOB_API_URL_PREFIX` | API base / prefix |
| `VITE_GLOB_PROXY` | Dev proxy for `/app-api` |
| `VITE_GLOB_SYSTEM_VERSION` | Asset / header version |
| `VITE_BUILD_COMPRESS` | Use `none` for Capacitor bundles |

---

## 5. License

**Private**.
