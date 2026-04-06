import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  Share,
  Linking,
  AppState,
  Animated,
  Pressable,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp, useNavigation, useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Video, ResizeMode, Audio } from 'expo-av';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import * as Clipboard from 'expo-clipboard';
import { useAuth } from '../context/AuthContext';
import api, { chatService } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import socketService from '../services/socket.service';
import { getServerUrl } from '../config/network.config';
import { EMOJI, emojiTextProps } from '../utils/emojiRenderer';
import { MaterialIcons } from '@expo/vector-icons';

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

const REACTION_EMOJIS = [EMOJI.love, EMOJI.laugh, EMOJI.surprised, EMOJI.sad, EMOJI.pray, EMOJI.thumbsUp, EMOJI.thumbsDown, EMOJI.fire];

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

// ── Reply text encoder / parser ─────────────────────────────────────────────
const encodeReply = (replyUserName: string, replyText: string, actualText: string): string =>
  `> @${replyUserName}: ${replyText.replace(/\n/g, ' ').substring(0, 70)}\n${actualText}`;

const parseReply = (text: string): { replyUser: string; replyText: string; actualText: string } | null => {
  if (!text?.startsWith('> @')) return null;
  const lines = text.split('\n');
  const match = lines[0].match(/^> @(.+?): (.+)$/);
  if (!match) return null;
  return { replyUser: match[1], replyText: match[2], actualText: lines.slice(1).join('\n') };
};

// ── Voice Note waveform seed helper ──────────────────────────────────────────
const generateWaveform = (seed: string, bars = 30): number[] => {
  let hash = 5381;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) + hash + seed.charCodeAt(i)) | 0;
  }
  return Array.from({ length: bars }, (_, i) => {
    hash = ((hash << 5) + hash + i * 997) | 0;
    return 0.15 + (Math.abs(hash) % 100) / 100 * 0.85;
  });
};

const formatDuration = (secs: number): string => {
  const s = Math.floor(Math.max(secs, 0));
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
};

const SENDER_COLORS = ['#E53935', '#8E24AA', '#1E88E5', '#00897B', '#F4511E', '#6D4C41', '#1565C0', '#2E7D32'];
const getSenderColor = (name: string): string => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return SENDER_COLORS[Math.abs(h) % SENDER_COLORS.length];
};

// ── Voice Note Player Bubble ──────────────────────────────────────────────────
const VoiceNotePlayer = ({ uri, isOwn, savedDuration, senderInitials }: {
  uri: string; isOwn: boolean; savedDuration: number; senderInitials?: string;
}) => {
  const fullUri = uri.startsWith('http') ? uri : `${getServerUrl()}${uri}`;
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const [loaded, setLoaded] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const waveformRef = useRef<View>(null);
  const waveformWidth = useRef(0);
  const waveform = generateWaveform(uri);

  const isPlaying = status.playing ?? false;
  const duration = (status.duration > 0 ? status.duration : savedDuration) || 1;
  const currentTime = status.currentTime ?? 0;
  const progress = Math.min(currentTime / duration, 1);
  const playedBars = Math.round(progress * waveform.length);

  const handlePlayPause = async () => {
    if (!loaded) {
      player.replace({ uri: fullUri });
      setLoaded(true);
      player.play();
    } else if (isPlaying) {
      player.pause();
    } else {
      if (currentTime >= duration - 0.1) await player.seekTo(0);
      player.play();
    }
  };

  const handleWaveformPress = (evt: any) => {
    if (!loaded && !isPlaying) return;
    const tapX = evt.nativeEvent.locationX;
    const ratio = Math.max(0, Math.min(1, tapX / (waveformWidth.current || 160)));
    player.seekTo(ratio * duration);
  };

  const cycleSpeed = () => {
    const speeds = [1, 1.5, 2];
    const next = speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length];
    setPlaybackSpeed(next);
    (player as any).setRate?.(next);
  };

  const displayTime = loaded
    ? formatDuration(isPlaying || currentTime > 0 ? currentTime : savedDuration || duration)
    : formatDuration(savedDuration);

  // Colors – adapted for light-green own bubble (#DCF8C6) and white other bubble
  const activeColor   = isOwn ? '#2E7D32' : '#00796B';
  const inactiveColor = isOwn ? '#A5D6A7' : '#B0BEC5';
  const buttonBg      = isOwn ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.06)';
  const iconColor     = isOwn ? '#1B5E20' : '#00796B';
  const timeColor     = isOwn ? '#4E6847' : '#546E7A';
  const speedColor    = isOwn ? '#4E6847' : '#546E7A';

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8, minWidth: 220, gap: 8 }}>
      {/* Sender avatar (only shown for received messages) */}
      {!isOwn && (
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#1D4ED8', justifyContent: 'center', alignItems: 'center', alignSelf: 'flex-end' }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>{senderInitials || '?'}</Text>
        </View>
      )}

      {/* Play / Pause */}
      <TouchableOpacity
        onPress={handlePlayPause}
        activeOpacity={0.75}
        style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: buttonBg, justifyContent: 'center', alignItems: 'center' }}
      >
        <Text style={{ fontSize: 18, color: iconColor, marginLeft: isPlaying ? 0 : 3 }}>
          {isPlaying ? '⏸' : '▶'}
        </Text>
      </TouchableOpacity>

      {/* Waveform + time row */}
      <View style={{ flex: 1, gap: 4 }}>
        <View
          ref={waveformRef}
          onLayout={e => { waveformWidth.current = e.nativeEvent.layout.width; }}
          onStartShouldSetResponder={() => true}
          onResponderRelease={handleWaveformPress}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 2, height: 32 }}
        >
          {waveform.map((h, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                height: Math.max(3, h * 28),
                borderRadius: 2,
                backgroundColor: i < playedBars ? activeColor : inactiveColor,
              }}
            />
          ))}
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 11, color: timeColor }}>{displayTime}</Text>
          {/* Playback speed toggle – only when playing or loaded */}
          {(loaded) && (
            <TouchableOpacity onPress={cycleSpeed} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: speedColor }}>{playbackSpeed}×</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Mic icon (right side, like WhatsApp) */}
      <Text style={{ fontSize: 15 }}>🎤</Text>
    </View>
  );
};

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
  const [isRecordingActive, setIsRecordingActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const recordingRef = useRef<Audio.Recording | null>(null);

  // ── WhatsApp features state ──
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [contextMessage, setContextMessage] = useState<Message | null>(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showStarredMessages, setShowStarredMessages] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pinnedMessage, setPinnedMessage] = useState<Message | null>(null);
  const [starredIds, setStarredIds] = useState<Set<number>>(new Set());
  const [messageReactions, setMessageReactions] = useState<Record<number, Record<string, string[]>>>({});

  // @ Mention functionality
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [filteredMembers, setFilteredMembers] = useState<GroupMember[]>([]);

  // Group photo
  const [currentGroupPhoto, setCurrentGroupPhoto] = useState<string | null>(null);

  // Forward modal
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwardGroups, setForwardGroups] = useState<{ id: number; name: string }[]>([]);

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

  // Load mute preference for this group
  useEffect(() => {
    AsyncStorage.getItem(`muted_group_${groupId}`).then(val => {
      if (val === 'true') setIsMuted(true);
    });
  }, [groupId]);

  // Load starred messages + reactions + pinned message
  useEffect(() => {
    AsyncStorage.getItem(`starred_group_${groupId}`).then(val => {
      if (val) {
        try { setStarredIds(new Set(JSON.parse(val))); } catch (_) {}
      }
    });
    AsyncStorage.getItem(`reactions_group_${groupId}`).then(val => {
      if (val) {
        try { setMessageReactions(JSON.parse(val)); } catch (_) {}
      }
    });
    AsyncStorage.getItem(`pinned_group_${groupId}`).then(val => {
      if (val) {
        try { setPinnedMessage(JSON.parse(val)); } catch (_) {}
      }
    });
  }, [groupId]);

  useEffect(() => {
    loadMessages();
    loadGroupMembers(); // Load members for @ mentions
    loadGroupInfo();   // Load group photo + groups for forward
    
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

  const loadGroupInfo = async () => {
    try {
      const { group } = await chatService.getGroupInfo(groupId);
      if (group?.photo) setCurrentGroupPhoto(group.photo);
      // Load other groups for forward feature
      const groupsRes = await chatService.getGroups();
      const allGroups = (groupsRes.groups || groupsRes || []) as any[];
      setForwardGroups(allGroups.filter((g: any) => g.id !== groupId).map((g: any) => ({ id: g.id, name: g.name })));
    } catch (_) {}
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
            { color: colors.text }
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
              color: isOwn ? '#1B5E20' : '#00796B',
              backgroundColor: isOwn ? 'rgba(0,0,0,0.1)' : '#E8F5E9',
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
          { color: colors.text }
        ]}>
          {text.substring(lastIndex)}
        </Text>
      );
    }

    return parts.length > 0 ? <Text>{parts}</Text> : (
      <Text style={[
        styles.messageText, 
        { color: colors.text }
      ]}>
        {text}
      </Text>
    );
  };

  const handleSend = async () => {
    if (!message.trim() || isSending) return;
    
    setIsSending(true);
    const rawText = message.trim();
    const messageText = replyingTo
      ? encodeReply(replyingTo.userName, replyingTo.message, rawText)
      : rawText;
    setMessage('');
    setReplyingTo(null);
    
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
      setMessage(rawText); // Restore raw text on error
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
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert(
          'Microphone Permission Required',
          'This app needs microphone access to record voice messages.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setRecordingDuration(0);
      setIsRecordingActive(true);
      // Start duration timer
      durationTimerRef.current = setInterval(() => {
        setRecordingDuration(d => d + 1);
      }, 1000);
      // Start pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.35, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } catch (error: any) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    try {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
      pulseAnim.stopAnimation();
      Animated.timing(pulseAnim, { toValue: 1, duration: 100, useNativeDriver: true }).start();
      const finalDuration = recordingDuration;
      setIsRecordingActive(false);
      setRecordingDuration(0);

      const rec = recordingRef.current;
      recordingRef.current = null;

      if (!rec) {
        Alert.alert('Recording Error', 'No active recording found. Please try again.');
        return;
      }

      await rec.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = rec.getURI();

      if (uri) {
        const ext = uri.split('.').pop()?.toLowerCase() || 'm4a';
        await uploadMedia(uri, 'audio', `voice_${finalDuration}s.${ext}`);
      } else {
        Alert.alert('Recording Error', 'Could not save the recording file. Please try again.');
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to save recording');
    }
  };

  const cancelRecording = async () => {
    try {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
      pulseAnim.stopAnimation();
      Animated.timing(pulseAnim, { toValue: 1, duration: 100, useNativeDriver: true }).start();
      setIsRecordingActive(false);
      setRecordingDuration(0);
      const rec = recordingRef.current;
      recordingRef.current = null;
      if (rec) { await rec.stopAndUnloadAsync().catch(() => {}); }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    } catch (_) {}
  };

  const toggleNotifications = async () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    await AsyncStorage.setItem(`muted_group_${groupId}`, newMuted ? 'true' : 'false');
    Alert.alert(
      newMuted ? 'Notifications Muted' : 'Notifications Enabled',
      newMuted
        ? 'You will no longer receive notifications from this group.'
        : 'You will now receive notifications from this group.'
    );
  };

  // ── WhatsApp feature handlers ─────────────────────────────────────────────

  const openContextMenu = (msg: Message) => {
    setContextMessage(msg);
    setShowContextMenu(true);
  };

  const closeContextMenu = () => {
    setShowContextMenu(false);
    setShowReactionPicker(false);
  };

  const handleContextReply = () => {
    setReplyingTo(contextMessage);
    closeContextMenu();
    setTimeout(() => textInputRef.current?.focus(), 200);
  };

  const handleContextCopy = async () => {
    if (!contextMessage) return;
    const parsed = parseReply(contextMessage.message);
    const text = parsed ? parsed.actualText : contextMessage.message;
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', 'Text copied to clipboard');
    closeContextMenu();
  };

  const handleContextStar = async () => {
    if (!contextMessage) return;
    const id = contextMessage.id;
    setStarredIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      AsyncStorage.setItem(`starred_group_${groupId}`, JSON.stringify([...next]));
      return next;
    });
    closeContextMenu();
  };

  const handleContextPin = async () => {
    if (!contextMessage) return;
    const newPin = pinnedMessage?.id === contextMessage.id ? null : contextMessage;
    setPinnedMessage(newPin);
    await AsyncStorage.setItem(`pinned_group_${groupId}`, JSON.stringify(newPin));
    closeContextMenu();
  };

  const handleContextDelete = () => {
    if (!contextMessage || !contextMessage.isOwn) return;
    Alert.alert('Delete Message', 'Delete this message for everyone?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setMessages(prev => prev.filter(m => m.id !== contextMessage.id));
          closeContextMenu();
          try { await api.delete(`/chat/messages/${contextMessage.id}`); } catch (_) {}
        },
      },
    ]);
  };

  const handleContextForward = () => {
    if (!contextMessage) return;
    closeContextMenu();
    setShowForwardModal(true);
  };

  const handleForwardToGroup = async (targetGroupId: number) => {
    if (!contextMessage) return;
    setShowForwardModal(false);
    try {
      // Always forward with [FWD]\n + original message content
      let originalMsg = contextMessage.message || '';
      // Remove any existing [FWD]\n prefix
      if (originalMsg.startsWith('[FWD]\n')) originalMsg = originalMsg.slice(6);
      // For reply-wrapped text, unwrap
      const parsed = parseReply(originalMsg);
      if (contextMessage.messageType === 'text') {
        const clean = parsed ? parsed.actualText : originalMsg;
        await chatService.sendGroupMessage(targetGroupId, `[FWD]\n${clean}`);
      } else {
        // For media, forward with [FWD]\n + original message (filename/caption)
        await api.post(`/chat/groups/${targetGroupId}/messages`, {
          message: `[FWD]\n${originalMsg}`,
          forwardedMediaUrl: contextMessage.fileUrl,
          forwardedMediaType: contextMessage.messageType,
        });
      }
      Alert.alert('Forwarded', 'Message forwarded successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to forward message');
    }
  };

  const handleContextSave = async () => {
    if (!contextMessage?.fileUrl) return;
    closeContextMenu();
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Allow access to save media to your gallery.');
        return;
      }
      const fileUrl = contextMessage.fileUrl.startsWith('http')
        ? contextMessage.fileUrl
        : `${getServerUrl()}${contextMessage.fileUrl}`;
      const fileName = fileUrl.split('/').pop() || `media_${Date.now()}`;
      const fs = FileSystem as any;
      const tempDir = fs.documentDirectory ?? fs.cacheDirectory ?? '';
      const localUri = `${tempDir}${fileName}`;
      await fs.downloadAsync(fileUrl, localUri);
      const asset = await MediaLibrary.createAssetAsync(localUri);
      await MediaLibrary.createAlbumAsync('Covenant Church', asset, false);
      Alert.alert('Saved', 'Media saved to your gallery.');
    } catch (error) {
      console.error('Save media error:', error);
      Alert.alert('Error', 'Failed to save media.');
    }
  };

  const handleAddReaction = async (emoji: string) => {
    if (!contextMessage) return;
    const msgId = contextMessage.id;
    const myName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
    setMessageReactions(prev => {
      const msgReactions = { ...(prev[msgId] || {}) };
      const existingUsers = msgReactions[emoji] || [];
      if (existingUsers.includes(myName)) {
        const filtered = existingUsers.filter(n => n !== myName);
        if (filtered.length === 0) delete msgReactions[emoji];
        else msgReactions[emoji] = filtered;
      } else {
        msgReactions[emoji] = [...existingUsers, myName];
      }
      const next = { ...prev, [msgId]: msgReactions };
      AsyncStorage.setItem(`reactions_group_${groupId}`, JSON.stringify(next));
      return next;
    });
    closeContextMenu();
  };

  const handleDeleteMessage = async (msgId: number) => {
    setMessages(prev => prev.filter(m => m.id !== msgId));
    try { await api.delete(`/chat/messages/${msgId}`); } catch (_) {}
  };

  const uploadMedia = async (uri: string, type: 'image' | 'file' | 'audio' | 'video', fileName?: string) => {
    setIsSending(true);
    try {
      // DocumentPicker with copyToCacheDirectory: true already copies to cache
      // So the URI should be readable directly
      const formData = new FormData();
      let name = fileName || `upload_${Date.now()}`;
      // Derive mime type from file extension for documents
      const ext = name.split('.').pop()?.toLowerCase() || '';
      const mimeMap: Record<string, string> = {
        jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp',
        mp4: 'video/mp4', mov: 'video/quicktime', avi: 'video/x-msvideo', mkv: 'video/x-matroska',
        mp3: 'audio/mpeg', wav: 'audio/wav', m4a: 'audio/m4a', aac: 'audio/aac', ogg: 'audio/ogg',
        pdf: 'application/pdf',
        doc: 'application/msword',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        xls: 'application/vnd.ms-excel',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ppt: 'application/vnd.ms-powerpoint',
        pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        txt: 'text/plain', csv: 'text/csv',
        zip: 'application/zip',
      };
      let fileType = mimeMap[ext] || 'application/octet-stream';

      if (type === 'image') {
        fileType = 'image/jpeg';
        if (!ext) name = `${Date.now()}.jpg`;
      } else if (type === 'audio') {
        // Derive from actual file ext so Android .3gp / .aac / .m4a all work
        const audioExt = uri.split('.').pop()?.toLowerCase() || ext || 'm4a';
        const audioMime: Record<string, string> = {
          m4a: 'audio/m4a', aac: 'audio/aac', mp3: 'audio/mpeg',
          wav: 'audio/wav', ogg: 'audio/ogg', '3gp': 'audio/3gpp',
        };
        fileType = audioMime[audioExt] || 'audio/m4a';
        name = fileName || `voice_${Date.now()}.${audioExt}`;
      } else if (type === 'video') {
        fileType = mimeMap[ext] || 'video/mp4';
        if (!ext) name = `${Date.now()}.mp4`;
      }

      formData.append('file', {
        uri,
        name,
        type: fileType,
      } as any);
      formData.append('messageType', type);

      await api.post(`/chat/groups/${groupId}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000, // 60 seconds for large files
      });

      await loadMessages();
      flatListRef.current?.scrollToEnd({ animated: true });
    } catch (error: any) {
      console.error('Upload media error:', error?.response?.data || error?.message || error);
      Alert.alert('Error', `Failed to upload file: ${error?.response?.data?.error || error?.message || 'Unknown error'}`);
    } finally {
      setIsSending(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isForwarded = item.message?.startsWith('[FWD]');
    // For all types: strip [FWD]\n prefix for display/logic
    const rawText = isForwarded ? item.message.replace(/^\[FWD\]\n?/, '') : item.message;
    // For reply, only parse if not forwarded
    const parsedReply = !isForwarded && item.messageType === 'text' ? parseReply(item.message) : null;
    const displayText = parsedReply ? parsedReply.actualText : rawText;
    const msgReactions = messageReactions[item.id];
    const isStarred = starredIds.has(item.id);
    const reactionEntries = msgReactions ? Object.entries(msgReactions).filter(([, users]) => users.length > 0) : [];

    return (
      <Pressable
        onLongPress={() => openContextMenu(item)}
        delayLongPress={300}
        android_ripple={null}
        style={{ marginVertical: 8 }} // Add vertical gap between bubbles
      >
        <View
          style={[
            styles.messageContainer,
            item.isOwn ? styles.ownMessage : styles.otherMessage,
          ]}
        >
          {!item.isOwn && (
            <Text style={[styles.senderName, { color: getSenderColor(item.userName) }]}>
              {item.userName}
            </Text>
          )}
          
          <View style={[
            styles.messageBubble,
            item.isOwn ? styles.ownBubble : styles.otherBubble,
            !isForwarded && (item.messageType === 'image' || item.messageType === 'video') && { paddingTop: 0, paddingBottom: 0, overflow: 'hidden' },
            isForwarded && (item.messageType === 'image' || item.messageType === 'video') && { paddingBottom: 0, overflow: 'hidden' },
          ]}>
            {/* Forwarded label – WhatsApp style */}
            {isForwarded && (
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 8, paddingBottom: 2 }}>
                <Text style={{ fontSize: 11.5, color: colors.textSecondary, fontStyle: 'italic', letterSpacing: 0.2 }}>
                  ↪ Forwarded
                </Text>
              </View>
            )}

            {/* Reply preview block */}
            {parsedReply && (
              <View style={[styles.replyPreview, { marginHorizontal: 10, marginTop: 8 }]}>
                <Text style={styles.replyPreviewUser}>{parsedReply.replyUser}</Text>
                <Text style={styles.replyPreviewText} numberOfLines={2}>{parsedReply.replyText}</Text>
              </View>
            )}

            {item.messageType === 'text' && (
              <View style={{ padding: 12, paddingHorizontal: 16, paddingTop: parsedReply ? 6 : 12 }}>
                {renderMessageText(displayText, item.isOwn)}
              </View>
            )}
            
            {item.messageType === 'image' && item.fileUrl && (
              <TouchableOpacity 
                onPress={() => {
                  const fullUrl = item.fileUrl!.startsWith('http') 
                    ? item.fileUrl! 
                    : `${getServerUrl()}${item.fileUrl}`;
                  setPreviewImage({ uri: fullUrl, messageId: item.id, isOwn: item.isOwn });
                }}
                activeOpacity={0.9}
                style={styles.mediaContainer}
              >
                <Image 
                  source={{ 
                    uri: item.fileUrl.startsWith('http') ? item.fileUrl : `${getServerUrl()}${item.fileUrl}` 
                  }} 
                  style={styles.imageMessage}
                  resizeMode="cover"
                />
                {/* WhatsApp-style time overlay inside image */}
                <View style={styles.mediaTimeOverlay}>
                  <Text style={styles.mediaTimeText}>
                    {new Date(item.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  {item.isOwn && (
                    <MaterialIcons
                      name={item.isRead ? 'done-all' : 'done'}
                      size={14}
                      color="#fff"
                      style={{ marginLeft: 4 }}
                    />
                  )}
                </View>
              </TouchableOpacity>
            )}
            
            {item.fileUrl && (
              (() => {
                const ext = getFileExtension(item.message);
                const docExts = ["PDF", "DOC", "DOCX", "XLS", "XLSX", "PPT", "PPTX", "TXT", "CSV", "ZIP", "RAR"];
                if (!docExts.includes(ext)) return null;
                return (
                  <View style={styles.fileMessage}>
                    <View style={[styles.fileIconContainer, { backgroundColor: getFileColor(item.message) }]}> 
                      <Text style={styles.fileIcon}>{getFileIcon(item.message)}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                        <Text style={styles.fileIcon}>{getFileIcon(item.message)}</Text>
                        <Text style={[styles.fileName, { color: colors.text, marginLeft: 6 }]} numberOfLines={2}>
                          {item.message && !item.message.startsWith('> @') ? item.message : 'Document'}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={[styles.fileMeta, { color: colors.textSecondary, marginRight: 8 }]}> {getFileExtension(item.message)} </Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                      <TouchableOpacity
                        style={styles.openFileBtn}
                        onPress={async () => {
                          const fileUrl = item.fileUrl!.startsWith('http') 
                            ? item.fileUrl! 
                            : `${getServerUrl()}${item.fileUrl}`;
                          const fileName = fileUrl.split('/').pop() || 'document';
                          const fs = FileSystem as any;
                          const tempDir = fs.cacheDirectory ?? fs.documentDirectory ?? '';
                          const localPath = `${tempDir}${fileName}`;
                          try {
                            const downloadResult = await FileSystem.downloadAsync(fileUrl, localPath);
                            if (downloadResult.status !== 200) throw new Error('Download failed');
                            let uri = localPath;
                            // Android: getContentUriAsync for system reader
                            if (Platform.OS === 'android') {
                              uri = await FileSystem.getContentUriAsync(localPath);
                            }
                            Linking.openURL(uri);
                          } catch (err) {
                            Alert.alert('Open Failed', 'Could not open document.');
                          }
                        }}
                      >
                        <Text style={styles.openFileBtnText}>Open</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.openFileBtn, { backgroundColor: '#d1fae5', marginLeft: 8 }]}
                        onPress={async () => {
                          const fileUrl = item.fileUrl!.startsWith('http') 
                            ? item.fileUrl! 
                            : `${getServerUrl()}${item.fileUrl}`;
                          const fileName = fileUrl.split('/').pop() || 'document';
                          const fs = FileSystem as any;
                          const tempDir = fs.cacheDirectory ?? fs.documentDirectory ?? '';
                          const localPath = `${tempDir}${fileName}`;
                          try {
                            const downloadResult = await FileSystem.downloadAsync(fileUrl, localPath);
                            if (downloadResult.status !== 200) throw new Error('Download failed');
                            Alert.alert('Downloaded', `Saved to: ${localPath}`);
                          } catch (err) {
                            Alert.alert('Download Failed', 'Could not download document.');
                          }
                        }}
                      >
                        <Text style={[styles.openFileBtnText, { color: '#059669' }]}>Download</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })()
            )}
            
            {item.messageType === 'audio' && item.fileUrl && (
              <VoiceNotePlayer
                uri={item.fileUrl}
                isOwn={item.isOwn}
                savedDuration={parseInt(
                  (rawText || item.fileUrl)
                    ?.match(/voice_(\d+)s/)?.[1] || '0'
                )}
                senderInitials={item.userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)}
              />
            )}
            
            {item.messageType === 'video' && item.fileUrl && (
              <TouchableOpacity
                activeOpacity={0.88}
                style={styles.mediaContainer}
                onPress={() => {
                  const fullUrl = item.fileUrl!.startsWith('http')
                    ? item.fileUrl! : `${getServerUrl()}${item.fileUrl}`;
                  // Navigate to video player instead of opening in browser
                  (navigation as any).navigate('VideoPlayer', { videoUrl: fullUrl });
                }}
              >
                <Video
                  source={{
                    uri: item.fileUrl.startsWith('http')
                      ? item.fileUrl : `${getServerUrl()}${item.fileUrl}`,
                  }}
                  style={styles.videoMessage}
                  useNativeControls={false}
                  resizeMode={ResizeMode.COVER}
                  isLooping={false}
                  shouldPlay={false}
                />
                {/* Centered play button */}
                <View style={styles.videoPlayOverlay}>
                  <View style={styles.videoPlayBtn}>
                    <Text style={{ fontSize: 26, marginLeft: 4, color: '#fff' }}>▶</Text>
                  </View>
                </View>
                {/* WhatsApp-style time overlay */}
                <View style={styles.mediaTimeOverlay}>
                  <Text style={styles.mediaTimeText}>
                    {new Date(item.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  {item.isOwn && (
                    <MaterialIcons
                      name={item.isRead ? 'done-all' : 'done'}
                      size={14}
                      color="#fff"
                      style={{ marginLeft: 4 }}
                    />
                  )}
                </View>
              </TouchableOpacity>
            )}
            
            <View style={[
              styles.messageFooter,
              (item.messageType === 'image' || item.messageType === 'video') && { display: 'none' },
            ]}>
              {isStarred && <Text style={styles.starBadge}>⭐</Text>}
              <Text style={[
                styles.timestamp, 
                { color: colors.textSecondary }
              ]}>
                {new Date(item.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </Text>
              {item.isOwn && (
                <Text style={styles.checkmark}>{item.isRead ? '✓✓' : '✓'}</Text>
              )}
            </View>
          </View>

          {/* Reactions row */}
          {reactionEntries.length > 0 && (
            <View style={[styles.reactionsRow, item.isOwn ? { justifyContent: 'flex-end' } : {}]}>
              {reactionEntries.map(([emoji, users]) => (
                <TouchableOpacity
                  key={emoji}
                  style={styles.reactionChip}
                  onPress={() => {
                    setContextMessage(item);
                    handleAddReaction(emoji);
                  }}
                >
                  <Text style={styles.reactionEmoji} {...emojiTextProps}>{emoji}</Text>
                  <Text style={styles.reactionCount}>{users.length}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </Pressable>
    );
  };

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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.headerButton} activeOpacity={0.7}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerAvatar}>
          {currentGroupPhoto ? (
            <Image
              source={{ uri: `${getServerUrl()}${currentGroupPhoto}` }}
              style={{ width: 38, height: 38, borderRadius: 19 }}
            />
          ) : (
            <Text style={styles.headerAvatarText}>{groupName.substring(0, 2).toUpperCase()}</Text>
          )}
        </View>

        <TouchableOpacity onPress={handleGroupInfo} style={styles.headerTitleArea} activeOpacity={0.7}>
          <Text style={styles.headerGroupName}>{groupName}</Text>
          <Text style={styles.headerSubtitle}>
            {typingUsers.length > 0
              ? `${typingUsers.map(u => u.name).join(', ')} typing...`
              : 'Tap for group info'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerIconBtn} onPress={() => setShowSearchBar(s => !s)}>
          <Text style={styles.headerIcon}>🔍</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerIconBtn} onPress={handleGroupInfo}>
          <Text style={styles.headerIcon}>⋮</Text>
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      {showSearchBar && (
        <View style={styles.searchBarContainer}>
          <Text style={{ fontSize: 16, color: colors.textSecondary }}>🔍</Text>
          <TextInput
            style={styles.searchBarInput}
            placeholder="Search messages..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.searchBarClose}>
              <Text style={{ fontSize: 18, color: colors.textSecondary }}>✕</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => { setShowSearchBar(false); setSearchQuery(''); }}
            style={styles.searchBarClose}
          >
            <Text style={{ fontSize: 13, color: colors.primary[600], fontWeight: '600' }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Pinned message banner */}
      {pinnedMessage && (
        <TouchableOpacity
          style={styles.pinnedBanner}
          onPress={() => {
            const idx = messages.findIndex(m => m.id === pinnedMessage.id);
            if (idx >= 0) flatListRef.current?.scrollToIndex({ index: idx, animated: true });
          }}
        >
          <Text style={styles.pinnedIcon}>📌</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary[600] }}>Pinned Message</Text>
            <Text style={styles.pinnedText} numberOfLines={1}>
              {parseReply(pinnedMessage.message)?.actualText ?? pinnedMessage.message}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.pinnedDismiss}
            onPress={async () => {
              setPinnedMessage(null);
              await AsyncStorage.removeItem(`pinned_group_${groupId}`);
            }}
          >
            <Text style={{ fontSize: 16, color: colors.textSecondary }}>✕</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      )}
      
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
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>Be the first to send a message!</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={searchQuery.trim()
              ? messages.filter(m =>
                  m.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  m.userName.toLowerCase().includes(searchQuery.toLowerCase())
                )
              : messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => !searchQuery && flatListRef.current?.scrollToEnd({ animated: true })}
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
                <TouchableOpacity onPress={() => setShowGroupSettings(false)} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>{'×'}</Text>
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity 
                style={styles.settingItem}
                onPress={() => {
                  setShowGroupSettings(false);
                  (navigation as any).navigate('GroupMembers', { 
                    groupId: groupId, 
                    groupName: groupName,
                    userRole: 'admin'
                  });
                }}
              >
                <Text style={styles.settingIcon}>👥</Text>
                <Text style={styles.settingText}>View Members</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.settingItem}
                onPress={() => { setShowGroupSettings(false); setShowSearchBar(true); }}
              >
                <Text style={styles.settingIcon}>🔍</Text>
                <Text style={styles.settingText}>Search</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.settingItem}
                onPress={() => { setShowGroupSettings(false); setShowStarredMessages(true); }}
              >
                <Text style={styles.settingIcon}>⭐</Text>
                <Text style={styles.settingText}>Starred Messages</Text>
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

                  if (!result.canceled && result.assets[0]) {
                    try {
                      const asset = result.assets[0];
                      const filename = asset.uri.split('/').pop() || 'group_photo.jpg';
                      const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
                      const mimeType = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : 'image/jpeg';
                      const result2 = await chatService.updateGroupSettings(groupId, {
                        photo: { uri: asset.uri, name: filename, type: mimeType } as any,
                      });
                      // Use the actual server-generated path from the response
                      const serverPhotoPath = result2?.updates?.photo ?? result2?.photo ?? null;
                      if (serverPhotoPath) setCurrentGroupPhoto(serverPhotoPath);
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
                  toggleNotifications();
                }}
              >
                <Text style={styles.settingIcon}>{isMuted ? '🔕' : '🔔'}</Text>
                <Text style={styles.settingText}>{isMuted ? 'Unmute Notifications' : 'Mute Notifications'}</Text>
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

        {/* Context Menu Modal */}
        <Modal
          visible={showContextMenu}
          transparent
          animationType="slide"
          onRequestClose={closeContextMenu}
        >
          <Pressable style={styles.contextMenuOverlay} onPress={closeContextMenu}>
            <Pressable style={styles.contextMenuSheet} onPress={() => {}}>
              {/* Quick reactions */}
              <View style={styles.reactionPickerRow}>
                {REACTION_EMOJIS.map(emoji => (
                  <TouchableOpacity
                    key={emoji}
                    style={styles.reactionPickerBtn}
                    onPress={() => handleAddReaction(emoji)}
                  >
                    <Text 
                      style={styles.reactionPickerEmoji}
                      {...emojiTextProps}
                    >
                      {emoji}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Message preview */}
              {contextMessage && (
                <View style={styles.contextMenuMsgPreview}>
                  {contextMessage.message?.startsWith('[FWD]') && (
                    <Text style={{ fontSize: 11, fontStyle: 'italic', color: colors.textSecondary, marginBottom: 2 }}>↪ Forwarded</Text>
                  )}
                  <Text style={styles.contextMenuMsgText} numberOfLines={2}>
                    {(() => {
                      const raw = contextMessage.message?.startsWith('[FWD]')
                        ? contextMessage.message.replace(/^\[FWD\]\n?/, '')
                        : contextMessage.message;
                      return parseReply(raw)?.actualText ?? raw;
                    })()}
                  </Text>
                </View>
              )}

              <TouchableOpacity style={styles.contextMenuItem} onPress={handleContextReply}>
                <Text style={styles.contextMenuIcon}>↩️</Text>
                <Text style={styles.contextMenuText}>Reply</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.contextMenuItem} onPress={handleContextCopy}>
                <Text style={styles.contextMenuIcon}>📋</Text>
                <Text style={styles.contextMenuText}>Copy</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.contextMenuItem} onPress={handleContextForward}>
                <Text style={styles.contextMenuIcon}>➡️</Text>
                <Text style={styles.contextMenuText}>Forward</Text>
              </TouchableOpacity>

              {(contextMessage?.messageType === 'image' || contextMessage?.messageType === 'video') && (
                <TouchableOpacity style={styles.contextMenuItem} onPress={handleContextSave}>
                  <Text style={styles.contextMenuIcon}>💾</Text>
                  <Text style={styles.contextMenuText}>Save to Gallery</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.contextMenuItem} onPress={handleContextStar}>
                <Text style={styles.contextMenuIcon}>
                  {contextMessage && starredIds.has(contextMessage.id) ? '💛' : '⭐'}
                </Text>
                <Text style={styles.contextMenuText}>
                  {contextMessage && starredIds.has(contextMessage.id) ? 'Unstar' : 'Star'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.contextMenuItem} onPress={handleContextPin}>
                <Text style={styles.contextMenuIcon}>📌</Text>
                <Text style={styles.contextMenuText}>
                  {contextMessage && pinnedMessage?.id === contextMessage.id ? 'Unpin' : 'Pin'}
                </Text>
              </TouchableOpacity>

              {contextMessage?.isOwn && (
                <TouchableOpacity style={styles.contextMenuItem} onPress={handleContextDelete}>
                  <Text style={styles.contextMenuIcon}>🗑️</Text>
                  <Text style={[styles.contextMenuText, styles.contextMenuDanger]}>Delete</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={[styles.contextMenuItem, { borderBottomWidth: 0 }]} onPress={closeContextMenu}>
                <Text style={[styles.contextMenuText, { textAlign: 'center', flex: 1, color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Forward Modal */}
        <Modal
          visible={showForwardModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowForwardModal(false)}
        >
          <Pressable style={styles.contextMenuOverlay} onPress={() => setShowForwardModal(false)}>
            <Pressable style={styles.contextMenuSheet} onPress={() => {}}>
              <View style={[styles.contextMenuMsgPreview, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                <Text style={[styles.contextMenuMsgText, { fontWeight: '700', fontSize: 16 }]}>Forward to...</Text>
                <TouchableOpacity onPress={() => setShowForwardModal(false)}>
                  <Text style={{ fontSize: 20, color: colors.textSecondary }}>✕</Text>
                </TouchableOpacity>
              </View>
              {forwardGroups.length === 0 ? (
                <View style={{ padding: 24, alignItems: 'center' }}>
                  <Text style={{ color: colors.textSecondary }}>No other groups available.</Text>
                </View>
              ) : (
                <ScrollView style={{ maxHeight: 360 }}>
                  {forwardGroups.map(g => (
                    <TouchableOpacity
                      key={g.id}
                      style={styles.contextMenuItem}
                      onPress={() => handleForwardToGroup(g.id)}
                    >
                      <View style={[styles.headerAvatar, { width: 34, height: 34, borderRadius: 17, marginRight: 12 }]}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff' }}>
                          {g.name.substring(0, 2).toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.contextMenuText}>{g.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
              <TouchableOpacity style={[styles.contextMenuItem, { borderBottomWidth: 0 }]} onPress={() => setShowForwardModal(false)}>
                <Text style={[styles.contextMenuText, { textAlign: 'center', flex: 1, color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Starred Messages Modal */}
        <Modal
          visible={showStarredMessages}
          transparent
          animationType="slide"
          onRequestClose={() => setShowStarredMessages(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { maxHeight: '85%' }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>⭐ Starred Messages</Text>
                <TouchableOpacity onPress={() => setShowStarredMessages(false)} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>×</Text>
                </TouchableOpacity>
              </View>
              {messages.filter(m => starredIds.has(m.id)).length === 0 ? (
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <Text style={{ fontSize: 40, marginBottom: 12 }}>⭐</Text>
                  <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
                    No starred messages yet.{'\n'}Long-press a message and tap Star.
                  </Text>
                </View>
              ) : (
                <ScrollView>
                  {messages.filter(m => starredIds.has(m.id)).map(msg => {
                    const parsed = parseReply(msg.message);
                    return (
                      <View key={msg.id} style={[styles.settingItem, { flexDirection: 'column', alignItems: 'flex-start' }]}>
                        <Text style={{ fontSize: 12, color: colors.primary[600], fontWeight: '700', marginBottom: 4 }}>
                          {msg.isOwn ? 'Me' : msg.userName} · {new Date(msg.createdAt).toLocaleDateString()}
                        </Text>
                        <Text style={{ fontSize: 14, color: colors.text }}>
                          {parsed ? parsed.actualText : msg.message}
                        </Text>
                      </View>
                    );
                  })}
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>

        {/* Message Info Modal (kept for own message details) */}
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
                <View style={{ padding: 16 }}>
                  <Text style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>Sent:</Text>
                  <Text style={{ fontSize: 16, marginBottom: 16 }}>
                    {new Date(selectedMessage.createdAt).toLocaleString()}
                  </Text>
                  <Text style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>Status:</Text>
                  <Text style={{ fontSize: 16, color: selectedMessage.isRead ? '#10b981' : '#f59e0b' }}>
                    {selectedMessage.isRead ? '✓✓ Read' : '✓ Delivered'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Modal>

        {/* Reply preview bar (above input row) */}
        {replyingTo && (
          <View style={styles.replyBar}>
            <View style={styles.replyBarContent}>
              <Text style={styles.replyBarUser}>{replyingTo.userName}</Text>
              <Text style={styles.replyBarText} numberOfLines={1}>
                {parseReply(replyingTo.message)?.actualText ?? replyingTo.message}
              </Text>
            </View>
            <TouchableOpacity style={styles.replyBarClose} onPress={() => setReplyingTo(null)}>
              <Text style={{ fontSize: 18, color: colors.textSecondary }}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.inputContainer}>
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
            style={styles.attachButton}
            onPress={() => setShowAttachMenu(!showAttachMenu)}
          >
            <Text style={styles.attachButtonText}>📎</Text>
          </TouchableOpacity>

          {isRecordingActive ? (
            /* Recording bar */
            <View style={styles.recordingBar}>
              <TouchableOpacity style={styles.recordingCancelBtn} onPress={cancelRecording}>
                <Text style={{ fontSize: 20 }}>🗑️</Text>
              </TouchableOpacity>
              <Animated.View style={[styles.recordingIndicator, { transform: [{ scale: pulseAnim }] }]} />
              <Text style={styles.recordingDurationText}>{formatDuration(recordingDuration)}</Text>
              <Text style={styles.recordingSlideHint} numberOfLines={1}>Slide to cancel ◀</Text>
              <TouchableOpacity style={styles.recordingMicBtn} onPress={stopRecording}>
                <Text style={{ fontSize: 20 }}>✈️</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <TextInput
                ref={textInputRef}
                style={styles.input}
                placeholder="Type a message..."
                placeholderTextColor="#8696A0"
                value={message}
                onChangeText={handleTyping}
                multiline
                maxLength={1000}
              />

              {message.trim() ? (
                <TouchableOpacity
                  style={[styles.sendButton, isSending && styles.sendButtonDisabled]}
                  onPress={handleSend}
                  disabled={isSending}
                >
                  <View style={[styles.sendButtonGradient, isSending && styles.sendButtonGradientDisabled]}>
                    {isSending ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.sendButtonText}>➤</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.micButton} onPress={startRecording}>
                  <Text style={{ fontSize: 20 }}>🎤</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
    fileMeta: {
      fontSize: 12,
      marginTop: 2,
      marginBottom: 2,
    },
    openFileBtn: {
      backgroundColor: '#e0e0e0',
      borderRadius: 6,
      paddingHorizontal: 14,
      paddingVertical: 6,
      alignSelf: 'center',
      marginLeft: 8,
    },
    openFileBtnText: {
      fontWeight: 'bold',
      color: '#2980b9',
      fontSize: 14,
    },
  // ── Layout ──
  container: {
    flex: 1,
    backgroundColor: colors.gray[100],
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[700],
    paddingHorizontal: 8,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
  },
  headerButton: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  backIcon: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[800],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerAvatarText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  headerTitleArea: {
    flex: 1,
    justifyContent: 'center',
  },
  headerGroupName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },
  headerSubtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.78)',
    marginTop: 2,
    letterSpacing: 0.1,
  },

  // ── Messages list ──
  messagesList: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  messageContainer: {
    marginBottom: 2,
    maxWidth: '80%',
  },
  ownMessage: {
    alignSelf: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  senderName: {
    fontSize: 11.5,
    fontWeight: '600',
    marginBottom: 3,
    marginLeft: 6,
    color: colors.primary[500],
    letterSpacing: 0.1,
  },

  // ── Bubbles ──
  messageBubble: {
    borderRadius: 18,
    overflow: 'hidden',
    paddingTop: 2,
    paddingBottom: 2,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  ownBubble: {
    backgroundColor: '#DCF8C6',
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  // ── Message footer (time + ticks) ──
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 10,
    paddingBottom: 7,
    marginTop: 0,
    gap: 2,
  },
  timestamp: {
    fontSize: 10.5,
    color: colors.textSecondary,
    letterSpacing: 0.1,
  },
  checkmark: {
    fontSize: 11,
    color: '#4FC3F7',
    marginLeft: 1,
  },

  // ── Media ──
  mediaContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  imageMessage: {
    width: 260,
    height: 260,
    borderRadius: 8,
  },
  videoMessage: {
    width: 280,
    height: 200,
    borderRadius: 8,
    backgroundColor: '#000',
  },
  mediaOverlay: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    padding: 4,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 10,
  },
  mediaIcon: { fontSize: 14 },
  // WhatsApp-style time overlay inside image/video
  mediaTimeOverlay: {
    position: 'absolute',
    bottom: 6,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  mediaTimeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '500',
  },
  // Video play button overlay
  videoPlayOverlay: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -26,
    marginTop: -26,
  },
  playIcon: { fontSize: 24, marginLeft: 3 },

  // ── File / audio ──
  fileMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    minWidth: 220,
  },
  audioMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    minWidth: 220,
  },
  fileIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  fileIcon:  { fontSize: 22 },
  audioIcon: { fontSize: 22 },
  fileName: { fontSize: 14, fontWeight: '600', color: colors.text },
  fileSize: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },

  // ── Typing ──
  typingContainer: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  typingText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },

  // ── Input bar ──
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 8,
    paddingBottom: 10,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: 8,
  },
  attachButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  attachButtonText: {
    fontSize: 22,
    color: colors.gray[400],
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 10,
    paddingTop: 10,
    maxHeight: 110,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: colors.primary[600],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    marginBottom: 1,
  },
  sendButtonGradient: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: colors.primary[600],
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonGradientDisabled: {
    backgroundColor: colors.border,
  },
  sendButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 2,
  },
  sendButtonDisabled: {
    elevation: 0,
    shadowOpacity: 0,
  },

  // ── Mic / Recording bar ──
  micButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 1,
    elevation: 2,
    shadowColor: colors.primary[600],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  recordingBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  recordingCancelBtn: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EF4444',
  },
  recordingDurationText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#EF4444',
    minWidth: 38,
  },
  recordingSlideHint: {
    flex: 1,
    fontSize: 13,
    color: '#8696A0',
  },
  recordingMicBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },

  // ── Attach menu ──
  attachMenu: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 18,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  attachOption: { alignItems: 'center', padding: 10 },
  attachIcon:   { fontSize: 32, marginBottom: 6 },
  attachText:   { fontSize: 11, fontWeight: '600', color: colors.textSecondary },

  // ── Modals ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingBottom: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  modalTitle:      { fontSize: 18, fontWeight: '700', color: colors.text },
  closeButton:     { padding: 4 },
  closeButtonText: { fontSize: 26, color: colors.textSecondary, fontWeight: '300' },

  // ── Image preview ──
  imagePreviewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreviewClose: {
    position: 'absolute',
    top: 48,
    right: 18,
    zIndex: 10,
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 22,
  },
  imagePreviewCloseText: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold' },
  imagePreviewFull:      { width: '100%', height: '70%' },
  imagePreviewActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 30,
    paddingVertical: 24,
    position: 'absolute',
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  imageActionButton: {
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    minWidth: 72,
  },
  imageActionDanger:  { backgroundColor: 'rgba(239,68,68,0.2)' },
  imageActionIcon:    { fontSize: 26, marginBottom: 5 },
  imageActionText:    { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },

  // ── Group settings ──
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  settingIcon:  { fontSize: 22, marginRight: 14 },
  settingText:  { fontSize: 15, fontWeight: '500', color: colors.text },
  dangerItem:   { backgroundColor: '#FFF5F5' },
  dangerText:   { color: '#EF4444' },

  // ── Loading / empty ──
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText:      { marginTop: 12, fontSize: 15, color: colors.textSecondary },
  emptyContainer:   { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon:        { fontSize: 64, marginBottom: 18, opacity: 0.7 },
  emptyText:        { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8 },
  emptySubtext:     { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },

  // ── @ Mention ──
  mentionSuggestions: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    right: 0,
    maxHeight: 200,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mentionList: { maxHeight: 200 },
  mentionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  mentionAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  mentionAvatarPlaceholder: { justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primary[100] },
  mentionAvatarText: { fontSize: 14, fontWeight: '700', color: colors.primary[600] },
  mentionInfo:  { flex: 1 },
  mentionName:  { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 2 },
  mentionRole:  { fontSize: 11, color: colors.textSecondary },
  mentionText:  { fontWeight: '700', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4 },

  // ── Header extras ──
  headerIconBtn: { width: 38, height: 38, justifyContent: 'center', alignItems: 'center' },
  headerIcon:    { fontSize: 20, color: '#FFFFFF' },

  // ── Search bar ──
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 6,
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  searchBarInput: { flex: 1, fontSize: 15, color: colors.text, paddingVertical: 4 },
  searchBarClose: { padding: 4 },

  // ── Pinned message banner ──
  pinnedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary[500],
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    elevation: 2,
  },
  pinnedIcon:    { fontSize: 14 },
  pinnedText:    { flex: 1, fontSize: 12, color: colors.textSecondary },
  pinnedDismiss: { padding: 4 },

  // ── Reply bar (above input) ──
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary[500],
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 8,
    marginBottom: 4,
    borderRadius: 8,
    gap: 8,
  },
  replyBarContent: { flex: 1 },
  replyBarUser:    { fontSize: 12, fontWeight: '700', color: colors.primary[600], marginBottom: 2 },
  replyBarText:    { fontSize: 12, color: colors.textSecondary },
  replyBarClose:   { padding: 6 },

  // ── Reply preview inside bubble ──
  replyPreview: {
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 10,
    padding: 9,
    marginBottom: 2,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary[400],
  },
  replyPreviewUser: { fontSize: 11, fontWeight: '700', color: colors.primary[600], marginBottom: 2 },
  replyPreviewText: { fontSize: 12, color: colors.textSecondary },

  // ── Reactions ──
  reactionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    paddingHorizontal: 4,
    marginTop: 3,
    marginBottom: 2,
  },
  reactionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 7,
    paddingVertical: 3,
    gap: 3,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 1,
  },
  reactionEmoji: { fontSize: 14, fontFamily: 'System', textAlignVertical: 'center' },
  reactionCount: { fontSize: 11, fontWeight: '700', color: colors.textSecondary },

  // ── Context menu ──
  contextMenuOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  contextMenuSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingBottom: 28,
  },
  contextMenuMsgPreview: {
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  contextMenuMsgText: { fontSize: 13, color: colors.textSecondary, fontStyle: 'italic' },
  contextMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  contextMenuIcon: { fontSize: 21, marginRight: 16 },
  contextMenuText: { fontSize: 15, fontWeight: '500', color: colors.text, letterSpacing: 0.1 },
  contextMenuDanger: { color: '#EF4444' },

  // ── Reaction picker ──
  reactionPickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  reactionPickerBtn:   { padding: 6 },
  reactionPickerEmoji: { fontSize: 28, fontFamily: 'System', textAlignVertical: 'center' },

  // ── Star badge ──
  starBadge: { fontSize: 11, marginRight: 2 },
});

export default ChatRoomScreenEnhanced;

// --- WhatsApp-style document preview helpers ---
function getFileExtension(filename?: string) {
  if (!filename) return '';
  const ext = filename.split('.').pop();
  return ext ? ext.toUpperCase() : '';
}

function getFileIcon(filename?: string) {
  const ext = getFileExtension(filename);
  if (["PDF"].includes(ext)) return "📕";
  if (["DOC", "DOCX"].includes(ext)) return "📄";
  if (["XLS", "XLSX"].includes(ext)) return "📊";
  if (["PPT", "PPTX"].includes(ext)) return "📈";
  if (["ZIP", "RAR"].includes(ext)) return "🗜️";
  if (["TXT", "CSV"].includes(ext)) return "📑";
  return "📁";
}

function getFileColor(filename?: string) {
  const ext = getFileExtension(filename);
  if (ext === "PDF") return "#e74c3c";
  if (["DOC", "DOCX"].includes(ext)) return "#2980b9";
  if (["XLS", "XLSX"].includes(ext)) return "#27ae60";
  if (["PPT", "PPTX"].includes(ext)) return "#e67e22";
  if (["ZIP", "RAR"].includes(ext)) return "#8e44ad";
  if (["TXT", "CSV"].includes(ext)) return "#95a5a6";
  return "#636e72";
}
