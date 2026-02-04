import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { colors } from '../theme/colors';

const { width, height } = Dimensions.get('window');

type RouteParams = {
  VideoCall: {
    groupId: number;
    groupName: string;
  };
};

const VideoCallScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'VideoCall'>>();
  const { groupId, groupName } = route.params;
  
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    // Call timer
    const interval = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);



  const handleEndCall = () => {
    Alert.alert(
      'End Call',
      'Are you sure you want to end this call?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Call',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    setIsVideoOn(!isVideoOn);
  };

  const switchCamera = () => {
    Alert.alert('Camera', 'Camera switching will be available with native build');
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        {/* Remote Video Placeholder */}
        <View style={styles.remoteVideoContainer}>
          <LinearGradient
            colors={['#1e3a8a', '#3b82f6', '#60a5fa']}
            style={styles.placeholderGradient}
          >
            <Text style={styles.placeholderIcon}>📹</Text>
            <Text style={styles.placeholderText}>{groupName}</Text>
            <Text style={styles.statusText}>Video call UI preview</Text>
          </LinearGradient>
        </View>

        {/* Local Video Preview */}
        <View style={styles.localVideoContainer}>
          <LinearGradient
            colors={['rgba(30,58,138,0.9)', 'rgba(59,130,246,0.9)']}
            style={styles.localVideo}
          >
            {isVideoOn ? (
              <Text style={styles.localVideoText}>You</Text>
            ) : (
              <Text style={styles.videoOffIcon}>📷</Text>
            )}
          </LinearGradient>
        </View>

        {/* Call Info Overlay */}
        <LinearGradient
          colors={['rgba(0,0,0,0.7)', 'transparent']}
          style={styles.topOverlay}
        >
          <View style={styles.callInfo}>
            <Text style={styles.groupName}>{groupName}</Text>
            <Text style={styles.duration}>{formatDuration(callDuration)}</Text>
          </View>
        </LinearGradient>

        {/* Controls Overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.bottomOverlay}
        >
          <View style={styles.controls}>
            <TouchableOpacity
              style={[styles.controlButton, isMuted && styles.controlButtonActive]}
              onPress={toggleMute}
            >
              <LinearGradient
                colors={isMuted ? ['#dc2626', '#b91c1c'] : ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                style={styles.controlGradient}
              >
                <Text style={styles.controlIcon}>{isMuted ? '🔇' : '🎤'}</Text>
              </LinearGradient>
              <Text style={styles.controlLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, !isVideoOn && styles.controlButtonActive]}
              onPress={toggleVideo}
            >
              <LinearGradient
                colors={!isVideoOn ? ['#dc2626', '#b91c1c'] : ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                style={styles.controlGradient}
              >
                <Text style={styles.controlIcon}>{isVideoOn ? '📹' : '📷'}</Text>
              </LinearGradient>
              <Text style={styles.controlLabel}>{isVideoOn ? 'Stop Video' : 'Start Video'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={switchCamera}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                style={styles.controlGradient}
              >
                <Text style={styles.controlIcon}>🔄</Text>
              </LinearGradient>
              <Text style={styles.controlLabel}>Flip</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.endCallButton}
              onPress={handleEndCall}
            >
              <LinearGradient
                colors={['#dc2626', '#991b1b']}
                style={styles.endCallGradient}
              >
                <Text style={styles.endCallIcon}>📞</Text>
              </LinearGradient>
              <Text style={styles.controlLabel}>End Call</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.noticeText}>
            💡 Video calls require Expo Development Build{' \n'}
            This is a UI preview. See AGORA_SETUP.md for setup.
          </Text>
        </LinearGradient>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
  },
  remoteVideoContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  remoteVideo: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  placeholderGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  placeholderText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statusText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
  },
  localVideoContainer: {
    position: 'absolute',
    top: 80,
    right: 20,
    width: 120,
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  localVideo: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  localVideoText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  videoOffOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoOffIcon: {
    fontSize: 40,
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 60,
    paddingBottom: 40,
  },
  callInfo: {
    paddingHorizontal: 20,
  },
  groupName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  duration: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 60,
    paddingBottom: 40,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  controlButton: {
    alignItems: 'center',
  },
  controlButtonActive: {},
  controlGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  controlIcon: {
    fontSize: 28,
  },
  controlLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  noticeText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 40,
  },
  endCallButton: {
    alignItems: 'center',
  },
  endCallGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  endCallIcon: {
    fontSize: 28,
  },
});

export default VideoCallScreen;
