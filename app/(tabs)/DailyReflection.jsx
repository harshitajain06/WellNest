// src/screens/DailyReflection.jsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, FlatList, Modal } from 'react-native';
import { auth, db } from '../../config/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Ionicons } from '@expo/vector-icons';
import withGradient from '../../components/withGradient';

const DailyReflection = ({ navigation }) => {
  const [user, loading, error] = useAuthState(auth);
  const [responses, setResponses] = useState({});
  const [reflections, setReflections] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Reflection questions
  const questions = [
    'What was the best part of your day?',
    'What challenged you today?',
    'What did you learn today?',
    'What are you grateful for today?',
    'What could you have done better?',
  ];

  // Fetch reflections from Firebase
  const fetchReflections = async () => {
    if (user) {
      try {
        const querySnapshot = await getDocs(collection(db, 'reflections'));
        const userReflections = querySnapshot.docs
          .filter(doc => doc.data().userId === user.uid)
          .map(doc => ({ id: doc.id, ...doc.data() }));
        setReflections(userReflections);
      } catch (err) {
        console.error('Error fetching reflections: ', err);
        Alert.alert('Error', 'Failed to load reflections.');
      }
    }
  };

  useEffect(() => {
    fetchReflections();
  }, [user]);

  const addReflection = async () => {
    // Ensure all questions are answered
    if (Object.keys(responses).length !== questions.length) {
      Alert.alert('Validation Error', 'Please answer all the questions.');
      return;
    }

    try {
      await addDoc(collection(db, 'reflections'), {
        userId: user.uid,
        responses: responses,
        createdAt: new Date(),
      });
      Alert.alert('Success', 'Reflection added successfully.');
      setResponses({}); // Clear responses
      fetchReflections(); // Refresh the list
    } catch (err) {
      console.error('Error adding reflection: ', err);
      Alert.alert('Error', 'Failed to add reflection.');
    }
  };

  const deleteReflection = async (id) => {
    try {
      await deleteDoc(doc(db, 'reflections', id));
      Alert.alert('Success', 'Reflection deleted successfully.');
      fetchReflections(); // Refresh the list
    } catch (err) {
      console.error('Error deleting reflection: ', err);
      Alert.alert('Error', 'Failed to delete reflection.');
    }
  };

  const handleResponseChange = (question, value) => {
    setResponses((prev) => ({ ...prev, [question]: value }));
  };

  const renderReflectionItem = ({ item }) => {
    return (
      <View style={styles.reflectionItem}>
        <Text style={styles.reflectionItemText}>
          {questions.map((question, index) => (
            <View key={index} style={styles.questionAnswerContainer}>
              <Text style={styles.questionText}>{question}</Text>
              <Text style={styles.answerText}>{item.responses[question] || 'No response'}</Text>
            </View>
          ))}
        </Text>
        <TouchableOpacity onPress={() => deleteReflection(item.id)} style={styles.deleteButton}>
          <Ionicons name="trash" size={24} color="#FF5733" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Daily Reflection</Text>
        <TouchableOpacity onPress={() => setIsModalVisible(true)}>
          <Ionicons name="list-outline" size={30} color="#007BFF" style={styles.icon} />
        </TouchableOpacity>
      </View>

      {/* Reflection Questions */}
      {questions.map((question, index) => (
        <View key={index} style={styles.questionContainer}>
          <Text style={styles.questionText}>{question}</Text>
          <TextInput
            style={styles.input}
            placeholder="Your response"
            value={responses[question] || ''}
            onChangeText={(text) => handleResponseChange(question, text)}
          />
        </View>
      ))}

      {/* Add Reflection Button */}
      <TouchableOpacity onPress={addReflection} style={styles.button}>
        <Text style={styles.buttonText}>Add Reflection</Text>
      </TouchableOpacity>

      {/* Modal for All Reflections */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>All Reflections</Text>
            <FlatList
              data={reflections}
              keyExtractor={(item) => item.id}
              renderItem={renderReflectionItem}
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
  questionContainer: {
    marginBottom: 20,
    width: '100%',
  },
  questionText: {
    fontSize: 16,
    color: '#567396',
    marginBottom: 5,
  },
  input: {
    width: '100%',
    padding: 15,
    borderWidth: 1,
    borderColor: '#567396',
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#28a745',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    width: '100%',
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
  reflectionItem: {
    marginBottom: 20,
    width: '100%',
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#E1E8F0',
  },
  questionAnswerContainer: {
    marginBottom: 10,
  },
  questionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#567396',
  },
  answerText: {
    fontSize: 14,
    color: '#333',
    marginTop: 5,
  },
  deleteButton: {
    alignSelf: 'flex-end',
    marginTop: 10,
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

export default withGradient(DailyReflection);
