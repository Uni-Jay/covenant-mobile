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
import { Picker } from '@react-native-picker/picker';
import { notificationService } from '../services';
import { colors, primaryColor } from '../theme/colors';

const NotificationsScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    sendTo: 'all',
    eventId: ''
  });

  const handleSendNotification = async () => {
    if (!formData.title || !formData.message) {
      Alert.alert('Required Fields', 'Please enter both title and message');
      return;
    }

    Alert.alert(
      'Confirm Send',
      `Send notification to ${formData.sendTo === 'all' ? 'all members' : formData.sendTo}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            setLoading(true);
            try {
              const result = await notificationService.sendEventReminder(
                formData.eventId ? parseInt(formData.eventId) : 0,
                formData.message,
                formData.title,
                true, // sendEmail
                true  // sendSMS
              );

              Alert.alert(
                'Success!',
                `Notification sent successfully!\n\nEmail: ${result.emailsSent}\nSMS: ${result.smsSent}`,
                [{ text: 'OK', onPress: () => {
                  setFormData({ title: '', message: '', sendTo: 'all', eventId: '' });
                }}]
              );
            } catch (err: any) {
              Alert.alert('Send Failed', err.response?.data?.message || 'Failed to send notification');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleTestNotification = () => {
    Alert.alert(
      'Test Notification',
      'This will send a test notification to your own account',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Test',
          onPress: async () => {
            setLoading(true);
            try {
              await notificationService.sendEventReminder(
                0, // eventId - 0 for test
                formData.message || 'This is a test message',
                formData.title || 'Test Notification',
                true, // sendEmail
                true  // sendSMS
              );
              Alert.alert('Success', 'Test notification sent to your account');
            } catch (err: any) {
              Alert.alert('Test Failed', err.response?.data?.message || 'Failed to send test');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Send Notifications</Text>
        <Text style={styles.headerSubtitle}>Send email and SMS notifications to church members</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Notification Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Sunday Service Reminder"
            value={formData.title}
            onChangeText={(text) => setFormData({ ...formData, title: text })}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Message *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter your message here..."
            multiline
            numberOfLines={6}
            value={formData.message}
            onChangeText={(text) => setFormData({ ...formData, message: text })}
          />
          <Text style={styles.charCount}>{formData.message.length} characters</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Send To</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.sendTo}
              onValueChange={(value: string) => setFormData({ ...formData, sendTo: value })}
              style={styles.picker}
            >
              <Picker.Item label="All Members" value="all" />
              <Picker.Item label="Members Only" value="members" />
              <Picker.Item label="First-Timers Only" value="firstTimers" />
              <Picker.Item label="Pastors" value="pastor" />
              <Picker.Item label="Church Administrators" value="church_admin" />
              <Picker.Item label="Media Team" value="media_head" />
            </Picker>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Event ID (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter event ID if this is for a specific event"
            keyboardType="numeric"
            value={formData.eventId}
            onChangeText={(text) => setFormData({ ...formData, eventId: text })}
          />
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>📬 Delivery Info</Text>
          <Text style={styles.infoText}>• Emails sent to all members with email addresses</Text>
          <Text style={styles.infoText}>• SMS sent to Nigerian phone numbers (+234)</Text>
          <Text style={styles.infoText}>• Failed deliveries are queued for retry</Text>
          <Text style={styles.infoText}>• Check notification queue for delivery status</Text>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSendNotification}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Send Notification</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, loading && styles.buttonDisabled]}
          onPress={handleTestNotification}
          disabled={loading}
        >
          <Text style={styles.secondaryButtonText}>Send Test</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('NotificationQueue')}
        >
          <Text style={styles.linkButtonText}>View Notification Queue →</Text>
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
    height: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 5,
    textAlign: 'right',
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
    backgroundColor: '#DBEAFE',
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
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 18,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: primaryColor,
  },
  secondaryButtonText: {
    color: primaryColor,
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

export default NotificationsScreen;
