import React from 'react';
import { Text, View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';

// Auth Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

// Main Screens  
import HomeScreen from '../screens/HomeScreen';
import FeedScreen from '../screens/FeedScreen';
import EventsScreen from '../screens/EventsScreen';
import SermonsScreen from '../screens/SermonsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ChatListScreen from '../screens/ChatListScreen';
import ChatRoomScreen from '../screens/ChatRoomScreen';
import ChatRoomScreenEnhanced from '../screens/ChatRoomScreenEnhanced';
import GroupMembersScreen from '../screens/GroupMembersScreen';
import ChurchDocumentsScreen from '../screens/ChurchDocumentsScreen';
import PrayerScreen from '../screens/PrayerScreen';
import GiveScreen from '../screens/GiveScreen';
import LiveStreamScreen from '../screens/LiveStreamScreen';
import SettingsScreen from '../screens/SettingsScreen';
import VideoCallScreen from '../screens/VideoCallScreen';
import AudioCallScreen from '../screens/AudioCallScreen';

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
import GivingReportScreen from '../screens/GivingReportScreen';
import EventsReportScreen from '../screens/EventsReportScreen';
import GrowthReportScreen from '../screens/GrowthReportScreen';
import DepartmentManagementScreen from '../screens/DepartmentManagementScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

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
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>🏠</Text>,
        }}
      />
      <Tab.Screen
        name="Feed"
        component={FeedScreen}
        options={{
          tabBarLabel: 'Feed',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>📰</Text>,
          title: 'Church Feed',
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatListScreen}
        options={{
          tabBarLabel: 'Chat',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>💬</Text>,
          title: 'Messages',
        }}
      />
      <Tab.Screen
        name="Sermons"
        component={SermonsScreen}
        options={{
          tabBarLabel: 'Sermons',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>🎙️</Text>,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>👤</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

function MainStack() {
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
      <Stack.Screen name="Prayer" component={PrayerScreen} options={{ title: 'Prayer Request' }} />
      <Stack.Screen name="Give" component={GiveScreen} options={{ title: 'Give' }} />
      <Stack.Screen name="LiveStream" component={LiveStreamScreen} options={{ title: 'Live Stream' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile' }} />
      <Stack.Screen name="MyEvents" component={MyEventsScreen} options={{ title: 'My Events' }} />
      <Stack.Screen name="MyPrayers" component={MyPrayersScreen} options={{ title: 'My Prayer Requests' }} />
      <Stack.Screen name="GivingHistory" component={GivingHistoryScreen} options={{ title: 'Giving History' }} />
      <Stack.Screen name="Support" component={HelpSupportScreen} options={{ title: 'Help & Support' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
      
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
      <Stack.Screen 
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
      />
      
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
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
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
    <NavigationContainer>
      {isAuthenticated ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

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
