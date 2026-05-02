export type Point = { x: number; y: number };

export type GroupRefinementInput = {
  landmarks400: Point[]; // length 21 in 400x400 render space
  groupProbs: number[];  // length 8
};

export type RuleResult = {
  letter?: string; // 'A'..'Z' | 'space' | 'del' | 'nothing'
  confidence: number; // top1 prob
  debugInfo?: DebugInfo; // Optional debug measurements
};

export type DebugInfo = {
  measurements: {
    uniformity?: number;
    horizontalRatio?: number;
    thumbToPalm?: number;
    fingerCurls?: number[];
    thumbToIndexBase?: number;
    thumbPosition?: string;
    fingerDistances?: number[];
  };
  thresholds: {
    uniformityThreshold?: number;
    horizontalThreshold?: number;
    thumbThreshold?: number;
    curlThreshold?: number;
    fingerSpacingThreshold?: number;
  };
};

// Fixed ASL detection rules based on proper hand formations
export function refineGroupToLetter(input: GroupRefinementInput): RuleResult {
  const { landmarks400: pts, groupProbs } = input;
  
  if (!pts || pts.length < 21) {
    return { letter: 'nothing', confidence: 0 };
  }

  // Points are already in desktop coordinate system (0-400 range) from toRender400()
  const points = pts.map(p => ({
    x: Math.round(p.x),
    y: Math.round(p.y)
  }));
  
  // Debug: Log key landmark coordinates for verification
  if (points.length >= 21) {
    console.log(`[Rules] Key landmarks: Wrist(${points[0].x}, ${points[0].y}), Thumb(${points[4].x}, ${points[4].y}), Index(${points[8].x}, ${points[8].y})`);
  }

  // STEP 1: Apply desktop's group disambiguation logic (37 conditions)
  let topGroup = argmax(groupProbs);
  const secondGroup = argmax(groupProbs.map((p, i) => i === topGroup ? 0 : p));
  const pl = [topGroup, secondGroup]; // Top 2 predictions like desktop
  
  console.log(`[Rules] Before disambiguation: Group ${topGroup} (${groupProbs[topGroup].toFixed(3)}), Group ${secondGroup} (${groupProbs[secondGroup].toFixed(3)})`);
  
  // Apply desktop's group disambiguation conditions
  const originalGroup = topGroup;
  topGroup = applyGroupDisambiguation(points, topGroup, secondGroup, pl);
  
  if (originalGroup !== topGroup) {
    console.log(`[Rules] Group disambiguation: ${originalGroup} → ${topGroup} (conditions matched)`);
  }
  
  const confidence = groupProbs[topGroup];

  // Key landmark indices for MediaPipe hand detection:
  // 0: Wrist, 4: Thumb tip, 3: Thumb IP, 2: Thumb PIP, 1: Thumb MCP
  // 8: Index tip, 7: Index DIP, 6: Index PIP, 5: Index MCP
  // 12: Middle tip, 11: Middle DIP, 10: Middle PIP, 9: Middle MCP
  // 16: Ring tip, 15: Ring DIP, 14: Ring PIP, 13: Ring MCP
  // 20: Pinky tip, 19: Pinky DIP, 18: Pinky PIP, 17: Pinky MCP

  let letter = 'nothing';
  const debugMeasurements = calculateDebugMeasurements(points);

  // Group 0: [A, E, M, N, S, T] - FIXED: Use desktop's exact coordinate logic
  if (topGroup === 0) {
    letter = 'S'; // Default like desktop
    
    // A: Thumb left of ALL fingers (desktop: pts[4][0] < pts[6][0] && pts[4][0] < pts[10][0] && pts[4][0] < pts[14][0] && pts[4][0] < pts[18][0])
    if (points[4].x < points[6].x && points[4].x < points[10].x && points[4].x < points[14].x && points[4].x < points[18].x) {
      letter = 'A';
    }
    // T: Thumb between index and middle, above ring and pinky (desktop logic)
    else if (points[4].x > points[6].x && points[4].x < points[10].x && points[4].x < points[14].x && points[4].x < points[18].x && 
             points[4].y < points[14].y && points[4].y < points[18].y) {
      letter = 'T';
    }
    // E: Thumb below ALL fingertips (desktop: pts[4][1] > pts[8][1] && pts[4][1] > pts[12][1] && pts[4][1] > pts[16][1] && pts[4][1] > pts[20][1])
    else if (points[4].y > points[8].y && points[4].y > points[12].y && points[4].y > points[16].y && points[4].y > points[20].y) {
      letter = 'E';
    }
    // M: Thumb right of index, middle, ring, above pinky (desktop logic)
    else if (points[4].x > points[6].x && points[4].x > points[10].x && points[4].x > points[14].x && points[4].y < points[18].y) {
      letter = 'M';
    }
    // N: Thumb right of index, middle, above ring and pinky (desktop logic)
    else if (points[4].x > points[6].x && points[4].x > points[10].x && points[4].y < points[18].y && points[4].y < points[14].y) {
      letter = 'N';
    }
  }

  // Group 1: [B, D, F, I, K, R, U, V, W] - FIXED: Use desktop's exact coordinate logic
  else if (topGroup === 1) {
    // Desktop uses exact coordinate comparisons for finger positions
    // B: All fingers extended (PIP above DIP for all fingers)
    if (points[6].y > points[8].y && points[10].y > points[12].y && points[14].y > points[16].y && points[18].y > points[20].y) {
      letter = 'B';
    }
    // D: Only index extended, others curled
    else if (points[6].y > points[8].y && points[10].y < points[12].y && points[14].y < points[16].y && points[18].y < points[20].y) {
      letter = 'D';
    }
    // F: Index curled, others extended
    else if (points[6].y < points[8].y && points[10].y > points[12].y && points[14].y > points[16].y && points[18].y > points[20].y) {
      letter = 'F';
    }
    // I: Only pinky extended
    else if (points[6].y < points[8].y && points[10].y < points[12].y && points[14].y < points[16].y && points[18].y > points[20].y) {
      letter = 'I';
    }
    // W: Index, middle, ring extended, pinky curled
    else if (points[6].y > points[8].y && points[10].y > points[12].y && points[14].y > points[16].y && points[18].y < points[20].y) {
      letter = 'W';
    }
    // K: Complex condition with thumb position
    else if (points[6].y > points[8].y && points[10].y > points[12].y && points[14].y > points[16].y && points[18].y < points[20].y && points[4].y < points[9].y) {
      letter = 'K';
    }
    // U: Close finger spacing
    else if ((Math.sqrt(Math.pow(points[8].x - points[12].x, 2) + Math.pow(points[8].y - points[12].y, 2)) - 
              Math.sqrt(Math.pow(points[6].x - points[10].x, 2) + Math.pow(points[6].y - points[10].y, 2))) < 8 &&
             points[6].y > points[8].y && points[10].y > points[12].y && points[14].y < points[16].y && points[18].y < points[20].y) {
      letter = 'U';
    }
    // V: Wide finger spacing with thumb condition
    else if ((Math.sqrt(Math.pow(points[8].x - points[12].x, 2) + Math.pow(points[8].y - points[12].y, 2)) - 
              Math.sqrt(Math.pow(points[6].x - points[10].x, 2) + Math.pow(points[6].y - points[10].y, 2))) >= 8 &&
             points[6].y > points[8].y && points[10].y > points[12].y && points[14].y < points[16].y && points[18].y < points[20].y && 
             points[4].y > points[9].y) {
      letter = 'V';
    }
    // R: Index finger right of middle finger
    else if (points[8].x > points[12].x && 
             points[6].y > points[8].y && points[10].y > points[12].y && points[14].y < points[16].y && points[18].y < points[20].y) {
      letter = 'R';
    }
    else {
      letter = 'B'; // Default
    }
  }

  // Group 2: [C, O] - FIXED: Use desktop's simple distance logic
  else if (topGroup === 2) {
    // Desktop logic: if distance(middle_tip, thumb_tip) > 42 then C, else O
    const middleTip = points[12]; // Middle finger tip
    const thumbTip = points[4];   // Thumb tip
    const distance = Math.sqrt(Math.pow(middleTip.x - thumbTip.x, 2) + Math.pow(middleTip.y - thumbTip.y, 2));
    
    if (distance > 42) {
      letter = 'C';
    } else {
      letter = 'O';
    }
  }

  // Group 3: [G, H] - FIXED: Use desktop's simple distance logic
  else if (topGroup === 3) {
    // Desktop logic: if distance(index_tip, middle_tip) > 72 then G, else H
    const indexTip = points[8];  // Index finger tip
    const middleTip = points[12]; // Middle finger tip
    const distance = Math.sqrt(Math.pow(indexTip.x - middleTip.x, 2) + Math.pow(indexTip.y - middleTip.y, 2));
    
    if (distance > 72) {
      letter = 'G';
    } else {
      letter = 'H';
    }
  }

  // Group 4: [L] - L-shape
  else if (topGroup === 4) {
    const fingersExtended = getFingersExtended(points);
    // L: Index finger and thumb extended at right angle
    if (fingersExtended.index && fingersExtended.thumb && 
        !fingersExtended.middle && !fingersExtended.ring && !fingersExtended.pinky &&
        thumbIndexRightAngle(points)) {
      letter = 'L';
    }
    else {
      letter = 'L'; // Default
    }
  }

  // Group 5: [P, Q, Z] - FIXED: Use desktop's exact coordinate logic
  else if (topGroup === 5) {
    // Desktop logic for Group 5
    if (points[4].x > points[12].x && points[4].x > points[16].x && points[4].x > points[20].x) {
      // Thumb right of middle, ring, and pinky fingers
      if (points[8].y < points[5].y) {
        // Index tip above index MCP
        letter = 'Z';
      } else {
        letter = 'Q';
      }
    } else {
      letter = 'P';
    }
  }

  // Group 6: [X] - Single letter group
  else if (topGroup === 6) {
    letter = 'X';
  }

  // Group 7: [Y, J] - FIXED: Use desktop's simple distance logic
  else if (topGroup === 7) {
    // Desktop logic: if distance(index_tip, thumb_tip) > 42 then Y, else J
    const indexTip = points[8];  // Index finger tip
    const thumbTip = points[4];  // Thumb tip
    const distance = Math.sqrt(Math.pow(indexTip.x - thumbTip.x, 2) + Math.pow(indexTip.y - thumbTip.y, 2));
    
    console.log(`[Rules] Group 7 (Y/J): Index tip (${indexTip.x}, ${indexTip.y}), Thumb tip (${thumbTip.x}, ${thumbTip.y}), Distance: ${distance.toFixed(1)}`);
    
    if (distance > 42) {
      letter = 'Y';
      console.log(`[Rules] Group 7 → Y (distance ${distance.toFixed(1)} > 42)`);
    } else {
      letter = 'J';
      console.log(`[Rules] Group 7 → J (distance ${distance.toFixed(1)} ≤ 42)`);
    }
  }

  // Override with special gesture detection (pass current letter for desktop compatibility)
  const specialGesture = detectSpecialGestures(points, letter);
  if (specialGesture) {
    console.log(`[Rules] Special gesture override: ${letter} → ${specialGesture}`);
    letter = specialGesture;
  }

  return {
    letter,
    confidence,
    debugInfo: {
      measurements: debugMeasurements,
      thresholds: {
        uniformityThreshold: 0.78,
        horizontalThreshold: 1.35,
        thumbThreshold: 50,
        curlThreshold: 15,
        fingerSpacingThreshold: 25,
      }
    }
  };
}

// Desktop's group disambiguation logic with 37 conditions
function applyGroupDisambiguation(points: Point[], ch1: number, ch2: number, pl: number[]): number {
  // Helper function to calculate distance between two points
  const distance = (p1: Point, p2: Point): number => {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  };

  // Condition 1: [Aemnst] - Force to Group 0 if fingers extended
  const aemnstConditions = [[5, 2], [5, 3], [3, 5], [3, 6], [3, 0], [3, 2], [6, 4], [6, 1], [6, 2], [6, 6], [6, 7], [6, 0], [6, 5],
                           [4, 1], [1, 0], [1, 1], [6, 3], [1, 6], [5, 6], [5, 1], [4, 5], [1, 4], [1, 5], [2, 0], [2, 6], [4, 6],
                           [1, 0], [5, 7], [1, 6], [6, 1], [7, 6], [2, 5], [7, 1], [5, 4], [7, 0], [7, 5], [7, 2]];
  if (aemnstConditions.some(cond => cond[0] === pl[0] && cond[1] === pl[1])) {
    if (points[6].y < points[8].y && points[10].y < points[12].y && points[14].y < points[16].y && points[18].y < points[20].y) {
      ch1 = 0;
    }
  }

  // Condition 2: [o][s] - Force to Group 0
  if ([[2, 2], [2, 1]].some(cond => cond[0] === pl[0] && cond[1] === pl[1])) {
    if (points[5].x < points[4].x) {
      ch1 = 0;
    }
  }

  // Condition 3: [c0][aemnst] - Force to Group 2
  if ([[0, 0], [0, 6], [0, 2], [0, 5], [0, 1], [0, 7], [5, 2], [7, 6], [7, 1]].some(cond => cond[0] === pl[0] && cond[1] === pl[1])) {
    if ((points[0].x > points[8].x && points[0].x > points[4].x && points[0].x > points[12].x && points[0].x > points[16].x && points[0].x > points[20].x) && 
        points[5].x > points[4].x) {
      ch1 = 2;
    }
  }

  // Condition 4: [c0][aemnst] - Force to Group 2 (distance check)
  if ([[6, 0], [6, 6], [6, 2]].some(cond => cond[0] === pl[0] && cond[1] === pl[1])) {
    if (distance(points[8], points[16]) < 52) {
      ch1 = 2;
    }
  }

  // Condition 5: [gh][bdfikruvw] - Force to Group 3
  if ([[1, 4], [1, 5], [1, 6], [1, 3], [1, 0]].some(cond => cond[0] === pl[0] && cond[1] === pl[1])) {
    if (points[6].y > points[8].y && points[14].y < points[16].y && points[18].y < points[20].y && 
        points[0].x < points[8].x && points[0].x < points[12].x && points[0].x < points[16].x && points[0].x < points[20].x) {
      ch1 = 3;
    }
  }

  // Condition 6: [gh][l] - Force to Group 3
  if ([[4, 6], [4, 1], [4, 5], [4, 3], [4, 7]].some(cond => cond[0] === pl[0] && cond[1] === pl[1])) {
    if (points[4].x > points[0].x) {
      ch1 = 3;
    }
  }

  // Condition 7: [gh][pqz] - Force to Group 3
  if ([[5, 3], [5, 0], [5, 7], [5, 4], [5, 2], [5, 1], [5, 5]].some(cond => cond[0] === pl[0] && cond[1] === pl[1])) {
    if (points[2].y + 15 < points[16].y) {
      ch1 = 3;
    }
  }

  // Condition 8: [l][x] - Force to Group 4
  if ([[6, 4], [6, 1], [6, 2]].some(cond => cond[0] === pl[0] && cond[1] === pl[1])) {
    if (distance(points[4], points[11]) > 55) {
      ch1 = 4;
    }
  }

  // Condition 9: [l][d] - Force to Group 4
  if ([[1, 4], [1, 6], [1, 1]].some(cond => cond[0] === pl[0] && cond[1] === pl[1])) {
    if (distance(points[4], points[11]) > 50 && 
        points[6].y > points[8].y && points[10].y < points[12].y && points[14].y < points[16].y && points[18].y < points[20].y) {
      ch1 = 4;
    }
  }

  // Condition 10: [l][gh] - Force to Group 4
  if ([[3, 6], [3, 4]].some(cond => cond[0] === pl[0] && cond[1] === pl[1])) {
    if (points[4].x < points[0].x) {
      ch1 = 4;
    }
  }

  // Condition 11: [l][c0] - Force to Group 4
  if ([[2, 2], [2, 5], [2, 4]].some(cond => cond[0] === pl[0] && cond[1] === pl[1])) {
    if (points[1].x < points[12].x) {
      ch1 = 4;
    }
  }

  // Condition 12: [gh][z] - Force to Group 5
  if ([[3, 6], [3, 5], [3, 4]].some(cond => cond[0] === pl[0] && cond[1] === pl[1])) {
    if ((points[6].y > points[8].y && points[10].y < points[12].y && points[14].y < points[16].y && points[18].y < points[20].y) && 
        points[4].y > points[10].y) {
      ch1 = 5;
    }
  }

  // Condition 13: [gh][pq] - Force to Group 5
  if ([[3, 2], [3, 1], [3, 6]].some(cond => cond[0] === pl[0] && cond[1] === pl[1])) {
    if (points[4].y + 17 > points[8].y && points[4].y + 17 > points[12].y && points[4].y + 17 > points[16].y && points[4].y + 17 > points[20].y) {
      ch1 = 5;
    }
  }

  // Condition 14: [l][pqz] - Force to Group 5
  if ([[4, 4], [4, 5], [4, 2], [7, 5], [7, 6], [7, 0]].some(cond => cond[0] === pl[0] && cond[1] === pl[1])) {
    if (points[4].x > points[0].x) {
      ch1 = 5;
    }
  }

  // Condition 15: [pqz][aemnst] - Force to Group 5
  if ([[0, 2], [0, 6], [0, 1], [0, 5], [0, 0], [0, 7], [0, 4], [0, 3], [2, 7]].some(cond => cond[0] === pl[0] && cond[1] === pl[1])) {
    if (points[0].x < points[8].x && points[0].x < points[12].x && points[0].x < points[16].x && points[0].x < points[20].x) {
      ch1 = 5;
    }
  }

  // Condition 16: [pqz][yj] - Force to Group 7
  if ([[5, 7], [5, 2], [5, 6]].some(cond => cond[0] === pl[0] && cond[1] === pl[1])) {
    if (points[3].x < points[0].x) {
      ch1 = 7;
    }
  }

  // Condition 17: [l][yj] - Force to Group 7
  if ([[4, 6], [4, 2], [4, 4], [4, 1], [4, 5], [4, 7]].some(cond => cond[0] === pl[0] && cond[1] === pl[1])) {
    if (points[6].y < points[8].y) {
      ch1 = 7;
    }
  }

  // Condition 18: [x][yj] - Force to Group 7
  if ([[6, 7], [0, 7], [0, 1], [0, 0], [6, 4], [6, 6], [6, 5], [6, 1]].some(cond => cond[0] === pl[0] && cond[1] === pl[1])) {
    if (points[18].y > points[20].y) {
      ch1 = 7;
    }
  }

  // Condition 19: [x][aemnst] - Force to Group 6
  if ([[0, 4], [0, 2], [0, 3], [0, 1], [0, 6]].some(cond => cond[0] === pl[0] && cond[1] === pl[1])) {
    if (points[5].x > points[16].x) {
      ch1 = 6;
    }
  }

  // Condition 20: [yj][x] - Force to Group 6
  if ([[7, 2]].some(cond => cond[0] === pl[0] && cond[1] === pl[1])) {
    if (points[18].y < points[20].y && points[8].y < points[10].y) {
      ch1 = 6;
    }
  }

  // Condition 21: [c0][x] - Force to Group 6
  if ([[2, 1], [2, 2], [2, 6], [2, 7], [2, 0]].some(cond => cond[0] === pl[0] && cond[1] === pl[1])) {
    if (distance(points[8], points[16]) > 50) {
      ch1 = 6;
    }
  }

  // Condition 22: [l][x] - Force to Group 6
  if ([[4, 6], [4, 2], [4, 1], [4, 4]].some(cond => cond[0] === pl[0] && cond[1] === pl[1])) {
    if (distance(points[4], points[11]) < 60) {
      ch1 = 6;
    }
  }

  // Condition 23: [x][d] - Force to Group 6
  if ([[1, 4], [1, 6], [1, 0], [1, 2]].some(cond => cond[0] === pl[0] && cond[1] === pl[1])) {
    if (points[5].x - points[4].x - 15 > 0) {
      ch1 = 6;
    }
  }

  // Condition 24: [b][pqz] - Force to Group 1
  if ([[5, 0], [5, 1], [5, 4], [5, 5], [5, 6], [6, 1], [7, 6], [0, 2], [7, 1], [7, 4], [6, 6], [7, 2], [5, 0],
       [6, 3], [6, 4], [7, 5], [7, 2]].some(cond => cond[0] === pl[0] && cond[1] === pl[1])) {
    if (points[6].y > points[8].y && points[10].y > points[12].y && points[14].y > points[16].y && points[18].y > points[20].y) {
      ch1 = 1;
    }
  }

  // Condition 25: [f][pqz] - Force to Group 1
  if ([[6, 1], [6, 0], [0, 3], [6, 4], [2, 2], [0, 6], [6, 2], [7, 6], [4, 6], [4, 1], [4, 2], [0, 2], [7, 1],
       [7, 4], [6, 6], [7, 2], [7, 5], [7, 2]].some(cond => cond[0] === pl[0] && cond[1] === pl[1])) {
    if (points[6].y < points[8].y && points[10].y > points[12].y && points[14].y > points[16].y && points[18].y > points[20].y) {
      ch1 = 1;
    }
  }

  // Condition 26: Additional [f] condition - Force to Group 1
  if ([[6, 1], [6, 0], [4, 2], [4, 1], [4, 6], [4, 4]].some(cond => cond[0] === pl[0] && cond[1] === pl[1])) {
    if (points[10].y > points[12].y && points[14].y > points[16].y && points[18].y > points[20].y) {
      ch1 = 1;
    }
  }

  // Condition 27: [d][pqz] - Force to Group 1
  if ([[5, 0], [3, 4], [3, 0], [3, 1], [3, 5], [5, 5], [5, 4], [5, 1], [7, 6]].some(cond => cond[0] === pl[0] && cond[1] === pl[1])) {
    if ((points[6].y > points[8].y && points[10].y < points[12].y && points[14].y < points[16].y && points[18].y < points[20].y) && 
        (points[2].x < points[0].x) && points[4].y > points[14].y) {
      ch1 = 1;
    }
  }

  // Condition 28: [d] additional condition - Force to Group 1
  if ([[4, 1], [4, 2], [4, 4]].some(cond => cond[0] === pl[0] && cond[1] === pl[1])) {
    if (distance(points[4], points[11]) < 50 && 
        points[6].y > points[8].y && points[10].y < points[12].y && points[14].y < points[16].y && points[18].y < points[20].y) {
      ch1 = 1;
    }
  }

  // Condition 29: [d] third condition - Force to Group 1
  if ([[3, 4], [3, 0], [3, 1], [3, 5], [3, 6]].some(cond => cond[0] === pl[0] && cond[1] === pl[1])) {
    if ((points[6].y > points[8].y && points[10].y < points[12].y && points[14].y < points[16].y && points[18].y < points[20].y) && 
        (points[2].x < points[0].x) && points[14].y < points[4].y) {
      ch1 = 1;
    }
  }

  // Condition 30: [d] fourth condition - Force to Group 1
  if ([[6, 6], [6, 4], [6, 1], [6, 2]].some(cond => cond[0] === pl[0] && cond[1] === pl[1])) {
    if (points[5].x - points[4].x - 15 < 0) {
      ch1 = 1;
    }
  }

  // Condition 31: [i][pqz] - Force to Group 1
  if ([[5, 4], [5, 5], [5, 1], [0, 3], [0, 7], [5, 0], [0, 2], [6, 2], [7, 5], [7, 1], [7, 6], [7, 7]].some(cond => cond[0] === pl[0] && cond[1] === pl[1])) {
    if (points[6].y < points[8].y && points[10].y < points[12].y && points[14].y < points[16].y && points[18].y > points[20].y) {
      ch1 = 1;
    }
  }

  // Condition 32: [yj][bfdi] - Force to Group 7
  if ([[1, 5], [1, 7], [1, 1], [1, 6], [1, 3], [1, 0]].some(cond => cond[0] === pl[0] && cond[1] === pl[1])) {
    if ((points[4].x < points[5].x + 15) && 
        (points[6].y < points[8].y && points[10].y < points[12].y && points[14].y < points[16].y && points[18].y > points[20].y)) {
      ch1 = 7;
    }
  }

  // Condition 33: [uvr] - Force to Group 1
  if ([[5, 5], [5, 0], [5, 4], [5, 1], [4, 6], [4, 1], [7, 6], [3, 0], [3, 5]].some(cond => cond[0] === pl[0] && cond[1] === pl[1])) {
    if ((points[6].y > points[8].y && points[10].y > points[12].y && points[14].y < points[16].y && points[18].y < points[20].y) && 
        points[4].y > points[14].y) {
      ch1 = 1;
    }
  }

  // Condition 34: [w] first condition - Force to Group 1
  const fg = 13;
  if ([[3, 5], [3, 0], [3, 6], [5, 1], [4, 1], [2, 0], [5, 0], [5, 5]].some(cond => cond[0] === pl[0] && cond[1] === pl[1])) {
    if (!(points[0].x + fg < points[8].x && points[0].x + fg < points[12].x && points[0].x + fg < points[16].x && points[0].x + fg < points[20].x) && 
        !(points[0].x > points[8].x && points[0].x > points[12].x && points[0].x > points[16].x && points[0].x > points[20].x) && 
        distance(points[4], points[11]) < 50) {
      ch1 = 1;
    }
  }

  // Condition 35: [w] second condition - Force to Group 1
  if ([[5, 0], [5, 5], [0, 1]].some(cond => cond[0] === pl[0] && cond[1] === pl[1])) {
    if (points[6].y > points[8].y && points[10].y > points[12].y && points[14].y > points[16].y) {
      ch1 = 1;
    }
  }

  return ch1;
}

// Helper functions for desktop-compatible ASL detection

function getFingersExtended(points: Point[]): {
  thumb: boolean;
  index: boolean;
  middle: boolean;
  ring: boolean;
  pinky: boolean;
} {
  return {
    thumb: points[4].y < points[3].y - 10, // Thumb tip above thumb IP joint
    index: points[8].y < points[6].y - 15, // Index tip well above index PIP
    middle: points[12].y < points[10].y - 15, // Middle tip well above middle PIP
    ring: points[16].y < points[14].y - 15, // Ring tip well above ring PIP
    pinky: points[20].y < points[18].y - 12, // Pinky tip above pinky PIP (smaller threshold)
  };
}

function getThumbPosition(points: Point[]): 'front' | 'side' | 'up' | 'tucked' {
  const thumbTip = points[4];
  const thumbBase = points[2];
  const indexBase = points[5];
  const middleBase = points[9];
  const wrist = points[0];
  
  // Check if thumb is in front (S) - thumb x closer to viewer than finger bases
  if (thumbTip.x > indexBase.x && thumbTip.x > middleBase.x) {
    return 'front';
  }
  // Check if thumb is on side (A) - thumb x aligned with or behind finger bases
  else if (thumbTip.x <= indexBase.x && thumbTip.y > wrist.y + 50) {
    return 'side';
  }
  // Check if thumb is up
  else if (thumbTip.y < thumbBase.y - 20) {
    return 'up';
  }
  else {
    return 'tucked';
  }
}

function thumbIndexRightAngle(points: Point[]): boolean {
  const thumbTip = points[4];
  const thumbBase = points[2];
  const indexTip = points[8];
  const indexBase = points[5];
  
  // Calculate vectors
  const thumbVector = { x: thumbTip.x - thumbBase.x, y: thumbTip.y - thumbBase.y };
  const indexVector = { x: indexTip.x - indexBase.x, y: indexTip.y - indexBase.y };
  
  // Calculate dot product and magnitudes for angle
  const dotProduct = thumbVector.x * indexVector.x + thumbVector.y * indexVector.y;
  const thumbMag = Math.sqrt(thumbVector.x * thumbVector.x + thumbVector.y * thumbVector.y);
  const indexMag = Math.sqrt(indexVector.x * indexVector.x + indexVector.y * indexVector.y);
  
  const angle = Math.acos(dotProduct / (thumbMag * indexMag));
  return Math.abs(angle - Math.PI/2) < 0.5; // Close to 90 degrees
}

function detectSpecialGestures(points: Point[], currentLetter: string): string | null {
  // FIXED: Use desktop's exact special gesture conditions with letter-specific checks
  
  // Space gesture (desktop line 1714-1716): Only applies to specific letters
  // Desktop condition: if ch1 == 1 or ch1 =='E' or ch1 =='S' or ch1 =='X' or ch1 =='Y' or ch1 =='B'
  const spaceEligibleLetters = ['B', 'D', 'F', 'I', 'K', 'R', 'U', 'V', 'W', 'E', 'S', 'X', 'Y'];
  if (spaceEligibleLetters.includes(currentLetter)) {
    // Desktop finger pattern: pts[6][1] > pts[8][1] and pts[10][1] < pts[12][1] and pts[14][1] < pts[16][1] and pts[18][1] > pts[20][1]
    const fingerPattern = points[6].y > points[8].y && points[10].y < points[12].y && points[14].y < points[16].y && points[18].y > points[20].y;
    console.log(`[Rules] Checking space gesture for ${currentLetter}: finger pattern = ${fingerPattern}`);
    console.log(`[Rules] Finger positions: Index(${points[6].y}>${points[8].y}), Middle(${points[10].y}<${points[12].y}), Ring(${points[14].y}<${points[16].y}), Pinky(${points[18].y}>${points[20].y})`);
    
    if (fingerPattern) {
      console.log(`[Rules] Space gesture detected from letter ${currentLetter}`);
      return 'space';
    }
  } else {
    console.log(`[Rules] Letter ${currentLetter} not eligible for space gesture`);
  }
  
  // Next gesture (desktop line 1721-1723): Only applies to specific letters
  // Desktop condition: if ch1 == 'E' or ch1=='Y' or ch1=='B'
  const nextEligibleLetters = ['E', 'Y', 'B'];
  if (nextEligibleLetters.includes(currentLetter)) {
    // Desktop conditions: thumb left of index MCP + all fingers extended
    if (points[4].x < points[5].x && 
        points[6].y > points[8].y && points[10].y > points[12].y && points[14].y > points[16].y && points[18].y > points[20].y) {
      console.log(`[Rules] Next gesture detected from letter ${currentLetter}`);
      return 'next';
    }
  }
  
  // Backspace gesture (desktop line 1726-1728): Applies to multiple letters
  // Desktop condition: if ch1 == 'Next' or 'B' or 'C' or 'H' or 'F' or 'X'
  const backspaceEligibleLetters = ['B', 'C', 'H', 'F', 'X', 'next'];
  if (backspaceEligibleLetters.includes(currentLetter)) {
    // Desktop conditions: Complex wrist and thumb conditions
    if ((points[0].x > points[8].x && points[0].x > points[12].x && points[0].x > points[16].x && points[0].x > points[20].x) &&
        (points[4].y < points[8].y && points[4].y < points[12].y && points[4].y < points[16].y && points[4].y < points[20].y) &&
        (points[4].y < points[6].y && points[4].y < points[10].y && points[4].y < points[14].y && points[4].y < points[18].y)) {
      console.log(`[Rules] Backspace gesture detected from letter ${currentLetter}`);
      return 'del';
    }
  }
  
  return null;
}

function calculateDebugMeasurements(points: Point[]): any {
  const thumbPosition = getThumbPosition(points);
  
  return {
    uniformity: calculateUniformity(points),
    horizontalRatio: calculateHorizontalRatio(points),
    thumbToPalm: dist(points[0], points[4]),
    fingerCurls: [
      points[8].y - points[6].y, // Index curl
      points[12].y - points[10].y, // Middle curl
      points[16].y - points[14].y, // Ring curl
      points[20].y - points[18].y, // Pinky curl
    ],
    thumbToIndexBase: dist(points[4], points[5]),
    thumbPosition,
    fingerDistances: [
      dist(points[8], points[12]), // Index to middle
      dist(points[12], points[16]), // Middle to ring
      dist(points[16], points[20]), // Ring to pinky
    ]
  };
}

// Utility helper functions
function argmax(arr: number[]): number {
  let maxIdx = 0;
  let maxVal = arr[0];
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] > maxVal) {
      maxVal = arr[i];
      maxIdx = i;
    }
  }
  return maxIdx;
}

function dist(p1: Point, p2: Point): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function calculateUniformity(points: Point[]): number {
  const center = centroid(points);
  const distances = points.map(p => dist(p, center));
  const avgDist = avg(distances);
  const variance = avg(distances.map(d => Math.pow(d - avgDist, 2)));
  return Math.max(0, 1 - (variance / (avgDist * avgDist)));
}

function calculateHorizontalRatio(points: Point[]): number {
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const xRange = Math.max(...xs) - Math.min(...xs);
  const yRange = Math.max(...ys) - Math.min(...ys);
  return yRange === 0 ? 0 : xRange / yRange;
}

function centroid(points: Point[]): Point {
  const x = avg(points.map(p => p.x));
  const y = avg(points.map(p => p.y));
  return { x, y };
}

function avg(arr: number[]): number {
  return arr.length === 0 ? 0 : arr.reduce((sum, val) => sum + val, 0) / arr.length;
}

export function getDebugText(debugInfo: DebugInfo): string {
  if (!debugInfo) return '';
  
  const { measurements, thresholds } = debugInfo;
  const lines = [];
  
  if (measurements.uniformity !== undefined) {
    lines.push(`Uniformity: ${measurements.uniformity.toFixed(3)} (thresh: ${thresholds.uniformityThreshold})`);
  }
  if (measurements.horizontalRatio !== undefined) {
    lines.push(`H-Ratio: ${measurements.horizontalRatio.toFixed(3)} (thresh: ${thresholds.horizontalThreshold})`);
  }
  if (measurements.thumbToPalm !== undefined) {
    lines.push(`Thumb-Palm: ${measurements.thumbToPalm.toFixed(1)}px (thresh: ${thresholds.thumbThreshold})`);
  }
  if (measurements.fingerCurls) {
    const curls = measurements.fingerCurls.map(c => c.toFixed(1)).join(', ');
    lines.push(`Curls: [${curls}] (thresh: ${thresholds.curlThreshold})`);
  }
  if (measurements.thumbPosition) {
    lines.push(`Thumb Position: ${measurements.thumbPosition}`);
  }
  if (measurements.fingerDistances) {
    const distances = measurements.fingerDistances.map(d => d.toFixed(1)).join(', ');
    lines.push(`Finger Spacing: [${distances}]px (thresh: ${thresholds.fingerSpacingThreshold})`);
  }
  
  return lines.join('\n');
}