import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import api from './api';

// Complete web browser session on return
WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID = '538314378005-7sqems09ocusr7qefn065nkbq7lfarv7.apps.googleusercontent.com';
const GOOGLE_ANDROID_CLIENT_ID = '538314378005-i14i2a210499e17d87j8qrndtrjt347t.apps.googleusercontent.com';
const GOOGLE_IOS_CLIENT_ID = '538314378005-ufhjia386q6nq3m0mirhfudjfunpjnrj.apps.googleusercontent.com'; // Add iOS client ID from Google Console

export const googleAuthService = {
  // Process the authentication response
  processAuthResponse: async (idToken: string, userInfo: any) => {
    try {
      // Send Google token to backend
      const response = await api.post('/auth/google', {
        idToken: idToken,
        user: {
          email: userInfo.email || '',
          firstName: userInfo.given_name || '',
          lastName: userInfo.family_name || '',
          photo: userInfo.picture || null,
          googleId: userInfo.sub || '',
        },
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Google auth processing error:', error);
      throw error;
    }
  },

  signOut: async () => {
    // No specific sign out needed for expo-auth-session
    console.log('Google sign out');
  },
};

// Hook to use in components
export const useGoogleAuth = () => {
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    webClientId: GOOGLE_WEB_CLIENT_ID,
  });

  return {
    request,
    response,
    promptAsync,
  };
};
