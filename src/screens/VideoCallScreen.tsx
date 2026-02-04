import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { colors } from '../theme/colors';
import RtcEngine, { RtcSurfaceView, ChannelProfileType, IRtcEngine } from 'react-native-agora';
import { AGORA_CONFIG } from '../config/agora.config';
import { useAuth } from '../context/AuthContext';

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
  const { user } = useAuth();
  
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [isJoined, setIsJoined] = useState(false);
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  const [networkQuality, setNetworkQuality] = useState<'excellent' | 'good' | 'poor' | 'bad' | 'unknown'>('unknown');
  const [participants, setParticipants] = useState<number[]>([]);
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  
  const agoraEngineRef = useRef<IRtcEngine | null>(null);

  useEffect(() => {
    setupVideoSDKEngine();
    
    // Call timer
    const interval = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(interval);
      leaveCall();
    };
  }, []);



  const setupVideoSDKEngine = async () => {
    try {
      if (!AGORA_CONFIG.appId) {
        console.error('Agora App ID not configured');
        Alert.alert('Setup Required', 'Please configure your Agora App ID in agora.config.ts');
        return;
      }

      const engine = RtcEngine();
      agoraEngineRef.current = engine;
      
      await engine.enableVideo();
      await engine.startPreview();

      engine.addListener('onUserJoined', (connection, uid: number) => {
        console.log('UserJoined', uid);
        setRemoteUid(uid);
        setParticipants(prev => [...prev, uid]);
        setConnectionState('connected');
      });

      engine.addListener('onUserOffline', (connection, uid: number) => {
        console.log('UserOffline', uid);
        setRemoteUid(null);
        setParticipants(prev => prev.filter(id => id !== uid));
      });

      engine.addListener('onNetworkQuality', (connection, uid, txQuality, rxQuality) => {
        const quality = Math.max(txQuality, rxQuality);
        if (quality <= 2) setNetworkQuality('excellent');
        else if (quality <= 3) setNetworkQuality('good');
        else if (quality <= 4) setNetworkQuality('poor');
        else setNetworkQuality('bad');
      });

      engine.addListener('onConnectionStateChanged', (connection, state, reason) => {
        if (state === 3) setConnectionState('connected');
        else if (state === 1) setConnectionState('connecting');
        else setConnectionState('disconnected');
      });

      await joinChannel();
    } catch (e) {
      console.error('Agora setup error:', e);
      Alert.alert('Error', 'Failed to initialize video call');
    }
  };

  const joinChannel = async () => {
    if (!agoraEngineRef.current || !user) return;

    try {
      const channelName = `group_${groupId}`;
      await agoraEngineRef.current.setChannelProfile(ChannelProfileType.ChannelProfileCommunication);
      await agoraEngineRef.current.joinChannel(
        AGORA_CONFIG.token || '',
        channelName,
        0,
        {}
      );
      setIsJoined(true);
    } catch (e) {
      console.error('Join channel error:', e);
      Alert.alert('Error', 'Failed to join video call');
    }
  };

  const leaveCall = async () => {
    try {
      if (agoraEngineRef.current) {
        await agoraEngineRef.current.leaveChannel();
        await agoraEngineRef.current.stopPreview();
        await agoraEngineRef.current.release();
        agoraEngineRef.current = null;
      }
    } catch (e) {
      console.error('Leave channel error:', e);
    }
  };

  const handleEndCall = () => {
    Alert.alert(
      'End Call',
      'Are you sure you want to end this call?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Call',
          style: 'destructive',
          onPress: async () => {
            await leaveCall();
            navigation.goBack();
          },
        },
      ]
    );
  };

  const toggleMute = async () => {
    if (agoraEngineRef.current) {
      await agoraEngineRef.current.muteLocalAudioStream(!isMuted);
    }
    setIsMuted(!isMuted);
  };

  const toggleVideo = async () => {
    if (agoraEngineRef.current) {
      await agoraEngineRef.current.muteLocalVideoStream(isVideoOn);
    }
    setIsVideoOn(!isVideoOn);
  };

  const switchCamera = async () => {
    if (agoraEngineRef.current) {
      await agoraEngineRef.current.switchCamera();
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        {/* Remote Video */}
        <View style={styles.remoteVideoContainer}>
          {isJoined && remoteUid ? (
            <RtcSurfaceView
              canvas={{ uid: remoteUid }}
              style={styles.remoteVideo}
            />
          ) : (
            <LinearGradient
              colors={['#1e3a8a', '#3b82f6', '#60a5fa']}
              style={styles.placeholderGradient}
            >
              <Text style={styles.placeholderIcon}>📹</Text>
              <Text style={styles.placeholderText}>{groupName}</Text>
              <Text style={styles.statusText}>
                {isJoined ? 'Waiting for others to join...' : 'Connecting...'}
              </Text>
            </LinearGradient>
          )}
        </View>

        {/* Local Video Preview */}
        <View style={styles.localVideoContainer}>
          {isJoined && isVideoOn ? (
            <RtcSurfaceView
              canvas={{ uid: 0 }}
              style={styles.localVideo}
            />
          ) : (
            <LinearGradient
              colors={['rgba(30,58,138,0.9)', 'rgba(59,130,246,0.9)']}
              style={styles.localVideo}
            >
              <Text style={styles.videoOffIcon}>📷</Text>
            </LinearGradient>
          )}
        </View>

        {/* Call Info Overlay */}
        <LinearGradient
          colors={['rgba(0,0,0,0.7)', 'transparent']}
          style={styles.topOverlay}
        >
          <View style={styles.callInfo}>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.groupName}>{groupName}</Text>
                <Text style={styles.duration}>{formatDuration(callDuration)}</Text>
              </View>
              <View style={styles.statusIndicators}>
                <View style={[styles.networkBadge, styles[`network_${networkQuality}`]]}>
                  <Text style={styles.networkIcon}>
                    {networkQuality === 'excellent' ? '📶' : networkQuality === 'good' ? '📶' : networkQuality === 'poor' ? '📵' : '⚠️'}
                  </Text>
                  <Text style={styles.networkText}>{networkQuality}</Text>
                </View>
                {participants.length > 0 && (
                  <View style={styles.participantBadge}>
                    <Text style={styles.participantIcon}>👥</Text>
                    <Text style={styles.participantText}>{participants.length + 1}</Text>
                  </View>
                )}
              </View>
            </View>
            {connectionState !== 'connected' && (
              <View style={styles.connectionBanner}>
                <Text style={styles.connectionText}>
                  {connectionState === 'connecting' ? '⏳ Connecting...' : '❌ Disconnected'}
                </Text>
              </View>
            )}
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

          {!AGORA_CONFIG.appId && (
            <Text style={styles.noticeText}>
              ⚠️ Agora App ID not configured{' \n'}
              Please add your App ID in src/config/agora.config.ts
            </Text>
          )}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statusIndicators: {
    gap: 8,
  },
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  network_excellent: {
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
  },
  network_good: {
    backgroundColor: 'rgba(59, 130, 246, 0.9)',
  },
  network_poor: {
    backgroundColor: 'rgba(245, 158, 11, 0.9)',
  },
  network_bad: {
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
  },
  network_unknown: {
    backgroundColor: 'rgba(107, 114, 128, 0.9)',
  },
  networkIcon: {
    fontSize: 14,
  },
  networkText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  participantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(99, 102, 241, 0.9)',
    gap: 6,
  },
  participantIcon: {
    fontSize: 14,
  },
  participantText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  connectionBanner: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
  },
  connectionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
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
