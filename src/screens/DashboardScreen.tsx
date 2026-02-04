import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { dashboardService } from '../services';
import { useAuth } from '../context/AuthContext';
import { colors, primaryColor } from '../theme/colors';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      const [statsData, activityData] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getRecentActivity()
      ]);
      setStats(statsData);
      setRecentActivity(activityData);
    } catch (err: any) {
      console.error('Error fetching dashboard:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const renderStatCard = (title: string, value: string | number, subtitle?: string, color: string = primaryColor) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  const renderActivityItem = (item: any, index: number) => {
    const getActivityIcon = (type: string) => {
      switch (type) {
        case 'registration': return '👤';
        case 'first_timer': return '🎉';
        case 'post': return '📝';
        case 'prayer': return '🙏';
        case 'donation': return '💰';
        default: return '•';
      }
    };

    return (
      <View key={index} style={styles.activityItem}>
        <Text style={styles.activityIcon}>{getActivityIcon(item.activity_type)}</Text>
        <View style={styles.activityContent}>
          <Text style={styles.activityText}>{item.name}</Text>
          {item.activity_type === 'donation' && (
            <Text style={styles.activitySubtext}>
              ₦{item.amount?.toLocaleString()} - {item.donation_type}
            </Text>
          )}
          {item.activity_type === 'first_timer' && (
            <Text style={styles.activitySubtext}>
              {item.sunday_attendance_count} visits
            </Text>
          )}
          <Text style={styles.activityTime}>
            {new Date(item.created_at).toLocaleString()}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={primaryColor} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>⚠️ {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchDashboardData}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[primaryColor]} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <Text style={styles.headerSubtitle}>Welcome, {user?.firstName}!</Text>
      </View>

      {/* Overview Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsGrid}>
          {renderStatCard(
            'Total Members',
            stats?.members?.total || 0,
            `${stats?.members?.byRole?.length || 0} roles`,
            primaryColor
          )}
          {renderStatCard(
            'First-Timers',
            stats?.firstTimers?.active || 0,
            `${stats?.firstTimers?.convertedThisMonth || 0} converted this month`,
            colors.accent
          )}
          {renderStatCard(
            'Attendance',
            stats?.attendance?.sundayAverage || 0,
            'Average Sunday',
            '#10B981'
          )}
          {renderStatCard(
            'Active Prayers',
            stats?.prayers?.active || 0,
            undefined,
            '#8B5CF6'
          )}
        </View>
      </View>

      {/* This Month Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>This Month</Text>
        <View style={styles.statsGrid}>
          {renderStatCard(
            'Attendance',
            stats?.attendance?.totalThisMonth || 0,
            'Total check-ins',
            primaryColor
          )}
          {renderStatCard(
            'Donations',
            `₦${(stats?.donations?.totalThisMonth || 0).toLocaleString()}`,
            'Total giving',
            '#10B981'
          )}
          {renderStatCard(
            'Posts',
            stats?.community?.postsThisMonth || 0,
            'Community posts',
            colors.accent
          )}
          {renderStatCard(
            'Events',
            stats?.events?.upcoming || 0,
            'Upcoming',
            '#F59E0B'
          )}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: primaryColor }]}
            onPress={() => navigation.navigate('Events')}
          >
            <Text style={styles.actionIcon}>📅</Text>
            <Text style={styles.actionText}>Manage Events</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.accent }]}
            onPress={() => navigation.navigate('FirstTimers')}
          >
            <Text style={styles.actionIcon}>🎉</Text>
            <Text style={styles.actionText}>First-Timers</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#10B981' }]}
            onPress={() => navigation.navigate('Attendance')}
          >
            <Text style={styles.actionIcon}>✅</Text>
            <Text style={styles.actionText}>Attendance</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#8B5CF6' }]}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Text style={styles.actionIcon}>📧</Text>
            <Text style={styles.actionText}>Send Alerts</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityList}>
          {recentActivity.length > 0 ? (
            recentActivity.map((item, index) => renderActivityItem(item, index))
          ) : (
            <Text style={styles.emptyText}>No recent activity</Text>
          )}
        </View>
      </View>

      {/* Detailed Stats Navigation */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Detailed Reports</Text>
        <TouchableOpacity
          style={styles.reportButton}
          onPress={() => navigation.navigate('AttendanceReport')}
        >
          <Text style={styles.reportButtonText}>📊 Attendance Report</Text>
          <Text style={styles.reportArrow}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.reportButton}
          onPress={() => navigation.navigate('GivingReport')}
        >
          <Text style={styles.reportButtonText}>💰 Giving Report</Text>
          <Text style={styles.reportArrow}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.reportButton}
          onPress={() => navigation.navigate('EventsReport')}
        >
          <Text style={styles.reportButtonText}>📅 Events Report</Text>
          <Text style={styles.reportArrow}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.reportButton}
          onPress={() => navigation.navigate('GrowthReport')}
        >
          <Text style={styles.reportButtonText}>📈 Growth Metrics</Text>
          <Text style={styles.reportArrow}>→</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6B7280',
  },
  errorText: {
    fontSize: 16,
    color: colors.danger,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: primaryColor,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  statCard: {
    width: (width - 50) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    margin: 5,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statTitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statSubtitle: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  actionButton: {
    width: (width - 50) / 2,
    borderRadius: 12,
    padding: 20,
    margin: 5,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  activityList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  activityIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  activitySubtext: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 14,
    paddingVertical: 20,
  },
  reportButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 18,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  reportButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  reportArrow: {
    fontSize: 20,
    color: primaryColor,
  },
  footer: {
    height: 40,
  },
});

export default DashboardScreen;
