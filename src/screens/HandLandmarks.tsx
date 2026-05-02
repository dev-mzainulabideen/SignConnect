import React from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import { Hand } from '../types/HandTypes';

interface HandLandmarksProps {
  hands: Hand[];
}

export const HandLandmarks: React.FC<HandLandmarksProps> = ({ hands }) => {
  if (hands.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {hands.map((hand, handIndex) => (
        <View key={handIndex} style={styles.handContainer}>
          {/* This would be implemented with actual landmark drawing */}
          {/* For now, we'll just show a placeholder */}
          <View style={styles.landmarkPlaceholder}>
            {/* Landmarks would be drawn here using SVG or Canvas */}
          </View>
        </View>
      ))}
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
    pointerEvents: 'none',
  },
  handContainer: {
    position: 'absolute',
  },
  landmarkPlaceholder: {
    width: 20,
    height: 20,
    backgroundColor: 'rgba(0, 122, 255, 0.5)',
    borderRadius: 10,
  },
});
