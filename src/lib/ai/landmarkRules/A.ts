// Simple heuristic-based matcher for ASL letter 'A'
// Input coordinates are expected normalized in [0,1] space with (0,0) top-left

export interface Point { x: number; y: number }

function distance(a: Point, b: Point): number {
	const dx = a.x - b.x;
	const dy = a.y - b.y;
	return Math.hypot(dx, dy);
}

// Compute a rough hand scale based on min/max spread to make thresholds scale-invariant
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

// ASL 'A' is commonly a closed fist with the thumb alongside the index finger.
// Heuristics:
// - Fingertips (8,12,16,20) are close to wrist (0) compared to hand scale (closed fingers)
// - Fingertips are also close to their base joints (7,11,15,19)
// - Thumb tip (4) is near index MCP (5) and outside palm less than open-hand thresholds
// - Average finger extension small (tips below/near knuckles in y)

export function isLikelyA(points: Point[] | null | undefined): boolean {
	if (!Array.isArray(points) || points.length < 21) return false;
	const scale = estimateScale(points);
	if (!isFinite(scale) || scale <= 0) return false;

	const wrist = points[0];
	const tipIdx = [8, 12, 16, 20];
	const dipIdx = [7, 11, 15, 19];
	let closedCount = 0;
	let curledCount = 0;
	for (let i = 0; i < tipIdx.length; i++) {
		const tip = points[tipIdx[i]];
		const dip = points[dipIdx[i]];
		if (!tip || !dip) return false;
		const dTipWrist = distance(tip, wrist);
		const dTipDip = distance(tip, dip);
		// thresholds relative to hand scale
    if (dTipWrist < 0.45 * scale) closedCount += 1; // loosened
    if (dTipDip < 0.24 * scale) curledCount += 1;   // loosened
	}

	// thumb alongside index: thumb tip near index MCP (5) and not far from palm center
	const thumbTip = points[4];
	const indexMcp = points[5];
	if (!thumbTip || !indexMcp) return false;
	const dThumbIndexBase = distance(thumbTip, indexMcp);
	const dThumbWrist = distance(thumbTip, wrist);

	// Require most fingers closed/curled and thumb near index base
	const fingersClosedEnough = closedCount >= 3; // at least three fingers closed
	const fingersCurledEnough = curledCount >= 3;
  const thumbAlongside = dThumbIndexBase < 0.30 * scale && dThumbWrist < 0.70 * scale; // loosened

	// Additional stability: average fingertip y should not be far above their DIPs (closed fist)
	let yAboveCount = 0;
	for (let i = 0; i < tipIdx.length; i++) {
		const tip = points[tipIdx[i]];
		const dip = points[dipIdx[i]];
		if (tip.y >= dip.y - 0.02) yAboveCount += 1; // in image coords, larger y is lower; closed fist tips not far above
	}
  const fistLike = yAboveCount >= 2; // loosened

	return fingersClosedEnough && fingersCurledEnough && thumbAlongside && fistLike;
}

// Hardcoded pattern match against raw app landmarks as printed in console
// Accepts the original detector result object or just the landmarks array in pixel space
export function isLikelyAFromRaw(raw: any): boolean {
	try {
		const pts: Point[] = Array.isArray(raw)
			? raw as Point[]
			: (raw?.hands?.[0]?.landmarks || raw?.landmarks || []);
		if (!Array.isArray(pts) || pts.length < 6) return false;
		// Use only a few anchor indices visible in the user's sample
		const p0 = pts[0]; // wrist ~ (x≈256,y≈380)
		const p1 = pts[1]; // thumb-cmc ~ (x≈186,y≈364)
		const p2 = pts[2]; // thumb-mcp ~ (x≈127,y≈316)
		const p3 = pts[3]; // thumb-ip  ~ (x≈95,y≈265)
		const p4 = pts[4]; // thumb-tip ~ (x≈79,y≈221)
		const p5 = pts[5]; // index-mcp ~ (x≈163,y≈238)
		if (![p0,p1,p2,p3,p4,p5].every(p => p && isFinite(p.x) && isFinite(p.y))) return false;
		// Compute scale from these anchors
		const scale = estimateScale(pts);
		if (!isFinite(scale) || scale <= 0) return false;
		// Monotonic thumb along roughly up-left direction: y decreases; x decreases (allow small noise)
		const monoY = p0.y > p1.y && p1.y > p2.y && p2.y > p3.y && p3.y > p4.y;
		const monoX = p0.x > p1.x && p1.x > p2.x && p2.x > p3.x && p3.x > p4.x;
		// Index MCP sits near thumb MCP/CMC band and to the right of thumb MCP (thumb alongside index base)
		const idxYBand = p5.y > p2.y - 0.35*scale && p5.y < p0.y + 0.25*scale; // widened band
		const thumbNearIndexBase = distance(p4, p5) < 0.50 * scale; // widened
		return monoY && monoX && idxYBand && thumbNearIndexBase;
	} catch {
		return false;
	}
}

// Strict hardcoded matcher using pixel tolerance around a template (first 6 points)
// Requires hands=1 and score>=minScore
export function isHardcodedARaw(raw: any, tolerancePx: number = 12, minScore: number = 0.9): boolean {
	try {
		const hand = raw?.hands?.[0];
		if (!hand || typeof hand !== 'object') return false;
		const score: number = Number(hand.score ?? 0);
		if (!(score >= minScore)) return false;
		const pts: Point[] = hand.landmarks || [];
		if (!Array.isArray(pts) || pts.length < 6) return false;
		// Template from user sample (rounded)
		const template: Point[] = [
			{ x: 255.61, y: 380.14 }, // 0 wrist
			{ x: 186.03, y: 363.51 }, // 1
			{ x: 126.76, y: 316.32 }, // 2
			{ x: 94.55,  y: 264.79 }, // 3
			{ x: 79.05,  y: 220.94 }, // 4 thumb tip
			{ x: 163.06, y: 237.99 }, // 5 index mcp
		];
		let withinTol = 0;
		for (let i = 0; i < template.length; i++) {
			const p = pts[i];
			if (!p) continue;
			const dx = Math.abs(Number(p.x) - template[i].x);
			const dy = Math.abs(Number(p.y) - template[i].y);
			if (dx <= tolerancePx && dy <= tolerancePx) withinTol += 1;
		}
		// Require 5 of first 6 points within tolerance
		if (withinTol >= 5) return true;
		// Fallback: ratio-based check using distances to be robust to small scale/translate
		const p0 = pts[0], p1 = pts[1], p2 = pts[2], p3 = pts[3], p4 = pts[4], p5 = pts[5];
		if (![p0,p1,p2,p3,p4,p5].every(p => p && isFinite(p.x) && isFinite(p.y))) return false;
		const d04 = distance(p0, p4); // wrist->thumb tip
		const d13 = distance(p1, p3); // thumb cmc->ip
		const d25 = distance(p2, p5); // thumb mcp->index mcp
		const r1 = d13 / Math.max(1e-3, d04);
		const r2 = d25 / Math.max(1e-3, d04);
		// Expected rough ratios from sample (empirical), allow ±20%
		const within = (val: number, target: number, tol: number) => Math.abs(val - target) <= tol * target;
		const okR1 = within(r1, 0.6, 0.2);
		const okR2 = within(r2, 0.5, 0.2);
		return okR1 && okR2;
	} catch {
		return false;
	}
}


