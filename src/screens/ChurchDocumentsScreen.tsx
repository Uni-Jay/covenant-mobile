import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Paths } from 'expo-file-system';
import { downloadAsync } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { primaryColor, accentColor, dangerColor, colors } from '../theme/colors';

const backgroundColor = colors.background;
const textColor = colors.gray[800];

interface Document {
  id: number;
  title: string;
  description: string;
  fileUrl: string;
  documentType: 'letterhead' | 'form' | 'certificate' | 'policy' | 'other';
  creatorFirstName: string;
  creatorLastName: string;
  createdAt: string;
  downloadCount: number;
}

const ChurchDocumentsScreen = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [letterheads, setLetterheads] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'documents' | 'letterheads'>('documents');
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

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
        return deptName.toLowerCase().includes('media');
      });
    }
    
    return false;
  }, [user]);

  const isExecutive = user?.role && [
    'super_admin', 'admin', 'pastor', 'elder', 'secretary', 
    'media_head', 'media', 'department_head', 'finance', 'deacon'
  ].includes(user.role);

  useEffect(() => {
    loadDocuments();
    if (isExecutive) {
      loadLetterheads();
    }
  }, []);

  const loadDocuments = async () => {
    try {
      const response = await api.get('/api/documents');
      setDocuments(response.data.documents);
    } catch (error) {
      console.error('Load documents error:', error);
      Alert.alert('Error', 'Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  const loadLetterheads = async () => {
    try {
      const response = await api.get('/api/documents/letterheads/all');
      setLetterheads(response.data.letterheads);
    } catch (error: any) {
      console.error('Load letterheads error:', error);
      if (error.response?.status === 403) {
        // User doesn't have access
        console.log('User is not an executive');
      }
    }
  };

  const downloadDocument = async (doc: Document) => {
    try {
      setDownloadingId(doc.id);

      const fileUrl = `${api.defaults.baseURL}${doc.fileUrl}`;
      const fileName = doc.fileUrl.split('/').pop() || `document_${doc.id}.pdf`;
      const fileUri = Paths.cache.uri + '/' + fileName;

      // Download the file
      const downloadResult = await downloadAsync(fileUrl, fileUri);

      if (downloadResult.status === 200) {
        // Record download
        await api.post(`/api/documents/${doc.id}/download`);

        // Share or open the file
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(downloadResult.uri);
        } else {
          Alert.alert('Success', 'Document downloaded successfully!');
        }
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to download document');
    } finally {
      setDownloadingId(null);
    }
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'letterhead':
        return '📄';
      case 'form':
        return '📋';
      case 'certificate':
        return '🏆';
      case 'policy':
        return '🛡️';
      default:
        return '📁';
    }
  };

  const renderDocument = ({ item }: { item: Document }) => (
    <TouchableOpacity
      style={styles.documentCard}
      onPress={() => downloadDocument(item)}
      disabled={downloadingId === item.id}
    >
      <View style={styles.documentIcon}>
        <Text style={styles.iconText}>{getDocumentIcon(item.documentType)}</Text>
      </View>

      <View style={styles.documentInfo}>
        <Text style={styles.documentTitle}>{item.title}</Text>
        {item.description && (
          <Text style={styles.documentDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        <View style={styles.documentMeta}>
          <Text style={styles.metaText}>
            By {item.creatorFirstName} {item.creatorLastName}
          </Text>
          <Text style={styles.metaText}>•</Text>
          <Text style={styles.metaText}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
          {item.downloadCount > 0 && (
            <>
              <Text style={styles.metaText}>•</Text>
              <Text style={styles.metaText}>
                {item.downloadCount} downloads
              </Text>
            </>
          )}
        </View>
      </View>

      {downloadingId === item.id ? (
        <ActivityIndicator size="small" color={primaryColor} />
      ) : (
        <Text style={styles.downloadIcon}>⬇️</Text>
      )}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📄</Text>
      <Text style={styles.emptyText}>
        {selectedTab === 'letterheads' 
          ? 'No letterheads available' 
          : 'No documents available'}
      </Text>
    </View>
  );

  // Access control check
  if (!isAdminOrMedia) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.accessDenied}>
          <Text style={styles.accessDeniedIcon}>🔒</Text>
          <Text style={styles.accessDeniedTitle}>Access Restricted</Text>
          <Text style={styles.accessDeniedText}>
            This section is only available to administrators and media department members.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
          <Text style={styles.loadingText}>Loading documents...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Church Documents</Text>
        <Text style={styles.headerSubtitle}>
          Official forms, policies, and letterheads
        </Text>
      </View>

      {isExecutive && (
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'documents' && styles.activeTab]}
            onPress={() => setSelectedTab('documents')}
          >
            <Text style={styles.tabIcon}>📄</Text>
            <Text style={[
              styles.tabText,
              selectedTab === 'documents' && styles.activeTabText
            ]}>
              Documents
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, selectedTab === 'letterheads' && styles.activeTab]}
            onPress={() => setSelectedTab('letterheads')}
          >
            <Text style={styles.tabIcon}>🏆</Text>
            <Text style={[
              styles.tabText,
              selectedTab === 'letterheads' && styles.activeTabText
            ]}>
              Letterheads
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {selectedTab === 'letterheads' && !isExecutive && (
        <View style={styles.restrictedAccess}>
          <Text style={styles.restrictedIcon}>🔒</Text>
          <Text style={styles.restrictedText}>Executives Only</Text>
          <Text style={styles.restrictedSubtext}>
            Letterheads are restricted to church executives
          </Text>
        </View>
      )}

      <FlatList
        data={selectedTab === 'documents' ? documents : letterheads}
        renderItem={renderDocument}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        refreshing={isLoading}
        onRefresh={() => {
          setIsLoading(true);
          if (selectedTab === 'documents') {
            loadDocuments();
          } else {
            loadLetterheads();
          }
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: backgroundColor,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: textColor,
  },
  accessDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: textColor,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    gap: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    gap: 8,
  },
  activeTab: {
    backgroundColor: primaryColor,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: primaryColor,
  },
  activeTabText: {
    color: '#fff',
  },
  listContainer: {
    padding: 16,
  },
  documentCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  documentIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${primaryColor}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 32,
  },
  downloadIcon: {
    fontSize: 24,
  },
  tabIcon: {
    fontSize: 20,
  },
  emptyIcon: {
    fontSize: 64,
    opacity: 0.3,
  },
  restrictedIcon: {
    fontSize: 48,
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: textColor,
    marginBottom: 4,
  },
  documentDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  documentMeta: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
  },
  restrictedAccess: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  restrictedText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: dangerColor,
    marginTop: 16,
  },
  restrictedSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default ChurchDocumentsScreen;
