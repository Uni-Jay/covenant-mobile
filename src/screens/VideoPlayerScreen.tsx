import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');

export default function VideoPlayerScreen({ route, navigation }: any) {
  const { videoUrl } = route.params;
  const { colors } = useTheme();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isBuffering, setIsBuffering] = useState(true);
  
  const videoRef = useRef<Video>(null);
  const controlsTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (controlsTimer.current) {
        clearTimeout(controlsTimer.current);
      }
    };
  }, []);

  useEffect(() => {
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

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setCurrentTime(status.positionMillis / 1000);
      if (status.durationMillis) {
        setDuration(status.durationMillis / 1000);
      }
      setIsPlaying(status.isPlaying);
      setIsBuffering(status.isBuffering);
    }
  };

  const togglePlayPause = async () => {
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
    }
  };

  const handleVideoPress = () => {
    setShowControls(!showControls);
  };

  const seekTo = async (seconds: number) => {
    if (videoRef.current) {
      await videoRef.current.setPositionAsync(seconds * 1000);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Back button */}
        <TouchableOpacity
          style={[styles.backButton, !showControls && styles.hidden]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        
        {/* Video */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleVideoPress}
          style={styles.videoContainer}
        >
          <Video
            ref={videoRef}
            source={{ uri: videoUrl }}
            style={styles.video}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={false}
            isLooping={false}
            onPlaybackStatusUpdate={onPlaybackStatusUpdate}
            useNativeControls={false}
          />
          
          {/* Loading indicator */}
          {isBuffering && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          )}
          
          {/* Play/Pause button */}
          {showControls && !isBuffering && (
            <TouchableOpacity
              style={styles.playPauseButton}
              onPress={togglePlayPause}
            >
              <Text style={styles.playPauseIcon}>
                {isPlaying ? '⏸' : '▶'}
              </Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
        
        {/* Controls */}
        {showControls && (
          <View style={styles.controls}>
            <View style={styles.progressContainer}>
              <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%',
                      backgroundColor: colors.primary[500],
                    },
                  ]}
                />
              </View>
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>
            
            <View style={styles.controlButtons}>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => seekTo(Math.max(0, currentTime - 10))}
              >
                <Text style={styles.controlButtonText}>⏪ 10s</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.controlButton}
                onPress={togglePlayPause}
              >
                <Text style={styles.controlButtonText}>
                  {isPlaying ? 'Pause' : 'Play'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => seekTo(Math.min(duration, currentTime + 10))}
              >
                <Text style={styles.controlButtonText}>10s ⏩</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  safeArea: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hidden: {
    opacity: 0,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: width,
    height: height,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  playPauseButton: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playPauseIcon: {
    color: '#fff',
    fontSize: 32,
  },
  controls: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginHorizontal: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  controlButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  controlButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
