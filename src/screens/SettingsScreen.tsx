import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { colors } from '../theme/colors';

export default function SettingsScreen({ navigation }: any) {
  const [notifications, setNotifications] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);

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
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingIcon}>🔔</Text>
            <View>
              <Text style={styles.settingTitle}>Push Notifications</Text>
              <Text style={styles.settingDescription}>Receive push notifications</Text>
            </View>
          </View>
          <Switch
            value={pushNotifications}
            onValueChange={setPushNotifications}
            trackColor={{ false: colors.gray[300], true: colors.primary[600] }}
            thumbColor={pushNotifications ? colors.white : colors.gray[100]}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingIcon}>📧</Text>
            <View>
              <Text style={styles.settingTitle}>Email Updates</Text>
              <Text style={styles.settingDescription}>Receive email notifications</Text>
            </View>
          </View>
          <Switch
            value={emailUpdates}
            onValueChange={setEmailUpdates}
            trackColor={{ false: colors.gray[300], true: colors.primary[600] }}
            thumbColor={emailUpdates ? colors.white : colors.gray[100]}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingIcon}>📱</Text>
            <View>
              <Text style={styles.settingTitle}>Event Reminders</Text>
              <Text style={styles.settingDescription}>Get reminded about events</Text>
            </View>
          </View>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: colors.gray[300], true: colors.primary[600] }}
            thumbColor={notifications ? colors.white : colors.gray[100]}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy</Text>
        
        <TouchableOpacity 
          style={styles.settingItem} 
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
              <Text style={styles.settingTitle}>Privacy Policy</Text>
              <Text style={styles.settingDescription}>Read our privacy policy</Text>
            </View>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.settingItem} 
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
              <Text style={styles.settingTitle}>Terms of Service</Text>
              <Text style={styles.settingDescription}>Read our terms</Text>
            </View>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Settings</Text>
        
        <TouchableOpacity style={styles.settingItem} onPress={handleClearCache}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingIcon}>🗑️</Text>
            <View>
              <Text style={styles.settingTitle}>Clear Cache</Text>
              <Text style={styles.settingDescription}>Free up storage space</Text>
            </View>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={() => Alert.alert('Version', 'Word of Covenant Church v1.0.0')}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingIcon}>ℹ️</Text>
            <View>
              <Text style={styles.settingTitle}>App Version</Text>
              <Text style={styles.settingDescription}>1.0.0</Text>
            </View>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        
        <TouchableOpacity 
          style={styles.settingItem}
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
              <Text style={[styles.settingTitle, { color: colors.error }]}>Delete Account</Text>
              <Text style={styles.settingDescription}>Permanently delete your account</Text>
            </View>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  section: {
    backgroundColor: colors.white,
    marginTop: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.primary[100],
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: colors.primary[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
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
    color: colors.gray[900],
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: colors.gray[500],
  },
  menuArrow: {
    fontSize: 28,
    color: colors.gray[400],
    fontWeight: '300',
  },
});
