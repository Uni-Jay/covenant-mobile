
import { useTheme } from '../context/ThemeContext';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { colors } from '../theme/colors';

const getMobileApi = () => ({
  get: async (endpoint: string) => {
    try {
      const response = await fetch(`https://api.hocfam.org${endpoint}`);
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }
});

const YOUTUBE_CHANNEL = 'https://www.youtube.com/channel/UC4NQoNY0b7CcLAogvSZo2Lg';
const YOUTUBE_CHANNEL_ID = 'UC4NQoNY0b7CcLAogvSZo2Lg';

const { width } = Dimensions.get('window');
const YOUTUBE_EMBED_HEIGHT = (width / 16) * 9; // 16:9 aspect ratio

export default function LiveStreamScreen() {
  const { colors: themeColors } = useTheme();
  const styles = createStyles(themeColors);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [serviceTimes, setServiceTimes] = useState<any[]>([]);
  const [pastSermons, setPastSermons] = useState<any[]>([]);

  useEffect(() => {
    fetchLiveStreamData();
    checkLiveStatus();
    const interval = setInterval(checkLiveStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchLiveStreamData = async () => {
    try {
      const api = getMobileApi();
      const response = await api.get('/api/livestream');
      
      setServiceTimes(response.data?.serviceTimes || getDefaultServiceTimes());
      setPastSermons(response.data?.previousServices || []);
    } catch (error) {
      console.error('Error fetching live stream data:', error);
      setServiceTimes(getDefaultServiceTimes());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultServiceTimes = () => [
    { title: 'Sunday Service', time: '9:00 AM - 11:00 AM', day: 'Sunday' },
    { title: 'Prayer Hour', time: '6:00 PM - 7:00 PM', day: 'Tuesday' },
    { title: 'Bible Study', time: '6:00 PM - 7:00 PM', day: 'Thursday' }
  ];

  const checkLiveStatus = () => {
    try {
      const now = new Date();
      const day = now.toLocaleDateString('en-US', { weekday: 'long' });
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const currentTime = `${hours}:${minutes}`;
      
      const isWithinServiceTime = serviceTimes.some((service: any) => {
        if (service.day === day) {
          const [startStr, endStr] = service.time.split(' - ');
          const start = convertTo24Hour(startStr);
          const end = convertTo24Hour(endStr);
          return currentTime >= start && currentTime <= end;
        }
        return false;
      });
      
      setIsLive(isWithinServiceTime);
    } catch (error) {
      console.error('Error checking live status:', error);
    }
  };

  const convertTo24Hour = (timeStr: string) => {
    const [time, period] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Live Stream</Text>
        <Text style={styles.headerSubtitle}>
          Join us for worship and the Word
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.primary[600]} />
          <Text style={styles.loadingText}>Loading stream...</Text>
        </View>
      ) : (
        <>
          {/* Live Indicator */}
          {isLive && (
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>🔴 LIVE NOW</Text>
            </View>
          )}

          {/* YouTube Player */}
          <View style={styles.playerContainer}>
            {isLive ? (
              <TouchableOpacity 
                style={styles.livePlayerButton}
                onPress={() => Linking.openURL(`https://www.youtube.com/live/${YOUTUBE_CHANNEL_ID}`)}
              >
                <Text style={styles.playIcon}>▶️</Text>
                <Text style={styles.playButtonText}>Tap to Watch Live Stream</Text>
                <Text style={styles.playButtonSubtext}>Opens on YouTube</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.offlinePlayer}>
                <Text style={styles.offlineIcon}>📺</Text>
                <Text style={styles.offlineTitle}>Stream Offline</Text>
                <Text style={styles.offlineText}>We're not currently streaming</Text>
                <TouchableOpacity 
                  style={styles.youtubeButton} 
                  onPress={() => Linking.openURL(YOUTUBE_CHANNEL)}
                >
                  <Text style={styles.youtubeButtonText}>Visit YouTube Channel</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Service Schedule */}
          <View style={styles.scheduleCard}>
            <Text style={styles.scheduleTitle}>Service Schedule</Text>
            {serviceTimes.map((service: any, index: number) => (
              <View key={index} style={styles.scheduleItem}>
                <View style={styles.scheduleDay}>
                  <Text style={styles.dayText}>{service.day.slice(0, 3).toUpperCase()}</Text>
                </View>
                <View style={styles.scheduleInfo}>
                  <Text style={styles.serviceName}>{service.title}</Text>
                  <Text style={styles.serviceTime}>{service.time}</Text>
                </View>
                <TouchableOpacity style={styles.remindButton}>
                  <Text style={styles.remindText}>🔔</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Past Sermons */}
          {pastSermons.length > 0 && (
            <View style={styles.pastStreams}>
              <Text style={styles.pastTitle}>Sermon Archive</Text>
              {pastSermons.map((sermon: any) => (
                <TouchableOpacity
                  key={sermon.id}
                  style={styles.pastItem}
                  onPress={() => Linking.openURL(sermon.youtubeUrl || YOUTUBE_CHANNEL)}
                >
                  <View style={styles.pastThumbnail}>
                    <Text style={styles.playIcon}>▶️</Text>
                  </View>
                  <View style={styles.pastInfo}>
                    <Text style={styles.pastName}>{sermon.title}</Text>
                    <Text style={styles.pastDate}>
                      {sermon.speaker && `${sermon.speaker} • `}
                      {new Date(sermon.date).toLocaleDateString()}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* YouTube Subscribe Section */}
          <View style={styles.youtubeSection}>
            <Text style={styles.youtubeIcon}>📺</Text>
            <Text style={styles.youtubeTitle}>Never Miss a Service</Text>
            <Text style={styles.youtubeSubtitle}>
              Subscribe to our YouTube channel to get notified when we go live
            </Text>
            <TouchableOpacity 
              style={styles.youtubeButton} 
              onPress={() => Linking.openURL(YOUTUBE_CHANNEL)}
            >
              <Text style={styles.youtubeButtonText}>Subscribe on YouTube</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary[800],
    padding: 24,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#D4AF37',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 300,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.gray[600],
  },
  playerContainer: {
    backgroundColor: colors.black || '#000',
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  livePlayerButton: {
    height: YOUTUBE_EMBED_HEIGHT,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  playIcon: {
    fontSize: 72,
    marginBottom: 16,
  },
  playButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 8,
  },
  playButtonSubtext: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.8,
  },
  offlinePlayer: {
    height: YOUTUBE_EMBED_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray[800],
  },
  offlineIcon: {
    fontSize: 64,
    marginBottom: 12,
  },
  offlineTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 8,
  },
  offlineText: {
    fontSize: 16,
    color: colors.gray[400],
    marginBottom: 16,
  },
  statusCard: {
    backgroundColor: colors.white,
    margin: 16,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error || '#DC2626',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.white,
    marginRight: 8,
    opacity: 0.8,
  },
  liveText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  statusTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 8,
  },
  statusDescription: {
    fontSize: 16,
    color: colors.gray[600],
    textAlign: 'center',
    marginBottom: 16,
  },
  joinButton: {
    backgroundColor: colors.secondary?.[600] ?? '#DB2777',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 3,
    shadowColor: colors.secondary?.[900] ?? '#831843',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  joinButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  scheduleCard: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  scheduleTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 16,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  scheduleDay: {
    width: 60,
    alignItems: 'center',
    backgroundColor: colors.primary[600],
    borderRadius: 8,
    padding: 8,
  },
  dayText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 24,
    color: colors.white,
    fontWeight: 'bold',
  },
  scheduleInfo: {
    flex: 1,
    marginLeft: 12,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 4,
  },
  serviceTime: {
    fontSize: 14,
    color: colors.gray[600],
  },
  remindButton: {
    padding: 8,
  },
  remindText: {
    fontSize: 24,
  },
  pastStreams: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  pastTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 16,
  },
  pastItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  pastThumbnail: {
    width: 80,
    height: 60,
    backgroundColor: colors.gray[300],
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pastInfo: {
    marginLeft: 12,
    justifyContent: 'center',
  },
  pastName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 4,
  },
  pastDate: {
    fontSize: 14,
    color: colors.gray[600],
  },
  info: {
    backgroundColor: colors.white,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#B8960C',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.gray[600],
    lineHeight: 20,
  },
  youtubeSection: {
    backgroundColor: '#DC2626',
    margin: 16,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  youtubeIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  youtubeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  youtubeSubtitle: {
    fontSize: 14,
    color: colors.white,
    textAlign: 'center',
    marginBottom: 16,
    opacity: 0.9,
  },
  youtubeButton: {
    backgroundColor: colors.white,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  youtubeButtonText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
