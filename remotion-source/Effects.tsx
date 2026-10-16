import React from 'react';
import { AbsoluteFill, useCurrentFrame, staticFile, interpolate } from 'remotion';
import { PV_DATA } from './pv-data';
import { clamp01, lerp, beatPulse, barPulse, heartOn, random } from './motion';

/* ---------------------------------------------------------------- heartbeat */
const template = (ph: number) => {
  if (ph < 0.14) return Math.sin((ph / 0.14) * Math.PI) * 0.11;
  if (ph < 0.24) return 0;
  if (ph < 0.28) return (-0.16 * (ph - 0.24)) / 0.04;
  if (ph < 0.33) return -0.16 + (1.16 * (ph - 0.28)) / 0.05;
  if (ph < 0.38) return 1.0 - (1.28 * (ph - 0.33)) / 0.05;
  if (ph < 0.44) return -0.28 + (0.24 * (ph - 0.38)) / 0.06;
  if (ph < 0.62) return -0.04;
  if (ph < 0.86) return 0.3 * Math.sin(((ph - 0.62) / 0.24) * Math.PI);
  return 0;
};

const EKG_CFG: Record<string, any> = {
  A1: { amp: 52, scroll: 250, cy: 96 },
  B1: { amp: 62, scroll: 300, cy: 84, arr: 0.45, color: 'rgba(255,190,205,.95)', glow: 'rgba(255,60,90,.28)' },
  C1: { amp: 56, scroll: 265, cy: 100, arr: 0.15 },
  S1: { amp: 74, scroll: 330, cy: 88, w: 3.1, color: 'rgba(255,225,235,1)', glow: 'rgba(255,70,100,.40)' },
  A2: { amp: 64, scroll: 460, cy: 104, arr: 0.25 },
  D1: { amp: 54, scroll: 255, cy: 108, color: 'rgba(175,225,255,.95)' },
  inter2: { amp: 38, scroll: 145, cy: 120, alpha: 0.62, color: 'rgba(150,205,255,.9)', glow: 'rgba(60,140,235,.25)' },
  D2: { amp: 54, scroll: 265, cy: 104, arr: 0.3 },
  E: { amp: 58, scroll: 350, cy: 96, arr: 0.5 },
  F: { amp: 48, scroll: 240, cy: 98, color: 'rgba(200,220,255,.95)' },
  G: { amp: 42, scroll: 215, cy: 86, alpha: 0.8 },
  H: { amp: 84, scroll: 360, cy: 82, w: 3.2, color: 'rgba(255,232,205,1)', glow: 'rgba(240,170,90,.42)' },
  I: { amp: 80, scroll: 320, cy: 88, w: 3, color: 'rgba(255,235,210,1)', glow: 'rgba(255,190,120,.4)' },
  outro: { amp: 60, scroll: 190, cy: 92, color: 'rgba(255,230,200,.95)', glow: 'rgba(255,190,120,.3)' },
};

export const Ekg: React.FC<{ t: number }> = ({ t }) => {
  const sec = PV_DATA.sections.reduce((a: any, s: any) => (t >= s.t0 ? s : a), PV_DATA.sections[0]);
  const c = { ...(EKG_CFG[sec.id] || EKG_CFG.A1) };
  let alpha = c.alpha ?? 0.9;
  let flat = c.flat ?? 0;
  let beatScale = 1;
  if (t < 1.35) { c.amp = 26; c.scroll = 120; c.cy = 96; flat = 1; alpha = 0.9; }
  if (sec.id === 'F') flat = 0.25 + 0.55 * clamp01((t - 135.34) / 15);
  if (sec.id === 'outro') {
    flat = clamp01((t - 191) / 8) * 0.8;
    c.scroll = 110;
    if (t > 203) { alpha = clamp01(1 - (t - 203) / 22) * 0.9; c.amp = 44; flat = 0.25; beatScale = 8; c.color = 'rgba(200,225,255,.85)'; c.glow = 'rgba(120,170,230,.22)'; }
    if (t > 223 && t < 226.4) { beatScale = 8; c.amp = 62; }
    if (t >= 226.4) { flat = 1; c.amp = 26; }
    if (t > 226) alpha *= clamp01(1 - (t - 226) / 3.6);
  }
  if (t > 229.4) alpha *= clamp01(1 - (t - 229.4) / 0.9);
  if (alpha <= 0.01) return null;

  const x0 = 40, x1 = 1880, n = 420;
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const f = i / n;
    const x = lerp(x0, x1, f);
    const tt = t - (1 - f) * ((x1 - x0) / c.scroll);
    let v: number;
    if (flat > 0.999) v = (random(`f${Math.floor(tt * 30)}`) - 0.5) * 0.012;
    else {
      let ph = ((tt - 0.135) / ((60 / 145) * beatScale)) % 1;
      if (ph < 0) ph += 1;
      if (c.arr) {
        const j = random(`a${Math.floor((tt - 0.135) / (60 / 145))}`);
        ph = (ph + (j - 0.5) * 0.34 * c.arr) % 1;
      }
      v = template(ph);
      v = lerp(v, (random(`g${Math.floor(tt * 60)}`) - 0.5) * 0.02, flat);
    }
    pts.push(`${x.toFixed(1)},${(c.cy - v * c.amp).toFixed(1)}`);
  }
  const d = 'M' + pts.join(' L');
  const last = pts[pts.length - 1].split(',');

  return (
    <AbsoluteFill style={{ top: 776, height: 200 }}>
      <svg width={1920} height={200} viewBox="0 0 1920 200" style={{ opacity: alpha }}>
        <defs>
          <linearGradient id="ekgFade" x1="0" x2="1">
            <stop offset="0" stopColor="#000" />
            <stop offset="0.1" stopColor="#777" />
            <stop offset="0.24" stopColor="#fff" />
            <stop offset="0.76" stopColor="#fff" />
            <stop offset="0.9" stopColor="#777" />
            <stop offset="1" stopColor="#000" />
          </linearGradient>
          <mask id="ekgMask">
            <rect x="0" y="0" width="1920" height="200" fill="url(#ekgFade)" />
          </mask>
        </defs>
        <g mask="url(#ekgMask)" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d={d} stroke={c.glow || 'rgba(95,211,232,0.30)'} strokeWidth={(c.w ?? 2.2) * 7} />
          <path d={d} stroke={c.color || 'rgba(200,235,255,0.95)'} strokeWidth={c.w ?? 2.2} />
          <circle cx={last[0]} cy={last[1]} r="18" fill={c.glow || 'rgba(95,211,232,.3)'} opacity="0.75" />
          <circle cx={last[0]} cy={last[1]} r="6" fill={c.color || '#cfeaff'} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- weather */
const RAIN_N = 520;
const DROPS = Array.from({ length: RAIN_N }, (_, i) => {
  const layer = i % 3;
  return {
    x: random(`rx${i}`) * 2500 - 300,
    y: random(`ry${i}`) * 1600 - 300,
    len: layer === 0 ? 140 + random(`rl${i}`) * 180 : layer === 1 ? 80 + random(`rl${i}`) * 90 : 40 + random(`rl${i}`) * 50,
    w: layer === 0 ? 2.2 : layer === 1 ? 1.6 : 1.1,
    a: layer === 0 ? 0.1 + random(`ra${i}`) * 0.2 : layer === 1 ? 0.12 + random(`ra${i}`) * 0.26 : 0.15 + random(`ra${i}`) * 0.3,
    sp: layer === 0 ? 1.55 : layer === 1 ? 1.15 : 0.8,
    ph: random(`rp${i}`) * 6.28,
  };
});

const ORBS = Array.from({ length: 26 }, (_, i) => ({
  x: random(`ox${i}`) * 1920, y: random(`oy${i}`) * 1080,
  r: 40 + Math.pow(random(`or${i}`), 2) * 240,
  ph: random(`op${i}`) * 6.28, a: 0.03 + random(`oa${i}`) * 0.12,
  vy: -2 - random(`ov${i}`) * 7, vx: -7 + random(`ou${i}`) * 14,
}));

export const Weather: React.FC<{ t: number; rain: number; rainTint: string; bokeh: number; bokehTint: string; caustics: number; water: number; sparks: number }> =
  ({ t, rain, rainTint, bokeh, bokehTint, caustics, water, sparks }) => {
    const ang = ((6 + Math.sin(t * 0.13) * 2.5) * Math.PI) / 180;
    const travel = 1600;
    const hits = PV_DATA.hits.filter((h: any) => h.type === 'hook' || h.type === 'hook2');
    return (
      <AbsoluteFill>
        {/* rain */}
        {rain > 0.02 ? (
          <AbsoluteFill>
            {DROPS.map((d, i) => {
              let y = (d.y + t * 900 * d.sp * (1 + 0.2 * Math.sin(t * 0.07))) % travel;
              if (y < 0) y += travel;
              y -= 250;
              const x = d.x + y * Math.tan(ang) + Math.sin(t * 0.5 + d.ph) * 10;
              const op = Math.min(1, d.a * rain * 2.2 * (0.75 + 0.25 * Math.sin(t * (1.5 + (i % 5) * 0.7) + d.ph)));
              return (
                <div key={i} style={{
                  position: 'absolute', left: x, top: y, width: d.w, height: d.len,
                  background: `linear-gradient(180deg, rgba(255,255,255,0), rgba(255,255,255,.55), ${rainTint})`,
                  opacity: op, borderRadius: 2,
                }} />
              );
            })}
          </AbsoluteFill>
        ) : null}

        {/* bokeh */}
        {bokeh > 0.02 ? (
          <AbsoluteFill style={{ mixBlendMode: 'screen' }}>
            {ORBS.map((o, i) => {
              const x = (((o.x + t * o.vx) % 2500) + 2500) % 2500 - 300;
              const y = (((o.y + t * o.vy) % 1600) + 1600) % 1600 - 300;
              return (
                <div key={i} style={{
                  position: 'absolute', left: x - o.r, top: y - o.r, width: o.r * 2, height: o.r * 2,
                  borderRadius: '50%',
                  background: `radial-gradient(closest-side, ${bokehTint}, transparent 72%)`,
                  opacity: o.a * bokeh * (0.7 + 0.3 * Math.sin(t * 0.8 + o.ph)),
                }} />
              );
            })}
          </AbsoluteFill>
        ) : null}

        {/* caustics + water line */}
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0 }}>
          {caustics > 0.01 ? (
            <g opacity={caustics} stroke="#4fa8e8" fill="none" strokeLinecap="round">
              {[0, 1, 2, 3, 4].map((b) => {
                const yb = 120 + b * 220 + Math.sin(t * 0.3 + b) * 40;
                let d = `M0 ${yb.toFixed(1)}`;
                for (let x = 0; x <= 1920; x += 40) {
                  const y = yb + Math.sin(x * 0.0032 + t * (0.55 + b * 0.13) + b) * 34 + Math.sin(x * 0.0071 - t * (0.31 + b * 0.07)) * 18;
                  d += ` L${x} ${y.toFixed(1)}`;
                }
                return <path key={b} d={d} strokeWidth={26 - b * 2} opacity={0.055} />;
              })}
            </g>
          ) : null}
          {water > 0.01 ? (
            <g>
              <rect x="0" y={1080 - 200 * water} width="1920" height={200 * water} fill="#0f2f5c" opacity={0.5 * Math.min(1, water)} />
              <path
                d={
                  `M0 ${(1080 - 200 * water).toFixed(1)} ` +
                  Array.from({ length: 81 }, (_, i) => `L${i * 24} ${(1080 - 200 * water + Math.sin(i * 24 * 0.006 + t * 1.3) * 7).toFixed(1)}`).join(' ')
                }
                stroke="#8fd8ff" strokeWidth="2" fill="none" opacity={0.45 * water}
              />
            </g>
          ) : null}
          {/* splash ripples on the ground */}
          {rain > 0.05 ? (
            <g stroke="#bfe0ff" fill="none">
              {Array.from({ length: 14 }, (_, k) => {
                const st = Math.floor(t * 3.2) - k * 0.31;
                const age = t - st;
                if (age < 0 || age > 0.55) return null;
                const x = ((Math.floor(st * 3.2) * 7919) % 1860) + 30;
                const y = 872 + ((k * 31) % 9) * 12;
                const r = age * 60;
                return <ellipse key={k} cx={x} cy={y} rx={r} ry={r * 0.22} strokeWidth={1.4} opacity={(1 - age / 0.55) * 0.3 * rain} />;
              })}
            </g>
          ) : null}
        </svg>

        {/* chorus sparks */}
        {sparks > 0.01 ? (
          <AbsoluteFill style={{ mixBlendMode: 'screen' }}>
            {hits.map((h: any, hi: number) => {
              const age = t - h.t;
              if (age < 0 || age > 1.7) return null;
              const k = age / 1.7;
              const gold = h.type === 'hook2';
              return Array.from({ length: 26 }, (_, j) => {
                const a = (j / 26) * 6.283;
                const v = 130 * (0.6 + 0.5 * ((j * 37) % 7) / 7);
                const px = 960 + Math.cos(a) * v * age;
                const py = 470 + Math.sin(a) * v * age + 260 * age * age;
                return (
                  <div key={`${hi}-${j}`} style={{
                    position: 'absolute', left: px, top: py, width: 6, height: 6, borderRadius: '50%',
                    background: gold ? 'rgba(255,217,160,.9)' : 'rgba(255,194,207,.9)',
                    opacity: (1 - k) * 0.8 * sparks,
                  }} />
                );
              });
            })}
          </AbsoluteFill>
        ) : null}
      </AbsoluteFill>
    );
  };

/* ---------------------------------------------------------------- orbiting rings */
const RING_CFG = [
  { id: 'love', text: '「愛をください」', R: 248, ry: 0.94, size: 32, speed: 0.075, cx: 960, cy: 548, t0: 53.9, t1: 67.4, fi: 1.0, fo: 1.4, color: 'rgba(238,244,255,.62)' },
  { id: 'title', text: 'だれかの心臓になれたなら', R: 366, ry: 0.92, size: 24, speed: -0.05, cx: 960, cy: 528, t0: 160.9, t1: 190.0, fi: 1.4, fo: 3.0, color: 'rgba(226,236,255,.44)' },
];

export const Rings: React.FC<{ t: number }> = ({ t }) => (
  <AbsoluteFill>
    {RING_CFG.map((r) => {
      const a = Math.min(clamp01((t - r.t0) / r.fi), clamp01((r.t1 - t) / r.fo));
      if (a <= 0.004) return null;
      const beat = beatPulse(t, 3);
      const R = r.R + 16 * beat;
      const spin = t * r.speed;
      const chars = r.text.repeat(3).split('');
      return (
        <AbsoluteFill key={r.id} style={{ opacity: a }}>
          {chars.map((ch, k) => {
            const th = spin + (k / chars.length) * 6.28318;
            const x = r.cx + Math.cos(th) * R;
            const y = r.cy + Math.sin(th) * R * r.ry;
            return (
              <span key={k} style={{
                position: 'absolute', left: 0, top: 0,
                fontFamily: "'Shippori Mincho', serif", fontWeight: 600, fontSize: r.size, color: r.color,
                whiteSpace: 'nowrap',
                textShadow: '0 0 18px rgba(3,6,14,.95), 0 0 34px rgba(3,6,14,.8)',
                transform: `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) translate(-50%,-50%) rotate(${((th + 1.5708) * 57.2958).toFixed(1)}deg) scale(${(1 + 0.14 * beat).toFixed(3)})`,
                opacity: 0.45 + 0.55 * (0.5 + 0.5 * Math.cos(th * 2 - t * 0.9)),
              }}>{ch}</span>
            );
          })}
        </AbsoluteFill>
      );
    })}
  </AbsoluteFill>
);

/* ---------------------------------------------------------------- post fx */
const NOISE_URI =
  "url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='200' height='200' filter='url(%23n)'/></svg>\")";

export const Fx: React.FC<{ t: number; tint: string; tintA: number }> = ({ t, tint, tintA }) => {
  const mo = PV_DATA.sections.reduce((a: any, s: any) => (t >= s.t0 ? s : a), PV_DATA.sections[0]);
  /* flashes on structural hits */
  const FLASH = [[1.35, 0.55], [28.46, 0.3], [40.72, 0.34], [54.33, 0.5], [56.17, 0.22], [57.83, 0.5],
    [59.5, 0.22], [61.14, 0.5], [64.23, 0.3], [67.58, 0.3], [81.66, 0.26], [107.9, 0.3],
    [120.56, 0.34], [121.58, 0.26], [123.81, 0.34], [127.11, 0.3], [130.47, 0.26],
    [135.34, 0.36], [150.36, 0.24], [161.90, 0.5], [165.27, 0.24], [168.49, 0.28],
    [171.87, 0.34], [175.59, 0.28], [181.74, 0.44], [187.9, 0.55]] as [number, number][];
  let flash = 0;
  for (const [ft, fa] of FLASH) {
    if (t >= ft && t < ft + 0.36) flash = Math.max(flash, fa * (1 - (t - ft) / 0.36));
  }
  /* light sweep on cuts */
  let sweepP = -1;
  for (const h of PV_DATA.hits) {
    if (h.type !== 'section' && h.type !== 'hook' && h.type !== 'hook2') continue;
    const age = t - h.t;
    if (age < 0 || age > 0.5) continue;
    sweepP = Math.max(sweepP, age / 0.5);
  }
  const drive = mo.id === 'S1' || mo.id === 'H' || mo.id === 'D1' || mo.id === 'I';
  let strobe = drive ? 0.075 * bandPulse(t, 14) : 0;
  if (mo.id === 'E' || mo.id === 'F') strobe = 0.05 * bandPulse(t, 16);
  if (mo.id === 'B1') strobe = 0.09 * bandPulse(t, 12);
  const grain = 0.055 + (mo.id === 'E' ? 0.04 : 0);

  return (
    <>
      <AbsoluteFill style={{ background: tint, opacity: tintA, mixBlendMode: 'screen' }} />
      <AbsoluteFill style={{
        background: 'radial-gradient(115% 80% at 50% 48%, rgba(0,0,0,0) 42%, rgba(0,0,0,.55) 78%, rgba(0,0,0,.88) 100%)',
      }} />
      <AbsoluteFill style={{
        background: 'repeating-linear-gradient(180deg, rgba(255,255,255,.024) 0 1px, rgba(0,0,0,0) 1px 3px)',
        opacity: 0.5,
      }} />
      <AbsoluteFill style={{
        inset: -48, backgroundImage: NOISE_URI, backgroundRepeat: 'repeat', opacity: grain,
        mixBlendMode: 'screen',
        backgroundPosition: `${Math.floor(t * 24 * 137) % 200}px ${Math.floor(t * 24 * 311) % 200}px`,
      }} />
      {sweepP >= 0 ? (
        <div style={{
          position: 'absolute', top: '-10%', height: '120%', width: 260,
          left: 0,
          background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(210,240,255,.85) 45%, rgba(255,255,255,.95) 50%, rgba(210,240,255,.85) 55%, rgba(255,255,255,0))',
          mixBlendMode: 'screen',
          filter: 'blur(1px)',
          opacity: 0.52 * (1 - sweepP * 0.7),
          transform: `skewX(-11deg) translateX(${(-500 + (1 - Math.pow(1 - sweepP, 2)) * 2600).toFixed(0)}px)`,
        }} />
      ) : null}
      <AbsoluteFill style={{ background: '#fff', opacity: flash }} />
      <AbsoluteFill style={{ background: mo.id === 'B1' ? '#ff2b46' : '#fff', opacity: strobe, mixBlendMode: 'screen' }} />
    </>
  );
};

/* the strobe/beat helper reads the bar grid so it speeds up with the tempo */
export const bandPulse = (t: number, decay: number) => Math.pow(1 - (((t - 0.135) / ((60 / 145) * 4)) % 1), decay);

void beatPulse; void barPulse; void heartOn; void staticFile; void interpolate; void useCurrentFrame;
