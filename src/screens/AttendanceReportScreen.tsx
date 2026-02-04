import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  TextInput
} from 'react-native';
import { attendanceService } from '../services';
import { colors, primaryColor } from '../theme/colors';

const AttendanceReportScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [statistics, setStatistics] = useState<any>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [serviceType, setServiceType] = useState('');

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      const data = await attendanceService.getReport(startDate, endDate, serviceType);
      setReport(data.attendance);
      setStatistics(data.statistics);
      const stats = await attendanceService.getStatistics();
      setStatistics({ ...data.statistics, ...stats });
    } catch (err: any) {
      console.error('Error fetching report:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchReport();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={primaryColor} />
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
        <Text style={styles.headerTitle}>Attendance Report</Text>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <Text style={styles.filterLabel}>Service Type</Text>
        <View style={styles.serviceButtons}>
          {['all', 'sunday_service', 'sunday_school', 'tuesday_prayer', 'thursday_bible_study'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.serviceButton,
                serviceType === type && styles.serviceButtonActive
              ]}
              onPress={() => {
                setServiceType(type === 'all' ? '' : type);
                setLoading(true);
                fetchReport();
              }}
            >
              <Text style={[
                styles.serviceButtonText,
                serviceType === type && styles.serviceButtonTextActive
              ]}>
                {type.replace(/_/g, ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Statistics */}
      {statistics && (
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{statistics.thisMonth || 0}</Text>
              <Text style={styles.statLabel}>This Month</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{report?.length || 0}</Text>
              <Text style={styles.statLabel}>Total Records</Text>
            </View>
          </View>

          {statistics.byServiceType && (
            <>
              <Text style={styles.subTitle}>By Service Type</Text>
              {statistics.byServiceType.map((item: any, index: number) => (
                <View key={index} style={styles.statRow}>
                  <Text style={styles.statRowLabel}>
                    {item.service_type.replace(/_/g, ' ')}
                  </Text>
                  <Text style={styles.statRowValue}>{item.count}</Text>
                </View>
              ))}
            </>
          )}
        </View>
      )}

      {/* Attendance List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Records</Text>
        {report && report.length > 0 ? (
          report.slice(0, 50).map((item: any, index: number) => (
            <View key={index} style={styles.recordItem}>
              <View style={styles.recordHeader}>
                <Text style={styles.recordName}>
                  {item.first_name} {item.last_name}
                </Text>
                <Text style={styles.recordDate}>
                  {new Date(item.service_date).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.recordService}>
                {item.service_type.replace(/_/g, ' ')}
              </Text>
              <Text style={styles.recordTime}>
                {new Date(item.check_in_time).toLocaleTimeString()}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No records found</Text>
        )}
      </View>
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
  },
  filtersContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginTop: -10,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
  },
  serviceButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  serviceButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    margin: 5,
  },
  serviceButtonActive: {
    backgroundColor: primaryColor,
  },
  serviceButtonText: {
    color: '#6B7280',
    fontSize: 13,
    textTransform: 'capitalize',
  },
  serviceButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  statsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 20,
    marginBottom: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    marginHorizontal: -5,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    margin: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: primaryColor,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 8,
  },
  statRowLabel: {
    fontSize: 14,
    color: '#374151',
    textTransform: 'capitalize',
  },
  statRowValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: primaryColor,
  },
  section: {
    padding: 20,
  },
  recordItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  recordName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  recordDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  recordService: {
    fontSize: 14,
    color: '#374151',
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  recordTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 14,
    paddingVertical: 40,
  },
});

export default AttendanceReportScreen;
