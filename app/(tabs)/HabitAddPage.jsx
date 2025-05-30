import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRoute, useNavigation } from '@react-navigation/native';
import { auth, db } from '../../config/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import * as Notifications from 'expo-notifications';
import withGradient from '../../components/withGradient';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const HabitAddPage = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { date } = route.params || {};
    const [user, loading, error] = useAuthState(auth);
    const [habit, setHabit] = useState('');
    const [smiley, setSmiley] = useState('🙂'); // Default smiley
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [time, setTime] = useState(new Date());
    const [repeat, setRepeat] = useState('None'); // Default repeat value
    const [endDate, setEndDate] = useState(null);
    const [isTimePickerVisible, setIsTimePickerVisible] = useState(false);
    const [isEndDatePickerVisible, setIsEndDatePickerVisible] = useState(false);
  
    const smileys = ['🙂', '😌', '😅', '😔', '😎', '😂', '😍', '🤔', '😴', '🤩'];
    const repeatOptions = ['None', 'Daily', 'Weekly', 'Monthly'];

    useEffect(() => {
        (async () => {
          const { status } = await Notifications.requestPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission Required', 'Please enable notifications in settings.');
          }
        })();
      }, []);

      const scheduleNotification = async (habitName, notificationTime, repeat) => {
        const trigger = new Date(notificationTime);
        
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Habit Reminder',
            body: `Time to complete your habit: ${habitName} ✅`,
            sound: 'default',
          },
          trigger: {
            hour: trigger.getHours(),
            minute: trigger.getMinutes(),
            repeats: repeat !== 'None',
          },
        });
      };

      const addHabit = async () => {
        if (!habit.trim()) {
          Alert.alert('Validation Error', 'Please enter a habit.');
          return;
        }
    
        if (repeat !== 'None' && !endDate) {
          Alert.alert('Validation Error', 'Please specify an end date for repeated habits.');
          return;
        }
    
        try {
          const habitsToAdd = [];
          const currentDate = new Date(date || new Date().toISOString().split('T')[0]);
          let nextDate = new Date(currentDate);
    
          while (repeat !== 'None' && endDate && nextDate <= endDate) {
            habitsToAdd.push({
              userId: user.uid,
              habit: habit.trim(),
              date: nextDate.toISOString().split('T')[0],
              smiley,
              time: time.toISOString(),
              repeat,
              endDate: endDate.toISOString(),
              createdAt: new Date(),
            });

            await scheduleNotification(habit, time, repeat);

        switch (repeat) {
          case 'Daily':
            nextDate.setDate(nextDate.getDate() + 1);
            break;
          case 'Weekly':
            nextDate.setDate(nextDate.getDate() + 7);
            break;
          case 'Monthly':
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
          default:
            break;
        }
      }

      if (repeat === 'None') {
        habitsToAdd.push({
          userId: user.uid,
          habit: habit.trim(),
          date: currentDate.toISOString().split('T')[0],
          smiley,
          time: time.toISOString(),
          repeat,
          endDate: null,
          createdAt: new Date(),
        });

        await scheduleNotification(habit, time, 'None');
      }
      await Promise.all(habitsToAdd.map((habitData) => addDoc(collection(db, 'habits'), habitData)));

      Alert.alert('Success', 'Habit(s) added successfully.');
      navigation.goBack();
    } catch (err) {
      console.error('Error adding habit(s): ', err);
      Alert.alert('Error', 'Failed to add habit(s).');
    }
  };

  const showDatePicker = (type) => {
    if (type === 'time') {
      setIsTimePickerVisible(true);
    } else if (type === 'endDate') {
      setIsEndDatePickerVisible(true);
    }
  };

  const handleDateChange = (event, selectedDate, type) => {
    if (type === 'time') {
      setIsTimePickerVisible(false);
      if (selectedDate) setTime(selectedDate);
    } else if (type === 'endDate') {
      setIsEndDatePickerVisible(false);
      if (selectedDate) setEndDate(selectedDate);
    }
  };


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Habit</Text>
      <Text style={styles.label}>Date: {date || 'Today'}</Text>

      {/* Habit Input */}
      <TextInput
        style={styles.input}
        placeholder="Enter your habit"
        value={habit}
        onChangeText={setHabit}
      />

      {/* Time Picker */}
      <TouchableOpacity style={styles.selectSmileyButton} onPress={() => showDatePicker('time')}>
        <Text style={styles.selectSmileyButtonText}>Time: {time.toLocaleTimeString()}</Text>
      </TouchableOpacity>
      {isTimePickerVisible && (
        <DateTimePicker
          value={time}
          mode="time"
          display="default"
          onChange={(event, selectedTime) => handleDateChange(event, selectedTime, 'time')}
        />
      )}

      {/* Repeat Picker */}
      <Text style={styles.label}>Repeat:</Text>
      <FlatList
        data={repeatOptions}
        keyExtractor={(item) => item}
        horizontal
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.repeatOption,
              repeat === item && styles.selectedRepeatOption,
            ]}
            onPress={() => setRepeat(item)}
          >
            <Text
              style={[
                styles.repeatOptionText,
                repeat === item && styles.selectedRepeatOptionText,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* End Date Picker */}
      <TouchableOpacity style={styles.endDateButton} onPress={() => showDatePicker('endDate')}>
        <Text style={styles.selectSmileyButtonText}>
          End Date: {endDate ? endDate.toLocaleDateString() : 'None'}
        </Text>
      </TouchableOpacity>
      {isEndDatePickerVisible && (
        <DateTimePicker
          value={endDate || new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => handleDateChange(event, selectedDate, 'endDate')}
        />
      )}

      {/* Smiley Picker */}
      <Text style={styles.label}>Selected Smiley: {smiley}</Text>
      <TouchableOpacity
        style={styles.selectSmileyButton}
        onPress={() => setIsModalVisible(true)}
      >
        <Text style={styles.selectSmileyButtonText}>Choose Smiley</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={addHabit} style={styles.button}>
        <Text style={styles.buttonText}>Add Habit</Text>
      </TouchableOpacity>

      {/* Smiley Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select a Smiley</Text>
            <FlatList
              data={smileys}
              keyExtractor={(item, index) => index.toString()}
              numColumns={5}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.smileyButton}
                  onPress={() => {
                    setSmiley(item);
                    setIsModalVisible(false);
                  }}
                >
                  <Text style={styles.smileyText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    color: '#567396',
    marginBottom: 20,
    fontWeight: 'bold',
    marginTop: 50,
  },
  label: {
    fontSize: 18,
    color: '#333',
    marginBottom: 10,
  },
  input: {
    width: '100%',
    padding: 15,
    borderWidth: 1,
    borderColor: '#567396',
    borderRadius: 10,
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  endDateButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginBottom: 20,
  },
  selectSmileyButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginBottom: 20,
  },
  selectSmileyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#28a745',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    width: '100%',
    marginBottom: '100'
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  smileyButton: {
    padding: 10,
    margin: 5,
    alignItems: 'center',
  },
  smileyText: {
    fontSize: 24,
  },
  repeatOption: {
    padding: 10,
    margin: 5,
    borderWidth: 1,
    borderColor: '#567396',
    borderRadius: 5,
    height: 60,
  },
  selectedRepeatOption: {
    backgroundColor: '#567396',
    height: 60
  },
  repeatOptionText: {
    color: '#333',
    fontSize: 16,
  },
  selectedRepeatOptionText: {
    color: '#fff',
  },
});

export default withGradient(HabitAddPage);
