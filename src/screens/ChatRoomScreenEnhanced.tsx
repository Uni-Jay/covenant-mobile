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
import { colors } from '../theme/colors';
import { LinearGradient } from 'expo-linear-gradient';
import socketService from '../services/socket.service';

type RouteParams = {
  ChatRoom: {
    groupId: number;
    groupName: string;
    onMarkRead?: () => void;
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

interface GroupMember {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  profileImage?: string;
  photo?: string;
  role: string;
}

const ChatRoomScreenEnhanced = () => {
  const route = useRoute<RouteProp<RouteParams, 'ChatRoom'>>();
  const navigation = useNavigation();
  const { groupId, groupName } = route.params;
  const { user } = useAuth();
  const { colors, theme } = useTheme();
  const styles = createStyles(colors);
  
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
  
  // @ Mention functionality
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [filteredMembers, setFilteredMembers] = useState<GroupMember[]>([]);
  
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  
  const flatListRef = useRef<FlatList>(null);
  const textInputRef = useRef<TextInput>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Call functions removed - causing issues
  // const handleVideoCall = () => {
  //   startVideoCall();
  // };

  // const handleAudioCall = () => {
  //   startAudioCall();
  // };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleGroupInfo = () => {
    setShowGroupSettings(true);
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
    loadGroupMembers(); // Load members for @ mentions
    
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

  const loadGroupMembers = async () => {
    try {
      console.log('[ChatRoom] Loading group members for:', groupId);
      const response = await api.get(`/chat/groups/${groupId}/members`);
      const membersData = response.data.members || [];
      setGroupMembers(membersData);
      console.log('[ChatRoom] Loaded', membersData.length, 'members');
    } catch (error) {
      console.error('Load group members error:', error);
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
      
      // Trigger parent refresh if callback provided
      if (route.params?.onMarkRead) {
        route.params.onMarkRead();
      }
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

    // Detect @ mention
    const lastWord = text.split(' ').pop() || '';
    if (lastWord.startsWith('@') && lastWord.length > 1) {
      // Show mention suggestions
      const query = lastWord.substring(1).toLowerCase();
      setMentionQuery(query);
      const filtered = groupMembers.filter(member => {
        const fullName = `${member.first_name} ${member.last_name}`.toLowerCase();
        return fullName.includes(query) || member.email.toLowerCase().includes(query);
      });
      setFilteredMembers(filtered);
      setShowMentionSuggestions(true);
    } else if (lastWord === '@') {
      // Show all members
      setMentionQuery('');
      setFilteredMembers(groupMembers);
      setShowMentionSuggestions(true);
    } else {
      // Hide mention suggestions
      setShowMentionSuggestions(false);
    }
  };

  const handleSelectMention = (member: GroupMember) => {
    // Replace the @ mention with the selected user
    const words = message.split(' ');
    words[words.length - 1] = `@${member.first_name} ${member.last_name}`;
    const newMessage = words.join(' ') + ' ';
    setMessage(newMessage);
    setShowMentionSuggestions(false);
    
    // Keep focus on input
    setTimeout(() => {
      textInputRef.current?.focus();
    }, 100);
  };

  // Parse message text to highlight @ mentions
  const renderMessageText = (text: string, isOwn: boolean) => {
    const mentionRegex = /@([A-Za-z]+\s[A-Za-z]+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      // Add text before mention
      if (match.index > lastIndex) {
        parts.push(
          <Text key={`text-${lastIndex}`} style={[
            styles.messageText, 
            { color: isOwn ? '#FFFFFF' : colors.text }
          ]}>
            {text.substring(lastIndex, match.index)}
          </Text>
        );
      }

      // Add mention with highlighting
      parts.push(
        <Text 
          key={`mention-${match.index}`} 
          style={[
            styles.messageText, 
            styles.mentionText,
            { 
              color: isOwn ? '#FFFFFF' : colors.primary[700],
              backgroundColor: isOwn ? 'rgba(255,255,255,0.2)' : colors.primary[100],
            }
          ]}
        >
          {match[0]}
        </Text>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(
        <Text key={`text-${lastIndex}`} style={[
          styles.messageText, 
          { color: isOwn ? '#FFFFFF' : colors.text }
        ]}>
          {text.substring(lastIndex)}
        </Text>
      );
    }

    return parts.length > 0 ? <Text>{parts}</Text> : (
      <Text style={[
        styles.messageText, 
        { color: isOwn ? '#FFFFFF' : colors.text }
      ]}>
        {text}
      </Text>
    );
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
          <View style={{ padding: 12, paddingHorizontal: 16 }}>
            {renderMessageText(item.message, item.isOwn)}
          </View>
        )}
        
        {item.messageType === 'image' && item.fileUrl && (
          <TouchableOpacity 
            onPress={() => {
              const fullUrl = item.fileUrl!.startsWith('http') 
                ? item.fileUrl! 
                : `http://localhost:5000${item.fileUrl}`;
              setPreviewImage({ 
                uri: fullUrl, 
                messageId: item.id, 
                isOwn: item.isOwn 
              });
            }}
            activeOpacity={0.9}
            style={styles.mediaContainer}
          >
            <Image 
              source={{ 
                uri: item.fileUrl.startsWith('http') 
                  ? item.fileUrl 
                  : `http://localhost:5000${item.fileUrl}` 
              }} 
              style={styles.imageMessage}
              resizeMode="cover"
            />
            <View style={styles.mediaOverlay}>
              <Text style={styles.mediaIcon}>ðŸ–¼ï¸</Text>
            </View>
          </TouchableOpacity>
        )}
        
        {item.messageType === 'file' && item.fileUrl && (
          <TouchableOpacity 
            style={styles.fileMessage}
            onPress={() => {
              const fileUrl = item.fileUrl!.startsWith('http') 
                ? item.fileUrl! 
                : `http://localhost:5000${item.fileUrl}`;
              Linking.openURL(fileUrl);
            }}
          >
            <View style={[styles.fileIconContainer, { backgroundColor: item.isOwn ? 'rgba(255,255,255,0.3)' : 'rgba(127,29,29,0.15)' }]}>
              <Text style={styles.fileIcon}>ðŸ“„</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.fileName, { color: item.isOwn ? '#FFFFFF' : colors.text }]}>Document</Text>
              <Text style={[styles.fileSize, { color: item.isOwn ? 'rgba(255,255,255,0.7)' : colors.textSecondary }]}>Tap to open</Text>
            </View>
          </TouchableOpacity>
        )}
        
        {item.messageType === 'audio' && item.fileUrl && (
          <TouchableOpacity style={styles.audioMessage}>
            <View style={[styles.fileIconContainer, { backgroundColor: item.isOwn ? 'rgba(255,255,255,0.3)' : 'rgba(127,29,29,0.15)' }]}>
              <Text style={styles.audioIcon}>ðŸŽ¤</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.fileName, { color: item.isOwn ? '#FFFFFF' : colors.text }]}>Voice Message</Text>
              <Text style={[styles.fileSize, { color: item.isOwn ? 'rgba(255,255,255,0.7)' : colors.textSecondary }]}>Tap to play</Text>
            </View>
          </TouchableOpacity>
        )}
        
        {item.messageType === 'video' && item.fileUrl && (
          <View style={styles.mediaContainer}>
            <Video
              source={{ 
                uri: item.fileUrl.startsWith('http') 
                  ? item.fileUrl 
                  : `http://localhost:5000${item.fileUrl}` 
              }}
              style={styles.videoMessage}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              isLooping={false}
            />
            <View style={[styles.mediaOverlay, { backgroundColor: 'transparent' }]}>
              <View style={styles.playIconContainer}>
                <Text style={styles.playIcon}>â–¶ï¸</Text>
              </View>
            </View>
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
              {item.isRead ? 'âœ“âœ“' : 'âœ“'}
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
            <Text style={styles.backIcon}>â†</Text>
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
        </View>
      </LinearGradient>
      
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 20}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary[600]} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading messages...</Text>
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>ðŸ’¬</Text>
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
              <Text style={styles.attachIcon}>ðŸ“·</Text>
              <Text style={styles.attachText}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.attachOption} onPress={pickImage}>
              <Text style={styles.attachIcon}>ðŸ–¼ï¸</Text>
              <Text style={styles.attachText}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.attachOption} onPress={pickVideo}>
              <Text style={styles.attachIcon}>ðŸŽ¥</Text>
              <Text style={styles.attachText}>Video</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.attachOption} onPress={pickDocument}>
              <Text style={styles.attachIcon}>ðŸ“„</Text>
              <Text style={styles.attachText}>Document</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.attachOption} onPress={audioRecorder.isRecording ? stopRecording : startRecording}>
              <Text style={styles.attachIcon}>{audioRecorder.isRecording ? 'â¹ï¸' : 'ðŸŽ¤'}</Text>
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
                  <Text style={styles.closeButton}>âœ•</Text>
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
                <Text style={styles.settingIcon}>ðŸ‘¥</Text>
                <Text style={styles.settingText}>View Members</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.settingItem}
                onPress={() => {
                  setShowGroupSettings(false);
                  Alert.alert('Add Members', 'This feature will be available soon');
                }}
              >
                <Text style={styles.settingIcon}>âž•</Text>
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
                <Text style={styles.settingIcon}>ðŸ–¼ï¸</Text>
                <Text style={styles.settingText}>Change Group Photo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.settingItem}
                onPress={() => {
                  setShowGroupSettings(false);
                  Alert.alert('Notifications', 'Notification settings will be available soon');
                }}
              >
                <Text style={styles.settingIcon}>ðŸ””</Text>
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
                <Text style={styles.settingIcon}>â„¹ï¸</Text>
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
                <Text style={styles.settingIcon}>ðŸšª</Text>
                <Text style={[styles.settingText, styles.dangerText]}>Leave Group</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Image Preview Modal */}
        <Modal
          visible={previewImage !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setPreviewImage(null)}
        >
          <View style={styles.imagePreviewOverlay}>
            <TouchableOpacity 
              style={styles.imagePreviewClose}
              onPress={() => setPreviewImage(null)}
            >
              <Text style={styles.imagePreviewCloseText}>âœ•</Text>
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
                    <Text style={styles.imageActionIcon}>ðŸ’¾</Text>
                    <Text style={styles.imageActionText}>Save</Text>
                  </TouchableOpacity>

                  {previewImage.isOwn && (
                    <TouchableOpacity 
                      style={[styles.imageActionButton, styles.imageActionDanger]}
                      onPress={handleDeleteImage}
                    >
                      <Text style={styles.imageActionIcon}>ðŸ—‘ï¸</Text>
                      <Text style={styles.imageActionText}>Delete</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity 
                    style={styles.imageActionButton}
                    onPress={handleForwardImage}
                  >
                    <Text style={styles.imageActionIcon}>âž¡ï¸</Text>
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
                  <Text style={styles.closeButtonText}>Ã—</Text>
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
                    {selectedMessage.isRead ? 'âœ“âœ“ Read' : 'âœ“ Delivered'}
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
          {/* @ Mention Suggestions */}
          {showMentionSuggestions && filteredMembers.length > 0 && (
            <View style={[styles.mentionSuggestions, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
              <FlatList
                data={filteredMembers.slice(0, 5)} // Show max 5 suggestions
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.mentionItem, { borderBottomColor: colors.border }]}
                    onPress={() => handleSelectMention(item)}
                  >
                    {item.photo || item.profileImage ? (
                      <Image
                        source={{ uri: item.photo || item.profileImage }}
                        style={styles.mentionAvatar}
                      />
                    ) : (
                      <View style={[styles.mentionAvatar, styles.mentionAvatarPlaceholder, { backgroundColor: colors.primary[200] }]}>
                        <Text style={[styles.mentionAvatarText, { color: colors.primary[700] }]}>
                          {item.first_name[0]}{item.last_name[0]}
                        </Text>
                      </View>
                    )}
                    <View style={styles.mentionInfo}>
                      <Text style={[styles.mentionName, { color: colors.text }]}>
                        {item.first_name} {item.last_name}
                      </Text>
                      <Text style={[styles.mentionRole, { color: colors.textSecondary }]}>
                        {item.role}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                style={styles.mentionList}
                nestedScrollEnabled
              />
            </View>
          )}

          <TouchableOpacity
            style={[styles.attachButton, { backgroundColor: colors.primary[50] }]}
            onPress={() => setShowAttachMenu(!showAttachMenu)}
          >
            <Text style={[styles.attachButtonText, { color: colors.primary[600] }]}>âž•</Text>
          </TouchableOpacity>

          <TextInput
            ref={textInputRef}
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
                <Text style={styles.sendButtonText}>âž¤</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingVertical: 16,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  backIcon: {
    fontSize: 26,
    color: '#fff',
    fontWeight: '700',
  },
  headerTitle: {
    flex: 1,
  },
  headerTitleContainer: {
    justifyContent: 'center',
  },
  headerGroupName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 3,
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    marginBottom: 20,
    maxWidth: '80%',
    paddingHorizontal: 2,
  },
  messageBubble: {
    borderRadius: 20,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  ownMessage: {
    alignSelf: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 5,
    marginLeft: 6,
    textTransform: 'capitalize',
    letterSpacing: 0.3,
    opacity: 0.7,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
    letterSpacing: 0.2,
  },
  mediaContainer: {
    position: 'relative',
    borderRadius: 18,
    overflow: 'hidden',
    marginVertical: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  imageMessage: {
    width: 280,
    height: 280,
    borderRadius: 18,
  },
  videoMessage: {
    width: 320,
    height: 240,
    borderRadius: 18,
    backgroundColor: '#000',
  },
  mediaOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    padding: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  mediaIcon: {
    fontSize: 16,
  },
  playIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -36,
    marginTop: -36,
  },
  playIcon: {
    fontSize: 32,
    marginLeft: 4,
  },
  fileMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    minWidth: 240,
  },
  audioMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    minWidth: 240,
  },
  fileIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  fileIcon: {
    fontSize: 24,
  },
  audioIcon: {
    fontSize: 24,
  },
  fileName: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  fileSize: {
    fontSize: 12,
    marginTop: 3,
    opacity: 0.8,
  },
  checkmark: {
    fontSize: 13,
    marginLeft: 5,
    color: '#4fc3f7',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 6,
    paddingHorizontal: 10,
    paddingBottom: 6,
  },
  timestamp: {
    fontSize: 10,
    fontWeight: '500',
    opacity: 0.75,
    letterSpacing: 0.3,
  },
  typingContainer: {
    padding: 12,
    paddingLeft: 18,
  },
  typingText: {
    fontSize: 12,
    fontStyle: 'italic',
    opacity: 0.7,
    letterSpacing: 0.3,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    paddingHorizontal: 16,
    borderTopWidth: 0,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  attachButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  attachButtonText: {
    fontSize: 24,
    fontWeight: '600',
  },
  input: {
    flex: 1,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 11,
    paddingTop: 11,
    maxHeight: 110,
    marginHorizontal: 8,
    fontSize: 15,
    lineHeight: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  sendButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  sendButtonText: {
    fontSize: 22,
    color: '#fff',
    fontWeight: 'bold',
  },
  sendButtonDisabled: {
    elevation: 1,
    shadowOpacity: 0.05,
  },
  attachMenu: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    paddingVertical: 18,
    backgroundColor: '#fff',
    borderTopWidth: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  attachOption: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
  },
  attachIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  attachText: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
    letterSpacing: 0.5,
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
    fontSize: 72,
    marginBottom: 20,
    opacity: 0.8,
  },
  emptyText: {
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    letterSpacing: 0.2,
    opacity: 0.8,
  },
  // @ Mention styles
  mentionSuggestions: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    right: 0,
    maxHeight: 200,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  mentionList: {
    maxHeight: 200,
  },
  mentionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
  },
  mentionAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  mentionAvatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  mentionAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  mentionInfo: {
    flex: 1,
  },
  mentionName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 3,
    letterSpacing: 0.2,
  },
  mentionRole: {
    fontSize: 11,
    opacity: 0.7,
    letterSpacing: 0.3,
  },
  mentionText: {
    fontWeight: '700',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
});

export default ChatRoomScreenEnhanced;
