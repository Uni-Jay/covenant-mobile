# Departmental Features - Integration Guide

## Quick Setup

### 1. Import Screens into Navigation

Add to your navigation configuration file (typically `AppNavigator.tsx` or similar):

```typescript
import DepartmentsListScreen from '../screens/DepartmentsListScreen';
import DepartmentDetailScreen from '../screens/DepartmentDetailScreen';
import MyDepartmentsScreen from '../screens/MyDepartmentsScreen';
```

### 2. Add Stack Routes

Add these routes to your Stack Navigator:

```typescript
<Stack.Screen 
  name="DepartmentsList" 
  component={DepartmentsListScreen}
  options={{
    title: 'Departments',
    headerShown: false  // Custom headers built into screens
  }}
/>

<Stack.Screen 
  name="DepartmentDetail" 
  component={DepartmentDetailScreen}
  options={{
    title: 'Department Details',
    headerShown: false,
    animationEnabled: true
  }}
/>

<Stack.Screen 
  name="MyDepartments" 
  component={MyDepartmentsScreen}
  options={{
    title: 'My Departments',
    headerShown: false
  }}
/>
```

### 3. Add to Tab Navigator (Optional)

If you have a bottom tab navigator, add a Departments tab:

```typescript
<Tab.Screen 
  name="Departments" 
  component={MyDepartmentsScreen}
  options={{
    title: 'Departments',
    tabBarIcon: ({ color, size }) => (
      <MaterialCommunityIcons name="folder-multiple" color={color} size={size} />
    ),
    tabBarLabel: 'Departments',
    headerShown: false,
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.textSecondary
  }}
/>
```

### 4. Add Navigation Buttons

Add buttons in your main screen to navigate to departments:

**From Dashboard/Home**:
```typescript
<TouchableOpacity
  onPress={() => navigation.navigate('DepartmentsList')}
  style={styles.departmentButton}
>
  <MaterialCommunityIcons name="folder-multiple" size={24} color="white" />
  <Text>Departments</Text>
</TouchableOpacity>
```

**From Drawer/Menu**:
```typescript
<DrawerItem
  label="Departments"
  icon={({ color, size }) => (
    <MaterialCommunityIcons name="folder-multiple" color={color} size={size} />
  )}
  onPress={() => navigation.navigate('Departments')}
/>
```

## Navigation Flow

```
Home/Dashboard
    ↓
[Browse] → DepartmentsList 
    ↓ (tap card)
DepartmentDetail (with join/leave)
    ↓ (join)
MyDepartments (shows new department)

MyDepartments
    ↓ (tap department)
DepartmentDetail
    ↓ (leave)
MyDepartments (removed from list)
```

## Context & Dependencies Required

Make sure your project has these contexts and providers:

### 1. AuthContext
For getting current user info:
```typescript
import { useAuth } from '../context/AuthContext';

// In component:
const { user } = useAuth();
```

### 2. ThemeContext
For styling consistency:
```typescript
import { useTheme } from '../context/ThemeContext';

// In component:
const theme = useTheme();
// Use: theme.colors.primary, theme.colors.background, etc.
```

### 3. Services
departmentService is auto-imported:
```typescript
import { departmentService } from '../services';

// Available methods:
departmentService.getAllDepartments()
departmentService.getUserDepartments()
departmentService.joinDepartment()
departmentService.leaveDepartment()
// ... etc
```

## Feature Usage

### User Joining a Department
1. User opens DepartmentsList
2. Sees all available departments
3. Filters to view only joined departments
4. Taps a department card
5. Views DepartmentDetail
6. Taps "Join Department" button
7. Department added to "My Departments"
8. Can view members and leaders

### User Leaving a Department
1. User opens MyDepartments
2. Views their joined departments
3. Taps "Leave" button on department card
4. Confirms action in alert dialog
5. Department removed from list
6. Returns to browse view

### Admin Managing Departments
Via AdminCalendarManagementScreen or AdminUserManagementScreen:
1. View all members
2. Assign department roles
3. Promote to executives
4. Manage department leadership

## Environment Setup

### Required NPM Packages
```json
{
  "expo": "^48.0+",
  "react-native": "0.71+",
  "react-navigation": "^6.0+",
  "@react-native-async-storage/async-storage": "^1.17+",
  "axios": "^1.0+",
  "expo-linear-gradient": "^12.0+",
  "@expo/vector-icons": "^13.0+"
}
```

All should already be installed if you have the base app working.

## API Configuration

Ensure your backend has these endpoints:

```
GET  /departments                           - All departments
GET  /departments/:name/details             - Department details
GET  /departments/:name/members             - Members list
GET  /departments/executives                - Leaders list
GET  /departments/leaders                   - Church leaders
POST /departments/:name/join                - Join dept
POST /departments/:name/leave               - Leave dept
GET  /departments/user/my-departments       - User's depts
GET  /departments/user/roles                - User's roles
```

If endpoints don't exist, screens will gracefully handle with demo data using DEPARTMENT_CONFIGS.

## Troubleshooting

### Screens Not Showing Departments
1. Check API endpoint configuration
2. Verify token is being sent (AuthContext setup)
3. Check network requests in console
4. Ensure `departmentService` is properly exported

### Navigation Not Working
1. Verify route names match exactly
2. Check Stack Navigator configuration
3. Ensure screens are imported
4. Verify navigation prop is passed to components

### Styling Issues
1. Check ThemeContext is providing colors
2. Verify theme colors are defined
3. Check LinearGradient is installed
4. Ensure Material Community Icons are available

### Department Data Not Loading
1. Check backend API responses
2. Verify JWT token is valid
3. Check error messages in console
4. Try force refresh (pull-to-refresh)

## Performance Optimization

### Lazy Loading
Departments are loaded on-demand:
- DepartmentsList fetches all depts on mount
- MyDepartments fetches user depts on mount
- DepartmentDetail fetches members on mount

### Caching Strategy
Currently no caching implemented. To add caching:

```typescript
// In component
const [cache, setCache] = useState({});

const fetchData = async () => {
  if (cache[department]) {
    setData(cache[department]);
  } else {
    const data = await departmentService.getDepartmentDetails(department);
    setCache(prev => ({ ...prev, [department]: data }));
    setData(data);
  }
};
```

### Pagination
DepartmentDetail members list supports pagination:
```typescript
const [page, setPage] = useState(1);

const loadMore = async () => {
  const newMembers = await departmentService.getDepartmentMembers(
    department, 
    page + 1
  );
  setMembers([...members, ...newMembers]);
  setPage(page + 1);
};
```

## Testing Checklist

- [ ] Can view all departments
- [ ] Can filter departments
- [ ] Can join a department
- [ ] Can leave a department
- [ ] Can view department members
- [ ] Can view department leaders
- [ ] Can view personal departments
- [ ] Can view personal roles
- [ ] Pull-to-refresh works
- [ ] Error messages display
- [ ] Loading states show
- [ ] Empty states display
- [ ] Navigation flows work
- [ ] Theme colors apply
- [ ] Device rotation works
- [ ] Works on iOS
- [ ] Works on Android

## Support for New Features

### Adding Department-Specific Announcements
1. Create `DepartmentAnnouncementsScreen.tsx`
2. Add endpoint: `GET /departments/:name/announcements`
3. Add service method to departmentService
4. Add tab to DepartmentDetailScreen

### Adding Department Chat
1. Integrate with existing chat system
2. Auto-create chat groups when joining
3. Display in MyDepartmentsScreen

### Adding Department Events
1. Use existing calendar service
2. Filter events by department
3. Add department event display to DepartmentDetailScreen

## Support & Questions

For issues or questions:
1. Check console for error messages
2. Verify API responses in network tab
3. Check ThemeContext and AuthContext setup
4. Review navigation configuration
5. Test with demo data first (screens have fallbacks)
