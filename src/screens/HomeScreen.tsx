import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Image,
  Dimensions,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { eventsService, sermonsService } from '../services';
import { Event, Sermon } from '../types';
import { getServerUrl } from '../config/network.config';
import appConfig from '../../app.json';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { colors: colors } = useTheme();
  const styles = createStyles(colors);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [recentSermons, setRecentSermons] = useState<Sermon[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    checkForUpdates();
  }, []);

  const checkForUpdates = async () => {
    try {
      const response = await fetch('https://api.github.com/repos/Uni-Jay/covenant-mobile/releases/latest');
      const latestRelease = await response.json();
      
      if (latestRelease.tag_name) {
        const latestVersion = latestRelease.tag_name.replace('v', '');
        const currentVersion = appConfig.expo.version;
        
        if (compareVersions(latestVersion, currentVersion) > 0) {
          Alert.alert(
            '📱 Update Available',
            `A new version (${latestVersion}) is available. Download the latest version from our website!`,
            [
              { 
                text: 'Download Now', 
                onPress: () => Linking.openURL('https://github.com/Uni-Jay/covenant-mobile/releases/latest'),
                style: 'default'
              },
              { text: 'Later', style: 'cancel' }
            ]
          );
        }
      }
    } catch (error) {
      console.log('Update check failed:', error);
    }
  };

  const compareVersions = (version1: string, version2: string): number => {
    const v1parts = version1.split('.').map(Number);
    const v2parts = version2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
      const part1 = v1parts[i] || 0;
      const part2 = v2parts[i] || 0;
      
      if (part1 > part2) return 1;
      if (part1 < part2) return -1;
    }
    return 0;
  };

  const loadDashboardData = async () => {
    try {
      const [eventsData, sermonsData] = await Promise.all([
        eventsService.getAll(),
        sermonsService.getAll(),
      ]);
      
      setUpcomingEvents(eventsData.slice(0, 3));
      setRecentSermons(sermonsData.slice(0, 3));
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[colors.primary[600]]} />
      }
    >
      {/* Welcome Header with Gradient */}
      <LinearGradient
        colors={[colors.primary[600], colors.primary[800]]}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>{user?.fullName || 'Brother/Sister'}</Text>
          </View>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => navigation.navigate('NotificationInbox')}
          >
            <Ionicons name="notifications-outline" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.verseCard}>
          <Text style={styles.verse}>"Household of the living God" - 1 Timothy 3:15</Text>
        </View>
      </LinearGradient>

      {/* Service Times Card */}
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <LinearGradient
          colors={['rgba(37, 99, 235, 0.05)', 'rgba(37, 99, 235, 0.02)']}
          style={styles.cardGradient}
        >
          <View style={styles.cardHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="time-outline" size={20} color={colors.primary[600]} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Service Times</Text>
            </View>
          </View>
          <View style={[styles.serviceItem, { borderBottomColor: colors.border }]}>
            <View style={styles.serviceDayContainer}>
              <Text style={[styles.serviceDay, { color: colors.primary[700] }]}>Sunday</Text>
            </View>
            <Text style={[styles.serviceTime, { color: colors.textSecondary }]}>School: 8am-9am | Service: 9am-11am</Text>
          </View>
          <View style={[styles.serviceItem, { borderBottomColor: colors.border }]}>
            <View style={styles.serviceDayContainer}>
              <Text style={[styles.serviceDay, { color: colors.primary[700] }]}>Tuesday</Text>
            </View>
            <Text style={[styles.serviceTime, { color: colors.textSecondary }]}>Prayer Hour: 6pm-7pm</Text>
          </View>
          <View style={[styles.serviceItem, { borderBottomColor: colors.border }]}>
            <View style={styles.serviceDayContainer}>
              <Text style={[styles.serviceDay, { color: colors.primary[700] }]}>Thursday</Text>
            </View>
            <Text style={[styles.serviceTime, { color: colors.textSecondary }]}>Bible Study: 6pm-7pm</Text>
          </View>
          <View style={[styles.serviceItem, { borderBottomColor: colors.border }]}>
            <View style={styles.serviceDayContainer}>
              <Text style={[styles.serviceDay, { color: colors.primary[700] }]}>Last Friday</Text>
            </View>
            <Text style={[styles.serviceTime, { color: colors.textSecondary }]}>Monthly Vigil: 11pm-4am</Text>
          </View>
        </LinearGradient>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('LiveStream')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.primary[50], colors.primary[100]]}
            style={styles.actionGradient}
          >
            <Ionicons name="videocam" size={28} color={colors.primary[600]} />
            <Text style={styles.actionText}>Live Stream</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Attendance')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.secondary[50], colors.secondary[100]]}
            style={styles.actionGradient}
          >
            <Ionicons name="checkmark-done" size={28} color={colors.secondary[600]} />
            <Text style={styles.actionText}>Attendance</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Events')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.primary[50], colors.primary[100]]}
            style={styles.actionGradient}
          >
            <Ionicons name="calendar" size={28} color={colors.primary[600]} />
            <Text style={styles.actionText}>Events</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Give')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.secondary[50], colors.secondary[100]]}
            style={styles.actionGradient}
          >
            <Ionicons name="heart" size={28} color={colors.secondary[600]} />
            <Text style={styles.actionText}>Give</Text>
          </LinearGradient>
        </TouchableOpacity>

        {user?.role && ['admin', 'media', 'pastor', 'elder', 'secretary', 'media_head', 'department_head', 'finance', 'deacon'].includes(user.role) && (
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('ChurchDocuments')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[colors.primary[50], colors.primary[100]]}
              style={styles.actionGradient}
            >
              <Ionicons name="document-text" size={28} color={colors.primary[600]} />
              <Text style={styles.actionText}>Documents</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Prayer')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.primary[50], colors.primary[100]]}
            style={styles.actionGradient}
          >
            <MaterialCommunityIcons name="hands-pray" size={28} color={colors.primary[600]} />
            <Text style={styles.actionText}>Prayer</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Upcoming Events */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="calendar-outline" size={20} color={colors.primary[600]} />
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Events')}>
            <Text style={styles.seeAll}>See All →</Text>
          </TouchableOpacity>
        </View>
        {upcomingEvents.map((event) => (
          <TouchableOpacity
            key={event.id}
            style={styles.eventCard}
            onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
            activeOpacity={0.9}
          >
            <View style={styles.eventImageContainer}>
              <Image
                source={{ uri: `${getServerUrl()}${event.imageUrl}` }}
                style={styles.eventImage}
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.6)']}
                style={styles.eventOverlay}
              />
            </View>
            <View style={styles.eventInfo}>
              <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
              <View style={styles.eventMetaRow}>
                <View style={styles.eventMetaItem}>
                  <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                  <Text style={styles.eventDate}>
                    {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
                <View style={styles.eventMetaItem}>
                  <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                  <Text style={styles.eventTime}>{event.time}</Text>
                </View>
              </View>
              <View style={styles.eventMetaItem}>
                <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.eventLocation} numberOfLines={1}>{event.location}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent Sermons */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="book-outline" size={20} color={colors.primary[600]} />
            <Text style={styles.sectionTitle}>Recent Sermons</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Sermons')}>
            <Text style={styles.seeAll}>See All →</Text>
          </TouchableOpacity>
        </View>
        {recentSermons.map((sermon) => (
          <TouchableOpacity
            key={sermon.id}
            style={styles.sermonCard}
            onPress={() => navigation.navigate('Sermons')}
            activeOpacity={0.9}
          >
            {sermon.thumbnailUrl && (
              <View style={styles.sermonThumbnailContainer}>
                <Image
                  source={{ uri: `${getServerUrl()}${sermon.thumbnailUrl}` }}
                  style={styles.sermonThumbnail}
                />
              </View>
            )}
            <View style={styles.sermonInfo}>
              <Text style={styles.sermonTitle} numberOfLines={2}>{sermon.title}</Text>
              <View style={styles.sermonMeta}>
                <View style={styles.sermonMetaItem}>
                  <Ionicons name="person-outline" size={14} color={colors.textSecondary} />
                  <Text style={styles.sermonPreacher}>{sermon.preacher}</Text>
                </View>
                <View style={styles.sermonMetaItem}>
                  <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                  <Text style={styles.sermonDate}>
                    {new Date(sermon.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  notificationButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationIcon: {
    fontSize: 22,
  },
  greeting: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    marginTop: 4,
  },
  verseCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  verse: {
    fontSize: 14,
    color: colors.white,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  card: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardGradient: {
    padding: 20,
  },
  cardHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  serviceItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  serviceDayContainer: {
    marginBottom: 6,
  },
  serviceDay: {
    fontSize: 16,
    fontWeight: '700',
  },
  serviceTime: {
    fontSize: 14,
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  actionCard: {
    width: '47%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  actionGradient: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  actionIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary[800],
    textAlign: 'center',
  },
  section: {
    padding: 20,
    backgroundColor: colors.background,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  seeAll: {
    fontSize: 14,
    color: colors.primary[500],
    fontWeight: '700',
  },
  eventCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  eventImageContainer: {
    position: 'relative',
    width: '100%',
    height: 180,
  },
  eventImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.gray[200],
  },
  eventOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  eventInfo: {
    padding: 16,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  eventMetaRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 6,
  },
  eventMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventDate: {
    fontSize: 13,
    color: colors.primary[400],
    fontWeight: '600',
  },
  eventTime: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  eventLocation: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  sermonCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 16,
    padding: 12,
    flexDirection: 'row',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  sermonThumbnailContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  sermonThumbnail: {
    width: 90,
    height: 90,
    backgroundColor: colors.gray[200],
  },
  sermonInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  sermonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    lineHeight: 22,
  },
  sermonMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  sermonMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sermonPreacher: {
    fontSize: 13,
    color: colors.primary[400],
    fontWeight: '600',
  },
  sermonDate: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  bottomPadding: {
    height: 20,
  },
});
