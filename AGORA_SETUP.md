# Agora Video/Audio Call Setup Guide

## ✅ Installation Complete

The Agora SDK has been successfully installed and integrated into your app!

## 🔑 Get Your Agora App ID (Required)

Your app is ready, but you need to configure your Agora credentials:

### Step 1: Create Free Agora Account
1. Go to: **https://console.agora.io/**
2. Click "Sign Up" (It's free!)
3. Complete registration

### Step 2: Create a Project
1. In Agora Console, click "Project Management"
2. Click "Create" button
3. Enter project name: "Covenant Church App"
4. Choose "Secured mode: APP ID + Token" for production
5. For testing, you can use "Testing mode: APP ID"
6. Click "Submit"

### Step 3: Copy Your App ID
1. Find your new project in the list
2. Click the eye icon to reveal the App ID
3. Copy the App ID

### Step 4: Configure Your App
1. Open: `mobile/src/config/agora.config.ts`
2. Replace `'YOUR_AGORA_APP_ID'` with your actual App ID:

```typescript
export const AGORA_CONFIG = {
  appId: 'your-actual-app-id-here', // Paste your App ID
  // ... rest of config
};
```

### Step 5: Save and Test!
That's it! Your video and audio calls will now work with real-time streaming.

## 📱 Features Included

### Video Calls
- ✅ Real-time video streaming
- ✅ Camera switching (front/back)
- ✅ Mute/unmute microphone
- ✅ Turn video on/off
- ✅ Multiple participants support
- ✅ Beautiful UI with gradients

### Audio Calls
- ✅ Crystal clear audio streaming
- ✅ Mute/unmute microphone
- ✅ Speaker/earpiece toggle
- ✅ Call duration timer
- ✅ Animated audio visualization

## 🎯 How to Use

1. **Start a Video Call**: Navigate to a chat group → Tap video call icon
2. **Start an Audio Call**: Navigate to a chat group → Tap audio call icon
3. **During Call**:
   - Tap microphone icon to mute/unmute
   - Tap camera icon to turn video on/off
   - Tap flip icon to switch cameras
   - Tap speaker icon to toggle speaker/earpiece
   - Tap red phone icon to end call

## 🆓 Agora Free Tier

Agora gives you:
- **10,000 free minutes per month**
- No credit card required to start
- Perfect for testing and small communities
- Production-ready quality

## 🔒 Security (Optional - For Production)

For production apps, you should enable token authentication:

1. In Agora Console, enable "App Certificate" for your project
2. Implement token generation on your backend
3. Update `AGORA_CONFIG.token` to fetch from your server

For now, testing mode (APP ID only) works fine!

## 🎥 Permissions

The app automatically requests:
- **Camera permission** (for video calls)
- **Microphone permission** (for audio calls)

On iOS, make sure these are in `Info.plist`:
- `NSCameraUsageDescription`
- `NSMicrophoneUsageDescription`

On Android, permissions are already configured in the code.

## 🚀 Testing

1. **Install app on 2 devices**
2. **Login as different users**
3. **Join the same chat group**
4. **One user starts a call**
5. **Other user joins automatically**
6. **Enjoy real-time video/audio!**

## 📚 Documentation

- Agora Docs: https://docs.agora.io/en/
- React Native Guide: https://docs.agora.io/en/video-calling/get-started/get-started-sdk?platform=react-native

## 💡 Tips

- Test on real devices (not emulator) for best results
- Use WiFi or good mobile data for smooth calls
- Video quality adapts to network conditions
- Audio-only calls use less bandwidth

## ❓ Troubleshooting

**"Agora Not Configured" alert?**
→ You need to add your App ID in `agora.config.ts`

**Can't see video?**
→ Check camera permissions are granted

**No audio?**
→ Check microphone permissions are granted

**Connection failed?**
→ Verify your App ID is correct
→ Check internet connection

## 🎉 You're All Set!

Once you add your App ID, your video and audio calls will work with real-time streaming. No additional setup needed!

---

**Need Help?**
- Agora Support: https://www.agora.io/en/support/
- Agora Community: https://www.agora.io/en/community/
