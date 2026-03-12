import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  Share,
  Linking,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus, Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { sermonsService } from '../services';
import { Sermon } from '../types';
import { getServerUrl } from '../config/network.config';

const { width, height } = Dimensions.get('window');

export default function SermonDetailScreen({ route, navigation }: any) {
  const { sermonId } = route.params;
  const { colors } = useTheme();
  const styles = createStyles(colors);
  
  const [sermon, setSermon] = useState<Sermon | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [mediaType, setMediaType] = useState<'video' | 'audio' | null>(null);
  
  const videoRef = useRef<Video>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const controlsTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadSermon();
    
    return () => {
      // Cleanup
      if (sound) {
        sound.unloadAsync();
      }
      if (controlsTimer.current) {
        clearTimeout(controlsTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    // Auto-hide controls after 3 seconds if playing
    if (showControls && isPlaying) {
      if (controlsTimer.current) {
        clearTimeout(controlsTimer.current);
      }
      controlsTimer.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
    
    return () => {
      if (controlsTimer.current) {
        clearTimeout(controlsTimer.current);
      }
    };
  }, [showControls, isPlaying]);

  const loadSermon = async () => {
    try {
      const data = await sermonsService.getById(sermonId);
      setSermon(data);
      
      // Determine media type
      if (data.videoUrl) {
        setMediaType('video');
      } else if (data.audioUrl) {
        setMediaType('audio');
        await loadAudio(data.audioUrl);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load sermon');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const loadAudio = async (audioUrl: string) => {
    try {
      const { sound: audioSound } = await Audio.Sound.createAsync(
        { uri: `${getServerUrl()}${audioUrl}` },
        { shouldPlay: false },
        onAudioPlaybackStatusUpdate
      );
      setSound(audioSound);
    } catch (error) {
      console.error('Failed to load audio:', error);
    }
  };

  const onAudioPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setCurrentTime(status.positionMillis / 1000);
      if (status.durationMillis) {
        setDuration(status.durationMillis / 1000);
      }
      setIsPlaying(status.isPlaying);
    }
  };

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setCurrentTime(status.positionMillis / 1000);
      if (status.durationMillis) {
        setDuration(status.durationMillis / 1000);
      }
      setIsPlaying(status.isPlaying);
    }
  };

  const togglePlayPause = async () => {
    if (mediaType === 'video' && videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
    } else if (mediaType === 'audio' && sound) {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    }
  };

  const seekTo = async (seconds: number) => {
    if (mediaType === 'video' && videoRef.current) {
      await videoRef.current.setPositionAsync(seconds * 1000);
    } else if (mediaType === 'audio' && sound) {
      await sound.setPositionAsync(seconds * 1000);
    }
  };

  const skip = async (seconds: number) => {
    const newTime = Math.max(0, Math.min(currentTime + seconds, duration));
    await seekTo(newTime);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this sermon: ${sermon?.title} by ${sermon?.preacher}`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleDownloadPDF = () => {
    if (sermon?.pdfUrl) {
      const pdfUrl = `${getServerUrl()}${sermon.pdfUrl}`;
      Linking.openURL(pdfUrl);
    }
  };

  const toggleControls = () => {
    setShowControls(!showControls);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
      </View>
    );
  }

  if (!sermon) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[colors.primary[700], colors.primary[900]]}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerCategory}>{sermon.category}</Text>
          <Text style={styles.headerDate}>
            {new Date(sermon.date).toLocaleDateString('en-US', { 
              month: 'long', 
              day: 'numeric', 
              year: 'numeric' 
            })}
          </Text>
        </View>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Ionicons name="share-social" size={24} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Video/Audio Player */}
        {mediaType === 'video' && sermon.videoUrl && (
          <TouchableOpacity 
            activeOpacity={1} 
            onPress={toggleControls}
            style={styles.videoContainer}
          >
            <Video
              ref={videoRef}
              source={{ uri: `${getServerUrl()}${sermon.videoUrl}` }}
              style={styles.video}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay={false}
              onPlaybackStatusUpdate={onPlaybackStatusUpdate}
              useNativeControls={false}
            />
            
            {/* Custom Video Controls */}
            {showControls && (
              <View style={styles.controlsOverlay}>
                <LinearGradient
                  colors={['rgba(0,0,0,0.7)', 'transparent', 'rgba(0,0,0,0.7)']}
                  style={styles.controlsGradient}
                >
                  {/* Center Play/Pause */}
                  <View style={styles.centerControls}>
                    <TouchableOpacity onPress={() => skip(-10)}>
                      <Ionicons name="play-back" size={40} color="#fff" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.playPauseButton}
                      onPress={togglePlayPause}
                    >
                      <Ionicons 
                        name={isPlaying ? 'pause' : 'play'} 
                        size={50} 
                        color="#fff" 
                      />
                    </TouchableOpacity>
                    
                    <TouchableOpacity onPress={() => skip(10)}>
                      <Ionicons name="play-forward" size={40} color="#fff" />
                    </TouchableOpacity>
                  </View>

                  {/* Bottom Controls */}
                  <View style={styles.bottomControls}>
                    <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                    <View style={styles.progressBarContainer}>
                      <View 
                        style={[
                          styles.progressBar, 
                          { width: `${(currentTime / duration) * 100}%` }
                        ]} 
                      />
                    </View>
                    <Text style={styles.timeText}>{formatTime(duration)}</Text>
                  </View>
                </LinearGradient>
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* Audio Player */}
        {mediaType === 'audio' && sermon.audioUrl && (
          <View style={styles.audioPlayerContainer}>
            <LinearGradient
              colors={[colors.primary[600], colors.primary[800]]}
              style={styles.audioPlayer}
            >
              <MaterialCommunityIcons name="waveform" size={60} color="#fff" />
              
              <View style={styles.audioControls}>
                <TouchableOpacity onPress={() => skip(-10)}>
                  <Ionicons name="play-back" size={32} color="#fff" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.audioPlayButton}
                  onPress={togglePlayPause}
                >
                  <Ionicons 
                    name={isPlaying ? 'pause' : 'play'} 
                    size={40} 
                    color="#fff" 
                  />
                </TouchableOpacity>
                
                <TouchableOpacity onPress={() => skip(10)}>
                  <Ionicons name="play-forward" size={32} color="#fff" />
                </TouchableOpacity>
              </View>

              <View style={styles.audioProgress}>
                <Text style={styles.audioTime}>{formatTime(currentTime)}</Text>
                <View style={styles.audioProgressBar}>
                  <View 
                    style={[
                      styles.audioProgressFill, 
                      { width: `${(currentTime / duration) * 100}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.audioTime}>{formatTime(duration)}</Text>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* No Media Available */}
        {!mediaType && (
          <View style={styles.noMediaContainer}>
            <MaterialCommunityIcons name="video-off" size={64} color={colors.gray[400]} />
            <Text style={styles.noMediaText}>No video or audio available</Text>
          </View>
        )}

        {/* Sermon Info */}
        <View style={styles.sermonInfo}>
          <Text style={styles.sermonTitle}>{sermon.title}</Text>
          
          <View style={styles.preacherCard}>
            <View style={styles.preacherAvatar}>
              <Ionicons name="person" size={24} color={colors.primary[600]} />
            </View>
            <View>
              <Text style={styles.preacherLabel}>Preacher</Text>
              <Text style={styles.preacherName}>{sermon.preacher}</Text>
            </View>
          </View>

          <Text style={styles.descriptionTitle}>About this sermon</Text>
          <Text style={styles.description}>{sermon.description}</Text>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {sermon.pdfUrl && (
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleDownloadPDF}
              >
                <LinearGradient
                  colors={[colors.secondary[600], colors.secondary[700]]}
                  style={styles.actionButtonGradient}
                >
                  <Ionicons name="document-text" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Download PDF</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleShare}
            >
              <LinearGradient
                colors={[colors.primary[600], colors.primary[700]]}
                style={styles.actionButtonGradient}
              >
                <Ionicons name="share-social" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Share</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  headerCategory: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  headerDate: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  videoContainer: {
    width: '100%',
    height: width * 9/16, // 16:9 aspect ratio
    backgroundColor: '#000',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  controlsGradient: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
  },
  centerControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
    flex: 1,
  },
  playPauseButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  progressBarContainer: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  audioPlayerContainer: {
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  audioPlayer: {
    padding: 30,
    alignItems: 'center',
  },
  audioControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 30,
    marginTop: 20,
  },
  audioPlayButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioProgress: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
  },
  audioTime: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  audioProgressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
  },
  audioProgressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  noMediaContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
  },
  noMediaText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.gray[500],
  },
  sermonInfo: {
    padding: 20,
  },
  sermonTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
    lineHeight: 32,
  },
  preacherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  preacherAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  preacherLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  preacherName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary[700],
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
