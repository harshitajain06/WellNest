import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, FlatList, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

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

const screenWidth = Dimensions.get('window').width;

export default function AboutPage() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <LinearGradient colors={['#4F2780', '#D3C5E5']} style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.heading}>About WellNest</Text>
          <Text style={styles.text}>
            WellNest aims to create a safe, compassionate, and intelligent space for caregivers to nurture their own mental health. By combining ethical AI, guided self-reflection, and professional psychological resources, we strive to offer caregivers the recognition and care they deserve—because supporting others shouldn’t come at the cost of your own well-being.{"\n"}
            Whether you're caring for a loved one, a patient, or someone in need, WellNest is your space to recharge, reflect, and find strength. Because your well-being matters, too.
          </Text>

          <Text style={styles.subHeading}>Key Features</Text>
          <View style={styles.featureList}>
            <Text style={styles.featureItem}>🎯 Habit tracking to keep you on top of your goals</Text>
            <Text style={styles.featureItem}>🌟 Daily gratitude lists to focus on positivity</Text>
            <Text style={styles.featureItem}>📝 Free journaling and guided reflection exercises</Text>
            <Text style={styles.featureItem}>🎥 Expert videos to inspire and educate</Text>
            <Text style={styles.featureItem}>📅 A user-friendly calendar for better planning</Text>
            <Text style={styles.featureItem}>📊 Progress tracking: Log daily moods and receive AI-generated suggestions based on emotional trends</Text>
            <Text style={styles.featureItem}>🧠 24/7 Live Support: An AI therapist chatbot offering immediate, discrete emotional support</Text>
            <Text style={styles.featureItem}>👥 Community-driven forum: AI-powered sentiment analysis detects caregiver burnout and delivers personalized support recommendations</Text>
          </View>

          <Text style={styles.subHeading}>Our Mission</Text>
          <Text style={styles.text}>
            We believe that small, consistent actions can lead to significant life changes. Our mission
            is to empower individuals by providing tools and resources to create positive habits and 
            foster personal growth.
          </Text>

          <Text style={styles.subHeading}>Contact Us</Text>
          <Text style={styles.text}>
            If you have any questions, feedback, or suggestions, feel free to reach out to us at:{"\n"}
            <Text style={styles.email}>support@yourapp.com</Text>
          </Text>

          <Text style={styles.subHeading}>Positive Affirmations for Resilience</Text>
          <FlatList
            data={affirmations}
            keyExtractor={(item, index) => index.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.affirmationCard}>
                
                <Text style={styles.affirmationText}>{item}</Text>
              </View>
            )}
            onScroll={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
              setActiveIndex(index);
            }}
          />
          <View style={styles.dotContainer}>
            {affirmations.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === activeIndex ? styles.activeDot : null]}
              />
            ))}
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
  heading: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#fff',
    marginTop: 50,
  },
  subHeading: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
    color: '#fff',
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 10,
    color: '#fff',
  },
  featureList: {
    alignItems: 'flex-start',
    marginLeft: 20,
    marginBottom: 10,
  },
  featureItem: {
    fontSize: 16,
    lineHeight: 24,
    color: '#fff',
  },
  email: {
    fontSize: 16,
    textAlign: 'center',
    textDecorationLine: 'underline',
    color: '#fff',
  },
  affirmationCard: {
    width: screenWidth - 60,
    padding: 20,
    marginHorizontal: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  affirmationText: {
    fontSize: 18,
    fontStyle: 'italic',
    color: '#fff',
    textAlign: 'center',
  },
  dotContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#bbb',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#fff',
  },
});
