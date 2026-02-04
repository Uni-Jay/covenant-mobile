import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import RtcEngine, { ChannelProfileType, IRtcEngine } from 'react-native-agora';
import { AGORA_CONFIG } from '../config/agora.config';
import { useAuth } from '../context/AuthContext';

type RouteParams = {
  AudioCall: {
    groupId: number;
    groupName: string;
  };
};

const AudioCallScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'AudioCall'>>();
  const { groupId, groupName } = route.params;
  const { user } = useAuth();
  
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [isJoined, setIsJoined] = useState(false);
  const [participantsCount, setParticipantsCount] = useState(1);
  const [networkQuality, setNetworkQuality] = useState<'excellent' | 'good' | 'poor' | 'bad' | 'unknown'>('unknown');
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  
  const agoraEngineRef = useRef<IRtcEngine | null>(null);

  useEffect(() => {
    setupAudioSDKEngine();
    
    // Start call timer
    const interval = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    // Audio pulse animation
    const pulse = Animated.loop(
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
    );
    pulse.start();

    return () => {
      clearInterval(interval);
      pulse.stop();
      leaveCall();
    };
  }, []);

  const setupAudioSDKEngine = async () => {
    try {
      if (!AGORA_CONFIG.appId) {
        console.error('Agora App ID not configured');
        Alert.alert('Setup Required', 'Please configure your Agora App ID in agora.config.ts');
        return;
      }

      const engine = RtcEngine();
      agoraEngineRef.current = engine;
      
      // Disable video for audio-only call
      await engine.disableVideo();
      await engine.enableAudio();
      await engine.setEnableSpeakerphone(true);

      engine.addListener('onUserJoined', (connection, uid: number) => {
        console.log('User joined audio call:', uid);
        setParticipantsCount(prev => prev + 1);
        setConnectionState('connected');
      });

      engine.addListener('onUserOffline', (connection, uid: number) => {
        console.log('User left audio call:', uid);
        setParticipantsCount(prev => Math.max(1, prev - 1));
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
      console.error('Agora audio setup error:', e);
      Alert.alert('Error', 'Failed to initialize audio call');
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
      Alert.alert('Error', 'Failed to join audio call');
    }
  };

  const leaveCall = async () => {
    try {
      if (agoraEngineRef.current) {
        await agoraEngineRef.current.leaveChannel();
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

  const toggleSpeaker = async () => {
    if (agoraEngineRef.current) {
      await agoraEngineRef.current.setEnableSpeakerphone(!isSpeaker);
    }
    setIsSpeaker(!isSpeaker);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <LinearGradient
      colors={['#1e40af', '#3b82f6', '#60a5fa']}
      style={styles.container}
    >
      <SafeAreaView style={styles.content} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.statusText}>Audio Call</Text>
        </View>

        {/* Audio Visualization */}
        <View style={styles.audioContainer}>
          <Animated.View 
            style={[
              styles.audioPulse,
              { transform: [{ scale: pulseAnim }] }
            ]}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
              style={styles.audioIconContainer}
            >
              <Text style={styles.audioIcon}>🎤</Text>
            </LinearGradient>
          </Animated.View>
          
          <Text style={styles.groupName}>{groupName}</Text>
          <Text style={styles.duration}>{formatDuration(callDuration)}</Text>
          
          {/* Status Indicators */}
          <View style={styles.statusRow}>
            <View style={[styles.networkBadge, styles[`network_${networkQuality}`]]}>
              <Text style={styles.networkIcon}>
                {networkQuality === 'excellent' ? '📶' : networkQuality === 'good' ? '📶' : networkQuality === 'poor' ? '📵' : '⚠️'}
              </Text>
              <Text style={styles.networkText}>{networkQuality}</Text>
            </View>
            
            <View style={styles.participantBadge}>
              <Text style={styles.participantIcon}>👥</Text>
              <Text style={styles.participantText}>{participantsCount}</Text>
            </View>
          </View>
          
          {connectionState !== 'connected' && (
            <View style={styles.connectionBanner}>
              <Text style={styles.connectionText}>
                {connectionState === 'connecting' ? '⏳ Connecting...' : '❌ Disconnected'}
              </Text>
            </View>
          )}
          
          <Text style={styles.callStatus}>
            {isMuted ? 'Microphone muted' : isJoined ? 'Call in progress' : 'Connecting...'}
          </Text>
        </View>

        {/* Controls */}
        <View style={styles.controlsContainer}>
          <View style={styles.controls}>
            <TouchableOpacity
              style={[styles.controlButton, isMuted && styles.controlButtonActive]}
              onPress={toggleMute}
            >
              <Text style={styles.controlIcon}>{isMuted ? '🔇' : '🎤'}</Text>
              <Text style={styles.controlLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, isSpeaker && styles.controlButtonActive]}
              onPress={toggleSpeaker}
            >
              <Text style={styles.controlIcon}>{isSpeaker ? '🔊' : '🔈'}</Text>
              <Text style={styles.controlLabel}>{isSpeaker ? 'Speaker' : 'Earpiece'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.endCallButton}
            onPress={handleEndCall}
          >
            <LinearGradient
              colors={['#dc2626', '#991b1b']}
              style={styles.endCallGradient}
            >
              <Text style={styles.endCallIcon}>📞</Text>
              <Text style={styles.endCallText}>End Call</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.noticeText}>
            💡 Audio calls require Expo Development Build{'\n'}
            This is a UI preview. See AGORA_SETUP.md for setup.
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  statusText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: '600',
  },
  audioContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  wave: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#fff',
  },
  wave1: {
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  wave2: {
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  wave3: {
    width: 240,
    height: 240,
    borderRadius: 120,
  },
  audioPulse: {
    marginBottom: 30,
    zIndex: 10,
  },
  audioIconContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  audioIcon: {
    fontSize: 64,
  },
  groupName: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  duration: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 24,
    marginBottom: 16,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
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
    fontSize: 16,
  },
  networkText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  participantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(99, 102, 241, 0.9)',
    gap: 6,
  },
  participantIcon: {
    fontSize: 16,
  },
  participantText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  connectionBanner: {
    marginTop: 12,
    marginBottom: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
  },
  connectionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  connectingText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
  },
  mutedText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 8,
  },
  controlsContainer: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 40,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  controlButton: {
    alignItems: 'center',
  },
  controlButtonActive: {
    opacity: 0.8,
  },
  controlGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  controlIcon: {
    fontSize: 32,
  },
  controlLabel: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  noticeText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 40,
  },
  callStatus: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    marginTop: 8,
  },
  endCallButton: {
    overflow: 'hidden',
    borderRadius: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  endCallGradient: {
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 60,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  endCallIcon: {
    fontSize: 24,
  },
  endCallText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AudioCallScreen;
