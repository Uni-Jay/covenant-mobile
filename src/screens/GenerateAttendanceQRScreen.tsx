import React, { useState } from 'react';
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
import { Picker } from '@react-native-picker/picker';
import QRCode from 'react-native-qrcode-svg';
import { attendanceService } from '../services';
import { colors, primaryColor } from '../theme/colors';

const GenerateAttendanceQRScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(false);
  const [qrData, setQrData] = useState<any>(null);
  const [formData, setFormData] = useState({
    serviceType: 'sunday_service',
    serviceDate: new Date().toISOString().split('T')[0],
    eventId: ''
  });

  let qrRef: any = null;

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
        <Text style={styles.headerTitle}>Generate Attendance QR</Text>
        <Text style={styles.headerSubtitle}>Create QR codes for service check-in</Text>
      </View>

      <View style={styles.content}>
        {!qrData ? (
          <View style={styles.form}>
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
              <Text style={styles.dateDisplay}>{formData.serviceDate}</Text>
              <Text style={styles.hint}>Using today's date. QR code valid for 24 hours.</Text>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>ℹ️ How it works</Text>
              <Text style={styles.infoText}>1. Generate a QR code for the service</Text>
              <Text style={styles.infoText}>2. Display it on a screen or print it</Text>
              <Text style={styles.infoText}>3. Members scan with their app to check in</Text>
              <Text style={styles.infoText}>4. Attendance is automatically recorded</Text>
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleGenerateQR}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Generate QR Code</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.qrContainer}>
            <View style={styles.qrCard}>
              <Text style={styles.qrTitle}>{getServiceTypeLabel(qrData.serviceType)}</Text>
              <Text style={styles.qrDate}>{new Date(qrData.serviceDate).toLocaleDateString()}</Text>

              <View style={styles.qrCodeWrapper}>
                <QRCode
                  value={qrData.qrCode}
                  size={250}
                  backgroundColor="white"
                  color={primaryColor}
                  getRef={(c: any) => (qrRef = c)}
                />
              </View>

              <View style={styles.qrInfo}>
                <Text style={styles.qrInfoLabel}>QR Code ID</Text>
                <Text style={styles.qrInfoValue}>{qrData.qrCode}</Text>
              </View>

              <View style={styles.qrInfo}>
                <Text style={styles.qrInfoLabel}>Valid Until</Text>
                <Text style={styles.qrInfoValue}>
                  {new Date(qrData.expiresAt).toLocaleString()}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleShareQR}>
              <Text style={styles.buttonText}>📤 Share QR Code</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setQrData(null)}
            >
              <Text style={styles.secondaryButtonText}>Generate Another</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => navigation.navigate('AttendanceReport')}
            >
              <Text style={styles.linkButtonText}>View Attendance Report →</Text>
            </TouchableOpacity>
          </View>
        )}
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
  form: {
    marginTop: 20,
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
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  picker: {
    height: 50,
  },
  dateDisplay: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  hint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 5,
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
  qrContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  qrCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  qrTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 5,
  },
  qrDate: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 20,
  },
  qrCodeWrapper: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 20,
  },
  qrInfo: {
    width: '100%',
    marginBottom: 10,
  },
  qrInfoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  qrInfoValue: {
    fontSize: 14,
    color: '#1F2937',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  button: {
    backgroundColor: primaryColor,
    borderRadius: 8,
    padding: 18,
    alignItems: 'center',
    marginBottom: 10,
    width: '100%',
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
    width: '100%',
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

export default GenerateAttendanceQRScreen;
