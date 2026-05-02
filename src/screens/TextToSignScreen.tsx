/**
 * TextToSignScreen
 * Input: Text. Output: translated sign shown in a centered, white Avatar Popup.
 * Unified design with SignToSign/SignToVoice: slow-float menu bar, simple white popup (no pulses).
 * Buttons removed from main content; use the floating actions menu only. No input shakiness.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  SafeAreaView,
  Alert,
  TextInput,
  Modal,
  Easing,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AppBottomNav, { AppTab } from '../components/AppBottomNav';
import HistoryService from '../services/HistoryService';
import Video, { VideoRef } from 'react-native-video';
import { findAslVideoForText, findPslVideoForText, normalizeText, resolveVideoForSentence } from '../services/keypoints';
import { useTheme } from '../theme/ThemeContext';

interface TextToSignScreenProps {
  onBack?: () => void;
  languageMode?: 'PSL' | 'ASL';
  showNavigation?: boolean;
}

const TextToSignScreen: React.FC<TextToSignScreenProps> = ({ onBack, languageMode = 'ASL', showNavigation = true }) => {
  const { palette } = useTheme();
  const [inputText, setInputText] = useState('');
  const [language, setLanguage] = useState<'ASL' | 'PSL'>(languageMode);
  const [isProcessing, setIsProcessing] = useState(false);
  const [signOutput, setSignOutput] = useState<string>('');
  const videoRef = useRef<VideoRef | null>(null);
  const [selectedTab, setSelectedTab] = useState<AppTab>('translate');
  const [confidence, setConfidence] = useState(0);
  const [helpVisible, setHelpVisible] = useState(false);
  const [outputVisible, setOutputVisible] = useState(false);
  const [videoPaused, setVideoPaused] = useState(true);
  const videoDelayTimerRef = useRef<any>(null);

  // Floating actions menu (slow floaty like other screens)
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const menuAnim = useRef(new Animated.Value(0)).current;
  const fabAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(menuAnim, {
      toValue: isMenuVisible ? 1 : 0,
      duration: 380,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    Animated.timing(fabAnim, {
      toValue: isMenuVisible ? 1 : 0,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [isMenuVisible, menuAnim, fabAnim]);

  const menuBarAnimatedStyle = {
    opacity: menuAnim,
    transform: [
      { translateY: menuAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
      { scale: menuAnim.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) },
    ],
  };
  const fabAnimatedStyle = {
    transform: [{ scale: fabAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] }) }],
  };

  // Palette aligned with Main/SignToVoice
  const Colors = {
    gradientStart: '#667eea',
    primary: '#6366F1',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    cardBackground: '#F1F5F9',
    textPrimary: '#1E293B',
    textSecondary: '#64748B',
    textLight: '#FFFFFF',
    border: '#E2E8F0',
    blue: '#3B82F6',
    green: '#10B981',
  } as const;

  const handleTabSelect = (tab: AppTab) => {
    if (tab !== 'translate') onBack?.();
    setSelectedTab(tab);
  };

  // Convert text -> video (ASL). Case-insensitive. PSL can keep placeholder for now.
  const convertToSign = useCallback(() => {
    if (!inputText.trim()) {
      Alert.alert('Input Required', 'Please enter some text to convert to sign language.');
      return;
    }
    setIsProcessing(true);
    setSignOutput('');
    setConfidence(0);
    setTimeout(() => {
      const norm = normalizeText(inputText);
      const { src, matchedKey } = resolveVideoForSentence(language, norm);
      if (src) {
        setSignOutput(`${language} video for: ${matchedKey || norm}`);
        setConfidence(95);
        setIsProcessing(false);
        setOutputVisible(true);
        setVideoPaused(true);
        if (videoDelayTimerRef.current) { clearTimeout(videoDelayTimerRef.current); }
        // Start the video after a consistent 4 second delay (was ~5–8 seconds before)
        videoDelayTimerRef.current = setTimeout(() => {
          setVideoPaused(false);
        }, 4000);
        (async () => { try {
          const uid = (globalThis as any)?.currentUserId;
          if (uid) {
            await HistoryService.add(uid, {
              mode: 'text_to_sign',
              language,
              input: { type: 'text', value: inputText },
              output: { type: 'video', value: matchedKey || norm, uri: src },
              confidence: 0.95,
            } as any);
          }
        } catch {} })();
        return;
      }
      // Unknown word → placeholder
      // No placeholder available: show caption
      setSignOutput(inputText);
      setConfidence(80);
      setIsProcessing(false);
      setOutputVisible(true);
      setVideoPaused(true);
    }, 400);
  }, [inputText, language]);

  const clearAll = useCallback(() => {
    setInputText('');
    setSignOutput('');
    setConfidence(0);
    setOutputVisible(false);
    setVideoPaused(true);
    if (videoDelayTimerRef.current) { clearTimeout(videoDelayTimerRef.current); videoDelayTimerRef.current = null; }
  }, []);

  const handleLanguagePress = useCallback(() => {
    if (outputVisible) return;
    setLanguage(l => (l === 'ASL' ? 'PSL' : 'ASL'));
  }, [outputVisible]);

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.gradientStart} />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerIconCircle} onPress={onBack} accessibilityLabel="Go back">
            <Icon name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.title}>Text to Sign</Text>
            <Text style={styles.subtitle}>Generate a sign avatar from your message</Text>
          </View>
          <TouchableOpacity
            style={styles.headerIconCircle}
            onPress={() => setHelpVisible(true)}
            accessibilityLabel="Help and info"
          >
            <Icon name="info-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Content (no scroll) */}
        <View style={styles.content}>
          {/* Input card (no animation/shake) */}
          <View style={styles.sectionCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderChip}>
                <Icon name="text-fields" size={16} color="#1D4ED8" />
                <Text style={styles.cardHeaderChipText}>Input</Text>
              </View>
              <View style={[styles.langChip, language === 'ASL' ? styles.langChipAsl : styles.langChipPsl]}>
                <Image
                  source={language === 'ASL' ? require('../assets/flags/us.png') : require('../assets/flags/pk.png')}
                  style={styles.langFlag}
                />
                <Text style={[styles.langChipText, language === 'ASL' ? styles.langChipTextAsl : styles.langChipTextPsl]}>{language}</Text>
              </View>
            </View>

            <TextInput
              style={styles.textInput}
              placeholder="Type your message..."
              placeholderTextColor="#9CA3AF"
              value={inputText}
              onChangeText={setInputText}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              maxLength={500}
              editable={!outputVisible}
            />

            <View style={styles.inputFooter}>
              <Text style={styles.characterCount}>{inputText.length}/500</Text>
              <TouchableOpacity
                style={[styles.clearInputPill, (!inputText || outputVisible) && styles.buttonPillDisabled]}
                onPress={() => setInputText('')}
                disabled={!inputText || outputVisible}
              >
                <Icon name="close" size={16} color={!inputText || outputVisible ? '#9CA3AF' : '#111827'} />
                <Text style={[styles.clearInputPillText, (!inputText || outputVisible) && styles.clearInputPillTextDisabled]}>
                  Clear
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Inline buttons removed. Use floating menu only. */}
        </View>

        {/* Floating Actions Menu (slow floaty, unified styling) */}
        <Animated.View
          pointerEvents={isMenuVisible ? 'auto' : 'none'}
          style={[
            styles.menuBar,
            showNavigation ? styles.menuBarWithNav : styles.menuBarWithoutNav,
            menuBarAnimatedStyle,
          ]}
        >
          {/* Convert */}
          <TouchableOpacity
            style={[styles.menuButton, (!inputText.trim() || isProcessing || outputVisible) && styles.menuButtonDisabled]}
            onPress={convertToSign}
            accessibilityLabel="Convert to sign"
            disabled={!inputText.trim() || isProcessing || outputVisible}
          >
            <Icon name="translate" size={22} color={!inputText.trim() || isProcessing || outputVisible ? '#9CA3AF' : '#333'} />
            <Text style={[styles.menuButtonText, (!inputText.trim() || isProcessing || outputVisible) && styles.menuButtonTextDisabled]}>
              Convert
            </Text>
          </TouchableOpacity>

          {/* Clear */}
          <TouchableOpacity
            style={[styles.menuButton, !inputText && styles.menuButtonDisabled]}
            onPress={clearAll}
            accessibilityLabel="Clear input"
            disabled={!inputText}
          >
            <Icon name="backspace" size={22} color={!inputText ? '#9CA3AF' : '#333'} />
            <Text style={[styles.menuButtonText, !inputText && styles.menuButtonTextDisabled]}>Clear</Text>
          </TouchableOpacity>

          {/* Preview */}
          <TouchableOpacity
            style={[styles.menuButton, (!signOutput || outputVisible) && styles.menuButtonDisabled]}
            onPress={() => setOutputVisible(true)}
            accessibilityLabel="Open output popup"
            disabled={!signOutput || outputVisible}
          >
            <Icon name="smart-display" size={22} color={!signOutput || outputVisible ? '#9CA3AF' : '#333'} />
            <Text style={[styles.menuButtonText, (!signOutput || outputVisible) && styles.menuButtonTextDisabled]}>Preview</Text>
          </TouchableOpacity>

          {/* Language */}
          <TouchableOpacity
            style={[styles.menuButton, styles.menuButtonPill]}
            onPress={handleLanguagePress}
            accessibilityLabel="Toggle language"
            disabled={outputVisible}
          >
            <View style={styles.langContent}>
              <Image
                source={language === 'ASL' ? require('../assets/flags/us.png') : require('../assets/flags/pk.png')}
                style={styles.langFlag}
              />
              <Text style={[styles.menuButtonText, outputVisible && styles.menuButtonTextDisabled]}>{language}</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* FAB to toggle menu */}
        <TouchableOpacity
          style={[
            styles.menuToggleFab,
            showNavigation ? styles.menuToggleFabWithNav : styles.menuToggleFabWithoutNav,
            isMenuVisible && styles.menuToggleFabActive,
          ]}
          onPress={() => setIsMenuVisible(v => !v)}
          accessibilityLabel={isMenuVisible ? 'Hide actions menu' : 'Show actions menu'}
        >
          <Animated.View style={fabAnimatedStyle}>
            <Icon name={isMenuVisible ? 'close' : 'apps'} size={24} color={Colors.textLight} />
          </Animated.View>
        </TouchableOpacity>
      </SafeAreaView>

      {/* Bottom Navigation */}
      {showNavigation && <AppBottomNav selectedTab={selectedTab} onSelect={handleTabSelect} />}

      {/* Centered Avatar Popup (white, minimal; no shake/float) */}
      <Modal
        visible={outputVisible}
        animationType="fade"
        transparent
        statusBarTranslucent
        presentationStyle="overFullScreen"
        onRequestClose={() => {
          setOutputVisible(false);
          setVideoPaused(true);
          if (videoDelayTimerRef.current) { clearTimeout(videoDelayTimerRef.current); videoDelayTimerRef.current = null; }
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.avatarCard}>
            <View style={styles.avatarHeader}>
              <View style={styles.chipLight}>
                <Icon name="assistant" size={14} color={Colors.primary} />
                <Text style={styles.chipLightText}>{language} Avatar</Text>
              </View>
              <TouchableOpacity onPress={() => setOutputVisible(false)} style={styles.headerIconButtonLight}>
                <Icon name="close" size={18} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.avatarStage}>
              {language === 'ASL' && normalizeText(inputText) && findAslVideoForText(normalizeText(inputText)) ? (
                <View style={styles.videoWrapper}>
                  <Video
                    ref={videoRef}
                    source={findAslVideoForText(normalizeText(inputText))}
                    style={styles.video}
                    resizeMode="contain"
                    repeat
                    controls={false}
                    paused={videoPaused}
                    muted={false}
                    playInBackground={false}
                    rate={0.4}
                  />
                </View>
              ) : language === 'PSL' && normalizeText(inputText) && findPslVideoForText(normalizeText(inputText)) ? (
                <View style={styles.videoWrapper}>
                  <Video
                    ref={videoRef}
                    source={findPslVideoForText(normalizeText(inputText))}
                    style={styles.videoZoom}
                    resizeMode="cover"
                    repeat
                    controls={false}
                    paused={videoPaused}
                    muted={false}
                    playInBackground={false}
                    rate={0.4}
                  />
                </View>
              ) : (
                <>
              <Icon name="accessibility-new" size={72} color={Colors.textPrimary} />
              <View style={styles.captionBox}>
                <Text style={styles.captionText}>{signOutput || '—'}</Text>
              </View>
                </>
              )}
              {!!confidence && (
                <View style={styles.confidenceRow}>
                  <Icon name="verified" size={16} color={Colors.green} />
                  <Text style={styles.confidenceText}>{confidence}% confidence</Text>
                </View>
              )}
            </View>

            <View style={styles.avatarFooter}>
              <View style={styles.avatarControls}>
                <TouchableOpacity onPress={() => setOutputVisible(false)} style={styles.ghostButtonLight}>
                  <Icon name="done" size={18} color={Colors.blue} />
                  <Text style={styles.ghostButtonTextLight}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Help Modal */}
      <Modal visible={helpVisible} animationType="fade" transparent onRequestClose={() => setHelpVisible(false)}>
        <View style={styles.helpOverlay}>
          <View style={styles.helpCard}>
            <View style={styles.helpHeader}>
              <Icon name="info" size={20} color="#2563EB" />
              <Text style={styles.helpTitle}>About “Text to Sign”</Text>
              <TouchableOpacity onPress={() => setHelpVisible(false)} accessibilityLabel="Close help">
                <Icon name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <View style={styles.helpBody}>
              <Text style={styles.helpParagraph}>
                Type text and convert it into sign language. The white Avatar popup is clean and stays until you close it.
              </Text>
              <Text style={styles.helpHeading}>Tips</Text>
              <Text style={styles.helpBullet}>• Keep messages concise for clearer sign generation.</Text>
              <Text style={styles.helpBullet}>• Toggle ASL/PSL before converting to set target language.</Text>
              <Text style={styles.helpBullet}>• Replace the avatar preview with your production avatar to perform the sign.</Text>
            </View>
            <TouchableOpacity style={styles.helpCloseButton} onPress={() => setHelpVisible(false)}>
              <Text style={styles.helpCloseText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  // Layout
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  safeArea: { flex: 1, paddingBottom: 0 },
  content: { flex: 1, justifyContent: 'flex-start', paddingBottom: 12 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#667eea',
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  helpIconButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerIconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  subtitle: { marginTop: 2, fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: '500' },

  // Section card
  sectionCard: {
    marginTop: 16, marginHorizontal: 16, backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20,
    elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.16, shadowRadius: 18,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardHeaderChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#E0ECFF',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999,
  },
  cardHeaderChipText: { color: '#1D4ED8', fontWeight: '700', fontSize: 12 },
  langChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999,
    borderWidth: 1,
  },
  langChipAsl: { backgroundColor: '#E0ECFF', borderColor: '#BFDBFE' },
  langChipPsl: { backgroundColor: '#D1FAE5', borderColor: '#A7F3D0' },
  langChipText: { fontWeight: '800', fontSize: 12 },
  langFlag: { width: 18, height: 12, borderRadius: 2, marginRight: 4 },
  langChipTextAsl: { color: '#1E40AF' },
  langChipTextPsl: { color: '#065F46' },

  // Text input (no animation)
  textInput: {
    borderWidth: 2, borderColor: '#E5E7EB', borderRadius: 16, padding: 16, fontSize: 16, color: '#111827',
    minHeight: 200, textAlignVertical: 'top', backgroundColor: '#F3F4F6',
  },
  inputFooter: { marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  characterCount: { color: '#6B7280', fontSize: 12, fontWeight: '600' },
  clearInputPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F3F4F6',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: '#E5E7EB',
  },
  clearInputPillText: { color: '#111827', fontWeight: '700', fontSize: 12 },
  buttonPillDisabled: { opacity: 0.6 },
  clearInputPillTextDisabled: { color: '#9CA3AF' },

  // Floating actions menu (slow floaty)
  menuBar: {
    position: 'absolute', left: 16, right: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderWidth: 1, borderColor: '#E2E8F0',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, paddingHorizontal: 10,
    elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 12,
  },
  menuBarWithNav: { bottom: 150 },
  menuBarWithoutNav: { bottom: 20 },
  menuButton: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, marginHorizontal: 6, borderRadius: 14, backgroundColor: '#F3F4F6',
  },
  menuButtonDisabled: { backgroundColor: '#F9FAFB' },
  menuButtonText: { marginTop: 4, fontSize: 12, fontWeight: '700', color: '#111827' },
  menuButtonTextDisabled: { color: '#9CA3AF' },
  menuButtonPill: { minWidth: 70 },
  langContent: { flexDirection: 'row', alignItems: 'center', gap: 6 },

  // Menu toggle FAB
  menuToggleFab: {
    position: 'absolute', right: 20, width: 52, height: 52, borderRadius: 26, backgroundColor: '#2196F3',
    alignItems: 'center', justifyContent: 'center', elevation: 10, shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12,
  },
  menuToggleFabWithNav: { bottom: 210 },
  menuToggleFabWithoutNav: { bottom: 80 },
  menuToggleFabActive: { backgroundColor: '#1E88E5' },

  // Popup (white, minimal; no shake/float)
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  avatarCard: { width: '100%', maxWidth: 420, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.12, shadowRadius: 20 },
  avatarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 0, backgroundColor: '#F1F5F9' },
  headerIconButtonLight: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  chipLight: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#EEF2FF',
  },
  chipLightText: { color: '#6366F1', marginLeft: 8, fontSize: 12, fontWeight: '700' },
  avatarStage: { paddingHorizontal: 12, paddingVertical: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
  captionBox: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    alignSelf: 'stretch',
  },
  captionText: { color: '#111827', fontSize: 14, lineHeight: 20, textAlign: 'center' },
  confidenceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  confidenceText: { color: '#10B981', fontWeight: '700', fontSize: 12 },

  avatarFooter: { paddingHorizontal: 14, paddingVertical: 14 },
  avatarControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 10 },
  ghostButtonLight: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
  ghostButtonTextLight: { color: '#3B82F6', fontWeight: '700' },

  // Help modal
  helpOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 18 },
  helpCard: {
    width: '100%', maxWidth: 520, backgroundColor: '#FFFFFF', borderRadius: 18, padding: 14,
    elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 20,
    borderWidth: 1, borderColor: '#EEF2F7',
  },
  helpHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  helpTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  helpBody: { marginTop: 6 },
  helpParagraph: { color: '#374151', fontSize: 14, lineHeight: 20, marginBottom: 8 },
  helpHeading: { color: '#111827', fontSize: 14, fontWeight: '800', marginTop: 6, marginBottom: 4 },
  helpBullet: { color: '#374151', fontSize: 14, lineHeight: 20, marginBottom: 4 },
  helpCloseButton: {
    marginTop: 10, backgroundColor: '#2563EB', paddingVertical: 12, borderRadius: 12, alignItems: 'center',
  },
  helpCloseText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  headerCenter: {
    alignItems: 'center',
  },
  videoWrapper: {
    width: '100%',
    maxWidth: 400,
    aspectRatio: 16 / 9,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
    alignSelf: 'center',
  },
  video: {
    width: '100%',
    height: undefined,
    aspectRatio: 16 / 9,
  },
  videoZoom: {
    width: '100%',
    height: undefined,
    aspectRatio: 16 / 9,
    transform: [{ scale: 1.25 }],
  },
});

export default TextToSignScreen;