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
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { eventsService } from '../services';
import { Event } from '../types';
import { colors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const getImageUrl = (imageUrl: string) => {
  const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
  return `${baseUrl}${imageUrl}`;
};

export default function EventsScreen({ navigation }: any) {
  const { colors: themeColors } = useTheme();
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
      {/* Header with Gradient */}
      <LinearGradient
        colors={[colors.primary[600], colors.primary[700]]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>📅 Events</Text>
        <Text style={styles.headerSubtitle}>Join us in fellowship and worship</Text>
      </LinearGradient>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {categories.map((category) => {
          const isActive = filter === category;
          return (
            <TouchableOpacity
              key={category}
              onPress={() => setFilter(category)}
              activeOpacity={0.7}
              style={styles.filterWrapper}
            >
              <LinearGradient
                colors={isActive 
                  ? [colors.primary[600], colors.primary[700]] 
                  : [colors.white, colors.white]}
                style={styles.filterButton}
              >
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                  {category}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Events List */}
      <ScrollView
        style={styles.eventsList}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[colors.primary[600]]} />
        }
      >
        {filteredEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🗓️</Text>
            <Text style={styles.emptyText}>No events available</Text>
            <Text style={styles.emptySubtext}>Check back soon for upcoming events</Text>
          </View>
        ) : (
          filteredEvents.map((event) => (
            <TouchableOpacity
              key={event.id}
              style={styles.eventCard}
              onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0)']}
                style={styles.cardGradient}
              >
                <View style={styles.thumbnailContainer}>
                  <Image
                    source={{ uri: getImageUrl(event.imageUrl) }}
                    style={styles.eventImage}
                    resizeMode="cover"
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.7)']}
                    style={styles.imageOverlay}
                  >
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>{event.category}</Text>
                    </View>
                  </LinearGradient>
                </View>
                
                <View style={styles.eventContent}>
                  <Text style={styles.eventTitle} numberOfLines={2}>{event.title}</Text>
                  <Text style={styles.eventDescription} numberOfLines={2}>
                    {event.description}
                  </Text>
                  
                  <View style={styles.metaContainer}>
                    <View style={styles.metaRow}>
                      <View style={styles.metaItem}>
                        <Text style={styles.metaIcon}>📅</Text>
                        <Text style={styles.metaText}>
                          {new Date(event.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Text style={styles.metaIcon}>🕐</Text>
                        <Text style={styles.metaText}>{event.time}</Text>
                      </View>
                    </View>
                    <View style={styles.locationRow}>
                      <Text style={styles.metaIcon}>📍</Text>
                      <Text style={styles.locationText} numberOfLines={1}>{event.location}</Text>
                    </View>
                  </View>

                  <TouchableOpacity style={styles.registerButton}>
                    <LinearGradient
                      colors={[colors.secondary[600], colors.secondary[700]]}
                      style={styles.registerGradient}
                    >
                      <Text style={styles.registerButtonText}>Register Now</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))
        )}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
  filterContainer: {
    maxHeight: 70,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  filterWrapper: {
    marginRight: 10,
  },
  filterButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.primary[600],
  },
  filterButtonActive: {
    shadowOpacity: 0.3,
    elevation: 4,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary[600],
  },
  filterTextActive: {
    color: colors.white,
  },
  eventsList: {
    flex: 1,
    padding: 8,
  },
  eventCard: {
    backgroundColor: colors.white,
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: colors.primary[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  cardGradient: {
    flex: 1,
  },
  thumbnailContainer: {
    width: '100%',
    height: 220,
    position: 'relative',
  },
  eventImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.gray[200],
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    justifyContent: 'flex-end',
    padding: 12,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primary[700],
  },
  eventContent: {
    padding: 16,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 8,
    lineHeight: 28,
  },
  eventDescription: {
    fontSize: 14,
    color: colors.gray[600],
    lineHeight: 20,
    marginBottom: 16,
  },
  metaContainer: {
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  metaIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  metaText: {
    fontSize: 13,
    color: colors.gray[700],
    fontWeight: '500',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    color: colors.primary[700],
    fontWeight: '600',
    flex: 1,
  },
  registerButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: colors.secondary[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  registerGradient: {
    padding: 14,
    alignItems: 'center',
  },
  registerButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.gray[500],
    textAlign: 'center',
  },
  bottomPadding: {
    height: 20,
  },
});
