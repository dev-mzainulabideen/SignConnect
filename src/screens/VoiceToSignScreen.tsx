/**
 * VoiceToSignScreen
 * Input: Voice (speech-to-text). Output: translated sign in a centered, white Avatar Popup.
 * Unified design with TextToSign/SignToSign: slow-float menu bar, simple white popup (no shake/float).
 *
 * Requires:
 * - @react-native-voice/voice
 * - react-native-vector-icons
 *
 * Android: add <uses-permission android:name="android.permission.RECORD_AUDIO" /> to AndroidManifest.xml
 * iOS: cd ios && pod install
 */
//import Voice from '@react-native-voice/voice';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  SafeAreaView,
  Modal,
  Platform,
  Easing,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AppBottomNav, { AppTab } from '../components/AppBottomNav';
import Voice from '@react-native-voice/voice';
import Video, { VideoRef } from 'react-native-video';
import { findAslVideoForText, findPslVideoForText, normalizeText, resolveVideoForSentence } from '../services/keypoints';
import HistoryService from '../services/HistoryService';
import { useTheme } from '../theme/ThemeContext';

interface VoiceToSignScreenProps {
  onBack?: () => void;
  languageMode?: 'PSL' | 'ASL';
  showNavigation?: boolean;
}

const VoiceToSignScreen: React.FC<VoiceToSignScreenProps> = ({ onBack, languageMode = 'ASL', showNavigation = true }) => {
  const { palette } = useTheme();
  const [isRecording, setIsRecording] = useState(false);
  const [language, setLanguage] = useState<'ASL' | 'PSL'>(languageMode);
  const [_voiceInput, setVoiceInput] = useState<string>(''); // raw/latest transcript
  const [recognizedText, setRecognizedText] = useState<string>(''); // visible transcript
  const [videoSrc, setVideoSrc] = useState<any | null>(null); // resolved ASL video
  const voiceVideoRef = useRef<VideoRef | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [signOutput, setSignOutput] = useState<string>('');
  const [selectedTab, setSelectedTab] = useState<AppTab>('translate');
  const [confidence, setConfidence] = useState(0);
  const [recordingStartAt, setRecordingStartAt] = useState<number | null>(null);
  const [recordingElapsedMs, setRecordingElapsedMs] = useState<number>(0);
  const [helpVisible, setHelpVisible] = useState(false);
  const [outputVisible, setOutputVisible] = useState(false);
  const [videoPaused, setVideoPaused] = useState(true);
  const videoDelayTimerRef = useRef<any>(null);

  // Animations
  const micPulse = useRef(new Animated.Value(1)).current;
  const ringPulse = useRef(new Animated.Value(0)).current;

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

  const handleTabSelect = (tab: AppTab) => {
    if (tab !== 'translate') onBack?.();
    setSelectedTab(tab);
  };

  // Mic pulse
  useEffect(() => {
    let animation: Animated.CompositeAnimation | undefined;
    if (isRecording) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(micPulse, { toValue: 1.15, duration: 700, useNativeDriver: true }),
          Animated.timing(micPulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      );
      animation.start();
    }
    return () => animation?.stop?.();
  }, [isRecording, micPulse]);

  // Ambient ring pulse
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(ringPulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(ringPulse, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [ringPulse]);

  // Recording timer
  useEffect(() => {
    let interval: any;
    if (isRecording && recordingStartAt) {
      interval = setInterval(() => setRecordingElapsedMs(Date.now() - recordingStartAt), 200);
    } else {
      setRecordingElapsedMs(0);
    }
    return () => interval && clearInterval(interval);
  }, [isRecording, recordingStartAt]);

  // Voice events
  useEffect(() => {
    const onSpeechStart = () => {};
    const onSpeechEnd = () => {};
    const onSpeechResults = (e: any) => {
      const text = e?.value?.[0] || '';
      setVoiceInput(text);
      setRecognizedText(text);
      // Try to resolve video immediately when we have a stable phrase
      const norm = normalizeText(text);
      const src = language === 'ASL' ? findAslVideoForText(norm) : findPslVideoForText(norm);
      if (src) {
        setVideoSrc(src);
        setSignOutput(`${language} video for: ${norm}`);
        setConfidence(prev => (prev > 0 ? prev : 95));
        setIsProcessing(false);
        if (!outputVisible) setOutputVisible(true);
        // Delayed start for voice path (now a consistent 4s instead of ~5–8s)
        setVideoPaused(true);
        if (videoDelayTimerRef.current) { clearTimeout(videoDelayTimerRef.current); }
        videoDelayTimerRef.current = setTimeout(() => {
          setVideoPaused(false);
        }, 4000);
      }
    };
    const onSpeechError = () => {
      setIsRecording(false);
      setRecordingStartAt(null);
    };

    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;

    return () => {
      try {
        Voice.destroy();
        Voice.removeAllListeners();
      } catch {}
    };
  }, [language, outputVisible]);

  // Convert (uses transcript internally)
  const doConvert = useCallback((_transcript: string) => {
    setIsProcessing(true);
    setSignOutput('');
    setConfidence(0);
    setVideoSrc(null);
    setTimeout(() => {
      const norm = normalizeText(_transcript);
      const { src, matchedKey } = resolveVideoForSentence(language, norm);
      if (src) {
        setSignOutput(`${language} video for: ${matchedKey || norm}`);
        setConfidence(95);
        setVideoSrc(src);
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
              mode: 'voice_to_sign',
              language,
              input: { type: 'voice', value: _transcript },
              output: { type: 'video', value: matchedKey || norm, uri: src },
              confidence: 0.95,
            } as any);
          }
        } catch {} })();
        return;
      }
      // No placeholder available: show neutral caption
      setVideoSrc(null);
      setSignOutput(_transcript || '—');
      setConfidence(80);
      setIsProcessing(false);
      setOutputVisible(true);
      setVideoPaused(true);
    }, 400);
  }, [language]);

  const startVoice = useCallback(async () => {
    setIsRecording(true);
    setRecordingStartAt(Date.now());
    setVoiceInput('');
    setRecognizedText('');
    setSignOutput('');
    setConfidence(0);
    setVideoSrc(null);
    try {
      const locale = Platform.select({ ios: 'en-US', android: 'en-US' }) as string;
      await Voice.start(locale);
    } catch {}
  }, []);

  const stopVoice = useCallback(async () => {
    setIsRecording(false);
    setRecordingStartAt(null);
    let textLocal = _voiceInput;
    try {
      await Voice.stop();
      // After stopping, prefer the latest recognizedText if _voiceInput is empty
      textLocal = _voiceInput || recognizedText;
    } catch {}
    const finalText = (textLocal || recognizedText || '').trim();
    if (!finalText) {
      // No alert: simply no-op; user can try again
      setIsProcessing(false);
      return;
    }
    doConvert(finalText);
  }, [_voiceInput, recognizedText, doConvert]);

  const toggleRecording = useCallback(() => {
    if (isProcessing || outputVisible) return;
    if (isRecording) stopVoice();
    else startVoice();
  }, [isRecording, isProcessing, outputVisible, startVoice, stopVoice]);

  const clearAll = useCallback(() => {
    setVoiceInput('');
    setSignOutput('');
    setConfidence(0);
    setIsRecording(false);
    setRecordingStartAt(null);
    setOutputVisible(false);
    setRecognizedText('');
    setVideoSrc(null);
    setVideoPaused(true);
    if (videoDelayTimerRef.current) { clearTimeout(videoDelayTimerRef.current); videoDelayTimerRef.current = null; }
  }, []);

  const handleLanguagePress = useCallback(() => {
    if (isRecording || isProcessing || outputVisible) return;
    setLanguage(l => (l === 'ASL' ? 'PSL' : 'ASL'));
  }, [isRecording, isProcessing, outputVisible]);

  // Live waveform (never shows transcript; only bars)
  const renderVoiceWaveBars = () => {
    const bars = 28;
    return Array.from({ length: bars }).map((_, i) => {
      const height = isRecording ? Math.random() * 24 + 6 : 4 + (i % 3) * 2;
      const color = isRecording ? '#2563EB' : '#E5E7EB';
      return <View key={i} style={[styles.voiceWaveBar, { height, backgroundColor: color }]} />;
    });
  };

  const ringScale = ringPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const ringOpacity = ringPulse.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.35] });

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerIconCircle} onPress={onBack} accessibilityLabel="Go back">
            <Icon name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}
          >
            <Text style={styles.title}>Voice to Sign</Text>
            <Text style={styles.subtitle}>Speak and get a sign avatar preview</Text>
          </View>
          <TouchableOpacity
            style={styles.headerIconCircle}
            onPress={() => setHelpVisible(true)}
            accessibilityLabel="Help and info"
          >
            <Icon name="info-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.sectionCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderChip}>
                <Icon name="mic" size={16} color="#B91C1C" />
                <Text style={styles.cardHeaderChipText}>Voice</Text>
              </View>
              <View style={[styles.langChip, language === 'ASL' ? styles.langChipAsl : styles.langChipPsl]}>
                <Image
                  source={language === 'ASL' ? require('../assets/flags/us.png') : require('../assets/flags/pk.png')}
                  style={styles.langFlagSmall}
                />
                <Text style={[styles.langChipText, language === 'ASL' ? styles.langChipTextAsl : styles.langChipTextPsl]}>
                  {language}
                </Text>
              </View>
            </View>

            <View style={styles.voiceWindow}>
              <Text style={styles.voicePlaceholder}>
                {isRecording ? 'Listening…' : 'Tap the mic to start recording'}
              </Text>
              <View style={styles.voiceWaveRow}>{renderVoiceWaveBars()}</View>
              <View style={styles.recognizedBox}>
                <Text style={styles.recognizedLabel}>Recognized</Text>
                <Text
                  style={styles.recognizedText}
                  numberOfLines={2}
                >
                  {recognizedText || '—'}
                </Text>
              </View>
            </View>

            <View style={styles.voiceFooter}>
              {isRecording && (
                <View style={styles.recordingCluster}>
                  <Animated.View style={[styles.recordingDot, { transform: [{ scale: micPulse }] }]} />
                  <Text style={styles.recordingTime}>{Math.floor(recordingElapsedMs / 1000)}s</Text>
                </View>
              )}
              {isProcessing && (
                <View style={styles.processingCluster}>
                  <Icon name="hourglass-top" size={16} color="#6B7280" />
                  <Text style={styles.processingText}>Processing…</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.micArea}>
            <Animated.View
              style={[
                styles.micRing,
                { transform: [{ scale: ringScale }], opacity: ringOpacity },
              ]}
            />
            <TouchableOpacity
              style={[styles.micButton, isRecording ? styles.micButtonRecording : styles.micButtonIdle]}
              onPress={toggleRecording}
              disabled={isProcessing || outputVisible}
              accessibilityLabel={isRecording ? 'Stop recording' : 'Start recording'}
            >
              <Animated.View style={{ transform: [{ scale: micPulse }] }}>
                <Icon name={isRecording ? 'stop' : 'mic'} size={40} color="#fff" />
              </Animated.View>
            </TouchableOpacity>
            <Text style={styles.micHint}>
              {isProcessing ? 'Processing…' : isRecording ? 'Tap to stop' : 'Tap to record'}
            </Text>
          </View>
          {showNavigation && <View style={styles.navSpacer} />}
        </View>
      </SafeAreaView>

      {/* Floating Actions Menu (slow floaty, unified styling) */}
      <Animated.View
        pointerEvents={isMenuVisible ? 'auto' : 'none'}
        style={[
          styles.menuBar,
          showNavigation ? styles.menuBarWithNav : styles.menuBarWithoutNav,
          menuBarAnimatedStyle,
        ]}
      >
        {/* Record/Stop */}
        <TouchableOpacity
          style={[styles.menuButton, (isProcessing || outputVisible) && styles.menuButtonDisabled]}
          onPress={toggleRecording}
          accessibilityLabel={isRecording ? 'Stop recording' : 'Start recording'}
          disabled={isProcessing || outputVisible}
        >
          <Icon name={isRecording ? 'stop' : 'mic'} size={22} color={isProcessing || outputVisible ? '#9CA3AF' : '#333'} />
          <Text style={[styles.menuButtonText, (isProcessing || outputVisible) && styles.menuButtonTextDisabled]}>
            {isRecording ? `${Math.floor(recordingElapsedMs / 1000)}s` : 'Record'}
          </Text>
        </TouchableOpacity>

        {/* Preview */}
        <TouchableOpacity
          style={[styles.menuButton, (!signOutput || outputVisible) && styles.menuButtonDisabled]}
          onPress={() => setOutputVisible(true)}
          accessibilityLabel="Open output popup"
          disabled={!signOutput || outputVisible}
        >
          <Icon name="smart-display" size={22} color={!signOutput || outputVisible ? '#9CA3AF' : '#333'} />
          <Text style={[styles.menuButtonText, (!signOutput || outputVisible) && styles.menuButtonTextDisabled]}>
            Preview
          </Text>
        </TouchableOpacity>

        {/* Reset */}
        <TouchableOpacity
          style={styles.menuButton}
          onPress={clearAll}
          accessibilityLabel="Reset"
        >
          <Icon name="backspace" size={22} color="#333" />
          <Text style={styles.menuButtonText}>Reset</Text>
        </TouchableOpacity>

        {/* Language with flags */}
        <TouchableOpacity
          style={[
            styles.menuButton,
            styles.menuButtonPill,
            (isRecording || isProcessing || outputVisible) && styles.menuButtonDisabled,
          ]}
          onPress={handleLanguagePress}
          accessibilityLabel="Toggle language"
          disabled={isRecording || isProcessing || outputVisible}
        >
          <View style={styles.langContent}>
            <Image
              source={language === 'ASL' ? require('../assets/flags/us.png') : require('../assets/flags/pk.png')}
              style={styles.langFlag}
            />
            <Text
              style={[
                styles.menuButtonText,
                (isRecording || isProcessing || outputVisible) && styles.menuButtonTextDisabled,
              ]}
            >
              {language}
            </Text>
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
          <Icon name={isMenuVisible ? 'close' : 'apps'} size={24} color="#fff" />
        </Animated.View>
      </TouchableOpacity>

      {/* Output Popup (white, minimal; no shake/float) */}
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
                <Icon name="assistant" size={14} color="#1E40AF" />
                <Text style={styles.chipLightText}>{language} Avatar</Text>
              </View>
              <TouchableOpacity onPress={() => setOutputVisible(false)} style={styles.headerIconButtonLight}>
                <Icon name="close" size={18} color="#111827" />
              </TouchableOpacity>
            </View>

            <View style={styles.avatarStage}>
              {videoSrc ? (
                <View style={styles.videoWrapper}>
                  <Video
                    ref={voiceVideoRef}
                    source={videoSrc}
                    style={language === 'PSL' ? styles.videoZoom : styles.video}
                    resizeMode={language === 'PSL' ? 'cover' : 'contain'}
                    repeat
                    controls={false}
                    paused={videoPaused}
                    muted={false}
                    playInBackground={false}
                    rate={0.4}
                  />
                  {videoPaused && (
                    <View style={{ position: 'absolute', bottom: 8, right: 10, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                      <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>Starting…</Text>
                    </View>
                  )}
                </View>
              ) : (
                <>
              <Icon name="accessibility-new" size={72} color="#111827" />
              <View style={styles.captionBox}>
                <Text style={styles.captionText}>{signOutput || '—'}</Text>
              </View>
                </>
              )}
              {!!confidence && (
                <View style={styles.confidenceRow}>
                  <Icon name="verified" size={16} color="#22C55E" />
                  <Text style={styles.confidenceText}>{confidence}% confidence</Text>
                </View>
              )}
            </View>

            <View style={styles.avatarFooter}>
              <View style={styles.avatarControls}>
                <TouchableOpacity onPress={() => setOutputVisible(false)} style={styles.ghostButtonLight}>
                  <Icon name="done" size={18} color="#1E88E5" />
                  <Text style={styles.ghostButtonTextLight}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation */}
      {showNavigation && <AppBottomNav selectedTab={selectedTab} onSelect={handleTabSelect} />}

      {/* Help Modal */}
      <Modal visible={helpVisible} animationType="fade" transparent onRequestClose={() => setHelpVisible(false)}>
        <View style={styles.helpOverlay}>
          <View style={styles.helpCard}>
            <View style={styles.helpHeader}>
              <Icon name="info" size={20} color="#2563EB" />
              <Text style={styles.helpTitle}>About “Voice to Sign”</Text>
              <TouchableOpacity onPress={() => setHelpVisible(false)} accessibilityLabel="Close help">
                <Icon name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <View style={styles.helpBody}>
              <Text style={styles.helpParagraph}>
                Tap the mic to record your voice. We transcribe and convert it to a sign avatar. The centered popup stays until you close it.
              </Text>
              <Text style={styles.helpHeading}>Tips</Text>
              <Text style={styles.helpBullet}>• Speak clearly in a quiet setting for better transcription.</Text>
              <Text style={styles.helpBullet}>• Choose ASL/PSL before recording.</Text>
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
  content: { flex: 1, justifyContent: 'space-between', paddingBottom: 12 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#667eea',
  },
  headerIconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  subtitle: { marginTop: 2, fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: '500' },
  headerCenter: { alignItems: 'center' },

  // Section Card
  sectionCard: {
    marginTop: 16, marginHorizontal: 16, backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20,
    elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.16, shadowRadius: 18,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardHeaderChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEE2E2',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999,
  },
  cardHeaderChipText: { color: '#B91C1C', fontWeight: '800', fontSize: 12 },

  langChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999,
    borderWidth: 1,
  },
  langChipAsl: { backgroundColor: '#E0ECFF', borderColor: '#BFDBFE' },
  langChipPsl: { backgroundColor: '#D1FAE5', borderColor: '#A7F3D0' },
  langChipText: { fontWeight: '800', fontSize: 12 },
  langChipTextAsl: { color: '#1E40AF' },
  langChipTextPsl: { color: '#065F46' },
  langFlagSmall: { width: 16, height: 11, borderRadius: 2 },

  // Voice window (no transcript render)
  voiceWindow: {
    minHeight: 160, borderRadius: 16, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E2E8F0',
    padding: 16, alignItems: 'center', justifyContent: 'center',
  },
  voicePlaceholder: { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },
  recognizedBox: {
    marginTop: 12,
    alignSelf: 'stretch',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 10,
  },
  recognizedLabel: { color: '#6B7280', fontSize: 12, fontWeight: '700', marginBottom: 4 },
  recognizedText: { color: '#111827', fontSize: 16 },

  voiceWaveRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginTop: 12,
    height: 32,
  },
  voiceWaveBar: {
    width: 3,
    marginHorizontal: 1,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
  },

  voiceFooter: { marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  recordingCluster: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recordingDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#EF4444' },
  recordingTime: { color: '#B91C1C', fontWeight: '800', fontSize: 12 },
  processingCluster: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  processingText: { color: '#6B7280', fontWeight: '700', fontSize: 12 },

  // Mic area
  micArea: { alignItems: 'center', justifyContent: 'center', marginTop: 14, marginBottom: 8 },
  micRing: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: '#93C5FD',
  },
  micButton: {
    width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center',
    elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.18, shadowRadius: 8,
  },
  micButtonIdle: { backgroundColor: '#2563EB' },
  micButtonRecording: { backgroundColor: '#DC2626' },
  micHint: { marginTop: 8, color: '#6B7280', fontWeight: '700', fontSize: 12 },

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
  langFlag: { width: 18, height: 12, borderRadius: 2, marginRight: 4 },

  // Menu toggle FAB
  menuToggleFab: {
    position: 'absolute', right: 20, width: 52, height: 52, borderRadius: 26, backgroundColor: '#2196F3',
    alignItems: 'center', justifyContent: 'center', elevation: 10, shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12,
  },
  menuToggleFabWithNav: { bottom: 210 },
  menuToggleFabWithoutNav: { bottom: 80 },
  menuToggleFabActive: { backgroundColor: '#1E88E5' },
  navSpacer: { height: 120 },

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
  videoWrapper: {
    width: '100%',
    maxWidth: 400,
    aspectRatio: 16 / 9,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
    alignSelf: 'center',
  },
  video: { width: '100%', height: '100%' },
  videoZoom: { width: '100%', height: '100%', transform: [{ scale: 1.25 }] },
});

export default VoiceToSignScreen;