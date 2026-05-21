// swift-tools-version: 5.9
import PackageDescription

// DO NOT MODIFY THIS FILE - managed by Capacitor CLI commands
let package = Package(
    name: "CapApp-SPM",
    platforms: [.iOS(.v15)],
    products: [
        .library(
            name: "CapApp-SPM",
            targets: ["CapApp-SPM"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", exact: "8.3.3"),
        .package(name: "CapacitorCommunityFileOpener", path: "../../../node_modules/.pnpm/@capacitor-community+file-opener@8.0.0_patch_hash=8913fb841bf0af98e66ef2dde20ea76873e7a_44057c9dc95d530593cdbde2bef27082/node_modules/@capacitor-community/file-opener"),
        .package(name: "CapacitorApp", path: "../../../node_modules/.pnpm/@capacitor+app@8.1.0_@capacitor+core@8.3.3/node_modules/@capacitor/app"),
        .package(name: "CapacitorAppLauncher", path: "../../../node_modules/.pnpm/@capacitor+app-launcher@8.0.1_@capacitor+core@8.3.3/node_modules/@capacitor/app-launcher"),
        .package(name: "CapacitorBrowser", path: "../../../node_modules/.pnpm/@capacitor+browser@8.0.3_@capacitor+core@8.3.3/node_modules/@capacitor/browser"),
        .package(name: "CapacitorDevice", path: "../../../node_modules/.pnpm/@capacitor+device@8.0.2_@capacitor+core@8.3.3/node_modules/@capacitor/device"),
        .package(name: "CapacitorFileTransfer", path: "../../../node_modules/.pnpm/@capacitor+file-transfer@2.0.4_patch_hash=7d0c06e457626082a04baa050bbcd45774d309c93ca62_64315c4e9ff68b6fa50c2c5d8007336a/node_modules/@capacitor/file-transfer"),
        .package(name: "CapacitorFilesystem", path: "../../../node_modules/.pnpm/@capacitor+filesystem@8.1.2_@capacitor+core@8.3.3/node_modules/@capacitor/filesystem"),
        .package(name: "CapacitorLocalNotifications", path: "../../../node_modules/.pnpm/@capacitor+local-notifications@8.1.0_@capacitor+core@8.3.3/node_modules/@capacitor/local-notifications"),
        .package(name: "CapacitorNetwork", path: "../../../node_modules/.pnpm/@capacitor+network@8.0.1_@capacitor+core@8.3.3/node_modules/@capacitor/network"),
        .package(name: "CapacitorShare", path: "../../../node_modules/.pnpm/@capacitor+share@8.0.1_@capacitor+core@8.3.3/node_modules/@capacitor/share"),
        .package(name: "CapacitorSplashScreen", path: "../../../node_modules/.pnpm/@capacitor+splash-screen@8.0.1_@capacitor+core@8.3.3/node_modules/@capacitor/splash-screen"),
        .package(name: "CapacitorStatusBar", path: "../../../node_modules/.pnpm/@capacitor+status-bar@8.0.2_@capacitor+core@8.3.3/node_modules/@capacitor/status-bar"),
        .package(name: "CapawesomeCapacitorAppUpdate", path: "../../../node_modules/.pnpm/@capawesome+capacitor-app-update@8.0.3_@capacitor+core@8.3.3/node_modules/@capawesome/capacitor-app-update"),
        .package(name: "CapawesomeCapacitorBadge", path: "../../../node_modules/.pnpm/@capawesome+capacitor-badge@8.0.2_@capacitor+core@8.3.3/node_modules/@capawesome/capacitor-badge"),
        .package(name: "CapgoCapacitorUpdater", path: "../../../node_modules/.pnpm/@capgo+capacitor-updater@8.45.11_@capacitor+core@8.3.3/node_modules/@capgo/capacitor-updater")
    ],
    targets: [
        .target(
            name: "CapApp-SPM",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm"),
                .product(name: "CapacitorCommunityFileOpener", package: "CapacitorCommunityFileOpener"),
                .product(name: "CapacitorApp", package: "CapacitorApp"),
                .product(name: "CapacitorAppLauncher", package: "CapacitorAppLauncher"),
                .product(name: "CapacitorBrowser", package: "CapacitorBrowser"),
                .product(name: "CapacitorDevice", package: "CapacitorDevice"),
                .product(name: "CapacitorFileTransfer", package: "CapacitorFileTransfer"),
                .product(name: "CapacitorFilesystem", package: "CapacitorFilesystem"),
                .product(name: "CapacitorLocalNotifications", package: "CapacitorLocalNotifications"),
                .product(name: "CapacitorNetwork", package: "CapacitorNetwork"),
                .product(name: "CapacitorShare", package: "CapacitorShare"),
                .product(name: "CapacitorSplashScreen", package: "CapacitorSplashScreen"),
                .product(name: "CapacitorStatusBar", package: "CapacitorStatusBar"),
                .product(name: "CapawesomeCapacitorAppUpdate", package: "CapawesomeCapacitorAppUpdate"),
                .product(name: "CapawesomeCapacitorBadge", package: "CapawesomeCapacitorBadge"),
                .product(name: "CapgoCapacitorUpdater", package: "CapgoCapacitorUpdater")
            ]
        )
    ]
)
