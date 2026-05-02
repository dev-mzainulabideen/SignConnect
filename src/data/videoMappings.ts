/**
 * Video Mappings for Sign-to-Sign Feature
 * 
 * This file contains all video mappings for ASL ↔ PSL translation:
 * - ASL input videos (from src/components/ASL-Words/)
 * - PSL input videos (from src/components/PSL-Words/)
 * - PSL output videos (from src/assets/flags/model/PSl FLAG/)
 * - ASL output videos (from src/assets/flags/model/ASL FLAG/)
 */

// Type definitions
export type AslWordVideo = {
  id: string; // simple key, e.g. "baby"
  fileName: string; // e.g. "ASLbaby.mp4"
  source: any;
};

export type PslWordVideo = {
  key: string; // e.g. "baby"
  fileName: string; // e.g. "PSLBaby.mp4"
  source: any; // video asset
};

export type VideoMapping = {
  fileName: string;
  source: any;
};

// ASL input videos (gallery source) – stored in src/components/ASL-Words
// Only words that have both ASL and PSL versions available
export const ASL_WORD_VIDEOS: AslWordVideo[] = [
  { id: 'baby', fileName: 'ASLbaby.mp4', source: require('../components/ASL-Words/ASLbaby.mp4') },
  { id: 'buy', fileName: 'ASLbuy.mp4', source: require('../components/ASL-Words/ASLbuy.mp4') },
  { id: 'cat', fileName: 'ASLcat.mp4', source: require('../components/ASL-Words/ASLcat.mp4') },
  { id: 'day', fileName: 'ASLday.mp4', source: require('../components/ASL-Words/ASLday.mp4') },
  { id: 'dead', fileName: 'ASLdead.mp4', source: require('../components/ASL-Words/ASLdead.mp4') },
  { id: 'deaf', fileName: 'ASLdeaf.mp4', source: require('../components/ASL-Words/ASLdeaf.mp4') },
  { id: 'doctor', fileName: 'ASLdoctor.mp4', source: require('../components/ASL-Words/ASLdoctor.mp4') },
];

// PSL input videos (gallery source) – stored in src/components/PSL-Words
export const PSL_INPUT_WORD_VIDEOS: PslWordVideo[] = [
  { key: 'baby', fileName: 'PSLBaby.mp4', source: require('../components/PSL-Words/PSLBaby.mp4') },
  { key: 'buy', fileName: 'PSLBuy.mp4', source: require('../components/PSL-Words/PSLBuy.mp4') },
  { key: 'cat', fileName: 'PSLCat.mp4', source: require('../components/PSL-Words/PSLCat.mp4') },
  { key: 'day', fileName: 'PSLDay.mp4', source: require('../components/PSL-Words/PSLDay.mp4') },
  { key: 'dead', fileName: 'PSLDead.mp4', source: require('../components/PSL-Words/PSLDead.mp4') },
  { key: 'doctor', fileName: 'PSLDoctor.mp4', source: require('../components/PSL-Words/PSLDoctor.mp4') },
  // This file name encodes the phrase; we still map it logically to the "deaf" key
  { key: 'deaf', fileName: 'PSL_Are you deaf.mp4', source: require('../components/PSL-Words/PSL_Are you deaf.mp4') },
];

// PSL output videos used when ASL is the input (stored under assets/flags/model/PSl FLAG)
// Mapping: ASL key → PSL output video
export const PSL_OUTPUT_BY_KEY: Record<string, VideoMapping> = {
  baby: { fileName: 'PSLBaby.mp4', source: require('../assets/flags/model/PSl FLAG/PSLBaby.mp4') },
  buy: { fileName: 'PSLBuy.mp4', source: require('../assets/flags/model/PSl FLAG/PSLBuy.mp4') },
  cat: { fileName: 'PSLCat.mp4', source: require('../assets/flags/model/PSl FLAG/PSLCat.mp4') },
  day: { fileName: 'PSLDay.mp4', source: require('../assets/flags/model/PSl FLAG/PSLDay.mp4') },
  dead: { fileName: 'PSLDead.mp4', source: require('../assets/flags/model/PSl FLAG/PSLDead.mp4') },
  doctor: { fileName: 'PSLDoctor.mp4', source: require('../assets/flags/model/PSl FLAG/PSLDoctor.mp4') },
  deaf: {
    fileName: 'PSL_Are you deaf.mp4',
    source: require('../assets/flags/model/PSl FLAG/PSL_Are you deaf.mp4'),
  },
};

// ASL output videos used when PSL is the input (stored under assets/flags/model/ASL FLAG)
// Mapping: PSL key → ASL output video
// Only words that have both ASL and PSL versions available
export const ASL_OUTPUT_BY_KEY: Record<string, VideoMapping> = {
  baby: { fileName: 'baby.mp4', source: require('../assets/flags/model/ASL FLAG/baby.mp4') },
  buy: { fileName: 'buy.mp4', source: require('../assets/flags/model/ASL FLAG/buy.mp4') },
  cat: { fileName: 'cat.mp4', source: require('../assets/flags/model/ASL FLAG/cat.mp4') },
  day: { fileName: 'day.mp4', source: require('../assets/flags/model/ASL FLAG/day.mp4') },
  dead: { fileName: 'dead.mp4', source: require('../assets/flags/model/ASL FLAG/dead.mp4') },
  deaf: { fileName: 'deaf.mp4', source: require('../assets/flags/model/ASL FLAG/deaf.mp4') },
  doctor: { fileName: 'doctor.mp4', source: require('../assets/flags/model/ASL FLAG/doctor.mp4') },
};

/**
 * Helper function to get input video based on mode and key
 */
export const getInputVideo = (
  mode: 'ASL' | 'PSL',
  key: string
): AslWordVideo | PslWordVideo | null => {
  if (mode === 'ASL') {
    return ASL_WORD_VIDEOS.find(v => v.id === key) || null;
  } else {
    return PSL_INPUT_WORD_VIDEOS.find(v => v.key === key) || null;
  }
};

/**
 * Helper function to get output video based on mode and key
 */
export const getOutputVideo = (
  mode: 'ASL' | 'PSL',
  key: string
): VideoMapping | null => {
  if (mode === 'ASL') {
    // ASL input → PSL output
    return PSL_OUTPUT_BY_KEY[key] || null;
  } else {
    // PSL input → ASL output
    return ASL_OUTPUT_BY_KEY[key] || null;
  }
};

