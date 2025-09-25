import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import withGradient from '../../components/withGradient';

const { width } = Dimensions.get('window');

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
  
function PostDetail({ route, navigation }) {
  const { post } = route.params;

  const sentiment = post.sentiment || { 
    category: 'Unknown', 
    score: null, 
    explanation: 'No sentiment analysis available', 
    suggestions: [] 
  };

  const color = sentimentColors[sentiment.category] || '#9E9E9E';
  const iconName = sentimentIcons[sentiment.category] || 'help-outline';

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };


  return (
    <View style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
        bounces={true}
        alwaysBounceVertical={false}
        nestedScrollEnabled={true}
        scrollEventThrottle={16}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.navigate('ForumPage')} 
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Post Details</Text>
            <Text style={styles.headerSubtitle}>Community Discussion</Text>
          </View>
          <View style={styles.headerPlaceholder} />
        </View>

        {/* Post Content Card */}
        <View style={styles.postCard}>
          {/* Author Info */}
          <View style={styles.authorSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {post.authorName?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>{post.authorName || 'Anonymous'}</Text>
              <Text style={styles.postTime}>{formatDate(post.createdAt)}</Text>
            </View>
            <View style={styles.postBadge}>
              <Text style={styles.postBadgeText}>Post</Text>
            </View>
          </View>

          {/* Post Title */}
          <Text style={styles.postTitle}>{post.title}</Text>
          
          {/* Post Content */}
          <Text style={styles.postContent}>{post.content}</Text>

        </View>

        {/* Sentiment Analysis Card */}
        <View style={styles.sentimentCard}>
          <View style={styles.sentimentHeader}>
            <View style={styles.sentimentIconContainer}>
              <Ionicons name="analytics" size={24} color="#4F2780" />
            </View>
            <Text style={styles.sentimentTitle}>AI Sentiment Analysis</Text>
          </View>

          <View style={styles.sentimentContent}>
            {/* Sentiment Result */}
            <View style={styles.sentimentResult}>
              <View style={[
                styles.sentimentIconWrapper,
                { backgroundColor: `${color}15`, borderColor: `${color}30` }
              ]}>
                <MaterialIcons name={iconName} size={40} color={color} />
              </View>
              
              <View style={styles.sentimentInfo}>
                <View style={[styles.categoryBadge, { backgroundColor: `${color}20` }]}>
                  <Text style={[styles.categoryText, { color }]}>
                    {sentiment.category}
                  </Text>
                </View>
                
                {sentiment.score !== null && sentiment.score !== undefined && (
                  <View style={styles.scoreContainer}>
                    <Text style={styles.scoreLabel}>Confidence</Text>
                    <View style={styles.scoreBar}>
                      <View 
                        style={[
                          styles.scoreFill, 
                          { 
                            width: `${Math.abs(sentiment.score) * 100}%`,
                            backgroundColor: color
                          }
                        ]} 
                      />
                    </View>
                    <Text style={[styles.scoreValue, { color }]}>
                      {(Math.abs(sentiment.score) * 100).toFixed(0)}%
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Explanation */}
            <View style={styles.explanationSection}>
              <Text style={styles.explanationTitle}>Analysis</Text>
              <Text style={styles.explanationText}>
                {sentiment.explanation || 'No detailed analysis available.'}
              </Text>
            </View>

            {/* Suggestions */}
            {sentiment.suggestions && sentiment.suggestions.length > 0 && (
              <View style={styles.suggestionsSection}>
                <View style={styles.suggestionsHeader}>
                  <Ionicons name="bulb" size={20} color="#FFA726" />
                  <Text style={styles.suggestionsTitle}>AI Recommendations</Text>
                </View>
                <Text style={styles.suggestionsSubtitle}>
                  Personalized suggestions based on your post:
                </Text>
                {sentiment.suggestions.map((suggestion, index) => (
                  <View key={index} style={styles.suggestionItem}>
                    <View style={styles.suggestionNumber}>
                      <Text style={styles.suggestionNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>


        {/* Extra spacing */}
        <View style={styles.extraSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    minHeight: '100vh',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    minHeight: '100vh',
    paddingBottom: 50,
  },
  
  // Header Styles
  header: {
    backgroundColor: 'rgba(79, 39, 128, 0.9)',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  headerPlaceholder: {
    width: 40,
  },

  // Post Card Styles
  postCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 20,
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4F2780',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  postTime: {
    fontSize: 14,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  postBadge: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  postBadgeText: {
    fontSize: 12,
    color: '#4F2780',
    fontWeight: '600',
  },
  postTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
    lineHeight: 32,
  },
  postContent: {
    fontSize: 16,
    color: '#34495E',
    lineHeight: 24,
    marginBottom: 20,
  },

  // Sentiment Card Styles
  sentimentCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 20,
  },
  sentimentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sentimentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0E6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sentimentTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
  },
  sentimentContent: {
    gap: 20,
  },
  sentimentResult: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sentimentIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginRight: 16,
  },
  sentimentInfo: {
    flex: 1,
  },
  categoryBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 16,
    fontWeight: '700',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#7F8C8D',
    marginRight: 12,
    fontWeight: '600',
  },
  scoreBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E9ECEF',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 12,
  },
  scoreFill: {
    height: '100%',
    borderRadius: 4,
  },
  scoreValue: {
    fontSize: 14,
    fontWeight: '700',
    minWidth: 40,
    textAlign: 'right',
  },
  explanationSection: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
  },
  explanationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4F2780',
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 15,
    color: '#5A6C7D',
    lineHeight: 22,
  },
  suggestionsSection: {
    backgroundColor: '#FFF8E1',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FFA726',
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2C3E50',
    marginLeft: 8,
  },
  suggestionsSubtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 12,
    lineHeight: 20,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  suggestionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4F2780',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  suggestionNumberText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: '#5A6C7D',
    lineHeight: 20,
  },

  extraSpacing: {
    height: 200,
  },
});

export default withGradient(PostDetail);