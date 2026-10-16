/* shared motion vocabulary : the same musical camera language as the GSAP build,
   re-expressed with Remotion springs so every move has a physical settle. */
import { interpolate, spring, Easing, random, staticFile } from 'remotion';

export const FPS = 60;
export const DURATION_S = 230.202;
export const DURATION_FRAMES = Math.round(DURATION_S * FPS);

/* Asset resolver. During a Remotion render the files live under /public/...;
   in the standalone @remotion/player page we serve them next to the html and use
   the downscaled .jpg set, so the page works from any static host. */
export const A = (p: string) => {
  const web = typeof window !== 'undefined' && (window as any).__ASSET__ !== undefined;
  if (web) return ((window as any).__ASSET__ as string) + p.replace(/\.png$/, '.jpg');
  return staticFile(p);
};
export const isWeb = () => typeof window !== 'undefined' && (window as any).__ASSET__ !== undefined;

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* ---------------------------------------------------------------- beat clock */
export const BEAT = 60 / 145.0;
export const PHASE = 0.135;
export const beatPhase = (t: number) => ((t - PHASE) / BEAT) % 1;
export const beatPulse = (t: number, decay = 4) => Math.pow(1 - beatPhase(t), decay);
export const barPulse = (t: number, decay = 3) => Math.pow(1 - ((t - PHASE) / (BEAT * 4)) % 1, decay);

/* ---------------------------------------------------------------- heart gate */
export const HEART_WIN: [number, number, number][] = [
  [53.4, 67.6, 1.0],
  [160.7, 176.2, 1.0],
  [175.4, 198.0, 0.8],
];
export const heartOn = (t: number) => {
  let v = 0;
  for (const [a, b, w] of HEART_WIN) {
    const k = Math.min(clamp01((t - a) / 1.2), clamp01((b - t) / 1.8)) * w;
    if (k > v) v = k;
  }
  return v;
};

/* ---------------------------------------------------------------- tremor */
/* only a short accent right after a scene / chorus turns over, and only while the
   heart is actually on screen */
export type Hit = { t: number; type: string; sec: string };
export const tremor = (t: number, hits: Hit[]) => {
  let a = 0;
  for (const h of hits) {
    const age = t - h.t;
    if (age < 0 || age > 0.62) continue;
    const w = h.type === 'section' ? 1 : h.type === 'hook' || h.type === 'hook2' ? 0.5 : 0.3;
    const k = w * Math.exp(-age * 7.2) * (1 - Math.exp(-age * 40));
    if (k > a) a = k;
  }
  const ho = heartOn(t);
  const amp = 5.4 * a * ho;
  return {
    x: amp * Math.sin(t * 39),
    y: amp * 0.8 * Math.sin(t * 32 + 1.1),
    r: 0.24 * a * ho * Math.sin(t * 28 + 0.4),
  };
};

/* ---------------------------------------------------------------- plate camera */
export type Shot = {
  t: number; z: number; hold?: number; dx?: number; dy?: number;
  rin?: number; rout?: number; face?: boolean;
};
export type Plate = {
  id: string; img: string; t0: number; t1: number; op: number;
  focus: [number, number];
  tgt0: [number, number]; tgt1: [number, number];
  z0: number; z1: number;
  fi?: number; fo?: number; rev?: string; rd?: number; over?: boolean; pulse?: boolean; shots?: Shot[];
  camLink?: { t0: number; t1: number; top: number; push: number }[];
};

const PLATE_GRADE: Record<string, string> = {};
export const GRADE: Record<string, string> = {
  city: 'brightness(.66) saturate(.94) contrast(1.05)',
  city2: 'brightness(.66) saturate(.94) contrast(1.05)',
  crowd: 'brightness(.82) saturate(1.02) contrast(1.06)',
  theatre: 'brightness(.80) saturate(1.0) contrast(1.04)',
  heart: 'brightness(.86) saturate(1.08) contrast(1.02)',
  heart2: 'brightness(.86) saturate(1.14) contrast(1.02) sepia(.30) hue-rotate(-20deg)',
  girl: 'brightness(.74) saturate(.98) contrast(1.05)',
  deep: 'brightness(.80) saturate(1.05) contrast(1.03)',
  dream: 'brightness(.78) saturate(.95) contrast(1.04)',
  two: 'brightness(.82) saturate(1.05) contrast(1.04)',
  dawn: 'brightness(.66) saturate(.94) contrast(1.05)',
  dawn2: 'brightness(.66) saturate(.94) contrast(1.05)',
};
export const plateGrade = (id: string) => GRADE[id] || 'brightness(.66) saturate(.94) contrast(1.05)';

export const PLATES: Plate[] = [
  { id: 'city', img: 'g_city.png', t0: 0.3, t1: 15.4, op: 0.76, rev: 'waterUp', rd: 2.4, fi: 2.2, fo: 1.4,
    focus: [0.352, 0.62], tgt0: [700, 540], tgt1: [880, 660], z0: 1.0, z1: 1.10,
    shots: [{ t: 11.24, z: 1.34, hold: 2.4, dx: -44, dy: -20, rin: 1.6, rout: 2.4 }] },
  { id: 'city2', img: 'g_city.png', t0: 66.9, t1: 81.4, op: 0.68, rev: 'iris', rd: 1.6, fi: 1.4, fo: 1.5,
    focus: [0.352, 0.62], tgt0: [1000, 470], tgt1: [770, 660], z0: 1.16, z1: 1.05,
    shots: [{ t: 74.2, z: 1.36, hold: 2.6, dx: 58, dy: 26, rin: 1.7, rout: 2.4 }] },
  { id: 'crowd', img: 'g_crowd.png', t0: 27.7, t1: 40.7, op: 0.84, rev: 'glitch', rd: 0.5, fi: 2.0, fo: 1.4,
    over: true, pulse: true,
    focus: [0.512, 0.575], tgt0: [940, 440], tgt1: [980, 690], z0: 1.24, z1: 1.06,
    shots: [{ t: 31.76, z: 1.56, hold: 3.0, dx: -70, dy: 34, rin: 1.8, rout: 2.6, face: true }] },
  { id: 'theatre', img: 'g_theatre.png', t0: 40.1, t1: 54.3, op: 0.88, rev: 'curtain', rd: 2.0, fi: 2.0, fo: 1.5,
    focus: [0.494, 0.447], tgt0: [960, 400], tgt1: [930, 640], z0: 1.06, z1: 1.20,
    shots: [{ t: 51.10, z: 1.70, hold: 3.2, dx: -60, dy: 34, rin: 1.9, rout: 2.4, face: true }] },
  { id: 'heart', img: 'g_heart.png', t0: 53.5, t1: 67.5, op: 0.80, rev: 'bloom', rd: 1.6, fi: 1.4, fo: 1.8,
    pulse: true,
    focus: [0.369, 0.447], tgt0: [720, 460], tgt1: [820, 640], z0: 1.05, z1: 1.20,
    shots: [{ t: 57.83, z: 1.54, hold: 3.4, dx: 42, dy: 30, rin: 1.8, rout: 2.8 }] },
  { id: 'heart2', img: 'g_heart.png', t0: 161.5, t1: 175.9, op: 0.84, rev: 'bloom', rd: 1.6, fi: 1.4, fo: 2.6,
    pulse: true,
    focus: [0.369, 0.447], tgt0: [840, 430], tgt1: [700, 640], z0: 1.12, z1: 1.05,
    shots: [{ t: 168.49, z: 1.62, hold: 3.4, dx: -54, dy: 36, rin: 1.9, rout: 2.8, face: true }] },
  { id: 'girl', img: 'g_girl.png', t0: 80.5, t1: 94.4, op: 0.78, rev: 'rainDiag', rd: 2.0, fi: 2.2, fo: 1.6,
    focus: [0.685, 0.34], tgt0: [1140, 380], tgt1: [980, 660], z0: 1.05, z1: 1.18,
    shots: [{ t: 88.24, z: 1.76, hold: 3.6, dx: -56, dy: 40, rin: 1.9, rout: 2.8, face: true }] },
  { id: 'deep', img: 'g_deep.png', t0: 93.5, t1: 107.9, op: 0.82, rev: 'waterUp', rd: 2.6, fi: 2.6, fo: 1.5,
    focus: [0.49, 0.44], tgt0: [960, 400], tgt1: [938, 640], z0: 1.10, z1: 1.32 },
  { id: 'dream', img: 'g_dream.png', t0: 107.5, t1: 120.6, op: 0.74, rev: 'iris', rd: 1.8, fi: 2.0, fo: 1.2,
    focus: [0.533, 0.40], tgt0: [900, 420], tgt1: [1010, 630], z0: 1.10, z1: 1.22,
    shots: [{ t: 114.11, z: 1.58, hold: 3.0, dx: -44, dy: 30, rin: 1.8, rout: 2.6, face: true }] },
  { id: 'rail', img: 'plate_rail.png', t0: 120.1, t1: 121.75, op: 0.82, rev: 'glitch', rd: 0.3, fi: 0.22, fo: 0.16,
    focus: [0.5, 0.5], tgt0: [960, 520], tgt1: [940, 570], z0: 1.18, z1: 1.06 },
  { id: 'ward', img: 'plate_ward.png', t0: 121.5, t1: 122.5, op: 0.80, rev: 'glitch', rd: 0.3, fi: 0.22, fo: 0.16,
    focus: [0.4, 0.45], tgt0: [960, 520], tgt1: [940, 570], z0: 1.16, z1: 1.08 },
  { id: 'towers', img: 'plate_towers.png', t0: 122.45, t1: 123.95, op: 0.78, rev: 'glitch', rd: 0.3, fi: 0.22, fo: 0.16,
    focus: [0.42, 0.47], tgt0: [960, 520], tgt1: [900, 580], z0: 1.15, z1: 1.04 },
  { id: 'ferris', img: 'plate_ferris.png', t0: 123.8, t1: 127.15, op: 0.80, rev: 'glitch', rd: 0.3, fi: 0.22, fo: 0.16,
    focus: [0.5, 0.5], tgt0: [960, 500], tgt1: [1000, 590], z0: 1.14, z1: 1.04 },
  { id: 'desk', img: 'plate_desk.png', t0: 127.05, t1: 130.6, op: 0.78, rev: 'glitch', rd: 0.3, fi: 0.22, fo: 0.6,
    focus: [0.45, 0.45], tgt0: [960, 520], tgt1: [930, 600], z0: 1.13, z1: 1.06 },
  { id: 'two', img: 'g_two.png', t0: 134.8, t1: 149.6, op: 0.84, rev: 'rainDiag', rd: 2.0, fi: 2.0, fo: 1.6,
    focus: [0.5, 0.42], tgt0: [960, 420], tgt1: [915, 640], z0: 1.12, z1: 1.06,
    shots: [{ t: 145.42, z: 1.36, hold: 3.2, dx: 40, dy: 30, rin: 1.8, rout: 3.0 }] },
  { id: 'dawn', img: 'g_dawn.png', t0: 149.9, t1: 161.4, op: 0.62, rev: 'waterUp', rd: 3.0, fi: 2.6, fo: 2.0,
    focus: [0.78, 0.42], tgt0: [1240, 400], tgt1: [1000, 600], z0: 1.04, z1: 1.18 },
  { id: 'dawn2', img: 'g_dawn.png', t0: 175.7, t1: 212.0, op: 0.60, rev: 'bloom', rd: 3.6, fi: 3.0, fo: 16.0,
    focus: [0.78, 0.42], tgt0: [1240, 420], tgt1: [820, 620], z0: 1.02, z1: 1.20 },
];

const EW = 2016, EH = 1176, EOFF = 48, IW = 1280, IH = 704;

/* the camera *target* (before the element-space solve) : also used to couple the
   line-art layer to the background plate so both move as one camera */
export function plateTarget(p: Plate, t: number, frame: number, heartHo: number) {
  const span = Math.max(0.001, p.t1 - p.t0);
  const u = clamp01((t - p.t0) / span);
  const eu = Easing.inOut(Easing.cubic)(u);
  let z = lerp(p.z0, p.z1, eu);
  let Tx = lerp(p.tgt0[0], p.tgt1[0], eu);
  let Ty = lerp(p.tgt0[1], p.tgt1[1], eu);
  if (p.shots) {
    for (const s of p.shots) {
      const u2 = t - s.t;
      const rin = s.rin ?? 1.6, hold = s.hold ?? 1.8, rout = s.rout ?? 2.4;
      if (u2 < -0.2 || u2 > rin + hold + rout) continue;
      const sf = Math.round(s.t * FPS);
      const pin = spring({ frame: frame - sf, fps: FPS, config: { damping: 26, mass: 1.5, stiffness: 42 }, durationInFrames: Math.round(rin * FPS) });
      const pout = 1 - spring({ frame: frame - sf - Math.round((rin + hold) * FPS), fps: FPS, config: { damping: 26, mass: 1.5, stiffness: 42 }, durationInFrames: Math.round(rout * FPS) });
      const k = Math.max(0, Math.min(pin, pout));
      if (k <= 0) continue;
      z *= 1 + (s.z - 1) * k;
      const dr = Easing.inOut(Easing.sin)(clamp01((u2 - rin * 0.6) / (rin + hold)));
      Tx += (s.dx ?? 0) * dr;
      Ty += (s.dy ?? 0) * dr;
    }
  }
  z *= 1 + heartHo * (0.0026 * beatPulse(t, 5) + 0.007 * barPulse(t, 2.4));
  return { Tx, Ty, z };
}

/* which plate is on screen right now (for layer coupling) */
export function activePlate(t: number) {
  let best: Plate | null = null, ba = 0;
  for (const p of PLATES) {
    const a = Math.min(clamp01((t - p.t0) / (p.fi ?? 1.1)), clamp01((p.t1 - t) / (p.fo ?? 1.1))) * p.op;
    if (a > ba) { ba = a; best = p; }
  }
  return best ? { p: best, a: ba } : null;
}

/* camera solve : put the subject on its screen target, then clamp inside the frame */
export function plateCam(p: Plate, t: number, frame: number, heartHo: number) {
  const span = Math.max(0.001, p.t1 - p.t0);
  const u = clamp01((t - p.t0) / span);
  const eu = Easing.inOut(Easing.cubic)(u);
  let z = lerp(p.z0, p.z1, eu);
  let fx = p.focus[0], fy = p.focus[1];
  let Tx = lerp(p.tgt0[0], p.tgt1[0], eu);
  let Ty = lerp(p.tgt0[1], p.tgt1[1], eu);

  if (p.shots) {
    for (const s of p.shots) {
      const u2 = t - s.t;
      const rin = s.rin ?? 1.6, hold = s.hold ?? 1.8, rout = s.rout ?? 2.4;
      if (u2 < -0.2 || u2 > rin + hold + rout) continue;
      const sf = Math.round((s.t * FPS));
      const pin = spring({ frame: frame - sf, fps: FPS, config: { damping: 26, mass: 1.5, stiffness: 42 }, durationInFrames: Math.round(rin * FPS) });
      const pout = 1 - spring({
        frame: frame - sf - Math.round((rin + hold) * FPS), fps: FPS,
        config: { damping: 26, mass: 1.5, stiffness: 42 }, durationInFrames: Math.round(rout * FPS),
      });
      const k = Math.max(0, Math.min(pin, pout));
      if (k <= 0) continue;
      z *= 1 + (s.z - 1) * k;
      const dr = Easing.inOut(Easing.sin)(clamp01((u2 - rin * 0.6) / (rin + hold)));
      Tx += (s.dx ?? 0) * dr;
      Ty += (s.dy ?? 0) * dr;
      if (s.face) fy -= 0.05 * k;
    }
  }
  if (p.camLink) {
    for (const l of p.camLink) {
      const age = t - l.t0, left = l.t1 - t;
      if (age > -0.1 && age < 0.75) {
        const kk = Math.exp(-Math.max(0, age) * 3.2) * (1 - Math.exp(-Math.max(0, age) * 26));
        z *= 1 + l.push * kk;
        Ty += (l.top < 540 ? 7 : -7) * kk;
      }
      if (left < 0.3 && left > -0.8) {
        const kk = Math.exp(-Math.abs(Math.min(0, left)) * 3.4);
        z *= 1 - 0.012 * kk;
        Ty -= (l.top < 540 ? 4 : -4) * kk;
      }
    }
  }
  z *= 1 + heartHo * (0.0026 * beatPulse(t, 5) + 0.007 * barPulse(t, 2.4));

  const k = Math.max(EW / IW, EH / IH);
  const ox = (EW - IW * k) / 2, oy = (EH - IH * k) / 2;
  const Sx = ox + fx * IW * k, Sy = oy + fy * IH * k;
  let tx = Tx + EOFF - z * Sx;
  let ty = Ty + EOFF - z * Sy;
  tx = Math.min(EOFF, Math.max(1920 - EW * z + EOFF, tx));
  ty = Math.min(EOFF, Math.max(1080 - EH * z + EOFF, ty));
  return { tx, ty, z };
}

/* themed reveal masks */
export function revealClip(rev: string | undefined, p: number): string {
  if (!rev || p >= 1) return 'none';
  const q = 1 - p;
  switch (rev) {
    case 'waterUp': return `inset(${(q * 100).toFixed(2)}% 0% 0% 0%)`;
    case 'curtain': return `inset(0% ${(q * 50).toFixed(2)}% 0% ${(q * 50).toFixed(2)}%)`;
    case 'iris': return `circle(${(p * 78).toFixed(2)}% at 50% 46%)`;
    case 'bloom': return `circle(${(p * 88).toFixed(2)}% at 50% 52%)`;
    case 'rainDiag': {
      const y = q * 132;
      return `polygon(-12% ${y.toFixed(1)}%, 112% ${(y - 26).toFixed(1)}%, 112% 112%, -12% 112%)`;
    }
    default: return 'none';
  }
}

/* ---------------------------------------------------------------- art camera */
export const ART_CAM: Record<string, { z: [number, number]; x: [number, number]; y: [number, number]; r: [number, number] }> = {
  intro: { z: [1.00, 1.035], x: [0, 0], y: [0, -4], r: [0, 0.15] },
  A1: { z: [1.015, 1.135], x: [14, -34], y: [6, -12], r: [-0.30, 0.30] },
  inter1: { z: [1.06, 1.23], x: [-24, 26], y: [4, -16], r: [0.45, -0.55] },
  B1: { z: [1.04, 1.17], x: [-16, 16], y: [0, -8], r: [-0.40, 0.40] },
  C1: { z: [1.03, 1.12], x: [0, 0], y: [0, -8], r: [0.30, -0.30] },
  S1: { z: [1.02, 1.14], x: [-8, 8], y: [0, -6], r: [0.2, -0.2] },
  A2: { z: [1.13, 1.02], x: [22, -20], y: [-8, 6], r: [0.50, -0.30] },
  D1: { z: [1.02, 1.17], x: [0, 0], y: [-8, 12], r: [-0.20, 0.40] },
  inter2: { z: [1.10, 1.25], x: [0, 0], y: [8, -8], r: [0.30, -0.40] },
  D2: { z: [1.04, 1.15], x: [-12, 14], y: [0, -4], r: [-0.25, 0.25] },
  E: { z: [1.07, 1.11], x: [0, 0], y: [0, -6], r: [0.3, -0.3] },
  F: { z: [1.03, 1.13], x: [0, 0], y: [0, -8], r: [-0.2, 0.2] },
  G: { z: [1.02, 1.13], x: [0, 0], y: [0, -6], r: [-0.3, 0.3] },
  H: { z: [1.02, 1.17], x: [0, 0], y: [-4, -14], r: [0, 0.4] },
  I: { z: [1.05, 1.19], x: [0, 0], y: [-6, -18], r: [0.3, 0] },
  outro: { z: [1.10, 1.27], x: [0, 0], y: [-10, -22], r: [0.2, -0.2] },
};

/* ---------------------------------------------------------------- lyric treatments */
export type Treat = {
  top: number; left?: number; right?: number; size: number; align: 'left' | 'center' | 'right';
  maxW: number; mode: string; stag?: number; dur: number; vert?: boolean; exit?: 'cut' | 'fade';
};
export const TR: Record<string, Treat> = {
  ink: { top: 372, size: 86, align: 'center', maxW: 1620, mode: 'stagger', stag: 0.022, dur: 0.13 },
  rise: { top: 404, size: 92, align: 'center', maxW: 1600, mode: 'rise', stag: 0.02, dur: 0.22 },
  sink: { top: 300, size: 92, align: 'center', maxW: 1600, mode: 'sink', stag: 0.02, dur: 0.22 },
  stamp: { top: 336, size: 112, align: 'center', maxW: 1740, mode: 'stamp', stag: 0.01, dur: 0.2, exit: 'cut' },
  echo: { top: 372, size: 100, align: 'center', maxW: 1640, mode: 'echo', stag: 0.02, dur: 0.14 },
  scatter: { top: 350, size: 92, align: 'center', maxW: 1560, mode: 'scatter', stag: 0.018, dur: 0.22 },
  vertical: { top: 78, right: 86, size: 62, align: 'right', maxW: 520, mode: 'stagger', vert: true, stag: 0.03, dur: 0.13 },
  leftSlide: { top: 404, left: 132, size: 84, align: 'left', maxW: 1280, mode: 'leftSlide', stag: 0.02, dur: 0.22 },
  band: { top: 368, size: 88, align: 'center', maxW: 1600, mode: 'band', stag: 0.012, dur: 0.13 },
  corner: { top: 726, left: 132, size: 60, align: 'left', maxW: 1400, mode: 'corner', stag: 0.018, dur: 0.13 },
  hookBig: { top: 296, size: 152, align: 'center', maxW: 1500, mode: 'hookBig', stag: 0.02, dur: 0.2, exit: 'cut' },
  list1: { top: 286, left: 120, size: 96, align: 'left', maxW: 1200, mode: 'list', dur: 0.26, exit: 'cut' },
  list2: { top: 596, left: 210, size: 104, align: 'left', maxW: 1400, mode: 'list', dur: 0.26, exit: 'cut' },
  list3: { top: 350, left: 120, size: 88, align: 'left', maxW: 1500, mode: 'list', dur: 0.26, exit: 'cut' },
  list4: { top: 640, left: 300, size: 92, align: 'left', maxW: 1300, mode: 'list', dur: 0.26, exit: 'cut' },
  list5: { top: 372, size: 94, align: 'center', maxW: 1640, mode: 'list', dur: 0.28, exit: 'cut' },
};

/* ---------------------------------------------------------------- scene windows */
export const SCENES: { key: string; win: [number, number, number, number][]; rev?: [number, string, number][] }[] = [
  { key: 's-city', win: [[0.6, 40.0, 1.6, 2.5], [67.0, 81.0, 1.2, 1.5]], rev: [[0.9, 'waterUp', 1.6], [67.0, 'iris', 1.0]] },
  { key: 's-crowd', win: [[27.6, 39.8, 2.2, 1.6]] },
  { key: 's-theatre', win: [[40.0, 53.6, 2.4, 1.4]], rev: [[40.4, 'curtain', 1.3]] },
  { key: 's-heart', win: [[53.9, 66.6, 1.6, 2.0], [160.8, 176.0, 1.6, 3.2]], rev: [[53.9, 'bloom', 1.1], [160.8, 'bloom', 1.1]] },
  { key: 's-umbrella', win: [[80.6, 93.4, 2.0, 1.8]], rev: [[80.7, 'rainDiag', 1.4]] },
  { key: 's-deep', win: [[93.6, 107.4, 2.2, 1.6]], rev: [[93.8, 'waterUp', 1.8]] },
  { key: 's-dream', win: [[107.6, 120.0, 2.0, 1.4]], rev: [[107.7, 'iris', 1.3]] },
  { key: 's-rail', win: [[120.2, 121.45, 0.18, 0.14]] },
  { key: 's-ward', win: [[121.55, 123.68, 0.18, 0.14]] },
  { key: 's-towers', win: [[121.55, 123.68, 0.18, 0.14]] },
  { key: 's-bus', win: [[123.78, 126.98, 0.18, 0.14]] },
  { key: 's-desk', win: [[127.08, 130.30, 0.18, 0.5]] },
  { key: 's-two', win: [[134.9, 149.6, 1.4, 1.8]], rev: [[135.0, 'rainDiag', 1.4]] },
  { key: 's-thread', win: [[149.9, 161.6, 1.6, 1.4]] },
  { key: 's-dawn', win: [[149.9, 187.0, 4.0, 5.0]], rev: [[150.0, 'waterUp', 2.6]] },
  { key: 's-bloom', win: [[175.2, 205.0, 2.6, 9.0]], rev: [[175.4, 'bloom', 1.6]] },
];

export const sceneOpacity = (win: [number, number, number, number][], t: number) => {
  let v = 0;
  for (const [a, b, fi, fo] of win) {
    const k = Math.min(clamp01((t - a) / fi), clamp01((b - t) / fo));
    if (k > v) v = k;
  }
  return v;
};

export const noise = (i: number) => random(`n${i}`);
export { random };
