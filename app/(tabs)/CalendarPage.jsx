// src/tabs/CalendarPage.jsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useNavigation } from '@react-navigation/native';
import { db, auth } from '../../config/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import withGradient from '../../components/withGradient';

const CalendarPage = () => {
  const navigation = useNavigation();
  const [user, loading, error] = useAuthState(auth);
  const [markedDates, setMarkedDates] = useState({});
  const [loadingHabits, setLoadingHabits] = useState(true);

  useEffect(() => {
    if (user) {
      fetchHabits();
    }
  }, [user]);

  const fetchHabits = async () => {
    try {
      const q = query(
        collection(db, 'habits'),
        where('userId', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
      const dates = {};
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.date) {
          if (dates[data.date]) {
            // Initialize 'dots' array if it doesn't exist
            if (!Array.isArray(dates[data.date].dots)) {
              dates[data.date].dots = [];
            }
            // Push a new dot
            dates[data.date].dots.push({ color: '#007BFF' });
          } else {
            dates[data.date] = {
              dots: [{ color: '#007BFF' }],
            };
          }
        }
      });
      setMarkedDates(dates);
    } catch (err) {
      console.error('Error fetching habits: ', err);
      Alert.alert('Error', 'Failed to load calendar data.');
    } finally {
      setLoadingHabits(false);
    }
  };

  const onDayPress = (day) => {
    navigation.navigate('HabitAddPage', { date: day.dateString });
  };

  if (loading || loadingHabits) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error.message}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Calendar</Text>
      <Calendar
        onDayPress={onDayPress}
        markedDates={{
          ...markedDates,
          [new Date().toISOString().split('T')[0]]: {
            ...(markedDates[new Date().toISOString().split('T')[0]] || {}),
            today: true,
            marked: true,
            dotColor: '#FFD700', // Gold color for today
          },
        }}
        markingType={'multi-dot'}
        style={styles.calendar}
        theme={{
          selectedDayBackgroundColor: '#007BFF',
          todayTextColor: '#FF6347',
          arrowColor: '#007BFF',
        }}
      />
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('HabitAddPage')}
      >
        <Text style={styles.addButtonText}>Add New Habit</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    paddingTop: 50,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    color: '#567396',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  calendar: {
    width: '100%',
    borderRadius: 10,
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#28a745',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    width: '60%',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    fontSize: 18,
  },
});

export default withGradient(CalendarPage);
