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
import { useTheme } from '../context/ThemeContext';

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
  const { colors, theme } = useTheme();
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
      'Usher': '👋',
      'Protocol': '🎖️',
      'Children': '👶',
      'Youth': '🧑',
      'Prayer': '🙏',
      'Prayer Team': '🙏',
      'Evangelism': '📢',
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView 
        style={styles.chatList}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={onRefresh}
            tintColor={colors.primary[600]}
          />
        }
      >
        {groups.map((group) => (
          <TouchableOpacity
            key={group.id}
            style={[styles.chatItem, { backgroundColor: colors.surface }]}
            onPress={() => handleChatPress(group)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: colors.primary[50] }]}>
              {group.photo && getImageUrl(group.photo) ? (
                <Image
                  source={{ uri: getImageUrl(group.photo) }}
                  style={styles.groupImage}
                />
              ) : (
                <Text style={styles.icon}>
                  {getDepartmentIcon(group.department || group.type || '')}
                </Text>
              )}
            </View>
            
            <View style={styles.chatInfo}>
              <View style={styles.chatHeader}>
                <Text style={[styles.chatName, { color: colors.text }]}>{group.name}</Text>
                {group.last_message_time && (
                  <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                    {formatMessageTime(group.last_message_time)}
                  </Text>
                )}
              </View>
              <View style={styles.lastMessageRow}>
                <Text style={[styles.lastMessage, { color: colors.textSecondary }]} numberOfLines={1}>
                  {group.last_message || group.description || 'No messages yet'}
                </Text>
                {group.unread_count !== undefined && group.unread_count > 0 && (
                  <View style={[styles.unreadBadge, { backgroundColor: colors.primary[600] }]}>
                    <Text style={styles.unreadCount}>
                      {group.unread_count > 99 ? '99+' : group.unread_count}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {groups.length === 0 && !isLoading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No group chats available.{'\n'}
              Join a department to see group chats!
            </Text>
          </View>
        )}

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary[600]} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  chatList: {
    flex: 1,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    overflow: 'hidden',
  },
  groupImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  icon: {
    fontSize: 28,
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  chatName: {
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  lastMessageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  lastMessage: {
    fontSize: 15,
    flex: 1,
  },
  unreadBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  unreadCount: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  checkmarkContainer: {
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 72,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default ChatListScreen;
