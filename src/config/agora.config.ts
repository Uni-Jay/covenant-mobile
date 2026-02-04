// Agora Configuration
// Get your App ID from: https://console.agora.io/
// Sign up for free: https://sso.agora.io/en/signup

export const AGORA_CONFIG = {
  // Replace with your Agora App ID
  // To get started:
  // 1. Go to https://console.agora.io/
  // 2. Create a new project
  // 3. Copy the App ID here
  appId: 'b79d51e935a34c468f4c5970a698d81c',
  
  // Channel name will be generated dynamically based on group ID
  // Token is optional for testing (enable App Certificate in production)
  token: null as string | null,
  
  // Video encoding configuration
  videoConfig: {
    dimensions: {
      width: 640,
      height: 480,
    },
    frameRate: 15,
    bitrate: 0, // 0 = auto
  },
  
  // Audio configuration
  audioConfig: {
    sampleRate: 32000,
    channels: 1,
    bitrate: 48000,
  },
};

// Generate channel name from group ID
export const generateChannelName = (groupId: number): string => {
  return `group_${groupId}`;
};

// Generate unique user ID
export const generateUserId = (userId: number): number => {
  return userId;
};
