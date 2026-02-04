import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services';
import { colors } from '../theme/colors';

export default function EditProfileScreen({ navigation }: any) {
  const { user, updateUser } = useAuth();
  
  // Initialize fullName from either fullName or firstName + lastName
  const initialFullName = user?.fullName || 
    (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.firstName || '');
  
  const [fullName, setFullName] = useState(initialFullName);
  const [phone, setPhone] = useState(user?.phone || user?.phoneNumber || '');
  const [address, setAddress] = useState(user?.address || '');
  const [gender, setGender] = useState<'male' | 'female' | undefined>(user?.gender);
  const [departments, setDepartments] = useState<string[]>(user?.departments || []);
  const [isLoading, setIsLoading] = useState(false);

  const DEPARTMENTS = [
    'Choir',
    'Drama',
    'Usher',
    'Media',
    'Covenant Men',
    'Good Women',
    'Youth',
    'Children',
    'Prayer Team',
    'Evangelism',
  ];

  const toggleDepartment = (dept: string) => {
    if (departments.includes(dept)) {
      setDepartments(departments.filter((d) => d !== dept));
    } else {
      setDepartments([...departments, dept]);
    }
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }

    setIsLoading(true);
    try {
      const [first, ...lastParts] = fullName.trim().split(' ');
      const response = await authService.updateProfile({
        firstName: first,
        lastName: lastParts.join(' ') || first,
        phone,
        address,
        gender,
        departments,
      });

      // Update user in context
      updateUser(response);

      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      console.error('Update profile error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {fullName.charAt(0) || 'U'}
            </Text>
          </View>
          <TouchableOpacity style={styles.changePhotoButton}>
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            value={fullName || ''}
            onChangeText={(text) => setFullName(text)}
            editable={!isLoading}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, styles.inputDisabled]}
            value={user?.email || ''}
            editable={false}
          />
          <Text style={styles.helpText}>Email cannot be changed</Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your phone number"
            value={phone || ''}
            onChangeText={(text) => setPhone(text)}
            keyboardType="phone-pad"
            editable={!isLoading}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Address</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter your address"
            value={address || ''}
            onChangeText={(text) => setAddress(text)}
            multiline
            numberOfLines={3}
            editable={!isLoading}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Gender</Text>
          <View style={styles.genderContainer}>
            <TouchableOpacity
              style={[
                styles.genderButton,
                gender === 'male' && styles.genderButtonActive,
              ]}
              onPress={() => setGender('male')}
              disabled={isLoading}
            >
              <Text
                style={[
                  styles.genderButtonText,
                  gender === 'male' && styles.genderButtonTextActive,
                ]}
              >
                👨 Male
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.genderButton,
                gender === 'female' && styles.genderButtonActive,
              ]}
              onPress={() => setGender('female')}
              disabled={isLoading}
            >
              <Text
                style={[
                  styles.genderButtonText,
                  gender === 'female' && styles.genderButtonTextActive,
                ]}
              >
                👩 Female
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Departments</Text>
          <Text style={styles.helpText}>Select all that apply</Text>
          <View style={styles.departmentsContainer}>
            {DEPARTMENTS.map((dept) => (
              <TouchableOpacity
                key={dept}
                style={[
                  styles.departmentChip,
                  departments.includes(dept) && styles.departmentChipActive,
                ]}
                onPress={() => toggleDepartment(dept)}
                disabled={isLoading}
              >
                <Text
                  style={[
                    styles.departmentChipText,
                    departments.includes(dept) && styles.departmentChipTextActive,
                  ]}
                >
                  {dept}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isLoading}
        >
          <Text style={styles.saveButtonText}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={isLoading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
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
    alignItems: 'center',
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
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.primary[600],
  },
  changePhotoButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  changePhotoText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  form: {
    padding: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary[200],
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: colors.gray[900],
  },
  inputDisabled: {
    backgroundColor: colors.gray[100],
    color: colors.gray[500],
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  helpText: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 4,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    backgroundColor: colors.gray[100],
    borderWidth: 2,
    borderColor: colors.gray[300],
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  genderButtonActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[600],
  },
  genderButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[700],
  },
  genderButtonTextActive: {
    color: colors.primary[800],
  },
  departmentsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  departmentChip: {
    backgroundColor: colors.gray[100],
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  departmentChipActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  departmentChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[700],
  },
  departmentChipTextActive: {
    color: colors.white,
  },
  saveButton: {
    backgroundColor: colors.primary[600],
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    elevation: 3,
    shadowColor: colors.primary[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 2,
    borderColor: colors.gray[300],
  },
  cancelButtonText: {
    color: colors.gray[700],
    fontSize: 16,
    fontWeight: '600',
  },
});
