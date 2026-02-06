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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { primaryColor, dangerColor, accentColor } from '../theme/colors';
import api from '../services/api';

interface Executive {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  executivePosition: string;
  isExecutive: boolean;
}

interface ChurchLeader {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  executivePosition: string;
}

const DEPARTMENTS = [
  'Choir', 'Drama', 'Media', 'Ushering',
  'Children', 'Youth', 'Prayer', 'Welfare', 'Evangelism'
];

const LEADERSHIP_TITLES = [
  'Pastor', 'Apostle', 'Evangelist', 'Prophet', 'Elder',
  'Deacon', 'Deaconess', 'Minister'
];

const DepartmentManagementScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'departments' | 'leadership'>('departments');
  const [loading, setLoading] = useState(false);
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [churchLeaders, setChurchLeaders] = useState<ChurchLeader[]>([]);
  
  // Form states for adding executives
  const [showAddExecutive, setShowAddExecutive] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [executiveEmail, setExecutiveEmail] = useState('');
  const [executivePosition, setExecutivePosition] = useState('');
  
  // Form states for adding church leaders
  const [showAddLeader, setShowAddLeader] = useState(false);
  const [leaderEmail, setLeaderEmail] = useState('');
  const [leaderTitle, setLeaderTitle] = useState('');
  const [leaderRole, setLeaderRole] = useState('pastor');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'departments') {
        const response = await api.get('/api/departments/executives');
        setExecutives(response.data);
      } else {
        const response = await api.get('/api/departments/leaders');
        setChurchLeaders(response.data);
      }
    } catch (error: any) {
      console.error('Load error:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExecutive = async () => {
    if (!selectedDepartment || !executiveEmail || !executivePosition) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    try {
      setLoading(true);
      await api.post('/api/departments/executives', {
        email: executiveEmail,
        department: selectedDepartment,
        executivePosition: executivePosition,
      });
      
      Alert.alert('Success', 'Executive added successfully');
      setShowAddExecutive(false);
      setExecutiveEmail('');
      setExecutivePosition('');
      setSelectedDepartment('');
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to add executive');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLeader = async () => {
    if (!leaderEmail || !leaderTitle) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    try {
      setLoading(true);
      await api.post('/api/departments/leaders', {
        email: leaderEmail,
        title: leaderTitle,
        role: leaderRole,
      });
      
      Alert.alert('Success', 'Church leader added successfully');
      setShowAddLeader(false);
      setLeaderEmail('');
      setLeaderTitle('');
      setLeaderRole('pastor');
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to add leader');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveExecutive = async (id: number) => {
    Alert.alert(
      'Confirm Remove',
      'Are you sure you want to remove this executive?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await api.delete(`/api/departments/executives/${id}`);
              Alert.alert('Success', 'Executive removed');
              loadData();
            } catch (error: any) {
              Alert.alert('Error', 'Failed to remove executive');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleRemoveLeader = async (id: number) => {
    Alert.alert(
      'Confirm Remove',
      'Are you sure you want to remove this leader?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await api.delete(`/api/departments/leaders/${id}`);
              Alert.alert('Success', 'Leader removed');
              loadData();
            } catch (error: any) {
              Alert.alert('Error', 'Failed to remove leader');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderDepartmentExecutives = () => {
    const grouped = DEPARTMENTS.map(dept => ({
      department: dept,
      members: executives.filter(e => e.department === dept),
    }));

    return (
      <View style={styles.content}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddExecutive(!showAddExecutive)}
        >
          <Text style={styles.addButtonText}>
            {showAddExecutive ? '✕ Cancel' : '+ Add Department Executive'}
          </Text>
        </TouchableOpacity>

        {showAddExecutive && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Add Department Executive</Text>
            
            <Text style={styles.label}>Department</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {DEPARTMENTS.map(dept => (
                <TouchableOpacity
                  key={dept}
                  style={[
                    styles.chip,
                    selectedDepartment === dept && styles.chipSelected,
                  ]}
                  onPress={() => setSelectedDepartment(dept)}
                >
                  <Text style={[
                    styles.chipText,
                    selectedDepartment === dept && styles.chipTextSelected,
                  ]}>
                    {dept}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Member Email</Text>
            <TextInput
              style={styles.input}
              value={executiveEmail}
              onChangeText={setExecutiveEmail}
              placeholder="member@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Position Title</Text>
            <TextInput
              style={styles.input}
              value={executivePosition}
              onChangeText={setExecutivePosition}
              placeholder="e.g., Choir Director, Media Head, Youth Leader"
            />

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleAddExecutive}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Add Executive</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.departmentsList}>
          {grouped.map(({ department, members }) => (
            <View key={department} style={styles.departmentCard}>
              <Text style={styles.departmentName}>
                {department} Department ({members.length})
              </Text>
              {members.length === 0 ? (
                <Text style={styles.emptyText}>No executives assigned</Text>
              ) : (
                members.map(exec => (
                  <View key={exec.id} style={styles.executiveItem}>
                    <View style={styles.executiveInfo}>
                      <Text style={styles.executiveName}>
                        {exec.firstName} {exec.lastName}
                      </Text>
                      <Text style={styles.executivePosition}>
                        {exec.executivePosition}
                      </Text>
                      <Text style={styles.executiveEmail}>{exec.email}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemoveExecutive(exec.id)}
                    >
                      <Text style={styles.removeButtonText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderChurchLeadership = () => {
    return (
      <View style={styles.content}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddLeader(!showAddLeader)}
        >
          <Text style={styles.addButtonText}>
            {showAddLeader ? '✕ Cancel' : '+ Add Church Leader'}
          </Text>
        </TouchableOpacity>

        {showAddLeader && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Add Church Leader</Text>
            
            <Text style={styles.label}>Member Email</Text>
            <TextInput
              style={styles.input}
              value={leaderEmail}
              onChangeText={setLeaderEmail}
              placeholder="leader@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Leadership Title</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {LEADERSHIP_TITLES.map(title => (
                <TouchableOpacity
                  key={title}
                  style={[
                    styles.chip,
                    leaderTitle === title && styles.chipSelected,
                  ]}
                  onPress={() => setLeaderTitle(title)}
                >
                  <Text style={[
                    styles.chipText,
                    leaderTitle === title && styles.chipTextSelected,
                  ]}>
                    {title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Role (Optional)</Text>
            <TextInput
              style={styles.input}
              value={leaderRole}
              onChangeText={setLeaderRole}
              placeholder="e.g., Senior Pastor, Youth Pastor"
            />

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleAddLeader}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Add Leader</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.leadersList}>
          {churchLeaders.length === 0 ? (
            <Text style={styles.emptyText}>No church leaders assigned</Text>
          ) : (
            churchLeaders.map(leader => (
              <View key={leader.id} style={styles.leaderCard}>
                <View style={styles.leaderInfo}>
                  <Text style={styles.leaderTitle}>{leader.executivePosition}</Text>
                  <Text style={styles.leaderName}>
                    {leader.firstName} {leader.lastName}
                  </Text>
                  <Text style={styles.leaderEmail}>{leader.email}</Text>
                  {leader.role && (
                    <Text style={styles.leaderRole}>{leader.role}</Text>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveLeader(leader.id)}
                >
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Department Management</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'departments' && styles.tabActive]}
          onPress={() => setActiveTab('departments')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'departments' && styles.tabTextActive,
          ]}>
            Department Executives
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'leadership' && styles.tabActive]}
          onPress={() => setActiveTab('leadership')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'leadership' && styles.tabTextActive,
          ]}>
            Church Leadership
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {loading && !showAddExecutive && !showAddLeader ? (
          <ActivityIndicator size="large" color={primaryColor} style={styles.loader} />
        ) : activeTab === 'departments' ? (
          renderDepartmentExecutives()
        ) : (
          renderChurchLeadership()
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    fontSize: 16,
    color: primaryColor,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 3,
    borderBottomColor: primaryColor,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  tabTextActive: {
    color: primaryColor,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  loader: {
    marginTop: 40,
  },
  addButton: {
    backgroundColor: primaryColor,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  chipScroll: {
    marginBottom: 8,
  },
  chip: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  chipSelected: {
    backgroundColor: primaryColor,
    borderColor: primaryColor,
  },
  chipText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: primaryColor,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  departmentsList: {
    gap: 16,
  },
  departmentCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  departmentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: primaryColor,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  executiveItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  executiveInfo: {
    flex: 1,
  },
  executiveName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  executivePosition: {
    fontSize: 14,
    color: accentColor,
    marginTop: 2,
    fontWeight: '500',
  },
  executiveEmail: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  removeButton: {
    backgroundColor: dangerColor,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  leadersList: {
    gap: 12,
  },
  leaderCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  leaderInfo: {
    flex: 1,
  },
  leaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: primaryColor,
    marginBottom: 4,
  },
  leaderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  leaderEmail: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  leaderRole: {
    fontSize: 14,
    color: accentColor,
    marginTop: 4,
    fontStyle: 'italic',
  },
});

export default DepartmentManagementScreen;
