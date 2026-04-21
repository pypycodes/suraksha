package com.suraksha.safety;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private int powerClickCount = 0;
    private long lastClickTime = 0;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        IntentFilter filter = new IntentFilter();
        filter.addAction(Intent.ACTION_SCREEN_OFF);
        filter.addAction(Intent.ACTION_SCREEN_ON);
        
        // Register receiver for screen events using ContextCompat for backward compatibility
        androidx.core.content.ContextCompat.registerReceiver(this, new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                long currentTime = System.currentTimeMillis();
                if (currentTime - lastClickTime > 2000) {
                    powerClickCount = 0;
                }
                lastClickTime = currentTime;
                powerClickCount++;
                
                if (powerClickCount >= 3) {
                    // Trigger Panic in the webview using Capacitor's bridge
                    if (bridge != null) {
                        bridge.triggerWindowHostEvent("nativePanicTrigger");
                    }
                    powerClickCount = 0;
                }
            }
        }, filter, androidx.core.content.ContextCompat.RECEIVER_EXPORTED);
    }
}
