import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../theme/colors';
import { calendarService } from '../services';

interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  event_date: string;
  event_type: 'activity' | 'birthday' | 'service' | 'meeting' | 'anniversary';
  notes?: string;
  created_by: number;
}

interface Stats {
  totalEvents: number;
  eventsByType: Record<string, number>;
  upcomingEvents: number;
  remindersToday: number;
}

interface FormData {
  title: string;
  description: string;
  event_date: string;
  event_type: 'activity' | 'birthday' | 'service' | 'meeting' | 'anniversary';
  notes: string;
}

export default function AdminCalendarManagementScreen({ navigation }: any) {
  const { colors: themeColors } = useTheme();
  const styles = createStyles(themeColors);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    event_date: new Date().toISOString().split('T')[0],
    event_type: 'activity',
    notes: '',
  });
  const [selectedTab, setSelectedTab] = useState<'events' | 'stats'>('events');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [eventsResponse, statsResponse] = await Promise.all([
        calendarService.getAllEvents(1, 50),
        calendarService.getCalendarStats(),
      ]);

      setEvents(eventsResponse.data || []);
      setStats(statsResponse);
    } catch (error: any) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load calendar data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter event title');
      return;
    }

    try {
      setIsSaving(true);
      if (editingEvent) {
        await calendarService.updateEvent(editingEvent.id, formData);
        Alert.alert('Success', 'Event updated successfully');
      } else {
        await calendarService.createEvent(formData);
        Alert.alert('Success', 'Event created successfully');
      }
      resetForm();
      setModalVisible(false);
      loadData();
    } catch (error: any) {
      console.error('Error saving event:', error);
      Alert.alert('Error', error.message || 'Failed to save event');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEvent = (event: CalendarEvent) => {
    Alert.alert(
      'Delete Event',
      `Are you sure you want to delete "${event.title}"?`,
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await calendarService.deleteEvent(event.id);
              Alert.alert('Success', 'Event deleted successfully');
              loadData();
            } catch (error: any) {
              Alert.alert('Error', 'Failed to delete event');
            }
          },
        },
      ]
    );
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      event_date: event.event_date.split('T')[0],
      event_type: event.event_type,
      notes: event.notes || '',
    });
    setModalVisible(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      event_date: new Date().toISOString().split('T')[0],
      event_type: 'activity',
      notes: '',
    });
    setEditingEvent(null);
  };

  const handleTestReminders = async () => {
    Alert.alert(
      'Send Test Reminders',
      'This will send test event reminders to all members.',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Send',
          onPress: async () => {
            try {
              setIsSaving(true);
              await calendarService.triggerEventReminders();
              Alert.alert('Success', 'Test reminders sent successfully');
            } catch (error: any) {
              Alert.alert('Error', 'Failed to send test reminders');
            } finally {
              setIsSaving(false);
            }
          },
        },
      ]
    );
  };

  const handleTestBirthdays = async () => {
    Alert.alert(
      'Send Test Birthday Greetings',
      'This will send test birthday greetings to today\'s birthdays.',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Send',
          onPress: async () => {
            try {
              setIsSaving(true);
              await calendarService.triggerBirthdayReminders();
              Alert.alert('Success', 'Test greetings sent successfully');
            } catch (error: any) {
              Alert.alert('Error', 'Failed to send test greetings');
            } finally {
              setIsSaving(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[themeColors.primary[600], themeColors.primary[700]]}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Calendar Management</Text>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.primary[600]} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[themeColors.primary[600], themeColors.primary[700]]}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Calendar Management</Text>
        <TouchableOpacity
          onPress={() => {
            resetForm();
            setModalVisible(true);
          }}
          style={styles.addButton}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        {['events', 'stats'].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setSelectedTab(tab as 'events' | 'stats')}
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
              {tab === 'events' ? 'Events' : 'Statistics'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      {selectedTab === 'events' ? (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item: event }) => (
            <View style={styles.eventCard}>
              <View style={styles.eventCardHeader}>
                <View>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventDate}>
                    {new Date(event.event_date).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.typeTag}>
                  <Text style={styles.typeTagText}>{event.event_type}</Text>
                </View>
              </View>
              {event.description && (
                <Text style={styles.eventDescription}>{event.description}</Text>
              )}
              <View style={styles.eventActions}>
                <TouchableOpacity
                  onPress={() => handleEditEvent(event)}
                  style={styles.actionButton}
                >
                  <Text style={styles.actionButtonText}>✏️ Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeleteEvent(event)}
                  style={[styles.actionButton, styles.deleteButton]}
                >
                  <Text style={styles.actionButtonText}>🗑️ Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          contentContainerStyle={styles.eventsList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No events yet</Text>
            </View>
          }
        />
      ) : (
        <ScrollView contentContainerStyle={styles.statsContainer}>
          {/* Stats Cards */}
          {stats && (
            <>
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statEmoji}>📅</Text>
                  <Text style={styles.statValue}>{stats.totalEvents}</Text>
                  <Text style={styles.statLabel}>Total Events</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statEmoji}>🚀</Text>
                  <Text style={styles.statValue}>{stats.upcomingEvents}</Text>
                  <Text style={styles.statLabel}>Upcoming</Text>
                </View>
              </View>

              {/* Events by Type */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Events by Type</Text>
                {Object.entries(stats.eventsByType || {}).map(([type, count]) => (
                  <View key={type} style={styles.typeStatsCard}>
                    <Text style={styles.typeStatsLabel}>{type}</Text>
                    <Text style={styles.typeStatsValue}>{count}</Text>
                  </View>
                ))}
              </View>

              {/* Test Actions */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Test Actions</Text>
                <TouchableOpacity
                  onPress={handleTestReminders}
                  disabled={isSaving}
                  style={styles.testButton}
                >
                  <Text style={styles.testButtonText}>📤 Send Test Event Reminders</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleTestBirthdays}
                  disabled={isSaving}
                  style={[styles.testButton, { marginTop: 8 }]}
                >
                  <Text style={styles.testButtonText}>🎂 Send Test Birthday Greetings</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      )}

      {/* Create/Edit Event Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={[themeColors.primary[600], themeColors.primary[700]]}
            style={styles.modalHeader}
          >
            <TouchableOpacity
              onPress={() => {
                setModalVisible(false);
                resetForm();
              }}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingEvent ? 'Edit Event' : 'Create Event'}
            </Text>
            <TouchableOpacity
              onPress={handleCreateEvent}
              disabled={isSaving}
              style={styles.saveButton}
            >
              <Text style={styles.saveButtonText}>✓</Text>
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Event Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter event title"
                value={formData.title}
                onChangeText={(text) =>
                  setFormData({ ...formData, title: text })
                }
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Event Type *</Text>
              <View style={styles.typeSelector}>
                {(['activity', 'service', 'meeting', 'birthday', 'anniversary'] as const).map(
                  (type) => (
                    <TouchableOpacity
                      key={type}
                      onPress={() => setFormData({ ...formData, event_type: type })}
                      style={[
                        styles.typeOption,
                        formData.event_type === type && styles.typeOptionSelected,
                      ]}
                    >
                      <Text style={styles.typeOptionText}>{type}</Text>
                    </TouchableOpacity>
                  )
                )}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Event Date *</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={formData.event_date}
                onChangeText={(text) =>
                  setFormData({ ...formData, event_date: text })
                }
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter event description"
                value={formData.description}
                onChangeText={(text) =>
                  setFormData({ ...formData, description: text })
                }
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter additional notes"
                value={formData.notes}
                onChangeText={(text) =>
                  setFormData({ ...formData, notes: text })
                }
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
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
      paddingTop: 12,
      paddingBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    backButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    backButtonText: {
      fontSize: 32,
      color: colors.white,
      fontWeight: 'bold',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.white,
      flex: 1,
      textAlign: 'center',
    },
    addButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    addButtonText: {
      fontSize: 28,
      color: colors.white,
      fontWeight: 'bold',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
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
    eventsList: {
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
    eventCard: {
      backgroundColor: colors.white,
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    eventCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    eventTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.gray[800],
      marginBottom: 4,
    },
    eventDate: {
      fontSize: 12,
      color: colors.gray[600],
    },
    typeTag: {
      backgroundColor: colors.primary[100],
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
    },
    typeTagText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.primary[700],
    },
    eventDescription: {
      fontSize: 13,
      color: colors.gray[700],
      marginBottom: 8,
      lineHeight: 18,
    },
    eventActions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: colors.primary[100],
      borderRadius: 6,
      alignItems: 'center',
    },
    deleteButton: {
      backgroundColor: '#FEE2E2',
    },
    actionButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.primary[700],
    },
    emptyContainer: {
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyText: {
      fontSize: 16,
      color: colors.gray[600],
    },
    statsContainer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    statsGrid: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.white,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    statEmoji: {
      fontSize: 28,
      marginBottom: 8,
    },
    statValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.primary[600],
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: colors.gray[600],
      textAlign: 'center',
    },
    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.gray[800],
      marginBottom: 8,
    },
    typeStatsCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.white,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginBottom: 8,
      borderRadius: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 1,
    },
    typeStatsLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.gray[800],
    },
    typeStatsValue: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.primary[600],
    },
    testButton: {
      backgroundColor: colors.primary[600],
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    testButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.white,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    modalHeader: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    closeButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    closeButtonText: {
      fontSize: 24,
      color: colors.white,
      fontWeight: 'bold',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.white,
      flex: 1,
      textAlign: 'center',
    },
    saveButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    saveButtonText: {
      fontSize: 24,
      color: colors.white,
      fontWeight: 'bold',
    },
    modalContent: {
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    formGroup: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.gray[800],
      marginBottom: 8,
    },
    input: {
      backgroundColor: colors.white,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.gray[200],
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: colors.gray[800],
    },
    textArea: {
      textAlignVertical: 'top',
    },
    typeSelector: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    typeOption: {
      backgroundColor: colors.gray[100],
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.gray[200],
    },
    typeOptionSelected: {
      backgroundColor: colors.primary[600],
      borderColor: colors.primary[600],
    },
    typeOptionText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.gray[700],
    },
  });
