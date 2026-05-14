import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../theme/colors';
import { calendarService } from '../services';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  event_date: string;
  event_type: 'activity' | 'birthday' | 'service' | 'meeting' | 'anniversary';
  notes?: string;
  daysUntil?: number;
}

interface Birthday {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  daysUntil: number;
  showBirthday: boolean;
}

const getEventTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    activity: '#3B82F6',
    birthday: '#EC4899',
    service: '#A855F7',
    meeting: '#10B981',
    anniversary: '#DC2626',
  };
  return colorMap[type] || '#3B82F6';
};

const getEventTypeEmoji = (type: string) => {
  const emojiMap: Record<string, string> = {
    activity: '🎯',
    birthday: '🎂',
    service: '⛪',
    meeting: '🤝',
    anniversary: '💒',
  };
  return emojiMap[type] || '📅';
};

export default function CalendarScreen({ navigation }: any) {
  const { colors: themeColors } = useTheme();
  const styles = createStyles(themeColors);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'all' | 'events' | 'birthdays'>('all');
  const [userHidesBirthday, setUserHidesBirthday] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadCalendarData();
    }, [])
  );

  const loadCalendarData = async () => {
    try {
      setIsLoading(true);
      const [calendarData, settingsData] = await Promise.all([
        calendarService.getCalendar(),
        calendarService.getBirthdaySettings(),
      ]);

      if (calendarData) {
        setEvents(calendarData.events || []);
        setBirthdays(calendarData.birthdays || []);
      }

      if (settingsData) {
        setUserHidesBirthday(settingsData.show_birthday === false);
      }
    } catch (error: any) {
      console.error('Error loading calendar:', error);
      Alert.alert('Error', 'Failed to load calendar data');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadCalendarData();
    setIsRefreshing(false);
  };

  const handleEventPress = (event: CalendarEvent) => {
    navigation.navigate('CalendarEventDetail', { event });
  };

  const handleBirthdayPress = (birthday: Birthday) => {
    navigation.navigate('BirthdayDetail', { birthday });
  };

  const handleSettingsPress = () => {
    navigation.navigate('BirthdaySettings');
  };

  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
  );

  const sortedBirthdays = [...birthdays]
    .filter((b) => b.showBirthday || !userHidesBirthday)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  const displayEvents = selectedTab === 'all' 
    ? [...sortedEvents, ...sortedBirthdays.map((b) => ({
        id: b.id + 10000,
        title: `${b.firstName} ${b.lastName}'s Birthday`,
        event_date: b.dateOfBirth,
        event_type: 'birthday' as const,
        daysUntil: b.daysUntil,
      }))]
    : selectedTab === 'events'
    ? sortedEvents
    : sortedBirthdays.map((b) => ({
        id: b.id + 10000,
        title: `${b.firstName} ${b.lastName}'s Birthday`,
        event_date: b.dateOfBirth,
        event_type: 'birthday' as const,
        daysUntil: b.daysUntil,
      }));

  const displayedItems = displayEvents.slice(0, 10); // Show top 10 upcoming

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[themeColors.primary[600], themeColors.primary[700]]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>📅 Church Calendar</Text>
          <Text style={styles.headerSubtitle}>Upcoming events & celebrations</Text>
        </View>
        {selectedTab === 'birthdays' && (
          <TouchableOpacity
            onPress={handleSettingsPress}
            style={styles.settingsButton}
          >
            <Text style={styles.settingsButtonText}>⚙️</Text>
          </TouchableOpacity>
        )}
      </LinearGradient>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        {(['all', 'events', 'birthdays'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setSelectedTab(tab)}
            style={[
              styles.tab,
              selectedTab === tab && styles.tabActive,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === tab && styles.tabTextActive,
              ]}
            >
              {tab === 'all' ? 'All' : tab === 'events' ? 'Events' : 'Birthdays'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Loading State */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.primary[600]} />
          <Text style={styles.loadingText}>Loading calendar...</Text>
        </View>
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.scrollContent}
        >
          {displayedItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={styles.emptyTitle}>No upcoming events</Text>
              <Text style={styles.emptyText}>
                {selectedTab === 'birthdays'
                  ? 'No birthdays coming up soon'
                  : 'Check back later for scheduled events'}
              </Text>
            </View>
          ) : (
            <View style={styles.eventsContainer}>
              {displayedItems.map((item, index) => (
                <TouchableOpacity
                  key={`${item.event_type}-${index}`}
                  onPress={() => {
                    if (item.event_type === 'birthday') {
                      handleBirthdayPress(
                        birthdays.find((b) => b.id + 10000 === item.id) as Birthday
                      );
                    } else {
                      handleEventPress(item as CalendarEvent);
                    }
                  }}
                  activeOpacity={0.7}
                  style={styles.eventCard}
                >
                  <View
                    style={[
                      styles.eventIndicator,
                      { backgroundColor: getEventTypeColor(item.event_type) },
                    ]}
                  />
                  <View style={styles.eventContent}>
                    <View style={styles.eventHeader}>
                      <Text style={styles.eventEmoji}>
                        {getEventTypeEmoji(item.event_type)}
                      </Text>
                      <View style={styles.eventTextContainer}>
                        <Text style={styles.eventTitle}>{item.title}</Text>
                        <Text style={styles.eventDate}>
                          {new Date(item.event_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </Text>
                      </View>
                    </View>
                    {item.daysUntil !== undefined && (
                      <Text
                        style={[
                          styles.daysUntilBadge,
                          item.daysUntil === 0 && styles.todayBadge,
                          item.daysUntil === 1 && styles.tomorrowBadge,
                        ]}
                      >
                        {item.daysUntil === 0
                          ? 'Today'
                          : item.daysUntil === 1
                          ? 'Tomorrow'
                          : `${item.daysUntil} days away`}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.eventArrow}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* View All Button */}
          {displayedItems.length > 0 && displayedItems.length < (selectedTab === 'all' ? sortedEvents.length + sortedBirthdays.length : selectedTab === 'events' ? sortedEvents.length : sortedBirthdays.length) && (
            <TouchableOpacity
              onPress={() => navigation.navigate('CalendarFullView', { tab: selectedTab })}
              style={styles.viewAllButton}
            >
              <Text style={styles.viewAllText}>View All {selectedTab === 'all' ? '' : selectedTab}</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 24,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    headerContent: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.white,
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: 14,
      color: colors.white + 'CC',
    },
    settingsButton: {
      padding: 8,
    },
    settingsButtonText: {
      fontSize: 24,
    },
    tabContainer: {
      flexDirection: 'row',
      paddingHorizontal: 12,
      paddingVertical: 12,
      backgroundColor: colors.white,
      borderBottomWidth: 1,
      borderBottomColor: colors.gray[200],
    },
    tab: {
      flex: 1,
      paddingVertical: 8,
      marginHorizontal: 4,
      borderRadius: 8,
      alignItems: 'center',
      backgroundColor: colors.gray[100],
    },
    tabActive: {
      backgroundColor: colors.primary[600],
    },
    tabText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.gray[600],
    },
    tabTextActive: {
      color: colors.white,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 40,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: colors.gray[600],
    },
    scrollContent: {
      paddingHorizontal: 12,
      paddingVertical: 12,
      minHeight: '100%',
    },
    emptyContainer: {
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyEmoji: {
      fontSize: 64,
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.gray[800],
      marginBottom: 8,
    },
    emptyText: {
      fontSize: 14,
      color: colors.gray[600],
      textAlign: 'center',
      paddingHorizontal: 32,
    },
    eventsContainer: {
      gap: 12,
    },
    eventCard: {
      backgroundColor: colors.white,
      borderRadius: 12,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    eventIndicator: {
      width: 4,
      height: '100%',
      borderRadius: 4,
      marginRight: 12,
    },
    eventContent: {
      flex: 1,
    },
    eventHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    eventEmoji: {
      fontSize: 20,
      marginRight: 8,
    },
    eventTextContainer: {
      flex: 1,
    },
    eventTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.gray[800],
      marginBottom: 2,
    },
    eventDate: {
      fontSize: 13,
      color: colors.gray[600],
    },
    daysUntilBadge: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.primary[600],
      paddingHorizontal: 8,
      paddingVertical: 3,
      backgroundColor: colors.primary[100],
      borderRadius: 12,
      alignSelf: 'flex-start',
      marginTop: 4,
      overflow: 'hidden',
    },
    todayBadge: {
      backgroundColor: '#FEE2E2',
      color: '#DC2626',
    },
    tomorrowBadge: {
      backgroundColor: '#FEF3C7',
      color: '#D97706',
    },
    eventArrow: {
      fontSize: 24,
      color: colors.gray[400],
      marginLeft: 8,
    },
    viewAllButton: {
      marginTop: 16,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      backgroundColor: colors.primary[100],
      alignItems: 'center',
    },
    viewAllText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary[600],
    },
  });
