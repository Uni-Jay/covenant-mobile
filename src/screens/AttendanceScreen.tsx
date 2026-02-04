import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  TextInput
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { attendanceService } from '../services';
import { useAuth } from '../context/AuthContext';
import { colors, primaryColor } from '../theme/colors';

const AttendanceScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serviceType, setServiceType] = useState('sunday_service');
  const [myAttendance, setMyAttendance] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchMyAttendance();
  }, []);

  const fetchMyAttendance = async () => {
    try {
      const data = await attendanceService.getMyAttendance();
      setMyAttendance(data.attendance.slice(0, 10));
      setStats(data.summary);
    } catch (err: any) {
      console.error('Error fetching attendance:', err);
    }
  };

  const requestCameraPermission = async () => {
    const result = await requestPermission();
    if (result?.granted) {
      setScanning(true);
    } else {
      Alert.alert('Permission Denied', 'Camera permission is required to scan QR codes');
    }
  };

  const handleBarCodeScanned = async ({ type, data }: any) => {
    setScanned(true);
    setLoading(true);

    try {
      const qrCode = data.includes('/attendance/check-in/') 
        ? data.split('/attendance/check-in/')[1]
        : data;

      const result = await attendanceService.checkIn(qrCode, serviceType);

      Alert.alert(
        '✅ Check-in Successful',
        `You have been checked in for ${serviceType.replace('_', ' ')}!`,
        [
          {
            text: 'OK',
            onPress: () => {
              setScanned(false);
              setScanning(false);
              fetchMyAttendance();
            }
          }
        ]
      );
    } catch (err: any) {
      Alert.alert(
        'Check-in Failed',
        err.response?.data?.message || 'Failed to check in. Please try again.',
        [
          {
            text: 'OK',
            onPress: () => {
              setScanned(false);
              setScanning(true);
            }
          }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const renderServiceTypeSelector = () => (
    <View style={styles.selectorContainer}>
      <Text style={styles.label}>Select Service Type:</Text>
      <View style={styles.serviceTypeButtons}>
        {[
          { value: 'sunday_service', label: 'Sunday Service' },
          { value: 'sunday_school', label: 'Sunday School' },
          { value: 'tuesday_prayer', label: 'Tuesday Prayer' },
          { value: 'thursday_bible_study', label: 'Bible Study' },
          { value: 'vigil', label: 'Vigil' },
        ].map((service) => (
          <TouchableOpacity
            key={service.value}
            style={[
              styles.serviceButton,
              serviceType === service.value && styles.serviceButtonActive
            ]}
            onPress={() => setServiceType(service.value)}
          >
            <Text style={[
              styles.serviceButtonText,
              serviceType === service.value && styles.serviceButtonTextActive
            ]}>
              {service.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderAttendanceItem = (item: any, index: number) => (
    <View key={index} style={styles.attendanceItem}>
      <View style={styles.attendanceIcon}>
        <Text style={styles.attendanceIconText}>
          {item.service_type === 'sunday_service' ? '⛪' : 
           item.service_type === 'sunday_school' ? '📚' :
           item.service_type === 'tuesday_prayer' ? '🙏' :
           item.service_type === 'thursday_bible_study' ? '📖' :
           item.service_type === 'vigil' ? '🌙' : '✅'}
        </Text>
      </View>
      <View style={styles.attendanceContent}>
        <Text style={styles.attendanceTitle}>
          {item.service_type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
        </Text>
        <Text style={styles.attendanceDate}>
          {new Date(item.service_date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </Text>
        <Text style={styles.attendanceTime}>
          Check-in: {new Date(item.check_in_time).toLocaleTimeString()}
        </Text>
      </View>
    </View>
  );

  if (scanning) {
    return (
      <View style={styles.container}>
        {!permission?.granted ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>Camera permission denied</Text>
            <TouchableOpacity style={styles.button} onPress={requestCameraPermission}>
              <Text style={styles.buttonText}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        ) : loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={primaryColor} />
            <Text style={styles.loadingText}>Processing check-in...</Text>
          </View>
        ) : (
          <>
            <CameraView
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
              style={styles.scanner}
            />
            <View style={styles.scanOverlay}>
              <View style={styles.scanArea} />
              <Text style={styles.scanText}>
                Scan QR code to check in
              </Text>
            </View>
            <View style={styles.bottomBar}>
              {renderServiceTypeSelector()}
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setScanning(false);
                  setScanned(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Attendance</Text>
        <Text style={styles.headerSubtitle}>{user?.firstName} {user?.lastName}</Text>
      </View>

      {/* Stats Cards */}
      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Check-ins</Text>
          </View>
          {stats.byServiceType?.map((service: any, index: number) => (
            <View key={index} style={styles.statCard}>
              <Text style={styles.statValue}>{service.count}</Text>
              <Text style={styles.statLabel}>
                {service.service_type.replace(/_/g, ' ')}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Check-in Button */}
      <View style={styles.actionSection}>
        <TouchableOpacity
          style={styles.checkInButton}
          onPress={requestCameraPermission}
        >
          <Text style={styles.checkInIcon}>📷</Text>
          <Text style={styles.checkInText}>Scan QR to Check In</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Attendance */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Attendance</Text>
        {myAttendance.length > 0 ? (
          myAttendance.map((item, index) => renderAttendanceItem(item, index))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No attendance records yet</Text>
            <Text style={styles.emptySubtext}>Start checking in to see your history</Text>
          </View>
        )}
      </View>

      {/* Admin Actions */}
      {(user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'pastor') && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Admin Actions</Text>
          <TouchableOpacity
            style={styles.adminButton}
            onPress={() => navigation.navigate('AttendanceReport')}
          >
            <Text style={styles.adminButtonText}>📊 View Reports</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.adminButton}
            onPress={() => navigation.navigate('GenerateAttendanceQR')}
          >
            <Text style={styles.adminButtonText}>🎫 Generate Service QR</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.adminButton}
            onPress={() => navigation.navigate('ManualAttendance')}
          >
            <Text style={styles.adminButtonText}>✏️ Mark Manual Attendance</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.footer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 20,
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
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    marginTop: -20,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    margin: 5,
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: primaryColor,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  actionSection: {
    padding: 20,
  },
  checkInButton: {
    backgroundColor: primaryColor,
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  checkInIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  checkInText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15,
  },
  attendanceItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  attendanceIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: primaryColor + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  attendanceIconText: {
    fontSize: 24,
  },
  attendanceContent: {
    flex: 1,
  },
  attendanceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  attendanceDate: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  attendanceTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  adminButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 18,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  adminButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  scanner: {
    ...StyleSheet.absoluteFillObject,
  },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 12,
  },
  scanText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    padding: 20,
  },
  selectorContainer: {
    marginBottom: 20,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 10,
    fontWeight: '600',
  },
  serviceTypeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  serviceButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    margin: 5,
  },
  serviceButtonActive: {
    backgroundColor: primaryColor,
  },
  serviceButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  serviceButtonTextActive: {
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: primaryColor,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
  },
  cancelButtonText: {
    color: primaryColor,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: colors.danger,
    marginBottom: 20,
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#6B7280',
  },
  footer: {
    height: 40,
  },
});

export default AttendanceScreen;
