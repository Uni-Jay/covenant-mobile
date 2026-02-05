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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { sermonsService } from '../services';
import { Sermon } from '../types';
import { colors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function SermonsScreen({ navigation }: any) {
  const { colors: themeColors } = useTheme();
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('All');

  useEffect(() => {
    loadSermons();
  }, []);

  const loadSermons = async () => {
    try {
      const data = await sermonsService.getAll();
      setSermons(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load sermons');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadSermons();
    setIsRefreshing(false);
  };

  const categories = ['All', 'Sunday Service', 'Bible Study', 'Special', 'Conference'];

  const filteredSermons = filter === 'All'
    ? sermons
    : sermons.filter(sermon => sermon.category === filter);

  return (
    <View style={styles.container}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={[colors.primary[600], colors.primary[700]]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>📖 Sermons</Text>
        <Text style={styles.headerSubtitle}>Feed your spirit with the Word</Text>
      </LinearGradient>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.filterButton,
              filter === category && styles.filterButtonActive,
            ]}
            onPress={() => setFilter(category)}
          >
            <LinearGradient
              colors={filter === category 
                ? [colors.primary[600], colors.primary[700]] 
                : ['transparent', 'transparent']}
              style={styles.filterGradient}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === category && styles.filterTextActive,
                ]}
              >
                {category}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Sermons List */}
      <ScrollView
        style={styles.sermonsList}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[colors.primary[600]]} />
        }
      >
        {filteredSermons.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📚</Text>
            <Text style={styles.emptyText}>No sermons available</Text>
            <Text style={styles.emptySubtext}>Check back soon for new messages</Text>
          </View>
        ) : (
          filteredSermons.map((sermon, index) => (
            <TouchableOpacity
              key={sermon.id}
              style={styles.sermonCard}
              onPress={() => navigation.navigate('SermonDetail', { sermonId: sermon.id })}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0)']}
                style={styles.cardGradient}
              >
                <View style={styles.thumbnailContainer}>
                  <Image
                    source={{ uri: sermon.thumbnailUrl ? `http://localhost:5000${sermon.thumbnailUrl}` : 'https://via.placeholder.com/350x200' }}
                    style={styles.thumbnail}
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.7)']}
                    style={styles.thumbnailOverlay}
                  >
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>{sermon.category}</Text>
                    </View>
                  </LinearGradient>
                </View>
                
                <View style={styles.sermonContent}>
                  <Text style={styles.sermonTitle} numberOfLines={2}>{sermon.title}</Text>
                  
                  <View style={styles.metaRow}>
                    <View style={styles.preacherContainer}>
                      <Text style={styles.preacherIcon}>👤</Text>
                      <Text style={styles.preacher}>{sermon.preacher}</Text>
                    </View>
                  </View>

                  <View style={styles.bottomRow}>
                    <View style={styles.dateContainer}>
                      <Text style={styles.dateIcon}>📅</Text>
                      <Text style={styles.date}>
                        {new Date(sermon.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </Text>
                    </View>

                    <View style={styles.mediaIcons}>
                      {sermon.videoUrl && (
                        <View style={styles.mediaIconBadge}>
                          <Text style={styles.mediaIcon}>📹</Text>
                        </View>
                      )}
                      {sermon.audioUrl && (
                        <View style={styles.mediaIconBadge}>
                          <Text style={styles.mediaIcon}>🎵</Text>
                        </View>
                      )}
                      {sermon.pdfUrl && (
                        <View style={styles.mediaIconBadge}>
                          <Text style={styles.mediaIcon}>📄</Text>
                        </View>
                      )}
                    </View>
                  </View>
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
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  filterButton: {
    marginRight: 10,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: colors.primary[600],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filterGradient: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
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
  sermonsList: {
    flex: 1,
    padding: 8,
  },
  sermonCard: {
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
    height: 200,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.gray[200],
  },
  thumbnailOverlay: {
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
  sermonContent: {
    padding: 16,
  },
  sermonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 12,
    lineHeight: 24,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  preacherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  preacherIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  preacher: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[700],
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  date: {
    fontSize: 13,
    color: colors.gray[600],
    fontWeight: '500',
  },
  mediaIcons: {
    flexDirection: 'row',
    gap: 6,
  },
  mediaIconBadge: {
    backgroundColor: colors.gray[100],
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaIcon: {
    fontSize: 16,
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
