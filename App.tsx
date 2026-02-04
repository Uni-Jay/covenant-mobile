import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import * as SplashScreenExpo from 'expo-splash-screen';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import SplashScreen from './src/components/SplashScreen';

// Hide Expo splash immediately
SplashScreenExpo.preventAutoHideAsync()
  .then(() => SplashScreenExpo.hideAsync())
  .catch(() => {});

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Auto-hide splash after 2 minutes
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 120000);

    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <ErrorBoundary>
      <View style={{ flex: 1 }}>
        <AuthProvider>
          <AppNavigator />
          <StatusBar style="light" />
        </AuthProvider>
      </View>
    </ErrorBoundary>
  );
}
