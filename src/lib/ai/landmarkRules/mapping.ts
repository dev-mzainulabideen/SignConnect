// Heuristic/hardcoded imports removed for strict template matching

export type NormPoint = { x: number; y: number };
export type RawPoint = { x: number; y: number };

// Reference templates (first 6 anchor points per sample) — normalized later
const TEMPLATES: Record<'A'|'B'|'C'|'D'|'E'|'F'|'G'|'H'|'I'|'K'|'L', RawPoint[][]> = {
  A: [
    [
      { x: 255.61, y: 380.14 }, { x: 186.03, y: 363.51 }, { x: 126.76, y: 316.32 },
      { x: 94.55,  y: 264.79 }, { x: 79.05,  y: 220.94 }, { x: 163.06, y: 237.99 },
    ],
    [
      { x: 249.88494873046875, y: 384.80364990234375 },
      { x: 175.1616973876953,  y: 361.3327941894531 },
      { x: 119.1364517211914,  y: 313.15679931640625 },
      { x: 94.60116577148438,  y: 265.33489990234375 },
      { x: 81.3673095703125,   y: 228.2772674560547 },
      { x: 163.0100000000000,  y: 245.5418701171875 },
    ],
    [
      { x: 283.33978271484375, y: 428.8717956542969 },
      { x: 187.05950927734375, y: 412.9125061035156 },
      { x: 104.95684814453125, y: 343.4264221191406 },
      { x: 67.49919128417969,  y: 267.71234130859375 },
      { x: 51.21583557128906,  y: 204.35659790039062 },
      { x: 133.0000000000000,  y: 262.3332214355469 },
    ],
  ],
  B: [
    [
      { x: 253.90, y: 511.57 }, // 0 wrist
      { x: 184.55, y: 467.25 }, // 1
      { x: 156.41, y: 390.42 }, // 2
      { x: 196.66, y: 322.86 }, // 3
      { x: 255.57, y: 302.25 }, // 4 thumb tip
      { x: 144.00, y: 314.27 }, // 5 index mcp (approx)
    ],
    [
      { x: 253.90072631835938, y: 511.5728759765625 },
      { x: 184.5500946044922,  y: 467.24859619140625 },
      { x: 156.4081573486328,  y: 390.4197082519531 },
      { x: 196.65591430664062, y: 322.8565368652344 },
      { x: 255.56781005859375, y: 302.24822998046875 },
      { x: 144.00000000000000, y: 314.26678466796875 },
    ],
    [
      { x: 204.91603088378906, y: 477.61358642578125 },
      { x: 142.90014648437500,  y: 448.4682312011719 },
      { x: 106.23612213134766,  y: 385.2049255371094 },
      { x: 137.68038940429688, y: 331.0631103515625 },
      { x: 186.84613037109375, y: 309.64044189453125 },
      { x: 125.00000000000000, y: 283.0010986328125 },
    ],
    [
      { x: 210.01126098632812, y: 468.045166015625 },
      { x: 156.77505493164062, y: 441.39471435546875 },
      { x: 132.24435424804688, y: 384.5639343261719 },
      { x: 176.79830932617188, y: 345.6511535644531 },
      { x: 224.4030303955078,  y: 335.753173828125 },
      { x: 144.45000000000000, y: 287.8401794433594 },
    ],
  ],
  C: [
    [
      { x: 108.71, y: 367.86 }, { x: 148.38, y: 365.10 }, { x: 179.11, y: 348.47 },
      { x: 203.47, y: 338.83 }, { x: 219.22, y: 321.52 }, { x: 169.73, y: 301.91 },
    ],
    [
      { x: 295.2190246582031,  y: 386.7199401855469 },
      { x: 236.45492553710938, y: 374.9401550292969 },
      { x: 187.5305633544922,  y: 346.82666015625 },
      { x: 146.53787231445312, y: 336.10797119140625 },
      { x: 113.94075012207031, y: 324.9103698730469 },
      // 6th anchor y missing in log; template still valid for 5/6 check
    ],
    [
      { x: 279.9709777832031,  y: 427.5354919433594 },
      { x: 213.33438110351562, y: 394.7204284667969 },
      { x: 168.58929443359375, y: 353.42022705078125 },
      { x: 130.40916442871094, y: 331.4502868652344 },
      { x: 102.31615447998047, y: 310.3420104980469 },
      // 6th anchor y missing in log; template still valid for 5/6 check
    ],
  ],
  D: [
    [
      { x: 211.8018035888672,  y: 436.69915771484375 },
      { x: 167.38877868652344, y: 424.93890380859375 },
      { x: 144.50819396972656, y: 401.61126708984375 },
      { x: 166.18148803710938, y: 393.2409362792969 },
      { x: 197.6308135986328,  y: 379.4661560058594 },
      // 6th anchor truncated in log; using 5/6 match
    ],
    [
      { x: 208.16934204101562, y: 449.72479248046875 },
      { x: 162.79681396484375, y: 425.38397216796875 },
      { x: 128.84677124023438, y: 400.03564453125 },
      { x: 137.73159790039062, y: 377.7767028808594 },
      { x: 176.2493896484375,  y: 368.1938171386719 },
      // 6th anchor truncated in log; using 5/6 match
    ],
    // User-provided D samples (first 6 landmarks)
    [
      { x: 231.151123046875, y: 427.1335144042969 },
      { x: 191.04322814941406, y: 431.1125183105469 },
      { x: 153.61837768554688, y: 427.11163330078125 },
      { x: 156.4853515625, y: 428.5990295410156 },
      { x: 185.66390991210938, y: 423.7137145996094 },
      { x: 158.10852, y: 302.3550720214844 },
    ],
    [
      { x: 229.77392578125, y: 473.015625 },
      { x: 178.481689453125, y: 460.5718078613281 },
      { x: 136.65635681152344, y: 423.0451354980469 },
      { x: 137.93446350097656, y: 394.3815002441406 },
      { x: 171.50311279296875, y: 382.6796569824219 },
      { x: 148.7681884765625, y: 296.0911560058594 },
    ],
    [
      { x: 249.82937622070312, y: 436.9093017578125 },
      { x: 194.3675079345703, y: 414.9551086425781 },
      { x: 151.56143188476562, y: 387.7518005371094 },
      { x: 157.2750244140625, y: 388.33624267578125 },
      { x: 186.65841674804688, y: 391.2057189941406 },
      { x: 162.0, y: 268.53875732421875 },
    ],
  ],
  E: [
   
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
    [
      { x: 213.18389892578125, y: 424.0872497558594 },
      { x: 154.47158813476562, y: 403.5081481933594 },
      { x: 104.74934387207031, y: 368.0587463378906 },
      { x: 112.20733642578125, y: 337.13909912109375 },
      { x: 163.4191131591797,  y: 336.71417236328125 },
      { x: 117.00000000000000, y: 266.6124267578125 },
    ],
    [
      { x: 219.06771850585938, y: 432.7533264160156 },
      { x: 157.42686462402344, y: 419.4901123046875 },
      { x: 101.19010162353516, y: 381.3405456542969 },
      { x: 103.34783935546875, y: 355.1361083984375 },
      { x: 154.41293334960938, y: 350.92340087890625 },
      { x: 126.00000000000000, y: 266.04486083984375 },
    ],
  ],
  F: [
    // User-provided F samples (first 6 landmarks)
    [
      { x: 184.1156005859375, y: 470.52203369140625 },
      { x: 147.92556762695312, y: 473.3977355957031 },
      { x: 107.76910400390625, y: 460.93603515625 },
      { x: 91.74069213867188, y: 446.3312072753906 },
      { x: 108.357421875, y: 430.67510986328125 },
      { x: 113.6457824, y: 345.0061950683594 },
    ],
    [
      { x: 174.3968048095703, y: 470.4817810058594 },
      { x: 135.8663330078125, y: 473.3311462402344 },
      { x: 93.0157699584961, y: 459.9851379394531 },
      { x: 78.3525619506836, y: 444.556396484375 },
      { x: 97.65487670898438, y: 428.6262512207031 },
      { x: 97.59123229, y: 349.14312744140625 },
    ],
    [
      { x: 180.571044921875, y: 459.9280700683594 },
      { x: 147.8491668701172, y: 455.4269104003906 },
      { x: 117.78483581542969, y: 436.2569885253906 },
      { x: 110.0526351928711, y: 419.8760681152344 },
      { x: 129.4272003173828, y: 411.94805908203125 },
      { x: 135.1849, y: 366.8585205078125 },
    ],
    [
      { x: 180.6545867919922, y: 442.93499755859375 },
      { x: 148.28871154785156, y: 441.1617126464844 },
      { x: 115.67698669433594, y: 425.9190368652344 },
      { x: 102.5322265625, y: 410.3614807128906 },
      { x: 120.40174865722656, y: 400.0594787597656 },
      { x: 131.4163, y: 354.7884826660156 },
    ],
  ],
  G: [
    // User-provided G samples (first 6 landmarks)

    
    [
      { x: 260.2811584472656, y: 321.6748352050781 },
      { x: 211.2247314453125, y: 295.3609924316406 },
      { x: 169.52996826171875, y: 265.8104248046875 },
      { x: 134.20677185058594, y: 256.8863525390625 },
      { x: 105.79411315917969, y: 255.05165100097656 },
      { x: 203.0, y: 196.88978576660156 },
    ],
    [
      { x: 84.11577606201172, y: 309.79931640625 },
      { x: 107.21419525146484, y: 311.1256103515625 },
      { x: 147.43858337402344, y: 305.6664733886719 },
      { x: 183.00326538085938, y: 304.884521484375 },
      { x: 211.03741455078125, y: 299.431640625 },
      { x: 142.6911773, y: 243.97055053710938 },
    ],
    [
      { x: 18.923385620117188, y: 282.2080078125 },
      { x: 51.91762161254883, y: 295.8226623535156 },
      { x: 99.05375671386719, y: 288.1422424316406 },
      { x: 139.5723419189453, y: 282.7391357421875 },
      { x: 171.1712188720703, y: 284.3281555175781 },
      { x: 91.0848770, y: 221.12167358398438 },
    ],
    [
      { x: 44.69761276245117, y: 216.5194549560547 },
      { x: 68.60282897949219, y: 207.93856811523438 },
      { x: 102.72301483154297, y: 204.82537841796875 },
      { x: 136.45835876464844, y: 211.70419311523438 },
      { x: 162.30491638183594, y: 214.91285705566406 },
      { x: 1.0, y: 151.43763732910156 },
    ],
  ],
  H: [
    // User-provided H samples (first 6 landmarks)
    [
      { x: 72.16693878173828, y: 344.2048034667969 },
      { x: 77.22416687011719, y: 304.8580322265625 },
      { x: 111.99671936035156, y: 278.12603759765625 },
      { x: 153.1063232421875, y: 269.3462829589844 },
      { x: 179.8287811279297, y: 256.39154052734375 },
      { x: 135.86, y: 253.3023681640625 },
    ],
    [
      { x: 30.087505340576172, y: 342.4608459472656 },
      { x: 44.76074981689453, y: 295.62738037109375 },
      { x: 87.72027587890625, y: 267.5579528808594 },
      { x: 133.3617401123047, y: 261.5129089355469 },
      { x: 161.87046813964844, y: 248.99554443359375 },
      { x: 110.7, y: 248.3945770263672 },
    ],
    [
      { x: 20.101991653442383, y: 358.8208923339844 },
      { x: 45.29338073730469, y: 321.1302490234375 },
      { x: 86.03610229492188, y: 297.9278564453125 },
      { x: 127.71011352539062, y: 293.22784423828125 },
      { x: 162.583251953125, y: 287.2319030761719 },
      { x: 111.667, y: 265.0277099609375 },
    ],
  ],
  I: [
    // User-provided I samples (first 6 landmarks)
    [
      { x: 108.6744384765625, y: 309.5455627441406 },
      { x: 75.92597961425781, y: 295.47650146484375 },
      { x: 51.24449157714844, y: 262.8073425292969 },
      { x: 58.889732360839844, y: 230.2990264892578 },
      { x: 87.35885620117188, y: 219.81056213378906 },
      { x: 61.19, y: 229.98037719726562 },
    ],
    [
      { x: 129.66952514648438, y: 418.7968444824219 },
      { x: 82.75167846679688, y: 410.98577880859375 },
      { x: 38.217384338378906, y: 370.3091125488281 },
      { x: 35.469181060791016, y: 325.8643798828125 },
      { x: 69.9704360961914, y: 310.59344482421875 },
      { x: 64.2, y: 314.73309326171875 },
    ],
    [
      { x: 142.783935546875, y: 327.1671447753906 },
      { x: 98.67852783203125, y: 314.1107482910156 },
      { x: 62.65424728393555, y: 279.34228515625 },
      { x: 70.22816467285156, y: 241.82345581054688 },
      { x: 105.80709838867188, y: 222.71829223632812 },
      { x: 68.67436, y: 213.89019775390625 },
    ],
  ],
  K: [
    // User-provided K samples (first 6 landmarks)
    [
      { x: 179.87120056152344, y: 406.82769775390625 },
      { x: 137.85791015625, y: 363.47625732421875 },
      { x: 128.4034423828125, y: 303.7922058105469 },
      { x: 144.3475341796875, y: 256.409423828125 },
      { x: 147.04196166992188, y: 220.37591552734375 },
      { x: 127.155, y: 275.9343566894531 },
    ],
    [
      { x: 143.12216186523438, y: 326.7598571777344 },
      { x: 111.28911590576172, y: 302.7658996582031 },
      { x: 98.92179107666016, y: 264.1005859375 },
      { x: 104.78020477294922, y: 229.31874084472656 },
      { x: 101.01123809814453, y: 203.49656677246094 },
      { x: 95.11, y: 243.06417846679688 },
    ],
    [
      { x: 131.00355529785156, y: 363.1036071777344 },
      { x: 96.5914535522461, y: 329.43487548828125 },
      { x: 89.6333999633789, y: 279.2778015136719 },
      { x: 102.4042739868164, y: 238.4000244140625 },
      { x: 100.88748168945312, y: 207.77032470703125 },
      { x: 88.3253, y: 253.9744415283203 },
    ],
  ],
  L: [
    // User-provided L samples (first 6 landmarks)
    [
      { x: 195.24391174316406, y: 377.06036376953125 },
      { x: 149.3254852294922, y: 367.2210388183594 },
      { x: 103.76911926269531, y: 339.69561767578125 },
      { x: 70.5206069946289, y: 324.41680908203125 },
      { x: 36.423038482666016, y: 322.79559326171875 },
      { x: 134.0, y: 263.9574890136719 },
    ],
    [
      { x: 158.03726196289062, y: 328.7320861816406 },
      { x: 114.57079315185547, y: 318.5380554199219 },
      { x: 72.46737670898438, y: 294.2604675292969 },
      { x: 41.02560043334961, y: 281.6837158203125 },
      { x: 10.253006935119629, y: 281.0189208984375 },
      { x: 103.7, y: 228.14938354492188 },
    ],
  ],
};



function pixelTemplateCommit(raw: any, defaultTolPx: number = 8): { letter: 'A'|'B'|'C'|'D'|'E'|'F'|'G'|'H'|'I'|'K'|'L'; error: number } | null {
  const pts: RawPoint[] = Array.isArray(raw) ? (raw as RawPoint[]) : (raw?.hands?.[0]?.landmarks || raw?.landmarks || []);
  if (!Array.isArray(pts) || pts.length < 6) return null;

  // Letter-specific tolerances and required matches (first 6 anchors)
  // Slightly increase C tolerance to speed up acceptance; tighten E to reduce D/E swaps
  const tol: Record<'A'|'B'|'C'|'D'|'E'|'F'|'G'|'H'|'I'|'K'|'L', number> = { A: 12, B: 10, C: 12, D: 8, E: 7, F: 9, G: 13, H: 12, I: 12, K: 11, L: 11 };
  const reqWithin: Record<'A'|'B'|'C'|'D'|'E'|'F'|'G'|'H'|'I'|'K'|'L', number> = { A: 5, B: 5, C: 5, D: 5, E: 5, F: 5, G: 5, H: 5, I: 5, K: 5, L: 5 };

  type Cand = { letter: 'A'|'B'|'C'|'D'|'E'|'F'|'G'|'H'|'I'|'K'|'L'; within: number; error: number };
  const cands: Cand[] = [];

  (Object.keys(TEMPLATES) as Array<'A'|'B'|'C'|'D'|'E'|'F'|'G'|'H'|'I'|'K'|'L'>).forEach(letter => {
    for (const tmpl of TEMPLATES[letter]) {
      let within = 0;
      let sumAbs = 0;
      const useTol = Number.isFinite(tol[letter]) ? tol[letter] : defaultTolPx;
      const needWithin = reqWithin[letter];
      for (let i = 0; i < 6; i++) {
        const p = pts[i];
        const t = tmpl[i];
        if (!p || !t) continue;
        const dx = Math.abs(Number(p.x) - t.x);
        const dy = Math.abs(Number(p.y) - t.y);
        if (dx <= useTol && dy <= useTol) within += 1;
        sumAbs += dx + dy;
      }
      if (within >= needWithin) {
        cands.push({ letter, within, error: sumAbs });
      }
    }
  });

  if (cands.length === 0) return null;

  // Sort: higher within first, then lower error
  cands.sort((a, b) => (b.within - a.within) || (a.error - b.error));
  let best = cands[0];
  const second = cands[1];

  // Prefer G/H/I over A/B when they are essentially tied (reduce false flips to A/B)
  try {
    const alt = cands.find(c => (c.letter === 'G' || c.letter === 'H' || c.letter === 'I'));
    if (alt) {
      const withinGap = (best.within - alt.within);
      const errorGap = (alt.error - best.error);
      // If alt G/H/I is as good on within and not significantly worse on error, promote it
      if (withinGap <= 1 && errorGap <= 1.8 * defaultTolPx) {
        if (best.letter === 'A' || best.letter === 'B') {
          best = alt;
        }
      }
    }
  } catch {}

  // Disambiguation: require clear separation
  if (second) {
    const withinGap = best.within - second.within;
    const errorGap = second.error - best.error;
    // Stricter separation to avoid near-ties producing wrong letters
    if (withinGap < 1 && errorGap < 2 * defaultTolPx) {
      // Too close to call; treat as no match to avoid random flip
      return null;
    }
  }

  return { letter: best.letter as 'A'|'B'|'C'|'D'|'E'|'F'|'G'|'H'|'I'|'K'|'L', error: best.error };
}

// Deterministic, rule-first mapping from landmarks to a single letter.
// Deterministic: only return when raw pixel templates match within tolerance.
export function mapLandmarksToLetter(options: { normalized?: NormPoint[] | null; raw?: any }): string | undefined {
  // const ptsNorm = options.normalized; // unused by strict mode; kept for API compatibility
	const raw = options.raw;

	// Only allow pixel-level deterministic template matches
	if (raw) {
    const px = pixelTemplateCommit(raw, 8);
    if (px) {
      // Lightweight geometric sanity checks to stabilize D/E disambiguation
      try {
        const pts: RawPoint[] = Array.isArray(raw) ? raw as RawPoint[] : (raw?.hands?.[0]?.landmarks || raw?.landmarks || []);
        if (Array.isArray(pts) && pts.length >= 21) {
          const thumbY = Number(pts[4].y);
          const tipsY = [8,12,16,20].map(i => Number(pts[i].y));
          const indexY = Number(pts[8].y);
          const midY = Number(pts[12].y);
          const ringY = Number(pts[16].y);
          const pinkY = Number(pts[20].y);
          const indexX = Number(pts[8].x);
          const middleX = Number(pts[12].x);
          const thumbX = Number(pts[4].x);
          const mcpIndexY = Number(pts[5].y);
          const mcpMiddleY = Number(pts[9].y);
          const mcpRingY = Number(pts[13].y);
          const mcpPinkyY = Number(pts[17].y);
          // E heuristic: thumb significantly below all fingertips (y greater)
          const isLikelyE = tipsY.every(y => (thumbY - y) > 10);
          // Finger extension checks (positive means tip much above MCP)
          const indexExtended = (mcpIndexY - indexY) > 24;
          // const middleExtended = (mcpMiddleY - midY) > 18;
          // const ringExtended = (mcpRingY - ringY) > 16;
          // const pinkyExtended = (mcpPinkyY - pinkY) > 14;
          const curledCount = [
            (mcpIndexY - indexY) < 8,
            (mcpMiddleY - midY) < 8,
            (mcpRingY - ringY) < 8,
            (mcpPinkyY - pinkY) < 8,
          ].filter(Boolean).length;
          // D heuristic: index significantly above others (lower y), aligned with middle horizontally, and clearly extended
          const isLikelyD = indexExtended && (midY - indexY > 16) && (ringY - indexY > 16) && (pinkY - indexY > 16) && (Math.abs(indexX - middleX) < 32);
          // If predicted D but E cues very strong (thumb very low and most fingers curled), prefer E
          if (px.letter === 'D' && isLikelyE && curledCount >= 3) return 'E';
          // If predicted E but index clearly extended and others lower than index (classic D), prefer D
          if (px.letter === 'E' && isLikelyD) return 'D';
          if (px.letter === 'E' && indexExtended && (midY - indexY > 16)) return 'D';

          // F vs E: thumb-index pinch (distance small) while middle/ring/pinky extended
          const dxTI = Math.abs(indexX - thumbX);
          const dyTI = Math.abs(indexY - thumbY);
          const pinchDist = Math.hypot(dxTI, dyTI);
          const middleExtended = (mcpMiddleY - midY) > 14;
          const ringExtended = (mcpRingY - ringY) > 12;
          const pinkyExtended = (mcpPinkyY - pinkY) > 10;
          const isLikelyF = pinchDist < 22 && middleExtended && ringExtended && pinkyExtended;
          if (px.letter === 'E' && isLikelyF) return 'F';
        }
      } catch {}
      return (px.letter as unknown) as 'A'|'B'|'C'|'D'|'E'|'F';
    }
	}

  return undefined;
}


