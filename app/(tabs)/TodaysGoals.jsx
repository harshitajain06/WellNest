import { Ionicons } from '@expo/vector-icons';
import { addDoc, collection, deleteDoc, doc, getDocs } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Alert, Dimensions, FlatList, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import withGradient from '../../components/withGradient';
import { auth, db } from '../../config/firebase';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

const TodaysGoals = ({ navigation }) => {
  const [user, loading, error] = useAuthState(auth);
  const [goal, setGoal] = useState('');
  const [goals, setGoals] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Fetch goals from Firebase
  const fetchGoals = async () => {
    if (user) {
      try {
        const querySnapshot = await getDocs(collection(db, 'goals'));
        const userGoals = querySnapshot.docs
          .filter(doc => doc.data().userId === user.uid)
          .map(doc => ({ id: doc.id, ...doc.data() }));
        setGoals(userGoals);
      } catch (err) {
        console.error('Error fetching goals: ', err);
        Alert.alert('Error', 'Failed to load goals.');
      }
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [user]);

  const addGoal = async () => {
    if (!goal.trim()) {
      Alert.alert('Validation Error', 'Please enter a goal.');
      return;
    }

    try {
      await addDoc(collection(db, 'goals'), {
        userId: user.uid,
        goal: goal.trim(),
        createdAt: new Date(),
      });
      Alert.alert('Success', 'Goal added successfully.');
      setGoal('');
      fetchGoals(); // Refresh the list
    } catch (err) {
      console.error('Error adding goal: ', err);
      Alert.alert('Error', 'Failed to add goal.');
    }
  };

  const deleteGoal = async (id) => {
    try {
      await deleteDoc(doc(db, 'goals', id));
      Alert.alert('Success', 'Goal deleted successfully.');
      fetchGoals(); // Refresh the list
    } catch (err) {
      console.error('Error deleting goal: ', err);
      Alert.alert('Error', 'Failed to delete goal.');
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
            <Text style={styles.viewListText}>History ({goals.length})</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.title}>🎯 Today's Goals</Text>
        <Text style={styles.subtitle}>What do you want to achieve today?</Text>
      </View>

      {/* Input Section */}
      <View style={styles.inputSection}>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>🎯 What's your goal for today?</Text>
          <TextInput
            style={styles.input}
            placeholder="I want to..."
            value={goal}
            onChangeText={setGoal}
            multiline
            textAlignVertical="top"
          />
        </View>
        <TouchableOpacity onPress={addGoal} style={styles.addButton}>
          <Ionicons name="add-circle" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Add Goal</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Goals Preview */}
      {goals.length > 0 && (
        <View style={styles.previewSection}>
          <Text style={styles.previewTitle}>Recent Goals</Text>
          {goals.slice(0, 3).map((item, index) => (
            <View key={item.id} style={styles.previewItem}>
              <Text style={styles.previewNumber}>{index + 1}</Text>
              <Text style={styles.previewText}>{item.goal}</Text>
            </View>
          ))}
          {goals.length > 3 && (
            <TouchableOpacity 
              style={styles.viewMoreButton}
              onPress={() => setIsModalVisible(true)}
            >
              <Text style={styles.viewMoreText}>View all {goals.length} goals</Text>
              <Ionicons name="chevron-forward" size={16} color="#4F2780" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Modal for All Goals */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🎯 Your Goals</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setIsModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {goals.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="target-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No goals yet</Text>
                <Text style={styles.emptySubtext}>Start by adding a goal for today!</Text>
              </View>
            ) : (
              <FlatList
                data={goals}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => (
                  <View style={styles.goalItem}>
                    <View style={styles.goalContent}>
                      <Text style={styles.goalNumber}>{index + 1}</Text>
                      <Text style={styles.goalText}>{item.goal}</Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={() => deleteGoal(item.id)}
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
    backgroundColor: 'rgba(78, 205, 196, 0.9)',
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
    borderColor: 'rgba(78, 205, 196, 0.2)',
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
        borderColor: '#4ECDC4',
        boxShadow: '0 0 0 3px rgba(78, 205, 196, 0.1)',
      },
    }),
  },
  addButton: {
    backgroundColor: '#4ECDC4',
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
        backgroundColor: '#45B7B8',
        transform: 'translateY(-2px)',
        boxShadow: '0 6px 20px rgba(78, 205, 196, 0.3)',
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
    backgroundColor: '#4ECDC4',
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
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  goalContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalNumber: {
    backgroundColor: '#4ECDC4',
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
  goalText: {
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

export default withGradient(TodaysGoals);
