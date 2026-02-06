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
import { colors } from '../theme/colors';
import api from '../services/api';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  photo?: string;
}

interface Executive {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  photo?: string;
  department: string;
  position: string;
}

interface DepartmentPosition {
  title: string;
  description: string;
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
];

const DEPARTMENT_POSITIONS: { [key: string]: DepartmentPosition[] } = {
  'Church Leadership': [
    { title: 'Head Pastor (Senior Pastor & General Overseer)', description: 'Spiritual leader and overseer of the church' },
    { title: 'Church Secretary', description: 'Manages church records and communications' },
    { title: 'Church Treasurer', description: 'Manages church finances' },
    { title: 'Church PRO', description: 'Church Public Relations Officer' },
  ],
  'Youth': [
    { title: 'President', description: 'Leads the youth department' },
    { title: 'Vice President', description: 'Assists the president' },
    { title: 'Secretary', description: 'Manages youth records and communications' },
    { title: 'Assistant Secretary', description: 'Supports the secretary' },
    { title: 'Treasurer', description: 'Manages youth finances' },
    { title: 'Assistant Treasurer', description: 'Supports the treasurer' },
    { title: 'PRO 1', description: 'Public Relations Officer 1' },
    { title: 'PRO 2', description: 'Public Relations Officer 2' },
  ],
  'Drama': [
    { title: 'Drama Director', description: 'Oversees all drama productions' },
    { title: 'Assistant Drama Director', description: 'Supports the drama director' },
    { title: 'Secretary', description: 'Manages drama department records' },
    { title: 'Assistant Secretary', description: 'Supports the secretary' },
    { title: 'Treasurer', description: 'Manages drama finances' },
    { title: 'Assistant Treasurer', description: 'Supports the treasurer' },
    { title: 'PRO', description: 'Public Relations Officer' },
  ],
  'Covenant Men': [
    { title: 'Chairman', description: 'Leads the covenant men' },
    { title: 'Assistant Chairman', description: 'Supports the chairman' },
    { title: 'Secretary', description: 'Manages records and communications' },
    { title: 'Treasurer', description: 'Manages finances' },
    { title: 'PRO', description: 'Public Relations Officer' },
  ],
  'Prayer': [
    { title: 'Prayer Coordinator', description: 'Leads prayer sessions and activities' },
    { title: 'Assistant Prayer Coordinator', description: 'Supports prayer activities' },
    { title: 'Secretary', description: 'Maintains prayer requests and records' },
    { title: 'PRO', description: 'Public Relations Officer' },
  ],
  'Media': [
    { title: 'Head Media', description: 'Oversees all media operations' },
    { title: 'Assistant Head Media', description: 'Supports media operations' },
    { title: 'Secretary', description: 'Handles media documentation' },
    { title: 'PRO', description: 'Public Relations Officer' },
  ],
  'Goodwomen': [
    { title: 'Leader', description: 'Leads the goodwomen ministry' },
    { title: 'Assistant Leader', description: 'Supports the leader' },
    { title: 'Secretary', description: 'Manages records and communications' },
    { title: 'Treasurer', description: 'Manages finances' },
    { title: 'PRO', description: 'Public Relations Officer' },
  ],
  'Choir': [
    { title: 'Patron', description: 'Oversees and guides choir activities' },
    { title: 'Choir Coordinator', description: 'Coordinates all choir activities' },
    { title: 'Assistant Choir Coordinator', description: 'Supports the choir coordinator' },
    { title: 'Secretary', description: 'Manages choir records and communications' },
    { title: 'Treasurer', description: 'Manages choir finances' },
    { title: 'PRO', description: 'Public Relations Officer' },
  ],
  'Welfare': [
    { title: 'Welfare Coordinator', description: 'Manages welfare programs' },
    { title: 'Assistant Welfare Coordinator', description: 'Supports welfare activities' },
    { title: 'PRO', description: 'Public Relations Officer' },
    { title: 'Secretary', description: 'Manages welfare records' },
  ],
};

const DepartmentManagementScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Add Executive Form
  const [selectedPosition, setSelectedPosition] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (selectedDepartment) {
      loadExecutives();
    }
  }, [selectedDepartment]);

  useEffect(() => {
    if (searchQuery.length > 2) {
      const timer = setTimeout(() => {
        searchUsers();
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const loadExecutives = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/departments/executives?department=${selectedDepartment}`);
      setExecutives(response.data);
    } catch (error: any) {
      console.error('Load executives error:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    setSearching(true);
    try {
      const response = await api.get(`/users/search?q=${searchQuery}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setSearchQuery(user.fullName);
    setSearchResults([]);
  };

  const handleAddExecutive = async () => {
    if (!selectedUser || !selectedPosition) {
      Alert.alert('Error', 'Please select a member and position');
      return;
    }

    try {
      setLoading(true);
      await api.post('/departments/executives', {
        userId: selectedUser.id,
        department: selectedDepartment,
        position: selectedPosition,
      });
      
      Alert.alert('Success', 'Executive added successfully');
      setShowAddModal(false);
      resetForm();
      loadExecutives();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to add executive');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveExecutive = (executive: Executive) => {
    Alert.alert(
      'Remove Executive',
      `Remove ${executive.firstName} ${executive.lastName} from ${executive.position}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await api.delete(`/departments/executives/${executive.id}`);
              Alert.alert('Success', 'Executive removed');
              loadExecutives();
            } catch (error) {
              Alert.alert('Error', 'Failed to remove executive');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setSearchQuery('');
    setSelectedUser(null);
    setSelectedPosition('');
    setSearchResults([]);
  };

  const getDepartmentPositions = () => {
    return DEPARTMENT_POSITIONS[selectedDepartment] || [];
  };

  const renderDepartmentCard = (dept: typeof DEPARTMENTS[0]) => {
    const count = executives.filter(e => e.department === dept.name).length;
    return (
      <TouchableOpacity
        key={dept.name}
        style={styles.departmentCard}
        onPress={() => setSelectedDepartment(dept.name)}
      >
        <LinearGradient
          colors={[dept.color, dept.color + '80']}
          style={styles.departmentGradient}
        >
          <Text style={styles.departmentIcon}>{dept.icon}</Text>
          <Text style={styles.departmentName}>{dept.name}</Text>
          <Text style={styles.departmentCount}>
            {count} executive{count !== 1 ? 's' : ''}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderExecutiveCard = (executive: Executive) => (
    <View key={executive.id} style={styles.executiveCard}>
      <View style={styles.executiveHeader}>
        {executive.photo ? (
          <Image source={{ uri: executive.photo }} style={styles.executivePhoto} />
        ) : (
          <View style={[styles.executivePhoto, styles.executivePhotoPlaceholder]}>
            <Text style={styles.executivePlaceholderText}>
              {executive.firstName[0]}{executive.lastName[0]}
            </Text>
          </View>
        )}
        <View style={styles.executiveInfo}>
          <Text style={styles.executiveName}>
            {executive.firstName} {executive.lastName}
          </Text>
          <Text style={styles.executiveEmail}>{executive.email}</Text>
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveExecutive(executive)}
        >
          <Text style={styles.removeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSearchResult = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.searchResultItem}
      onPress={() => handleSelectUser(item)}
    >
      {item.photo ? (
        <Image source={{ uri: item.photo }} style={styles.searchResultPhoto} />
      ) : (
        <View style={[styles.searchResultPhoto, styles.searchResultPhotoPlaceholder]}>
          <Text style={styles.searchResultPlaceholderText}>
            {item.firstName[0]}{item.lastName[0]}
          </Text>
        </View>
      )}
      <View style={styles.searchResultInfo}>
        <Text style={styles.searchResultName}>{item.fullName}</Text>
        <Text style={styles.searchResultEmail}>{item.email}</Text>
      </View>
    </TouchableOpacity>
  );

  if (!selectedDepartment) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LinearGradient
          colors={[colors.primary[600], colors.primary[800]]}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Department Management</Text>
          <Text style={styles.headerSubtitle}>Select a department to manage executives</Text>
        </LinearGradient>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.departmentsGrid}>
            {DEPARTMENTS.map(renderDepartmentCard)}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const selectedDeptInfo = DEPARTMENTS.find(d => d.name === selectedDepartment);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={[colors.primary[600], colors.primary[800]]}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setSelectedDepartment('')}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {selectedDeptInfo?.icon} {selectedDepartment}
        </Text>
        <Text style={styles.headerSubtitle}>Manage department executives</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.addButtonText}>+ Add Executive</Text>
        </TouchableOpacity>

        {loading && <ActivityIndicator size="large" color={colors.primary[600]} style={{marginVertical: 20}} />}

        <View style={styles.executivesList}>
          {getDepartmentPositions().map(position => {
            const executive = executives.find(e => e.position === position.title);
            return (
              <View key={position.title} style={styles.positionSection}>
                <View style={styles.positionHeader}>
                  <Text style={styles.positionTitle}>{position.title}</Text>
                  <Text style={styles.positionDescription}>{position.description}</Text>
                </View>
                {executive ? (
                  renderExecutiveCard(executive)
                ) : (
                  <View style={styles.emptyPosition}>
                    <Text style={styles.emptyPositionText}>Position vacant</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Add Executive Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Executive</Text>
              <TouchableOpacity onPress={() => {
                setShowAddModal(false);
                resetForm();
              }}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Search Member */}
              <Text style={styles.inputLabel}>Search Member</Text>
              <TextInput
                style={styles.input}
                placeholder="Type member name..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={colors.gray[400]}
              />

              {searching && <ActivityIndicator style={styles.searchLoader} color={colors.primary[600]} />}

              {searchResults.length > 0 && (
                <View style={styles.searchResults}>
                  <FlatList
                    data={searchResults}
                    renderItem={renderSearchResult}
                    keyExtractor={(item) => item.id.toString()}
                    style={styles.searchResultsList}
                    scrollEnabled={false}
                  />
                </View>
              )}

              {/* Selected User Display */}
              {selectedUser && (
                <View style={styles.selectedUserCard}>
                  {selectedUser.photo ? (
                    <Image source={{ uri: selectedUser.photo }} style={styles.selectedUserPhoto} />
                  ) : (
                    <View style={[styles.selectedUserPhoto, styles.selectedUserPhotoPlaceholder]}>
                      <Text style={styles.selectedUserPlaceholderText}>
                        {selectedUser.firstName[0]}{selectedUser.lastName[0]}
                      </Text>
                    </View>
                  )}
                  <View style={styles.selectedUserInfo}>
                    <Text style={styles.selectedUserName}>{selectedUser.fullName}</Text>
                    <Text style={styles.selectedUserEmail}>{selectedUser.email}</Text>
                  </View>
                </View>
              )}

              {/* Position Selection */}
              <Text style={styles.inputLabel}>Select Position</Text>
              {getDepartmentPositions().map(position => {
                const isOccupied = executives.some(e => e.position === position.title);
                return (
                  <TouchableOpacity
                    key={position.title}
                    style={[
                      styles.positionOption,
                      selectedPosition === position.title && styles.positionOptionSelected,
                      isOccupied && styles.positionOptionOccupied
                    ]}
                    onPress={() => !isOccupied && setSelectedPosition(position.title)}
                    disabled={isOccupied}
                  >
                    <View style={styles.positionOptionHeader}>
                      <Text style={[
                        styles.positionOptionText,
                        selectedPosition === position.title && styles.positionOptionTextSelected,
                        isOccupied && styles.positionOptionTextOccupied
                      ]}>
                        {position.title}
                      </Text>
                      {isOccupied && <Text style={styles.occupiedBadge}>Filled</Text>}
                    </View>
                    <Text style={styles.positionOptionDescription}>{position.description}</Text>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!selectedUser || !selectedPosition || loading) && styles.submitButtonDisabled
                ]}
                onPress={handleAddExecutive}
                disabled={!selectedUser || !selectedPosition || loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.submitButtonText}>Add Executive</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  header: {
    padding: 24,
    paddingTop: 16,
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.white + 'CC',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  departmentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  departmentCard: {
    width: '48%',
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  departmentGradient: {
    padding: 20,
    alignItems: 'center',
  },
  departmentIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  departmentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  departmentCount: {
    fontSize: 12,
    color: colors.white + 'DD',
  },
  addButton: {
    backgroundColor: colors.primary[600],
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  executivesList: {
    gap: 20,
  },
  positionSection: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  positionHeader: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  positionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 4,
  },
  positionDescription: {
    fontSize: 14,
    color: colors.gray[600],
  },
  executiveCard: {
    backgroundColor: colors.gray[50],
    borderRadius: 8,
    padding: 12,
  },
  executiveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  executivePhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  executivePhotoPlaceholder: {
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  executivePlaceholderText: {
    color: colors.primary[700],
    fontSize: 18,
    fontWeight: 'bold',
  },
  executiveInfo: {
    flex: 1,
  },
  executiveName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 4,
  },
  executiveEmail: {
    fontSize: 12,
    color: colors.gray[600],
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.secondary[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: colors.secondary[600],
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyPosition: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.gray[200],
    borderStyle: 'dashed',
  },
  emptyPositionText: {
    color: colors.gray[500],
    fontSize: 14,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  modalClose: {
    fontSize: 24,
    color: colors.gray[600],
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.gray[900],
  },
  searchLoader: {
    marginVertical: 10,
  },
  searchResults: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 8,
    backgroundColor: colors.white,
    maxHeight: 250,
  },
  searchResultsList: {
    maxHeight: 250,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  searchResultPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  searchResultPhotoPlaceholder: {
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchResultPlaceholderText: {
    color: colors.primary[700],
    fontSize: 14,
    fontWeight: 'bold',
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[900],
  },
  searchResultEmail: {
    fontSize: 12,
    color: colors.gray[600],
  },
  selectedUserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 2,
    borderColor: colors.primary[200],
  },
  selectedUserPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  selectedUserPhotoPlaceholder: {
    backgroundColor: colors.primary[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedUserPlaceholderText: {
    color: colors.primary[700],
    fontSize: 20,
    fontWeight: 'bold',
  },
  selectedUserInfo: {
    flex: 1,
  },
  selectedUserName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  selectedUserEmail: {
    fontSize: 14,
    color: colors.gray[600],
    marginTop: 4,
  },
  positionOption: {
    backgroundColor: colors.gray[50],
    borderWidth: 2,
    borderColor: colors.gray[300],
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  positionOptionSelected: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },
  positionOptionOccupied: {
    opacity: 0.5,
    backgroundColor: colors.gray[100],
  },
  positionOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  positionOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[700],
  },
  positionOptionTextSelected: {
    color: colors.primary[700],
  },
  positionOptionTextOccupied: {
    color: colors.gray[500],
  },
  positionOptionDescription: {
    fontSize: 13,
    color: colors.gray[600],
  },
  occupiedBadge: {
    backgroundColor: '#fef3c7',
    color: colors.gold[700],
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  submitButton: {
    backgroundColor: colors.primary[600],
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DepartmentManagementScreen;
