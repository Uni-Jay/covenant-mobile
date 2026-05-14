import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  FlatList,
  SectionList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { departmentService } from '../services';

interface Department {
  name: string;
  icon?: string;
  color?: string;
  memberCount?: number;
  description?: string;
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

const DepartmentsListScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const theme = useTheme();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [userDepartments, setUserDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'joined'>('all');

  const fetchDepartments = useCallback(async () => {
    try {
      setLoading(true);
      const [deptResponse, userResponse] = await Promise.all([
        departmentService.getAllDepartments(),
        departmentService.getUserDepartments(),
      ]);

      let deptList = Array.isArray(deptResponse.departments) ? deptResponse.departments : [];
      if (typeof deptResponse === 'object' && !Array.isArray(deptResponse)) {
        deptList = Object.keys(DEPARTMENT_CONFIGS).map(name => ({
          name,
          ...DEPARTMENT_CONFIGS[name],
        }));
      }

      const userDepts = Array.isArray(userResponse)
        ? userResponse.map((d: any) => typeof d === 'string' ? d : d.name)
        : [];

      setDepartments(deptList);
      setUserDepartments(userDepts);
    } catch (error: any) {
      console.error('Failed to fetch departments:', error);
      // Use default departments on error
      setDepartments(
        Object.keys(DEPARTMENT_CONFIGS).map(name => ({
          name,
          ...DEPARTMENT_CONFIGS[name],
        }))
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDepartments();
    setRefreshing(false);
  }, [fetchDepartments]);

  const handleViewDepartment = (departmentName: string) => {
    navigation.navigate('DepartmentDetail', { department: departmentName });
  };

  const filteredDepartments = departments.filter(dept => {
    if (filter === 'joined') {
      return userDepartments.includes(dept.name);
    }
    return true;
  });

  const getDepartmentConfig = (name: string) => {
    return DEPARTMENT_CONFIGS[name] || {
      icon: 'folder',
      color: theme.colors.primary,
      description: 'Church department',
    };
  };

  const renderDepartmentCard = ({ item: dept }: { item: Department }) => {
    const config = getDepartmentConfig(dept.name);
    const isJoined = userDepartments.includes(dept.name);

    return (
      <TouchableOpacity
        onPress={() => handleViewDepartment(dept.name)}
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
                size={32}
                color="white"
              />
            </View>
            {isJoined && (
              <View style={[styles.badge, { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
                <MaterialCommunityIcons name="check-circle" size={16} color="white" />
                <Text style={styles.badgeText}>Joined</Text>
              </View>
            )}
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.departmentName}>{dept.name}</Text>
            <Text style={styles.departmentDescription}>{config.description}</Text>
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.memberCount}>
              <MaterialCommunityIcons name="account-multiple" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.memberCountText}>
                {dept.memberCount ? `${dept.memberCount} members` : 'View'}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="rgba(255,255,255,0.8)" />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading departments...
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
          Departments
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
          Join a ministry department
        </Text>
      </View>

      {/* Filter Tabs */}
      <View style={[styles.filterContainer, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity
          onPress={() => setFilter('all')}
          style={[
            styles.filterTab,
            filter === 'all' && [
              styles.filterTabActive,
              { borderBottomColor: theme.colors.primary },
            ],
          ]}
        >
          <Text
            style={[
              styles.filterTabText,
              {
                color: filter === 'all' ? theme.colors.primary : theme.colors.textSecondary,
              },
            ]}
          >
            All Departments
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setFilter('joined')}
          style={[
            styles.filterTab,
            filter === 'joined' && [
              styles.filterTabActive,
              { borderBottomColor: theme.colors.primary },
            ],
          ]}
        >
          <Text
            style={[
              styles.filterTabText,
              {
                color: filter === 'joined' ? theme.colors.primary : theme.colors.textSecondary,
              },
            ]}
          >
            My Departments ({userDepartments.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Departments List */}
      <FlatList
        data={filteredDepartments}
        renderItem={renderDepartmentCard}
        keyExtractor={(item) => item.name}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name={filter === 'joined' ? 'folder-open-outline' : 'folder-multiple'}
              size={48}
              color={theme.colors.textSecondary}
            />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              {filter === 'joined'
                ? 'You haven\'t joined any departments yet'
                : 'No departments available'}
            </Text>
          </View>
        }
      />
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
  filterContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  filterTabActive: {
    borderBottomWidth: 3,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  departmentCard: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  cardContent: {
    marginBottom: 12,
  },
  departmentName: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  departmentDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  memberCountText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
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
});

export default DepartmentsListScreen;
