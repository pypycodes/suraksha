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
Ensure you have the Android SDK tools installed in your WSL environment.
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
