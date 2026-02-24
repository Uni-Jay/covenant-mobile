import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Vibration,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { IncomingCall } from '../services/socket.service';

interface IncomingCallModalProps {
  visible: boolean;
  call: IncomingCall | null;
  onAccept: () => void;
  onReject: () => void;
}

const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  visible,
  call,
  onAccept,
  onReject,
}) => {
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (visible) {
      // Start vibration pattern
      const vibrationPattern = [0, 500, 200, 500];
      Vibration.vibrate(vibrationPattern, true);

      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      Vibration.cancel();
      pulseAnim.setValue(1);
    }

    return () => {
      Vibration.cancel();
    };
  }, [visible]);

  if (!call) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <LinearGradient
          colors={[colors.primary[600], colors.primary[800]]}
          style={styles.container}
        >
          {/* Call Type Icon */}
          <Animated.View
            style={[
              styles.iconContainer,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <Text style={styles.callIcon}>
              {call.callType === 'video' ? '📹' : '📞'}
            </Text>
          </Animated.View>

          {/* Caller Info */}
          <View style={styles.callerInfo}>
            {call.callerPhoto ? (
              <Image
                source={{ uri: call.callerPhoto }}
                style={styles.callerPhoto}
              />
            ) : (
              <View style={[styles.callerPhoto, styles.placeholderPhoto]}>
                <Text style={styles.placeholderText}>
                  {call.callerName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}

            <Text style={styles.callerName}>{call.callerName}</Text>
            <Text style={styles.callType}>
              Incoming {call.callType} call
            </Text>
            <Text style={styles.groupName}>{call.groupName}</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            {/* Reject Button */}
            <TouchableOpacity
              style={[styles.button, styles.rejectButton]}
              onPress={onReject}
              activeOpacity={0.8}
            >
              <View style={styles.buttonIcon}>
                <Text style={styles.buttonIconText}>✕</Text>
              </View>
              <Text style={styles.buttonText}>Decline</Text>
            </TouchableOpacity>

            {/* Accept Button */}
            <TouchableOpacity
              style={[styles.button, styles.acceptButton]}
              onPress={onAccept}
              activeOpacity={0.8}
            >
              <View style={styles.buttonIcon}>
                <Text style={styles.buttonIconText}>✓</Text>
              </View>
              <Text style={styles.buttonText}>Accept</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '85%',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  callIcon: {
    fontSize: 40,
  },
  callerInfo: {
    alignItems: 'center',
    marginBottom: 32,
  },
  callerPhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  placeholderPhoto: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  callerName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  callType: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  groupName: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    gap: 16,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  acceptButton: {
    backgroundColor: '#10B981',
  },
  buttonIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonIconText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default IncomingCallModal;
