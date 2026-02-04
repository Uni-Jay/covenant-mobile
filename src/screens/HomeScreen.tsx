import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { eventsService, sermonsService } from '../services';
import { colors } from '../theme/colors';
import { Event, Sermon } from '../types';

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
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
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      {/* Welcome Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>{getGreeting()},</Text>
        <Text style={styles.userName}>{user?.fullName || 'Brother/Sister'}</Text>
        <Text style={styles.verse}>"Light of the World" - John 8:12</Text>
      </View>

      {/* Service Times */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Service Times</Text>
        <View style={styles.serviceItem}>
          <Text style={styles.serviceDay}>Sunday</Text>
          <Text style={styles.serviceTime}>School: 8am-9am | Service: 9am-11am</Text>
        </View>
        <View style={styles.serviceItem}>
          <Text style={styles.serviceDay}>Tuesday</Text>
          <Text style={styles.serviceTime}>Prayer Hour: 6pm-7pm</Text>
        </View>
        <View style={styles.serviceItem}>
          <Text style={styles.serviceDay}>Thursday</Text>
          <Text style={styles.serviceTime}>Bible Study: 6pm-7pm</Text>
        </View>
        <View style={styles.serviceItem}>
          <Text style={styles.serviceDay}>Last Friday</Text>
          <Text style={styles.serviceTime}>Monthly Vigil: 11pm-4am</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('LiveStream')}
        >
          <Text style={styles.actionIcon}>📹</Text>
          <Text style={styles.actionText}>Live Stream</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Attendance')}
        >
          <Text style={styles.actionIcon}>✅</Text>
          <Text style={styles.actionText}>Attendance</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Events')}
        >
          <Text style={styles.actionIcon}>📅</Text>
          <Text style={styles.actionText}>Events</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Give')}
        >
          <Text style={styles.actionIcon}>💝</Text>
          <Text style={styles.actionText}>Give</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Prayer')}
        >
          <Text style={styles.actionIcon}>🙏</Text>
          <Text style={styles.actionText}>Prayer</Text>
        </TouchableOpacity>
      </View>

      {/* Upcoming Events */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Events')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        {upcomingEvents.map((event) => (
          <TouchableOpacity
            key={event.id}
            style={styles.eventCard}
            onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
          >
            <Image
              source={{ uri: `http://localhost:5000${event.imageUrl}` }}
              style={styles.eventImage}
            />
            <View style={styles.eventInfo}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.eventDate}>
                {new Date(event.date).toLocaleDateString()} • {event.time}
              </Text>
              <Text style={styles.eventLocation}>{event.location}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent Sermons */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Sermons</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Sermons')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        {recentSermons.map((sermon) => (
          <TouchableOpacity
            key={sermon.id}
            style={styles.sermonCard}
            onPress={() => navigation.navigate('SermonDetail', { sermonId: sermon.id })}
          >
            {sermon.thumbnailUrl && (
              <Image
                source={{ uri: `http://localhost:5000${sermon.thumbnailUrl}` }}
                style={styles.sermonThumbnail}
              />
            )}
            <View style={styles.sermonInfo}>
              <Text style={styles.sermonTitle}>{sermon.title}</Text>
              <Text style={styles.sermonPreacher}>By {sermon.preacher}</Text>
              <Text style={styles.sermonDate}>
                {new Date(sermon.date).toLocaleDateString()}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary[800],
    padding: 24,
    paddingTop: 48,
  },
  greeting: {
    fontSize: 18,
    color: colors.white,
    opacity: 0.9,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    marginTop: 4,
  },
  verse: {
    fontSize: 14,
    color: colors.primary[100],
    fontStyle: 'italic',
    marginTop: 8,
  },
  card: {
    backgroundColor: colors.white,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary[100],
    shadowColor: colors.primary[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary[900],
    marginBottom: 12,
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  serviceDay: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[700],
  },
  serviceTime: {
    fontSize: 14,
    color: colors.gray[600],
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  actionCard: {
    backgroundColor: colors.primary[50],
    width: '47%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary[200],
    shadowColor: colors.primary[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary[800],
  },
  section: {
    padding: 16,
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
    fontWeight: '600',
  },
  eventCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.primary[100],
    shadowColor: colors.primary[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventImage: {
    width: '100%',
    height: 150,
    backgroundColor: colors.gray[200],
  },
  eventInfo: {
    padding: 12,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 14,
    color: colors.primary[700],
    marginBottom: 4,
  },
  eventLocation: {
    fontSize: 14,
    color: colors.gray[600],
  },
  sermonCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.primary[100],
    shadowColor: colors.primary[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sermonThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
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
    marginBottom: 4,
  },
  sermonPreacher: {
    fontSize: 14,
    color: colors.primary[700],
    marginBottom: 2,
  },
  sermonDate: {
    fontSize: 12,
    color: colors.gray[600],
  },
});
