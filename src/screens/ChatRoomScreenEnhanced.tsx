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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useAudioRecorder, RecordingPresets, AudioModule } from 'expo-audio';
import { useAuth } from '../context/AuthContext';
import api, { chatService } from '../services/api';
import { primaryColor, accentColor, dangerColor, colors } from '../theme/colors';

const backgroundColor = '#E8F0F2';
const textColor = colors.gray[800];
const myMessageColor = primaryColor;
const otherMessageColor = '#FFFFFF';

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
  
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  
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

  useEffect(() => {
    loadMessages();
    
    // Poll for new messages every 2 seconds for real-time feel
    const interval = setInterval(loadMessages, 2000);
    
    return () => {
      clearInterval(interval);
    };
  }, [groupId, user]);

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
      
      // Mark messages as read
      markMessagesAsRead();
    } catch (error) {
      console.error('Load messages error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markMessagesAsRead = async () => {
    try {
      await api.put(`/chat/groups/${groupId}/messages/read`);
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
      
      // Reload messages to get the new one
      await loadMessages();
      flatListRef.current?.scrollToEnd({ animated: true });
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
      // Request permissions using AudioModule
      const { status } = await AudioModule.getPermissionsAsync();
      
      if (status !== 'granted') {
        const { status: newStatus } = await AudioModule.requestPermissionsAsync();
        if (newStatus !== 'granted') {
          Alert.alert(
            'Permission Required', 
            'Please grant microphone permission in your device settings to record voice messages.'
          );
          return;
        }
      }

      await audioRecorder.record();
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please check microphone permissions.');
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

  const uploadMedia = async (uri: string, type: 'image' | 'file' | 'audio', fileName?: string) => {
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
    <View
      style={[
        styles.messageContainer,
        item.isOwn ? styles.ownMessage : styles.otherMessage,
      ]}
    >
      {!item.isOwn && (
        <Text style={styles.senderName}>{item.userName}</Text>
      )}
      
      {item.messageType === 'text' && (
        <Text style={[styles.messageText, item.isOwn && styles.ownMessageText]}>
          {item.message}
        </Text>
      )}
      
      {item.messageType === 'image' && item.fileUrl && (
        <TouchableOpacity onPress={() => {/* Open image viewer */}}>
          <Image 
            source={{ 
              uri: item.fileUrl.startsWith('http') 
                ? item.fileUrl 
                : `http://${Platform.OS === 'android' ? '10.0.2.2' : 'localhost'}:5000${item.fileUrl}` 
            }} 
            style={styles.imageMessage}
            resizeMode="cover"
          />
          {item.message && (
            <Text style={[styles.messageText, item.isOwn && styles.ownMessageText]}>
              {item.message}
            </Text>
          )}
        </TouchableOpacity>
      )}
      
      {item.messageType === 'file' && (
        <TouchableOpacity style={styles.fileMessage}>
          <Text style={styles.fileIcon}>📄</Text>
          <Text style={[styles.fileName, item.isOwn && styles.ownMessageText]}>
            {item.message || 'Document'}
          </Text>
        </TouchableOpacity>
      )}
      
      {item.messageType === 'audio' && (
        <TouchableOpacity style={styles.audioMessage}>
          <Text style={styles.audioIcon}>🎤</Text>
          <Text style={[styles.fileName, item.isOwn && styles.ownMessageText]}>
            Voice Message
          </Text>
        </TouchableOpacity>
      )}
      
      {item.messageType === 'video' && (
        <TouchableOpacity style={styles.fileMessage}>
          <Text style={styles.fileIcon}>🎥</Text>
          <Text style={[styles.fileName, item.isOwn && styles.ownMessageText]}>
            {item.message || 'Video'}
          </Text>
        </TouchableOpacity>
      )}
      
      <View style={styles.messageFooter}>
        <Text style={[styles.timestamp, item.isOwn && styles.ownTimestamp]}>
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
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Custom Header */}
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
          <Text style={styles.groupName}>{groupName}</Text>
          <Text style={styles.groupSubtitle}>Tap for group info</Text>
        </TouchableOpacity>
        
        <View style={styles.headerRight}>
          <TouchableOpacity 
            onPress={handleVideoCall} 
            style={styles.callButton}
            activeOpacity={0.7}
          >
            <Text style={styles.callIcon}>📹</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleAudioCall}
            style={styles.callButton}
            activeOpacity={0.7}
          >
            <Text style={styles.callIcon}>📞</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={primaryColor} />
            <Text style={styles.loadingText}>Loading messages...</Text>
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

        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={styles.attachButton}
            onPress={() => setShowAttachMenu(!showAttachMenu)}
          >
            <Text style={styles.attachButtonText}>➕</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#999"
            value={message}
            onChangeText={handleTyping}
            multiline
            maxLength={1000}
          />

          <TouchableOpacity
            style={[styles.sendButton, (!message.trim() || isSending) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!message.trim() || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.sendButtonText}>➤</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: backgroundColor,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary[800],
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerButton: {
    padding: 8,
    marginRight: 8,
  },
  backIcon: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  groupName: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  groupSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  callButton: {
    padding: 10,
    marginLeft: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  callIcon: {
    fontSize: 20,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    maxWidth: '75%',
    marginVertical: 6,
    padding: 14,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: myMessageColor,
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: otherMessageColor,
    borderWidth: 0,
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 13,
    fontWeight: '700',
    color: accentColor,
    marginBottom: 6,
    textTransform: 'capitalize',
  },
  messageText: {
    fontSize: 16,
    color: textColor,
    lineHeight: 22,
  },
  ownMessageText: {
    color: '#fff',
  },
  imageMessage: {
    width: 220,
    height: 220,
    borderRadius: 12,
    marginBottom: 8,
  },
  fileMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
  audioMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
  fileIcon: {
    fontSize: 24,
  },
  audioIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  fileName: {
    fontSize: 14,
    marginLeft: 8,
    color: textColor,
    fontWeight: '500',
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
    color: '#999',
    fontWeight: '500',
  },
  ownTimestamp: {
    color: 'rgba(255,255,255,0.8)',
  },
  typingContainer: {
    padding: 12,
    paddingLeft: 16,
  },
  typingText: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 14,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  attachButton: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachButtonText: {
    fontSize: 26,
    color: primaryColor,
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    maxHeight: 100,
    marginHorizontal: 10,
    fontSize: 16,
    color: textColor,
  },
  sendButton: {
    backgroundColor: primaryColor,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: primaryColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  sendButtonText: {
    fontSize: 22,
    color: '#fff',
    fontWeight: 'bold',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
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
    color: textColor,
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
    color: textColor,
  },
  closeButton: {
    fontSize: 28,
    color: '#666',
    fontWeight: '300',
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
    color: textColor,
    fontWeight: '500',
  },
  dangerItem: {
    backgroundColor: '#fff5f5',
  },
  dangerText: {
    color: dangerColor,
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
    color: textColor,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default ChatRoomScreenEnhanced;
