/**
 * Video ASL Test Component
 * Simple test interface to verify video-based ASL prediction
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { predictVideoASLFrameByFrame } from '../services/VideoASLPredictionService';

const VideoASLTest: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string>('');

  const testVideoPrediction = () => {
    launchImageLibrary(
      { mediaType: 'video', selectionLimit: 1 },
      async (response) => {
        if (response.didCancel || response.errorCode) return;
        
        const asset = response.assets?.[0];
        if (!asset?.uri) return;

        setIsProcessing(true);
        setResult('');

        try {
          console.log('[Test] Starting video prediction test...');
          const prediction = await predictVideoASLFrameByFrame(asset.uri);
          
          if (prediction) {
            const resultText = `Detected: "${prediction.word}"\nConfidence: ${Math.round(prediction.confidence * 100)}%\nFrames: ${prediction.frameCount}`;
            setResult(resultText);
            Alert.alert('Video Analysis Complete', resultText);
          } else {
            setResult('No sign detected in video');
            Alert.alert('No Sign Detected', 'No ASL sign was detected in the video.');
          }
        } catch (error) {
          console.error('[Test] Video prediction failed:', error);
          setResult('Error processing video');
          Alert.alert('Error', 'Failed to process video');
        } finally {
          setIsProcessing(false);
        }
      }
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Video ASL Test</Text>
      <Text style={styles.subtitle}>Test video-based ASL sign recognition</Text>
      
      <TouchableOpacity 
        style={[styles.button, isProcessing && styles.buttonDisabled]}
        onPress={testVideoPrediction}
        disabled={isProcessing}
      >
        <Text style={styles.buttonText}>
          {isProcessing ? 'Processing...' : 'Select Video'}
        </Text>
      </TouchableOpacity>

      {result ? (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Result:</Text>
          <Text style={styles.resultText}>{result}</Text>
        </View>
      ) : null}

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Supported ASL Signs:</Text>
        <Text style={styles.infoText}>• hello</Text>
        <Text style={styles.infoText}>• thank you</Text>
        <Text style={styles.infoText}>• where</Text>
        <Text style={styles.infoText}>• you</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  button: {
    backgroundColor: '#2196F3',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  resultText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  infoContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
});

export default VideoASLTest;
