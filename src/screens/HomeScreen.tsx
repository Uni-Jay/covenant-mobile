import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { eventsService, sermonsService } from '../services';
import { colors } from '../theme/colors';
import { Event, Sermon } from '../types';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const { colors: themeColors } = useTheme();
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [recentSermons, setRecentSermons] = useState<Sermon[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

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
      style={[styles.container, { backgroundColor: themeColors.background }]}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[colors.primary[600]]} />
      }
    >
      {/* Welcome Header with Gradient */}
      <LinearGradient
        colors={[colors.primary[600], colors.primary[800]]}
        style={styles.header}
      >
        <Text style={styles.greeting}>{getGreeting()},</Text>
        <Text style={styles.userName}>{user?.fullName || 'Brother/Sister'} ✨</Text>
        <View style={styles.verseCard}>
          <Text style={styles.verse}>"Light of the World" - John 8:12</Text>
        </View>
      </LinearGradient>

      {/* Service Times Card */}
      <View style={[styles.card, { backgroundColor: themeColors.surface }]}>
        <LinearGradient
          colors={['rgba(37, 99, 235, 0.05)', 'rgba(37, 99, 235, 0.02)']}
          style={styles.cardGradient}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>⏰ Service Times</Text>
          </View>
          <View style={[styles.serviceItem, { borderBottomColor: themeColors.border }]}>
            <View style={styles.serviceDayContainer}>
              <Text style={[styles.serviceDay, { color: themeColors.primary[700] }]}>Sunday</Text>
            </View>
            <Text style={[styles.serviceTime, { color: themeColors.textSecondary }]}>School: 8am-9am | Service: 9am-11am</Text>
          </View>
          <View style={[styles.serviceItem, { borderBottomColor: themeColors.border }]}>
            <View style={styles.serviceDayContainer}>
              <Text style={[styles.serviceDay, { color: themeColors.primary[700] }]}>Tuesday</Text>
            </View>
            <Text style={[styles.serviceTime, { color: themeColors.textSecondary }]}>Prayer Hour: 6pm-7pm</Text>
          </View>
          <View style={[styles.serviceItem, { borderBottomColor: themeColors.border }]}>
            <View style={styles.serviceDayContainer}>
              <Text style={[styles.serviceDay, { color: themeColors.primary[700] }]}>Thursday</Text>
            </View>
            <Text style={[styles.serviceTime, { color: themeColors.textSecondary }]}>Bible Study: 6pm-7pm</Text>
          </View>
          <View style={[styles.serviceItem, { borderBottomColor: themeColors.border }]}>
            <View style={styles.serviceDayContainer}>
              <Text style={[styles.serviceDay, { color: themeColors.primary[700] }]}>Last Friday</Text>
            </View>
            <Text style={[styles.serviceTime, { color: themeColors.textSecondary }]}>Monthly Vigil: 11pm-4am</Text>
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
            <Text style={styles.actionIcon}>📹</Text>
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
            <Text style={styles.actionIcon}>✅</Text>
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
            <Text style={styles.actionIcon}>📅</Text>
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
            <Text style={styles.actionIcon}>💝</Text>
            <Text style={styles.actionText}>Give</Text>
          </LinearGradient>
        </TouchableOpacity>

        {user?.role && ['super_admin', 'admin', 'pastor', 'elder', 'secretary', 'media_head', 'media', 'department_head', 'finance', 'deacon'].includes(user.role) && (
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('ChurchDocuments')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[colors.primary[50], colors.primary[100]]}
              style={styles.actionGradient}
            >
              <Text style={styles.actionIcon}>📄</Text>
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
            <Text style={styles.actionIcon}>🙏</Text>
            <Text style={styles.actionText}>Prayer</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Upcoming Events */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📅 Upcoming Events</Text>
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
                source={{ uri: `http://${Platform.OS === 'android' ? '10.0.2.2' : 'localhost'}:5000${event.imageUrl}` }}
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
                <Text style={styles.eventDate}>
                  📅 {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
                <Text style={styles.eventTime}>🕐 {event.time}</Text>
              </View>
              <Text style={styles.eventLocation} numberOfLines={1}>📍 {event.location}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent Sermons */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📖 Recent Sermons</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Sermons')}>
            <Text style={styles.seeAll}>See All →</Text>
          </TouchableOpacity>
        </View>
        {recentSermons.map((sermon) => (
          <TouchableOpacity
            key={sermon.id}
            style={styles.sermonCard}
            onPress={() => navigation.navigate('SermonDetail', { sermonId: sermon.id })}
            activeOpacity={0.9}
          >
            {sermon.thumbnailUrl && (
              <View style={styles.sermonThumbnailContainer}>
                <Image
                  source={{ uri: `http://localhost:5000${sermon.thumbnailUrl}` }}
                  style={styles.sermonThumbnail}
                />
              </View>
            )}
            <View style={styles.sermonInfo}>
              <Text style={styles.sermonTitle} numberOfLines={2}>{sermon.title}</Text>
              <View style={styles.sermonMeta}>
                <Text style={styles.sermonPreacher}>👤 {sermon.preacher}</Text>
                <Text style={styles.sermonDate}>
                  📅 {new Date(sermon.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
    marginBottom: 16,
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
    shadowColor: colors.primary[900],
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
    shadowColor: colors.primary[600],
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
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAll: {
    fontSize: 14,
    color: colors.secondary[600],
    fontWeight: '700',
  },
  eventCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: colors.primary[900],
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
    color: colors.gray[900],
    marginBottom: 8,
  },
  eventMetaRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 6,
  },
  eventDate: {
    fontSize: 13,
    color: colors.primary[700],
    fontWeight: '600',
  },
  eventTime: {
    fontSize: 13,
    color: colors.gray[600],
    fontWeight: '600',
  },
  eventLocation: {
    fontSize: 13,
    color: colors.gray[600],
    fontWeight: '500',
  },
  sermonCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    marginBottom: 16,
    padding: 12,
    flexDirection: 'row',
    shadowColor: colors.primary[900],
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
    color: colors.gray[900],
    marginBottom: 8,
    lineHeight: 22,
  },
  sermonMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  sermonPreacher: {
    fontSize: 13,
    color: colors.primary[700],
    fontWeight: '600',
  },
  sermonDate: {
    fontSize: 13,
    color: colors.gray[600],
    fontWeight: '500',
  },
  bottomPadding: {
    height: 20,
  },
});
