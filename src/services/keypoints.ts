// Simple ASL/PSL text -> local MP4 mapper (centralized)
// Keys are normalized (lowercase, collapsed spaces)

type VideoEntry = { key: string; src: any };

// Normalization: lowercase, trim, collapse spaces, strip punctuation
export function normalizeText(input: string): string {
	return (input || '')
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, '')
		.replace(/\s+/g, ' ')
		.trim();
}

// NOTE: Metro bundler requires static require() calls. List each file explicitly.
// Keep ASL and PSL completely separate so only the selected language triggers.

// ASL videos → src/assets/flags/model/ASL FLAG/
const entriesASL: VideoEntry[] = [
	{ key: 'baby', src: require('../assets/flags/model/ASL FLAG/baby.mp4') },
	{ key: 'about', src: require('../assets/flags/model/ASL FLAG/about.mp4') },
	{ key: 'accept', src: require('../assets/flags/model/ASL FLAG/accept.mp4') },
	{ key: 'accident', src: require('../assets/flags/model/ASL FLAG/accident.mp4') },
	{ key: 'buy', src: require('../assets/flags/model/ASL FLAG/buy.mp4') },
	{ key: 'cat', src: require('../assets/flags/model/ASL FLAG/cat.mp4') },
	{ key: 'day', src: require('../assets/flags/model/ASL FLAG/day.mp4') },
	{ key: 'dead', src: require('../assets/flags/model/ASL FLAG/dead.mp4') },
	{ key: 'deaf', src: require('../assets/flags/model/ASL FLAG/deaf.mp4') },
	{ key: 'doctor', src: require('../assets/flags/model/ASL FLAG/doctor.mp4') },
	{ key: 'dog', src: require('../assets/flags/model/ASL FLAG/dog.mp4') },
	{ key: 'fault', src: require('../assets/flags/model/ASL FLAG/fault.mp4') },
	{ key: 'find', src: require('../assets/flags/model/ASL FLAG/find.mp4') },
	{ key: 'hello', src: require('../assets/flags/model/ASL FLAG/hello.mp4') },
	{ key: 'morning', src: require('../assets/flags/model/ASL FLAG/morning.mp4') },
	{ key: 'night', src: require('../assets/flags/model/ASL FLAG/night.mp4') },
	{ key: 'sad', src: require('../assets/flags/model/ASL FLAG/sad.mp4') },
	{ key: 'sign', src: require('../assets/flags/model/ASL FLAG/sign.mp4') },
	{ key: 'talk', src: require('../assets/flags/model/ASL FLAG/talk.mp4') },
	{ key: 'thank you', src: require('../assets/flags/model/ASL FLAG/thankyou.mp4') },
	{ key: 'thanks', src: require('../assets/flags/model/ASL FLAG/thankyou.mp4') },
	{ key: 'thankyou', src: require('../assets/flags/model/ASL FLAG/thankyou.mp4') },
	{ key: 'welcome', src: require('../assets/flags/model/ASL FLAG/thankyou.mp4') },
	{ key: 'where', src: require('../assets/flags/model/ASL FLAG/where.mp4') },
	{ key: 'you', src: require('../assets/flags/model/ASL FLAG/you.mp4') },
];

// PSL videos → src/assets/flags/model/PSl FLAG/
const entriesPSL: VideoEntry[] = [
	{ key: 'deaf', src: require('../assets/flags/model/PSl FLAG/PSL_Are you deaf.mp4') },
	{ key: 'are you deaf', src: require('../assets/flags/model/PSl FLAG/PSL_Are you deaf.mp4') },
	{ key: 'baby', src: require('../assets/flags/model/PSl FLAG/PSLBaby.mp4') },
	{ key: 'buy', src: require('../assets/flags/model/PSl FLAG/PSLBuy.mp4') },
	{ key: 'cat', src: require('../assets/flags/model/PSl FLAG/PSLCat.mp4') },
	{ key: 'day', src: require('../assets/flags/model/PSl FLAG/PSLDay.mp4') },
	{ key: 'dead', src: require('../assets/flags/model/PSl FLAG/PSLDead.mp4') },
	{ key: 'doctor', src: require('../assets/flags/model/PSl FLAG/PSLDoctor.mp4') },
];

const keyToVideoASL: Record<string, any> = Object.fromEntries(entriesASL.map(e => [e.key, e.src]));
const keyToVideoPSL: Record<string, any> = Object.fromEntries(entriesPSL.map(e => [e.key, e.src]));

export function findAslVideoForText(text: string): any | null {
	const key = normalizeText(text);
	if (!key) return null;
	if (keyToVideoASL[key]) return keyToVideoASL[key];
	let best: any | null = null;
	let bestLen = 0;
	for (const k of Object.keys(keyToVideoASL)) {
		if (key.includes(k) && k.length > bestLen) {
			best = keyToVideoASL[k];
			bestLen = k.length;
		}
	}
	return best;
}

export function findPslVideoForText(text: string): any | null {
	const key = normalizeText(text);
	if (!key) return null;
	if (keyToVideoPSL[key]) return keyToVideoPSL[key];
	let best: any | null = null;
	let bestLen = 0;
	for (const k of Object.keys(keyToVideoPSL)) {
		if (key.includes(k) && k.length > bestLen) {
			best = keyToVideoPSL[k];
			bestLen = k.length;
		}
	}
	return best;
}

export function getRandomPlaceholder(): any | null {
	return null;
}

// Resolve a sentence by scanning words first, then fallback to greedy substring
export function resolveVideoForSentence(
	language: 'ASL' | 'PSL',
	sentence: string,
): { src: any | null; matchedKey: string | null } {
	const key = normalizeText(sentence);
	if (!key) return { src: null, matchedKey: null };
	const dict = language === 'ASL' ? keyToVideoASL : keyToVideoPSL;
	const words = key.split(' ').filter(Boolean);
	for (const w of words) {
		if (dict[w]) return { src: dict[w], matchedKey: w };
	}
	let best: any | null = null;
	let bestKey: string | null = null;
	let bestLen = 0;
	for (const k of Object.keys(dict)) {
		if (key.includes(k) && k.length > bestLen) {
			best = dict[k];
			bestKey = k;
			bestLen = k.length;
		}
	}
	if (best) return { src: best, matchedKey: bestKey };
	return { src: null, matchedKey: null };
}


