import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { dashboardService } from '../services';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../theme/colors';

const GivingReportScreen = () => {
  const { colors: themeColors } = useTheme();
  const styles = createStyles(themeColors);
  const primaryColor = themeColors.primary[600];
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
    return `â‚¦${amount.toLocaleString()}`;
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
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={handleRefresh}
          colors={[primaryColor]}
          tintColor={primaryColor}
        />
      }
    >
      {/* Header with Gradient Effect */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerSubtitle}>Financial Overview</Text>
            <Text style={styles.headerTitle}>Giving Report</Text>
          </View>
          <View style={styles.headerIcon}>
            <Text style={styles.headerIconText}>📊</Text>
          </View>
        </View>
      </View>

      {stats && (
        <View style={styles.content}>
          {/* This Month Summary - Featured */}
          <View style={styles.featuredSection}>
            <View style={styles.featuredHeader}>
              <Text style={styles.featuredTitle}>This Month</Text>
              <View style={styles.featuredBadge}>
                <Text style={styles.featuredBadgeText}>Current</Text>
              </View>
            </View>
            
            <View style={styles.featuredCards}>
              <View style={[styles.featuredCard, styles.featuredCardPrimary]}>
                <View style={styles.featuredIconContainer}>
                  <Text style={styles.featuredIcon}>💰</Text>
                </View>
                <Text style={styles.featuredLabel}>Total Received</Text>
                <Text style={styles.featuredValue}>
                  {formatCurrency(stats.thisMonth?.total || 0)}
                </Text>
                <View style={styles.featuredFooter}>
                  <Text style={styles.featuredFooterText}>
                    {((stats.thisMonth?.total || 0) / (stats.allTime?.total || 1) * 100).toFixed(1)}% of all time
                  </Text>
                </View>
              </View>
              
              <View style={[styles.featuredCard, styles.featuredCardSecondary]}>
                <View style={styles.featuredIconContainer}>
                  <Text style={styles.featuredIcon}>🎁</Text>
                </View>
                <Text style={styles.featuredLabel}>Donations</Text>
                <Text style={styles.featuredValue}>{stats.thisMonth?.count || 0}</Text>
                <View style={styles.featuredFooter}>
                  <Text style={styles.featuredFooterText}>
                    ₦{stats.thisMonth?.count ? Math.round((stats.thisMonth?.total || 0) / stats.thisMonth.count).toLocaleString() : 0} avg
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* All Time Summary - Enhanced */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>All Time Statistics</Text>
              <View style={styles.sectionIcon}>
                <Text style={styles.sectionIconText}>📈</Text>
              </View>
            </View>
            
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: themeColors.primary[50] }]}>
                <View style={styles.statIconCircle}>
                  <Text style={styles.statIcon}>💵</Text>
                </View>
                <Text style={styles.statLabel}>Total Collected</Text>
                <Text style={[styles.statValue, { color: themeColors.primary[700] }]}>
                  {formatCurrency(stats.allTime?.total || 0)}
                </Text>
              </View>
              
              <View style={[styles.statCard, { backgroundColor: themeColors.gold[50] }]}>
                <View style={styles.statIconCircle}>
                  <Text style={styles.statIcon}>👥</Text>
                </View>
                <Text style={styles.statLabel}>Total Donors</Text>
                <Text style={[styles.statValue, { color: themeColors.gold[700] }]}>
                  {stats.allTime?.count || 0}
                </Text>
              </View>
            </View>
          </View>

          {/* By Donation Type - Improved */}
          {stats.byType && stats.byType.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Giving by Purpose</Text>
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>{stats.byType.length}</Text>
                </View>
              </View>
              
              <View style={styles.typeList}>
                {stats.byType.map((type: any, index: number) => {
                  const percentage = ((type.total / stats.allTime?.total) * 100).toFixed(1);
                  const typeIcons: any = {
                    'Tithe': '⛪',
                    'Offering': '🙏',
                    'Building Fund': '🏗️',
                    'Missions': '🌍',
                    'Special Project': '⭐',
                    'Other': '💝'
                  };
                  
                  return (
                    <View key={index} style={styles.typeCard}>
                      <View style={styles.typeIconContainer}>
                        <Text style={styles.typeIconText}>
                          {typeIcons[type.donationType] || '💝'}
                        </Text>
                      </View>
                      <View style={styles.typeContent}>
                        <View style={styles.typeTop}>
                          <Text style={styles.typeName}>{type.donationType}</Text>
                          <Text style={styles.typeAmount}>{formatCurrency(type.total)}</Text>
                        </View>
                        <View style={styles.typeBottom}>
                          <Text style={styles.typeCount}>{type.count} donations</Text>
                          <View style={styles.typePercentBadge}>
                            <Text style={styles.typePercen}>{percentage}%</Text>
                          </View>
                        </View>
                        <View style={styles.typeProgressBar}>
                          <View 
                            style={[
                              styles.typeProgressFill,
                              { 
                                width: `${percentage}%`,
                                backgroundColor: themeColors.primary[600]
                              }
                            ]} 
                          />
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Top Donors - Premium Look */}
          {stats.topDonors && stats.topDonors.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Top Contributors</Text>
                <View style={[styles.sectionBadge, { backgroundColor: themeColors.gold[100] }]}>
                  <Text style={[styles.sectionBadgeText, { color: themeColors.gold[700] }]}>🏆 Hall of Faith</Text>
                </View>
              </View>
              
              <View style={styles.donorsList}>
                {stats.topDonors.map((donor: any, index: number) => {
                  const medals = ['🥇', '🥈', '🥉'];
                  const rankColors = [
                    themeColors.gold[100],
                    themeColors.gray[200],
                    '#CD7F3220'
                  ];
                  
                  return (
                    <View key={index} style={styles.donorCard}>
                      <View style={[
                        styles.donorRank,
                        { backgroundColor: rankColors[index] || themeColors.primary[50] }
                      ]}>
                        <Text style={styles.rankMedal}>
                          {medals[index] || `${index + 1}`}
                        </Text>
                      </View>
                      <View style={styles.donorInfo}>
                        <Text style={styles.donorName}>
                          {donor.firstName} {donor.lastName}
                        </Text>
                        <View style={styles.donorStats}>
                          <View style={styles.donorStatItem}>
                            <Text style={styles.donorStatIcon}>🎁</Text>
                            <Text style={styles.donorStatText}>{donor.donationCount} gifts</Text>
                          </View>
                        </View>
                      </View>
                      <View style={styles.donorAmountContainer}>
                        <Text style={styles.donorAmount}>{formatCurrency(donor.totalAmount)}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Monthly Trends - Chart Style */}
          {stats.monthlyTrend && stats.monthlyTrend.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>6-Month Trend</Text>
                <View style={styles.sectionIcon}>
                  <Text style={styles.sectionIconText}>📊</Text>
                </View>
              </View>
              
              <View style={styles.trendList}>
                {stats.monthlyTrend.map((month: any, index: number) => {
                  const maxTotal = Math.max(...stats.monthlyTrend.map((m: any) => m.total));
                  const percentage = (month.total / maxTotal) * 100;
                  const avgDonation = month.count ? (month.total / month.count) : 0;

                  return (
                    <View key={index} style={styles.trendCard}>
                      <View style={styles.trendLeft}>
                        <Text style={styles.trendMonth}>{month.month}</Text>
                        <Text style={styles.trendCount}>{month.count} donations</Text>
                      </View>
                      
                      <View style={styles.trendCenter}>
                        <View style={styles.trendBarBg}>
                          <View
                            style={[
                              styles.trendBar,
                              { 
                                width: `${percentage}%`,
                                backgroundColor: index === 0 
                                  ? themeColors.primary[600] 
                                  : themeColors.primary[300]
                              }
                            ]}
                          />
                        </View>
                      </View>
                      
                      <View style={styles.trendRight}>
                        <Text style={styles.trendAmount}>{formatCurrency(month.total)}</Text>
                        <Text style={styles.trendAvg}>₦{Math.round(avgDonation).toLocaleString()} avg</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Payment Methods - Modern Cards */}
          {stats.byPaymentMethod && stats.byPaymentMethod.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Payment Channels</Text>
              </View>
              
              <View style={styles.methodGrid}>
                {stats.byPaymentMethod.map((method: any, index: number) => {
                  const methodIcons: any = {
                    'Bank Transfer': '🏦',
                    'Cash': '💵',
                    'Card': '💳',
                    'Mobile Money': '📱',
                    'Online': '🌐'
                  };
                  const percentage = ((method.total / stats.allTime?.total) * 100).toFixed(1);
                  
                  return (
                    <View key={index} style={styles.methodCard}>
                      <Text style={styles.methodIcon}>
                        {methodIcons[method.paymentMethod] || '💰'}
                      </Text>
                      <Text style={styles.methodName}>{method.paymentMethod}</Text>
                      <Text style={styles.methodAmount}>{formatCurrency(method.total)}</Text>
                      <View style={styles.methodFooter}>
                        <Text style={styles.methodCount}>{method.count} transactions</Text>
                        <Text style={styles.methodPercent}>{percentage}%</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Footer Note */}
          <View style={styles.footer}>
            <Text style={styles.footerIcon}>📖</Text>
            <Text style={styles.footerText}>
              "Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver."
            </Text>
            <Text style={styles.footerVerse}>2 Corinthians 9:7</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};


const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
  },
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
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.gold[300],
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerIcon: {
    width: 56,
    height: 56,
    backgroundColor: colors.primary[700],
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIconText: {
    fontSize: 28,
  },
  content: {
    padding: 16,
  },
  
  // Featured Section
  featuredSection: {
    marginBottom: 24,
    marginTop: -32,
  },
  featuredHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  featuredTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  featuredBadge: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  featuredBadgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  featuredCards: {
    gap: 16,
  },
  featuredCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  featuredCardPrimary: {
    backgroundColor: colors.primary[700],
  },
  featuredCardSecondary: {
    backgroundColor: colors.secondary[600],
  },
  featuredIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  featuredIcon: {
    fontSize: 24,
  },
  featuredLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
    marginBottom: 8,
  },
  featuredValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 12,
  },
  featuredFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  featuredFooterText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  
  // Section Styles
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  sectionIcon: {
    width: 36,
    height: 36,
    backgroundColor: colors.primary[100],
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionIconText: {
    fontSize: 18,
  },
  sectionBadge: {
    backgroundColor: colors.primary[100],
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  sectionBadgeText: {
    color: colors.primary[700],
    fontSize: 12,
    fontWeight: '700',
  },
  
  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  statIconCircle: {
    width: 48,
    height: 48,
    backgroundColor: colors.white,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIcon: {
    fontSize: 24,
  },
  statLabel: {
    fontSize: 12,
    color: colors.gray[600],
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  
  // Type List
  typeList: {
    gap: 12,
  },
  typeCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
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
  typeIconContainer: {
    width: 56,
    height: 56,
    backgroundColor: colors.primary[50],
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  typeIconText: {
    fontSize: 26,
  },
  typeContent: {
    flex: 1,
  },
  typeTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.gray[900],
  },
  typeAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary[700],
  },
  typeBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  typeCount: {
    fontSize: 13,
    color: colors.gray[600],
    fontWeight: '500',
  },
  typePercentBadge: {
    backgroundColor: colors.gray[100],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  typePercen: {
    fontSize: 12,
    color: colors.gray[700],
    fontWeight: '700',
  },
  typeProgressBar: {
    height: 6,
    backgroundColor: colors.gray[200],
    borderRadius: 3,
    overflow: 'hidden',
  },
  typeProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  
  // Donors List
  donorsList: {
    gap: 12,
  },
  donorCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
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
  donorRank: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  rankMedal: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  donorInfo: {
    flex: 1,
  },
  donorName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 6,
  },
  donorStats: {
    flexDirection: 'row',
    gap: 12,
  },
  donorStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  donorStatIcon: {
    fontSize: 14,
  },
  donorStatText: {
    fontSize: 13,
    color: colors.gray[600],
    fontWeight: '600',
  },
  donorAmountContainer: {
    alignItems: 'flex-end',
  },
  donorAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary[700],
  },
  
  // Trend List
  trendList: {
    gap: 12,
  },
  trendCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
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
  trendLeft: {
    width: 100,
  },
  trendMonth: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 4,
  },
  trendCount: {
    fontSize: 12,
    color: colors.gray[600],
    fontWeight: '500',
  },
  trendCenter: {
    flex: 1,
    paddingHorizontal: 12,
  },
  trendBarBg: {
    height: 8,
    backgroundColor: colors.gray[200],
    borderRadius: 4,
    overflow: 'hidden',
  },
  trendBar: {
    height: '100%',
    borderRadius: 4,
  },
  trendRight: {
    width: 100,
    alignItems: 'flex-end',
  },
  trendAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 4,
  },
  trendAvg: {
    fontSize: 11,
    color: colors.gray[600],
    fontWeight: '600',
  },
  
  // Method Grid
  methodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  methodCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    width: (Dimensions.get('window').width - 44) / 2,
    alignItems: 'center',
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
  methodIcon: {
    fontSize: 36,
    marginBottom: 12,
  },
  methodName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gray[900],
    textAlign: 'center',
    marginBottom: 8,
  },
  methodAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary[700],
    marginBottom: 12,
  },
  methodFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  methodCount: {
    fontSize: 11,
    color: colors.gray[600],
    fontWeight: '600',
  },
  methodPercent: {
    fontSize: 11,
    color: colors.primary[600],
    fontWeight: '700',
  },
  
  // Footer
  footer: {
    backgroundColor: colors.primary[50],
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  footerIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  footerText: {
    fontSize: 14,
    color: colors.gray[700],
    textAlign: 'center',
    lineHeight: 22,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  footerVerse: {
    fontSize: 13,
    color: colors.primary[700],
    fontWeight: '700',
  },
});

export default GivingReportScreen;
