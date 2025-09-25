import { useNavigation } from '@react-navigation/native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Toast from 'react-native-toast-message';
import WellNestLogo from '../../components/WellNestLogo';
import withGradient from '../../components/withGradient';
import { auth } from '../../config/firebase';

const { width, height } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

const Login = () => {
  const [user, loading, error] = useAuthState(auth);
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isFocused, setIsFocused] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      navigation.replace('Drawer'); // Navigate to the main app screen if already logged in
    }
  }, [user]);

  // Email validation function
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Show success alert
      Alert.alert('Success', 'Logged in successfully!');

      // Show success toast
      Toast.show({
        type: 'success',
        text1: 'Logged in successfully!',
      });

      // Navigate to the home screen or dashboard
      navigation.navigate('Drawer');
    } catch (error) {
      let errorMessage;
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'The email address is not valid.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This user account has been disabled.';
          break;
        case 'auth/user-not-found':
          errorMessage = 'There is no user record corresponding to this email.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'The password is incorrect.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed login attempts. Please try again later.';
          break;
        default:
          errorMessage = 'An unknown error occurred. Please try again later.';
      }

      // Show error alert
      Alert.alert('Error', errorMessage);

      // Show error toast
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <WellNestLogo size={isWeb ? 120 : 140} showText={false} style={styles.logoContainer} />

        <Text style={styles.title}>Login</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={[
              styles.input,
              { 
                borderColor: errors.email ? '#E74C3C' : (isFocused === 'email' ? '#4a90e2' : '#BDC3C7'),
                borderWidth: errors.email ? 1 : 0.5
              }
            ]}
            placeholder="Email Address"
            placeholderTextColor="#666"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) {
                setErrors({...errors, email: ''});
              }
            }}
            onFocus={() => setIsFocused('email')}
            onBlur={() => setIsFocused(null)}
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
            editable={!isLoading}
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={[
              styles.input,
              { 
                borderColor: errors.password ? '#E74C3C' : (isFocused === 'password' ? '#4a90e2' : '#BDC3C7'),
                borderWidth: errors.password ? 1 : 0.5
              }
            ]}
            placeholder="Password"
            placeholderTextColor="#666"
            secureTextEntry
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) {
                setErrors({...errors, password: ''});
              }
            }}
            onFocus={() => setIsFocused('password')}
            onBlur={() => setIsFocused(null)}
            returnKeyType="done"
            editable={!isLoading}
          />
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            onPress={handleLogin} 
            style={[styles.button, isLoading && styles.buttonDisabled]}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#567396" size="small" />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </TouchableOpacity>

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')} disabled={isLoading}>
              <Text style={[styles.registerLink, isLoading && styles.disabledLink]}>Register</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Toast />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: isWeb ? Math.min(width * 0.05, 60) : 20,
    paddingVertical: isWeb ? 20 : 10,
    minHeight: isWeb ? height - 20 : undefined,
    maxWidth: isWeb ? 800 : '100%',
    alignSelf: 'center',
    borderWidth: 0.5,
    borderColor: '#ffffff',
    borderRadius: 20,
    margin: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    shadowColor: '#1e3c72',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  logoContainer: {
    marginBottom: 10,
 
  },
  title: {
    fontSize: isWeb ? 32 : 36,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 15,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 10,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 0.5,
    borderRadius: 15,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: '500',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    ...(isWeb && {
      outlineStyle: 'none',
      transition: 'all 0.3s ease',
    }),
  },
  errorText: {
    color: '#E74C3C',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
    fontWeight: '600',
  },
  buttonContainer: {
    width: '100%',
    padding: isWeb ? 20 : 20,
  },
  button: {
    backgroundColor: '#2a5298',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#1e3c72',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 0.5,
    borderColor: '#1e3c72',
    ...(isWeb && {
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      ':hover': {
        transform: 'translateY(-3px)',
        shadowOpacity: 0.5,
        backgroundColor: '#1e3c72',
      },
    }),
  },
  buttonDisabled: {
    opacity: 0.6,
    ...(isWeb && {
      cursor: 'not-allowed',
    }),
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  registerText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: '500',
  },
  registerLink: {
    color: '#4a90e2',
    fontSize: 16,
    fontWeight: 'bold',
    ...(isWeb && {
      cursor: 'pointer',
      textDecorationLine: 'underline',
    }),
  },
  disabledLink: {
    opacity: 0.5,
    ...(isWeb && {
      cursor: 'not-allowed',
    }),
  },
});

export default withGradient(Login);
