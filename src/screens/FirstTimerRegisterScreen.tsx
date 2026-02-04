import React, { useState } from 'react';
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
import { firstTimerService } from '../services';
import { colors, primaryColor } from '../theme/colors';

const FirstTimerRegisterScreen = ({ route, navigation }: any) => {
  const { qrCode } = route.params || {};
  const [loading, setLoading] = useState(false);

  if (!qrCode) {
    Alert.alert('Error', 'No QR code provided', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  }
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: ''
  });

  const handleRegister = async () => {
    if (!formData.firstName || !formData.lastName) {
      Alert.alert('Required Fields', 'Please enter first name and last name');
      return;
    }

    setLoading(true);
    try {
      const result = await firstTimerService.register(
        qrCode,
        formData.firstName,
        formData.lastName,
        formData.email,
        formData.phone,
        formData.address
      );

      Alert.alert(
        '🎉 Welcome!',
        `${result.message}\n\nYou need ${result.remainingToMembership} more Sunday attendances to become a member.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Home')
          }
        ]
      );
    } catch (err: any) {
      Alert.alert('Registration Failed', err.response?.data?.message || 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>First-Timer Registration</Text>
        <Text style={styles.headerSubtitle}>Welcome to Word of Covenant Church!</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>First Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your first name"
            value={formData.firstName}
            onChangeText={(text) => setFormData({ ...formData, firstName: text })}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Last Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your last name"
            value={formData.lastName}
            onChangeText={(text) => setFormData({ ...formData, lastName: text })}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="your.email@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="+234 800 000 0000"
            keyboardType="phone-pad"
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Address</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Your address"
            multiline
            numberOfLines={3}
            value={formData.address}
            onChangeText={(text) => setFormData({ ...formData, address: text })}
          />
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>📋 What happens next?</Text>
          <Text style={styles.infoText}>• Your attendance is automatically recorded</Text>
          <Text style={styles.infoText}>• Attend 6 Sunday services to become a member</Text>
          <Text style={styles.infoText}>• You'll receive membership credentials automatically</Text>
          <Text style={styles.infoText}>• We'll keep you updated on church events</Text>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Complete Registration</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
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
  form: {
    padding: 20,
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  infoBox: {
    backgroundColor: primaryColor + '20',
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
    marginBottom: 5,
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
  cancelButton: {
    padding: 15,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
  },
});

export default FirstTimerRegisterScreen;
