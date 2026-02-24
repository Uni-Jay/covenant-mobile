import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';
import api from './api';

const GOOGLE_WEB_CLIENT_ID = '538314378005-7sqems09ocusr7qefn065nkbq7lfarv7.apps.googleusercontent.com';

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: GOOGLE_WEB_CLIENT_ID, // From Firebase/Google Console
  offlineAccess: true, // Get refresh token
  forceCodeForRefreshToken: true,
});

export const googleAuthService = {
  // Sign in with Google
  signIn: async () => {
    try {
      // Check if device supports Google Play services
      await GoogleSignin.hasPlayServices();
      
      // Sign in
      const userInfo = await GoogleSignin.signIn();
      const user = userInfo.data?.user;
      
      console.log('Google Sign-In Success:', {
        email: user?.email,
        name: user?.name,
      });
      
      // Get ID token
      const tokens = await GoogleSignin.getTokens();
      
      // Send to backend
      const response = await api.post('/auth/google', {
        idToken: tokens.idToken,
        user: {
          email: user?.email || '',
          firstName: user?.givenName || '',
          lastName: user?.familyName || '',
          photo: user?.photo || null,
          googleId: user?.id || '',
        },
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        throw new Error('Sign in cancelled');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        throw new Error('Sign in already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Google Play services not available');
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
