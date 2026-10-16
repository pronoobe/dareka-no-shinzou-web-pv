import React from 'react';
import { createRoot } from 'react-dom/client';
import { Player } from '@remotion/player';
import { PV } from './PV';
import { DURATION_FRAMES, FPS } from './motion';

/* standalone player page : relative assets, no audio */
(window as any).__ASSET__ = '';

const App: React.FC = () => {
  const [playing, setPlaying] = React.useState(true);
  const ref = React.useRef<any>(null);
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', height: '100%' }}>
        <Player
          ref={ref}
          component={PV}
          inputProps={{ withAudio: false }}
          durationInFrames={DURATION_FRAMES}
          fps={FPS}
          compositionWidth={1920}
          compositionHeight={1080}
          style={{ width: '100%', height: '100%' }}
          autoPlay
          loop
          controls={false}
          acknowledgeRemotionLicense
        />
      </div>
      <button
        onClick={() => {
          const p = ref.current;
          if (!p) return;
          if (playing) p.pause(); else p.play();
          setPlaying(!playing);
        }}
        style={{
          position: 'fixed', left: '50%', bottom: 26, transform: 'translateX(-50%)',
          padding: '10px 22px', borderRadius: 999, cursor: 'pointer',
          background: 'rgba(6,10,22,.6)', color: '#dbe6fb', border: '1px solid rgba(220,232,255,.28)',
          font: '500 15px/1 system-ui, sans-serif', letterSpacing: '.06em', backdropFilter: 'blur(6px)',
        }}
      >
        {playing ? '❚❚ 暂停 / pause' : '▶ 播放 / play'}
      </button>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(<App />);
