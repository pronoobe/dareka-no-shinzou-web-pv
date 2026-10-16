import React from 'react';
import { Composition } from 'remotion';
import { PV } from './PV';
import { DURATION_FRAMES, FPS } from './motion';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="PV"
      component={PV}
      durationInFrames={DURATION_FRAMES}
      fps={FPS}
      width={1920}
      height={1080}
    />
    <Composition
      id="PVNoAudio"
      component={PV}
      durationInFrames={DURATION_FRAMES}
      fps={FPS}
      width={1920}
      height={1080}
      defaultProps={{ withAudio: false }}
    />
  </>
);
