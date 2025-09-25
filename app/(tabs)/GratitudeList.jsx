// src/navigation/GratitudeList.jsx
import { Ionicons } from '@expo/vector-icons';
import { addDoc, collection, deleteDoc, doc, getDocs } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Alert, Dimensions, FlatList, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import withGradient from '../../components/withGradient';
import { auth, db } from '../../config/firebase';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

const GratitudeList = ({ navigation }) => {
  const [user, loading, error] = useAuthState(auth);
  const [gratitude, setGratitude] = useState('');
  const [gratitudes, setGratitudes] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const fetchGratitudes = async () => {
    if (user) {
      try {
        const querySnapshot = await getDocs(collection(db, 'gratitude'));
        const userGratitudes = querySnapshot.docs
          .filter((doc) => doc.data().userId === user.uid)
          .map((doc) => ({ id: doc.id, ...doc.data() }));
        setGratitudes(userGratitudes);
      } catch (err) {
        console.error('Error fetching gratitudes: ', err);
        Alert.alert('Error', 'Failed to load gratitudes.');
      }
    }
  };

  useEffect(() => {
    fetchGratitudes();
  }, [user]);

  const addGratitude = async () => {
    if (!gratitude.trim()) {
      Alert.alert('Validation Error', 'Please enter your gratitude.');
      return;
    }

    try {
      const docRef = await addDoc(collection(db, 'gratitude'), {
        userId: user.uid,
        gratitude: gratitude.trim(),
        createdAt: new Date(),
      });
      setGratitudes((prev) => [...prev, { id: docRef.id, gratitude: gratitude.trim() }]);
      setGratitude('');
    } catch (err) {
      console.error('Error adding gratitude: ', err);
      Alert.alert('Error', 'Failed to add gratitude.');
    }
  };

  const deleteGratitude = async (id) => {
    try {
      await deleteDoc(doc(db, 'gratitude', id));
      setGratitudes((prev) => prev.filter((item) => item.id !== id));
      Alert.alert('Success', 'Gratitude deleted successfully.');
    } catch (err) {
      console.error('Error deleting gratitude: ', err);
      Alert.alert('Error', 'Failed to delete gratitude.');
    }
  };

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      {...(isWeb && {
        contentContainerStyle: styles.webScrollContent
      })}
    >
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.viewListButton}
            onPress={() => setIsModalVisible(true)}
          >
            <Ionicons name="time-outline" size={20} color="#fff" />
            <Text style={styles.viewListText}>History ({gratitudes.length})</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.title}>💝 Gratitude List</Text>
        <Text style={styles.subtitle}>What are you grateful for today?</Text>
      </View>

      {/* Input Section */}
      <View style={styles.inputSection}>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>✨ What are you grateful for?</Text>
          <TextInput
            style={styles.input}
            placeholder="I'm grateful for..."
            value={gratitude}
            onChangeText={setGratitude}
            multiline
            textAlignVertical="top"
          />
        </View>
        <TouchableOpacity onPress={addGratitude} style={styles.addButton}>
          <Ionicons name="add-circle" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Add Gratitude</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Gratitudes Preview */}
      {gratitudes.length > 0 && (
        <View style={styles.previewSection}>
          <Text style={styles.previewTitle}>Recent Gratitudes</Text>
          {gratitudes.slice(0, 3).map((item, index) => (
            <View key={item.id} style={styles.previewItem}>
              <Text style={styles.previewNumber}>{index + 1}</Text>
              <Text style={styles.previewText}>{item.gratitude}</Text>
            </View>
          ))}
          {gratitudes.length > 3 && (
            <TouchableOpacity 
              style={styles.viewMoreButton}
              onPress={() => setIsModalVisible(true)}
            >
              <Text style={styles.viewMoreText}>View all {gratitudes.length} gratitudes</Text>
              <Ionicons name="chevron-forward" size={16} color="#4F2780" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Modal for Showing Saved Gratitudes */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>💝 Your Gratitude List</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setIsModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {gratitudes.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="heart-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No gratitudes yet</Text>
                <Text style={styles.emptySubtext}>Start by adding something you're grateful for!</Text>
              </View>
            ) : (
              <FlatList
                data={gratitudes}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => (
                  <View style={styles.gratitudeItem}>
                    <View style={styles.gratitudeContent}>
                      <Text style={styles.gratitudeNumber}>{index + 1}</Text>
                      <Text style={styles.gratitudeText}>{item.gratitude}</Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={() => deleteGratitude(item.id)}
                    >
                      <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                    </TouchableOpacity>
                  </View>
                )}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Extra spacing for better scrolling */}
      <View style={styles.extraSpacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    ...(isWeb && {
      minHeight: '100vh',
      maxWidth: 1200,
      alignSelf: 'center',
      width: '100%',
    }),
  },
  webScrollContent: {
    minHeight: '100vh',
    paddingBottom: 40,
  },
  header: {
    backgroundColor: 'rgba(255, 107, 107, 0.9)',
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  title: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 0,
  },
  viewListButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  viewListText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  inputSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
    ...(isWeb && {
      maxWidth: 600,
      alignSelf: 'center',
      width: '100%',
    }),
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4F2780',
    marginBottom: 12,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    padding: 20,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 100,
    textAlignVertical: 'top',
    ...(isWeb && {
      outlineStyle: 'none',
      transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
      ':focus': {
        borderColor: '#FF6B6B',
        boxShadow: '0 0 0 3px rgba(255, 107, 107, 0.1)',
      },
    }),
  },
  addButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    ...(isWeb && {
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      ':hover': {
        backgroundColor: '#FF5252',
        transform: 'translateY(-2px)',
        boxShadow: '0 6px 20px rgba(255, 107, 107, 0.3)',
      },
    }),
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  previewSection: {
    paddingHorizontal: 20,
    ...(isWeb && {
      maxWidth: 600,
      alignSelf: 'center',
      width: '100%',
    }),
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4F2780',
    marginBottom: 16,
  },
  previewItem: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  previewNumber: {
    backgroundColor: '#FF6B6B',
    color: '#fff',
    width: 24,
    height: 24,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 24,
    marginRight: 12,
  },
  previewText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  viewMoreButton: {
    backgroundColor: 'rgba(79, 39, 128, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    ...(isWeb && {
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      ':hover': {
        backgroundColor: 'rgba(79, 39, 128, 0.2)',
      },
    }),
  },
  viewMoreText: {
    color: '#4F2780',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    width: '90%',
    maxWidth: 500,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 0,
    maxHeight: '80%',
    ...(isWeb && {
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4F2780',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  gratitudeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  gratitudeContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  gratitudeNumber: {
    backgroundColor: '#FF6B6B',
    color: '#fff',
    width: 28,
    height: 28,
    borderRadius: 14,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 28,
    marginRight: 12,
  },
  gratitudeText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#fff5f5',
  },
  extraSpacing: {
    height: 100,
    ...(isWeb && {
      height: 50,
    }),
  },
});

export default withGradient(GratitudeList);
