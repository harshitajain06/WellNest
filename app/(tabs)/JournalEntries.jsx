// src/screens/JournalEntries.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';
import { auth, db } from '../../config/firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Ionicons } from '@expo/vector-icons';
import withGradient from '../../components/withGradient';

const JournalEntries = () => {
  const [user] = useAuthState(auth);
  const [entries, setEntries] = useState([]);

  const fetchEntries = async () => {
    if (user) {
      try {
        const querySnapshot = await getDocs(collection(db, 'journals'));
        const userEntries = querySnapshot.docs
          .filter(doc => doc.data().userId === user.uid)
          .map(doc => ({ id: doc.id, ...doc.data() }));
        setEntries(userEntries);
      } catch (err) {
        console.error('Error fetching entries: ', err);
        Alert.alert('Error', 'Failed to load entries.');
      }
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [user]);

  const deleteEntry = async (id) => {
    try {
      await deleteDoc(doc(db, 'journals', id));
      Alert.alert('Success', 'Journal entry deleted.');
      fetchEntries(); // Refresh the list
    } catch (err) {
      console.error('Error deleting entry: ', err);
      Alert.alert('Error', 'Failed to delete entry.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Journal Entries</Text>
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.entryItem}>
            <Text style={styles.entryText}>{item.entry}</Text>
            <TouchableOpacity onPress={() => deleteEntry(item.id)}>
              <Ionicons name="trash" size={24} color="#FF5733" />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    color: '#567396',
    marginBottom: 20,
    fontWeight: 'bold',
    marginTop: 50,
  },
  entryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#E1E8F0',
  },
  entryText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
});

export default withGradient(JournalEntries);
