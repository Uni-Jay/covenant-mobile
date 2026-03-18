import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { Alert } from 'react-native';
import api from './api';

const GOOGLE_WEB_CLIENT_ID = '538314378005-7sqems09ocusr7qefn065nkbq7lfarv7.apps.googleusercontent.com';

// Configure Google Sign-In
try {
  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    offlineAccess: true,
    forceCodeForRefreshToken: true,
    scopes: ['profile', 'email'],
  });
} catch (error) {
  console.error('Failed to configure Google Sign-In:', error);
}

export const googleAuthService = {
  // Initialize Google Play Services
  initGoogleServices: async () => {
    try {
      await GoogleSignin.hasPlayServices();
      return true;
    } catch (error: any) {
      console.error('Google Play Services error:', error);
      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert(
          'Google Play Services Unavailable',
          'This device does not have Google Play Services installed or enabled.',
          [{ text: 'OK' }]
        );
      }
      return false;
    }
  },

  // Sign in with Google
  signIn: async () => {
    try {
      // First check if Play Services are available
      await GoogleSignin.hasPlayServices();
      
      // Sign in
      const userInfo = await GoogleSignin.signIn();
      const user = userInfo.data?.user;
      
      if (!user) {
        throw new Error('No user data returned from Google');
      }
      
      console.log('Google Sign-In Success:', {
        email: user.email,
        name: user.name,
      });
      
      // Get ID token
      const tokens = await GoogleSignin.getTokens();
      
      if (!tokens.idToken) {
        throw new Error('No ID token obtained from Google');
      }
      
      // Send to backend
      const response = await api.post('/auth/google', {
        idToken: tokens.idToken,
        user: {
          email: user.email || '',
          firstName: user.givenName || '',
          lastName: user.familyName || '',
          photo: user.photo || null,
          googleId: user.id || '',
        },
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      
      // Handle specific error codes
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        throw new Error('Sign in cancelled');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        throw new Error('Sign in already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Google Play Services not available on this device');
      } else if (error.code === 'DEVELOPER_ERROR') {
        throw new Error('Developer error: Check Google Cloud Console configuration.\n\n✓ Package name: com.wordofcovenant.app\n✓ Signing certificate SHA-1\n✓ OAuth consent screen\n✓ webClientId matches project');
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed with Google');
      } else {
        throw new Error(error.message || 'Failed to sign in with Google');
      }
    }
  },

  signOut: async () => {
    try {
      await GoogleSignin.signOut();
      console.log('Google sign out success');
    } catch (error) {
      console.error('Google sign out error:', error);
    }
  },
  
  // Check if signed in
  isSignedIn: async () => {
    try {
      return await GoogleSignin.hasPreviousSignIn();
    } catch (error) {
      return false;
    }
  },
};
