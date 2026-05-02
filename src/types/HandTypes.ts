// Hand Detection and Landmark Types
export interface HandLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface Hand {
  landmarks: HandLandmark[];
  handedness: 'left' | 'right';
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface HandDetectionResult {
  hands: Hand[];
  processingTime: number;
  timestamp: number;
  imageWidth: number;
  imageHeight: number;
}

export interface HandLandmarkConfig {
  connections: number[][];
  colors: {
    landmark: string;
    connection: string;
  };
  drawing: {
    landmark_radius: number;
    connection_thickness: number;
    point_radius: number;
  };
  landmark_indices: {
    wrist: number;
    thumb_tip: number;
    index_tip: number;
    middle_tip: number;
    ring_tip: number;
    pinky_tip: number;
  };
}

export interface HandDetectionConfig {
  minDetectionConfidence: number;
  minTrackingConfidence: number;
  maxHands: number;
  modelComplexity: number;
}

export interface MediaPipeService {
  initialize(): Promise<boolean>;
  detectHands(imageData: Uint8Array, width: number, height: number): Promise<HandDetectionResult>;
  drawHandLandmarks(canvas: any, hands: Hand[], config: HandLandmarkConfig): void;
  isInitialized(): boolean;
  getConfig(): HandDetectionConfig;
  setConfig(config: Partial<HandDetectionConfig>): void;
}
