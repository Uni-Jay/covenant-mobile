import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { eventsService } from '../services';
import { colors } from '../theme/colors';
import { Event } from '../types';

export default function MyEventsScreen({ navigation }: any) {
  const { user } = useAuth();
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMyEvents();
  }, []);

  const loadMyEvents = async () => {
    try {
      // TODO: Implement API endpoint to get user's registered events
      // For now, mock with empty array
      const events = await eventsService.getAll();
      // Filter events user has registered for (mock - would come from backend)
      setMyEvents([]);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadMyEvents();
    setIsRefreshing(false);
  };

  const handleCancelRegistration = (eventId: number) => {
    Alert.alert(
      'Cancel Registration',
      'Are you sure you want to cancel your registration for this event?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Implement API call to cancel registration
              Alert.alert('Success', 'Registration cancelled successfully');
              loadMyEvents();
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel registration');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading your events...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      {myEvents.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📅</Text>
          <Text style={styles.emptyTitle}>No Registered Events</Text>
          <Text style={styles.emptyText}>
            You haven't registered for any events yet.
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Events' })}
          >
            <Text style={styles.browseButtonText}>Browse Events</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.eventsList}>
          {myEvents.map((event) => (
            <View key={event.id} style={styles.eventCard}>
              <Image
                source={{ uri: `http://localhost:5000${event.imageUrl}` }}
                style={styles.eventImage}
              />
              <View style={styles.eventContent}>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>✓ Registered</Text>
                </View>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventDate}>
                  📅 {new Date(event.date).toLocaleDateString()} • {event.time}
                </Text>
                <Text style={styles.eventLocation}>📍 {event.location}</Text>
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.detailsButton}
                    onPress={() =>
                      navigation.navigate('EventDetail', { eventId: event.id })
                    }
                  >
                    <Text style={styles.detailsButtonText}>View Details</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => handleCancelRegistration(event.id)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    color: colors.gray[600],
  },
  emptyState: {
    padding: 48,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: colors.gray[600],
    textAlign: 'center',
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: colors.primary[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  browseButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  eventsList: {
    padding: 16,
  },
  eventCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.primary[100],
    elevation: 2,
    shadowColor: colors.primary[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  eventImage: {
    width: '100%',
    height: 150,
    backgroundColor: colors.gray[200],
  },
  eventContent: {
    padding: 16,
  },
  statusBadge: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  statusText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 8,
  },
  eventDate: {
    fontSize: 14,
    color: colors.primary[700],
    marginBottom: 4,
  },
  eventLocation: {
    fontSize: 14,
    color: colors.gray[600],
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  detailsButton: {
    flex: 1,
    backgroundColor: colors.primary[600],
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  detailsButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.secondary[600],
  },
  cancelButtonText: {
    color: colors.secondary[600],
    fontSize: 14,
    fontWeight: 'bold',
  },
});
