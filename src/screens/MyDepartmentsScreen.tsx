import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
  FlatList,
  SectionList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { departmentService } from '../services';

interface Department {
  name: string;
  role?: string;
  joinedDate?: string;
}

interface DepartmentRole {
  department: string;
  role: string;
  position?: string;
}

const DEPARTMENT_CONFIGS: { [key: string]: { icon: string; color: string; description: string } } = {
  'Church Leadership': {
    icon: 'church',
    color: '#8B4513',
    description: 'Senior leadership and church administration',
  },
  'Youth': {
    icon: 'lightning-bolt',
    color: '#6C5CE7',
    description: 'Youth development and activities',
  },
  'Drama': {
    icon: 'theater-masks',
    color: '#4ECDC4',
    description: 'Drama productions and performances',
  },
  'Covenant Men': {
    icon: 'account-multiple',
    color: '#2C3E50',
    description: 'Men fellowship and outreach',
  },
  'Prayer': {
    icon: 'hands-pray',
    color: '#A29BFE',
    description: 'Prayer ministry and intercession',
  },
  'Media': {
    icon: 'video-camera',
    color: '#45B7D1',
    description: 'Broadcasting and media production',
  },
  'Goodwomen': {
    icon: 'heart',
    color: '#E84393',
    description: 'Women fellowship and support',
  },
  'Choir': {
    icon: 'music',
    color: '#FF6B6B',
    description: 'Music and worship ministry',
  },
  'Welfare': {
    icon: 'heart-handshake',
    color: '#FD79A8',
    description: 'Welfare and community care',
  },
  'Ushering': {
    icon: 'door-open',
    color: '#74B9FF',
    description: 'Ushering and hospitality',
  },
  'Children': {
    icon: 'human-child',
    color: '#FDCB6E',
    description: 'Children ministry and education',
  },
  'Evangelism': {
    icon: 'megaphone',
    color: '#FF7675',
    description: 'Evangelism and outreach',
  },
};

const MyDepartmentsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<DepartmentRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'departments' | 'roles'>('departments');

  const fetchUserDepartments = useCallback(async () => {
    try {
      setLoading(true);
      const [deptsResponse, rolesResponse] = await Promise.all([
        departmentService.getUserDepartments(),
        departmentService.getUserDepartmentRoles(),
      ]);

      let deptList: Department[] = [];
      if (Array.isArray(deptsResponse)) {
        deptList = deptsResponse.map((d: any) => ({
          name: typeof d === 'string' ? d : d.name,
          role: typeof d === 'object' ? d.role : 'member',
          joinedDate: typeof d === 'object' ? d.joinedDate : undefined,
        }));
      }

      let rolesList: DepartmentRole[] = [];
      if (Array.isArray(rolesResponse)) {
        rolesList = rolesResponse.map((r: any) => ({
          department: r.department,
          role: r.role,
          position: r.position,
        }));
      }

      setDepartments(deptList);
      setRoles(rolesList);
    } catch (error: any) {
      console.error('Failed to fetch user departments:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserDepartments();
  }, [fetchUserDepartments]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUserDepartments();
    setRefreshing(false);
  }, [fetchUserDepartments]);

  const handleViewDepartment = (departmentName: string) => {
    navigation.navigate('DepartmentDetail', { department: departmentName });
  };

  const handleLeaveDepartment = (departmentName: string) => {
    Alert.alert(
      'Leave Department',
      `Are you sure you want to leave the ${departmentName} department?`,
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Leave',
          onPress: async () => {
            try {
              await departmentService.leaveDepartment(departmentName);
              Alert.alert('Success', `You've left the ${departmentName} department`);
              await fetchUserDepartments();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to leave department');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const getDepartmentConfig = (name: string) => {
    return DEPARTMENT_CONFIGS[name] || {
      icon: 'folder',
      color: theme.colors.primary,
      description: 'Church department',
    };
  };

  const renderDepartmentCard = ({ item }: { item: Department }) => {
    const config = getDepartmentConfig(item.name);

    return (
      <TouchableOpacity
        onPress={() => handleViewDepartment(item.name)}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={[config.color, `${config.color}99`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.departmentCard}
        >
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name={config.icon as any}
                size={28}
                color="white"
              />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={styles.departmentName}>{item.name}</Text>
              <Text style={styles.departmentRole}>{item.role || 'Member'}</Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.cardDescription}>{config.description}</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="rgba(255,255,255,0.8)" />
          </View>

          <TouchableOpacity
            onPress={() => handleLeaveDepartment(item.name)}
            style={[styles.leaveButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
          >
            <MaterialCommunityIcons name="exit-to-app" size={14} color="white" />
            <Text style={styles.leaveButtonText}>Leave</Text>
          </TouchableOpacity>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderRoleCard = ({ item }: { item: DepartmentRole }) => {
    const config = getDepartmentConfig(item.department);

    return (
      <View style={[styles.roleCard, { backgroundColor: theme.colors.card, borderLeftColor: config.color }]}>
        <View style={styles.roleHeader}>
          <View style={styles.roleDepartment}>
            <MaterialCommunityIcons
              name={config.icon as any}
              size={24}
              color={config.color}
            />
            <Text style={[styles.roleDepartmentName, { color: theme.colors.text }]}>
              {item.department}
            </Text>
          </View>
          <View style={[styles.roleBadge, { backgroundColor: config.color }]}>
            <Text style={styles.roleBadgeText}>{item.role}</Text>
          </View>
        </View>

        {item.position && (
          <View style={styles.rolePositionContainer}>
            <MaterialCommunityIcons
              name="briefcase"
              size={14}
              color={theme.colors.textSecondary}
            />
            <Text style={[styles.rolePosition, { color: theme.colors.textSecondary }]}>
              {item.position}
            </Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading your departments...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          My Departments
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
          Your active ministries and roles
        </Text>
      </View>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity
          onPress={() => setTab('departments')}
          style={[
            styles.tab,
            tab === 'departments' && [
              styles.tabActive,
              { borderBottomColor: theme.colors.primary },
            ],
          ]}
        >
          <Text
            style={[
              styles.tabText,
              {
                color: tab === 'departments' ? theme.colors.primary : theme.colors.textSecondary,
              },
            ]}
          >
            Departments ({departments.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setTab('roles')}
          style={[
            styles.tab,
            tab === 'roles' && [
              styles.tabActive,
              { borderBottomColor: theme.colors.primary },
            ],
          ]}
        >
          <Text
            style={[
              styles.tabText,
              {
                color: tab === 'roles' ? theme.colors.primary : theme.colors.textSecondary,
              },
            ]}
          >
            Roles ({roles.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.tabContent}
      >
        {tab === 'departments' && (
          <>
            {departments.length > 0 ? (
              <>
                <FlatList
                  data={departments}
                  renderItem={renderDepartmentCard}
                  keyExtractor={(item) => item.name}
                  scrollEnabled={false}
                  ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                />
                <TouchableOpacity
                  onPress={() => navigation.navigate('DepartmentsList')}
                  style={[styles.explorButton, { backgroundColor: theme.colors.primary }]}
                >
                  <MaterialCommunityIcons name="plus-circle" size={18} color="white" />
                  <Text style={styles.explorButtonText}>Explore More Departments</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons
                  name="folder-open-outline"
                  size={48}
                  color={theme.colors.textSecondary}
                />
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                  You haven't joined any departments yet
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('DepartmentsList')}
                  style={[styles.emptyButton, { backgroundColor: theme.colors.primary }]}
                >
                  <Text style={styles.emptyButtonText}>Browse Departments</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {tab === 'roles' && (
          <>
            {roles.length > 0 ? (
              <FlatList
                data={roles}
                renderItem={renderRoleCard}
                keyExtractor={(item) => `${item.department}-${item.role}`}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons
                  name="crown-outline"
                  size={48}
                  color={theme.colors.textSecondary}
                />
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                  No active roles assigned yet
                </Text>
                <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
                  Contact your department lead to be assigned a role
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 3,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabContent: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    paddingBottom: 32,
  },
  departmentCard: {
    borderRadius: 12,
    overflow: 'hidden',
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeaderText: {
    flex: 1,
  },
  departmentName: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    marginBottom: 2,
  },
  departmentRole: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    flex: 1,
  },
  leaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  leaveButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  roleCard: {
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    marginBottom: 12,
  },
  roleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  roleDepartment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  roleDepartmentName: {
    fontSize: 15,
    fontWeight: '600',
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roleBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  rolePositionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rolePosition: {
    fontSize: 12,
  },
  explorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 24,
  },
  explorButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default MyDepartmentsScreen;
