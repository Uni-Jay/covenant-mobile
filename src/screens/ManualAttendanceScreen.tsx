import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { attendanceService } from '../services';
import api from '../services/api';
import { colors, primaryColor } from '../theme/colors';

const ManualAttendanceScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [members, setMembers] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [formData, setFormData] = useState({
    serviceType: 'sunday_service',
    serviceDate: new Date().toISOString().split('T')[0],
    department: ''
  });

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchMembers();
    } else {
      setMembers([]);
    }
  }, [searchQuery]);

  const searchMembers = async () => {
    setSearching(true);
    try {
      const response = await api.get(`/api/users/search?q=${searchQuery}`);
      setMembers(response.data);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleMarkAttendance = async () => {
    if (!selectedMember) {
      Alert.alert('No Member Selected', 'Please select a member first');
      return;
    }

    setLoading(true);
    try {
      await attendanceService.markManual(
        selectedMember.id,
        formData.serviceType,
        formData.serviceDate,
        undefined,
        formData.department || undefined
      );

      Alert.alert(
        'Success!',
        `Attendance marked for ${selectedMember.firstName} ${selectedMember.lastName}`,
        [
          {
            text: 'Mark Another',
            onPress: () => {
              setSelectedMember(null);
              setSearchQuery('');
            }
          },
          {
            text: 'View Report',
            onPress: () => navigation.navigate('AttendanceReport')
          }
        ]
      );
    } catch (err: any) {
      Alert.alert('Failed', err.response?.data?.message || 'Failed to mark attendance');
    } finally {
      setLoading(false);
    }
  };

  const getServiceTypeLabel = (type: string) => {
    const labels: any = {
      sunday_service: 'Sunday Service',
      sunday_school: 'Sunday School',
      tuesday_prayer: 'Tuesday Prayer',
      thursday_bible_study: 'Thursday Bible Study',
      event: 'Special Event',
      other: 'Other Service'
    };
    return labels[type] || type;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Manual Attendance</Text>
        <Text style={styles.headerSubtitle}>Mark attendance for members manually</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Search Member</Text>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searching && <ActivityIndicator style={styles.searchLoader} />}
          </View>

          {members.length > 0 && !selectedMember && (
            <View style={styles.membersList}>
              {members.map((member) => (
                <TouchableOpacity
                  key={member.id}
                  style={styles.memberItem}
                  onPress={() => {
                    setSelectedMember(member);
                    setMembers([]);
                  }}
                >
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>
                      {member.firstName} {member.lastName}
                    </Text>
                    <Text style={styles.memberDetail}>{member.email}</Text>
                    <Text style={styles.memberDetail}>{member.phone}</Text>
                  </View>
                  <Text style={styles.roleTag}>{member.role}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {selectedMember && (
            <View style={styles.selectedMemberCard}>
              <Text style={styles.selectedLabel}>Selected Member</Text>
              <Text style={styles.selectedName}>
                {selectedMember.firstName} {selectedMember.lastName}
              </Text>
              <Text style={styles.selectedDetail}>{selectedMember.email}</Text>
              <Text style={styles.selectedDetail}>{selectedMember.phone}</Text>
              <TouchableOpacity
                style={styles.changeButton}
                onPress={() => {
                  setSelectedMember(null);
                  setSearchQuery('');
                }}
              >
                <Text style={styles.changeButtonText}>Change Member</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Service Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Service Type</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.serviceType}
                onValueChange={(value: string) => setFormData({ ...formData, serviceType: value })}
                style={styles.picker}
              >
                <Picker.Item label="Sunday Service" value="sunday_service" />
                <Picker.Item label="Sunday School" value="sunday_school" />
                <Picker.Item label="Tuesday Prayer Meeting" value="tuesday_prayer" />
                <Picker.Item label="Thursday Bible Study" value="thursday_bible_study" />
                <Picker.Item label="Special Event" value="event" />
                <Picker.Item label="Other Service" value="other" />
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Service Date</Text>
            <TextInput
              style={styles.input}
              value={formData.serviceDate}
              onChangeText={(text) => setFormData({ ...formData, serviceDate: text })}
              placeholder="YYYY-MM-DD"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Department (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Choir, Ushers, Media"
              value={formData.department}
              onChangeText={(text) => setFormData({ ...formData, department: text })}
            />
          </View>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>📝 Manual Attendance</Text>
          <Text style={styles.infoText}>
            Use this feature to mark attendance for members who couldn't scan QR codes or attended
            without their phones.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.button, (loading || !selectedMember) && styles.buttonDisabled]}
          onPress={handleMarkAttendance}
          disabled={loading || !selectedMember}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Mark Attendance</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('AttendanceReport')}
        >
          <Text style={styles.linkButtonText}>View Attendance Report →</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    backgroundColor: primaryColor,
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E5E7EB',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15,
  },
  searchContainer: {
    position: 'relative',
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchLoader: {
    position: 'absolute',
    right: 15,
    top: 15,
  },
  membersList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  memberItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  memberDetail: {
    fontSize: 14,
    color: '#6B7280',
  },
  roleTag: {
    fontSize: 12,
    color: primaryColor,
    backgroundColor: primaryColor + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  selectedMemberCard: {
    backgroundColor: primaryColor + '10',
    borderRadius: 12,
    padding: 20,
    marginTop: 10,
    borderWidth: 2,
    borderColor: primaryColor,
  },
  selectedLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 5,
  },
  selectedName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 5,
  },
  selectedDetail: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 2,
  },
  changeButton: {
    marginTop: 10,
    padding: 10,
    alignItems: 'center',
  },
  changeButtonText: {
    color: primaryColor,
    fontSize: 14,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  picker: {
    height: 50,
  },
  infoBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  button: {
    backgroundColor: primaryColor,
    borderRadius: 8,
    padding: 18,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkButton: {
    padding: 15,
    alignItems: 'center',
  },
  linkButtonText: {
    color: primaryColor,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ManualAttendanceScreen;
