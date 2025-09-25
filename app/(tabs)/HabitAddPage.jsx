import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { addDoc, collection } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import withGradient from '../../components/withGradient';
import { auth, db } from '../../config/firebase';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

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
    const [isAdding, setIsAdding] = useState(false);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
  
    const smileys = ['🙂', '😌', '😅', '😔', '😎', '😂', '😍', '🤔', '😴', '🤩'];
    const repeatOptions = ['None', 'Daily', 'Weekly', 'Monthly'];

    // Validation functions
    const validateHabit = (habitValue) => {
      if (!habitValue || !habitValue.trim()) {
        return 'Habit name is required';
      }
      if (habitValue.trim().length < 3) {
        return 'Habit name must be at least 3 characters long';
      }
      if (habitValue.trim().length > 100) {
        return 'Habit name must be less than 100 characters';
      }
      return null;
    };

    const validateEndDate = (endDateValue, repeatValue) => {
      if (repeatValue !== 'None' && !endDateValue) {
        return 'End date is required for repeated habits';
      }
      if (endDateValue && repeatValue !== 'None') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDate = new Date(endDateValue);
        selectedDate.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
          return 'End date cannot be in the past';
        }
        
        const maxDate = new Date();
        maxDate.setFullYear(maxDate.getFullYear() + 2);
        if (selectedDate > maxDate) {
          return 'End date cannot be more than 2 years in the future';
        }
      }
      return null;
    };

    const validateTime = (timeValue) => {
      if (!timeValue) {
        return 'Time is required';
      }
      return null;
    };

    const validateForm = () => {
      const newErrors = {};
      
      // Validate habit name
      const habitError = validateHabit(habit);
      if (habitError) newErrors.habit = habitError;
      
      // Validate end date
      const endDateError = validateEndDate(endDate, repeat);
      if (endDateError) newErrors.endDate = endDateError;
      
      // Validate time
      const timeError = validateTime(time);
      if (timeError) newErrors.time = timeError;
      
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleFieldBlur = (fieldName) => {
      setTouched(prev => ({ ...prev, [fieldName]: true }));
      
      // Validate specific field
      let error = null;
      switch (fieldName) {
        case 'habit':
          error = validateHabit(habit);
          break;
        case 'endDate':
          error = validateEndDate(endDate, repeat);
          break;
        case 'time':
          error = validateTime(time);
          break;
      }
      
      if (error) {
        setErrors(prev => ({ ...prev, [fieldName]: error }));
      } else {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[fieldName];
          return newErrors;
        });
      }
    };

    const handleFieldChange = (fieldName, value) => {
      // Clear error when user starts typing
      if (errors[fieldName]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[fieldName];
          return newErrors;
        });
      }
    };

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
        // Mark all fields as touched to show validation errors
        setTouched({
          habit: true,
          endDate: true,
          time: true,
        });

        // Validate form
        if (!validateForm()) {
          Alert.alert('Validation Error', 'Please fix the errors below before submitting.');
          return;
        }

        if (!user) {
          Alert.alert('Authentication Error', 'Please log in to add habits.');
          return;
        }
    
        setIsAdding(true);
    
        try {
          const habitsToAdd = [];
          const currentDate = new Date(date || new Date().toISOString().split('T')[0]);
          let nextDate = new Date(currentDate);
    
          // Handle repeated habits
          if (repeat !== 'None' && endDate) {
            while (nextDate <= endDate) {
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

              // Update nextDate based on repeat frequency
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
          } else {
            // Handle single habit
            habitsToAdd.push({
              userId: user.uid,
              habit: habit.trim(),
              date: currentDate.toISOString().split('T')[0],
              smiley,
              time: time.toISOString(),
              repeat,
              endDate: endDate ? endDate.toISOString() : null,
              createdAt: new Date(),
            });
          }

          // Add all habits to Firestore
          await Promise.all(habitsToAdd.map((habitData) => addDoc(collection(db, 'habits'), habitData)));

          // Schedule notification for the first habit only
          if (habitsToAdd.length > 0) {
            try {
              await scheduleNotification(habit, time, repeat);
            } catch (notificationError) {
              console.warn('Notification scheduling failed:', notificationError);
              // Don't fail the entire operation if notification fails
            }
          }

          // Show success modal
          setSuccessMessage(`Habit${habitsToAdd.length > 1 ? 's' : ''} added successfully!`);
          setShowSuccessModal(true);
        } catch (err) {
          console.error('Error adding habit(s): ', err);
          Alert.alert('Error', `Failed to add habit(s): ${err.message || 'Unknown error'}`);
        } finally {
          setIsAdding(false);
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


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F2780" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error.message}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.errorButton}>
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
        alwaysBounceVertical={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>✨ Add New Habit</Text>
          <Text style={styles.subtitle}>Build better habits, one day at a time</Text>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
        {/* Date Display */}
        <View style={styles.dateCard}>
          <Text style={styles.dateLabel}>📅 Selected Date</Text>
          <Text style={styles.dateText}>{date ? new Date(date).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }) : 'Today'}</Text>
        </View>

        {/* Habit Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>🎯 What's your habit?</Text>
          <TextInput
            style={[
              styles.input,
              touched.habit && errors.habit && styles.inputError
            ]}
            placeholder="e.g., Drink 8 glasses of water"
            value={habit}
            onChangeText={(text) => {
              setHabit(text);
              handleFieldChange('habit', text);
            }}
            onBlur={() => handleFieldBlur('habit')}
            multiline
            {...(isWeb && {
              autoComplete: 'off',
              spellCheck: false,
            })}
          />
          <View style={styles.inputFooter}>
            {touched.habit && errors.habit ? (
              <Text style={styles.errorText}>{errors.habit}</Text>
            ) : (
              <Text style={styles.characterCount}>
                {habit.length}/100 characters
              </Text>
            )}
          </View>
        </View>

        {/* Time Picker */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>⏰ What time?</Text>
          {isWeb ? (
            <View style={[
              styles.webTimeContainer,
              touched.time && errors.time && styles.inputError
            ]}>
              <input
                type="time"
                value={time.toTimeString().slice(0, 5)}
                onChange={(e) => {
                  const [hours, minutes] = e.target.value.split(':');
                  const newTime = new Date(time);
                  newTime.setHours(parseInt(hours), parseInt(minutes));
                  setTime(newTime);
                  handleFieldChange('time', newTime);
                }}
                onBlur={() => handleFieldBlur('time')}
                style={styles.webTimeInput}
              />
              
            </View>
          ) : (
            <>
              <TouchableOpacity 
                style={[
                  styles.pickerButton,
                  touched.time && errors.time && styles.inputError
                ]} 
                onPress={() => showDatePicker('time')}
              >
                <Text style={styles.pickerButtonText}>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                <Ionicons name="time-outline" size={24} color="#4F2780" style={styles.pickerIcon} />
              </TouchableOpacity>
              {isTimePickerVisible && (
                <DateTimePicker
                  value={time}
                  mode="time"
                  display="default"
                  onChange={(event, selectedTime) => {
                    handleDateChange(event, selectedTime, 'time');
                    if (selectedTime) {
                      handleFieldChange('time', selectedTime);
                    }
                  }}
                />
              )}
            </>
          )}
          {touched.time && errors.time && (
            <Text style={styles.errorText}>{errors.time}</Text>
          )}
        </View>

        {/* Repeat Picker */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>🔄 How often?</Text>
          <View style={styles.repeatContainer}>
            {repeatOptions.map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.repeatOption,
                  repeat === item && styles.selectedRepeatOption,
                ]}
                onPress={() => {
                  setRepeat(item);
                  // Clear end date error when changing repeat option
                  if (errors.endDate) {
                    setErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.endDate;
                      return newErrors;
                    });
                  }
                }}
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
            ))}
          </View>
        </View>

        {/* End Date Picker */}
        {repeat !== 'None' && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>📅 Until when?</Text>
            {isWeb ? (
              <View style={[
                styles.webDateContainer,
                touched.endDate && errors.endDate && styles.inputError
              ]}>
                <input
                  type="date"
                  value={endDate ? endDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    if (e.target.value) {
                      const newDate = new Date(e.target.value);
                      setEndDate(newDate);
                      handleFieldChange('endDate', newDate);
                    } else {
                      setEndDate(null);
                      handleFieldChange('endDate', null);
                    }
                  }}
                  onBlur={() => handleFieldBlur('endDate')}
                  style={styles.webDateInput}
                />
               
              </View>
            ) : (
              <>
                <TouchableOpacity 
                  style={[
                    styles.pickerButton,
                    touched.endDate && errors.endDate && styles.inputError
                  ]} 
                  onPress={() => showDatePicker('endDate')}
                >
                  <Text style={styles.pickerButtonText}>
                    {endDate ? endDate.toLocaleDateString() : 'Select end date'}
                  </Text>
                  <Ionicons name="calendar-outline" size={24} color="#4F2780" style={styles.pickerIcon} />
                </TouchableOpacity>
                {isEndDatePickerVisible && (
                  <DateTimePicker
                    value={endDate || new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      handleDateChange(event, selectedDate, 'endDate');
                      if (selectedDate) {
                        handleFieldChange('endDate', selectedDate);
                      }
                    }}
                  />
                )}
              </>
            )}
            {touched.endDate && errors.endDate && (
              <Text style={styles.errorText}>{errors.endDate}</Text>
            )}
          </View>
        )}

        {/* Smiley Picker */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>😊 How do you feel about this habit?</Text>
          <TouchableOpacity
            style={styles.smileySelector}
            onPress={() => setIsModalVisible(true)}
          >
            <Text style={styles.smileyDisplay}>{smiley}</Text>
            <Text style={styles.smileyLabel}>Tap to change</Text>
          </TouchableOpacity>
        </View>

        {/* Add Button */}
        <TouchableOpacity 
          onPress={addHabit} 
          style={[styles.button, isAdding && styles.buttonDisabled]}
          disabled={isAdding}
          {...(isWeb && {
            onKeyPress: (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                addHabit();
              }
            },
            tabIndex: 0,
          })}
        >
          {isAdding ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Add Habit</Text>
          )}
        </TouchableOpacity>

        {/* Extra spacing to ensure scrollability */}
        <View style={styles.extraSpacing} />
        </View>
      </ScrollView>

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

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successModal}>
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={64} color="#4F2780" />
            </View>
            <Text style={styles.successTitle}>Success!</Text>
            <Text style={styles.successMessage}>{successMessage}</Text>
            <TouchableOpacity
              style={styles.successButton}
              onPress={() => {
                setShowSuccessModal(false);
                navigation.goBack();
              }}
            >
              <Text style={styles.successButtonText}>View Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    ...(isWeb && {
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
    }),
  },
  scrollView: {
    flex: 1,
    ...(isWeb && {
      height: '100%',
      maxHeight: '100vh',
    }),
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
    ...(isWeb && {
      maxWidth: 600,
      width: '100%',
      alignSelf: 'center',
      paddingHorizontal: screenWidth > 768 ? 40 : 20,
      minHeight: '100%',
    }),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#4F2780',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'transparent',
  },
  errorText: {
    fontSize: 18,
    color: '#ff4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorButton: {
    backgroundColor: '#4F2780',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: 'rgba(79, 39, 128, 0.9)',
    paddingTop: isWeb ? 30 : 50,
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
    ...(isWeb && {
      marginBottom: 20,
      borderRadius: 20,
    }),
  },
  title: {
    fontSize: isWeb ? 28 : 32,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    ...(isWeb && {
      textAlign: 'center',
    }),
  },
  subtitle: {
    fontSize: isWeb ? 14 : 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    textAlign: 'center',
    ...(isWeb && {
      maxWidth: 400,
    }),
  },
  formSection: {
    padding: isWeb ? 30 : 20,
    flex: 1,
    ...(isWeb && {
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderRadius: 20,
      margin: 20,
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    }),
  },
  dateCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dateLabel: {
    fontSize: 14,
    color: '#4F2780',
    fontWeight: '600',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 18,
    color: '#333',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    color: '#4F2780',
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(79, 39, 128, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 50,
    ...(isWeb && {
      outlineStyle: 'none',
      transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
      ':focus': {
        borderColor: '#4F2780',
        boxShadow: '0 0 0 3px rgba(79, 39, 128, 0.1)',
      },
    }),
  },
  pickerButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    paddingRight: 50, // Add extra padding for icon
    borderWidth: 1,
    borderColor: 'rgba(79, 39, 128, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
    minHeight: 56, // Ensure consistent height
    ...(isWeb && {
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      ':hover': {
        borderColor: '#4F2780',
        backgroundColor: 'rgba(79, 39, 128, 0.05)',
      },
    }),
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  repeatContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    ...(isWeb && {
      justifyContent: 'flex-start',
    }),
  },
  repeatOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(79, 39, 128, 0.3)',
    backgroundColor: 'rgba(255,255,255,0.8)',
    minWidth: 80,
    alignItems: 'center',
    ...(isWeb && {
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      ':hover': {
        borderColor: '#4F2780',
        backgroundColor: 'rgba(79, 39, 128, 0.1)',
      },
    }),
  },
  selectedRepeatOption: {
    backgroundColor: '#4F2780',
    borderColor: '#4F2780',
  },
  repeatOptionText: {
    fontSize: 14,
    color: '#4F2780',
    fontWeight: '600',
  },
  selectedRepeatOptionText: {
    color: '#fff',
  },
  smileySelector: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(79, 39, 128, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    ...(isWeb && {
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      ':hover': {
        borderColor: '#4F2780',
        backgroundColor: 'rgba(79, 39, 128, 0.05)',
        transform: 'translateY(-2px)',
      },
    }),
  },
  smileyDisplay: {
    fontSize: 48,
    marginBottom: 8,
  },
  smileyLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#4F2780',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: isWeb ? 20 : 40,
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
      ':active': {
        transform: 'translateY(0)',
      },
    }),
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0.1,
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
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    ...(isWeb && {
      maxWidth: 500,
      maxHeight: '80vh',
      overflow: 'auto',
    }),
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#4F2780',
  },
  smileyButton: {
    padding: 12,
    margin: 4,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(79, 39, 128, 0.1)',
    ...(isWeb && {
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      ':hover': {
        backgroundColor: 'rgba(79, 39, 128, 0.2)',
        transform: 'scale(1.1)',
      },
    }),
  },
  smileyText: {
    fontSize: 28,
  },
  extraSpacing: {
    height: 100,
    ...(isWeb && {
      height: 50,
    }),
  },
  webTimeContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    paddingRight: 50, // Add extra padding for icon
    borderWidth: 1,
    borderColor: 'rgba(79, 39, 128, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
    minHeight: 56, // Ensure consistent height
  },
  webTimeInput: {
    width: '100%',
    padding: 12,
    fontSize: 16,
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    color: '#333',
    fontFamily: 'inherit',
  },
  webDateContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    paddingRight: 50, // Add extra padding for icon
    borderWidth: 1,
    borderColor: 'rgba(79, 39, 128, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
    minHeight: 56, // Ensure consistent height
  },
  webDateInput: {
    width: '100%',
    padding: 12,
    fontSize: 16,
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    color: '#333',
    fontFamily: 'inherit',
  },
  inputError: {
    borderColor: '#ff4444',
    borderWidth: 2,
    ...(isWeb && {
      boxShadow: '0 0 0 3px rgba(255, 68, 68, 0.1)',
    }),
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    marginTop: 8,
    fontWeight: '500',
    ...(isWeb && {
      marginLeft: 4,
    }),
  },
  inputFooter: {
    marginTop: 8,
  },
  characterCount: {
    color: '#666',
    fontSize: 12,
    textAlign: 'right',
    fontWeight: '500',
    ...(isWeb && {
      marginRight: 4,
    }),
  },
  pickerIcon: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -12 }], // Half of icon height (24px)
    zIndex: 1,
    ...(isWeb && {
      transform: 'translateY(-12px)',
      pointerEvents: 'none',
    }),
  },
  successModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 350,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    ...(isWeb && {
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
    }),
  },
  successIconContainer: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4F2780',
    marginBottom: 10,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  successButton: {
    backgroundColor: '#4F2780',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    minWidth: 150,
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
  successButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default withGradient(HabitAddPage);
