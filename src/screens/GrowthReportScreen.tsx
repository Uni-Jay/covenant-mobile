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

const { width } = Dimensions.get('window');

const GrowthReportScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await dashboardService.getGrowth();
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

  const calculateGrowthRate = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous * 100).toFixed(1);
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
        <Text style={styles.headerTitle}>Growth Report</Text>
        <Text style={styles.headerSubtitle}>Church growth analytics and trends</Text>
      </View>

      {stats && (
        <View style={styles.content}>
          {/* Overall Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overall Summary</Text>
            <View style={styles.summaryGrid}>
              <View style={[styles.summaryCard, { backgroundColor: primaryColor + '20' }]}>
                <Text style={styles.summaryLabel}>Total Members</Text>
                <Text style={[styles.summaryValue, { color: primaryColor }]}>
                  {stats.totalMembers || 0}
                </Text>
                {stats.memberGrowthRate !== undefined && (
                  <Text style={[styles.growthRate, { color: stats.memberGrowthRate >= 0 ? '#10B981' : '#EF4444' }]}>
                    {stats.memberGrowthRate >= 0 ? '↑' : '↓'} {Math.abs(stats.memberGrowthRate)}%
                  </Text>
                )}
              </View>
              <View style={[styles.summaryCard, { backgroundColor: '#10B98120' }]}>
                <Text style={styles.summaryLabel}>First-Timers</Text>
                <Text style={[styles.summaryValue, { color: '#10B981' }]}>
                  {stats.totalFirstTimers || 0}
                </Text>
                <Text style={styles.subValue}>Active</Text>
              </View>
            </View>
          </View>

          {/* First-Timer Conversion */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>First-Timer Conversion</Text>
            <View style={styles.conversionCard}>
              <View style={styles.conversionStats}>
                <View style={styles.conversionStat}>
                  <Text style={styles.conversionValue}>{stats.totalFirstTimers || 0}</Text>
                  <Text style={styles.conversionLabel}>Total First-Timers</Text>
                </View>
                <View style={styles.conversionArrow}>
                  <Text style={styles.arrowText}>→</Text>
                </View>
                <View style={styles.conversionStat}>
                  <Text style={styles.conversionValue}>{stats.convertedMembers || 0}</Text>
                  <Text style={styles.conversionLabel}>Converted Members</Text>
                </View>
              </View>
              <View style={styles.conversionRateContainer}>
                <Text style={styles.conversionRateLabel}>Conversion Rate</Text>
                <Text style={styles.conversionRateValue}>
                  {stats.totalFirstTimers
                    ? ((stats.convertedMembers / stats.totalFirstTimers) * 100).toFixed(1)
                    : 0}%
                </Text>
              </View>
            </View>
          </View>

          {/* Attendance Growth */}
          {stats.attendanceGrowth && stats.attendanceGrowth.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Attendance Growth (Last 12 Months)</Text>
              <View style={styles.chartContainer}>
                {stats.attendanceGrowth.map((month: any, index: number) => {
                  const maxValue = Math.max(...stats.attendanceGrowth.map((m: any) => m.attendance));
                  const height = (month.attendance / maxValue) * 150;
                  
                  return (
                    <View key={index} style={styles.barContainer}>
                      <Text style={styles.barValue}>{month.attendance}</Text>
                      <View style={[styles.bar, { height, backgroundColor: primaryColor }]} />
                      <Text style={styles.barLabel}>{month.month.substring(0, 3)}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Member Growth by Month */}
          {stats.memberGrowth && stats.memberGrowth.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>New Members (Last 12 Months)</Text>
              {stats.memberGrowth.map((month: any, index: number) => (
                <View key={index} style={styles.monthCard}>
                  <View style={styles.monthInfo}>
                    <Text style={styles.monthName}>{month.month}</Text>
                    <View style={styles.monthBar}>
                      <View
                        style={[
                          styles.monthBarFill,
                          {
                            width: `${(month.newMembers / Math.max(...stats.memberGrowth.map((m: any) => m.newMembers))) * 100}%`,
                            backgroundColor: primaryColor
                          }
                        ]}
                      />
                    </View>
                  </View>
                  <Text style={styles.monthValue}>{month.newMembers}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Giving Growth */}
          {stats.givingGrowth && stats.givingGrowth.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Giving Trends (Last 6 Months)</Text>
              {stats.givingGrowth.map((month: any, index: number) => (
                <View key={index} style={styles.givingCard}>
                  <View style={styles.givingInfo}>
                    <Text style={styles.givingMonth}>{month.month}</Text>
                    <Text style={styles.givingCount}>{month.donations} donations</Text>
                  </View>
                  <Text style={styles.givingAmount}>₦{month.total.toLocaleString()}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Department Statistics */}
          {stats.byDepartment && stats.byDepartment.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Active Members by Department</Text>
              {stats.byDepartment.map((dept: any, index: number) => (
                <View key={index} style={styles.deptCard}>
                  <View style={styles.deptInfo}>
                    <Text style={styles.deptName}>{dept.department}</Text>
                    <View style={styles.deptBar}>
                      <View
                        style={[
                          styles.deptBarFill,
                          {
                            width: `${(dept.memberCount / Math.max(...stats.byDepartment.map((d: any) => d.memberCount))) * 100}%`,
                            backgroundColor: primaryColor
                          }
                        ]}
                      />
                    </View>
                  </View>
                  <Text style={styles.deptValue}>{dept.memberCount}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Service Attendance Breakdown */}
          {stats.serviceAttendance && stats.serviceAttendance.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Service Attendance (This Month)</Text>
              {stats.serviceAttendance.map((service: any, index: number) => (
                <View key={index} style={styles.serviceCard}>
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>{service.serviceType}</Text>
                    <Text style={styles.serviceCount}>{service.totalSessions} sessions</Text>
                  </View>
                  <View style={styles.serviceStats}>
                    <Text style={styles.serviceValue}>{service.totalAttendance}</Text>
                    <Text style={styles.serviceLabel}>Total</Text>
                  </View>
                  <View style={styles.serviceStats}>
                    <Text style={styles.serviceValue}>
                      {Math.round(service.avgAttendance)}
                    </Text>
                    <Text style={styles.serviceLabel}>Avg</Text>
                  </View>
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
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  growthRate: {
    fontSize: 14,
    fontWeight: '600',
  },
  subValue: {
    fontSize: 12,
    color: '#6B7280',
  },
  conversionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
  },
  conversionStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
  },
  conversionStat: {
    alignItems: 'center',
  },
  conversionValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: primaryColor,
    marginBottom: 5,
  },
  conversionLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  conversionArrow: {
    paddingHorizontal: 15,
  },
  arrowText: {
    fontSize: 32,
    color: '#9CA3AF',
  },
  conversionRateContainer: {
    backgroundColor: colors.primary + '20',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  conversionRateLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 5,
  },
  conversionRateValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: primaryColor,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    height: 220,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '70%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    marginBottom: 5,
  },
  barValue: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 5,
  },
  barLabel: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  monthCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthInfo: {
    flex: 1,
    marginRight: 15,
  },
  monthName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  monthBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
  },
  monthBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  monthValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: primaryColor,
  },
  givingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  givingInfo: {
    flex: 1,
  },
  givingMonth: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  givingCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  givingAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: primaryColor,
  },
  deptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deptInfo: {
    flex: 1,
    marginRight: 15,
  },
  deptName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  deptBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
  },
  deptBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  deptValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: primaryColor,
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  serviceCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  serviceStats: {
    alignItems: 'center',
    marginLeft: 20,
  },
  serviceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: primaryColor,
    marginBottom: 2,
  },
  serviceLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
});

export default GrowthReportScreen;
