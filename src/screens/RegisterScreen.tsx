import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';

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

export default function RegisterScreen({ navigation }: any) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | undefined>(undefined);
  const [departments, setDepartments] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();

  const toggleDepartment = (dept: string) => {
    if (departments.includes(dept)) {
      setDepartments(departments.filter(d => d !== dept));
    } else {
      setDepartments([...departments, dept]);
    }
  };

  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!gender) {
      Alert.alert('Error', 'Please select your gender');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    try {
      await register({ 
        email, 
        password, 
        fullName, 
        phoneNumber,
        gender,
        departments: departments.length > 0 ? departments : undefined,
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      Alert.alert(
        'Registration Failed',
        error.response?.data?.message || 'Could not create account. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Image
            source={require('../../assets/images/Word of Covenant Logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Join Our Family</Text>
          <Text style={styles.subtitle}>Word of Covenant Church</Text>
          <Text style={styles.verse}>"Light of the World" - John 8:12</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="John Doe"
              value={fullName}
              onChangeText={setFullName}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              placeholder="your.email@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="+234 XXX XXX XXXX"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Gender *</Text>
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
            <Text style={styles.label}>Departments (Optional)</Text>
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

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password *</Text>
            <TextInput
              style={styles.input}
              placeholder="At least 6 characters"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password *</Text>
            <TextInput
              style={styles.input}
              placeholder="Re-enter password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              editable={!isLoading}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Creating Account...' : 'Register'}
            </Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.link}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 24,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary[900],
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: colors.primary[700],
    marginBottom: 4,
  },
  verse: {
    fontSize: 14,
    color: colors.primary[600],
    fontStyle: 'italic',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.gray[50],
    borderWidth: 2,
    borderColor: colors.primary[200],
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: colors.gray[900],
  },
  button: {
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
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 16,
    color: colors.gray[600],
  },
  link: {
    fontSize: 16,
    color: colors.secondary[600],
    fontWeight: '600',
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
  helpText: {
    fontSize: 13,
    color: colors.gray[500],
    marginBottom: 8,
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
});
