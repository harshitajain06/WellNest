// src/tabs/CalendarPage.jsx
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { collection, getDocs, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import withGradient from '../../components/withGradient';
import { auth, db } from '../../config/firebase';

const isWeb = Platform.OS === 'web';

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
    navigation.getParent()?.navigate('HabitAddPage', { date: day.dateString });
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
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      {...(isWeb && {
        contentContainerStyle: styles.webScrollContent
      })}
    >
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.title}>📅 Calendar</Text>
        <Text style={styles.subtitle}>Track your habits and progress</Text>
      </View>

      {/* Calendar Section */}
      <View style={styles.calendarSection}>
        <View style={styles.calendarContainer}>
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
              selectedDayBackgroundColor: '#4F2780',
              todayTextColor: '#FF6347',
              arrowColor: '#4F2780',
              backgroundColor: 'rgba(255,255,255,0.9)',
              calendarBackground: 'rgba(255,255,255,0.9)',
              textSectionTitleColor: '#4F2780',
              dayTextColor: '#333',
              textDisabledColor: '#ccc',
              monthTextColor: '#4F2780',
              indicatorColor: '#4F2780',
              textDayFontWeight: '600',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: '600',
            }}
          />
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.getParent()?.navigate('HabitAddPage')}
        >
          <Ionicons name="add-circle" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Add New Habit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.quickAddButton}
          onPress={() => navigation.getParent()?.navigate('HabitAddPage', { date: new Date().toISOString().split('T')[0] })}
        >
          <Ionicons name="today" size={20} color="#4F2780" />
          <Text style={styles.quickAddButtonText}>Add for Today</Text>
        </TouchableOpacity>
      </View>

      {/* Legend */}
      <View style={styles.legendSection}>
        <Text style={styles.legendTitle}>Legend</Text>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#007BFF' }]} />
          <Text style={styles.legendText}>Habits completed</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FFD700' }]} />
          <Text style={styles.legendText}>Today</Text>
        </View>
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
    paddingBottom: 80,
  },
  extraSpacing: {
    height: 150,
    ...(isWeb && {
      height: 100,
    }),
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
  calendarSection: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    ...(isWeb && {
      maxWidth: 800,
      alignSelf: 'center',
      width: '100%',
    }),
  },
  calendarContainer: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    ...(isWeb && {
      transition: 'all 0.2s ease',
      ':hover': {
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
      },
    }),
  },
  calendar: {
    borderRadius: 15,
  },
  actionSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
    ...(isWeb && {
      maxWidth: 600,
      alignSelf: 'center',
      width: '100%',
    }),
  },
  addButton: {
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
    ...(isWeb && {
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      ':hover': {
        backgroundColor: '#3a1f5c',
        transform: 'translateY(-2px)',
        boxShadow: '0 6px 20px rgba(79, 39, 128, 0.3)',
      },
    }),
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  quickAddButton: {
    backgroundColor: 'rgba(79, 39, 128, 0.1)',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(79, 39, 128, 0.3)',
    ...(isWeb && {
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      ':hover': {
        backgroundColor: 'rgba(79, 39, 128, 0.2)',
        borderColor: 'rgba(79, 39, 128, 0.5)',
        transform: 'translateY(-1px)',
      },
    }),
  },
  quickAddButtonText: {
    color: '#4F2780',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  legendSection: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    marginHorizontal: 20,
    marginBottom: 50,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    ...(isWeb && {
      marginBottom: 70,
    }),
  },
  legendTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4F2780',
    marginBottom: 12,
    textAlign: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  legendText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 18,
    textAlign: 'center',
  },
});

export default withGradient(CalendarPage);
