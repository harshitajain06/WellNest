// src/screens/DailyReflection.jsx
import { Ionicons } from '@expo/vector-icons';
import { addDoc, collection, deleteDoc, doc, getDocs, limit, orderBy, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Alert, Dimensions, FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import withGradient from '../../components/withGradient';
import { auth, db } from '../../config/firebase';

const { width } = Dimensions.get('window');

const DailyReflection = ({ navigation }) => {
  const [user, loading, error] = useAuthState(auth);
  const [responses, setResponses] = useState({});
  const [reflections, setReflections] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Enhanced reflection questions with categories
  const questions = [
    {
      id: 'best',
      text: 'What was the best part of your day?',
      category: 'Gratitude',
      icon: 'sunny',
      color: '#FFD700'
    },
    {
      id: 'challenge',
      text: 'What challenged you today?',
      category: 'Growth',
      icon: 'trending-up',
      color: '#FF6B6B'
    },
    {
      id: 'learn',
      text: 'What did you learn today?',
      category: 'Learning',
      icon: 'book',
      color: '#4ECDC4'
    },
    {
      id: 'grateful',
      text: 'What are you grateful for today?',
      category: 'Appreciation',
      icon: 'heart',
      color: '#45B7D1'
    },
    {
      id: 'improve',
      text: 'What could you have done better?',
      category: 'Reflection',
      icon: 'bulb',
      color: '#96CEB4'
    },
  ];

  // Fetch reflections from Firebase with ordering
  const fetchReflections = async () => {
    if (user) {
      try {
        setIsLoading(true);
        const q = query(
          collection(db, 'reflections'),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
        const querySnapshot = await getDocs(q);
        const userReflections = querySnapshot.docs
          .filter(doc => doc.data().userId === user.uid)
          .map(doc => ({ id: doc.id, ...doc.data() }));
        setReflections(userReflections);
      } catch (err) {
        console.error('Error fetching reflections: ', err);
        Alert.alert('Error', 'Failed to load reflections.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchReflections();
  }, [user]);

  const addReflection = async () => {
    // Ensure all questions are answered
    const answeredQuestions = questions.filter(q => responses[q.id] && responses[q.id].trim());
    if (answeredQuestions.length !== questions.length) {
      Alert.alert('Validation Error', 'Please answer all the questions to complete your reflection.');
      return;
    }

    try {
      setIsLoading(true);
      await addDoc(collection(db, 'reflections'), {
        userId: user.uid,
        responses: responses,
        createdAt: new Date(),
        completedAt: new Date().toISOString(),
      });
      Alert.alert('Success', 'Your daily reflection has been saved! 🌟');
      setResponses({}); // Clear responses
      fetchReflections(); // Refresh the list
    } catch (err) {
      console.error('Error adding reflection: ', err);
      Alert.alert('Error', 'Failed to save reflection. Please try again.');
    } finally {
      setIsLoading(false);
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

  const handleResponseChange = (questionId, value) => {
    setResponses((prev) => ({ ...prev, [questionId]: value }));
  };

  // Calculate progress
  const getProgress = () => {
    const answeredCount = questions.filter(q => responses[q.id] && responses[q.id].trim()).length;
    return (answeredCount / questions.length) * 100;
  };

  // Get completion status
  const getCompletionStatus = () => {
    const progress = getProgress();
    if (progress === 0) return { text: 'Start your reflection', color: '#95A5A6' };
    if (progress < 100) return { text: `${Math.round(progress)}% complete`, color: '#F39C12' };
    return { text: 'Ready to save!', color: '#27AE60' };
  };

  const renderReflectionItem = ({ item }) => {
    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    return (
      <View style={styles.reflectionItem}>
        <View style={styles.reflectionHeader}>
          <Text style={styles.reflectionDate}>{formatDate(item.createdAt)}</Text>
          <TouchableOpacity onPress={() => deleteReflection(item.id)} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={20} color="#FF5733" />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.reflectionContent}>
          {questions.map((question, index) => (
            <View key={index} style={styles.questionAnswerContainer}>
              <View style={styles.questionHeader}>
                <Ionicons name={question.icon} size={16} color={question.color} />
                <Text style={styles.questionCategory}>{question.category}</Text>
              </View>
              <Text style={styles.questionText}>{question.text}</Text>
              <Text style={styles.answerText}>{item.responses[question.id] || 'No response'}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#2C3E50" />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Daily Reflection</Text>
          <Text style={styles.subtitle}>Reflect on your day and grow</Text>
        </View>
        <TouchableOpacity onPress={() => setIsModalVisible(true)} style={styles.historyButton}>
          <Ionicons name="time-outline" size={24} color="#007BFF" />
          <Text style={styles.historyText}>History</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${getProgress()}%` }]} />
        </View>
        <Text style={[styles.progressText, { color: getCompletionStatus().color }]}>
          {getCompletionStatus().text}
        </Text>
      </View>

      {/* Reflection Questions */}
      <ScrollView style={styles.questionsContainer} showsVerticalScrollIndicator={false}>
        {questions.map((question, index) => (
          <View key={index} style={styles.questionContainer}>
            <View style={styles.questionHeader}>
              <View style={[styles.questionIcon, { backgroundColor: question.color + '20' }]}>
                <Ionicons name={question.icon} size={20} color={question.color} />
              </View>
              <View style={styles.questionInfo}>
                <Text style={styles.questionCategory}>{question.category}</Text>
                <Text style={styles.questionText}>{question.text}</Text>
              </View>
            </View>
            <TextInput
              style={[
                styles.input,
                responses[question.id] && responses[question.id].trim() && styles.inputFilled
              ]}
              placeholder={`Share your thoughts about ${question.category.toLowerCase()}...`}
              value={responses[question.id] || ''}
              onChangeText={(text) => handleResponseChange(question.id, text)}
              multiline
              textAlignVertical="top"
            />
          </View>
        ))}
      </ScrollView>

      {/* Add Reflection Button */}
      <TouchableOpacity 
        onPress={addReflection} 
        style={[
          styles.button,
          getProgress() === 100 && styles.buttonReady,
          isLoading && styles.buttonLoading
        ]}
        disabled={isLoading || getProgress() !== 100}
      >
        <Ionicons 
          name={isLoading ? "hourglass-outline" : "checkmark-circle"} 
          size={20} 
          color="#fff" 
          style={styles.buttonIcon}
        />
        <Text style={styles.buttonText}>
          {isLoading ? 'Saving...' : 'Save Reflection'}
        </Text>
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
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reflection History</Text>
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            {reflections.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="journal-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>No reflections yet</Text>
                <Text style={styles.emptySubtext}>Start your first reflection above!</Text>
              </View>
            ) : (
              <FlatList
                data={reflections}
                keyExtractor={(item) => item.id}
                renderItem={renderReflectionItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.reflectionsList}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 25,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    marginTop: 4,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    color: '#2C3E50',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  historyText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#007BFF',
    fontWeight: '600',
  },
  progressContainer: {
    marginBottom: 25,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E9ECEF',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#27AE60',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  questionsContainer: {
    flex: 1,
    marginBottom: 20,
  },
  questionContainer: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  questionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  questionInfo: {
    flex: 1,
  },
  questionCategory: {
    fontSize: 12,
    color: '#7F8C8D',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  questionText: {
    fontSize: 16,
    color: '#2C3E50',
    fontWeight: '600',
    lineHeight: 22,
  },
  input: {
    minHeight: 100,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E9ECEF',
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    fontSize: 16,
    color: '#2C3E50',
    lineHeight: 22,
  },
  inputFilled: {
    borderColor: '#27AE60',
    backgroundColor: '#fff',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#95A5A6',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonReady: {
    backgroundColor: '#27AE60',
  },
  buttonLoading: {
    backgroundColor: '#F39C12',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  closeButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#7F8C8D',
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#BDC3C7',
    marginTop: 8,
  },
  reflectionsList: {
    paddingBottom: 20,
  },
  reflectionItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007BFF',
  },
  reflectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reflectionDate: {
    fontSize: 12,
    color: '#7F8C8D',
    fontWeight: '600',
  },
  deleteButton: {
    padding: 4,
  },
  reflectionContent: {
    maxHeight: 200,
  },
  questionAnswerContainer: {
    marginBottom: 12,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  questionCategory: {
    fontSize: 11,
    color: '#7F8C8D',
    fontWeight: '600',
    marginLeft: 6,
    textTransform: 'uppercase',
  },
  questionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 6,
  },
  answerText: {
    fontSize: 14,
    color: '#34495E',
    lineHeight: 20,
  },
});

export default withGradient(DailyReflection);
