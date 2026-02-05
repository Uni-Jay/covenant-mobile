import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import api from '../services/api';

interface PrayerRequest {
  id: number;
  name: string;
  email: string;
  phone?: string;
  request: string;
  category: string;
  is_anonymous: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function PrayerManagementScreen() {
  const { user } = useAuth();
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [filteredPrayers, setFilteredPrayers] = useState<PrayerRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'ongoing' | 'answered'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Check if user is admin or media department
  const isAdminOrMedia = React.useMemo(() => {
    if (!user) return false;
    
    // Check role
    if (user.role && ['super_admin', 'admin', 'media_head', 'media'].includes(user.role)) {
      return true;
    }
    
    // Check departments
    if (user.departments) {
      const depts = Array.isArray(user.departments) ? user.departments : [];
      return depts.some((dept: any) => {
        const deptName = typeof dept === 'string' ? dept : dept.name || '';
        return deptName.toLowerCase().includes('media') || deptName.toLowerCase().includes('prayer');
      });
    }
    
    return false;
  }, [user]);

  useFocusEffect(
    React.useCallback(() => {
      loadPrayers();
    }, [])
  );

  useEffect(() => {
    filterPrayers();
  }, [prayers, selectedFilter, searchQuery]);

  const loadPrayers = async () => {
    try {
      const response = await api.get('/prayer-requests/all');
      setPrayers(response.data.requests || []);
    } catch (error: any) {
      console.error('Load prayers error:', error);
      if (error.response?.status === 403) {
        Alert.alert('Access Denied', 'You do not have permission to view prayer requests');
      } else {
        Alert.alert('Error', 'Failed to load prayer requests');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadPrayers();
    setIsRefreshing(false);
  };

  const filterPrayers = () => {
    let filtered = prayers;

    // Filter by status
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(p => p.status?.toLowerCase() === selectedFilter);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name?.toLowerCase().includes(query) ||
        p.email?.toLowerCase().includes(query) ||
        p.request?.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query)
      );
    }

    setFilteredPrayers(filtered);
  };

  const updateStatus = async (prayerId: number, newStatus: string) => {
    try {
      await api.patch(`/prayer-requests/${prayerId}`, { status: newStatus });
      Alert.alert('Success', `Prayer request marked as ${newStatus}`);
      loadPrayers();
    } catch (error) {
      console.error('Update status error:', error);
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const handleStatusChange = (prayer: PrayerRequest) => {
    Alert.alert(
      'Update Status',
      'Select new status for this prayer request',
      [
        {
          text: 'Pending',
          onPress: () => updateStatus(prayer.id, 'pending'),
        },
        {
          text: 'Ongoing',
          onPress: () => updateStatus(prayer.id, 'ongoing'),
        },
        {
          text: 'Answered',
          onPress: () => updateStatus(prayer.id, 'answered'),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const getStatusColor = (status: string): [string, string] => {
    switch (status?.toLowerCase()) {
      case 'answered':
        return ['#10b981', '#059669'];
      case 'ongoing':
        return ['#f59e0b', '#d97706'];
      case 'pending':
      default:
        return ['#6b7280', '#4b5563'];
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'answered':
        return '✅';
      case 'ongoing':
        return '🙏';
      case 'pending':
      default:
        return '⏳';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'health':
        return '🏥';
      case 'family':
        return '👨‍👩‍👧‍👦';
      case 'work':
        return '💼';
      case 'finances':
        return '💰';
      case 'spiritual':
        return '✝️';
      default:
        return '🙏';
    }
  };

  // Access control check
  if (!isAdminOrMedia) {
    return (
      <View style={styles.accessDenied}>
        <Text style={styles.accessDeniedIcon}>🔒</Text>
        <Text style={styles.accessDeniedTitle}>Access Restricted</Text>
        <Text style={styles.accessDeniedText}>
          This section is only available to administrators and media department members.
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <Text style={styles.loadingText}>Loading prayer requests...</Text>
      </View>
    );
  }

  const statusCounts = {
    all: prayers.length,
    pending: prayers.filter(p => p.status?.toLowerCase() === 'pending' || !p.status).length,
    ongoing: prayers.filter(p => p.status?.toLowerCase() === 'ongoing').length,
    answered: prayers.filter(p => p.status?.toLowerCase() === 'answered').length,
  };

  return (
    <View style={styles.container}>
      {/* Enhanced Header */}
      <LinearGradient
        colors={[colors.primary[600], colors.primary[800]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>🙏 Prayer Management</Text>
        <Text style={styles.headerSubtitle}>Monitor and update prayer requests</Text>
      </LinearGradient>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchIconWrapper}>
          <Text style={styles.searchIcon}>🔍</Text>
        </View>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email, or request..."
          placeholderTextColor={colors.gray[400]}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        {(['all', 'pending', 'ongoing', 'answered'] as const).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterTab,
              selectedFilter === filter && styles.filterTabActive,
            ]}
            onPress={() => setSelectedFilter(filter)}
            activeOpacity={0.7}
          >
            {selectedFilter === filter ? (
              <LinearGradient
                colors={[colors.primary[600], colors.primary[700]]}
                style={styles.filterTabGradient}
              >
                <Text style={styles.filterTabIcon}>
                  {filter === 'all' ? '📋' : getStatusIcon(filter)}
                </Text>
                <Text style={styles.filterTabTextActive}>
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Text>
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{statusCounts[filter]}</Text>
                </View>
              </LinearGradient>
            ) : (
              <>
                <Text style={styles.filterTabIcon}>
                  {filter === 'all' ? '📋' : getStatusIcon(filter)}
                </Text>
                <Text style={styles.filterTabText}>
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Text>
                <View style={[styles.filterBadge, styles.filterBadgeInactive]}>
                  <Text style={styles.filterBadgeTextInactive}>{statusCounts[filter]}</Text>
                </View>
              </>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Prayer Requests List */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {filteredPrayers.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🙏</Text>
            <Text style={styles.emptyText}>No prayer requests found</Text>
          </View>
        ) : (
          filteredPrayers.map((prayer) => (
            <View key={prayer.id} style={styles.prayerCard}>
              {/* Status Accent Bar */}
              <LinearGradient
                colors={getStatusColor(prayer.status || 'pending')}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.accentBar}
              />

              {/* Card Header */}
              <View style={styles.cardHeader}>
                <View style={styles.headerLeft}>
                  <Text style={styles.categoryIcon}>
                    {getCategoryIcon(prayer.category)}
                  </Text>
                  <View>
                    <Text style={styles.prayerName}>
                      {prayer.is_anonymous ? 'Anonymous' : prayer.name}
                    </Text>
                    {!prayer.is_anonymous && (
                      <Text style={styles.prayerEmail}>✉️ {prayer.email}</Text>
                    )}
                  </View>
                </View>
                <LinearGradient
                  colors={getStatusColor(prayer.status || 'pending')}
                  style={styles.statusBadge}
                >
                  <Text style={styles.statusBadgeText}>
                    {getStatusIcon(prayer.status || 'pending')} {prayer.status || 'Pending'}
                  </Text>
                </LinearGradient>
              </View>

              {/* Prayer Request Text */}
              <View style={styles.requestContainer}>
                <Text style={styles.requestLabel}>Prayer Request:</Text>
                <Text style={styles.requestText}>{prayer.request}</Text>
              </View>

              {/* Details Grid */}
              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailIcon}>🎯</Text>
                  <Text style={styles.detailText}>{prayer.category}</Text>
                </View>
                {prayer.phone && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailIcon}>📱</Text>
                    <Text style={styles.detailText}>{prayer.phone}</Text>
                  </View>
                )}
                <View style={styles.detailItem}>
                  <Text style={styles.detailIcon}>📅</Text>
                  <Text style={styles.detailText}>
                    {new Date(prayer.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              {/* Action Button */}
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleStatusChange(prayer)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[colors.primary[600], colors.primary[700]]}
                  style={styles.actionButtonGradient}
                >
                  <Text style={styles.actionButtonText}>Update Status</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
  },
  loadingText: {
    fontSize: 16,
    color: colors.gray[600],
    marginTop: 12,
  },
  accessDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    padding: 32,
  },
  accessDeniedIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  accessDeniedTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 12,
  },
  accessDeniedText: {
    fontSize: 16,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 24,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.9,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    margin: 16,
    borderRadius: 12,
    paddingHorizontal: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  searchIconWrapper: {
    marginRight: 12,
  },
  searchIcon: {
    fontSize: 20,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.gray[900],
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  filterTab: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  filterTabActive: {
    elevation: 3,
    shadowColor: colors.primary[600],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  filterTabGradient: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 4,
  },
  filterTabIcon: {
    fontSize: 20,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray[700],
  },
  filterTabTextActive: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.white,
  },
  filterBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  filterBadgeInactive: {
    backgroundColor: colors.gray[100],
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.white,
  },
  filterBadgeTextInactive: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.gray[700],
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: colors.gray[500],
  },
  prayerCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  accentBar: {
    height: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  categoryIcon: {
    fontSize: 32,
  },
  prayerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  prayerEmail: {
    fontSize: 14,
    color: colors.gray[600],
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.white,
  },
  requestContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  requestLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: 6,
  },
  requestText: {
    fontSize: 15,
    color: colors.gray[800],
    lineHeight: 22,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailIcon: {
    fontSize: 16,
  },
  detailText: {
    fontSize: 14,
    color: colors.gray[600],
  },
  actionButton: {
    margin: 16,
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: colors.primary[600],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  actionButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
});
