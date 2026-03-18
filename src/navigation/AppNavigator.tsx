import React from 'react';
import { Text, View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer, NavigationContainerRef, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { hasLeadershipAccess, hasMediaDepartment } from '../utils/rolePermissions';

// Auth Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';

// Main Screens  
import HomeScreen from '../screens/HomeScreen';
import FeedScreen from '../screens/FeedScreen';
import EventsScreen from '../screens/EventsScreen';
import EventDetailScreen from '../screens/EventDetailScreen';
import EventManagementScreen from '../screens/EventManagementScreen';
import SermonsScreen from '../screens/SermonsScreen';
import SermonDetailScreen from '../screens/SermonDetailScreen';
import SermonManagementScreen from '../screens/SermonManagementScreen';
import VideoPlayerScreen from '../screens/VideoPlayerScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ChatListScreen from '../screens/ChatListScreen';
import ChatRoomScreen from '../screens/ChatRoomScreen';
import ChatRoomScreenEnhanced from '../screens/ChatRoomScreenEnhanced';
import GroupMembersScreen from '../screens/GroupMembersScreen';
import ChurchDocumentsScreen from '../screens/ChurchDocumentsScreen';
import PrayerScreen from '../screens/PrayerScreen';
import GiveScreen from '../screens/GiveScreen';
import DonationApprovalScreen from '../screens/DonationApprovalScreen';
import DonationReportsScreen from '../screens/DonationReportsScreen';
import PrayerManagementScreen from '../screens/PrayerManagementScreen';
import LiveStreamScreen from '../screens/LiveStreamScreen';
import SettingsScreen from '../screens/SettingsScreen';
// Call screens removed - causing issues
// import VideoCallScreen from '../screens/VideoCallScreen';
// import AudioCallScreen from '../screens/AudioCallScreen';

// Profile Screens
import EditProfileScreen from '../screens/EditProfileScreen';
import MyEventsScreen from '../screens/MyEventsScreen';
import MyPrayersScreen from '../screens/MyPrayersScreen';
import GivingHistoryScreen from '../screens/GivingHistoryScreen';
import HelpSupportScreen from '../screens/HelpSupportScreen';

// Admin/Dashboard Screens
import DashboardScreen from '../screens/DashboardScreen';
import AttendanceScreen from '../screens/AttendanceScreen';
import AttendanceReportScreen from '../screens/AttendanceReportScreen';
import FirstTimerQRScreen from '../screens/FirstTimerQRScreen';
import FirstTimerRegisterScreen from '../screens/FirstTimerRegisterScreen';
import FirstTimersScreen from '../screens/FirstTimersScreen';
import GenerateAttendanceQRScreen from '../screens/GenerateAttendanceQRScreen';
import ManualAttendanceScreen from '../screens/ManualAttendanceScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import NotificationInboxScreen from '../screens/NotificationInboxScreen';
import GivingReportScreen from '../screens/GivingReportScreen';
import EventsReportScreen from '../screens/EventsReportScreen';
import GrowthReportScreen from '../screens/GrowthReportScreen';
import DepartmentManagementScreen from '../screens/DepartmentManagementScreen';
import UserManagementScreen from '../screens/UserManagementScreen';
import AIChatScreen from '../screens/AIChatScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Tab order for swipe navigation
const TAB_ORDER = ['Home', 'Feed', 'Chat', 'Sermons', 'Profile'];

// Swipe wrapper component for tab screens
function SwipeableTabScreen({ children, currentTab }: { children: React.ReactNode; currentTab: string }) {
  const navigation = useNavigation<any>();

  const navigateToTab = (tabName: string) => {
    navigation.navigate(tabName);
  };

  const panGesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .onEnd((event) => {
      'worklet';
      const SWIPE_THRESHOLD = 50;
      const velocityThreshold = 500;
      const currentIndex = TAB_ORDER.indexOf(currentTab);

      if (Math.abs(event.translationX) > SWIPE_THRESHOLD || Math.abs(event.velocityX) > velocityThreshold) {
        let targetIndex: number;
        
        if (event.translationX > 0) {
          // Swiped right - go to previous tab (left)
          targetIndex = currentIndex - 1;
        } else {
          // Swiped left - go to next tab (right)
          targetIndex = currentIndex + 1;
        }

        // Check boundaries and navigate
        if (targetIndex >= 0 && targetIndex < TAB_ORDER.length) {
          const targetTab = TAB_ORDER[targetIndex];
          // Use runOnJS to call navigation on JS thread
          runOnJS(navigateToTab)(targetTab);
        }
      }
    });

  return (
    <GestureDetector gesture={panGesture}>
      <View style={{ flex: 1 }}>
        {children}
      </View>
    </GestureDetector>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary[800],
        },
        headerTintColor: colors.white,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ title: 'Create Account' }}
      />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary[800],
        tabBarInactiveTintColor: colors.gray[500],
        tabBarStyle: {
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        headerStyle: {
          backgroundColor: colors.primary[800],
        },
        headerTintColor: colors.white,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size || 24} color={color} />
          ),
        }}
      >
        {() => (
          <SwipeableTabScreen currentTab="Home">
            <HomeScreen />
          </SwipeableTabScreen>
        )}
      </Tab.Screen>
      <Tab.Screen
        name="Feed"
        options={{
          tabBarLabel: 'Feed',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="newspaper" size={size || 24} color={color} />
          ),
          title: 'Church Feed',
        }}
      >
        {() => (
          <SwipeableTabScreen currentTab="Feed">
            <FeedScreen />
          </SwipeableTabScreen>
        )}
      </Tab.Screen>
      <Tab.Screen
        name="Chat"
        options={{
          tabBarLabel: 'Chat',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size || 24} color={color} />
          ),
          title: 'Messages',
        }}
      >
        {() => (
          <SwipeableTabScreen currentTab="Chat">
            <ChatListScreen />
          </SwipeableTabScreen>
        )}
      </Tab.Screen>
      <Tab.Screen
        name="Sermons"
        options={{
          tabBarLabel: 'Sermons',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="mic" size={size || 24} color={color} />
          ),
        }}
      >
        {() => (
          <SwipeableTabScreen currentTab="Sermons">
            <SermonsScreen />
          </SwipeableTabScreen>
        )}
      </Tab.Screen>
      <Tab.Screen
        name="Profile"
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size || 24} color={color} />
          ),
        }}
      >
        {() => (
          <SwipeableTabScreen currentTab="Profile">
            <ProfileScreen />
          </SwipeableTabScreen>
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

function MainStack() {
  const { user } = useAuth();
  const isAdminOrMedia = hasLeadershipAccess(user?.role) || hasMediaDepartment(user?.departments as any);

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary[800],
        },
        headerTintColor: colors.white,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Events" component={EventsScreen} options={{ title: 'Events' }} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} options={{ title: 'Event Details' }} />
      <Stack.Screen name="EventManagement" component={EventManagementScreen} options={{ title: 'Manage Events' }} />
      <Stack.Screen name="SermonDetail" component={SermonDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SermonManagement" component={SermonManagementScreen} options={{ title: 'Manage Sermons' }} />
      <Stack.Screen name="VideoPlayer" component={VideoPlayerScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Prayer" component={PrayerScreen} options={{ title: 'Prayer Request' }} />
      <Stack.Screen name="Give" component={GiveScreen} options={{ title: 'Give' }} />
      <Stack.Screen name="DonationApproval" component={DonationApprovalScreen} options={{ title: 'Approve Donations' }} />
      <Stack.Screen name="DonationReports" component={DonationReportsScreen} options={{ title: 'Donation Reports' }} />
      <Stack.Screen name="PrayerManagement" component={PrayerManagementScreen} options={{ title: 'Prayer Management' }} />
      <Stack.Screen name="LiveStream" component={LiveStreamScreen} options={{ title: 'Live Stream' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile' }} />
      <Stack.Screen name="MyEvents" component={MyEventsScreen} options={{ title: 'My Events' }} />
      <Stack.Screen name="MyPrayers" component={MyPrayersScreen} options={{ title: 'My Prayer Requests' }} />
      <Stack.Screen name="GivingHistory" component={GivingHistoryScreen} options={{ title: 'Giving History' }} />
      <Stack.Screen name="Support" component={HelpSupportScreen} options={{ title: 'Help & Support' }} />
      
      {/* Notification Screens */}
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Send Notifications' }} />
      <Stack.Screen name="NotificationInbox" component={NotificationInboxScreen} options={{ title: 'Notifications' }} />
      
      {/* Chat Room Screens */}
      <Stack.Screen name="ChatRoom" component={ChatRoomScreen} options={{ title: 'Chat' }} />
      <Stack.Screen 
        name="ChatRoomEnhanced" 
        component={ChatRoomScreenEnhanced} 
        options={{ 
          headerShown: false 
        }} 
      />
      <Stack.Screen name="GroupMembers" component={GroupMembersScreen} options={{ title: 'Group Members' }} />
      {/* Call screens removed - causing issues */}
      {/* <Stack.Screen 
        name="VideoCall" 
        component={VideoCallScreen} 
        options={{ 
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="AudioCall" 
        component={AudioCallScreen} 
        options={{ 
          headerShown: false 
        }} 
      /> */}
      
      {/* Church Documents */}
      <Stack.Screen name="ChurchDocuments" component={ChurchDocumentsScreen} options={{ title: 'Church Documents' }} />
      
      {/* Dashboard & Admin Screens */}
      <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Dashboard' }} />
      <Stack.Screen name="Attendance" component={AttendanceScreen} options={{ title: 'Scan Attendance QR' }} />
      <Stack.Screen name="AttendanceReport" component={AttendanceReportScreen} options={{ title: 'Attendance Report' }} />
      <Stack.Screen name="FirstTimerQR" component={FirstTimerQRScreen} options={{ title: 'Scan First Timer' }} />
      <Stack.Screen name="FirstTimerRegister" component={FirstTimerRegisterScreen} options={{ title: 'Register First Timer' }} />
      <Stack.Screen name="FirstTimers" component={FirstTimersScreen} options={{ title: 'First Timers' }} />
      <Stack.Screen name="GenerateAttendanceQR" component={GenerateAttendanceQRScreen} options={{ title: 'Generate QR Code' }} />
      <Stack.Screen name="ManualAttendance" component={ManualAttendanceScreen} options={{ title: 'Manual Attendance' }} />
      <Stack.Screen name="GivingReport" component={GivingReportScreen} options={{ title: 'Giving Report' }} />
      <Stack.Screen name="EventsReport" component={EventsReportScreen} options={{ title: 'Events Report' }} />
      <Stack.Screen name="GrowthReport" component={GrowthReportScreen} options={{ title: 'Growth Report' }} />
      <Stack.Screen name="DepartmentManagement" component={DepartmentManagementScreen} options={{ title: 'Department Management' }} />
      <Stack.Screen name="UserManagement" component={UserManagementScreen} options={{ title: 'User Management' }} />
      <Stack.Screen name="AIChat" component={AIChatScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

const AppNavigator = React.forwardRef<NavigationContainerRef<any>, any>((props, ref) => {
  const { isAuthenticated, isLoading } = useAuth();

  console.log('AppNavigator: isLoading =', isLoading, ', isAuthenticated =', isAuthenticated);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  console.log('AppNavigator: Rendering navigation');

  return (
    <NavigationContainer ref={ref}>
      {isAuthenticated ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
});

export default AppNavigator;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.primary[600],
  },
});
