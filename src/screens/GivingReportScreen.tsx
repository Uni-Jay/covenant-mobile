import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions
} from 'react-native';
import { dashboardService } from '../services';
import { colors, primaryColor } from '../theme/colors';

const GivingReportScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await dashboardService.getGiving();
      setStats(data);
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString()}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={primaryColor} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Giving Report</Text>
        <Text style={styles.headerSubtitle}>Donation analytics and trends</Text>
      </View>

      {stats && (
        <View style={styles.content}>
          {/* This Month Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>This Month</Text>
            <View style={styles.summaryGrid}>
              <View style={[styles.summaryCard, { backgroundColor: colors.primary + '20' }]}>
                <Text style={styles.summaryLabel}>Total Received</Text>
                <Text style={[styles.summaryValue, { color: primaryColor }]}>
                  {formatCurrency(stats.thisMonth?.total || 0)}
                </Text>
              </View>
              <View style={[styles.summaryCard, { backgroundColor: '#10B98120' }]}>
                <Text style={styles.summaryLabel}>Donations</Text>
                <Text style={[styles.summaryValue, { color: '#10B981' }]}>
                  {stats.thisMonth?.count || 0}
                </Text>
              </View>
            </View>
          </View>

          {/* All Time Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>All Time</Text>
            <View style={styles.summaryGrid}>
              <View style={[styles.summaryCard, { backgroundColor: '#8B5CF620' }]}>
                <Text style={styles.summaryLabel}>Total Received</Text>
                <Text style={[styles.summaryValue, { color: '#8B5CF6' }]}>
                  {formatCurrency(stats.allTime?.total || 0)}
                </Text>
              </View>
              <View style={[styles.summaryCard, { backgroundColor: '#F59E0B20' }]}>
                <Text style={styles.summaryLabel}>Total Donors</Text>
                <Text style={[styles.summaryValue, { color: '#F59E0B' }]}>
                  {stats.allTime?.count || 0}
                </Text>
              </View>
            </View>
          </View>

          {/* By Donation Type */}
          {stats.byType && stats.byType.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>By Donation Type</Text>
              {stats.byType.map((type: any, index: number) => (
                <View key={index} style={styles.typeCard}>
                  <View style={styles.typeInfo}>
                    <Text style={styles.typeName}>{type.donationType}</Text>
                    <Text style={styles.typeCount}>{type.count} donations</Text>
                  </View>
                  <Text style={styles.typeAmount}>{formatCurrency(type.total)}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Top Donors */}
          {stats.topDonors && stats.topDonors.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Top Donors (All Time)</Text>
              {stats.topDonors.map((donor: any, index: number) => (
                <View key={index} style={styles.donorCard}>
                  <View style={styles.donorRank}>
                    <Text style={styles.rankNumber}>{index + 1}</Text>
                  </View>
                  <View style={styles.donorInfo}>
                    <Text style={styles.donorName}>
                      {donor.firstName} {donor.lastName}
                    </Text>
                    <Text style={styles.donorDetail}>
                      {donor.donationCount} donations
                    </Text>
                  </View>
                  <Text style={styles.donorAmount}>{formatCurrency(donor.totalAmount)}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Monthly Trends */}
          {stats.monthlyTrend && stats.monthlyTrend.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Monthly Trends (Last 6 Months)</Text>
              {stats.monthlyTrend.map((month: any, index: number) => {
                const percentage = stats.monthlyTrend[0]?.total
                  ? (month.total / stats.monthlyTrend[0].total) * 100
                  : 0;

                return (
                  <View key={index} style={styles.trendCard}>
                    <View style={styles.trendInfo}>
                      <Text style={styles.trendMonth}>{month.month}</Text>
                      <Text style={styles.trendCount}>{month.count} donations</Text>
                    </View>
                    <View style={styles.trendRight}>
                      <Text style={styles.trendAmount}>{formatCurrency(month.total)}</Text>
                      <View style={styles.trendBarContainer}>
                        <View
                          style={[
                            styles.trendBar,
                            { width: `${percentage}%`, backgroundColor: primaryColor }
                          ]}
                        />
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Payment Methods */}
          {stats.byPaymentMethod && stats.byPaymentMethod.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>By Payment Method</Text>
              {stats.byPaymentMethod.map((method: any, index: number) => (
                <View key={index} style={styles.methodCard}>
                  <View style={styles.methodInfo}>
                    <Text style={styles.methodName}>{method.paymentMethod}</Text>
                    <Text style={styles.methodCount}>{method.count} transactions</Text>
                  </View>
                  <Text style={styles.methodAmount}>{formatCurrency(method.total)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  header: {
    backgroundColor: primaryColor,
    paddingTop: 60,
    paddingBottom: 30,
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
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 15,
  },
  summaryCard: {
    flex: 1,
    padding: 20,
    borderRadius: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  typeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeInfo: {
    flex: 1,
  },
  typeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  typeCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  typeAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: primaryColor,
  },
  donorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  donorRank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: primaryColor + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  rankNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: primaryColor,
  },
  donorInfo: {
    flex: 1,
  },
  donorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  donorDetail: {
    fontSize: 14,
    color: '#6B7280',
  },
  donorAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: primaryColor,
  },
  trendCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trendInfo: {
    flex: 1,
  },
  trendMonth: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  trendCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  trendRight: {
    alignItems: 'flex-end',
    flex: 1,
  },
  trendAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: primaryColor,
    marginBottom: 8,
  },
  trendBarContainer: {
    width: '100%',
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
  },
  trendBar: {
    height: '100%',
    borderRadius: 3,
  },
  methodCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  methodCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  methodAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: primaryColor,
  },
});

export default GivingReportScreen;
