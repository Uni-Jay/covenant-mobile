/**
 * Icon Renderer Utility
 * Maps emoji to vector icons for proper mobile rendering
 * Uses @expo/vector-icons for consistent icon display
 */

export const ICON_SIZES = {
  small: 16,
  base: 20,
  medium: 24,
  large: 28,
  xlarge: 32,
  massive: 40,
} as const;

// Icon mapping: emoji equivalent -> { library, name, size }
export const ICONS = {
  // Calls
  videoCall: { library: 'MaterialIcons', name: 'videocam', color: '#1877F2' },
  phoneCall: { library: 'MaterialIcons', name: 'call', color: '#10B981' },
  
  // Chat/Social
  chat: { library: 'MaterialIcons', name: 'chat-bubble', color: '#1877F2' },
  comment: { library: 'MaterialIcons', name: 'comment', color: '#1877F2' },
  share: { library: 'MaterialIcons', name: 'share', color: '#1877F2' },
  
  // Actions
  accept: { library: 'MaterialIcons', name: 'check-circle', color: '#10B981' },
  reject: { library: 'MaterialIcons', name: 'cancel', color: '#EF4444' },
  check: { library: 'MaterialIcons', name: 'check', color: '#10B981' },
  checkDouble: { library: 'MaterialIcons', name: 'done-all', color: '#10B981' },
  
  // Schedule & Time
  sunday: { library: 'MaterialIcons', name: 'wb-sunny', color: '#FCD34D' },
  bible: { library: 'MaterialCommunityIcons', name: 'book-open', color: '#7C3AED' },
  moon: { library: 'MaterialIcons', name: 'nights-stay', color: '#6366F1' },
  clock: { library: 'MaterialIcons', name: 'schedule', color: '#F59E0B' },
  calendar: { library: 'MaterialIcons', name: 'event', color: '#EC4899' },
  
  // Search
  search: { library: 'MaterialIcons', name: 'search', color: '#666' },
} as const;

export type IconName = keyof typeof ICONS;

export interface IconConfig {
  library: 'MaterialIcons' | 'MaterialCommunityIcons' | 'Ionicons' | 'FontAwesome' | 'FontAwesome5' | 'Entypo' | 'EvilIcons' | 'SimpleLineIcons' | 'Octicons' | 'Zocial' | 'AntDesign';
  name: string;
  color?: string;
}

export function getIcon(iconName: IconName): IconConfig {
  return ICONS[iconName];
}
