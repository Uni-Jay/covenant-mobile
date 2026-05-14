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
  Modal,
  FlatList,
  SectionList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { departmentService } from '../services';

interface DepartmentMember {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  photo?: string;
  role?: string;
  department?: string;
}

interface Executive {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  photo?: string;
  department: string;
  executivePosition: string;
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

const DepartmentDetailScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const { department } = route.params;

  const [members, setMembers] = useState<DepartmentMember[]>([]);
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [isJoined, setIsJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [memberCount, setMemberCount] = useState(0);
  const [tab, setTab] = useState<'overview' | 'members' | 'leaders'>('overview');

  const config = DEPARTMENT_CONFIGS[department] || {
    icon: 'folder',
    color: theme.colors.primary,
    description: 'Church department',
  };

  const fetchDepartmentData = useCallback(async () => {
    try {
      setLoading(true);
      const [userDepts, deptMembers, deptExecutives] = await Promise.all([
        departmentService.getUserDepartments(),
        departmentService.getDepartmentMembers(department),
        departmentService.getDepartmentExecutives(department),
      ]);

      const userDeptList = Array.isArray(userDepts) ? userDepts.map((d: any) => typeof d === 'string' ? d : d.name) : [];
      setIsJoined(userDeptList.includes(department));

      setMembers(Array.isArray(deptMembers) ? deptMembers : deptMembers.members || []);
      setMemberCount(deptMembers.total || deptMembers.length || 0);
      setExecutives(Array.isArray(deptExecutives) ? deptExecutives : deptExecutives.executives || []);
    } catch (error: any) {
      console.error('Failed to fetch department data:', error);
      Alert.alert('Error', 'Failed to load department information');
    } finally {
      setLoading(false);
    }
  }, [department]);

  useEffect(() => {
    fetchDepartmentData();
  }, [fetchDepartmentData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDepartmentData();
    setRefreshing(false);
  }, [fetchDepartmentData]);

  const handleJoinDepartment = async () => {
    try {
      setLoading(true);
      await departmentService.joinDepartment(department, 'member');
      setIsJoined(true);
      Alert.alert('Success', `You've joined the ${department} department!`);
      await fetchDepartmentData();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to join department');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveDepartment = async () => {
    Alert.alert(
      'Leave Department',
      `Are you sure you want to leave the ${department} department?`,
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Leave',
          onPress: async () => {
            try {
              setLoading(true);
              await departmentService.leaveDepartment(department);
              setIsJoined(false);
              Alert.alert('Success', `You've left the ${department} department`);
              await fetchDepartmentData();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to leave department');
            } finally {
              setLoading(false);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const renderMemberItem = ({ item }: { item: DepartmentMember }) => (
    <TouchableOpacity style={[styles.memberCard, { borderBottomColor: theme.colors.border }]}>
      <View style={styles.memberAvatar}>
        {item.photo ? (
          <Image source={{ uri: item.photo }} style={styles.avatarImage} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: config.color }]}>
            <Text style={styles.avatarText}>
              {item.firstName[0]}
              {item.lastName[0]}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.memberInfo}>
        <Text style={[styles.memberName, { color: theme.colors.text }]}>
          {item.firstName} {item.lastName}
        </Text>
        <Text style={[styles.memberRole, { color: theme.colors.textSecondary }]}>
          {item.role || 'Member'}
        </Text>
      </View>

      <MaterialCommunityIcons
        name="chevron-right"
        size={20}
        color={theme.colors.textSecondary}
      />
    </TouchableOpacity>
  );

  const renderExecutiveItem = ({ item }: { item: Executive }) => (
    <TouchableOpacity style={[styles.executiveCard, { borderLeftColor: config.color }]}>
      <View style={styles.executiveAvatar}>
        {item.photo ? (
          <Image source={{ uri: item.photo }} style={styles.avatarImage} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: config.color }]}>
            <Text style={styles.avatarText}>
              {item.firstName[0]}
              {item.lastName[0]}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.executiveInfo}>
        <Text style={[styles.executiveName, { color: theme.colors.text }]}>
          {item.firstName} {item.lastName}
        </Text>
        <Text style={[styles.executivePosition, { color: config.color }]}>
          {item.executivePosition}
        </Text>
        <Text style={[styles.executiveEmail, { color: theme.colors.textSecondary }]}>
          {item.email}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading && !members.length) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerBarText, { color: theme.colors.text }]}>{department}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Hero Section */}
        <LinearGradient colors={[config.color, `${config.color}99`]} style={styles.heroSection}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons
              name={config.icon as any}
              size={56}
              color="white"
            />
          </View>
          <Text style={styles.heroTitle}>{department}</Text>
          <Text style={styles.heroDescription}>{config.description}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{memberCount}</Text>
              <Text style={styles.statLabel}>Members</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{executives.length}</Text>
              <Text style={styles.statLabel}>Leaders</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            {!isJoined ? (
              <TouchableOpacity
                onPress={handleJoinDepartment}
                disabled={loading}
                style={[styles.actionButton, styles.joinButton]}
              >
                <MaterialCommunityIcons name="plus-circle" size={18} color="white" />
                <Text style={styles.actionButtonText}>Join Department</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  onPress={() => {}}
                  style={[styles.actionButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
                >
                  <MaterialCommunityIcons name="check-circle" size={18} color="white" />
                  <Text style={styles.actionButtonText}>You're a Member</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleLeaveDepartment}
                  style={[styles.actionButton, { backgroundColor: 'rgba(255,0,0,0.2)' }]}
                >
                  <MaterialCommunityIcons name="exit-to-app" size={18} color="white" />
                  <Text style={styles.actionButtonText}>Leave</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </LinearGradient>

        {/* Tabs */}
        <View style={[styles.tabsContainer, { borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity
            onPress={() => setTab('overview')}
            style={[
              styles.tab,
              tab === 'overview' && [styles.tabActive, { borderBottomColor: config.color }],
            ]}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: tab === 'overview' ? config.color : theme.colors.textSecondary,
                },
              ]}
            >
              Overview
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setTab('members')}
            style={[
              styles.tab,
              tab === 'members' && [styles.tabActive, { borderBottomColor: config.color }],
            ]}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: tab === 'members' ? config.color : theme.colors.textSecondary,
                },
              ]}
            >
              Members
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setTab('leaders')}
            style={[
              styles.tab,
              tab === 'leaders' && [styles.tabActive, { borderBottomColor: config.color }],
            ]}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: tab === 'leaders' ? config.color : theme.colors.textSecondary,
                },
              ]}
            >
              Leaders
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {tab === 'overview' && (
            <View style={styles.overviewContent}>
              <View style={[styles.infoCard, { backgroundColor: theme.colors.card }]}>
                <MaterialCommunityIcons
                  name="information"
                  size={24}
                  color={config.color}
                />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.infoCardTitle, { color: theme.colors.text }]}>
                    About This Department
                  </Text>
                  <Text style={[styles.infoCardText, { color: theme.colors.textSecondary }]}>
                    {config.description}
                  </Text>
                </View>
              </View>

              <View style={styles.statsGrid}>
                <View style={[styles.statsCard, { backgroundColor: theme.colors.card }]}>
                  <Text style={[styles.statsCardLabel, { color: theme.colors.textSecondary }]}>
                    Total Members
                  </Text>
                  <Text style={[styles.statsCardValue, { color: config.color }]}>
                    {memberCount}
                  </Text>
                </View>

                <View style={[styles.statsCard, { backgroundColor: theme.colors.card }]}>
                  <Text style={[styles.statsCardLabel, { color: theme.colors.textSecondary }]}>
                    Department Leads
                  </Text>
                  <Text style={[styles.statsCardValue, { color: config.color }]}>
                    {executives.length}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {tab === 'members' && (
            <FlatList
              data={members}
              renderItem={renderMemberItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons
                    name="account-multiple-outline"
                    size={40}
                    color={theme.colors.textSecondary}
                  />
                  <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                    No members yet
                  </Text>
                </View>
              }
            />
          )}

          {tab === 'leaders' && (
            <FlatList
              data={executives}
              renderItem={renderExecutiveItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons
                    name="crown-outline"
                    size={40}
                    color={theme.colors.textSecondary}
                  />
                  <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                    No leaders assigned yet
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerBarText: {
    fontSize: 16,
    fontWeight: '600',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroSection: {
    padding: 24,
    alignItems: 'center',
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  joinButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    backgroundColor: 'transparent',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
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
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  overviewContent: {
    gap: 16,
  },
  infoCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    alignItems: 'flex-start',
  },
  infoCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoCardText: {
    fontSize: 13,
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statsCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsCardLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  statsCardValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  executiveAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    marginRight: 12,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  memberRole: {
    fontSize: 12,
  },
  executiveCard: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderLeftWidth: 4,
    paddingLeft: 12,
    marginBottom: 12,
  },
  executiveInfo: {
    flex: 1,
  },
  executiveName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  executivePosition: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  executiveEmail: {
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 12,
  },
});

export default DepartmentDetailScreen;
