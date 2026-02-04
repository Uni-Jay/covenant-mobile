import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Image,
  ImageBackground,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { eventsService, sermonsService } from '../services';
import { primaryColor, accentColor, colors } from '../theme/colors';

const backgroundColor = colors.background;
const textColor = colors.gray[800];
import { Event, Sermon } from '../types';

const { width } = Dimensions.get('window');

export default function HomeScreenRedesign({ navigation }: any) {
  const { user } = useAuth();
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [recentSermons, setRecentSermons] = useState<Sermon[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [scrollY] = useState(new Animated.Value(0));

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

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [280, 100],
    extrapolate: 'clamp',
  });

  const quickActions = [
    { icon: '📹', label: 'Live Stream', screen: 'LiveStream', color: '#FF6B6B' },
    { icon: '📖', label: 'Sermons', screen: 'Sermons', color: '#4ECDC4' },
    { icon: '📅', label: 'Events', screen: 'Events', color: '#45B7D1' },
    { icon: '🙏', label: 'Pray', screen: 'PrayerRequest', color: '#FFA07A' },
    { icon: '❤️', label: 'Give', screen: 'Donate', color: '#98D8C8' },
    { icon: '💬', label: 'Chat', screen: 'ChatList', color: '#A78BFA' },
    { icon: '📄', label: 'Documents', screen: 'ChurchDocuments', color: '#F59E0B' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Animated.ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {/* Hero Section */}
        <Animated.View style={[styles.heroContainer, { height: headerHeight }]}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroContent}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.userName}>{user?.fullName || 'Welcome!'}</Text>
            <Text style={styles.verse}>
              "I am the light of the world" - John 8:12
            </Text>
          </View>
        </Animated.View>

        {/* Quick Actions Grid */}
        <View style={styles.quickActionsSection}>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickActionCard}
                onPress={() => navigation.navigate(action.screen)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[action.color, action.color + 'CC']}
                  style={styles.quickActionGradient}
                >
                  <Text style={styles.quickActionIcon}>{action.icon}</Text>
                </LinearGradient>
                <Text style={styles.quickActionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Service Times Card */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>⏰</Text>
            <Text style={styles.sectionTitle}>Service Times</Text>
          </View>
          <View style={styles.card}>
            {[
              { day: 'Sunday', time: 'School: 8am-9am | Service: 9am-11am', icon: '☀️' },
              { day: 'Tuesday', time: 'Prayer Hour: 6pm-7pm', icon: '🙏' },
              { day: 'Thursday', time: 'Bible Study: 6pm-7pm', icon: '📖' },
              { day: 'Last Friday', time: 'Monthly Vigil: 11pm-4am', icon: '🌙' },
            ].map((service, index) => (
              <View key={index} style={styles.serviceRow}>
                <View style={styles.serviceIcon}>
                  <Text style={styles.serviceIconText}>{service.icon}</Text>
                </View>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceDay}>{service.day}</Text>
                  <Text style={styles.serviceTime}>{service.time}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>📅</Text>
              <Text style={styles.sectionTitle}>Upcoming Events</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Events')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {upcomingEvents.map((event) => (
                <TouchableOpacity
                  key={event.id}
                  style={styles.eventCard}
                  onPress={() => navigation.navigate('EventDetails', { eventId: event.id })}
                >
                  {event.imageUrl ? (
                    <ImageBackground
                      source={{ uri: event.imageUrl }}
                      style={styles.eventImage}
                      imageStyle={{ borderRadius: 12 }}
                    >
                      <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.8)']}
                        style={styles.eventGradient}
                      >
                        <Text style={styles.eventTitle} numberOfLines={2}>
                          {event.title}
                        </Text>
                        <View style={styles.eventDate}>
                          <Text style={styles.eventDateIcon}>📅</Text>
                          <Text style={styles.eventDateText}>
                            {new Date(event.date).toLocaleDateString()}
                          </Text>
                        </View>
                      </LinearGradient>
                    </ImageBackground>
                  ) : (
                    <View style={styles.eventImagePlaceholder}>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      <View style={styles.eventDate}>
                        <Text style={styles.eventDateIcon}>📅</Text>
                        <Text style={[styles.eventDateText, { color: textColor }]}>
                          {new Date(event.date).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Recent Sermons */}
        {recentSermons.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>📖</Text>
              <Text style={styles.sectionTitle}>Recent Sermons</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Sermons')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            {recentSermons.map((sermon) => (
              <TouchableOpacity
                key={sermon.id}
                style={styles.sermonCard}
                onPress={() => navigation.navigate('SermonDetails', { sermonId: sermon.id })}
              >
                <View style={styles.sermonIcon}>
                  <Text style={styles.sermonIconText}>🎤</Text>
                </View>
                <View style={styles.sermonInfo}>
                  <Text style={styles.sermonTitle} numberOfLines={2}>
                    {sermon.title}
                  </Text>
                  <Text style={styles.sermonMeta}>
                    {sermon.preacher} • {new Date(sermon.date).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.playIcon}>▶️</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Bottom Padding */}
        <View style={{ height: 40 }} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: backgroundColor,
  },
  scrollView: {
    flex: 1,
  },
  heroContainer: {
    width: '100%',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  heroContent: {
    padding: 24,
    paddingBottom: 32,
  },
  greeting: {
    fontSize: 16,
    color: '#ffffffcc',
    marginBottom: 4,
  },
  userName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  verse: {
    fontSize: 14,
    color: '#ffffffaa',
    fontStyle: 'italic',
  },
  quickActionsSection: {
    marginTop: -30,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  quickActionCard: {
    width: '33.33%',
    alignItems: 'center',
    marginBottom: 20,
  },
  quickActionGradient: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionIcon: {
    fontSize: 28,
  },
  quickActionLabel: {
    fontSize: 12,
    color: textColor,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIcon: {
    fontSize: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: textColor,
    marginLeft: 8,
    flex: 1,
  },
  seeAll: {
    fontSize: 14,
    color: primaryColor,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  serviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${primaryColor}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  serviceIconText: {
    fontSize: 20,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceDay: {
    fontSize: 15,
    fontWeight: '600',
    color: textColor,
    marginBottom: 2,
  },
  serviceTime: {
    fontSize: 13,
    color: '#666',
  },
  eventCard: {
    width: width * 0.7,
    marginRight: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  eventImage: {
    width: '100%',
    height: 200,
    justifyContent: 'flex-end',
  },
  eventGradient: {
    padding: 16,
  },
  eventImagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#fff',
    padding: 16,
    justifyContent: 'flex-end',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  eventDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventDateIcon: {
    fontSize: 14,
  },
  eventDateText: {
    fontSize: 12,
    color: '#fff',
  },
  sermonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sermonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${primaryColor}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sermonIconText: {
    fontSize: 24,
  },
  sermonInfo: {
    flex: 1,
  },
  sermonTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: textColor,
    marginBottom: 4,
  },
  sermonMeta: {
    fontSize: 12,
    color: '#666',
  },
  playIcon: {
    fontSize: 32,
  },
});
