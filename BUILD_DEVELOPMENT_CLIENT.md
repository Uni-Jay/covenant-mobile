# Build Expo Development Client for Real Video/Audio Calls

## What You're Building
An **Expo Development Build** (custom dev client) that includes native modules like react-native-agora. This replaces Expo Go.

## Prerequisites
✅ Android Studio installed
✅ Android emulator running
✅ Node.js installed

## Step 1: Install EAS CLI

```powershell
npm install -g eas-cli
```

## Step 2: Login to Expo (Create Free Account)

```powershell
eas login
```

If you don't have an account, create one at https://expo.dev/signup (it's free!)

## Step 3: Configure EAS Build

```powershell
cd C:\Users\USER\Desktop\covenant\mobile
eas build:configure
```

Select:
- Platform: **Android**
- When asked about eas.json: **Yes, create it**

## Step 4: Build Development Client Locally

```powershell
eas build --profile development --platform android --local
```

This will:
- Install Android SDK dependencies
- Build an APK with native modules
- Take 10-15 minutes (first build)
- Create `build-XXXXXXX.apk` file

## Step 5: Install on Emulator

After build completes:

```powershell
# Find the APK file (it will show the path)
adb install path/to/build-XXXXXXX.apk
```

Or drag the APK onto the emulator window.

## Step 6: Start Development Server

```powershell
npx expo start --dev-client
```

## Step 7: Open App on Emulator

- Open the development build app on emulator (looks like Expo Go but with your app name)
- Press "a" in terminal or scan QR code
- App will load with full native module support

## Step 8: Configure Agora

1. Get free Agora App ID from https://console.agora.io/
2. Open `mobile/src/config/agora.config.ts`
3. Replace `'YOUR_AGORA_APP_ID'` with your actual App ID
4. Save and reload app

## 🎉 Done!

Now you have:
- ✅ Real video calls
- ✅ Real audio calls  
- ✅ All chat features
- ✅ Fast development (like Expo Go)
- ✅ Native modules support

## Alternative: Faster Local Build

If EAS build is too slow, use:

```powershell
# Install expo-dev-client
npx expo install expo-dev-client

# Build locally with Android Studio
npx expo run:android
```

This:
- Opens Android Studio automatically
- Builds faster
- Installs directly to emulator
- Same result as EAS build

## Troubleshooting

**"Java not found"**
```powershell
# Install JDK 11 or 17
# Set JAVA_HOME environment variable
```

**"Android SDK not found"**
- Open Android Studio → Tools → SDK Manager
- Install Android SDK Platform 33
- Set ANDROID_HOME environment variable

**"Build failed"**
```powershell
# Clear cache and retry
npx expo start --clear
```

**"Can't find emulator"**
```powershell
# List emulators
adb devices

# Start emulator
emulator -avd Pixel_5_API_33
```

## Next Steps After Build

1. Test video call between 2 emulators (or emulator + real device)
2. Add your Agora App ID
3. Enjoy real-time video/audio streaming!

## Important Notes

- ⚠️ Can't use Expo Go anymore (native modules required)
- ✅ Can still use Expo CLI and hot reload
- ✅ Can build APK for real devices
- ✅ Can publish to Google Play Store
- 💰 EAS Build has free tier: 30 builds/month

---

**Need Help?**
- Expo Development Builds: https://docs.expo.dev/develop/development-builds/introduction/
- EAS Build: https://docs.expo.dev/build/setup/
