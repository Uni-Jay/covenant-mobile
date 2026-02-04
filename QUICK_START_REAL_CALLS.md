# Quick Start: Real Video/Audio Calls

## ✅ Building Now!

Your development build is compiling. This includes:
- react-native-agora (video/audio SDK)
- All other native modules
- Custom dev client

**First build takes 10-15 minutes**. Be patient!

## After Build Completes

### 1. App will auto-install on emulator
The APK will install automatically and launch.

### 2. Get Your Agora App ID

1. Visit: https://console.agora.io/
2. Sign up (free)
3. Create new project
4. Copy the App ID
5. Paste it in `mobile/src/config/agora.config.ts`:
   ```typescript
   appId: 'your-actual-app-id-here',
   ```

### 3. Start Development

```powershell
# Start dev server
cd C:\Users\USER\Desktop\covenant\mobile
npm start
```

Then press `a` to reload app or shake device.

## Testing Video/Audio Calls

### Option 1: Two Emulators
1. Create second emulator in Android Studio
2. Install APK on both: `adb -s emulator-5554 install app.apk`
3. Login as different users
4. Join same group chat
5. Start call!

### Option 2: Emulator + Real Device
1. Connect phone via USB
2. Enable USB debugging
3. Run `adb devices` to see both
4. App runs on both
5. Test calls between them

## Using the App

### Video Call:
1. Open a group chat
2. Tap 📹 video icon in header
3. Wait for other users to join
4. Controls:
   - 🎤 Mute/unmute
   - 📹 Video on/off
   - 🔄 Switch camera
   - 📞 End call

### Audio Call:
1. Open a group chat
2. Tap 📞 phone icon
3. Wait for others
4. Controls:
   - 🎤 Mute/unmute
   - 🔊 Speaker/earpiece
   - 📞 End call

## Build Outputs

After successful build, you'll see:
```
BUILD SUCCESSFUL in 10m 23s
Installing APK 'app-debug.apk' on 'Pixel_5_API_33'
Installed on 1 device.
```

## Future Builds

After first build, subsequent builds are MUCH faster (2-3 min):
```powershell
npx expo run:android
```

## Troubleshooting

**Build Failed?**
```powershell
# Clean and rebuild
cd android
gradlew clean
cd ..
npx expo run:android
```

**"JAVA_HOME not set"**
- Install JDK 11 or 17
- Set environment variable

**"SDK not found"**
- Open Android Studio
- Tools → SDK Manager
- Install SDK 33

**App crashes on launch?**
- Check logcat: `adb logcat`
- Ensure Agora App ID is set
- Check permissions in AndroidManifest.xml

## What's Different from Expo Go

✅ **Same:**
- Fast refresh
- Hot reload
- Expo CLI
- Development experience

❌ **Different:**
- Can't use Expo Go app
- Must build custom dev client
- Takes longer for first build
- Larger APK size

✅ **Better:**
- Native modules work!
- Real video/audio calls
- Better performance
- Can publish to Google Play

## Next Steps

1. ⏳ **Wait for build** (happening now)
2. 🔑 **Add Agora App ID**
3. 🧪 **Test video call**
4. 🎉 **Enjoy real-time calls!**

---

**Your app is building...**
Watch the terminal for progress. First build downloads dependencies and compiles everything.
