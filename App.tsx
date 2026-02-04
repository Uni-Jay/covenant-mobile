import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import * as SplashScreenExpo from 'expo-splash-screen';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import SplashScreen from './src/components/SplashScreen';

// Keep native splash screen visible until app is ready
SplashScreenExpo.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    // Prepare app resources
    async function prepare() {
      try {
        // Keep splash visible while loading
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady) {
      // Hide native splash and show custom splash
      SplashScreenExpo.hideAsync().catch(() => {});
      
      // Auto-hide custom splash after 2 minutes
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 120000);

      return () => clearTimeout(timer);
    }
  }, [appIsReady]);

  // Show nothing until app is ready (native splash will show)
  if (!appIsReady) {
    return null;
  }

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
