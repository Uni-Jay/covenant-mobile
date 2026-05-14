import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  Switch
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { notificationService, eventsService } from '../services';
import { colors } from '../theme/colors';
import api from '../services/api';
import { hasLeadershipAccess, hasMediaDepartment } from '../utils/rolePermissions';

interface SelectedDate {
  id: string;
  date: string;
  formattedDate: string;
}

const NotificationsScreen = ({ navigation }: any) => {
  const { colors: themeColors } = useTheme();
  const styles = createStyles(themeColors);
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<string[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedDates, setSelectedDates] = useState<SelectedDate[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateInput, setDateInput] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    sendTo: 'all',
    eventName: '',
    serviceType: 'Sunday Service',
    venue: 'Church Auditorium',
    linkedToEvent: false,
  });

  // Check if user has permission
  useEffect(() => {
    const isAdminOrMedia = hasLeadershipAccess(user?.role) || hasMediaDepartment(user?.departments as any);
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

  const addDate = () => {
    if (!dateInput.trim()) {
      Alert.alert('Date Required', 'Please enter a date');
      return;
    }

    const newDate: SelectedDate = {
      id: Date.now().toString(),
      date: dateInput,
      formattedDate: dateInput
    };

    setSelectedDates([...selectedDates, newDate]);
    setDateInput('');
  };

  const removeDate = (id: string) => {
    setSelectedDates(selectedDates.filter(d => d.id !== id));
  };

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

  const generateMessage = () => {
    let message = `Dear Beloved in Christ,\n\n`;
    message += `Grace and peace to you from God our Father and the Lord Jesus Christ.\n\n`;
    message += `This is to inform you about:\n`;
    message += `${formData.title.toUpperCase()}\n\n`;
    
    message += `DETAILS:\n`;
    message += `${'-'.repeat(40)}\n`;
    
    if (formData.serviceType && formData.serviceType !== 'Other') {
      message += `Service: ${formData.serviceType}\n`;
    }
    
    if (formData.eventName) {
      message += `Event: ${formData.eventName}\n`;
    }
    
    if (selectedDates.length > 0) {
      message += `Dates:\n`;
      selectedDates.forEach((d, i) => {
        message += `  ${i + 1}. ${d.formattedDate}\n`;
      });
    }
    
    message += `Time: ${getServiceTime(formData.serviceType)}\n`;
    message += `Venue: ${formData.venue}\n`;
    message += `${'-'.repeat(40)}\n\n`;
    
    message += `Your presence and participation will be highly valued.\n\n`;
    message += `"For where two or three gather in my name, there am I with them." - Matthew 18:20\n\n`;
    message += `Should you have any questions, please contact the church office.\n\n`;
    message += `We look forward to seeing you!\n\n`;
    message += `Blessings,\n`;
    message += `Church Administration\n`;
    message += `Household Of Covenant And Faith Apostolic Ministry`;
    
    return message;
  };

  const handleSendNotification = async () => {
    if (!formData.title) {
      Alert.alert('Required Field', 'Please enter a title');
      return;
    }

    const message = generateMessage();

    Alert.alert(
      'Confirm Send',
      `Send notification to ${formData.sendTo === 'all' ? 'all members' : formData.sendTo}?\n\nRecipients: ${formData.sendTo === 'all' ? 'All Members' : formData.sendTo}${selectedDates.length > 0 ? `\nDates: ${selectedDates.length}` : ''}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            setLoading(true);
            try {
              // Send generic notification (not linked to a specific event)
              const result = await api.post('/notifications/send-generic', {
                title: formData.title,
                message,
                sendTo: formData.sendTo,
                sendEmail: true,
                sendSMS: true,
                dates: selectedDates.map(d => d.date)
              });

              Alert.alert(
                'Success!',
                `Notification sent successfully!\n\nEmail: ${result.data.emailsSent || 0}\nSMS: ${result.data.smsSent || 0}`,
                [{ text: 'OK', onPress: () => {
                  setFormData({ 
                    title: '', 
                    message: '', 
                    sendTo: 'all', 
                    eventName: '', 
                    serviceType: 'Sunday Service',
                    venue: 'Church Auditorium',
                    linkedToEvent: false
                  });
                  setSelectedDates([]);
                }}]
              );
            } catch (err: any) {
              const errorMsg = err.response?.data?.message || err.message || 'Failed to send notification';
              Alert.alert('Send Failed', errorMsg);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleTestNotification = () => {
    const message = generateMessage();
    Alert.alert(
      'Test Notification',
      'Send a test notification to your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Test',
          onPress: async () => {
            setLoading(true);
            try {
              await api.post('/notifications/send-test', {
                title: formData.title || 'Test Notification',
                message: message || 'This is a test message',
              });
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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <MaterialCommunityIcons name="megaphone" size={32} color="#FFFFFF" />
        <Text style={styles.headerTitle}>Send Notifications</Text>
        <Text style={styles.headerSubtitle}>Email & SMS to church members</Text>
      </View>

      <View style={styles.form}>
        {/* Title */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Notification Title *</Text>
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="format-title" size={20} color={themeColors.primary[600]} />
            <TextInput
              style={styles.input}
              placeholder="e.g., Sunday Service Reminder"
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        {/* Service Type */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Service Type</Text>
          <View style={styles.pickerContainer}>
            <MaterialCommunityIcons name="church" size={20} color={themeColors.primary[600]} />
            <Picker
              selectedValue={formData.serviceType}
              onValueChange={(value: string) => setFormData({ ...formData, serviceType: value })}
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

        {/* Event Selection (Optional) */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Link to Event (Optional)</Text>
          <View style={styles.pickerContainer}>
            <MaterialCommunityIcons name="calendar-multiple" size={20} color={themeColors.primary[600]} />
            <Picker
              selectedValue={formData.eventName}
              onValueChange={(value: string) => setFormData({ ...formData, eventName: value })}
              style={styles.picker}
            >
              <Picker.Item label="No Event" value="" />
              {events.map((event) => (
                <Picker.Item key={event.id} label={event.title} value={event.title} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Venue */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Venue</Text>
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="map-marker" size={20} color={themeColors.primary[600]} />
            <TextInput
              style={styles.input}
              placeholder="e.g., Church Auditorium"
              value={formData.venue}
              onChangeText={(text) => setFormData({ ...formData, venue: text })}
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        {/* Multiple Dates Section */}
        <View style={styles.inputGroup}>
          <View style={styles.dateHeaderRow}>
            <Text style={styles.label}>Event Dates (Multiple Dates Supported)</Text>
            <Text style={styles.dateCount}>{selectedDates.length} date{selectedDates.length !== 1 ? 's' : ''}</Text>
          </View>
          
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="calendar" size={20} color={themeColors.primary[600]} />
            <TextInput
              style={styles.input}
              placeholder="e.g., Sunday, Feb 9, 2026"
              value={dateInput}
              onChangeText={setDateInput}
              placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity style={styles.addButton} onPress={addDate}>
              <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {selectedDates.length > 0 && (
            <View style={styles.datesList}>
              {selectedDates.map((d, index) => (
                <View key={d.id} style={styles.dateItem}>
                  <View style={styles.dateItemContent}>
                    <MaterialCommunityIcons name="calendar-check" size={18} color={themeColors.primary[600]} />
                    <Text style={styles.dateItemText}>{index + 1}. {d.formattedDate}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.removeButton}
                    onPress={() => removeDate(d.id)}
                  >
                    <MaterialCommunityIcons name="close" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Message */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Custom Message (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Leave empty for auto-generated message"
            multiline
            numberOfLines={8}
            value={formData.message}
            onChangeText={(text) => setFormData({ ...formData, message: text })}
            placeholderTextColor="#9CA3AF"
          />
          <Text style={styles.charCount}>{formData.message.length} characters</Text>
          <TouchableOpacity 
            style={styles.previewButton}
            onPress={() => Alert.alert('Message Preview', generateMessage())}
          >
            <MaterialCommunityIcons name="eye" size={16} color={themeColors.primary[600]} />
            <Text style={styles.previewButtonText}>Preview Generated Message</Text>
          </TouchableOpacity>
        </View>

        {/* Send To */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Send To</Text>
          <View style={styles.pickerContainer}>
            <MaterialCommunityIcons name="account-multiple" size={20} color={themeColors.primary[600]} />
            <Picker
              selectedValue={formData.sendTo}
              onValueChange={(value: string) => setFormData({ ...formData, sendTo: value })}
              style={styles.picker}
            >
              <Picker.Item label="👥 All Members" value="all" />
              {departments.map((dept) => (
                <Picker.Item key={dept} label={`📌 ${dept}`} value={dept} />
              ))}
              <Picker.Item label="🆕 First-Timers Only" value="firstTimers" />
            </Picker>
          </View>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <MaterialCommunityIcons name="information" size={20} color={themeColors.primary[600]} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Delivery Info</Text>
            <Text style={styles.infoText}>✓ Emails to all members with addresses</Text>
            <Text style={styles.infoText}>✓ SMS to Nigerian numbers (+234)</Text>
            <Text style={styles.infoText}>✓ Multiple dates send to all recipients</Text>
            <Text style={styles.infoText}>✓ Failed deliveries queued for retry</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={[
            styles.button, 
            styles.primaryButton,
            (loading || !formData.title) && styles.buttonDisabled
          ]}
          onPress={handleSendNotification}
          disabled={loading || !formData.title}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <MaterialCommunityIcons name="send" size={20} color="#FFFFFF" />
              <Text style={styles.buttonText}>Send Notification</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton, loading && styles.buttonDisabled]}
          onPress={handleTestNotification}
          disabled={loading}
        >
          <MaterialCommunityIcons name="test-tube" size={20} color={themeColors.primary[600]} />
          <Text style={[styles.buttonText, { color: themeColors.primary[600] }]}>Send Test</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('NotificationQueue')}
        >
          <Text style={[styles.linkButtonText, { color: themeColors.primary[600] }]}>
            View Queue {'>'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: colors.primary[600],
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 12,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E5E7EB',
    marginTop: 4,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    fontSize: 15,
    color: '#111827',
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
  },
  picker: {
    flex: 1,
    height: 50,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
    textAlign: 'right',
  },
  dateHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dateCount: {
    fontSize: 12,
    color: colors.primary[600],
    fontWeight: '600',
    backgroundColor: colors.primary[100],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  addButton: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  datesList: {
    marginTop: 12,
    gap: 8,
  },
  dateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[600],
  },
  dateItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  dateItemText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  removeButton: {
    padding: 6,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.primary[50],
    borderRadius: 8,
    gap: 6,
  },
  previewButtonText: {
    fontSize: 13,
    color: colors.primary[600],
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.primary[50],
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[600],
    borderRadius: 10,
    padding: 14,
    marginBottom: 24,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 12,
    color: '#4B5563',
    marginBottom: 3,
    lineHeight: 16,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: colors.primary[600],
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.primary[600],
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  linkButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default NotificationsScreen;

  // Check if user has permission
  useEffect(() => {
    const isAdminOrMedia = hasLeadershipAccess(user?.role) || hasMediaDepartment(user?.departments as any);
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
    message += `${title.toUpperCase()}\n\n`;
    
    message += `DETAILS:\n`;
    message += `----------------------\n`;
    
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
    message += `----------------------\n\n`;
    
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
          <Text style={styles.infoTitle}>Delivery Info</Text>
          <Text style={styles.infoText}>- Emails sent to all members with email addresses</Text>
          <Text style={styles.infoText}>- SMS sent to Nigerian phone numbers (+234)</Text>
          <Text style={styles.infoText}>- Failed deliveries are queued for retry</Text>
          <Text style={styles.infoText}>- Check notification queue for delivery status</Text>
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
          <Text style={styles.linkButtonText}>View Notification Queue {'->'}</Text>
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
