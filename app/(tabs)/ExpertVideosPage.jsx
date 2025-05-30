import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, Pressable } from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase'; // Adjust the import path
import WebView from 'react-native-webview'; // Install if not already installed\
import withGradient from '../../components/withGradient';

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
            <WebView
              source={{ uri: selectedVideoUrl }}
              style={{ flex: 1 }}
              allowsFullscreenVideo={true}
            />
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
});

export default withGradient(ExpertVideosPage);
