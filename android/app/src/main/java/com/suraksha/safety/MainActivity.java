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
        
        registerReceiver(new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                long currentTime = System.currentTimeMillis();
                // Reset count if more than 2 seconds between clicks
                if (currentTime - lastClickTime > 2000) {
                    powerClickCount = 0;
                }
                lastClickTime = currentTime;
                powerClickCount++;
                
                if (powerClickCount >= 3) {
                    // Trigger Panic in the webview
                    getBridge().eval("window.dispatchEvent(new CustomEvent('nativePanicTrigger'))");
                    powerClickCount = 0;
                }
            }
        }, filter);
    }
}
