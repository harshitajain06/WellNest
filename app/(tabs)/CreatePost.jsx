import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Modal } from 'react-native';
import { db, auth } from '../../config/firebase'; // Import auth here
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

export default function CreatePost() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sentimentData, setSentimentData] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const navigation = useNavigation();

  // Icons and colors based on sentiment category
  const sentimentIcons = {
    Positive: 'sentiment-satisfied',
    Neutral: 'sentiment-neutral',
    Negative: 'sentiment-dissatisfied',
  };
  const sentimentColors = {
    Positive: '#4caf50', // green
    Neutral: '#9e9e9e',  // grey
    Negative: '#f44336', // red
  };

  const getSentiment = async (text) => {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer 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`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
messages: [
  {
    role: 'system',
    content: `You are a sentiment analysis assistant. 
Analyze the following text and return a JSON object with four properties:
- category: one of "Positive", "Neutral", "Negative"
- score: a sentiment score between -1 (very negative) and +1 (very positive), don't take 0
- explanation: a short explanation of your classification
- suggestions: a list of 1–3 actionable suggestions to overcome or improve the situation described in the text, especially if the sentiment is negative or neutral

Example response:
{
  "category": "Negative",
  "score": -0.7,
  "explanation": "The text expresses frustration and disappointment.",
  "suggestions": [
    "Try to identify the root cause of the issue and address it directly.",
    "Seek support from colleagues or a mentor to gain perspective.",
    "Consider taking a short break to recharge and refocus."
  ]
}`
  },
  { role: 'user', content: text }
]

        }),
      });

      const result = await response.json();
      // Parse JSON string response to object
      try {
        return JSON.parse(result.choices[0].message.content.trim());
      } catch (parseError) {
        console.error('Failed to parse sentiment JSON:', parseError);
        return { category: 'Neutral', score: 0, explanation: 'Sentiment analysis failed to parse response.' };
      }
    } catch (error) {
      console.error('Sentiment error:', error);
      return { category: 'Neutral', score: 0, explanation: 'Sentiment analysis failed due to error.' };
    }
  };

  const handleSubmit = async () => {
    if (!title || !content) {
      Alert.alert('Please fill in both title and content');
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in to create a post');
      return;
    }

    const sentiment = await getSentiment(content);
    setSentimentData(sentiment);
    setModalVisible(true);

    try {
      await addDoc(collection(db, 'forumPosts'), {
        title,
        content,
        createdAt: Timestamp.now(),
        sentiment,
        userId: currentUser.uid, // <-- Add userId here
      });
      // Clear input after submission
      setTitle('');
      setContent('');
    } catch (error) {
      Alert.alert('Error submitting post', error.message);
    }
  };

  return (
    <LinearGradient colors={['#4F2780', '#D3C5E5']} style={styles.container}>
      <Text style={styles.header}>Create a New Post</Text>

      <TextInput
        style={styles.input}
        placeholder="Title"
        placeholderTextColor="#ccc"
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        style={[styles.input, { height: 120 }]}
        placeholder="Write something..."
        placeholderTextColor="#ccc"
        value={content}
        onChangeText={setContent}
        multiline
      />
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Submit Post</Text>
      </TouchableOpacity>

      {/* Sentiment Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            {sentimentData ? (
              <>
                <MaterialIcons
                  name={sentimentIcons[sentimentData.category] || 'help-outline'}
                  size={72}
                  color={sentimentColors[sentimentData.category] || '#000'}
                  style={{ marginBottom: 12 }}
                />
                <Text
                  style={[
                    styles.modalTitle,
                    { color: sentimentColors[sentimentData.category] || '#000' },
                  ]}
                >
                  Sentiment: {sentimentData.category || 'Unknown'}
                </Text>
                {sentimentData.score !== null && sentimentData.score !== undefined && (
                  <Text style={styles.modalScore}>
                    Score: {(sentimentData.score * 100).toFixed(0)}%
                  </Text>
                )}
                <Text style={styles.modalExplanation}>
                  {sentimentData.explanation || 'No explanation available.'}
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => {
                    setModalVisible(false);
                    navigation.goBack();
                  }}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.modalExplanation}>Analyzing sentiment...</Text>
            )}
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },
  header: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
  input: {
    backgroundColor: '#ffffff20',
    color: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#6A3FB3',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 30,
    width: '100%',
    maxWidth: 350,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  modalScore: {
    fontSize: 18,
    marginBottom: 10,
  },
  modalExplanation: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: '#6A3FB3',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 10,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
