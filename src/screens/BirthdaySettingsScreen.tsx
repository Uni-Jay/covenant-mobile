import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../theme/colors';
import { calendarService } from '../services';

export default function BirthdaySettingsScreen({ navigation }: any) {
  const { colors: themeColors } = useTheme();
  const styles = createStyles(themeColors);
  const [showBirthday, setShowBirthday] = useState(true);
  const [notificationEmail, setNotificationEmail] = useState(true);
  const [notificationWhatsapp, setNotificationWhatsapp] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const settings = await calendarService.getBirthdaySettings();
      if (settings) {
        setShowBirthday(settings.show_birthday !== false);
        setNotificationEmail(settings.notification_email !== false);
        setNotificationWhatsapp(settings.notification_whatsapp !== false);
      }
    } catch (error: any) {
      console.error('Error loading settings:', error);
      Alert.alert('Error', 'Failed to load birthday settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowBirthdayChange = async (value: boolean) => {
    setShowBirthday(value);
    await saveSetting('show_birthday', value);
  };

  const handleNotificationEmailChange = async (value: boolean) => {
    setNotificationEmail(value);
    await saveSetting('notification_email', value);
  };

  const handleNotificationWhatsappChange = async (value: boolean) => {
    setNotificationWhatsapp(value);
    await saveSetting('notification_whatsapp', value);
  };

  const saveSetting = async (key: string, value: boolean) => {
    try {
      setIsSaving(true);
      const payload: Record<string, any> = {};
      payload[key] = value;
      await calendarService.updateBirthdaySettings(value);
      // In a real app, you'd want to update all settings at once
    } catch (error: any) {
      console.error(`Error saving ${key}:`, error);
      Alert.alert('Error', `Failed to save ${key}`);
      // Revert the change
      if (key === 'show_birthday') setShowBirthday(!value);
      if (key === 'notification_email') setNotificationEmail(!value);
      if (key === 'notification_whatsapp') setNotificationWhatsapp(!value);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[themeColors.primary[600], themeColors.primary[700]]}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Birthday Settings</Text>
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
        <Text style={styles.headerTitle}>Birthday Settings</Text>
        <View style={styles.backButton} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Visibility Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Privacy</Text>
          
          <View style={styles.settingCard}>
            <View style={styles.settingHeader}>
              <View style={styles.settingLabelContainer}>
                <Text style={styles.settingLabel}>Show My Birthday</Text>
                <Text style={styles.settingDescription}>
                  Allow others to see your birthday in the church calendar
                </Text>
              </View>
              <Switch
                value={showBirthday}
                onValueChange={handleShowBirthdayChange}
                disabled={isSaving}
                trackColor={{
                  false: themeColors.gray[300],
                  true: themeColors.primary[200],
                }}
                thumbColor={
                  showBirthday ? themeColors.primary[600] : themeColors.gray[500]
                }
              />
            </View>
            {!showBirthday && (
              <Text style={styles.hiddenNote}>
                🔒 Your birthday is hidden from the church calendar
              </Text>
            )}
          </View>
        </View>

        {/* Notification Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔔 Notifications</Text>
          
          <View style={styles.settingCard}>
            <View style={styles.settingHeader}>
              <View style={styles.settingLabelContainer}>
                <Text style={styles.settingLabel}>Email Notifications</Text>
                <Text style={styles.settingDescription}>
                  Receive birthday reminders via email
                </Text>
              </View>
              <Switch
                value={notificationEmail}
                onValueChange={handleNotificationEmailChange}
                disabled={isSaving}
                trackColor={{
                  false: themeColors.gray[300],
                  true: themeColors.primary[200],
                }}
                thumbColor={
                  notificationEmail ? themeColors.primary[600] : themeColors.gray[500]
                }
              />
            </View>
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingHeader}>
              <View style={styles.settingLabelContainer}>
                <Text style={styles.settingLabel}>WhatsApp Notifications</Text>
                <Text style={styles.settingDescription}>
                  Receive birthday greetings via WhatsApp
                </Text>
              </View>
              <Switch
                value={notificationWhatsapp}
                onValueChange={handleNotificationWhatsappChange}
                disabled={isSaving}
                trackColor={{
                  false: themeColors.gray[300],
                  true: themeColors.primary[200],
                }}
                thumbColor={
                  notificationWhatsapp ? themeColors.primary[600] : themeColors.gray[500]
                }
              />
            </View>
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ Information</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              🎂 <Text style={styles.infoBold}>Birthday Greetings</Text>
              {'\n'}You'll receive automatic birthday greetings at 6:00 AM on your birthday.
            </Text>
            <Text style={styles.infoText}>
              📨 <Text style={styles.infoBold}>Event Reminders</Text>
              {'\n'}Receive daily reminders for upcoming church events, services, and meetings.
            </Text>
            <Text style={styles.infoText}>
              📅 <Text style={styles.infoBold}>Calendar Events</Text>
              {'\n'}All events are shown in the calendar. Tap on any event for more details.
            </Text>
          </View>
        </View>

        {/* Status Section */}
        <View style={styles.statusSection}>
          <View style={styles.statusCard}>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Birthday Visibility</Text>
              <Text
                style={[
                  styles.statusValue,
                  { color: showBirthday ? '#10B981' : '#6B7280' },
                ]}
              >
                {showBirthday ? 'Public' : 'Private'}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Email Notifications</Text>
              <Text
                style={[
                  styles.statusValue,
                  { color: notificationEmail ? '#10B981' : '#6B7280' },
                ]}
              >
                {notificationEmail ? 'On' : 'Off'}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>WhatsApp Notifications</Text>
              <Text
                style={[
                  styles.statusValue,
                  { color: notificationWhatsapp ? '#10B981' : '#6B7280' },
                ]}
              >
                {notificationWhatsapp ? 'On' : 'Off'}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footerNote}>
          <Text style={styles.footerText}>
            Your privacy settings are saved automatically when you toggle the switches.
          </Text>
        </View>
      </ScrollView>
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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.gray[800],
      marginBottom: 12,
    },
    settingCard: {
      backgroundColor: colors.white,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    settingHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    settingLabelContainer: {
      flex: 1,
      marginRight: 12,
    },
    settingLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.gray[800],
      marginBottom: 4,
    },
    settingDescription: {
      fontSize: 13,
      color: colors.gray[600],
      lineHeight: 18,
    },
    hiddenNote: {
      marginTop: 12,
      fontSize: 13,
      color: '#6B7280',
      fontStyle: 'italic',
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.gray[200],
    },
    infoCard: {
      backgroundColor: colors.primary[50],
      borderRadius: 12,
      padding: 16,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary[600],
    },
    infoText: {
      fontSize: 13,
      color: colors.gray[700],
      marginBottom: 12,
      lineHeight: 20,
    },
    statusSection: {
      marginTop: 12,
      marginBottom: 24,
    },
    statusCard: {
      backgroundColor: colors.white,
      borderRadius: 12,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    statusItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    statusLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.gray[700],
    },
    statusValue: {
      fontSize: 14,
      fontWeight: '700',
    },
    divider: {
      height: 1,
      backgroundColor: colors.gray[200],
    },
    footerNote: {
      marginBottom: 24,
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.blue[50],
      borderRadius: 8,
    },
    footerText: {
      fontSize: 12,
      color: colors.blue[700],
      lineHeight: 18,
      textAlign: 'center',
    },
  });
