import { useNavigation } from '@react-navigation/native';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore'; // Add Firestore write
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
import { auth, db } from '../../config/firebase';

const { width, height } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

const RegisterScreen = () => {
  const [user, loading, error] = useAuthState(auth);
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isFocused, setIsFocused] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(0);

  useEffect(() => {
    if (user) {
      navigation.replace('Drawer');
    }
  }, [user]);

  // Email validation function
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Password strength calculation
  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  // Update password strength when password changes
  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(password));
  }, [password]);

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (passwordStrength < 3) {
      newErrors.password = 'Password is too weak. Include uppercase, lowercase, numbers, and special characters';
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update Auth Profile
      await updateProfile(user, { displayName: name });

      // ✅ Save user to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        displayName: name,
        email: email,
        createdAt: new Date(),
      });

      // Send email verification
      await sendEmailVerification(user);

      Alert.alert('Success', 'Account created successfully! Please verify your email.');

      Toast.show({
        type: 'success',
        text1: 'Account created successfully!',
        text2: 'Please verify your email.',
      });

      navigation.navigate('Drawer');
    } catch (error) {
      let errorMessage;
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'The email address is already in use by another account.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'The email address is not valid.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Email/password accounts are not enabled. Please contact support.';
          break;
        case 'auth/weak-password':
          errorMessage = 'The password is too weak.';
          break;
        default:
          errorMessage = 'An unknown error occurred. Please try again later.';
      }

      Alert.alert('Error', errorMessage);

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
        <Text style={styles.title}>Sign Up</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={[
              styles.input, 
              { 
                borderColor: errors.name ? '#E74C3C' : (isFocused === 'name' ? '#4a90e2' : '#BDC3C7'),
                borderWidth: errors.name ? 1 : 0.5
              }
            ]}
            placeholder="Full Name"
            placeholderTextColor="#666"
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (errors.name) {
                setErrors({...errors, name: ''});
              }
            }}
            onFocus={() => setIsFocused('name')}
            onBlur={() => setIsFocused(null)}
            autoCapitalize="words"
            returnKeyType="next"
            editable={!isLoading}
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>

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
            returnKeyType="next"
            editable={!isLoading}
          />
          {password.length > 0 && (
            <View style={styles.passwordStrengthContainer}>
              <Text style={styles.passwordStrengthText}>Password Strength:</Text>
              <View style={styles.strengthBar}>
                <View 
                  style={[
                    styles.strengthFill, 
                    { 
                      width: `${(passwordStrength / 5) * 100}%`,
                      backgroundColor: passwordStrength < 2 ? '#E74C3C' : passwordStrength < 4 ? '#F39C12' : '#27AE60'
                    }
                  ]} 
                />
              </View>
              <Text style={[
                styles.strengthText,
                { color: passwordStrength < 2 ? '#E74C3C' : passwordStrength < 4 ? '#F39C12' : '#27AE60' }
              ]}>
                {passwordStrength < 2 ? 'Weak' : passwordStrength < 4 ? 'Medium' : 'Strong'}
              </Text>
            </View>
          )}
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={[
              styles.input, 
              { 
                borderColor: errors.confirmPassword ? '#E74C3C' : (isFocused === 'confirmPassword' ? '#4a90e2' : '#BDC3C7'),
                borderWidth: errors.confirmPassword ? 1 : 0.5
              }
            ]}
            placeholder="Confirm Password"
            placeholderTextColor="#666"
            secureTextEntry
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (errors.confirmPassword) {
                setErrors({...errors, confirmPassword: ''});
              }
            }}
            onFocus={() => setIsFocused('confirmPassword')}
            onBlur={() => setIsFocused(null)}
            returnKeyType="done"
            editable={!isLoading}
          />
          {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            onPress={handleSignUp} 
            style={[styles.button, isLoading && styles.buttonDisabled]}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#567396" size="small" />
            ) : (
              <Text style={styles.buttonText}>Register</Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={isLoading}>
              <Text style={[styles.loginLink, isLoading && styles.disabledLink]}>Login</Text>
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
  passwordStrengthContainer: {
    marginTop: 6,
    marginBottom: 3,
  },
  passwordStrengthText: {
    fontSize: 12,
    color: '#7F8C8D',
    marginBottom: 4,
    fontWeight: '500',
  },
  strengthBar: {
    height: 6,
    backgroundColor: '#ECF0F1',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
    borderWidth: 0.5,
    borderColor: '#BDC3C7',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 3,
    transition: 'all 0.3s ease',
  },
  strengthText: {
    fontSize: 11,
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
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  loginText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: '500',
  },
  loginLink: {
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

export default withGradient(RegisterScreen);
