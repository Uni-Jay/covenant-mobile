# Ultra-Aggressive 100MB APK Reduction Strategy

## Current Analysis
- **Current Size**: ~500MB
- **Target Size**: ~100MB  
- **Reduction Needed**: 80% (400MB)

## High-Impact Removals (240-280MB)

### TIER 1: Remove Completely (Saves 130-160MB)
```json
// DELETE THESE - Video/Audio Call System (NOT USED)
"agora-rn-uikit": "^5.0.2",           // 15-20MB
"react-native-agora": "^4.5.3",       // 70-100MB - HUGE
"react-native-webrtc": "^124.0.7",    // 30-40MB
```

### TIER 2: Remove Media/Document Handling (Saves 40-50MB)
```json
// Audio/Video playback - Migrate to web API
"expo-av": "~16.0.8",                 // 20-25MB
"expo-audio": "~1.1.1",               // 5-10MB

// File/Media handling - not critical
"expo-document-picker": "~14.0.8",    // 10MB
"expo-media-library": "~18.2.1",      // 12MB
"expo-image-picker": "~17.0.10",      // 12MB
```

### TIER 3: Remove UI Libraries (Saves 30-40MB)
```json
// Replace with Ionicons system
"react-native-paper": "^5.14.5",      // 15MB
"react-native-calendars": "^1.1313.0",// 8MB

// Replace with native calendar
"@react-native-community/datetimepicker": "^8.6.0", // 5MB

// Simplify
"react-native-svg": "^15.12.1",       // 5MB
```

### TIER 4: Remove Unnecessary Features (Saves 50-60MB)
```json
// Updates/Notifications can use web push
"expo-updates": "~29.0.16",           // 10MB
"expo-notifications": "^0.32.16",     // 8MB
"expo-splash-screen": "^31.0.13",     // 5MB
"expo-sharing": "~14.0.8",            // 3MB

// System/Crypto - use minimal replacements
"expo-crypto": "^15.0.8",             // 3MB
"expo-file-system": "^19.0.21",       // 10MB
"expo-clipboard": "~8.0.8",           // 2MB

// Fonts - use system fonts only
"@expo-google-fonts/inter": "^0.4.2",    // 5MB
"@expo-google-fonts/playfair-display": "^0.4.2", // 5MB

// Auth - use web-based only
"@react-native-google-signin/google-signin": "^16.1.1", // 8MB
```

### TIER 5: Optimize Remaining (Saves 20-30MB)
```json
// Keep but slim down:
"react-native-qrcode-svg": "^6.3.21",   // Replace with lighter lib (saves 3MB)
"expo-linear-gradient": "~15.0.8",      // Keep but optimize usage (no change)
"expo-camera": "~17.0.10",              // Keep but limit to essentials
```

## New Minimal package.json Structure

**Keep Only (Total: ~80-100MB base + code)**
```json
{
  "dependencies": {
    "@expo/vector-icons": "^15.1.1",
    "@react-native-async-storage/async-storage": "^2.2.0",
    "@react-navigation/bottom-tabs": "^7.10.1",
    "@react-navigation/native": "^7.1.28",
    "@react-navigation/native-stack": "^7.10.1",
    "axios": "^1.13.2",
    "expo": "~54.0.33",
    "expo-asset": "^55.0.8",
    "expo-build-properties": "^55.0.9",
    "expo-camera": "~17.0.10",
    "expo-dev-client": "~6.0.20",
    "expo-font": "^14.0.11",
    "expo-linear-gradient": "~15.0.8",
    "expo-status-bar": "~3.0.9",
    "expo-system-ui": "^6.0.9",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "react-native": "0.81.5",
    "react-native-qrcode-svg": "^6.3.21",
    "react-native-safe-area-context": "^5.6.2",
    "react-native-screens": "~4.16.0",
    "react-native-web": "^0.21.0",
    "socket.io-client": "^4.8.3"
  }
}
```

**Total after removal: ~100-150MB base**

## EAS Build Configuration (Aggressive Optimization)

```json
{
  "build": {
    "production-100mb": {
      "distribution": "store",
      "environment": "production",
      "channel": "production",
      "android": {
        "buildType": "aab",
        "enableMinification": true,
        "enableShrinking": true,
        "ndk": "23.2.8767484",
        "gradleCommand": ":app:bundleRelease"
      },
      "env": {
        "ORG_GRADLE_PROJECT_reactNativeArchitectures": "arm64-v8a",
        "ORG_GRADLE_PROJECT_hermesFlagBuildType": "release"
      }
    }
  }
}
```

## app.json Optimizations

**Remove:**
- expo-audio plugin
- expo-notifications
- google-signin
- date-time-picker
- media-library references

**Keep:**
- expo-build-properties with aggressive settings
- expo-dev-client for development

## Code Changes Required

### 1. Remove Call Screens Completely
- Delete `/src/screens/AudioCallScreen.tsx`
- Delete `/src/screens/VideoCallScreen.tsx`
- Remove all Agora references from AppNavigator

### 2. Simplify Media Handling
- Remove photo/document upload features
- Simplify to text-only chat
- Remove video playback (link to external player instead)

### 3. Use System Components
- Replace react-native-paper with Ionicons
- Use native calendar instead of library
- Remove custom date picker (use native system)

### 4. Lazy Load Heavy Features
```typescript
// Instead of importing all screens, use React.lazy()
const AIChat = React.lazy(() => import('./screens/AIChat'));
const EventsReport = React.lazy(() => import('./screens/EventsReport'));

// Suspense wrapper for loading
<Suspense fallback={<LoadingScreen />}>
  <AIChat />
</Suspense>
```

### 5. Remove Unused Imports
Search for and remove:
- All `expo-av` imports
- All `expo-notifications` imports
- All `react-native-paper` imports
- All `expo-media-library` imports

## Build Process

```bash
# 1. Update package.json (remove Tier 1-4 packages)
npm uninstall agora-rn-uikit react-native-agora react-native-webrtc \
  expo-av expo-audio expo-document-picker expo-media-library \
  expo-image-picker react-native-paper react-native-calendars \
  @react-native-community/datetimepicker react-native-svg \
  expo-updates expo-notifications expo-splash-screen expo-sharing \
  expo-crypto expo-file-system expo-clipboard \
  @expo-google-fonts/inter @expo-google-fonts/playfair-display \
  @react-native-google-signin/google-signin

# 2. Update configs
# - Update app.json (remove plugins & permissions)
# - Update eas.json (use production-100mb profile)
# - Update AppNavigator.tsx (remove call screens)

# 3. Clean build
npx expo prebuild --clean

# 4. Build optimized
npm run build:android:prod:online

# 5. Verify size
eas build:list --platform android --limit 1
```

## Expected Results

| Task | Savings | Cumulative |
|------|---------|-----------|
| Start | - | 500MB |
| Remove Agora/WebRTC | 160MB | 340MB |
| Remove Media libs | 50MB | 290MB |
| Remove Heavy UI libs | 40MB | 250MB |
| Remove Notifications/Updates | 60MB | 190MB |
| Remove Fonts/Auth | 18MB | 172MB |
| R8 Shrinking/ProGuard | 50MB | 122MB |
| Hermes + Minification | 15MB | 107MB |
| **FINAL** | **-393MB** | **~107MB** ✅ |

## Files to Update/Delete

### Delete
- `src/screens/AudioCallScreen.tsx`
- `src/screens/VideoCallScreen.tsx`
- `src/config/agora.config.ts`
- `AGORA_SETUP.md`

### Update
- `package.json` - Remove all Tier 1-4 packages
- `app.json` - Remove audio/media plugins, permissions
- `eas.json` - Add production-100mb profile
- `src/navigation/AppNavigator.tsx` - Remove call screen routes
- All screens - Remove expo-av imports
- All screens - Remove react-native-paper imports

## Verification Checklist

- [ ] Build succeeds without errors
- [ ] App launches on device
- [ ] Core features working: Chat, Prayers, Donations, Attendance, Events, Sermons
- [ ] Google Play upload succeeds
- [ ] Final APK/AAB size < 110MB
- [ ] App performance is smooth
- [ ] No console errors

## Not Removing (Essential)
- Navigation libraries (2MB)
- Socket.io (3MB)
- QR code (3MB)
- Axios (0.5MB)
- React core (essential)
- Expo core (8-10MB)
- Linear gradient (aesthetic, 1MB)
- Ionicons (vector icons, included in @expo/vector-icons)
