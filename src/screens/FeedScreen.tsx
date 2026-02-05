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
import { colors } from '../theme/colors';
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

export default function FeedScreen() {
  const { user } = useAuth();
  const { colors: themeColors } = useTheme();
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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
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

  const renderPost = ({ item: post }: { item: Post }) => (
    <View style={[styles.postCard, post.is_pinned && styles.pinnedPost]}>
      {post.is_pinned && (
        <LinearGradient
          colors={[colors.primary[50], colors.primary[100]]}
          style={styles.pinnedBadge}
        >
          <Text style={styles.pinnedText}>📌 Pinned Post</Text>
        </LinearGradient>
      )}
      <View style={styles.postHeader}>
        <View style={styles.userInfo}>
          <LinearGradient
            colors={[colors.primary[500], colors.primary[700]]}
            style={styles.avatar}
          >
            {post.profile_image ? (
              <Image source={{ uri: post.profile_image }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>
                {post.first_name.charAt(0)}
              </Text>
            )}
          </LinearGradient>
          <View>
            <Text style={styles.userName}>
              {post.first_name} {post.last_name}
              {post.role !== 'member' && (
                <Text style={styles.roleText}> • {post.role}</Text>
              )}
            </Text>
            <Text style={styles.timestamp}>{formatTimestamp(post.created_at)}</Text>
          </View>
        </View>
        {post.user_id === user?.id && (
          <TouchableOpacity onPress={() => handleDeletePost(post.id)}>
            <Text style={styles.deleteIcon}>🗑️</Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.postContent}>{post.content}</Text>
      {post.media_url && post.media_type === 'image' && (
        <View style={styles.postImageContainer}>
          <Image source={{ uri: post.media_url }} style={styles.postImage} />
        </View>
      )}
      {post.media_url && post.media_type === 'video' && (
        <View style={styles.postImageContainer}>
          <Video
            source={{ uri: post.media_url }}
            style={styles.postImage}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            isLooping
          />
        </View>
      )}
      <View style={styles.postActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleLikePost(post.id)}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={post.user_liked 
              ? [colors.secondary[50], colors.secondary[100]] 
              : ['transparent', 'transparent']}
            style={styles.actionGradient}
          >
            <Text style={styles.actionIcon}>{post.user_liked ? '❤️' : '🤍'}</Text>
            <Text style={[styles.actionText, post.user_liked && styles.likedText]}>
              {post.likes_count}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleOpenComments(post)}
          activeOpacity={0.7}
        >
          <View style={styles.actionGradient}>
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.actionText}>
              {post.comments_count}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <Text style={styles.loadingText}>Loading feed...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterTabs}
        contentContainerStyle={styles.filterTabsContent}
      >
        {['all', 'announcement', 'testimony', 'sermon_clip', 'scripture', 'general'].map(type => (
          <TouchableOpacity
            key={type}
            style={[styles.filterTab, filterType === type && styles.activeFilterTab]}
            onPress={() => setFilterType(type)}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={filterType === type 
                ? [colors.primary[600], colors.primary[700]] 
                : ['transparent', 'transparent']}
              style={styles.filterTabGradient}
            >
              <Text style={[styles.filterTabText, filterType === type && styles.activeFilterTabText]}>
                {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Create Post */}
      <View style={styles.createPost}>
        <LinearGradient
          colors={['rgba(37, 99, 235, 0.02)', 'rgba(37, 99, 235, 0.05)']}
          style={styles.createPostGradient}
        >
          <TextInput
            style={styles.input}
            placeholder="Share something with the church..."
            placeholderTextColor={colors.gray[400]}
            value={newPost}
            onChangeText={setNewPost}
            multiline
          />
          
          {/* Image Preview */}
          {selectedImage && selectedMediaType === 'image' && (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
              <TouchableOpacity 
                style={styles.removeImageButton}
                onPress={removeImage}
              >
                <Text style={styles.removeImageText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Video Preview */}
          {selectedImage && selectedMediaType === 'video' && (
            <View style={styles.imagePreviewContainer}>
              <Video
                source={{ uri: selectedImage }}
                style={styles.imagePreview}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                isLooping
              />
              <TouchableOpacity 
                style={styles.removeImageButton}
                onPress={removeImage}
              >
                <Text style={styles.removeImageText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Tagged Users Display */}
          {taggedUsers.length > 0 && (
            <View style={styles.taggedUsersContainer}>
              <Text style={styles.taggedLabel}>Tagged: </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {taggedUsers.map(taggedUser => (
                  <View key={taggedUser.id} style={styles.taggedUserChip}>
                    <Text style={styles.taggedUserName}>
                      {taggedUser.first_name} {taggedUser.last_name}
                    </Text>
                    <TouchableOpacity onPress={() => toggleTagUser(taggedUser)}>
                      <Text style={styles.removeTagText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
          
          {/* Action Buttons Row */}
          <View style={styles.postActionsRow}>
            <View style={styles.postActions}>
              <TouchableOpacity 
                style={styles.mediaButton}
                onPress={pickImage}
                activeOpacity={0.7}
              >
                <Text style={styles.mediaButtonIcon}>📷</Text>
                <Text style={styles.mediaButtonText}>Photo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.mediaButton}
                onPress={pickVideo}
                activeOpacity={0.7}
              >
                <Text style={styles.mediaButtonIcon}>🎥</Text>
                <Text style={styles.mediaButtonText}>Video</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.mediaButton}
                onPress={() => setShowTagModal(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.mediaButtonIcon}>👤</Text>
                <Text style={styles.mediaButtonText}>Tag</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.postTypeRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.postTypeScroll}>
              {['general', 'testimony', 'scripture'].map(type => (
                <TouchableOpacity
                  key={type}
                  style={[styles.postTypeChip, postType === type && styles.activePostTypeChip]}
                  onPress={() => setPostType(type)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.postTypeText, postType === type && styles.activePostTypeText]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity 
              style={styles.postButton}
              onPress={handleCreatePost}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors.primary[600], colors.primary[700]]}
                style={styles.postButtonGradient}
              >
                <Text style={styles.postButtonText}>Post</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      {/* Feed */}
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={onRefresh}
            colors={[colors.primary[600]]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyText}>No posts yet</Text>
            <Text style={styles.emptySubtext}>Be the first to share something!</Text>
          </View>
        }
      />

      {/* Comments Modal */}
      <Modal
        visible={showCommentsModal}
        animationType="slide"
        onRequestClose={() => setShowCommentsModal(false)}
      >
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={[colors.primary[600], colors.primary[700]]}
            style={styles.modalHeader}
          >
            <Text style={styles.modalTitle}>💬 Comments</Text>
            <TouchableOpacity onPress={() => setShowCommentsModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </LinearGradient>
          
          <FlatList
            data={comments}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.commentCard}>
                <View style={styles.commentHeader}>
                  <LinearGradient
                    colors={[colors.primary[500], colors.primary[700]]}
                    style={styles.smallAvatar}
                  >
                    <Text style={styles.smallAvatarText}>
                      {item.first_name.charAt(0)}
                    </Text>
                  </LinearGradient>
                  <View style={styles.commentInfo}>
                    <Text style={styles.commentUserName}>
                      {item.first_name} {item.last_name}
                    </Text>
                    <Text style={styles.commentTimestamp}>
                      {formatTimestamp(item.created_at)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.commentText}>{item.comment}</Text>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyComments}>
                <Text style={styles.emptyCommentsIcon}>💭</Text>
                <Text style={styles.emptyCommentsText}>No comments yet</Text>
                <Text style={styles.emptyCommentsSubtext}>Be the first to comment!</Text>
              </View>
            }
          />
          
          <View style={styles.commentInputContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment..."
              placeholderTextColor={colors.gray[400]}
              value={newComment}
              onChangeText={setNewComment}
              multiline
            />
            <TouchableOpacity 
              style={styles.sendButton}
              onPress={handleAddComment}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors.primary[600], colors.primary[700]]}
                style={styles.sendButtonGradient}
              >
                <Text style={styles.sendButtonText}>Send</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Tag Users Modal */}
      <Modal
        visible={showTagModal}
        animationType="slide"
        onRequestClose={() => setShowTagModal(false)}
      >
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={[colors.primary[600], colors.primary[700]]}
            style={styles.modalHeader}
          >
            <Text style={styles.modalTitle}>👤 Tag People</Text>
            <TouchableOpacity onPress={() => setShowTagModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </LinearGradient>
          
          <View style={styles.searchContainer}>
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
              return (
                <TouchableOpacity
                  style={styles.userItem}
                  onPress={() => toggleTagUser(tagUser)}
                  activeOpacity={0.7}
                >
                  <View style={styles.userItemContent}>
                    <LinearGradient
                      colors={[colors.primary[500], colors.primary[700]]}
                      style={styles.smallAvatar}
                    >
                      <Text style={styles.smallAvatarText}>
                        {tagUser.first_name.charAt(0)}
                      </Text>
                    </LinearGradient>
                    <Text style={styles.userItemName}>
                      {tagUser.first_name} {tagUser.last_name}
                    </Text>
                  </View>
                  {isTagged && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyComments}>
                <Text style={styles.emptyCommentsIcon}>👥</Text>
                <Text style={styles.emptyCommentsText}>No users found</Text>
              </View>
            }
          />
          
          <View style={styles.tagModalFooter}>
            <TouchableOpacity 
              style={styles.doneButton}
              onPress={() => setShowTagModal(false)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors.primary[600], colors.primary[700]]}
                style={styles.doneButtonGradient}
              >
                <Text style={styles.doneButtonText}>
                  Done {taggedUsers.length > 0 && `(${taggedUsers.length})`}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.gray[600],
  },
  filterTabs: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
    maxHeight: 70,
  },
  filterTabsContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  filterTab: {
    marginRight: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  filterTabGradient: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.primary[600],
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
  createPost: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  createPostGradient: {
    padding: 16,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    minHeight: 60,
    color: colors.gray[900],
    borderWidth: 1,
    borderColor: colors.gray[200],
    fontSize: 15,
  },
  postTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  postTypeScroll: {
    flex: 1,
  },
  postTypeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: colors.gray[100],
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  activePostTypeChip: {
    backgroundColor: colors.primary[100],
    borderColor: colors.primary[300],
  },
  postTypeText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray[600],
  },
  activePostTypeText: {
    color: colors.primary[700],
    fontWeight: 'bold',
  },
  postButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: colors.primary[600],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  postButtonGradient: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  postButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 15,
  },
  postCard: {
    backgroundColor: colors.white,
    marginVertical: 6,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: colors.primary[900],
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  pinnedPost: {
    borderWidth: 2,
    borderColor: colors.primary[300],
  },
  pinnedBadge: {
    marginBottom: 12,
    padding: 8,
    borderRadius: 12,
  },
  pinnedText: {
    fontSize: 13,
    color: colors.primary[700],
    fontWeight: 'bold',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.white,
    shadowColor: colors.primary[600],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  roleText: {
    fontSize: 13,
    color: colors.primary[600],
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 2,
  },
  deleteIcon: {
    fontSize: 20,
  },
  postContent: {
    fontSize: 16,
    color: colors.gray[800],
    lineHeight: 24,
    marginBottom: 12,
  },
  postImageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 220,
    backgroundColor: colors.gray[200],
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 12,
  },
  actionIcon: {
    fontSize: 22,
    marginRight: 6,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[600],
  },
  likedText: {
    color: colors.secondary[600],
    fontWeight: 'bold',
  },
  emptyState: {
    padding: 60,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.gray[500],
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
  },
  closeButton: {
    fontSize: 28,
    color: colors.white,
    fontWeight: '300',
  },
  commentCard: {
    backgroundColor: colors.white,
    padding: 16,
    marginVertical: 4,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: colors.primary[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  commentHeader: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  smallAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 2,
    borderColor: colors.white,
  },
  smallAvatarText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  commentInfo: {
    flex: 1,
  },
  commentUserName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  commentTimestamp: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 2,
  },
  commentText: {
    fontSize: 15,
    color: colors.gray[700],
    lineHeight: 22,
  },
  emptyComments: {
    padding: 60,
    alignItems: 'center',
  },
  emptyCommentsIcon: {
    fontSize: 48,
    marginBottom: 12,
    opacity: 0.4,
  },
  emptyCommentsText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[600],
    marginBottom: 6,
  },
  emptyCommentsSubtext: {
    fontSize: 14,
    color: colors.gray[500],
  },
  commentInputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    alignItems: 'flex-end',
  },
  commentInput: {
    flex: 1,
    backgroundColor: colors.gray[50],
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
    maxHeight: 100,
    color: colors.gray[900],
    borderWidth: 1,
    borderColor: colors.gray[200],
    fontSize: 15,
  },
  sendButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: colors.primary[600],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonGradient: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sendButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 15,
  },
  imagePreviewContainer: {
    marginTop: 12,
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  taggedUsersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.gray[50],
    borderRadius: 12,
  },
  taggedLabel: {
    fontSize: 13,
    color: colors.gray[600],
    fontWeight: '600',
    marginRight: 8,
  },
  taggedUserChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[100],
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  taggedUserName: {
    fontSize: 12,
    color: colors.primary[700],
    fontWeight: '600',
    marginRight: 6,
  },
  removeTagText: {
    fontSize: 12,
    color: colors.primary[600],
    fontWeight: 'bold',
  },
  postActionsRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  // postActions: {
  //   flexDirection: 'row',
  //   gap: 12,
  // },
  mediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.gray[100],
    borderRadius: 20,
  },
  mediaButtonIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  mediaButtonText: {
    fontSize: 13,
    color: colors.gray[700],
    fontWeight: '600',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  searchInput: {
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.gray[900],
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  userItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[900],
    marginLeft: 12,
  },
  checkmark: {
    fontSize: 20,
    color: colors.primary[600],
    fontWeight: 'bold',
  },
  tagModalFooter: {
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  doneButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: colors.primary[600],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  doneButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

