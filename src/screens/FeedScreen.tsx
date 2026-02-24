import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  Dimensions,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { feedService, api } from '../services';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

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

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  profile_image?: string;
}

const SERVER_BASE = 'http://localhost:5000';
const getPhotoUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${SERVER_BASE}${path}`;
};

export default function FeedScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [postType, setPostType] = useState('general');
  const [filterType, setFilterType] = useState('all');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedMediaType, setSelectedMediaType] = useState<'image' | 'video' | null>(null);
  const [taggedUsers, setTaggedUsers] = useState<User[]>([]);
  const [showTagModal, setShowTagModal] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  useEffect(() => {
    loadPosts();
    loadUsers();
  }, [filterType]);

  const loadUsers = async () => {
    try {
      const response = await api.get('/auth/users');
      setAllUsers(response.data.users || []);
    } catch (error: any) {
      console.error('Failed to load users:', error);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permissions to select media');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        setSelectedMediaType('image');
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const pickVideo = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permissions to select videos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: false,
        quality: 0.8,
        videoMaxDuration: 60,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        setSelectedMediaType('video');
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to pick video');
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setSelectedMediaType(null);
  };

  const toggleTagUser = (selectedUser: User) => {
    setTaggedUsers(prev => {
      const isAlreadyTagged = prev.some(u => u.id === selectedUser.id);
      if (isAlreadyTagged) {
        return prev.filter(u => u.id !== selectedUser.id);
      } else {
        return [...prev, selectedUser];
      }
    });
  };

  const loadPosts = async () => {
    try {
      setIsLoading(true);
      const data = await feedService.getPosts(filterType);
      setPosts(data.posts);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadPosts();
    setIsRefreshing(false);
  };

  const handleCreatePost = async () => {
    if (!newPost.trim()) {
      Alert.alert('Error', 'Please enter some content');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('content', newPost);
      formData.append('postType', postType);
      
      // Add tagged users
      if (taggedUsers.length > 0) {
        formData.append('taggedUsers', JSON.stringify(taggedUsers.map(u => u.id)));
      }
      
      // Add image if selected
      if (selectedImage) {
        const filename = selectedImage.split('/').pop() || 'media.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const extension = match ? match[1] : 'jpg';
        const type = selectedMediaType === 'video' 
          ? `video/${extension}` 
          : `image/${extension}`;
        
        formData.append('media', {
          uri: selectedImage,
          name: filename,
          type: type,
        } as any);
      }
      
      await api.post('/feed', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setNewPost('');
      setSelectedImage(null);
      setSelectedMediaType(null);
      setTaggedUsers([]);
      Alert.alert('Success', 'Post created successfully');
      loadPosts();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create post');
    }
  };

  const handleLikePost = async (postId: number) => {
    try {
      await feedService.likePost(postId);
      // Update local state
      setPosts(posts.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              user_liked: !post.user_liked,
              likes_count: post.user_liked ? post.likes_count - 1 : post.likes_count + 1
            }
          : post
      ));
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleOpenComments = async (post: Post) => {
    try {
      setSelectedPost(post);
      const data = await feedService.getPost(post.id);
      setComments(data.comments);
      setShowCommentsModal(true);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedPost) return;

    try {
      await feedService.addComment(selectedPost.id, newComment);
      setNewComment('');
      // Reload comments
      const data = await feedService.getPost(selectedPost.id);
      setComments(data.comments);
      // Update comments count
      setPosts(posts.map(post => 
        post.id === selectedPost.id 
          ? { ...post, comments_count: post.comments_count + 1 }
          : post
      ));
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDeletePost = async (postId: number) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await feedService.deletePost(postId);
              setPosts(posts.filter(p => p.id !== postId));
              Alert.alert('Success', 'Post deleted successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getPostTypeStyle = (type: string) => {
    const map: Record<string, { bg: string; text: string; label: string }> = {
      announcement: { bg: '#FEF3C7', text: '#92400E', label: 'Announcement' },
      testimony:    { bg: '#D1FAE5', text: '#065F46', label: 'Testimony' },
      sermon_clip:  { bg: '#EDE9FE', text: '#5B21B6', label: 'Sermon' },
      scripture:    { bg: '#DBEAFE', text: '#1E40AF', label: 'Scripture' },
      general:      { bg: '#F3F4F6', text: '#374151', label: 'General' },
    };
    return map[type] || map.general;
  };

  const renderPost = ({ item: post }: { item: Post }) => {
    const typeStyle = getPostTypeStyle(post.post_type);
    const photoUri = getPhotoUrl(post.profile_image);
    const initials = `${post.first_name.charAt(0)}${post.last_name.charAt(0)}`;
    return (
      <View style={[styles.postCard, post.is_pinned && styles.pinnedPost]}>
        {/* Pinned indicator */}
        {post.is_pinned && (
          <View style={styles.pinnedBadge}>
            <Text style={styles.pinnedText}>📌  Pinned</Text>
          </View>
        )}

        {/* Header */}
        <View style={styles.postHeader}>
          <View style={styles.avatarWrap}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.avatarImg} />
            ) : (
              <LinearGradient colors={[colors.primary[500], colors.primary[700]]} style={styles.avatarImg}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </LinearGradient>
            )}
          </View>
          <View style={styles.posterMeta}>
            <Text style={styles.posterName}>{post.first_name} {post.last_name}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.postTime}>{formatTimestamp(post.created_at)}</Text>
              {post.post_type !== 'general' && (
                <View style={[styles.typePill, { backgroundColor: typeStyle.bg }]}>
                  <Text style={[styles.typePillText, { color: typeStyle.text }]}>{typeStyle.label}</Text>
                </View>
              )}
            </View>
          </View>
          {post.user_id === user?.id && (
            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeletePost(post.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.deleteDot}>•••</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Content */}
        <Text style={styles.postContent}>{post.content}</Text>

        {/* Media */}
        {post.media_url && post.media_type === 'image' && (
          <View style={styles.mediaContainer}>
            <Image source={{ uri: post.media_url }} style={styles.postMedia} resizeMode="cover" />
          </View>
        )}
        {post.media_url && post.media_type === 'video' && (
          <View style={styles.mediaContainer}>
            <Video source={{ uri: post.media_url }} style={styles.postMedia} useNativeControls resizeMode={ResizeMode.CONTAIN} isLooping />
          </View>
        )}

        {/* Divider */}
        <View style={styles.actionDivider} />

        {/* Actions */}
        <View style={styles.postActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleLikePost(post.id)} activeOpacity={0.7}>
            <Text style={[styles.actionIcon, post.user_liked && styles.likedIcon]}>
              {post.user_liked ? '♥' : '♡'}
            </Text>
            <Text style={[styles.actionLabel, post.user_liked && styles.likedLabel]}>
              {post.likes_count > 0 ? post.likes_count : ''} {post.likes_count === 1 ? 'Like' : 'Like'}
            </Text>
          </TouchableOpacity>
          <View style={styles.actionSep} />
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleOpenComments(post)} activeOpacity={0.7}>
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.actionLabel}>
              {post.comments_count > 0 ? post.comments_count : ''} Comment
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const filterConfig: { key: string; label: string; icon: string }[] = [
    { key: 'all',          label: 'All',          icon: '🏠' },
    { key: 'announcement', label: 'Announcements', icon: '📢' },
    { key: 'testimony',    label: 'Testimonies',   icon: '🙌' },
    { key: 'sermon_clip',  label: 'Sermons',       icon: '🎙️' },
    { key: 'scripture',    label: 'Scripture',     icon: '📖' },
    { key: 'general',      label: 'General',       icon: '💬' },
  ];

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <Text style={styles.loadingText}>Loading feed...</Text>
      </View>
    );
  }

  const currentUserPhoto = getPhotoUrl((user as any)?.photo);
  const currentUserInitials = user?.fullName?.charAt(0) || user?.firstName?.charAt(0) || 'U';

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterTabsContent}
        >
          {filterConfig.map(({ key, label, icon }) => (
            <TouchableOpacity
              key={key}
              style={[styles.filterTab, filterType === key && styles.filterTabActive]}
              onPress={() => setFilterType(key)}
              activeOpacity={0.75}
            >
              {filterType === key ? (
                <LinearGradient
                  colors={[colors.primary[600], colors.primary[800]]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.filterTabInner}
                >
                  <Text style={styles.filterTabIcon}>{icon}</Text>
                  <Text style={styles.filterTabLabelActive}>{label}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.filterTabInner}>
                  <Text style={styles.filterTabIcon}>{icon}</Text>
                  <Text style={styles.filterTabLabel}>{label}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[colors.primary[600]]}
            tintColor={colors.primary[600]}
          />
        }
        contentContainerStyle={styles.feedList}
        ListHeaderComponent={
          /* ─── Composer ─── */
          <View style={styles.composer}>
            <View style={styles.composerTop}>
              {currentUserPhoto ? (
                <Image source={{ uri: currentUserPhoto }} style={styles.composerAvatar} />
              ) : (
                <LinearGradient colors={[colors.primary[500], colors.primary[700]]} style={styles.composerAvatar}>
                  <Text style={styles.composerAvatarText}>{currentUserInitials}</Text>
                </LinearGradient>
              )}
              <TextInput
                style={styles.composerInput}
                placeholder="What's on your heart today?"
                placeholderTextColor={colors.gray[400]}
                value={newPost}
                onChangeText={setNewPost}
                multiline
              />
            </View>

            {/* Media previews */}
            {selectedImage && selectedMediaType === 'image' && (
              <View style={styles.previewWrap}>
                <Image source={{ uri: selectedImage }} style={styles.mediaPreview} />
                <TouchableOpacity style={styles.removeMedia} onPress={removeImage}>
                  <Text style={styles.removeMediaText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
            {selectedImage && selectedMediaType === 'video' && (
              <View style={styles.previewWrap}>
                <Video source={{ uri: selectedImage }} style={styles.mediaPreview} useNativeControls resizeMode={ResizeMode.CONTAIN} isLooping />
                <TouchableOpacity style={styles.removeMedia} onPress={removeImage}>
                  <Text style={styles.removeMediaText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Tagged chips */}
            {taggedUsers.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagChipRow}>
                {taggedUsers.map(tu => (
                  <TouchableOpacity key={tu.id} style={styles.tagChip} onPress={() => toggleTagUser(tu)}>
                    <Text style={styles.tagChipText}>@{tu.first_name} {tu.last_name}  ✕</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Bottom toolbar */}
            <View style={styles.composerToolbar}>
              {/* Left: media buttons */}
              <View style={styles.composerMediaBtns}>
                <TouchableOpacity style={styles.composerMediaBtn} onPress={pickImage}>
                  <Text style={styles.composerMediaIcon}>🖼️</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.composerMediaBtn} onPress={pickVideo}>
                  <Text style={styles.composerMediaIcon}>🎬</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.composerMediaBtn} onPress={() => setShowTagModal(true)}>
                  <Text style={styles.composerMediaIcon}>@ </Text>
                </TouchableOpacity>
              </View>

              {/* Right: type + post */}
              <View style={styles.composerRight}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {['general', 'testimony', 'scripture'].map(t => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.typeChip, postType === t && styles.typeChipActive]}
                      onPress={() => setPostType(t)}
                    >
                      <Text style={[styles.typeChipText, postType === t && styles.typeChipTextActive]}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TouchableOpacity style={styles.postBtn} onPress={handleCreatePost} activeOpacity={0.85}>
                  <LinearGradient colors={[colors.primary[600], colors.primary[800]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.postBtnInner}>
                    <Text style={styles.postBtnText}>Post</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>✨</Text>
            <Text style={styles.emptyTitle}>Nothing here yet</Text>
            <Text style={styles.emptySubtext}>Be the first to share a blessing!</Text>
          </View>
        }
      />

      {/* ─── Comments Modal ─── */}
      <Modal visible={showCommentsModal} animationType="slide" onRequestClose={() => setShowCommentsModal(false)}>
        <View style={styles.sheetContainer}>
          {/* Handle */}
          <View style={styles.sheetHandle} />

          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Comments</Text>
            <TouchableOpacity style={styles.sheetClose} onPress={() => setShowCommentsModal(false)}>
              <Text style={styles.sheetCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={comments}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
            renderItem={({ item }) => {
              const cPhotoUri = getPhotoUrl(item.profile_image);
              return (
                <View style={styles.commentCard}>
                  <View style={styles.commentAvatarWrap}>
                    {cPhotoUri ? (
                      <Image source={{ uri: cPhotoUri }} style={styles.commentAvatar} />
                    ) : (
                      <LinearGradient colors={[colors.primary[500], colors.primary[700]]} style={styles.commentAvatar}>
                        <Text style={styles.commentAvatarText}>{item.first_name.charAt(0)}</Text>
                      </LinearGradient>
                    )}
                  </View>
                  <View style={styles.commentBubble}>
                    <View style={styles.commentBubbleHeader}>
                      <Text style={styles.commentAuthor}>{item.first_name} {item.last_name}</Text>
                      <Text style={styles.commentTime}>{formatTimestamp(item.created_at)}</Text>
                    </View>
                    <Text style={styles.commentBody}>{item.comment}</Text>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyComments}>
                <Text style={styles.emptyCommentsIcon}>💭</Text>
                <Text style={styles.emptyCommentsText}>No comments yet — start the conversation!</Text>
              </View>
            }
          />

          <View style={styles.commentBar}>
            <TextInput
              style={styles.commentBarInput}
              placeholder="Write a comment..."
              placeholderTextColor={colors.gray[400]}
              value={newComment}
              onChangeText={setNewComment}
              multiline
            />
            <TouchableOpacity style={styles.sendBtn} onPress={handleAddComment} activeOpacity={0.85}>
              <LinearGradient colors={[colors.primary[600], colors.primary[800]]} style={styles.sendBtnInner}>
                <Text style={styles.sendBtnText}>↑</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── Tag Users Modal ─── */}
      <Modal visible={showTagModal} animationType="slide" onRequestClose={() => setShowTagModal(false)}>
        <View style={styles.sheetContainer}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Tag People</Text>
            <TouchableOpacity style={styles.sheetClose} onPress={() => setShowTagModal(false)}>
              <Text style={styles.sheetCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search members..."
              placeholderTextColor={colors.gray[400]}
              value={userSearchQuery}
              onChangeText={setUserSearchQuery}
            />
          </View>

          <FlatList
            data={allUsers.filter(u =>
              u.id !== user?.id &&
              (userSearchQuery === '' ||
               `${u.first_name} ${u.last_name}`.toLowerCase().includes(userSearchQuery.toLowerCase()))
            )}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item: tagUser }) => {
              const isTagged = taggedUsers.some(u => u.id === tagUser.id);
              const tPhotoUri = getPhotoUrl(tagUser.profile_image);
              return (
                <TouchableOpacity style={[styles.memberRow, isTagged && styles.memberRowActive]} onPress={() => toggleTagUser(tagUser)} activeOpacity={0.75}>
                  <View style={styles.memberAvatarWrap}>
                    {tPhotoUri ? (
                      <Image source={{ uri: tPhotoUri }} style={styles.memberAvatar} />
                    ) : (
                      <LinearGradient colors={[colors.primary[500], colors.primary[700]]} style={styles.memberAvatar}>
                        <Text style={styles.memberAvatarText}>{tagUser.first_name.charAt(0)}</Text>
                      </LinearGradient>
                    )}
                  </View>
                  <Text style={styles.memberName}>{tagUser.first_name} {tagUser.last_name}</Text>
                  {isTagged && (
                    <View style={styles.checkBadge}>
                      <Text style={styles.checkBadgeText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyComments}>
                <Text style={styles.emptyCommentsIcon}>👥</Text>
                <Text style={styles.emptyCommentsText}>No members found</Text>
              </View>
            }
          />

          <View style={styles.sheetFooter}>
            <TouchableOpacity style={styles.doneBtn} onPress={() => setShowTagModal(false)} activeOpacity={0.85}>
              <LinearGradient colors={[colors.primary[600], colors.primary[800]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.doneBtnInner}>
                <Text style={styles.doneBtnText}>Done{taggedUsers.length > 0 ? `  (${taggedUsers.length})` : ''}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6FA',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 14,
    fontSize: 15,
    color: colors.gray[500],
    fontWeight: '500',
  },

  /* ── Filter bar ── */
  filterBar: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECF2',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  filterTabsContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  filterTab: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  filterTabActive: {
    shadowColor: colors.primary[700],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  filterTabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DDE3EF',
    backgroundColor: colors.white,
    gap: 5,
  },
  filterTabIcon: { fontSize: 13 },
  filterTabLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.gray[600],
  },
  filterTabLabelActive: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* ── Feed list ── */
  feedList: {
    paddingBottom: 24,
  },

  /* ── Composer ── */
  composer: {
    backgroundColor: colors.white,
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#EEF1F8',
  },
  composerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  composerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  composerAvatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  composerInput: {
    flex: 1,
    minHeight: 52,
    fontSize: 15,
    color: colors.gray[800],
    lineHeight: 22,
    paddingTop: 4,
  },
  previewWrap: {
    marginBottom: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mediaPreview: {
    width: '100%',
    height: 180,
    backgroundColor: colors.gray[100],
    borderRadius: 12,
  },
  removeMedia: {
    position: 'absolute',
    top: 8, right: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 14,
    width: 26, height: 26,
    alignItems: 'center', justifyContent: 'center',
  },
  removeMediaText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  tagChipRow: { marginBottom: 8 },
  tagChip: {
    backgroundColor: colors.primary[50],
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 6,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  tagChipText: { fontSize: 12, color: colors.primary[700], fontWeight: '600' },
  composerToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#EEF1F8',
    paddingTop: 8,
    marginTop: 4,
  },
  composerMediaBtns: { flexDirection: 'row', gap: 2 },
  composerMediaBtn: {
    padding: 8,
    borderRadius: 10,
  },
  composerMediaIcon: { fontSize: 19 },
  composerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    justifyContent: 'flex-end',
  },
  typeChip: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    marginRight: 5,
    borderWidth: 1,
    borderColor: '#E2E5EE',
  },
  typeChipActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[300],
  },
  typeChipText: { fontSize: 12, color: colors.gray[600], fontWeight: '500' },
  typeChipTextActive: { color: colors.primary[700], fontWeight: '700' },
  postBtn: {
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: colors.primary[700],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  postBtnInner: {
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  postBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  /* ── Post card ── */
  postCard: {
    backgroundColor: colors.white,
    marginHorizontal: 12,
    marginTop: 10,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#EEF1F8',
  },
  pinnedPost: {
    borderColor: colors.primary[300],
    borderWidth: 1.5,
  },
  pinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary[100],
  },
  pinnedText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary[700],
    letterSpacing: 0.2,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    paddingBottom: 10,
  },
  avatarWrap: {
    marginRight: 11,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  avatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.primary[100],
  },
  avatarInitials: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  posterMeta: { flex: 1 },
  posterName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.gray[900],
    letterSpacing: 0.1,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 8 },
  postTime: { fontSize: 12, color: colors.gray[400], fontWeight: '400' },
  typePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  typePillText: { fontSize: 11, fontWeight: '600' },
  deleteBtn: { padding: 6 },
  deleteDot: { fontSize: 18, color: colors.gray[400], letterSpacing: 2 },
  postContent: {
    fontSize: 15,
    color: colors.gray[800],
    lineHeight: 24,
    paddingHorizontal: 14,
    paddingBottom: 12,
    letterSpacing: 0.1,
  },
  mediaContainer: {
    marginHorizontal: 14,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  postMedia: {
    width: '100%',
    height: 230,
    backgroundColor: colors.gray[100],
  },
  actionDivider: {
    height: 1,
    backgroundColor: '#EEF1F8',
    marginHorizontal: 14,
  },
  postActions: {
    flexDirection: 'row',
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
    borderRadius: 10,
  },
  actionIcon: {
    fontSize: 19,
    color: colors.gray[500],
  },
  likedIcon: { color: '#E53E3E' },
  actionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray[500],
  },
  likedLabel: { color: '#E53E3E' },
  actionSep: {
    width: 1,
    height: 28,
    backgroundColor: '#EEF1F8',
    alignSelf: 'center',
  },

  /* ── Empty state ── */
  emptyState: {
    paddingTop: 80,
    alignItems: 'center',
  },
  emptyIcon: { fontSize: 56, marginBottom: 14, opacity: 0.6 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.gray[700], marginBottom: 6 },
  emptySubtext: { fontSize: 14, color: colors.gray[400] },

  /* ── Bottom sheet modals ── */
  sheetContainer: {
    flex: 1,
    backgroundColor: '#F4F6FA',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E0',
    alignSelf: 'center',
    marginTop: 14,
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF1F8',
    marginBottom: 4,
  },
  sheetTitle: { fontSize: 20, fontWeight: '700', color: colors.gray[900] },
  sheetClose: {
    width: 32, height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCloseText: { fontSize: 15, color: colors.gray[600], fontWeight: '600' },
  sheetFooter: {
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: '#EEF1F8',
  },

  /* ── Comment card ── */
  commentCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
  },
  commentAvatarWrap: { marginRight: 10 },
  commentAvatar: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: colors.primary[100],
  },
  commentAvatarText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  commentBubble: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#EEF1F8',
  },
  commentBubbleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  commentAuthor: { fontSize: 14, fontWeight: '700', color: colors.gray[900] },
  commentTime: { fontSize: 11, color: colors.gray[400] },
  commentBody: { fontSize: 14, color: colors.gray[700], lineHeight: 20 },

  emptyComments: { paddingVertical: 48, alignItems: 'center' },
  emptyCommentsIcon: { fontSize: 40, opacity: 0.4, marginBottom: 10 },
  emptyCommentsText: { fontSize: 15, color: colors.gray[500], fontWeight: '500', textAlign: 'center', paddingHorizontal: 32 },

  /* ── Comment bar ── */
  commentBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: '#EEF1F8',
    gap: 10,
  },
  commentBarInput: {
    flex: 1,
    minHeight: 42,
    maxHeight: 100,
    backgroundColor: '#F4F6FA',
    borderRadius: 21,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.gray[800],
    borderWidth: 1,
    borderColor: '#DDE3EF',
  },
  sendBtn: {
    width: 42, height: 42,
    borderRadius: 21,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: colors.primary[700],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  sendBtnInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  sendBtnText: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: -1 },

  /* ── Tag modal ── */
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#DDE3EF',
  },
  searchIcon: { fontSize: 15, marginRight: 6, color: colors.gray[400] },
  searchInput: {
    flex: 1,
    paddingVertical: 11,
    fontSize: 14,
    color: colors.gray[800],
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 11,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F6FA',
  },
  memberRowActive: { backgroundColor: colors.primary[50] },
  memberAvatarWrap: { marginRight: 12 },
  memberAvatar: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1.5, borderColor: colors.primary[100],
  },
  memberAvatarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  memberName: { flex: 1, fontSize: 15, fontWeight: '500', color: colors.gray[800] },
  checkBadge: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: colors.primary[600],
    alignItems: 'center', justifyContent: 'center',
  },
  checkBadgeText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  doneBtn: { borderRadius: 12, overflow: 'hidden', elevation: 2 },
  doneBtnInner: { paddingVertical: 14, alignItems: 'center' },
  doneBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  /* ── Kept for legacy refs ── */
  filterTab_UNUSED: {
    marginRight: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  activeFilterTab: {
    shadowColor: colors.primary[600],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary[600],
  },
  activeFilterTabText: {
    color: colors.white,
  },
});
