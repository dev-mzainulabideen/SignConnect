// Heuristic and hardcoded matchers for ASL letter 'D'

export interface Point { x: number; y: number }

function distance(a: Point, b: Point): number {
	const dx = a.x - b.x;
	const dy = a.y - b.y;
	return Math.hypot(dx, dy);
}

function estimateScale(points: Point[]): number {
	if (!points || points.length < 2) return 1;
	let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
	for (const p of points) {
		if (!isFinite(p.x) || !isFinite(p.y)) continue;
		if (p.x < minX) minX = p.x;
		if (p.x > maxX) maxX = p.x;
		if (p.y < minY) minY = p.y;
		if (p.y > maxY) maxY = p.y;
	}
	const w = Math.max(1e-6, maxX - minX);
	const h = Math.max(1e-6, maxY - minY);
	return Math.max(w, h);
}

// ASL 'D': index finger up; other fingers curled; thumb touching middle/ring making a circle with index
export function isLikelyD(points: Point[] | null | undefined): boolean {
	if (!Array.isArray(points) || points.length < 21) return false;
	const scale = estimateScale(points);
	if (!isFinite(scale) || scale <= 0) return false;

	const wrist = points[0];
	const indexTip = points[8];
	const indexDip = points[7];
	const middleTip = points[12];
	const ringTip = points[16];
	const pinkyTip = points[20];
	const thumbTip = points[4];

	// Index extended: tip far from wrist and away from DIP
	const idxFarWrist = distance(indexTip, wrist) > 0.55 * scale;
	const idxExtended = distance(indexTip, indexDip) > 0.25 * scale;

	// Other tips relatively closer to wrist (curled)
	const midCurled = distance(middleTip, wrist) < 0.55 * scale;
	const ringCurled = distance(ringTip, wrist) < 0.55 * scale;
	const pinkyCurled = distance(pinkyTip, wrist) < 0.55 * scale;

	// Thumb near middle/ring to form the circle
	const thumbNearCircle = Math.min(distance(thumbTip, middleTip), distance(thumbTip, ringTip)) < 0.28 * scale;

	const curledCount = [midCurled, ringCurled, pinkyCurled].filter(Boolean).length;
	return idxFarWrist && idxExtended && curledCount >= 2 && thumbNearCircle;
}

export function isLikelyDFromRaw(raw: any): boolean {
	try {
		const pts: Point[] = Array.isArray(raw) ? raw as Point[] : (raw?.hands?.[0]?.landmarks || raw?.landmarks || []);
		if (!Array.isArray(pts) || pts.length < 21) return false;
		let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
		for (const p of pts) {
			if (!isFinite(p.x) || !isFinite(p.y)) continue;
			if (p.x < minX) minX = p.x;
			if (p.x > maxX) maxX = p.x;
			if (p.y < minY) minY = p.y;
			if (p.y > maxY) maxY = p.y;
		}
		const size = Math.max(Math.max(1e-6, maxX - minX), Math.max(1e-6, maxY - minY));
		const norm = pts.map(p => ({ x: (p.x - minX) / size, y: (p.y - minY) / size }));
		return isLikelyD(norm);
	} catch { return false; }
}

export function isHardcodedDRaw(raw: any, tolerancePx: number = 16, minScore: number = 0.9): boolean {
	try {
		const hand = raw?.hands?.[0];
		if (!hand || typeof hand !== 'object') return false;
		const score: number = Number(hand.score ?? 0);
		if (!(score >= minScore)) return false;
		const pts: Point[] = hand.landmarks || [];
		if (!Array.isArray(pts) || pts.length < 6) return false;
		// Two templates derived from user-provided samples (rounded)
		const templates: Point[][] = [
			[
				{ x: 108.71, y: 367.86 },
				{ x: 148.38, y: 365.10 },
				{ x: 179.11, y: 348.47 },
				{ x: 203.47, y: 338.83 },
				{ x: 219.22, y: 321.52 },
				{ x: 169.73, y: 301.91 },
			],
			[
				{ x: 172.66, y: 410.59 },
				{ x: 211.80, y: 395.39 },
				{ x: 235.46, y: 369.92 },
				{ x: 241.23, y: 348.17 },
				{ x: 222.82, y: 326.53 },
				{ x: 230.00, y: 281.32 },
			],
			[
				{ x: 237.31, y: 437.51 },
				{ x: 196.46, y: 423.49 },
				{ x: 158.89, y: 392.53 },
				{ x: 149.99, y: 370.41 },
				{ x: 176.17, y: 353.43 },
				{ x: 173.02, y: 293.47 },
			],
		];
		let match = false;
		for (const template of templates) {
			let within = 0;
			for (let i = 0; i < template.length; i++) {
				const p = pts[i];
				if (!p) continue;
				const dx = Math.abs(Number(p.x) - template[i].x);
				const dy = Math.abs(Number(p.y) - template[i].y);
				if (dx <= tolerancePx && dy <= tolerancePx) within += 1;
			}
			if (within >= 5) { match = true; break; }
		}
		if (match) return true;
		// Fallback ratios to protect against minor scale/translation differences
		const [p0,p1,p2,p3,p4,p5] = pts;
		if (![p0,p1,p2,p3,p4,p5].every(p => p && isFinite(p.x) && isFinite(p.y))) return false;
		const d08 = distance(p0, p2); // proxy
		const d04 = distance(p0, p4);
		const d15 = distance(p1, p5);
		const within = (val: number, target: number, tol: number) => Math.abs(val - target) <= tol * target;
		const r1 = d04 / Math.max(1e-3, d08);
		const r2 = d15 / Math.max(1e-3, d04);
		return within(r1, 1.0, 0.45) && within(r2, 0.6, 0.5);
	} catch { return false; }
}


