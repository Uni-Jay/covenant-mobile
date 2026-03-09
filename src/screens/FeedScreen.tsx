import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  RefreshControl,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Share,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { feedService, api } from '../services';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Facebook-style reactions ────────────────────────────────────────────────
const REACTIONS = [
  { key: 'like',  icon: '\uD83D\uDC4D', label: 'Like',  color: '#1877F2' },
  { key: 'love',  icon: '\u2764\uFE0F', label: 'Love',  color: '#F33E58' },
  { key: 'haha',  icon: '\uD83D\uDE02', label: 'Haha',  color: '#F7B125' },
  { key: 'wow',   icon: '\uD83D\uDE2E', label: 'Wow',   color: '#F7B125' },
  { key: 'sad',   icon: '\uD83D\uDE22', label: 'Sad',   color: '#F7B125' },
  { key: 'angry', icon: '\uD83D\uDE21', label: 'Angry', color: '#E9710F' },
] as const;
type ReactionKey = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry';

const getReaction = (key?: string) =>
  REACTIONS.find(r => r.key === key) ?? REACTIONS[0];

// ─── Post type badge config ───────────────────────────────────────────────────
const POST_TYPE: Record<string, { label: string; color: string; bg: string }> = {
  announcement: { label: '\uD83D\uDCE2 Announcement', color: '#E65100', bg: '#FFF3E0' },
  testimony:    { label: '\uD83D\uDE4C Testimony',    color: '#1565C0', bg: '#E3F2FD' },
  sermon_clip:  { label: '\uD83C\uDF99\uFE0F Sermon', color: '#4A148C', bg: '#F3E5F5' },
  scripture:    { label: '\uD83D\uDCD6 Scripture',    color: '#1B5E20', bg: '#E8F5E9' },
  general:      { label: '',                           color: '',        bg: ''        },
};

// ─── Interfaces ──────────────────────────────────────────────────────────────
interface Post {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  profile_image?: string;
  role: string;
  content: string;
  media_url?: string;
  media_type?: string;
  post_type: string;
  is_pinned: boolean;
  likes_count: number;
  comments_count: number;
  user_liked: boolean;
  user_reaction?: string;
  created_at: string;
}

interface Comment {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  profile_image?: string;
  comment: string;
  created_at: string;
}

interface Member {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  profile_image?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const SERVER_BASE = 'http://localhost:5000';
const getPhotoUrl = (path?: string | null): string | null => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${SERVER_BASE}${path}`;
};

const formatTs = (ts: string): string => {
  const date = new Date(ts);
  const diff = Date.now() - date.getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m`;
  if (h < 24) return `${h}h`;
  if (d < 7) return `${d}d`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// ─── Component ───────────────────────────────────────────────────────────────
export default function FeedScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = createStyles(colors);

  // Feed
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterType, setFilterType] = useState('all');

  // Composer
  const [newPost, setNewPost] = useState('');
  const [postType, setPostType] = useState('general');
  const [isPosting, setIsPosting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedMediaType, setSelectedMediaType] = useState<'image' | 'video' | null>(null);
  const [taggedUsers, setTaggedUsers] = useState<Member[]>([]);

  // Comments modal
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSendingComment, setIsSendingComment] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);

  // Tag modal
  const [showTagModal, setShowTagModal] = useState(false);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [memberSearch, setMemberSearch] = useState('');

  // Reaction picker
  const [reactionMenuPostId, setReactionMenuPostId] = useState<number | null>(null);
  const reactionAnim = useRef(new Animated.Value(0)).current;

  // Post options bottom sheet
  const [optionsPost, setOptionsPost] = useState<Post | null>(null);
  const [showOptionsSheet, setShowOptionsSheet] = useState(false);

  // ─── Data loading ──────────────────────────────────────────────────────────
  useEffect(() => { loadPosts(); }, [filterType]);
  useEffect(() => { loadMembers(); }, []);

  const loadPosts = async () => {
    try {
      setIsLoading(true);
      const data = await feedService.getPosts(filterType);
      setPosts(data.posts ?? []);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadPosts();
    setIsRefreshing(false);
  };

  const loadMembers = async () => {
    try {
      const res = await api.get('/auth/users');
      setAllMembers(res.data.users ?? []);
    } catch {}
  };

  // ─── Composer actions ─────────────────────────────────────────────────────
  const pickMedia = async (type: 'image' | 'video') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Allow photo library access to attach media.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: type === 'image' ? ['images'] : ['videos'],
      allowsEditing: type === 'image',
      aspect: [4, 3],
      quality: 0.8,
      videoMaxDuration: 60,
    });
    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      setSelectedMediaType(type);
    }
  };

  const removeMedia = () => { setSelectedImage(null); setSelectedMediaType(null); };

  const toggleTag = (member: Member) =>
    setTaggedUsers(prev =>
      prev.some(u => u.id === member.id)
        ? prev.filter(u => u.id !== member.id)
        : [...prev, member]
    );

  const handleCreatePost = async () => {
    if (!newPost.trim() && !selectedImage) return;
    try {
      setIsPosting(true);
      const fd = new FormData();
      fd.append('content', newPost);
      fd.append('postType', postType);
      if (taggedUsers.length > 0)
        fd.append('taggedUsers', JSON.stringify(taggedUsers.map(u => u.id)));
      if (selectedImage) {
        const name = selectedImage.split('/').pop() ?? 'media.jpg';
        const ext = /\.(\w+)$/.exec(name)?.[1] ?? 'jpg';
        fd.append('media', { uri: selectedImage, name, type: selectedMediaType === 'video' ? `video/${ext}` : `image/${ext}` } as any);
      }
      await api.post('/feed', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setNewPost(''); setSelectedImage(null); setSelectedMediaType(null);
      setTaggedUsers([]); setPostType('general');
      await loadPosts();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to create post');
    } finally {
      setIsPosting(false);
    }
  };

  // ─── Reactions ────────────────────────────────────────────────────────────
  const openReactionMenu = (postId: number) => {
    setReactionMenuPostId(postId);
    Animated.spring(reactionAnim, { toValue: 1, useNativeDriver: true, tension: 140, friction: 7 }).start();
  };

  const closeReactionMenu = () => {
    Animated.timing(reactionAnim, { toValue: 0, duration: 140, useNativeDriver: true }).start(
      () => setReactionMenuPostId(null)
    );
  };

  const handleReact = async (post: Post, reactionKey: string) => {
    closeReactionMenu();
    const wasLiked = post.user_liked;
    const prevReaction = post.user_reaction;
    const removingReaction = wasLiked && prevReaction === reactionKey;

    // Optimistic update
    setPosts(prev => prev.map(p =>
      p.id !== post.id ? p : {
        ...p,
        user_liked: !removingReaction,
        user_reaction: removingReaction ? undefined : reactionKey,
        likes_count: removingReaction
          ? p.likes_count - 1
          : wasLiked ? p.likes_count : p.likes_count + 1,
      }
    ));

    try {
      await feedService.likePost(post.id);
    } catch {
      // Rollback
      setPosts(prev => prev.map(p =>
        p.id !== post.id ? p : { ...p, user_liked: wasLiked, user_reaction: prevReaction, likes_count: post.likes_count }
      ));
    }
  };

  const handleQuickLike = (post: Post) => {
    if (reactionMenuPostId === post.id) { closeReactionMenu(); return; }
    handleReact(post, post.user_liked ? '' : 'like');
  };

  // ─── Post options ─────────────────────────────────────────────────────────
  const openOptions = (post: Post) => { setOptionsPost(post); setShowOptionsSheet(true); };
  const closeOptions = () => setShowOptionsSheet(false);

  const confirmDeletePost = () => {
    closeOptions();
    Alert.alert('Delete Post', 'This will permanently delete your post.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          if (!optionsPost) return;
          try {
            await feedService.deletePost(optionsPost.id);
            setPosts(prev => prev.filter(p => p.id !== optionsPost.id));
          } catch (e: any) { Alert.alert('Error', e.message); }
        },
      },
    ]);
  };

  const handleSharePost = async (post: Post) => {
    try {
      await Share.share({ message: `${post.first_name} ${post.last_name}: ${post.content}`, title: 'Word of Covenant' });
    } catch {}
  };

  // ─── Comments ─────────────────────────────────────────────────────────────
  const openComments = async (post: Post) => {
    setSelectedPost(post);
    setComments([]);
    setShowCommentsModal(true);
    setCommentsLoading(true);
    try {
      const data = await feedService.getPost(post.id);
      setComments(data.comments ?? []);
    } catch {} finally {
      setCommentsLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedPost || isSendingComment) return;
    const text = newComment.trim();
    setNewComment('');
    setIsSendingComment(true);
    try {
      await feedService.addComment(selectedPost.id, text);
      const data = await feedService.getPost(selectedPost.id);
      setComments(data.comments ?? []);
      setPosts(prev => prev.map(p =>
        p.id === selectedPost.id ? { ...p, comments_count: p.comments_count + 1 } : p
      ));
      setSelectedPost(prev => prev ? { ...prev, comments_count: prev.comments_count + 1 } : prev);
    } catch { setNewComment(text); }
    finally { setIsSendingComment(false); }
  };

  // ─── Render helpers ───────────────────────────────────────────────────────
  const FILTER_TABS = [
    { key: 'all',          label: '\uD83C\uDFE0 Home'    },
    { key: 'announcement', label: '\uD83D\uDCE2 News'    },
    { key: 'testimony',    label: '\uD83D\uDE4C Praise'  },
    { key: 'sermon_clip',  label: '\uD83C\uDF99\uFE0F Sermons' },
    { key: 'scripture',    label: '\uD83D\uDCD6 Word'    },
    { key: 'general',      label: '\uD83D\uDCAC General' },
  ];

  const currentUserPhoto = getPhotoUrl((user as any)?.photo);
  const meInitial = ((user as any)?.firstName ?? user?.fullName ?? 'U').charAt(0).toUpperCase();
  const canPost = (newPost.trim().length > 0 || !!selectedImage) && !isPosting;

  const renderPost = ({ item: post }: { item: Post }) => {
    const photoUri = getPhotoUrl(post.profile_image);
    const initials = `${post.first_name.charAt(0)}${post.last_name.charAt(0)}`;
    const typeInfo = POST_TYPE[post.post_type] ?? POST_TYPE.general;
    const myReaction = post.user_reaction ? getReaction(post.user_reaction) : null;
    const isMenuOpen = reactionMenuPostId === post.id;

    return (
      <View style={styles.postCard}>
        {/* Pinned banner */}
        {post.is_pinned && (
          <View style={styles.pinnedBanner}>
            <Text style={styles.pinnedBannerText}>{'\uD83D\uDCCC'}  Pinned post</Text>
          </View>
        )}

        {/* ── Header ── */}
        <View style={styles.postHeader}>
          <View style={styles.postHeaderLeft}>
            {photoUri
              ? <Image source={{ uri: photoUri }} style={styles.postAvatar} />
              : (
                <LinearGradient colors={[colors.primary[500], colors.primary[700]]} style={styles.postAvatar}>
                  <Text style={styles.postAvatarText}>{initials}</Text>
                </LinearGradient>
              )}
            <View style={styles.postAuthorBlock}>
              <Text style={styles.postAuthorName}>{post.first_name} {post.last_name}</Text>
              {typeInfo.label ? (
                <View style={[styles.typeBadge, { backgroundColor: typeInfo.bg }]}>
                  <Text style={[styles.typeBadgeText, { color: typeInfo.color }]}>{typeInfo.label}</Text>
                </View>
              ) : null}
              <View style={styles.postMetaRow}>
                <Text style={styles.postTimestamp}>{formatTs(post.created_at)}</Text>
                <Text style={styles.postMetaDot}> · </Text>
                <Text style={styles.postScope}>{'\uD83C\uDF10'}</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={styles.moreBtn}
            onPress={() => openOptions(post)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.moreBtnText}>···</Text>
          </TouchableOpacity>
        </View>

        {/* ── Content ── */}
        {post.content ? <Text style={styles.postContent}>{post.content}</Text> : null}

        {/* ── Media ── */}
        {post.media_url && post.media_type === 'image' && (
          <Image source={{ uri: getPhotoUrl(post.media_url) ?? post.media_url }} style={styles.postMediaImg} resizeMode="cover" />
        )}
        {post.media_url && post.media_type === 'video' && (
          <Video source={{ uri: getPhotoUrl(post.media_url) ?? post.media_url }} style={styles.postMediaImg} useNativeControls resizeMode={ResizeMode.CONTAIN} isLooping />
        )}

        {/* ── Counts row ── */}
        {(post.likes_count > 0 || post.comments_count > 0) && (
          <View style={styles.countsRow}>
            {post.likes_count > 0 && (
              <View style={styles.reactionSummary}>
                <View style={[styles.reactionBubble, { backgroundColor: myReaction?.color ?? '#1877F2' }]}>
                  <Text style={styles.reactionBubbleText}>{myReaction?.icon ?? '\uD83D\uDC4D'}</Text>
                </View>
                <Text style={styles.likeCountText}>{post.likes_count}</Text>
              </View>
            )}
            {post.comments_count > 0 && (
              <TouchableOpacity onPress={() => openComments(post)}>
                <Text style={styles.commentCountText}>
                  {post.comments_count} {post.comments_count === 1 ? 'comment' : 'comments'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.actionDivider} />

        {/* ── Reaction popup (long-press Like) ── */}
        {isMenuOpen && (
          <TouchableWithoutFeedback onPress={closeReactionMenu}>
            <View style={styles.reactionOverlay}>
              <Animated.View style={[
                styles.reactionPopup,
                {
                  opacity: reactionAnim,
                  transform: [{
                    scale: reactionAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }),
                  }],
                },
              ]}>
                {REACTIONS.map(r => (
                  <TouchableOpacity
                    key={r.key}
                    style={styles.reactionOption}
                    onPress={() => handleReact(post, r.key)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.reactionOptionIcon}>{r.icon}</Text>
                    <Text style={[styles.reactionOptionLabel, { color: r.color }]}>{r.label}</Text>
                  </TouchableOpacity>
                ))}
              </Animated.View>
            </View>
          </TouchableWithoutFeedback>
        )}

        {/* ── Action bar ── */}
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={styles.actionBarBtn}
            onPress={() => handleQuickLike(post)}
            onLongPress={() => openReactionMenu(post.id)}
            delayLongPress={300}
            activeOpacity={0.6}
          >
            <Text style={[styles.actionBarIcon, post.user_liked && { color: myReaction?.color ?? '#1877F2' }]}>
              {post.user_liked && myReaction ? myReaction.icon : '\uD83D\uDC4D'}
            </Text>
            <Text style={[styles.actionBarLabel, post.user_liked && { color: myReaction?.color ?? '#1877F2', fontWeight: '700' }]}>
              {post.user_liked && myReaction ? myReaction.label : 'Like'}
            </Text>
          </TouchableOpacity>

          <View style={styles.actionBarSep} />

          <TouchableOpacity
            style={styles.actionBarBtn}
            onPress={() => openComments(post)}
            activeOpacity={0.6}
          >
            <Text style={styles.actionBarIcon}>{'\uD83D\uDCAC'}</Text>
            <Text style={styles.actionBarLabel}>Comment</Text>
          </TouchableOpacity>

          <View style={styles.actionBarSep} />

          <TouchableOpacity
            style={styles.actionBarBtn}
            onPress={() => handleSharePost(post)}
            activeOpacity={0.6}
          >
            <Text style={styles.actionBarIcon}>{'↗️'}</Text>
            <Text style={styles.actionBarLabel}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (isLoading && posts.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#1877F2" />
        <Text style={styles.loadingText}>Loading posts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* ═══ TOP BAR ═══════════════════════════════════════════════════════ */}
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Word of Covenant</Text>
        <View style={styles.topBarIcons}>
          <TouchableOpacity style={styles.topBarIcon}>
            <Text style={styles.topBarIconText}>{'\uD83D\uDD0D'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.topBarIcon}>
            <Text style={styles.topBarIconText}>{'\uD83D\uDD14'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ═══ NAV FILTER TABS ════════════════════════════════════════════════ */}
      <View style={styles.navBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navBarContent}>
          {FILTER_TABS.map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={[styles.navTab, filterType === key && styles.navTabActive]}
              onPress={() => setFilterType(key)}
              activeOpacity={0.75}
            >
              <Text style={[styles.navTabText, filterType === key && styles.navTabTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ═══ FEED ═══════════════════════════════════════════════════════════ */}
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={item => item.id.toString()}
        style={styles.feed}
        contentContainerStyle={styles.feedContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#1877F2']} tintColor="#1877F2" />
        }
        ListHeaderComponent={
          /* ── Composer card ── */
          <View style={styles.composerCard}>
            <View style={styles.composerRow}>
              {currentUserPhoto
                ? <Image source={{ uri: currentUserPhoto }} style={styles.composerAvatar} />
                : (
                  <LinearGradient colors={[colors.primary[500], colors.primary[700]]} style={styles.composerAvatar}>
                    <Text style={styles.composerAvatarText}>{meInitial}</Text>
                  </LinearGradient>
                )}
              <TextInput
                style={styles.composerInput}
                placeholder={`What's on your mind, ${(user as any)?.firstName ?? user?.fullName?.split(' ')[0] ?? 'friend'}?`}
                placeholderTextColor="#90949C"
                value={newPost}
                onChangeText={setNewPost}
                multiline
              />
            </View>

            {/* Media preview */}
            {selectedImage && (
              <View style={styles.composerPreview}>
                {selectedMediaType === 'image'
                  ? <Image source={{ uri: selectedImage }} style={styles.composerPreviewImg} resizeMode="cover" />
                  : <Video source={{ uri: selectedImage }} style={styles.composerPreviewImg} useNativeControls resizeMode={ResizeMode.CONTAIN} isLooping />
                }
                <TouchableOpacity style={styles.composerRemoveBtn} onPress={removeMedia}>
                  <Text style={styles.composerRemoveText}>{'\u2715'}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Tagged chips */}
            {taggedUsers.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagChipRow}>
                {taggedUsers.map(tu => (
                  <TouchableOpacity key={tu.id} style={styles.tagChip} onPress={() => toggleTag(tu)}>
                    <Text style={styles.tagChipText}>with {tu.first_name} {'\u2715'}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Post type selector */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.composerTypeRow}>
              {['general', 'testimony', 'scripture', 'announcement'].map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.composerTypeChip, postType === t && styles.composerTypeChipActive]}
                  onPress={() => setPostType(t)}
                >
                  <Text style={[styles.composerTypeChipText, postType === t && styles.composerTypeChipTextActive]}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.composerDivider} />

            {/* Media + tag + post actions */}
            <View style={styles.composerActions}>
              <TouchableOpacity style={styles.composerActionBtn} onPress={() => pickMedia('image')}>
                <Text style={styles.composerActionIcon}>{'\uD83D\uDDBC\uFE0F'}</Text>
                <Text style={styles.composerActionText}>Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.composerActionBtn} onPress={() => pickMedia('video')}>
                <Text style={styles.composerActionIcon}>{'\uD83C\uDFAC'}</Text>
                <Text style={styles.composerActionText}>Video</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.composerActionBtn} onPress={() => setShowTagModal(true)}>
                <Text style={styles.composerActionIcon}>{'\uD83D\uDC64'}</Text>
                <Text style={styles.composerActionText}>Tag</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.composerPostBtn, !canPost && styles.composerPostBtnDisabled]}
                onPress={handleCreatePost}
                disabled={!canPost}
                activeOpacity={0.8}
              >
                {isPosting
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={styles.composerPostBtnText}>Post</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>{'\u2728'}</Text>
            <Text style={styles.emptyStateTitle}>No posts yet</Text>
            <Text style={styles.emptyStateSub}>Be the first to share a blessing!</Text>
          </View>
        }
      />

      {/* ═══ POST OPTIONS BOTTOM SHEET ══════════════════════════════════════ */}
      <Modal visible={showOptionsSheet} transparent animationType="slide" onRequestClose={closeOptions}>
        <TouchableWithoutFeedback onPress={closeOptions}>
          <View style={styles.sheetOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.sheetContainer}>
                <View style={styles.sheetHandle} />

                {optionsPost && (
                  <View style={styles.sheetPostInfo}>
                    <Text style={styles.sheetPostName}>{optionsPost.first_name} {optionsPost.last_name}</Text>
                    <Text style={styles.sheetPostTime}>{formatTs(optionsPost.created_at)}</Text>
                  </View>
                )}

                <View style={styles.sheetDivider} />

                <TouchableOpacity style={styles.sheetItem} onPress={() => { closeOptions(); if (optionsPost) handleSharePost(optionsPost); }}>
                  <Text style={styles.sheetItemIcon}>{'↗️'}</Text>
                  <Text style={styles.sheetItemText}>Share post</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.sheetItem} onPress={() => { closeOptions(); if (optionsPost) openComments(optionsPost); }}>
                  <Text style={styles.sheetItemIcon}>{'\uD83D\uDCAC'}</Text>
                  <Text style={styles.sheetItemText}>View comments</Text>
                </TouchableOpacity>

                {optionsPost?.user_id === user?.id && (
                  <TouchableOpacity style={[styles.sheetItem]} onPress={confirmDeletePost}>
                    <Text style={styles.sheetItemIcon}>{'\uD83D\uDDD1\uFE0F'}</Text>
                    <Text style={[styles.sheetItemText, styles.sheetItemDanger]}>Delete post</Text>
                  </TouchableOpacity>
                )}

                <View style={styles.sheetDivider} />
                <TouchableOpacity style={[styles.sheetItem, styles.sheetCancelItem]} onPress={closeOptions}>
                  <Text style={styles.sheetCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ═══ COMMENTS MODAL ═════════════════════════════════════════════════ */}
      <Modal visible={showCommentsModal} animationType="slide" onRequestClose={() => setShowCommentsModal(false)}>
        <KeyboardAvoidingView
          style={styles.modalRoot}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity style={styles.modalBackBtn} onPress={() => setShowCommentsModal(false)}>
              <Text style={styles.modalBackText}>{'\u2190'}</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle} numberOfLines={1}>
              {selectedPost ? `${selectedPost.first_name}'s post` : 'Comments'}
            </Text>
            <View style={{ width: 44 }} />
          </View>

          <FlatList
            data={comments}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.commentListPad}
            ListHeaderComponent={selectedPost ? (
              /* Original post preview */
              <View style={styles.commentPostPreview}>
                <View style={styles.commentPostMeta}>
                  {getPhotoUrl(selectedPost.profile_image)
                    ? <Image source={{ uri: getPhotoUrl(selectedPost.profile_image)! }} style={styles.commentPostAvatar} />
                    : (
                      <LinearGradient colors={[colors.primary[500], colors.primary[700]]} style={styles.commentPostAvatar}>
                        <Text style={styles.commentPostAvatarText}>{selectedPost.first_name.charAt(0)}</Text>
                      </LinearGradient>
                    )}
                  <View>
                    <Text style={styles.commentPostAuthor}>{selectedPost.first_name} {selectedPost.last_name}</Text>
                    <Text style={styles.commentPostTime}>{formatTs(selectedPost.created_at)}</Text>
                  </View>
                </View>
                {selectedPost.content ? <Text style={styles.commentPostContent}>{selectedPost.content}</Text> : null}
                {selectedPost.media_url && selectedPost.media_type === 'image' && (
                  <Image source={{ uri: getPhotoUrl(selectedPost.media_url) ?? selectedPost.media_url }} style={styles.commentPostMedia} resizeMode="cover" />
                )}
                <View style={styles.commentPostStatsRow}>
                  {selectedPost.likes_count > 0 && (
                    <Text style={styles.commentPostStat}>{'\uD83D\uDC4D'} {selectedPost.likes_count}</Text>
                  )}
                  <Text style={[styles.commentPostStat, { marginLeft: 'auto' as any }]}>
                    {selectedPost.comments_count} {selectedPost.comments_count === 1 ? 'comment' : 'comments'}
                  </Text>
                </View>
                <View style={styles.commentPostDivider} />
                <Text style={styles.commentsSectionLabel}>Comments</Text>
              </View>
            ) : null}
            renderItem={({ item }) => {
              const cUri = getPhotoUrl(item.profile_image);
              return (
                <View style={styles.commentRow}>
                  {cUri
                    ? <Image source={{ uri: cUri }} style={styles.commentAvatar} />
                    : (
                      <LinearGradient colors={[colors.primary[500], colors.primary[700]]} style={styles.commentAvatar}>
                        <Text style={styles.commentAvatarText}>{item.first_name.charAt(0)}</Text>
                      </LinearGradient>
                    )}
                  <View style={styles.commentRight}>
                    <View style={styles.commentBubble}>
                      <Text style={styles.commentName}>{item.first_name} {item.last_name}</Text>
                      <Text style={styles.commentBody}>{item.comment}</Text>
                    </View>
                    <View style={styles.commentMeta}>
                      <Text style={styles.commentTime}>{formatTs(item.created_at)}</Text>
                      <TouchableOpacity><Text style={styles.commentMetaAction}>Like</Text></TouchableOpacity>
                      <TouchableOpacity><Text style={styles.commentMetaAction}>Reply</Text></TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              commentsLoading
                ? <ActivityIndicator style={{ marginTop: 40 }} color="#1877F2" />
                : (
                  <View style={styles.emptyComments}>
                    <Text style={styles.emptyCommentsText}>No comments yet — be the first! {'\uD83D\uDCAC'}</Text>
                  </View>
                )
            }
          />

          {/* Comment input */}
          <View style={styles.commentInputBar}>
            {currentUserPhoto
              ? <Image source={{ uri: currentUserPhoto }} style={styles.commentInputAvatar} />
              : (
                <LinearGradient colors={[colors.primary[500], colors.primary[700]]} style={styles.commentInputAvatar}>
                  <Text style={styles.commentInputAvatarText}>{meInitial}</Text>
                </LinearGradient>
              )}
            <TextInput
              style={styles.commentInput}
              placeholder="Write a comment..."
              placeholderTextColor="#90949C"
              value={newComment}
              onChangeText={setNewComment}
              multiline
              returnKeyType="send"
            />
            <TouchableOpacity
              style={[styles.commentSendBtn, (!newComment.trim() || isSendingComment) && styles.commentSendBtnOff]}
              onPress={handleAddComment}
              disabled={!newComment.trim() || isSendingComment}
              activeOpacity={0.8}
            >
              {isSendingComment
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.commentSendText}>{'\u2191'}</Text>
              }
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ═══ TAG PEOPLE MODAL ═══════════════════════════════════════════════ */}
      <Modal visible={showTagModal} animationType="slide" onRequestClose={() => setShowTagModal(false)}>
        <View style={styles.modalRoot}>
          <View style={styles.modalHeader}>
            <TouchableOpacity style={styles.modalBackBtn} onPress={() => setShowTagModal(false)}>
              <Text style={styles.modalBackText}>{'\u2190'}</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Tag People</Text>
            <View style={{ width: 44 }} />
          </View>

          <View style={styles.tagSearchBox}>
            <Text style={styles.tagSearchIcon}>{'\uD83D\uDD0D'}</Text>
            <TextInput
              style={styles.tagSearchInput}
              placeholder="Search members..."
              placeholderTextColor="#90949C"
              value={memberSearch}
              onChangeText={setMemberSearch}
              autoFocus
            />
            {memberSearch.length > 0 && (
              <TouchableOpacity onPress={() => setMemberSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={{ color: '#65676B', fontSize: 16, paddingHorizontal: 4 }}>{'\u2715'}</Text>
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={allMembers.filter(m =>
              m.id !== user?.id &&
              (memberSearch === '' || `${m.first_name} ${m.last_name}`.toLowerCase().includes(memberSearch.toLowerCase()))
            )}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item: m }) => {
              const tagged = taggedUsers.some(u => u.id === m.id);
              const mUri = getPhotoUrl(m.profile_image);
              return (
                <TouchableOpacity
                  style={[styles.tagMemberRow, tagged && styles.tagMemberRowActive]}
                  onPress={() => toggleTag(m)}
                  activeOpacity={0.75}
                >
                  {mUri
                    ? <Image source={{ uri: mUri }} style={styles.tagMemberAvatar} />
                    : (
                      <LinearGradient colors={[colors.primary[500], colors.primary[700]]} style={styles.tagMemberAvatar}>
                        <Text style={styles.tagMemberAvatarText}>{m.first_name.charAt(0)}</Text>
                      </LinearGradient>
                    )}
                  <View style={styles.tagMemberInfo}>
                    <Text style={styles.tagMemberName}>{m.first_name} {m.last_name}</Text>
                    <Text style={styles.tagMemberEmail}>{m.email}</Text>
                  </View>
                  {tagged
                    ? <View style={styles.tagChecked}><Text style={styles.tagCheckedText}>{'\u2713'}</Text></View>
                    : <View style={styles.tagUnchecked} />
                  }
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>{'\uD83D\uDC65'}</Text>
                <Text style={styles.emptyStateTitle}>No members found</Text>
              </View>
            }
          />

          <View style={styles.tagFooter}>
            <TouchableOpacity style={styles.tagDoneBtn} onPress={() => setShowTagModal(false)}>
              <Text style={styles.tagDoneBtnText}>
                Done{taggedUsers.length > 0 ? `  (${taggedUsers.length} tagged)` : ''}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const createStyles = (colors: any) => StyleSheet.create({
  /* Base */
  container: { flex: 1, backgroundColor: colors.background },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 15, color: colors.textSecondary },

  /* Top bar */
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 52 : 14,
    paddingBottom: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    elevation: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4,
  },
  topBarTitle: { fontSize: 24, fontWeight: '800', color: '#1877F2', letterSpacing: -0.5 },
  topBarIcons: { flexDirection: 'row', gap: 6 },
  topBarIcon: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  topBarIconText: { fontSize: 18 },

  /* Nav tabs */
  navBar: { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  navBarContent: { paddingHorizontal: 6, paddingVertical: 2 },
  navTab: {
    paddingHorizontal: 14, paddingVertical: 10, marginHorizontal: 2,
    borderBottomWidth: 3, borderBottomColor: 'transparent',
  },
  navTabActive: { borderBottomColor: '#1877F2' },
  navTabText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  navTabTextActive: { color: '#1877F2' },

  /* Feed */
  feed: { flex: 1, backgroundColor: colors.background },
  feedContent: { paddingBottom: 32 },

  /* Composer */
  composerCard: {
    backgroundColor: colors.surface, marginBottom: 8,
    paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  composerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  composerAvatar: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  composerAvatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  composerInput: {
    flex: 1, fontSize: 15, color: colors.text,
    backgroundColor: colors.background, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: colors.border, minHeight: 42,
  },
  composerPreview: { borderRadius: 12, overflow: 'hidden', marginBottom: 10, position: 'relative' },
  composerPreviewImg: { width: '100%', height: 200, backgroundColor: colors.border },
  composerRemoveBtn: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 14,
    width: 28, height: 28, alignItems: 'center', justifyContent: 'center',
  },
  composerRemoveText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  tagChipRow: { marginBottom: 8 },
  tagChip: {
    backgroundColor: '#E7F3FF', borderRadius: 14,
    paddingHorizontal: 12, paddingVertical: 5, marginRight: 6,
  },
  tagChipText: { color: '#1877F2', fontSize: 13, fontWeight: '600' },
  composerTypeRow: { marginBottom: 4 },
  composerTypeChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 8,
    backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
  },
  composerTypeChipActive: { backgroundColor: '#E7F3FF', borderColor: '#1877F2' },
  composerTypeChipText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  composerTypeChipTextActive: { color: '#1877F2' },
  composerDivider: { height: 1, backgroundColor: colors.border, marginVertical: 8 },
  composerActions: { flexDirection: 'row', alignItems: 'center' },
  composerActionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 8, gap: 4,
  },
  composerActionIcon: { fontSize: 18 },
  composerActionText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  composerPostBtn: {
    backgroundColor: '#1877F2', paddingHorizontal: 20, paddingVertical: 8,
    borderRadius: 6, minWidth: 62, alignItems: 'center',
  },
  composerPostBtnDisabled: { backgroundColor: colors.border },
  composerPostBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },

  /* Post card */
  postCard: {
    backgroundColor: colors.surface, marginBottom: 8,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border,
    overflow: 'visible',
  },
  pinnedBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF9E6', paddingHorizontal: 14, paddingVertical: 6,
    borderBottomWidth: 1, borderBottomColor: '#FFE8A0',
  },
  pinnedBannerText: { fontSize: 12, fontWeight: '600', color: '#8A6D00' },
  postHeader: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 14, paddingTop: 12, paddingBottom: 6,
  },
  postHeaderLeft: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  postAvatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  postAvatarText: { color: '#fff', fontWeight: '700', fontSize: 17 },
  postAuthorBlock: { flex: 1 },
  postAuthorName: { fontSize: 15, fontWeight: '700', color: colors.text },
  typeBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginTop: 3 },
  typeBadgeText: { fontSize: 11, fontWeight: '700' },
  postMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  postTimestamp: { fontSize: 12, color: colors.textSecondary },
  postMetaDot: { fontSize: 10, color: colors.textSecondary },
  postScope: { fontSize: 12, color: colors.textSecondary },
  moreBtn: { padding: 8, marginTop: -4, marginRight: -4 },
  moreBtnText: { fontSize: 20, color: colors.textSecondary, letterSpacing: 1 },
  postContent: { fontSize: 15, color: colors.text, lineHeight: 22, paddingHorizontal: 14, paddingBottom: 10 },
  postMediaImg: { width: '100%', height: 300, backgroundColor: colors.border },

  /* Counts row */
  countsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 8,
  },
  reactionSummary: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  reactionBubble: {
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: colors.surface,
  },
  reactionBubbleText: { fontSize: 11 },
  likeCountText: { fontSize: 14, color: colors.textSecondary },
  commentCountText: { fontSize: 14, color: colors.textSecondary },
  actionDivider: { height: 1, backgroundColor: colors.border, marginHorizontal: 14 },

  /* Reaction popup */
  reactionOverlay: {
    position: 'absolute', bottom: 50, left: 0, right: 0,
    paddingLeft: 10, zIndex: 999,
  },
  reactionPopup: {
    flexDirection: 'row', gap: 2,
    backgroundColor: colors.surface,
    borderRadius: 30, paddingHorizontal: 8, paddingVertical: 8,
    alignSelf: 'flex-start',
    elevation: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  reactionOption: { alignItems: 'center', paddingHorizontal: 4, paddingVertical: 2 },
  reactionOptionIcon: { fontSize: 32 },
  reactionOptionLabel: { fontSize: 9, fontWeight: '700', marginTop: 2 },

  /* Action bar */
  actionBar: { flexDirection: 'row', paddingVertical: 2, paddingHorizontal: 6 },
  actionBarBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, gap: 5, borderRadius: 6,
  },
  actionBarSep: { width: 1, backgroundColor: colors.border, alignSelf: 'center', height: 22 },
  actionBarIcon: { fontSize: 18, color: colors.textSecondary },
  actionBarLabel: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },

  /* Empty */
  emptyState: { paddingTop: 60, alignItems: 'center', paddingHorizontal: 32 },
  emptyStateIcon: { fontSize: 52, marginBottom: 12, opacity: 0.65 },
  emptyStateTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 6 },
  emptyStateSub: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },

  /* Post options bottom sheet */
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheetContainer: {
    backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border,
    alignSelf: 'center', marginTop: 12, marginBottom: 8,
  },
  sheetPostInfo: { paddingHorizontal: 20, paddingVertical: 10 },
  sheetPostName: { fontSize: 16, fontWeight: '700', color: colors.text },
  sheetPostTime: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  sheetDivider: { height: 1, backgroundColor: colors.border },
  sheetItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: colors.background,
  },
  sheetItemIcon: { fontSize: 22, width: 30, textAlign: 'center' },
  sheetItemText: { fontSize: 16, color: colors.text, fontWeight: '500' },
  sheetItemDanger: { color: '#E41619' },
  sheetCancelItem: {
    justifyContent: 'center', borderBottomWidth: 0,
    margin: 14, backgroundColor: colors.background, borderRadius: 12,
  },
  sheetCancelText: { fontSize: 16, fontWeight: '700', color: colors.text, textAlign: 'center', width: '100%' },

  /* Modal root */
  modalRoot: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: Platform.OS === 'ios' ? 56 : 16,
    paddingBottom: 14,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  modalBackBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  modalBackText: { fontSize: 28, color: '#1877F2', fontWeight: '600', lineHeight: 32 },
  modalTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: colors.text, textAlign: 'center' },

  /* Post preview in comments */
  commentListPad: { paddingBottom: 24 },
  commentPostPreview: {
    backgroundColor: colors.surface, marginBottom: 8,
    paddingHorizontal: 14, paddingTop: 14,
  },
  commentPostMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  commentPostAvatar: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  commentPostAvatarText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  commentPostAuthor: { fontSize: 14, fontWeight: '700', color: colors.text },
  commentPostTime: { fontSize: 12, color: colors.textSecondary },
  commentPostContent: { fontSize: 15, color: colors.text, lineHeight: 22, marginBottom: 10 },
  commentPostMedia: { width: '100%', height: 200, borderRadius: 10, marginBottom: 10, backgroundColor: colors.border },
  commentPostStatsRow: { flexDirection: 'row', alignItems: 'center', paddingBottom: 10 },
  commentPostStat: { fontSize: 13, color: colors.textSecondary },
  commentPostDivider: { height: 1, backgroundColor: colors.border, marginBottom: 10 },
  commentsSectionLabel: { fontSize: 15, fontWeight: '700', color: colors.text, paddingBottom: 14 },

  /* Comment rows */
  commentRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 14, marginBottom: 12, gap: 8,
  },
  commentAvatar: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  commentAvatarText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  commentRight: { flex: 1 },
  commentBubble: {
    backgroundColor: colors.background, borderRadius: 18,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  commentName: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 2 },
  commentBody: { fontSize: 14, color: colors.text, lineHeight: 20 },
  commentMeta: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 4, marginTop: 4 },
  commentTime: { fontSize: 11, color: colors.textSecondary },
  commentMetaAction: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  emptyComments: { paddingVertical: 60, alignItems: 'center' },
  emptyCommentsText: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 32 },

  /* Comment input */
  commentInputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border,
  },
  commentInputAvatar: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  commentInputAvatarText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  commentInput: {
    flex: 1, backgroundColor: colors.background, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 9,
    fontSize: 14, color: colors.text,
    borderWidth: 1, borderColor: colors.border, maxHeight: 100,
  },
  commentSendBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#1877F2', alignItems: 'center', justifyContent: 'center',
  },
  commentSendBtnOff: { backgroundColor: colors.border },
  commentSendText: { color: '#fff', fontSize: 22, fontWeight: '700', lineHeight: 28 },

  /* Tag modal */
  tagSearchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.background, marginHorizontal: 14, marginVertical: 10,
    borderRadius: 20, paddingHorizontal: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  tagSearchIcon: { fontSize: 16, color: colors.textSecondary, marginRight: 6 },
  tagSearchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: colors.text },
  tagMemberRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12, gap: 12,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.background,
  },
  tagMemberRowActive: { backgroundColor: '#E7F3FF' },
  tagMemberAvatar: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  tagMemberAvatarText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  tagMemberInfo: { flex: 1 },
  tagMemberName: { fontSize: 15, fontWeight: '600', color: colors.text },
  tagMemberEmail: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  tagChecked: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#1877F2', alignItems: 'center', justifyContent: 'center',
  },
  tagCheckedText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  tagUnchecked: {
    width: 26, height: 26, borderRadius: 13,
    borderWidth: 2, borderColor: colors.border,
  },
  tagFooter: { padding: 14, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  tagDoneBtn: {
    backgroundColor: '#1877F2', borderRadius: 8,
    paddingVertical: 14, alignItems: 'center',
  },
  tagDoneBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
});
