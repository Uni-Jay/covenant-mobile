import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Image,
  Alert,
  TextInput,
  Modal,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { eventsService } from '../services';
import { Event } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../theme/colors';
import { hasLeadershipAccess, hasMediaDepartment } from '../utils/rolePermissions';

export default function EventManagementScreen({ navigation }: any) {
  const { colors: themeColors } = useTheme();
  const styles = createStyles(themeColors);
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    category: 'Service',
    speaker: '',
    imageUrl: '',
  });

  // Check if user has permission
  const hasPermission = hasLeadershipAccess(user?.role) || hasMediaDepartment(user?.departments as any);

  useEffect(() => {
    if (!hasPermission) {
      Alert.alert('Access Denied', 'You do not have permission to manage events.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
      return;
    }
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await eventsService.getAll();
      setEvents(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load events');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadEvents();
    setIsRefreshing(false);
  };

  const handleAddNew = () => {
    setEditingEvent(null);
    setFormData({
      title: '',
      description: '',
      date: '',
      time: '',
      location: '',
      category: 'Service',
      speaker: '',
      imageUrl: '',
    });
    setShowModal(true);
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      date: new Date(event.date).toISOString().split('T')[0],
      time: event.time,
      location: event.location,
      category: event.category,
      speaker: event.speaker || '',
      imageUrl: event.imageUrl || '',
    });
    setShowModal(true);
  };

  const handleDelete = (event: Event) => {
    Alert.alert(
      'Delete Event',
      `Are you sure you want to delete "${event.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await eventsService.delete(event.id);
              Alert.alert('Success', 'Event deleted successfully');
              loadEvents();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete event');
            }
          },
        },
      ]
    );
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      setFormData({ ...formData, imageUrl: result.assets[0].uri });
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.description || !formData.date || !formData.time || !formData.location) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    try {
      if (editingEvent) {
        await eventsService.update(editingEvent.id, formData);
        Alert.alert('Success', 'Event updated successfully');
      } else {
        await eventsService.create(formData);
        Alert.alert('Success', 'Event created successfully');
      }
      setShowModal(false);
      loadEvents();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to save event');
    } finally {
      setIsSaving(false);
    }
  };

  const categories = ['Service', 'Conference', 'Seminar', 'Outreach', 'Fellowship'];

  if (!hasPermission) {
    return null;
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary[600], colors.primary[700]]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>📅 Event Management</Text>
        <Text style={styles.headerSubtitle}>Add, edit, or delete events</Text>
      </LinearGradient>

      <TouchableOpacity style={styles.addButton} onPress={handleAddNew}>
        <LinearGradient
          colors={[colors.secondary[600], colors.secondary[700]]}
          style={styles.addButtonGradient}
        >
          <Text style={styles.addButtonText}>+ Add New Event</Text>
        </LinearGradient>
      </TouchableOpacity>

      <ScrollView
        style={styles.eventsList}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[colors.primary[600]]} />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary[600]} />
          </View>
        ) : events.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyText}>No events yet</Text>
            <Text style={styles.emptySubtext}>Tap "Add New Event" to create one</Text>
          </View>
        ) : (
          events.map((event) => (
            <View key={event.id} style={styles.eventItem}>
              <View style={styles.eventInfo}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventMeta}>
                  {new Date(event.date).toLocaleDateString()} • {event.time}
                </Text>
                <Text style={styles.eventLocation}>📍 {event.location}</Text>
              </View>
              <View style={styles.eventActions}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.primary[100] }]}
                  onPress={() => handleEdit(event)}
                >
                  <Text style={[styles.actionButtonText, { color: colors.primary[700] }]}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#fee2e2' }]}
                  onPress={() => handleDelete(event)}
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
              {editingEvent ? 'Edit Event' : 'Add New Event'}
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
              placeholder="Event title"
            />

            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Event description"
              multiline
              numberOfLines={4}
            />

            <Text style={styles.label}>Date * (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={formData.date}
              onChangeText={(text) => setFormData({ ...formData, date: text })}
              placeholder="2026-12-31"
            />

            <Text style={styles.label}>Time *</Text>
            <TextInput
              style={styles.input}
              value={formData.time}
              onChangeText={(text) => setFormData({ ...formData, time: text })}
              placeholder="10:00 AM - 12:00 PM"
            />

            <Text style={styles.label}>Location *</Text>
            <TextInput
              style={styles.input}
              value={formData.location}
              onChangeText={(text) => setFormData({ ...formData, location: text })}
              placeholder="Church Auditorium"
            />

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

            <Text style={styles.label}>Speaker (Optional)</Text>
            <TextInput
              style={styles.input}
              value={formData.speaker}
              onChangeText={(text) => setFormData({ ...formData, speaker: text })}
              placeholder="Speaker name"
            />

            <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
              <Text style={styles.imagePickerText}>📷 {formData.imageUrl ? 'Change Image' : 'Add Image'}</Text>
            </TouchableOpacity>

            {formData.imageUrl && (
              <Image source={{ uri: formData.imageUrl }} style={styles.imagePreview} />
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
                      {editingEvent ? 'Update' : 'Create'}
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
  eventsList: {
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
  eventItem: {
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
  eventInfo: {
    marginBottom: 12,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 8,
  },
  eventMeta: {
    fontSize: 14,
    color: colors.gray[600],
    marginBottom: 4,
  },
  eventLocation: {
    fontSize: 14,
    color: colors.gray[700],
  },
  eventActions: {
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
  imagePickerButton: {
    backgroundColor: colors.primary[100],
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  imagePickerText: {
    fontSize: 16,
    color: colors.primary[700],
    fontWeight: '600',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 16,
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
