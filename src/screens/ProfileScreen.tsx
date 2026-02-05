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
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
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
  const { themeMode, setThemeMode, colors: themeColors } = useTheme();

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
    
    // Admin and Media Department Features
    { icon: '✅', title: 'Approve Donations', route: 'DonationApproval', requiresAdminOrMedia: true },
    { icon: '📊', title: 'Donation Reports', route: 'DonationReports', requiresAdminOrMedia: true },
    { icon: '📄', title: 'Church Documents', route: 'ChurchDocuments', requiresAdminOrMedia: true },
    { icon: '🙏', title: 'Prayer Management', route: 'PrayerManagement', requiresAdminOrMedia: true },
    
    // Super Admin Only Features
    { icon: '📊', title: 'Dashboard', route: 'Dashboard', requiresAdmin: true },
    { icon: '🏢', title: 'Department Management', route: 'DepartmentManagement', requiresAdmin: true },
    { icon: '📅', title: 'My Events', route: 'MyEvents', requiresAdmin: true },
    { icon: '🙏', title: 'My Prayer Requests', route: 'MyPrayers', requiresAdmin: false },
    { icon: '📋', title: 'Attendance Report', route: 'AttendanceReport', requiresAdmin: true },
    { icon: '🔳', title: 'Generate QR Code', route: 'GenerateAttendanceQR', requiresAdmin: true },
    { icon: '✍️', title: 'Manual Attendance', route: 'ManualAttendance', requiresAdmin: true },
    { icon: '📱', title: 'Scan First Timer', route: 'FirstTimerQR', requiresAdmin: true },
    { icon: '📝', title: 'Register First Timer', route: 'FirstTimerRegister', requiresAdmin: true },
    { icon: '💰', title: 'Giving Report', route: 'GivingReport', requiresAdmin: true },
    { icon: '📅', title: 'Events Report', route: 'EventsReport', requiresAdmin: true },
    { icon: '📈', title: 'Growth Report', route: 'GrowthReport', requiresAdmin: true },
  ];

  // Check if user is in Media department
  const isMediaMember = React.useMemo(() => {
    if (!user) return false;
    
    // Check role
    if (user.role && ['super_admin', 'admin', 'media_head', 'media'].includes(user.role)) {
      return true;
    }
    
    // Check departments
    if (user.departments) {
      const depts = Array.isArray(user.departments) ? user.departments : [];
      return depts.some((dept: any) => {
        const deptName = typeof dept === 'string' ? dept : dept.name || '';
        return deptName.toLowerCase().includes('media') || deptName.toLowerCase().includes('prayer');
      });
    }
    
    return false;
  }, [user]);

  // Filter menu items based on user role and department
  const menuItems = allMenuItems.filter(item => {
    // Show all items without restrictions
    if (!item.requiresAdmin && !item.requiresAdminOrMedia) return true;
    
    // Admin-only items
    if (item.requiresAdmin && !item.requiresAdminOrMedia) {
      return isMediaOrAdmin(user);
    }
    
    // Admin or Media department items
    if (item.requiresAdminOrMedia) {
      return isMediaOrAdmin(user) || isMediaMember;
    }
    
    return false;
  });

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Profile Header with Enhanced Gradient */}
      <LinearGradient
        colors={[colors.primary[500], colors.primary[700], colors.primary[900]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        {/* Decorative circles */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
        
        <View style={styles.avatarContainer}>
          <LinearGradient
            colors={['#FFFFFF', '#F3F4F6']}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>
              {user?.fullName?.charAt(0) || 'U'}
            </Text>
          </LinearGradient>
          <View style={styles.avatarRing} />
        </View>
        <Text style={styles.name}>{user?.fullName || 'User'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        {user?.gender && (
          <View style={styles.genderBadge}>
            <Text style={styles.genderText}>
              {user.gender === 'male' ? '👨 Brother' : '👩 Sister'}
            </Text>
          </View>
        )}
        <View style={styles.roleBadge}>
          <LinearGradient
            colors={[colors.secondary[600], colors.secondary[700]]}
            style={styles.roleBadgeGradient}
          >
            <Text style={styles.roleText}>{user?.role?.toUpperCase()}</Text>
          </LinearGradient>
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
      </LinearGradient>

      {/* Menu Items */}
      <View style={[styles.menu, { backgroundColor: themeColors.surface }]}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.menuItem,
              { borderBottomColor: themeColors.border },
              index === menuItems.length - 1 && styles.lastMenuItem
            ]}
            onPress={() => navigation.navigate(item.route)}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconContainer, { backgroundColor: themeColors.primary[50] }]}>
                <Text style={styles.menuIcon}>{item.icon}</Text>
              </View>
              <Text style={[styles.menuTitle, { color: themeColors.text }]}>{item.title}</Text>
            </View>
            <Text style={[styles.menuArrow, { color: themeColors.textSecondary }]}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout Button */}
      <TouchableOpacity 
        style={styles.logoutButton} 
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['rgba(239, 68, 68, 0.1)', 'rgba(239, 68, 68, 0.05)']}
          style={styles.logoutGradient}
        >
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>Logout</Text>
        </LinearGradient>
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
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 32,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    position: 'relative',
    overflow: 'hidden',
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -100,
    right: -50,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -30,
    left: -40,
  },
  avatarContainer: {
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarRing: {
    position: 'absolute',
    width: 136,
    height: 136,
    borderRadius: 68,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
    borderStyle: 'dashed',
    top: -8,
    left: -8,
  },
  avatarText: {
    fontSize: 56,
    fontWeight: 'bold',
    color: colors.primary[600],
    textShadowColor: 'rgba(0,0,0,0.08)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 6,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  email: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 12,
  },
  genderBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  genderText: {
    fontSize: 14,
    color: colors.white,
    fontWeight: '600',
  },
  roleBadge: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  roleBadgeGradient: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  roleText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  departmentsContainer: {
    marginTop: 8,
    width: '100%',
    alignItems: 'center',
  },
  departmentsTitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  departmentsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  departmentBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  departmentText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  menu: {
    marginTop: 20,
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.primary[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuIcon: {
    fontSize: 20,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  menuArrow: {
    fontSize: 28,
    fontWeight: '300',
  },
  logoutButton: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.error,
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  logoutGradient: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutIcon: {
    fontSize: 20,
  },
  logoutText: {
    color: colors.error,
    fontSize: 17,
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
