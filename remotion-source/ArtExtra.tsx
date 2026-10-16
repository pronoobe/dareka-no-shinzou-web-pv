import React from 'react';
import { AbsoluteFill } from 'remotion';
import { evolvePath, getPointAtLength, getLength } from '@remotion/paths';
import { noise2D, noise3D } from '@remotion/noise';
import { makeCircle, makeEllipse, makeRect, makeStar, makeTriangle } from '@remotion/shapes';
import { makeTransform } from '@remotion/animation-utils';
import { PV_DATA } from './pv-data';
import { clamp01, lerp, beatPulse, barPulse, heartOn, random } from './motion';

/* ============================================================================
   Enriched line-art, written around the song's imagery:
   rain on glass · utility poles & sagging wires · neon of the lyric words ·
   coronary arteries drawing themselves with a travelling pulse ·
   blood circulation · ground ripples · IV drip · birds at dawn · petals
   ========================================================================== */

const S = { position: 'absolute' as const, inset: 0, pointerEvents: 'none' as const };
/* clamp a length into the path so getPointAtLength never returns null */
const clu = (v: number) => Math.max(0, Math.min(0.999, v));

/* ---------------------------------------------------------------- A. rain on glass */
const DROPS = Array.from({ length: 30 }, (_, i) => ({
  x: random(`gx${i}`) * 2000 - 40,
  y: random(`gy${i}`) * 1400 - 200,
  len: 60 + random(`gl${i}`) * 260,
  sp: 26 + random(`gs${i}`) * 90,
  w: 0.6 + random(`gw${i}`) * 1.5,
  ph: random(`gp${i}`) * 6.28,
  a: 0.25 + random(`ga${i}`) * 0.6,
}));

export const GlassRain: React.FC<{ t: number; amount: number }> = ({ t, amount }) => {
  if (amount <= 0.02) return null;
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ ...S, opacity: 0.34 * amount, filter: 'blur(0.6px)' }}>
      {DROPS.map((d, i) => {
        const y = ((d.y + t * d.sp) % 1500) - 240;
        const x = d.x + Math.sin(t * 0.35 + d.ph) * 10 + noise2D(`dx${i}`, t * 0.3, i) * 12;
        const wig = Array.from({ length: 7 }, (_, k) => {
          const yy = y - (k * d.len) / 6;
          const xx = x + Math.sin(t * 0.9 + d.ph + k * 0.9) * 2.2 * k;
          return `${k === 0 ? 'M' : 'L'}${xx.toFixed(1)} ${yy.toFixed(1)}`;
        }).join(' ');
        return (
          <g key={i} stroke="#dff0ff" fill="none" opacity={d.a}>
            <path d={wig} strokeWidth={d.w} />
            <circle cx={x} cy={y} r={1.6 + d.w} fill="#eaf6ff" stroke="none" />
          </g>
        );
      })}
    </svg>
  );
};

/* ---------------------------------------------------------------- B. poles & wires */
const wire = (x0: number, y0: number, x1: number, y1: number, sag: number, phase: number, t: number) => {
  const mx = (x0 + x1) / 2 + Math.sin(t * 0.5 + phase) * 6;
  const my = (y0 + y1) / 2 + sag + Math.sin(t * 0.8 + phase) * 4;
  return `M${x0} ${y0} Q${mx} ${my} ${x1} ${y1}`;
};

export const Poles: React.FC<{ t: number; amount: number }> = ({ t, amount }) => {
  if (amount <= 0.02) return null;
  const pole = (px: number, s: number) => (
    <g transform={`translate(${px},0) scale(${s})`} stroke="#8ea6c8" fill="none" opacity={0.72}>
      <path d="M0 1080 L0 260" strokeWidth="3.4" />
      <path d="M-46 300 L46 300 M-34 344 L34 344 M-60 232 L60 232" strokeWidth="2.6" />
      <path d="M-46 300 L0 260 L46 300 M-60 232 L0 260 L60 232" strokeWidth="1.6" opacity={0.7} />
      <path d="M-70 210 C-50 200 -20 196 0 200 C20 196 50 200 70 210" strokeWidth="1.4" opacity={0.5} />
      {[-52, -20, 20, 52].map((x, i) => (
        <circle key={i} cx={x} cy={i < 2 ? 300 : 232} r={5} strokeWidth="1.8" />
      ))}
      <path d="M-24 420 L24 420 M-18 470 L18 470" strokeWidth="1.8" opacity={0.6} />
    </g>
  );
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ ...S, opacity: amount }}>
      <g transform="translate(0,150)">
        {pole(140, 1)}
        {pole(1830, 0.86)}
      </g>
      <g stroke="#93a8cc" fill="none" strokeWidth="1.2" opacity={0.42} transform="translate(0,150)">
        {[-46, -20, 20, 46].map((dy, i) => (
          <path key={i} d={wire(140, 300 + i * 4 + dy * 0.2, 1830, 262 + i * 4 + dy * 0.2, 190 + i * 12 + Math.sin(t * 0.7 + i) * 8, i, t)} />
        ))}
        <path d={wire(140, 344, 1830, 306, 210, 4, t)} opacity={0.7} />
      </g>
      {/* two birds sitting on the wire */}
      {[560, 640].map((bx, i) => (
        <g key={i} transform={`translate(${bx},${646 + Math.sin(t * 0.9 + i) * 3})`} stroke="#b9cbe8" fill="none" strokeWidth="1.6" opacity={0.8}>
          <path d="M0 0 C-6 -8 -2 -14 4 -14 C10 -14 14 -8 8 0" />
          <path d="M2 -2 L0 6 M6 -2 L8 6" />
        </g>
      ))}
    </svg>
  );
};

/* ---------------------------------------------------------------- C. neon words */
const NEON = [
  { text: '心臓', x: 1560, y: 210, w: 74, h: 210, col: '#ff6b86', at: [27.0, 40.9] },
  { text: '愛を', x: 196, y: 470, w: 96, h: 190, col: '#ff9db8', at: [53.0, 68.0] },
  { text: '雨', x: 1738, y: 640, w: 92, h: 92, col: '#8fd8ff', at: [0.6, 15.2] },
  { text: 'こんな世界', x: 1120, y: 742, w: 300, h: 88, col: '#a9d8ff', at: [0.6, 15.2], horiz: true },
  { text: '夢', x: 120, y: 250, w: 88, h: 88, col: '#c9a8ff', at: [107.4, 120.8] },
  { text: 'また会える', x: 1352, y: 806, w: 330, h: 84, col: '#ffbe8f', at: [149.6, 188.0], horiz: true },
];

export const Neon: React.FC<{ t: number }> = ({ t }) => (
  <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={S}>
    {NEON.map((n, i) => {
      const [a, b] = n.at;
      const on = Math.min(clamp01((t - a) / 1.5), clamp01((b - t) / 1.5)) * (i === 5 ? 0.75 : 1);
      if (on <= 0.02) return null;
      const flick = 0.55 + 0.45 * Math.max(0, noise2D(`nf${i}`, t * (1.6 + i * 0.3), i * 3.1) + 0.35);
      const buzz = t > 0 && Math.sin(t * (37 + i * 5)) > 0.995 ? 0.35 : 1;
      const vert = !n.horiz;
      const chars = Array.from(n.text);
      return (
        <g key={i} opacity={on * flick * buzz}>
          <g transform={`translate(${n.x},${n.y})`}>
            <g filter="url(#neonGlow)">
              <rect x={0} y={0} width={n.w} height={n.h} rx={10} fill="none" stroke={n.col} strokeWidth={5} opacity={0.5} />
              <rect x={6} y={6} width={n.w - 12} height={n.h - 12} rx={7} fill="none" stroke="#fff" strokeWidth={1.4} opacity={0.5} />
            </g>
            {chars.map((c, k) => {
              const size = vert ? Math.min(n.w - 18, (n.h - 20) / chars.length) : Math.min(n.h - 18, (n.w - 20) / chars.length);
              const cx = vert ? n.w / 2 : 12 + size / 2 + k * size;
              const cy = vert ? 14 + size / 2 + k * size : n.h / 2;
              return (
                <text key={k} x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
                  fontFamily="'Shippori Mincho', serif" fontWeight={600} fontSize={size * 0.92}
                  fill="#fff" opacity={0.92} style={{ filter: `drop-shadow(0 0 10px ${n.col})` }}>{c}</text>
              );
            })}
          </g>
        </g>
      );
    })}
  </svg>
);

/* ---------------------------------------------------------------- D. coronary arteries + pulse */
const CORONARY = [
  'M960 660 C900 610 856 560 848 500 C842 452 862 414 890 392',
  'M960 620 C1010 588 1050 548 1062 500 C1072 458 1058 424 1032 404',
  'M960 700 C930 664 906 622 902 574',
  'M848 500 C812 486 782 476 748 474',
  'M1062 500 C1096 486 1126 478 1160 478',
];
const VEIN = [
  'M960 520 C900 470 820 430 720 416',
  'M960 520 C1020 470 1100 430 1200 416',
  'M960 560 C880 540 800 540 700 560',
  'M960 560 C1040 540 1120 540 1220 560',
  'M960 600 C900 610 840 640 790 690',
];

export const HeartAnatomy: React.FC<{ t: number }> = ({ t }) => {
  const on = clamp01((t - 53.6) / 1.2) * clamp01((67.4 - t) / 1.6) + clamp01((t - 160.9) / 1.2) * (1 - clamp01((t - 176.0) / 2.4));
  if (on <= 0.02) return null;
  const start = t < 100 ? 53.8 : 161.0;
  const grow = clamp01((t - start) / 2.4);
  const hb = beatPulse(t, 3);
  const pulsePath = CORONARY[0];
  const p1 = getPointAtLength(pulsePath, clu(((t * 0.22) % 1) * getLength(pulsePath)));
  const p2 = getPointAtLength(CORONARY[1], clu(((t * 0.17 + 0.4) % 1) * getLength(CORONARY[1])));
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ ...S, opacity: on }}>
      <g fill="none" stroke="#ff9dab" strokeLinecap="round" transform={`translate(0,${(-hb * 5).toFixed(1)})`}>
        {CORONARY.map((d, i) => {
          const e = evolvePath(clamp01((grow - i * 0.12) / 0.7), d);
          return <path key={i} d={d} strokeWidth={i === 0 ? 3.2 : 2.2} opacity={0.95}
            strokeDasharray={e.strokeDasharray} strokeDashoffset={e.strokeDashoffset} />;
        })}
      </g>
      <g transform={`translate(0,${(-hb * 5).toFixed(1)})`}>
        <circle cx={p1.x} cy={p1.y} r={4.4} fill="#fff2f5" opacity={0.95} />
        <circle cx={p1.x} cy={p1.y} r={11} fill="#ff6b86" opacity={0.35} />
        <circle cx={p2.x} cy={p2.y} r={3.4} fill="#fff2f5" opacity={0.8} />
        <circle cx={p2.x} cy={p2.y} r={9} fill="#ff6b86" opacity={0.25} />
      </g>
      {/* an ecg stroke running straight through the organ */}
      <path
        d={Array.from({ length: 121 }, (_, i) => {
          const x = 812 + i * 2.9;
          const ph = ((t - 0.135) / (60 / 145) - (i / 121) * 2.6) % 1;
          const q = ph < 0 ? ph + 1 : ph;
          const v = q < 0.28 ? -0.1 : q < 0.33 ? -0.1 + ((q - 0.28) / 0.05) : q < 0.38 ? 0.9 - ((q - 0.33) / 0.05) * 1.1 : q < 0.5 ? -0.2 : 0;
          return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${(552 - v * 46).toFixed(1)}`;
        }).join(' ')}
        fill="none" stroke="rgba(255,220,230,.30)" strokeWidth={1.3}
      />
    </svg>
  );
};

/* ---------------------------------------------------------------- E. circulation (D2) */
export const Veins: React.FC<{ t: number }> = ({ t }) => {
  const on = clamp01((t - 107.9) / 1.6) * clamp01((120.4 - t) / 1.4);
  if (on <= 0.02) return null;
  const grow = clamp01((t - 108.4) / 6);
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ ...S, opacity: 0.9 * on }}>
      <g fill="none" stroke="#ffb3bf" strokeWidth={1.7} strokeLinecap="round">
        {VEIN.map((d, i) => {
          const e = evolvePath(clamp01((grow - i * 0.15) / 0.6), d);
          return <path key={i} d={d} opacity={0.55 + 0.35 * beatPulse(t, 4)}
            strokeDasharray={e.strokeDasharray} strokeDashoffset={e.strokeDashoffset} />;
        })}
      </g>
      {VEIN.slice(0, 3).map((d, i) => {
        const p = getPointAtLength(d, clu(((t * (0.16 + i * 0.05) + i * 0.3) % 1) * getLength(d)));
        return (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={4} fill="#fff0f3" opacity={0.9 * on} />
            <circle cx={p.x} cy={p.y} r={10} fill="#ff6b86" opacity={0.28 * on} />
          </g>
        );
      })}
    </svg>
  );
};

/* ---------------------------------------------------------------- F. ground ripples */
export const Ripples: React.FC<{ t: number; amount: number }> = ({ t, amount }) => {
  if (amount <= 0.05) return null;
  const N = 9;
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ ...S, opacity: amount }}>
      <g fill="none" stroke="#bfe0ff" strokeWidth={1.3}>
        {Array.from({ length: N }, (_, i) => {
          const period = 1.35;
          const ph = (t / period + i / N) % 1;
          const x = 120 + noise3D(`rx${i}`, t * 0.05, i, 0) * 900 + 900;
          const y = 902 + noise3D(`ry${i}`, t * 0.05, i, 1) * 60;
          const r = ph * 74;
          return (
            <g key={i} opacity={(1 - ph) * 0.5}>
              <ellipse cx={x} cy={y} rx={r} ry={r * 0.24} />
              <ellipse cx={x} cy={y} rx={r * 0.55} ry={r * 0.14} opacity={0.6} />
            </g>
          );
        })}
      </g>
    </svg>
  );
};

/* ---------------------------------------------------------------- G. IV drip (ward) */
export const Ivdrip: React.FC<{ t: number }> = ({ t }) => {
  const on = clamp01((t - 121.55) / 0.3) * clamp01((123.6 - t) / 0.3);
  if (on <= 0.02) return null;
  const period = 1.15;
  const ph = (t / period) % 1;
  const dy = 560 + ph * 130;
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ ...S, opacity: on, transform: 'scale(1)' }}>
      <g fill="none" stroke="#a9c9f0" strokeWidth={2} opacity={0.85}>
        <path d="M470 340 L470 1080" />
        <path d="M420 340 L520 340" />
        <path d="M436 300 L504 300 L504 340 L436 340 Z" />
        <path d="M446 356 L494 356 L494 430 L446 430 Z" opacity={0.7} />
        <path d="M452 430 L488 430 L482 470 L458 470 Z" opacity={0.7} />
        <path d="M460 470 L460 690 M480 470 L480 690 M460 690 L480 690" opacity={0.7} />
      </g>
      <circle cx={470} cy={dy} r={3.4} fill="#dff0ff" opacity={(1 - ph) * 0.95} />
      <ellipse cx={470} cy={700} rx={10 + ph * 6} ry={(10 + ph * 6) * 0.3} fill="none" stroke="#bfe0ff" strokeWidth={1.2} opacity={(1 - ph) * 0.6} />
    </svg>
  );
};

/* ---------------------------------------------------------------- H. birds at dawn */
export const Birds: React.FC<{ t: number }> = ({ t }) => {
  const on = clamp01((t - 152) / 3) * clamp01((188 - t) / 6);
  if (on <= 0.02) return null;
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ ...S, opacity: 0.85 * on }}>
      <g fill="none" stroke="#ffd7a8" strokeWidth={1.8} strokeLinecap="round">
        {Array.from({ length: 7 }, (_, i) => {
          const sp = 16 + i * 3.5;
          const x = ((t * sp + i * 260) % 2400) - 240;
          const y = 300 - i * 26 + Math.sin(t * 0.6 + i) * 14;
          const flap = Math.sin(t * (3.6 + i * 0.3) + i) * 7;
          return (
            <g key={i} transform={`translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${(0.7 + i * 0.05).toFixed(2)})`}>
              <path d={`M-14 ${(-flap).toFixed(1)} Q-7 ${(4 + flap).toFixed(1)} 0 0 Q7 ${(4 + flap).toFixed(1)} 14 ${(-flap).toFixed(1)}`} />
            </g>
          );
        })}
      </g>
    </svg>
  );
};

/* ---------------------------------------------------------------- I. petals in the finale */
export const Petals: React.FC<{ t: number; amount: number }> = ({ t, amount }) => {
  if (amount <= 0.02) return null;
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ ...S, opacity: 0.55 * amount }}>
      {Array.from({ length: 16 }, (_, i) => {
        const sp = 30 + (i % 5) * 16;
        const y = 1180 - ((t * sp + i * 130) % 1500);
        const x = 200 + ((i * 173) % 1600) + Math.sin(t * 0.5 + i * 1.3) * 60 + noise2D(`px${i}`, t * 0.2, i) * 40;
        const rot = t * (10 + (i % 4) * 8) + i * 40;
        const op = 0.35 + 0.5 * Math.abs(Math.sin(t * 0.7 + i));
        return (
          <g key={i} transform={`translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${(0.45 + (i % 3) * 0.16).toFixed(2)})`} opacity={op}>
            <path d="M0 0 C10 -10 22 -8 26 4 C18 14 6 12 0 0 Z" fill="rgba(255,190,205,.16)" stroke="#ffb3c4" strokeWidth={1.1} />
          </g>
        );
      })}
    </svg>
  );
};

/* ---------------------------------------------------------------- J. "someone's heart" thread */
export const SoulThread: React.FC<{ t: number }> = ({ t }) => {
  const on = clamp01((t - 175.6) / 2.0) * clamp01((198 - t) / 4);
  if (on <= 0.02) return null;
  const pts = Array.from({ length: 72 }, (_, i) => {
    const f = i / 71;
    const x = 260 + f * 1400;
    const y = 616 + Math.sin(f * 3.4 + t * 1.1) * 20 + noise2D(`st${i}`, t * 0.3, i) * 9;
    return { x, y };
  });
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ ...S, opacity: 0.8 * on }}>
      <polyline points={pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')} fill="none"
        stroke="#ffe3c8" strokeWidth={1.1} opacity={0.4} />
      <polyline points={pts.slice(0, Math.floor(clamp01((t - 176) / 6) * 72)).map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
        fill="none" stroke="#fff3e2" strokeWidth={1.8} opacity={0.9} />
    </svg>
  );
};

/* ---------------------------------------------------------------- shared defs */
export const ArtDefs: React.FC = () => (
  <svg width={0} height={0} style={{ position: 'absolute' }}>
    <defs>
      <filter id="neonGlow" x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur stdDeviation="7" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  </svg>
);

void makeCircle; void makeEllipse; void makeRect; void makeStar; void makeTriangle;
void makeTransform; void lerp; void heartOn; void barPulse; void PV_DATA; void AbsoluteFill;
