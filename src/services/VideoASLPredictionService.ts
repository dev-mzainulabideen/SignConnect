/**
 * Video-based ASL Prediction Service
 * Processes video files to extract MediaPipe holistic landmarks and predict ASL signs
 * Based on the Python realtime_prediction.py implementation
 */

import { NativeModules } from 'react-native';
import { ensureInit, classifyFromPoints } from '../lib/ai/signClassifier';

// Load label map for video-based predictions (use TS module to avoid Metro JSON require issues)
import VIDEO_LABELS from '../assets/models/label_map';

export interface VideoPredictionResult {
  word: string;
  confidence: number;
  frameCount: number;
}

export interface VideoFrameData {
  frameIndex: number;
  landmarks: {
    pose?: Array<{ x: number; y: number; z: number }>;
    leftHand?: Array<{ x: number; y: number; z: number }>;
    rightHand?: Array<{ x: number; y: number; z: number }>;
  };
}

/**
 * Extract keypoints from MediaPipe holistic results (matching Python implementation)
 * Returns concatenated array: [pose(33*3) + leftHand(21*3) + rightHand(21*3)] = 225 features
 */
export function extractKeypoints(results: any): number[] {
  const pose = results.pose_landmarks 
    ? results.pose_landmarks.landmark.map((res: any) => [res.x, res.y, res.z]).flat()
    : new Array(33 * 3).fill(0);
  
  const leftHand = results.left_hand_landmarks
    ? results.left_hand_landmarks.landmark.map((res: any) => [res.x, res.y, res.z]).flat()
    : new Array(21 * 3).fill(0);
  
  const rightHand = results.right_hand_landmarks
    ? results.right_hand_landmarks.landmark.map((res: any) => [res.x, res.y, res.z]).flat()
    : new Array(21 * 3).fill(0);
  
  return [...pose, ...leftHand, ...rightHand];
}

/**
 * Process video file to extract frames and predict ASL signs
 * Uses sequence-based approach with 30-frame window (matching Python implementation)
 */
export async function predictVideoASL(videoUri: string): Promise<VideoPredictionResult | null> {
  try {
    console.log('[VideoASL] Starting video prediction for:', videoUri);
    
    // Ensure model is initialized
    await ensureInit('models/sign_model.tflite');
    
    // Extract frames from video using native module
    const HandLandmarks = (NativeModules as any).HandLandmarks;
    if (!HandLandmarks?.extractVideoFrames) {
      console.warn('[VideoASL] Video frame extraction not available');
      return null;
    }
    
    console.log('[VideoASL] Extracting frames from video...');
    const frameData: VideoFrameData[] = await HandLandmarks.extractVideoFrames(videoUri, {
      maxFrames: 60, // Extract up to 60 frames
      interval: 1,   // Every frame
    });
    
    if (!frameData || frameData.length === 0) {
      console.warn('[VideoASL] No frames extracted from video');
      return null;
    }
    
    console.log(`[VideoASL] Extracted ${frameData.length} frames`);
    
    // Build sequence of keypoints (matching Python: sequence = sequence[-30:])
    const sequence: number[][] = [];
    const SEQUENCE_LENGTH = 30; // Matching Python implementation
    const CONFIDENCE_THRESHOLD = 0.85; // Matching Python threshold
    
    for (const frame of frameData) {
      const keypoints = extractKeypoints(frame.landmarks);
      sequence.push(keypoints);
      
      // Keep only last 30 frames
      if (sequence.length > SEQUENCE_LENGTH) {
        sequence.shift();
      }
      
      // Predict when we have enough frames
      if (sequence.length === SEQUENCE_LENGTH) {
        console.log('[VideoASL] Running prediction on sequence...');
        
        // Convert sequence to model input format
        // Python: model.predict(np.expand_dims(sequence, axis=0))
        const sequenceArray = sequence.flat();
        
        // Use existing classifyFromPoints but adapt for sequence input
        const result = await classifySequenceFromKeypoints(sequenceArray);
        
        if (result && result.confidence >= CONFIDENCE_THRESHOLD) {
          console.log(`[VideoASL] Detected: ${result.word} (${result.confidence.toFixed(2)})`);
          return {
            word: result.word,
            confidence: result.confidence,
            frameCount: frameData.length
          };
        }
      }
    }
    
    console.log('[VideoASL] No confident prediction found');
    return null;
    
  } catch (error) {
    console.error('[VideoASL] Video prediction failed:', error);
    return null;
  }
}

/**
 * Classify sequence of keypoints using the ASL model
 * Adapts the existing classifyFromPoints for sequence input
 */
async function classifySequenceFromKeypoints(sequenceArray: number[]): Promise<{ word: string; confidence: number } | null> {
  try {
    // For now, we'll use the existing model but this needs to be adapted
    // to handle sequence input instead of single frame
    
    // Convert sequence to the format expected by existing model
    // This is a temporary solution - ideally we'd have a sequence-aware model
    
    // Take the last frame's keypoints (hand landmarks only for compatibility)
    const keypointsPerFrame = 225; // pose(99) + leftHand(63) + rightHand(63)
    const lastFrameKeypoints = sequenceArray.slice(-keypointsPerFrame);
    
    // Extract only hand landmarks (21 points each) for compatibility with existing model
    const handLandmarks = extractHandLandmarksFromSequence(lastFrameKeypoints);
    
    if (handLandmarks.length === 0) {
      return null;
    }
    
    // Use existing classification
    const result = await classifyFromPoints(handLandmarks);
    
    if (!result) {
      return null;
    }
    
    // Map to video labels
    const word = VIDEO_LABELS[result.topIndex] || 'unknown';
    const confidence = result.probs[result.topIndex] || 0;
    
    return { word, confidence };
    
  } catch (error) {
    console.error('[VideoASL] Sequence classification failed:', error);
    return null;
  }
}

/**
 * Extract hand landmarks from sequence keypoints for compatibility with existing model
 */
function extractHandLandmarksFromSequence(sequenceKeypoints: number[]): Array<{ x: number; y: number }> {
  try {
    // MediaPipe holistic format: pose(33*3) + leftHand(21*3) + rightHand(21*3)
    const poseLength = 33 * 3;
    const handLength = 21 * 3;
    
    // Extract left hand landmarks (skip pose, take left hand)
    const leftHandStart = poseLength;
    const leftHandEnd = leftHandStart + handLength;
    const leftHandKeypoints = sequenceKeypoints.slice(leftHandStart, leftHandEnd);
    
    // Extract right hand landmarks
    const rightHandStart = leftHandEnd;
    const rightHandEnd = rightHandStart + handLength;
    const rightHandKeypoints = sequenceKeypoints.slice(rightHandStart, rightHandEnd);
    
    // Convert to {x, y} format (ignore z for 2D model compatibility)
    const leftHandLandmarks = [];
    const rightHandLandmarks = [];
    
    for (let i = 0; i < handLength; i += 3) {
      if (leftHandKeypoints[i] !== 0 || leftHandKeypoints[i + 1] !== 0) {
        leftHandLandmarks.push({
          x: leftHandKeypoints[i],
          y: leftHandKeypoints[i + 1]
        });
      }
      if (rightHandKeypoints[i] !== 0 || rightHandKeypoints[i + 1] !== 0) {
        rightHandLandmarks.push({
          x: rightHandKeypoints[i],
          y: rightHandKeypoints[i + 1]
        });
      }
    }
    
    // Combine both hands (prefer the hand with more detected points)
    const combinedLandmarks = leftHandLandmarks.length >= rightHandLandmarks.length 
      ? leftHandLandmarks 
      : rightHandLandmarks;
    
    return combinedLandmarks;
    
  } catch (error) {
    console.error('[VideoASL] Hand landmark extraction failed:', error);
    return [];
  }
}

/**
 * Process video file with frame-by-frame analysis
 * Alternative approach: analyze each frame individually and combine results
 */
export async function predictVideoASLFrameByFrame(videoUri: string): Promise<VideoPredictionResult | null> {
  try {
    console.log('[VideoASL] Starting frame-by-frame prediction for:', videoUri);
    
    await ensureInit('models/sign_model.tflite');
    
    const HandLandmarks = (NativeModules as any).HandLandmarks;
    if (!HandLandmarks?.extractVideoFrames) {
      console.warn('[VideoASL] Video frame extraction not available');
      return null;
    }
    
    const frameData: VideoFrameData[] = await HandLandmarks.extractVideoFrames(videoUri, {
      maxFrames: 30,
      interval: 1,
    });
    
    if (!frameData || frameData.length === 0) {
      return null;
    }
    
    console.log(`[VideoASL] Analyzing ${frameData.length} frames individually`);
    
    const predictions: Array<{ word: string; confidence: number }> = [];
    
    // Analyze each frame individually
    for (const frame of frameData) {
      const handLandmarks = extractHandLandmarksFromFrame(frame.landmarks);
      
      if (handLandmarks.length > 0) {
        const result = await classifyFromPoints(handLandmarks);
        
        if (result && result.probs[result.topIndex] > 0.3) {
          const word = VIDEO_LABELS[result.topIndex] || 'unknown';
          predictions.push({
            word,
            confidence: result.probs[result.topIndex]
          });
        }
      }
    }
    
    if (predictions.length === 0) {
      return null;
    }
    
    // Find most common prediction with highest average confidence
    const wordCounts: Record<string, { count: number; totalConfidence: number }> = {};
    
    predictions.forEach(pred => {
      if (!wordCounts[pred.word]) {
        wordCounts[pred.word] = { count: 0, totalConfidence: 0 };
      }
      wordCounts[pred.word].count++;
      wordCounts[pred.word].totalConfidence += pred.confidence;
    });
    
    let bestWord = '';
    let bestScore = 0;
    
    Object.entries(wordCounts).forEach(([word, data]) => {
      const score = data.count * (data.totalConfidence / data.count); // count * avg_confidence
      if (score > bestScore) {
        bestScore = score;
        bestWord = word;
      }
    });
    
    if (bestWord && bestScore > 0.5) {
      const avgConfidence = wordCounts[bestWord].totalConfidence / wordCounts[bestWord].count;
      return {
        word: bestWord,
        confidence: avgConfidence,
        frameCount: frameData.length
      };
    }
    
    return null;
    
  } catch (error) {
    console.error('[VideoASL] Frame-by-frame prediction failed:', error);
    return null;
  }
}

/**
 * Extract hand landmarks from frame data
 */
function extractHandLandmarksFromFrame(landmarks: any): Array<{ x: number; y: number }> {
  const handLandmarks: Array<{ x: number; y: number }> = [];
  
  // Prefer left hand, fallback to right hand
  const handData = landmarks.leftHand || landmarks.rightHand;
  
  if (handData && Array.isArray(handData)) {
    handData.forEach((point: any) => {
      if (point && typeof point.x === 'number' && typeof point.y === 'number') {
        handLandmarks.push({ x: point.x, y: point.y });
      }
    });
  }
  
  return handLandmarks;
}
