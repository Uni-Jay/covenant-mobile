# 🎨 Theme System Guide

## Overview
The mobile app now has a comprehensive light/dark mode theme system that automatically adapts to user preferences and system settings.

## Features
- ✅ Light and Dark themes
- ✅ Auto mode (follows system preference)
- ✅ Persistent theme selection (saved with AsyncStorage)
- ✅ Beautiful modern UI for chat screens
- ✅ Instant message deletion feedback
- ✅ Theme-aware colors throughout the app

## How It Works

### ThemeContext
Located at `mobile/src/context/ThemeContext.tsx`, the ThemeContext provides:

```typescript
interface ThemeContextType {
  theme: 'light' | 'dark';           // Current active theme
  themeMode: 'light' | 'dark' | 'auto';  // User preference
  setThemeMode: (mode: ThemeMode) => void;  // Change theme
  colors: ColorPalette;               // Current color palette
}
```

### Using the Theme Hook

In any component:

```typescript
import { useTheme } from '../context/ThemeContext';

const MyComponent = () => {
  const { colors, theme, themeMode, setThemeMode } = useTheme();
  
  return (
    <View style={{ backgroundColor: colors.background }}>
      <Text style={{ color: colors.text }}>Hello World</Text>
    </View>
  );
};
```

### Available Colors

#### Primary (Blue)
- `colors.primary[50]` - Very light blue
- `colors.primary[600]` - Main brand blue
- `colors.primary[700]` - Darker blue

#### Secondary (Pink/Accent)
- `colors.secondary[500]` - Accent pink
- `colors.secondary[600]` - Darker pink

#### Gray Scale
- `colors.gray[50-900]` - Full gray palette

#### Semantic Colors
- `colors.background` - Main background
- `colors.surface` - Cards, bubbles
- `colors.text` - Primary text
- `colors.textSecondary` - Secondary text
- `colors.border` - Borders and dividers
- `colors.error` - Error red (#EF4444)
- `colors.success` - Success green (#10B981)
- `colors.warning` - Warning orange (#F59E0B)

## Updated Screens

### ChatListScreen
- ✅ Gradient header with blue theme
- ✅ Modern card design with shadows
- ✅ Theme-aware colors
- ✅ Gradient unread badges
- ✅ Larger, cleaner icons

### ChatRoomScreenEnhanced
- ✅ Gradient header matching ChatListScreen
- ✅ Theme-aware message bubbles
  - Own messages: Blue gradient (`colors.primary[600]`)
  - Other messages: Surface color (`colors.surface`)
- ✅ Theme-aware text colors
- ✅ Gradient send button
- ✅ Modern input design with rounded corners
- ✅ Better shadows and elevations

## Switching Themes

### Programmatically
```typescript
const { setThemeMode } = useTheme();

// Set to light mode
setThemeMode('light');

// Set to dark mode
setThemeMode('dark');

// Set to auto (follows system)
setThemeMode('auto');
```

### Adding a Theme Toggle UI
To add a theme selector in settings/profile:

```typescript
import { useTheme } from '../context/ThemeContext';

const SettingsScreen = () => {
  const { themeMode, setThemeMode } = useTheme();
  
  return (
    <View>
      <TouchableOpacity onPress={() => setThemeMode('light')}>
        <Text>Light Mode {themeMode === 'light' && '✓'}</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => setThemeMode('dark')}>
        <Text>Dark Mode {themeMode === 'dark' && '✓'}</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => setThemeMode('auto')}>
        <Text>Auto (System) {themeMode === 'auto' && '✓'}</Text>
      </TouchableOpacity>
    </View>
  );
};
```

## Chat Performance Improvements

### Instant Read Marking
- Messages marked as read immediately when viewed
- Optimistic UI updates before server confirmation
- 2-second polling for new messages (reduced from 5s)

### Instant Message Deletion
- Messages disappear from UI immediately
- Server deletion happens in background
- Automatic reload on error for recovery

### Focus-Based Updates
- Messages marked as read when screen gains focus
- Works with app state changes (foreground/background)
- Efficient with `useFocusEffect` hook

## Testing Dark Mode

### iOS Simulator
1. Open Settings app
2. Go to Developer > Appearance
3. Toggle between Light/Dark

### Android Emulator
1. Swipe down from top
2. Tap Settings gear icon
3. Search for "Dark theme"
4. Toggle on/off

### Testing Auto Mode
Set theme to 'auto' in app, then change system theme to see automatic adaptation.

## Migration Guide

### Converting Existing Screens

1. **Import useTheme hook:**
```typescript
import { useTheme } from '../context/ThemeContext';
```

2. **Use the hook:**
```typescript
const { colors, theme } = useTheme();
```

3. **Replace hardcoded colors:**
```typescript
// Before
backgroundColor: '#FFFFFF'
color: '#111827'
borderColor: '#E5E7EB'

// After
backgroundColor: colors.surface
color: colors.text
borderColor: colors.border
```

4. **Use inline styles for dynamic colors:**
```typescript
<View style={[styles.container, { backgroundColor: colors.background }]}>
  <Text style={[styles.text, { color: colors.text }]}>Hello</Text>
</View>
```

## Best Practices

1. **Use semantic colors** - Prefer `colors.background` over `colors.gray[50]`
2. **Use LinearGradient for accents** - Creates depth and visual interest
3. **Keep static styles in StyleSheet** - Only use inline styles for dynamic colors
4. **Test both themes** - Always verify appearance in light and dark modes
5. **Use appropriate shadows** - Adjust opacity for dark mode visibility

## Color Contrast

### Light Mode
- Background: Very light (#F9FAFB)
- Text: Very dark (#111827)
- High contrast for readability

### Dark Mode
- Background: Very dark (#0F172A)
- Text: Very light (#F9FAFB)
- Inverted palette for comfortable viewing

## Next Steps

To fully implement the theme system throughout the app:

1. Update remaining screens (Home, Profile, Events, etc.)
2. Add theme toggle in Settings/Profile screen
3. Test all screens in both light and dark modes
4. Adjust colors as needed for better aesthetics
5. Consider adding custom theme options

---

**Note:** The theme preference is automatically saved to AsyncStorage and persists across app restarts.
