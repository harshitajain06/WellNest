import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

const sentimentColors = {
  Positive: '#4CAF50',
  Neutral: '#9E9E9E',
  Negative: '#F44336',
};

const sentimentIcons = {
  Positive: 'sentiment-satisfied',
  Neutral: 'sentiment-neutral',
  Negative: 'sentiment-dissatisfied',
};

export default function PostDetail({ route }) {
  const { post } = route.params;

  const sentiment = typeof post.sentiment === 'string'
    ? { category: post.sentiment, score: null, explanation: '', suggestions: [] }
    : post.sentiment || { category: 'Unknown', score: null, explanation: '', suggestions: [] };

  const color = sentimentColors[sentiment.category] || '#fff';
  const iconName = sentimentIcons[sentiment.category] || 'help-outline';

  return (
    <LinearGradient colors={['#4F2780', '#D3C5E5']} style={styles.container}>
      <Text style={styles.title}>{post.title}</Text>
      <Text style={styles.content}>{post.content}</Text>

      <View style={styles.sentimentContainer}>
        <MaterialIcons name={iconName} size={36} color={color} />
        <View style={{ marginLeft: 10, flex: 1 }}>
          <Text style={[styles.sentimentCategory, { color }]}>
            Sentiment: {sentiment.category}
          </Text>
          {sentiment.score !== null && sentiment.score !== undefined && (
            <Text style={styles.sentimentScore}>
              Score: {(sentiment.score * 100).toFixed(0)}%
            </Text>
          )}
          {sentiment.explanation ? (
            <Text style={styles.sentimentExplanation}>{sentiment.explanation}</Text>
          ) : null}

          {sentiment.suggestions && sentiment.suggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsTitle}>Suggestions:</Text>
              {sentiment.suggestions.map((item, index) => (
                <Text key={index} style={styles.suggestionItem}>
                  • {item}
                </Text>
              ))}
            </View>
          )}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    color: '#eee',
    marginBottom: 30,
  },
  sentimentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 15,
  },
  sentimentCategory: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sentimentScore: {
    fontSize: 14,
    color: '#ddd',
  },
  sentimentExplanation: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#ccc',
    marginTop: 4,
  },
  suggestionsContainer: {
    marginTop: 12,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  suggestionItem: {
    fontSize: 13,
    color: '#eee',
    marginLeft: 8,
  },
});
