# Mobile Emoji/Icon Rendering Fix Guide

## Problem Identified
Emoji and text-based icons were not displaying properly on the mobile app, particularly on Android devices. This was due to:

1. **Missing Font Configuration** - No explicit emoji font support configured in `app.json`
2. **Inconsistent Emoji Handling** - Different screens using raw emoji without proper styling
3. **Font Scaling Issues** - Emoji scaling with text, causing alignment and visibility problems
4. **Android Encoding** - Android needed explicit configuration for emoji support

## Solutions Implemented

### 1. Updated `app.json` with Build Properties
Added `expo-build-properties` plugin configuration to ensure Android properly handles emoji rendering:
- Configured minSdkVersion support
- Added Material Design library resolution for proper font handling

### 2. Created Emoji Utility (`src/utils/emojiRenderer.ts`)
Centralized emoji management with:
- **EMOJI Constants** - Predefined emoji for consistency
- **Size Presets** - EMOJI_SIZES for small, medium, large, massive sizes
- **emojiTextProps** - Standard props to prevent scaling issues:
  - `allowFontScaling: false` - Prevents unwanted text scaling
  - `maxFontSizeMultiplier: 1` - Keeps consistent sizing
- **Font Family** - Uses 'System' font for proper emoji rendering

### 3. Updated Key Components
Updated emoji rendering across critical screens:

#### IncomingCallModal.tsx
- Uses emoji for call type indicator (📹 for video, 📞 for audio)
- Added proper styling and emojiTextProps
- Font: System (size 40 for calls, 28 for buttons)

#### ChatRoomScreenEnhanced.tsx
- Reaction emojis (❤️, 😂, 😮, 😢, 🙏, 👍, 👎, 🔥)
- Message status indicators (✓ for sent, ✓✓ for read)
- All Text components now use emojiTextProps

#### FeedScreen.tsx
- Comment emoji (💬) and share emoji (↗️)
- Updated styling with fontFamily: 'System'
- Proper emoji text props applied

#### HomeScreenRedesign.tsx
- Service time icons (☀️, 🙏, 📖, 🌙, ⏰, 📅)
- Critical screen for user onboarding
- All emoji styled for proper rendering

## How to Use the Emoji Utility

### Import the utility:
```typescript
import { EMOJI, emojiTextProps, EMOJI_SIZES } from '../utils/emojiRenderer';
```

### Use predefined emoji:
```tsx
<Text {...emojiTextProps}>{EMOJI.phoneCall}</Text>
<Text {...emojiTextProps}>{EMOJI.love}</Text>
<Text {...emojiTextProps}>{EMOJI.accept}</Text>
```

### Add custom emoji with proper styling:
```tsx
<Text 
  style={{ fontSize: EMOJI_SIZES.large, fontFamily: 'System', textAlignVertical: 'center' }}
  {...emojiTextProps}
>
  🎉
</Text>
```

### Available Emoji Categories:

**Calls & Communication:**
- `EMOJI.videoCall` - 📹
- `EMOJI.phoneCall` - 📞
- `EMOJI.chat` - 💬
- `EMOJI.comment` - 💬

**Reactions & Emotions:**
- `EMOJI.love` - ❤️
- `EMOJI.laugh` - 😂
- `EMOJI.surprised` - 😮
- `EMOJI.sad` - 😢
- `EMOJI.pray` - 🙏

**Approval & Status:**
- `EMOJI.accept` - ✓
- `EMOJI.reject` - ✕
- `EMOJI.checkDouble` - ✓✓

**Schedule & Time:**
- `EMOJI.sunday` - ☀️
- `EMOJI.bible` - 📖
- `EMOJI.moon` - 🌙

**Other:**
- All emoji in `src/utils/emojiRenderer.ts`

## Style Properties to Use

When rendering emoji, always use:

```typescript
style={{ 
  fontSize: EMOJI_SIZES.medium,      // or appropriate size
  fontFamily: 'System',               // Critical for emoji rendering
  textAlignVertical: 'center',       // Proper alignment
}}
{...emojiTextProps}                   // Prevents scaling
```

## Adding New Emoji

To add new emoji to the system:

1. Add to `EMOJI` constants in `emojiRenderer.ts`:
```typescript
newEmoji: '🆕',
```

2. Use it with the utility:
```typescript
<Text {...emojiTextProps}>{EMOJI.newEmoji}</Text>
```

## Testing on Devices

### Android Testing:
1. Build APK: `npm run build:android:internal`
2. Install on Android device
3. Check IncomingCallModal, Chat reactions, and Feed action buttons
4. Verify emoji display in all screens

### iOS Testing:
1. Build: `npm run build:ios:internal`
2. Install on iOS device
3. Emoji should render uniformly across platforms

## Troubleshooting

### Emoji still not showing?
1. Ensure `allowFontScaling={false}` is set
2. Check that `fontFamily: 'System'` is in style
3. Verify `textAlignVertical: 'center'` is applied
4. Try rebuilding the app with `npm run prebuild && npm run android`

### Emoji appearing too large/small?
1. Use the predefined EMOJI_SIZES constants
2. Don't adjust fontSize manually without testing

### Emoji misaligned?
1. Add `textAlignVertical: 'center'` to Text component
2. Use `justifyContent: 'center'` and `alignItems: 'center'` on parent View

## Related Files Modified

- `app.json` - Added expo-build-properties
- `src/utils/emojiRenderer.ts` - New utility file
- `src/components/IncomingCallModal.tsx` - Updated emoji rendering
- `src/screens/ChatRoomScreenEnhanced.tsx` - Updated reactions & status indicators
- `src/screens/FeedScreen.tsx` - Updated action bar emoji
- `src/screens/HomeScreenRedesign.tsx` - Updated service time emoji

## Next Steps

1. **Rebuild the app** with the new configuration:
   ```bash
   npm run prebuild
   npm run android  # for Android testing
   ```

2. **Test on physical devices** - Emoji rendering varies between simulators and real devices

3. **Update remaining screens** - If other screens use emoji, apply the same pattern

4. **Monitor for issues** - Check error logs if emoji still don't appear after rebuild

## Build Commands

```bash
# Clean rebuild
npm run prebuild

# Build for Android development
npm run android

# Build for Android internal distribution
npm run build:android:internal

# Build for iOS
npm run build:ios:internal

# List recent builds
npm run build:list
```

---

**Last Updated:** March 19, 2026
**Status:** Implementation Complete
