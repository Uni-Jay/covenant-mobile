import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  FlatList,
  Modal,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../theme/colors';
import { userManagementService } from '../services';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  roles: string[];
  departments: Array<{ id: number; name: string; role: string }>;
  is_approved: boolean;
  suspended: boolean;
}

interface ModalState {
  type: 'none' | 'edit' | 'details' | 'suspend';
  user: User | null;
}

export default function AdminUserManagementScreen({ navigation }: any) {
  const { colors: themeColors } = useTheme();
  const styles = createStyles(themeColors);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [modal, setModal] = useState<ModalState>({ type: 'none', user: null });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, users]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const response = await userManagementService.getAllUsers(page);
      setUsers(response.data || []);
      setHasMore((response.data || []).length === 50);
    } catch (error: any) {
      console.error('Error loading users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreUsers = async () => {
    if (!hasMore) return;
    try {
      const nextPage = page + 1;
      const response = await userManagementService.getAllUsers(nextPage);
      setUsers([...users, ...(response.data || [])]);
      setPage(nextPage);
      setHasMore((response.data || []).length === 50);
    } catch (error: any) {
      console.error('Error loading more users:', error);
    }
  };

  const filterUsers = () => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = users.filter(
      (user) =>
        user.firstName.toLowerCase().includes(query) ||
        user.lastName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
    );
    setFilteredUsers(filtered);
  };

  const handleSuspendUser = async (user: User) => {
    try {
      setIsSaving(true);
      if (user.suspended) {
        await userManagementService.restoreUser(user.id);
        Alert.alert('Success', `${user.firstName} has been restored`);
      } else {
        Alert.prompt(
          'Suspend User',
          'Enter reason for suspension:',
          (reason) => {
            if (reason) {
              handleConfirmSuspend(user.id, reason);
            }
          },
          'plain-text'
        );
        return;
      }
      loadUsers();
      setModal({ type: 'none', user: null });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update user status');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmSuspend = async (userId: number, reason: string) => {
    try {
      setIsSaving(true);
      await userManagementService.suspendUser(userId, reason);
      Alert.alert('Success', 'User has been suspended');
      loadUsers();
      setModal({ type: 'none', user: null });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to suspend user');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAssignRole = async (user: User, role: string) => {
    try {
      setIsSaving(true);
      await userManagementService.assignRole(user.id, role);
      Alert.alert('Success', `Role assigned to ${user.firstName}`);
      loadUsers();
      setModal({ type: 'none', user: null });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to assign role');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[themeColors.primary[600], themeColors.primary[700]]}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>User Management</Text>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.primary[600]} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[themeColors.primary[600], themeColors.primary[700]]}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Management</Text>
        <View style={styles.backButton} />
      </LinearGradient>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          placeholderTextColor={themeColors.gray[400]}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* User Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{users.length}</Text>
          <Text style={styles.statLabel}>Total Users</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {users.filter((u) => !u.suspended).length}
          </Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {users.filter((u) => u.suspended).length}
          </Text>
          <Text style={styles.statLabel}>Suspended</Text>
        </View>
      </View>

      {/* Users List */}
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item: user }) => (
          <TouchableOpacity
            onPress={() => setModal({ type: 'details', user })}
            style={[
              styles.userCard,
              user.suspended && styles.userCardSuspended,
            ]}
          >
            <View style={styles.userHeader}>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>
                  {user.firstName} {user.lastName}
                </Text>
                <Text style={styles.userEmail}>{user.email}</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  user.suspended
                    ? styles.statusSuspended
                    : styles.statusActive,
                ]}
              >
                <Text style={styles.statusText}>
                  {user.suspended ? '🚫' : '✓'}
                </Text>
              </View>
            </View>

            {/* Roles */}
            {user.roles && user.roles.length > 0 && (
              <View style={styles.rolesContainer}>
                {user.roles.slice(0, 2).map((role) => (
                  <Text
                    key={role}
                    style={styles.roleTag}
                  >
                    {role}
                  </Text>
                ))}
                {user.roles.length > 2 && (
                  <Text style={styles.roleTag}>
                    +{user.roles.length - 2}
                  </Text>
                )}
              </View>
            )}

            {/* Departments */}
            {user.departments && user.departments.length > 0 && (
              <View style={styles.departmentsContainer}>
                {user.departments.slice(0, 1).map((dept) => (
                  <Text
                    key={dept.id}
                    style={styles.departmentTag}
                  >
                    {dept.name}
                  </Text>
                ))}
                {user.departments.length > 1 && (
                  <Text style={styles.departmentTag}>
                    +{user.departments.length - 1}
                  </Text>
                )}
              </View>
            )}
          </TouchableOpacity>
        )}
        onEndReached={() => loadMoreUsers()}
        onEndReachedThreshold={0.3}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        }
      />

      {/* Details Modal */}
      <Modal
        visible={modal.type === 'details' && modal.user !== null}
        transparent
        animationType="slide"
      >
        {modal.user && (
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={[themeColors.primary[600], themeColors.primary[700]]}
              style={styles.modalHeader}
            >
              <TouchableOpacity
                onPress={() => setModal({ type: 'none', user: null })}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>User Details</Text>
              <View style={styles.closeButton} />
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.modalContent}>
              {/* User Info */}
              <View style={styles.userDetailCard}>
                <Text style={styles.detailLabel}>Name</Text>
                <Text style={styles.detailValue}>
                  {modal.user.firstName} {modal.user.lastName}
                </Text>
              </View>

              <View style={styles.userDetailCard}>
                <Text style={styles.detailLabel}>Email</Text>
                <Text style={styles.detailValue}>{modal.user.email}</Text>
              </View>

              {modal.user.phoneNumber && (
                <View style={styles.userDetailCard}>
                  <Text style={styles.detailLabel}>Phone</Text>
                  <Text style={styles.detailValue}>{modal.user.phoneNumber}</Text>
                </View>
              )}

              <View style={styles.userDetailCard}>
                <Text style={styles.detailLabel}>Status</Text>
                <Text
                  style={[
                    styles.detailValue,
                    {
                      color: modal.user.suspended
                        ? '#DC2626'
                        : '#10B981',
                    },
                  ]}
                >
                  {modal.user.suspended ? 'Suspended' : 'Active'}
                </Text>
              </View>

              {/* Roles Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Roles</Text>
                <View style={styles.rolesGrid}>
                  {modal.user.roles.map((role) => (
                    <View key={role} style={styles.roleBadge}>
                      <Text style={styles.roleBadgeText}>{role}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Departments Section */}
              {modal.user.departments.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Departments</Text>
                  {modal.user.departments.map((dept) => (
                    <View key={dept.id} style={styles.departmentDetailCard}>
                      <Text style={styles.departmentName}>{dept.name}</Text>
                      <Text style={styles.departmentRole}>{dept.role}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Actions */}
              <View style={styles.actionButtonsContainer}>
                <TouchableOpacity
                  onPress={() =>
                    handleSuspendUser(modal.user!)
                  }
                  disabled={isSaving}
                  style={[
                    styles.actionButton,
                    modal.user.suspended
                      ? styles.restoreButton
                      : styles.suspendButton,
                  ]}
                >
                  <Text style={styles.actionButtonText}>
                    {isSaving
                      ? 'Processing...'
                      : modal.user.suspended
                      ? '✓ Restore User'
                      : '🚫 Suspend User'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    backButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    backButtonText: {
      fontSize: 32,
      color: colors.white,
      fontWeight: 'bold',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.white,
      flex: 1,
      textAlign: 'center',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 16,
      marginVertical: 12,
      paddingHorizontal: 12,
      backgroundColor: colors.white,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.gray[200],
    },
    searchIcon: {
      fontSize: 18,
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 10,
      fontSize: 14,
      color: colors.gray[800],
    },
    statsContainer: {
      flexDirection: 'row',
      marginHorizontal: 16,
      marginBottom: 12,
      gap: 12,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.white,
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 8,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 1,
    },
    statValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.primary[600],
    },
    statLabel: {
      fontSize: 12,
      color: colors.gray[600],
      marginTop: 4,
    },
    listContent: {
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    userCard: {
      backgroundColor: colors.white,
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    userCardSuspended: {
      opacity: 0.6,
      backgroundColor: colors.gray[100],
    },
    userHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    userInfo: {
      flex: 1,
    },
    userName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.gray[800],
      marginBottom: 2,
    },
    userEmail: {
      fontSize: 13,
      color: colors.gray[600],
    },
    statusBadge: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    statusActive: {
      backgroundColor: '#DCFCE7',
    },
    statusSuspended: {
      backgroundColor: '#FEE2E2',
    },
    statusText: {
      fontSize: 16,
    },
    rolesContainer: {
      flexDirection: 'row',
      gap: 6,
      marginBottom: 8,
      flexWrap: 'wrap',
    },
    roleTag: {
      fontSize: 11,
      color: colors.primary[700],
      backgroundColor: colors.primary[100],
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
    },
    departmentsContainer: {
      flexDirection: 'row',
      gap: 6,
      flexWrap: 'wrap',
    },
    departmentTag: {
      fontSize: 11,
      color: colors.purple[700],
      backgroundColor: colors.purple[100],
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
    },
    emptyContainer: {
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyText: {
      fontSize: 16,
      color: colors.gray[600],
    },
    modalContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    modalHeader: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    closeButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    closeButtonText: {
      fontSize: 24,
      color: colors.white,
      fontWeight: 'bold',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.white,
      flex: 1,
      textAlign: 'center',
    },
    modalContent: {
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    userDetailCard: {
      backgroundColor: colors.white,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 8,
    },
    detailLabel: {
      fontSize: 12,
      color: colors.gray[600],
      fontWeight: '600',
      marginBottom: 4,
    },
    detailValue: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.gray[800],
    },
    section: {
      marginTop: 12,
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.gray[800],
      marginBottom: 8,
    },
    rolesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    roleBadge: {
      backgroundColor: colors.primary[100],
      borderRadius: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    roleBadgeText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary[700],
    },
    departmentDetailCard: {
      backgroundColor: colors.white,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 8,
      borderLeftWidth: 3,
      borderLeftColor: colors.purple[600],
    },
    departmentName: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.gray[800],
      marginBottom: 2,
    },
    departmentRole: {
      fontSize: 12,
      color: colors.gray[600],
    },
    actionButtonsContainer: {
      marginVertical: 20,
    },
    actionButton: {
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    suspendButton: {
      backgroundColor: '#FEE2E2',
    },
    restoreButton: {
      backgroundColor: '#DCFCE7',
    },
    actionButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.gray[800],
    },
  });
