import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { addDoc, collection, doc, getDoc, Timestamp } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import withGradient from '../../components/withGradient';
import { auth, db } from '../../config/firebase';

const { width } = Dimensions.get('window');

const CreatePost = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sentimentData, setSentimentData] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [apiKey, setApiKey] = useState(null);

  // Fetch API key on component mount
  useEffect(() => {
    fetchApiKey();
  }, []);

  // Function to fetch API key from Firestore
  const fetchApiKey = async () => {
    try {
      const apiKeyDoc = await getDoc(doc(db, 'config', 'openai'));
      if (apiKeyDoc.exists()) {
        const data = apiKeyDoc.data();
        setApiKey(data.apiKey);
        return data.apiKey;
      } else {
        console.log('API key document not found in Firestore');
        return null;
      }
    } catch (error) {
      console.error('Error fetching API key:', error);
      return null;
    }
  };

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
      // Get API key from Firestore
      let currentApiKey = apiKey;
      if (!currentApiKey) {
        currentApiKey = await fetchApiKey();
      }
      
      if (!currentApiKey) {
        throw new Error('API key not available');
      }
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
messages: [
  {
    role: 'system',
    content: `You are a mental health and wellness sentiment analysis assistant. 
Analyze the following social media post text and return a JSON object with four properties:
- category: one of "Positive", "Neutral", "Negative"
- score: a sentiment score between -1 (very negative) and +1 (very positive), don't use 0
- explanation: a brief explanation of your sentiment classification
- suggestions: a list of 2-4 specific, actionable mental health and wellness suggestions based on the actual content and sentiment of the post. Make suggestions relevant to what the person is actually sharing about their life, experiences, or feelings.

Focus on providing personalized, helpful advice that directly relates to the content shared. For example:
- If someone shares about work stress, suggest work-life balance tips
- If someone shares about relationships, suggest communication strategies
- If someone shares about personal growth, suggest next steps
- If someone shares about challenges, suggest coping mechanisms

Example response:
{
  "category": "Negative",
  "score": -0.7,
  "explanation": "The text expresses frustration and disappointment about work challenges.",
  "suggestions": [
    "Consider setting clear boundaries between work and personal time to prevent burnout.",
    "Try breaking down overwhelming tasks into smaller, manageable steps.",
    "Reach out to a trusted colleague or supervisor to discuss workload concerns.",
    "Practice stress-relief techniques like deep breathing or short walks during breaks."
  ]
}`
  },
  { role: 'user', content: text }
]

        }),
      });

      const result = await response.json();
      console.log('OpenAI API Response:', result);
      
      // Parse JSON string response to object
      try {
        const parsedResult = JSON.parse(result.choices[0].message.content.trim());
        console.log('Parsed Sentiment Data:', parsedResult);
        console.log('Suggestions received:', parsedResult.suggestions);
        return parsedResult;
      } catch (parseError) {
        console.error('Failed to parse sentiment JSON:', parseError);
        console.error('Raw response content:', result.choices[0].message.content);
        return { 
          category: 'Neutral', 
          score: 0, 
          explanation: 'Sentiment analysis failed to parse response.',
          suggestions: ['Try rephrasing your post for better analysis.']
        };
      }
    } catch (error) {
      console.error('Sentiment error:', error);
      return { category: 'Neutral', score: 0, explanation: 'Sentiment analysis failed due to error.' };
    }
  };

  const handleSubmit = async () => {
    console.log('Validation check - Title length:', title.length, 'Content length:', content.length);
    
    if (!title.trim() || !content.trim()) {
      console.log('Validation failed: Missing title or content');
      Alert.alert('Missing Information', 'Please fill in both title and content');
      return;
    }

    if (title.length < 3) {
      console.log('Validation failed: Title too short');
      Alert.alert('Title Too Short', 'Please enter a title with at least 3 characters');
      return;
    }

    if (content.length < 5) {
      console.log('Validation failed: Content too short');
      Alert.alert('Content Too Short', 'Please enter content with at least 5 characters');
      return;
    }

    console.log('Validation passed, proceeding with post creation');

    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert('Authentication Required', 'You must be logged in to create a post');
      return;
    }

    setIsLoading(true);
    setIsAnalyzing(true);

    try {
      // Create post first, then analyze sentiment
      const postData = {
        title: title.trim(),
        content: content.trim(),
        createdAt: Timestamp.now(),
        userId: currentUser.uid,
        userEmail: currentUser.email,
        authorName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Anonymous',
        supportCount: 0,
        commentCount: 0,
      };

      // Add post to Firestore
      const docRef = await addDoc(collection(db, 'forumPosts'), postData);
      console.log('Post created successfully with ID:', docRef.id);

      // Try sentiment analysis (optional)
      try {
        console.log('Starting sentiment analysis for content:', content);
        const sentiment = await getSentiment(content);
        console.log('Sentiment analysis result:', sentiment);
        setSentimentData(sentiment);
        setIsAnalyzing(false);
        setModalVisible(true);
      } catch (sentimentError) {
        console.log('Sentiment analysis failed, but post was created:', sentimentError);
        // Show success message without sentiment analysis
        Alert.alert('Success!', 'Your post has been shared successfully! 🎉', [
          {
            text: 'OK',
            onPress: () => {
              setTitle('');
              setContent('');
              navigation.goBack();
            }
          }
        ]);
      }

      // For debugging - show success immediately
      // Comment out the sentiment analysis above and uncomment this for testing
      /*
      Alert.alert('Success!', 'Your post has been shared successfully! 🎉', [
        {
          text: 'OK',
          onPress: () => {
            setTitle('');
            setContent('');
            navigation.goBack();
          }
        }
      ]);
      */

      // Clear input after successful submission
      setTitle('');
      setContent('');
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      setIsAnalyzing(false);
      Alert.alert('Error', 'Failed to create post. Please try again.');
      console.error('Error creating post:', error);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
      >
        {/* Calendar-style Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.title}>✍️ Create Post</Text>
            <Text style={styles.subtitle}>Share your thoughts with the community</Text>
          </View>
          <View style={styles.headerPlaceholder} />
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          <View style={styles.formContainer}>
            {/* Title Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Post Title</Text>
      <TextInput
                style={styles.titleInput}
                placeholder="What's on your mind?"
                placeholderTextColor="#9CA3AF"
        value={title}
        onChangeText={setTitle}
                maxLength={100}
              />
              <Text style={[styles.characterCount, title.length < 3 && styles.characterCountWarning]}>
                {title.length}/100 {title.length < 3 && '(min 3)'}
              </Text>
            </View>

            {/* Content Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Share Your Story</Text>
      <TextInput
                style={styles.contentInput}
                placeholder="Write your post content here... Share your experiences, ask questions, or start a discussion."
                placeholderTextColor="#9CA3AF"
        value={content}
        onChangeText={setContent}
        multiline
                maxLength={1000}
                textAlignVertical="top"
              />
              <Text style={[styles.characterCount, content.length < 5 && styles.characterCountWarning]}>
                {content.length}/1000 {content.length < 5 && '(min 5)'}
              </Text>
            </View>
          </View>

          {/* Post Guidelines */}
          <View style={styles.guidelinesSection}>
            <Text style={styles.guidelinesTitle}>💡 Post Guidelines</Text>
            <View style={styles.guidelineItem}>
              <View style={styles.guidelineDot} />
              <Text style={styles.guidelineText}>Be respectful and kind to others</Text>
            </View>
            <View style={styles.guidelineItem}>
              <View style={styles.guidelineDot} />
              <Text style={styles.guidelineText}>Share meaningful content that adds value</Text>
            </View>
            <View style={styles.guidelineItem}>
              <View style={styles.guidelineDot} />
              <Text style={styles.guidelineText}>Use clear and descriptive titles</Text>
            </View>
            <View style={styles.guidelineItem}>
              <View style={styles.guidelineDot} />
              <Text style={styles.guidelineText}>Your post will be analyzed for sentiment</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            <TouchableOpacity 
              style={[
                styles.submitButton,
                (!title.trim() || !content.trim() || isLoading) && styles.submitButtonDisabled
              ]} 
              onPress={() => {
                console.log('Share Post button pressed');
                console.log('Title:', title);
                console.log('Content:', content);
                console.log('Is Loading:', isLoading);
                handleSubmit();
              }}
              disabled={!title.trim() || !content.trim() || isLoading}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.submitButtonText}>
                    {isAnalyzing ? 'Analyzing...' : 'Creating Post...'}
                  </Text>
                </View>
              ) : (
                <View style={styles.submitContent}>
                  <Ionicons name="send" size={20} color="#fff" />
                  <Text style={styles.submitButtonText}>Share Post</Text>
                </View>
              )}
      </TouchableOpacity>

            <TouchableOpacity 
              style={styles.previewButton}
              onPress={() => {
                if (title.trim() && content.trim()) {
                  Alert.alert('Post Preview', `Title: ${title}\n\nContent: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`);
                }
              }}
              disabled={!title.trim() || !content.trim()}
            >
              <Ionicons name="eye" size={20} color="#4F2780" />
              <Text style={styles.previewButtonText}>Preview Post</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Extra spacing for better scrolling */}
        <View style={styles.extraSpacing} />
      </ScrollView>

      {/* Enhanced Sentiment Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setModalVisible(false);
          navigation.goBack();
        }}
      >
        <View style={styles.modalContainer}>
          {/* Modern Header with Gradient */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderContent}>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  navigation.goBack();
                }}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
              <View style={styles.modalTitleContainer}>
                <Text style={styles.modalTitle}>Sentiment Analysis</Text>
                <Text style={styles.modalSubtitle}>AI-powered insights for your post</Text>
              </View>
              <View style={styles.modalPlaceholder} />
            </View>
          </View>

            {sentimentData ? (
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Sentiment Result Card */}
              <View style={styles.sentimentCard}>
                <View style={styles.sentimentResult}>
                  {/* Animated Icon Container */}
                  <View style={[
                    styles.sentimentIconContainer,
                    { 
                      backgroundColor: `${sentimentColors[sentimentData.category]}15`,
                      borderColor: `${sentimentColors[sentimentData.category]}30`,
                      borderWidth: 2,
                    }
                  ]}>
                <MaterialIcons
                  name={sentimentIcons[sentimentData.category] || 'help-outline'}
                      size={50}
                  color={sentimentColors[sentimentData.category] || '#000'}
                    />
                  </View>
                  
                  {/* Category Badge */}
                  <View style={[
                    styles.categoryBadge,
                    { backgroundColor: `${sentimentColors[sentimentData.category]}20` }
                  ]}>
                    <Text style={[
                      styles.sentimentCategory,
                      { color: sentimentColors[sentimentData.category] || '#000' }
                    ]}>
                      {sentimentData.category || 'Unknown'}
                    </Text>
                  </View>

                  {/* Score Visualization */}
                  {sentimentData.score !== null && sentimentData.score !== undefined && (
                    <View style={styles.scoreContainer}>
                      <Text style={styles.scoreLabel}>Confidence Level</Text>
                      <View style={styles.scoreVisualization}>
                        <View style={styles.scoreBar}>
                          <View 
                  style={[
                              styles.scoreFill,
                              { 
                                width: `${Math.abs(sentimentData.score) * 100}%`,
                                backgroundColor: sentimentColors[sentimentData.category]
                              }
                            ]} 
                          />
                        </View>
                        <Text style={[
                          styles.scoreValue,
                          { color: sentimentColors[sentimentData.category] }
                        ]}>
                          {(Math.abs(sentimentData.score) * 100).toFixed(0)}%
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Explanation Card */}
                  <View style={styles.explanationCard}>
                    <Text style={styles.explanationTitle}>Analysis</Text>
                    <Text style={styles.sentimentExplanation}>
                      {sentimentData.explanation || 'No explanation available.'}
                </Text>
                  </View>
                </View>
              </View>

              {/* Enhanced Suggestions */}
              {sentimentData.suggestions && sentimentData.suggestions.length > 0 ? (
                <View style={styles.suggestionsCard}>
                  <View style={styles.suggestionsHeader}>
                    <View style={styles.suggestionsIconContainer}>
                      <Ionicons name="bulb" size={24} color="#FFA726" />
                    </View>
                    <Text style={styles.suggestionsTitle}>AI-Powered Suggestions</Text>
                  </View>
                  <Text style={styles.suggestionsSubtitle}>
                    Based on your post content, here are personalized recommendations:
                  </Text>
                  {sentimentData.suggestions.map((suggestion, index) => (
                    <View key={index} style={styles.suggestionItem}>
                      <View style={styles.suggestionNumberContainer}>
                        <Text style={styles.suggestionNumber}>{index + 1}</Text>
                      </View>
                      <View style={styles.suggestionContent}>
                        <Text style={styles.suggestionText}>{suggestion}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.suggestionsCard}>
                  <View style={styles.suggestionsHeader}>
                    <View style={styles.suggestionsIconContainer}>
                      <Ionicons name="information-circle" size={24} color="#6B7280" />
                    </View>
                    <Text style={styles.suggestionsTitle}>No Suggestions Available</Text>
                  </View>
                  <Text style={styles.suggestionsSubtitle}>
                    The AI analysis didn't generate specific suggestions for this post.
                  </Text>
                </View>
              )}

              {/* Enhanced Action Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => {
                    setModalVisible(false);
                    navigation.goBack();
                  }}
                >
                  <View style={styles.buttonContent}>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.primaryButtonText}>Continue to Forum</Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => {
                    setShowSuggestions(!showSuggestions);
                  }}
                >
                  <View style={styles.buttonContent}>
                    <Ionicons 
                      name={showSuggestions ? "eye-off" : "eye"} 
                      size={18} 
                      color="#4F2780" 
                    />
                    <Text style={styles.secondaryButtonText}>
                      {showSuggestions ? 'Hide' : 'Show'} Suggestions
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </ScrollView>
          ) : (
            <View style={styles.loadingContainer}>
              <View style={styles.loadingCard}>
                <View style={styles.loadingIconContainer}>
                  <ActivityIndicator size="large" color="#4F2780" />
                </View>
                <Text style={styles.loadingTitle}>AI Analysis in Progress</Text>
                <Text style={styles.loadingText}>
                  Our AI is analyzing the sentiment and emotional tone of your post...
                </Text>
                <View style={styles.loadingDots}>
                  <View style={[styles.dot, styles.dot1]} />
                  <View style={[styles.dot, styles.dot2]} />
                  <View style={[styles.dot, styles.dot3]} />
                </View>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

export default withGradient(CreatePost);

const styles = StyleSheet.create({
  // Main Container - Calendar Style
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  
  // Header Styles - Calendar Theme
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
  title: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  headerPlaceholder: {
    width: 40,
  },

  // Form Section
  formSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  formContainer: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 20,
  },

  // Input Styles
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4F2780',
    marginBottom: 8,
  },
  titleInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(79, 39, 128, 0.2)',
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#2C3E50',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  contentInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(79, 39, 128, 0.2)',
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#2C3E50',
    minHeight: 120,
    maxHeight: 200,
    textAlignVertical: 'top',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  characterCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
  },
  characterCountWarning: {
    color: '#E74C3C',
    fontWeight: '600',
  },

  // Guidelines Section - Calendar Style
  guidelinesSection: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  guidelinesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4F2780',
    marginBottom: 12,
    textAlign: 'center',
  },
  guidelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  guidelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4F2780',
    marginRight: 12,
  },
  guidelineText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    flex: 1,
  },

  // Action Section - Calendar Style
  actionSection: {
    gap: 12,
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#4F2780',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    backgroundColor: '#BDC3C7',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  previewButton: {
    backgroundColor: 'rgba(79, 39, 128, 0.1)',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(79, 39, 128, 0.3)',
  },
  previewButtonText: {
    color: '#4F2780',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  extraSpacing: {
    height: 150,
  },

  // Enhanced Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  modalHeader: {
    backgroundColor: 'rgba(79, 39, 128, 0.95)',
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  modalCloseButton: {
    padding: 10,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  modalTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  modalPlaceholder: {
    width: 50,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },

  // Enhanced Sentiment Analysis Styles
  sentimentCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sentimentResult: {
    alignItems: 'center',
  },
  sentimentIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  sentimentCategory: {
    fontSize: 18,
    fontWeight: '700',
  },
  scoreContainer: {
    width: '100%',
    marginBottom: 20,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  scoreVisualization: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    fontSize: 16,
    fontWeight: '700',
    minWidth: 40,
    textAlign: 'right',
  },
  explanationCard: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  explanationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4F2780',
    marginBottom: 8,
  },
  sentimentExplanation: {
    fontSize: 15,
    color: '#5A6C7D',
    lineHeight: 22,
  },

  // Enhanced Suggestions Styles
  suggestionsCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  suggestionsIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  suggestionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
    flex: 1,
  },
  suggestionsSubtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 16,
    lineHeight: 20,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingVertical: 4,
  },
  suggestionNumberContainer: {
    marginRight: 16,
  },
  suggestionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4F2780',
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 28,
  },
  suggestionContent: {
    flex: 1,
    paddingTop: 2,
  },
  suggestionText: {
    fontSize: 15,
    color: '#5A6C7D',
    lineHeight: 22,
  },

  // Enhanced Modal Actions
  modalActions: {
    marginTop: 20,
    paddingBottom: 20,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#4F2780',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#4F2780',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: '#F8F9FA',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4F2780',
  },
  secondaryButtonText: {
    color: '#4F2780',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },

  // Enhanced Loading Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    maxWidth: 300,
  },
  loadingIconContainer: {
    marginBottom: 20,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 15,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4F2780',
    marginHorizontal: 4,
  },
  dot1: {
    opacity: 0.4,
  },
  dot2: {
    opacity: 0.7,
  },
  dot3: {
    opacity: 1,
  },
});
