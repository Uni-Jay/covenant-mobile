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
import { eventsService } from '../services';
import { Event } from '../types';
import { colors } from '../theme/colors';

export default function EventsScreen({ navigation }: any) {
  const [events, setEvents] = useState<Event[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('All');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await eventsService.getAll();
      setEvents(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load events');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadEvents();
    setIsRefreshing(false);
  };

  const categories = ['All', 'Service', 'Conference', 'Seminar', 'Outreach', 'Fellowship'];

  const filteredEvents = filter === 'All'
    ? events
    : events.filter(event => event.category === filter);

  return (
    <View style={styles.container}>
      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.filterButton,
              filter === category && styles.filterButtonActive,
            ]}
            onPress={() => setFilter(category)}
          >
            <Text
              style={[
                styles.filterText,
                filter === category && styles.filterTextActive,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Events List */}
      <ScrollView
        style={styles.eventsList}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {filteredEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No events found</Text>
          </View>
        ) : (
          filteredEvents.map((event) => (
            <TouchableOpacity
              key={event.id}
              style={styles.eventCard}
              onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
            >
              <Image
                source={{ uri: `http://localhost:5000${event.imageUrl}` }}
                style={styles.eventImage}
              />
              <View style={styles.eventContent}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{event.category}</Text>
                </View>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventDescription} numberOfLines={2}>
                  {event.description}
                </Text>
                <View style={styles.eventMeta}>
                  <Text style={styles.metaText}>
                    📅 {new Date(event.date).toLocaleDateString()}
                  </Text>
                  <Text style={styles.metaText}>🕐 {event.time}</Text>
                </View>
                <Text style={styles.locationText}>📍 {event.location}</Text>
                <TouchableOpacity style={styles.registerButton}>
                  <Text style={styles.registerButtonText}>Register Now</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filterContainer: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  filterContent: {
    padding: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: colors.primary[600],
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
  },
  filterTextActive: {
    color: colors.white,
  },
  eventsList: {
    flex: 1,
  },
  eventCard: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
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
    height: 200,
    backgroundColor: colors.gray[200],
  },
  eventContent: {
    padding: 16,
  },
  categoryBadge: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  categoryText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: 14,
    color: colors.gray[600],
    lineHeight: 20,
    marginBottom: 12,
  },
  eventMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  metaText: {
    fontSize: 14,
    color: colors.gray[700],
  },
  locationText: {
    fontSize: 14,
    color: colors.primary[700],
    marginBottom: 16,
  },
  registerButton: {
    backgroundColor: colors.secondary[600],
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.secondary[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  registerButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.gray[500],
  },
});
