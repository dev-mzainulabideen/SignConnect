/**
 * GetStartedScreen Component
 * Professional welcome screen with sign language elements and terms agreement
 * 
 * @author Zain
 * @version 2.5.1
 */
import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  Modal,
  SafeAreaView,
  
  Image,
  Easing,
  ScrollView
} from 'react-native';

interface GetStartedScreenProps {
  onNavigateToSignIn: () => void;
  onNavigateToSignUp: () => void;
}

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  onAccept?: () => void;
}

const { height} = Dimensions.get('window');

// TermsModal Component (moved outside of GetStartedScreen)
const TermsModal: React.FC<ModalProps> = ({ visible, onClose, onAccept }) => (
  <Modal
    visible={visible}
    animationType="fade"
    transparent={true}
    onRequestClose={onClose}
  >
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Terms and Conditions</Text>
            <TouchableOpacity 
              onPress={onClose} 
              style={styles.closeButton}
              activeOpacity={0.7}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.termsContent}>
            <ScrollView showsVerticalScrollIndicator={true}>
              <Text style={styles.termsHeading}>1. Acceptance of Terms</Text>
              <Text style={styles.termsParagraph}>
                By accessing or using SignConnect services, you agree to be bound by these Terms and Conditions.
              </Text>
              
              <Text style={styles.termsHeading}>2. Service Description</Text>
              <Text style={styles.termsParagraph}>
                SignConnect provides AI-powered sign language translation services including Sign to Voice, 
                Text to Sign, Voice to Sign, Sign to Text, and Sign to Sign conversion functionalities.
              </Text>
              
              <Text style={styles.termsHeading}>3. User Account</Text>
              <Text style={styles.termsParagraph}>
                You must create an account to access certain features. You are responsible for maintaining 
                the confidentiality of your account information.
              </Text>
              
              <Text style={styles.termsHeading}>4. Privacy Policy</Text>
              <Text style={styles.termsParagraph}>
                Your use of our services is also governed by our Privacy Policy, which explains how we collect, 
                use, and protect your personal information.
              </Text>

              <Text style={styles.termsHeading}>5. User Conduct</Text>
              <Text style={styles.termsParagraph}>
                You agree to use our services only for lawful purposes and in a way that does not infringe 
                the rights of, restrict or inhibit anyone else's use and enjoyment of the app.
              </Text>

              <Text style={styles.termsHeading}>6. Intellectual Property</Text>
              <Text style={styles.termsParagraph}>
                All content, trademarks, and data on this app are the property of SignConnect and are protected 
                by international intellectual property laws.
              </Text>
            </ScrollView>
          </View>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.acceptButton}
              onPress={onAccept}
              activeOpacity={0.8}
            >
              <Text style={styles.acceptButtonText}>Accept Terms</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </View>
  </Modal>
);

// PrivacyModal Component (moved outside of GetStartedScreen)
const PrivacyModal: React.FC<ModalProps> = ({ visible, onClose }) => (
  <Modal
    visible={visible}
    animationType="fade"
    transparent={true}
    onRequestClose={onClose}
  >
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Privacy Policy</Text>
            <TouchableOpacity 
              onPress={onClose} 
              style={styles.closeButton}
              activeOpacity={0.7}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.termsContent}>
            <ScrollView showsVerticalScrollIndicator={true}>
              <Text style={styles.termsHeading}>1. Information We Collect</Text>
              <Text style={styles.termsParagraph}>
                We collect information you provide directly to us, such as when you create an account, 
                use our translation services, or contact us for support. This may include name, email address, 
                and any content you translate.
              </Text>
              
              <Text style={styles.termsHeading}>2. How We Use Your Information</Text>
              <Text style={styles.termsParagraph}>
                We use the information we collect to provide, maintain, and improve our services, 
                develop new features, and communicate with you about products, services, and offers.
              </Text>
              
              <Text style={styles.termsHeading}>3. Information Sharing</Text>
              <Text style={styles.termsParagraph}>
                We do not sell your personal information. We may share information with service providers 
                who assist us in operating our services, and when required by law or to protect our rights.
              </Text>
              
              <Text style={styles.termsHeading}>4. Data Security</Text>
              <Text style={styles.termsParagraph}>
                We implement appropriate security measures to protect your personal information against 
                unauthorized access, alteration, disclosure, or destruction.
              </Text>

              <Text style={styles.termsHeading}>5. Your Choices</Text>
              <Text style={styles.termsParagraph}>
                You may update, correct, or delete your account information at any time by accessing 
                your account settings. You may also opt-out of receiving promotional communications from us.
              </Text>

              <Text style={styles.termsHeading}>6. Children's Privacy</Text>
              <Text style={styles.termsParagraph}>
                Our services are not intended for children under 13. We do not knowingly collect 
                personal information from children under 13.
              </Text>

              <Text style={styles.termsHeading}>7. Changes to This Policy</Text>
              <Text style={styles.termsParagraph}>
                We may update this privacy policy from time to time. We will notify you of any changes 
                by posting the new policy on this page and updating the effective date.
              </Text>
            </ScrollView>
          </View>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.acceptButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.acceptButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </View>
  </Modal>
);

const GetStartedScreen: React.FC<GetStartedScreenProps> = ({
  onNavigateToSignIn,
  onNavigateToSignUp,
}) => {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  
  // Animation values for floating icons
  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(0)).current;
  const floatAnim3 = useRef(new Animated.Value(0)).current;
  const floatAnim4 = useRef(new Animated.Value(0)).current;
  const floatAnim5 = useRef(new Animated.Value(0)).current;

  // Button scale animations
  const createAccountScale = useRef(new Animated.Value(1)).current;
  const signInScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animate screen in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();

    // Floating animations for icons
    const createFloatAnimation = (animValue: Animated.Value, delay: number = 0) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration: 3000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
            delay,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 3000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
    };

    createFloatAnimation(floatAnim1).start();
    createFloatAnimation(floatAnim2, 1000).start();
    createFloatAnimation(floatAnim3, 500).start();
    createFloatAnimation(floatAnim4, 1500).start();
    createFloatAnimation(floatAnim5, 2000).start();
  }, [fadeAnim, slideAnim, floatAnim1, floatAnim2, floatAnim3, floatAnim4, floatAnim5]);

  const openTermsModal = () => {
    setShowTermsModal(true);
  };

  const closeTermsModal = () => {
    setShowTermsModal(false);
  };

  const openPrivacyModal = () => {
    setShowPrivacyModal(true);
  };

  const closePrivacyModal = () => {
    setShowPrivacyModal(false);
  };

  const handleAcceptTerms = () => {
    setTermsAccepted(true);
    closeTermsModal();
  };

  const animateButtonIn = (scaleAnim: Animated.Value) => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const animateButtonOut = (scaleAnim: Animated.Value) => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      
      {/* Background decorative elements with sign language theme */}
      <View style={styles.backgroundElements}>
        <View style={[styles.decorativeCircle, styles.circle1]} />
        <View style={[styles.decorativeCircle, styles.circle2]} />
        <View style={[styles.decorativeCircle, styles.circle3]} />
        <View style={[styles.decorativeCircle, styles.circle4]} />
        
        {/* Animated sign language decorative elements */}
        <Animated.View style={[
          styles.signSymbol, 
          styles.signSymbol1,
          {
            transform: [{
              translateY: floatAnim1.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -15]
              })
            }]
          }
        ]}>
          <Text style={styles.signSymbolText}>🤟</Text>
        </Animated.View>
        
        <Animated.View style={[
          styles.signSymbol, 
          styles.signSymbol2,
          {
            transform: [{
              translateY: floatAnim2.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -12]
              })
            }]
          }
        ]}>
          <Text style={styles.signSymbolText}>👐</Text>
        </Animated.View>
        
        <Animated.View style={[
          styles.signSymbol, 
          styles.signSymbol3,
          {
            transform: [{
              translateY: floatAnim3.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -18]
              })
            }]
          }
        ]}>
          <Text style={styles.signSymbolText}>🙌</Text>
        </Animated.View>

        <Animated.View style={[
          styles.signSymbol, 
          styles.signSymbol4,
          {
            transform: [{
              translateY: floatAnim4.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -10]
              })
            }]
          }
        ]}>
          <Text style={styles.signSymbolText}>👍</Text>
        </Animated.View>

        <Animated.View style={[
          styles.signSymbol, 
          styles.signSymbol5,
          {
            transform: [{
              translateY: floatAnim5.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -14]
              })
            }]
          }
        ]}>
          <Text style={styles.signSymbolText}>✌️</Text>
        </Animated.View>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [
                {translateY: slideAnim}
              ],
            },
          ]}>
        
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../assets/icons/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <View style={styles.logoBadge}>
              <Text style={styles.logoBadgeText}>AI</Text>
            </View>
          </View>
          
          <View style={styles.titleContainer}>
            <Text style={styles.welcomeTitle}>Welcome to</Text>
            <View style={styles.brandTitleContainer}>
              <Text style={styles.brandTitle}>Sign</Text>
              <Text style={[styles.brandTitle, styles.brandTitleAccent]}>Connect</Text>
            </View>
          </View>
          
        </View>

        {/* Sign Language Features Preview */}
        <View style={styles.featuresContainer}>
          <View style={styles.featuresRow}>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Text style={styles.featureIconText}>👐</Text>
              </View>
              <Text style={styles.featureText}>Sign to Voice</Text>
            </View>
            
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Text style={styles.featureIconText}>✍️</Text>
              </View>
              <Text style={styles.featureText}>Text to Sign</Text>
            </View>
            
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Text style={styles.featureIconText}>🔄</Text>
              </View>
              <Text style={styles.featureText}>Sign to Sign</Text>
            </View>
          </View>
          
          <View style={styles.featuresRow}>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Text style={styles.featureIconText}>🎤</Text>
              </View>
              <Text style={styles.featureText}>Voice to Sign</Text>
            </View>
            
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Text style={styles.featureIconText}>📝</Text>
              </View>
              <Text style={styles.featureText}>Sign to Text</Text>
            </View>
            
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Text style={styles.featureIconText}>🌐</Text>
              </View>
              <Text style={styles.featureText}>Translation</Text>
            </View>
          </View>
        </View>

        {/* Terms Agreement */}
        <View style={styles.termsContainer}>
          <TouchableOpacity 
            style={styles.checkboxContainer}
            onPress={() => setTermsAccepted(!termsAccepted)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, termsAccepted && styles.checkboxActive]}>
              {termsAccepted && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <View style={styles.termsTextContainer}>
              <Text style={styles.termsText}>
                I agree to the{' '}
                <Text style={styles.linkText} onPress={openTermsModal}>
                  Terms and Conditions
                </Text>{' '}
                and{' '}
                <Text style={styles.linkText} onPress={openPrivacyModal}>
                  Privacy Policy
                </Text>
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Animated.View style={{transform: [{scale: createAccountScale}]}}>
            <TouchableOpacity
              style={[styles.primaryButton, !termsAccepted && styles.disabledButton]}
              onPress={onNavigateToSignUp}
              onPressIn={() => animateButtonIn(createAccountScale)}
              onPressOut={() => animateButtonOut(createAccountScale)}
              activeOpacity={0.8}
              disabled={!termsAccepted}>
              <Text style={styles.primaryButtonText}>Create Account</Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={{transform: [{scale: signInScale}]}}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onNavigateToSignIn}
              onPressIn={() => animateButtonIn(signInScale)}
              onPressOut={() => animateButtonOut(signInScale)}
              activeOpacity={0.8}>
              <Text style={styles.secondaryButtonText}>Sign In to Existing Account</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
        </Animated.View>
      </ScrollView>
      
      <TermsModal 
        visible={showTermsModal} 
        onClose={closeTermsModal} 
        onAccept={handleAcceptTerms} 
      />
      <PrivacyModal 
        visible={showPrivacyModal} 
        onClose={closePrivacyModal} 
      />
    </View>
  );
};

// Styles remain the same as previous version
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
  },
  
  backgroundElements: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  
  decorativeCircle: {
    position: 'absolute',
    borderRadius: 500,
    opacity: 0.06,
  },
  
  circle1: {
    width: 280,
    height: 280,
    backgroundColor: '#E0E7FF',
    top: -140,
    right: -80,
  },
  
  circle2: {
    width: 220,
    height: 220,
    backgroundColor: '#E9D5FF',
    bottom: -40,
    left: -40,
  },
  
  circle3: {
    width: 180,
    height: 180,
    backgroundColor: '#D1FAE5',
    top: '35%',
    right: -40,
  },
  
  circle4: {
    width: 150,
    height: 150,
    backgroundColor: '#DBEAFE',
    bottom: '15%',
    left: '30%',
  },
  
  signSymbol: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  
  signSymbol1: {
    top: '18%',
    left: 25,
  },
  
  signSymbol2: {
    top: '18%',
    right: 35,
  },
  
  signSymbol3: {
    bottom: '1%',
    left: 25,
  },

  signSymbol4: {
    bottom: '1%',
    right: 35,
  },

  signSymbol5: {
    bottom: '25%',
    left: '45%',
  },
  
  signSymbolText: {
    fontSize: 18,
  },
  
  content: {
    paddingHorizontal: 28,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  
  logoContainer: {
    marginBottom: 12,
    position: 'relative',
  },
  
  logoImage: {
    width: 140,
    height: 140,
    alignSelf: 'center',
  },
  
  logoBadge: {
    position: 'absolute',
    top: 25,
    right: 26,
    backgroundColor: '#FF6B6B',
    borderRadius: 14,
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  
  logoBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  
  titleContainer: {
    alignItems: 'center',
    marginBottom: 14,
  },
  
  welcomeTitle: {
    fontSize: 26,
    fontWeight: '300',
    color: '#5a5a5a',
    textAlign: 'center',
    marginBottom: -4,
  },
  
  brandTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  brandTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#6366F1',
    textAlign: 'center',
  },
  
  brandTitleAccent: {
    color: '#10B981',
  },
  
  subtitle: {
    fontSize: 15,
    color: '#777777',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
    marginTop: 8,
  },
  
  featuresContainer: {
    marginBottom: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(240, 240, 245, 0.8)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  
  featureItem: {
    alignItems: 'center',
    width: '30%',
  },
  
  featureIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(240, 240, 245, 0.8)',
  },
  
  featureIconText: {
    fontSize: 20,
  },
  
  featureText: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '600',
    textAlign: 'center',
  },
  
  termsContainer: {
    marginBottom: 28,
  },
  
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(240, 240, 245, 0.8)',
  },
  
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#cccccc',
    marginRight: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  
  checkboxActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  
  checkmark: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  
  termsTextContainer: {
    flex: 1,
  },
  
  termsText: {
    fontSize: 14,
    color: '#5a5a5a',
    lineHeight: 20,
  },
  
  linkText: {
    color: '#6366F1',
    fontWeight: '700',
  },
  
  buttonContainer: {
    width: '100%',
  },
  
  primaryButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#FF6B6B',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  
  disabledButton: {
    backgroundColor: '#cccccc',
    shadowColor: '#000000',
    shadowOpacity: 0.1,
  },
  
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  secondaryButton: {
    backgroundColor: '#4ECDC4',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#4ECDC4',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  
  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  
  modalSafeArea: {
    flex: 1,
  },
  
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
    backgroundColor: '#f8f9fa',
  },
  
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  closeButtonText: {
    fontSize: 22,
    color: '#6c757d',
    fontWeight: 'bold',
    marginTop: -2,
  },
  
  termsContent: {
    flex: 1,
    padding: 20,
    maxHeight: height * 0.5,
  },
  
  termsHeading: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A6FA5',
    marginTop: 16,
    marginBottom: 8,
  },
  
  termsParagraph: {
    fontSize: 14,
    color: '#5a5a5a',
    lineHeight: 20,
    marginBottom: 16,
  },
  
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
    backgroundColor: '#f8f9fa',
  },
  
  acceptButton: {
    backgroundColor: '#4A6FA5',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#4A6FA5',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  
  acceptButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GetStartedScreen;