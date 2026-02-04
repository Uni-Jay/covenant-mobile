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

interface Donation {
  id: number;
  amount: number;
  purpose: string;
  paymentMethod: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  reference: string;
}

export default function GivingHistoryScreen({ navigation }: any) {
  const { user } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | '2025' | '2024'>('all');

  useEffect(() => {
    loadGivingHistory();
  }, []);

  const loadGivingHistory = async () => {
    try {
      // TODO: Implement API endpoint to get user's donation history
      // For now, mock data
      const mockDonations: Donation[] = [];
      setDonations(mockDonations);
    } catch (error) {
      console.error('Error loading donations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadGivingHistory();
    setIsRefreshing(false);
  };

  const getTotalGiving = () => {
    return donations
      .filter((d) => d.status === 'completed')
      .reduce((sum, donation) => sum + donation.amount, 0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return colors.success;
      case 'pending':
        return colors.warning;
      case 'failed':
        return colors.error;
      default:
        return colors.gray[500];
    }
  };

  const filteredDonations = donations.filter((donation) => {
    if (filter === 'all') return true;
    const year = new Date(donation.date).getFullYear().toString();
    return year === filter;
  });

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading your giving history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total Giving</Text>
        <Text style={styles.summaryAmount}>
          ₦{getTotalGiving().toLocaleString()}
        </Text>
        <Text style={styles.summarySubtext}>
          {donations.filter((d) => d.status === 'completed').length} donations
        </Text>
        <TouchableOpacity
          style={styles.giveNowButton}
          onPress={() => navigation.navigate('Give')}
        >
          <Text style={styles.giveNowButtonText}>Give Now</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All Time
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === '2025' && styles.filterTabActive]}
          onPress={() => setFilter('2025')}
        >
          <Text style={[styles.filterText, filter === '2025' && styles.filterTextActive]}>
            2025
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === '2024' && styles.filterTabActive]}
          onPress={() => setFilter('2024')}
        >
          <Text style={[styles.filterText, filter === '2024' && styles.filterTextActive]}>
            2024
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {filteredDonations.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💝</Text>
            <Text style={styles.emptyTitle}>No Donations Yet</Text>
            <Text style={styles.emptyText}>
              {filter === 'all'
                ? "You haven't made any donations yet."
                : `No donations found for ${filter}.`}
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('Give')}
            >
              <Text style={styles.addButtonText}>Make a Donation</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.donationsList}>
            {filteredDonations.map((donation) => (
              <TouchableOpacity
                key={donation.id}
                style={styles.donationCard}
                onPress={() =>
                  Alert.alert(
                    'Donation Details',
                    `Reference: ${donation.reference}\nAmount: ₦${donation.amount.toLocaleString()}\nPurpose: ${donation.purpose}\nMethod: ${donation.paymentMethod}\nDate: ${new Date(donation.date).toLocaleDateString()}\nStatus: ${donation.status}`
                  )
                }
              >
                <View style={styles.donationLeft}>
                  <View style={styles.donationIcon}>
                    <Text style={styles.iconText}>💝</Text>
                  </View>
                  <View style={styles.donationInfo}>
                    <Text style={styles.donationPurpose}>{donation.purpose}</Text>
                    <Text style={styles.donationDate}>
                      {new Date(donation.date).toLocaleDateString()}
                    </Text>
                    <Text style={styles.donationMethod}>{donation.paymentMethod}</Text>
                  </View>
                </View>
                <View style={styles.donationRight}>
                  <Text style={styles.donationAmount}>
                    ₦{donation.amount.toLocaleString()}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(donation.status) },
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {donation.status.charAt(0).toUpperCase() + donation.status.slice(1)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
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
  summaryCard: {
    backgroundColor: colors.primary[800],
    margin: 16,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 4,
    shadowColor: colors.primary[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.9,
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  summarySubtext: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.8,
    marginBottom: 16,
  },
  giveNowButton: {
    backgroundColor: colors.secondary[600],
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    elevation: 2,
  },
  giveNowButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
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
  donationsList: {
    padding: 16,
  },
  donationCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary[100],
    elevation: 2,
    shadowColor: colors.primary[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  donationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  donationIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 24,
  },
  donationInfo: {
    flex: 1,
  },
  donationPurpose: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 4,
  },
  donationDate: {
    fontSize: 13,
    color: colors.gray[600],
    marginBottom: 2,
  },
  donationMethod: {
    fontSize: 12,
    color: colors.primary[700],
  },
  donationRight: {
    alignItems: 'flex-end',
  },
  donationAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: 'bold',
  },
});
