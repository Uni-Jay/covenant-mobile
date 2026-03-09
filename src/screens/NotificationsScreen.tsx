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
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { notificationService, eventsService } from '../services';
import { colors } from '../theme/colors';
import api from '../services/api';

const NotificationsScreen = ({ navigation }: any) => {
  const { colors: themeColors } = useTheme();
  const styles = createStyles(themeColors);
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<string[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    sendTo: 'all',
    eventName: '',
    serviceType: 'Sunday Service',
    venue: 'Church Auditorium',
    eventTime: '',
    eventDate: ''
  });

  // Check if user has permission
  useEffect(() => {
    const isAdminOrMedia = user?.role === 'admin' || user?.role === 'media' || user?.role === 'media_head' ||
      (user?.departments && user.departments.some((d: string) => d.toLowerCase() === 'media'));
    if (!isAdminOrMedia) {
      Alert.alert(
        'Access Denied',
        'You do not have permission to send notifications.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  }, [user, navigation]);

  // Load departments and events
  useEffect(() => {
    loadDepartments();
    loadEvents();
  }, []);

  const loadDepartments = async () => {
    try {
      const response = await api.get('/departments');
      const deptNames = response.data.departments?.map((d: any) => d.name) || [];
      setDepartments(deptNames);
    } catch (error) {
      console.error('Failed to load departments:', error);
    }
  };

  const loadEvents = async () => {
    try {
      const data = await eventsService.getAll();
      setEvents(data);
    } catch (error) {
      console.error('Failed to load events:', error);
    }
  };

  // Auto-generate message when relevant fields change
  useEffect(() => {
    if (formData.title) {
      generateMessage(formData.title, formData.eventName, formData.serviceType, formData.venue, formData.eventTime, formData.eventDate);
    }
  }, [formData.title, formData.eventName, formData.serviceType, formData.venue, formData.eventTime, formData.eventDate]);

  const getServiceTime = (serviceType: string) => {
    const serviceTimes: { [key: string]: string } = {
      'Sunday Service': '9:00 AM - 11:00 AM',
      'Tuesday Service': '5:00 PM - 7:00 PM',
      'Wednesday Service': '5:00 PM - 7:00 PM',
      'Friday Service': '5:00 PM - 7:00 PM',
      'Prayer Meeting': '6:00 AM - 7:00 AM',
      'Bible Study': '5:00 PM - 6:30 PM',
      'Youth Service': '4:00 PM - 6:00 PM',
      'Special Service': '9:00 AM - 12:00 PM',
    };
    return serviceTimes[serviceType] || '9:00 AM';
  };

  const generateMessage = (title: string, eventName: string, serviceType: string, venue: string, eventTime: string, eventDate: string) => {
    // Find selected event details
    const selectedEvent = events.find(e => e.title === eventName);
    const time = eventTime || (selectedEvent ? new Date(selectedEvent.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : getServiceTime(serviceType));
    const date = eventDate || (selectedEvent ? new Date(selectedEvent.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '');
    const location = venue || (selectedEvent?.location) || 'Church Auditorium';

    let message = `Dear Beloved in Christ,\n\n`;
    message += `Grace and peace to you from God our Father and the Lord Jesus Christ.\n\n`;
    message += `This is to inform you about:\n`;
    message += `ðŸ“Œ ${title.toUpperCase()}\n\n`;
    
    message += `DETAILS:\n`;
    message += `â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”\n`;
    
    if (serviceType && serviceType !== 'Other') {
      message += `Service: ${serviceType}\n`;
    }
    
    if (eventName) {
      message += `Event: ${eventName}\n`;
    }
    
    if (date) {
      message += `Date: ${date}\n`;
    }
    
    message += `Time: ${time}\n`;
    message += `Venue: ${location}\n`;
    message += `â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”\n\n`;
    
    message += `Your presence and participation will be highly valued as we gather together in fellowship and worship.\n\n`;
    message += `"For where two or three gather in my name, there am I with them." - Matthew 18:20\n\n`;
    message += `Should you have any questions or require further information, please do not hesitate to contact the church office.\n\n`;
    message += `We look forward to seeing you!\n\n`;
    message += `Blessings,\n`;
    message += `Church Administration\n`;
    message += `Household Of Covenant And Faith Apostolic Ministry`;
    
    setFormData(prev => ({ ...prev, message }));
  };

  const handleTitleChange = (text: string) => {
    setFormData(prev => ({ ...prev, title: text }));
  };

  const handleEventChange = (eventName: string) => {
    const selectedEvent = events.find(e => e.title === eventName);
    if (selectedEvent) {
      const eventDateTime = new Date(selectedEvent.date);
      setFormData(prev => ({ 
        ...prev, 
        eventName,
        eventTime: eventDateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        eventDate: eventDateTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        venue: selectedEvent.location || prev.venue
      }));
    } else {
      setFormData(prev => ({ ...prev, eventName }));
    }
  };

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
                0, // eventId - will be handled by backend based on event name
                formData.message,
                formData.title,
                true, // sendEmail
                true  // sendSMS
              );

              Alert.alert(
                'Success!',
                `Notification sent successfully!\n\nEmail: ${result.emailsSent}\nSMS: ${result.smsSent}`,
                [{ text: 'OK', onPress: () => {
                  setFormData({ 
                    title: '', 
                    message: '', 
                    sendTo: 'all', 
                    eventName: '', 
                    serviceType: 'Sunday Service',
                    venue: 'Church Auditorium',
                    eventTime: '',
                    eventDate: ''
                  });
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
            onChangeText={handleTitleChange}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Service Type</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.serviceType}
              onValueChange={(value: string) => {
                setFormData({ ...formData, serviceType: value });
              }}
              style={styles.picker}
            >
              <Picker.Item label="Sunday Service" value="Sunday Service" />
              <Picker.Item label="Tuesday Service" value="Tuesday Service" />
              <Picker.Item label="Wednesday Service" value="Wednesday Service" />
              <Picker.Item label="Friday Service" value="Friday Service" />
              <Picker.Item label="Special Service" value="Special Service" />
              <Picker.Item label="Prayer Meeting" value="Prayer Meeting" />
              <Picker.Item label="Bible Study" value="Bible Study" />
              <Picker.Item label="Youth Service" value="Youth Service" />
              <Picker.Item label="Other" value="Other" />
            </Picker>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Event (Optional)</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.eventName}
              onValueChange={handleEventChange}
              style={styles.picker}
            >
              <Picker.Item label="No Event Selected" value="" />
              {events.map((event) => (
                <Picker.Item key={event.id} label={event.title} value={event.title} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Venue</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Church Auditorium"
            value={formData.venue}
            onChangeText={(text) => setFormData({ ...formData, venue: text })}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Time (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 9:00 AM - 11:00 AM"
            value={formData.eventTime}
            onChangeText={(text) => setFormData({ ...formData, eventTime: text })}
          />
          <Text style={styles.helpText}>Leave empty to use default service time</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Sunday, February 9, 2026"
            value={formData.eventDate}
            onChangeText={(text) => setFormData({ ...formData, eventDate: text })}
          />
          <Text style={styles.helpText}>Leave empty to use event date or no date</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Message *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Message will be auto-generated..."
            multiline
            numberOfLines={12}
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
              {departments.map((dept) => (
                <Picker.Item key={dept} label={dept} value={dept} />
              ))}
              <Picker.Item label="First-Timers Only" value="firstTimers" />
            </Picker>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>ðŸ“¬ Delivery Info</Text>
          <Text style={styles.infoText}>â€¢ Emails sent to all members with email addresses</Text>
          <Text style={styles.infoText}>â€¢ SMS sent to Nigerian phone numbers (+234)</Text>
          <Text style={styles.infoText}>â€¢ Failed deliveries are queued for retry</Text>
          <Text style={styles.infoText}>â€¢ Check notification queue for delivery status</Text>
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
          <Text style={styles.linkButtonText}>View Notification Queue â†’</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};


const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    backgroundColor: colors.primary[600],
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
  helpText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 5,
    fontStyle: 'italic',
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
    backgroundColor: colors.primary[600],
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
    borderColor: colors.primary[600],
  },
  secondaryButtonText: {
    color: colors.primary[600],
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkButton: {
    padding: 15,
    alignItems: 'center',
  },
  linkButtonText: {
    color: colors.primary[600],
    fontSize: 16,
    fontWeight: '600',
  },
});

export default NotificationsScreen;
