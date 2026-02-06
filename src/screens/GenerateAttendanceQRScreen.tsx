import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Share,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker';
import QRCode from 'react-native-qrcode-svg';
import { attendanceService } from '../services';
import { colors, primaryColor } from '../theme/colors';
import api from '../services/api';

interface Event {
  id: number;
  title: string;
  date: string;
  time: string;
}

const GenerateAttendanceQRScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [qrData, setQrData] = useState<any>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [formData, setFormData] = useState({
    serviceType: 'sunday_service',
    serviceDate: new Date().toISOString().split('T')[0],
    eventId: ''
  });

  let qrRef: any = null;

  useEffect(() => {
    loadUpcomingEvents();
  }, []);

  const loadUpcomingEvents = async () => {
    try {
      setLoadingEvents(true);
      const response = await api.get('/events');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Filter events that are today or in the future
      const upcoming = response.data.filter((event: Event) => {
        const eventDate = new Date(event.date);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate >= today;
      });
      
      setUpcomingEvents(upcoming);
    } catch (error) {
      console.error('Load events error:', error);
    } finally {
      setLoadingEvents(false);
    }
  };

  const handleGenerateQR = async () => {
    setLoading(true);
    try {
      const result = await attendanceService.generateServiceQR(
        formData.serviceType,
        formData.serviceDate,
        formData.eventId ? parseInt(formData.eventId) : undefined
      );

      setQrData(result);
      Alert.alert('Success', 'QR Code generated successfully! Members can now scan to check in.');
    } catch (err: any) {
      Alert.alert('Generation Failed', err.response?.data?.message || 'Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  const handleShareQR = async () => {
    if (!qrData) return;

    try {
      await Share.share({
        message: `Attendance QR Code\nService: ${formData.serviceType}\nDate: ${formData.serviceDate}\nQR Code: ${qrData.qrCode}\n\nScan this code to check in!`,
      });
    } catch (err) {
      Alert.alert('Share Failed', 'Could not share QR code');
    }
  };

  const getServiceTypeLabel = (type: string) => {
    // Check if it's an event
    if (type.startsWith('event_')) {
      const eventId = parseInt(type.replace('event_', ''));
      const event = upcomingEvents.find(e => e.id === eventId);
      return event ? event.title : 'Special Event';
    }
    
    const labels: any = {
      sunday_service: 'Sunday Service',
      sunday_school: 'Sunday School',
      tuesday_prayer: 'Tuesday Prayer Meeting',
      thursday_bible_study: 'Thursday Bible Study',
      other: 'Other Service'
    };
    return labels[type] || type;
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>✨ Generate Attendance QR</Text>
        <Text style={styles.headerSubtitle}>Create QR codes for service check-in</Text>
      </LinearGradient>

      <ScrollView style={styles.scrollContent}>
        <View style={styles.content}>
          {!qrData ? (
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>📋 Service Type</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={formData.serviceType}
                    onValueChange={(value: string) => setFormData({ ...formData, serviceType: value })}
                    style={styles.picker}
                  >
                    <Picker.Item label="🙏 Sunday Service" value="sunday_service" />
                    <Picker.Item label="📖 Sunday School" value="sunday_school" />
                    <Picker.Item label="🕯️ Tuesday Prayer Meeting" value="tuesday_prayer" />
                    <Picker.Item label="📚 Thursday Bible Study" value="thursday_bible_study" />
                    {!loadingEvents && upcomingEvents.map((event) => (
                      <Picker.Item 
                        key={`event_${event.id}`} 
                        label={`🎉 ${event.title}`} 
                        value={`event_${event.id}`} 
                      />
                    ))}
                    <Picker.Item label="📌 Other Service" value="other" />
                  </Picker>
                </View>
                {loadingEvents && (
                  <Text style={styles.loadingText}>Loading events...</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>📅 Service Date</Text>
                <View style={styles.dateCard}>
                  <Text style={styles.dateDisplay}>{new Date(formData.serviceDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</Text>
                </View>
                <Text style={styles.hint}>⏱️ QR code valid for 24 hours from generation</Text>
              </View>

              <LinearGradient
                colors={['#e0f2fe', '#bfdbfe']}
                style={styles.infoBox}
              >
                <Text style={styles.infoTitle}>💡 How it works</Text>
                <View style={styles.infoStep}>
                  <Text style={styles.stepNumber}>1</Text>
                  <Text style={styles.infoText}>Generate a QR code for the service</Text>
                </View>
                <View style={styles.infoStep}>
                  <Text style={styles.stepNumber}>2</Text>
                  <Text style={styles.infoText}>Display it on a screen or print it</Text>
                </View>
                <View style={styles.infoStep}>
                  <Text style={styles.stepNumber}>3</Text>
                  <Text style={styles.infoText}>Members scan with their app to check in</Text>
                </View>
                <View style={styles.infoStep}>
                  <Text style={styles.stepNumber}>4</Text>
                  <Text style={styles.infoText}>Attendance is automatically recorded</Text>
                </View>
              </LinearGradient>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleGenerateQR}
                disabled={loading}
              >
                <LinearGradient
                  colors={loading ? ['#9CA3AF', '#9CA3AF'] : ['#667eea', '#764ba2']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.buttonIcon}>✨</Text>
                      <Text style={styles.buttonText}>Generate QR Code</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.qrContainer}>
              <LinearGradient
                colors={['#ffffff', '#f3f4f6']}
                style={styles.qrCard}
              >
                <View style={styles.qrHeader}>
                  <Text style={styles.qrTitle}>🎯 {getServiceTypeLabel(qrData.serviceType)}</Text>
                  <Text style={styles.qrDate}>📅 {new Date(qrData.serviceDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</Text>
                </View>

                <View style={styles.qrCodeWrapper}>
                  <View style={styles.qrCodeContainer}>
                    <QRCode
                      value={qrData.qrCode}
                      size={250}
                      backgroundColor="white"
                      color="#667eea"
                      getRef={(c: any) => (qrRef = c)}
                    />
                  </View>
                </View>

                <View style={styles.qrDetailsContainer}>
                  <View style={styles.qrInfo}>
                    <Text style={styles.qrInfoLabel}>🔑 QR Code ID</Text>
                    <Text style={styles.qrInfoValue}>{qrData.qrCode}</Text>
                  </View>

                  <View style={styles.qrInfo}>
                    <Text style={styles.qrInfoLabel}>⏰ Valid Until</Text>
                    <Text style={styles.qrInfoValue}>
                      {new Date(qrData.expiresAt).toLocaleString()}
                    </Text>
                  </View>
                </View>
              </LinearGradient>

              <TouchableOpacity style={styles.shareButton} onPress={handleShareQR}>
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonIcon}>📤</Text>
                  <Text style={styles.buttonText}>Share QR Code</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                  setQrData(null);
                  loadUpcomingEvents(); // Refresh events list
                }}
              >
                <Text style={styles.secondaryButtonText}>🔄 Generate Another</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => navigation.navigate('AttendanceReport')}
              >
                <Text style={styles.linkButtonText}>📊 View Attendance Report →</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E5E7EB',
  },
  scrollContent: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  form: {
    marginTop: 10,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 10,
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  picker: {
    height: 55,
    color: '#1F2937',
  },
  loadingText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
  dateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 18,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dateDisplay: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  hint: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 8,
  },
  infoBox: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  infoStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#667eea',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: 'bold',
    fontSize: 14,
    marginRight: 12,
  },
  infoText: {
    fontSize: 15,
    color: '#374151',
    flex: 1,
  },
  qrContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  qrCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  qrHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  qrTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  qrDate: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  qrCodeWrapper: {
    marginBottom: 24,
  },
  qrCodeContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  qrDetailsContainer: {
    width: '100%',
  },
  qrInfo: {
    width: '100%',
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: 12,
    borderRadius: 10,
  },
  qrInfoLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '600',
  },
  qrInfoValue: {
    fontSize: 15,
    color: '#1F2937',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '500',
  },
  button: {
    width: '100%',
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  buttonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  shareButton: {
    width: '100%',
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#667eea',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  secondaryButtonText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkButton: {
    padding: 16,
    alignItems: 'center',
  },
  linkButtonText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default GenerateAttendanceQRScreen;
