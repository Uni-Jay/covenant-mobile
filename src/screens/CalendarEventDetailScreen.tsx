import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../theme/colors';
import { calendarService } from '../services';

interface EventDetailScreenProps {
  route: any;
  navigation: any;
}

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

const getEventTypeColor = (type: string) => {
  const colorMap: Record<string, { bg: string; text: string }> = {
    activity: { bg: '#DBEAFE', text: '#1E40AF' },
    birthday: { bg: '#FCE7F3', text: '#BE185D' },
    service: { bg: '#EDE9FE', text: '#6D28D9' },
    meeting: { bg: '#DCFCE7', text: '#15803D' },
    anniversary: { bg: '#FEE2E2', text: '#B91C1C' },
  };
  return colorMap[type] || colorMap.activity;
};

export default function CalendarEventDetailScreen({
  route,
  navigation,
}: EventDetailScreenProps) {
  const { event } = route.params;
  const { colors: themeColors } = useTheme();
  const styles = createStyles(themeColors);
  const [isLoading, setIsLoading] = useState(false);
  const [eventDetails, setEventDetails] = useState(event);

  useEffect(() => {
    if (event.id < 10000) {
      // Regular event, try to load full details
      loadEventDetails();
    }
  }, []);

  const loadEventDetails = async () => {
    try {
      setIsLoading(true);
      const details = await calendarService.getEventById(event.id);
      setEventDetails(details);
    } catch (error: any) {
      console.error('Error loading event details:', error);
      // Use the event data we already have
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      const eventDate = new Date(eventDetails.event_date).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });

      const message = `📅 ${eventDetails.title}\n\n📍 Date: ${eventDate}\n\n📖 Type: ${eventDetails.event_type}\n\n${eventDetails.description || ''}\n\nTune in to join us!`;

      await Share.share({
        message,
        title: eventDetails.title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const typeColors = getEventTypeColor(eventDetails.event_type);

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
        <Text style={styles.headerTitle}>Event Details</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
          <Text style={styles.shareButtonText}>⬆️</Text>
        </TouchableOpacity>
      </LinearGradient>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.primary[600]} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Event Type Banner */}
          <View
            style={[
              styles.typeBanner,
              { backgroundColor: typeColors.bg },
            ]}
          >
            <Text style={styles.typeEmoji}>{getEventTypeEmoji(eventDetails.event_type)}</Text>
            <View style={styles.typeContent}>
              <Text
                style={[
                  styles.typeLabel,
                  { color: typeColors.text },
                ]}
              >
                {eventDetails.event_type.charAt(0).toUpperCase() +
                  eventDetails.event_type.slice(1)}
              </Text>
            </View>
          </View>

          {/* Title */}
          <View style={styles.section}>
            <Text style={styles.title}>{eventDetails.title}</Text>
          </View>

          {/* Date & Time */}
          <View style={styles.section}>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>📅</Text>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Date</Text>
                  <Text style={styles.infoValue}>
                    {formatDate(eventDetails.event_date)}
                  </Text>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>🕐</Text>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Time</Text>
                  <Text style={styles.infoValue}>
                    {formatTime(eventDetails.event_date)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Description */}
          {eventDetails.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📝 Description</Text>
              <View style={styles.descriptionCard}>
                <Text style={styles.descriptionText}>{eventDetails.description}</Text>
              </View>
            </View>
          )}

          {/* Notes */}
          {eventDetails.notes && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📌 Notes</Text>
              <View style={styles.notesCard}>
                <Text style={styles.notesText}>{eventDetails.notes}</Text>
              </View>
            </View>
          )}

          {/* Creator */}
          {eventDetails.created_by && (
            <View style={styles.section}>
              <View style={styles.createdByCard}>
                <Text style={styles.createdByLabel}>Event created by</Text>
                <Text style={styles.createdByName}>{eventDetails.created_by}</Text>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
              <Text style={styles.actionButtonIcon}>📤</Text>
              <Text style={styles.actionButtonText}>Share Event</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                // Add to calendar functionality
                Alert.alert(
                  'Add to Calendar',
                  'This event has been added to your device calendar.'
                );
              }}
              style={[styles.actionButton, { marginLeft: 12 }]}
            >
              <Text style={styles.actionButtonIcon}>➕</Text>
              <Text style={styles.actionButtonText}>Add to Calendar</Text>
            </TouchableOpacity>
          </View>

          {/* Footer Info */}
          <View style={styles.footerInfo}>
            <Text style={styles.footerText}>
              💡 You'll receive daily reminders for this event starting 3 months before the date.
            </Text>
          </View>
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
    shareButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    shareButtonText: {
      fontSize: 20,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    typeBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 12,
      marginBottom: 16,
    },
    typeEmoji: {
      fontSize: 28,
      marginRight: 12,
    },
    typeContent: {
      flex: 1,
    },
    typeLabel: {
      fontSize: 14,
      fontWeight: '600',
    },
    section: {
      marginBottom: 16,
    },
    title: {
      fontSize: 26,
      fontWeight: '800',
      color: colors.gray[800],
      lineHeight: 32,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.gray[800],
      marginBottom: 8,
    },
    infoCard: {
      backgroundColor: colors.white,
      borderRadius: 12,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    infoIcon: {
      fontSize: 24,
      marginRight: 12,
    },
    infoTextContainer: {
      flex: 1,
    },
    infoLabel: {
      fontSize: 12,
      color: colors.gray[600],
      fontWeight: '500',
      marginBottom: 2,
    },
    infoValue: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.gray[800],
    },
    divider: {
      height: 1,
      backgroundColor: colors.gray[200],
    },
    descriptionCard: {
      backgroundColor: colors.white,
      borderRadius: 12,
      padding: 16,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary[600],
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    descriptionText: {
      fontSize: 14,
      color: colors.gray[700],
      lineHeight: 22,
    },
    notesCard: {
      backgroundColor: colors.yellow[50],
      borderRadius: 12,
      padding: 16,
      borderLeftWidth: 4,
      borderLeftColor: colors.yellow[500],
    },
    notesText: {
      fontSize: 14,
      color: colors.gray[700],
      lineHeight: 22,
    },
    createdByCard: {
      backgroundColor: colors.white,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    createdByLabel: {
      fontSize: 12,
      color: colors.gray[600],
      fontWeight: '500',
      marginBottom: 4,
    },
    createdByName: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary[600],
    },
    actionSection: {
      flexDirection: 'row',
      marginVertical: 20,
    },
    actionButton: {
      flex: 1,
      backgroundColor: colors.primary[600],
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 3,
    },
    actionButtonIcon: {
      fontSize: 18,
      marginRight: 8,
    },
    actionButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.white,
    },
    footerInfo: {
      backgroundColor: colors.blue[50],
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginBottom: 24,
      borderLeftWidth: 4,
      borderLeftColor: colors.blue[500],
    },
    footerText: {
      fontSize: 13,
      color: colors.blue[700],
      lineHeight: 18,
    },
  });
