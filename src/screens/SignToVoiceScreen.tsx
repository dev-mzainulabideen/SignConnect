/**
 * SignToTextScreen Component
 * Converts sign language to text using camera/gallery input
 *
 * Author: Zain
 * Version: 2.1.1 (single output: popup only; unified with SignToVoice/SignToSign)
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  SafeAreaView,
  Alert,
  Image,
  ScrollView,
  Modal,
  Easing,
  TextInput,
} from 'react-native';
import { NativeModules } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
//import AppBottomNav, { AppTab } from '../components/AppBottomNav';
import { launchImageLibrary, ImagePickerResponse, Asset } from 'react-native-image-picker';
import { createThumbnail } from 'react-native-create-thumbnail';
import { Camera, useCameraDevice, useCameraDevices, useFrameProcessor } from 'react-native-vision-camera';
import RNFS from 'react-native-fs';
import { classifyFromPoints, ensureInit } from '../lib/ai/signClassifier';
import { refineGroupToLetter, getDebugText, type DebugInfo } from '../lib/ai/rules';
// Spell-check and WordSuggestions removed
import HistoryService from '../services/HistoryService';
import { predictVideoASLFrameByFrame, VideoPredictionResult } from '../services/VideoASLPredictionService';
import Tts from 'react-native-tts';
import { getAlphaSuggestions } from '../lib/suggestions/alphaSuggestions';

interface SignToVoiceScreenProps {
  onBack?: () => void;
  languageMode?: 'PSL' | 'ASL';
  showNavigation?: boolean;
}

const { height: screenHeight } = Dimensions.get('window');

// Static ASL alphabet and number reference images used by the in‑app gallery
type AslStaticImage = {
  key: string;       // unique key, e.g. 'A' or '10'
  label: string;     // label to inject as character (e.g. 'A', 'B', '1', '10')
  fileName: string;  // asset file name
  source: any;       // require() reference
};

const ASL_STATIC_IMAGES: AslStaticImage[] = [
  // A–Z
  { key: 'A', label: 'A', fileName: 'A.png', source: require('../components/ASL/A.png') },
  { key: 'B', label: 'B', fileName: 'B.png', source: require('../components/ASL/B.png') },
  { key: 'C', label: 'C', fileName: 'C.png', source: require('../components/ASL/C.png') },
  { key: 'D', label: 'D', fileName: 'D.png', source: require('../components/ASL/D.png') },
  { key: 'E', label: 'E', fileName: 'E.png', source: require('../components/ASL/E.png') },
  { key: 'F', label: 'F', fileName: 'F.png', source: require('../components/ASL/F.png') },
  { key: 'G', label: 'G', fileName: 'G.png', source: require('../components/ASL/G.png') },
  { key: 'H', label: 'H', fileName: 'H.png', source: require('../components/ASL/H.png') },
  { key: 'I', label: 'I', fileName: 'I.png', source: require('../components/ASL/I.png') },
  { key: 'J', label: 'J', fileName: 'J.png', source: require('../components/ASL/J.png') },
  { key: 'K', label: 'K', fileName: 'K.png', source: require('../components/ASL/K.png') },
  { key: 'L', label: 'L', fileName: 'L.png', source: require('../components/ASL/L.png') },
  { key: 'M', label: 'M', fileName: 'M.png', source: require('../components/ASL/M.png') },
  { key: 'N', label: 'N', fileName: 'N.png', source: require('../components/ASL/N.png') },
  { key: 'O', label: 'O', fileName: 'O.png', source: require('../components/ASL/O.png') },
  { key: 'P', label: 'P', fileName: 'P.png', source: require('../components/ASL/P.png') },
  { key: 'Q', label: 'Q', fileName: 'Q.png', source: require('../components/ASL/Q.png') },
  { key: 'R', label: 'R', fileName: 'R.png', source: require('../components/ASL/R.png') },
  { key: 'S', label: 'S', fileName: 'S.png', source: require('../components/ASL/S.png') },
  { key: 'T', label: 'T', fileName: 'T.png', source: require('../components/ASL/T.png') },
  { key: 'U', label: 'U', fileName: 'U.png', source: require('../components/ASL/U.png') },
  { key: 'V', label: 'V', fileName: 'V.png', source: require('../components/ASL/V.png') },
  { key: 'W', label: 'W', fileName: 'W.png', source: require('../components/ASL/W.png') },
  { key: 'X', label: 'X', fileName: 'X.png', source: require('../components/ASL/X.png') },
  { key: 'Y', label: 'Y', fileName: 'Y.png', source: require('../components/ASL/Y.png') },
  { key: 'Z', label: 'Z', fileName: 'Z.png', source: require('../components/ASL/Z.png') },
  // Numbers 1–10
  { key: '1', label: '1', fileName: '1.png', source: require('../components/ASL/1.png') },
  { key: '2', label: '2', fileName: '2.png', source: require('../components/ASL/2.png') },
  { key: '3', label: '3', fileName: '3.png', source: require('../components/ASL/3.png') },
  { key: '4', label: '4', fileName: '4.png', source: require('../components/ASL/4.png') },
  { key: '5', label: '5', fileName: '5.png', source: require('../components/ASL/5.png') },
  { key: '6', label: '6', fileName: '6.png', source: require('../components/ASL/6.png') },
  { key: '7', label: '7', fileName: '7.png', source: require('../components/ASL/7.png') },
  { key: '8', label: '8', fileName: '8.png', source: require('../components/ASL/8.png') },
  { key: '9', label: '9', fileName: '9.png', source: require('../components/ASL/9.png') },
  { key: '10', label: '10', fileName: '10.png', source: require('../components/ASL/10.png') },
];

const SignToVoiceScreen: React.FC<SignToVoiceScreenProps> = ({ onBack, languageMode = 'ASL', showNavigation = true }) => {
  // State
  const [language, setLanguage] = useState<'ASL' | 'PSL'>(languageMode);
  const [translatedText, setTranslatedText] = useState('');
  const [sentenceText, setSentenceText] = useState('');
  const [_currentChar, _setCurrentChar] = useState<string>('');
  const [confidence, setConfidence] = useState(0);
  const recentPredsRef = useRef<Array<{ label: string; prob: number }>>([]);
  const stableLabelRef = useRef<string>('');
  const stableCountRef = useRef<number>(0);
  const lastCommittedLabelRef = useRef<string>('');
  const CONF_THRESH = 0.5; // commit gate; display still updates below this
  const CONTROL_GATE = 0.6; // require higher confidence for control tokens (space/backspace/next)
  const SMOOTH_WINDOW = 9; // majority vote window
  const COMMIT_STEPS = 5; // require more stability before committing
  const DEBOUNCE_MS = 300; // prevent rapid re-commits
  const lastCommitAtRef = useRef<number>(0);
  const lastNonControlRef = useRef<string>('');
  const pendingBackspaceRef = useRef<boolean>(false);
  const suppressUntilRef = useRef<number>(0);
  const [selectedSuggestKey, setSelectedSuggestKey] = useState<string | null>(null);
  const [suggestSearch, setSuggestSearch] = useState('');
  const [inputSource, setInputSource] = useState<'camera' | 'gallery'>('gallery');

  const [isRecording, _setIsRecording] = useState(false);
  const isRecordingRef = useRef(false);
  const setIsRecordingStable = useCallback((next: boolean) => {
    isRecordingRef.current = next;
    _setIsRecording(next);
  }, []);

  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [lastPreviewUri, setLastPreviewUri] = useState<string | null>(null);
  const lastBase64Ref = useRef<string | null>(null);
  const [_lastPreviewKind, _setLastPreviewKind] = useState<'image' | 'video' | null>(null);
  const appGalleryActiveRef = useRef<boolean>(false);

  const recordingStartAtRef = useRef<number | null>(null);
  const [recordingElapsedMs, setRecordingElapsedMs] = useState<number>(0);
  const [captureMode, setCaptureMode] = useState<'photo' | 'video'>('photo');

  // Camera setup
  const [useFrontCamera, setUseFrontCamera] = useState(true);
  const cameraRef = useRef<Camera | null>(null);
  const devices = useCameraDevices();
  const requested = useCameraDevice(useFrontCamera ? 'front' : 'back');
  const device = requested || devices.find?.(d => d.position === (useFrontCamera ? 'front' : 'back')) || devices[0];
  const [previewPoints, setPreviewPoints] = useState<{ x: number; y: number }[] | null>(null);
  const [canvasSize, setCanvasSize] = useState<{ w: number; h: number }>({ w: 200, h: 200 });
  const toPxX = useCallback((x: number) => {
    // x,y are normalized [0..1] in source image space. We render into a square canvas with letterboxing.
    const w = canvasSize.w || 200;
    const h = canvasSize.h || 200;
    const flip = inputSource === 'camera' && useFrontCamera; // mirror only for front camera live preview
    const xn = flip ? (1 - x) : x;
    // Fit full range without extra margin
    const scale = Math.min(w, h);
    const offsetX = (w - scale) / 2;
    const v = offsetX + Math.max(0, Math.min(1, xn)) * scale;
    return Math.max(0, Math.min(w - 1, v));
  }, [canvasSize.w, canvasSize.h, inputSource, useFrontCamera]);
  const toPxY = useCallback((y: number) => {
    const w = canvasSize.w || 200;
    const h = canvasSize.h || 200;
    const scale = Math.min(w, h);
    const offsetY = (h - scale) / 2;
    const v = offsetY + Math.max(0, Math.min(1, y)) * scale;
    return Math.max(0, Math.min(h - 1, v));
  }, [canvasSize.w, canvasSize.h]);

  // Convert normalized [0..1] preview points to the exact 400x400 render space
  // using the SAME bbox-centering and offsets as rasterizeSkeleton() so rules
  // evaluate geometry in the identical coordinate frame as the model sees.
  // ALIGNED: Unified preprocessing function matching desktop's exact logic
  const toRender400 = useCallback((pts: { x: number; y: number }[] | null) => {
    if (!pts || pts.length === 0) return [] as { x: number; y: number }[];
    
    // Apply camera flip if needed
    const flip = inputSource === 'camera' && useFrontCamera;
    const norm = pts.map(p => ({ x: flip ? (1 - p.x) : p.x, y: p.y }));
    
    // Calculate bounding box from normalized coordinates (0-1)
    let minX = 1, minY = 1, maxX = 0, maxY = 0;
    for (const p of norm) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    
    // Desktop equivalent: w, h from MediaPipe bbox, converted to 400x400 space
    const width = 400;
    const height = 400;
    const wPx = Math.max(1, Math.round((maxX - minX) * width));
    const hPx = Math.max(1, Math.round((maxY - minY) * height));
    
    // Desktop offset calculation: os = ((400 - w) // 2) - 15
    const os = Math.round((width - wPx) / 2) - 15;
    const os1 = Math.round((height - hPx) / 2) - 15;
    
    console.log(`[Coords] Bbox: min(${minX.toFixed(3)}, ${minY.toFixed(3)}) max(${maxX.toFixed(3)}, ${maxY.toFixed(3)})`);
    console.log(`[Coords] Size: ${wPx}x${hPx}, offsets: (${os}, ${os1}) - desktop equivalent`);
    
    // Transform normalized coordinates to 400x400 pixel space with desktop-style offsets
    // Desktop: pts[i][0] + os, pts[i][1] + os1 (where pts are relative to hand bbox)
    // Mobile equivalent: normalize to hand bbox, scale to pixels, add offsets
    const toPx = (p: { x: number; y: number }) => ({
      x: Math.max(0, Math.min(width - 1, Math.round((p.x - minX) / (maxX - minX) * wPx + os))),
      y: Math.max(0, Math.min(height - 1, Math.round((p.y - minY) / (maxY - minY) * hPx + os1))),
    });
    
    const result = norm.map(toPx);
    
    // Log sample coordinates for debugging
    if (result.length > 0) {
      console.log(`[Coords] Sample points: Wrist(${result[0].x}, ${result[0].y}), Thumb(${result[4].x}, ${result[4].y}), Index(${result[8].x}, ${result[8].y})`);
    }
    
    return result;
  }, [inputSource, useFrontCamera]);
  const [liveDetect, _setLiveDetect] = useState<boolean>(false);
  const liveTimerRef = useRef<any>(null);
  const videoLoopTimerRef = useRef<any>(null);
  const videoLoopCursorMsRef = useRef<number>(0);
  // Reserved for future burst-capture; keep defined to avoid accidental loops
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isCapturingRef = useRef<boolean>(false);
  // Feature flag: disable frame processor to avoid _WORKLET error; use JS fallback
  const USE_FRAME_PROCESSOR = false;
  // const LIVE_FP_STEP = 2; // (kept for future tuning)
  const runDetectionOnUriRef = useRef<(uri: string) => Promise<boolean>>(async () => false);

  // Pretty-print landmark arrays for easier debugging
  const logLandmarksPretty = useCallback((title: string, res: any) => {
    try {
      const pts: Array<{ x: number; y: number }> =
        res?.landmarks || res?.hands?.[0]?.landmarks || (Array.isArray(res) ? res : []);
      const count = Array.isArray(pts) ? pts.length : 0;
      console.log(`[Landmarks] ${title}: count=${count}`);
      if (!Array.isArray(pts) || pts.length === 0) return;
      const lines: string[] = pts.map((p, i) => {
        const x = Number(p?.x ?? 0);
        const y = Number(p?.y ?? 0);
        const sx = isFinite(x) ? x.toFixed(1) : 'NaN';
        const sy = isFinite(y) ? y.toFixed(1) : 'NaN';
        const idx = (i + 1).toString().padStart(2, '0');
        return `Landmark #${idx}  x=${sx}  y=${sy}`;
      });
      // Print in chunks to avoid console truncation
      const chunk = 8;
      for (let i = 0; i < lines.length; i += chunk) {
        console.log(lines.slice(i, i + chunk).join(' | '));
      }
    } catch (e) {
      try { console.warn('[Landmarks] pretty log failed:', (e as any)?.message || String(e)); } catch {}
    }
  }, []);

  // Do NOT auto-start live detection; capture only on user shutter/record
  useEffect(() => {
    _setLiveDetect(false);
  }, [inputSource, hasPermission, device]);

  // MediaPipe Hands connections (21 points) - matching desktop version
  const HAND_CONNECTIONS: Array<[number, number]> = [
    [0,1],[1,2],[2,3],[3,4], // Thumb
    [0,5],[5,6],[6,7],[7,8], // Index
    [0,9],[9,10],[10,11],[11,12], // Middle
    [0,13],[13,14],[14,15],[15,16], // Ring
    [0,17],[17,18],[18,19],[19,20], // Pinky
    // Palm connections (like desktop version)
    [5,9],[9,13],[13,17], // Palm base connections
  ];

  // Helpers: parse and normalize detector results to 0..1 coords centered with margin
  const normalizeAndSetPoints = useCallback((points: Array<{ x: number; y: number }> | null | undefined) => {
    if (!points || points.length < 2) {
      setPreviewPoints(null);
      return;
    }
    const pts = points
      .map(p => ({ x: Number(p.x) || 0, y: Number(p.y) || 0 }))
      .filter(p => isFinite(p.x) && isFinite(p.y));
    if (pts.length < 2) { setPreviewPoints(null); return; }
    const minX = Math.min(...pts.map(p => p.x));
    const maxX = Math.max(...pts.map(p => p.x));
    const minY = Math.min(...pts.map(p => p.y));
    const maxY = Math.max(...pts.map(p => p.y));

    // If detector already returns normalized [0,1] coordinates
    const alreadyNormalized = maxX <= 1.5 && maxY <= 1.5 && minX >= -0.2 && minY >= -0.2;
    if (alreadyNormalized) {
      const margin = 0.0; // show full hand; no padding
      const scale = 1 - 2 * margin;
      const centeredDirect = pts.map(p => ({ x: margin + Math.max(0, Math.min(1, p.x)) * scale, y: margin + Math.max(0, Math.min(1, p.y)) * scale }));
      setPreviewPoints(centeredDirect);
      return;
    }
    const w = Math.max(1, maxX - minX);
    const h = Math.max(1, maxY - minY);
    const size = Math.max(w, h);
    // keep aspect by padding shorter side to center
    const padX = (size - w) / 2;
    const padY = (size - h) / 2;
    const norm = pts.map(p => ({ x: (p.x - minX + padX) / size, y: (p.y - minY + padY) / size }));
    const margin = 0.0; // reduce clipping
    const scale = 1 - 2 * margin;
    const centered = norm.map(p => ({ x: margin + p.x * scale, y: margin + p.y * scale }));
    setPreviewPoints(centered);
  }, []);

  // Removed hardcoded landmark template matching (production only)

  const parseAndSetPreviewFromResult = useCallback((res: any) => {
    try {
      console.log('[Parse] Parsing detection result:', JSON.stringify(res).slice(0, 300));
      if (!res) {
        console.log('[Parse] No result provided');
        setPreviewPoints(null);
        return;
      }
      
      // Accept shapes: array of points; {landmarks:[{x,y}...]}; {hands:[{landmarks:[..]}]}
      if (Array.isArray(res) && res.length && typeof res[0] === 'object' && 'x' in res[0]) {
        console.log('[Parse] Found array of points, length:', res.length);
        normalizeAndSetPoints(res as Array<{ x: number; y: number }>);
        return;
      }
      if (res.landmarks && Array.isArray(res.landmarks)) {
        console.log('[Parse] Found landmarks array, length:', res.landmarks.length);
        if (res.landmarks.length === 0) {
          console.log('[Parse] Empty landmarks array - no hand detected in photo');
        }
        normalizeAndSetPoints(res.landmarks);
        return;
      }
      if (Array.isArray(res.hands) && res.hands.length > 0 && Array.isArray(res.hands[0]?.landmarks)) {
        console.log('[Parse] Found hands array with landmarks, length:', res.hands[0].landmarks.length);
        normalizeAndSetPoints(res.hands[0].landmarks);
        return;
      }
      console.log('[Parse] No valid landmarks found in result');
      setPreviewPoints(null);
    } catch (e) {
      console.log('[Parse] Error parsing result:', e);
      setPreviewPoints(null);
    }
  }, [normalizeAndSetPoints]);

  // M2/M3/M5: classify + rule refinement + temporal smoothing + text assembly
  useEffect(() => {
    (async () => {
      // CRITICAL: Skip ALL detection/prediction when App Gallery is active
      // This prevents automatic character changes after selecting suggestions
      if (appGalleryActiveRef.current) {
        console.log('[SignToText] App Gallery active - skipping classification to prevent auto-prediction');
        return;
      }
      console.log('[SignToText] Classification useEffect triggered, previewPoints:', previewPoints?.length || 'null');
      if (!previewPoints || previewPoints.length === 0) {
        console.log('[SignToText] No preview points available - skipping classification');
        // Reset current character display when no hand detected (only if not App Gallery mode)
        if (!appGalleryActiveRef.current) {
        _setCurrentChar('—');
        setConfidence(0);
        }
        return;
      }
      console.log('[SignToText] Running classification with', previewPoints.length, 'points');
      // Save first raster once per session and try mirrored too
      const debugOncePath = ((globalThis as any).__rasterSaved) ? undefined : `${RNFS.CachesDirectoryPath}/raster_debug.ppm`;
      const result = await classifyFromPoints(previewPoints, 400, { debugOncePath, tryMirror: true });
      if (debugOncePath) { (globalThis as any).__rasterSaved = true; }
      if (!result) {
        console.log('[SignToText] Classification failed - no result');
        _setCurrentChar('—');
        setConfidence(0);
        return;
      }
      console.log('[SignToText] Classification result:', result);
      const topProb = Math.max(0, Math.min(1, result.probs[result.topIndex] ?? 0));
      console.log('[SignToText] Top probability:', topProb);
      // Always update currentChar display from rule output, even if low prob
      const landmarks400 = toRender400(previewPoints);
      console.log('[SignToText] Converting to 400x400 coordinates, points:', landmarks400.length);
            const ruleResultEarly = refineGroupToLetter({ landmarks400, groupProbs: result.probs });
            console.log('[SignToText] Rule result:', ruleResultEarly);
            console.log('[SignToText] Group probabilities:', result.probs.map((p, i) => `Group${i}:${p.toFixed(3)}`).join(' '));
            console.log('[SignToText] Top group:', result.topIndex, 'with prob:', result.probs[result.topIndex].toFixed(3));
            let displayLabel = ruleResultEarly.letter || result.topLabel;
            // If rules returned nothing and we only have a group label (e.g., 'Group_3'),
            // map to a representative single-letter for DISPLAY ONLY so the UI shows a character.
            if (!(displayLabel && displayLabel.length === 1)) {
              const GROUP_DISPLAY_FALLBACK: string[] = ['A','B','C','G','L','P','X','Y'];
              if (result.probs.length === 8) {
                const idx = Math.max(0, Math.min(7, result.topIndex));
                displayLabel = GROUP_DISPLAY_FALLBACK[idx];
              }
            }
            console.log('[SignToText] Setting current char to:', displayLabel);
            console.log('[SignToText] Rule result details:', {
              letter: ruleResultEarly.letter,
              confidence: ruleResultEarly.confidence,
              topLabel: result.topLabel,
              finalDisplay: displayLabel
            });
            _setCurrentChar(displayLabel);
            // Always update confidence display, even when below commit thresholds
            setConfidence(Math.round(topProb * 100));

      if (topProb < 0.2) {
        console.log('[SignToText] Low confidence, skipping commit:', topProb);
        return; // don't attempt stabilization/commit, but UI shows currentChar
      }
      // M5: rules — use the same 400x400 render-space coords (with mirroring) as drawing
      const ruleResult = ruleResultEarly;
      const topLabel = ruleResult.letter || result.topLabel;
      
      // Store debug info for visualization
      setRuleDebugInfo(ruleResult.debugInfo);

      // confidence already set earlier to reflect live predictions continuously

      // push into window for stabilization
      const q = recentPredsRef.current.slice();
      q.push({ label: topLabel, prob: topProb });
      if (q.length > SMOOTH_WINDOW) q.shift();
      recentPredsRef.current = q;

      // majority label
      const counts: Record<string, number> = {};
      for (const it of q) counts[it.label] = (counts[it.label] || 0) + 1;
      let winner = topLabel;
      let winCount = 0;
      Object.keys(counts).forEach(k => { if (counts[k] > winCount) { winCount = counts[k]; winner = k; } });
      const avgProb = q.filter(it => it.label === winner).reduce((s, it) => s + it.prob, 0) / Math.max(1, q.filter(it => it.label === winner).length);

      // thresholding & ignore for commit only (display already updated)
      if (avgProb < CONF_THRESH) return;

      // stability
      if (stableLabelRef.current === winner) {
        stableCountRef.current += 1;
      } else {
        stableLabelRef.current = winner;
        stableCountRef.current = 1;
      }
      if (stableCountRef.current < COMMIT_STEPS) return;

      // commit once per stable segment with debounce
      if (lastCommittedLabelRef.current === winner) return;
      const nowTs = Date.now();
      if (nowTs - lastCommitAtRef.current < DEBOUNCE_MS) return;
      lastCommitAtRef.current = nowTs;
      lastCommittedLabelRef.current = winner;

      // Track last non-control so 'next' can commit it
      if (winner.length === 1) lastNonControlRef.current = winner;

      // CRITICAL: Double-check App Gallery mode before any text updates
      // This prevents automatic sentence changes after selecting suggestions
      if (appGalleryActiveRef.current) {
        console.log('[Classification] App Gallery active - skipping text commit logic');
        return;
      }

      // assemble text buffer using control tokens parity with desktop app
      if (winner === 'nothing') {
        return; // ignore
      } else if ((winner === ' ' || winner === 'space') && avgProb >= CONTROL_GATE) {
        setTranslatedText(prev => (prev.endsWith(' ') || prev.length === 0 ? prev : prev + ' '));
        setSentenceText(prev => (prev.endsWith(' ') || prev.length === 0 ? prev : prev + ' '));
        _setCurrentChar(' ');
      } else if ((winner === 'Backspace' || winner === 'del') && avgProb >= CONTROL_GATE) {
        // delay deletion until next 'next' commit: store marker
        pendingBackspaceRef.current = true;
        _setCurrentChar('Backspace');
      } else if (winner === 'next' && avgProb >= CONTROL_GATE) {
        // commit the stabilized previous symbol from buffer (skip controls)
        const prevSymbol = lastNonControlRef.current;
        if (pendingBackspaceRef.current) {
          setTranslatedText(prev => prev.slice(0, Math.max(0, prev.length - 1)));
          setSentenceText(prev => prev.slice(0, Math.max(0, prev.length - 1)));
          pendingBackspaceRef.current = false;
        } else if (prevSymbol) {
          setTranslatedText(prev => prev + prevSymbol);
          setSentenceText(prev => prev + prevSymbol);
        }
        // clear last letter after commit
        lastNonControlRef.current = '';
      } else if (winner.length === 1) {
        // do not commit immediately; just show current letter
        _setCurrentChar(winner);
      }
      // Log to history when we have a meaningful update to translatedText
      try {
        const uid = (globalThis as any)?.currentUserId || undefined; // replace with actual auth state if available
        if (uid) {
          await HistoryService.add(uid, {
            mode: 'sign_to_text',
            language,
            input: { type: inputSource === 'camera' ? 'image' : (_lastPreviewKind === 'video' ? 'video' : 'image'), value: lastPreviewUri || '' , uri: lastPreviewUri || undefined },
            output: { type: 'text', value: (translatedText || '') + (winner.length === 1 ? winner : '') },
            confidence: avgProb,
          } as any);
        }
      } catch {}
  // Removed spell-check suggestions
    })();
  }, [previewPoints, translatedText, toRender400, language, inputSource, _lastPreviewKind, lastPreviewUri]);

  // Removed spell-check suggestions

  // Ensure native module is initialized on mount (run after ensurePermissions is defined)

  const cleanBase64 = useCallback((b64: string) => (b64 || '').replace(/^data:image\/[a-zA-Z]+;base64,/, ''), []);

  const detectBase64 = useCallback(async (rawB64: string) => {
    const HandLandmarks = (NativeModules as any).HandLandmarks;
    if (!HandLandmarks?.detect) throw new Error('HandLandmarks.detect missing');
    const res = await HandLandmarks.detect(cleanBase64(rawB64));
    try { console.log('detect result (base64):', String(JSON.stringify(res)).slice(0, 200)); } catch {}
    try { console.log('native debug:', (res as any)?.debug); } catch {}
    parseAndSetPreviewFromResult(res);
    return res;
  }, [cleanBase64, parseAndSetPreviewFromResult]);

  // (capture helper removed; single-shot handled by shutter path)

  // Vision Camera frame processor to drive live detection at ~8–10 FPS with throttling
  const frameProcessor = useFrameProcessor((_frame) => {
    'worklet';
    // disabled; single-shot only
  }, []);


  // Keep a stable ref to runDetectionOnUri for use inside early-declared callbacks
  useEffect(() => {
    // Assign lazily; this effect runs after declarations below
    try {
      // @ts-ignore
      runDetectionOnUriRef.current = runDetectionOnUri;
    } catch {}
  });


  const runDetectionOnUri = useCallback(async (uri: string) => {
    try {
      const HandLandmarks = (NativeModules as any).HandLandmarks;
      if (!HandLandmarks) {
        console.warn('HandLandmarks native module not found or detect() missing');
        Alert.alert('HandLandmarks module missing', 'Native module HandLandmarks.detect is unavailable.');
        setPreviewPoints(null);
        return false;
      }
      // Prefer native path-based detection to avoid base64 issues
      console.log('[Detection] HandLandmarks module available, methods:', {
        hasDetectFromPath: typeof HandLandmarks.detectFromPath === 'function',
        hasDetect: typeof HandLandmarks.detect === 'function'
      });
      
      let res: any = null;
      if (typeof HandLandmarks.detectFromPath === 'function') {
        console.log('[Detection] Using detectFromPath with URI:', uri);
        res = await HandLandmarks.detectFromPath(uri);
        console.log('[Detection] detectFromPath result:', String(JSON.stringify(res)).slice(0, 200));
      } else if (typeof HandLandmarks.detect === 'function') {
        console.log('[Detection] Using detect with base64');
        const b64 = await RNFS.readFile(uri, 'base64');
        console.log('[Detection] Base64 length:', b64?.length || 0);
        res = await HandLandmarks.detect(b64);
        console.log('[Detection] detect result:', String(JSON.stringify(res)).slice(0, 200));
      } else {
        console.warn('[Detection] Neither detectFromPath nor detect available on HandLandmarks');
        setPreviewPoints(null);
        return false;
      }
      // Robust logging of landmarks (pretty)
      logLandmarksPretty('detectFromPath(uri)', res);
      parseAndSetPreviewFromResult(res);
      
      // If photo detection failed but we have live preview, log this for debugging
      if (!res || !res.landmarks || res.landmarks.length === 0) {
        console.log('[Detection] Photo detection returned empty landmarks - photo may be blurry or hand moved');
        return false;
      }
      
      return true;
    } catch (e: any) {
      try { console.warn('detect failed (runDetectionOnUri):', e?.message || String(e)); } catch {}
      setPreviewPoints(null);
      return false;
    }
  }, [parseAndSetPreviewFromResult, logLandmarksPretty]);

  const runDetectionOnBase64 = useCallback(async (b64: string) => {
    try {
      const HandLandmarks = (NativeModules as any).HandLandmarks;
      if (!HandLandmarks || typeof HandLandmarks.detect !== 'function') {
        console.warn('HandLandmarks native module not found or detect() missing');
        Alert.alert('HandLandmarks module missing', 'Native module HandLandmarks.detect is unavailable.');
        setPreviewPoints(null);
        return false;
      }
      const res = await HandLandmarks.detect(b64);
      logLandmarksPretty('detect(base64)', res);
      parseAndSetPreviewFromResult(res);
      return true;
    } catch (e: any) {
      try { console.warn('detect failed (runDetectionOnBase64):', e?.message || String(e)); } catch {}
      setPreviewPoints(null);
      return false;
    }
  }, [parseAndSetPreviewFromResult, logLandmarksPretty]);

  // Detect on current preview: image, video thumbnail, or quick camera snapshot
  const detectCurrent = useCallback(async () => {
    console.log('Detect button pressed');
    if (inputSource === 'camera') {
      // toggle live detection
      _setLiveDetect(v => {
        const next = !v;
        if (!next && liveTimerRef.current) {
          clearInterval(liveTimerRef.current);
          liveTimerRef.current = null;
        }
        return next;
      });
      return;
    }
    if (inputSource === 'gallery' && _lastPreviewKind === 'video' && lastPreviewUri) {
      // toggle gallery video frame loop
      if (videoLoopTimerRef.current) {
        clearInterval(videoLoopTimerRef.current);
        videoLoopTimerRef.current = null;
        return;
      }
      const src = lastPreviewUri;
      videoLoopTimerRef.current = setInterval(async () => {
        try {
          const t = Math.max(0, videoLoopCursorMsRef.current);
          const frame = await createThumbnail({ url: src, timeStamp: t }).catch(() => null);
          if (frame?.path) {
            setLastPreviewUri(frame.path);
            await handleImageAsset({ uri: frame.path } as Asset);
          } else {
            // restart from beginning if frame extraction fails (e.g., past duration)
            videoLoopCursorMsRef.current = 0;
          }
          videoLoopCursorMsRef.current += 250; // ~4 fps (safer for memory/CPU)
          if (videoLoopCursorMsRef.current > 600000) videoLoopCursorMsRef.current = 0; // hard cap
        } catch {
          // on repeated failure, stop the loop gracefully
          try { clearInterval(videoLoopTimerRef.current as any); } catch {}
          videoLoopTimerRef.current = null;
        }
      }, 250);
      return;
    }
    // CRITICAL: Skip ALL automatic detection when App Gallery is active
    // This prevents automatic character changes after selecting suggestions
    if (appGalleryActiveRef.current) {
      console.log('[Detection] App Gallery active - skipping automatic detection');
      return;
    }
    // image/video path processing
    if (lastBase64Ref.current) {
      await runDetectionOnBase64(lastBase64Ref.current);
      return;
    }
    if (lastPreviewUri) {
      await runDetectionOnUri(lastPreviewUri);
      return;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastPreviewUri, inputSource, _lastPreviewKind, runDetectionOnUri, runDetectionOnBase64]);

  // Remove old interval-based loop; frame processor handles capture cadence

  // Output popup
  const [outputVisible, setOutputVisible] = useState(false);
  const [ruleDebugInfo, setRuleDebugInfo] = useState<DebugInfo | undefined>();
  const [videoPredictionResult, setVideoPredictionResult] = useState<VideoPredictionResult | null>(null);
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [aslGalleryVisible, setAslGalleryVisible] = useState(false);

  // Floating menu + help (slow floaty like other screens)
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
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

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const textPulse = useRef(new Animated.Value(1)).current;
  const speakerPulse = useRef(new Animated.Value(1)).current;

  // Permission helpers - Vision Camera explicit permissions

  const ensurePermissions = useCallback(async () => {
      try {
        const cameraStatus = await Camera.requestCameraPermission();
        const micStatus = await Camera.requestMicrophonePermission();
      const granted = cameraStatus === 'granted' && micStatus === 'granted';
      setHasPermission(granted);
      return granted;
      } catch {
        setHasPermission(false);
      return false;
    }
  }, []);

  // Handle tab selection (removed - AppBottomNav is commented out)

  // Request camera/mic on mount
  useEffect(() => {
    (async () => {
      await ensurePermissions();
    })();
  }, [ensurePermissions]);

  // Spell check removed

  // Initialize native modules on mount
  useEffect(() => {
    (async () => {
      try {
        // Initialize HandLandmarks module
        const HandLandmarks = (NativeModules as any).HandLandmarks;
        if (HandLandmarks?.init) {
          await HandLandmarks.init();
          console.log('[SignToText] HandLandmarks module initialized successfully');
        }
        
        // Initialize TFLite model (ASL)
        await ensureInit('models/sign_model.tflite');
        console.log('[SignToText] TFLite model initialized successfully');
      } catch (error) {
        console.error('[SignToText] Failed to initialize native modules:', error);
      }
    })();
  }, []);


  // Pulse animation for recording
  useEffect(() => {
    let animation: Animated.CompositeAnimation | undefined;
    if (isRecording) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      animation.start();
    }
    return () => animation?.stop?.();
  }, [isRecording, pulseAnim]);

  // Text pulse animation
  useEffect(() => {
    let animation: Animated.CompositeAnimation | undefined;
    if (translatedText) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(textPulse, { toValue: 1.05, duration: 400, useNativeDriver: true }),
          Animated.timing(textPulse, { toValue: 1, duration: 400, useNativeDriver: true }),
        ])
      );
      animation.start();
    }
    return () => animation?.stop?.();
  }, [translatedText, textPulse]);

  // Auto-speak when popup opened with text (speak full sentence when available)
  const playAudio = useCallback(() => {
    const spokenText = (sentenceText || translatedText || '').trim();
    if (!spokenText) return;
        try {
          Tts.setDefaultLanguage('en-US');
          Tts.setDefaultRate(0.5, true);
          Tts.setDefaultPitch(1.0);
        } catch {}
    setIsPlaying(true);
    Tts.stop().catch(() => {});
    Tts.speak(spokenText);
  }, [sentenceText, translatedText]);

  const stopAudio = useCallback(() => {
    Tts.stop().catch(() => {});
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    if (outputVisible && (sentenceText || translatedText)) {
      playAudio();
    } else if (!outputVisible) {
      stopAudio();
    }
  }, [outputVisible, sentenceText, translatedText, playAudio, stopAudio]);

  // Speaker pulse animation
  useEffect(() => {
    let animation: Animated.CompositeAnimation | undefined;
    if (outputVisible) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(speakerPulse, { toValue: 1.08, duration: 500, useNativeDriver: true }),
          Animated.timing(speakerPulse, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      );
      animation.start();
    }
    return () => animation?.stop?.();
  }, [outputVisible, speakerPulse]);

  // Recording elapsed timer using ref
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

  // Handle selection from the in‑app ASL gallery (A–Z, 1–10)
  const handleAslStaticSelection = useCallback((item: AslStaticImage) => {
    // For App Gallery we already know the exact character from the file name,
    // so we do NOT run the heavy detection pipeline on this image. We simply
    // feed the letter into the same output states that camera/gallery would.
    appGalleryActiveRef.current = true;
    lastBase64Ref.current = null;
    setPreviewPoints(null);
    setConfidence(100);
    setSentenceText(prev => (prev && prev.length > 0 ? prev : item.label));
    setTranslatedText(prev => (prev && prev.length > 0 ? prev : item.label));
    // Show the static image in the left input window like a picked photo
    try {
      const resolved = Image.resolveAssetSource(item.source);
      if (resolved?.uri) {
        setLastPreviewUri(resolved.uri);
        _setLastPreviewKind('image');
      }
    } catch {
      // ignore preview failures
    }
  }, []);

  const handleImageAsset = useCallback(async (asset: Asset) => {
    if (!asset.uri) return;
    try {
      setTranslatedText('');
      setVideoPredictionResult(null);

      // Check if it's a video file
      if (asset.type?.startsWith('video/')) {
        console.log('[SignToText] Processing video file:', asset.uri);
        setIsProcessingVideo(true);
        
        try {
          // Use video-based ASL prediction
          const result = await predictVideoASLFrameByFrame(asset.uri);
          
          if (result) {
            console.log('[SignToText] Video prediction result:', result);
            setVideoPredictionResult(result);
            setTranslatedText(result.word);
            _setCurrentChar(result.word);
            setConfidence(Math.round(result.confidence * 100));
            
            // Show success message
            Alert.alert(
              'Video Analysis Complete', 
              `Detected: "${result.word}"\nConfidence: ${Math.round(result.confidence * 100)}%\nFrames analyzed: ${result.frameCount}`,
              [{ text: 'OK' }]
            );
          } else {
            Alert.alert('No Sign Detected', 'No ASL sign was detected in the video. Please try a different video.');
          }
        } catch (error) {
          console.error('[SignToText] Video prediction failed:', error);
          Alert.alert('Video Processing Error', 'Failed to analyze the video. Please try again.');
        } finally {
          setIsProcessingVideo(false);
        }
        return;
      }

      // M1: call native HandLandmarks.detect on the image and preview points on the right pane
      try {
        const HandLandmarks = (NativeModules as any).HandLandmarks;
        if (!HandLandmarks || typeof HandLandmarks.detect !== 'function') {
          console.warn('HandLandmarks native module not found or detect() missing');
          Alert.alert('HandLandmarks module missing', 'Native module HandLandmarks.detect is unavailable.');
          setPreviewPoints(null);
          return;
        }
        const b64 = await RNFS.readFile(asset.uri, 'base64');
        const res = await HandLandmarks.detect(b64);
        try { console.log('detect result (image file):', String(JSON.stringify(res)).slice(0, 200)); } catch {}
        logLandmarksPretty('detect(image file)', res);
        parseAndSetPreviewFromResult(res);
      } catch (e: any) {
        try { console.warn('detect failed (image file):', e?.message || String(e)); } catch {}
        setPreviewPoints(null);
      }
    } catch {
      Alert.alert('Error', 'Failed to process media. Please try again.');
    }
  }, [parseAndSetPreviewFromResult, logLandmarksPretty]);

  // Pick from gallery
  const pickFromGallery = useCallback(() => {
    launchImageLibrary(
      { mediaType: 'mixed', selectionLimit: 1, includeBase64: true },
      async (response: ImagePickerResponse) => {
      if (response.didCancel || response.errorCode) return;
      const asset = response.assets?.[0];
        if (!asset?.uri) return;
        setLastPreviewUri(asset.uri);
        _setLastPreviewKind(asset.type?.startsWith('video/') ? 'video' : 'image');
        if (asset.type?.startsWith('video/')) {
        try {
          const thumb = await createThumbnail({ url: asset.uri, timeStamp: 1000 });
          setLastPreviewUri(thumb.path);
            await handleImageAsset({ uri: thumb.path } as Asset);
            // Prepare video loop cursor but don't auto-start
            videoLoopCursorMsRef.current = 1200;
        } catch {}
        } else {
          // Prefer base64 from picker if available (works with content:// URIs)
          if (asset.base64) {
            try {
              lastBase64Ref.current = asset.base64;
              await detectBase64(asset.base64);
            } catch (e: any) {
              try { console.warn('detect failed (gallery base64):', e?.message || String(e)); } catch {}
              setPreviewPoints(null);
            }
        } else {
          await handleImageAsset(asset);
          }
        }
      }
    );
  }, [handleImageAsset, detectBase64]);

  // Capture from camera (photo)
  const captureFromCameraOnce = useCallback(async () => {
    let attempts = 0;
    while (!(hasPermission && device && cameraRef.current) && attempts < 8) {
      await new Promise<void>(resolve => setTimeout(() => resolve(), 250));
      attempts += 1;
    }
    if (!(hasPermission && device && cameraRef.current)) {
      Alert.alert('Camera not ready', 'Initializing camera… please wait a moment and try again.');
      return;
    }
    try {
      console.log('[Photo] Taking photo');
      const photo = await cameraRef.current.takePhoto({ flash: 'off' });
      const uri = photo?.path ? (photo.path.startsWith('file://') ? photo.path : `file://${photo.path}`) : undefined;
      if (uri) {
        console.log('[Photo] Captured uri:', uri);
        setLastPreviewUri(uri);
        _setLastPreviewKind('image');
        await handleImageAsset({ uri } as Asset);
        try {
          const HandLandmarks = (NativeModules as any).HandLandmarks;
          if (!HandLandmarks || typeof HandLandmarks.detect !== 'function') {
            console.warn('HandLandmarks native module not found or detect() missing');
            Alert.alert('HandLandmarks module missing', 'Native module HandLandmarks.detect is unavailable.');
            setPreviewPoints(null);
            return;
          }
          const b64 = await RNFS.readFile(uri, 'base64');
          const res = await HandLandmarks.detect(b64);
          try {
            console.log('detect result (camera photo):', String(JSON.stringify(res)).slice(0, 200));
            const pts = (res?.landmarks || res?.hands?.[0]?.landmarks || (Array.isArray(res) ? res : [])) || [];
            console.log(`[Photo] Landmarks detected: ${Array.isArray(pts) ? pts.length : 0}`);
            if (Array.isArray(pts) && pts.length > 0) console.log('[Photo] Landmark samples:', JSON.stringify(pts.slice(0,3)));
          } catch {}
          parseAndSetPreviewFromResult(res);
        } catch (e: any) {
          try { console.warn('detect failed (camera photo):', e?.message || String(e)); } catch {}
          setPreviewPoints(null);
        }
      }
    } catch (e: any) {
      Alert.alert('Capture failed', e?.message || 'Unable to take photo');
    }
  }, [hasPermission, device, handleImageAsset, parseAndSetPreviewFromResult]);

  // Start/Stop video recording robustly
  const toggleRecording = useCallback(async () => {
    if (isRecordingRef.current) {
      console.log('[Video] Stop requested');
      try {
        cameraRef.current?.stopRecording?.();
      } catch (e) {
        console.warn('[Video] stopRecording failed, applying fallback', e);
        setIsRecordingStable(false);
      recordingStartAtRef.current = null;
      setRecordingElapsedMs(0);
      }
      return;
    }
    setTranslatedText('');
      const ok = await ensurePermissions();
      if (!ok) {
      Alert.alert('Permission required', 'Please allow camera and microphone for video.');
        return;
      }
    if (!cameraRef.current) {
      Alert.alert('Camera not ready', 'Please wait for the camera to initialize.');
      return;
    }
    console.log('[Video] Start requested');
    setIsRecordingStable(true);
      recordingStartAtRef.current = Date.now();
    let finished = false;
    const finishGuard = setTimeout(() => {
      if (!finished) {
        console.warn('[Video] finish guard elapsed without callback; resetting state');
        setIsRecordingStable(false);
        recordingStartAtRef.current = null;
        setRecordingElapsedMs(0);
      }
    }, 15000);

          cameraRef.current.startRecording({
            onRecordingFinished: async (video: any) => {
        finished = true;
        clearTimeout(finishGuard);
              const uri = video?.path ? (video.path.startsWith('file://') ? video.path : `file://${video.path}`) : video?.filePath || video?.uri;
              if (uri) {
                try {
                  const t = await createThumbnail({ url: uri, timeStamp: 800 });
                  setLastPreviewUri(t.path);
                  _setLastPreviewKind('video');
                  await handleImageAsset({ uri: t.path } as Asset);
                } catch {
                  setLastPreviewUri(uri);
                  _setLastPreviewKind('video');
                }
              }
        setIsRecordingStable(false);
              recordingStartAtRef.current = null;
              setRecordingElapsedMs(0);
            },
      onRecordingError: (err: any) => {
        finished = true;
        clearTimeout(finishGuard);
        setIsRecordingStable(false);
              recordingStartAtRef.current = null;
              setRecordingElapsedMs(0);
        Alert.alert('Recording error', err?.message || 'Unknown error');
            },
          });
  }, [ensurePermissions, handleImageAsset, setIsRecordingStable]);

  // UI menu + shutter handlers
  const handlePressCamera = useCallback(async () => {
    if (inputSource !== 'camera') {
      setInputSource('camera');
      await ensurePermissions();
    }
    setCaptureMode('photo');
    _setLiveDetect(false); // single-shot mode
  }, [inputSource, ensurePermissions]);

  const handleShutterPress = useCallback(async () => {
    if (inputSource !== 'camera') {
      const ok = await ensurePermissions();
      if (!ok) return;
      setInputSource('camera');
      return;
    }
    if (captureMode === 'video') {
      await toggleRecording();
      return;
    }
    await captureFromCameraOnce();
  }, [inputSource, ensurePermissions, captureMode, toggleRecording, captureFromCameraOnce]);

  const handlePressVideo = useCallback(async () => {
    if (inputSource !== 'camera') {
      setInputSource('camera');
      await ensurePermissions();
    }
    setCaptureMode('video');
    await toggleRecording();
  }, [inputSource, ensurePermissions, toggleRecording]);

  const handlePressGallery = useCallback(() => {
    setInputSource('gallery');
    _setLiveDetect(false);
    pickFromGallery();
  }, [pickFromGallery]);

  const handlePressFlip = useCallback(() => {
    setUseFrontCamera(v => !v);
  }, []);

  const handlePressLanguage = useCallback(() => {
    setLanguage(l => (l === 'ASL' ? 'PSL' : 'ASL'));
  }, []);

  const handleLongPressCamera = useCallback(() => {
    setUseFrontCamera(v => !v);
  }, []);

  // Share text from popup
  // removed shareText (unused)

  // Visualizer bars
  const renderTextBars = () => {
    return [...Array(24)].map((_, i) => {
      const barHeight = translatedText ? 8 + (i % 4) * 3 : 5;
      const barColor = translatedText ? '#2196F3' : '#E0E0E0';
      return <Animated.View key={i} style={[styles.textBar, { height: barHeight, backgroundColor: barColor }]} />;
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerIconCircle} onPress={onBack} accessibilityLabel="Go back">
            <Icon name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text
            style={styles.title}
            onLongPress={async () => {
              try {
                const dir = `${RNFS.DownloadDirectoryPath}/atoz_batch`;
                const exists = await RNFS.exists(dir);
                if (!exists) {
                  Alert.alert('Batch folder missing', `Put up to 10 images in ${dir} and retry.`);
                  return;
                }
                const entries = (await RNFS.readDir(dir))
                  .filter(e => !e.isDirectory() && /\.(jpg|jpeg|png)$/i.test(e.name))
                  .sort((a,b) => a.name.localeCompare(b.name))
                  .slice(0, 10);
                if (entries.length === 0) {
                  Alert.alert('No images', 'Place some .jpg/.png files in atoz_batch');
                  return;
                }
                const HandLandmarks = (NativeModules as any).HandLandmarks;
                const usePath = typeof HandLandmarks?.detectFromPath === 'function';
                console.log(`[BATCH] Starting ${entries.length} images from ${dir}`);
                for (const e of entries) {
                  try {
                    const uri = `file://${e.path}`;
                    let res: any;
                    if (usePath) {
                      res = await HandLandmarks.detectFromPath(uri);
                    } else {
                      const b64 = await RNFS.readFile(uri, 'base64');
                      res = await HandLandmarks.detect(b64);
                    }
                    parseAndSetPreviewFromResult(res);
                    const pts = Array.isArray(res?.landmarks) ? res.landmarks : (Array.isArray(res?.hands) ? res.hands?.[0]?.landmarks : Array.isArray(res) ? res : null);
                    const points = (pts || []).map((p: any) => ({ x: Number(p.x) || 0, y: Number(p.y) || 0 }));
                    if (!points.length) {
                      console.log(`[BATCH] ${e.name}: no-hand`);
                      continue;
                    }
                    const result = await classifyFromPoints(points);
                    if (!result) { console.log(`[BATCH] ${e.name}: classify failed`); continue; }
                    const probs = result.probs || [];
                    const topIndex = result.topIndex ?? probs.indexOf(Math.max(...probs));
                    const top = probs[topIndex] ?? 0;
                    const min = Math.min(...probs);
                    const max = Math.max(...probs);
                    const top3 = probs.map((p, i) => ({ p, i })).sort((a, b) => b.p - a.p).slice(0, 3);
                    const groupLabels = ['Group_0','Group_1','Group_2','Group_3','Group_4','Group_5','Group_6','Group_7'];
                    console.log(`[BATCH] ${e.name}: top=${result.topLabel} p=${top.toFixed(3)} min=${isFinite(min)?min.toFixed(3):'n/a'} max=${isFinite(max)?max.toFixed(3):'n/a'} top3=[${top3.map(t => `${groupLabels[t.i]||t.i}:${t.p.toFixed(2)}`).join(', ')}]`);
                  } catch (err: any) {
                    console.log(`[BATCH] ${e.name}: error ${err?.message || String(err)}`);
                  }
                }
                Alert.alert('Batch done', 'Check Metro logs for [BATCH] lines.');
              } catch (err: any) {
                Alert.alert('Batch error', err?.message || 'Unknown error');
              }
            }}
          >
            Sign to Voice
          </Text>
          <TouchableOpacity
            style={styles.headerIconCircle}
            onPress={() => setHelpVisible(true)}
            accessibilityLabel="Help and info"
          >
            <Icon name="info-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Input window */}
          <View style={styles.videoContainer}>
            <View style={styles.videoWindow}>
              {inputSource === 'camera' ? (
                <View style={styles.dualPane}>
                  <View style={styles.leftPane}>
                  {hasPermission && device ? (
                    <Camera
                      ref={(ref) => { cameraRef.current = ref; }}
                      style={styles.cameraPreview}
                      device={device}
                      isActive={inputSource === 'camera' && hasPermission && !!device}
                      photo={true}
                      video={true}
                      audio={captureMode === 'video'}
                        frameProcessor={USE_FRAME_PROCESSOR && liveDetect ? frameProcessor : undefined}
                        // VisionCamera: throttling is handled inside the frame processor worklet
                        onError={(e) => { try { console.warn('Camera error', e); } catch {} }}
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
                        <Animated.View style={[styles.recordingDot, { transform: [{ scale: pulseAnim }] }]} />
                        <Text style={styles.recordingText}>
                          {Math.floor(recordingElapsedMs / 1000)}s
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Shutter */}
                  <View style={styles.shutterContainer}>
                    <TouchableOpacity
                      style={[
                        styles.shutterButton,
                        captureMode === 'video' && styles.shutterButtonVideo,
                        isRecording && styles.shutterButtonRecording,
                      ]}
                      onPress={handleShutterPress}
                        disabled={!hasPermission || !device}
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
                  <View style={styles.rightPane}>
                    <View
                      style={styles.skeletonCanvas}
                      onLayout={(e) => {
                        const { width, height } = e.nativeEvent.layout;
                        setCanvasSize({ w: Math.round(width), h: Math.round(height) });
                      }}
                    >
                      {previewPoints && previewPoints.length > 0 ? (
                        <View style={styles.overlayFull}>
                          {/* Draw connections as solid lines - matching desktop version */}
                          {HAND_CONNECTIONS.map(([a,b], idx) => {
                            const p0 = previewPoints[a];
                            const p1 = previewPoints[b];
                            if (!p0 || !p1) return null;
                            const x0 = toPxX(p0.x);
                            const y0 = toPxY(p0.y);
                            const x1 = toPxX(p1.x);
                            const y1 = toPxY(p1.y);
                            const dx = x1 - x0;
                            const dy = y1 - y0;
                            const length = Math.hypot(dx, dy);
                            const angle = Math.atan2(dy, dx);
                            const cx = (x0 + x1) / 2;
                            const cy = (y0 + y1) / 2;
                            return (
                              <View
                                key={`edge-${idx}`}
                                style={[
                                  styles.edgeLine,
                                  {
                                    left: cx - length / 2,
                                    top: cy - 1.5, // Center vertically
                                    width: length,
                                    transform: [{ rotateZ: `${angle}rad` }],
                                  },
                                ]}
                              />
                            );
                          })}
                          {/* Draw joints (tiny green dots) */}
                          {previewPoints.map((p, i) => (
                            <View key={i} style={[
                              styles.pointDot,
                              {
                                left: toPxX(p.x) - (styles.pointDot.width as number) / 2,
                                top: toPxY(p.y) - (styles.pointDot.height as number) / 2,
                              }
                            ]} />
                          ))}
                </View>
              ) : (
                        <View style={styles.skelCenter}>
                          <Text style={styles.skeletonHint}>Skeleton preview will appear here</Text>
                          <View style={styles.skelBtnRow}>
                            <TouchableOpacity style={styles.skelTestBtn} onPress={detectCurrent}>
                              <Text style={styles.skelTestText}>Detect</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                    </View>
                    
                    {/* Debug info overlay */}
                    {ruleDebugInfo && (
                      <View style={styles.debugOverlay}>
                        <Text style={styles.debugText}>
                          {getDebugText(ruleDebugInfo)}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ) : (
                <View style={styles.dualPane}>
                  <View style={[styles.leftPane, styles.galleryView]}>
                  {lastPreviewUri ? (
                      <Image
                        source={{ uri: lastPreviewUri }}
                        style={styles.cameraPreview}
                        resizeMode="contain"
                      />
                  ) : (
                    <>
                      <FontAwesome name="photo" size={40} color="#B0B0B0" />
                      <Text style={styles.galleryText}>Select from Gallery</Text>
                    </>
                  )}
                </View>
                  <View style={styles.rightPane}>
                    <View
                      style={styles.skeletonCanvas}
                      onLayout={(e) => {
                        const { width, height } = e.nativeEvent.layout;
                        setCanvasSize({ w: Math.round(width), h: Math.round(height) });
                      }}
                    >
                      {previewPoints && previewPoints.length > 0 ? (
                        <View style={styles.overlayFull}>
                          {HAND_CONNECTIONS.map(([a,b], idx) => {
                            const p0 = previewPoints[a];
                            const p1 = previewPoints[b];
                            if (!p0 || !p1) return null;
                            const x0 = toPxX(p0.x);
                            const y0 = toPxY(p0.y);
                            const x1 = toPxX(p1.x);
                            const y1 = toPxY(p1.y);
                            const dx = x1 - x0;
                            const dy = y1 - y0;
                            const length = Math.hypot(dx, dy);
                            const angle = Math.atan2(dy, dx);
                            const cx = (x0 + x1) / 2;
                            const cy = (y0 + y1) / 2;
                            return (
                              <View
                                key={`edge-g-${idx}`}
                                style={[
                                  styles.edgeLine,
                                  {
                                    left: cx - length / 2,
                                    top: cy - 1.5, // Center vertically
                                    width: length,
                                    transform: [{ rotateZ: `${angle}rad` }],
                                  },
                                ]}
                              />
                            );
                          })}
                          {previewPoints.map((p, i) => (
                            <View key={i} style={[
                              styles.pointDot,
                              {
                                left: toPxX(p.x) - (styles.pointDot.width as number) / 2,
                                top: toPxY(p.y) - (styles.pointDot.height as number) / 2,
                              }
                            ]} />
                          ))}
            </View>
                      ) : (
                        <View style={styles.skelCenter}>
                          <Text style={styles.skeletonHint}>Skeleton preview will appear here</Text>
                          <View style={styles.skelBtnRow} />
                        </View>
                      )}
          </View>
                  </View>
                      </View>
                    )}
                  </View>
                </View>

          {/* External input options (match SignToText layout) */}
          <View style={styles.inputButtonsSection}>
            <View style={styles.galleryButtonsRow}>
              <TouchableOpacity
                style={[styles.galleryButton, styles.galleryButtonPrimary]}
                onPress={() => {
                  appGalleryActiveRef.current = false;
                  launchImageLibrary({ mediaType: 'photo', selectionLimit: 1, includeBase64: true }, (r) => {
                    if (r.didCancel || r.errorCode) return;
                    const a = r.assets?.[0];
                    if (!a) return;
                    if (a.uri) setLastPreviewUri(a.uri);
                    if (a.base64) {
                      (async () => {
                        try {
                          const res = await (NativeModules as any).HandLandmarks?.detect?.(a.base64 as string);
                          parseAndSetPreviewFromResult(res);
                        } catch {
                          setPreviewPoints(null);
                        }
                      })();
                    } else {
                      handleImageAsset(a as Asset);
                    }
                  });
                }}
                accessibilityLabel="Pick image from gallery"
              >
                <Icon name="image" size={18} color="#fff" />
                <Text style={styles.galleryButtonText}>Pick Image</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.galleryButton, styles.galleryButtonSecondary]}
                onPress={() => {
                  appGalleryActiveRef.current = false;
                  launchImageLibrary({ mediaType: 'video', selectionLimit: 1 }, async (r) => {
                    if (r.didCancel || r.errorCode) return;
                    const a = r.assets?.[0];
                    if (!a?.uri) return;
                    try {
                      const t = await createThumbnail({ url: a.uri, timeStamp: 1000 });
                      setLastPreviewUri(t.path);
                      await handleImageAsset({ uri: t.path } as Asset);
                    } catch {}
                  });
                }}
                accessibilityLabel="Pick video from gallery"
              >
                <Icon name="movie" size={18} color="#111827" />
                <Text style={styles.galleryButtonTextSecondary}>Pick Video</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.galleryButtonsRow, styles.gallerySingleButtonRow]}>
              <TouchableOpacity
                style={[styles.galleryButton, styles.galleryButtonTertiary]}
                onPress={() => {
                  setInputSource('gallery');
                  setAslGalleryVisible(true);
                }}
                accessibilityLabel="Open App Gallery"
              >
                <Icon name="grid-view" size={18} color="#B45309" />
                <Text style={styles.galleryButtonTextSecondary}>App Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Current Character + Sentence (desktop-like) */}
          <View style={styles.panelPadTop}>
          {/* Enhanced status banners with guidance */}
          {isProcessingVideo ? (
            <View style={[styles.banner, styles.bannerInfo]}>
              <Text style={styles.bannerTitleInfo}>🔄 Processing Video...</Text>
              <Text style={styles.bannerTextInfo}>• Analyzing video frames for ASL signs</Text>
              <Text style={styles.bannerTextInfo}>• This may take a few moments</Text>
              </View>
          ) : videoPredictionResult ? (
            <View style={[styles.banner, styles.bannerSuccess]}>
              <Text style={styles.bannerTitleSuccess}>✅ Video Analysis Complete</Text>
              <Text style={styles.bannerTextSuccess}>Detected: "{videoPredictionResult.word}" ({Math.round(videoPredictionResult.confidence * 100)}%)</Text>
              <Text style={styles.bannerTextSuccess}>Frames analyzed: {videoPredictionResult.frameCount}</Text>
            </View>
          ) : (!previewPoints || previewPoints.length === 0) ? (
              <View style={[styles.banner, styles.bannerWarn]}>
                <Text style={styles.bannerTitleWarn}>🟡 No hand detected</Text>
                <Text style={styles.bannerTextWarn}>• Position your hand clearly in the camera view</Text>
                <Text style={styles.bannerTextWarn}>• Ensure good lighting and contrast</Text>
                <Text style={styles.bannerTextWarn}>• Keep hand steady and visible</Text>
              </View>
            ) : (confidence < Math.round(CONF_THRESH * 100)) ? (
              <View style={[styles.banner, styles.bannerHint]}>
                <Text style={styles.bannerTitleHint}>🔵 Low confidence ({confidence}%)</Text>
                <Text style={styles.bannerTextHint}>• Hold your hand steady for 2-3 seconds</Text>
                <Text style={styles.bannerTextHint}>• Improve lighting or move to better position</Text>
                <Text style={styles.bannerTextHint}>• Try a clearer hand gesture</Text>
              </View>
            ) : (
              <View style={[styles.banner, styles.bannerSuccess]}>
                <Text style={styles.bannerTitleSuccess}>✅ Good detection ({confidence}%)</Text>
            </View>
          )}
            {/* Current Character + Sentence (match SignToText compact layout) */}
            {(sentenceText || translatedText) && (
              <>
                <View style={styles.currentBoxCompact}>
                  <Text style={styles.currentLabelCompact}>CURRENT</Text>
                  <Text style={styles.currentValueCompact}>
                    {(sentenceText || translatedText || '').trim().slice(-1) || '—'}
                  </Text>
                  <Text style={styles.currentMetaCompact}>Conf: {confidence}%</Text>
            </View>
                <View style={styles.sentenceBoxCompact}>
                  <Text style={styles.sentenceTitleCompact}>SENTENCE</Text>
                  <Text style={styles.sentenceValueCompact} numberOfLines={2}>
                {sentenceText || translatedText || '—'}
              </Text>
            </View>
              </>
            )}
          </View>

          {/* Main action - open output popup */}
          <View style={styles.actionContainer}>
            <View style={styles.inlineControls}>
            <TouchableOpacity
                style={[styles.ghostSmall]}
                onPress={() => {
                  setTranslatedText(text => text.slice(0, Math.max(0, text.trimEnd().length - 1)));
                  setSentenceText(text => text.slice(0, Math.max(0, text.trimEnd().length - 1)));
                }}
                accessibilityLabel="Backspace"
              >
                <Icon name="backspace" size={18} color="#111827" />
                <Text style={styles.ghostSmallText}>Backspace</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.ghostSmall]}
                onPress={() => {
                  // Add Alphabet: append last character again to build sentence, similar to SignToText
                  const lastChar = (sentenceText || translatedText || '').trim().slice(-1);
                  if (!lastChar) return;
                  setTranslatedText(prev => (prev ? prev + lastChar : lastChar));
                  setSentenceText(prev => (prev ? prev + lastChar : lastChar));
                }}
                accessibilityLabel="Add alphabet"
              >
                <Icon name="add" size={18} color="#111827" />
                <Text style={styles.ghostSmallText}>Add Alphabet</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.ghostSmall]}
                onPress={() => {
                  setTranslatedText('');
                  setSentenceText('');
                  appGalleryActiveRef.current = false;
                }}
                accessibilityLabel="Clear text"
              >
                <Icon name="clear" size={18} color="#111827" />
                <Text style={styles.ghostSmallText}>Clear</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.openButton}
              onPress={() => setOutputVisible(true)}
              accessibilityLabel="Open output popup"
            >
              <Text style={styles.openButtonText}>
                Open Output
              </Text>
            </TouchableOpacity>
            {/* Removed WordSuggestions component per request */}
          </View>

          {/* Dictionary / Phrases / Daily / Sentences suggestions, with search (aligned to SignToText layout) */}
          <View style={styles.panelPadTop}>
            {(() => {
              const base = (sentenceText || translatedText || '').trim();
              if (!base) return null;
              const lastChar = base.slice(-1).toUpperCase();
              if (!lastChar || lastChar === ' ' || lastChar === '—') return null;
              const s = getAlphaSuggestions(lastChar) || ({} as any);
              if (!s || (!s.phrases && !s.words && !s.daily && !s.sentences)) return null;
              const renderRow = (label: string, items?: string[], keyPrefix?: string) => {
                if (!items || items.length === 0) return null;
                const q = suggestSearch.trim().toLowerCase();
                const filtered = q
                  ? items.filter(w => w.toLowerCase().includes(q))
                  : items;
                if (!filtered || filtered.length === 0) return null;
                return (
                  <View key={`row-${keyPrefix}`} style={styles.tableRow}>
                    <View style={styles.tableRowLabelPill}>
                      <Text style={styles.tableRowLabel}>{label}</Text>
                    </View>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.tableRowValues}
                    >
                      {filtered.map((w, i) => {
                        const key = `${keyPrefix}-${w}-${i}`;
                        const isSel = selectedSuggestKey === key;
                        return (
                          <TouchableOpacity
                            key={key}
                            style={[
                              styles.suggestChip,
                              isSel ? styles.suggestChipSelected : styles.suggestChipNormal,
                            ]}
                            onPress={() => {
                              setSelectedSuggestKey(key);
                              setTimeout(() => setSelectedSuggestKey(null), 900);
                              suppressUntilRef.current = Date.now() + 1400;
                              setTranslatedText(prev =>
                                prev?.trimEnd() ? prev.trimEnd() + ' ' + w + ' ' : w + ' ',
                              );
                              setSentenceText(prev =>
                                prev?.trimEnd() ? prev.trimEnd() + ' ' + w + ' ' : w + ' ',
                              );
                            }}
                          >
                            <Text style={styles.suggestChipText}>{w}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                );
              };
              return (
                <View style={styles.tableSuggestContainer}>
                  <View style={styles.suggestSearchRow}>
                    <Icon name="search" size={16} color="#6B7280" style={styles.suggestSearchIcon} />
                    <TextInput
                      style={styles.suggestSearchInput}
                      placeholder="Search suggestions..."
                      placeholderTextColor="#9CA3AF"
                      value={suggestSearch}
                      onChangeText={setSuggestSearch}
                    />
                  </View>
                  {renderRow('Phrases', s.phrases, 'ph')}
                  {renderRow('Words', s.words, 'wd')}
                  {renderRow('Daily', s.daily, 'dl')}
                  {renderRow('Sentences', s.sentences, 'sn')}
                </View>
              );
            })()}
          </View>

          {/* Navigation removed per requirement */}
        </ScrollView>

        {/* Floating Actions Menu (slow floaty) */}
        <Animated.View
          pointerEvents={isMenuVisible ? 'auto' : 'none'}
          style={[
            styles.menuBar,
            showNavigation ? styles.menuBarWithNav : styles.menuBarWithoutNav,
            menuBarAnimatedStyle,
          ]}
        >
          {/* Camera */}
          <TouchableOpacity
            style={[styles.menuButton, inputSource === 'camera' && styles.menuButtonActive]}
            onPress={handlePressCamera}
            onLongPress={handleLongPressCamera}
            delayLongPress={300}
            accessibilityLabel="Open camera for photo"
          >
            <Icon name="photo-camera" size={22} color={inputSource === 'camera' ? '#fff' : '#333'} />
          </TouchableOpacity>

          {/* Gallery */}
          <TouchableOpacity style={styles.menuButton} onPress={handlePressGallery} accessibilityLabel="Open gallery">
            <Icon name="photo-library" size={22} color="#333" />
          </TouchableOpacity>

          {/* Video */}
          <TouchableOpacity
            style={[styles.menuButton, isRecording && styles.menuButtonActive]}
            onPress={handlePressVideo}
            accessibilityLabel={isRecording ? 'Stop recording' : 'Start video recording'}
          >
            <View style={styles.videoButtonContent}>
              <Icon name={isRecording ? 'stop' : 'videocam'} size={22} color={isRecording ? '#fff' : '#333'} />
              {isRecording && <View style={styles.recordBadge} />}
            </View>
          </TouchableOpacity>

          {/* Flip */}
          <TouchableOpacity style={styles.menuButton} onPress={handlePressFlip} accessibilityLabel="Flip camera">
            <Icon name="flip-camera-android" size={22} color="#333" />
          </TouchableOpacity>

          {/* Language with flags only */}
          <TouchableOpacity
            style={[styles.menuButton, styles.menuButtonPill]}
            onPress={handlePressLanguage}
            accessibilityLabel="Toggle language"
          >
              <Image
                source={language === 'ASL' ? require('../assets/flags/us.png') : require('../assets/flags/pk.png')}
                style={styles.langFlag}
              />
          </TouchableOpacity>
        </Animated.View>

        {/* Menu toggle FAB */}
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
      </SafeAreaView>

      {/* Bottom Navigation - Removed per requirement */}
      {/* {showNavigation && <AppBottomNav selectedTab={'translate'} onSelect={handleTabSelect} />} */}

      {/* Help Modal (includes ASL alphabet image) */}
      <Modal visible={helpVisible} animationType="fade" transparent onRequestClose={() => setHelpVisible(false)}>
        <View style={styles.helpOverlay}>
          <View style={styles.helpCard}>
            <View style={styles.helpHeader}>
              <Icon name="info" size={22} color="#2196F3" />
              <Text style={styles.helpTitle}>About “Sign to Voice”</Text>
              <TouchableOpacity onPress={() => setHelpVisible(false)} accessibilityLabel="Close help">
                <Icon name="close" size={22} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.helpBody} contentContainerStyle={styles.helpScrollPadding}>
              <Text style={styles.helpParagraph}>
                This screen converts sign input into speech. Capture a photo, record a short video, or pick media from your gallery. For videos, the app analyzes multiple frames to detect ASL signs, then speaks the recognized text.
              </Text>
              <Image source={require('../HelpASLAlphabat/Asl.png')} style={styles.helpAslImage} />
              <Text style={styles.helpHeading}>Actions</Text>
              <Text style={styles.helpBullet}>• Camera: Open camera; shutter to take photo.</Text>
              <Text style={styles.helpBullet}>• Video: Tap to start/stop recording; timer shows seconds.</Text>
              <Text style={styles.helpBullet}>• Gallery: Pick image/video (videos are analyzed frame-by-frame for ASL signs).</Text>
              <Text style={styles.helpBullet}>• Flip: Front/back camera. Long-press Camera to quick-flip.</Text>
              <Text style={styles.helpBullet}>• Language: Toggle ASL/PSL.</Text>
              <Text style={styles.helpBullet}>• Output: Open popup to hear the detected text as voice.</Text>
              <Text style={styles.helpHeading}>Video Analysis</Text>
              <Text style={styles.helpBullet}>• Videos are processed frame-by-frame for better accuracy</Text>
              <Text style={styles.helpBullet}>• Supports ASL signs: hello, thank you, where, you</Text>
              <Text style={styles.helpBullet}>• Analysis may take a few moments depending on video length</Text>
            </ScrollView>
            <TouchableOpacity style={styles.helpCloseButton} onPress={() => setHelpVisible(false)}>
              <Text style={styles.helpCloseText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ASL App Gallery Modal (A–Z, 1–10) */}
      <Modal
        visible={aslGalleryVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setAslGalleryVisible(false)}
      >
        <View style={styles.helpOverlay}>
          <View style={styles.helpCard}>
            <View style={styles.helpHeader}>
              <Icon name="collections" size={22} color="#2196F3" />
              <Text style={styles.helpTitle}>ASL App Gallery</Text>
              <TouchableOpacity onPress={() => setAslGalleryVisible(false)} accessibilityLabel="Close ASL gallery">
                <Icon name="close" size={22} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.helpBody} contentContainerStyle={styles.helpScrollPadding}>
              <Text style={styles.helpParagraph}>
                Tap any ASL alphabet or number card to preview it on the left and use it as the current detected symbol.
                You can then use Add Alphabet, dictionary phrases, and the voice output exactly like camera or gallery input.
              </Text>
              <View style={styles.aslGrid}>
                {ASL_STATIC_IMAGES.map(item => (
                  <TouchableOpacity
                    key={item.key}
                    style={styles.aslCard}
                    onPress={() => {
                      handleAslStaticSelection(item);
                      setAslGalleryVisible(false);
                    }}
                    accessibilityLabel={`ASL ${item.label}`}
                  >
                    <Image source={item.source} style={styles.aslCardImage} resizeMode="contain" />
                    <Text style={styles.aslCardLabel}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Output Popup (white card) */}
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
                <Icon name="volume-up" size={14} color="#1E40AF" />
                <Text style={styles.chipLightText}>Voice Output</Text>
              </View>
              <TouchableOpacity onPress={() => setOutputVisible(false)} style={styles.headerIconButtonLight}>
                <Icon name="close" size={18} color="#111827" />
              </TouchableOpacity>
            </View>

            <View style={styles.avatarStage}>
              <Animated.View style={[styles.textPulseContainer, { transform: [{ scale: speakerPulse }] }]}>
                <Icon name={isPlaying ? 'volume-up' : 'volume-off'} size={72} color="#111827" />
              </Animated.View>
              <View style={[styles.textBars, styles.textBarsMargin]}>{renderTextBars()}</View>
            </View>

            <View style={styles.avatarFooter}>
              <View style={styles.chipLight}>
                <Icon name="translate" size={14} color="#1E40AF" />
                <Text style={styles.chipLightText}>{sentenceText || translatedText || '—'}</Text>
              </View>
              <View style={styles.avatarControls}>
                {isPlaying ? (
                  <TouchableOpacity onPress={stopAudio} style={styles.ghostButtonLight}>
                    <Icon name="stop" size={18} color="#1E88E5" />
                    <Text style={styles.ghostButtonTextLight}>Stop</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={playAudio}
                    style={styles.ghostButtonLight}
                    disabled={!(sentenceText || translatedText)}
                  >
                    <Icon name="play-arrow" size={18} color="#1E88E5" />
                    <Text style={styles.ghostButtonTextLight}>Play</Text>
                  </TouchableOpacity>
                )}
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
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  safeArea: { flex: 1, paddingBottom: 0 },
  scrollContent: { paddingBottom: 24 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#667eea',
    borderBottomWidth: 0, borderBottomColor: 'transparent',
  },
  headerIconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },

  // Input window
  videoContainer: { padding: 8, paddingBottom: 10 },
  videoWindow: {
    height: Math.max(screenHeight * 0.52, 380),
    borderRadius: 20,
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
  dualPane: { flex: 1, flexDirection: 'row' },
  leftPane: { flex: 1, backgroundColor: '#F0F0F0' },
  rightPane: { width: 220, backgroundColor: '#fff', borderLeftWidth: 1, borderLeftColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  skeletonCanvas: { width: 200, height: 200, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  skeletonHint: { color: '#9CA3AF', fontSize: 12 },
  overlayFull: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 },
  edgeLine: { position:'absolute', height:3, backgroundColor:'#00ff00', borderRadius:1.5 }, // Bright green like desktop
  edgeDot: { position:'absolute', width:2, height:2, borderRadius:1, backgroundColor:'#00ff00' },
  pointDot: { position: 'absolute', width: 4, height: 4, borderRadius: 2, backgroundColor: '#ff0000' }, // Red dots like desktop
  skelCenter: { alignItems: 'center' },
  skelTestBtn: { marginTop: 8, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#e5e7eb', borderRadius: 6 },
  skelTestText: { color: '#111827', fontWeight: '600' },
  skelBtnRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  cameraPreview: { flex: 1, width: '100%' },
  previewRow: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'space-between',
  },
  previewBox: {
    flex: 1,
    marginHorizontal: 6,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  
  // Debug overlay styles
  debugOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 8,
    borderRadius: 4,
    maxHeight: 120,
  },
  debugText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'monospace',
    lineHeight: 12,
  },
  personIllustration: { alignItems: 'center' },
  personHead: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: '#E3F2FD', borderWidth: 3, borderColor: '#2196F3', marginBottom: 10,
  },
  personBody: {
    width: 80, height: 100, borderRadius: 40, backgroundColor: '#E3F2FD', borderWidth: 3, borderColor: '#2196F3',
  },
  personArm: {
    position: 'absolute', top: 80, right: 40, width: 20, height: 60, backgroundColor: '#E3F2FD',
    borderWidth: 2, borderColor: '#2196F3', borderRadius: 10, transform: [{ rotate: '10deg' }],
  },
  galleryText: { fontSize: 16, color: '#666', marginTop: 10, textAlign: 'center' },
  galleryView: { flex: 1, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  galleryButtonsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, gap: 8 },
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
  galleryButtonTertiary: {
    flex: 1,
    backgroundColor: '#FFF8EB',
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  galleryButtonText: { marginLeft: 6, color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  galleryButtonTextSecondary: { marginLeft: 6, color: '#111827', fontWeight: '700', fontSize: 13 },
  gallerySingleButtonRow: {
    marginTop: 12,
  },

  recordingIndicator: { position: 'absolute', top: 15, right: 15 },
  recordingDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#FF4444' },

  // Shutter
  shutterContainer: { position: 'absolute', bottom: 18, alignSelf: 'center' },
  shutterButton: {
    width: 62, height: 62, borderRadius: 31, backgroundColor: '#fff', borderWidth: 4, borderColor: '#E5E7EB',
    alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18, shadowRadius: 8,
  },
  shutterButtonVideo: { backgroundColor: '#EF4444', borderColor: '#EF4444' },
  shutterButtonRecording: { backgroundColor: '#B91C1C', borderColor: '#B91C1C' },

  // Recognized chip
  recognizedPill: {
    alignSelf: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  recognizedText: { color: '#6366F1', fontWeight: '700', fontSize: 12 },

  // Main action
  actionContainer: { paddingHorizontal: 16, marginTop: 8, marginBottom: 8, alignItems: 'center' },
  openButton: {
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
  openButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  disabledButton: { backgroundColor: '#B0B0B0', elevation: 0 },
  disabledButtonText: { color: '#666' },
  inlineControls: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
    justifyContent: 'center',
  },
  ghostSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  ghostSmallText: { marginLeft: 6, color: '#111827', fontWeight: '600', fontSize: 13 },

  navSpacer: { height: 120 },

  // Floating menu bar (slow floaty)
  menuBar: {
    position: 'absolute', left: 16, right: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.75)',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10, paddingHorizontal: 8,
    elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 12,
  },
  menuBarWithNav: { bottom: 110 },
  menuBarWithoutNav: { bottom: 40 },
  menuButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginHorizontal: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  menuButtonPill: { minWidth: 48 },
  menuButtonActive: { backgroundColor: '#6366F1' },
  recordBadge: { position: 'absolute', top: -2, right: -10, width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF3B30' },

  // Menu toggle FAB
  menuToggleFab: {
    position: 'absolute', right: 20, width: 52, height: 52, borderRadius: 26, backgroundColor: '#2196F3',
    alignItems: 'center', justifyContent: 'center', elevation: 10, shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12,
  },
  menuToggleFabWithNav: { bottom: 210 },
  menuToggleFabWithoutNav: { bottom: 80 },
  menuToggleFabActive: { backgroundColor: '#1E88E5' },
  langContent: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  langFlag: { width: 18, height: 12, borderRadius: 2, marginRight: 4 },

  // Help modal
  helpOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  helpCard: {
    backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16,
    paddingTop: 12, paddingHorizontal: 16, paddingBottom: 20,
    elevation: 16, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 12,
  },
  helpHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  helpTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: '#1F2937' },
  helpBody: { marginTop: 8, maxHeight: 320 },
  helpParagraph: { color: '#374151', fontSize: 14, lineHeight: 20, marginBottom: 10 },
  helpHeading: { color: '#111827', fontSize: 14, fontWeight: '700', marginTop: 8, marginBottom: 6 },
  helpBullet: { color: '#374151', fontSize: 14, lineHeight: 20, marginBottom: 6 },
  helpAslImage: { width: '100%', height: 220, resizeMode: 'contain', marginVertical: 8 },
  helpCloseButton: { marginTop: 12, backgroundColor: '#2196F3', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  helpCloseText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Output popup (white, minimal elevation)
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
  },
  avatarFooter: { paddingHorizontal: 12, paddingVertical: 12 },
  avatarControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 10 },
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

  textBars: { flexDirection: 'row', alignItems: 'flex-end', height: 30, marginBottom: 15 },
  textBar: { width: 3, backgroundColor: '#E0E0E0', marginHorizontal: 1, borderRadius: 2 },
  textContainer: {
    backgroundColor: '#fff', padding: 16, borderRadius: 12, elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, minWidth: 280, alignItems: 'center',
  },
  confidenceContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  confidenceLabel: { fontSize: 14, color: '#666', marginRight: 8 },
  confidenceValue: { fontSize: 16, fontWeight: 'bold', color: '#4CAF50' },
  translationText: { fontSize: 18, color: '#333', textAlign: 'center', lineHeight: 24, fontWeight: '500' },

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
  textPulseContainer: {
    transform: [{ scale: 1 }], // This will be overridden by animation
  },
  helpScrollPadding: {
    paddingBottom: 8,
  },
  textBarsMargin: {
    marginTop: 12,
  },
  textContainerMargin: {
    marginTop: 12,
  },
  // extracted styles replacing inline warnings
  panelPadTop: { paddingHorizontal: 16, paddingTop: 8 },
  banner: { borderWidth: 1, padding: 12, borderRadius: 8, marginBottom: 8 },
  bannerInfo: { backgroundColor: '#EFF6FF', borderColor: '#3B82F6' },
  bannerTitleInfo: { color: '#1E40AF', fontWeight: '700', fontSize: 14 },
  bannerTextInfo: { color: '#1E40AF', fontSize: 12, marginTop: 4 },
  bannerSuccess: { backgroundColor: '#F0FDF4', borderColor: '#22C55E' },
  bannerTitleSuccess: { color: '#166534', fontWeight: '700', fontSize: 14 },
  bannerTextSuccess: { color: '#166534', fontSize: 12, marginTop: 4 },
  bannerWarn: { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' },
  bannerTitleWarn: { color: '#92400E', fontWeight: '700', fontSize: 14 },
  bannerTextWarn: { color: '#92400E', fontSize: 12, marginTop: 4 },
  bannerHint: { backgroundColor: '#EEF2FF', borderColor: '#6366F1' },
  bannerTitleHint: { color: '#3730A3', fontWeight: '700', fontSize: 14 },
  bannerTextHint: { color: '#3730A3', fontSize: 12, marginTop: 4 },
  // Match compact current/sentence cards from SignToText
  currentBoxCompact: { backgroundColor: '#F3F4F6', borderRadius: 10, padding: 10, marginBottom: 10, alignItems: 'center' },
  currentLabelCompact: { color: '#6B7280', fontSize: 12, fontWeight: '700', marginBottom: 4 },
  currentValueCompact: { color: '#059669', fontSize: 36, fontWeight: '900', fontFamily: 'monospace', textAlign: 'center', minHeight: 46 },
  currentValueDimCompact: { color: '#9CA3AF', fontSize: 36, fontWeight: '900', fontFamily: 'monospace', textAlign: 'center', minHeight: 46 },
  currentMetaCompact: { color: '#6B7280', fontSize: 11, marginTop: 2 },
  sentenceBoxCompact: { backgroundColor: '#EFF6FF', borderRadius: 10, padding: 12, marginBottom: 10 },
  sentenceTitleCompact: { color: '#1E40AF', fontSize: 12, fontWeight: '700', marginBottom: 6 },
  sentenceValueCompact: { color: '#1F2937', fontSize: 16, fontWeight: '500', minHeight: 22, textAlign: 'left' },
  inputButtonsSection: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  // Suggestions (dictionary / phrases / daily / sentences) – modernized layout
  tableSuggestContainer: {
    width: '100%',
    paddingHorizontal: 16,
    marginTop: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  tableRowLabelPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#EEF2FF',
    marginRight: 8,
  },
  tableRowLabel: {
    color: '#1F2937',
    fontWeight: '800',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  tableRowValues: {
    flex: 1,
    flexWrap: 'wrap',
    flexDirection: 'row',
  },
  suggestChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginRight: 8,
    marginBottom: 6,
    borderWidth: 1,
  },
  suggestChipNormal: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  suggestChipSelected: {
    backgroundColor: '#DBEAFE',
    borderColor: '#3B82F6',
  },
  suggestChipText: {
    fontSize: 12,
    color: '#1F2937',
    fontWeight: '600',
  },
  suggestSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 4,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
  },
  suggestSearchIcon: {
    marginRight: 6,
  },
  suggestSearchInput: {
    flex: 1,
    fontSize: 13,
    color: '#111827',
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  aslGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  aslCard: {
    width: '30%',
    aspectRatio: 3 / 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  aslCardImage: {
    width: '100%',
    height: '70%',
    marginBottom: 4,
  },
  aslCardLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
});

export default SignToVoiceScreen;