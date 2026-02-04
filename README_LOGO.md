# Church Logo Usage in Mobile App

## Logo Location
The church logo is located at: `mobile/assets/images/Word of Covenant Logo.jpg`

## Usage in Screens

### Login Screen
The logo is displayed at the top of the login screen:
```tsx
<Image 
  source={require('../../assets/images/Word of Covenant Logo.jpg')}
  style={styles.logo}
  resizeMode="contain"
/>
```

### Style:
```tsx
logo: {
  width: 120,
  height: 120,
  marginBottom: 24,
  borderRadius: 60,
}
```

## App Icons and Splash Screen

**Note**: Expo requires PNG files for app icons and splash screens. The app.json currently uses default PNG icons from the `assets/` folder:

- `icon.png` - App icon (1024x1024px recommended)
- `splash.png` - Splash screen
- `adaptive-icon.png` - Android adaptive icon
- `favicon.png` - Web favicon

### To Use Custom Logo for App Icon:

1. Convert `Word of Covenant Logo.jpg` to PNG format
2. Resize to 1024x1024px for icon
3. Resize to 1200x1920px for splash screen
4. Replace the files in `assets/` folder
5. Or use online tools like: https://icon.kitchen/

## Displaying Logo in Other Screens

To add the logo to any screen:

```tsx
import { Image } from 'react-native';

// In your component JSX:
<Image 
  source={require('../assets/images/Word of Covenant Logo.jpg')}
  style={{ width: 100, height: 100 }}
  resizeMode="contain"
/>
```

## Current Status

✅ Logo added to Login Screen
✅ App.json configured with default icons
⚠️ To use church logo as app icon, convert JPG to PNG and replace default icons

## Backend Server Configuration

The backend server has been updated to accept requests from:
- Web client: `http://localhost:5173`
- Expo web: `http://localhost:8081`
- Android emulator: `http://10.0.2.2:8081`
- Expo Go: `exp://localhost:8081`

## API Configuration

The mobile app automatically selects the correct API URL:
- **Android Emulator**: `http://10.0.2.2:5000/api`
- **iOS Simulator**: `http://localhost:5000/api`
- **Physical Device**: Update IP in `src/services/api.ts`

## Running the Apps

### Backend:
```bash
cd server
npm run dev
```

### Mobile:
```bash
cd mobile
npx expo start
```

Press `a` for Android emulator or scan QR code for physical device.
