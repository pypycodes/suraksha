# Capacitor ProGuard Rules
-keep class com.getcapacitor.** { *; }
-keep interface com.getcapacitor.** { *; }
-keep @com.getcapacitor.NativePlugin public class *
-keep @com.getcapacitor.CapacitorPlugin public class *

# Suraksha Native Bridge Protection
# This ensures that the JavaScript-to-Java communication is never renamed or deleted
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

-keep class com.suraksha.safety.MainActivity {
    public void setupBridge(android.webkit.WebView);
}

# Keep the Fused Location and SMS classes
-keep class com.google.android.gms.location.** { *; }
-keep class android.telephony.SmsManager { *; }
