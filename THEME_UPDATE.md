# Mobile App Theme Update - Blue, White, Red

## Overview
The entire mobile app has been updated to use a beautiful blue, white, and red color theme that matches the Word of Covenant Church logo. This creates a cohesive, patriotic design throughout the app.

## Color Palette (mobile/src/theme/colors.ts)

### Primary Colors (Blue)
- **50**: `#eff6ff` (Very light blue - backgrounds)
- **100**: `#dbeafe` (Light blue - borders, hover states)
- **200**: `#bfdbfe` (Medium light blue - borders, accents)
- **300**: `#93c5fd` (Medium blue)
- **400**: `#60a5fa` (Medium bright blue)
- **500**: `#3b82f6` (Bright blue)
- **600**: `#2563eb` (Primary button blue) ⭐ Most used
- **700**: `#1d4ed8` (Dark blue)
- **800**: `#1e40af` (Very dark blue - headers)
- **900**: `#1e3a8a` (Darkest blue - text, shadows)

### Secondary Colors (Red)
- **50**: `#fef2f2` (Very light red)
- **100**: `#fee2e2` (Light red)
- **200**: `#fecaca` (Medium light red)
- **300**: `#fca5a5` (Medium red)
- **400**: `#f87171` (Medium bright red)
- **500**: `#ef4444` (Bright red)
- **600**: `#dc2626` (Primary CTA red) ⭐ Most used
- **700**: `#b91c1c` (Dark red)
- **800**: `#991b1b` (Very dark red)
- **900**: `#7f1d1d` (Darkest red)

### Usage
- White: `#ffffff` (card backgrounds, text on dark backgrounds)
- Background: `#f9fafb` (light gray for app background)
- Gold, Gray palettes remain for accents

## Updated Screens

### 1. **Splash Screen** (SplashScreen.tsx) ✅
- Blue gradient background: `#1e3a8a → #2563eb → #3b82f6`
- White church name and motto text
- Light blue verse text
- Red continue button (`colors.secondary[600]`)
- Church logo displayed prominently

### 2. **Login Screen** (LoginScreen.tsx) ✅
- Blue logo container with white border (`colors.primary[700]`)
- Blue titles and subtitles (`colors.primary[900]`, `colors.primary[700]`)
- Blue verse text (`colors.primary[600]`)
- Blue input borders (2px, `colors.primary[200]`)
- Blue login button with elevation (`colors.primary[600]`)
- Red register link (`colors.secondary[600]`)

### 3. **Register Screen** (RegisterScreen.tsx) ✅
- Blue verse text (`colors.primary[600]`)
- Blue input borders (2px, `colors.primary[200]`)
- Light blue gender button active state (`colors.primary[50]` bg, `colors.primary[600]` border)
- Blue active department chips (`colors.primary[600]`)
- Blue register button (`colors.primary[600]`)
- Red login link (`colors.secondary[600]`)

### 4. **Home Screen** (HomeScreen.tsx) ✅
- Dark blue header (`colors.primary[800]`)
- Light blue verse text in header (`colors.primary[100]`)
- White cards with blue borders (`colors.primary[100]`)
- Light blue quick action cards (`colors.primary[50]` bg, `colors.primary[200]` border)
- Blue action text (`colors.primary[800]`)
- Red "See All" links (`colors.secondary[600]`)
- Blue shadows on all cards (`colors.primary[900]`)

### 5. **Feed Screen** (FeedScreen.tsx) ✅
- Blue post button (`colors.primary[600]`)
- White post cards with blue borders (`colors.primary[100]`)
- Blue avatar backgrounds (`colors.primary[600]`)
- Blue shadows on cards

### 6. **Events Screen** (EventsScreen.tsx) ✅
- Blue filter buttons when active (`colors.primary[600]`)
- White event cards with blue borders (`colors.primary[100]`)
- Blue category badges (`colors.primary[600]`)
- **Red register buttons** (`colors.secondary[600]`) for call-to-action
- Blue shadows

### 7. **Sermons Screen** (SermonsScreen.tsx) ✅
- Blue filter buttons when active (`colors.primary[600]`)
- White sermon cards with blue borders (`colors.primary[100]`)
- Blue category badges (`colors.primary[600]`)
- Blue preacher text (`colors.primary[700]`)
- Blue shadows

### 8. **Profile Screen** (ProfileScreen.tsx) ✅
- Dark blue header (`colors.primary[800]`)
- White avatar with blue border (`colors.primary[200]`)
- Blue avatar text (`colors.primary[600]`)
- **Red role badge** (`colors.secondary[600]`) for accent
- White menu with blue borders and shadows

### 9. **Prayer Screen** (PrayerScreen.tsx) ✅
- Dark blue header (`colors.primary[800]`)
- Blue category buttons when active (`colors.primary[600]`)
- Blue checkbox when active (`colors.primary[600]`)
- **Red submit button** (`colors.secondary[600]`)

### 10. **Give Screen** (GiveScreen.tsx) ✅
- Dark blue header (`colors.primary[800]`)
- Blue amount buttons when active (`colors.primary[600]`)
- Blue copy button (`colors.primary[600]`)
- **Red submit button** (`colors.secondary[600]`)

### 11. **LiveStream Screen** (LiveStreamScreen.tsx) ✅
- Dark blue header (`colors.primary[800]`)
- **Red join button** (`colors.secondary[600]`)
- Blue schedule day badges (`colors.primary[600]`)

### 12. **Settings Screen** (SettingsScreen.tsx) ✅
- White sections with blue borders (`colors.primary[100]`)
- Blue shadows on sections
- Rounded corners with elevation

### 13. **Navigation** (AppNavigator.tsx) ✅
- Blue tab bar active tint (`colors.primary[800]`)
- Dark blue header backgrounds (`colors.primary[800]`)
- White header text

## Design Principles

### Color Usage Strategy
1. **Blue (Primary)**: Used for most interactive elements, headers, borders
2. **White**: Card backgrounds, text on dark backgrounds
3. **Red (Secondary)**: Call-to-action buttons (Register, Submit, Join, Give)
4. **Light Blue**: Backgrounds for action cards, subtle accents

### Elevation & Shadows
- All cards and buttons now have blue-tinted shadows (`colors.primary[900]`)
- Red buttons have red-tinted shadows (`colors.secondary[900]`)
- Elevation values: 2-3 for cards, subtle depth

### Border Strategy
- 1px borders on cards: `colors.primary[100]` (very light blue)
- 2px borders on inputs: `colors.primary[200]` (light blue)
- Active state borders: `colors.primary[600]` (bright blue)

### Typography
- Dark text on light: `colors.gray[900]`, `colors.primary[900]`
- Light text on dark: `colors.white`, `colors.primary[100]`
- Accent text: `colors.primary[700]`, `colors.secondary[600]`

## Visual Hierarchy

### Primary Actions (Red)
Used for important call-to-actions:
- Event registration buttons
- Prayer request submission
- Donation submission
- Live stream join buttons

### Secondary Actions (Blue)
Used for general interactions:
- Login/Register buttons
- Post/Share buttons
- Filter buttons
- Copy buttons
- Category badges

### Informational (Light Blue)
Used for non-critical elements:
- Quick action cards
- Backgrounds
- Hover states

## Branding Consistency
All colors derived from the Word of Covenant Church logo:
- **Blue**: Represents wisdom, trust, stability
- **White**: Represents purity, light, truth
- **Red**: Represents passion, love, action

The patriotic color scheme (blue, white, red) creates a strong, memorable brand identity that ties the digital experience to the physical church logo.

## Testing Checklist
- [ ] All screens display with correct colors
- [ ] Buttons have proper elevation and shadows
- [ ] Active states are clearly visible
- [ ] Text is readable on all backgrounds
- [ ] Cards have subtle blue borders
- [ ] Navigation headers are dark blue
- [ ] Call-to-action buttons are red
- [ ] Church logo displays correctly in splash screen

## Next Steps
1. Test on both iOS and Android devices
2. Verify color contrast for accessibility
3. Consider adding gradient backgrounds to more screens
4. Implement department-based post filtering with blue chips
5. Add loading states with blue spinners
