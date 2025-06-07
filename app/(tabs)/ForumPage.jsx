import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { collection, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { db } from '../../config/firebase'; // Adjust the path as necessary

export default function ForumPage() {
  const [posts, setPosts] = useState([]);
  const [usersMap, setUsersMap] = useState({}); // { uid: {displayName, ...} }
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

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

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const renderItem = ({ item }) => {
    const user = usersMap[item.userId];
    const authorName = user?.displayName || 'Unknown User';

    return (
      <TouchableOpacity
        style={styles.postContainer}
        onPress={() => navigation.navigate('PostDetail', { post: item })}
      >
        <Text style={styles.postTitle}>{item.title}</Text>
        <Text style={styles.authorName}>By {authorName}</Text>
        <Text style={styles.postPreview} numberOfLines={2}>
          {item.content}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <LinearGradient colors={['#4F2780', '#D3C5E5']} style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Forum</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('CreatePost')}
        >
          <Text style={styles.addButtonText}>+ New Post</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyText}>No posts yet</Text>}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    backgroundColor: '#6A3FB3',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  listContent: {
    paddingBottom: 20,
  },
  postContainer: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 3,
  },
  authorName: {
    fontSize: 12,
    color: '#ddd',
    fontStyle: 'italic',
    marginBottom: 5,
  },
  postPreview: {
    fontSize: 14,
    color: '#eee',
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
  },
});
