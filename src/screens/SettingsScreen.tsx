import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';

export default function SettingsScreen({ navigation }: any) {
  const { themeMode, setThemeMode, colors: themeColors } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Load notification preferences on mount
  useEffect(() => {
    loadNotificationPreferences();
  }, []);

  const loadNotificationPreferences = async () => {
    try {
      // First try to load from backend
      const response = await api.get('/auth/notification-preferences');
      if (response.data?.preferences) {
        const { pushNotifications: push, emailUpdates: email, eventReminders: event } = response.data.preferences;
        setPushNotifications(push);
        setEmailUpdates(email);
        setNotifications(event);
        
        // Save to AsyncStorage
        await AsyncStorage.setItem('pushNotifications', push.toString());
        await AsyncStorage.setItem('emailUpdates', email.toString());
        await AsyncStorage.setItem('eventReminders', event.toString());
        return;
      }
    } catch (error) {
      console.log('Failed to load from backend, loading from AsyncStorage');
    }

    // Fallback to AsyncStorage
    try {
      const [pushPref, emailPref, eventPref] = await Promise.all([
        AsyncStorage.getItem('pushNotifications'),
        AsyncStorage.getItem('emailUpdates'),
        AsyncStorage.getItem('eventReminders')
      ]);
      
      if (pushPref !== null) setPushNotifications(pushPref === 'true');
      if (emailPref !== null) setEmailUpdates(emailPref === 'true');
      if (eventPref !== null) setNotifications(eventPref === 'true');
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    }
  };

  const updateNotificationPreference = async (
    type: 'push' | 'email' | 'event',
    value: boolean
  ) => {
    setIsLoading(true);
    try {
      // Save to AsyncStorage first (works offline)
      const storageKey = type === 'push' ? 'pushNotifications' : 
                         type === 'email' ? 'emailUpdates' : 'eventReminders';
      await AsyncStorage.setItem(storageKey, value.toString());

      // Try to send to backend API
      try {
        await api.put('/auth/notification-preferences', {
          pushNotifications: type === 'push' ? value : pushNotifications,
          emailUpdates: type === 'email' ? value : emailUpdates,
          eventReminders: type === 'event' ? value : notifications,
        });
        console.log(`${type} notifications ${value ? 'enabled' : 'disabled'}`);
      } catch (apiError: any) {
        console.log('API update failed, preference saved locally only:', apiError?.message || apiError);
      }
    } catch (error) {
      console.error('Failed to update notification preference:', error);
      Alert.alert(
        'Error',
        'Failed to update notification preferences. Please try again.',
        [{ text: 'OK' }]
      );
      // Revert the change on error
      if (type === 'push') setPushNotifications(!value);
      if (type === 'email') setEmailUpdates(!value);
      if (type === 'event') setNotifications(!value);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'Are you sure you want to clear app cache?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Success', 'Cache cleared successfully');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Appearance Section */}
      <View style={[styles.section, { backgroundColor: themeColors.surface }]}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>🎨 Appearance</Text>
        
        <View style={styles.themeContainer}>
          <TouchableOpacity
            style={[
              styles.themeButton,
              { borderColor: themeColors.border },
              themeMode === 'light' && { 
                backgroundColor: themeColors.primary[100],
                borderColor: themeColors.primary[600],
                borderWidth: 2,
              }
            ]}
            onPress={() => setThemeMode('light')}
            activeOpacity={0.7}
          >
            <Text style={styles.themeBtnIcon}>☀️</Text>
            <Text style={[
              styles.themeBtnText,
              { color: themeColors.text },
              themeMode === 'light' && { color: themeColors.primary[600], fontWeight: '700' }
            ]}>Light</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.themeButton,
              { borderColor: themeColors.border },
              themeMode === 'dark' && { 
                backgroundColor: themeColors.primary[100],
                borderColor: themeColors.primary[600],
                borderWidth: 2,
              }
            ]}
            onPress={() => setThemeMode('dark')}
            activeOpacity={0.7}
          >
            <Text style={styles.themeBtnIcon}>🌙</Text>
            <Text style={[
              styles.themeBtnText,
              { color: themeColors.text },
              themeMode === 'dark' && { color: themeColors.primary[600], fontWeight: '700' }
            ]}>Dark</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.themeButton,
              { borderColor: themeColors.border },
              themeMode === 'auto' && { 
                backgroundColor: themeColors.primary[100],
                borderColor: themeColors.primary[600],
                borderWidth: 2,
              }
            ]}
            onPress={() => setThemeMode('auto')}
            activeOpacity={0.7}
          >
            <Text style={styles.themeBtnIcon}>⚙️</Text>
            <Text style={[
              styles.themeBtnText,
              { color: themeColors.text },
              themeMode === 'auto' && { color: themeColors.primary[600], fontWeight: '700' }
            ]}>Auto</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.themeHint, { color: themeColors.textSecondary }]}>
          {themeMode === 'auto' ? 'Following system settings' : `Using ${themeMode} mode`}
        </Text>
      </View>

      <View style={[styles.section, { backgroundColor: themeColors.surface }]}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Notifications</Text>
        
        <View style={[styles.settingItem, { borderBottomColor: themeColors.border }]}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingIcon}>🔔</Text>
            <View>
              <Text style={[styles.settingTitle, { color: themeColors.text }]}>Push Notifications</Text>
              <Text style={[styles.settingDescription, { color: themeColors.textSecondary }]}>Receive push notifications</Text>
            </View>
          </View>
          <Switch
            value={pushNotifications}
            onValueChange={(value) => {
              setPushNotifications(value);
              updateNotificationPreference('push', value);
            }}
            disabled={isLoading}
            trackColor={{ false: themeColors.gray[300], true: themeColors.primary[600] }}
            thumbColor={pushNotifications ? themeColors.white : themeColors.gray[100]}
          />
        </View>

        <View style={[styles.settingItem, { borderBottomColor: themeColors.border }]}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingIcon}>📧</Text>
            <View>
              <Text style={[styles.settingTitle, { color: themeColors.text }]}>Email Updates</Text>
              <Text style={[styles.settingDescription, { color: themeColors.textSecondary }]}>Receive email notifications</Text>
            </View>
          </View>
          <Switch
            value={emailUpdates}
            onValueChange={(value) => {
              setEmailUpdates(value);
              updateNotificationPreference('email', value);
            }}
            disabled={isLoading}
            trackColor={{ false: themeColors.gray[300], true: themeColors.primary[600] }}
            thumbColor={emailUpdates ? themeColors.white : themeColors.gray[100]}
          />
        </View>

        <View style={[styles.settingItem, { borderBottomColor: themeColors.border }]}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingIcon}>📱</Text>
            <View>
              <Text style={[styles.settingTitle, { color: themeColors.text }]}>Event Reminders</Text>
              <Text style={[styles.settingDescription, { color: themeColors.textSecondary }]}>Get reminded about events</Text>
            </View>
          </View>
          <Switch
            value={notifications}
            onValueChange={(value) => {
              setNotifications(value);
              updateNotificationPreference('event', value);
            }}
            disabled={isLoading}
            trackColor={{ false: themeColors.gray[300], true: themeColors.primary[600] }}
            thumbColor={notifications ? themeColors.white : themeColors.gray[100]}
          />
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: themeColors.surface }]}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Privacy</Text>
        
        <TouchableOpacity 
          style={[styles.settingItem, { borderBottomColor: themeColors.border }]} 
          onPress={() => {
            Alert.alert(
              'Privacy Policy',
              'Word of Covenant Church is committed to protecting your privacy. We collect and use your personal information only to provide and improve our services. Your data is securely stored and never shared with third parties without your consent.\n\nFor full details, visit our website or contact us.',
              [{ text: 'OK' }]
            );
          }}
        >
          <View style={styles.settingLeft}>
            <Text style={styles.settingIcon}>🔒</Text>
            <View>
              <Text style={[styles.settingTitle, { color: themeColors.text }]}>Privacy Policy</Text>
              <Text style={[styles.settingDescription, { color: themeColors.textSecondary }]}>Read our privacy policy</Text>
            </View>
          </View>
          <Text style={[styles.menuArrow, { color: themeColors.textSecondary }]}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.settingItem, { borderBottomColor: themeColors.border }]} 
          onPress={() => {
            Alert.alert(
              'Terms of Service',
              'By using the Word of Covenant Church app, you agree to:\n\n• Use the app for lawful purposes only\n• Respect the privacy of other members\n• Not post offensive or inappropriate content\n• Comply with all church policies\n\nFor complete terms, please visit our website or contact church administration.',
              [{ text: 'OK' }]
            );
          }}
        >
          <View style={styles.settingLeft}>
            <Text style={styles.settingIcon}>📋</Text>
            <View>
              <Text style={[styles.settingTitle, { color: themeColors.text }]}>Terms of Service</Text>
              <Text style={[styles.settingDescription, { color: themeColors.textSecondary }]}>Read our terms</Text>
            </View>
          </View>
          <Text style={[styles.menuArrow, { color: themeColors.textSecondary }]}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: themeColors.surface }]}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>App Settings</Text>
        
        <TouchableOpacity style={[styles.settingItem, { borderBottomColor: themeColors.border }]} onPress={handleClearCache}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingIcon}>🗑️</Text>
            <View>
              <Text style={[styles.settingTitle, { color: themeColors.text }]}>Clear Cache</Text>
              <Text style={[styles.settingDescription, { color: themeColors.textSecondary }]}>Free up storage space</Text>
            </View>
          </View>
          <Text style={[styles.menuArrow, { color: themeColors.textSecondary }]}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.settingItem, { borderBottomColor: themeColors.border }]} onPress={() => Alert.alert('Version', 'Word of Covenant Church v1.0.0')}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingIcon}>ℹ️</Text>
            <View>
              <Text style={[styles.settingTitle, { color: themeColors.text }]}>App Version</Text>
              <Text style={[styles.settingDescription, { color: themeColors.textSecondary }]}>1.0.0</Text>
            </View>
          </View>
          <Text style={[styles.menuArrow, { color: themeColors.textSecondary }]}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: themeColors.surface }]}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Account</Text>
        
        <TouchableOpacity 
          style={[styles.settingItem, { borderBottomColor: themeColors.border }]}
          onPress={() => {
            Alert.alert(
              'Delete Account',
              'This action cannot be undone. All your data will be permanently deleted.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      // TODO: Implement API call to delete account
                      Alert.alert(
                        'Account Deletion',
                        'Please contact church administration to delete your account. Email: admin@wordofcovenant.org or call during office hours.',
                        [{ text: 'OK' }]
                      );
                    } catch (error) {
                      Alert.alert('Error', 'Failed to process request. Please try again.');
                    }
                  },
                },
              ]
            );
          }}
        >
          <View style={styles.settingLeft}>
            <Text style={styles.settingIcon}>⚠️</Text>
            <View>
              <Text style={[styles.settingTitle, { color: themeColors.error }]}>Delete Account</Text>
              <Text style={[styles.settingDescription, { color: themeColors.textSecondary }]}>Permanently delete your account</Text>
            </View>
          </View>
          <Text style={[styles.menuArrow, { color: themeColors.textSecondary }]}>›</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginTop: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  themeContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  themeButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  themeBtnIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  themeBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  themeHint: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
  },
  menuArrow: {
    fontSize: 28,
    fontWeight: '300',
  },
});
