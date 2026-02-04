import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity
} from 'react-native';
import { eventsService } from '../services';
import { colors, primaryColor } from '../theme/colors';

const EventsReportScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const eventsData = await eventsService.getAll();
      setEvents(eventsData);
      // Calculate basic statistics from events
      setStats({
        totalEvents: eventsData.length,
        upcomingEvents: eventsData.filter((e: any) => new Date(e.startDate) > new Date()).length,
        totalRegistrations: eventsData.reduce((sum: number, e: any) => sum + (e.registrationCount || 0), 0),
      });
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getEventStatus = (event: any) => {
    const now = new Date();
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);

    if (endDate < now) return { text: 'Completed', color: '#6B7280' };
    if (startDate <= now && endDate >= now) return { text: 'Ongoing', color: '#10B981' };
    return { text: 'Upcoming', color: '#F59E0B' };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={primaryColor} />
      </View>
    );
  }

  const upcomingEvents = events.filter(e => new Date(e.startDate) > new Date());
  const pastEvents = events.filter(e => new Date(e.endDate) < new Date());

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Events Report</Text>
        <Text style={styles.headerSubtitle}>Event statistics and attendance</Text>
      </View>

      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalEvents || 0}</Text>
            <Text style={styles.statLabel}>Total Events</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.upcomingEvents || upcomingEvents.length}</Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalRegistrations || 0}</Text>
            <Text style={styles.statLabel}>Total Registrations</Text>
          </View>
        </View>
      )}

      <View style={styles.content}>
        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
            {upcomingEvents.map((event) => {
              const status = getEventStatus(event);
              return (
                <TouchableOpacity
                  key={event.id}
                  style={styles.eventCard}
                  onPress={() => navigation.navigate('EventDetail', { event })}
                >
                  <View style={styles.eventHeader}>
                    <View style={styles.eventInfo}>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      <Text style={styles.eventCategory}>{event.category}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
                      <Text style={[styles.statusText, { color: status.color }]}>
                        {status.text}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.eventDetails}>
                    <Text style={styles.eventDate}>
                      📅 {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                    </Text>
                    {event.location && (
                      <Text style={styles.eventLocation}>📍 {event.location}</Text>
                    )}
                  </View>

                  <View style={styles.eventStats}>
                    <View style={styles.eventStat}>
                      <Text style={styles.eventStatValue}>{event.registrationCount || 0}</Text>
                      <Text style={styles.eventStatLabel}>Registered</Text>
                    </View>
                    {event.maxAttendees && (
                      <View style={styles.eventStat}>
                        <Text style={styles.eventStatValue}>{event.maxAttendees}</Text>
                        <Text style={styles.eventStatLabel}>Max Capacity</Text>
                      </View>
                    )}
                    {event.registrationFee && (
                      <View style={styles.eventStat}>
                        <Text style={styles.eventStatValue}>₦{event.registrationFee}</Text>
                        <Text style={styles.eventStatLabel}>Fee</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Past Events */}
        {pastEvents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Past Events</Text>
            {pastEvents.map((event) => {
              const status = getEventStatus(event);
              return (
                <TouchableOpacity
                  key={event.id}
                  style={[styles.eventCard, styles.pastEventCard]}
                  onPress={() => navigation.navigate('EventDetail', { event })}
                >
                  <View style={styles.eventHeader}>
                    <View style={styles.eventInfo}>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      <Text style={styles.eventCategory}>{event.category}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
                      <Text style={[styles.statusText, { color: status.color }]}>
                        {status.text}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.eventDetails}>
                    <Text style={styles.eventDate}>
                      📅 {new Date(event.startDate).toLocaleDateString()}
                    </Text>
                  </View>

                  <View style={styles.eventStats}>
                    <View style={styles.eventStat}>
                      <Text style={styles.eventStatValue}>{event.attendanceCount || 0}</Text>
                      <Text style={styles.eventStatLabel}>Attended</Text>
                    </View>
                    <View style={styles.eventStat}>
                      <Text style={styles.eventStatValue}>{event.registrationCount || 0}</Text>
                      <Text style={styles.eventStatLabel}>Registered</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* By Category */}
        {stats?.byCategory && stats.byCategory.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Events by Category</Text>
            {stats.byCategory.map((category: any, index: number) => (
              <View key={index} style={styles.categoryCard}>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{category.category}</Text>
                  <Text style={styles.categoryCount}>{category.count} events</Text>
                </View>
                <Text style={styles.categoryRegistrations}>
                  {category.totalRegistrations} registrations
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  header: {
    backgroundColor: primaryColor,
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E5E7EB',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: primaryColor,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15,
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  pastEventCard: {
    opacity: 0.8,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 5,
  },
  eventCategory: {
    fontSize: 14,
    color: primaryColor,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  eventDetails: {
    marginBottom: 10,
  },
  eventDate: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 5,
  },
  eventLocation: {
    fontSize: 14,
    color: '#6B7280',
  },
  eventStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  eventStat: {
    alignItems: 'center',
  },
  eventStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: primaryColor,
    marginBottom: 2,
  },
  eventStatLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  categoryCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  categoryRegistrations: {
    fontSize: 16,
    fontWeight: 'bold',
    color: primaryColor,
  },
});

export default EventsReportScreen;
