// src/navigation/ABCDEMethod.jsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, FlatList, Modal } from 'react-native';
import { auth, db } from '../../config/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Ionicons } from '@expo/vector-icons';
import withGradient from '../../components/withGradient';

const ABCDEMethod = ({ navigation }) => {
  const [user, loading, error] = useAuthState(auth);
  const [abcde, setAbcde] = useState({ a: '', b: '', c: '', d: '', e: '' });
  const [savedABCDE, setSavedABCDE] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleInputChange = (field, value) => {
    setAbcde({ ...abcde, [field]: value });
  };

  // Fetch saved ABCDE entries from Firebase
  const fetchABCDE = async () => {
    if (user) {
      try {
        const querySnapshot = await getDocs(collection(db, 'abcde'));
        const userEntries = querySnapshot.docs
          .filter((doc) => doc.data().userId === user.uid)
          .map((doc) => ({ id: doc.id, ...doc.data() }));
        setSavedABCDE(userEntries);
      } catch (err) {
        console.error('Error fetching ABCDE entries: ', err);
        Alert.alert('Error', 'Failed to load ABCDE entries.');
      }
    }
  };

  useEffect(() => {
    fetchABCDE();
  }, [user]);

  const saveABCDE = async () => {
    const { a, b, c, d, e } = abcde;

    if (!a || !b || !c || !d || !e) {
      Alert.alert('Validation Error', 'Please fill out all fields.');
      return;
    }

    try {
      await addDoc(collection(db, 'abcde'), {
        userId: user.uid,
        abcde: { a, b, c, d, e },
        createdAt: new Date(),
      });
      Alert.alert('Success', 'ABCDE method saved.');
      setAbcde({ a: '', b: '', c: '', d: '', e: '' });
      fetchABCDE(); // Refresh the list
    } catch (err) {
      console.error('Error saving ABCDE: ', err);
      Alert.alert('Error', 'Failed to save ABCDE.');
    }
  };

  const deleteABCDE = async (id) => {
    try {
      await deleteDoc(doc(db, 'abcde', id));
      Alert.alert('Success', 'ABCDE entry deleted successfully.');
      fetchABCDE(); // Refresh the list
    } catch (err) {
      console.error('Error deleting ABCDE: ', err);
      Alert.alert('Error', 'Failed to delete ABCDE.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>ABCDE Method</Text>
        <TouchableOpacity onPress={() => setIsModalVisible(true)}>
          <Ionicons name="list-outline" size={30} color="#007BFF" style={styles.icon} />
        </TouchableOpacity>
      </View>

      {/* Input Fields */}
      <TextInput
        style={styles.input}
        placeholder="A: Activating Event"
        value={abcde.a}
        onChangeText={(value) => handleInputChange('a', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="B: Beliefs"
        value={abcde.b}
        onChangeText={(value) => handleInputChange('b', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="C: Consequences"
        value={abcde.c}
        onChangeText={(value) => handleInputChange('c', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="D: Disputation"
        value={abcde.d}
        onChangeText={(value) => handleInputChange('d', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="E: New Effect"
        value={abcde.e}
        onChangeText={(value) => handleInputChange('e', value)}
      />

      {/* Save Button */}
      <TouchableOpacity onPress={saveABCDE} style={styles.button}>
        <Text style={styles.buttonText}>Save ABCDE</Text>
      </TouchableOpacity>

      {/* Modal for Showing Saved ABCDE Entries */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Saved ABCDE Entries</Text>
            <FlatList
              data={savedABCDE}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.modalItem}>
                  <View style={styles.modalTextContainer}>
                    <Text style={styles.modalItemText}>A: {item.abcde.a}</Text>
                    <Text style={styles.modalItemText}>B: {item.abcde.b}</Text>
                    <Text style={styles.modalItemText}>C: {item.abcde.c}</Text>
                    <Text style={styles.modalItemText}>D: {item.abcde.d}</Text>
                    <Text style={styles.modalItemText}>E: {item.abcde.e}</Text>
                  </View>
                  <TouchableOpacity onPress={() => deleteABCDE(item.id)}>
                    <Ionicons name="trash" size={24} color="#FF5733" />
                  </TouchableOpacity>
                </View>
              )}
            />
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setIsModalVisible(false)}
            >
              <Text style={styles.closeModalButtonText}>Close</Text>
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
    padding: 20,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 30,
  },
  title: {
    fontSize: 28,
    color: '#567396',
    fontWeight: 'bold',
  },
  icon: {
    marginLeft: 'auto',
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
  button: {
    backgroundColor: '#28a745',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    width: '100%',
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#007BFF',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#E1E8F0',
    width: '100%',
  },
  modalTextContainer: {
    flex: 1,
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
  },
  closeModalButton: {
    marginTop: 20,
    backgroundColor: '#FF5733',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  closeModalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default withGradient(ABCDEMethod);
