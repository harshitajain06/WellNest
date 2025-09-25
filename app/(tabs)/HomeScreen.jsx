// src/tabs/HomeScreen.jsx
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { collection, getDocs, query, where } from "firebase/firestore";
import React, { useCallback, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
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
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import withGradient from '../../components/withGradient';
import { auth, db } from "../../config/firebase";

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

const HomeScreen = () => {
  const navigation = useNavigation();
  const [user, loading, error] = useAuthState(auth);
  const [habits, setHabits] = useState([]);
  const [markedDates, setMarkedDates] = useState({});
  const [loadingHabits, setLoadingHabits] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [habitsForSelectedDate, setHabitsForSelectedDate] = useState([]);
  const [todayHabitsCount, setTodayHabitsCount] = useState(0);
  const [totalHabitsCount, setTotalHabitsCount] = useState(0);

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    return 'Evening';
  };

  useFocusEffect(
    useCallback(() => {
      if (user) fetchHabits();
    }, [user])
  );

  const fetchHabits = async () => {
    setLoadingHabits(true);
    try {
      const q = query(
        collection(db, "habits"),
        where("userId", "==", user.uid)
      );
      const querySnapshot = await getDocs(q);
      const habitsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setHabits(habitsData);
      setTotalHabitsCount(habitsData.length);
      
      // Count today's habits
      const today = new Date().toISOString().split("T")[0];
      const todayHabits = habitsData.filter(habit => habit.date === today);
      setTodayHabitsCount(todayHabits.length);
      
      markHabitDates(habitsData);
    } catch (err) {
      console.error("Error fetching habits: ", err);
      Alert.alert("Error", "Failed to fetch habits.");
    } finally {
      setLoadingHabits(false);
    }
  };

  const markHabitDates = (habitsData) => {
    const dateCounts = {};
    habitsData.forEach((habit) => {
      if (habit.date) {
        dateCounts[habit.date] = (dateCounts[habit.date] || 0) + 1;
      }
    });

    const marks = {};
    Object.keys(dateCounts).forEach((date) => {
      const count = dateCounts[date];
      const dots = [];
      if (count >= 1) dots.push({ color: "#ADD8E6" });
      if (count >= 2) dots.push({ color: "#90EE90" });
      if (count >= 3) dots.push({ color: "#F08080" });
      marks[date] = { dots };
    });

    setMarkedDates(marks);
  };

  const onDayPress = (day) => {
    setSelectedDate(day.dateString);
    fetchHabitsForDate(day.dateString);
    setModalVisible(true);
  };

  const fetchHabitsForDate = async (date) => {
    try {
      const q = query(
        collection(db, "habits"),
        where("userId", "==", user.uid),
        where("date", "==", date)
      );
      const querySnapshot = await getDocs(q);
      const habitsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setHabitsForSelectedDate(habitsData);
    } catch (err) {
      console.error("Error fetching habits for date: ", err);
      Alert.alert("Error", "Failed to fetch habits for the selected date.");
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setHabitsForSelectedDate([]);
    setSelectedDate("");
  };

  const renderHabit = ({ item }) => {
    const formattedTime = item.time
      ? new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : "Not specified";
  
    const formattedEndDate = item.endDate
      ? new Date(item.endDate).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })
      : "No end date";
  
    return (
      <View style={styles.habitCard}>
        <View style={styles.habitHeader}>
          <Text style={styles.habitEmoji}>{item.smiley || "🙂"}</Text>
          <View style={styles.habitInfo}>
            <Text style={styles.habitTitle}>{item.habit}</Text>
            <Text style={styles.habitTime}>⏰ {formattedTime}</Text>
          </View>
        </View>
        <View style={styles.habitDetails}>
          <View style={styles.habitDetailRow}>
            <Ionicons name="repeat-outline" size={16} color="#666" />
            <Text style={styles.habitDetailText}>{item.repeat || "No repeat"}</Text>
          </View>
          <View style={styles.habitDetailRow}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.habitDetailText}>{formattedEndDate}</Text>
          </View>
        </View>
      </View>
    );
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
      bounces={true}
      alwaysBounceVertical={false}
      keyboardShouldPersistTaps="handled"
      {...(isWeb && {
        contentContainerStyle: styles.webScrollContent,
        style: [styles.container, styles.webScrollView]
      })}
    >
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Good {getTimeOfDay()}</Text>
            <Text style={styles.userName}>{user?.displayName || user?.email?.split('@')[0] || 'User'}</Text>
          </View>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="today-outline" size={24} color="#4F2780" />
          </View>
          <Text style={styles.statNumber}>{todayHabitsCount}</Text>
          <Text style={styles.statLabel}>Today's Habits</Text>
        </View>
        
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="checkmark-circle-outline" size={24} color="#4F2780" />
          </View>
          <Text style={styles.statNumber}>{totalHabitsCount}</Text>
          <Text style={styles.statLabel}>Total Habits</Text>
        </View>
      </View>

      {/* Calendar Section */}
      <View style={styles.calendarSection}>
        <Text style={styles.sectionTitle}>📅 Your Progress Calendar</Text>
        <View style={styles.calendarContainer}>
          <Calendar
            onDayPress={onDayPress}
            markedDates={{
              ...markedDates,
              [selectedDate]: {
                selected: true,
                selectedColor: "#4F2780",
                dots: markedDates[selectedDate]?.dots || [],
              },
              [new Date().toISOString().split("T")[0]]: {
                ...(markedDates[new Date().toISOString().split("T")[0]] || {}),
                today: true,
                selected: true,
                selectedColor: "#FFD700",
                dots: markedDates[new Date().toISOString().split("T")[0]]?.dots || [],
              },
            }}
            markingType={"multi-dot"}
            style={styles.calendar}
            theme={{
              selectedDayBackgroundColor: "#4F2780",
              todayTextColor: "#FF6347",
              arrowColor: "#4F2780",
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
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>📋 Habits for {selectedDate}</Text>
            <TouchableOpacity onPress={closeModal} style={styles.closeIconButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          {habitsForSelectedDate.length > 0 ? (
            <FlatList
              data={habitsForSelectedDate}
              keyExtractor={(item) => item.id}
              renderItem={renderHabit}
              contentContainerStyle={styles.habitList}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#ccc" />
              <Text style={styles.noHabitsText}>No habits for this date</Text>
              <Text style={styles.noHabitsSubtext}>Tap on a day with habits to see details</Text>
            </View>
          )}
        </View>
      </Modal>
      
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
  webScrollView: {
    height: '100vh',
    overflow: 'auto',
  },
  webScrollContent: {
    minHeight: '100vh',
    paddingBottom: 80,
    flexGrow: 1,
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
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  userName: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: -15,
    marginBottom: 20,
    gap: 15,
    ...(isWeb && {
      maxWidth: 600,
      alignSelf: 'center',
      width: '100%',
    }),
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(79, 39, 128, 0.1)',
    ...(isWeb && {
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      ':hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)',
      },
    }),
  },
  statIcon: {
    backgroundColor: 'rgba(79, 39, 128, 0.1)',
    padding: 12,
    borderRadius: 20,
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4F2780',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
  calendarSection: {
    paddingHorizontal: 20,
    marginBottom: 40,
    ...(isWeb && {
      maxWidth: 800,
      alignSelf: 'center',
      width: '100%',
      marginBottom: 60,
    }),
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4F2780',
    marginBottom: 15,
    textAlign: 'center',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    maxHeight: "70%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    color: "#4F2780",
    fontWeight: "bold",
    flex: 1,
  },
  closeIconButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  habitList: {
    paddingBottom: 20,
  },
  habitCard: {
    backgroundColor: "#f8f9ff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(79, 39, 128, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  habitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  habitEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  habitInfo: {
    flex: 1,
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: "#4F2780",
    marginBottom: 4,
  },
  habitTime: {
    fontSize: 14,
    color: "#666",
  },
  habitDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  habitDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  habitDetailText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noHabitsText: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
    marginTop: 16,
    fontWeight: '600',
  },
  noHabitsSubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginTop: 8,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 18,
    color: "#ff0000",
    textAlign: "center",
  },
});

export default withGradient(HomeScreen);
