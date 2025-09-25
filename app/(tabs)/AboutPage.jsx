import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const affirmations = [
  "I have the strength to overcome any challenge I face.",
  "Each setback is a setup for a greater comeback.",
  "I choose courage over fear, progress over perfection.",
  "My mind is focused, my heart is open, and I am ready for growth.",
  "I am resilient, resourceful, and ready to rise.",
  "Every day, I am becoming stronger, wiser, and more confident.",
  "I trust myself to handle whatever comes my way.",
  "I learn, adapt, and thrive no matter the circumstances.",
  "Obstacles are opportunities for me to shine.",
  "My resilience is my superpower.",
];

export default function AboutPage() {
  const [currentAffirmationIndex, setCurrentAffirmationIndex] = useState(0);

  const nextAffirmation = () => {
    setCurrentAffirmationIndex((prev) => (prev + 1) % affirmations.length);
  };

  const previousAffirmation = () => {
    setCurrentAffirmationIndex((prev) => (prev - 1 + affirmations.length) % affirmations.length);
  };

  return (
    <LinearGradient colors={['#4F2780', '#D3C5E5']} style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.headerContainer}>
            <Text style={styles.heading}>About WellNest</Text>
            <View style={styles.divider} />
          </View>
          
          <View style={styles.descriptionCard}>
            <Text style={styles.descriptionText}>
              WellNest aims to create a safe, compassionate, and intelligent space for caregivers to nurture their own mental health. By combining ethical AI, guided self-reflection, and professional psychological resources, we strive to offer caregivers the recognition and care they deserve—because supporting others shouldn't come at the cost of your own well-being.
            </Text>
            <Text style={styles.descriptionText}>
              Whether you're caring for a loved one, a patient, or someone in need, WellNest is your space to recharge, reflect, and find strength. Because your well-being matters, too.
            </Text>
          </View>

          <View style={styles.sectionContainer}>
            <Text style={styles.subHeading}>✨ Key Features</Text>
            <View style={styles.featuresGrid}>
              <View style={styles.featureCard}>
                <Text style={styles.featureIcon}>🎯</Text>
                <Text style={styles.featureTitle}>Habit Tracking</Text>
                <Text style={styles.featureDescription}>Keep you on top of your goals</Text>
              </View>
              
              <View style={styles.featureCard}>
                <Text style={styles.featureIcon}>🌟</Text>
                <Text style={styles.featureTitle}>Daily Gratitude</Text>
                <Text style={styles.featureDescription}>Focus on positivity</Text>
              </View>
              
              <View style={styles.featureCard}>
                <Text style={styles.featureIcon}>📝</Text>
                <Text style={styles.featureTitle}>Free Journaling</Text>
                <Text style={styles.featureDescription}>Guided reflection exercises</Text>
              </View>
              
              <View style={styles.featureCard}>
                <Text style={styles.featureIcon}>🎥</Text>
                <Text style={styles.featureTitle}>Expert Videos</Text>
                <Text style={styles.featureDescription}>Inspire and educate</Text>
              </View>
              
              <View style={styles.featureCard}>
                <Text style={styles.featureIcon}>📅</Text>
                <Text style={styles.featureTitle}>Smart Calendar</Text>
                <Text style={styles.featureDescription}>Better planning made easy</Text>
              </View>
              
              <View style={styles.featureCard}>
                <Text style={styles.featureIcon}>📊</Text>
                <Text style={styles.featureTitle}>Progress Tracking</Text>
                <Text style={styles.featureDescription}>Visual mood tracking with emojis</Text>
              </View>
              
              <View style={styles.featureCard}>
                <Text style={styles.featureIcon}>👥</Text>
                <Text style={styles.featureTitle}>Community Forum</Text>
                <Text style={styles.featureDescription}>AI-powered support recommendations</Text>
              </View>
            </View>
          </View>

          <View style={styles.sectionContainer}>
            <Text style={styles.subHeading}>🎯 Our Mission</Text>
            <View style={styles.missionCard}>
              <Text style={styles.missionText}>
                We believe that small, consistent actions can lead to significant life changes. Our mission
                is to empower individuals by providing tools and resources to create positive habits and 
                foster personal growth.
              </Text>
            </View>
          </View>

          <View style={styles.sectionContainer}>
            <Text style={styles.subHeading}>📞 Contact Us</Text>
            <View style={styles.contactCard}>
              <Text style={styles.contactText}>
                If you have any questions, feedback, or suggestions, feel free to reach out to us at:
              </Text>
              <Text style={styles.email}>lasyap.08@gmail.com</Text>
            </View>
          </View>

          <View style={styles.sectionContainer}>
            <Text style={styles.subHeading}>💫 Positive Affirmations for Resilience</Text>
            <Text style={styles.instructionText}>
              Tap the affirmation below to reveal the next one. Take a moment to reflect on each message.
            </Text>
          </View>
          
          <View style={styles.affirmationContainer}>
            <TouchableOpacity 
              style={styles.affirmationCard} 
              onPress={nextAffirmation}
              activeOpacity={0.8}
            >
              <Text style={styles.affirmationText}>
                {affirmations[currentAffirmationIndex]}
              </Text>
              <Text style={styles.tapHint}>Tap to continue</Text>
            </TouchableOpacity>
            
            <View style={styles.navigationContainer}>
              <TouchableOpacity 
                style={styles.navButton} 
                onPress={previousAffirmation}
                activeOpacity={0.7}
              >
                <Text style={styles.navButtonText}>← Previous</Text>
              </TouchableOpacity>
              
              <Text style={styles.counterText}>
                {currentAffirmationIndex + 1} of {affirmations.length}
              </Text>
              
              <TouchableOpacity 
                style={styles.navButton} 
                onPress={nextAffirmation}
                activeOpacity={0.7}
              >
                <Text style={styles.navButtonText}>Next →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  heading: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#fff',
    marginBottom: 15,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  divider: {
    width: 60,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 2,
  },
  descriptionCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 26,
    textAlign: 'center',
    color: '#fff',
    marginBottom: 16,
    fontWeight: '400',
  },
  sectionContainer: {
    width: '100%',
    marginBottom: 30,
  },
  subHeading: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#fff',
    marginBottom: 20,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  featureCard: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 12,
  },
  featureIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 16,
  },
  missionCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  missionText: {
    fontSize: 16,
    lineHeight: 26,
    textAlign: 'center',
    color: '#fff',
    fontWeight: '400',
  },
  contactCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  contactText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    color: '#fff',
    marginBottom: 12,
  },
  email: {
    fontSize: 18,
    textAlign: 'center',
    textDecorationLine: 'underline',
    color: '#fff',
    fontWeight: 'bold',
  },
  instructionText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
    paddingHorizontal: 20,
  },
  affirmationContainer: {
    alignItems: 'center',
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  affirmationCard: {
    width: '100%',
    maxWidth: 400,
    minHeight: 160,
    padding: 28,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 24,
  },
  affirmationText: {
    fontSize: 20,
    fontStyle: 'italic',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: '600',
    marginBottom: 16,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  tapHint: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    fontStyle: 'normal',
    fontWeight: '500',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 300,
  },
  navButton: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  navButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  counterText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 15,
    fontWeight: '600',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
});
