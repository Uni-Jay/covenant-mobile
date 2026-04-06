import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Image,
  TextInput,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { chatService } from '../services/api';
import { getServerUrl } from '../config/network.config';
import { MaterialIcons } from '@expo/vector-icons';

// ─── Types ────────────────────────────────────────────────────────────────────
type RootStackParamList = {
  ChatRoom: { department: string };
  ChatRoomEnhanced: { groupId: number; groupName: string; onMarkRead?: () => void };
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

// ─── Avatar helpers ───────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  '#1D4ED8', '#7C3AED', '#BE185D', '#065F46',
  '#B45309', '#0369A1', '#7E22CE', '#166534',
];
const getAvatarColor = (name: string) => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
};
const getInitials = (name: string) => {
  const w = name.trim().split(/\s+/);
  return w.length >= 2 ? (w[0][0] + w[1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
};

// ─── Time formatter ───────────────────────────────────────────────────────────
const formatTime = (ts?: string): string => {
  if (!ts) return '';
  const date = new Date(ts);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === now.toDateString())
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  if ((now.getTime() - date.getTime()) < 7 * 86400000)
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// ─── Last message snippet ─────────────────────────────────────────────────────
const getLastMsgDisplay = (group: GroupChat): string => {
  const m = group.last_message || '';
  if (m.includes('/uploads/') || m.startsWith('http')) {
    if (/\.(jpg|jpeg|png|gif)/i.test(m)) return '📷 Photo';
    if (/\.(mp4|mov|avi)/i.test(m))      return '🎥 Video';
    if (/\.(mp3|wav|m4a)/i.test(m))      return '🎤 Voice message';
    if (/\.(pdf|doc|txt)/i.test(m))      return '📄 Document';
    return '📎 File';
  }
  return m || group.description || 'No messages yet';
};

// ─── Image URL ────────────────────────────────────────────────────────────────
const getImageUrl = (photo?: string) => {
  if (!photo) return undefined;
  return photo.startsWith('http') ? photo : `${getServerUrl()}${photo}`;
};

// ─── Component ────────────────────────────────────────────────────────────────
const ChatListScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const { colors, theme } = useTheme();
  const styles = createStyles(colors);
  const [groups,         setGroups]         = useState<GroupChat[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<GroupChat[]>([]);
  const [isLoading,      setIsLoading]      = useState(true);
  const [isRefreshing,   setIsRefreshing]   = useState(false);
  const [searchQuery,    setSearchQuery]    = useState('');

  useEffect(() => { loadGroups(); }, []);

  useFocusEffect(
    React.useCallback(() => { loadGroups(); }, [])
  );

  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    setFilteredGroups(q ? groups.filter(g => g.name.toLowerCase().includes(q)) : groups);
  }, [searchQuery, groups]);

  const loadGroups = async () => {
    try {
      const data = await chatService.getGroups();
      setGroups(data.groups || []);
      setFilteredGroups(data.groups || []);
    } catch (e) {
      console.error('Load groups error:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = async () => { setIsRefreshing(true); await loadGroups(); };

  const handleChatPress = (group: GroupChat) => {
    navigation.navigate('ChatRoomEnhanced', {
      groupId:    group.id,
      groupName:  group.name,
      onMarkRead: loadGroups,
    });
  };

  // ── Render each row ──────────────────────────────────────────────────────────
  const renderItem = ({ item, index }: { item: GroupChat; index: number }) => {
    const imgUrl    = getImageUrl(item.photo);
    const isLast    = index === filteredGroups.length - 1;
    const hasUnread = (item.unread_count ?? 0) > 0;

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => handleChatPress(item)}
        activeOpacity={0.6}
      >
        {/* Avatar */}
        <View style={styles.avatarWrapper}>
          {imgUrl ? (
            <Image source={{ uri: imgUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: getAvatarColor(item.name) }]}>
              <Text style={styles.avatarInitials}>{getInitials(item.name)}</Text>
            </View>
          )}
        </View>

        {/* Info (with hairline separator except on last row) */}
        <View style={[styles.infoCol, !isLast && styles.infoColBorder]}>
          <View style={styles.topRow}>
            <Text style={styles.chatName} numberOfLines={1}>{item.name}</Text>
            <Text style={[styles.timeText, hasUnread && styles.timeTextUnread]}>
              {formatTime(item.last_message_time)}
            </Text>
          </View>
          <View style={styles.bottomRow}>
            <Text
              style={[styles.previewText, hasUnread && styles.previewTextUnread]}
              numberOfLines={1}
            >
              {getLastMsgDisplay(item)}
            </Text>
            {hasUnread ? (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>
                  {(item.unread_count ?? 0) > 99 ? '99+' : item.unread_count}
                </Text>
              </View>
            ) : (
              <View style={styles.badgePlaceholder} />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ── Main render ──────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar backgroundColor={colors.primary[700]} barStyle="light-content" />

      {/* WhatsApp Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chats</Text>
        <TouchableOpacity style={styles.headerIconBtn}>
          <Text style={styles.headerMenuDot}>⋮</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color="rgba(255,255,255,0.6)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="rgba(255,255,255,0.55)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialIcons name="close" size={20} color="rgba(255,255,255,0.75)" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* List */}
      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
        </View>
      ) : (
        <FlatList
          data={filteredGroups}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          style={styles.list}
          contentContainerStyle={filteredGroups.length === 0 ? styles.emptyContent : undefined}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary[600]}
              colors={[colors.primary[600]]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialIcons name="chat-bubble" size={60} color={colors.textSecondary} style={{ marginBottom: 18 }} />
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No results found' : 'No chats yet'}
              </Text>
              <Text style={styles.emptySub}>
                {searchQuery
                  ? 'Try a different search term'
                  : 'Join a department to see group chats!'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const createStyles = (colors: any) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },

  // Header
  header: {
    backgroundColor: colors.primary[700],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 3,
  },
  headerTitle: { color: '#FFFFFF', fontSize: 21, fontWeight: '800', letterSpacing: 0.2 },
  headerIconBtn: { padding: 6 },
  headerMenuDot: { color: 'rgba(255,255,255,0.85)', fontSize: 22, fontWeight: '700', letterSpacing: -1 },

  // Search bar sits just below header (same primary bg so it merges)
  searchWrapper: {
    backgroundColor: colors.primary[700],
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  searchIconEmoji: { fontSize: 13, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#FFFFFF', paddingVertical: 0 },
  searchClear: { fontSize: 13, color: 'rgba(255,255,255,0.75)', paddingLeft: 8 },

  // List
  list: { flex: 1, backgroundColor: colors.surface },
  emptyContent: { flexGrow: 1 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Chat item
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    backgroundColor: colors.surface,
  },
  avatarWrapper: { marginRight: 13, paddingVertical: 8 },
  avatar:         { width: 54, height: 54, borderRadius: 27 },
  avatarFallback: { justifyContent: 'center', alignItems: 'center' },
  avatarInitials: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', letterSpacing: 0.5 },

  infoCol: { flex: 1, paddingVertical: 13, paddingRight: 14 },
  infoColBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: { fontSize: 16, fontWeight: '600', color: colors.text, flex: 1, marginRight: 8, letterSpacing: 0.05 },
  timeText: { fontSize: 11.5, color: colors.textSecondary },
  timeTextUnread: { color: '#25D366', fontWeight: '700' },

  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  previewText: { fontSize: 13.5, color: colors.textSecondary, flex: 1, marginRight: 8, lineHeight: 18 },
  previewTextUnread: { color: colors.text, fontWeight: '500' },

  unreadBadge: {
    backgroundColor: '#25D366',
    borderRadius: 11,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText:      { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  badgePlaceholder: { width: 22, height: 22 },

  // Empty state
  emptyState:  { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80 },
  emptyIcon:   { fontSize: 60, marginBottom: 18 },
  emptyTitle:  { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8, letterSpacing: 0.1 },
  emptySub:    { fontSize: 14, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 36, lineHeight: 21 },
});

export default ChatListScreen;
