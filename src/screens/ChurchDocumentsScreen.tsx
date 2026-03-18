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
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Paths } from 'expo-file-system';
import { downloadAsync } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { Asset } from 'expo-asset';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { colors, primaryColor, dangerColor } from '../theme/colors';
import api from '../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');


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
  const { colors: themeColors } = useTheme();
  const styles = createStyles(themeColors);
  const primaryColor = themeColors.primary[600];
  const dangerColor = themeColors.error;
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [letterheads, setLetterheads] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'documents' | 'letterheads'>('documents');
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [selectedLetterhead, setSelectedLetterhead] = useState('church');
  const [isDownloadingLetterhead, setIsDownloadingLetterhead] = useState(false);

  const letterheadTypes = [
    { key: 'church', label: 'Church', iconName: 'business', iconType: 'ionicons' as const },
    { key: 'youth', label: 'Youth', iconName: 'people', iconType: 'ionicons' as const },
    { key: 'choir', label: 'Choir', iconName: 'musical-notes', iconType: 'ionicons' as const },
    { key: 'goodwomen', label: 'Goodwomen', iconName: 'woman', iconType: 'ionicons' as const },
    { key: 'covenantmen', label: 'Covenantmen', iconName: 'man', iconType: 'ionicons' as const },
    { key: 'drama', label: 'Drama', iconName: 'drama-masks', iconType: 'material-community' as const },
    { key: 'children', label: 'Children', iconName: 'balloon', iconType: 'ionicons' as const },
  ];

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
      const response = await api.get('/documents');
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
      const response = await api.get('/documents/letterheads/all');
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
        await api.post(`/documents/${doc.id}/download`);

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

  const getDocumentIcon = (type: string): { name: string; type: 'ionicons' | 'material-community' } => {
    switch (type) {
      case 'letterhead':
        return { name: 'document-text', type: 'ionicons' };
      case 'form':
        return { name: 'clipboard-list', type: 'material-community' };
      case 'certificate':
        return { name: 'certificate', type: 'material-community' };
      case 'policy':
        return { name: 'shield-checkmark', type: 'ionicons' };
      default:
        return { name: 'document', type: 'ionicons' };
    }
  };
  const downloadLetterhead = async () => {
    try {
      setIsDownloadingLetterhead(true);

      // Request permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant storage permission to download letterhead.');
        return;
      }

      // Only Church letterhead is available for now
      if (selectedLetterhead !== 'church') {
        Alert.alert('Coming Soon', `${selectedLetterhead.charAt(0).toUpperCase() + selectedLetterhead.slice(1)} letterhead will be available soon.`);
        return;
      }

      // Get the local asset URI directly without using deprecated downloadAsync
      const assetModule = require('../../assets/images/Church_letterhead.jpeg');
      const asset = Asset.fromModule(assetModule);
      
      // Get the URI - use localUri if available, otherwise use uri
      const assetUri = asset.localUri || asset.uri;
      
      if (!assetUri) {
        throw new Error('Could not load letterhead asset');
      }

      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(assetUri, {
          mimeType: 'image/jpeg',
          dialogTitle: `${selectedLetterhead.charAt(0).toUpperCase() + selectedLetterhead.slice(1)} Letterhead`,
        });
        Alert.alert('Success', 'Letterhead ready to download or share!');
      } else {
        Alert.alert('Error', 'Sharing is not available on this device.');
      }
    } catch (error) {
      console.error('Download letterhead error:', error);
      Alert.alert('Error', 'Failed to download letterhead. Please try again.');
    } finally {
      setIsDownloadingLetterhead(false);
    }
  };
  const renderDocument = ({ item }: { item: Document }) => (
    <TouchableOpacity
      style={styles.documentCard}
      onPress={() => downloadDocument(item)}
      disabled={downloadingId === item.id}
    >
      <View style={styles.documentIcon}>
        {(() => {
          const icon = getDocumentIcon(item.documentType);
          return icon.type === 'ionicons' ? (
            <Ionicons name={icon.name as any} size={32} color={primaryColor} />
          ) : (
            <MaterialCommunityIcons name={icon.name as any} size={32} color={primaryColor} />
          );
        })()}
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
          <Text style={styles.metaText}>  •  </Text>
          <Text style={styles.metaText}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
          {item.downloadCount > 0 && (
            <>
              <Text style={styles.metaText}>  •  </Text>
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
        <Ionicons name="download" size={24} color={primaryColor} />
      )}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="document-text-outline" size={64} color="#ccc" />
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
            <Ionicons 
              name="document-text" 
              size={20} 
              color={selectedTab === 'documents' ? '#fff' : themeColors.primary[600]} 
            />
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
            <Ionicons 
              name="newspaper" 
              size={20} 
              color={selectedTab === 'letterheads' ? '#fff' : themeColors.primary[600]} 
            />
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
          <Ionicons name="lock-closed" size={48} color={themeColors.error} />
          <Text style={styles.restrictedText}>Executives Only</Text>
          <Text style={styles.restrictedSubtext}>
            Letterheads are restricted to church executives
          </Text>
        </View>
      )}

      <FlatList
        data={selectedTab === 'documents' ? documents : []}
        renderItem={renderDocument}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        refreshing={isLoading}
        onRefresh={() => {
          setIsLoading(true);
          loadDocuments();
        }}
        ListHeaderComponent={
          selectedTab === 'letterheads' && isExecutive ? (
            <>
              {/* Letterhead segments */}
              <View style={styles.letterheadSegments}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.segmentsScrollContent}
                >
                  {letterheadTypes.map((type) => (
                    <TouchableOpacity
                      key={type.key}
                      style={[
                        styles.segmentButton,
                        selectedLetterhead === type.key && styles.segmentButtonActive
                      ]}
                      onPress={() => setSelectedLetterhead(type.key)}
                    >
                      {type.iconType === 'ionicons' ? (
                        <Ionicons 
                          name={type.iconName as any} 
                          size={18} 
                          color={selectedLetterhead === type.key ? '#fff' : themeColors.primary[600]} 
                        />
                      ) : (
                        <MaterialCommunityIcons 
                          name={type.iconName as any} 
                          size={18} 
                          color={selectedLetterhead === type.key ? '#fff' : themeColors.primary[600]} 
                        />
                      )}
                      <Text style={[
                        styles.segmentText,
                        selectedLetterhead === type.key && styles.segmentTextActive
                      ]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Letterhead content */}
              {selectedLetterhead === 'church' ? (
                <View style={styles.letterheadPreview}>
                  <Text style={styles.letterheadTitle}>Church Official Letterhead</Text>
                  <Text style={styles.letterheadSubtitle}>
                    Use this letterhead for official church correspondence
                  </Text>
                  
                  <View style={styles.imageContainer}>
                    <Image
                      source={require('../../assets/images/Church_letterhead.jpeg')}
                      style={styles.letterheadImage}
                      resizeMode="contain"
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.downloadButton, isDownloadingLetterhead && styles.downloadButtonDisabled]}
                    onPress={downloadLetterhead}
                    disabled={isDownloadingLetterhead}
                  >
                    {isDownloadingLetterhead ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="download" size={20} color="#fff" />
                        <Text style={styles.downloadButtonText}>Download Letterhead</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <View style={styles.usageNotes}>
                    <View style={styles.usageNotesHeader}>
                      <Ionicons name="information-circle" size={20} color={themeColors.primary[600]} />
                      <Text style={styles.usageNotesTitle}>Usage Notes:</Text>
                    </View>
                    <Text style={styles.usageNotesText}>
                      •  This letterhead is for official church communications only{'\n'}
                      •  Include proper authorization and signatures{'\n'}
                      •  Maintain professional tone and formatting{'\n'}
                      •  Keep a copy for church records
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.comingSoonContainer}>
                  {(() => {
                    const currentType = letterheadTypes.find(t => t.key === selectedLetterhead);
                    if (!currentType) return null;
                    
                    const IconComponent = currentType.iconType === 'ionicons' 
                      ? Ionicons 
                      : currentType.iconType === 'material-community' 
                      ? MaterialCommunityIcons 
                      : MaterialIcons;
                    
                    return (
                      <IconComponent 
                        name={currentType.iconName as any} 
                        size={64} 
                        color={themeColors.primary[400]} 
                      />
                    );
                  })()}
                  <Text style={styles.comingSoonTitle}>
                    {letterheadTypes.find(t => t.key === selectedLetterhead)?.label} Letterhead
                  </Text>
                  <Text style={styles.comingSoonText}>
                    Coming Soon
                  </Text>
                  <Text style={styles.comingSoonSubtext}>
                    This letterhead template will be available shortly
                  </Text>
                </View>
              )}
            </>
          ) : null
        }
      />
    </SafeAreaView>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text,
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
    color: colors.text,
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
    backgroundColor: colors.primary[600],
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary[600],
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
    backgroundColor: `${colors.primary[600]}15`,
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
    color: colors.text,
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
    color: colors.error,
    marginTop: 16,
  },
  restrictedSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  letterheadSegments: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  segmentsScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  segmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  segmentButtonActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[600],
  },
  segmentIcon: {
    fontSize: 18,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  segmentTextActive: {
    color: colors.primary[600],
  },
  letterheadContent: {
    flex: 1,
  },
  letterheadContentInner: {
    padding: 20,
  },
  letterheadPreview: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  letterheadTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  letterheadSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  imageContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  letterheadImage: {
    width: '100%',
    height: SCREEN_WIDTH * 1.4,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary[600],
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  downloadButtonDisabled: {
    backgroundColor: '#ccc',
  },
  downloadButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  usageNotes: {
    backgroundColor: '#f0f7ff',
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[600],
    padding: 16,
    borderRadius: 8,
  },
  usageNotesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  usageNotesTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.text,
  },
  usageNotesText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  comingSoonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  comingSoonIcon: {
    fontSize: 72,
    marginBottom: 16,
    opacity: 0.5,
  },
  comingSoonTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary[600],
    marginBottom: 8,
  },
  comingSoonSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default ChurchDocumentsScreen;
