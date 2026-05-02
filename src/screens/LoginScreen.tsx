/**
 * Enhanced LoginScreen Component
 * Professional login form with modern design and improved icons
 * 
 * @author Zain
 * @version 4.0.0
 */
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
import firebaseService from '../config/firebase';
import {User} from '../types/auth';

const { height} = Dimensions.get('window');

interface LoginScreenProps {
  onLoginSuccess?: (userData: User) => void;
  onNavigateToSignup?: () => void;
  onBackToGetStarted?: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess, 
  onNavigateToSignup, 
  onBackToGetStarted
}) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [showFormModal, setShowFormModal] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [focusedInput, setFocusedInput] = useState<string>('');
  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);
  const [forgotEmail, setForgotEmail] = useState<string>('');
  const [isForgotPasswordLoading, setIsForgotPasswordLoading] = useState<boolean>(false);
  const [forgotPasswordError, setForgotPasswordError] = useState<string>('');
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState<boolean>(false);
  
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

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
  
    if (!isValidEmail(sanitize(email))) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (!isStrongPassword(password)) {
      Alert.alert('Error', 'Password must be 8+ chars and include uppercase, lowercase, number, and symbol.');
      return;
    }

    setIsLoading(true);
    
    try {
      const userData = await firebaseService.signIn({email, password});
      
      setShowFormModal(false);
      if (onLoginSuccess) {
        onLoginSuccess(userData);
      }
    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    try {
      // Google Sign-In is already configured in App.tsx
      // Just call the sign-in method
      const user = await firebaseService.signInWithGoogle();
      if (onLoginSuccess) {
        onLoginSuccess(user);
      }
    } catch (e: any) {
      console.error('Google Sign-In error in LoginScreen:', e);
      
      // Provide user-friendly error messages
      let errorMessage = 'Unable to sign in with Google';
      
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
      
      Alert.alert('Google Sign-In Failed', errorMessage);
    }
  };

 

  const handleForgotPassword = async () => {
    // If the email field on the form is empty, ask user in a lightweight modal
    if (!email.trim()) {
      setForgotEmail('');
      setForgotPasswordError('');
      setForgotPasswordSuccess(false);
      setShowForgotModal(true);
      return;
    }
    
    // Use email from form if available
    const targetEmail = email.trim();
    if (!isValidEmail(sanitize(targetEmail))) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    
    setIsForgotPasswordLoading(true);
    setForgotPasswordError('');
    setForgotPasswordSuccess(false);
    
    try {
      await firebaseService.resetPassword(targetEmail);
      setForgotPasswordSuccess(true);
      Alert.alert(
        'Success', 
        'Password reset email sent! Please check your inbox and follow the instructions to reset your password.',
        [
          {
            text: 'OK',
            onPress: () => {
              setShowForgotModal(false);
              setForgotPasswordSuccess(false);
            }
          }
        ]
      );
    } catch (error: any) {
      setForgotPasswordError(error.message || 'Failed to send password reset email. Please try again.');
      Alert.alert('Error', error.message || 'Failed to send password reset email. Please try again.');
    } finally {
      setIsForgotPasswordLoading(false);
    }
  };

  const submitForgotFromModal = async () => {
    const target = forgotEmail.trim();
    
    // Reset states
    setForgotPasswordError('');
    setForgotPasswordSuccess(false);
    
    // Validate email
    if (!target) {
      setForgotPasswordError('Please enter your email address.');
      return;
    }
    
    const sanitizedEmail = sanitize(target);
    if (!isValidEmail(sanitizedEmail)) {
      setForgotPasswordError('Please enter a valid email address.');
      return;
    }
    
    setIsForgotPasswordLoading(true);
    
    try {
      await firebaseService.resetPassword(sanitizedEmail);
      setForgotPasswordSuccess(true);
      
      // Show success message and auto-close after 3 seconds
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotEmail('');
        setForgotPasswordSuccess(false);
        setForgotPasswordError('');
        Alert.alert(
          'Email Sent!', 
          'Password reset email sent! Please check your inbox and follow the instructions to reset your password.'
        );
      }, 2000);
    } catch (error: any) {
      setForgotPasswordError(error.message || 'Failed to send password reset email. Please try again.');
    } finally {
      setIsForgotPasswordLoading(false);
    }
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setForgotEmail('');
    setForgotPasswordError('');
    setForgotPasswordSuccess(false);
    setIsForgotPasswordLoading(false);
  };

  const handleTabChange = (tab: 'login' | 'signup') => {
    setActiveTab(tab);
    if (tab === 'signup' && onNavigateToSignup) {
      onNavigateToSignup();
    }
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const sanitize = (value: string): string => value.replace(/[\u0000-\u001F\u007F]/g, '').trim();

  const isStrongPassword = (pwd: string): boolean => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(pwd);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundContainer}>
        {/* Background Gradient Effect */}
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
              
              {/* Modern Header */}
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
                  Welcome Back
                </Animated.Text>
                <Animated.Text 
                  style={[
                    styles.subtitle,
                    {
                      transform: [{translateY: headerSlideAnim}],
                      opacity: fadeAnim,
                    },
                  ]}>
                  Sign in to continue your journey
                </Animated.Text>
              </View>

              {/* Enhanced Tab Navigation */}
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

              {/* Main Action Card */}
              <Animated.View 
                style={[
                  styles.actionCard,
                  {
                    transform: [{translateY: cardSlideAnim}],
                    opacity: fadeAnim,
                  },
                ]}>
                <View style={styles.actionCardContent}>
                  <Text style={styles.actionCardTitle}>Sign In</Text>
                  <Text style={styles.actionCardSubtitle}>
                    Enter your credentials to access your account
                  </Text>
                  
                  {/* Fill Details Button */}
                  <TouchableOpacity 
                    style={styles.fillDetailsButton}
                    onPress={() => setShowFormModal(true)}
                    activeOpacity={0.8}>
                    <View style={styles.fillDetailsButtonContent}>
                      <View style={styles.fillDetailsIconContainer}>
                        <Icon name="key" size={24} color="#FFFFFF" />
                      </View>
                      <View style={styles.fillDetailsTextContainer}>
                        <Text style={styles.fillDetailsButtonText}>Enter Your Credentials</Text>
                        <Text style={styles.fillDetailsButtonSubtext}>
                          Email and password login
                        </Text>
                      </View>
                      <View style={styles.fillDetailsArrowContainer}>
                        <Icon name="chevron-right" size={24} color="rgba(255, 255, 255, 0.8)" />
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* Social Login Section */}
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
                        onPress={handleGoogleSignIn}
                        activeOpacity={0.8}>
                        <View style={styles.socialIconContainer}>
                          <FontAwesome name="google" size={20} color="#DB4437" />
                        </View>
                        <Text style={styles.socialButtonText}>Google</Text>
                      </TouchableOpacity>
                    </View>
                  </Animated.View>

                  {/* Signup Link */}
                  <View style={styles.signupContainer}>
                    <Text style={styles.signupText}>Don't have an account? </Text>
                    <TouchableOpacity onPress={onNavigateToSignup} activeOpacity={0.7}>
                      <Text style={styles.signupLink}>Sign Up</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Animated.View>
            </Animated.View>
          </ScrollView>

          {/* Single Login Form Modal */}
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
                  <Text style={styles.formModalTitle}>Sign In to Your Account</Text>
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
                    {email.length > 0 && !isValidEmail(email) && (
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
                        placeholder="Enter your password"
                        placeholderTextColor="#A0AEC0"
                        secureTextEntry={!showPassword}
                        value={password}
                        onChangeText={setPassword}
                        onFocus={() => setFocusedInput('password')}
                        onBlur={() => setFocusedInput('')}
                        autoComplete="password"
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
                  </View>

                  {/* Forgot Password */}
                  <TouchableOpacity 
                    style={styles.forgotPasswordContainer} 
                    onPress={handleForgotPassword}
                    activeOpacity={0.7}>
                    <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
                    <Text style={styles.forgotPasswordSubtext}>Reset via email</Text>
                  </TouchableOpacity>
                </ScrollView>

                {/* Modal Footer with Actions */}
                <View style={styles.formModalFooter}>
                  <TouchableOpacity 
                    style={styles.modalCancelButton} 
                    onPress={() => setShowFormModal(false)}>
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.modalLoginButton, isLoading && styles.modalLoginButtonDisabled]} 
                    onPress={handleLogin}
                    disabled={isLoading}>
                    <Text style={styles.modalLoginButtonText}>
                      {isLoading ? 'Signing In...' : 'Sign In'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </View>
          </Modal>
        </KeyboardAvoidingView>
      </View>

      {/* Forgot Password Modal */}
      <Modal 
        visible={showForgotModal} 
        transparent 
        animationType="fade" 
        onRequestClose={closeForgotModal}>
        <View style={styles.forgotOverlay}>
          <TouchableOpacity 
            style={styles.forgotOverlayTouchable}
            activeOpacity={1}
            onPress={closeForgotModal}
          />
          <View style={styles.forgotCard}>
            <View style={styles.forgotHeader}>
              <View style={styles.forgotHeaderContent}>
                <Icon name="lock-reset" size={24} color="#fff" style={styles.forgotHeaderIcon} />
                <Text style={styles.forgotTitle}>Reset Password</Text>
              </View>
              <TouchableOpacity 
                onPress={closeForgotModal} 
                style={styles.forgotClose}
                disabled={isForgotPasswordLoading}>
                <Ionicons name="close" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.forgotBody}>
              {forgotPasswordSuccess ? (
                <View style={styles.forgotSuccessContainer}>
                  <View style={styles.forgotSuccessIconContainer}>
                    <Icon name="check-circle" size={64} color="#10B981" />
                  </View>
                  <Text style={styles.forgotSuccessTitle}>Email Sent!</Text>
                  <Text style={styles.forgotSuccessMessage}>
                    We've sent a password reset link to{'\n'}
                    <Text style={styles.forgotSuccessEmail}>{forgotEmail}</Text>
                  </Text>
                  <Text style={styles.forgotSuccessInstructions}>
                    Please check your inbox and follow the instructions to reset your password.
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={styles.forgotDescription}>
                    Enter your email address and we'll send you a link to reset your password.
                  </Text>
                  
                  <View style={styles.forgotInputContainer}>
                    <View style={styles.forgotInputLabelContainer}>
                      <Icon 
                        name="email-outline" 
                        size={20} 
                        color={forgotPasswordError ? '#EF4444' : '#667EEA'} 
                        style={styles.forgotInputIcon}
                      />
                      <Text style={styles.forgotLabel}>Email Address</Text>
                    </View>
                    <View style={[
                      styles.forgotInputWrapper,
                      forgotPasswordError && styles.forgotInputWrapperError,
                      forgotEmail && isValidEmail(sanitize(forgotEmail)) && !forgotPasswordError && styles.forgotInputWrapperSuccess
                    ]}>
                      <TextInput
                        value={forgotEmail}
                        onChangeText={(text) => {
                          setForgotEmail(text);
                          setForgotPasswordError('');
                        }}
                        placeholder="Enter your email address"
                        placeholderTextColor="#94A3B8"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        editable={!isForgotPasswordLoading}
                        style={styles.forgotInput}
                        onFocus={() => setForgotPasswordError('')}
                      />
                      {forgotEmail && isValidEmail(sanitize(forgotEmail)) && !forgotPasswordError && (
                        <Icon name="check-circle" size={20} color="#10B981" style={styles.forgotInputCheckIcon} />
                      )}
                    </View>
                    {forgotPasswordError ? (
                      <View style={styles.forgotErrorContainer}>
                        <Icon name="alert-circle" size={16} color="#EF4444" />
                        <Text style={styles.forgotErrorText}>{forgotPasswordError}</Text>
                      </View>
                    ) : null}
                  </View>
                  
                  <View style={styles.forgotActions}>
                    <TouchableOpacity 
                      onPress={closeForgotModal} 
                      style={[styles.forgotCancelBtn, isForgotPasswordLoading && styles.forgotCancelBtnDisabled]}
                      disabled={isForgotPasswordLoading}>
                      <Text style={styles.forgotCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={submitForgotFromModal} 
                      style={[
                        styles.forgotSendBtn,
                        (isForgotPasswordLoading || !forgotEmail.trim()) && styles.forgotSendBtnDisabled
                      ]}
                      disabled={isForgotPasswordLoading || !forgotEmail.trim()}>
                      {isForgotPasswordLoading ? (
                        <View style={styles.forgotLoadingContainer}>
                          <Text style={styles.forgotSendText}>Sending...</Text>
                        </View>
                      ) : (
                        <View style={styles.forgotSendButtonContent}>
                          <Icon name="send" size={18} color="#fff" style={styles.forgotSendIcon} />
                          <Text style={styles.forgotSendText}>Send Reset Link</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>
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
    top: 10,
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
    marginBottom: 28,
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
    maxHeight: height * 0.75,
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
    maxHeight: height * 0.45,
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

  modalErrorText: {
    color: '#E53E3E',
    fontSize: 13,
    marginTop: 8,
    marginLeft: 4,
    fontWeight: '500',
  },

  forgotPasswordContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  forgotPasswordText: {
    color: '#667EEA',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },

  forgotPasswordSubtext: {
    color: '#718096',
    fontSize: 13,
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

  // Forgot password modal styles
  forgotOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  forgotOverlayTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  forgotCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 20,
  },
  forgotHeader: {
    padding: 20,
    backgroundColor: '#667EEA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  forgotHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  forgotHeaderIcon: {
    marginRight: 12,
  },
  forgotTitle: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 20,
    flex: 1,
  },
  forgotClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  forgotBody: {
    padding: 24,
  },
  forgotDescription: {
    color: '#64748B',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
    textAlign: 'center',
  },
  forgotInputContainer: {
    marginBottom: 24,
  },
  forgotInputLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  forgotInputIcon: {
    marginRight: 8,
  },
  forgotLabel: {
    color: '#1E293B',
    fontSize: 15,
    fontWeight: '600',
  },
  forgotInputWrapper: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  forgotInputWrapperError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  forgotInputWrapperSuccess: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  forgotInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '500',
  },
  forgotInputCheckIcon: {
    marginLeft: 8,
  },
  forgotErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  forgotErrorText: {
    color: '#EF4444',
    fontSize: 13,
    marginLeft: 6,
    fontWeight: '500',
  },
  forgotActions: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  forgotCancelBtn: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  forgotCancelBtnDisabled: {
    opacity: 0.5,
  },
  forgotCancelText: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '600',
  },
  forgotSendBtn: {
    backgroundColor: '#667EEA',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  forgotSendBtnDisabled: {
    backgroundColor: '#CBD5E0',
    shadowOpacity: 0.1,
  },
  forgotSendButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  forgotSendIcon: {
    marginRight: 6,
  },
  forgotSendText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  forgotLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  forgotSuccessContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  forgotSuccessIconContainer: {
    marginBottom: 20,
  },
  forgotSuccessTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 12,
    textAlign: 'center',
  },
  forgotSuccessMessage: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  forgotSuccessEmail: {
    fontWeight: '700',
    color: '#667EEA',
  },
  forgotSuccessInstructions: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
  },
});

export default LoginScreen;