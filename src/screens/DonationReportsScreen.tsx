import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import api from '../services/api';

interface DonationStats {
  totalAmount: number;
  totalCount: number;
  pendingAmount: number;
  pendingCount: number;
  completedAmount: number;
  completedCount: number;
  rejectedAmount: number;
  rejectedCount: number;
  byPurpose: { [key: string]: { amount: number; count: number } };
  byMonth: { [key: string]: { amount: number; count: number } };
}

export default function DonationReportsScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DonationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

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
        loadStats();
      }
    }, [hasAccess, selectedYear])
  );

  const loadStats = async () => {
    try {
      const response = await api.get(`/donations/stats?year=${selectedYear}`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    loadStats();
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

  if (isLoading || !stats) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading reports...</Text>
      </View>
    );
  }

  const years = [2024, 2025, 2026];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      {/* Enhanced Header */}
      <LinearGradient
        colors={[colors.primary[600], colors.primary[800]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>📊 Donation Reports</Text>
        <Text style={styles.headerSubtitle}>Track church finances and giving trends</Text>
      </LinearGradient>

      {/* Year Filter with enhanced design */}
      <View style={styles.yearFilter}>
        {years.map((year) => (
          <TouchableOpacity
            key={year}
            style={[
              styles.yearButton,
              selectedYear === year && styles.yearButtonActive,
            ]}
            onPress={() => setSelectedYear(year)}
            activeOpacity={0.7}
          >
            {selectedYear === year ? (
              <LinearGradient
                colors={[colors.primary[600], colors.primary[700]]}
                style={styles.yearButtonGradient}
              >
                <Text style={styles.yearButtonTextActive}>{year}</Text>
              </LinearGradient>
            ) : (
              <Text style={styles.yearButtonText}>{year}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary Cards with enhanced design */}
      <View style={styles.summaryCards}>
        <TouchableOpacity style={styles.card} activeOpacity={0.9}>
          <LinearGradient
            colors={[colors.primary[500], colors.primary[700]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            <View style={styles.cardIconContainer}>
              <Text style={styles.cardIconLarge}>💰</Text>
            </View>
            <Text style={styles.cardLabel}>Total Donations</Text>
            <Text style={styles.cardAmount}>₦{stats.totalAmount.toLocaleString()}</Text>
            <Text style={styles.cardCount}>{stats.totalCount} donations</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} activeOpacity={0.9}>
          <LinearGradient
            colors={['#10b981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            <View style={styles.cardIconContainer}>
              <Text style={styles.cardIconLarge}>✅</Text>
            </View>
            <Text style={styles.cardLabel}>Completed</Text>
            <Text style={styles.cardAmount}>₦{stats.completedAmount.toLocaleString()}</Text>
            <Text style={styles.cardCount}>{stats.completedCount} donations</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} activeOpacity={0.9}>
          <LinearGradient
            colors={['#f59e0b', '#d97706']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            <View style={styles.cardIconContainer}>
              <Text style={styles.cardIconLarge}>⏳</Text>
            </View>
            <Text style={styles.cardLabel}>Pending</Text>
            <Text style={styles.cardAmount}>₦{stats.pendingAmount.toLocaleString()}</Text>
            <Text style={styles.cardCount}>{stats.pendingCount} donations</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} activeOpacity={0.9}>
          <LinearGradient
            colors={['#ef4444', '#dc2626']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            <View style={styles.cardIconContainer}>
              <Text style={styles.cardIconLarge}>❌</Text>
            </View>
            <Text style={styles.cardLabel}>Rejected</Text>
            <Text style={styles.cardAmount}>₦{stats.rejectedAmount.toLocaleString()}</Text>
            <Text style={styles.cardCount}>{stats.rejectedCount} donations</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* By Purpose */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Donations by Purpose</Text>
        <View style={styles.tableContainer}>
          {Object.entries(stats.byPurpose).map(([purpose, data]) => (
            <View key={purpose} style={styles.tableRow}>
              <Text style={styles.tablePurpose}>{purpose}</Text>
              <View style={styles.tableRight}>
                <Text style={styles.tableAmount}>₦{data.amount.toLocaleString()}</Text>
                <Text style={styles.tableCount}>({data.count})</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* By Month */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Monthly Breakdown</Text>
        <View style={styles.tableContainer}>
          {Object.entries(stats.byMonth)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([month, data]) => (
              <View key={month} style={styles.tableRow}>
                <Text style={styles.tablePurpose}>{month}</Text>
                <View style={styles.tableRight}>
                  <Text style={styles.tableAmount}>₦{data.amount.toLocaleString()}</Text>
                  <Text style={styles.tableCount}>({data.count})</Text>
                </View>
              </View>
            ))}
        </View>
      </View>

      {/* Completion Rate */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Statistics</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Completion Rate</Text>
            <Text style={styles.statValue}>
              {stats.totalCount > 0
                ? ((stats.completedCount / stats.totalCount) * 100).toFixed(1)
                : 0}
              %
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Average Donation</Text>
            <Text style={styles.statValue}>
              ₦{stats.totalCount > 0 
                ? Math.round(stats.totalAmount / stats.totalCount).toLocaleString() 
                : 0}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
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
  yearFilter: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: colors.white,
    gap: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  yearButton: {
    borderRadius: 25,
    overflow: 'hidden',
    minWidth: 80,
  },
  yearButtonGradient: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: 'center',
  },
  yearButtonActive: {
    elevation: 3,
    shadowColor: colors.primary[600],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  yearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[700],
    paddingHorizontal: 24,
    paddingVertical: 12,
    textAlign: 'center',
  },
  yearButtonTextActive: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  summaryCards: {
    padding: 16,
    gap: 16,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  cardGradient: {
    padding: 24,
    alignItems: 'center',
  },
  cardIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cardIconLarge: {
    fontSize: 36,
  },
  cardLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
    fontWeight: '600',
  },
  cardAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  cardCount: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 16,
    paddingLeft: 4,
  },
  tableContainer: {
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  tablePurpose: {
    fontSize: 16,
    color: colors.gray[900],
    flex: 1,
    fontWeight: '500',
  },
  tableRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tableAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary[600],
  },
  tableCount: {
    fontSize: 14,
    color: colors.gray[500],
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  statLabel: {
    fontSize: 14,
    color: colors.gray[600],
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary[600],
  },
});
