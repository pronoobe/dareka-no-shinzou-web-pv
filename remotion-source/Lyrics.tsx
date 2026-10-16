import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from 'remotion';
import { Trail } from '@remotion/motion-blur';
import { PV_DATA } from './pv-data';
import { TR, Treat, clamp01 } from './motion';

const JP_FONT = "'Shippori Mincho', serif";
const CN_FONT = "'Noto Serif SC', serif";

type Line = {
  i: number; sec: string; kind: string; jp: string; cn: string; tr: string;
  t0: number; t1: number; k: number[];
};

const fit = (len: number, base: number, max: number) => Math.round(Math.min(base, max / (len * 1.06)));

const charTimes = (l: Line, n: number): number[] => {
  if (l.k && l.k.length === n) return l.k;
  const span = (l.t1 - l.t0) * 0.6;
  return Array.from({ length: n }, (_, i) => l.t0 + (span * i) / Math.max(1, n - 1));
};

/* one lyric line, animated per character; all motion derives from the frame */
const LineView: React.FC<{ l: Line; t: number; frame: number; fps: number }> = ({ l, t, frame, fps }) => {
  const sp: Treat = TR[l.tr] || TR.ink;
  if (t < l.t0 - 0.6 || t > l.t1 + 0.5) return null;

  const glyphs = Array.from(l.jp).filter((c) => c !== ' ' && c !== '\u3000');
  const n = glyphs.length;
  const K = charTimes(l, n);
  const size = fit(l.jp.replace(/[\s\u3000]/g, '').length, sp.size, sp.maxW);
  const mode = sp.mode;

  const cut = sp.exit === 'cut';
  const lastK = K[n - 1] ?? l.t0;
  const exStart = cut ? l.t1 - 0.11 : Math.max(Math.min(l.t1 - 0.14, lastK + 0.16), l.t1 - 0.62);
  const q = clamp01((t - exStart) / (cut ? 0.11 : 0.44));
  const outOp = 1 - (cut ? Math.min(1, q * 1.25) : q);
  const exitY = cut ? 0 : -16 * q;

  /* container level motion + springs */
  let containOp = 1, cx = 0, cy = exitY, cr = 0, cs = 1;
  const sframe = (tt: number, dur: number) => frame - Math.round(tt * fps);
  const spr = (tt: number, dur: number, cfg: any) =>
    spring({ frame: sframe(tt, dur), fps, config: cfg, durationInFrames: Math.max(2, Math.round(dur * fps)) });

  const soft = { damping: 26, mass: 1.1, stiffness: 60 };
  const snappy = { damping: 14, mass: 0.7, stiffness: 190 };

  if (mode === 'stamp') {
    const e = spr(l.t0, 0.18, snappy);
    cs = 1.46 - 0.46 * e;
    cr = -1.6 * (1 - e);
    containOp = clamp01((t - l.t0) / 0.06);
  } else if (mode === 'hookBig') {
    const e = spr(l.t0, 0.34, { damping: 18, mass: 1.0, stiffness: 120 });
    cx = 470 * (1 - e);
    cs = 1.1 - 0.1 * e;
    containOp = clamp01((t - l.t0) / 0.1);
  } else if (mode === 'leftSlide' || mode === 'list') {
    containOp = clamp01((t - l.t0) / 0.05);
    if (mode === 'list') cs = 1.18 - 0.18 * spr(l.t0, 0.16, snappy);
  } else if (mode === 'corner') {
    cy = 16 * (1 - clamp01((t - l.t0) / 0.3)) + exitY;
    containOp = clamp01((t - l.t0) / 0.12);
  }
  cy += exitY;

  const echo = mode === 'echo' ? clamp01((t - l.t0) / 0.5) : 1;
  const textShadow =
    mode === 'echo' && echo < 1
      ? `${(15 * (1 - echo)).toFixed(1)}px 0 0 rgba(255,40,80,.55), ${(-15 * (1 - echo)).toFixed(1)}px 0 0 rgba(40,210,255,.55), 0 0 26px rgba(3,6,14,.95), 0 3px 14px rgba(0,0,0,.9)`
      : '0 0 22px rgba(3,6,14,.98), 0 0 40px rgba(3,6,14,.9), 0 0 70px rgba(3,6,14,.75), 0 3px 14px rgba(0,0,0,.85)';

  const chars = Array.from(l.jp).map((ch, idx) => ({ ch, space: ch === ' ' || ch === '\u3000' }));

  /* per character */
  let gi = -1;
  const rendered: React.ReactNode[] = [];
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    if (c.space) {
      rendered.push(<span key={i} style={{ display: 'inline-block', width: size * 0.42 }} />);
      continue;
    }
    gi += 1;
    const k = gi;
    const act = K[k];
    const dur = sp.dur;
    const e = spr(act, dur, mode === 'rise' || mode === 'sink' ? soft : snappy);
    let op = e, x = 0, y = 0, r = 0, s = 1;
    if (mode === 'stagger' || mode === 'echo' || mode === 'band') {
      op = 0.085 + 0.915 * clamp01(e * 1.4);
      y = (1 - e) * (sp.vert ? 20 : 22);
      s = 0.965 + 0.035 * e;
    } else if (mode === 'rise') {
      y = (1 - e) * 104;
      r = (1 - e) * 7;
      s = 0.92 + 0.08 * e;
      op = Math.min(1, e * 1.5);
    } else if (mode === 'sink') {
      y = -(1 - e) * 92;
      s = 0.94 + 0.06 * e;
      op = Math.min(1, e * 1.4);
    } else if (mode === 'scatter') {
      const ang = ((k * 137.5) * Math.PI) / 180;
      const dist = 150 + (k * 53) % 130;
      x = (1 - e) * Math.cos(ang) * dist;
      y = (1 - e) * Math.sin(ang) * dist;
      r = (1 - e) * (((k * 97) % 54) - 27);
      s = 0.6 + 0.4 * e;
      op = Math.min(1, e * 1.4);
    } else if (mode === 'leftSlide') {
      x = (1 - e) * -150;
      op = 0.07 + 0.93 * e;
      s = 0.98 + 0.02 * e;
    } else if (mode === 'stamp') {
      const pp = spr(l.t0 + k * 0.012, 0.16, snappy);
      s = 1.3 - 0.3 * pp;
      op = 1;
    } else if (mode === 'hookBig') {
      const pp = spr(l.t0 + k * 0.02, 0.3, { damping: 18, mass: 1.0, stiffness: 120 });
      x = (1 - pp) * 260;
      s = 1.12 - 0.12 * pp;
      op = Math.min(1, pp * 1.4);
    } else if (mode === 'list') {
      const pp = spr(l.t0 + k * 0.014, 0.24, snappy);
      s = 1.5 - 0.5 * pp;
      r = (1 - pp) * (k % 2 ? 8 : -8);
      op = Math.min(1, pp * 1.5);
    }
    rendered.push(
      <span
        key={i}
        style={{
          display: 'inline-block',
          opacity: op,
          transform: x || y || r || s !== 1
            ? `translate(${x.toFixed(2)}px,${y.toFixed(2)}px) rotate(${r.toFixed(2)}deg) scale(${s.toFixed(3)})`
            : undefined,
          willChange: 'transform, opacity',
        }}
      >
        {c.ch}
      </span>
    );
  }

  const glowP = clamp01((t - l.t0 - 0.06) / 0.5);
  const gw = mode === 'stamp' || mode === 'hookBig' || mode === 'list' ? 1 : mode === 'corner' ? 0.5 : 0.86;
  const bandP = clamp01((t - l.t0) / (mode === 'band' ? 0.62 : 0.34));
  const bandOn = mode === 'band' || mode === 'hookBig' || mode === 'list';

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    top: sp.top,
    left: sp.left ?? (sp.right ? undefined : 0),
    right: sp.right,
    width: sp.left !== undefined || sp.right !== undefined ? undefined : 1920,
    textAlign: sp.align,
    fontFamily: JP_FONT,
    fontWeight: 700,
    fontSize: size,
    lineHeight: 1.08,
    color: l.kind === 'hook' ? '#fff' : '#e9eef8',
    whiteSpace: sp.vert ? 'nowrap' : 'pre',
    writingMode: sp.vert ? 'vertical-rl' : undefined,
    height: sp.vert ? 900 : undefined,
    opacity: containOp * outOp,
    transform: `translate(${cx.toFixed(2)}px,${cy.toFixed(2)}px) rotate(${cr.toFixed(2)}deg) scale(${cs.toFixed(4)})`,
    transformOrigin: '50% 50%',
    textShadow,
  };

  const hookTrail = l.kind === 'hook' || l.kind === 'hook2';
  const inner = (
    <div style={containerStyle}>
      {bandOn ? (
        <div
          style={{
            position: 'absolute', left: 0, top: '50%', height: 10, width: '100%',
            background:
              'linear-gradient(90deg, transparent, rgba(140,220,255,.28) 30%, rgba(255,255,255,.75) 50%, rgba(140,220,255,.28) 70%, transparent)',
            transform: `translateY(-50%) translateX(${(bandP * 220 - 110).toFixed(1)}%) scaleX(${mode === 'band' ? 0.7 : 1.5})`,
            opacity: 0.95 * (1 - bandP) * outOp,
            filter: 'blur(3px)',
          }}
        />
      ) : null}
      {rendered}
      {!sp.vert ? (
        <div
          style={{
            position: 'absolute', left: 0, bottom: -24, height: 1, width: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(95,211,232,.6), transparent)',
            opacity: 0.9 * Math.min(1, glowP * 1.6) * outOp,
            transform: `scaleX(${(0.15 + gw * clamp01(glowP)).toFixed(3)})`,
          }}
        />
      ) : null}
    </div>
  );
  return hookTrail
    ? <Trail layers={5} lagInFrames={1.6} trailOpacity={0.55}>{inner}</Trail>
    : inner;
};

export const Lyrics: React.FC<{ t: number }> = ({ t }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const lines: Line[] = PV_DATA.lines;
  /* subtitles: the same entrance vocabulary, plus a karaoke progress underline */
  const subs = lines.filter((l) => t >= l.t0 - 0.4 && t <= l.t1 + 0.4);

  return (
    <AbsoluteFill>
      {lines.map((l) => (
        <LineView key={l.i} l={l} t={t} frame={frame} fps={fps} />
      ))}
      <div style={{ position: 'absolute', left: 0, top: 968, width: 1920, height: 90, textAlign: 'center' }}>
        <div
          style={{
            position: 'absolute', left: '50%', top: -48, width: 1000, height: 150,
            transform: 'translateX(-50%)',
            background: 'radial-gradient(closest-side, rgba(3,6,14,.9), rgba(3,6,14,0))',
          }}
        />
        {subs.map((l) => {
          const tr = TR[l.tr] || TR.ink;
          const hard = l.tr === 'stamp' || l.tr === 'hookBig' || (l.tr || '').indexOf('list') === 0;
          const din = hard ? 0.16 : 0.24;
          const ein = spring({ frame: frame - Math.round((l.t0 + 0.04) * fps), fps, config: { damping: 20, mass: 0.8, stiffness: 130 }, durationInFrames: Math.round(din * fps) });
          const dx = hard ? 26 * (1 - ein) : (l.tr === 'vertical' || l.tr === 'corner') ? -30 * (1 - ein) : 0;
          const ey = hard || l.tr === 'vertical' || l.tr === 'corner' ? 0 : 12 * (1 - ein);
          const exd = Math.max(0.14, l.t1 - l.t0 - 0.3);
          const prog = clamp01((t - l.t0 - 0.05) / exd);
          const eout = clamp01((t - (l.t1 - 0.32)) / 0.3);
          return (
            <div
              key={l.i}
              style={{
                position: 'absolute', left: 0, top: 0, width: 1920, textAlign: 'center',
                fontFamily: CN_FONT, fontWeight: 300, fontSize: 36, letterSpacing: '0.08em',
                color: '#d6dff2',
                textShadow: '0 0 26px rgba(4,8,20,.95), 0 2px 12px rgba(0,0,0,.95)',
                opacity: ein * (1 - eout),
                transform: `translate(${dx.toFixed(1)}px,${(ey - 8 * eout).toFixed(1)}px) scale(${(1 + (hard ? 0.06 : 0) * (1 - ein)).toFixed(3)})`,
              }}
            >
              {l.cn}
              <i
                style={{
                  display: 'block', height: 1, width: `${(prog * 100).toFixed(1)}%`, margin: '10px auto 0',
                  background: 'linear-gradient(90deg, rgba(95,211,232,0), rgba(95,211,232,.75), rgba(95,211,232,0))',
                }}
              />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
