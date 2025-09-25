import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import withGradient from '../../components/withGradient';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

const JournalPage = ({ navigation }) => {
  const journalOptions = [
    {
      id: 'gratitude',
      title: 'Gratitude List',
      subtitle: 'Write down what you\'re grateful for',
      icon: 'heart-outline',
      color: '#FF6B6B',
      route: 'GratitudeList'
    },
    {
      id: 'goals',
      title: 'Today\'s Goals',
      subtitle: 'Set and track your daily objectives',
      icon: 'target-outline',
      color: '#4ECDC4',
      route: 'TodaysGoals'
    },
    {
      id: 'reflection',
      title: 'Daily Reflection',
      subtitle: 'Reflect on your day and experiences',
      icon: 'sunny-outline',
      color: '#45B7D1',
      route: 'DailyReflection'
    },
    {
      id: 'free',
      title: 'Free Journaling',
      subtitle: 'Express your thoughts freely',
      icon: 'create-outline',
      color: '#96CEB4',
      route: 'FreeJournaling'
    },
    {
      id: 'abcde',
      title: 'ABCDE Method',
      subtitle: 'Cognitive restructuring technique',
      icon: 'bulb-outline',
      color: '#FFEAA7',
      route: 'ABCDEMethod'
    }
  ];

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
        <Text style={styles.title}>📝 Journaling</Text>
        <Text style={styles.subtitle}>Reflect, grow, and express yourself</Text>
      </View>

      {/* Journal Options Grid */}
      <View style={styles.optionsContainer}>
        {journalOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[styles.optionCard, { borderLeftColor: option.color }]}
            onPress={() => navigation.navigate(option.route)}
            activeOpacity={0.8}
          >
            <View style={styles.optionHeader}>
              <View style={[styles.iconContainer, { backgroundColor: option.color }]}>
                <Ionicons name={option.icon} size={24} color="#fff" />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Inspiration Quote */}
      <View style={styles.quoteContainer}>
        <Text style={styles.quoteText}>
          "Writing is the way we process life. It's the way we make sense of our experiences."
        </Text>
        <Text style={styles.quoteAuthor}>- Unknown</Text>
      </View>

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
    alignItems: 'center',
    marginBottom: 30,
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
    textAlign: 'center',
  },
  optionsContainer: {
    paddingHorizontal: 20,
    ...(isWeb && {
      maxWidth: 800,
      alignSelf: 'center',
      width: '100%',
    }),
  },
  optionCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    ...(isWeb && {
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      ':hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
      },
    }),
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  quoteContainer: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    ...(isWeb && {
      maxWidth: 600,
      alignSelf: 'center',
      width: '100%',
    }),
  },
  quoteText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#4F2780',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 12,
  },
  quoteAuthor: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  extraSpacing: {
    height: 100,
    ...(isWeb && {
      height: 100,
    }),
  },
});

export default withGradient(JournalPage);
