import { Ionicons } from '@expo/vector-icons';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, increment, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { ActivityIndicator, Alert, Dimensions, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import withGradient from '../../components/withGradient';
import { auth, db } from '../../config/firebase';

const { width } = Dimensions.get('window');

// Enhanced Comment Item Component
const CommentItem = ({ 
  comment, 
  user, 
  reactions, 
  userReactions, 
  onReaction, 
  onReply, 
  onEdit, 
  onDelete, 
  onShowReactionPicker,
  showReactionPicker,
  formatDate 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const isOwner = user?.uid === comment.userId;

  const handleSaveEdit = () => {
    if (editText.trim() && editText !== comment.content) {
      onEdit(editText);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditText(comment.content);
    setIsEditing(false);
  };

  return (
    <View style={[styles.commentItem, comment.isReply && styles.replyComment]}>
      {/* Enhanced Comment Header */}
      <View style={styles.commentHeader}>
        <View style={styles.commentAvatar}>
          <Text style={styles.commentAvatarText}>
            {comment.authorName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.commentAuthorInfo}>
          <View style={styles.authorNameRow}>
            <Text style={styles.commentAuthorName}>{comment.authorName}</Text>
            {isOwner && (
              <View style={styles.ownerBadge}>
                <Text style={styles.ownerBadgeText}>You</Text>
              </View>
            )}
          </View>
          <Text style={styles.commentTime}>
            {formatDate(comment.createdAt)}
            {comment.editedAt && (
              <Text style={styles.editedIndicator}> • edited</Text>
            )}
          </Text>
        </View>
        {isOwner && (
          <View style={styles.commentActions}>
            <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.actionButton}>
              <Ionicons name="create-outline" size={18} color="#4F2780" />
            </TouchableOpacity>
            <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
              <Ionicons name="trash-outline" size={18} color="#E74C3C" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Enhanced Comment Content */}
      {isEditing ? (
        <View style={styles.editContainer}>
          <TextInput
            style={styles.editInput}
            value={editText}
            onChangeText={setEditText}
            multiline
            maxLength={500}
            placeholder="Edit your comment..."
            placeholderTextColor="#9CA3AF"
          />
          <View style={styles.editActions}>
            <TouchableOpacity onPress={handleCancelEdit} style={styles.editButton}>
              <Text style={styles.editButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSaveEdit} style={[styles.editButton, styles.saveButton]}>
              <Text style={[styles.editButtonText, styles.saveButtonText]}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.commentContentContainer}>
          <Text style={styles.commentContent}>{comment.content}</Text>
        </View>
      )}

      {/* Enhanced Comment Footer */}
      <View style={styles.commentFooter}>
        <View style={styles.reactionContainer}>
          <TouchableOpacity
            style={[styles.reactionButton, userReactions.liked && styles.reactionButtonActive]}
            onPress={() => onReaction('like')}
          >
            <Ionicons 
              name={userReactions.liked ? "heart" : "heart-outline"} 
              size={18} 
              color={userReactions.liked ? "#E74C3C" : "#7F8C8D"} 
            />
            <Text style={[styles.reactionText, userReactions.liked && styles.reactionTextActive]}>
              {reactions.likes > 0 ? reactions.likes : ''}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.reactionButton, userReactions.loved && styles.reactionButtonActive]}
            onPress={() => onReaction('love')}
          >
            <Ionicons 
              name={userReactions.loved ? "heart" : "heart-outline"} 
              size={18} 
              color={userReactions.loved ? "#E91E63" : "#7F8C8D"} 
            />
            <Text style={[styles.reactionText, userReactions.loved && styles.reactionTextActive]}>
              {reactions.loves > 0 ? reactions.loves : ''}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.reactionButton}
            onPress={onShowReactionPicker}
          >
            <Ionicons name="add-circle-outline" size={18} color="#7F8C8D" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={onReply} style={styles.replyButton}>
          <Ionicons name="chatbubble-outline" size={18} color="#4F2780" />
          <Text style={styles.replyButtonText}>Reply</Text>
        </TouchableOpacity>
      </View>

      {/* Enhanced Reaction Picker */}
      {showReactionPicker && (
        <View style={styles.reactionPicker}>
          <TouchableOpacity
            style={styles.pickerReaction}
            onPress={() => {
              onReaction('like');
              onShowReactionPicker();
            }}
          >
            <Ionicons name="heart-outline" size={20} color="#E74C3C" />
            <Text style={styles.pickerText}>Like</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.pickerReaction}
            onPress={() => {
              onReaction('love');
              onShowReactionPicker();
            }}
          >
            <Ionicons name="heart" size={20} color="#E91E63" />
            <Text style={styles.pickerText}>Love</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const ForumPage = ({ navigation }) => {
  const [user, loading, error] = useAuthState(auth);
  const [posts, setPosts] = useState([]);
  const [usersMap, setUsersMap] = useState({}); // { uid: {displayName, ...} }
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [interactions, setInteractions] = useState({}); // Track user interactions
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState({}); // { postId: [comments] }
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [commentReactions, setCommentReactions] = useState({}); // { commentId: { likes: number, loves: number } }
  const [userReactions, setUserReactions] = useState({}); // { commentId: { liked: boolean, loved: boolean } }
  const [showReactionPicker, setShowReactionPicker] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'forumPosts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const fetchedPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setPosts(fetchedPosts);

      // Extract unique userIds from posts
      const userIds = [...new Set(fetchedPosts.map(post => post.userId))].filter(Boolean);

      // Fetch users data for UIDs not yet fetched
      const usersToFetch = userIds.filter(uid => !usersMap[uid]);
      if (usersToFetch.length > 0) {
        const newUsersMap = { ...usersMap };
        await Promise.all(usersToFetch.map(async (uid) => {
          const userDoc = await getDoc(doc(db, 'users', uid));
          if (userDoc.exists()) {
            newUsersMap[uid] = userDoc.data();
          } else {
            newUsersMap[uid] = { displayName: 'Unknown User' };
          }
        }));
        setUsersMap(newUsersMap);
      }

      setLoadingPosts(false);
    });

    return () => unsubscribe();
  }, []);

  // Set up real-time listener for comments
  useEffect(() => {
    if (!selectedPost) return;

    const commentsQuery = query(
      collection(db, 'comments'),
      where('postId', '==', selectedPost.id),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
      const postComments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      setComments(prev => ({
        ...prev,
        [selectedPost.id]: postComments
      }));

      // Fetch reactions for each comment
      fetchCommentReactions(postComments.map(comment => comment.id));
    });

    return () => unsubscribe();
  }, [selectedPost]);

  // Fetch comments for a specific post (legacy function for initial load)
  const fetchComments = async (postId) => {
    try {
      const commentsQuery = query(
        collection(db, 'comments'),
        where('postId', '==', postId),
        orderBy('createdAt', 'asc')
      );
      const commentsSnapshot = await getDocs(commentsQuery);
      const postComments = commentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      setComments(prev => ({
        ...prev,
        [postId]: postComments
      }));

      // Fetch reactions for each comment
      fetchCommentReactions(postComments.map(comment => comment.id));
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  // Fetch reactions for comments
  const fetchCommentReactions = async (commentIds) => {
    try {
      const reactions = {};
      const userReactions = {};
      
      for (const commentId of commentIds) {
        const reactionsQuery = query(
          collection(db, 'commentReactions'),
          where('commentId', '==', commentId)
        );
        const reactionsSnapshot = await getDocs(reactionsQuery);
        
        let likes = 0;
        let loves = 0;
        let userLiked = false;
        let userLoved = false;
        
        reactionsSnapshot.docs.forEach(doc => {
          const reaction = doc.data();
          if (reaction.type === 'like') {
            likes++;
            if (reaction.userId === user?.uid) userLiked = true;
          } else if (reaction.type === 'love') {
            loves++;
            if (reaction.userId === user?.uid) userLoved = true;
          }
        });
        
        reactions[commentId] = { likes, loves };
        userReactions[commentId] = { liked: userLiked, loved: userLoved };
      }
      
      setCommentReactions(prev => ({ ...prev, ...reactions }));
      setUserReactions(prev => ({ ...prev, ...userReactions }));
    } catch (error) {
      console.error('Error fetching comment reactions:', error);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // The onSnapshot will automatically refresh the data
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Handle Discuss functionality - Open comment modal
  const handleDiscuss = (post) => {
    setSelectedPost(post);
    setCommentModalVisible(true);
    fetchComments(post.id);
  };

  // Handle Support functionality
  const handleSupport = async (post) => {
    try {
      const postRef = doc(db, 'forumPosts', post.id);
      await updateDoc(postRef, {
        supportCount: increment(1)
      });
      
      // Update local state
      setInteractions(prev => ({
        ...prev,
        [post.id]: {
          ...prev[post.id],
          supported: true,
          supportCount: (prev[post.id]?.supportCount || 0) + 1
        }
      }));

      Alert.alert('Thank you!', 'Your support has been recorded. 💙');
    } catch (error) {
      console.error('Error supporting post:', error);
      Alert.alert('Error', 'Failed to support this post. Please try again.');
    }
  };

  // Handle adding a comment
  const handleAddComment = async () => {
    if (!commentText.trim() || !user || !selectedPost) return;

    try {
      const commentData = {
        postId: selectedPost.id,
        userId: user.uid,
        userEmail: user.email,
        content: commentText.trim(),
        createdAt: new Date(),
        authorName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        parentCommentId: replyingTo?.id || null,
        isReply: !!replyingTo
      };

      const docRef = await addDoc(collection(db, 'comments'), commentData);
      
      // Update local comments state
      const newComment = {
        id: docRef.id,
        ...commentData
      };
      
      setComments(prev => ({
        ...prev,
        [selectedPost.id]: [...(prev[selectedPost.id] || []), newComment]
      }));

      setCommentText('');
      setReplyingTo(null);
      Alert.alert('Success!', 'Your comment has been added! 💬');
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment. Please try again.');
    }
  };

  // Handle editing a comment
  const handleEditComment = async (commentId, newContent) => {
    if (!newContent.trim() || !user) return;

    try {
      const commentRef = doc(db, 'comments', commentId);
      await updateDoc(commentRef, {
        content: newContent.trim(),
        editedAt: new Date()
      });

      // Update local state
      setComments(prev => ({
        ...prev,
        [selectedPost.id]: prev[selectedPost.id].map(comment => 
          comment.id === commentId 
            ? { ...comment, content: newContent.trim(), editedAt: new Date() }
            : comment
        )
      }));

      setEditingComment(null);
      Alert.alert('Success!', 'Comment updated! ✏️');
    } catch (error) {
      console.error('Error editing comment:', error);
      Alert.alert('Error', 'Failed to edit comment. Please try again.');
    }
  };

  // Handle deleting a comment
  const handleDeleteComment = async (commentId) => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'comments', commentId));
              
              // Update local state
              setComments(prev => ({
                ...prev,
                [selectedPost.id]: prev[selectedPost.id].filter(comment => comment.id !== commentId)
              }));

              Alert.alert('Deleted!', 'Comment has been removed. 🗑️');
            } catch (error) {
              console.error('Error deleting comment:', error);
              Alert.alert('Error', 'Failed to delete comment. Please try again.');
            }
          }
        }
      ]
    );
  };

  // Handle comment reactions
  const handleCommentReaction = async (commentId, reactionType) => {
    if (!user) return;

    try {
      const existingReactionQuery = query(
        collection(db, 'commentReactions'),
        where('commentId', '==', commentId),
        where('userId', '==', user.uid),
        where('type', '==', reactionType)
      );
      const existingReactionSnapshot = await getDocs(existingReactionQuery);
      
      if (existingReactionSnapshot.empty) {
        // Add reaction
        await addDoc(collection(db, 'commentReactions'), {
          commentId,
          userId: user.uid,
          type: reactionType,
          createdAt: new Date()
        });

        // Update local state
        setCommentReactions(prev => ({
          ...prev,
          [commentId]: {
            ...prev[commentId],
            [reactionType + 's']: (prev[commentId]?.[reactionType + 's'] || 0) + 1
          }
        }));

        setUserReactions(prev => ({
          ...prev,
          [commentId]: {
            ...prev[commentId],
            [reactionType + 'd']: true
          }
        }));
      } else {
        // Remove reaction
        const reactionDoc = existingReactionSnapshot.docs[0];
        await deleteDoc(reactionDoc.ref);

        // Update local state
        setCommentReactions(prev => ({
          ...prev,
          [commentId]: {
            ...prev[commentId],
            [reactionType + 's']: Math.max((prev[commentId]?.[reactionType + 's'] || 1) - 1, 0)
          }
        }));

        setUserReactions(prev => ({
          ...prev,
          [commentId]: {
            ...prev[commentId],
            [reactionType + 'd']: false
          }
        }));
      }
    } catch (error) {
      console.error('Error handling comment reaction:', error);
    }
  };

  const renderItem = ({ item, index }) => {
    const postUser = usersMap[item.userId];
    const authorName = postUser?.displayName || 'Unknown User';
    const timeAgo = formatDate(item.createdAt);
    const postInteractions = interactions[item.id] || {};
    const supportCount = postInteractions.supportCount || item.supportCount || 0;
    const isSupported = postInteractions.supported || false;
    const commentCount = comments[item.id]?.length || 0;

    return (
      <View style={styles.postContainer}>
      <TouchableOpacity
        onPress={() => navigation.navigate('PostDetail', { post: item })}
          activeOpacity={0.7}
        >
          <View style={styles.postHeader}>
            <View style={styles.authorInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {authorName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.authorDetails}>
                <Text style={styles.authorName}>{authorName}</Text>
                <Text style={styles.postTime}>{timeAgo}</Text>
              </View>
            </View>
            <View style={styles.postNumber}>
              <Text style={styles.postNumberText}>#{index + 1}</Text>
            </View>
          </View>
          
        <Text style={styles.postTitle}>{item.title}</Text>
          <Text style={styles.postPreview} numberOfLines={3}>
          {item.content}
        </Text>
      </TouchableOpacity>
        
        <View style={styles.postFooter}>
          <TouchableOpacity 
            style={styles.postStats}
            onPress={() => handleDiscuss(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="chatbubble-outline" size={16} color="#4F2780" />
            <Text style={[styles.statText, { color: '#4F2780' }]}>
              {commentCount > 0 ? `${commentCount} ` : ''}Discuss
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.postStats, isSupported && styles.postStatsActive]}
            onPress={() => handleSupport(item)}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={isSupported ? "heart" : "heart-outline"} 
              size={16} 
              color={isSupported ? "#E74C3C" : "#4F2780"} 
            />
            <Text style={[styles.statText, { color: isSupported ? "#E74C3C" : "#4F2780" }]}>
              {supportCount > 0 ? `${supportCount} ` : ''}Support
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loadingPosts) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F2780" />
        <Text style={styles.loadingText}>Loading community posts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>💬 Community Forum</Text>
            <Text style={styles.subtitle}>Share and connect with others</Text>
          </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('CreatePost')}
        >
            <Ionicons name="add-circle" size={24} color="#fff" />
            <Text style={styles.addButtonText}>New Post</Text>
        </TouchableOpacity>
        </View>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Ionicons name="people" size={20} color="#4F2780" />
          <Text style={styles.statText}>{posts.length} Posts</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="time" size={20} color="#4F2780" />
          <Text style={styles.statText}>Live Updates</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="chatbubbles" size={20} color="#4F2780" />
          <Text style={styles.statText}>Active</Text>
        </View>
      </View>

      {/* Posts List */}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        style={styles.flatListContainer}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color="#BDC3C7" />
            <Text style={styles.emptyTitle}>No posts yet</Text>
            <Text style={styles.emptySubtext}>Be the first to start a conversation!</Text>
            <TouchableOpacity
              style={styles.createFirstPostButton}
              onPress={() => navigation.navigate('CreatePost')}
            >
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.createFirstPostText}>Create First Post</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Enhanced Comment Modal */}
      <Modal
        visible={commentModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setCommentModalVisible(false);
          setReplyingTo(null);
          setEditingComment(null);
          setCommentText('');
        }}
      >
        <View style={styles.modalContainer}>
          {/* Enhanced Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                setCommentModalVisible(false);
                setReplyingTo(null);
                setEditingComment(null);
                setCommentText('');
              }}
              style={styles.modalCloseButton}
            >
              <Ionicons name="arrow-back" size={24} color="#2C3E50" />
            </TouchableOpacity>
            <View style={styles.modalTitleContainer}>
              <Text style={styles.modalTitle}>💬 Discussion</Text>
              <Text style={styles.modalSubtitle}>
                {comments[selectedPost?.id]?.length || 0} comments
              </Text>
            </View>
            <TouchableOpacity style={styles.modalMenuButton}>
              <Ionicons name="ellipsis-horizontal" size={24} color="#2C3E50" />
            </TouchableOpacity>
          </View>

          {/* Enhanced Post Preview */}
          {selectedPost && (
            <View style={styles.selectedPostContainer}>
              <View style={styles.postPreviewHeader}>
                <View style={styles.postPreviewAvatar}>
                  <Text style={styles.postPreviewAvatarText}>
                    {usersMap[selectedPost.userId]?.displayName?.charAt(0) || 'U'}
                  </Text>
                </View>
                <View style={styles.postPreviewInfo}>
                  <Text style={styles.postPreviewAuthor}>
                    {usersMap[selectedPost.userId]?.displayName || 'Unknown User'}
                  </Text>
                  <Text style={styles.postPreviewTime}>
                    {formatDate(selectedPost.createdAt)}
                  </Text>
                </View>
              </View>
              <Text style={styles.selectedPostTitle}>{selectedPost.title}</Text>
              <Text style={styles.selectedPostContent} numberOfLines={3}>
                {selectedPost.content}
              </Text>
            </View>
          )}

          {/* Enhanced Comments Section */}
          <View style={styles.commentsContainer}>
            <View style={styles.commentsHeader}>
              <Text style={styles.commentsTitle}>
                💬 Comments ({comments[selectedPost?.id]?.length || 0})
              </Text>
              <View style={styles.commentsStats}>
                <View style={styles.statItem}>
                  <Ionicons name="heart" size={14} color="#E74C3C" />
                  <Text style={styles.statText}>
                    {Object.values(commentReactions).reduce((sum, reactions) => sum + (reactions.likes || 0), 0)}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="heart" size={14} color="#E91E63" />
                  <Text style={styles.statText}>
                    {Object.values(commentReactions).reduce((sum, reactions) => sum + (reactions.loves || 0), 0)}
                  </Text>
                </View>
              </View>
            </View>
            
            <FlatList
              data={comments[selectedPost?.id] || []}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <CommentItem
                  comment={item}
                  user={user}
                  reactions={commentReactions[item.id] || { likes: 0, loves: 0 }}
                  userReactions={userReactions[item.id] || { liked: false, loved: false }}
                  onReaction={(reactionType) => handleCommentReaction(item.id, reactionType)}
                  onReply={() => setReplyingTo(item)}
                  onEdit={() => setEditingComment(item)}
                  onDelete={() => handleDeleteComment(item.id)}
                  onShowReactionPicker={() => setShowReactionPicker(showReactionPicker === item.id ? null : item.id)}
                  showReactionPicker={showReactionPicker === item.id}
                  formatDate={formatDate}
                />
              )}
              style={styles.commentsList}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.commentsContent}
            />
          </View>

          {/* Enhanced Input Area */}
          <View style={styles.commentInputContainer}>
            {replyingTo && (
              <View style={styles.replyIndicator}>
                <View style={styles.replyInfo}>
                  <Ionicons name="return-up-forward" size={16} color="#4F2780" />
                  <Text style={styles.replyText}>
                    Replying to {replyingTo.authorName}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setReplyingTo(null)} style={styles.replyClose}>
                  <Ionicons name="close" size={16} color="#7F8C8D" />
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.commentInput}
                placeholder={replyingTo ? `Reply to ${replyingTo.authorName}...` : "Share your thoughts..."}
                value={commentText}
                onChangeText={setCommentText}
                multiline
                maxLength={500}
                placeholderTextColor="#9CA3AF"
              />
              <View style={styles.inputActions}>
                <Text style={styles.characterCount}>
                  {commentText.length}/500
                </Text>
                <TouchableOpacity
                  style={[
                    styles.commentButton,
                    (!commentText.trim() || !user) && styles.commentButtonDisabled
                  ]}
                  onPress={handleAddComment}
                  disabled={!commentText.trim() || !user}
                >
                  <Ionicons name="send" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default withGradient(ForumPage);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  flatListContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  header: {
    backgroundColor: 'rgba(79, 39, 128, 0.9)',
    paddingTop: 10,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 25,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 20,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    marginBottom: 0,
  },
  addButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    marginLeft: 16,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 25,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4F2780',
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 100,
    flexGrow: 1,
  },
  postContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#4F2780',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4F2780',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  authorDetails: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 2,
  },
  postTime: {
    fontSize: 12,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  postNumber: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  postNumberText: {
    fontSize: 12,
    color: '#4F2780',
    fontWeight: '600',
  },
  postTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 12,
    lineHeight: 26,
  },
  postPreview: {
    fontSize: 16,
    color: '#34495E',
    lineHeight: 22,
    marginBottom: 16,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
  },
  postStatsActive: {
    backgroundColor: '#FFE8E8',
  },
  statText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    color: '#2C3E50',
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  createFirstPostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F2780',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  createFirstPostText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  // Enhanced Comment Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    backgroundColor: '#F8F9FA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modalCloseButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F1F3F4',
  },
  modalTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C3E50',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 2,
  },
  modalMenuButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F1F3F4',
  },
  selectedPostContainer: {
    backgroundColor: '#F8F9FA',
    padding: 20,
    margin: 16,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4F2780',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  postPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  postPreviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4F2780',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  postPreviewAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  postPreviewInfo: {
    flex: 1,
  },
  postPreviewAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
  },
  postPreviewTime: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 2,
  },
  selectedPostTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 8,
    lineHeight: 24,
  },
  selectedPostContent: {
    fontSize: 15,
    color: '#5A6C7D',
    lineHeight: 22,
  },
  commentsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  commentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
  },
  commentsStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  statText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  commentsList: {
    flex: 1,
  },
  commentsContent: {
    paddingBottom: 20,
  },
  commentItem: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4F2780',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  commentAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  commentAuthorInfo: {
    flex: 1,
  },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentAuthorName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2C3E50',
  },
  ownerBadge: {
    backgroundColor: '#4F2780',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  ownerBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  commentTime: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  editedIndicator: {
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  commentContentContainer: {
    marginBottom: 8,
  },
  commentContent: {
    fontSize: 15,
    color: '#2C3E50',
    lineHeight: 22,
  },
  commentInputContainer: {
    backgroundColor: '#F8F9FA',
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    paddingBottom: 20,
  },
  inputWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  commentInput: {
    borderWidth: 2,
    borderColor: '#E9ECEF',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 15,
    backgroundColor: '#fff',
    minHeight: 50,
    maxHeight: 120,
    textAlignVertical: 'top',
  },
  inputActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 4,
  },
  characterCount: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  commentButton: {
    backgroundColor: '#4F2780',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4F2780',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  commentButtonDisabled: {
    backgroundColor: '#BDC3C7',
    shadowOpacity: 0,
    elevation: 0,
  },
  // Enhanced Comment Styles
  replyComment: {
    marginLeft: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#4F2780',
    paddingLeft: 12,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  editContainer: {
    marginTop: 8,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 8,
    backgroundColor: '#F8F9FA',
  },
  saveButton: {
    backgroundColor: '#4F2780',
  },
  editButtonText: {
    fontSize: 14,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  saveButtonText: {
    color: '#fff',
  },
  commentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F3F4',
  },
  reactionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  reactionButtonActive: {
    backgroundColor: '#FFE8E8',
  },
  reactionText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  reactionTextActive: {
    color: '#E74C3C',
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  replyButtonText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  reactionPicker: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 8,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pickerReaction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 4,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
  },
  pickerText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#2C3E50',
    fontWeight: '500',
  },
  replyIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4F2780',
  },
  replyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  replyText: {
    fontSize: 13,
    color: '#1976D2',
    fontWeight: '600',
    marginLeft: 8,
  },
  replyClose: {
    padding: 4,
  },
});
