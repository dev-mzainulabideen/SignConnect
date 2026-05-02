// Enhanced Hand Landmark Visualizer with 21 landmarks and connecting lines
// Based on MediaPipe hand landmark model structure
// Shows proper hand skeleton with colored landmarks and connections

import React from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import { Hand } from '../types/HandTypes';

interface HandLandmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

interface HandLandmarkVisualizerProps {
  hands: Hand[];
  realtimeHands?: HandLandmark[][];
  imageWidth: number;
  imageHeight: number;
  style?: any;
  showConnections?: boolean;
  showLandmarks?: boolean;
  landmarkSize?: number;
  connectionWidth?: number;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Hand landmark connections for visualization (MediaPipe structure)
const HAND_CONNECTIONS = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index finger
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle finger
  [0, 9], [9, 10], [10, 11], [11, 12],
  // Ring finger
  [0, 13], [13, 14], [14, 15], [15, 16],
  // Pinky
  [0, 17], [17, 18], [18, 19], [19, 20],
  // Palm connections
  [5, 9], [9, 13], [13, 17]
];

// Colors for different parts of the hand (MediaPipe style)
const COLORS = {
  landmark: '#00FF00', // Green for landmarks
  connection: '#FF0000', // Red for connections
  thumb: '#FFFF00', // Yellow for thumb
  index: '#00FFFF', // Cyan for index finger
  middle: '#FF00FF', // Magenta for middle finger
  ring: '#FFA500', // Orange for ring finger
  pinky: '#800080', // Purple for pinky
  wrist: '#FFFFFF', // White for wrist
  palm: '#FFD700', // Gold for palm connections
};

export const HandLandmarkVisualizer: React.FC<HandLandmarkVisualizerProps> = ({
  hands,
  realtimeHands,
  imageWidth,
  imageHeight,
  style,
  showConnections = true,
  showLandmarks = true,
  landmarkSize = 8,
  connectionWidth = 3
}) => {
  // Calculate scale factors to fit the image in the available space
  const scaleX = screenWidth / imageWidth;
  const scaleY = screenHeight / imageHeight;
  const scale = Math.min(scaleX, scaleY);

  // Calculate offset to center the image
  const offsetX = (screenWidth - imageWidth * scale) / 2;
  const offsetY = (screenHeight - imageHeight * scale) / 2;

  const getLandmarkColor = (landmarkIndex: number): string => {
    // Color coding based on finger groups (MediaPipe structure)
    if (landmarkIndex === 0) return COLORS.wrist; // Wrist
    if (landmarkIndex >= 1 && landmarkIndex <= 4) return COLORS.thumb; // Thumb
    if (landmarkIndex >= 5 && landmarkIndex <= 8) return COLORS.index; // Index finger
    if (landmarkIndex >= 9 && landmarkIndex <= 12) return COLORS.middle; // Middle finger
    if (landmarkIndex >= 13 && landmarkIndex <= 16) return COLORS.ring; // Ring finger
    if (landmarkIndex >= 17 && landmarkIndex <= 20) return COLORS.pinky; // Pinky
    return COLORS.landmark; // Default
  };

  const getConnectionColor = (startIndex: number, endIndex: number): string => {
    // Color connections based on the finger they belong to
    if (startIndex >= 1 && startIndex <= 4) return COLORS.thumb;
    if (startIndex >= 5 && startIndex <= 8) return COLORS.index;
    if (startIndex >= 9 && startIndex <= 12) return COLORS.middle;
    if (startIndex >= 13 && startIndex <= 16) return COLORS.ring;
    if (startIndex >= 17 && startIndex <= 20) return COLORS.pinky;
    
    // Palm connections (between fingers)
    if ((startIndex === 5 && endIndex === 9) || 
        (startIndex === 9 && endIndex === 13) || 
        (startIndex === 13 && endIndex === 17)) {
      return COLORS.palm;
    }
    
    return COLORS.connection; // Default
  };

  const renderHand = (handLandmarks: any[], handIndex: number) => {
    if (!handLandmarks || handLandmarks.length < 21) {
      return null;
    }

    const landmarks = handLandmarks.map(landmark => ({
      x: landmark.x * scale + offsetX,
      y: landmark.y * scale + offsetY,
      visibility: landmark.visibility || 1.0
    }));

    return (
      <View key={`hand-${handIndex}`} style={styles.handContainer}>
        {/* Render connections (skeleton) */}
        {showConnections && HAND_CONNECTIONS.map(([startIdx, endIdx], connectionIndex) => {
          const start = landmarks[startIdx];
          const end = landmarks[endIdx];
          
          if (!start || !end || start.visibility < 0.5 || end.visibility < 0.5) {
            return null;
          }

          const color = getConnectionColor(startIdx, endIdx);
          const length = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2);
          const angle = Math.atan2(end.y - start.y, end.x - start.x) * 180 / Math.PI;

          return (
            <View
              key={`connection-${handIndex}-${connectionIndex}`}
              style={[
                styles.connection,
                {
                  left: start.x,
                  top: start.y,
                  width: length,
                  height: connectionWidth,
                  backgroundColor: color,
                  transform: [{ rotate: `${angle}deg` }]
                }
              ]}
            />
          );
        })}

        {/* Render landmarks (joints) */}
        {showLandmarks && landmarks.map((landmark, landmarkIndex) => {
          if (landmark.visibility < 0.5) {
            return null;
          }

          const color = getLandmarkColor(landmarkIndex);
          const size = landmarkIndex === 0 ? landmarkSize + 2 : landmarkSize; // Larger wrist

          return (
            <View
              key={`landmark-${handIndex}-${landmarkIndex}`}
              style={[
                styles.landmark,
                {
                  left: landmark.x - size/2,
                  top: landmark.y - size/2,
                  width: size,
                  height: size,
                  backgroundColor: color
                }
              ]}
            />
          );
        })}
      </View>
    );
  };

  // Use realtime hands if available, otherwise fall back to regular hands
  const handsToRender = realtimeHands || hands.map(hand => hand.landmarks);

  if (!handsToRender || handsToRender.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      {handsToRender.map((hand, index) => renderHand(hand, index))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none', // Allow touches to pass through
  },
  handContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  landmark: {
    position: 'absolute',
    borderRadius: 50, // Make it circular
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  connection: {
    position: 'absolute',
    borderRadius: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
});

export default HandLandmarkVisualizer;