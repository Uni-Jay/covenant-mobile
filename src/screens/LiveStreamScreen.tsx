import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { colors } from '../theme/colors';

export default function LiveStreamScreen() {
  const [isLive, setIsLive] = useState(false);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Live Stream</Text>
        <Text style={styles.headerSubtitle}>
          Join us for worship and the Word
        </Text>
      </View>

      {/* Live Status */}
      <View style={styles.statusCard}>
        {isLive ? (
          <>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE NOW</Text>
            </View>
            <Text style={styles.statusTitle}>Sunday Service</Text>
            <Text style={styles.statusDescription}>
              Join us as we worship together and hear the Word of God
            </Text>
            <TouchableOpacity style={styles.joinButton}>
              <Text style={styles.joinButtonText}>Join Stream</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.offlineIcon}>📺</Text>
            <Text style={styles.statusTitle}>No Live Stream</Text>
            <Text style={styles.statusDescription}>
              We're not currently streaming. Check back during our service times.
            </Text>
          </>
        )}
      </View>

      {/* Service Schedule */}
      <View style={styles.scheduleCard}>
        <Text style={styles.scheduleTitle}>Upcoming Services</Text>
        
        <View style={styles.scheduleItem}>
          <View style={styles.scheduleDay}>
            <Text style={styles.dayText}>SUN</Text>
            <Text style={styles.dateText}>26</Text>
          </View>
          <View style={styles.scheduleInfo}>
            <Text style={styles.serviceName}>Sunday Service</Text>
            <Text style={styles.serviceTime}>9:00 AM - 11:00 AM</Text>
          </View>
          <TouchableOpacity style={styles.remindButton}>
            <Text style={styles.remindText}>🔔</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.scheduleItem}>
          <View style={styles.scheduleDay}>
            <Text style={styles.dayText}>TUE</Text>
            <Text style={styles.dateText}>28</Text>
          </View>
          <View style={styles.scheduleInfo}>
            <Text style={styles.serviceName}>Prayer Hour</Text>
            <Text style={styles.serviceTime}>6:00 PM - 7:00 PM</Text>
          </View>
          <TouchableOpacity style={styles.remindButton}>
            <Text style={styles.remindText}>🔔</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.scheduleItem}>
          <View style={styles.scheduleDay}>
            <Text style={styles.dayText}>THU</Text>
            <Text style={styles.dateText}>30</Text>
          </View>
          <View style={styles.scheduleInfo}>
            <Text style={styles.serviceName}>Bible Study</Text>
            <Text style={styles.serviceTime}>6:00 PM - 7:00 PM</Text>
          </View>
          <TouchableOpacity style={styles.remindButton}>
            <Text style={styles.remindText}>🔔</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Past Broadcasts */}
      <View style={styles.pastStreams}>
        <Text style={styles.pastTitle}>Past Broadcasts</Text>
        <TouchableOpacity
          style={styles.pastItem}
          onPress={() => {
            Alert.alert(
              'Sunday Service - Jan 19, 2026',
              'Video recordings will be available once our streaming infrastructure is set up. Check back soon or subscribe to our YouTube channel for past services.',
              [{ text: 'OK' }]
            );
          }}
        >
          <View style={styles.pastThumbnail}>
            <Text style={styles.playIcon}>▶️</Text>
          </View>
          <View style={styles.pastInfo}>
            <Text style={styles.pastName}>Sunday Service</Text>
            <Text style={styles.pastDate}>Jan 19, 2026</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.pastItem}
          onPress={() => {
            Alert.alert(
              'Bible Study - Jan 16, 2026',
              'Video recordings will be available once our streaming infrastructure is set up. Check back soon or subscribe to our YouTube channel for past services.',
              [{ text: 'OK' }]
            );
          }}
        >
          <View style={styles.pastThumbnail}>
            <Text style={styles.playIcon}>▶️</Text>
          </View>
          <View style={styles.pastInfo}>
            <Text style={styles.pastName}>Bible Study</Text>
            <Text style={styles.pastDate}>Jan 16, 2026</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.infoTitle}>About Live Stream</Text>
        <Text style={styles.infoText}>
          Our live streams allow you to join our services from anywhere in the world. You can
          participate in worship, hear the Word, and fellowship with the church family online.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary[800],
    padding: 24,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.gold[500],
  },
  statusCard: {
    backgroundColor: colors.white,
    margin: 16,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.white,
    marginRight: 8,
  },
  liveText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  offlineIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 8,
  },
  statusDescription: {
    fontSize: 16,
    color: colors.gray[600],
    textAlign: 'center',
    marginBottom: 16,
  },
  joinButton: {
    backgroundColor: colors.secondary[600],
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 3,
    shadowColor: colors.secondary[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  joinButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  scheduleCard: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  scheduleTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 16,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  scheduleDay: {
    width: 60,
    alignItems: 'center',
    backgroundColor: colors.primary[600],
    borderRadius: 8,
    padding: 8,
  },
  dayText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 24,
    color: colors.white,
    fontWeight: 'bold',
  },
  scheduleInfo: {
    flex: 1,
    marginLeft: 12,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 4,
  },
  serviceTime: {
    fontSize: 14,
    color: colors.gray[600],
  },
  remindButton: {
    padding: 8,
  },
  remindText: {
    fontSize: 24,
  },
  pastStreams: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  pastTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 16,
  },
  pastItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  pastThumbnail: {
    width: 80,
    height: 60,
    backgroundColor: colors.gray[300],
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    fontSize: 24,
  },
  pastInfo: {
    marginLeft: 12,
    justifyContent: 'center',
  },
  pastName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 4,
  },
  pastDate: {
    fontSize: 14,
    color: colors.gray[600],
  },
  info: {
    backgroundColor: colors.white,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.gold[700],
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.gray[600],
    lineHeight: 20,
  },
});
