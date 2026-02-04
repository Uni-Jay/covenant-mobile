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
} from 'react-native';
import { colors } from '../theme/colors';
import { feedService } from '../services';
import { useAuth } from '../context/AuthContext';

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

export default function FeedScreen() {
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
  const { user } = useAuth();

  useEffect(() => {
    loadPosts();
  }, [filterType]);

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
      await feedService.createPost(newPost, postType);
      setNewPost('');
      Alert.alert('Success', 'Post created successfully');
      loadPosts();
    } catch (error: any) {
      Alert.alert('Error', error.message);
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
        <View style={styles.pinnedBadge}>
          <Text style={styles.pinnedText}>📌 Pinned</Text>
        </View>
      )}
      <View style={styles.postHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            {post.profile_image ? (
              <Image source={{ uri: post.profile_image }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>
                {post.first_name.charAt(0)}
              </Text>
            )}
          </View>
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
      {post.media_url && (
        <Image source={{ uri: post.media_url }} style={styles.postImage} />
      )}
      <View style={styles.postActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleLikePost(post.id)}
        >
          <Text style={styles.actionIcon}>{post.user_liked ? '❤️' : '🤍'}</Text>
          <Text style={[styles.actionText, post.user_liked && styles.likedText]}>
            {post.likes_count} {post.likes_count === 1 ? 'Like' : 'Likes'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleOpenComments(post)}
        >
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionText}>
            {post.comments_count} {post.comments_count === 1 ? 'Comment' : 'Comments'}
          </Text>
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
      >
        {['all', 'announcement', 'testimony', 'sermon_clip', 'scripture', 'general'].map(type => (
          <TouchableOpacity
            key={type}
            style={[styles.filterTab, filterType === type && styles.activeFilterTab]}
            onPress={() => setFilterType(type)}
          >
            <Text style={[styles.filterTabText, filterType === type && styles.activeFilterTabText]}>
              {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Create Post */}
      <View style={styles.createPost}>
        <TextInput
          style={styles.input}
          placeholder="Share something with the church..."
          placeholderTextColor={colors.gray[400]}
          value={newPost}
          onChangeText={setNewPost}
          multiline
        />
        <View style={styles.postTypeRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['general', 'testimony', 'scripture'].map(type => (
              <TouchableOpacity
                key={type}
                style={[styles.postTypeChip, postType === type && styles.activePostTypeChip]}
                onPress={() => setPostType(type)}
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
          >
            <Text style={styles.postButtonText}>Post</Text>
          </TouchableOpacity>
        </View>
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
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Comments</Text>
            <TouchableOpacity onPress={() => setShowCommentsModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={comments}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.commentCard}>
                <View style={styles.commentHeader}>
                  <View style={styles.smallAvatar}>
                    <Text style={styles.smallAvatarText}>
                      {item.first_name.charAt(0)}
                    </Text>
                  </View>
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
                <Text style={styles.emptyCommentsText}>No comments yet</Text>
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
            >
              <Text style={styles.sendButtonText}>Send</Text>
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
    backgroundColor: colors.background,
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
    borderBottomColor: colors.primary[100],
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeFilterTab: {
    borderBottomColor: colors.primary[600],
  },
  filterTabText: {
    fontSize: 14,
    color: colors.gray[600],
  },
  activeFilterTabText: {
    color: colors.primary[600],
    fontWeight: 'bold',
  },
  createPost: {
    backgroundColor: colors.white,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary[100],
  },
  input: {
    backgroundColor: colors.gray[50],
    borderRadius: 20,
    padding: 12,
    marginBottom: 12,
    minHeight: 60,
    color: colors.gray[900],
  },
  postTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  postTypeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.gray[100],
    marginRight: 8,
  },
  activePostTypeChip: {
    backgroundColor: colors.primary[100],
  },
  postTypeText: {
    fontSize: 12,
    color: colors.gray[600],
  },
  activePostTypeText: {
    color: colors.primary[600],
    fontWeight: 'bold',
  },
  postButton: {
    backgroundColor: colors.primary[600],
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    elevation: 2,
    shadowColor: colors.primary[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  postButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  postCard: {
    backgroundColor: colors.white,
    marginVertical: 4,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.primary[100],
    elevation: 2,
    shadowColor: colors.primary[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  pinnedPost: {
    borderColor: colors.primary[300],
    backgroundColor: colors.primary[50],
  },
  pinnedBadge: {
    marginBottom: 8,
  },
  pinnedText: {
    fontSize: 12,
    color: colors.primary[600],
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: colors.primary[200],
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  roleText: {
    fontSize: 12,
    color: colors.primary[600],
    fontWeight: 'normal',
  },
  timestamp: {
    fontSize: 12,
    color: colors.gray[500],
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
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 20,
    marginRight: 4,
  },
  actionText: {
    fontSize: 14,
    color: colors.gray[600],
  },
  likedText: {
    color: colors.secondary[600],
    fontWeight: 'bold',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.gray[700],
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.gray[500],
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary[100],
    backgroundColor: colors.primary[600],
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
  },
  closeButton: {
    fontSize: 24,
    color: colors.white,
  },
  commentCard: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  commentHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  smallAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  smallAvatarText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  commentInfo: {
    flex: 1,
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  commentTimestamp: {
    fontSize: 12,
    color: colors.gray[500],
  },
  commentText: {
    fontSize: 14,
    color: colors.gray[700],
    lineHeight: 20,
  },
  emptyComments: {
    padding: 40,
    alignItems: 'center',
  },
  emptyCommentsText: {
    fontSize: 14,
    color: colors.gray[500],
  },
  commentInputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.primary[100],
    alignItems: 'flex-end',
  },
  commentInput: {
    flex: 1,
    backgroundColor: colors.gray[50],
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
    color: colors.gray[900],
  },
  sendButton: {
    backgroundColor: colors.primary[600],
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sendButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
});
