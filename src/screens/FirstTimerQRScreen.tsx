import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { firstTimerService } from '../services';
import { colors, primaryColor } from '../theme/colors';

const FirstTimerQRScreen = ({ navigation }: any) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  const handleBarCodeScanned = async ({ type, data }: any) => {
    setScanned(true);
    setLoading(true);

    try {
      // Extract QR code from scanned data
      let qrCode = data;
      if (data.includes('/first-timer/register/')) {
        qrCode = data.split('/first-timer/register/')[1];
      }

      // Check if first-timer exists
      try {
        const firstTimer = await firstTimerService.getByQR(qrCode);
        
        // First-timer exists, check them in
        const result = await firstTimerService.checkIn(qrCode);
        
        if (result.promoted) {
          Alert.alert(
            '🎉 Congratulations!',
            `${firstTimer.first_name} ${firstTimer.last_name} has been promoted to membership!\n\nUsername: ${result.username}\nTemp Password: ${result.tempPassword}`,
            [
              {
                text: 'OK',
                onPress: () => {
                  setScanned(false);
                  setScanning(true);
                  navigation.navigate('Dashboard');
                }
              }
            ]
          );
        } else {
          Alert.alert(
            '✅ Check-in Successful',
            `${firstTimer.first_name} ${firstTimer.last_name}\n\nAttendance: ${result.attendanceCount}/6\nRemaining to membership: ${result.remainingToMembership}`,
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
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          // New first-timer, navigate to registration
          Alert.alert(
            'New First-Timer',
            'This QR code hasn\'t been registered yet. Would you like to register now?',
            [
              {
                text: 'Cancel',
                style: 'cancel',
                onPress: () => {
                  setScanned(false);
                  setScanning(true);
                }
              },
              {
                text: 'Register',
                onPress: () => navigation.navigate('FirstTimerRegister', { qrCode })
              }
            ]
          );
        } else {
          throw err;
        }
      }
    } catch (err: any) {
      console.error('QR scan error:', err);
      Alert.alert(
        'Error',
        err.response?.data?.message || 'Failed to process QR code',
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

  const generateNewQR = async () => {
    setLoading(true);
    try {
      const result = await firstTimerService.generateQR();
      Alert.alert(
        'QR Code Generated',
        `QR Code: ${result.qrCode}\n\nShow this QR code to first-timers to scan.`,
        [
          {
            text: 'Copy QR Code',
            onPress: () => {
              // Copy to clipboard functionality
              Alert.alert('Copied!', 'QR code copied to clipboard');
            }
          },
          { text: 'OK' }
        ]
      );
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={primaryColor} />
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission?.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Camera permission denied</Text>
        <Text style={styles.infoText}>
          Please enable camera access in your device settings to scan QR codes.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {scanning && !loading ? (
        <>
          <CameraView
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
            style={styles.scanner}
          />
          <View style={styles.overlay}>
            <View style={styles.scanArea} />
            <Text style={styles.scanText}>
              Align QR code within the frame
            </Text>
          </View>
        </>
      ) : (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={primaryColor} />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      )}

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.secondaryButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={generateNewQR}
          disabled={loading}
        >
          <Text style={styles.primaryButtonText}>Generate QR</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.infoContainer}>
        <Text style={styles.infoTitle}>How to use:</Text>
        <Text style={styles.infoItem}>1. Generate a QR code for new first-timers</Text>
        <Text style={styles.infoItem}>2. First-timer scans the QR code</Text>
        <Text style={styles.infoItem}>3. They fill in their details</Text>
        <Text style={styles.infoItem}>4. Attendance is automatically recorded</Text>
        <Text style={styles.infoItem}>5. After 6 Sunday services, they become members!</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 20,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#6B7280',
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.danger,
    marginBottom: 10,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  scanner: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
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
    backgroundColor: 'transparent',
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
    flexDirection: 'row',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: primaryColor,
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: primaryColor,
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    padding: 15,
    maxHeight: 200,
  },
  infoTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoItem: {
    color: '#E5E7EB',
    fontSize: 13,
    marginBottom: 5,
  },
});

export default FirstTimerQRScreen;
