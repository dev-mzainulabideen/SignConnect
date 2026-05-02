/**
 * Enhanced SignupScreen Component
 * Professional registration form with single popup modal containing all inputs
 * 
 * @author Zain
 * @version 3.0.0
 */
import firebaseService from '../config/firebase';
import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Modal,
  Dimensions,
  StatusBar,
  SafeAreaView,
  Image
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';

import {User} from '../types/auth';

const { height} = Dimensions.get('window');

interface SignupScreenProps {
  onSignupSuccess?: (userData: User) => void;
  onBackToLogin?: () => void;
  onBackToGetStarted?: () => void;
}

const SignupScreen: React.FC<SignupScreenProps> = ({
  onSignupSuccess,
  onBackToLogin,
  onBackToGetStarted,
}) => {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('signup');
  const [showFormModal, setShowFormModal] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [focusedInput, setFocusedInput] = useState<string>('');
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const modalAnim = useRef(new Animated.Value(0)).current;
  const logoScaleAnim = useRef(new Animated.Value(0.8)).current;
  const headerSlideAnim = useRef(new Animated.Value(-50)).current;
  const cardSlideAnim = useRef(new Animated.Value(50)).current;
  const socialButtonsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    StatusBar.setBarStyle('light-content');
    
    // Sequential animations for better visual impact
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(headerSlideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.spring(logoScaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(cardSlideAnim, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(socialButtonsAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [fadeAnim, slideAnim, logoScaleAnim, headerSlideAnim, cardSlideAnim, socialButtonsAnim]);

  useEffect(() => {
    if (showFormModal) {
      Animated.spring(modalAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(modalAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showFormModal, modalAnim]);

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
  
    if (sanitize(name).length < 2) {
      Alert.alert('Error', 'Name must be at least 2 characters long');
      return;
    }
  
    if (!isValidEmailFormat(sanitize(email))) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
  
    if (!isStrongPassword(password)) {
      Alert.alert('Error', 'Password must be 8+ chars and include uppercase, lowercase, number, and symbol.');
      return;
    }
  
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
  
    setIsLoading(true);
    
    try {
      const userData = await firebaseService.signUp({
        name: sanitize(name),
        email: sanitize(email),
        password,
        confirmPassword,
      });
      
      setShowFormModal(false);
      if (onSignupSuccess) {
        onSignupSuccess(userData);
      }
    } catch (error: any) {
      Alert.alert('Signup Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  type SocialProvider = 'google' | 'facebook';
  const handleSocialSignup = async (provider: SocialProvider) => {
    if (provider === 'google') {
      try {
        // Google Sign-In is already configured in App.tsx
        // Just call the sign-in method
        const user = await firebaseService.signInWithGoogle();
        if (onSignupSuccess) onSignupSuccess(user);
      } catch (e: any) {
        console.error('Google Sign-Up error in SignupScreen:', e);
        
        // Provide user-friendly error messages
        let errorMessage = 'Unable to sign up with Google';
        
        if (e?.message) {
          errorMessage = e.message;
          
          // Check for DEVELOPER_ERROR and provide helpful instructions
          if (e.message.includes('DEVELOPER_ERROR') || e.message.includes('configuration error')) {
            errorMessage = 
              'Google Sign-In configuration error.\n\n' +
              'Please ensure:\n' +
              '1. SHA-1 fingerprint is added to Firebase Console\n' +
              '2. google-services.json is up to date\n' +
              '3. App has been rebuilt after configuration\n\n' +
              'See GOOGLE_SIGNIN_SETUP.md for detailed instructions.';
          }
        }
        
        Alert.alert('Google Sign-Up Failed', errorMessage);
      }
      return;
    }
    Alert.alert(
      'Facebook Sign-Up', 
      'Facebook registration would be implemented here'
    );
  };

  const handleTabChange = (tab: 'login' | 'signup') => {
    setActiveTab(tab);
    if (tab === 'login' && onBackToLogin) {
      onBackToLogin();
    }
  };

  const isValidEmailFormat = (emailInput: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailInput);
  };

  const isStrongPassword = (pwd: string): boolean => {
    // At least 8 chars, one lowercase, one uppercase, one digit, one special
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(pwd);
  };

  const sanitize = (value: string): string => {
    // Remove control chars; trim whitespace
    return value.replace(/[\u0000-\u001F\u007F]/g, '').trim();
  };

  const getPasswordStrength = (pwdInput: string): {strength: string; color: string; score: number} => {
    if (pwdInput.length === 0) return {strength: '', color: '#666', score: 0};
    
    let score = 0;
    if (pwdInput.length >= 8) score += 1;
    if (pwdInput.length >= 12) score += 1;
    if (/[A-Z]/.test(pwdInput)) score += 1;
    if (/[a-z]/.test(pwdInput)) score += 1;
    if (/[0-9]/.test(pwdInput)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwdInput)) score += 1;
    
    if (score < 3) return {strength: 'Weak', color: '#FF4757', score};
    if (score < 5) return {strength: 'Medium', color: '#FFA502', score};
    return {strength: 'Strong', color: '#2ED573', score};
  };

  const passwordStrength = getPasswordStrength(password);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundContainer}>
        {/* Background Gradient Effect - Same as Login Screen */}
        <View style={styles.gradientTop} />
        <View style={styles.gradientBottom} />
        
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          
          <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            
            <Animated.View
              style={[
                styles.content,
                {
                  opacity: fadeAnim,
                  transform: [{translateY: slideAnim}],
                },
              ]}>
              
              {/* Modern Header - Same as Login Screen */}
              <View style={styles.header}>
                {onBackToGetStarted && (
                  <TouchableOpacity 
                    style={styles.backButton} 
                    onPress={onBackToGetStarted}
                    activeOpacity={0.7}>
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
                
                <View style={styles.logoContainer}>
                  <Animated.View 
                    style={[
                      styles.logoWrapper,
                      {
                        transform: [
                          {scale: logoScaleAnim},
                          {
                            rotateY: logoScaleAnim.interpolate({
                              inputRange: [0.8, 1],
                              outputRange: ['180deg', '0deg'],
                            }),
                          },
                        ],
                      },
                    ]}>
                    <Image 
                      source={require('../assets/icons/adaptive-icon.png')}
                      style={styles.logoImage}
                      resizeMode="contain"
                    />
                  </Animated.View>
                </View>
                
                <Animated.Text 
                  style={[
                    styles.title,
                    {
                      transform: [{translateY: headerSlideAnim}],
                      opacity: fadeAnim,
                    },
                  ]}>
                  Welcome to SignConnect
                </Animated.Text>
                <Animated.Text 
                  style={[
                    styles.subtitle,
                    {
                      transform: [{translateY: headerSlideAnim}],
                      opacity: fadeAnim,
                    },
                  ]}>
                  Create your account to get started
                </Animated.Text>
              </View>

              {/* Enhanced Tab Navigation - Same as Login Screen */}
              <View style={styles.tabContainer}>
                <TouchableOpacity 
                  style={[styles.tab, activeTab === 'login' && styles.activeTab]}
                  onPress={() => handleTabChange('login')}>
                  <Text style={[styles.tabText, activeTab === 'login' && styles.activeTabText]}>
                    Login
                  </Text>
                  {activeTab === 'login' && <View style={styles.tabIndicator} />}
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.tab, activeTab === 'signup' && styles.activeTab]}
                  onPress={() => handleTabChange('signup')}>
                  <Text style={[styles.tabText, activeTab === 'signup' && styles.activeTabText]}>
                    Sign Up
                  </Text>
                  {activeTab === 'signup' && <View style={styles.tabIndicator} />}
                </TouchableOpacity>
              </View>

              {/* Main Action Card - Same as Login Screen */}
              <Animated.View 
                style={[
                  styles.actionCard,
                  {
                    transform: [{translateY: cardSlideAnim}],
                    opacity: fadeAnim,
                  },
                ]}>
                <View style={styles.actionCardContent}>
                  <Text style={styles.actionCardTitle}>Ready to Join?</Text>
                  <Text style={styles.actionCardSubtitle}>
                    Fill out your information to create your account
                  </Text>
                  
                  {/* Fill Details Button - Same as Login Screen */}
                  <TouchableOpacity 
                    style={styles.fillDetailsButton}
                    onPress={() => setShowFormModal(true)}
                    activeOpacity={0.8}>
                    <View style={styles.fillDetailsButtonContent}>
                      <View style={styles.fillDetailsIconContainer}>
                        <Icon name="account-edit" size={24} color="#FFFFFF" />
                      </View>
                      <View style={styles.fillDetailsTextContainer}>
                        <Text style={styles.fillDetailsButtonText}>Fill Your Details</Text>
                        <Text style={styles.fillDetailsButtonSubtext}>
                          Complete your registration form
                        </Text>
                      </View>
                      <View style={styles.fillDetailsArrowContainer}>
                        <Icon name="chevron-right" size={24} color="rgba(255, 255, 255, 0.8)" />
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* Social Login Section - Same as Login Screen */}
                  {/* Social Login Section (Facebook removed) */}
                  <Animated.View 
                    style={[
                      styles.socialSection,
                      {
                        opacity: socialButtonsAnim,
                        transform: [{translateY: socialButtonsAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        })}],
                      },
                    ]}>
                    <View style={styles.dividerContainer}>
                      <View style={styles.dividerLine} />
                      <Text style={styles.dividerText}>or continue with</Text>
                      <View style={styles.dividerLine} />
                    </View>

                    <View style={styles.socialButtonsContainer}>
                      <TouchableOpacity 
                        style={styles.socialButton} 
                        onPress={() => handleSocialSignup('google')}
                        activeOpacity={0.8}>
                        <View style={styles.socialIconContainer}>
                          <FontAwesome name="google" size={20} color="#DB4437" />
                        </View>
                        <Text style={styles.socialButtonText}>Google</Text>
                      </TouchableOpacity>
                    </View>
                  </Animated.View>

                  {/* Login Link - Same as Login Screen */}
                  <View style={styles.signupContainer}>
                    <Text style={styles.signupText}>Already have an account? </Text>
                    <TouchableOpacity onPress={onBackToLogin} activeOpacity={0.7}>
                      <Text style={styles.signupLink}>Sign In</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Animated.View>
            </Animated.View>
          </ScrollView>

          {/* Single Form Modal with All Inputs */}
          <Modal
            visible={showFormModal}
            transparent={true}
            animationType="none"
            onRequestClose={() => setShowFormModal(false)}>
            <View style={styles.modalOverlay}>
              <TouchableOpacity 
                style={styles.modalBackground} 
                activeOpacity={1} 
                onPress={() => setShowFormModal(false)}
              />
              <Animated.View
                style={[
                  styles.formModalContent,
                  {
                    opacity: modalAnim,
                    transform: [
                      {
                        translateY: modalAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [100, 0],
                        }),
                      },
                      {
                        scale: modalAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.9, 1],
                        }),
                      },
                    ],
                  },
                ]}>
                
                <View style={styles.formModalHeader}>
                  <Text style={styles.formModalTitle}>Registration Form</Text>
                  <TouchableOpacity 
                    onPress={() => setShowFormModal(false)} 
                    style={styles.formModalCloseButton}>
                    <Icon name="close" size={24} color="#718096" />
                  </TouchableOpacity>
                </View>

                <ScrollView 
                  style={styles.formModalBody}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled">
                  
                  {/* Name Input */}
                  <View style={styles.modalInputContainer}>
                    <View style={styles.modalInputLabelContainer}>
                      <Icon 
                        name="account-outline" 
                        size={20} 
                        color={focusedInput === 'name' ? '#667EEA' : '#718096'} 
                        style={styles.inputIcon}
                      />
                      <Text style={styles.modalInputLabel}>Full Name</Text>
                    </View>
                    <View style={[styles.modalInputWrapper, focusedInput === 'name' && styles.modalInputWrapperFocused]}>
                      <TextInput
                        style={styles.modalTextInput}
                        placeholder="Enter your full name"
                        placeholderTextColor="#A0AEC0"
                        autoCapitalize="words"
                        value={name}
                        onChangeText={setName}
                        onFocus={() => setFocusedInput('name')}
                        onBlur={() => setFocusedInput('')}
                        autoComplete="name"
                      />
                    </View>
                    {name.length > 0 && sanitize(name).length < 2 && (
                      <Text style={styles.modalErrorText}>Name must be at least 2 characters</Text>
                    )}
                  </View>

                  {/* Email Input */}
                  <View style={styles.modalInputContainer}>
                    <View style={styles.modalInputLabelContainer}>
                      <Icon 
                        name="email-outline" 
                        size={20} 
                        color={focusedInput === 'email' ? '#667EEA' : '#718096'} 
                        style={styles.inputIcon}
                      />
                      <Text style={styles.modalInputLabel}>Email Address</Text>
                    </View>
                    <View style={[styles.modalInputWrapper, focusedInput === 'email' && styles.modalInputWrapperFocused]}>
                      <TextInput
                        style={styles.modalTextInput}
                        placeholder="Enter your email address"
                        placeholderTextColor="#A0AEC0"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                        onFocus={() => setFocusedInput('email')}
                        onBlur={() => setFocusedInput('')}
                        autoComplete="email"
                      />
                    </View>
                    {email.length > 0 && !isValidEmailFormat(sanitize(email)) && (
                      <Text style={styles.modalErrorText}>Please enter a valid email address</Text>
                    )}
                  </View>

                  {/* Password Input */}
                  <View style={styles.modalInputContainer}>
                    <View style={styles.modalInputLabelContainer}>
                      <Icon 
                        name="lock-outline" 
                        size={20} 
                        color={focusedInput === 'password' ? '#667EEA' : '#718096'} 
                        style={styles.inputIcon}
                      />
                      <Text style={styles.modalInputLabel}>Password</Text>
                    </View>
                    <View style={[styles.modalInputWrapper, focusedInput === 'password' && styles.modalInputWrapperFocused]}>
                      <TextInput
                        style={[styles.modalTextInput, styles.modalPasswordInput]}
                        placeholder="Create a strong password"
                        placeholderTextColor="#A0AEC0"
                        secureTextEntry={!showPassword}
                        value={password}
                        onChangeText={setPassword}
                        onFocus={() => setFocusedInput('password')}
                        onBlur={() => setFocusedInput('')}
                        autoComplete="password-new"
                      />
                      <TouchableOpacity
                        style={styles.modalEyeIcon}
                        onPress={() => setShowPassword(!showPassword)}>
                        <Icon 
                          name={showPassword ? "eye-off-outline" : "eye-outline"} 
                          size={20} 
                          color="#718096" 
                        />
                      </TouchableOpacity>
                    </View>
                    
                    {/* Password Strength Indicator */}
                    {password.length > 0 && (
                      <View style={styles.modalPasswordStrengthContainer}>
                        <View style={styles.modalPasswordStrengthTextContainer}>
                          <Text style={styles.modalPasswordStrengthLabel}>Password strength:</Text>
                          <Text style={[styles.modalPasswordStrengthText, {color: passwordStrength.color}]}>
                            {passwordStrength.strength}
                          </Text>
                        </View>
                        <View style={styles.modalPasswordStrengthBar}>
                          <View
                            style={[
                              styles.modalPasswordStrengthFill,
                              {
                                width: `${(passwordStrength.score / 6) * 100}%`,
                                backgroundColor: passwordStrength.color,
                              },
                            ]}
                          />
                        </View>
                      </View>
                    )}
                    
                    {password.length > 0 && !isStrongPassword(password) && (
                      <Text style={styles.modalErrorText}>Password must be 8+ chars and include uppercase, lowercase, number, and symbol.</Text>
                    )}
                  </View>

                  {/* Confirm Password Input */}
                  <View style={styles.modalInputContainer}>
                    <View style={styles.modalInputLabelContainer}>
                      <Icon 
                        name="lock-outline" 
                        size={20} 
                        color={focusedInput === 'confirmPassword' ? '#667EEA' : '#718096'} 
                        style={styles.inputIcon}
                      />
                      <Text style={styles.modalInputLabel}>Confirm Password</Text>
                    </View>
                    <View style={[styles.modalInputWrapper, focusedInput === 'confirmPassword' && styles.modalInputWrapperFocused]}>
                      <TextInput
                        style={[styles.modalTextInput, styles.modalPasswordInput]}
                        placeholder="Re-enter your password"
                        placeholderTextColor="#A0AEC0"
                        secureTextEntry={!showConfirmPassword}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        onFocus={() => setFocusedInput('confirmPassword')}
                        onBlur={() => setFocusedInput('')}
                        autoComplete="password-new"
                      />
                      <TouchableOpacity
                        style={styles.modalEyeIcon}
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                        <Icon 
                          name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                          size={20} 
                          color="#718096" 
                        />
                      </TouchableOpacity>
                    </View>
                    {confirmPassword.length > 0 && password !== confirmPassword && (
                      <Text style={styles.modalErrorText}>Passwords do not match</Text>
                    )}
                    {confirmPassword.length > 0 && password === confirmPassword && isStrongPassword(password) && (
                      <Text style={styles.modalSuccessText}>✓ Passwords match and are strong</Text>
                    )}
                  </View>
                </ScrollView>

                {/* Modal Footer with Actions - Same as Login Screen */}
                <View style={styles.formModalFooter}>
                  <TouchableOpacity 
                    style={styles.modalCancelButton} 
                    onPress={() => setShowFormModal(false)}>
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.modalLoginButton, isLoading && styles.modalLoginButtonDisabled]} 
                    onPress={handleSignup}
                    disabled={isLoading}>
                    <Text style={styles.modalLoginButtonText}>
                      {isLoading ? 'Creating...' : 'Create Account'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </View>
          </Modal>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#667EEA',
  },

  backgroundContainer: {
    flex: 1,
    position: 'relative',
  },

  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.6,
    backgroundColor: '#667EEA',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },

  gradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.5,
    backgroundColor: '#E0E7FF',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
  
  container: {
    flex: 1,
    zIndex: 1,
  },
  
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
    minHeight: height - 100,
  },
  
  content: {
    alignItems: 'center',
  },
  
  header: {
    alignItems: 'center',
    marginBottom: 32,
    position: 'relative',
    width: '100%',
  },
  
  backButton: {
    position: 'absolute',
    top: 20,
    left: 0,
    padding: 12,
    zIndex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  logoContainer: {
    marginBottom: 28,
    position: 'relative',
    alignItems: 'center',
  },
  
  logoWrapper: {
    width: 100,
    height: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
    overflow: 'hidden',
  },

  logoImage: {
    width: 70,
    height: 70,
  },
  
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -1,
  },
  
  subtitle: {
    fontSize: 17,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
    fontWeight: '400',
  },
  
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 8,
    marginBottom: 32,
    width: '100%',
    maxWidth: 360,
  },
  
  tab: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    position: 'relative',
  },
  
  activeTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  
  activeTabText: {
    color: '#667EEA',
    fontWeight: '700',
  },

  tabIndicator: {
    position: 'absolute',
    bottom: -4,
    width: 30,
    height: 3,
    backgroundColor: '#667EEA',
    borderRadius: 2,
  },
  
  actionCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 28,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 15,
  },

  actionCardContent: {
    alignItems: 'center',
  },

  actionCardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 8,
    textAlign: 'center',
  },

  actionCardSubtitle: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },

  fillDetailsButton: {
    width: '100%',
    backgroundColor: '#667EEA',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },

  fillDetailsButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  fillDetailsIconContainer: {
    width: 50,
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },

  fillDetailsTextContainer: {
    flex: 1,
  },

  fillDetailsButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },

  fillDetailsButtonSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
  },

  fillDetailsArrowContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  socialSection: {
    width: '100%',
    marginTop: 8,
  },
  
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  
  dividerText: {
    color: '#A0AEC0',
    fontSize: 13,
    fontWeight: '500',
    marginHorizontal: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  
  socialIconContainer: {
    marginRight: 8,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  socialButtonText: {
    color: '#2D3748',
    fontSize: 15,
    fontWeight: '600',
  },
  
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 4,
  },
  
  signupText: {
    color: '#718096',
    fontSize: 15,
    fontWeight: '500',
  },
  
  signupLink: {
    color: '#667EEA',
    fontSize: 15,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  
  modalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  
  formModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: height * 0.85,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 20,
  },
  
  formModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  
  formModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2D3748',
  },
  
  formModalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  formModalBody: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    maxHeight: height * 0.55,
  },

  modalInputContainer: {
    marginBottom: 24,
  },

  modalInputLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  inputIcon: {
    marginRight: 12,
  },

  modalInputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D3748',
    flex: 1,
  },

  modalInputWrapper: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  
  modalInputWrapperFocused: {
    borderColor: '#667EEA',
    backgroundColor: '#FFFFFF',
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  modalTextInput: {
    paddingHorizontal: 18,
    paddingVertical: 18,
    fontSize: 16,
    color: '#2D3748',
    fontWeight: '500',
  },

  modalPasswordInput: {
    paddingRight: 55,
  },

  modalEyeIcon: {
    position: 'absolute',
    right: 18,
    top: 18,
    padding: 4,
  },

  modalPasswordStrengthContainer: {
    marginTop: 12,
    paddingHorizontal: 4,
  },
  
  modalPasswordStrengthTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalPasswordStrengthLabel: {
    fontSize: 13,
    color: '#718096',
    fontWeight: '500',
  },
  
  modalPasswordStrengthText: {
    fontSize: 13,
    fontWeight: '600',
  },
  
  modalPasswordStrengthBar: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  
  modalPasswordStrengthFill: {
    height: '100%',
    borderRadius: 3,
  },

  modalErrorText: {
    color: '#E53E3E',
    fontSize: 13,
    marginTop: 8,
    marginLeft: 4,
    fontWeight: '500',
  },

  modalSuccessText: {
    color: '#48BB78',
    fontSize: 13,
    marginTop: 8,
    marginLeft: 4,
    fontWeight: '500',
  },

  formModalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  
  modalCancelText: {
    color: '#718096',
    fontSize: 16,
    fontWeight: '600',
  },
  
  modalLoginButton: {
    flex: 2,
    backgroundColor: '#667EEA',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  modalLoginButtonDisabled: {
    backgroundColor: '#CBD5E0',
    shadowOpacity: 0.1,
  },
  
  modalLoginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default SignupScreen;