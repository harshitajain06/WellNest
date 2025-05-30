import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '../../constants/Colors';
import withGradient from '../../components/withGradient';

const JournalPage = ({ navigation }) => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Journaling</Text>

      <View style={styles.buttonContainer}>
        {/* Journaling Options */}
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('GratitudeList')}>
          <Text style={styles.buttonText}>Gratitude List</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('TodaysGoals')}>
          <Text style={styles.buttonText}>Today's Goals</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('DailyReflection')}>
          <Text style={styles.buttonText}>Daily Reflection</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('FreeJournaling')}>
          <Text style={styles.buttonText}>Free Journaling</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('ABCDEMethod')}>
          <Text style={styles.buttonText}>ABCDE Method</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#567396',
    marginTop: 50,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    width: '90%', // Full width with some padding
    paddingVertical: 20, // Increased height
    backgroundColor: Colors.light.tint,
    borderRadius: 10, // Slightly rounded corners
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15, // Spacing between buttons
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
});

export default withGradient(JournalPage);
