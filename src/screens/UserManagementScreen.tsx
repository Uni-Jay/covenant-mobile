import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  photo?: string;
  phone?: string;
  role: string;
  departments: string[];
  executivePosition?: string;
  isExecutive: boolean;
}

const DEPARTMENTS = [
  { name: 'Church Leadership', icon: '⛪', color: '#8B4513' },
  { name: 'Youth', icon: '⚡', color: '#6C5CE7' },
  { name: 'Drama', icon: '🎭', color: '#4ECDC4' },
  { name: 'Covenant Men', icon: '👔', color: '#2C3E50' },
  { name: 'Prayer', icon: '🙏', color: '#A29BFE' },
  { name: 'Media', icon: '📹', color: '#45B7D1' },
  { name: 'Goodwomen', icon: '👗', color: '#E84393' },
  { name: 'Choir', icon: '🎵', color: '#FF6B6B' },
  { name: 'Welfare', icon: '❤️', color: '#FD79A8' },
  { name: 'Ushering', icon: '🚪', color: '#00B894' },
  { name: 'Protocol', icon: '🛡️', color: '#0984E3' },
  { name: 'Children', icon: '👶', color: '#FDCB6E' },
  { name: 'Evangelism', icon: '✝️', color: '#636E72' },
];

const ROLES = [
  { value: 'member', label: 'Member' },
  { value: 'media', label: 'Media' },
  { value: 'media_head', label: 'Media Head' },
  { value: 'choir', label: 'Choir' },
  { value: 'secretary', label: 'Secretary' },
  { value: 'deacon', label: 'Deacon' },
  { value: 'elder', label: 'Elder' },
  { value: 'pastor', label: 'Pastor' },
  { value: 'admin', label: 'Admin' },
];

export default function UserManagementScreen({ navigation }: any) {
  const { user: currentUser } = useAuth();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = users.filter(
        (user) =>
          user.fullName.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          user.role.toLowerCase().includes(query)
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/departments/users/all');
      setUsers(response.data.users);
      setFilteredUsers(response.data.users);
    } catch (error: any) {
      console.error('Failed to fetch users:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const openDepartmentModal = (user: User) => {
    setSelectedUser(user);
    setSelectedDepartments([...user.departments]);
    setShowDepartmentModal(true);
  };

  const openRoleModal = (user: User) => {
    setSelectedUser(user);
    setSelectedRole(user.role);
    setShowRoleModal(true);
  };

  const toggleDepartment = (deptName: string) => {
    setSelectedDepartments((prev) =>
      prev.includes(deptName)
        ? prev.filter((d) => d !== deptName)
        : [...prev, deptName]
    );
  };

  const updateUserDepartments = async () => {
    if (!selectedUser) return;

    try {
      setUpdating(true);
      const response = await api.put(`/departments/users/${selectedUser.id}/departments`, {
        departments: selectedDepartments,
      });

      Alert.alert('Success', 'User departments updated successfully');
      setShowDepartmentModal(false);
      fetchUsers();
    } catch (error: any) {
      console.error('Failed to update departments:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update departments');
    } finally {
      setUpdating(false);
    }
  };

  const updateUserRole = async () => {
    if (!selectedUser) return;

    try {
      setUpdating(true);
      const response = await api.put(`/departments/users/${selectedUser.id}/role`, {
        role: selectedRole,
      });

      Alert.alert('Success', 'User role updated successfully');
      setShowRoleModal(false);
      fetchUsers();
    } catch (error: any) {
      console.error('Failed to update role:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update role');
    } finally {
      setUpdating(false);
    }
  };

  const getRoleColor = (role: string) => {
    const roleColors: { [key: string]: string } = {
      admin: colors.secondary[600],
      pastor: colors.primary[700],
      elder: colors.primary[600],
      media_head: colors.primary[800],
      media: colors.primary[500],
      secretary: colors.secondary[500],
      deacon: colors.success,
      choir: '#d97706',
      member: colors.gray[600],
    };
    return roleColors[role] || colors.gray[600];
  };

  const renderUserCard = ({ item }: { item: User }) => (
    <View style={styles.userCard}>
      <View style={styles.userHeader}>
        {item.photo ? (
          <Image source={{ uri: item.photo }} style={styles.userPhoto} />
        ) : (
          <View style={[styles.userPhoto, styles.userPhotoPlaceholder]}>
            <Text style={styles.userPhotoText}>
              {item.firstName.charAt(0)}
              {item.lastName.charAt(0)}
            </Text>
          </View>
        )}
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.fullName}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          {item.phone && <Text style={styles.userPhone}>📱 {item.phone}</Text>}
        </View>
      </View>

      <View style={styles.userDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Role:</Text>
          <TouchableOpacity
            style={[styles.roleChip, { backgroundColor: getRoleColor(item.role) }]}
            onPress={() => openRoleModal(item)}
          >
            <Text style={styles.roleChipText}>{item.role.replace('_', ' ').toUpperCase()}</Text>
            <Text style={styles.editIcon}>✎</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Departments:</Text>
          <TouchableOpacity
            style={styles.editDepartmentsButton}
            onPress={() => openDepartmentModal(item)}
          >
            <Text style={styles.editDepartmentsText}>
              {item.departments.length === 0 ? 'None' : `${item.departments.length} department${item.departments.length > 1 ? 's' : ''}`}
            </Text>
            <Text style={styles.editIcon}>✎</Text>
          </TouchableOpacity>
        </View>

        {item.departments.length > 0 && (
          <View style={styles.departmentsList}>
            {item.departments.map((dept, index) => {
              const deptInfo = DEPARTMENTS.find((d) => d.name === dept);
              return (
                <View
                  key={index}
                  style={[
                    styles.departmentChip,
                    { backgroundColor: deptInfo?.color || colors.gray[400] },
                  ]}
                >
                  <Text style={styles.departmentChipText}>
                    {deptInfo?.icon || '📋'} {dept}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {item.executivePosition && (
          <View style={styles.executiveBadge}>
            <Text style={styles.executiveBadgeText}>⭐ {item.executivePosition}</Text>
          </View>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <Text style={styles.loadingText}>Loading users...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={[colors.primary[700], colors.primary[700]]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Total Users</Text>
        <Text style={styles.headerSubtitle}>{filteredUsers.length} Users</Text>
      </LinearGradient>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search users by name, email, or role..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.gray[400]}
        />
      </View>

      <FlatList
        data={filteredUsers}
        renderItem={renderUserCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Department Selection Modal */}
      <Modal visible={showDepartmentModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Edit Departments for {selectedUser?.fullName}
            </Text>
            <Text style={styles.modalSubtitle}>
              Select departments to grant chat access
            </Text>

            <ScrollView style={styles.departmentSelectionList}>
              {DEPARTMENTS.map((dept) => (
                <TouchableOpacity
                  key={dept.name}
                  style={[
                    styles.departmentSelectionItem,
                    selectedDepartments.includes(dept.name) &&
                      styles.departmentSelectionItemSelected,
                    { borderLeftColor: dept.color },
                  ]}
                  onPress={() => toggleDepartment(dept.name)}
                >
                  <Text style={styles.departmentSelectionIcon}>{dept.icon}</Text>
                  <Text style={styles.departmentSelectionName}>{dept.name}</Text>
                  {selectedDepartments.includes(dept.name) && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowDepartmentModal(false)}
                disabled={updating}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={updateUserDepartments}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.modalSaveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Role Selection Modal */}
      <Modal visible={showRoleModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Edit Role for {selectedUser?.fullName}
            </Text>
            <Text style={styles.modalSubtitle}>Select user role</Text>

            <ScrollView style={styles.roleSelectionList}>
              {ROLES.map((role) => (
                <TouchableOpacity
                  key={role.value}
                  style={[
                    styles.roleSelectionItem,
                    selectedRole === role.value && styles.roleSelectionItemSelected,
                    { borderLeftColor: getRoleColor(role.value) },
                  ]}
                  onPress={() => setSelectedRole(role.value)}
                >
                  <Text style={styles.roleSelectionName}>{role.label}</Text>
                  {selectedRole === role.value && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowRoleModal(false)}
                disabled={updating}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={updateUserRole}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.modalSaveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    padding: 20,
  },
//   backButton: {
//     marginBottom: 10,
//   },
  backButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
  },
  headerSubtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: colors.surface,
  },
  searchInput: {
    backgroundColor: colors.gray[100],
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  listContainer: {
    padding: 16,
  },
  userCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  userPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  userPhotoPlaceholder: {
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  userPhotoText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  userDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  roleChipText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  editDepartmentsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  editDepartmentsText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  editIcon: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  departmentsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  departmentChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  departmentChipText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  executiveBadge: {
    backgroundColor: colors.warning + '20',
    padding: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  executiveBadgeText: {
    color: colors.warning,
    fontSize: 13,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  departmentSelectionList: {
    maxHeight: 400,
  },
  departmentSelectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.gray[100],
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  departmentSelectionItemSelected: {
    backgroundColor: colors.primary[50],
  },
  departmentSelectionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  departmentSelectionName: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  checkmark: {
    fontSize: 20,
    color: colors.primary[600],
    fontWeight: 'bold',
  },
  roleSelectionList: {
    maxHeight: 400,
  },
  roleSelectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.gray[100],
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  roleSelectionItemSelected: {
    backgroundColor: colors.primary[50],
  },
  roleSelectionName: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  modalCancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: colors.gray[200],
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  modalSaveButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
  },
  modalSaveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});
