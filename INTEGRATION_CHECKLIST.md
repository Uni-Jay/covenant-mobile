# Mobile UI Integration Checklist

Complete these steps to integrate the new calendar and user management UI into your mobile app.

---

## ✅ Phase 1: Backend Verification

- [ ] Calendar system backend is running
- [ ] User management endpoints are available
- [ ] Database tables created (5 calendar tables)
- [ ] Schedulers initialized (9 AM & 6 AM cron jobs)
- [ ] API base URL configured in `src/config/network.config.ts`
- [ ] Authentication middleware working
- [ ] Test API endpoints with Postman/Thunder Client

---

## ✅ Phase 2: Mobile App Updates

### Import and Export API Services
- [x] ✅ Added `calendarService` to `src/services/api.ts`
- [x] ✅ Added `userManagementService` to `src/services/api.ts`
- [x] ✅ Exported both services from api.ts

### Verify Service Imports
- [ ] Run `npm run build` to check for TypeScript errors
- [ ] Verify no import errors in IDE

---

## ✅ Phase 3: Add Screens to Navigation

### Update Navigation Stack
Add these screens to your navigation configuration:

```typescript
// Calendar Member Screens
<Stack.Screen 
  name="CalendarScreen" 
  component={CalendarScreen}
  options={{
    title: 'Church Calendar',
    headerShown: false
  }}
/>

<Stack.Screen 
  name="CalendarEventDetailScreen" 
  component={CalendarEventDetailScreen}
  options={{
    title: 'Event Details',
    headerShown: false
  }}
/>

<Stack.Screen 
  name="BirthdaySettingsScreen" 
  component={BirthdaySettingsScreen}
  options={{
    title: 'Birthday Settings',
    headerShown: false
  }}
/>

<Stack.Screen 
  name="CalendarFullView" 
  component={CalendarScreen}
  options={{
    title: 'All Events',
    headerShown: false
  }}
/>

// Admin Screens (add role checking)
<Stack.Screen 
  name="AdminCalendarManagementScreen" 
  component={AdminCalendarManagementScreen}
  options={{
    title: 'Manage Calendar',
    headerShown: false
  }}
/>

<Stack.Screen 
  name="AdminUserManagementScreen" 
  component={AdminUserManagementScreen}
  options={{
    title: 'Manage Users',
    headerShown: false
  }}
/>
```

- [ ] Add all 6 routes above to your navigation stack
- [ ] Import screens at top of navigation file
- [ ] Test navigation between screens (Android simulator)
- [ ] Test navigation between screens (iOS simulator)

---

## ✅ Phase 4: Add Tab Navigation

### Add Calendar Tab to Bottom Tab Navigator
```typescript
<Tab.Screen 
  name="CalendarTab" 
  component={CalendarStack}
  options={{
    tabBarLabel: '📅 Calendar',
    tabBarIcon: ({ color, size }) => (
      <MaterialCommunityIcons 
        name="calendar-month" 
        color={color} 
        size={size}
      />
    ),
    headerShown: false
  }}
/>
```

- [ ] Create CalendarStack (if using nested navigation)
- [ ] Add to tab navigator
- [ ] Verify tab appears in bottom navigation
- [ ] Verify icon displays correctly

---

## ✅ Phase 5: Admin Role Gating

### Protect Admin Screens from Unauthorized Access

```typescript
// In your admin menu or dashboard
const handleAdminCalendarPress = () => {
  if (user?.roles?.includes('admin')) {
    navigation.navigate('AdminCalendarManagementScreen');
  } else {
    Alert.alert('Access Denied', 'Admin privileges required');
  }
};

const handleAdminUsersPress = () => {
  if (user?.roles?.includes('admin')) {
    navigation.navigate('AdminUserManagementScreen');
  } else {
    Alert.alert('Access Denied', 'Admin privileges required');
  }
};
```

- [ ] Add role checks for AdminCalendarManagementScreen
- [ ] Add role checks for AdminUserManagementScreen
- [ ] Test as regular user (should see "Access Denied")
- [ ] Test as admin user (should navigate successfully)

---

## ✅ Phase 6: Add Admin Menu Items

### Update Your Admin Dashboard or Settings

Add these menu items to your admin panel:

```typescript
const adminMenuItems = [
  {
    icon: '📅',
    label: 'Manage Calendar',
    screen: 'AdminCalendarManagementScreen',
    description: 'Create and manage church events'
  },
  {
    icon: '👥',
    label: 'Manage Users',
    screen: 'AdminUserManagementScreen',
    description: 'Assign roles and manage members'
  },
];
```

- [ ] Add menu items to admin dashboard
- [ ] Add navigation handlers
- [ ] Test menu item navigation
- [ ] Verify only admin users see these items

---

## ✅ Phase 7: Test Calendar Functionality

### Test Member Calendar Features
- [ ] Navigate to CalendarScreen
- [ ] Verify events load from API
- [ ] Verify birthdays load from API
- [ ] Test tab switching (All → Events → Birthdays)
- [ ] Test pull-to-refresh
- [ ] Tap on event → CalendarEventDetailScreen
- [ ] Verify event details display correctly
- [ ] Test share button on event detail
- [ ] Tap settings gear → BirthdaySettingsScreen

### Test Birthday Settings
- [ ] Navigate to BirthdaySettingsScreen
- [ ] Toggle "Show My Birthday" switch
- [ ] Verify preference saves (check loading animation)
- [ ] Toggle email notification switch
- [ ] Toggle WhatsApp notification switch
- [ ] Go back to CalendarScreen
- [ ] Verify settings persist after navigation

### Test Admin Calendar Management
- [ ] Login as admin user
- [ ] Navigate to AdminCalendarManagementScreen
- [ ] View events in Events tab
- [ ] Click + button to create event
- [ ] Fill in event form (all 5 event types)
- [ ] Submit form → verify event created
- [ ] Edit event → verify changes saved
- [ ] Delete event → verify event removed
- [ ] Switch to Statistics tab
- [ ] Verify stats display correctly
- [ ] Test "Send Test Event Reminders" button
- [ ] Test "Send Test Birthday Greetings" button

### Test Admin User Management
- [ ] Login as admin user
- [ ] Navigate to AdminUserManagementScreen
- [ ] Verify user list loads
- [ ] Test search by name
- [ ] Test search by email
- [ ] Tap user card → open details modal
- [ ] Verify user information displays
- [ ] Test suspend button
- [ ] Test restore button
- [ ] Verify suspended users show different status

---

## ✅ Phase 8: Error Handling

### Test Error Scenarios
- [ ] Disconnect network → verify error message
- [ ] Kill API server → verify error message
- [ ] Invalid token → verify logout behavior
- [ ] Missing permissions → verify "Access Denied"
- [ ] Malformed API response → verify graceful handling

### Test Loading States
- [ ] Verify loading spinner shows while data fetches
- [ ] Verify loading spinner disappears after data loads
- [ ] Verify smooth transitions between states

---

## ✅ Phase 9: Performance Testing

- [ ] CalendarScreen loads in < 2 seconds
- [ ] Event list with 100 events performant
- [ ] User list with 1000 users performant (with pagination)
- [ ] Pull-to-refresh smooth (no janky animation)
- [ ] Modal open/close smooth
- [ ] Tab switching smooth

---

## ✅ Phase 10: Platform Testing

### Android
- [ ] All screens display correctly
- [ ] Navigation works smoothly
- [ ] Back button works
- [ ] Forms submit correctly
- [ ] Settings persist after app close/reopen

### iOS
- [ ] All screens display correctly
- [ ] Safe area respected (notch/home indicator)
- [ ] Navigation swipe gesture works
- [ ] Forms submit correctly
- [ ] Settings persist after app close/reopen

---

## ✅ Phase 11: Documentation

- [ ] Share `UI_IMPLEMENTATION_SUMMARY.md` with team
- [ ] Share `MOBILE_CALENDAR_UI_IMPLEMENTATION.md` with team
- [ ] Share `CALENDAR_SYSTEM_GUIDE.md` (backend reference) with team
- [ ] Document any customizations made
- [ ] Document role requirements for admin screens

---

## ✅ Phase 12: Production Preparation

### Before Release
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] No console errors or warnings
- [ ] No TypeScript errors
- [ ] No security vulnerabilities
- [ ] API credentials properly secured
- [ ] Error handling comprehensive
- [ ] Loading states smooth and user-friendly

### Release Steps
- [ ] Create release branch: `release/calendar-ui`
- [ ] Update version number
- [ ] Create release notes
- [ ] Build for distribution
- [ ] Test release build
- [ ] Merge to main branch
- [ ] Create GitHub release tag

---

## 🐛 Troubleshooting

### Issue: Screens don't appear in navigation
**Solution:** Verify imports at top of navigation file. Check route names match exactly.

### Issue: API calls fail with 401
**Solution:** Check auth token in AsyncStorage. Verify user is logged in. Check API token is still valid.

### Issue: Events not loading
**Solution:** Verify calendar backend is running. Check network config API URL. Test API endpoint with Postman.

### Issue: Admin screens accessible to non-admins
**Solution:** Add role check before navigation. Verify user.roles includes 'admin' string.

### Issue: Styles look wrong on some devices
**Solution:** Check Dimensions API usage. Test on multiple screen sizes. Verify SafeAreaView wrapping.

### Issue: Performance issues with large lists
**Solution:** Verify pagination implemented. Check no unnecessary re-renders. Use React.memo for list items.

---

## 📞 Support Resources

- **Backend API Reference:** `server/CALENDAR_SYSTEM_GUIDE.md`
- **System Overview:** `server/CALENDAR_IMPLEMENTATION_COMPLETE.md`
- **Role Structure:** `server/CHURCH_ROLE_STRUCTURE.md`
- **Mobile UI Guide:** `mobile/MOBILE_CALENDAR_UI_IMPLEMENTATION.md`

---

## ✨ Quick Reference

**5 Screens Added:**
1. CalendarScreen - Main calendar view
2. BirthdaySettingsScreen - Privacy/notification settings
3. CalendarEventDetailScreen - Event details
4. AdminCalendarManagementScreen - Calendar CRUD
5. AdminUserManagementScreen - User management

**2 Services Added:**
1. calendarService - 14 endpoints
2. userManagementService - 8 endpoints

**1 Component Added:**
1. BirthdayCard - Reusable birthday display

**Features:**
- Event type now includes "anniversary" ✅
- Full calendar management ✅
- User role management ✅
- Birthday privacy controls ✅
- Admin statistics dashboard ✅
- Test trigger buttons ✅

---

## 🎉 Success Criteria

You'll know the implementation is complete when:

✅ Calendar tab appears in bottom navigation  
✅ CalendarScreen loads events from API  
✅ Admin can create/edit/delete events  
✅ Members can toggle birthday visibility  
✅ Admin can suspend/restore users  
✅ All error states handled gracefully  
✅ No console errors or warnings  
✅ App builds without errors  
✅ All navigation works smoothly  
✅ Tests pass on Android and iOS  

---

**Last Updated:** May 14, 2026  
**Status:** Ready for Integration  
**Estimated Integration Time:** 2-4 hours
