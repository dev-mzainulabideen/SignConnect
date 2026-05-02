import { NativeModules } from 'react-native';
// import RNFS from 'react-native-fs';

type Point = { x: number; y: number };
// Load label map (index -> label). Ensure label_map.json is an array like ["A","B",...]
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unused-vars
const LABELS_JSON: string[] = require('../../assets/models/label_map.json');


const SignClassifier = (NativeModules as any).SignClassifier as {
  init: (modelAsset?: string) => Promise<boolean>;
  inferImage: (flatInput: number[]) => Promise<number[]>;
  inferImageChunked: (chunk1: number[], chunk2: number[], chunk3: number[]) => Promise<number[]>;
};

let initialized = false;

export async function ensureInit(modelAsset: string = 'models/sign_model.tflite') {
  if (initialized) {
    console.log('[TFLite] Already initialized, skipping');
    return true;
  }
  
  console.log('[TFLite] Checking SignClassifier native module...');
  if (!SignClassifier) {
    console.error('[TFLite] SignClassifier native module is null/undefined');
    throw new Error('SignClassifier native module not found');
  }
  
  if (!SignClassifier.init) {
    console.error('[TFLite] SignClassifier.init method not found');
    throw new Error('SignClassifier.init method not available');
  }
  
  console.log('[TFLite] Initializing model:', modelAsset);
  try {
    try {
      await SignClassifier.init(modelAsset);
      initialized = true;
      console.log('[TFLite] Model initialized successfully:', modelAsset);
    } catch (e1) {
      console.warn('[TFLite] Init failed with', modelAsset, '— retrying with fallback path');
      const alt = modelAsset.replace(/^models\//, ''); // try without folder prefix
      await SignClassifier.init(alt);
      initialized = true;
      console.log('[TFLite] Model initialized successfully with fallback:', alt);
    }
    // Removed dummy input model test for production stability
    
    return true;
  } catch (error) {
    console.error('[TFLite] Model initialization failed:', error);
    throw error;
  }
}

// Dummy test removed

// Render a 400x400 grayscale canvas from normalized points and return NHWC float32 array [1,400,400,3]
export function rasterizeSkeleton(points: Point[], size = 400): Float32Array {
  console.log(`[Raster] Starting rasterization with ${points?.length || 0} points, size=${size}`);
  
  const width = size;
  const height = size;
  const rgbChannels = 3;
  // White background (1.0) to match training white canvas
  const arr = new Float32Array(width * height * rgbChannels);
  for (let i = 0; i < arr.length; i++) arr[i] = 1.0;
  
  if (!points || points.length === 0) {
    console.log('[Raster] No points provided, returning white canvas');
    return arr;
  }
  
  console.log('[Raster] Points sample:', points.slice(0, 3));

  // Training parity from desktop app (final_pred.py):
  // lines thickness=3, joint dots radius=2, pure green on white
  const ink = { r: 0.0, g: 1.0, b: 0.0 }; // pure green
  const lineWidthPx = 3;
  const jointDotRadius = 2;

  const linePairs: Array<[number, number]> = [
    [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
    [0, 5], [5, 6], [6, 7], [7, 8], // Index
    [0, 9], [9, 10], [10, 11], [11, 12], // Middle
    [0, 13], [13, 14], [14, 15], [15, 16], // Ring
    [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
    // Palm connections (matching desktop version)
    [5, 9], [9, 13], [13, 17], // Palm base connections
  ];

  const drawPixelRGB = (x: number, y: number, r: number, g: number, b: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const base = (y * width + x) * rgbChannels;
    arr[base + 0] = r;
    arr[base + 1] = g;
    arr[base + 2] = b;
  };

  const drawCircleRGB = (cx: number, cy: number, r: number, cr: number, cg: number, cb: number) => {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy <= r * r) drawPixelRGB(cx + dx, cy + dy, cr, cg, cb);
      }
    }
  };

  // Solid thick line by stamping small filled circles each pixel step (Bresenham)
  const drawThickLine = (x0: number, y0: number, x1: number, y1: number) => {
    let dx = Math.abs(x1 - x0);
    let sx = x0 < x1 ? 1 : -1;
    let dy = -Math.abs(y1 - y0);
    let sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    const r = Math.max(1, Math.floor(lineWidthPx / 2));
    while (true) {
      drawCircleRGB(x0, y0, r, ink.r, ink.g, ink.b);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  };

  // ALIGNED: Use exact same bbox calculation as toRender400() for desktop compatibility
  // Desktop: os = ((400 - w)//2) - 15, os1 = ((400 - h)//2) - 15
  console.log('[Raster] Calculating bounding box (aligned with toRender400)...');
  let minX = 1, minY = 1, maxX = 0, maxY = 0;
  
  try {
    for (const p of points) {
      if (!p || typeof p.x !== 'number' || typeof p.y !== 'number') {
        console.warn('[Raster] Invalid point:', p);
        continue;
      }
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    
    // CRITICAL: Use identical calculation as toRender400() for perfect alignment
    const wPx = Math.max(1, Math.round((maxX - minX) * width));
    const hPx = Math.max(1, Math.round((maxY - minY) * height));
    const os = Math.round((width - wPx) / 2) - 15;
    const os1 = Math.round((height - hPx) / 2) - 15;
    
    console.log(`[Raster] Bbox: min(${minX.toFixed(3)}, ${minY.toFixed(3)}) max(${maxX.toFixed(3)}, ${maxY.toFixed(3)})`);
    console.log(`[Raster] Size: ${wPx}x${hPx}, offsets: (${os}, ${os1}) - MUST match toRender400`);
    
    // CRITICAL: Use identical coordinate transformation as toRender400()
    // Desktop equivalent: normalize to hand bbox, scale to pixels, add offsets
    const toPx = (p: Point) => ({
      x: Math.max(0, Math.min(width - 1, Math.round((p.x - minX) / (maxX - minX) * wPx + os))),
      y: Math.max(0, Math.min(height - 1, Math.round((p.y - minY) / (maxY - minY) * hPx + os1))),
    });

    console.log('[Raster] Drawing lines and dots...');
    for (const [a, b] of linePairs) {
      if (points[a] && points[b]) {
        const p0 = toPx(points[a]);
        const p1 = toPx(points[b]);
        drawThickLine(p0.x, p0.y, p1.x, p1.y);
      }
    }
    
    for (const p of points) {
      const px = toPx(p);
      drawCircleRGB(px.x, px.y, jointDotRadius, ink.r, ink.g, ink.b);
    }
    
    console.log('[Raster] Rasterization completed successfully');
    return arr;
    
  } catch (error) {
    console.error('[Raster] Error during rasterization:', error);
    // Return white canvas on error
    return arr;
  }
}

// Save raster is disabled on RN to avoid Node-specific APIs (Buffer, TextEncoder)
async function saveRasterPPM(_path: string, _width: number, _height: number, _floatRgb01: Float32Array): Promise<void> {
  // No-op in React Native; keep function to satisfy callers
  return;
}

function mirrorPointsX(src: Point[]): Point[] {
  return src.map(p => ({ x: 1 - p.x, y: p.y }));
}

export async function classifyFromPoints(points: Point[], size = 400, opts?: { debugOncePath?: string; tryMirror?: boolean }): Promise<{ probs: number[]; topIndex: number; topLabel: string } | null> {
  console.log(`[TFLite] Starting classification with ${points?.length || 0} points`);
  if (!points || points.length === 0) {
    console.log('[TFLite] No points provided, returning null');
    return null;
  }
  
  console.log('[TFLite] Ensuring model initialization...');
  try {
    await ensureInit();
    console.log('[TFLite] Model initialization completed');
  } catch (error) {
    console.error('[TFLite] Model initialization failed:', error);
    return null;
  }
  
  console.log('[TFLite] Rasterizing skeleton...');
  
  let arr: Float32Array;
  try {
    arr = rasterizeSkeleton(points, size);
  } catch (error) {
    console.error('[TFLite] Rasterization failed, using white canvas:', error);
    // Fallback to white canvas for testing
    arr = new Float32Array(size * size * 3);
    for (let i = 0; i < arr.length; i++) arr[i] = 1.0;
  }
  // Prepare two variants: 0-255 (desktop uint8) and 0-1 (normalized floats)
  const scaled255 = Array.from(arr, (v) => v * 255);
  const scaled01 = Array.from(arr);
  
  // Ensure we have flat arrays of numbers (not nested arrays)
  const flat255 = Array.isArray(scaled255) ? (scaled255 as number[]).flat(Infinity) : (scaled255 as number[]);
  const flat01 = Array.isArray(scaled01) ? (scaled01 as number[]).flat(Infinity) : (scaled01 as number[]);
  
  // Debug: Log input value ranges to verify normalization
  const min255 = Math.min(...flat255);
  const max255 = Math.max(...flat255);
  const min01 = Math.min(...flat01);
  const max01 = Math.max(...flat01);
  console.log(`[TFLite] Input size: ${flat255.length}, expected: ${size * size * 3}`);
  console.log(`[TFLite] Range(255): min=${min255.toFixed(3)}, max=${max255.toFixed(3)} | Range(01): min=${min01.toFixed(3)}, max=${max01.toFixed(3)}`);
  
  // Convert to proper JavaScript array format for React Native bridge
  const js255 = Array.from(flat255);
  const js01 = Array.from(flat01);
  
  // Ensure we have exactly the right number of elements
  if (js255.length !== size * size * 3 || js01.length !== size * size * 3) {
    console.error(`[TFLite] Array length mismatch: got len255=${js255.length} len01=${js01.length} vs ${size * size * 3}`);
    return null;
  }
  
  // Ensure all values are finite numbers and convert to proper format
  const clean255: number[] = new Array(js255.length);
  for (let i = 0; i < js255.length; i++) clean255[i] = Number.isFinite(js255[i]) ? Number(js255[i]) : 0.0;
  const clean01: number[] = new Array(js01.length);
  for (let i = 0; i < js01.length; i++) clean01[i] = Number.isFinite(js01[i]) ? Number(js01[i]) : 0.0;
  
  // Helper to run chunked inference for a flat array
  const runChunked = async (flat: number[]): Promise<number[]> => {
    const chunkSize = Math.floor(flat.length / 3);
    const chunk1 = flat.slice(0, chunkSize);
    const chunk2 = flat.slice(chunkSize, chunkSize * 2);
    const chunk3 = flat.slice(chunkSize * 2);
    console.log(`[TFLite] Using chunked approach: ${chunk1.length}, ${chunk2.length}, ${chunk3.length}`);
    console.log('[TFLite] Calling native inference...');
    const result = await SignClassifier.inferImageChunked(chunk1, chunk2, chunk3);
    console.log(`[TFLite] Native inference completed, result length: ${result?.length || 0}`);
    return result;
  };

  console.log('[TFLite] Starting inference with 0-255 input...');
  // Optionally also try mirrored X to handle handedness/camera mirror
  let raw = await runChunked(clean255);
  let maxA = Math.max(...raw);
  if (opts?.tryMirror) {
    const arrMir = rasterizeSkeleton(mirrorPointsX(points), size);
    const cleanMir255 = Array.from(arrMir, (v) => v * 255);
    const rawMir = await runChunked(cleanMir255);
    const maxB = Math.max(...rawMir);
    if (maxB > maxA) {
      raw = rawMir;
      maxA = maxB;
      console.log('[TFLite] Mirrored input chosen');
      // save mirrored raster if debugging
      if (opts?.debugOncePath) {
        const ppmPath = `${opts.debugOncePath.replace(/\.ppm$/, '')}_mir.ppm`;
        await saveRasterPPM(ppmPath, size, size, arrMir);
      }
    }
  }
  
  console.log(`[TFLite] Using RGB channel order`);
  // Heuristic: if values look like logits (unbounded), apply softmax; if already 0..1 and sum≈1, keep
  const sum = raw.reduce((s, v) => s + v, 0);
  const maxv = Math.max(...raw);
  const minv = Math.min(...raw);
  const looksProb = sum > 0.98 && sum < 1.02 && raw.every(v => v >= -1e-6 && v <= 1 + 1e-6);
  const probs = looksProb ? raw : softmax(raw);

  try { 
    console.log(`[TFLite] out size=${probs.length} min=${minv.toFixed(3)} max=${maxv.toFixed(3)} top=${Math.max(...probs).toFixed(3)}`); 
  } catch {}
  if (!probs || probs.length === 0) return null;

  // If confidence is very low, try normalized 0..1 variant and choose better
  let finalProbs = probs;
  let finalTop = Math.max(...probs);
  if (finalTop < 0.2) {
    console.log('[TFLite] Low confidence on 0-255 path; trying 0-1 path...');
    let raw01 = await runChunked(clean01);
    if (opts?.tryMirror) {
      const arrMir = rasterizeSkeleton(mirrorPointsX(points), size);
      const cleanMir01 = Array.from(arrMir);
      const rawMir01 = await runChunked(cleanMir01);
      if (Math.max(...rawMir01) > Math.max(...raw01)) raw01 = rawMir01;
    }
    const sum01 = raw01.reduce((s, v) => s + v, 0);
    const looksProb01 = sum01 > 0.98 && sum01 < 1.02 && raw01.every(v => v >= -1e-6 && v <= 1 + 1e-6);
    const probs01 = looksProb01 ? raw01 : softmax(raw01);
    const top01 = Math.max(...probs01);
    console.log(`[TFLite] Compare top: 255=${finalTop.toFixed(3)} vs 01=${top01.toFixed(3)} -> ${top01 > finalTop ? 'using 0-1' : 'keeping 0-255'}`);
    if (top01 > finalTop) {
      finalProbs = probs01;
      finalTop = top01;
    }
  }

  // Save one PPM raster for offline inspection
  if (opts?.debugOncePath) {
    try {
      await saveRasterPPM(opts.debugOncePath, size, size, arr);
      const min = Math.min(...arr);
      const max = Math.max(...arr);
      console.log(`[Raster] Saved debug PPM: ${opts.debugOncePath} (min=${min.toFixed(3)} max=${max.toFixed(3)})`);
    } catch {}
  }
  let topIndex = 0;
  for (let i = 1; i < finalProbs.length; i++) if (finalProbs[i] > finalProbs[topIndex]) topIndex = i;
  // Determine labels based on output size (prefer JSON if sizes match)
  const labels =
    (Array.isArray(LABELS_JSON) && LABELS_JSON.length === finalProbs.length)
      ? LABELS_JSON
      : (finalProbs.length === 8 ? GROUP_LABELS : DEFAULT_LABELS);
  const topLabel = labels[topIndex] ?? String(topIndex);
  const topProb = finalProbs[topIndex];
  console.log(`[TFLite] Output size: ${finalProbs.length}, using labels: ${finalProbs.length === 8 ? '8-group' : '29-class'}, top: ${topLabel} (${topProb.toFixed(3)})`);
  console.log(`[TFLite] Classification completed successfully`);
  return { probs: finalProbs, topIndex, topLabel };
}

const DEFAULT_LABELS = [
  'A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z','space','del','nothing'
];

const GROUP_LABELS = [
  'Group_0','Group_1','Group_2','Group_3','Group_4','Group_5','Group_6','Group_7'
];

function softmax(logits: number[]): number[] {
  const m = Math.max(...logits);
  const exps = logits.map(v => Math.exp(v - m));
  const s = exps.reduce((a, b) => a + b, 0) || 1;
  return exps.map(v => v / s);
}


