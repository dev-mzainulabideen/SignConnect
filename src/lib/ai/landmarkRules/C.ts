// Heuristic-based matcher for ASL letter 'C'
// Works on normalized [0,1] landmark space similar to rasterizeSkeleton preprocessing

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

// ASL 'C' resembles a semi-circle: fingertips form an arc around a palm center,
// with a noticeable aperture between thumb tip (4) and index tip (8). Fingers are not fully extended nor fully closed.
export function isLikelyC(points: Point[] | null | undefined): boolean {
	if (!Array.isArray(points) || points.length < 21) return false;
	const scale = estimateScale(points);
	if (!isFinite(scale) || scale <= 0) return false;

	const palmIdx = [0, 5, 9, 13, 17];
	const tipsIdx = [4, 8, 12, 16, 20];
	const palmCenter = palmIdx.reduce((acc, i) => ({ x: acc.x + points[i].x, y: acc.y + points[i].y }), { x: 0, y: 0 });
	palmCenter.x /= palmIdx.length;
	palmCenter.y /= palmIdx.length;

	// Distances of tips to palm center should be similar (arc radius)
	const radii = tipsIdx.map(i => distance(points[i], palmCenter));
	const rAvg = radii.reduce((a, b) => a + b, 0) / radii.length;
	const rVar = radii.reduce((s, r) => s + Math.pow(r - rAvg, 2), 0) / radii.length;
	const rStd = Math.sqrt(rVar);

	// The arc shouldn't be tiny (not a fist) nor huge (fully open). Bounds relative to scale
	const radiusOk = rAvg > 0.20 * scale && rAvg < 0.75 * scale;
	const uniformArc = rStd < 0.18 * scale; // tips roughly on a common arc

	// Thumb and index tips should face each other with a moderate gap
	const thumbTip = points[4];
	const indexTip = points[8];
	const gap = distance(thumbTip, indexTip);
	const gapOk = gap > 0.18 * scale && gap < 0.70 * scale;

	// Fingertips not fully extended relative to knuckles (slightly curled)
	const dipIdx = [3, 7, 11, 15, 19];
	let curledCount = 0;
	for (let k = 0; k < tipsIdx.length; k++) {
		const tip = points[tipsIdx[k]];
		const dip = points[dipIdx[k]];
		if (distance(tip, dip) < 0.40 * scale) curledCount += 1;
	}
	const curledOk = curledCount >= 3;

	return radiusOk && uniformArc && gapOk && curledOk;
}

// Raw matcher: extract raw points (pixel space), normalize to bbox in [0,1] and reuse isLikelyC
export function isLikelyCFromRaw(raw: any): boolean {
	try {
		const pts: Point[] = Array.isArray(raw)
			? raw as Point[]
			: (raw?.hands?.[0]?.landmarks || raw?.landmarks || []);
		if (!Array.isArray(pts) || pts.length < 21) return false;
		let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
		for (const p of pts) {
			if (!isFinite(p.x) || !isFinite(p.y)) continue;
			if (p.x < minX) minX = p.x;
			if (p.x > maxX) maxX = p.x;
			if (p.y < minY) minY = p.y;
			if (p.y > maxY) maxY = p.y;
		}
		const w = Math.max(1e-6, maxX - minX);
		const h = Math.max(1e-6, maxY - minY);
		const size = Math.max(w, h);
		const norm = pts.map(p => ({ x: (p.x - minX) / size, y: (p.y - minY) / size }));
		return isLikelyC(norm);
	} catch {
		return false;
	}
}

// Strict hardcoded matcher using pixel tolerance around a template (first 6 points)
// Requires hands=1 and score>=minScore
export function isHardcodedCRaw(raw: any, tolerancePx: number = 14, minScore: number = 0.9): boolean {
	try {
		const hand = raw?.hands?.[0];
		if (!hand || typeof hand !== 'object') return false;
		const score: number = Number(hand.score ?? 0);
		if (!(score >= minScore)) return false;
		const pts: Point[] = hand.landmarks || [];
		if (!Array.isArray(pts) || pts.length < 6) return false;
		// Template derived from user-provided sample (rounded to 2 decimals)
		const template: Point[] = [
			{ x: 108.71, y: 367.86 }, // 0 wrist
			{ x: 148.38, y: 365.10 }, // 1
			{ x: 179.11, y: 348.47 }, // 2
			{ x: 203.47, y: 338.83 }, // 3
			{ x: 219.22, y: 321.52 }, // 4 (thumb tip likely near arc)
			{ x: 169.73, y: 301.91 }, // 5 (index MCP)
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
		// Fallback: ratio-based check robust to small scale/translate
		const [p0,p1,p2,p3,p4,p5] = pts;
		if (![p0,p1,p2,p3,p4,p5].every(p => p && isFinite(p.x) && isFinite(p.y))) return false;
		const d02 = distance(p0, p2);
		const d04 = distance(p0, p4);
		const d15 = distance(p1, p5);
		const d23 = distance(p2, p3);
		const r1 = d04 / Math.max(1e-3, d02); // arc radius vs base length
		const r2 = d15 / Math.max(1e-3, d04); // index base vs arc radius
		const r3 = d23 / Math.max(1e-3, d02); // local segment curvature
		const within = (val: number, target: number, tol: number) => Math.abs(val - target) <= tol * target;
		const okR1 = within(r1, 1.1, 0.35); // allow broad tolerance
		const okR2 = within(r2, 0.6, 0.45);
		const okR3 = within(r3, 0.55, 0.45);
		return okR1 && okR2 && okR3;
	} catch {
		return false;
	}
}


