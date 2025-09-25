// src/screens/FreeJournaling.js
import { Ionicons } from '@expo/vector-icons';
import { addDoc, collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Alert, Dimensions, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import withGradient from '../../components/withGradient';
import { auth, db } from '../../config/firebase';

const { width } = Dimensions.get('window');

const FreeJournaling = ({ navigation }) => {
  const [user, loading, error] = useAuthState(auth);
  const [entry, setEntry] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recentEntries, setRecentEntries] = useState([]);
  const [showPrompts, setShowPrompts] = useState(false);

  // Journal prompts to inspire writing
  const prompts = [
    "What's on your mind right now?",
    "Describe a moment today that made you smile.",
    "What are you grateful for in this moment?",
    "Write about a challenge you're facing and how you might approach it.",
    "What would you tell your future self?",
    "Describe your ideal day from start to finish.",
    "What's something you learned about yourself recently?",
    "Write about a person who has influenced you positively.",
    "What are your hopes and dreams for the next year?",
    "Describe a place where you feel most at peace."
  ];

  // Fetch recent entries
  const fetchRecentEntries = async () => {
    if (user) {
      try {
        const q = query(
          collection(db, 'journals'),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const querySnapshot = await getDocs(q);
        const userEntries = querySnapshot.docs
          .filter(doc => doc.data().userId === user.uid)
          .map(doc => ({ id: doc.id, ...doc.data() }));
        setRecentEntries(userEntries);
      } catch (err) {
        console.error('Error fetching entries: ', err);
      }
    }
  };

  useEffect(() => {
    fetchRecentEntries();
  }, [user]);

  const addEntry = async () => {
    if (!entry.trim()) {
      Alert.alert('Validation Error', 'Please write something before saving.');
      return;
    }

    try {
      setIsLoading(true);
      await addDoc(collection(db, 'journals'), {
        userId: user.uid,
        entry: entry.trim(),
        createdAt: new Date(),
        wordCount: entry.trim().split(/\s+/).length,
        characterCount: entry.trim().length,
      });
      Alert.alert('Success', 'Your journal entry has been saved! ✨');
      setEntry('');
      fetchRecentEntries(); // Refresh recent entries
    } catch (err) {
      console.error('Error adding entry: ', err);
      Alert.alert('Error', 'Failed to save entry. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const insertPrompt = (prompt) => {
    setEntry(prev => prev + (prev ? '\n\n' : '') + prompt + ' ');
    setShowPrompts(false);
  };

  const getWordCount = () => {
    return entry.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const getCharacterCount = () => {
    return entry.trim().length;
  };

  const getReadingTime = () => {
    const words = getWordCount();
    const readingTime = Math.ceil(words / 200); // Average reading speed: 200 words per minute
    return readingTime;
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
          <Text style={styles.title}>Free Journaling</Text>
          <Text style={styles.subtitle}>Express your thoughts freely</Text>
        </View>
        <TouchableOpacity 
          onPress={() => navigation.navigate('JournalEntries')} 
          style={styles.historyButton}
        >
          <Ionicons name="time-outline" size={20} color="#007BFF" />
          <Text style={styles.historyText}>History</Text>
        </TouchableOpacity>
      </View>

      {/* Writing Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Ionicons name="document-text" size={16} color="#7F8C8D" />
          <Text style={styles.statText}>{getWordCount()} words</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="time" size={16} color="#7F8C8D" />
          <Text style={styles.statText}>{getReadingTime()} min read</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="pencil" size={16} color="#7F8C8D" />
          <Text style={styles.statText}>{getCharacterCount()} chars</Text>
        </View>
      </View>

      {/* Writing Tools */}
      <View style={styles.toolsContainer}>
        <TouchableOpacity 
          onPress={() => setShowPrompts(!showPrompts)}
          style={styles.toolButton}
        >
          <Ionicons name="bulb" size={20} color="#F39C12" />
          <Text style={styles.toolText}>Prompts</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setEntry('')}
          style={styles.toolButton}
        >
          <Ionicons name="refresh" size={20} color="#E74C3C" />
          <Text style={styles.toolText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Prompts Modal */}
      {showPrompts && (
        <View style={styles.promptsContainer}>
          <Text style={styles.promptsTitle}>Writing Prompts</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {prompts.map((prompt, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => insertPrompt(prompt)}
                style={styles.promptChip}
              >
                <Text style={styles.promptText}>{prompt}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Main Writing Area */}
      <View style={styles.writingContainer}>
        <TextInput
          style={styles.input}
          placeholder="Start writing your thoughts here... Let your mind flow freely and express what's on your heart."
          value={entry}
          onChangeText={setEntry}
          multiline
          textAlignVertical="top"
          autoFocus={false}
        />
      </View>

      {/* Recent Entries Preview */}
      {recentEntries.length > 0 && (
        <View style={styles.recentContainer}>
          <Text style={styles.recentTitle}>Recent Entries</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {recentEntries.slice(0, 3).map((item, index) => (
              <TouchableOpacity 
                key={item.id} 
                style={styles.recentItem}
                onPress={() => navigation.navigate('JournalEntries')}
              >
                <Text style={styles.recentDate}>
                  {new Date(item.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </Text>
                <Text style={styles.recentPreview} numberOfLines={2}>
                  {item.entry.substring(0, 60)}...
                </Text>
                <Text style={styles.recentStats}>
                  {item.wordCount || 0} words
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Save Button */}
      <TouchableOpacity 
        onPress={addEntry} 
        style={[
          styles.button,
          !entry.trim() && styles.buttonDisabled,
          isLoading && styles.buttonLoading
        ]}
        disabled={!entry.trim() || isLoading}
      >
        <Ionicons 
          name={isLoading ? "hourglass-outline" : "save"} 
          size={20} 
          color="#fff" 
          style={styles.buttonIcon}
        />
        <Text style={styles.buttonText}>
          {isLoading ? 'Saving...' : 'Save Entry'}
        </Text>
      </TouchableOpacity>
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#7F8C8D',
    fontWeight: '600',
  },
  toolsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  toolButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toolText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#2C3E50',
    fontWeight: '600',
  },
  promptsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  promptsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 12,
  },
  promptChip: {
    backgroundColor: '#F39C12',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    maxWidth: width * 0.7,
  },
  promptText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  writingContainer: {
    flex: 1,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    padding: 20,
    borderWidth: 2,
    borderColor: '#E9ECEF',
    borderRadius: 16,
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#2C3E50',
    lineHeight: 24,
    textAlignVertical: 'top',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  recentContainer: {
    marginBottom: 20,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 12,
  },
  recentItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 140,
    borderLeftWidth: 4,
    borderLeftColor: '#007BFF',
  },
  recentDate: {
    fontSize: 12,
    color: '#7F8C8D',
    fontWeight: '600',
    marginBottom: 8,
  },
  recentPreview: {
    fontSize: 14,
    color: '#2C3E50',
    lineHeight: 18,
    marginBottom: 8,
  },
  recentStats: {
    fontSize: 12,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#27AE60',
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
  buttonDisabled: {
    backgroundColor: '#95A5A6',
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
});

export default withGradient(FreeJournaling);
