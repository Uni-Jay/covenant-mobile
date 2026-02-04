import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';

const isSuperAdmin = (user: any) => {
  if (!user) return false;
  const departments = user.departments || [];
  
  // Anyone with Media department gets super admin access
  return departments.some((d: string) => d.toLowerCase() === 'media');
};

const isMediaOrAdmin = (user: any) => {
  if (!user) return false;
  
  // Anyone with Media department has full access
  if (isSuperAdmin(user)) return true;
  
  const role = user.role?.toLowerCase();
  
  return (
    role === 'admin' ||
    role === 'super_admin' ||
    role === 'media_head'
  );
};

export default function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  // Define menu items with role restrictions
  const allMenuItems = [
    { icon: '👤', title: 'Edit Profile', route: 'EditProfile', requiresAdmin: false },
    { icon: '🔔', title: 'Notifications', route: 'Notifications', requiresAdmin: false },
    { icon: '📅', title: 'Events', route: 'Events', requiresAdmin: false },
    { icon: '✅', title: 'Scan Attendance', route: 'Attendance', requiresAdmin: false },
    { icon: '👥', title: 'First Timers', route: 'FirstTimers', requiresAdmin: false },
    { icon: '📺', title: 'Live Stream', route: 'LiveStream', requiresAdmin: false },
    { icon: '🎙️', title: 'Sermons', route: 'Sermons', requiresAdmin: false },
    { icon: '💝', title: 'Give', route: 'Give', requiresAdmin: false },
    { icon: '💳', title: 'Giving History', route: 'GivingHistory', requiresAdmin: false },
    { icon: '⚙️', title: 'Settings', route: 'Settings', requiresAdmin: false },
    { icon: '❓', title: 'Help & Support', route: 'Support', requiresAdmin: false },
    
    // Super Admin Only Features
    { icon: '📊', title: 'Dashboard', route: 'Dashboard', requiresAdmin: true },
    { icon: '🏢', title: 'Department Management', route: 'DepartmentManagement', requiresAdmin: true },
    { icon: '📅', title: 'My Events', route: 'MyEvents', requiresAdmin: true },
    { icon: '🙏', title: 'Prayer Requests', route: 'Prayer', requiresAdmin: true },
    { icon: '🙏', title: 'My Prayer Requests', route: 'MyPrayers', requiresAdmin: true },
    { icon: '📋', title: 'Attendance Report', route: 'AttendanceReport', requiresAdmin: true },
    { icon: '🔳', title: 'Generate QR Code', route: 'GenerateAttendanceQR', requiresAdmin: true },
    { icon: '✍️', title: 'Manual Attendance', route: 'ManualAttendance', requiresAdmin: true },
    { icon: '📱', title: 'Scan First Timer', route: 'FirstTimerQR', requiresAdmin: true },
    { icon: '📝', title: 'Register First Timer', route: 'FirstTimerRegister', requiresAdmin: true },
    { icon: '💰', title: 'Giving Report', route: 'GivingReport', requiresAdmin: true },
    { icon: '📅', title: 'Events Report', route: 'EventsReport', requiresAdmin: true },
    { icon: '📈', title: 'Growth Report', route: 'GrowthReport', requiresAdmin: true },
  ];

  // Filter menu items based on user role
  const menuItems = allMenuItems.filter(item => 
    !item.requiresAdmin || isMediaOrAdmin(user)
  );

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.fullName?.charAt(0) || 'U'}
            </Text>
          </View>
        </View>
        <Text style={styles.name}>{user?.fullName || 'User'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        {user?.gender && (
          <Text style={styles.genderText}>
            {user.gender === 'male' ? '👨 Brother' : '👩 Sister'}
          </Text>
        )}
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user?.role?.toUpperCase()}</Text>
        </View>
        
        {/* Departments Display */}
        {user?.departments && user.departments.length > 0 && (
          <View style={styles.departmentsContainer}>
            <Text style={styles.departmentsTitle}>Departments:</Text>
            <View style={styles.departmentsList}>
              {user.departments.map((dept: string, idx: number) => (
                <View key={idx} style={styles.departmentBadge}>
                  <Text style={styles.departmentText}>{dept}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Menu Items */}
      <View style={styles.menu}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => navigation.navigate(item.route)}
          >
            <View style={styles.menuItemLeft}>
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={styles.menuTitle}>{item.title}</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appInfoText}>Word of Covenant Church</Text>
        <Text style={styles.appInfoText}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary[800],
    padding: 32,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.primary[200],
  },
  avatarText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.primary[600],
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: colors.white,
    opacity: 0.9,
    marginBottom: 8,
  },
  genderText: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.9,
    marginBottom: 12,
  },
  roleBadge: {
    backgroundColor: colors.secondary[600],
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    elevation: 2,
    shadowColor: colors.secondary[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    marginBottom: 12,
  },
  roleText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  departmentsContainer: {
    marginTop: 8,
    width: '100%',
    alignItems: 'center',
  },
  departmentsTitle: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  departmentsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  departmentBadge: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  departmentText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '600',
  },
  menu: {
    backgroundColor: colors.white,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.primary[100],
    elevation: 2,
    shadowColor: colors.primary[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  menuTitle: {
    fontSize: 16,
    color: colors.gray[900],
  },
  menuArrow: {
    fontSize: 24,
    color: colors.gray[400],
  },
  logoutButton: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.error,
  },
  logoutText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: 'bold',
  },
  appInfo: {
    alignItems: 'center',
    padding: 32,
  },
  appInfoText: {
    fontSize: 12,
    color: colors.gray[500],
    marginBottom: 4,
  },
});
