# Suraksha - Family Safety & Elderly Care

A comprehensive local-first safety app for women, children, and the elderly in India. Features include Geofencing, Safe Journey tracking, Panic Button, SOS Widget, and Dark Mode. No ads, no cloud hosting required.

## Features
- **SOS Panic Button**: Immediate alerts to trusted contacts.
- **SOS Widget**: Quick-access floating trigger for emergencies.
- **Geofencing**: Automatic alerts when a user leaves a safe zone.
- **Safe Journey**: Track transit and alert contacts upon safe arrival.
- **Fake Call**: Deter potential threats with a simulated incoming call.
- **Dark Mode**: Optimized for low-light situations.
- **Native Integration**: Capacitor-powered haptics and geolocation for a responsive Android experience.

---

## Android Build Guide (WSL)

This project uses **Capacitor** to build native Android applications from the React web source.

### 1. Initial Setup
Ensure you have the Android SDK tools installed in your WSL environment..
```bash
# Add the android folder to your project
npx cap add android
```

### 2. The Development Workflow
Whenever you make changes to the React code:
```bash
# 1. Build the web assets
npm run build

# 2. Sync the web assets into the Android project
npx cap copy android
```

### 3. Building for Release (APK/AAB)
Use the included Gradle wrapper to build your packages:
```bash
# Move into the android folder
cd android

# Build a Debug APK (for testing)
./gradlew assembleDebug
# Output: android/app/build/outputs/apk/debug/app-debug.apk

# Build a Release AAB (for Google Play Store)
./gradlew bundleRelease
# Output: android/app/build/outputs/bundle/release/app-release.aab
```

### 4. Required Android Permissions
Ensure the following permissions are present in `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
```

---

## Web Development

### Local Server
The app uses an Express backend for production routing and a Vite dev server for development.
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

---

## Environment Variables
Create a `.env` file in the root based on `.env.example`:
- `GEMINI_API_KEY`: Required for AI-powered voice safety features.

---

## Troubleshooting

### 1. `Unable to access jarfile .../gradle-wrapper.jar`
This happens if the Gradle engine is missing. Re-initialize the android folder:
```bash
rm -rf android
npx cap add android
npm run build
npx cap sync android
```

### 2. `Could not parse error string` (Emulator Install Error)
Windows emulators struggle to read files directly from `\\wsl$\`. 
- **Fix**: Copy your APK from WSL into a Windows folder (like `Downloads`) and drag it into the emulator from there.
- **Alternative**: Use ADB directly from WSL:
  ```bash
  adb install android/app/build/outputs/apk/debug/app-debug.apk
  ```

### 3. `adb devices` is empty (WSL can't see Emulator)
Point WSL to your Windows ADB server:
```bash
export ADB_SERVER_SOCKET=tcp:localhost:5037
adb devices
```

### 4. `Rollup failed to resolve import "@capacitor/..."`
The packages are in `package.json` but not installed in your local `node_modules`.
```bash
npm install
```

### 5. Prevent `.jar` files from being ignored
Ensure your `.gitignore` does not block the Gradle wrapper:
```text
# Add this to your .gitignore to ensure build stability
!android/gradle/wrapper/gradle-wrapper.jar
```

## Background SOS Setup (CRITICAL)

To enable **Full Background SOS** (sending SMS without any user interaction), you must manually add the matching permission to your Android source code.

### 1. Update AndroidManifest.xml
Open `android/app/src/main/AndroidManifest.xml` and add these two permissions inside the `<manifest>` tag:

```xml
<!-- Required for Background SMS -->
<uses-permission android:name="android.permission.SEND_SMS" />
<!-- Required for Direct SOS Calling (bypass dialer screen) -->
<uses-permission android:name="android.permission.CALL_PHONE" />
```

### 2. Verify Plugin Installation
```bash
npm install
npx cap sync android
```

### 3. Build & Run
```bash
npm run build
npx cap copy android
cd android && ./gradlew assembleDebug
```

---

## Important Platform Limitations

- **Phone Calls**: Android requires a user to press the "Call" button once to prevent apps from making unauthorized long-distance charges. 
- **Background SMS**: Requires the `SEND_SMS` permission. On modern Android versions, the app must ask the user for permission the first time it opens.
