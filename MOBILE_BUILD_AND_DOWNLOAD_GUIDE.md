# Mobile App Build & Download Guide - Features Restored

## Status Update

✅ **All 4 Required Features Restored**
- Audio recording (expo-audio)
- Photo upload (expo-image-picker)
- Document sharing (expo-document-picker)
- Notifications (expo-notifications)

❌ **Removed Earlier** (now restored):
All dependencies have been restored. The aggressive 100MB optimization is not being used.

## Updated App Size

| Build Type | Expected Size | Description |
|-----------|--------------|-------------|
| **Development** | ~200-250MB | Full build with warnings/logs |
| **Production AAB** | ~200-250MB | Optimized for Play Store |
| **Production APK** | ~250-280MB | Standalone APK for direct install |
| **Hermes Optimized** | ~180-200MB | With Hermes JS engine (faster startup) |

### Size Breakdown
```
Base Expo          ~45MB
React Native       ~30MB
Navigation libs    ~15MB
Media/Audio libs   ~45MB  (restored)
Agora/WebRTC removed - NOT RESTORED (audio calls not needed)
UI Components      ~25MB
Assets             ~15MB
Other dependencies ~15-25MB
────────────────────────
Total              ~190-200MB
```

## Available Features That Work

✅ **Core Features**
- User authentication & profiles
- Sermon viewing & streaming (via external links)
- Event management & RSVP
- Prayer requests with photo upload
- Donations & giving
- Church chat & group messaging
- Attendance QR scanning
- First-timer registration
- Dashboard & admin reports
- Live stream viewer

✅ **NEW - Media Features** (Just Restored)
- Audio recording for voice messages
- Photo upload for prayer requests
- Document sharing in chat
- Push notifications for events
- Date/time pickers for events

❌ **Still Removed** (Never Used)
- Video/Audio calls (Agora SDK - causes 590MB bloat)
- Video generation/playback
- Google Sign-In (use email instead)

## Build Instructions for Direct Download

### Step 1: Install Dependencies
```bash
cd mobile
npm install  # Installs all including audio, notifications, photo picker
```

### Step 2: Build APK (Direct Download for Users)
```bash
# Build standalone APK for Android direct download
npm run build:android:prod:online

# Or build optimized AAB for Play Store
eas build --platform android --profile production
```

### Step 3: Download Build Artifacts

After build completes:
```bash
# Get build list
npm run build:list:latest

# Check size
eas build:list --platform android --limit 1
```

### Step 4: Upload to Server

```bash
# The APK/AAB will be available at:
# https://updates.expo.dev/[project-id]/builds/[build-id]

# Direct download link example:
# https://builds.eas.dev/builds/[build-id]-apk.apk
```

## Production Build Profiles

### Profile: `production` (Recommended for Direct Download)
- **Type**: APK (standalone, direct install)
- **Size**: ~250-280MB
- **Distribution**: Direct download link
- **Installation**: USB or download link

```bash
npm run build:android:prod:online
```

### Profile: `production-100mb` (For Play Store - if size matters)
- **Type**: AAB (requires Play Store)
- **Size**: ~200MB (compressed by Play Store to ~85-100MB)
- **Distribution**: Google Play Store only
- **Installation**: Play Store app

```bash
eas build --platform android --profile production-100mb
```

## Website Download Links

Update [Home.tsx](../client/src/pages/Home.tsx) with direct download URLs:

```jsx
{/* Android Direct Download */}
<motion.a
  href="https://your-cdn.com/app-release.apk"  // Direct APK link
  target="_blank"
  rel="noopener noreferrer"
>
  <FaAndroid className="text-2xl" />
  <div>
    <p>Download APK</p>
    <p>Android App</p>
  </div>
</motion.a>

{/* iOS TestFlight (if building for iOS) */}
<motion.a
  href="https://testflight.apple.com/join/xxxxx"  // TestFlight link
  target="_blank"
  rel="noopener noreferrer"
>
  <FaApple className="text-2xl" />
  <div>
    <p>Download for</p>
    <p>iOS App</p>
  </div>
</motion.a>
```

## Testing Locally (Before Release)

### Test APK Build
```bash
# Build locally with Expo CLI
npm run android:build

# Or via EAS (recommended for production quality)
npm run build:android:prod:online
```

### Test on Device
```bash
# Method 1: Direct ADB install
adb install app-release.apk

# Method 2: Android Emulator
npm run android

# Method 3: Physical device via WiFi
# Build -> download APK -> Transfer to phone -> Install
```

### Test Features
```
1. Open app -> Login
2. Test audio recording: Voice message in chat
3. Test photo upload: Prayer request with image
4. Test document sharing: Send PDF in chat
5. Test notifications: Send event notification (admin)
6. Test QR scanning: Attendance check-in
7. Test chatting, events, donations
```

## CI/CD Integration (Optional)

### GitHub Actions Workflow Example
```yaml
name: Build APK

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      
      - name: Install dependencies
        run: cd mobile && npm install
        
      - name: Build with EAS
        run: npm run build:android:prod:online
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
          
      - name: Upload APK to server
        run: |
          # Download APK from EAS
          # Upload to your CDN/server
```

## Distribution Methods

### Method 1: Direct Download Link (Recommended)
- Upload APK to CDN or server
- Share download link on website
- Users download and install directly
- No Play Store approval needed
- ⚠️ Requires "Unknown apps" permission on Android

### Method 2: Google Play Store
- Submit AAB file to Google Play
- Automatic version management
- Automatic updates
- No manual downloads
- Google Play handles compression/optimization
- May take 2-4 hours for review

### Method 3: Internal Distribution (EAS)
```bash
# Build for internal testing
eas build --platform android --profile preview

# Get internal distribution link
# Share with testers via link
```

### Method 4: App Stores (Future)
```bash
# Play Store submission
# Build AAB: npm run build:android:prod:online
# Submit to: Google Play Console

# App Store submission (requires Mac)
# eas build --platform ios --profile production
# Submit to: Apple App Store Connect
```

## Version Management

Update version in [app.json](../mobile/app.json):

```json
{
  "expo": {
    "version": "2.0.0"  // Increment for each build
  }
}
```

Build command reference:
```bash
# Current scripts in package.json
npm run build:android:prod:online  # Production build
npm run build:android:internal     # Internal testing
npm run build:android:preview      # Preview/staging
npm run build:list:latest          # Check recent builds
npm run build:list                 # List all builds
```

## Troubleshooting

### Build Fails
```bash
# Clear cache
npm run prebuild -- --clean

# Reinstall dependencies
rm -r node_modules package-lock.json
npm install

# Rebuild
npm run build:android:prod:online
```

### APK Too Large
```bash
# Check what's included
unzip -l app-release.apk | grep -E '\.(so|jar)$' | sort -k4 -rn | head -20

# If still too large, review build logs
eas build:logs --build-id [build-id]
```

### Android Installation Issues
```bash
# Check device storage
adb shell df -h

# Clear app cache before install
adb shell pm clear com.wordofcovenant.app

# Reinstall
adb install -r app-release.apk
```

### Features Not Working

**Audio Recording Not Working**
- Check: `expo-audio` in package.json
- Check: RECORD_AUDIO permission in app.json
- Check: Audio plugin enabled in app.json

**Photo Upload Not Working**
- Check: `expo-image-picker` in package.json
- Check: READ_EXTERNAL_STORAGE in app.json
- Check: Camera/Photo permissions given on device

**Notifications Not Working**
- Check: `expo-notifications` in package.json
- Check: Android notification channel set up
- Check: Device notifications enabled for app

**Document Sharing Not Working**
- Check: `expo-document-picker` in package.json
- Check: File system permissions in app.json
- Check: Device has file manager app

## Support & Downloads

**Current Download Links** (update with actual URLs):
- Android APK: `https://your-server.com/app-release.apk`
- iOS TestFlight: `https://testflight.apple.com/join/xxxxx`
- GitHub Releases: `https://github.com/your-repo/releases`

**Build Status**:
- Check current builds: `npm run build:list`
- View build logs: `eas build:logs --build-id [id]`
- Subscribe to build notifications via EAS dashboard

## Complete Feature List

| Feature | Status | Package | Permission |
|---------|--------|---------|-----------|
| Chat | ✅ Working | socket.io-client | INTERNET |
| Prayers | ✅ Working | expo-image-picker | CAMERA, READ_EXTERNAL_STORAGE |
| Events | ✅ Working | @react-navigation | - |
| Donations | ✅ Working | axios | INTERNET |
| Sermons | ✅ Working | React Native | INTERNET |
| Notifications | ✅ Restored | expo-notifications | POST_NOTIFICATIONS |
| Audio Recording | ✅ Restored | expo-audio | RECORD_AUDIO |
| Photo Upload | ✅ Restored | expo-image-picker | CAMERA |
| Document Share | ✅ Restored | expo-document-picker | READ_EXTERNAL_STORAGE |
| QR Scanning | ✅ Working | react-native-qrcode-svg | CAMERA |
| Live Stream | ✅ Working | React Native WebView | INTERNET |
| Admin Dashboard | ✅ Working | axios | INTERNET |
| First-Timers | ✅ Working | expo-camera | CAMERA |
| Attendance | ✅ Working | react-native-qrcode-svg | CAMERA |

---

**Next Step**: Run `npm run build:android:prod:online` to generate your download APK!
