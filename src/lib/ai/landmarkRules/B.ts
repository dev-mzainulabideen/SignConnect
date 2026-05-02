// Simple heuristic and hardcoded matcher for ASL letter 'B'
// Uses raw pixel landmarks as printed by the app and a small normalized fallback

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

// Heuristic: 'B' is a flat open hand with fingers extended, thumb across palm.
export function isLikelyB(points: Point[] | null | undefined): boolean {
	if (!Array.isArray(points) || points.length < 21) return false;
	const scale = estimateScale(points);
	if (!isFinite(scale) || scale <= 0) return false;
	const wrist = points[0];
	const tipIdx = [8,12,16,20];
	const pipIdx = [6,10,14,18];
	let extended = 0;
	for (let i = 0; i < tipIdx.length; i++) {
		const tip = points[tipIdx[i]];
		const pip = points[pipIdx[i]];
		if (!tip || !pip) return false;
		// Tips far from wrist (extended)
		if (distance(tip, wrist) > 0.55 * scale) extended += 1;
	}
	const thumbTip = points[4];
	const indexMcp = points[5];
	if (!thumbTip || !indexMcp) return false;
	// Thumb near palm band (not extended outwards)
	const thumbAcrossPalm = distance(thumbTip, indexMcp) < 0.45 * scale;
	return extended >= 3 && thumbAcrossPalm;
}

export function isLikelyBFromRaw(raw: any): boolean {
	try {
		const pts: Point[] = Array.isArray(raw)
			? raw as Point[]
			: (raw?.hands?.[0]?.landmarks || raw?.landmarks || []);
		return isLikelyB(pts);
	} catch { return false; }
}

// Hardcoded strict template matcher using first 6 points with pixel tolerance and min score
export function isHardcodedBRaw(raw: any, tolerancePx: number = 12, minScore: number = 0.9): boolean {
	try {
		const hand = raw?.hands?.[0];
		if (!hand) return false;
		const score: number = Number(hand.score ?? 0);
		if (!(score >= minScore)) return false;
		const pts: Point[] = hand.landmarks || [];
		if (!Array.isArray(pts) || pts.length < 6) return false;
		// Template from user's screenshot (rounded)
		const template: Point[] = [
			{ x: 253.90, y: 511.57 }, // 0 wrist
			{ x: 184.55, y: 467.25 }, // 1
			{ x: 156.41, y: 390.42 }, // 2
			{ x: 196.66, y: 322.86 }, // 3
			{ x: 255.57, y: 302.25 }, // 4 thumb tip
			{ x: 144.00, y: 314.27 }, // 5 index mcp (approx, truncated in log)
		];
		let withinTol = 0;
		for (let i = 0; i < template.length; i++) {
			const p = pts[i];
			if (!p) continue;
			const dx = Math.abs(Number(p.x) - template[i].x);
			const dy = Math.abs(Number(p.y) - template[i].y);
			if (dx <= tolerancePx && dy <= tolerancePx) withinTol += 1;
		}
		if (withinTol >= 5) return true;
		// Ratio fallback tolerant to translate/scale
		const p0 = pts[0], p4 = pts[4], p8 = pts[8];
		if (!p0 || !p4 || !p8) return false;
		const d04 = distance(p0, p4);
		const d08 = distance(p0, p8);
		const r = d08 / Math.max(1e-3, d04);
		return r > 1.2; // fingertips notably farther than thumb tip for B
	} catch { return false; }
}


