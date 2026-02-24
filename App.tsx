import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreenExpo from 'expo-splash-screen';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import SplashScreen from './src/components/SplashScreen';
import socketService from './src/services/socket.service';

// Keep native splash screen visible until app is ready
SplashScreenExpo.preventAutoHideAsync().catch(() => {});

// Inner component that has access to auth context
function AppContent() {
  const { user } = useAuth();
  const navigationRef = React.useRef<any>(null);

  // Initialize socket service when user logs in
  useEffect(() => {
    if (user?.id) {
      console.log('[App] Connecting socket service for user:', user.id);
      socketService.connect(user.id);

      return () => {
        socketService.disconnect();
      };
    }
  }, [user?.id]);

  return (
    <>
      <AppNavigator ref={navigationRef} />
      <StatusBar style="light" />
    </>
  );
}

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
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </ThemeProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
