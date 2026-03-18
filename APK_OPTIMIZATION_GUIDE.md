# Android APK Size Optimization Guide

## Current Status
- **Current Size**: ~590MB
- **Target Size**: <300MB (50% reduction)
- **Main Issue**: Agora SDK (70-100MB), WebRTC, Audio/Video dependencies

## Strategy 1: Remove Unused Audio/Video Call Dependencies (Saves ~150-200MB)

### Dependencies to Remove:
```json
// Remove from package.json:
- react-native-agora: "^4.5.3"           // 40-60MB Agora SDK
- react-native-webrtc: "^124.0.7"        // 30-40MB WebRTC
- agora-rn-uikit: "^5.0.2"               // 15-20MB UIKit components
- expo-av: "~16.0.8"                     // 20-25MB Audio/Video playback
```

### Files to Remove/Disable:
1. **Mobile App Screens** (commented out in AppNavigator):
   - AudioCallScreen.tsx - ALREADY COMMENTED
   - VideoCallScreen.tsx - ALREADY COMMENTED

2. **Associated Config Files**:
   - mobile/src/config/agora.config.ts - Delete or disable
   - AGORA_SETUP.md - Documentation only

3. **Permissions to Remove from app.json**:
   ```json
   android: {
     permissions: [
       "CAMERA",                    // REMOVE if not using QR code scanning
       "RECORD_AUDIO",              // REMOVE
       "android.permission.RECORD_AUDIO",   // REMOVE
       "android.permission.MODIFY_AUDIO_SETTINGS"  // REMOVE
     ]
   }
   ```

### Step-by-Step Removal:

1. **Update app.json**:
   - Remove "expo-audio" from plugins
   - Remove CAMERA, RECORD_AUDIO, MODIFY_AUDIO_SETTINGS permissions
   - Remove audio-related infoPlist entries

2. **Update eas.json**:
   - Set enableMinification: true
   - Set enableHermes: true
   - Use arm64-v8a only (remove universal)

3. **Remove from package.json**:
   ```bash
   npm uninstall react-native-agora react-native-webrtc agora-rn-uikit expo-av
   ```

4. **Remove imports**:
   - Search for `import.*agora` and remove
   - Search for `import.*webrtc` and remove
   - Search for `AGORA_CONFIG` and remove references

## Strategy 2: Optimize Build Configuration

### Enable Hermes (Already enabled - saves ~20MB)
```json
// app.json already has this:
"jsEngine": "hermes"
```

### Optimize EAS Configuration
```json
{
  "build": {
    "production-android-optimized": {
      "distribution": "store",
      "environment": "production",
      "android": {
        "buildType": "aab",
        "enableMinification": true,
        "enableShrinking": true,
        "ndk": "23.2.8767484"
      },
      "env": {
        "ORG_GRADLE_PROJECT_reactNativeArchitectures": "arm64-v8a"
      }
    }
  }
}
```

## Strategy 3: Asset Optimization

### Current Assets Analysis:
Run this command to identify large files:
```bash
npm run size:assets
```

### Recommendations:
1. **Compress Images**:
   - Convert PNG to WEBP (30% smaller)
   - Resize hero images to 1920px width max
   - Use responsive image sizes

2. **Remove Unused Assets**:
   - Check mobile/public for unused files
   - Remove debug builds and old APKs
   - Clean build cache: `npm run prebuild -- --clean`

## Strategy 4: Code Optimization

### Tree Shaking:
```bash
# Ensure build script uses production mode
npm run build:android:prod:online
```

### Remove Unused Fonts:
In app.json, only import needed font weights:
```json
// Currently loading too many weights
// Reduce to: 400, 600, 700 only
```

## Expected Results

| Change | Size Saved |
|--------|-----------|
| Remove Agora SDK | 50-70MB |
| Remove WebRTC | 30-40MB |
| Remove AVModule | 20-25MB |
| Enable minification | 15-20MB |
| Remove audio permissions | 5-10MB |
| Optimize assets | 10-20MB |
| Remove unused fonts | 5-10MB |
| **Total** | **135-195MB** |

**Target Final Size**: 400-450MB

## Implementation Order

1. **Phase 1 (Immediate - Saves ~150MB)**:
   - Remove Agora, WebRTC, agora-rn-uikit packages
   - Clean app.json permissions
   - Clean eas.json build settings

2. **Phase 2 (Optional - Saves ~50MB)**:
   - Optimize and compress assets
   - Remove unused fonts
   - Clean up dependencies

3. **Phase 3 (Optional - Saves ~20-30MB)**:
   - Advanced code splitting
   - Lazy load screens as needed
   - Dynamic imports for heavy features

## Testing After Optimization

```bash
# Build internal test APK
npm run build:android:internal

# Check final size
eas build:list --platform android --limit 1

# Test on device
adb install path-to-apk.apk
```

## Verification
- [ ] App launches without errors
- [ ] All major screens work
- [ ] No console errors
- [ ] File size < 400MB (aab) or < 450MB (apk)
- [ ] App Store upload succeeds
