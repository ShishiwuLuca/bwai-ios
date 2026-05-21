package com.bwai.io;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInstaller;
import android.os.Build;
import android.util.Log;

/**
 * {@link PackageInstaller.Session#commit} 的回调。
 * <p>
 * {@link PackageInstaller#STATUS_PENDING_USER_ACTION}（值为 -1）时必须在系统下发的确认 Intent 上调用
 * {@link Context#startActivity}，否则用户看不到安装确认界面。
 */
public class BwaiInstallSessionReceiver extends BroadcastReceiver {

    private static final String TAG = "BwaiInstall";

    /**
     * 少数 ROM 曾使用与 {@link Intent#EXTRA_INTENT} 不同的键；主路径必须用 {@link Intent#EXTRA_INTENT}
     * （即 {@code android.intent.extra.INTENT}），否则 {@code STATUS_PENDING_USER_ACTION} 下取到的 extra 为 null。
     */
    private static final String EXTRA_PENDING_INSTALL_INTENT_ALT = "android.content.pm.extra.INTENT";

    private static Intent readPendingUserActionIntent(Intent intent) {
        Intent primary = getParcelableExtraIntent(intent, Intent.EXTRA_INTENT);
        if (primary != null) {
            return primary;
        }
        return getParcelableExtraIntent(intent, EXTRA_PENDING_INSTALL_INTENT_ALT);
    }

    private static Intent getParcelableExtraIntent(Intent intent, String key) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            return intent.getParcelableExtra(key, Intent.class);
        }
        return getParcelableExtraLegacy(intent, key);
    }

    @SuppressWarnings("deprecation")
    private static Intent getParcelableExtraLegacy(Intent intent, String key) {
        return intent.getParcelableExtra(key);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        int status =
            intent.getIntExtra(PackageInstaller.EXTRA_STATUS, PackageInstaller.STATUS_FAILURE);
        String message = intent.getStringExtra(PackageInstaller.EXTRA_STATUS_MESSAGE);
        String packageName = intent.getStringExtra(PackageInstaller.EXTRA_PACKAGE_NAME);

        if (status == PackageInstaller.STATUS_PENDING_USER_ACTION) {
            Intent confirmIntent = readPendingUserActionIntent(intent);
            if (confirmIntent != null) {
                confirmIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(confirmIntent);
                Log.i(TAG, "launching install confirm UI (STATUS_PENDING_USER_ACTION)");
            } else {
                Log.w(TAG, "STATUS_PENDING_USER_ACTION but no confirm intent (checked Intent.EXTRA_INTENT)");
            }
            return;
        }

        if (status == PackageInstaller.STATUS_SUCCESS) {
            Log.i(TAG, "session success pkg=" + packageName);
            // 与失败分支一致通知 JS，便于在确认安装完成后再删本地 APK（避免用户久未点安装导致文件已删）
            BwaiAppControlPlugin.emitApkInstallSessionResult(
                PackageInstaller.STATUS_SUCCESS, packageName, null);
            return;
        }

        Log.w(TAG, "session finished status=" + status + " pkg=" + packageName + " msg=" + message);
        BwaiAppControlPlugin.emitApkInstallSessionResult(status, packageName, message);
    }
}
