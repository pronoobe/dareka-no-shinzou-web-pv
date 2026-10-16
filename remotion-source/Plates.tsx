import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { CameraMotionBlur } from '@remotion/motion-blur';
import { PLATES, Plate, plateCam, revealClip, clamp01, heartOn, beatPulse, A } from './motion';

const PlateImg: React.FC<{ p: Plate; t: number; frame: number; ho: number; grade: (id: string) => string }> = ({
  p, t, frame, ho, grade,
}) => {
  const fi = p.fi ?? 1.1, fo = p.fo ?? 1.1;
  let a = Math.min(clamp01((t - p.t0) / fi), clamp01((p.t1 - t) / fo));
  if (a <= 0.003) return null;
  if (p.rev === 'glitch' && t - p.t0 < 0.55) {
    a *= 0.35 + 0.65 * (Math.sin((t - p.t0) * 78) * 0.5 + 0.5);
  }
  const cam = plateCam(p, t, frame, ho);
  const pulse = p.pulse ? 1 + 0.008 * beatPulse(t, 4) * ho : 1;
  const rp = clamp01((t - p.t0) / (p.rd ?? fi));
  return (
    <Img
      src={A('img/' + p.img)}
      style={{
        position: 'absolute',
        left: -48, top: -48, width: 2016, height: 1176,
        objectFit: 'cover',
        opacity: a * p.op,
        transformOrigin: '0 0',
        transform: `translate(${cam.tx.toFixed(1)}px,${cam.ty.toFixed(1)}px) scale(${(cam.z * pulse).toFixed(4)})`,
        clipPath: revealClip(p.rev, rp),
        filter: grade(p.id),
        willChange: 'transform, opacity',
      }}
    />
  );
};

export const Plates: React.FC<{ t: number; layer: 'below' | 'over'; grade: (id: string) => string }> = ({
  t, layer, grade,
}) => {
  const frame = useCurrentFrame();
  const ho = heartOn(t);
  const list = PLATES.filter((p) => (layer === 'over' ? p.over : !p.over));
  return (
    <AbsoluteFill>
      <CameraMotionBlur shutterAngle={150} samples={4}>
        <AbsoluteFill>
          {list.map((p) => <PlateImg key={p.id} p={p} t={t} frame={frame} ho={ho} grade={grade} />)}
        </AbsoluteFill>
      </CameraMotionBlur>
      {layer === 'below' ? (
        <div
          style={{
            position: 'absolute', inset: 0,
            background:
              'radial-gradient(125% 88% at 50% 42%, rgba(3,6,14,.06) 0%, rgba(3,6,14,.42) 58%, rgba(3,6,14,.86) 100%),' +
              'linear-gradient(180deg, rgba(3,6,14,.55) 0%, rgba(3,6,14,0) 26%, rgba(3,6,14,0) 62%, rgba(3,6,14,.75) 100%)',
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};
