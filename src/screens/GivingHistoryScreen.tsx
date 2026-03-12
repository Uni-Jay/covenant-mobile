import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { donationsService } from '../services';
import { colors } from '../theme/colors';
import { useFocusEffect } from '@react-navigation/native';

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
  const { colors: themeColors } = useTheme();
  const styles = createStyles(themeColors);
  const { user } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | '2025' | '2024'>('all');

  useEffect(() => {
    loadGivingHistory();
  }, []);

  // Reload when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadGivingHistory();
    }, [])
  );

  const loadGivingHistory = async () => {
    try {
      const response = await donationsService.getHistory();
      setDonations(response.donations || []);
    } catch (error) {
      console.error('Error loading donations:', error);
      Alert.alert('Error', 'Failed to load donation history');
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
    return filteredDonations
      .filter((d) => d.status === 'completed')
      .reduce((sum, donation) => sum + donation.amount, 0);
  };

  const getCompletedCount = () => {
    return filteredDonations.filter((d) => d.status === 'completed').length;
  };

  const getAverageDonation = () => {
    const completed = filteredDonations.filter((d) => d.status === 'completed');
    if (completed.length === 0) return 0;
    return getTotalGiving() / completed.length;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return themeColors.success;
      case 'pending':
        return themeColors.warning;
      case 'failed':
        return themeColors.error;
      default:
        return themeColors.gray[500];
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'pending':
        return '⏱';
      case 'failed':
        return '✕';
      default:
        return '•';
    }
  };

  const getPurposeIcon = (purpose: string) => {
    const icons: any = {
      'Tithe': '⛪',
      'Offering': '🙏',
      'Building Fund': '🏗️',
      'Missions': '🌍',
      'Special Project': '⭐',
      'Other': '💝'
    };
    return icons[purpose] || '💝';
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
      {/* Enhanced Header with Stats */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerSubtitle}>Your Contribution</Text>
            <Text style={styles.headerTitle}>Giving History</Text>
          </View>
          <TouchableOpacity
            style={styles.giveButton}
            onPress={() => navigation.navigate('Give')}
          >
            <Text style={styles.giveButtonIcon}>+</Text>
          </TouchableOpacity>
        </View>
        
        {/* Stats Summary Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statBox, styles.statBoxPrimary]}>
            <Text style={styles.statIcon}>💰</Text>
            <Text style={styles.statValue}>₦{getTotalGiving().toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total Given</Text>
          </View>
          
          <View style={[styles.statBox, styles.statBoxSecondary]}>
            <Text style={styles.statIcon}>🎁</Text>
            <Text style={styles.statValue}>{getCompletedCount()}</Text>
            <Text style={styles.statLabel}>Donations</Text>
          </View>
          
          <View style={[styles.statBox, styles.statBoxTertiary]}>
            <Text style={styles.statIcon}>📊</Text>
            <Text style={styles.statValue}>₦{Math.round(getAverageDonation()).toLocaleString()}</Text>
            <Text style={styles.statLabel}>Average</Text>
          </View>
        </View>
      </View>

      {/* Filter Tabs - Redesigned */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Filter by Year</Text>
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
              All Time
            </Text>
            {filter === 'all' && <View style={styles.filterDot} />}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterTab, filter === '2025' && styles.filterTabActive]}
            onPress={() => setFilter('2025')}
          >
            <Text style={[styles.filterText, filter === '2025' && styles.filterTextActive]}>
              2026
            </Text>
            {filter === '2025' && <View style={styles.filterDot} />}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterTab, filter === '2024' && styles.filterTabActive]}
            onPress={() => setFilter('2024')}
          >
            <Text style={[styles.filterText, filter === '2024' && styles.filterTextActive]}>
              2025
            </Text>
            {filter === '2024' && <View style={styles.filterDot} />}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={onRefresh}
            colors={[themeColors.primary[600]]}
            tintColor={themeColors.primary[600]}
          />
        }
      >
        {filteredDonations.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Text style={styles.emptyIcon}>💝</Text>
            </View>
            <Text style={styles.emptyTitle}>No Donations Found</Text>
            <Text style={styles.emptyText}>
              {filter === 'all'
                ? "Start your giving journey today and make a difference in God's Kingdom."
                : `No donations recorded for ${filter === '2025' ? '2026' : '2025'}. Your faithful giving is appreciated!`}
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate('Give')}
            >
              <Text style={styles.emptyButtonText}>Make Your First Donation</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.donationsList}>
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>Transaction History</Text>
              <View style={styles.listBadge}>
                <Text style={styles.listBadgeText}>{filteredDonations.length}</Text>
              </View>
            </View>
            
            {filteredDonations.map((donation, index) => (
              <TouchableOpacity
                key={donation.id}
                style={styles.donationCard}
                onPress={() =>
                  Alert.alert(
                    'Donation Details',
                    `Reference: ${donation.reference}\n\nAmount: ₦${donation.amount.toLocaleString()}\nPurpose: ${donation.purpose}\nPayment Method: ${donation.paymentMethod}\nDate: ${new Date(donation.date).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}\n\nStatus: ${donation.status.charAt(0).toUpperCase() + donation.status.slice(1)}`,
                    [{ text: 'Close', style: 'cancel' }]
                  )
                }
                activeOpacity={0.7}
              >
                <View style={styles.donationLeft}>
                  <View style={[styles.donationIconBox, 
                    donation.status === 'completed' && styles.donationIconBoxSuccess,
                    donation.status === 'pending' && styles.donationIconBoxWarning,
                    donation.status === 'failed' && styles.donationIconBoxError
                  ]}>
                    <Text style={styles.donationIconText}>
                      {getPurposeIcon(donation.purpose)}
                    </Text>
                  </View>
                  
                  <View style={styles.donationInfo}>
                    <Text style={styles.donationPurpose}>{donation.purpose}</Text>
                    <View style={styles.donationMeta}>
                      <Text style={styles.donationDate}>
                        {new Date(donation.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </Text>
                      <Text style={styles.donationSeparator}>•</Text>
                      <Text style={styles.donationMethod}>{donation.paymentMethod}</Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.donationRight}>
                  <Text style={styles.donationAmount}>
                    ₦{donation.amount.toLocaleString()}
                  </Text>
                  <View
                    style={[
                      styles.statusPill,
                      { backgroundColor: getStatusColor(donation.status) + '20' },
                    ]}
                  >
                    <Text style={[styles.statusIcon, { color: getStatusColor(donation.status) }]}>
                      {getStatusIcon(donation.status)}
                    </Text>
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(donation.status) }
                      ]}
                    >
                      {donation.status.charAt(0).toUpperCase() + donation.status.slice(1)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
            
            {/* Summary Footer */}
            <View style={styles.summaryFooter}>
              <Text style={styles.summaryIcon}>📖</Text>
              <Text style={styles.summaryText}>
                Thank you for your faithful giving. Your generosity makes a difference!
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
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
    fontWeight: '500',
  },
  
  // Header
  header: {
    backgroundColor: colors.primary[800],
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary[900],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.gold[300],
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  giveButton: {
    width: 48,
    height: 48,
    backgroundColor: colors.secondary[600],
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  giveButtonIcon: {
    color: colors.white,
    fontSize: 28,
    fontWeight: 'bold',
  },
  
  // Stats Container
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  statBoxPrimary: {
    backgroundColor: colors.primary[700],
  },
  statBoxSecondary: {
    backgroundColor: colors.secondary[600],
  },
  statBoxTertiary: {
    backgroundColor: colors.gold[600],
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // Filter Section
  filterSection: {
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  filterLabel: {
    fontSize: 13,
    color: colors.gray[600],
    fontWeight: '600',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    position: 'relative',
  },
  filterTabActive: {
    backgroundColor: colors.primary[600],
    ...Platform.select({
      ios: {
        shadowColor: colors.primary[900],
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  filterText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gray[700],
  },
  filterTextActive: {
    color: colors.white,
  },
  filterDot: {
    width: 4,
    height: 4,
    backgroundColor: colors.white,
    borderRadius: 2,
    position: 'absolute',
    top: 6,
    right: 6,
  },
  
  // Content
  content: {
    flex: 1,
  },
  
  // Empty State
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    backgroundColor: colors.primary[100],
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    paddingHorizontal: 20,
  },
  emptyButton: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary[900],
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  emptyButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Donations List
  donationsList: {
    padding: 16,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  listBadge: {
    backgroundColor: colors.primary[100],
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  listBadgeText: {
    color: colors.primary[700],
    fontSize: 13,
    fontWeight: '800',
  },
  
  // Donation Card
  donationCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray[200],
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  donationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  donationIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    backgroundColor: colors.gray[100],
  },
  donationIconBoxSuccess: {
    backgroundColor: colors.success + '20',
  },
  donationIconBoxWarning: {
    backgroundColor: colors.warning + '20',
  },
  donationIconBoxError: {
    backgroundColor: colors.error + '20',
  },
  donationIconText: {
    fontSize: 26,
  },
  donationInfo: {
    flex: 1,
  },
  donationPurpose: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 6,
  },
  donationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  donationDate: {
    fontSize: 13,
    color: colors.gray[600],
    fontWeight: '500',
  },
  donationSeparator: {
    fontSize: 10,
    color: colors.gray[400],
  },
  donationMethod: {
    fontSize: 12,
    color: colors.primary[600],
    fontWeight: '600',
  },
  donationRight: {
    alignItems: 'flex-end',
  },
  donationAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusIcon: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  
  // Summary Footer
  summaryFooter: {
    backgroundColor: colors.primary[50],
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  summaryIcon: {
    fontSize: 28,
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 14,
    color: colors.gray[700],
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
});
