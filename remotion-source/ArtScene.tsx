import React, { useLayoutEffect, useRef } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, Easing } from 'remotion';
import { ART_SVG } from './art-svg';
import { PV_DATA } from './pv-data';
import {
  ART_CAM, SCENES, sceneOpacity, revealClip, heartOn, beatPulse, barPulse, clamp01, lerp,
} from './motion';

/* The line-art layer, reused verbatim from the GSAP build, driven per frame through
   element ids. All motion is a pure function of t. */
export const ArtScene: React.FC<{ t: number }> = ({ t }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const host = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = host.current;
    if (!root) return;
    const q = (id: string) => root.querySelector('#' + id) as SVGElement | null;
    const ho = heartOn(t);

    /* scene fades + reveals */
    for (const sc of SCENES) {
      const el = q(sc.key);
      if (!el) continue;
      el.style.opacity = String(sceneOpacity(sc.win, t));
      if (sc.rev) {
        let clip = 'none';
        for (const [a, rev, rd] of sc.rev) {
          if (t >= a - 0.02 && t <= a + rd) clip = revealClip(rev, clamp01((t - a) / rd));
        }
        el.style.clipPath = clip;
      }
    }

    /* layer camera + hand-drawn boil */
    const sec = PV_DATA.sections.reduce((acc: any, s: any) => (t >= s.t0 ? s : acc), PV_DATA.sections[0]);
    const a = ART_CAM[sec.id] || ART_CAM.A1;
    const u = clamp01((t - sec.t0) / Math.max(0.001, sec.t1 - sec.t0));
    const eu = Easing.inOut(Easing.cubic)(u);
    const beat = beatPulse(t, 4), bar = barPulse(t, 3);
    const bscale = (1 + 0.004 * Math.sin(t * 0.6)) * (1 + ho * (0.003 * beat + 0.005 * bar));
    const brot = 0.22 * Math.sin(t * 0.62) + 0.08 * Math.sin(t * 1.7) + ho * 0.09 * beat;
    const bx = Math.sin(t * 6.1) * 0.4 + Math.sin(t * 2.7) * 0.22;
    const by = Math.cos(t * 5.3 + 0.7) * 0.4 + Math.cos(t * 2.3) * 0.22;
    const camZ = lerp(a.z[0], a.z[1], eu), camX = lerp(a.x[0], a.x[1], eu);
    const camY = lerp(a.y[0], a.y[1], eu), camR = lerp(a.r[0], a.r[1], eu);
    root.style.transform = `translate(${bx + camX}px,${by + camY}px) rotate(${(brot + camR).toFixed(3)}deg) scale(${(bscale * camZ).toFixed(4)})`;

    /* horizon line */
    const hl = q('horizonLine');
    if (hl) {
      const drawn = clamp01((t - 0.05) / 1.1);
      hl.setAttribute('stroke-dasharray', '2400');
      hl.setAttribute('stroke-dashoffset', String(2400 * (1 - Easing.out(Easing.cubic)(drawn))));
      hl.style.opacity = String(Math.min(clamp01((t - 1.0) / 0.8) * 0.55, clamp01((26.0 - t) / 4.0) * 0.55));
    }

    /* city : three parallax bands scrolling left to right, forever */
    const dist = 24 * Math.max(0, t - 0.4) + 0.62 * Math.pow(Math.max(0, t - 0.4), 2);
    for (const [id, sp] of [['cityFar', 0.42], ['cityMain', 1.0], ['cityFront', 1.55]] as [string, number][]) {
      const el = q(id);
      if (el) el.setAttribute('transform', `translate(${((dist * sp) % 1920).toFixed(1)},0)`);
    }
    for (let i = 0; i < 7; i++) {
      const w = q('cityWave' + i) || root.querySelectorAll('#s-city > path')[i] as SVGElement | null;
      if (w) w.setAttribute('transform', `translate(${(((t * (16 + i * 5)) % 120) - 60).toFixed(1)},0)`);
    }

    /* heart */
    const hb = beatPulse(t, 3);
    const hOn = (t > 53.5 && t < 68.0) || (t > 160.7 && t < 176.5);
    const hbEl = q('heartBody');
    if (hbEl) {
      hbEl.setAttribute('transform',
        `translate(960,540) rotate(${hOn ? (3.2 * Math.sin(t * 2.6) + 4.5 * hb).toFixed(2) : 0}) scale(${hOn ? (1 + 0.035 * hb).toFixed(4) : 1})`);
    }
    for (let i = 0; i < 3; i++) {
      const r = q('heartRing' + i);
      if (!r) continue;
      const off = i * 0.24;
      const ph = ((t - 0.135) / (60 / 145)) % 1;
      const qq = (ph + off) % 1;
      const bt = Math.floor((t - 0.135) / (60 / 145) - off);
      r.setAttribute('r', String(170 + qq * 430));
      r.setAttribute('opacity', hOn ? String(0.5 * (1 - qq) * Math.exp(-(bt % 4) * 0.35)) : '0');
    }

    /* theatre */
    const cur = q('curtains');
    if (cur && t > 40.4 && t < 54.4) {
      const b2 = 1 + 0.016 * Math.sin(t * 1.7) + 0.02 * beat;
      cur.setAttribute('transform', `translate(${(Math.sin(t * 0.8) * 5 + beat * 6).toFixed(1)},0) scale(${b2.toFixed(4)},1)`);
    }
    const mar = q('marionette');
    if (mar) {
      const k = Math.floor(Math.max(0, t - 41.6) / (60 / 145 * 2));
      const sw = Math.sin((t - 41.6) * 1.2);
      mar.setAttribute('transform', `translate(960,540) rotate(${(sw * 2.6).toFixed(2)})`);
      void k;
    }
    const tstr = q('marionette')?.querySelector('g');
    if (tstr && t > 40.4 && t < 54.4) {
      tstr.setAttribute('transform', `rotate(${(Math.sin(t * 2.2) * 2.2 + beatPulse(t, 2.2) * 1.4).toFixed(2)}, 0, -560)`);
    }

    /* thread + two figures */
    const th = q('threadLine');
    if (th && t > 149.9 && t < 163) {
      const sag = 60 + Math.sin(t * 0.7) * 18;
      const jit = Math.sin(t * 11) * 4 + Math.sin(t * 3.3) * 6;
      th.setAttribute('d', `M 470 540 C 700 ${540 + sag} 1220 ${540 + sag + jit} 1450 540`);
      th.setAttribute('opacity', String(0.5 + 0.35 * Math.abs(Math.sin(t * 0.9))));
    }
    const tw = q('twoThread');
    if (tw && t > 134.9 && t < 150.5) {
      const p2 = clamp01((t - 135.34) / 15);
      tw.setAttribute('d', `M 700 700 C 860 ${520 + 40 * p2} 1060 ${520 - 30 * p2} 1220 700`);
      tw.setAttribute('opacity', String(0.6 * (1 - p2)));
    }

    /* dawn / bloom / weather bits */
    const rays = q('dawnRays');
    if (rays && t > 149) rays.setAttribute('transform', `rotate(${(Math.sin(t * 0.12) * 2.6).toFixed(2)}, 960, 1006)`);
    const stars = q('dawnStars');
    if (stars && t > 149 && t < 176) stars.setAttribute('opacity', String(clamp01(1 - (t - 152) / 20)));
    const core = q('bloomCore');
    if (core && t > 175) core.setAttribute('opacity', String(0.85 * clamp01((t - 175.2) / 12)));
    for (let i = 0; i < 24; i++) {
      const r = q('bloomRay' + i);
      if (r) r.setAttribute('opacity', String(0.3 * clamp01((t - 175.2) / 12) * (0.6 + 0.4 * Math.sin(t * 0.8 + i))));
    }
    const fer = q('ferris');
    if (fer && t > 123.7 && t < 127.1) fer.setAttribute('transform', `translate(1400,540) rotate(${(Math.sin(t * 0.5) * 2.2).toFixed(2)})`);
    const two = q('s-two');
    if (two && t > 134.9 && t < 150) two.setAttribute('opacity', String(sceneOpacity([[134.9, 149.6, 1.4, 1.8]], t)));
  }, [t, frame, fps]);

  return (
    <AbsoluteFill>
      <div
        ref={host}
        style={{ position: 'absolute', inset: 0, transformOrigin: '50% 62%', willChange: 'transform' }}
        dangerouslySetInnerHTML={{ __html: ART_SVG }}
      />
    </AbsoluteFill>
  );
};

void spring;
void interpolate;
