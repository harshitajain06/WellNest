import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, FlatList, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Import Ionicons
import { auth, db } from '../../config/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import withGradient from '../../components/withGradient';

const TodaysGoals = () => {
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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Today's Goals</Text>
        <TouchableOpacity onPress={() => setIsModalVisible(true)}>
          <Ionicons name="list-outline" size={30} color="#007BFF" style={styles.icon} />
        </TouchableOpacity>
      </View>

      {/* Input Field */}
      <TextInput
        style={styles.input}
        placeholder="Enter your goal for today"
        value={goal}
        onChangeText={setGoal}
      />

      {/* Add Goal Button */}
      <TouchableOpacity onPress={addGoal} style={styles.button}>
        <Text style={styles.buttonText}>Add Goal</Text>
      </TouchableOpacity>

      {/* Modal for All Goals */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>All Goals</Text>
            <FlatList
              data={goals}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.modalItem}>
                  <Text style={styles.modalItemText}>{item.goal}</Text>
                  <TouchableOpacity onPress={() => deleteGoal(item.id)}>
                    <Ionicons name="trash" size={24} color="#FF5733" />
                  </TouchableOpacity>
                </View>
              )}
            />
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setIsModalVisible(false)}
            >
              <Text style={styles.closeModalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 30,
  },
  title: {
    fontSize: 28,
    color: '#567396',
    fontWeight: 'bold',
  },
  icon: {
    marginLeft: 'auto',
  },
  input: {
    width: '100%',
    padding: 15,
    borderWidth: 1,
    borderColor: '#A9C6E5',
    borderRadius: 10,
    marginBottom: 20,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#28a745',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    width: '100%',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#007BFF',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#E1E8F0',
    width: '100%',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
    flex: 1, // Ensures text takes available space
  },
  closeModalButton: {
    marginTop: 20,
    backgroundColor: '#FF5733',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  closeModalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default withGradient(TodaysGoals);
