import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import api from '../services/api';

interface Donation {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  amount: number;
  purpose: string;
  payment_method: string;
  status: 'pending' | 'completed' | 'rejected';
  created_at: string;
  approved_by: number | null;
  approved_at: string | null;
}

export default function DonationApprovalScreen() {
  const { user } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [filteredDonations, setFilteredDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  // Check if user has access
  const hasAccess = React.useMemo(() => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    
    const userDepartments = user.departments || [];
    return userDepartments.some((dept: string) => dept.toLowerCase().includes('media'));
  }, [user]);

  useFocusEffect(
    React.useCallback(() => {
      if (hasAccess) {
        loadDonations();
      }
    }, [hasAccess])
  );

  useEffect(() => {
    filterDonations();
  }, [donations, filterStatus, searchQuery]);

  const loadDonations = async () => {
    try {
      const response = await api.get('/donations/all');
      setDonations(response.data.donations || []);
    } catch (error) {
      console.error('Failed to load donations:', error);
      Alert.alert('Error', 'Failed to load donations');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const filterDonations = () => {
    let filtered = donations;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(d => d.status === filterStatus);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(d =>
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.purpose.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredDonations(filtered);
  };

  const handleApprove = async (donationId: number) => {
    Alert.alert(
      'Approve Donation',
      'Have you confirmed the payment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Approve',
          onPress: async () => {
            try {
              await api.put(`/donations/${donationId}/approve`);
              Alert.alert('Success', 'Donation approved successfully');
              loadDonations();
            } catch (error) {
              Alert.alert('Error', 'Failed to approve donation');
            }
          },
        },
      ]
    );
  };

  const handleReject = async (donationId: number) => {
    Alert.alert(
      'Reject Donation',
      'Are you sure you want to reject this donation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.put(`/donations/${donationId}/reject`);
              Alert.alert('Success', 'Donation rejected');
              loadDonations();
            } catch (error) {
              Alert.alert('Error', 'Failed to reject donation');
            }
          },
        },
      ]
    );
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    loadDonations();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return colors.success;
      case 'pending':
        return colors.warning;
      case 'rejected':
        return colors.error;
      default:
        return colors.gray[500];
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!hasAccess) {
    return (
      <View style={styles.accessDenied}>
        <Text style={styles.accessDeniedIcon}>🔒</Text>
        <Text style={styles.accessDeniedTitle}>Access Denied</Text>
        <Text style={styles.accessDeniedText}>
          You need to be an admin or media department member to access this screen.
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading donations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Enhanced Header with Gradient */}
      <LinearGradient
        colors={[colors.primary[600], colors.primary[800]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>💰 Donation Management</Text>
        <Text style={styles.headerSubtitle}>Approve and manage church donations</Text>
      </LinearGradient>

      {/* Search Bar with enhanced design */}
      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, email, or purpose..."
            placeholderTextColor={colors.gray[400]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Filter Tabs with enhanced design */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        {[
          { key: 'all', label: 'All', icon: '📋', color: colors.gray[600] },
          { key: 'pending', label: 'Pending', icon: '⏳', color: colors.warning },
          { key: 'completed', label: 'Completed', icon: '✅', color: colors.success },
          { key: 'rejected', label: 'Rejected', icon: '❌', color: colors.error },
        ].map((status) => (
          <TouchableOpacity
            key={status.key}
            style={[
              styles.filterButton,
              filterStatus === status.key && [
                styles.filterButtonActive,
                { backgroundColor: status.color },
              ],
            ]}
            onPress={() => setFilterStatus(status.key as any)}
          >
            <Text style={styles.filterIcon}>{status.icon}</Text>
            <Text
              style={[
                styles.filterButtonText,
                filterStatus === status.key && styles.filterButtonTextActive,
              ]}
            >
              {status.label}
            </Text>
            {status.key !== 'all' && (
              <View style={[
                styles.filterBadge,
                filterStatus === status.key && styles.filterBadgeActive,
              ]}>
                <Text style={[
                  styles.filterBadgeText,
                  filterStatus === status.key && styles.filterBadgeTextActive,
                ]}>
                  {donations.filter(d => d.status === status.key).length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Donations List */}
      <ScrollView
        style={styles.list}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {filteredDonations.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📋</Text>
            <Text style={styles.emptyStateText}>No donations found</Text>
          </View>
        ) : (
          filteredDonations.map((donation) => (
            <View key={donation.id} style={styles.donationCard}>
              {/* Gradient accent bar */}
              <LinearGradient
                colors={[
                  getStatusColor(donation.status),
                  getStatusColor(donation.status) + '80',
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.cardAccent}
              />
              
              <View style={styles.cardContent}>
                <View style={styles.donationHeader}>
                  <View style={styles.donationHeaderLeft}>
                    <Text style={styles.donorName}>👤 {donation.name}</Text>
                    <Text style={styles.donorEmail}>✉️ {donation.email}</Text>
                  </View>
                  <LinearGradient
                    colors={[
                      getStatusColor(donation.status) + '30',
                      getStatusColor(donation.status) + '10',
                    ]}
                    style={styles.statusBadge}
                  >
                    <Text style={[styles.statusText, { color: getStatusColor(donation.status) }]}>
                      {donation.status === 'pending' && '⏳'}
                      {donation.status === 'completed' && '✅'}
                      {donation.status === 'rejected' && '❌'}
                      {' '}{donation.status.toUpperCase()}
                    </Text>
                  </LinearGradient>
                </View>

                <View style={styles.donationDetails}>
                  <View style={styles.amountCard}>
                    <Text style={styles.amountLabel}>Amount</Text>
                    <Text style={styles.amountValue}>₦{donation.amount.toLocaleString()}</Text>
                  </View>
                  
                  <View style={styles.detailsGrid}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailIcon}>🎯</Text>
                      <View>
                        <Text style={styles.detailLabel}>Purpose</Text>
                        <Text style={styles.detailValue}>{donation.purpose}</Text>
                      </View>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailIcon}>💳</Text>
                      <View>
                        <Text style={styles.detailLabel}>Payment</Text>
                        <Text style={styles.detailValue}>{donation.payment_method}</Text>
                      </View>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailIcon}>📅</Text>
                      <View>
                        <Text style={styles.detailLabel}>Date</Text>
                        <Text style={styles.detailValue}>{formatDate(donation.created_at)}</Text>
                      </View>
                    </View>
                    {donation.phone && (
                      <View style={styles.detailItem}>
                        <Text style={styles.detailIcon}>📱</Text>
                        <View>
                          <Text style={styles.detailLabel}>Phone</Text>
                          <Text style={styles.detailValue}>{donation.phone}</Text>
                        </View>
                      </View>
                    )}
                  </View>
                </View>

                {donation.status === 'pending' && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.approveButton}
                      onPress={() => handleApprove(donation.id)}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={[colors.success, '#059669']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.buttonGradient}
                      >
                        <Text style={styles.actionButtonText}>✓ Approve</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rejectButton}
                      onPress={() => handleReject(donation.id)}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={[colors.error, '#dc2626']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.buttonGradient}
                      >
                        <Text style={styles.actionButtonText}>✕ Reject</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
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
    padding: 16,
    backgroundColor: colors.white,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    paddingHorizontal: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    padding: 14,
    fontSize: 16,
    color: colors.gray[900],
  },
  filterContainer: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: colors.gray[100],
    marginRight: 10,
    gap: 6,
  },
  filterButtonActive: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  filterIcon: {
    fontSize: 16,
  },
  filterButtonText: {
    fontSize: 14,
    color: colors.gray[700],
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: colors.white,
    fontWeight: 'bold',
  },
  filterBadge: {
    backgroundColor: colors.white,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 4,
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.gray[700],
  },
  filterBadgeTextActive: {
    color: colors.white,
  },
  list: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyStateIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyStateText: {
    fontSize: 18,
    color: colors.gray[600],
    fontWeight: '500',
  },
  donationCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  cardAccent: {
    height: 4,
  },
  cardContent: {
    padding: 16,
  },
  donationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  donationHeaderLeft: {
    flex: 1,
  },
  donorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 6,
  },
  donorEmail: {
    fontSize: 14,
    color: colors.gray[600],
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  donationDetails: {
    marginBottom: 16,
  },
  amountCard: {
    backgroundColor: colors.primary[50],
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[600],
  },
  amountLabel: {
    fontSize: 12,
    color: colors.primary[700],
    fontWeight: '600',
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary[800],
  },
  detailsGrid: {
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  detailIcon: {
    fontSize: 24,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.gray[500],
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[900],
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  approveButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  rejectButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  buttonGradient: {
    padding: 14,
    alignItems: 'center',
  },
  actionButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
