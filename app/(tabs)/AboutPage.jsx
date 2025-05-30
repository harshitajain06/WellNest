import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function AboutPage() {
  return (
    <LinearGradient
      colors={['#4F2780', '#D3C5E5']}
      style={styles.gradient}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.heading}>About WellNest</Text>
          <Text style={styles.text}>
            WellNest aims to create a safe, compassionate, and intelligent space for caregivers to nurture their own mental health. By combining ethical AI, guided self-reflection, and professional psychological resources, we strive to offer caregivers the recognition and care they deserve—because supporting others shouldn’t come at the cost of your own well-being.
Whether you're caring for a loved one, a patient, or someone in need, WellNest is your space to recharge, reflect, and find strength. Because your well-being matters, too.
          </Text>

          <Text style={styles.subHeading}>Key Features</Text>
          <View style={styles.featureList}>
            <Text style={styles.featureItem}>
              🎯 Habit tracking to keep you on top of your goals
            </Text>
            <Text style={styles.featureItem}>
              🌟 Daily gratitude lists to focus on positivity
            </Text>
            <Text style={styles.featureItem}>
              📝 Free journaling and guided reflection exercises
            </Text>
            <Text style={styles.featureItem}>
              🎥 Expert videos to inspire and educate
            </Text>
            <Text style={styles.featureItem}>
              📅 A user-friendly calendar for better planning
            </Text>
          </View>

          <Text style={styles.subHeading}>Our Mission</Text>
          <Text style={styles.text}>
            We believe that small, consistent actions can lead to significant life changes. Our mission
            is to empower individuals by providing tools and resources to create positive habits and 
            foster personal growth.
          </Text>

          <Text style={styles.subHeading}>Contact Us</Text>
          <Text style={styles.text}>
            If you have any questions, feedback, or suggestions, feel free to reach out to us at:{'\n'}
            <Text style={styles.email}>support@yourapp.com</Text>
          </Text>
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
});
