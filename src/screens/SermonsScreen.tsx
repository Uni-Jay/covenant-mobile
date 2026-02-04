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
} from 'react-native';
import { sermonsService } from '../services';
import { Sermon } from '../types';
import { colors } from '../theme/colors';

export default function SermonsScreen({ navigation }: any) {
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
            <Text
              style={[
                styles.filterText,
                filter === category && styles.filterTextActive,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Sermons List */}
      <ScrollView
        style={styles.sermonsList}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {filteredSermons.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No sermons found</Text>
          </View>
        ) : (
          filteredSermons.map((sermon) => (
            <TouchableOpacity
              key={sermon.id}
              style={styles.sermonCard}
              onPress={() => navigation.navigate('SermonDetail', { sermonId: sermon.id })}
            >
              <Image
                source={{ uri: sermon.thumbnailUrl ? `http://localhost:5000${sermon.thumbnailUrl}` : 'https://via.placeholder.com/120' }}
                style={styles.thumbnail}
              />
              <View style={styles.sermonContent}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{sermon.category}</Text>
                </View>
                <Text style={styles.sermonTitle}>{sermon.title}</Text>
                <Text style={styles.preacher}>By {sermon.preacher}</Text>
                <Text style={styles.date}>
                  {new Date(sermon.date).toLocaleDateString()}
                </Text>
                <View style={styles.mediaIcons}>
                  {sermon.videoUrl && <Text style={styles.mediaIcon}>📹</Text>}
                  {sermon.audioUrl && <Text style={styles.mediaIcon}>🎵</Text>}
                  {sermon.pdfUrl && <Text style={styles.mediaIcon}>📄</Text>}
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filterContainer: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  filterContent: {
    padding: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: colors.primary[600],
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
  },
  filterTextActive: {
    color: colors.white,
  },
  sermonsList: {
    flex: 1,
  },
  sermonCard: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.primary[100],
    shadowColor: colors.primary[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  thumbnail: {
    width: 120,
    height: 120,
    backgroundColor: colors.gray[200],
  },
  sermonContent: {
    flex: 1,
    padding: 12,
  },
  categoryBadge: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  categoryText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  sermonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 4,
  },
  preacher: {
    fontSize: 14,
    color: colors.primary[700],
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: colors.gray[600],
    marginBottom: 8,
  },
  mediaIcons: {
    flexDirection: 'row',
    gap: 8,
  },
  mediaIcon: {
    fontSize: 18,
  },
  emptyState: {
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.gray[500],
  },
});
