// src/navigation/StackLayout.jsx
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { signOut } from 'firebase/auth';
import React, { useState } from 'react';
import { Alert } from 'react-native';
import ConfirmationModal from '../../components/ConfirmationModal';
import { auth } from "../../config/firebase";
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import ABCDEMethod from './ABCDEMethod'; // New ABCDE Method Page
import AboutPage from './AboutPage'; // New About Page
import CalendarPage from './CalendarPage';
import CreatePost from './CreatePost'; // New Create Post Page
import DailyReflection from './DailyReflection'; // New Daily Reflection Page
import ExpertVideosPage from './ExpertVideosPage'; // New Expert Videos Page
import ForumPage from './ForumPage'; // Add this import at the top
import FreeJournaling from './FreeJournaling'; // New Free Journaling Page
import GratitudeList from './GratitudeList'; // New Gratitude List Page
import HabitAddPage from './HabitAddPage'; // Habit Add Page
import HomeScreen from './HomeScreen';
import RegisterScreen from './index';
import JournalEntries from './JournalEntries';
import JournalPage from './JournalPage'; // Journal Page
import LoginScreen from './Login';
import PostDetail from './PostDetail'; // New Post Detail Page
import TodaysGoals from './TodaysGoals'; // New Today's Goals Page

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();
// Bottom Tab Navigator Component
const BottomTabs = () => {
  const colorScheme = useColorScheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: Colors[colorScheme ?? 'light'].background,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Calendar') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Videos') {
            iconName = focused ? 'videocam' : 'videocam-outline';
          } else if (route.name === 'Journal') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'Expert Videos') {
            iconName = focused ? 'school' : 'school-outline';
          } else if (route.name === 'About') {
            iconName = focused ? 'information-circle' : 'information-circle-outline';
          }else if (route.name === 'Forum') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';  // Forum icon
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="About"
        component={AboutPage} // New About Component
        options={{ title: 'About' }}
      />
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Calendar" component={CalendarPage} />
      {/* <Tab.Screen
        name="Videos"
        component={VideosPage}
        options={{ title: 'Videos' }}
      /> */}
      <Tab.Screen
        name="Journal"
        component={JournalPage}
        options={{ title: 'Journal' }}
      />
      <Tab.Screen
        name="Expert Videos"
        component={ExpertVideosPage} // New Expert Videos Component
        options={{ title: 'Expert Videos' }}
      />
      <Tab.Screen
        name="Forum"
        component={ForumPage}
        options={{ title: 'Forum' }}
      />
    
    </Tab.Navigator>
  );
};

// Drawer Navigator Component
const DrawerNavigator = () => {
  const navigation = useNavigation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    signOut(auth)
      .then(() => {
        navigation.replace("Login");
      })
      .catch((err) => {
        console.error("Logout Error:", err);
        Alert.alert("Error", "Failed to logout. Please try again.");
      });
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  return (
    <>
      <Drawer.Navigator initialRouteName="MainTabs">
        <Drawer.Screen name="MainTabs" component={BottomTabs} options={{ title: 'Home' }} />
        
        <Drawer.Screen
          name="Logout"
          component={BottomTabs}
          options={{
            title: 'Logout',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="log-out-outline" size={size} color={color} />
            ),
          }}
          listeners={{
            drawerItemPress: (e) => {
              e.preventDefault();
              handleLogout();
            },
          }}
        />
      </Drawer.Navigator>
      
      <ConfirmationModal
        visible={showLogoutModal}
        onClose={cancelLogout}
        onConfirm={confirmLogout}
        title="Logout"
        message="Are you sure you want to logout?"
        confirmText="Logout"
        cancelText="Cancel"
        confirmButtonColor="#ff4444"
        iconName="log-out-outline"
      />
    </>
  );
};

// Stack Navigator Component
export default function StackLayout() {
  const colorScheme = useColorScheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors[colorScheme ?? 'light'].background },
      }}
    >
      {/* Authentication Screens */}
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Drawer" component={DrawerNavigator} />
   

      {/* Habit Add Page */}
      <Stack.Screen name="HabitAddPage" component={HabitAddPage} />
    
      {/* New Pages */}
      <Stack.Screen name="GratitudeList" component={GratitudeList} />
      <Stack.Screen name="TodaysGoals" component={TodaysGoals} />
      <Stack.Screen name="DailyReflection" component={DailyReflection} />
      <Stack.Screen name="FreeJournaling" component={FreeJournaling} />
      <Stack.Screen name="ABCDEMethod" component={ABCDEMethod} />
      <Stack.Screen name="JournalEntries" component={JournalEntries} />
      <Stack.Screen name="ForumPage" component={ForumPage} />
<Stack.Screen name="CreatePost" component={CreatePost} />
<Stack.Screen name="PostDetail" component={PostDetail} />
    </Stack.Navigator>
  );
}
