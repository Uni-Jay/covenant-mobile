# No-Store Deployment for Android and iOS

This guide lets you distribute your mobile app without publishing publicly on Google Play or Apple App Store.

## What this supports

- Android: direct install using internal APK links.
- iOS: internal install using ad hoc provisioning (device UDID registration required).
- Ongoing live updates for JavaScript-only changes using EAS Update.

## Important iOS limitation

Apple still requires an Apple Developer account for real iOS app distribution to non-jailbroken devices.

Without Apple Developer account, your iOS options are limited to:
- Expo Go development usage only, or
- Web/PWA access in Safari.

## One-time setup

Run these commands in this folder:

```powershell
npm install
npm install --save-dev eas-cli
npm install expo-build-properties
npx eas login
```

If this is your first EAS project link:

```powershell
npx eas project:init
```

## Build and share install links

### Android internal APK

```powershell
npm run build:android:internal
```

- EAS gives you an install URL.
- Share URL with Android users.

### iOS internal build (ad hoc)

```powershell
npm run build:ios:internal
```

- During first run, EAS asks for Apple credentials/team.
- Register test device UDIDs.
- EAS gives install URL for registered devices.

## Keep app live while developing

Use OTA updates for JS changes only:

```powershell
npm run update:preview
npm run update:production
```

Use a new build when you change native code, for example:
- New native dependency
- Permission changes
- Expo SDK/React Native upgrades
- Native config/plugin changes

## 40MB target strategy

Your current image assets are already small. Most size comes from native libraries (especially Agora/WebRTC).

What is already configured:
- Hermes enabled in app config
- Proguard enabled for Android release
- Resource shrinking enabled for Android release

How to verify size each release:

```powershell
npm run size:assets
```

After each Android build, download the APK and check file size. If still above 40MB:
- Remove unused native packages.
- Create a separate Lite variant without video calling modules.
- Keep high-resolution media off-bundle and load from network/CDN.

## Recommended release flow

1. Build once for Android and iOS internal distribution.
2. Share install links with users.
3. Push OTA updates for JS-only changes.
4. Rebuild binaries only when native changes are required.
