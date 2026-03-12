// Network Configuration
// Update LOCAL_IP with your computer's IP address (run: ipconfig in PowerShell)
// Make sure your phone and computer are on the same WiFi network

export const NETWORK_CONFIG = {
  // STEP 1: Run 'ipconfig' in PowerShell
  // STEP 2: Find "IPv4 Address" under "Wireless LAN adapter Wi-Fi"
  // STEP 3: Replace the IP below with YOUR computer's IP (keep the :5000)
  LOCAL_IP: '192.168.8.183', // ← Your actual IP address
  SERVER_PORT: '5000',
};

// Auto-generate the server URLs
export const getServerUrl = () => {
  return `http://${NETWORK_CONFIG.LOCAL_IP}:${NETWORK_CONFIG.SERVER_PORT}`;
};

export const getApiUrl = () => {
  return `${getServerUrl()}/api`;
};

export const getSocketUrl = () => {
  return getServerUrl();
};
