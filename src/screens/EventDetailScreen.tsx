import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { eventsService } from '../services';
import { Event } from '../types';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../theme/colors';
import { getServerUrl } from '../config/network.config';

const { width } = Dimensions.get('window');

const getImageUrl = (imageUrl: string) => {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('http')) return imageUrl;
  return `${getServerUrl()}${imageUrl}`;
};

export default function EventDetailScreen({ route, navigation }: any) {
  const { colors: themeColors } = useTheme();
  const styles = createStyles(themeColors);
  const { eventId } = route.params;
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const loadEvent = async () => {
    try {
      const data = await eventsService.getAll();
      const foundEvent = data.find((e: Event) => e.id === eventId);
      if (foundEvent) {
        setEvent(foundEvent);
      } else {
        Alert.alert('Error', 'Event not found');
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load event details');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!event) return;
    
    setIsRegistering(true);
    try {
      await eventsService.register(event.id);
      Alert.alert('Success', 'You have successfully registered for this event!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to register for event';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsRegistering(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
      </View>
    );
  }

  if (!event) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <Image
          source={{ uri: getImageUrl(event.imageUrl) }}
          style={styles.headerImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.imageOverlay}
        >
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{event.category}</Text>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <Text style={styles.title}>{event.title}</Text>
          
          <View style={styles.metaContainer}>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Text style={styles.metaIcon}>📅</Text>
                <View style={styles.metaTextContainer}>
                  <Text style={styles.metaLabel}>Date</Text>
                  <Text style={styles.metaValue}>
                    {new Date(event.date).toLocaleDateString('en-US', { 
                      weekday: 'long',
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Text style={styles.metaIcon}>🕐</Text>
                <View style={styles.metaTextContainer}>
                  <Text style={styles.metaLabel}>Time</Text>
                  <Text style={styles.metaValue}>{event.time}</Text>
                </View>
              </View>
            </View>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Text style={styles.metaIcon}>📍</Text>
                <View style={styles.metaTextContainer}>
                  <Text style={styles.metaLabel}>Location</Text>
                  <Text style={styles.metaValue}>{event.location}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About This Event</Text>
            <Text style={styles.description}>{event.description}</Text>
          </View>

          {event.speaker && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Speaker</Text>
              <Text style={styles.speaker}>{event.speaker}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.registerButton}
          onPress={handleRegister}
          disabled={isRegistering}
        >
          <LinearGradient
            colors={[colors.secondary[600], colors.secondary[700]]}
            style={styles.registerGradient}
          >
            {isRegistering ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.registerButtonText}>Register Now</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
  },
  headerImage: {
    width: width,
    height: 300,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    justifyContent: 'flex-end',
    padding: 16,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary[600],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 20,
  },
  metaContainer: {
    marginBottom: 24,
  },
  metaRow: {
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  metaTextContainer: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 12,
    color: colors.gray[600],
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 16,
    color: colors.gray[900],
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.gray[700],
  },
  speaker: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary[600],
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  registerButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  registerGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
