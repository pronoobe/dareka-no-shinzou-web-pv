import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { clamp01 } from './motion';

/* Title cards : the song's opening interlude carries the vertical title + the
   artist credit, and the outro carries the centred title with the Chinese line. */

const JP = "'Shippori Mincho', serif";
const CN = "'Noto Serif SC', serif";
const LAT = "'Cormorant Garamond', serif";
const GOTH = "'Zen Kaku Gothic New', sans-serif";

const ease = (v: number) => v * v * (3 - 2 * v);

export const Titles: React.FC<{ t: number }> = ({ t }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  /* ---------------- opening interlude (14.7 – 28.4) ---------------- */
  const TITLE = 'だれかの心臓になれたなら';
  const inOn = Math.min(clamp01((t - 15.4) / 1.6), clamp01((28.2 - t) / 2.2));
  const creditOn = Math.min(clamp01((t - 16.5) / 1.4), clamp01((28.2 - t) / 2.2));
  const chars = Array.from(TITLE).map((c, i) => {
    const p = spring({
      frame: frame - Math.round((15.5 + i * 0.09) * fps),
      fps,
      config: { damping: 200, mass: 0.9, stiffness: 90 },
      durationInFrames: Math.round(0.9 * fps),
    });
    return { c, p };
  });

  /* ---------------- outro (189.5 – 205) ---------------- */
  const outIn = Math.min(clamp01((t - 190.0) / 2.4), clamp01((205.5 - t) / 6.0));
  const outCn = Math.min(clamp01((t - 191.0) / 2.4), clamp01((205.5 - t) / 6.0));
  const outCredit = Math.min(clamp01((t - 193.0) / 2.0), clamp01((204.5 - t) / 4.0));
  const outSpring = spring({
    frame: frame - Math.round(190.0 * fps),
    fps,
    config: { damping: 200, mass: 1.1, stiffness: 60 },
    durationInFrames: Math.round(2.4 * fps),
  });

  return (
    <AbsoluteFill>
      {/* ---------- opening : vertical title on the right ---------- */}
      {inOn > 0.01 ? (
        <div style={{ position: 'absolute', inset: 0 }}>
          <div style={{
            position: 'absolute', right: 268, top: 150, height: 900,
            writingMode: 'vertical-rl', fontFamily: JP, fontWeight: 600, fontSize: 58,
            letterSpacing: '0.22em', color: '#e9eef8',
            textShadow: '0 0 32px rgba(10,20,40,.95), 0 0 60px rgba(3,6,14,.9)',
            opacity: inOn,
          }}>
            {chars.map(({ c, p }, i) => {
              const e = ease(clamp01(p));
              return (
                <span key={i} style={{
                  display: 'inline-block',
                  opacity: e,
                  transform: `translateY(${((1 - e) * 26).toFixed(1)}px) scale(${(0.86 + 0.14 * e).toFixed(3)})`,
                }}>{c}</span>
              );
            })}
          </div>
          <div style={{
            position: 'absolute', right: 356, top: 168,
            writingMode: 'vertical-rl', fontFamily: GOTH, fontWeight: 400, fontSize: 22,
            letterSpacing: '0.35em', color: 'rgba(233,238,248,.75)',
            textShadow: '0 0 22px rgba(3,6,14,.95)', opacity: creditOn * 0.9,
          }}>ユリイ・カノン feat. GUMI</div>
        </div>
      ) : null}

      {/* ---------- outro : centred title + chinese + credit ---------- */}
      {outIn > 0.01 ? (
        <div style={{ position: 'absolute', inset: 0 }}>
          <div style={{
            position: 'absolute', left: 0, top: 400, width: 1920, textAlign: 'center',
            fontFamily: JP, fontWeight: 600, fontSize: 92, letterSpacing: '0.14em',
            color: '#eef3ff', opacity: outIn,
            transform: `translateY(${((1 - ease(outSpring)) * 18).toFixed(1)}px)`,
            textShadow: '0 0 34px rgba(3,6,14,.98), 0 0 70px rgba(3,6,14,.85), 0 6px 22px rgba(0,0,0,.9)',
          }}>だれかの心臓になれたなら</div>
          <div style={{
            position: 'absolute', left: 0, top: 566, width: 1920, textAlign: 'center',
            fontFamily: CN, fontWeight: 300, fontSize: 34, letterSpacing: '0.3em',
            color: '#d6e2f7', opacity: outCn * 0.9,
            textShadow: '0 0 26px rgba(3,6,14,.98)',
          }}>若能成为谁的心脏</div>
          <div style={{
            position: 'absolute', left: 0, top: 664, width: 1920, textAlign: 'center',
            fontFamily: LAT, fontSize: 26, letterSpacing: '0.44em', textTransform: 'uppercase',
            color: 'rgba(233,238,248,.75)', opacity: outCredit,
            textShadow: '0 0 22px rgba(3,6,14,.95)',
          }}>Euryi Canon · feat. GUMI</div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
