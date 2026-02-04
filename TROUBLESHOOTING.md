# Mobile App Troubleshooting Guide

## Common Issues and Solutions

### 1. Cannot Connect to Backend API

**Problem**: App shows network errors or "Cannot connect to server"

**Solution**:
- Make sure the backend server is running on port 5000
- For Android Emulator: The app uses `10.0.2.2:5000` (Android's special alias for host machine)
- For iOS Simulator: Uses `localhost:5000`
- For Physical Devices: Update the IP in `src/services/api.ts` to your computer's local IP (shown in Expo output, e.g., `10.206.135.11`)

**Steps**:
1. Start backend server: `cd server && npm start`
2. Check server is running: Open browser to `http://localhost:5000/api`
3. For physical device, update API URL in `mobile/src/services/api.ts`:
   ```typescript
   const API_BASE_URL = 'http://YOUR_COMPUTER_IP:5000/api';
   ```

### 2. Red Screen with Error Message

**Check**:
- Read the error message carefully
- Look for missing dependencies or import errors
- Check if all required services are running

### 3. White Screen / App Won't Load

**Solutions**:
1. Clear cache: `cd mobile && npx expo start -c`
2. Restart Metro bundler: Press `r` in terminal
3. Reload app: Shake device and select "Reload"

### 4. Version Compatibility Warning

If you see: "react-native-screens@4.20.0 - expected version: ~4.16.0"

**Fix**:
```bash
cd mobile
npx expo install react-native-screens
```

### 5. Login Issues

**Checklist**:
- Backend server is running
- Database is set up and populated
- Using correct API URL for your device type
- Check network permissions in app.json

**Test Credentials**:
- Email: `admin@wordofcovenant.org`
- Password: `admin123`

### 6. Physical Device Not Connecting

**For Android**:
1. Ensure phone and computer are on same WiFi network
2. Update API URL to computer's IP address
3. Allow network permissions

**For iOS**:
1. Scan QR code with Camera app
2. Or use `npx expo start --ios`

## Running the App

### Start Backend Server
```bash
cd server
npm start
```

### Start Mobile App
```bash
cd mobile
npx expo start
```

### Run on Android Emulator
```bash
npx expo start --android
# Or press 'a' after starting
```

### Run on iOS Simulator
```bash
npx expo start --ios
# Or press 'i' after starting
```

### Run on Physical Device
1. Install Expo Go from Play Store / App Store
2. Scan QR code shown in terminal
3. Make sure both devices are on same network

## Debug Mode

### View Logs
- Android: `npx react-native log-android`
- iOS: `npx react-native log-ios`
- Expo: Logs appear in terminal automatically

### Open Developer Menu
- Android Emulator: Press `Cmd+M` (Mac) or `Ctrl+M` (Windows)
- iOS Simulator: Press `Cmd+D`
- Physical Device: Shake the device

### Enable Remote Debugging
1. Open developer menu
2. Select "Debug Remote JS"
3. Opens Chrome DevTools

## Clean Build

If nothing works, try a clean build:
```bash
cd mobile
rm -rf node_modules
npm install
npx expo start -c
```

## Check Installation

Verify all packages are installed:
```bash
cd mobile
npm list --depth=0
```

## Network Configuration

Current API configuration in `src/services/api.ts`:
- Android Emulator: `http://10.0.2.2:5000/api`
- iOS Simulator: `http://localhost:5000/api`
- Physical Device: Update to `http://YOUR_IP:5000/api`

To find your IP:
- Windows: `ipconfig` (look for IPv4 Address)
- Mac/Linux: `ifconfig` (look for inet address)
- Or check Expo output: "Metro waiting on exp://YOUR_IP:8081"
