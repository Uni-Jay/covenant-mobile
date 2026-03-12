// Network Configuration
// Toggle between local development and production

// Set to 'production' to use Railway backend
// Set to 'development' to use local server
const MODE = 'production'; // Change to 'development' for local testing

const NETWORK_CONFIG = {
  // Production (Railway)
  PRODUCTION_URL: 'https://covenant-server-production.up.railway.app',
  
  // Local Development
  // For Android Emulator: Use 10.0.2.2 (maps to host's localhost)
  // For Real Device: Use your computer's IP (run 'ipconfig' in PowerShell)
  LOCAL_IP: '10.0.2.2',
  SERVER_PORT: '5000',
};

// Auto-generate the server URLs based on mode
export const getServerUrl = () => {
  if (MODE === 'production') {
    return NETWORK_CONFIG.PRODUCTION_URL;
  }
  return `http://${NETWORK_CONFIG.LOCAL_IP}:${NETWORK_CONFIG.SERVER_PORT}`;
};

export const getApiUrl = () => {
  return `${getServerUrl()}/api`;
};

export const getSocketUrl = () => {
  return getServerUrl();
};
