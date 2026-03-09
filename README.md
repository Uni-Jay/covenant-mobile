# Household Of Covenant And Faith Apostolic Ministry Mobile App

A comprehensive mobile application for Household Of Covenant And Faith Apostolic Ministry built with React Native Expo.

## Features

### 🔐 Authentication
- Email/Password login and registration
- Google OAuth integration (coming soon)
- Role-based access control (Member, Pastor, Elder, Deacon, Secretary, Media, Finance, Choir, Department Head, Super Admin)
- Secure JWT token storage

### 🏠 Home Dashboard
- Personalized greeting based on time of day
- Service times and schedule
- Quick action buttons (Live Stream, Events, Give, Prayer)
- Upcoming events preview
- Recent sermons preview
- Pull-to-refresh functionality

### 📰 Church Feed
- Social hub for church members
- Post updates and announcements
- Like, comment, and share posts
- Image sharing
- Real-time feed updates

### 📅 Events
- View all church events
- Filter by category (Service, Conference, Seminar, Outreach, Fellowship)
- Event registration
- Event details with images
- Location and time information

### 🎙️ Sermons
- Browse sermon library
- Filter by category (Sunday Service, Bible Study, Special, Conference)
- Video, audio, and PDF resources
- Sermon thumbnails
- Preacher and date information

### 🙏 Prayer Requests
- Submit prayer requests
- Category selection (General, Health, Family, Work, Finances, Spiritual)
- Mark requests as urgent
- Email notifications to prayer team
- Confidential handling

### 💝 Giving/Donations
- Bank account details with copy-to-clipboard
- Record giving/donations
- Multiple purposes (Tithe, Offering, Building Fund, Missions, Special Project)
- Quick amount selection
- Anonymous giving option
- Giving history tracking

### 📺 Live Streaming
- Watch live services
- Service schedule
- Reminder notifications
- Past broadcasts archive
- Real-time status indicator

### 👤 Profile Management
- View and edit profile
- Role badge display
- Quick access to personal features
- Settings and preferences
- Logout functionality

## Tech Stack

- **React Native** - Mobile framework
- **Expo** - Development platform
- **TypeScript** - Type-safe development
- **React Navigation** - Navigation library
- **Axios** - HTTP client
- **AsyncStorage** - Local data persistence
- **React Native Paper** - UI components

## Prerequisites

- Node.js 14+ installed
- npm or yarn package manager
- Expo CLI (`npm install -g expo-cli`)
- Backend server running on `http://localhost:5000`

## Installation

1. Navigate to the mobile directory:
```bash
cd mobile
```

2. Install dependencies:
```bash
npm install
```

3. Configure API endpoint:
Edit `src/services/api.ts` and update the `API_BASE_URL` to point to your backend server.

## Running the App

### Development Mode

Start the Expo development server:
```bash
npm start
```

This will open Expo Dev Tools in your browser where you can:
- Run on Android emulator
- Run on iOS simulator (Mac only)
- Scan QR code to run on physical device using Expo Go app

### Platform-Specific Commands

**Android:**
```bash
npm run android
```

**iOS (Mac only):**
```bash
npm run ios
```

**Web:**
```bash
npm run web
```

## Project Structure

```
mobile/
├── assets/              # Images, fonts, and other static assets
│   └── images/
├── src/
│   ├── components/      # Reusable UI components
│   ├── context/         # React context providers
│   │   └── AuthContext.tsx
│   ├── navigation/      # Navigation configuration
│   │   └── AppNavigator.tsx
│   ├── screens/         # Screen components
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── FeedScreen.tsx
│   │   ├── EventsScreen.tsx
│   │   ├── SermonsScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   ├── PrayerScreen.tsx
│   │   ├── GiveScreen.tsx
│   │   └── LiveStreamScreen.tsx
│   ├── services/        # API service layer
│   │   ├── api.ts
│   │   └── index.ts
│   ├── theme/           # Theme configuration
│   │   └── colors.ts
│   ├── types/           # TypeScript type definitions
│   │   └── index.ts
│   └── utils/           # Utility functions
├── App.tsx              # Root component
├── app.json             # Expo configuration
├── package.json         # Dependencies
└── tsconfig.json        # TypeScript configuration
```

## Configuration

### Theme Colors

The app uses Household Of Covenant And Faith Apostolic Ministry's brand colors:
- **Primary**: Burgundy/Maroon (#7f1d1d, #991b1b, #b91c1c)
- **Gold**: Accent colors (#78350f, #92400e, #b45309)

Colors can be customized in `src/theme/colors.ts`.

### Backend Integration

All API calls are configured to use the backend server at `http://localhost:5000/api`.

For production, update the `API_BASE_URL` in `src/services/api.ts` to your production server URL.

### Environment Variables

Create a `.env` file in the mobile directory:
```
API_BASE_URL=http://localhost:5000/api
```

## Features Coming Soon

- [ ] Real-time chat/messaging
- [ ] Bible and hymn book integration
- [ ] Offline content access
- [ ] Push notifications
- [ ] Google OAuth login
- [ ] Attendance tracking
- [ ] Department management
- [ ] Admin dashboard
- [ ] Document/letterhead system
- [ ] AI-powered features
- [ ] Video conferencing integration

## Building for Production

### Android

1. Configure `app.json` with your Android package name
2. Generate a keystore
3. Build the APK:
```bash
expo build:android
```

### iOS

1. Configure `app.json` with your iOS bundle identifier
2. Set up Apple Developer account
3. Build the IPA:
```bash
expo build:ios
```

## Troubleshooting

### Common Issues

**Metro bundler not starting:**
```bash
npx expo start --clear
```

**Dependencies not installing:**
```bash
rm -rf node_modules
npm install
```

**API connection issues:**
- Ensure backend server is running
- Check `API_BASE_URL` in `src/services/api.ts`
- Verify network connectivity

## Support

For issues or questions:
- Email: admin@wordofcovenant.org
- Church Address: 140, Obafemi Awolowo Road, Radio Bus stop, Ikorodu, Lagos Nigeria

## License

Copyright © 2026 Household Of Covenant And Faith Apostolic Ministry. All rights reserved.
