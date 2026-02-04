import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { firstTimerService } from '../services';
import { colors, primaryColor } from '../theme/colors';

const FirstTimersScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [firstTimers, setFirstTimers] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'converted' | 'active'>('all');

  useEffect(() => {
    loadFirstTimers();
  }, [filter]);

  const loadFirstTimers = async () => {
    try {
      const data = await firstTimerService.getAll();
      // Apply client-side filtering
      let filtered = data;
      if (filter === 'converted') {
        filtered = data.filter((ft: any) => ft.convertedToMember);
      } else if (filter === 'active') {
        filtered = data.filter((ft: any) => !ft.convertedToMember);
      }
      setFirstTimers(filtered);
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadFirstTimers();
  };

  const getStatusBadge = (item: any) => {
    if (item.convertedToMember) {
      return { text: 'Member ✓', color: '#10B981' };
    } else if (item.sundayServiceCount >= 6) {
      return { text: 'Ready', color: '#F59E0B' };
    } else {
      return { text: `${item.sundayServiceCount}/6`, color: '#6B7280' };
    }
  };

  const renderFirstTimer = ({ item }: any) => {
    const status = getStatusBadge(item);
    const daysSinceFirst = Math.floor(
      (new Date().getTime() - new Date(item.firstVisitDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('FirstTimerDetail', { firstTimer: item })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardInfo}>
            <Text style={styles.cardName}>
              {item.firstName} {item.lastName}
            </Text>
            <Text style={styles.cardDetail}>{item.email || 'No email'}</Text>
            <Text style={styles.cardDetail}>{item.phone || 'No phone'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
          </View>
        </View>

        <View style={styles.cardStats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{item.sundayServiceCount}</Text>
            <Text style={styles.statLabel}>Sunday Services</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{item.totalAttendance}</Text>
            <Text style={styles.statLabel}>Total Visits</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{daysSinceFirst}</Text>
            <Text style={styles.statLabel}>Days Since First</Text>
          </View>
        </View>

        {item.address && (
          <Text style={styles.cardAddress} numberOfLines={1}>
            📍 {item.address}
          </Text>
        )}

        <Text style={styles.cardDate}>
          First Visit: {new Date(item.firstVisitDate).toLocaleDateString()}
        </Text>

        {item.lastAttendanceDate && (
          <Text style={styles.cardDate}>
            Last Visit: {new Date(item.lastAttendanceDate).toLocaleDateString()}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>First-Timers</Text>
        <Text style={styles.headerSubtitle}>{firstTimers.length} total</Text>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'active' && styles.filterButtonActive]}
          onPress={() => setFilter('active')}
        >
          <Text style={[styles.filterText, filter === 'active' && styles.filterTextActive]}>
            Active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'converted' && styles.filterButtonActive]}
          onPress={() => setFilter('converted')}
        >
          <Text style={[styles.filterText, filter === 'converted' && styles.filterTextActive]}>
            Converted
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
        </View>
      ) : (
        <FlatList
          data={firstTimers}
          renderItem={renderFirstTimer}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No first-timers found</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    backgroundColor: primaryColor,
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E5E7EB',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterButtonActive: {
    backgroundColor: primaryColor,
    borderColor: primaryColor,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 15,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 5,
  },
  cardDetail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 10,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: primaryColor,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  cardAddress: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  cardDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
});

export default FirstTimersScreen;
