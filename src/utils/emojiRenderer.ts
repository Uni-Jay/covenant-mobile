/**
 * Emoji Renderer Utility
 * Provides consistent emoji rendering across the mobile app
 * Ensures proper display on both iOS and Android
 */

import { StyleSheet, TextStyle } from 'react-native';

// Standard emoji size
export const EMOJI_SIZES = {
  small: 16,
  base: 20,
  medium: 24,
  large: 28,
  xlarge: 32,
  massive: 40,
} as const;

// Common emoji used in the app
export const EMOJI = {
  // Calls
  videoCall: '📹',
  phoneCall: '📞',
  
  // Chat/Social
  chat: '💬',
  share: '↗️',
  
  // Actions
  accept: '✓',
  reject: '✕',
  checkDouble: '✓✓',
  
  // Reactions
  love: '❤️',
  laugh: '😂',
  surprised: '😮',
  sad: '😢',
  pray: '🙏',
  thumbsUp: '👍',
  thumbsDown: '👎',
  fire: '🔥',
  
  // Schedule
  sunday: '☀️',
  bible: '📖',
  moon: '🌙',
  
  // Documents
  pdf: '📕',
  doc: '📄',
  sheet: '📊',
  chart: '📈',
  zip: '🗜️',
  text: '📑',
  folder: '📁',
  
  // Star
  star: '⭐',
  yellowHeart: '💛',
  
  // Announcements
  announcement: '📢',
  
  // Other UI
  forward: '➡️',
  comment: '💬',
  smile: '😊',
} as const;

// Emoji style configurations for different contexts
export const emojiStyles = StyleSheet.create({
  // Base emoji rendering style
  base: {
    fontFamily: 'System',
  } as TextStyle,
  
  // For buttons and interactive elements
  button: {
    fontFamily: 'System',
    textAlignVertical: 'center',
  } as TextStyle,
  
  // For status indicators
  status: {
    fontFamily: 'System',
  } as TextStyle,
  
  // For reactions
  reaction: {
    fontFamily: 'System',
    textAlignVertical: 'center',
  } as TextStyle,
  
  // For call icons
  call: {
    fontFamily: 'System',
    textAlignVertical: 'center',
  } as TextStyle,
  
  // For large icons
  icon: {
    fontFamily: 'System',
    textAlignVertical: 'center',
  } as TextStyle,
});

/**
 * Get emoji with proper styling for rendering
 * @param emoji - The emoji string
 * @param size - The size (defaults to 'base')
 * @returns Object with emoji and font size
 */
export function getEmoji(
  emoji: keyof typeof EMOJI | string,
  size: keyof typeof EMOJI_SIZES = 'base'
) {
  const emojiStr = typeof emoji === 'string' ? emoji : EMOJI[emoji];
  const fontSize = EMOJI_SIZES[size];
  
  return {
    emoji: emojiStr,
    fontSize,
  };
}

/**
 * Ensure emoji displays properly with Android compatibility
 * Adds zero-width joiner and variation selectors if needed
 */
export function sanitizeEmoji(emoji: string): string {
  // Return emoji as-is, React Native handles encoding
  // but ensure variation selectors are included for color emoji
  if (!emoji.includes('\uFE0F')) {
    // Add variation selector for proper color rendering on some Android versions
    return emoji + '\uFE0F';
  }
  return emoji;
}

/**
 * Create emoji text with proper props for React Native
 */
export const emojiTextProps = {
  allowFontScaling: false, // Prevent scaling issues
  maxFontSizeMultiplier: 1, // Keep consistent sizing
} as const;
