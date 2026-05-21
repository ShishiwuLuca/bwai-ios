package com.bwai.io;

import android.content.Intent;
import android.os.Bundle;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(BwaiAppControlPlugin.class);
        ActivityResultLauncher<Intent> apkInstallIntentLauncher =
            registerForActivityResult(
                new ActivityResultContracts.StartActivityForResult(),
                result ->
                    BwaiAppControlPlugin.onApkInstallIntentActivityResult(
                        result.getResultCode(), result.getData()));
        BwaiAppControlPlugin.attachApkInstallIntentLauncher(apkInstallIntentLauncher);
        super.onCreate(savedInstanceState);
    }
}
