import React, { useEffect, useState } from 'react';
import {
  AbsoluteFill, Audio, useCurrentFrame, useVideoConfig, staticFile,
  delayRender, continueRender, Series, Sequence,
} from 'remotion';
import { PV_DATA } from './pv-data';
import { FONTS_CSS } from './fonts-css';
import {
  FPS, heartOn, tremor, clamp01, beatPulse, barPulse, plateGrade,
  activePlate, plateTarget, lerp, isWeb,
} from './motion';
import { Plates } from './Plates';
import { ArtScene } from './ArtScene';
import { Lyrics } from './Lyrics';
import { Ekg, Weather, Rings, Fx } from './Effects';
import {
  GlassRain, Poles, Neon, HeartAnatomy, Veins, Ripples, Ivdrip, Birds, Petals, SoulThread, ArtDefs,
} from './ArtExtra';
import { MOODS, ART_TINT } from './moods';

const FontGate: React.FC = () => {
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = FONTS_CSS.replace(/\.\/files\//g, isWeb() ? ((window as any).__ASSET__ + 'fonts/') : staticFile('fonts/'));
    document.head.appendChild(style);
    document.fonts.ready.then(() => continueRender(handle)).catch(() => continueRender(handle));
  }, [handle]);
  return null;
};

/* the line-art layer is locked to the plate camera : it moves at a fraction of the
   background's push / drift so the two layers read as one camera move */
const artCouple = (t: number, frame: number, ho: number) => {
  const ap = activePlate(t);
  if (!ap) return { z: 1, x: 0, y: 0 };
  const tg = plateTarget(ap.p, t, frame, ho);
  return {
    z: 1 + 0.42 * (tg.z - 1),
    x: 0.34 * (tg.Tx - 960) * clamp01(ap.a * 1.6),
    y: 0.30 * (tg.Ty - 540) * clamp01(ap.a * 1.6),
  };
};

export const PV: React.FC<{ withAudio?: boolean }> = ({ withAudio = true }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const ho = heartOn(t);
  const tre = tremor(t, PV_DATA.hits);
  const camBreath = 1 + ho * (0.0026 * beatPulse(t, 5) + 0.007 * barPulse(t, 2.4));
  const mood = MOODS.reduce((a, m) => (t >= m.t0 ? m : a), MOODS[0]);
  const couple = artCouple(t, frame, ho);
  const artTint = ART_TINT[mood.id] || 'none';

  /* line-art density follows the section */
  const world = clamp01(
    Math.max(
      mood.id === 'A1' || mood.id === 'inter1' || mood.id === 'A2' ? 1 : 0,
      mood.id === 'B1' || mood.id === 'C1' || mood.id === 'D1' ? 0.6 : 0,
      mood.id === 'E' ? 0.7 : 0,
      mood.id === 'intro' ? 0.35 : 0,
    ),
  );
  const glass = mood.id === 'D1' || mood.id === 'inter2' ? 0.9
    : mood.id === 'A1' || mood.id === 'inter1' || mood.id === 'A2' ? 0.75
      : mood.id === 'outro' ? 0.5 : 0.3;
  const petals = clamp01((t - 175.0) / 4) * clamp01((200 - t) / 6);

  return (
    <AbsoluteFill style={{
      background: 'radial-gradient(120% 90% at 50% 42%, #101a3a 0%, #070b18 45%, #03050b 100%)',
      overflow: 'hidden',
    }}>
      {withAudio ? <Audio src={staticFile('audio.mp3')} /> : null}
      <FontGate />
      <ArtDefs />

      <div style={{
        position: 'absolute', inset: 0,
        transform: `translate(${tre.x.toFixed(2)}px,${tre.y.toFixed(2)}px) rotate(${tre.r.toFixed(3)}deg) scale(${(camBreath * 1.02).toFixed(4)})`,
      }}>
        {/* 1. background plates */}
        <Plates t={t} layer="below" grade={plateGrade} />

        {/* 2. world line-art + the in-world extras, tinted to the plate's palette */}
        <div style={{ position: 'absolute', inset: 0, filter: artTint }}>
          <div style={{
            position: 'absolute', inset: 0,
            transform: `translate(${(couple.x * 0.5).toFixed(1)}px,${(couple.y * 0.5).toFixed(1)}px) scale(${couple.z.toFixed(4)})`,
            transformOrigin: '50% 62%',
          }}>
            <ArtScene t={t} />
          </div>
          <div style={{
            position: 'absolute', inset: 0,
            transform: `translate(${couple.x.toFixed(1)}px,${couple.y.toFixed(1)}px) scale(${couple.z.toFixed(4)})`,
            transformOrigin: '50% 62%',
          }}>
            {world > 0.02 ? <Poles t={t} amount={world} /> : null}
            <Neon t={t} />
          </div>
        </div>

        {/* 3. the crowd plate sits in front of the world art */}
        <Plates t={t} layer="over" grade={plateGrade} />

        {/* 4. weather */}
        <Weather
          t={t}
          rain={mood.rain}
          rainTint={mood.rainTint}
          bokeh={mood.bokeh}
          bokehTint={mood.bokehTint}
          caustics={mood.caustics}
          water={mood.water}
          sparks={mood.id === 'S1' || mood.id === 'H' || mood.id === 'I' || mood.id === 'D1' ? 1 : 0.35}
        />

        {/* 5. subject-level line-art that belongs to the motif */}
        <div style={{ position: 'absolute', inset: 0, filter: artTint }}>
          <HeartAnatomy t={t} />
          <Veins t={t} />
          <Ivdrip t={t} />
          <Birds t={t} />
          <SoulThread t={t} />
        </div>

        {/* 6. foreground : rain on the lens, ripples, petals */}
        <div style={{ position: 'absolute', inset: 0 }}>
          <Ripples t={t} amount={glass} />
          <GlassRain t={t} amount={glass} />
          <Petals t={t} amount={petals} />
        </div>

        {/* 7. lyric furniture */}
        <Rings t={t} />
        <Lyrics t={t} />
        <Ekg t={t} />
      </div>

      <Fx t={t} tint={mood.tint} tintA={mood.tintA} />
    </AbsoluteFill>
  );
};

void Series; void Sequence; void FPS; void lerp;
