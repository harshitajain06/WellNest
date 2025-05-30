// src/tabs/HomeScreen.jsx
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Modal,
  FlatList,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { db, auth } from "../../config/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { signOut } from "firebase/auth";
import { Ionicons } from "@expo/vector-icons";
import withGradient from '../../components/withGradient';

const HomeScreen = () => {
  const navigation = useNavigation();
  const [user, loading, error] = useAuthState(auth);
  const [habits, setHabits] = useState([]);
  const [markedDates, setMarkedDates] = useState({});
  const [loadingHabits, setLoadingHabits] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [habitsForSelectedDate, setHabitsForSelectedDate] = useState([]);

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
      ? new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      : "Not specified";
  
    const formattedEndDate = item.endDate
      ? new Date(item.endDate).toLocaleDateString([], { day: '2-digit', month: 'long', year: 'numeric' })
      : "No end date";
  
    return (
      <View style={styles.habitItem}>
        <Text style={styles.habitText}>Habit: {item.habit}</Text>
        <Text style={styles.habitDetail}>Time: {formattedTime}</Text>
        <Text style={styles.habitDetail}>Repeat: {item.repeat || "No repeat"}</Text>
        <Text style={styles.habitDetail}>End Date: {formattedEndDate}</Text>
        <Text style={styles.habitDetail}>Smiley: {item.smiley || "🙂"}</Text>
      </View>
    );
  };
  

  const handleLogout = () => {
    Alert.alert("Confirm Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => {
          signOut(auth)
            .then(() => navigation.replace("Login"))
            .catch((err) => {
              console.error("Logout Error:", err);
              Alert.alert("Error", "Failed to logout.");
            });
        },
      },
    ]);
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
      <View style={styles.header}>
        <Text style={styles.title}>Welcome</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color="#007BFF" />
        </TouchableOpacity>
      </View>
      <Calendar
        onDayPress={onDayPress}
        markedDates={{
          ...markedDates,
          [selectedDate]: {
            selected: true,
            selectedColor: "#007BFF",
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
          selectedDayBackgroundColor: "#007BFF",
          todayTextColor: "#FF6347",
          arrowColor: "#007BFF",
        }}
      />
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
          <Text style={styles.modalTitle}>Habits for {selectedDate}</Text>
          {habitsForSelectedDate.length > 0 ? (
            <FlatList
              data={habitsForSelectedDate}
              keyExtractor={(item) => item.id}
              renderItem={renderHabit}
              contentContainerStyle={styles.habitList}
            />
          ) : (
            <Text style={styles.noHabitsText}>No habits for this date.</Text>
          )}
          <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 50,
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    color: '#567396',
    fontWeight: 'bold',
  },
  logoutButton: { padding: 10 },
  calendar: { width: "80%", borderRadius: 10, marginBottom: 20 },
  modalOverlay: { flex: 1, backgroundColor: "#000000aa" },
  modalContainer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    maxHeight: "60%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 24,
    color: "#567396",
    marginBottom: 15,
    textAlign: "center",
    fontWeight: "bold",
  },
  habitList: { paddingBottom: 20 },
  habitItem: {
    padding: 15,
    backgroundColor: "#F0F8FF",
    borderRadius: 10,
    marginBottom: 10,
  },
  habitText: { fontSize: 18, color: "#333" },
  habitDetail: { fontSize: 16, color: "#555", marginTop: 5 },
  noHabitsText: { fontSize: 16, color: "#666", textAlign: "center", marginBottom: 20 },
  closeButton: {
    backgroundColor: "#007BFF",
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 15,
  },
  closeButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { fontSize: 18, color: "#ff0000", textAlign: "center" },
});

export default withGradient(HomeScreen);
