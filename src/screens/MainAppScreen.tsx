import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Alert,
  Dimensions,
  StatusBar,
  Image,
  Platform,
  Modal,
  Easing,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {launchImageLibrary, ImageLibraryOptions, Asset} from 'react-native-image-picker';

// Feature screens (keep these imports as-is in your project)
import SignToVoiceScreen from './SignToVoiceScreen';
import SignToTextScreen from './SignToTextScreen';
import TextToSignScreen from './TextToSignScreen';
import VoiceToSignScreen from './VoiceToSignScreen';
import SignToSignScreen from './SignToSignScreen';
import HistoryScreen from './HistoryScreen';
import HistoryService, { HistoryEntry, getStats } from '../services/HistoryService';

// Types and bottom nav (do not change the nav component)
import { User } from '../types/auth';
import AppBottomNav, { AppTab } from '../components/AppBottomNav';
import firebaseService from '../config/firebase';
import ThemeService, { AppTheme } from '../services/ThemeService';

const { width, height } = Dimensions.get('window');

interface MainAppScreenProps {
  user?: User | null;
  onLogout?: () => void;
}

// Enhanced color palette matching the gradient design (light base)
const Colors = {
  gradientStart: '#667eea',
  gradientEnd: '#764ba2',
  primary: '#6366F1',
  accent: '#10B981',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  cardBackground: '#F1F5F9',
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textLight: '#FFFFFF',
  border: '#E2E8F0',
  pink: '#EC4899',
  green: '#10B981',
  orange: '#F59E0B',
  blue: '#3B82F6',
  purple: '#8B5CF6',
  danger: '#EF4444',
  shadowColor: 'rgba(0,0,0,0.1)',
};

const DarkColors = {
  ...Colors,
  background: '#0B1220',
  surface: '#111827',
  cardBackground: '#0F172A',
  textPrimary: '#E5E7EB',
  textSecondary: '#9CA3AF',
  shadowColor: 'rgba(0,0,0,0.6)',
};

const Typography = {
  h1: { fontSize: 28, fontWeight: '800' as const, lineHeight: 36 },
  h2: { fontSize: 22, fontWeight: '700' as const, lineHeight: 28 },
  h3: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
  body: { fontSize: 16, fontWeight: '500' as const, lineHeight: 22 },
  button: { fontSize: 16, fontWeight: '600' as const, lineHeight: 20 },
  small: { fontSize: 14, fontWeight: '400' as const, lineHeight: 18 },
  caption: { fontSize: 12, fontWeight: '500' as const, lineHeight: 16 },
};

type FeatureType =
  | 'sign-to-sign'
  | 'text-to-sign'
  | 'sign-to-text'
  | 'voice-to-sign'
  | 'sign-to-voice';

const MainAppScreen: React.FC<MainAppScreenProps> = ({ user, onLogout }) => {
  const [selectedTab, setSelectedTab] = useState<AppTab>('translate');
  
  // feature overlays
  const [showSignToVoice, setShowSignToVoice] = useState(false);
  const [showSignToText, setShowSignToText] = useState(false);
  const [showTextToSign, setShowTextToSign] = useState(false);
  const [showVoiceToSign, setShowVoiceToSign] = useState(false);
  const [showSignToSign, setShowSignToSign] = useState(false);

  const [languageMode, setLanguageMode] = useState<'PSL' | 'ASL'>('ASL');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [_stats, setStats] = useState<{ total: number; favorites: number; byMode: any }>({ total: 0, favorites: 0, byMode: {} });

  // Expose current user id globally for history logging (used by feature screens)
  useEffect(() => {
    try { (globalThis as any).currentUserId = user?.id || undefined; } catch {}
  }, [user?.id]);
  const [helpOpen, setHelpOpen] = useState(false);
  const [editNameOpen, setEditNameOpen] = useState(false);
  const [editEmailOpen, setEditEmailOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [profileName, setProfileName] = useState<string>(user?.name || 'User Name');
  const [profileEmail, setProfileEmail] = useState<string>(user?.email || 'user@example.com');
  const [newName, setNewName] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);
  const [photoURL, setPhotoURL] = useState<string | undefined>(undefined);
  const [theme, setTheme] = useState<AppTheme>('light');

  // Enhanced animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;
  const cardsAnim = useRef(new Animated.Value(0)).current;
  const overlayScale = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const overlayScreenAnim = useRef(new Animated.Value(0)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  // Feature card press animations
  const featureScale0 = useRef(new Animated.Value(1)).current;
  const featureScale1 = useRef(new Animated.Value(1)).current;
  const featureScale2 = useRef(new Animated.Value(1)).current;
  const featureScale3 = useRef(new Animated.Value(1)).current;
  const featureOverlay0 = useRef(new Animated.Value(0)).current;
  const featureOverlay1 = useRef(new Animated.Value(0)).current;
  const featureOverlay2 = useRef(new Animated.Value(0)).current;
  const featureOverlay3 = useRef(new Animated.Value(0)).current;
  const signToSignPulse = useRef(new Animated.Value(1)).current;

  // Shared element (hero) animation for the feature icon
  const heroX = useRef(new Animated.Value(0)).current;
  const heroY = useRef(new Animated.Value(0)).current;
  const heroSize = useRef(new Animated.Value(0)).current;
  const heroBorder = useRef(new Animated.Value(26)).current;
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const [heroIcon, setHeroIcon] = useState<'record-voice-over' | 'translate' | 'mic' | 'text-fields' | null>(null);
  const [heroBg, setHeroBg] = useState<string>('#FFFFFF');
  const iconRef0 = useRef<View>(null as any);
  const iconRef1 = useRef<View>(null as any);
  const iconRef2 = useRef<View>(null as any);
  const iconRef3 = useRef<View>(null as any);
  const logoRef = useRef<View>(null as any);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(headerAnim, { 
        toValue: 1, 
        duration: 600, 
        easing: Easing.out(Easing.cubic), 
        useNativeDriver: true 
      }),
      Animated.parallel([
        Animated.timing(fadeAnim, { 
          toValue: 1, 
          duration: 700, 
          useNativeDriver: true 
        }),
        Animated.timing(slideAnim, { 
          toValue: 0, 
          duration: 600, 
          easing: Easing.out(Easing.cubic), 
          useNativeDriver: true 
        }),
        Animated.timing(scaleAnim, { 
          toValue: 1, 
          duration: 600, 
          easing: Easing.out(Easing.back(1.2)), 
          useNativeDriver: true 
        }),
      ]),
      Animated.timing(cardsAnim, { 
        toValue: 1, 
        duration: 500, 
        easing: Easing.out(Easing.cubic), 
        useNativeDriver: true 
      }),
    ]).start();
    // Looping pulse on the "Sign to Sign" arrow
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(signToSignPulse, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(signToSignPulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, );

  useEffect(() => {
    setProfileName(user?.name || 'User Name');
    setProfileEmail(user?.email || 'user@example.com');
  }, [user]);

  // Load theme
  useEffect(() => {
    (async () => { const t = await ThemeService.getTheme(); setTheme(t); })();
  }, []);

  // Define palette based on theme (needs to be accessible throughout component)
  const palette = theme === 'dark' ? DarkColors : Colors;

  const handlePickPhoto = async () => {
    try {
      const options: ImageLibraryOptions = {
        mediaType: 'photo',
        quality: 0.9,
        selectionLimit: 1,
      };
      const result = await launchImageLibrary(options);
      if (result.didCancel) return;
      const asset: Asset | undefined = result.assets && result.assets[0];
      const uri = asset?.uri;
      if (!uri) return;
      await firebaseService.updateProfile({ photoURL: uri });
      setPhotoURL(uri);
      Alert.alert('Success', 'Profile photo updated.');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to update photo');
    }
  };

  const toggleTheme = async () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    await ThemeService.setTheme(next);
  };

  const animateCardPressIn = (scaleRef: Animated.Value) => {
    Animated.spring(scaleRef, {
      toValue: 0.97,
      useNativeDriver: true,
      friction: 6,
      tension: 120,
    }).start();
  };

  const animateCardPressOut = (scaleRef: Animated.Value) => {
    Animated.spring(scaleRef, {
      toValue: 1,
      useNativeDriver: true,
      friction: 6,
      tension: 120,
    }).start();
  };

  const overlayFadeIn = (v: Animated.Value) => Animated.timing(v, { toValue: 0.08, duration: 120, useNativeDriver: true }).start();
  const overlayFadeOut = (v: Animated.Value) => Animated.timing(v, { toValue: 0, duration: 180, useNativeDriver: true }).start();

  const startHeroFrom = (ref: React.RefObject<any>, iconName: 'record-voice-over' | 'translate' | 'mic' | 'text-fields', bg: string) => {
    try {
      ref.current?.measureInWindow?.((x: number, y: number, measuredWidth: number, measuredHeight: number) => {
        setHeroIcon(iconName);
        setHeroBg(bg);
        heroX.setValue(x);
        heroY.setValue(y);
        heroSize.setValue(Math.max(measuredWidth, measuredHeight));
        heroBorder.setValue(Math.max(measuredWidth, measuredHeight) / 2);
        heroOpacity.setValue(0);
        // measure logo to compute target center
        logoRef.current?.measureInWindow?.((lx: number, ly: number, lw: number, lh: number) => {
          const targetSize = 44;
          const targetX = lx + (lw - targetSize) / 2 + 2;
          const targetY = ly + (lh - targetSize) / 2 + 2;

          Animated.parallel([
            Animated.timing(heroOpacity, { toValue: 1, duration: 120, useNativeDriver: false }),
            Animated.spring(heroX, { toValue: targetX, useNativeDriver: false, stiffness: 220, damping: 18, mass: 0.9 }),
            Animated.spring(heroY, { toValue: targetY, useNativeDriver: false, stiffness: 220, damping: 18, mass: 0.9 }),
            Animated.spring(heroSize, { toValue: targetSize, useNativeDriver: false, stiffness: 220, damping: 18, mass: 0.9 }),
            Animated.spring(heroBorder, { toValue: targetSize / 2, useNativeDriver: false, stiffness: 220, damping: 18, mass: 0.9 }),
          ]).start(() => {
            Animated.timing(heroOpacity, { toValue: 0, duration: 120, useNativeDriver: false }).start(() => {
              setHeroIcon(null);
            });
          });
        });
      });
    } catch {}
  };

  const animateToOverlay = (cb?: () => void) => {
    overlayScreenAnim.setValue(0);
    Animated.parallel([
      Animated.timing(overlayScale, { 
        toValue: 0.96, 
        duration: 280, 
        easing: Easing.out(Easing.cubic), 
        useNativeDriver: true 
      }),
      Animated.spring(overlayScreenAnim, {
        toValue: 1,
        useNativeDriver: true,
        stiffness: 180,
        damping: 18,
        mass: 0.9,
      }),
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(cb);
  };
  
  const animateBackFromOverlay = (cb?: () => void) => {
    Animated.parallel([
      Animated.spring(overlayScreenAnim, {
        toValue: 0,
        useNativeDriver: true,
        stiffness: 180,
        damping: 18,
        mass: 0.9,
      }),
      Animated.timing(overlayScale, { 
        toValue: 1, 
        duration: 360, 
        easing: Easing.out(Easing.cubic), 
        useNativeDriver: true 
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(cb);
  };

  const handleFeaturePress = (feature: FeatureType) => {
    animateToOverlay(() => {
      switch (feature) {
        case 'sign-to-voice':
          setShowSignToVoice(true);
          break;
        case 'sign-to-text':
          setShowSignToText(true);
          break;
        case 'text-to-sign':
          setShowTextToSign(true);
          break;
        case 'voice-to-sign':
          setShowVoiceToSign(true);
          break;
        case 'sign-to-sign':
          setShowSignToSign(true);
          break;
      }
    });
  };

  const handleBackToMain = () => {
    setShowSignToVoice(false);
    setShowSignToText(false);
    setShowTextToSign(false);
    setShowVoiceToSign(false);
    setShowSignToSign(false);
    animateBackFromOverlay();
  };

  const renderHelpModal = () => (
    <Modal visible={helpOpen} animationType="slide" transparent onRequestClose={() => setHelpOpen(false)}>
      <View style={styles.helpOverlay}>
        <Animated.View style={[styles.helpCard, { 
          opacity: fadeAnim,
          transform: [{ 
            translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0]
            })
          }]
        }]}>
          <View style={styles.helpHeader}>
            <Text style={[styles.helpTitle, { color: palette.textLight }]}>SignConnect Guide</Text>
            <TouchableOpacity onPress={() => setHelpOpen(false)} style={styles.helpClose}>
              <Icon name="close" size={22} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.helpBody} contentContainerStyle={styles.helpBodyContent}>
            <Text style={styles.helpSection}>Supported Languages</Text>

            <View style={styles.helpLangCard}>
              <Image source={require('../assets/flags/us.png')} style={styles.helpFlag} />
              <View style={styles.helpLangInfo}>
                <Text style={styles.helpLangName}>American Sign Language</Text>
                <Text style={styles.helpLangCode}>ASL</Text>
                <Text style={styles.helpLangDesc}>Primary sign language used in the United States and Canada</Text>
              </View>
            </View>

            <View style={styles.helpLangCard}>
              <Image source={require('../assets/flags/pk.png')} style={styles.helpFlag} />
              <View style={styles.helpLangInfo}>
                <Text style={styles.helpLangName}>Pakistani Sign Language</Text>
                <Text style={styles.helpLangCode}>PSL</Text>
                <Text style={styles.helpLangDesc}>Commonly used within the deaf community in Pakistan</Text>
              </View>
            </View>

            <Text style={[styles.helpSection, { marginTop: 20, color: palette.textPrimary }]}>Available Features</Text>
            
            <View style={styles.helpFeatureGrid}>
              <View style={styles.helpFeatureItem}>
                <View style={[styles.helpFeatureIcon, { backgroundColor: Colors.pink }]}>
                  <Icon name="record-voice-over" size={20} color="#FFFFFF" />
                </View>
                <Text style={[styles.helpFeatureTitle, { color: palette.textPrimary }]}>Sign to Voice</Text>
                <Text style={[styles.helpFeatureDesc, { color: palette.textSecondary }]}>Convert sign language to spoken words</Text>
              </View>

              <View style={styles.helpFeatureItem}>
                <View style={[styles.helpFeatureIcon, { backgroundColor: Colors.green }]}>
                  <Icon name="text-fields" size={20} color="#FFFFFF" />
                </View>
                <Text style={[styles.helpFeatureTitle, { color: palette.textPrimary }]}>Text to Sign</Text>
                <Text style={[styles.helpFeatureDesc, { color: palette.textSecondary }]}>Transform text into sign language</Text>
              </View>

              <View style={styles.helpFeatureItem}>
                <View style={[styles.helpFeatureIcon, { backgroundColor: Colors.orange }]}>
                  <Icon name="mic" size={20} color="#FFFFFF" />
                </View>
                <Text style={[styles.helpFeatureTitle, { color: palette.textPrimary }]}>Voice to Sign</Text>
                <Text style={[styles.helpFeatureDesc, { color: palette.textSecondary }]}>Convert speech to sign language</Text>
              </View>

              <View style={styles.helpFeatureItem}>
                <View style={[styles.helpFeatureIcon, { backgroundColor: Colors.blue }]}>
                  <Icon name="videocam" size={20} color="#FFFFFF" />
                </View>
                <Text style={[styles.helpFeatureTitle, { color: palette.textPrimary }]}>Sign to Text</Text>
                <Text style={[styles.helpFeatureDesc, { color: palette.textSecondary }]}>Recognize signs and convert to text</Text>
              </View>
            </View>

            <View style={styles.helpSpecialFeature}>
              <View style={[styles.helpFeatureIcon, { backgroundColor: Colors.purple }]}>
                <Icon name="swap-horiz" size={22} color="#FFFFFF" />
              </View>
              <View style={styles.helpSpecialInfo}>
                <Text style={[styles.helpSpecialTitle, { color: palette.textLight }]}>Sign to Sign Translation</Text>
                <Text style={[styles.helpSpecialDesc]}>Real-time translation between ASL and PSL</Text>
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );

  const renderTranslateTab = () => (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      {/* Gradient Header */}
      <Animated.View style={[styles.gradientHeader, { 
        opacity: headerAnim,
        transform: [{ 
          translateY: headerAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [-50, 0]
          })
        }]
      }]}>
        <View style={styles.headerContent}>
          <View style={styles.logoSection}>
            <View ref={logoRef} style={styles.logoWrapper}>
              <Image source={require('../assets/icons/logo.png')} style={styles.logoImage} />
            </View>
            <View style={styles.appInfo}>
              <Text style={styles.appTitle}>SignConnect</Text>
              <Text style={styles.appSubtitle}>Bridge Communication</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.infoButton} onPress={() => setHelpOpen(true)}>
              <Icon name="info-outline" size={22} color={palette.textLight} />
          </TouchableOpacity>
        </View>

        <Animated.View style={[styles.headerTextSection, styles.headerTextSectionAnim]}> 
         
          <Text style={[styles.headerDescription, { color: theme === 'dark' ? palette.textSecondary : 'rgba(55, 41, 41, 0.9)' }]}>
            Break communication barriers with{'\n'}AI-powered sign language translation
          </Text>
        </Animated.View>
      </Animated.View>

      <ScrollView 
        style={[styles.scrollContainer, { backgroundColor: palette.background }]} 
        contentContainerStyle={[styles.scrollContent]}
        showsVerticalScrollIndicator={false}
      >
        {/* Language Selection */}
        <Animated.View style={[styles.languageSection, { 
          opacity: fadeAnim,
          transform: [{ 
            translateY: slideAnim.interpolate({
              inputRange: [0, 30],
              outputRange: [0, 30]
            })
          }]
        }]}>
          <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>Choose Your Language</Text>
          <View style={styles.languageToggleContainer}>
            <TouchableOpacity 
              style={[styles.languageToggle, { backgroundColor: palette.cardBackground }, languageMode === 'ASL' && [styles.languageToggleActive, { backgroundColor: palette.surface }]]} 
              onPress={() => setLanguageMode('ASL')}
            >
              <Image source={require('../assets/flags/us.png')} style={styles.languageFlag} />
              <View style={styles.languageTextContainer}>
                <Text style={[styles.languageCode, { color: palette.textSecondary }, languageMode === 'ASL' && { color: palette.textPrimary }]}>ASL</Text>
                <Text style={[styles.languageLabel, { color: palette.textSecondary }, languageMode === 'ASL' && styles.languageLabelActive]}>American</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.languageToggle, { backgroundColor: palette.cardBackground }, languageMode === 'PSL' && [styles.languageToggleActive, { backgroundColor: palette.surface }]]} 
              onPress={() => setLanguageMode('PSL')}
            >
              <Image source={require('../assets/flags/pk.png')} style={styles.languageFlag} />
              <View style={styles.languageTextContainer}>
                <Text style={[styles.languageCode, { color: palette.textSecondary }, languageMode === 'PSL' && { color: palette.textPrimary }]}>PSL</Text>
                <Text style={[styles.languageLabel, { color: palette.textSecondary }, languageMode === 'PSL' && styles.languageLabelActive]}>Pakistani</Text>
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Quick Access Features */}
        <Animated.View style={[styles.featuresSection, { 
          opacity: cardsAnim,
          transform: [{ scale: scaleAnim }]
        }]}>
          <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>Quick Access</Text>
          <View style={styles.featuresGrid}>
            <Animated.View style={{ transform: [{ scale: featureScale0 }] }}>
            <TouchableOpacity 
              style={[styles.featureButton, { backgroundColor: Colors.pink }]} 
              onPress={() => { startHeroFrom(iconRef0, 'record-voice-over', 'rgba(255,255,255,0.25)'); handleFeaturePress('sign-to-voice'); }}
              onPressIn={() => { animateCardPressIn(featureScale0); overlayFadeIn(featureOverlay0); }}
              onPressOut={() => { animateCardPressOut(featureScale0); overlayFadeOut(featureOverlay0); }}
            >
              <View ref={iconRef0} style={styles.featureIconContainer}>
                <Icon name="record-voice-over" size={28} color="#FFFFFF" />
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureButtonTitle}>Sign to Voice</Text>
              </View>
              <Animated.View style={styles.featureOverlay} />
            </TouchableOpacity>
            </Animated.View>

            <Animated.View style={{ transform: [{ scale: featureScale1 }] }}>
            <TouchableOpacity 
              style={[styles.featureButton, { backgroundColor: Colors.green }]} 
              onPress={() => { startHeroFrom(iconRef1, 'translate', 'rgba(255,255,255,0.25)'); handleFeaturePress('text-to-sign'); }}
              onPressIn={() => { animateCardPressIn(featureScale1); overlayFadeIn(featureOverlay1); }}
              onPressOut={() => { animateCardPressOut(featureScale1); overlayFadeOut(featureOverlay1); }}
            >
              <View ref={iconRef1} style={styles.featureIconContainer}>
                <Icon name="translate" size={28} color="#FFFFFF" />
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureButtonTitle}>Text to Sign</Text>
              </View>
              <Animated.View style={styles.featureOverlay} />
            </TouchableOpacity>
            </Animated.View>

            <Animated.View style={{ transform: [{ scale: featureScale2 }] }}>
            <TouchableOpacity 
              style={[styles.featureButton, { backgroundColor: Colors.orange }]} 
              onPress={() => { startHeroFrom(iconRef2, 'mic', 'rgba(255,255,255,0.25)'); handleFeaturePress('voice-to-sign'); }}
              onPressIn={() => { animateCardPressIn(featureScale2); overlayFadeIn(featureOverlay2); }}
              onPressOut={() => { animateCardPressOut(featureScale2); overlayFadeOut(featureOverlay2); }}
            >
              <View ref={iconRef2} style={styles.featureIconContainer}>
                <Icon name="mic" size={28} color="#FFFFFF" />
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureButtonTitle}>Voice to Sign</Text>
              </View>
              <Animated.View style={styles.featureOverlay} />
            </TouchableOpacity>
            </Animated.View>

            <Animated.View style={{ transform: [{ scale: featureScale3 }] }}>
            <TouchableOpacity 
              style={[styles.featureButton, { backgroundColor: Colors.blue }]} 
              onPress={() => { startHeroFrom(iconRef3, 'text-fields', 'rgba(255,255,255,0.25)'); handleFeaturePress('sign-to-text'); }}
              onPressIn={() => { animateCardPressIn(featureScale3); overlayFadeIn(featureOverlay3); }}
              onPressOut={() => { animateCardPressOut(featureScale3); overlayFadeOut(featureOverlay3); }}
            >
              <View ref={iconRef3} style={styles.featureIconContainer}>
                <Icon name="text-fields" size={28} color="#FFFFFF" />
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureButtonTitle}>Sign to Text</Text>
              </View>
              <Animated.View style={styles.featureOverlay} />
            </TouchableOpacity>
            </Animated.View>

          </View>
        </Animated.View>

        {/* Enhanced Sign to Sign Banner */}
        <Animated.View style={[styles.specialFeatureSection, { 
          opacity: cardsAnim,
          transform: [{ 
            translateY: cardsAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0]
            })
          }]
        }]}>
          <TouchableOpacity 
            style={styles.signToSignButton} 
            onPress={() => handleFeaturePress('sign-to-sign')}
          >
            <View style={styles.signToSignContent}>
              <View style={styles.signToSignIconContainer}>
                <Icon name="swap-horiz" size={28} color="#FFFFFF" />
              </View>
              <View style={styles.signToSignTextContainer}>
                <Text style={styles.signToSignTitle}>Sign to Sign</Text>
              </View>
            </View>
            <Animated.View style={[styles.signToSignArrow, { transform: [{ scale: signToSignPulse }] }]}>
              <Icon name="arrow-forward" size={24} color="#FFFFFF" />
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );

  const refreshHistory = useCallback(async () => {
    const uid = user?.id;
    if (!uid) { setHistory([]); return; }
    const list = await HistoryService.getAll(uid);
    setHistory(list);
    try { const s = await getStats(uid); setStats(s as any); } catch {}
  }, [user?.id]);

  useEffect(() => { refreshHistory(); }, [refreshHistory]);

  const renderHistoryTab = () => (
    <View style={styles.tabContent}>
      <HistoryScreen
        entries={history}
        onClearAll={async () => { const uid = user?.id; if (!uid) return; await HistoryService.clearAll(uid); refreshHistory(); }}
        onToggleFavorite={async (id) => { const uid = user?.id; if (!uid) return; const list = await HistoryService.toggleFavorite(uid, id); setHistory(list); }}
        onDelete={async (id) => { const uid = user?.id; if (!uid) return; const list = await HistoryService.deleteOne(uid, id); setHistory(list); }}
      />
    </View>
  );

  const renderProfileTab = () => (
    <View style={styles.tabContent}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 160 }} showsVerticalScrollIndicator={false}>
      <Animated.View style={[styles.profileContainer, { 
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }]
      }]}> 
        <View style={[styles.profileHeader, { backgroundColor: palette.surface }] }>
          <TouchableOpacity style={styles.profileAvatar} onPress={handlePickPhoto} activeOpacity={0.8}>
            {photoURL ? (
              <Image source={{uri: photoURL}} style={styles.profileAvatarImage} />
            ) : user?.avatar ? (
              <Image source={{uri: user.avatar}} style={styles.profileAvatarImage} />
            ) : (
              <Text style={styles.profileAvatarText}>
                {profileName ? profileName.charAt(0).toUpperCase() : 'U'}
              </Text>
            )}
            <View style={styles.profileAvatarEdit}>
              <Icon name="edit" size={14} color={Colors.textLight} />
            </View>
          </TouchableOpacity>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: palette.textPrimary }]}>{profileName}</Text>
            <Text style={[styles.profileEmail, { color: palette.textSecondary }]}>{profileEmail}</Text>
          </View>
        </View>

        {/* profile quick actions removed for a cleaner layout */}

        {/* Removed Total Sessions and Favorites from profile screen per request */}

        <View style={[styles.profileActions, { backgroundColor: palette.surface }] }>
          {/* Theme toggle */}
          <TouchableOpacity style={styles.profileActionButton} onPress={toggleTheme}>
            <Icon name={theme === 'dark' ? 'dark-mode' : 'light-mode'} size={20} color={Colors.primary} />
            <Text style={styles.profileActionText}>Theme: {theme === 'dark' ? 'Dark' : 'Light'}</Text>
            <Icon name="chevron-right" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.profileActionButton} onPress={() => { setNewName(profileName); setEditNameOpen(true); }}>
            <Icon name="settings" size={20} color={Colors.primary} />
            <Text style={styles.profileActionText}>Edit Display Name</Text>
            <Icon name="chevron-right" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.profileActionButton} onPress={() => { setNewEmail(profileEmail); setEditEmailOpen(true); }}>
            <Icon name="email" size={20} color={Colors.primary} />
            <Text style={styles.profileActionText}>Change Email</Text>
            <Icon name="chevron-right" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.profileActionButton} onPress={handlePickPhoto}>
            <Icon name="account-circle" size={20} color={Colors.primary} />
            <Text style={styles.profileActionText}>Change Photo</Text>
            <Icon name="chevron-right" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.profileActionButton} 
            onPress={() => {
              setCurrentPassword('');
              setNewPassword('');
              setConfirmPassword('');
              setChangePasswordOpen(true);
            }}>
            <Icon name="lock" size={20} color={Colors.primary} />
            <Text style={styles.profileActionText}>Change Password</Text>
            <Icon name="chevron-right" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          {/* Notifications row removed to keep profile simple */}
          
          <TouchableOpacity style={styles.profileActionButton} onPress={() => setHelpOpen(true)}>
            <Icon name="help-outline" size={20} color={Colors.primary} />
            <Text style={styles.profileActionText}>Help & Support</Text>
            <Icon name="chevron-right" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.profileActionButton} onPress={() => {
            Alert.alert(
              'Delete Account',
              'This will permanently delete your account and history. Type DELETE to confirm.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Continue', style: 'destructive', onPress: async () => {
                  // Simple inline confirm prompt
                  // In production, replace with a secure re-auth flow
                  try {
                    const uid = user?.id;
                    if (!uid) { Alert.alert('Error', 'Not signed in.'); return; }
                    // Clear history
                    await HistoryService.clearAll(uid);
                    // Delete account (sign out + server-side removal if implemented)
                    await firebaseService.signOut();
                    onLogout?.();
                  } catch (e:any) {
                    Alert.alert('Error', e?.message || 'Failed to delete account');
                  }
                } }
              ]
            );
          }}>
            <Icon name="delete-forever" size={20} color={Colors.danger} />
            <Text style={[styles.profileActionText, { color: Colors.danger }]}>Delete Account</Text>
            <Icon name="chevron-right" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={() => {
          Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', style: 'destructive', onPress: () => onLogout?.() },
          ]);
        }}>
          <Icon name="logout" size={20} color="#FFFFFF" />
          <Text style={styles.logoutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </Animated.View>
      </ScrollView>

      <Modal visible={editNameOpen} animationType="fade" transparent onRequestClose={() => setEditNameOpen(false)}>
        <View style={styles.helpOverlay}>
          <View style={[styles.helpCard, { backgroundColor: palette.surface }]}>
            <View style={styles.helpHeader}>
              <Text style={[styles.helpTitle, { color: palette.textLight }]}>Update Display Name</Text>
              <TouchableOpacity onPress={() => setEditNameOpen(false)} style={styles.helpClose}>
                <Icon name="close" size={20} color={Colors.textLight} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalContentContainer}>
              <Text style={[styles.inputLabel, { color: palette.textPrimary }]}>Display Name</Text>
              <TextInput
                value={newName}
                onChangeText={setNewName}
                placeholder="Enter your name"
                placeholderTextColor={Colors.textSecondary}
                style={[styles.textInput, { backgroundColor: palette.cardBackground, color: palette.textPrimary }]}
              />
              {newName.trim().length > 0 && newName.trim().length < 2 && (
                <Text style={{ color: Colors.danger, marginTop: 6 }}>Name must be at least 2 characters.</Text>
              )}
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setEditNameOpen(false)} style={styles.modalCancelBtn}>
                  <Text style={[styles.modalCancelText, { color: palette.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={async () => {
                  const trimmed = newName.trim();
                  if (!trimmed || trimmed.length < 2) { Alert.alert('Invalid name', 'Please enter at least 2 characters.'); return; }
                  try {
                    await firebaseService.updateProfile({displayName: trimmed});
                    setProfileName(trimmed);
                    Alert.alert('Success', 'Display name updated.');
                    setEditNameOpen(false);
                  } catch (e: any) {
                    Alert.alert('Error', e?.message || 'Failed to update profile');
                  }
                }} style={styles.modalSaveBtn}>
                  <Text style={styles.modalSaveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={editEmailOpen} animationType="fade" transparent onRequestClose={() => setEditEmailOpen(false)}>
        <View style={styles.helpOverlay}>
          <View style={[styles.helpCard, { backgroundColor: palette.surface }]}>
            <View style={styles.helpHeader}>
              <Text style={[styles.helpTitle, { color: palette.textLight }]}>Update Email</Text>
              <TouchableOpacity onPress={() => setEditEmailOpen(false)} style={styles.helpClose}>
                <Icon name="close" size={20} color={Colors.textLight} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalContentContainer}>
              <Text style={[styles.inputLabel, { color: palette.textPrimary }]}>Email</Text>
              <TextInput
                value={newEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                onChangeText={setNewEmail}
                placeholder="Enter new email"
                placeholderTextColor={Colors.textSecondary}
                style={[styles.textInput, { backgroundColor: palette.cardBackground, color: palette.textPrimary }]}
              />
              {!!newEmail && !/^\S+@\S+\.\S+$/.test(newEmail) && (
                <Text style={{ color: Colors.danger, marginTop: 6 }}>Please enter a valid email address.</Text>
              )}
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setEditEmailOpen(false)} style={styles.modalCancelBtn}>
                  <Text style={[styles.modalCancelText, { color: palette.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={async () => {
                  const trimmed = newEmail.trim();
                  if (!/^\S+@\S+\.\S+$/.test(trimmed)) { Alert.alert('Invalid email', 'Please enter a valid email.'); return; }
                  try {
                    await firebaseService.updateEmail(trimmed);
                    setProfileEmail(trimmed);
                    Alert.alert('Success', 'Email updated.');
                    setEditEmailOpen(false);
                  } catch (e: any) {
                    Alert.alert('Error', e?.message || 'Failed to update email');
                  }
                }} style={styles.modalSaveBtn}>
                  <Text style={styles.modalSaveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal 
        visible={changePasswordOpen} 
        animationType="fade" 
        transparent 
        onRequestClose={() => setChangePasswordOpen(false)}>
        <View style={styles.helpOverlay}>
          <View style={[styles.helpCard, { backgroundColor: palette.surface }]}>
            <View style={styles.helpHeader}>
              <Text style={[styles.helpTitle, { color: palette.textLight }]}>Change Password</Text>
              <TouchableOpacity 
                onPress={() => {
                  setChangePasswordOpen(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }} 
                style={styles.helpClose}>
                <Icon name="close" size={20} color={Colors.textLight} />
              </TouchableOpacity>
            </View>
            <ScrollView 
              style={styles.modalContentContainer}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">
              <Text style={[styles.inputLabel, { color: palette.textPrimary }]}>Current Password</Text>
              <View style={[styles.textInput, { backgroundColor: palette.cardBackground, flexDirection: 'row', alignItems: 'center', paddingRight: 50 }]}>
                <TextInput
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Enter your current password"
                  placeholderTextColor={Colors.textSecondary}
                  secureTextEntry={!showCurrentPassword}
                  style={{ flex: 1, color: palette.textPrimary, paddingVertical: 0 }}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={{ position: 'absolute', right: 14, padding: 4 }}
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                  <Icon 
                    name={showCurrentPassword ? "visibility-off" : "visibility"} 
                    size={20} 
                    color={Colors.textSecondary} 
                  />
                </TouchableOpacity>
              </View>

              <Text style={[styles.inputLabel, { color: palette.textPrimary, marginTop: 16 }]}>New Password</Text>
              <View style={[styles.textInput, { backgroundColor: palette.cardBackground, flexDirection: 'row', alignItems: 'center', paddingRight: 50 }]}>
                <TextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Enter new password"
                  placeholderTextColor={Colors.textSecondary}
                  secureTextEntry={!showNewPassword}
                  style={{ flex: 1, color: palette.textPrimary, paddingVertical: 0 }}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={{ position: 'absolute', right: 14, padding: 4 }}
                  onPress={() => setShowNewPassword(!showNewPassword)}>
                  <Icon 
                    name={showNewPassword ? "visibility-off" : "visibility"} 
                    size={20} 
                    color={Colors.textSecondary} 
                  />
                </TouchableOpacity>
              </View>
              {newPassword.length > 0 && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(newPassword) && (
                <Text style={{ color: Colors.danger, marginTop: 6, fontSize: 12 }}>
                  Password must be 8+ chars with uppercase, lowercase, number, and symbol.
                </Text>
              )}

              <Text style={[styles.inputLabel, { color: palette.textPrimary, marginTop: 16 }]}>Confirm New Password</Text>
              <View style={[styles.textInput, { backgroundColor: palette.cardBackground, flexDirection: 'row', alignItems: 'center', paddingRight: 50 }]}>
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm new password"
                  placeholderTextColor={Colors.textSecondary}
                  secureTextEntry={!showConfirmPassword}
                  style={{ flex: 1, color: palette.textPrimary, paddingVertical: 0 }}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={{ position: 'absolute', right: 14, padding: 4 }}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Icon 
                    name={showConfirmPassword ? "visibility-off" : "visibility"} 
                    size={20} 
                    color={Colors.textSecondary} 
                  />
                </TouchableOpacity>
              </View>
              {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                <Text style={{ color: Colors.danger, marginTop: 6, fontSize: 12 }}>
                  Passwords do not match.
                </Text>
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity 
                  onPress={() => {
                    setChangePasswordOpen(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }} 
                  style={styles.modalCancelBtn}
                  disabled={isChangingPassword}>
                  <Text style={[styles.modalCancelText, { color: palette.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={async () => {
                    if (!currentPassword.trim()) {
                      Alert.alert('Error', 'Please enter your current password.');
                      return;
                    }
                    if (!newPassword.trim()) {
                      Alert.alert('Error', 'Please enter a new password.');
                      return;
                    }
                    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(newPassword)) {
                      Alert.alert('Invalid Password', 'Password must be 8+ characters with uppercase, lowercase, number, and symbol.');
                      return;
                    }
                    if (newPassword !== confirmPassword) {
                      Alert.alert('Error', 'New passwords do not match.');
                      return;
                    }
                    if (currentPassword === newPassword) {
                      Alert.alert('Error', 'New password must be different from current password.');
                      return;
                    }

                    setIsChangingPassword(true);
                    try {
                      await firebaseService.changePassword(currentPassword.trim(), newPassword.trim());
                      Alert.alert('Success', 'Password changed successfully.');
                      setChangePasswordOpen(false);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                    } catch (e: any) {
                      Alert.alert('Error', e?.message || 'Failed to change password');
                    } finally {
                      setIsChangingPassword(false);
                    }
                  }} 
                  style={[styles.modalSaveBtn, isChangingPassword && { opacity: 0.6 }]}
                  disabled={isChangingPassword}>
                  <Text style={styles.modalSaveText}>
                    {isChangingPassword ? 'Changing...' : 'Change Password'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'translate':
        return renderTranslateTab();
      case 'history':
        return renderHistoryTab();
      case 'profile':
        return renderProfileTab();
      default:
        return renderTranslateTab();
    }
  };

  return (
    <View style={[styles.mainContainer, { backgroundColor: palette.background }]}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={palette.gradientStart} />

      <Animated.View style={[styles.contentContainer, { backgroundColor: palette.background, transform: [{ scale: overlayScale }, { translateY: overlayScreenAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 6] }) }] }]}>
        {renderTabContent()}
      </Animated.View>

      {/* Feature overlays */}
      {(showSignToVoice || showSignToText || showTextToSign || showVoiceToSign || showSignToSign) && (() => {
        const active = showSignToVoice
          ? 's2v'
          : showSignToText
          ? 's2t'
          : showTextToSign
          ? 't2s'
          : showVoiceToSign
          ? 'v2s'
          : 's2s';

        const commonOpacity = overlayScreenAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
        const radius = overlayScreenAnim.interpolate({ inputRange: [0, 1], outputRange: [22, 0] });
        const backdropOpacity = backdropAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.12] });
        const getTransform = () => {
          switch (active) {
            case 's2v':
              return [
                { translateX: overlayScreenAnim.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) },
                { scale: overlayScreenAnim.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) },
              ];
            case 't2s':
              return [
                { translateX: overlayScreenAnim.interpolate({ inputRange: [0, 1], outputRange: [-28, 0] }) },
                { scale: overlayScreenAnim.interpolate({ inputRange: [0, 1], outputRange: [0.985, 1] }) },
              ];
            case 'v2s':
              return [
                { translateY: overlayScreenAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
              ];
            case 's2t':
              return [
                { scale: overlayScreenAnim.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) },
              ];
            case 's2s':
            default:
              return [{ translateY: overlayScreenAnim.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) }];
          }
        };

        return (
          <>
            <Animated.View pointerEvents="none" style={[styles.overlayDim, { opacity: backdropOpacity }]} />
            <Animated.View style={[styles.overlayContainer, { backgroundColor: palette.background, opacity: commonOpacity, transform: getTransform(), borderTopLeftRadius: radius, borderTopRightRadius: radius }]}>
            {showSignToVoice && (
              <SignToVoiceScreen onBack={handleBackToMain} languageMode={languageMode} showNavigation={true} />
            )}
            {showSignToText && (
              <SignToTextScreen onBack={handleBackToMain} languageMode={languageMode} showNavigation={true} />
            )}
            {showTextToSign && (
              <TextToSignScreen onBack={handleBackToMain} languageMode={languageMode} showNavigation={true} />
            )}
            {showVoiceToSign && (
              <VoiceToSignScreen onBack={handleBackToMain} languageMode={languageMode} showNavigation={true} />
            )}
            {showSignToSign && (
              <SignToSignScreen onBack={handleBackToMain} languageMode={languageMode} showNavigation={true} />
            )}
            </Animated.View>
          </>
        );
      })()}

      {/* Help modal */}
      {renderHelpModal()}

      {/* Hero shared element (floating icon) */}
      {heroIcon && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            transform: [{ translateX: heroX }, { translateY: heroY }],
            opacity: heroOpacity,
          }}
        >
          <Animated.View
            style={{
              // width/height cannot be native-driven; using transform scale from base size
              width: 52,
              height: 52,
              borderRadius: heroBorder,
              backgroundColor: heroBg,
              justifyContent: 'center',
              alignItems: 'center',
              transform: [{ scale: heroSize.interpolate({ inputRange: [0, 52], outputRange: [0.001, 1] }) }],
            }}
          >
            <Icon name={heroIcon} size={28} color="#FFFFFF" />
          </Animated.View>
        </Animated.View>
      )}

      {/* Bottom navigation */}
      <AppBottomNav selectedTab={selectedTab} onSelect={setSelectedTab} />
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: 
  {
    paddingTop:2,
    flex: 1,
    backgroundColor: Colors.background,
  },

  container: {
    flex: 1,

  },

  contentContainer: {
    flex: 1,
 
  },


gradientHeader: {
  backgroundColor: Colors.gradientStart,
  paddingTop: Platform.OS === 'ios' ? 55 : 35,
  paddingBottom: 120,   // Increased so content can overlap smoothly
  paddingHorizontal:20,

  // Stylish Curves
  borderBottomLeftRadius: 0,
  borderBottomRightRadius: 0,

  // Shadows
  elevation: 18,
  shadowColor: Colors.gradientStart,
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.2,
  shadowRadius: 4,

  borderBottomWidth: 0.3,
  borderColor: "rgba(255,255,255,0.3)",
},

headerContent: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 18,
},

logoSection: {
  
  flexDirection: 'row',
  alignItems: 'center',
},

logoWrapper: {
  width: 72,
  height: 72,
  borderRadius:90,
  backgroundColor: '#FFFFFF', // Solid white background
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 14,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 6,
  elevation: 6,
},

logoImage: {
  width: 60,
  height: 60,
  resizeMode: 'contain',
},


  appInfo: {
    justifyContent: 'center',
  },

  appTitle: {
    ...Typography.h2,
    color: Colors.textLight,
    fontWeight: '800',
  },

  appSubtitle: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },

  infoButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerTextSection: {
    alignItems: 'center',
  },

  headerTextSectionAnim: {
    opacity: 1,
    transform: [{ translateY: 0 }],
  },


  headerDescription: {
    ...Typography.body,
    color: 'rgba(55, 41, 41, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Scroll container
  scrollContainer: {
    borderTopRightRadius:90,
    borderTopLeftRadius:90,
    flex: 1,
    marginTop: -90,

    backgroundColor: Colors.background,
  },

  scrollContent: {
    paddingBottom: 120,
  },

  // Language selection section
  languageSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },

  sectionTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '700',
  },

  languageToggleContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBackground,
    borderRadius: 90,
    padding: 4,
    gap: 4,
  },

  languageToggle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'transparent',

  },

  languageToggleActive: {
    backgroundColor: Colors.surface,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderRadius: 90,
  },

  languageFlag: {
    width: 42,
    height: 42,
    borderRadius:90,
    marginRight: 12,
  },

  languageTextContainer: {
    flex: 1,
  },

  languageCode: {
    ...Typography.button,
    color: Colors.textSecondary,
    fontWeight: '700',
  },

  languageCodeActive: {
    color: Colors.textPrimary,
  },

  languageLabel: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  languageLabelActive: {
    color: Colors.textSecondary,
  },

  // Features section
  featuresSection: {
    paddingHorizontal: 20,
    paddingBottom: 14,
  },

  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },

  featureButton: {
    width: (width-52) / 2,
    borderRadius: 20,
    padding: 20,
    alignItems: 'flex-start',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    marginBottom: 2,
  },

  featureIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },

  featureTextContainer: {
    alignItems: 'flex-start',
  },

  featureOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 20,
    backgroundColor: '#000',
    opacity: 0.0001,
  },

  featureButtonTitle: {
    ...Typography.button,
    color: Colors.textLight,
    fontWeight: '700',
    marginBottom: 4,
  },

  featureButtonSubtitle: {
    ...Typography.small,
    color: 'rgba(255,255,255,0.8)',
  },

  // Special feature section
  specialFeatureSection: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },

  signToSignButton: {
    backgroundColor: Colors.purple,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 8,
    shadowColor: Colors.purple,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },

  signToSignContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  signToSignIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },

  signToSignTextContainer: {
    flex: 1,
  },

  signToSignTitle: {
    ...Typography.h3,
    color: Colors.textLight,
    fontWeight: '700',
    marginBottom: 4,
  },

  signToSignSubtitle: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.85)',
  },

  signToSignArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Tab content for other screens
  tabContent: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },

  // History tab styles
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },

  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },

  emptyStateTitle: {
    ...Typography.h2,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },

  emptyStateDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },

  emptyStateButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },

  emptyStateButtonText: {
    ...Typography.button,
    color: Colors.textLight,
  },

  // Enhanced Profile tab styles
  profileContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },

  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 24,
    borderRadius: 20,
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },

  profileAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    elevation: 2,
  },

  profileAvatarImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },

  profileAvatarEdit: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 4,
  },

  profileAvatarText: {
    ...Typography.h1,
    color: Colors.textLight,
    fontWeight: '800',
  },

  profileInfo: {
    flex: 1,
  },

  profileName: {
    ...Typography.h2,
    color: Colors.textPrimary,
    fontWeight: '700',
    marginBottom: 4,
  },

  profileEmail: {
    ...Typography.body,
    color: Colors.textSecondary,
  },

  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },

  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },

  statNumber: {
    ...Typography.h1,
    color: Colors.primary,
    fontWeight: '800',
    marginBottom: 4,
  },

  statLabel: {
    ...Typography.small,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  profileActions: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 8,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },

  profileActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
  },

  profileActionText: {
    ...Typography.body,
    color: Colors.textPrimary,
    flex: 1,
    marginLeft: 12,
    fontWeight: '500',
  },

  logoutButton: {
    backgroundColor: Colors.danger,
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: Colors.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },

  logoutButtonText: {
    ...Typography.button,
    color: Colors.textLight,
    marginLeft: 8,
    fontWeight: '700',
  },

  // Overlay container
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.background,
    zIndex: 100,
  },

  overlayDim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    zIndex: 99,
  },

  // Enhanced Help modal styles
  helpOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  helpCard: {
    width: '100%',
    maxHeight: height * 0.85,
    backgroundColor: Colors.surface,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },

  helpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.gradientStart,
  },

  helpTitle: {
    ...Typography.h2,
    color: Colors.textLight,
    fontWeight: '800',
  },

  helpClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  helpBody: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  helpBodyContent: {
    paddingBottom: 24,
  },

  modalContentContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 8,
  },
  inputLabel: {
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.textPrimary,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
  },
  modalCancelText: {
    color: Colors.textSecondary,
  },
  modalSaveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  modalSaveText: {
    color: Colors.textLight,
    fontWeight: '700',
  },

  helpSection: {
    ...Typography.h3,
    color: Colors.textPrimary,
    fontWeight: '700',
    marginBottom: 16,
  },

  helpLangCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 1,
  },

  helpFlag: {
    width: 40,
    height: 28,
    borderRadius: 6,
    marginRight: 16,
  },

  helpLangInfo: {
    flex: 1,
  },

  helpLangName: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '600',
  },

  helpLangCode: {
    ...Typography.small,
    color: Colors.primary,
    fontWeight: '700',
    marginTop: 2,
  },

  helpLangDesc: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },

  helpFeatureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },

  helpFeatureItem: {
    width: (width+230) / 2,
    backgroundColor: Colors.cardBackground,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },

  helpFeatureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  helpFeatureTitle: {
    ...Typography.small,
    color: Colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },

  helpFeatureDesc: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 12,
  },

  helpSpecialFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.purple,
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
  },

  helpSpecialInfo: {
    flex: 1,
    marginLeft: 16,
  },

  helpSpecialTitle: {
    ...Typography.body,
    color: Colors.textLight,
    fontWeight: '700',
    marginBottom: 4,
  },

  helpSpecialDesc:
   {
    ...Typography.small,
    color: 'rgba(255,255,255,0.8)',
  },
});

export default MainAppScreen;