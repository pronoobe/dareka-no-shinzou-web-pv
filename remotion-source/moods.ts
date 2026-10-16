/* per-section mood : continuous parameters for weather / tint / grain.
   Ported 1:1 from the GSAP build so both versions share one art direction. */
export type Mood = {
  id: string; t0: number; t1: number;
  rain: number; rainTint: string; bokeh: number; bokehTint: string;
  caustics: number; water: number; tint: string; tintA: number; grain: number;
};

const M = (id: string, t0: number, t1: number, o: Partial<Mood>): Mood => ({
  id, t0, t1,
  rain: 0.5, rainTint: '#c6dcff', bokeh: 0.45, bokehTint: '#4f86c8',
  caustics: 0, water: 0, tint: '#081226', tintA: 0.08, grain: 0.06, ...o,
});

export const MOODS: Mood[] = [
  M('intro', 0, 1.35, { rain: 0.1, bokeh: 0.25, bokehTint: '#3f6fae', tintA: 0, grain: 0.05 }),
  M('A1', 1.35, 14.7, { rain: 0.55, bokeh: 0.45, tintA: 0.06 }),
  M('inter1', 14.7, 28.46, { rain: 0.75, rainTint: '#a8c6ff', bokeh: 0.6, bokehTint: '#3a6fbe', caustics: 0.1, water: 0.35, tint: '#0a1b3c', tintA: 0.14, grain: 0.07 }),
  M('B1', 28.46, 40.72, { rain: 0.6, rainTint: '#b9c9ef', bokeh: 0.5, bokehTint: '#7a4a9e', water: 0.1, tint: '#1a0f2c', tintA: 0.16, grain: 0.09 }),
  M('C1', 40.72, 54.33, { rain: 0.45, rainTint: '#d8c8a8', bokeh: 0.65, bokehTint: '#b98a4a', tint: '#1a1206', tintA: 0.12, grain: 0.07 }),
  M('S1', 54.33, 67.58, { rain: 0.35, rainTint: '#ffd0dc', bokeh: 0.7, bokehTint: '#e0556e', tint: '#2a0610', tintA: 0.16, grain: 0.05 }),
  M('A2', 67.58, 81.66, { rain: 0.6, bokeh: 0.4, water: 0.08, tintA: 0.08 }),
  M('D1', 81.66, 94.42, { rain: 1.0, rainTint: '#b0d6ff', bokeh: 0.35, bokehTint: '#2f6fc0', caustics: 0.35, water: 0.55, tint: '#062246', tintA: 0.24, grain: 0.08 }),
  M('inter2', 94.42, 107.9, { rain: 0.7, rainTint: '#8fc0ff', bokeh: 0.5, bokehTint: '#1f6fc8', caustics: 0.85, water: 0.95, tint: '#04203f', tintA: 0.32, grain: 0.07 }),
  M('D2', 107.9, 120.56, { rain: 0.55, rainTint: '#bcd8ff', bokeh: 0.6, bokehTint: '#6fa9e8', caustics: 0.35, water: 0.3, tint: '#0a2246', tintA: 0.2, grain: 0.07 }),
  M('E', 120.56, 135.34, { rain: 0.65, rainTint: '#cfd8e8', bokeh: 0.3, bokehTint: '#8a7a6a', caustics: 0.05, water: 0.05, tint: '#1a1410', tintA: 0.16, grain: 0.11 }),
  M('F', 135.34, 150.36, { rain: 0.5, rainTint: '#c2d2ff', bokeh: 0.35, bokehTint: '#4a6ba8', tint: '#0a1024', tintA: 0.1, grain: 0.07 }),
  M('G', 150.36, 161.9, { rain: 0.35, rainTint: '#e0d0c0', bokeh: 0.5, bokehTint: '#c08a5a', tint: '#1c1206', tintA: 0.1, grain: 0.06 }),
  M('H', 161.9, 175.59, { rain: 0.25, rainTint: '#ffe0c0', bokeh: 0.8, bokehTint: '#e8a05c', tint: '#2a1608', tintA: 0.14, grain: 0.05 }),
  M('I', 175.59, 187.9, { rain: 0.3, rainTint: '#ffe8d0', bokeh: 0.9, bokehTint: '#ffc98a', tint: '#2e1a08', tintA: 0.12, grain: 0.05 }),
  M('outro', 187.9, 230.2, { rain: 0.22, rainTint: '#cfe0ff', bokeh: 0.4, bokehTint: '#7f9ad0', caustics: 0.05, water: 0.02, tint: '#070b16', tintA: 0.06, grain: 0.05 }),
];

/* per-section colour grade for the line-art layers so the strokes sit inside the
   plate's light instead of on top of it */
export const ART_TINT: Record<string, string> = {
  intro: 'none',
  A1: 'hue-rotate(-4deg) saturate(1.05)',
  inter1: 'hue-rotate(-6deg) saturate(1.08)',
  B1: 'hue-rotate(16deg) saturate(1.2)',
  C1: 'sepia(.26) hue-rotate(-14deg) saturate(1.05)',
  S1: 'sepia(.18) hue-rotate(-20deg) saturate(1.25)',
  A2: 'hue-rotate(-4deg) saturate(1.05)',
  D1: 'hue-rotate(6deg) saturate(1.12)',
  inter2: 'hue-rotate(10deg) saturate(1.15)',
  D2: 'hue-rotate(6deg) saturate(1.08)',
  E: 'sepia(.22) saturate(.92)',
  F: 'none',
  G: 'sepia(.3) hue-rotate(-18deg) saturate(1.05)',
  H: 'sepia(.42) hue-rotate(-26deg) saturate(1.18)',
  I: 'sepia(.45) hue-rotate(-28deg) saturate(1.2)',
  outro: 'sepia(.22) hue-rotate(-12deg)',
};
