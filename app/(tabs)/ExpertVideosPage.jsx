import { collection, getDocs } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Modal, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import WebView from 'react-native-webview'; // For mobile platforms
import withGradient from '../../components/withGradient';
import { db } from '../../config/firebase'; // Adjust the import path

const ExpertVideosPage = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const videosCollection = collection(db, 'ExpertVideos'); // Adjust collection name if needed
        const videoSnapshot = await getDocs(videosCollection);
        const videoList = videoSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setVideos(videoList);
      } catch (error) {
        console.error('Error fetching videos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  const openVideo = (url) => {
    setSelectedVideoUrl(url);
    setModalVisible(true);
  };

  const closeModal = () => {
    setSelectedVideoUrl(null);
    setModalVisible(false);
  };

  // Function to convert YouTube URL to embed format
  const getEmbedUrl = (url) => {
    if (!url) return '';
    
    // Check if it's already an embed URL
    if (url.includes('embed')) return url;
    
    // Extract video ID from various YouTube URL formats
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    
    // If it's not a YouTube URL, return as is (for other video platforms)
    return url;
  };

  const renderVideoItem = ({ item }) => (
    <TouchableOpacity style={styles.videoContainer} onPress={() => openVideo(item.videoUrl)}>
      <Image source={{ uri: item.thumbnailUrl }} style={styles.thumbnail} />
      <Text style={styles.videoTitle}>{item.title}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return <ActivityIndicator size="large" color="#4CAF50" style={styles.loader} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>Expert Videos</Text>
      <FlatList
        data={videos}
        keyExtractor={item => item.id}
        renderItem={renderVideoItem}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
      />

      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          {selectedVideoUrl && (
            <>
              {Platform.OS === 'web' ? (
                <iframe
                  src={getEmbedUrl(selectedVideoUrl)}
                  style={styles.webVideo}
                  allowFullScreen
                  title="Expert Video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              ) : (
                <WebView
                  source={{ uri: selectedVideoUrl }}
                  style={{ flex: 1 }}
                  allowsFullscreenVideo={true}
                />
              )}
            </>
          )}
          <Pressable style={styles.closeButton} onPress={closeModal}>
            <Text style={styles.closeButtonText}>Close</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#567396',
    marginTop: 50,
  },
  listContainer: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  videoContainer: {
    flex: 1,
    margin: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    alignItems: 'center',
  },
  thumbnail: {
    width: '100%',
    height: 150,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  videoTitle: {
    padding: 10,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#424242',
    textAlign: 'center',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000', // Dark background for modal
  },
  closeButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  webVideo: {
    width: '100%',
    height: '100%',
    border: 'none',
    borderRadius: '8px',
  },
});

export default withGradient(ExpertVideosPage);
