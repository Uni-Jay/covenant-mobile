import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';

interface PrayerRequest {
  id: number;
  title: string;
  category: string;
  description: string;
  isUrgent: boolean;
  status: 'pending' | 'answered' | 'in-progress';
  createdAt: string;
  prayerCount: number;
}

export default function MyPrayersScreen({ navigation }: any) {
  const { user } = useAuth();
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'answered'>('all');

  useEffect(() => {
    loadMyPrayers();
  }, []);

  const loadMyPrayers = async () => {
    try {
      // TODO: Implement API endpoint to get user's prayer requests
      // For now, mock data
      const mockPrayers: PrayerRequest[] = [];
      setPrayers(mockPrayers);
    } catch (error) {
      console.error('Error loading prayers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadMyPrayers();
    setIsRefreshing(false);
  };

  const handleDelete = (prayerId: number) => {
    Alert.alert(
      'Delete Prayer Request',
      'Are you sure you want to delete this prayer request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Implement API call to delete prayer request
              Alert.alert('Success', 'Prayer request deleted');
              loadMyPrayers();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete prayer request');
            }
          },
        },
      ]
    );
  };

  const handleMarkAnswered = (prayerId: number) => {
    Alert.alert(
      'Mark as Answered',
      'Has God answered this prayer request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Answered!',
          onPress: async () => {
            try {
              // TODO: Implement API call to mark as answered
              Alert.alert('Praise God!', 'Prayer request marked as answered');
              loadMyPrayers();
            } catch (error) {
              Alert.alert('Error', 'Failed to update prayer request');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'answered':
        return colors.success;
      case 'in-progress':
        return colors.primary[600];
      default:
        return colors.gray[500];
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'answered':
        return '✓';
      case 'in-progress':
        return '⏳';
      default:
        return '🙏';
    }
  };

  const filteredPrayers = prayers.filter((prayer) => {
    if (filter === 'all') return true;
    return prayer.status === filter;
  });

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading your prayer requests...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All ({prayers.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'pending' && styles.filterTabActive]}
          onPress={() => setFilter('pending')}
        >
          <Text style={[styles.filterText, filter === 'pending' && styles.filterTextActive]}>
            Pending ({prayers.filter((p) => p.status === 'pending').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'answered' && styles.filterTabActive]}
          onPress={() => setFilter('answered')}
        >
          <Text style={[styles.filterText, filter === 'answered' && styles.filterTextActive]}>
            Answered ({prayers.filter((p) => p.status === 'answered').length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {filteredPrayers.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🙏</Text>
            <Text style={styles.emptyTitle}>
              {filter === 'all'
                ? 'No Prayer Requests'
                : `No ${filter.charAt(0).toUpperCase() + filter.slice(1)} Prayers`}
            </Text>
            <Text style={styles.emptyText}>
              {filter === 'all'
                ? "You haven't submitted any prayer requests yet."
                : `You don't have any ${filter} prayer requests.`}
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('Prayer')}
            >
              <Text style={styles.addButtonText}>Submit Prayer Request</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.prayersList}>
            {filteredPrayers.map((prayer) => (
              <View key={prayer.id} style={styles.prayerCard}>
                <View style={styles.prayerHeader}>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(prayer.status) },
                    ]}
                  >
                    <Text style={styles.statusIcon}>{getStatusIcon(prayer.status)}</Text>
                    <Text style={styles.statusText}>
                      {prayer.status.charAt(0).toUpperCase() + prayer.status.slice(1)}
                    </Text>
                  </View>
                  {prayer.isUrgent && (
                    <View style={styles.urgentBadge}>
                      <Text style={styles.urgentText}>🔥 Urgent</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.prayerTitle}>{prayer.title}</Text>
                <Text style={styles.prayerCategory}>📂 {prayer.category}</Text>
                <Text style={styles.prayerDescription} numberOfLines={3}>
                  {prayer.description}
                </Text>

                <View style={styles.prayerMeta}>
                  <Text style={styles.metaText}>
                    🙏 {prayer.prayerCount} people praying
                  </Text>
                  <Text style={styles.metaText}>
                    {new Date(prayer.createdAt).toLocaleDateString()}
                  </Text>
                </View>

                <View style={styles.actionButtons}>
                  {prayer.status !== 'answered' && (
                    <TouchableOpacity
                      style={styles.answeredButton}
                      onPress={() => handleMarkAnswered(prayer.id)}
                    >
                      <Text style={styles.answeredButtonText}>Mark Answered</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(prayer.id)}
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    color: colors.gray[600],
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  filterTab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  filterTabActive: {
    borderBottomColor: colors.primary[600],
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[600],
  },
  filterTextActive: {
    color: colors.primary[600],
  },
  content: {
    flex: 1,
  },
  emptyState: {
    padding: 48,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: colors.gray[600],
    textAlign: 'center',
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: colors.primary[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  addButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  prayersList: {
    padding: 16,
  },
  prayerCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.primary[100],
    elevation: 2,
    shadowColor: colors.primary[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  prayerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  statusIcon: {
    fontSize: 12,
    color: colors.white,
  },
  statusText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  urgentBadge: {
    backgroundColor: colors.secondary[100],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  urgentText: {
    color: colors.secondary[700],
    fontSize: 11,
    fontWeight: 'bold',
  },
  prayerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 8,
  },
  prayerCategory: {
    fontSize: 14,
    color: colors.primary[700],
    marginBottom: 8,
  },
  prayerDescription: {
    fontSize: 14,
    color: colors.gray[700],
    lineHeight: 20,
    marginBottom: 12,
  },
  prayerMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  metaText: {
    fontSize: 12,
    color: colors.gray[600],
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  answeredButton: {
    flex: 1,
    backgroundColor: colors.primary[600],
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  answeredButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.secondary[600],
  },
  deleteButtonText: {
    color: colors.secondary[600],
    fontSize: 14,
    fontWeight: 'bold',
  },
});
