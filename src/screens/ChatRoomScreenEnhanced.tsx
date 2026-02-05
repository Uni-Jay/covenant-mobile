import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  Linking,
  AppState,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp, useNavigation, useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useAudioRecorder, RecordingPresets } from 'expo-audio';
import { Video, ResizeMode } from 'expo-av';
// import * as MediaLibrary from 'expo-media-library';
// import * as FileSystem from 'expo-file-system';
import { useAuth } from '../context/AuthContext';
import api, { chatService } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

type RouteParams = {
  ChatRoom: {
    groupId: number;
    groupName: string;
  };
};

interface Message {
  id: number;
  userId: number;
  userName: string;
  message: string;
  messageType: 'text' | 'image' | 'file' | 'audio' | 'video';
  fileUrl?: string;
  isRead: boolean;
  createdAt: string;
  isOwn: boolean;
}

interface TypingUser {
  id: number;
  name: string;
}

const ChatRoomScreenEnhanced = () => {
  const route = useRoute<RouteProp<RouteParams, 'ChatRoom'>>();
  const navigation = useNavigation();
  const { groupId, groupName } = route.params;
  const { user } = useAuth();
  const { colors, theme } = useTheme();
  
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showMessageInfo, setShowMessageInfo] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ uri: string; messageId: number; isOwn: boolean } | null>(null);
  
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleVideoCall = () => {
    startVideoCall();
  };

  const handleAudioCall = () => {
    startAudioCall();
  };

  const handleGroupInfo = () => {
    setShowGroupSettings(true);
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleSaveImage = async () => {
    if (!previewImage) return;
    Alert.alert('Save Feature', 'Save to gallery feature requires app rebuild. Please free up disk space and run: npx expo run:android');
    // try {
    //   // Request media library permissions
    //   const { status } = await MediaLibrary.requestPermissionsAsync();
    //   if (status !== 'granted') {
    //     Alert.alert('Permission Required', 'Please grant media library access to save images.');
    //     return;
    //   }
    //   
    //   // Download the file
    //   const fileUri = FileSystem.documentDirectory + 'temp_image.jpg';
    //   const downloadResult = await FileSystem.downloadAsync(previewImage.uri, fileUri);

    //   if (downloadResult.status === 200) {
    //     // Save to media library
    //     const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
    //     await MediaLibrary.createAlbumAsync('Covenant Church', asset, false);
    //     
    //     Alert.alert('Success', 'Image saved to gallery');
    //     setPreviewImage(null);
    //   } else {
    //     Alert.alert('Error', 'Failed to download image');
    //   }
    // } catch (error) {
    //   console.error('Save image error:', error);
    //   Alert.alert('Error', 'Failed to save image');
    // }
  };

  const handleDeleteImage = async () => {
    if (!previewImage || !previewImage.isOwn) return;
    
    Alert.alert(
      'Delete Image',
      'Are you sure you want to delete this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Optimistically remove from local state
              setMessages(prev => prev.filter(msg => msg.id !== previewImage.messageId));
              setPreviewImage(null);
              
              // Delete from server in background
              await api.delete(`/chat/messages/${previewImage.messageId}`);
              
              // Reload to sync with server
              loadMessages();
            } catch (error) {
              console.error('Delete image error:', error);
              Alert.alert('Error', 'Failed to delete image');
              // Reload to restore message if delete failed
              loadMessages();
            }
          },
        },
      ]
    );
  };

  const handleForwardImage = () => {
    Alert.alert('Forward', 'Forward feature coming soon!');
  };

  useEffect(() => {
    loadMessages();
    
    // Mark as read immediately when screen loads
    markMessagesAsRead();
    
    // Poll for new messages every 2 seconds for faster updates
    const interval = setInterval(loadMessages, 2000);
    
    return () => {
      clearInterval(interval);
    };
  }, [groupId, user]);

  // Mark messages as read when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      markMessagesAsRead();
      
      // Set up app state listener to mark as read when app comes to foreground
      const subscription = AppState.addEventListener('change', (nextAppState) => {
        if (nextAppState === 'active') {
          markMessagesAsRead();
        }
      });

      return () => {
        subscription.remove();
      };
    }, [groupId])
  );

  const loadMessages = async () => {
    try {
      console.log('[ChatRoom] Loading messages for group:', groupId);
      const response = await api.get(`/chat/groups/${groupId}/messages`);
      console.log('[ChatRoom] Response:', response.data);
      const messagesData = response.data.messages || [];
      console.log('[ChatRoom] Messages data count:', messagesData.length);
      const fetchedMessages = messagesData.map((msg: any) => ({
        id: msg.id,
        userId: msg.sender_id,
        userName: `${msg.first_name} ${msg.last_name}`,
        message: msg.message,
        messageType: msg.media_type || 'text',
        fileUrl: msg.media_url,
        isRead: msg.is_read,
        createdAt: msg.created_at,
        isOwn: msg.sender_id === user?.id,
      }));
      console.log('[ChatRoom] Fetched messages count:', fetchedMessages.length);
      console.log('[ChatRoom] Sample message:', fetchedMessages[0]);
      setMessages(fetchedMessages);
      console.log('[ChatRoom] Messages state updated');
    } catch (error) {
      console.error('Load messages error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markMessagesAsRead = async () => {
    try {
      await api.put(`/chat/groups/${groupId}/messages/read`);
      // Immediately update local state to show messages as read
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          !msg.isOwn ? { ...msg, isRead: true } : msg
        )
      );
    } catch (error) {
      console.error('Mark read error:', error);
    }
  };

  const handleTyping = (text: string) => {
    setMessage(text);
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleSend = async () => {
    if (!message.trim() || isSending) return;
    
    setIsSending(true);
    const messageText = message.trim();
    setMessage(''); // Clear input immediately for better UX
    
    try {
      const response = await api.post(`/chat/groups/${groupId}/messages`, {
        message: messageText,
        messageType: 'text',
      });
      
      // Immediately add the new message to local state for instant feedback
      const newMessage = {
        id: response.data.message.id,
        userId: user?.id || 0,
        userName: `${user?.firstName} ${user?.lastName}`,
        message: messageText,
        messageType: 'text' as const,
        fileUrl: undefined,
        isRead: false,
        createdAt: new Date().toISOString(),
        isOwn: true,
      };
      setMessages(prev => [...prev, newMessage]);
      
      // Scroll to end
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
      // Reload in background to sync with server
      loadMessages();
    } catch (error) {
      console.error('Send message error:', error);
      Alert.alert('Error', 'Failed to send message');
      setMessage(messageText); // Restore message on error
    } finally {
      setIsSending(false);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadMedia(result.assets[0].uri, 'image');
      }
    } catch (error) {
      console.error('Pick image error:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
    setShowAttachMenu(false);
  };

  const pickVideo = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadMedia(result.assets[0].uri, 'video');
      }
    } catch (error) {
      console.error('Pick video error:', error);
      Alert.alert('Error', 'Failed to pick video');
    }
    setShowAttachMenu(false);
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera permissions');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadMedia(result.assets[0].uri, 'image');
      }
    } catch (error) {
      console.error('Take photo error:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
    setShowAttachMenu(false);
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadMedia(result.assets[0].uri, 'file', result.assets[0].name);
      }
    } catch (error) {
      console.error('Pick document error:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
    setShowAttachMenu(false);
  };

  const startRecording = async () => {
    try {
      // expo-audio handles permissions internally
      // Just attempt to record and handle permission errors
      await audioRecorder.record();
    } catch (error: any) {
      console.error('Failed to start recording:', error);
      
      // Check if it's a permission error
      if (error?.message?.toLowerCase().includes('permission')) {
        Alert.alert(
          'Microphone Permission Required',
          'This app needs microphone access to record voice messages. Would you like to open settings?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => Linking.openSettings(),
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to start recording. Please try again.');
      }
    }
  };

  const stopRecording = async () => {
    try {
      await audioRecorder.stop();
      if (audioRecorder.uri) {
        await uploadMedia(audioRecorder.uri, 'audio', 'voice_message.m4a');
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to save recording');
    }
  };

  const startVideoCall = () => {
    Alert.alert(
      'Video Call',
      `Start a video call with ${groupName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Call',
          onPress: () => {
            // Navigate to video call screen
            const nav = navigation as any;
            nav.navigate('VideoCall', {
              groupId,
              groupName,
            });
          },
        },
      ]
    );
  };

  const startAudioCall = () => {
    Alert.alert(
      'Audio Call',
      `Start an audio call with ${groupName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Call',
          onPress: () => {
            // Navigate to audio call screen
            const nav = navigation as any;
            nav.navigate('AudioCall', {
              groupId,
              groupName,
            });
          },
        },
      ]
    );
  };

  const uploadMedia = async (uri: string, type: 'image' | 'file' | 'audio' | 'video', fileName?: string) => {
    setIsSending(true);
    try {
      const formData = new FormData();
      let fileType = 'application/octet-stream';
      let name = fileName || `upload_${Date.now()}`;

      if (type === 'image') {
        fileType = 'image/jpeg';
        name = `${Date.now()}.jpg`;
      } else if (type === 'audio') {
        fileType = 'audio/m4a';
        name = fileName || `voice_${Date.now()}.m4a`;
      } else if (type === 'video') {
        fileType = 'video/mp4';
        name = `${Date.now()}.mp4`;
      }

      formData.append('file', {
        uri,
        name,
        type: fileType,
      } as any);
      formData.append('messageType', type);

      await api.post(`/chat/groups/${groupId}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      await loadMessages();
      flatListRef.current?.scrollToEnd({ animated: true });
    } catch (error) {
      console.error('Upload media error:', error);
      Alert.alert('Error', 'Failed to upload file');
    } finally {
      setIsSending(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <TouchableOpacity
      onLongPress={() => {
        if (item.isOwn) {
          setSelectedMessage(item);
          setShowMessageInfo(true);
        }
      }}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.messageContainer,
          item.isOwn ? styles.ownMessage : styles.otherMessage,
        ]}
      >
      <Text style={[styles.senderName, { color: colors.textSecondary }]}>
        {item.isOwn ? 'Me' : item.userName}
      </Text>
      
      <View style={[
        styles.messageBubble,
        item.isOwn ? { backgroundColor: colors.primary[600] } : { backgroundColor: colors.surface },
      ]}>
        {item.messageType === 'text' && (
          <Text style={[
            styles.messageText, 
            { color: item.isOwn ? '#FFFFFF' : colors.text }
          ]}>
            {item.message}
          </Text>
        )}
        
        {item.messageType === 'image' && item.fileUrl && (
          <TouchableOpacity 
            onPress={() => {
              const fullUrl = item.fileUrl!.startsWith('http') 
                ? item.fileUrl! 
                : `http://${Platform.OS === 'android' ? '10.0.2.2' : 'localhost'}:3000${item.fileUrl}`;
              setPreviewImage({ 
                uri: fullUrl, 
                messageId: item.id, 
                isOwn: item.isOwn 
              });
            }}
            activeOpacity={0.9}
          >
            <Image 
              source={{ 
                uri: item.fileUrl.startsWith('http') 
                  ? item.fileUrl 
                  : `http://${Platform.OS === 'android' ? '10.0.2.2' : 'localhost'}:3000${item.fileUrl}` 
              }} 
              style={styles.imageMessage}
              resizeMode="cover"
            />
            {item.message && (
              <Text style={[
                styles.messageText, 
                { color: item.isOwn ? '#FFFFFF' : colors.text }
              ]}>
                {item.message}
              </Text>
            )}
          </TouchableOpacity>
        )}
        
        {item.messageType === 'file' && (
          <TouchableOpacity style={styles.fileMessage}>
            <View style={styles.fileIconContainer}>
              <Text style={styles.fileIcon}>📄</Text>
            </View>
            <Text style={[
              styles.fileName, 
              { color: item.isOwn ? '#FFFFFF' : colors.text }
            ]}>
              {item.message || 'Document'}
            </Text>
          </TouchableOpacity>
        )}
        
        {item.messageType === 'audio' && (
          <TouchableOpacity style={styles.audioMessage}>
            <View style={styles.fileIconContainer}>
              <Text style={styles.audioIcon}>🎤</Text>
            </View>
            <Text style={[
              styles.fileName, 
              { color: item.isOwn ? '#FFFFFF' : colors.text }
            ]}>
              Voice Message
            </Text>
          </TouchableOpacity>
        )}
        
        {item.messageType === 'video' && item.fileUrl && (
          <View>
            <Video
              source={{ 
                uri: item.fileUrl.startsWith('http') 
                  ? item.fileUrl 
                  : `http://${Platform.OS === 'android' ? '10.0.2.2' : 'localhost'}:3000${item.fileUrl}` 
              }}
              style={styles.videoMessage}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              isLooping={false}
            />
            {item.message && (
              <Text style={[
                styles.messageText, 
                { color: item.isOwn ? '#FFFFFF' : colors.text }
              ]}>
                {item.message}
              </Text>
            )}
          </View>
        )}
        
        <View style={styles.messageFooter}>
          <Text style={[
            styles.timestamp, 
            { color: item.isOwn ? 'rgba(255,255,255,0.7)' : colors.textSecondary }
          ]}>
            {new Date(item.createdAt).toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
          {item.isOwn && (
            <Text style={styles.checkmark}>
              {item.isRead ? '✓✓' : '✓'}
            </Text>
          )}
        </View>
      </View>
    </View>
    </TouchableOpacity>
  );

  const renderTypingIndicator = () => {
    if (typingUsers.length === 0) return null;
    
    return (
      <View style={styles.typingContainer}>
        <Text style={styles.typingText}>
          {typingUsers.map(u => u.name).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      {/* Custom Header with Gradient */}
      <LinearGradient
        colors={[colors.primary[600], colors.primary[700]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={handleGoBack}
            style={styles.headerButton}
            activeOpacity={0.7}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={handleGroupInfo} 
            style={styles.headerTitle}
            activeOpacity={0.7}
          >
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerGroupName}>{groupName}</Text>
              <Text style={styles.headerSubtitle}>Tap for group info</Text>
            </View>
          </TouchableOpacity>
          
          <View style={styles.headerRight}>
            <TouchableOpacity 
              onPress={handleVideoCall} 
              style={styles.callButton}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                style={styles.callButtonGradient}
              >
                <Text style={styles.callIcon}>📹</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleAudioCall}
              style={styles.callButton}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                style={styles.callButtonGradient}
              >
                <Text style={styles.callIcon}>📞</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
      
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary[600]} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading messages...</Text>
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>Be the first to send a message!</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ListFooterComponent={renderTypingIndicator}
          />
        )}

        {showAttachMenu && (
          <View style={styles.attachMenu}>
            <TouchableOpacity style={styles.attachOption} onPress={takePhoto}>
              <Text style={styles.attachIcon}>📷</Text>
              <Text style={styles.attachText}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.attachOption} onPress={pickImage}>
              <Text style={styles.attachIcon}>🖼️</Text>
              <Text style={styles.attachText}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.attachOption} onPress={pickVideo}>
              <Text style={styles.attachIcon}>🎥</Text>
              <Text style={styles.attachText}>Video</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.attachOption} onPress={pickDocument}>
              <Text style={styles.attachIcon}>📄</Text>
              <Text style={styles.attachText}>Document</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.attachOption} onPress={audioRecorder.isRecording ? stopRecording : startRecording}>
              <Text style={styles.attachIcon}>{audioRecorder.isRecording ? '⏹️' : '🎤'}</Text>
              <Text style={styles.attachText}>{audioRecorder.isRecording ? 'Stop' : 'Record'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Group Settings Modal */}
        <Modal
          visible={showGroupSettings}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowGroupSettings(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{groupName} Settings</Text>
                <TouchableOpacity onPress={() => setShowGroupSettings(false)}>
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity 
                style={styles.settingItem}
                onPress={() => {
                  setShowGroupSettings(false);
                  (navigation as any).navigate('GroupMembers', { 
                    groupId: groupId, 
                    groupName: groupName,
                    userRole: 'admin' // TODO: Get actual user role
                  });
                }}
              >
                <Text style={styles.settingIcon}>👥</Text>
                <Text style={styles.settingText}>View Members</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.settingItem}
                onPress={() => {
                  setShowGroupSettings(false);
                  Alert.alert('Add Members', 'This feature will be available soon');
                }}
              >
                <Text style={styles.settingIcon}>➕</Text>
                <Text style={styles.settingText}>Add Members</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.settingItem}
                onPress={async () => {
                  setShowGroupSettings(false);
                  const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: true,
                    aspect: [1, 1],
                    quality: 0.7,
                  });

                  if (!result.canceled) {
                    try {
                      await chatService.updateGroupSettings(groupId, { photo: result.assets[0] as any });
                      Alert.alert('Success', 'Group photo updated successfully');
                    } catch (error: any) {
                      Alert.alert('Error', error.message || 'Failed to update group photo');
                    }
                  }
                }}
              >
                <Text style={styles.settingIcon}>🖼️</Text>
                <Text style={styles.settingText}>Change Group Photo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.settingItem}
                onPress={() => {
                  setShowGroupSettings(false);
                  Alert.alert('Notifications', 'Notification settings will be available soon');
                }}
              >
                <Text style={styles.settingIcon}>🔔</Text>
                <Text style={styles.settingText}>Notifications</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.settingItem}
                onPress={async () => {
                  setShowGroupSettings(false);
                  try {
                    const { group } = await chatService.getGroupInfo(groupId);
                    Alert.alert(
                      'Group Info',
                      `Name: ${group.name}\nDescription: ${group.description}\nMembers: ${group.memberCount}\nCreated: ${new Date(group.created_at).toLocaleDateString()}`
                    );
                  } catch (error: any) {
                    Alert.alert('Error', error.message || 'Failed to load group info');
                  }
                }}
              >
                <Text style={styles.settingIcon}>ℹ️</Text>
                <Text style={styles.settingText}>Group Info</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.settingItem, styles.dangerItem]}
                onPress={() => {
                  setShowGroupSettings(false);
                  Alert.alert(
                    'Leave Group',
                    'Are you sure you want to leave this group?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Leave',
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            await chatService.leaveGroup(groupId);
                            Alert.alert('Success', 'You have left the group');
                            navigation.goBack();
                          } catch (error: any) {
                            Alert.alert('Error', error.message || 'Failed to leave group');
                          }
                        },
                      },
                    ]
                  );
                }}
              >
                <Text style={styles.settingIcon}>🚪</Text>
                <Text style={[styles.settingText, styles.dangerText]}>Leave Group</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Image Preview Modal */}
        <Modal
          visible={!!previewImage}
          transparent
          animationType="fade"
          onRequestClose={() => setPreviewImage(null)}
        >
          <View style={styles.imagePreviewOverlay}>
            <TouchableOpacity 
              style={styles.imagePreviewClose}
              onPress={() => setPreviewImage(null)}
            >
              <Text style={styles.imagePreviewCloseText}>✕</Text>
            </TouchableOpacity>

            {previewImage && (
              <>
                <Image
                  source={{ uri: previewImage.uri }}
                  style={styles.imagePreviewFull}
                  resizeMode="contain"
                />

                <View style={styles.imagePreviewActions}>
                  <TouchableOpacity 
                    style={styles.imageActionButton}
                    onPress={handleSaveImage}
                  >
                    <Text style={styles.imageActionIcon}>💾</Text>
                    <Text style={styles.imageActionText}>Save</Text>
                  </TouchableOpacity>

                  {previewImage.isOwn && (
                    <TouchableOpacity 
                      style={[styles.imageActionButton, styles.imageActionDanger]}
                      onPress={handleDeleteImage}
                    >
                      <Text style={styles.imageActionIcon}>🗑️</Text>
                      <Text style={styles.imageActionText}>Delete</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity 
                    style={styles.imageActionButton}
                    onPress={handleForwardImage}
                  >
                    <Text style={styles.imageActionIcon}>➡️</Text>
                    <Text style={styles.imageActionText}>Forward</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </Modal>

        {/* Message Info Modal */}
        <Modal
          visible={showMessageInfo}
          transparent
          animationType="slide"
          onRequestClose={() => setShowMessageInfo(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Message Info</Text>
                <TouchableOpacity onPress={() => setShowMessageInfo(false)} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>×</Text>
                </TouchableOpacity>
              </View>
              
              {selectedMessage && (
                <View style={{padding: 16}}>
                  <Text style={{fontSize: 14, color: '#666', marginBottom: 8}}>Message:</Text>
                  <Text style={{fontSize: 16, marginBottom: 16}}>{selectedMessage.message}</Text>
                  
                  <Text style={{fontSize: 14, color: '#666', marginBottom: 8}}>Sent:</Text>
                  <Text style={{fontSize: 16, marginBottom: 16}}>
                    {new Date(selectedMessage.createdAt).toLocaleString()}
                  </Text>
                  
                  <Text style={{fontSize: 14, color: '#666', marginBottom: 8}}>Status:</Text>
                  <Text style={{fontSize: 16, color: selectedMessage.isRead ? '#10b981' : '#f59e0b'}}>
                    {selectedMessage.isRead ? '✓✓ Read' : '✓ Delivered'}
                  </Text>
                  
                  <Text style={{fontSize: 12, color: '#999', marginTop: 16, fontStyle: 'italic'}}>
                    Note: Individual read receipts are not yet available
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Modal>

        <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.attachButton, { backgroundColor: colors.primary[50] }]}
            onPress={() => setShowAttachMenu(!showAttachMenu)}
          >
            <Text style={[styles.attachButtonText, { color: colors.primary[600] }]}>➕</Text>
          </TouchableOpacity>

          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
            placeholder="Type a message..."
            placeholderTextColor={colors.textSecondary}
            value={message}
            onChangeText={handleTyping}
            multiline
            maxLength={1000}
          />

          <TouchableOpacity
            style={[
              styles.sendButton, 
              (!message.trim() || isSending) && styles.sendButtonDisabled
            ]}
            onPress={handleSend}
            disabled={!message.trim() || isSending}
          >
            <LinearGradient
              colors={(!message.trim() || isSending) 
                ? [colors.gray[400], colors.gray[500]]
                : [colors.primary[500], colors.primary[600]]
              }
              style={styles.sendButtonGradient}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.sendButtonText}>➤</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingVertical: 14,
  },
  headerButton: {
    padding: 8,
    marginRight: 8,
  },
  backIcon: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '600',
  },
  headerTitle: {
    flex: 1,
  },
  headerTitleContainer: {
    justifyContent: 'center',
  },
  headerGroupName: {
    fontSize: 19,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  callButton: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  callButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callIcon: {
    fontSize: 22,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '75%',
    paddingHorizontal: 4,
  },
  messageBubble: {
    borderRadius: 20,
    padding: 14,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ownMessage: {
    alignSelf: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  senderName: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  imageMessage: {
    width: 240,
    height: 240,
    borderRadius: 16,
    marginBottom: 8,
  },
  videoMessage: {
    width: 280,
    height: 200,
    borderRadius: 16,
    marginBottom: 8,
    backgroundColor: '#000',
  },
  fileMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 10,
  },
  audioMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 10,
  },
  fileIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(59,130,246,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  fileIcon: {
    fontSize: 22,
  },
  audioIcon: {
    fontSize: 22,
  },
  fileName: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  checkmark: {
    fontSize: 14,
    marginLeft: 4,
    color: '#4fc3f7',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 6,
  },
  timestamp: {
    fontSize: 11,
    fontWeight: '500',
  },
  typingContainer: {
    padding: 12,
    paddingLeft: 16,
  },
  typingText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 14,
    borderTopWidth: 1,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  attachButton: {
    padding: 10,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  attachButtonText: {
    fontSize: 26,
  },
  input: {
    flex: 1,
    borderRadius: 26,
    paddingHorizontal: 20,
    paddingVertical: 12,
    maxHeight: 100,
    marginHorizontal: 8,
    fontSize: 16,
  },
  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  sendButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  sendButtonText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  sendButtonDisabled: {
    elevation: 0,
    shadowOpacity: 0,
  },
  attachMenu: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    elevation: 4,
  },
  attachOption: {
    alignItems: 'center',
    padding: 10,
  },
  attachIcon: {
    fontSize: 32,
    marginBottom: 6,
  },
  attachText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 28,
    color: '#666',
    fontWeight: '300',
  },
  imagePreviewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreviewClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 25,
  },
  imagePreviewCloseText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  imagePreviewFull: {
    width: '100%',
    height: '70%',
  },
  imagePreviewActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 40,
    paddingVertical: 30,
    position: 'absolute',
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  imageActionButton: {
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    minWidth: 80,
  },
  imageActionDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  imageActionIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  imageActionText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  settingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  dangerItem: {
    backgroundColor: '#fff5f5',
  },
  dangerText: {
    color: '#EF4444',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default ChatRoomScreenEnhanced;
