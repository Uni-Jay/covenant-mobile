import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  Platform,
  Image,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { sermonsService } from '../services';
import { Sermon } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../theme/colors';
import api from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { hasLeadershipAccess, hasMediaDepartment } from '../utils/rolePermissions';

export default function SermonManagementScreen({ navigation }: any) {
  const { colors: themeColors } = useTheme();
  const styles = createStyles(themeColors);
  const { user } = useAuth();
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSermon, setEditingSermon] = useState<Sermon | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [useFileUpload, setUseFileUpload] = useState(true); // Toggle between file upload and URL
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    preacher: '',
    date: '',
    category: 'Sunday Service',
    videoUrl: '',
    audioUrl: '',
    pdfUrl: '',
  });

  // Files for upload
  const [selectedFiles, setSelectedFiles] = useState<{
    video?: { uri: string; name: string; type: string };
    audio?: { uri: string; name: string; type: string };
    pdf?: { uri: string; name: string; type: string };
    thumbnail?: { uri: string; name: string; type: string };
  }>({});

  // Check if user has permission
  const hasPermission = hasLeadershipAccess(user?.role) || hasMediaDepartment(user?.departments as any);

  useEffect(() => {
    if (!hasPermission) {
      Alert.alert('Access Denied', 'You do not have permission to manage sermons.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
      return;
    }
    loadSermons();
  }, []);

  const loadSermons = async () => {
    try {
      const data = await sermonsService.getAll();
      setSermons(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load sermons');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadSermons();
    setIsRefreshing(false);
  };

  const handleAddNew = () => {
    setEditingSermon(null);
    const today = new Date();
    setSelectedDate(today);
    setFormData({
      title: '',
      description: '',
      preacher: '',
      date: today.toISOString().split('T')[0],
      category: 'Sunday Service',
      videoUrl: '',
      audioUrl: '',
      pdfUrl: '',
    });
    setSelectedFiles({});
    setUseFileUpload(true);
    setShowModal(true);
  };

  const handleEdit = (sermon: Sermon) => {
    setEditingSermon(sermon);
    const sermonDate = new Date(sermon.date);
    setSelectedDate(sermonDate);
    setFormData({
      title: sermon.title,
      description: sermon.description,
      preacher: sermon.preacher,
      date: sermonDate.toISOString().split('T')[0],
      category: sermon.category,
      videoUrl: sermon.videoUrl || '',
      audioUrl: sermon.audioUrl || '',
      pdfUrl: sermon.pdfUrl || '',
    });
    setShowModal(true);
  };

  const handleDelete = (sermon: Sermon) => {
    Alert.alert(
      'Delete Sermon',
      `Are you sure you want to delete "${sermon.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await sermonsService.delete(sermon.id);
              Alert.alert('Success', 'Sermon deleted successfully');
              loadSermons();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete sermon');
            }
          },
        },
      ]
    );
  };

  const pickFile = async (type: 'video' | 'audio' | 'pdf' | 'thumbnail') => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: type === 'video' ? 'video/*' : 
              type === 'audio' ? 'audio/*' : 
              type === 'thumbnail' ? 'image/*' : 
              'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setSelectedFiles({
          ...selectedFiles,
          [type]: {
            uri: file.uri,
            name: file.name,
            type: file.mimeType || 'application/octet-stream',
          },
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  const removeFile = (type: 'video' | 'audio' | 'pdf' | 'thumbnail') => {
    const updated = { ...selectedFiles };
    delete updated[type];
    setSelectedFiles(updated);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.description || !formData.preacher || !formData.date) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    try {
      if (editingSermon) {
        // For editing, just update text fields (file upload not supported in edit mode yet)
        await sermonsService.update(editingSermon.id, formData);
        Alert.alert('Success', 'Sermon updated successfully');
      } else {
        // For creating new sermon, use FormData if files are selected
        if (useFileUpload && Object.keys(selectedFiles).length > 0) {
          const formDataToSend = new FormData();
          
          // Add text fields
          formDataToSend.append('title', formData.title);
          formDataToSend.append('description', formData.description);
          formDataToSend.append('preacher', formData.preacher);
          formDataToSend.append('date', formData.date);
          formDataToSend.append('category', formData.category);
          
          // Add files
          if (selectedFiles.video) {
            formDataToSend.append('video', {
              uri: selectedFiles.video.uri,
              name: selectedFiles.video.name,
              type: selectedFiles.video.type,
            } as any);
          }
          if (selectedFiles.audio) {
            formDataToSend.append('audio', {
              uri: selectedFiles.audio.uri,
              name: selectedFiles.audio.name,
              type: selectedFiles.audio.type,
            } as any);
          }
          if (selectedFiles.pdf) {
            formDataToSend.append('pdf', {
              uri: selectedFiles.pdf.uri,
              name: selectedFiles.pdf.name,
              type: selectedFiles.pdf.type,
            } as any);
          }
          if (selectedFiles.thumbnail) {
            formDataToSend.append('thumbnail', {
              uri: selectedFiles.thumbnail.uri,
              name: selectedFiles.thumbnail.name,
              type: selectedFiles.thumbnail.type,
            } as any);
          }

          // Send with multipart form data
          const token = await AsyncStorage.getItem('token');
          const response = await api.post('/sermons', formDataToSend, {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${token}`,
            },
          });
          
          Alert.alert('Success', 'Sermon created successfully');
        } else {
          // Use regular JSON if no files or using URL mode
          await sermonsService.create(formData);
          Alert.alert('Success', 'Sermon created successfully');
        }
      }
      setShowModal(false);
      loadSermons();
    } catch (error: any) {
      console.error('Save error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to save sermon');
    } finally {
      setIsSaving(false);
    }
  };

  const categories = ['Sunday Service', 'Bible Study', 'Special', 'Conference'];

  if (!hasPermission) {
    return null;
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary[600], colors.primary[700]]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>🎙️ Sermon Management</Text>
        <Text style={styles.headerSubtitle}>Add, edit, or delete sermons</Text>
      </LinearGradient>

      <TouchableOpacity style={styles.addButton} onPress={handleAddNew}>
        <LinearGradient
          colors={[colors.secondary[600], colors.secondary[700]]}
          style={styles.addButtonGradient}
        >
          <Text style={styles.addButtonText}>+ Add New Sermon</Text>
        </LinearGradient>
      </TouchableOpacity>

      <ScrollView
        style={styles.sermonsList}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[colors.primary[600]]} />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary[600]} />
          </View>
        ) : sermons.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎙️</Text>
            <Text style={styles.emptyText}>No sermons yet</Text>
            <Text style={styles.emptySubtext}>Tap "Add New Sermon" to create one</Text>
          </View>
        ) : (
          sermons.map((sermon) => (
            <View key={sermon.id} style={styles.sermonItem}>
              <View style={styles.sermonInfo}>
                <Text style={styles.sermonTitle}>{sermon.title}</Text>
                <Text style={styles.sermonPreacher}>👤 {sermon.preacher}</Text>
                <Text style={styles.sermonMeta}>
                  {new Date(sermon.date).toLocaleDateString()} • {sermon.category}
                </Text>
                <View style={styles.resourceBadges}>
                  {sermon.videoUrl && <Text style={styles.badge}>📹 Video</Text>}
                  {sermon.audioUrl && <Text style={styles.badge}>🎵 Audio</Text>}
                  {sermon.pdfUrl && <Text style={styles.badge}>📄 PDF</Text>}
                </View>
              </View>
              <View style={styles.sermonActions}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.primary[100] }]}
                  onPress={() => handleEdit(sermon)}
                >
                  <Text style={[styles.actionButtonText, { color: colors.primary[700] }]}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#fee2e2' }]}
                  onPress={() => handleDelete(sermon)}
                >
                  <Text style={[styles.actionButtonText, { color: '#dc2626' }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={[colors.primary[600], colors.primary[700]]}
            style={styles.modalHeader}
          >
            <Text style={styles.modalTitle}>
              {editingSermon ? 'Edit Sermon' : 'Add New Sermon'}
            </Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              placeholder="Sermon title"
            />

            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Sermon description"
              multiline
              numberOfLines={4}
            />

            <Text style={styles.label}>Preacher *</Text>
            <TextInput
              style={styles.input}
              value={formData.preacher}
              onChangeText={(text) => setFormData({ ...formData, preacher: text })}
              placeholder="Preacher name"
            />

            <Text style={styles.label}>Date *</Text>
            <TouchableOpacity 
              style={styles.datePickerButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.datePickerText}>
                📅 {formData.date ? new Date(formData.date).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                }) : 'Select Date'}
              </Text>
            </TouchableOpacity>
            
            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, date) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (date) {
                    setSelectedDate(date);
                    setFormData({ ...formData, date: date.toISOString().split('T')[0] });
                  }
                }}
              />
            )}

            <Text style={styles.label}>Category *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    formData.category === cat && styles.categoryChipActive,
                  ]}
                  onPress={() => setFormData({ ...formData, category: cat })}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      formData.category === cat && styles.categoryChipTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Upload Mode Toggle */}
            {!editingSermon && (
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[styles.toggleButton, useFileUpload && styles.toggleButtonActive]}
                  onPress={() => setUseFileUpload(true)}
                >
                  <Text style={[styles.toggleText, useFileUpload && styles.toggleTextActive]}>
                    📁 Upload Files
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleButton, !useFileUpload && styles.toggleButtonActive]}
                  onPress={() => setUseFileUpload(false)}
                >
                  <Text style={[styles.toggleText, !useFileUpload && styles.toggleTextActive]}>
                    🔗 Enter URLs
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* File Upload Mode */}
            {useFileUpload && !editingSermon ? (
              <>
                <Text style={styles.sectionTitle}>📹 Upload Media Files</Text>
                
                {/* Video File */}
                <Text style={styles.label}>Video File (with audio included)</Text>
                {selectedFiles.video ? (
                  <View style={styles.fileSelected}>
                    <Text style={styles.fileName}>📹 {selectedFiles.video.name}</Text>
                    <TouchableOpacity onPress={() => removeFile('video')}>
                      <Text style={styles.removeFile}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.filePickerButton}
                    onPress={() => pickFile('video')}
                  >
                    <Text style={styles.filePickerText}>+ Choose Video File</Text>
                  </TouchableOpacity>
                )}
                {selectedFiles.video && (
                  <Text style={styles.helperText}>✓ Video already contains audio</Text>
                )}

                {/* Audio File - Only show if no video */}
                {!selectedFiles.video && (
                  <>
                    <Text style={styles.label}>Audio File (for audio-only sermons)</Text>
                    {selectedFiles.audio ? (
                      <View style={styles.fileSelected}>
                        <Text style={styles.fileName}>🎵 {selectedFiles.audio.name}</Text>
                        <TouchableOpacity onPress={() => removeFile('audio')}>
                          <Text style={styles.removeFile}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.filePickerButton}
                        onPress={() => pickFile('audio')}
                      >
                        <Text style={styles.filePickerText}>+ Choose Audio File</Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}

                {/* PDF File */}
                <Text style={styles.label}>PDF File (Optional)</Text>
                {selectedFiles.pdf ? (
                  <View style={styles.fileSelected}>
                    <Text style={styles.fileName}>📄 {selectedFiles.pdf.name}</Text>
                    <TouchableOpacity onPress={() => removeFile('pdf')}>
                      <Text style={styles.removeFile}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.filePickerButton}
                    onPress={() => pickFile('pdf')}
                  >
                    <Text style={styles.filePickerText}>+ Choose PDF File</Text>
                  </TouchableOpacity>
                )}

                {/* Thumbnail File */}
                <Text style={styles.label}>Thumbnail Image (Optional)</Text>
                {selectedFiles.thumbnail ? (
                  <>
                    <View style={styles.fileSelected}>
                      <Text style={styles.fileName}>🖼️ {selectedFiles.thumbnail.name}</Text>
                      <TouchableOpacity onPress={() => removeFile('thumbnail')}>
                        <Text style={styles.removeFile}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                    <Image 
                      source={{ uri: selectedFiles.thumbnail.uri }} 
                      style={styles.thumbnailPreview} 
                      resizeMode="cover"
                    />
                  </>
                ) : (
                  <TouchableOpacity
                    style={styles.filePickerButton}
                    onPress={() => pickFile('thumbnail')}
                  >
                    <Text style={styles.filePickerText}>+ Choose Thumbnail Image</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <>
                {/* URL Input Mode */}
                <Text style={styles.sectionTitle}>🔗 Media URLs</Text>

                <Text style={styles.label}>Video URL (YouTube or direct link)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.videoUrl}
                  onChangeText={(text) => setFormData({ ...formData, videoUrl: text })}
                  placeholder="https://youtube.com/watch?v=..."
                />

                <Text style={styles.label}>Audio URL (Optional)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.audioUrl}
                  onChangeText={(text) => setFormData({ ...formData, audioUrl: text })}
                  placeholder="https://..."
                />

                <Text style={styles.label}>PDF URL (Optional)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.pdfUrl}
                  onChangeText={(text) => setFormData({ ...formData, pdfUrl: text })}
                  placeholder="https://..."
                />
              </>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton]}
                onPress={handleSave}
                disabled={isSaving}
              >
                <LinearGradient
                  colors={[colors.secondary[600], colors.secondary[700]]}
                  style={styles.modalButtonGradient}
                >
                  {isSaving ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalButtonText}>
                      {editingSermon ? 'Update' : 'Create'}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  addButton: {
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  addButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sermonsList: {
    flex: 1,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.gray[600],
  },
  sermonItem: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sermonInfo: {
    marginBottom: 12,
  },
  sermonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 8,
  },
  sermonPreacher: {
    fontSize: 15,
    color: colors.primary[700],
    fontWeight: '600',
    marginBottom: 4,
  },
  sermonMeta: {
    fontSize: 14,
    color: colors.gray[600],
    marginBottom: 8,
  },
  resourceBadges: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  badge: {
    fontSize: 12,
    backgroundColor: colors.gray[100],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sermonActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 20,
  },
  // Modal Styles  
  modalContainer: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  modalHeader: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: '300',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.gray[300],
  },
  datePickerButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.gray[300],
    marginBottom: 8,
  },
  datePickerText: {
    fontSize: 16,
    color: colors.gray[900],
  },
  helperText: {
    fontSize: 13,
    color: '#059669',
    marginTop: -8,
    marginBottom: 8,
    fontWeight: '500',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  categoryScroll: {
    marginBottom: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.gray[200],
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: colors.primary[600],
  },
  categoryChipText: {
    fontSize: 14,
    color: colors.gray[700],
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.gray[200],
    borderRadius: 10,
    padding: 4,
    marginVertical: 16,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: colors.primary[600],
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray[900],
    marginTop: 20,
    marginBottom: 12,
  },
  filePickerButton: {
    backgroundColor: colors.primary[50],
    borderWidth: 2,
    borderColor: colors.primary[300],
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  filePickerText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary[700],
  },
  fileSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[900],
    flex: 1,
  },
  removeFile: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2626',
  },
  thumbnailPreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: colors.gray[200],
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 40,
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: colors.gray[200],
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalButtonTextCancel: {
    color: colors.gray[700],
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 16,
    textAlign: 'center',
  },
});
