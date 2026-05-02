/**
 * SignToSignScreen
 * Input: a sign (camera/gallery, photo/video). Output: translated sign in a centered Avatar Popup.
 * Stable popup (white, no animation/float) + Gallery has “Pick Image” and “Pick Video” buttons.
 *
 * Dependencies:
 * - react-native-vision-camera
 * - react-native-vector-icons
 * - react-native-image-picker
 * - react-native-create-thumbnail
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  SafeAreaView,
  Alert,
  Image,
  ScrollView,
  Modal,
  Platform,
  ToastAndroid,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import AppBottomNav, { AppTab } from '../components/AppBottomNav';
import { launchImageLibrary, Asset } from 'react-native-image-picker';
import { createThumbnail } from 'react-native-create-thumbnail';
import { Camera, useCameraDevice, useCameraDevices } from 'react-native-vision-camera';
import { NativeModules } from 'react-native';
import { classifyFromPoints } from '../lib/ai/signClassifier';
import HistoryService from '../services/HistoryService';
import Video from 'react-native-video';
import RNFS from 'react-native-fs';
import {
  ASL_WORD_VIDEOS,
  PSL_INPUT_WORD_VIDEOS,
  PSL_OUTPUT_BY_KEY,
  ASL_OUTPUT_BY_KEY,
} from '../data/videoMappings';

interface SignToSignScreenProps {
  onBack?: () => void;
  languageMode?: 'PSL' | 'ASL';
  showNavigation?: boolean;
}

const { height: screenHeight } = Dimensions.get('window');

// Demo two-way dictionary (ASL keyword <-> PSL word)
const ASL_TO_PSL: Record<string, string> = {
  hello: 'سلام',
  'thank you': 'شکریہ',
  please: 'براہ کرم',
  sorry: 'معاف کیجئے',
  yes: 'جی ہاں',
  no: 'نہیں',
  help: 'مدد',
  water: 'پانی',
  food: 'کھانا',
  friend: 'دوست',
};
const PSL_TO_ASL: Record<string, string> = Object.fromEntries(
  Object.entries(ASL_TO_PSL).map(([en, ur]) => [ur, en])
);
const ASL_KEYS = new Set(Object.keys(ASL_TO_PSL));           // lowercase english
const PSL_KEYS = new Set(Object.keys(PSL_TO_ASL));           // urdu words

const SignToSignScreen: React.FC<SignToSignScreenProps> = ({ onBack, languageMode = 'ASL', showNavigation = true }) => {
  // Input/output state
  const [inputSource, setInputSource] = useState<'camera' | 'gallery'>('gallery');
  const [lastPreviewUri, setLastPreviewUri] = useState<string | null>(null);
  const [_lastPreviewKind, _setLastPreviewKind] = useState<'image' | 'video' | null>(null);
  const [outputVideoSource, setOutputVideoSource] = useState<any>(null); // Output video source (mapped)
  const [outputVideoFileName, setOutputVideoFileName] = useState<string | null>(null); // Output video file name for key
  const [outputVideoKey, setOutputVideoKey] = useState<number>(0); // Force re-render key
  const [downloadedVideos, setDownloadedVideos] = useState<Record<string, string>>({}); // Map of fileName -> local path
  const [videoPickerVisible, setVideoPickerVisible] = useState(false);
  const [galleryMode, setGalleryMode] = useState<'ASL' | 'PSL'>('ASL');
  const [selectedWordKey, setSelectedWordKey] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Recognized + translated labels
  const [recognizedLabel, setRecognizedLabel] = useState<string>('');
  const [translatedLabel, setTranslatedLabel] = useState<string>('');

  // Language direction (seeded by prop; auto-updated from detection)
  const [sourceLanguage, setSourceLanguage] = useState<'ASL' | 'PSL'>(languageMode);
  const [targetLanguage, setTargetLanguage] = useState<'ASL' | 'PSL'>(languageMode === 'ASL' ? 'PSL' : 'ASL');

  // Camera/Recording
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [useFrontCamera, setUseFrontCamera] = useState(true);
  const cameraRef = useRef<Camera | null>(null);
  const devices = useCameraDevices();
  const requested = useCameraDevice(useFrontCamera ? 'front' : 'back');
  const device = requested || devices.find?.(d => d.position === (useFrontCamera ? 'front' : 'back')) || devices[0];

  const [captureMode, setCaptureMode] = useState<'photo' | 'video'>('photo');
  const [isRecording, _setIsRecording] = useState(false);
  const isRecordingRef = useRef(false);
  const setIsRecordingStable = useCallback((next: boolean) => {
    isRecordingRef.current = next;
    _setIsRecording(next);
  }, []);
  const recordingStartAtRef = useRef<number | null>(null);
  const [recordingElapsedMs, setRecordingElapsedMs] = useState<number>(0);
  const recordingOpLockRef = useRef(false);
  const recordingStopFallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Misc
  const [selectedTab, setSelectedTab] = useState<AppTab>('translate');
  type InferenceResult = { label: string; confidence: number; timestamp: number };
  const [predictionHistory, setPredictionHistory] = useState<InferenceResult[]>([]);

  // Floating actions menu + help + output popup
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
  const [outputVisible, setOutputVisible] = useState(false);

  const selectedInputVideo =
    selectedWordKey
      ? galleryMode === 'ASL'
        ? ASL_WORD_VIDEOS.find(v => v.id === selectedWordKey) || null
        : PSL_INPUT_WORD_VIDEOS.find(v => v.key === selectedWordKey) || null
      : null;

  const selectedOutputVideo = React.useMemo(() => {
    if (!selectedWordKey) return null;
    
    let outputVideo = null;
    if (galleryMode === 'ASL') {
      // ASL input → PSL output
      outputVideo = PSL_OUTPUT_BY_KEY[selectedWordKey] || null;
      console.log('ASL mode - Looking for PSL output for key:', selectedWordKey, 'Found:', !!outputVideo);
    } else {
      // PSL input → ASL output
      outputVideo = ASL_OUTPUT_BY_KEY[selectedWordKey] || null;
      console.log('PSL mode - Looking for ASL output for key:', selectedWordKey, 'Found:', !!outputVideo);
    }
    
    if (!outputVideo) {
      console.warn('No output video found for key:', selectedWordKey, 'in mode:', galleryMode);
      console.log('Available ASL keys:', Object.keys(ASL_OUTPUT_BY_KEY));
      console.log('Available PSL keys:', Object.keys(PSL_OUTPUT_BY_KEY));
    }
    
    return outputVideo;
  }, [selectedWordKey, galleryMode]);

  // Resolve output video source URI for Video component
  const selectedOutputVideoSource = React.useMemo(() => {
    if (!selectedOutputVideo || !selectedOutputVideo.source) {
      console.log('No selected output video or source');
      return null;
    }
    // For bundled assets, pass the require() id directly to Video.
    // react-native-video supports numeric require IDs for local files.
    console.log('Using raw selectedOutputVideo source for preview:', selectedOutputVideo.fileName);
    return selectedOutputVideo.source;
  }, [selectedOutputVideo]);

  // Get output video for Avatar popup based on recognized label
  const avatarOutputVideo = React.useMemo(() => {
    if (!recognizedLabel || !sourceLanguage) return null;
    // Normalize the label to a key (lowercase, remove spaces, handle special cases)
    const normalizedKey = recognizedLabel.toLowerCase().trim().replace(/\s+/g, '');
    // Handle special cases like "thank you" -> "thankyou"
    const key = normalizedKey === 'thankyou' || normalizedKey === 'thank you' ? 'thankyou' : normalizedKey;
    
    if (sourceLanguage === 'ASL') {
      // ASL input → PSL output
      return PSL_OUTPUT_BY_KEY[key] || null;
    } else {
      // PSL input → ASL output
      return ASL_OUTPUT_BY_KEY[key] || null;
    }
  }, [recognizedLabel, sourceLanguage]);

  // Resolve avatar output video source URI
  const avatarOutputVideoSource = React.useMemo(() => {
    if (!avatarOutputVideo || !avatarOutputVideo.source) return null;
    // For bundled assets, just pass the require() id through.
    return avatarOutputVideo.source;
  }, [avatarOutputVideo]);

  // Resolve main output video source URI
  const resolvedOutputVideoSource = React.useMemo(() => {
    if (!outputVideoSource) {
      console.log('No output video source');
      return null;
    }
    // For bundled assets (require IDs), pass directly to Video.
    // For downloaded/local files, we expect an object like { uri: 'file://...' } which we also pass through.
    console.log(
      'Using raw outputVideoSource for main preview:',
      typeof outputVideoSource,
      outputVideoFileName,
    );
    return outputVideoSource;
  }, [outputVideoSource, outputVideoFileName]);

  // Init model (noop; SignClassifier is initialized lazily in classifyFromPoints)
  useEffect(() => {
    // no-op
  }, []);

  // Camera permission on mount (Vision Camera)
  useEffect(() => {
    (async () => {
      try {
        const status = await Camera.requestCameraPermission();
        setHasPermission(status === 'granted');
      } catch {
        setHasPermission(false);
      }
    })();
  }, []);

  // Recording elapsed timer
  useEffect(() => {
    let interval: any;
    if (isRecording && recordingStartAtRef.current) {
      interval = setInterval(() => {
        setRecordingElapsedMs(Date.now() - (recordingStartAtRef.current as number));
      }, 250);
    } else {
      setRecordingElapsedMs(0);
    }
    return () => interval && clearInterval(interval);
  }, [isRecording]);

  // Tabs
  const handleTabSelect = (tab: AppTab) => {
    if (tab !== 'translate') onBack?.();
    setSelectedTab(tab);
  };

  // Permissions
  const ensurePermissions = useCallback(async () => {
    // For react-native-camera, permissions are handled automatically
    setHasPermission(true);
    return true;
  }, []);

  // Download helper function for bundled video assets
  const downloadVideoAsset = useCallback(async (source: any, fileName: string) => {
    try {
      const asset = Image.resolveAssetSource(source);
      const srcUri = asset?.uri;
      if (!srcUri) {
        throw new Error('Unable to locate video asset.');
      }

      // Use app's document directory for downloaded videos (accessible within app)
      const appDocDir = Platform.OS === 'android' 
        ? RNFS.DocumentDirectoryPath 
        : RNFS.DocumentDirectoryPath;
      const target = `${appDocDir}/${fileName}`;

      // Ensure directory exists
      const dirExists = await RNFS.exists(appDocDir);
      if (!dirExists) {
        await RNFS.mkdir(appDocDir);
      }

      console.log('Downloading video:', { srcUri, target, fileName });

      // Check if URI is a Metro bundler URL (http://) or a local file path
      if (srcUri.startsWith('http://') || srcUri.startsWith('https://')) {
        // Download from URL (Metro bundler)
        const downloadResult = await RNFS.downloadFile({
          fromUrl: srcUri,
          toFile: target,
          progress: (res) => {
            const progress = Math.round((res.bytesWritten / res.contentLength) * 100);
            console.log(`Download progress: ${progress}%`);
          },
        }).promise;
        
        if (downloadResult.statusCode === 200) {
          // Store the downloaded video path
          setDownloadedVideos(prev => ({ ...prev, [fileName]: target }));
          
          // Also save to Downloads folder for user access
          const downloadDir = Platform.OS === 'android' 
            ? RNFS.DownloadDirectoryPath 
            : RNFS.DocumentDirectoryPath;
          const downloadTarget = `${downloadDir}/${fileName}`;
          try {
            await RNFS.copyFile(target, downloadTarget);
          } catch (copyError) {
            console.warn('Could not copy to Downloads folder:', copyError);
          }
          
          if (Platform.OS === 'android') {
            ToastAndroid.show(`Video downloaded: ${fileName}`, ToastAndroid.SHORT);
          } else {
            Alert.alert('Download', `Video downloaded successfully: ${fileName}`);
          }
          console.log('Video downloaded successfully to:', target);
        } else {
          throw new Error(`Download failed with status ${downloadResult.statusCode}`);
        }
      } else {
        // Copy local file
        await RNFS.copyFile(srcUri, target);
        
        // Store the downloaded video path
        setDownloadedVideos(prev => ({ ...prev, [fileName]: target }));
        
        // Also save to Downloads folder for user access
        const downloadDir = Platform.OS === 'android' 
          ? RNFS.DownloadDirectoryPath 
          : RNFS.DocumentDirectoryPath;
        const downloadTarget = `${downloadDir}/${fileName}`;
        try {
          await RNFS.copyFile(target, downloadTarget);
        } catch (copyError) {
          console.warn('Could not copy to Downloads folder:', copyError);
        }
        
        if (Platform.OS === 'android') {
          ToastAndroid.show(`Video downloaded: ${fileName}`, ToastAndroid.SHORT);
        } else {
          Alert.alert('Download', `Video downloaded successfully: ${fileName}`);
        }
        console.log('Video copied successfully to:', target);
      }
      
    } catch (e: any) {
      console.error('Download error:', e);
      Alert.alert('Download failed', e?.message || 'Unable to save video.');
    }
  }, []);

  // Function to load a downloaded video into the output screen (currently unused but available for future use)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const loadDownloadedVideo = useCallback(async (fileName: string) => {
    try {
      // Check if video is in downloaded videos
      const videoPath = downloadedVideos[fileName];
      if (videoPath) {
        const fileExists = await RNFS.exists(videoPath);
        if (fileExists) {
          setOutputVideoSource({ uri: `file://${videoPath}` });
          setOutputVideoFileName(fileName);
          _setLastPreviewKind('video');
          setInputSource('gallery');
          console.log('Loaded downloaded video:', videoPath);
          return true;
        }
      }
      
      // Try to find in app document directory
      const appDocDir = Platform.OS === 'android' 
        ? RNFS.DocumentDirectoryPath 
        : RNFS.DocumentDirectoryPath;
      const target = `${appDocDir}/${fileName}`;
      const exists = await RNFS.exists(target);
      if (exists) {
        setOutputVideoSource({ uri: `file://${target}` });
        setOutputVideoFileName(fileName);
        _setLastPreviewKind('video');
        setInputSource('gallery');
        console.log('Loaded video from app directory:', target);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error loading downloaded video:', error);
      return false;
    }
  }, [downloadedVideos]);

  // Sign-to-sign translation helpers
  const detectLanguageOfLabel = useCallback((label: string): 'ASL' | 'PSL' => {
    if (!label) return 'ASL';
    if (ASL_KEYS.has(label.toLowerCase())) return 'ASL';
    if (PSL_KEYS.has(label)) return 'PSL';
    return sourceLanguage;
  }, [sourceLanguage]);

  const translateSignLabel = useCallback((labelRaw: string) => {
    if (!labelRaw) {
      setTranslatedLabel('');
      setOutputVisible(false);
      return;
    }
    const label = labelRaw.trim();
    const labelLower = label.toLowerCase();

    if (ASL_KEYS.has(labelLower)) {
      const out = ASL_TO_PSL[labelLower];
      setSourceLanguage('ASL');
      setTargetLanguage('PSL');
      setTranslatedLabel(out || 'Translation not available');
      setOutputVisible(true);
      return;
    }
    if (PSL_KEYS.has(label)) {
      const out = PSL_TO_ASL[label];
      setSourceLanguage('PSL');
      setTargetLanguage('ASL');
      setTranslatedLabel(out || 'Translation not available');
      setOutputVisible(true);
      return;
    }
    setTranslatedLabel('Translation not available');
    setOutputVisible(true);
  }, []);

  const swapDirection = useCallback(() => {
    setSourceLanguage(prev => (prev === 'ASL' ? 'PSL' : 'ASL'));
    setTargetLanguage(prev => (prev === 'ASL' ? 'PSL' : 'ASL'));
    setRecognizedLabel(prevRecognized => {
      if (prevRecognized && translatedLabel) {
        const nextRecognized = translatedLabel;
        setTranslatedLabel(prevRecognized);
        return nextRecognized;
      }
      if (translatedLabel) {
        setRecognizedLabel(translatedLabel);
        setTranslatedLabel(prevRecognized || '');
      }
      return prevRecognized;
    });
  }, [translatedLabel]);

  // Process picked/captured media (recognize only; show output after Translate)
  const classifyImageFromPath = useCallback(async (path: string): Promise<InferenceResult> => {
    try {
      const landmarks = await NativeModules.HandLandmarks?.detectFromPath?.(path);
      if (!landmarks || landmarks.length === 0) {
        return { label: 'nothing', confidence: 0, timestamp: Date.now() };
      }
      const result = await classifyFromPoints(landmarks);
      if (!result) return { label: 'nothing', confidence: 0, timestamp: Date.now() };
      return { label: result.topLabel || 'nothing', confidence: result.probs[result.topIndex] || 0, timestamp: Date.now() };
    } catch {
      return { label: 'nothing', confidence: 0, timestamp: Date.now() };
    }
  }, []);

  const smoothPredictions = useCallback((preds: InferenceResult[], windowSize: number): InferenceResult | null => {
    if (preds.length === 0) return null;
    const recent = preds.slice(-windowSize);
    const counts: Record<string, { count: number; total: number }> = {};
    for (const p of recent) {
      if (!counts[p.label]) counts[p.label] = { count: 0, total: 0 };
      counts[p.label].count++;
      counts[p.label].total += p.confidence;
    }
    let best: { label: string; score: number } | null = null as any;
    (Object.entries(counts) as Array<[string, { count: number; total: number }]>).forEach(([label, v]) => {
      const score = v.total / v.count;
      if (!best || score > best.score) best = { label, score };
    });
    return best ? { label: best.label, confidence: best.score, timestamp: Date.now() } : null;
  }, []);

  const handleImageAsset = useCallback(async (asset?: Asset) => {
    if (!asset) return;
    const path = asset.uri || asset.fileName || 'unknown';
    try {
      const result = await classifyImageFromPath(path);
      setPredictionHistory(prev => [...prev, result]);
      const smoothed = smoothPredictions([...predictionHistory, result], 5);
      const best = smoothed || result;

      if (asset.uri) {
        setLastPreviewUri(asset.uri);
        _setLastPreviewKind('image');
        setOutputVideoSource(null); // Clear output video when new input is selected
        setOutputVideoFileName(null);
        setOutputVideoKey(0);
      }
      if (best?.label) {
        setRecognizedLabel(best.label);
        setTranslatedLabel(''); // wait for Translate button
        const detected = detectLanguageOfLabel(best.label);
        if (detected === 'ASL') {
          setSourceLanguage('ASL');
          setTargetLanguage('PSL');
        } else {
          setSourceLanguage('PSL');
          setTargetLanguage('ASL');
        }
      }
    } catch {
      // silent
    }
  }, [predictionHistory, detectLanguageOfLabel, classifyImageFromPath, smoothPredictions]);

  // Photo capture
  const captureFromCameraOnce = useCallback(async () => {
    if (!hasPermission || !cameraRef.current) {
      Alert.alert('Camera not ready', 'Please select Camera and grant permission.');
      return;
    }
    try {
      const photo = await cameraRef.current.takePhoto?.({ qualityPrioritization: 'balanced' } as any);
      const uri = (photo as any)?.path ? `file://${(photo as any).path}` : undefined;
      if (uri) {
        setLastPreviewUri(uri);
        _setLastPreviewKind('image');
        await handleImageAsset({ uri } as Asset);
      }
    } catch (e: any) {
      Alert.alert('Capture failed', e?.message || 'Unable to take photo');
    }
  }, [hasPermission, handleImageAsset]);

  // Video recording: safe stop with fallback
  const stopRecordingSafely = useCallback(async () => {
    if (!isRecordingRef.current) return;
    try {
      await cameraRef.current?.stopRecording?.();
    } catch {}
    if (recordingStopFallbackRef.current) {
      clearTimeout(recordingStopFallbackRef.current);
    }
    recordingStopFallbackRef.current = setTimeout(() => {
      if (isRecordingRef.current) {
        setIsRecordingStable(false);
        recordingStartAtRef.current = null;
        setRecordingElapsedMs(0);
      }
    }, 2500);
  }, [setIsRecordingStable]);

  const toggleRecording = useCallback(async () => {
    if (recordingOpLockRef.current) return;
    recordingOpLockRef.current = true;
    try {
      if (isRecordingRef.current) {
        await stopRecordingSafely();
        recordingOpLockRef.current = false;
        return;
      }
      const ok = await ensurePermissions();
      if (!ok || !cameraRef.current) {
        recordingOpLockRef.current = false;
        return;
      }
      setIsRecordingStable(true);
      recordingStartAtRef.current = Date.now();
      await cameraRef.current.startRecording({
        onRecordingFinished: async (video: any) => {
          const uri = video?.path ? (video.path.startsWith('file://') ? video.path : `file://${video.path}`) : video?.uri;
          if (uri) {
            try {
              const t = await createThumbnail({ url: uri, timeStamp: 800 });
              setLastPreviewUri(t.path);
              _setLastPreviewKind('video');
              await handleImageAsset({ uri: t.path } as Asset); // set recognized only
            } catch {
              setLastPreviewUri(uri);
              _setLastPreviewKind('video');
            }
          }
          setIsRecordingStable(false);
          recordingStartAtRef.current = null;
          setRecordingElapsedMs(0);
          if (recordingStopFallbackRef.current) {
            clearTimeout(recordingStopFallbackRef.current);
            recordingStopFallbackRef.current = null;
          }
          recordingOpLockRef.current = false;
        },
        onRecordingError: (err: any) => {
          setIsRecordingStable(false);
          recordingStartAtRef.current = null;
          setRecordingElapsedMs(0);
          if (recordingStopFallbackRef.current) {
            clearTimeout(recordingStopFallbackRef.current);
            recordingStopFallbackRef.current = null;
          }
          recordingOpLockRef.current = false;
          Alert.alert('Recording error', err?.message || 'Unknown error');
        },
      });
      // allow immediate stop after start
      recordingOpLockRef.current = false;
    } catch {
      setIsRecordingStable(false);
      recordingStartAtRef.current = null;
      setRecordingElapsedMs(0);
      recordingOpLockRef.current = false;
    }
  }, [ensurePermissions, stopRecordingSafely, setIsRecordingStable, handleImageAsset]);

  // Menu handlers
  const handlePressCamera = useCallback(async () => {
    if (isRecordingRef.current && inputSource === 'camera' && captureMode === 'video') {
      await stopRecordingSafely();
      return;
    }
    if (inputSource !== 'camera') {
      const ok = await ensurePermissions();
      if (!ok) return;
      setInputSource('camera');
    }
    setCaptureMode('photo');
  }, [inputSource, ensurePermissions, captureMode, stopRecordingSafely]);

  const handlePressGallery = useCallback(() => {
    setInputSource('gallery');
  }, []);

  const handlePressVideo = useCallback(async () => {
    if (inputSource !== 'camera') {
      setInputSource('camera');
      const ok = await ensurePermissions();
      if (!ok) return;
    }
    setCaptureMode('video');
    await toggleRecording();
  }, [inputSource, ensurePermissions, toggleRecording]);

  const handlePressFlip = useCallback(() => {
    setUseFrontCamera(v => !v);
  }, []);

  const handlePressSwap = useCallback(() => {
    swapDirection();
  }, [swapDirection]);

  const handleShutterPress = useCallback(async () => {
    if (inputSource !== 'camera') {
      const ok = await ensurePermissions();
      if (!ok) return;
      setInputSource('camera');
      return;
    }
    if (captureMode === 'video') {
      await stopRecordingSafely();
      return;
    }
    await captureFromCameraOnce();
  }, [inputSource, ensurePermissions, captureMode, stopRecordingSafely, captureFromCameraOnce]);

  const handleTranslatePress = useCallback(() => {
    if (!recognizedLabel) {
      Alert.alert('Translate', 'Please capture or pick a sign first.');
      return;
    }
    translateSignLabel(recognizedLabel);
    // Log history
    (async () => { try {
      const uid = (globalThis as any)?.currentUserId;
      if (uid) {
        await HistoryService.add(uid, {
          mode: 'sign_to_sign',
          language: sourceLanguage,
          input: { type: _lastPreviewKind === 'video' ? 'video' : 'image', value: recognizedLabel, uri: lastPreviewUri || undefined },
          output: { type: 'text', value: translatedLabel || '' },
          confidence: 0.9,
        } as any);
      }
    } catch {} })();
  }, [recognizedLabel, translateSignLabel, sourceLanguage, _lastPreviewKind, lastPreviewUri, translatedLabel]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerIconCircle} onPress={onBack} accessibilityLabel="Go back">
            <Icon name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Sign to Sign</Text>
          <TouchableOpacity
            style={styles.headerIconCircle}
            onPress={() => setHelpVisible(true)}
            accessibilityLabel="Help and info"
          >
            <Icon name="info-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Direction pill */}
          <View style={styles.directionPill}>
            <Text style={styles.directionText}>{sourceLanguage} → {targetLanguage}</Text>
          </View>

          {/* Input Preview (Camera/Gallery) */}
          <View style={styles.videoContainer}>
            <View style={styles.videoWindow}>
              {inputSource === 'camera' ? (
                <View style={styles.cameraView}>
                  {hasPermission && device ? (
                    <Camera
                      ref={(ref) => { cameraRef.current = ref; }}
                      style={styles.cameraPreview}
                      device={device}
                      isActive={inputSource === 'camera' && hasPermission && !!device}
                      photo={true}
                      video={false}
                      onError={(e) => { try { console.warn('Camera error (sign-to-sign)', e); } catch {} }}
                    />
                  ) : lastPreviewUri ? (
                    <Image source={{ uri: lastPreviewUri }} style={styles.cameraPreview} resizeMode="cover" />
                  ) : (
                    <View style={styles.personIllustration}>
                      <View style={styles.personHead} />
                      <View style={styles.personBody} />
                      <View style={styles.personArm} />
                      <Text style={styles.galleryText}>
                        {!hasPermission ? 'Waiting for camera permission…' : 'No camera device detected'}
                      </Text>
                    </View>
                  )}

                  {/* Recording indicator */}
                  <View style={styles.recordingIndicator}>
                    {isRecording ? (
                      <View style={styles.recordingRow}>
                        <View style={styles.recordingDot} />
                        <Text style={styles.recordingText}>
                          {Math.floor(recordingElapsedMs / 1000)}s
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Shutter (Photo / Stop Video) */}
                  <View style={styles.shutterContainer}>
                    <TouchableOpacity
                      style={[
                        styles.shutterButton,
                        captureMode === 'video' && styles.shutterButtonVideo,
                        isRecording && styles.shutterButtonRecording,
                      ]}
                      onPress={handleShutterPress}
                      accessibilityLabel={captureMode === 'video' ? (isRecording ? 'Stop recording' : 'Start recording') : 'Take picture'}
                    >
                      <Icon
                        name={captureMode === 'video' ? (isRecording ? 'stop' : 'videocam') : 'camera-alt'}
                        size={28}
                        color={captureMode === 'video' ? '#fff' : '#222'}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.galleryView}>
                  {lastPreviewUri ? (
                    _lastPreviewKind === 'video' ? (
                      <View style={styles.galleryVideoPreviewContainer} pointerEvents="none">
                        <Video
                          source={{ uri: lastPreviewUri }}
                          style={styles.galleryVideoPreview}
                          resizeMode="cover"
                          repeat
                          muted
                          controls={false}
                          paused={false}
                          rate={0.3}
                          disableFocus={true}
                          ignoreSilentSwitch="ignore"
                          hideShutterView={true}
                          playInBackground={false}
                          playWhenInactive={false}
                          allowsExternalPlayback={false}
                        />
                      </View>
                    ) : (
                      <Image
                        source={{ uri: lastPreviewUri }}
                        style={styles.galleryImagePreview}
                        resizeMode="cover"
                      />
                    )
                  ) : (
                    <View style={styles.galleryEmptyState}>
                      <View style={styles.galleryEmptyIconCircle}>
                        <FontAwesome name="photo" size={34} color="#4B5563" />
                      </View>
                      <Text style={styles.galleryEmptyTitle}>No media selected</Text>
                      <Text style={styles.galleryEmptySubtitle}>
                        Pick an image or one of the ASL word videos to preview it here.
                      </Text>
                    </View>
                  )}
                  <View style={styles.galleryButtonsRow}>
                    <TouchableOpacity
                      style={[styles.galleryButton, styles.galleryButtonPrimary]}
                      onPress={() =>
                        launchImageLibrary({ mediaType: 'photo', selectionLimit: 1 }, async r => {
                          if (r.didCancel || r.errorCode) return;
                          const a = r.assets?.[0] as Asset | undefined;
                          if (!a?.uri) return;
                          setLastPreviewUri(a.uri);
                          _setLastPreviewKind('image');
                          setOutputVideoSource(null); // Clear output video when new image is picked
                          setOutputVideoFileName(null);
                          setOutputVideoKey(0);
                          await handleImageAsset(a);
                        })
                      }
                    >
                      <Icon name="image" size={18} color="#fff" />
                      <Text style={styles.galleryButtonText}>Pick Image</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.galleryButton, styles.galleryButtonSecondary]}
                      onPress={() => {
                        setVideoPickerVisible(true);
                      }}
                    >
                      <Icon name="movie" size={18} color="#111827" />
                      <Text style={styles.galleryButtonTextSecondary}>Pick Video</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Translate action */}
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={[styles.translateButton, !recognizedLabel && styles.disabledButton]}
              onPress={handleTranslatePress}
              disabled={!recognizedLabel}
              accessibilityLabel="Translate detected sign"
            >
              <Text style={[styles.translateButtonText, !recognizedLabel && styles.disabledButtonText]}>
                Translate
              </Text>
            </TouchableOpacity>
          </View>

          {/* Recognized chip */}
          {!!recognizedLabel && (
            <View style={styles.recognizedContainer}>
              <View style={styles.recognizedPill}>
                <Text style={styles.recognizedText}>Recognized: {recognizedLabel}</Text>
              </View>
            </View>
          )}

          {showNavigation && <View style={styles.navSpacer} />}
        </ScrollView>

        {/* Floating Actions Menu */}
        {isMenuVisible && (
          <View
            style={[
              styles.menuBar,
              showNavigation ? styles.menuBarWithNav : styles.menuBarWithoutNav,
            ]}
          >
            {/* Camera */}
            <TouchableOpacity
              style={[styles.menuButton, inputSource === 'camera' && styles.menuButtonActive]}
              onPress={handlePressCamera}
              accessibilityLabel="Camera"
            >
              <Icon name="photo-camera" size={22} color={inputSource === 'camera' ? '#fff' : '#333'} />
            </TouchableOpacity>

            {/* Gallery */}
            <TouchableOpacity
              style={[styles.menuButton, inputSource === 'gallery' && styles.menuButtonActive]}
              onPress={handlePressGallery}
              accessibilityLabel="Gallery"
            >
              <Icon name="photo-library" size={22} color={inputSource === 'gallery' ? '#fff' : '#333'} />
            </TouchableOpacity>

            {/* Video */}
            <TouchableOpacity
              style={[styles.menuButton, captureMode === 'video' && styles.menuButtonVideoActive, isRecording && styles.menuButtonActive]}
              onPress={handlePressVideo}
              accessibilityLabel={isRecording ? 'Stop recording' : 'Start video recording'}
            >
              <View style={styles.videoButtonContent}>
                <Icon name={isRecording ? 'stop' : 'videocam'} size={22} color={isRecording ? '#fff' : '#333'} />
                {isRecording && <View style={styles.recordBadge} />}
              </View>
            </TouchableOpacity>

            {/* Flip */}
            <TouchableOpacity
              style={styles.menuButton}
              onPress={handlePressFlip}
              accessibilityLabel="Flip camera"
            >
              <Icon name="flip-camera-android" size={22} color="#333" />
            </TouchableOpacity>

            {/* Language with flags + Swap */}
            <TouchableOpacity
              style={[styles.menuButton, styles.menuButtonPill]}
              onPress={handlePressSwap}
              accessibilityLabel="Swap ASL/PSL"
            >
              <View style={styles.langContent}>
                <Image
                  source={sourceLanguage === 'ASL' ? require('../assets/flags/us.png') : require('../assets/flags/pk.png')}
                  style={styles.langFlag}
                />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* FAB to toggle menu (unchanged position) */}
        <TouchableOpacity
          style={[
            styles.menuToggleFab,
            showNavigation ? styles.menuToggleFabWithNav : styles.menuToggleFabWithoutNav,
            isMenuVisible && styles.menuToggleFabActive,
          ]}
          onPress={() => setIsMenuVisible(v => !v)}
          accessibilityLabel={isMenuVisible ? 'Hide actions menu' : 'Show actions menu'}
        >
          <Icon name={isMenuVisible ? 'close' : 'apps'} size={24} color="#fff" />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Bottom Navigation */}
      {showNavigation && <AppBottomNav selectedTab={selectedTab} onSelect={handleTabSelect} />}

      {/* ASL/PSL Words Video Picker */}
      <Modal
        visible={videoPickerVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setVideoPickerVisible(false)}
      >
        <View style={styles.videoPickerOverlay}>
          <View style={styles.videoPickerCard}>
            {/* Header */}
            <View style={styles.videoPickerHeader}>
              <TouchableOpacity
                style={styles.headerIconCircle}
                onPress={() => setVideoPickerVisible(false)}
                accessibilityLabel="Close video picker"
              >
                <Icon name="arrow-back" size={22} color="#111827" />
              </TouchableOpacity>
              <Text style={styles.videoPickerTitle}>ASL / PSL Word Videos</Text>
              <View style={styles.headerSpacer} />
            </View>

            {/* 2‑column preview */}
            <View style={styles.videoPreviewRow}>
              <View style={styles.videoPreviewColumn}>
                <Text style={styles.previewLabel}>
                  {galleryMode === 'ASL' ? 'ASL Input' : 'PSL Input'}
                </Text>
                {selectedInputVideo ? (
                  <Video
                    source={selectedInputVideo.source}
                    style={styles.previewVideo}
                    resizeMode="cover"
                    muted
                    repeat
                  />
                ) : (
                  <View style={styles.previewPlaceholder}>
                    <Icon name="play-circle-outline" size={40} color="#9CA3AF" />
                    <Text style={styles.previewPlaceholderText}>Select an ASL video</Text>
                  </View>
                )}
              </View>
              <View style={styles.videoPreviewColumn}>
                <Text style={styles.previewLabel}>
                  {galleryMode === 'ASL' ? 'PSL Output' : 'ASL Output'}
                </Text>
                {selectedOutputVideo && selectedOutputVideoSource ? (
                  <View style={styles.previewVideoContainer} pointerEvents="none">
                    <Video
                      key={`preview-${selectedOutputVideo.fileName}-${selectedWordKey}-${galleryMode}`}
                      source={selectedOutputVideoSource}
                      style={styles.previewVideo}
                      resizeMode="contain"
                      muted
                      repeat
                      controls={false}
                      paused={false}
                      rate={0.3}
                      disableFocus={true}
                      ignoreSilentSwitch="ignore"
                      hideShutterView={true}
                      playInBackground={false}
                      playWhenInactive={false}
                      allowsExternalPlayback={false}
                      onError={(error) => {
                        console.error('Gallery picker output video error:', error);
                        console.error('Video source:', JSON.stringify(selectedOutputVideoSource, null, 2));
                        console.error('Video fileName:', selectedOutputVideo.fileName);
                        console.error('Selected word key:', selectedWordKey);
                        console.error('Gallery mode:', galleryMode);
                        console.error('Raw selectedOutputVideo:', selectedOutputVideo);
                      }}
                      onLoad={() => {
                        console.log('Gallery picker output video loaded successfully:', selectedOutputVideo.fileName);
                      }}
                      onLoadStart={() => {
                        console.log('Gallery picker output video loading started:', selectedOutputVideo.fileName);
                        console.log('Video source type:', typeof selectedOutputVideoSource);
                      }}
                      onReadyForDisplay={() => {
                        console.log('Gallery picker output video ready for display:', selectedOutputVideo.fileName);
                      }}
                    />
                  </View>
                ) : (
                  <View style={styles.previewPlaceholder}>
                    <Icon name="hourglass-empty" size={32} color="#9CA3AF" />
                    <Text style={styles.previewPlaceholderText}>
                      {selectedInputVideo
                        ? galleryMode === 'ASL'
                          ? 'PSL video coming soon'
                          : 'ASL video coming soon'
                        : galleryMode === 'ASL'
                          ? 'Select an ASL video'
                          : 'Select a PSL video'}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Mode toggle + Lists */}
            <View style={styles.galleryModeRow}>
              <TouchableOpacity
                style={[
                  styles.galleryModeChip,
                  galleryMode === 'ASL' && styles.galleryModeChipActive,
                ]}
                onPress={() => {
                  setGalleryMode('ASL');
                  setSelectedWordKey(null);
                  setSearchQuery('');
                }}
              >
                <Text
                  style={[
                    styles.galleryModeText,
                    galleryMode === 'ASL' && styles.galleryModeTextActive,
                  ]}
                >
                  ASL Words
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.galleryModeChip,
                  galleryMode === 'PSL' && styles.galleryModeChipActive,
                ]}
                onPress={() => {
                  setGalleryMode('PSL');
                  setSelectedWordKey(null);
                  setSearchQuery('');
                }}
              >
                <Text
                  style={[
                    styles.galleryModeText,
                    galleryMode === 'PSL' && styles.galleryModeTextActive,
                  ]}
                >
                  PSL Words
                </Text>
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Icon name="search" size={20} color="#6B7280" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder={`Search ${galleryMode === 'ASL' ? 'ASL' : 'PSL'} words...`}
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  style={styles.searchClearButton}
                  accessibilityLabel="Clear search"
                >
                  <Icon name="close" size={18} color="#6B7280" />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView style={styles.videoPickerBody} contentContainerStyle={styles.videoPickerScrollContent}>
              <Text style={styles.sectionLabel}>
                {galleryMode === 'ASL'
                  ? 'American Sign Language (ASL) Words'
                  : 'Pakistan Sign Language (PSL) Words'}
              </Text>
              <View style={styles.videoGrid}>
                {(() => {
                  const filteredASL = galleryMode === 'ASL'
                    ? ASL_WORD_VIDEOS.filter(video => {
                        if (!searchQuery.trim()) return true;
                        const query = searchQuery.toLowerCase();
                        const readable =
                          'ASL ' + video.id.charAt(0).toUpperCase() + video.id.slice(1);
                        return (
                          video.fileName.toLowerCase().includes(query) ||
                          video.id.toLowerCase().includes(query) ||
                          readable.toLowerCase().includes(query)
                        );
                      })
                    : [];
                  const filteredPSL = galleryMode === 'PSL'
                    ? PSL_INPUT_WORD_VIDEOS.filter(video => {
                        if (!searchQuery.trim()) return true;
                        const query = searchQuery.toLowerCase();
                        const readable =
                          'PSL ' + video.key.charAt(0).toUpperCase() + video.key.slice(1);
                        return (
                          video.fileName.toLowerCase().includes(query) ||
                          video.key.toLowerCase().includes(query) ||
                          readable.toLowerCase().includes(query)
                        );
                      })
                    : [];
                  const filteredVideos = galleryMode === 'ASL' ? filteredASL : filteredPSL;
                  
                  if (filteredVideos.length === 0 && searchQuery.trim()) {
                    return (
                      <View style={styles.noResultsContainer}>
                        <Icon name="search-off" size={48} color="#9CA3AF" />
                        <Text style={styles.noResultsText}>No videos found</Text>
                        <Text style={styles.noResultsSubtext}>
                          Try searching with a different term
                        </Text>
                      </View>
                    );
                  }
                  
                  return galleryMode === 'ASL'
                    ? filteredASL.map(video => {
                      const isActive = selectedWordKey === video.id;
                      const readable =
                        'ASL ' + video.id.charAt(0).toUpperCase() + video.id.slice(1);
                      const description = `Tap to see ${readable} with PSL output.`;
                      return (
                        <TouchableOpacity
                          key={video.id}
                          style={[styles.videoCard, isActive && styles.videoCardActive]}
                          onPress={() => setSelectedWordKey(video.id)}
                          accessibilityLabel={readable}
                        >
                          <View style={styles.videoThumb}>
                            <Icon
                              name="play-circle-filled"
                              size={32}
                              color={isActive ? '#2563EB' : '#4B5563'}
                            />
                          </View>
                          <Text style={styles.videoFileName}>{video.fileName}</Text>
                          <Text style={styles.videoTitle}>{readable}</Text>
                          <Text style={styles.videoDescription}>{description}</Text>
                          <TouchableOpacity
                            style={styles.downloadChip}
                            onPress={() => downloadVideoAsset(video.source, video.fileName)}
                          >
                            <Icon name="file-download" size={16} color="#1E3A8A" />
                            <Text style={styles.downloadChipText}>Download</Text>
                          </TouchableOpacity>
                        </TouchableOpacity>
                      );
                    })
                    : filteredPSL.map(video => {
                      const isActive = selectedWordKey === video.key;
                      const readable =
                        'PSL ' + video.key.charAt(0).toUpperCase() + video.key.slice(1);
                      const description = `Tap to see ${readable} with ASL output.`;
                      return (
                        <TouchableOpacity
                          key={video.fileName}
                          style={[styles.videoCard, isActive && styles.videoCardActive]}
                          onPress={() => setSelectedWordKey(video.key)}
                          accessibilityLabel={readable}
                        >
                          <View style={styles.videoThumb}>
                            <Icon
                              name="play-circle-filled"
                              size={32}
                              color={isActive ? '#2563EB' : '#4B5563'}
                            />
                          </View>
                          <Text style={styles.videoFileName}>{video.fileName}</Text>
                          <Text style={styles.videoTitle}>{readable}</Text>
                          <Text style={styles.videoDescription}>{description}</Text>
                          <TouchableOpacity
                            style={styles.downloadChip}
                            onPress={() => downloadVideoAsset(video.source, video.fileName)}
                          >
                            <Icon name="file-download" size={16} color="#1E3A8A" />
                            <Text style={styles.downloadChipText}>Download</Text>
                          </TouchableOpacity>
                        </TouchableOpacity>
                      );
                    });
                })()}
              </View>
            </ScrollView>

            {/* Footer actions */}
            <View style={styles.videoPickerFooter}>
              <TouchableOpacity
                style={[styles.usePairButton, (!selectedInputVideo || !selectedOutputVideo || !selectedOutputVideoSource) && styles.usePairButtonDisabled]}
                disabled={!selectedInputVideo || !selectedOutputVideo || !selectedOutputVideoSource}
                onPress={() => {
                  if (!selectedInputVideo) {
                    console.warn('Cannot use pair: missing input video');
                    Alert.alert('Error', 'Please select an input video first.');
                    return;
                  }
                  if (!selectedOutputVideo) {
                    console.warn('Cannot use pair: missing output video mapping');
                    Alert.alert('Error', `No ${galleryMode === 'ASL' ? 'PSL' : 'ASL'} output video available for this word.`);
                    return;
                  }
                  if (!selectedOutputVideo.source) {
                    console.warn('Cannot use pair: output video has no source');
                    Alert.alert('Error', 'Output video source is invalid.');
                    return;
                  }
                  if (!selectedOutputVideoSource) {
                    console.warn('Cannot use pair: output video source could not be resolved');
                    Alert.alert('Error', 'Could not resolve output video source.');
                    return;
                  }
                  try {
                    console.log('Setting output video:', {
                      fileName: selectedOutputVideo.fileName,
                      sourceType: typeof selectedOutputVideo.source,
                      hasSource: !!selectedOutputVideo.source,
                    });

                    // Set the OUTPUT video (mapped) for popup display
                    setInputSource('gallery');
                    
                    // Clear any previous preview
                    setLastPreviewUri(null);
                    
                    // For bundled assets, just pass the require() id through to Video.
                    console.log(
                      'Setting output video from require source:',
                      selectedOutputVideo.fileName,
                      typeof selectedOutputVideo.source,
                    );
                    setOutputVideoSource(selectedOutputVideo.source);
                    setOutputVideoKey(prev => prev + 1);
                    
                    setOutputVideoFileName(selectedOutputVideo.fileName);
                    _setLastPreviewKind('video');
                    
                    // Set recognized and translated labels based on selected word
                    const wordLabel = selectedWordKey || '';
                    setRecognizedLabel(wordLabel);
                    
                    // Auto-translate the label
                    if (galleryMode === 'ASL') {
                      const translated = ASL_TO_PSL[wordLabel.toLowerCase()] || 'Translation not available';
                      setTranslatedLabel(translated);
                      setSourceLanguage('ASL');
                      setTargetLanguage('PSL');
                    } else {
                      const translated = PSL_TO_ASL[wordLabel] || 'Translation not available';
                      setTranslatedLabel(translated);
                      setSourceLanguage('PSL');
                      setTargetLanguage('ASL');
                    }
                    
                    console.log('Output video set successfully:', selectedOutputVideo.fileName);
                    
                    // Automatically open the popup to show the output video
                    setOutputVisible(true);
                  } catch (error: any) {
                    console.error('Error setting output video:', error);
                    Alert.alert('Error', `Failed to set output video: ${error?.message || 'Unknown error'}`);
                  }
                  setVideoPickerVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.usePairButtonText,
                    !selectedInputVideo && styles.usePairButtonTextDisabled,
                  ]}
                >
                  {galleryMode === 'ASL' ? 'Use this ASL / PSL pair' : 'Use this PSL / ASL pair'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Help Modal */}
      <Modal visible={helpVisible} animationType="fade" transparent onRequestClose={() => setHelpVisible(false)}>
        <View style={styles.helpOverlay}>
          <View style={styles.helpCard}>
            <View style={styles.helpHeader}>
              <Icon name="info" size={22} color="#2196F3" />
              <Text style={styles.helpTitle}>About “Sign to Sign”</Text>
              <TouchableOpacity onPress={() => setHelpVisible(false)} accessibilityLabel="Close help">
                <Icon name="close" size={22} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.helpBody} contentContainerStyle={styles.helpScrollPadding}>
              <Text style={styles.helpParagraph}>
                Translate an input sign (from camera or gallery, photo or short video) into the other sign language, then show it in the Avatar popup.
              </Text>
              <Image source={require('../HelpASLAlphabat/Asl.png')} style={styles.helpAslImage} />

              <Text style={styles.helpHeading}>How to use</Text>
              <Text style={styles.helpBullet}>• Capture or pick a sign. You’ll see the recognized label.</Text>
              <Text style={styles.helpBullet}>• Press Translate to open the Avatar popup with the output sign.</Text>
              <Text style={styles.helpBullet}>• If the input is ASL, output is PSL; if PSL, output is ASL.</Text>

              <Text style={styles.helpHeading}>Actions</Text>
              <Text style={styles.helpBullet}>• Camera: Open camera; shutter to take photo.</Text>
              <Text style={styles.helpBullet}>• Video: Start/stop recording; timer shows seconds (video uses a thumbnail for recognition).</Text>
              <Text style={styles.helpBullet}>• Gallery: Pick image/video.</Text>
              <Text style={styles.helpBullet}>• Flip: Front/back camera.</Text>
              <Text style={styles.helpBullet}>• Swap: Swap direction (ASL↔PSL) on current result.</Text>
            </ScrollView>

            <TouchableOpacity style={styles.helpCloseButton} onPress={() => setHelpVisible(false)}>
              <Text style={styles.helpCloseText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Output Popup (white card, matches TextToSign/VoiceToSign design) */}
      <Modal
        visible={outputVisible}
        animationType="fade"
        transparent
        statusBarTranslucent
        presentationStyle="overFullScreen"
        onRequestClose={() => setOutputVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.avatarCard}>
            <View style={styles.avatarHeader}>
              <View style={styles.chipLight}>
                <Icon name="assistant" size={14} color="#1E40AF" />
                <Text style={styles.chipLightText}>{targetLanguage} Avatar</Text>
              </View>
              <TouchableOpacity onPress={() => setOutputVisible(false)} style={styles.headerIconButtonLight}>
                <Icon name="close" size={18} color="#111827" />
              </TouchableOpacity>
            </View>
            <View style={styles.avatarStage}>
              {resolvedOutputVideoSource ? (
                <View style={styles.avatarVideoContainer} pointerEvents="none">
                  <Video
                    key={`popup-output-${outputVideoFileName || 'video'}-${outputVideoKey}`}
                    source={resolvedOutputVideoSource}
                    style={styles.avatarVideo}
                    resizeMode="contain"
                    muted
                    repeat
                    controls={false}
                    paused={false}
                    rate={0.3}
                    disableFocus={true}
                    ignoreSilentSwitch="ignore"
                    hideShutterView={true}
                    playInBackground={false}
                    playWhenInactive={false}
                    allowsExternalPlayback={false}
                    onError={(error) => {
                      console.warn('Popup output video error:', error);
                      console.warn('Video source:', resolvedOutputVideoSource);
                      console.warn('Video fileName:', outputVideoFileName);
                    }}
                    onLoad={() => {
                      console.log('Popup output video loaded successfully:', outputVideoFileName);
                    }}
                    onReadyForDisplay={() => {
                      console.log('Popup output video ready for display:', outputVideoFileName);
                    }}
                  />
                </View>
              ) : avatarOutputVideo && avatarOutputVideoSource ? (
                <View style={styles.avatarVideoContainer} pointerEvents="none">
                  <Video
                    source={avatarOutputVideoSource}
                    style={styles.avatarVideo}
                    resizeMode="contain"
                    muted
                    repeat
                    controls={false}
                    paused={false}
                    rate={0.3}
                    disableFocus={true}
                    ignoreSilentSwitch="ignore"
                    hideShutterView={true}
                    playInBackground={false}
                    playWhenInactive={false}
                    allowsExternalPlayback={false}
                    onError={(error) => {
                      console.warn('Avatar output video error:', error);
                    }}
                    onLoad={() => {
                      console.log('Avatar output video loaded successfully');
                    }}
                  />
                </View>
              ) : (
              <Icon name="accessibility-new" size={72} color="#111827" />
              )}
            </View>
            <View style={styles.avatarFooter}>
              <View style={styles.chipLight}>
                <Icon name="translate" size={14} color="#1E40AF" />
                <Text style={styles.chipLightText}>{translatedLabel || recognizedLabel || '—'}</Text>
              </View>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: 
  { flex: 1, 
    backgroundColor: '#F8F9FA'
   },
  safeArea: { flex: 1, paddingBottom: 0 },
  scrollContent: { paddingBottom: 24 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#667eea',
    borderBottomWidth: 0, borderBottomColor: 'transparent',
  },
  headerIconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },

  directionPill: {
    alignSelf: 'center',
    backgroundColor: '#E6F0FE',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 10,
    marginBottom: 6,
  },
  directionText: { fontSize: 12, color: '#1E88E5', fontWeight: '700' },

  videoContainer: { padding: 10, paddingBottom: 10 },
  videoWindow: {
    height: Math.max(screenHeight * 0.42, 320),
    borderRadius: 24,
    backgroundColor: '#fff',
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cameraView: { flex: 1, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  cameraPreview: { flex: 1, width: '100%' },
  personIllustration: { alignItems: 'center' },
  personHead: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: '#E3F2FD', borderWidth: 3, borderColor: '#2196F3', marginBottom: 10,
  },
  personBody: {
    width: 80, height: 100, borderRadius: 40, backgroundColor: '#E3F2FD', borderWidth: 3, borderColor: '#2196F3',
  },
  personArm: {
    position: 'absolute', top: 80, left: 20, width: 30, height: 8, borderRadius: 4,
    backgroundColor: '#E3F2FD', borderWidth: 2, borderColor: '#2196F3', transform: [{ rotate: '-20deg' }],
  },
  galleryView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  galleryVideoPreviewContainer: {
    flex: 1,
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  galleryVideoPreview: {
    flex: 1,
    width: '100%',
    height: '100%',
    borderRadius: 18,
    backgroundColor: '#000',
  },
  galleryImagePreview: {
    flex: 1,
    width: '100%',
    borderRadius: 18,
    backgroundColor: '#000',
  },
  galleryEmptyState: {
    flex: 1,
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  galleryEmptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  galleryEmptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  galleryEmptySubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  galleryButtonsRow: {
    flexDirection: 'row',
    marginTop: 14,
    width: '100%',
  },
  galleryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 999,
  },
  galleryButtonPrimary: {
    marginRight: 6,
    backgroundColor: '#2563EB',
  },
  galleryButtonSecondary: {
    marginLeft: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  galleryButtonText: {
    marginLeft: 6,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  galleryButtonTextSecondary: {
    marginLeft: 6,
    color: '#111827',
    fontWeight: '700',
    fontSize: 13,
  },
  galleryText: { marginTop: 10, color: '#666', fontSize: 16 },

  recordingIndicator: { position: 'absolute', top: 15, right: 15 },
  recordingDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#FF4444' },

  shutterContainer: { position: 'absolute', bottom: 18, alignSelf: 'center' },
  shutterButton: {
    width: 62, height: 62, borderRadius: 31, backgroundColor: '#fff', borderWidth: 4, borderColor: '#E5E7EB',
    alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18, shadowRadius: 8,
  },
  shutterButtonVideo: { backgroundColor: '#EF4444', borderColor: '#EF4444' },
  shutterButtonRecording: { backgroundColor: '#B91C1C', borderColor: '#B91C1C' },

  // Translate action
  actionContainer: { paddingHorizontal: 16, marginTop: 12, marginBottom: 8, alignItems: 'center' },
  translateButton: {
    backgroundColor: '#2196F3',
    borderRadius: 28,
    paddingVertical: 12,
    paddingHorizontal: 28,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    minWidth: 180,
  },
  disabledButton: { backgroundColor: '#B0B0B0', elevation: 0 },
  translateButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  disabledButtonText: { color: '#666' },

  recognizedPill: {
    alignSelf: 'center',
    marginTop: 6,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  recognizedText: { color: '#6366F1', fontWeight: '700', fontSize: 12 },

  navSpacer: { height: 120 },

  // Floating actions menu
  menuBar: {
    position: 'absolute', left: 16, right: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.75)',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10, paddingHorizontal: 8,
    elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 12,
  },
  menuBarWithNav: { bottom: 150 },
  menuBarWithoutNav: { bottom: 20 },
  menuButton: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 8, marginHorizontal: 4, borderRadius: 12, backgroundColor: '#F3F4F6',
  },
  menuButtonPill: { minWidth: 90 },
  menuButtonActive: { backgroundColor: '#6366F1' },
  langContent: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  langFlag: { width: 18, height: 12, borderRadius: 2, marginRight: 4 },
  menuButtonVideoActive: { backgroundColor: '#FFECEC' },
  menuButtonText: { marginTop: 4, fontSize: 12, fontWeight: '600', color: '#333' },
  menuButtonTextActive: { color: '#fff' },
  recordBadge: { position: 'absolute', top: -2, right: -10, width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF3B30' },

  // Menu toggle FAB (unchanged)
  menuToggleFab: {
    position: 'absolute', right: 20, width: 52, height: 52, borderRadius: 26, backgroundColor: '#2196F3',
    alignItems: 'center', justifyContent: 'center', elevation: 10, shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12,
  },
  menuToggleFabWithNav: { bottom: 210 },
  menuToggleFabWithoutNav: { bottom: 80 },
  menuToggleFabActive: { backgroundColor: '#1E88E5' },

  // Help modal
  helpOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  helpCard: {
    backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16,
    paddingTop: 12, paddingHorizontal: 16, paddingBottom: 20,
    elevation: 16, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 12,
  },
  helpHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  helpTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: '#1F2937' },
  helpBody: { marginTop: 8, maxHeight: 360 },
  helpParagraph: { color: '#374151', fontSize: 14, lineHeight: 20, marginBottom: 10 },
  helpHeading: { color: '#111827', fontSize: 14, fontWeight: '700', marginTop: 8, marginBottom: 6 },
  helpBullet: { color: '#374151', fontSize: 14, lineHeight: 20, marginBottom: 6 },
  helpCloseButton: {
    marginTop: 12, backgroundColor: '#2196F3', paddingVertical: 12, borderRadius: 10, alignItems: 'center',
  },
  helpCloseText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  helpAslImage: { width: '100%', height: 220, resizeMode: 'contain', marginVertical: 8 },

  // ASL / PSL video picker
  videoPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.55)',
    justifyContent: 'center',
  },
  videoPickerCard: {
    maxHeight: '94%',
    backgroundColor: '#F9FAFB',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 18,
  },
  videoPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  videoPickerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  videoPreviewRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  videoPreviewColumn: {
    flex: 1,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 4,
  },
  previewVideoContainer: {
    height: 130,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#111827',
  },
  previewVideo: {
    height: 130,
    width: '100%',
    borderRadius: 16,
    backgroundColor: '#111827',
  },
  previewPlaceholder: {
    height: 130,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  previewPlaceholderText: {
    marginTop: 6,
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  videoPickerBody: {
    marginTop: 4,
  },
  videoPickerScrollContent: {
    paddingBottom: 16,
  },
  sectionLabel: {
    marginTop: 8,
    marginBottom: 6,
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  videoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  videoCard: {
    width: '48%',
    marginHorizontal: 4,
    marginBottom: 10,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  videoCardActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  videoThumb: {
    height: 70,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  videoFileName: {
    fontSize: 11,
    color: '#4B5563',
  },
  videoTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
    marginTop: 2,
  },
  videoDescription: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  downloadChip: {
    marginTop: 6,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#DBEAFE',
  },
  downloadChipText: {
    marginLeft: 4,
    fontSize: 11,
    fontWeight: '600',
    color: '#1E3A8A',
  },
  videoPickerFooter: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 10,
  },
  usePairButton: {
    backgroundColor: '#1D4ED8',
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center',
  },
  usePairButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  usePairButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  usePairButtonTextDisabled: {
    color: '#E5E7EB',
  },

  // gallery mode toggle
  galleryModeRow: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 999,
    padding: 4,
    marginHorizontal: 4,
    marginTop: 4,
    marginBottom: 8,
  },
  galleryModeChip: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryModeChipActive: {
    backgroundColor: '#FFFFFF',
  },
  galleryModeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  galleryModeTextActive: {
    color: '#111827',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 4,
    marginTop: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    padding: 0,
  },
  searchClearButton: {
    padding: 4,
    marginLeft: 4,
  },
  noResultsContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  noResultsText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  noResultsSubtext: {
    marginTop: 4,
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
    height: 40,
  },

  // Output popup (matches TextToSign/VoiceToSign design)
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  avatarCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  avatarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
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
  chipLightText: { color: '#1E40AF', marginLeft: 8, fontSize: 12, fontWeight: '700' },
  avatarStage: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    minHeight: 220,
  },
  avatarVideoContainer: {
    width: '100%',
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    borderRadius: 8,
    overflow: 'hidden',
  },
  avatarVideo: {
    width: '100%',
    height: '100%',
  },
  avatarFooter: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  avatarControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
  },
  ghostButtonLight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    backgroundColor: '#FFFFFF',
  },
  ghostButtonTextLight: { color: '#1E88E5', fontWeight: '700' },

  // Additional styles for inline style warnings
  recordingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordingText: {
    color: '#FF4444',
    marginLeft: 6,
    fontWeight: '600',
  },
  recognizedContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  videoButtonContent: {
    alignItems: 'center',
  },
  helpScrollPadding: {
    paddingBottom: 8,
  },
});

export default SignToSignScreen;