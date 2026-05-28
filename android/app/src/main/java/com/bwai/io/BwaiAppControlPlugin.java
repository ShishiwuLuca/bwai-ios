package com.bwai.io;

import android.app.Activity;
import android.app.PendingIntent;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInstaller;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import androidx.activity.result.ActivityResultLauncher;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.lang.reflect.Method;
import java.util.List;
import java.util.Locale;

/**
 * 安装包：{@link #openApkInstaller} 优先 {@link PackageInstaller.Session}（避免
 * Play Verify 对第三方 content 路径报 {@code DOWNLOAD_FILE_NOT_FOUND}），失败则回退 Intent。
 */
@CapacitorPlugin(name = "BWAIAppControl")
public class BwaiAppControlPlugin extends Plugin {

    private static final String APK_MIME = "application/vnd.android.package-archive";

    /** Set in {@link #load()}, cleared in {@link #handleOnDestroy()} for {@link BwaiInstallSessionReceiver}. */
    private static volatile BwaiAppControlPlugin instance;

    /** 由 {@link MainActivity} 注册，用于 Intent 安装返回后判断是否可删本地 APK */
    private static volatile ActivityResultLauncher<Intent> apkInstallIntentLauncher;

    /** 与 {@link #onApkInstallIntentActivityResult} 配对：安装前记录，返回后清空 */
    private static volatile String pendingIntentApkAbsolutePath;

    private static volatile long pendingIntentApkVersionCodeBefore = -1L;

    @Override
    public void load() {
        instance = this;
    }

    /** {@link MainActivity#onCreate} 中调用，早于可能发起的 Intent 安装 */
    public static void attachApkInstallIntentLauncher(ActivityResultLauncher<Intent> launcher) {
        apkInstallIntentLauncher = launcher;
    }

    /**
     * Intent 安装界面关闭后回调：{@link Activity#RESULT_OK} 或 versionCode 上升视为成功，再通知 JS 删包。
     */
    public static void onApkInstallIntentActivityResult(int resultCode, Intent data) {
        final String path = pendingIntentApkAbsolutePath;
        final long verBefore = pendingIntentApkVersionCodeBefore;
        pendingIntentApkAbsolutePath = null;
        pendingIntentApkVersionCodeBefore = -1L;

        final BwaiAppControlPlugin p = instance;
        final Activity act = p != null ? p.getActivity() : null;

        boolean success = (resultCode == Activity.RESULT_OK);
        if (!success && act != null && verBefore >= 0) {
            try {
                long verAfter =
                    act.getPackageManager()
                        .getPackageInfo(act.getPackageName(), 0)
                        .getLongVersionCode();
                if (verAfter > verBefore) {
                    success = true;
                }
            } catch (Exception ignored) {
            }
        }
        if (!success) {
            return;
        }
        if (path == null || path.isEmpty()) {
            return;
        }

        File f = new File(path);
        String fileName = f.getName();
        if (fileName.isEmpty()) {
            return;
        }

        if (p == null || p.bridge == null) {
            return;
        }
        final String fn = fileName;
        p.execute(
            () -> {
                BwaiAppControlPlugin plug = instance;
                if (plug == null) {
                    return;
                }
                JSObject o = new JSObject();
                o.put("ok", true);
                o.put("fileName", fn);
                plug.notifyListeners("apkInstallIntentResult", o);
            });
    }

    @Override
    protected void handleOnDestroy() {
        if (instance == this) {
            instance = null;
        }
    }

    /**
     * Forwards {@link PackageInstaller.Session} terminal status to JS ({@code apkInstallSessionResult})，
     * 含 {@link PackageInstaller#STATUS_SUCCESS}（便于 JS 在确认安装完成后再删本地 APK）。
     */
    public static void emitApkInstallSessionResult(int status, String packageName, String message) {
        final BwaiAppControlPlugin p = instance;
        if (p == null || p.bridge == null) {
            return;
        }
        p.execute(
            () -> {
                BwaiAppControlPlugin plug = instance;
                if (plug == null) {
                    return;
                }
                JSObject data = new JSObject();
                data.put("status", status);
                if (packageName != null) {
                    data.put("packageName", packageName);
                }
                if (message != null) {
                    data.put("message", message);
                }
                plug.notifyListeners("apkInstallSessionResult", data);
            });
    }

    /** 读取 {@code android.os.SystemProperties}（隐藏 API，反射失败时返回默认值）。 */
    private static String getSystemProperty(String key, String def) {
        try {
            Class<?> c = Class.forName("android.os.SystemProperties");
            Method get = c.getMethod("get", String.class, String.class);
            Object v = get.invoke(null, key, def);
            return v != null ? String.valueOf(v).trim() : def;
        } catch (Throwable ignored) {
            return def;
        }
    }

    /**
     * 定制系统 UI 名称与版本：覆盖全球主流厂商皮肤（含反射读 SystemProperties；无匹配时返回空串）。
     */
    @PluginMethod
    public void getDeviceRomLayer(PluginCall call) {
        String manufacturer = Build.MANUFACTURER != null ? Build.MANUFACTURER.toLowerCase(Locale.US) : "";
        String brand = Build.BRAND != null ? Build.BRAND.toLowerCase(Locale.US) : "";
        String model = Build.MODEL != null ? Build.MODEL.toUpperCase(Locale.US) : "";
        String device = Build.DEVICE != null ? Build.DEVICE.toUpperCase(Locale.US) : "";
        String display = Build.DISPLAY != null ? Build.DISPLAY : "";
        String incremental = Build.VERSION.INCREMENTAL != null ? Build.VERSION.INCREMENTAL : "";

        String uiName = "";
        String uiVer = "";

        // ---------- Xiaomi / Redmi / POCO ----------
        String miOs = getSystemProperty("ro.mi.os.version.name", "");
        if (!miOs.isEmpty()) {
            uiName = "HyperOS";
            uiVer = miOs;
        } else {
            String miui = getSystemProperty("ro.miui.ui.version.name", "");
            if (!miui.isEmpty()) {
                uiName = "MIUI";
                uiVer = incremental.isEmpty() ? miui : miui + " (" + incremental + ")";
            }
        }

        // ---------- Huawei / Honor：HarmonyOS ----------
        if (uiName.isEmpty()) {
            String harmony = getSystemProperty("ro.build.version.harmonyos", "");
            String hl = getSystemProperty("ro.comp.hl.version", "");
            if (!harmony.isEmpty() || !hl.isEmpty()) {
                uiName = "HarmonyOS";
                uiVer = !hl.isEmpty() ? hl : harmony;
            }
        }

        // ---------- Honor：MagicOS（独立属性优先，否则看 display） ----------
        if (uiName.isEmpty() && (manufacturer.contains("honor") || brand.contains("honor"))) {
            String magicProp =
                firstNonEmpty(
                    getSystemProperty("ro.build.version.magic", ""),
                    getSystemProperty("ro.build.magic.version", ""));
            if (!magicProp.isEmpty()) {
                uiName = "MagicOS";
                uiVer = magicProp;
            } else if (display.toUpperCase(Locale.US).contains("MAGICOS")) {
                uiName = "MagicOS";
                uiVer = display;
            }
        }

        // ---------- Huawei：EMUI（非 Harmony 的华为安卓） ----------
        if (uiName.isEmpty()) {
            String emui = getSystemProperty("ro.build.version.emui", "");
            if (!emui.isEmpty()) {
                uiName = "EMUI";
                uiVer = emui;
            }
        }

        // ---------- OnePlus 旧版：OxygenOS（优先于 ColorOS 属性并存场景） ----------
        if (uiName.isEmpty()) {
            String oxygen = getSystemProperty("ro.oxygen.version", "");
            if (!oxygen.isEmpty()) {
                uiName = "OxygenOS";
                uiVer = oxygen;
            }
        }

        // ---------- OPPO / OnePlus / Realme（ColorOS 系） ----------
        if (uiName.isEmpty()) {
            String op = getSystemProperty("ro.build.version.oplusrom", "");
            if (!op.isEmpty()) {
                uiName = "ColorOS";
                uiVer = op;
            }
        }

        if (uiName.isEmpty()) {
            String realme = getSystemProperty("ro.build.version.realmeui", "");
            if (!realme.isEmpty()) {
                uiName = "realme UI";
                uiVer = realme;
            }
        }

        // ---------- vivo / iQOO ----------
        if (uiName.isEmpty()) {
            String vivoName = getSystemProperty("ro.vivo.os.name", "");
            String vivoVer = getSystemProperty("ro.vivo.os.version", "");
            String vivoDisplay = getSystemProperty("ro.vivo.os.build.display.id", "");
            if (!vivoVer.isEmpty() || !vivoDisplay.isEmpty() || !vivoName.isEmpty()) {
                String lowName = vivoName.toLowerCase(Locale.US);
                String lowDisp = vivoDisplay.toLowerCase(Locale.US);
                if (lowName.contains("origin") || lowDisp.contains("origin")) {
                    uiName = "OriginOS";
                } else if (!vivoName.isEmpty()) {
                    uiName = vivoName;
                } else {
                    uiName = "Funtouch OS";
                }
                uiVer = !vivoVer.isEmpty() ? vivoVer : vivoDisplay;
            }
        }

        // ---------- Samsung ----------
        if (uiName.isEmpty()) {
            String oneui = getSystemProperty("ro.build.version.oneui", "");
            if (!oneui.isEmpty()) {
                uiName = "One UI";
                uiVer = oneui;
            }
        }
        if (uiName.isEmpty() && (manufacturer.contains("samsung") || brand.contains("samsung"))) {
            String sem = getSystemProperty("ro.build.version.sem", "");
            if (!sem.isEmpty()) {
                uiName = "One UI";
                uiVer = sem;
            }
        }

        // ---------- Nothing ----------
        if (uiName.isEmpty()) {
            String nothingVer =
                firstNonEmpty(
                    getSystemProperty("ro.nothing.version", ""),
                    getSystemProperty("ro.boot.nothing", ""),
                    getSystemProperty("ro.nothing.build.id", ""));
            if (!nothingVer.isEmpty() || manufacturer.contains("nothing") || brand.contains("nothing")) {
                uiName = "Nothing OS";
                uiVer = !nothingVer.isEmpty() ? nothingVer : (display.isEmpty() ? incremental : display);
            }
        }

        // ---------- Motorola ----------
        if (uiName.isEmpty() && (manufacturer.contains("motorola") || brand.contains("motorola") || brand.contains("moto"))) {
            String motDisp = getSystemProperty("ro.product.display", "");
            uiName = "My UX";
            uiVer = firstNonEmpty(motDisp, display, incremental);
        }

        // ---------- Transsion：Tecno HiOS / Infinix XOS / itel ----------
        if (uiName.isEmpty()) {
            String tranVer = getSystemProperty("ro.tranos.version", "");
            if (!tranVer.isEmpty()
                && (manufacturer.contains("tecno")
                    || manufacturer.contains("infinix")
                    || manufacturer.contains("itel"))) {
                if (manufacturer.contains("infinix")) {
                    uiName = "XOS";
                } else if (manufacturer.contains("itel")) {
                    uiName = "itel OS";
                } else {
                    uiName = "HiOS";
                }
                uiVer = tranVer;
            }
        }

        // ---------- Sony ----------
        if (uiName.isEmpty() && manufacturer.contains("sony")) {
            String swRev = getSystemProperty("ro.semc.version.sw_revision", "");
            String sw = getSystemProperty("ro.semc.version.sw", "");
            if (!swRev.isEmpty() || !sw.isEmpty()) {
                uiName = "Xperia UI";
                uiVer = firstNonEmpty(swRev, sw, incremental);
            }
        }

        // ---------- ASUS（Zenfone ZenUI / ROG ROG UI） ----------
        if (uiName.isEmpty() && manufacturer.contains("asus")) {
            String asusVer = getSystemProperty("ro.build.asus.version", "");
            if (!asusVer.isEmpty()) {
                boolean rog =
                    model.contains("ROG")
                        || model.contains("ZS6")
                        || device.contains("ASUS_AI")
                        || device.contains("ROG");
                uiName = rog ? "ROG UI" : "ZenUI";
                uiVer = asusVer;
            }
        }

        // ---------- Lenovo ZUI ----------
        if (uiName.isEmpty()) {
            String zui = firstNonEmpty(getSystemProperty("ro.zui.version", ""), getSystemProperty("ro.com.zui.version", ""));
            if (!zui.isEmpty() || manufacturer.contains("lenovo")) {
                if (!zui.isEmpty()) {
                    uiName = "ZUI";
                    uiVer = zui;
                } else if (manufacturer.contains("lenovo")) {
                    uiName = "ZUI";
                    uiVer = firstNonEmpty(display, incremental);
                }
            }
        }

        // ---------- ZTE MiFavor / MyOS ----------
        if (uiName.isEmpty()) {
            String mifavor = getSystemProperty("ro.build.MiFavor_version", "");
            if (!mifavor.isEmpty()) {
                uiName = "MiFavor";
                uiVer = mifavor;
            } else if ((manufacturer.contains("zte") || brand.contains("zte"))
                && display.toUpperCase(Locale.US).contains("MYOS")) {
                uiName = "MyOS";
                uiVer = firstNonEmpty(display, incremental);
            } else {
                String zteSoft = getSystemProperty("ro.vendor.build.software.version", "");
                if (!zteSoft.isEmpty() && (manufacturer.contains("zte") || brand.contains("zte"))) {
                    uiName = "MiFavor";
                    uiVer = zteSoft;
                }
            }
        }

        // ---------- Nubia / RedMagic ----------
        if (uiName.isEmpty()) {
            String nubiaRom =
                firstNonEmpty(
                    getSystemProperty("ro.build.nubia.rom.version", ""),
                    getSystemProperty("ro.redmagic.os.version", ""),
                    getSystemProperty("ro.build.nubia.rom.code", ""));
            String modelCompact = model.replace(" ", "");
            boolean nubiaFamily =
                manufacturer.contains("nubia")
                    || brand.contains("nubia")
                    || brand.contains("redmagic")
                    || modelCompact.contains("REDMAGIC");
            if (!nubiaRom.isEmpty() || nubiaFamily) {
                boolean redMagicUi =
                    brand.contains("redmagic")
                        || modelCompact.contains("REDMAGIC")
                        || !getSystemProperty("ro.redmagic.os.version", "").isEmpty();
                uiName = redMagicUi ? "RedMagic OS" : "Nubia UI";
                uiVer = !nubiaRom.isEmpty() ? nubiaRom : firstNonEmpty(display, incremental);
            }
        }

        // ---------- Amazon Fire OS ----------
        if (uiName.isEmpty()) {
            String fire = getSystemProperty("ro.build.version.fireos", "");
            if (!fire.isEmpty() || manufacturer.contains("amazon")) {
                if (!fire.isEmpty()) {
                    uiName = "Fire OS";
                    uiVer = fire;
                } else if (manufacturer.contains("amazon")) {
                    uiName = "Fire OS";
                    uiVer = firstNonEmpty(display, incremental);
                }
            }
        }

        // ---------- Sharp AQUOS / TCL（日韩及新兴市场常见） ----------
        if (uiName.isEmpty()) {
            String sharpVer = getSystemProperty("ro.sharp.version", "");
            if (!sharpVer.isEmpty() || manufacturer.contains("sharp")) {
                uiName = "AQUOS UI";
                uiVer = !sharpVer.isEmpty() ? sharpVer : firstNonEmpty(display, incremental);
            }
        }
        if (uiName.isEmpty()) {
            String tclVer = getSystemProperty("ro.tcl.version", "");
            if (!tclVer.isEmpty() || manufacturer.contains("tcl")) {
                uiName = "TCL UI";
                uiVer = !tclVer.isEmpty() ? tclVer : firstNonEmpty(display, incremental);
            }
        }

        // ---------- Google Pixel（类原生 / Pixel Feature Drop 口径） ----------
        if (uiName.isEmpty() && (manufacturer.contains("google") || brand.contains("google"))) {
            uiName = "Pixel UI";
            uiVer = firstNonEmpty(
                getSystemProperty("ro.build.id", ""),
                incremental,
                display);
        }

        // ---------- LG / HTC（存量机） ----------
        if (uiName.isEmpty()) {
            String lge = firstNonEmpty(getSystemProperty("sys.lge.swversion", ""), getSystemProperty("ro.lge.swversion", ""));
            if (!lge.isEmpty() || manufacturer.contains("lge") || manufacturer.contains("lg")) {
                uiName = "LG UX";
                uiVer = !lge.isEmpty() ? lge : firstNonEmpty(display, incremental);
            }
        }
        if (uiName.isEmpty()) {
            String sense = getSystemProperty("ro.build.sense.version", "");
            if (!sense.isEmpty() || manufacturer.contains("htc")) {
                if (!sense.isEmpty()) {
                    uiName = "HTC Sense";
                    uiVer = sense;
                } else if (manufacturer.contains("htc")) {
                    uiName = "HTC Sense";
                    uiVer = firstNonEmpty(display, incremental);
                }
            }
        }

        // ---------- 第三方 ROM（Lineage / Calyx 等） ----------
        if (uiName.isEmpty()) {
            String lineage = getSystemProperty("ro.lineage.version", "");
            if (!lineage.isEmpty()) {
                uiName = "LineageOS";
                uiVer = lineage;
            }
        }
        if (uiName.isEmpty()) {
            String calyx = getSystemProperty("ro.calyxos.version", "");
            if (!calyx.isEmpty()) {
                uiName = "CalyxOS";
                uiVer = calyx;
            }
        }

        // ---------- Meizu Flyme ----------
        if (uiName.isEmpty()) {
            String flyme = getSystemProperty("ro.build.display.id", "");
            if (manufacturer.contains("meizu") && flyme.toLowerCase(Locale.US).contains("flyme")) {
                uiName = "Flyme";
                uiVer = flyme;
            }
        }

        JSObject ret = new JSObject();
        ret.put("system_ui_name", uiName);
        ret.put("ui_version", uiVer);
        call.resolve(ret);
    }

    /** 返回首个非空字符串（trim 后）。 */
    private static String firstNonEmpty(String a, String b) {
        if (a != null && !a.trim().isEmpty()) {
            return a.trim();
        }
        if (b != null && !b.trim().isEmpty()) {
            return b.trim();
        }
        return "";
    }

    private static String firstNonEmpty(String a, String b, String c) {
        String ab = firstNonEmpty(a, b);
        return !ab.isEmpty() ? ab : (c != null && !c.trim().isEmpty() ? c.trim() : "");
    }

    private static List<ResolveInfo> queryMatches(PackageManager pm, Intent intent) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            return pm.queryIntentActivities(
                intent, PackageManager.ResolveInfoFlags.of(PackageManager.MATCH_DEFAULT_ONLY));
        }
        return pm.queryIntentActivities(intent, PackageManager.MATCH_DEFAULT_ONLY);
    }

    private static void grantUriToResolvers(Activity activity, List<ResolveInfo> matches, Uri apkUri) {
        if (matches == null) {
            return;
        }
        for (ResolveInfo ri : matches) {
            activity.grantUriPermission(ri.activityInfo.packageName, apkUri, Intent.FLAG_GRANT_READ_URI_PERMISSION);
        }
    }

    private static void grantUriToApkScanners(Activity activity, Uri apkUri) {
        String[] scannerPackages =
            new String[] {
                "com.android.vending",
                "com.google.android.finsky",
                "com.google.android.packageinstaller",
                "com.google.android.apps.packageinstaller",
                "com.samsung.android.packageinstaller",
                "com.miui.packageinstaller",
                "com.huawei.appmarket",
                "com.google.android.gms"
            };
        for (String pkg : scannerPackages) {
            try {
                activity.grantUriPermission(pkg, apkUri, Intent.FLAG_GRANT_READ_URI_PERMISSION);
            } catch (SecurityException | IllegalArgumentException ignored) {
            }
        }
    }

    /** 本地磁盘上的 APK（非 content://）。 */
    private static File parseLocalApkFile(String rawPath) {
        if (rawPath == null || rawPath.isEmpty()) {
            throw new IllegalArgumentException("filePath is empty");
        }
        String trimmed = rawPath.trim();
        if (trimmed.startsWith("content://")) {
            throw new IllegalArgumentException("content uri not supported for local parse");
        }
        Uri parsed = Uri.parse(trimmed);
        File file;
        if ("file".equals(parsed.getScheme())) {
            String p = parsed.getPath();
            if (p == null || p.isEmpty()) {
                throw new IllegalArgumentException("invalid file URI");
            }
            file = new File(p);
        } else if (parsed.getScheme() == null || parsed.getScheme().isEmpty()) {
            file = new File(trimmed);
        } else {
            throw new IllegalArgumentException("unsupported file path scheme");
        }
        if (!file.isFile()) {
            throw new IllegalArgumentException("APK file not found: " + file.getAbsolutePath());
        }
        String name = file.getName().toLowerCase();
        if (!name.endsWith(".apk")) {
            throw new IllegalArgumentException("not an .apk file");
        }
        return file;
    }

    private static Uri resolveApkUri(Context ctx, String rawPath) {
        String trimmed = rawPath.trim();
        if (trimmed.startsWith("content://")) {
            return Uri.parse(trimmed);
        }
        File file = parseLocalApkFile(rawPath);
        String authority = ctx.getPackageName() + ".fileprovider";
        return FileProvider.getUriForFile(ctx, authority, file);
    }

    /**
     * 使用 {@link PackageInstaller.Session} 提交安装（推荐：整包覆盖安装不走 Finsky 的 download 路径解析）。
     *
     * @return true 表示已成功 {@link PackageInstaller.Session#commit}
     */
    private static boolean installApkWithPackageInstallerSession(Activity activity, File apkFile)
        throws IOException {
        PackageManager pm = activity.getPackageManager();
        PackageInstaller installer = pm.getPackageInstaller();
        PackageInstaller.SessionParams params =
            new PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            params.setRequireUserAction(PackageInstaller.SessionParams.USER_ACTION_REQUIRED);
        }

        int sessionId = installer.createSession(params);
        PackageInstaller.Session session = null;
        try {
            session = installer.openSession(sessionId);
            long length = apkFile.length();
            try (OutputStream out = session.openWrite("base.apk", 0, length);
                InputStream in = new FileInputStream(apkFile)) {
                byte[] buf = new byte[65536];
                int n;
                while ((n = in.read(buf)) != -1) {
                    out.write(buf, 0, n);
                }
                session.fsync(out);
            }

            Intent callback = new Intent(activity, BwaiInstallSessionReceiver.class);
            int piFlags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                piFlags |= PendingIntent.FLAG_MUTABLE;
            }
            PendingIntent pending = PendingIntent.getBroadcast(activity, sessionId, callback, piFlags);
            session.commit(pending.getIntentSender());
            session = null;
            return true;
        } finally {
            if (session != null) {
                try {
                    session.abandon();
                } catch (Exception ignored) {
                }
            }
        }
    }

    /**
     * @param absoluteApkPathForCleanup 本地 file 路径，用于返回成功后通知 JS 删除；{@code content://} 等可为 null
     */
    private static void launchInstallIntentWithOptionalResult(
            Activity activity,
            Intent intent,
            List<ResolveInfo> matches,
            Uri apkUri,
            String absoluteApkPathForCleanup) {
        grantUriToResolvers(activity, matches, apkUri);
        grantUriToApkScanners(activity, apkUri);
        if (apkInstallIntentLauncher != null) {
            try {
                pendingIntentApkVersionCodeBefore =
                    activity.getPackageManager()
                        .getPackageInfo(activity.getPackageName(), 0)
                        .getLongVersionCode();
            } catch (Exception e) {
                pendingIntentApkVersionCodeBefore = -1L;
            }
            pendingIntentApkAbsolutePath =
                (absoluteApkPathForCleanup != null && !absoluteApkPathForCleanup.trim().isEmpty())
                    ? absoluteApkPathForCleanup.trim()
                    : null;
            apkInstallIntentLauncher.launch(intent);
        } else {
            activity.startActivity(intent);
        }
    }

    private static void startIntentInstallFlow(
            Activity activity, Uri apkUri, PluginCall call, String absoluteApkPathForCleanup) {
        try {
            PackageManager pm = activity.getPackageManager();

            Intent install = new Intent(Intent.ACTION_INSTALL_PACKAGE);
            install.setData(apkUri);
            install.putExtra(Intent.EXTRA_NOT_UNKNOWN_SOURCE, true);
            install.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            install.setClipData(ClipData.newUri(activity.getContentResolver(), "apk", apkUri));

            List<ResolveInfo> installMatches = queryMatches(pm, install);
            if (installMatches != null && !installMatches.isEmpty()) {
                launchInstallIntentWithOptionalResult(
                    activity, install, installMatches, apkUri, absoluteApkPathForCleanup);
                JSObject out = new JSObject();
                out.put("ok", true);
                out.put("via", "intentInstallPackage");
                call.resolve(out);
                return;
            }

            Intent view = new Intent(Intent.ACTION_VIEW);
            view.setDataAndType(apkUri, APK_MIME);
            view.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            view.setClipData(ClipData.newUri(activity.getContentResolver(), "apk", apkUri));
            List<ResolveInfo> viewMatches = queryMatches(pm, view);
            if (viewMatches == null || viewMatches.isEmpty()) {
                call.reject("No application can handle APK install");
                return;
            }
            launchInstallIntentWithOptionalResult(
                activity, view, viewMatches, apkUri, absoluteApkPathForCleanup);
            JSObject out = new JSObject();
            out.put("ok", true);
            out.put("via", "intentViewApk");
            call.resolve(out);
        } catch (ActivityNotFoundException e) {
            call.reject("No application can perform this action", e);
        }
    }

    @PluginMethod
    public void openApkInstaller(PluginCall call) {
        String raw = call.getString("filePath");
        final Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity is null");
            return;
        }
        try {
            final Context appCtx = activity.getApplicationContext();
            final String rawPath = raw != null ? raw : "";
            final boolean isContent = rawPath.trim().startsWith("content://");

            activity.runOnUiThread(
                () -> {
                    try {
                        PackageManager pm = activity.getPackageManager();

                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                            && !pm.canRequestPackageInstalls()) {
                            Intent settings =
                                new Intent(
                                    Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                                    Uri.parse("package:" + activity.getPackageName()));
                            activity.startActivity(settings);
                            call.reject(
                                "install_blocked",
                                new SecurityException(
                                    "Allow install from this source in Settings, then try again"));
                            return;
                        }

                        if (!isContent) {
                            final File apkFile;
                            try {
                                apkFile = parseLocalApkFile(rawPath);
                            } catch (IllegalArgumentException e) {
                                call.reject(
                                    e.getMessage() != null ? e.getMessage() : "invalid filePath", e);
                                return;
                            }

                            new Thread(
                                    () -> {
                                        try {
                                            installApkWithPackageInstallerSession(activity, apkFile);
                                            new Handler(Looper.getMainLooper())
                                                .post(
                                                    () -> {
                                                        JSObject out = new JSObject();
                                                        out.put("ok", true);
                                                        out.put("via", "packageInstallerSession");
                                                        call.resolve(out);
                                                    });
                                        } catch (Throwable sessionErr) {
                                            try {
                                                final Uri apkUri = resolveApkUri(appCtx, rawPath);
                                                new Handler(Looper.getMainLooper())
                                                    .post(
                                                        () -> {
                                                            try {
                                                                startIntentInstallFlow(
                                                                    activity,
                                                                    apkUri,
                                                                    call,
                                                                    apkFile.getAbsolutePath());
                                                            } catch (Exception intentErr) {
                                                                call.reject(
                                                                    intentErr.getClass().getSimpleName()
                                                                        + ": "
                                                                        + intentErr.getMessage(),
                                                                    intentErr);
                                                            }
                                                        });
                                            } catch (IllegalArgumentException resolveErr) {
                                                new Handler(Looper.getMainLooper())
                                                    .post(
                                                        () ->
                                                            call.reject(
                                                                resolveErr.getMessage() != null
                                                                    ? resolveErr.getMessage()
                                                                    : "invalid filePath",
                                                                resolveErr));
                                            }
                                        }
                                    },
                                    "BwaiApkSessionInstall")
                                .start();
                            return;
                        }

                        Uri apkUri = resolveApkUri(appCtx, rawPath);
                        startIntentInstallFlow(activity, apkUri, call, null);
                    } catch (IllegalArgumentException e) {
                        call.reject(e.getMessage() != null ? e.getMessage() : "invalid filePath", e);
                    } catch (Exception e) {
                        call.reject(e.getClass().getSimpleName() + ": " + e.getMessage(), e);
                    }
                });
        } catch (IllegalArgumentException e) {
            call.reject(e.getMessage() != null ? e.getMessage() : "invalid filePath", e);
        }
    }

    @PluginMethod
    public void scheduleProcessExit(PluginCall call) {
        Integer delayArg = call.getInt("delayMs");
        int delayMs = delayArg != null ? delayArg : 2200;
        delayMs = Math.max(800, Math.min(delayMs, 15000));

        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity is null");
            return;
        }
        JSObject ok = new JSObject();
        ok.put("ok", true);
        call.resolve(ok);

        new Handler(Looper.getMainLooper())
            .postDelayed(
                () -> {
                    android.os.Process.killProcess(android.os.Process.myPid());
                    System.exit(0);
                },
                delayMs
            );
    }
}
