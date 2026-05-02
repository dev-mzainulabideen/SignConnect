// Heuristic and hardcoded matchers for ASL letter 'E'

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

// ASL 'E': fingers curled into palm with fingertips near thumb; tighter than 'A'
export function isLikelyE(points: Point[] | null | undefined): boolean {
	if (!Array.isArray(points) || points.length < 21) return false;
	const scale = estimateScale(points);
	if (!isFinite(scale) || scale <= 0) return false;

	const wrist = points[0];
	const thumbTip = points[4];
	const tips = [points[8], points[12], points[16], points[20]]; // index, middle, ring, pinky tips
	const dips = [points[7], points[11], points[15], points[19]];

	// All finger tips should be fairly close to wrist (curled) and close to their DIPs
	let curledClose = 0;
	let curledTight = 0;
	for (let i = 0; i < tips.length; i++) {
		const tip = tips[i];
		const dip = dips[i];
		if (!tip || !dip) return false;
		if (distance(tip, wrist) < 0.55 * scale) curledClose += 1;
		if (distance(tip, dip) < 0.22 * scale) curledTight += 1;
	}

	// Tips cluster around thumb tip (touching/near the thumb)
	const nearThumb = tips.filter(t => distance(t, thumbTip) < 0.28 * scale).length >= 2;

	return curledClose >= 3 && curledTight >= 3 && nearThumb;
}

export function isLikelyEFromRaw(raw: any): boolean {
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
		return isLikelyE(norm);
	} catch { return false; }
}

export function isHardcodedERaw(raw: any, tolerancePx: number = 16, minScore: number = 0.9): boolean {
	try {
		const hand = raw?.hands?.[0];
		if (!hand || typeof hand !== 'object') return false;
		const score: number = Number(hand.score ?? 0);
		if (!(score >= minScore)) return false;
		const pts: Point[] = hand.landmarks || [];
		if (!Array.isArray(pts) || pts.length < 6) return false;
		// Multiple templates from user-provided samples (first 6 points)
		const templates: Point[][] = [
			[
				{ x: 230.50, y: 446.77 }, { x: 159.23, y: 442.64 }, { x: 101.74, y: 394.71 },
				{ x: 96.27,  y: 350.91 }, { x: 144.89, y: 329.31 }, { x: 123.77, y: 280.00 },
			],
			[
				{ x: 236.05, y: 466.36 }, { x: 166.85, y: 472.00 }, { x: 110.61, y: 430.54 },
				{ x: 103.61, y: 393.78 }, { x: 146.14, y: 364.85 }, { x: 115.80, y: 298.33 },
			],
			[
				{ x: 117.16, y: 445.38 }, { x: 176.59, y: 449.25 }, { x: 237.77, y: 424.68 },
				{ x: 251.07, y: 380.07 }, { x: 197.57, y: 356.62 }, { x: 230.55, y: 299.22 },
			],
			[
				{ x: 137.96, y: 486.63 }, { x: 191.39, y: 488.55 }, { x: 242.21, y: 450.18 },
				{ x: 230.33, y: 401.54 }, { x: 176.36, y: 380.23 }, { x: 227.00, y: 330.24 },
			],
		];
		for (const template of templates) {
			let within = 0;
			for (let i = 0; i < template.length; i++) {
				const p = pts[i];
				if (!p) continue;
				const dx = Math.abs(Number(p.x) - template[i].x);
				const dy = Math.abs(Number(p.y) - template[i].y);
				if (dx <= tolerancePx && dy <= tolerancePx) within += 1;
			}
			if (within >= 5) return true;
		}
		// Fallback ratio checks
		const [p0,p1,p2,p3,p4,p5] = pts;
		if (![p0,p1,p2,p3,p4,p5].every(p => p && isFinite(p.x) && isFinite(p.y))) return false;
		const dTipCluster = Math.min(distance(p4, p2), distance(p4, p1));
		const d0_2 = distance(p0, p2);
		const r1 = dTipCluster / Math.max(1e-3, d0_2);
		return r1 < 0.7; // tips near thumb relative to base distance
	} catch { return false; }
}


