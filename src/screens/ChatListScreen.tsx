import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { chatService } from '../services/api';
import { primaryColor, accentColor } from '../theme/colors';

type RootStackParamList = {
  ChatRoom: { department: string };
  ChatRoomEnhanced: { groupId: number; groupName: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface GroupChat {
  id: number;
  name: string;
  description: string;
  type: string;
  department?: string;
  photo?: string;
  last_message?: string;
  last_message_time?: string;
  unread_count?: number;
}

const ChatListScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const [groups, setGroups] = useState<GroupChat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      console.log('[ChatList] Loading groups...');
      const data = await chatService.getGroups();
      console.log('[ChatList] Groups response:', data);
      console.log('[ChatList] Groups count:', data.groups?.length || 0);
      setGroups(data.groups || []);
      console.log('[ChatList] Groups state updated');
    } catch (error) {
      console.error('Load groups error:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadGroups();
  };

  function getDepartmentIcon(department?: string): string {
    if (!department) return '💬';
    const icons: { [key: string]: string } = {
      'Choir': '🎵',
      'Drama': '🎭',
      'Media': '📹',
      'Ushering': '👋',
      'Protocol': '🎖️',
      'Children': '👶',
      'Youth': '🧑',
      'Prayer': '🙏',
      'Welfare': '🤝',
      'Ministers': '⛪',
    };
    return icons[department] || '👥';
  }

  const handleChatPress = (group: GroupChat) => {
    navigation.navigate('ChatRoomEnhanced', { groupId: group.id, groupName: group.name });
  };

  const getImageUrl = (photo?: string): string | undefined => {
    if (!photo) return undefined;
    if (photo.startsWith('http')) return photo;
    const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
    return `${baseUrl}${photo}`;
  };

  const formatMessageTime = (timestamp?: string): string => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // if (isLoading) {
  //   return (
  //     <SafeAreaView style={styles.container}>
  //       <View style={styles.header}>
  //         <Text style={styles.headerTitle}>Messages</Text>
  //       </View>
  //       <View style={styles.loadingContainer}>
  //         <ActivityIndicator size="large" color={primaryColor} />
  //       </View>
  //     </SafeAreaView>
  //   );
  // }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.chatList}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {groups.map((group) => (
          <TouchableOpacity
            key={group.id}
            style={styles.chatItem}
            onPress={() => handleChatPress(group)}
          >
            <View style={styles.iconContainer}>
              {group.photo && getImageUrl(group.photo) ? (
                <Image
                  source={{ uri: getImageUrl(group.photo) }}
                  style={styles.groupImage}
                />
              ) : (
                <Text style={styles.icon}>{getDepartmentIcon(group.department || group.type)}</Text>
              )}
            </View>
            
            <View style={styles.chatInfo}>
              <View style={styles.chatHeader}>
                <Text style={styles.chatName}>{group.name}</Text>
                {group.last_message_time && (
                  <Text style={styles.timeText}>{formatMessageTime(group.last_message_time)}</Text>
                )}
              </View>
              <View style={styles.lastMessageRow}>
                <Text style={styles.lastMessage} numberOfLines={1}>
                  {group.last_message || group.description || 'No messages yet'}
                </Text>
                {group.unread_count && group.unread_count > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{group.unread_count}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {groups.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💬</Text>
            {/* <Text style={styles.emptyText}>
              No group chats available.{'\n'}
              Join a department to see group chats!
            </Text> */}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: primaryColor,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  chatList: {
    flex: 1,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    alignItems: 'center',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  groupImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  icon: {
    fontSize: 24,
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  lastMessageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rightInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  lastMessage: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: accentColor,
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default ChatListScreen;
