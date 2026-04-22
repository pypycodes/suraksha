package com.suraksha.safety;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.database.Cursor;
import android.location.Location;
import android.net.Uri;
import android.os.BatteryManager;
import android.os.Build;
import android.os.Bundle;
import android.os.PowerManager;
import android.provider.ContactsContract;
import android.provider.Settings;
import androidx.annotation.NonNull;
import com.getcapacitor.BridgeActivity;
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.location.Priority;
import com.google.android.gms.tasks.OnSuccessListener;

public class MainActivity extends BridgeActivity {
    private static final int PICK_CONTACT = 1005;
    private static final int PERMISSION_REQUEST_CODE = 1004;
    private FusedLocationProviderClient fusedLocationClient;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this);

        if (hasCriticalPermissions()) {
            startSafetyService();
        }

        IntentFilter filter = new IntentFilter();
        filter.addAction("com.suraksha.safety.TRIGGER_SOS");
        filter.addAction("com.suraksha.safety.TRIGGER_CALL");
        filter.addAction("com.suraksha.safety.LIVE_LOCATION");

        androidx.core.content.ContextCompat.registerReceiver(this, new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if ("com.suraksha.safety.LIVE_LOCATION".equals(intent.getAction())) {
                    double lat = intent.getDoubleExtra("lat", 0);
                    double lng = intent.getDoubleExtra("lng", 0);
                    String json = "{\"latitude\":" + lat + ",\"longitude\":" + lng + "}";
                    MainActivity.this.runOnUiThread(() -> {
                        if (MainActivity.this.bridge != null && MainActivity.this.bridge.getWebView() != null) {
                            MainActivity.this.bridge.getWebView().evaluateJavascript("window.dispatchEvent(new CustomEvent('fusedLocationUpdate', {detail: " + json + "}))", null);
                        }
                    });
                } else if ("com.suraksha.safety.TRIGGER_CALL".equals(intent.getAction())) {
                    String phone = intent.getStringExtra("phone");
                    if (phone != null) initiateDirectCall(phone);
                } else if ("com.suraksha.safety.TRIGGER_SOS".equals(intent.getAction())) {
                    triggerNativeSOS();
                }
            }
        }, filter, androidx.core.content.ContextCompat.RECEIVER_EXPORTED);

        if (this.bridge != null && this.bridge.getWebView() != null) {
            setupBridge(this.bridge.getWebView());
        }
    }

    private boolean hasCriticalPermissions() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return true;
        return checkSelfPermission(android.Manifest.permission.ACCESS_FINE_LOCATION) == android.content.pm.PackageManager.PERMISSION_GRANTED;
    }

    private void setupBridge(android.webkit.WebView webView) {
        webView.addJavascriptInterface(new Object() {
            @android.webkit.JavascriptInterface
            public void pickContact() {
                Intent intent = new Intent(Intent.ACTION_PICK, ContactsContract.CommonDataKinds.Phone.CONTENT_URI);
                startActivityForResult(intent, PICK_CONTACT);
            }
            @android.webkit.JavascriptInterface
            public void call(String phone) {
                Intent intent = new Intent("com.suraksha.safety.TRIGGER_CALL");
                intent.putExtra("phone", phone);
                MainActivity.this.sendBroadcast(intent);
            }
            @android.webkit.JavascriptInterface
            public void requestAllPermissions() {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    java.util.List<String> perms = new java.util.ArrayList<>();
                    perms.add(android.Manifest.permission.ACCESS_FINE_LOCATION);
                    perms.add(android.Manifest.permission.SEND_SMS);
                    perms.add(android.Manifest.permission.CALL_PHONE);
                    if (Build.VERSION.SDK_INT >= 33) perms.add("android.permission.POST_NOTIFICATIONS");
                    MainActivity.this.requestPermissions(perms.toArray(new String[0]), PERMISSION_REQUEST_CODE);
                }
            }
            @android.webkit.JavascriptInterface
            public void getFusedLocation() {
                try {
                    fusedLocationClient.getCurrentLocation(Priority.PRIORITY_HIGH_ACCURACY, null)
                        .addOnSuccessListener(new OnSuccessListener<Location>() {
                            @Override
                            public void onSuccess(Location location) {
                                if (location != null) {
                                    String json = "{\"latitude\":" + location.getLatitude() + ",\"longitude\":" + location.getLongitude() + "}";
                                    MainActivity.this.runOnUiThread(() -> {
                                        MainActivity.this.bridge.getWebView().evaluateJavascript("window.dispatchEvent(new CustomEvent('fusedLocationUpdate', {detail: " + json + "}))", null);
                                    });
                                }
                            }
                        });
                } catch (SecurityException e) {}
            }
            @android.webkit.JavascriptInterface
            public void send(String phone, String message) {
                try {
                    android.telephony.SmsManager smsManager = android.telephony.SmsManager.getDefault();
                    java.util.ArrayList<String> parts = smsManager.divideMessage(message);
                    smsManager.sendMultipartTextMessage(phone, null, parts, null, null);
                } catch (Exception e) {}
            }
            @android.webkit.JavascriptInterface
            public void getBatteryLevel() {
                try {
                    BatteryManager bm = (BatteryManager) getSystemService(BATTERY_SERVICE);
                    int level = bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY);
                    MainActivity.this.runOnUiThread(() -> {
                        if (MainActivity.this.bridge != null && MainActivity.this.bridge.getWebView() != null) {
                            MainActivity.this.bridge.getWebView().evaluateJavascript("window.dispatchEvent(new CustomEvent('batteryUpdate', {detail: " + level + "}))", null);
                        }
                    });
                } catch (Exception e) {}
            }
        }, "NativeSOSBridge");
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == PERMISSION_REQUEST_CODE) {
            boolean granted = false;
            for (int i = 0; i < permissions.length; i++) {
                if (android.Manifest.permission.ACCESS_FINE_LOCATION.equals(permissions[i]) && grantResults[i] == android.content.pm.PackageManager.PERMISSION_GRANTED) {
                    granted = true;
                    break;
                }
            }
            if (granted) {
                startSafetyService();
                notifyJsPermissionsGranted();
                checkBatteryOptimization();
            } else {
                notifyJsPermissionsGranted();
            }
        }
    }

    private void notifyJsPermissionsGranted() {
        this.runOnUiThread(() -> {
            if (this.bridge != null && this.bridge.getWebView() != null) {
                this.bridge.getWebView().evaluateJavascript("window.dispatchEvent(new CustomEvent('nativePermissionsGranted'))", null);
            }
        });
    }

    private void startSafetyService() {
        try {
            Intent serviceIntent = new Intent(this, SafetyService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(serviceIntent);
            } else {
                startService(serviceIntent);
            }
        } catch (Exception e) {}
    }

    private void checkBatteryOptimization() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
                if (!pm.isIgnoringBatteryOptimizations(getPackageName())) {
                    Intent intent = new Intent();
                    intent.setAction(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                    intent.setData(Uri.parse("package:" + getPackageName()));
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(intent);
                }
            }
        } catch (Exception e) {}
    }

    private void initiateDirectCall(String phone) {
        MainActivity.this.runOnUiThread(() -> {
            try {
                String cleanPhone = phone.trim().replaceAll("[^0-9+]", "");
                Intent intent = new Intent(Intent.ACTION_CALL);
                intent.setData(Uri.parse("tel:" + cleanPhone));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                if (checkSelfPermission(android.Manifest.permission.CALL_PHONE) == android.content.pm.PackageManager.PERMISSION_GRANTED) {
                    startActivity(intent);
                } else {
                    Intent dialIntent = new Intent(Intent.ACTION_DIAL);
                    dialIntent.setData(Uri.parse("tel:" + cleanPhone));
                    dialIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(dialIntent);
                }
            } catch (Exception e) {}
        });
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == PICK_CONTACT && resultCode == RESULT_OK) {
            Uri contactUri = data.getData();
            String[] projection = {ContactsContract.CommonDataKinds.Phone.NUMBER, ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME};
            Cursor cursor = getContentResolver().query(contactUri, projection, null, null, null);
            if (cursor != null && cursor.moveToFirst()) {
                int numberIndex = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER);
                int nameIndex = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME);
                String number = cursor.getString(numberIndex);
                String name = cursor.getString(nameIndex);
                cursor.close();
                
                final String json = "{\"name\":\"" + name + "\",\"phone\":\"" + number + "\"}";
                this.bridge.getWebView().post(() -> this.bridge.getWebView().evaluateJavascript("window.dispatchEvent(new CustomEvent('contactPicked', {detail: " + json + "}))", null));
            }
        }
    }

    private void triggerNativeSOS() {
        if (this.bridge != null && this.bridge.getWebView() != null) {
            this.bridge.getWebView().post(() -> this.bridge.getWebView().evaluateJavascript("window.dispatchEvent(new CustomEvent('nativePanicTrigger'))", null));
        }
    }
}
