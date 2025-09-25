// src/navigation/ABCDEMethod.jsx
import { Ionicons } from '@expo/vector-icons';
import { addDoc, collection, deleteDoc, doc, getDocs, limit, orderBy, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Alert, Dimensions, FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import withGradient from '../../components/withGradient';
import { auth, db } from '../../config/firebase';

const { width } = Dimensions.get('window');

const ABCDEMethod = ({ navigation }) => {
  const [user, loading, error] = useAuthState(auth);
  const [abcde, setAbcde] = useState({ a: '', b: '', c: '', d: '', e: '' });
  const [savedABCDE, setSavedABCDE] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  // ABCDE Method definitions with detailed explanations
  const abcdeDefinitions = [
    {
      letter: 'A',
      title: 'Activating Event',
      description: 'The situation or event that triggered your emotional response',
      icon: 'flash',
      color: '#E74C3C',
      example: 'Example: "My boss criticized my work in front of the team"',
      prompt: 'What happened? Describe the specific event or situation.'
    },
    {
      letter: 'B',
      title: 'Beliefs',
      description: 'Your thoughts, interpretations, and beliefs about the event',
      icon: 'brain',
      color: '#F39C12',
      example: 'Example: "I\'m not good enough. Everyone thinks I\'m incompetent."',
      prompt: 'What thoughts went through your mind? What did you tell yourself?'
    },
    {
      letter: 'C',
      title: 'Consequences',
      description: 'Your emotional and behavioral responses to the event',
      icon: 'heart',
      color: '#9B59B6',
      example: 'Example: "I felt angry, embarrassed, and wanted to quit my job"',
      prompt: 'How did you feel? What did you do? What were your emotions and actions?'
    },
    {
      letter: 'D',
      title: 'Disputation',
      description: 'Challenge your irrational beliefs with evidence and logic',
      icon: 'search',
      color: '#3498DB',
      example: 'Example: "Is this really true? What evidence do I have? What would I tell a friend?"',
      prompt: 'Question your beliefs. What evidence contradicts them? What\'s a more balanced view?'
    },
    {
      letter: 'E',
      title: 'New Effect',
      description: 'The healthier emotional and behavioral response you can choose',
      icon: 'checkmark-circle',
      color: '#27AE60',
      example: 'Example: "I can learn from this feedback and improve. I\'m still valuable."',
      prompt: 'How can you respond more constructively? What\'s a healthier perspective?'
    }
  ];

  const handleInputChange = (field, value) => {
    setAbcde({ ...abcde, [field]: value });
  };

  // Fetch saved ABCDE entries from Firebase with ordering
  const fetchABCDE = async () => {
    if (user) {
      try {
        setIsLoading(true);
        const q = query(
          collection(db, 'abcde'),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
        const querySnapshot = await getDocs(q);
        const userEntries = querySnapshot.docs
          .filter((doc) => doc.data().userId === user.uid)
          .map((doc) => ({ id: doc.id, ...doc.data() }));
        setSavedABCDE(userEntries);
      } catch (err) {
        console.error('Error fetching ABCDE entries: ', err);
        Alert.alert('Error', 'Failed to load ABCDE entries.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchABCDE();
  }, [user]);

  const saveABCDE = async () => {
    const { a, b, c, d, e } = abcde;

    if (!a || !b || !c || !d || !e) {
      Alert.alert('Validation Error', 'Please complete all five steps of the ABCDE method.');
      return;
    }

    try {
      setIsLoading(true);
      await addDoc(collection(db, 'abcde'), {
        userId: user.uid,
        abcde: { a, b, c, d, e },
        createdAt: new Date(),
        completedAt: new Date().toISOString(),
      });
      Alert.alert('Success', 'Your ABCDE analysis has been saved! 🎯');
      setAbcde({ a: '', b: '', c: '', d: '', e: '' });
      fetchABCDE(); // Refresh the list
    } catch (err) {
      console.error('Error saving ABCDE: ', err);
      Alert.alert('Error', 'Failed to save ABCDE analysis. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate completion progress
  const getProgress = () => {
    const completedSteps = Object.values(abcde).filter(value => value.trim()).length;
    return (completedSteps / 5) * 100;
  };

  // Get completion status
  const getCompletionStatus = () => {
    const progress = getProgress();
    if (progress === 0) return { text: 'Start your ABCDE analysis', color: '#95A5A6' };
    if (progress < 100) return { text: `${Math.round(progress)}% complete`, color: '#F39C12' };
    return { text: 'Ready to save!', color: '#27AE60' };
  };

  const deleteABCDE = async (id) => {
    try {
      await deleteDoc(doc(db, 'abcde', id));
      Alert.alert('Success', 'ABCDE entry deleted successfully.');
      fetchABCDE(); // Refresh the list
    } catch (err) {
      console.error('Error deleting ABCDE: ', err);
      Alert.alert('Error', 'Failed to delete ABCDE.');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#2C3E50" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>ABCDE Method</Text>
            <Text style={styles.subtitle}>Challenge negative thoughts rationally</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity onPress={() => setShowInfo(!showInfo)} style={styles.infoButton}>
              <Ionicons name="information-circle" size={24} color="#007BFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsModalVisible(true)} style={styles.historyButton}>
              <Ionicons name="time-outline" size={20} color="#007BFF" />
              <Text style={styles.historyText}>History</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Info Panel */}
        {showInfo && (
          <View style={styles.infoPanel}>
            <Text style={styles.infoTitle}>What is the ABCDE Method?</Text>
            <Text style={styles.infoText}>
              The ABCDE method is a cognitive behavioral technique that helps you challenge 
              irrational thoughts and develop healthier emotional responses. It's based on 
              Rational Emotive Behavior Therapy (REBT).
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stepsPreview}>
              {abcdeDefinitions.map((step, index) => (
                <View key={index} style={[styles.stepPreview, { borderLeftColor: step.color }]}>
                  <Text style={[styles.stepLetter, { color: step.color }]}>{step.letter}</Text>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${getProgress()}%` }]} />
          </View>
          <Text style={[styles.progressText, { color: getCompletionStatus().color }]}>
            {getCompletionStatus().text}
          </Text>
        </View>

        {/* ABCDE Steps */}
        <View style={styles.stepsContainer}>
          {abcdeDefinitions.map((step, index) => (
            <View key={index} style={styles.stepContainer}>
              <View style={styles.stepHeader}>
                <View style={[styles.stepIcon, { backgroundColor: step.color }]}>
                  <Ionicons name={step.icon} size={24} color="#fff" />
                </View>
                <View style={styles.stepInfo}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDescription}>{step.description}</Text>
                </View>
              </View>
              <Text style={styles.stepPrompt}>{step.prompt}</Text>
              <Text style={styles.stepExample}>{step.example}</Text>
              <TextInput
                style={[
                  styles.input,
                  abcde[step.letter.toLowerCase()] && styles.inputFilled
                ]}
                placeholder={`${step.letter}: ${step.title}...`}
                value={abcde[step.letter.toLowerCase()]}
                onChangeText={(value) => handleInputChange(step.letter.toLowerCase(), value)}
                multiline
                textAlignVertical="top"
              />
            </View>
          ))}
        </View>

        {/* Save Button */}
        <TouchableOpacity 
          onPress={saveABCDE} 
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
            {isLoading ? 'Saving...' : 'Save Analysis'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal for Showing Saved ABCDE Entries */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>ABCDE History</Text>
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            {savedABCDE.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="analytics-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>No analyses yet</Text>
                <Text style={styles.emptySubtext}>Complete your first ABCDE analysis above!</Text>
              </View>
            ) : (
              <FlatList
                data={savedABCDE}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.modalItem}>
                    <View style={styles.modalItemHeader}>
                      <Text style={styles.modalItemDate}>
                        {new Date(item.createdAt).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                      <TouchableOpacity onPress={() => deleteABCDE(item.id)}>
                        <Ionicons name="trash-outline" size={20} color="#FF5733" />
                      </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.modalItemContent}>
                      {abcdeDefinitions.map((step, index) => (
                        <View key={index} style={styles.modalStepItem}>
                          <View style={styles.modalStepHeader}>
                            <View style={[styles.modalStepIcon, { backgroundColor: step.color }]}>
                              <Text style={styles.modalStepLetter}>{step.letter}</Text>
                            </View>
                            <Text style={styles.modalStepTitle}>{step.title}</Text>
                          </View>
                          <Text style={styles.modalStepText}>{item.abcde[step.letter.toLowerCase()]}</Text>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalList}
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
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoButton: {
    padding: 8,
    marginRight: 8,
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
  infoPanel: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#424242',
    lineHeight: 20,
    marginBottom: 12,
  },
  stepsPreview: {
    marginTop: 8,
  },
  stepPreview: {
    backgroundColor: '#fff',
    padding: 12,
    marginRight: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    minWidth: 100,
  },
  stepLetter: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  stepTitle: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  progressContainer: {
    marginBottom: 20,
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
  stepsContainer: {
    marginBottom: 20,
  },
  stepContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepInfo: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 18,
    color: '#2C3E50',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#7F8C8D',
    lineHeight: 20,
  },
  stepPrompt: {
    fontSize: 16,
    color: '#2C3E50',
    fontWeight: '600',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  stepExample: {
    fontSize: 14,
    color: '#7F8C8D',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    fontStyle: 'italic',
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
  modalList: {
    paddingBottom: 20,
  },
  modalItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007BFF',
  },
  modalItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalItemDate: {
    fontSize: 12,
    color: '#7F8C8D',
    fontWeight: '600',
  },
  modalItemContent: {
    maxHeight: 200,
  },
  modalStepItem: {
    marginBottom: 12,
  },
  modalStepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalStepIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  modalStepLetter: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalStepTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
  },
  modalStepText: {
    fontSize: 14,
    color: '#34495E',
    lineHeight: 20,
    marginLeft: 32,
  },
});

export default withGradient(ABCDEMethod);
