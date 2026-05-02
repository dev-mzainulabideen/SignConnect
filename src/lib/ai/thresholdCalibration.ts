import { calibrateThresholds, validateThresholds, type CalibrationTestCase } from './rules';

// Sample test cases for threshold calibration
// These would be collected from real hand poses in your app
export const SAMPLE_TEST_CASES: CalibrationTestCase[] = [
  // C vs O test cases (Group 2)
  {
    landmarks400: [
      // Mock C pose - less uniform fingertip distances
      { x: 200, y: 200 }, // wrist
      { x: 180, y: 180 }, { x: 160, y: 160 }, { x: 140, y: 140 }, { x: 120, y: 120 }, // thumb
      { x: 220, y: 180 }, { x: 240, y: 160 }, { x: 260, y: 140 }, { x: 280, y: 120 }, // index
      { x: 230, y: 200 }, { x: 250, y: 180 }, { x: 270, y: 160 }, { x: 290, y: 140 }, // middle
      { x: 240, y: 220 }, { x: 260, y: 200 }, { x: 280, y: 180 }, { x: 300, y: 160 }, // ring
      { x: 250, y: 240 }, { x: 270, y: 220 }, { x: 290, y: 200 }, { x: 310, y: 180 }, // pinky
    ],
    expectedLetter: 'C',
    groupIndex: 2
  },
  {
    landmarks400: [
      // Mock O pose - more uniform fingertip distances
      { x: 200, y: 200 }, // wrist
      { x: 180, y: 180 }, { x: 160, y: 160 }, { x: 140, y: 140 }, { x: 120, y: 120 }, // thumb
      { x: 220, y: 180 }, { x: 240, y: 160 }, { x: 260, y: 140 }, { x: 280, y: 120 }, // index
      { x: 230, y: 200 }, { x: 250, y: 180 }, { x: 270, y: 160 }, { x: 290, y: 140 }, // middle
      { x: 240, y: 220 }, { x: 260, y: 200 }, { x: 280, y: 180 }, { x: 300, y: 160 }, // ring
      { x: 250, y: 240 }, { x: 270, y: 220 }, { x: 290, y: 200 }, { x: 310, y: 180 }, // pinky
    ],
    expectedLetter: 'O',
    groupIndex: 2
  },
  
  // G vs H test cases (Group 6)
  {
    landmarks400: [
      // Mock G pose - more vertical finger alignment
      { x: 200, y: 200 }, // wrist
      { x: 180, y: 180 }, { x: 160, y: 160 }, { x: 140, y: 140 }, { x: 120, y: 120 }, // thumb
      { x: 220, y: 180 }, { x: 240, y: 160 }, { x: 260, y: 140 }, { x: 280, y: 120 }, // index
      { x: 230, y: 200 }, { x: 250, y: 180 }, { x: 270, y: 160 }, { x: 290, y: 140 }, // middle
      { x: 240, y: 220 }, { x: 260, y: 200 }, { x: 280, y: 180 }, { x: 300, y: 160 }, // ring
      { x: 250, y: 240 }, { x: 270, y: 220 }, { x: 290, y: 200 }, { x: 310, y: 180 }, // pinky
    ],
    expectedLetter: 'G',
    groupIndex: 6
  },
  {
    landmarks400: [
      // Mock H pose - more horizontal finger alignment
      { x: 200, y: 200 }, // wrist
      { x: 180, y: 180 }, { x: 160, y: 160 }, { x: 140, y: 140 }, { x: 120, y: 120 }, // thumb
      { x: 220, y: 180 }, { x: 240, y: 160 }, { x: 260, y: 140 }, { x: 280, y: 120 }, // index
      { x: 230, y: 200 }, { x: 250, y: 180 }, { x: 270, y: 160 }, { x: 290, y: 140 }, // middle
      { x: 240, y: 220 }, { x: 260, y: 200 }, { x: 280, y: 180 }, { x: 300, y: 160 }, // ring
      { x: 250, y: 240 }, { x: 270, y: 220 }, { x: 290, y: 200 }, { x: 310, y: 180 }, // pinky
    ],
    expectedLetter: 'H',
    groupIndex: 6
  },
  
  // Group 0 family test cases
  {
    landmarks400: [
      // Mock T pose - thumb close to index base
      { x: 200, y: 200 }, // wrist
      { x: 180, y: 180 }, { x: 160, y: 160 }, { x: 140, y: 140 }, { x: 120, y: 120 }, // thumb
      { x: 220, y: 180 }, { x: 240, y: 160 }, { x: 260, y: 140 }, { x: 280, y: 120 }, // index
      { x: 230, y: 200 }, { x: 250, y: 180 }, { x: 270, y: 160 }, { x: 290, y: 140 }, // middle
      { x: 240, y: 220 }, { x: 260, y: 200 }, { x: 280, y: 180 }, { x: 300, y: 160 }, // ring
      { x: 250, y: 240 }, { x: 270, y: 220 }, { x: 290, y: 200 }, { x: 310, y: 180 }, // pinky
    ],
    expectedLetter: 'T',
    groupIndex: 0
  },
  {
    landmarks400: [
      // Mock S pose - thumb further from index base
      { x: 200, y: 200 }, // wrist
      { x: 180, y: 180 }, { x: 160, y: 160 }, { x: 140, y: 140 }, { x: 120, y: 120 }, // thumb
      { x: 220, y: 180 }, { x: 240, y: 160 }, { x: 260, y: 140 }, { x: 280, y: 120 }, // index
      { x: 230, y: 200 }, { x: 250, y: 180 }, { x: 270, y: 160 }, { x: 290, y: 140 }, // middle
      { x: 240, y: 220 }, { x: 260, y: 200 }, { x: 280, y: 180 }, { x: 300, y: 160 }, // ring
      { x: 250, y: 240 }, { x: 270, y: 220 }, { x: 290, y: 200 }, { x: 310, y: 180 }, // pinky
    ],
    expectedLetter: 'S',
    groupIndex: 0
  }
];

// Function to run calibration and validation
export function runCalibration(): void {
  console.log('Running threshold calibration...');
  
  // Calibrate thresholds from test cases
  const calibratedThresholds = calibrateThresholds(SAMPLE_TEST_CASES);
  console.log('Calibrated thresholds:', calibratedThresholds);
  
  // Validate current thresholds
  const validation = validateThresholds(SAMPLE_TEST_CASES);
  console.log('Validation results:');
  console.log(`Overall accuracy: ${(validation.accuracy * 100).toFixed(1)}%`);
  console.log('Group accuracy:', validation.groupAccuracy);
  console.log('Confusion matrix:', validation.confusionMatrix);
  
  if (validation.errors.length > 0) {
    console.log('Errors:', validation.errors);
  }
}

// Function to add a new test case (for interactive calibration)
export function addTestCase(
  landmarks400: { x: number; y: number }[],
  expectedLetter: string,
  groupIndex: number
): CalibrationTestCase {
  return {
    landmarks400,
    expectedLetter,
    groupIndex
  };
}

// Function to export calibration data
export function exportCalibrationData(): string {
  return JSON.stringify({
    testCases: SAMPLE_TEST_CASES,
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  }, null, 2);
}
