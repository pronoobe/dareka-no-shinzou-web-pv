/* WebGL layer (PixiJS v8): rain, bokeh, sparks, shockwave rings, caustics, grain.
   Everything is a pure function of (t, P) so the export is frame-exact. */
(function (global) {
  'use strict';

  const S = { ready: false, P: null };
  const W = 1920, H = 1080;

  function softTexture(size, stops) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    for (const [p, col] of stops) g.addColorStop(p, col);
    x.fillStyle = g;
    x.fillRect(0, 0, size, size);
    return PIXI.Texture.from(c);
  }

  function streakTexture() {
    const c = document.createElement('canvas');
    c.width = 8; c.height = 128;
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 128);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.55)');
    g.addColorStop(1, 'rgba(255,255,255,1)');
    x.fillStyle = g;
    x.fillRect(3, 0, 2, 128);
    return PIXI.Texture.from(c);
  }

  function noiseTexture() {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const x = c.getContext('2d');
    const img = x.createImageData(256, 256);
    const r = U.rng(99);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 90 + r() * 165;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    return PIXI.Texture.from(c);
  }

  S.init = async function (host) {
    const app = new PIXI.Application();
    await app.init({
      width: W, height: H, antialias: true, backgroundAlpha: 0,
      preference: 'webgl', powerPreference: 'high-performance', autoDensity: false,
    });
    app.ticker.stop();
    host.appendChild(app.canvas);
    S.app = app;
    S.stage = app.stage;

    S.texRain = streakTexture();
    S.texOrb = softTexture(256, [[0, 'rgba(255,255,255,0.95)'], [0.35, 'rgba(255,255,255,0.35)'], [1, 'rgba(255,255,255,0)']]);
    S.texSpark = softTexture(64, [[0, 'rgba(255,255,255,1)'], [0.4, 'rgba(255,255,255,0.6)'], [1, 'rgba(255,255,255,0)']]);

    /* ---- rain : 3 depth layers ---- */
    const rnd = U.rng(20251015);
    S.rainLayers = [];
    const cfg = [
      { n: 420, len: [140, 300], wid: [1.1, 2.4], sp: 1.55, al: [0.10, 0.30], blur: 0 },
      { n: 380, len: [80, 170], wid: [0.9, 1.8], sp: 1.15, al: [0.12, 0.38], blur: 0 },
      { n: 300, len: [40, 90], wid: [0.7, 1.3], sp: 0.8, al: [0.15, 0.45], blur: 0 },
    ];
    for (const c of cfg) {
      const cont = new PIXI.Container();
      const arr = [];
      for (let i = 0; i < c.n; i++) {
        const sp = new PIXI.Sprite(S.texRain);
        sp.anchor.set(0.5);
        sp.width = U.lerp(c.wid[0], c.wid[1], rnd());
        sp.height = U.lerp(c.len[0], c.len[1], rnd());
        sp.tint = 0xffffff;
        const p = {
          x: rnd() * (W + 600) - 300, y: rnd() * (H + 400) - 200,
          sp: c.sp * U.lerp(0.85, 1.2, rnd()), al: U.lerp(c.al[0], c.al[1], rnd()),
          tw: rnd() * 6.28, tws: U.lerp(1.5, 5, rnd()),
        };
        sp.alpha = p.al;
        arr.push({ s: sp, p });
        cont.addChild(sp);
      }
      S.stage.addChild(cont);
      S.rainLayers.push({ cont, arr, cfg: c });
    }

    /* ---- bokeh ---- */
    S.bokeh = new PIXI.Container();
    S.bokeh.blendMode = 'add';
    const br = U.rng(7);
    S.bokehItems = [];
    for (let i = 0; i < 44; i++) {
      const sp = new PIXI.Sprite(S.texOrb);
      sp.anchor.set(0.5);
      const r = U.lerp(50, 300, Math.pow(br(), 2));
      sp.width = sp.height = r * 2;
      const it = {
        s: sp, x: br() * W, y: br() * H, r,
        vy: U.lerp(-9, -2, br()), vx: U.lerp(-7, 7, br()),
        ph: br() * 6.28, a: U.lerp(0.04, 0.16, br()) * (1 - r / 340),
      };
      sp.alpha = 0;
      S.bokehItems.push(it);
      S.bokeh.addChild(sp);
    }
    S.stage.addChild(S.bokeh);

    /* ---- dynamic graphics : caustics, rings, sparks, splash ---- */
    S.gfxBelow = new PIXI.Graphics();   // caustics (screen blend)
    S.gfxBelow.blendMode = 'add';
    S.stage.addChildAt(S.gfxBelow, 0);

    S.gfx = new PIXI.Graphics();        // rings / sparks / splash (add blend)
    S.gfx.blendMode = 'add';
    S.stage.addChild(S.gfx);

    /* ---- grain ---- */
    S.texNoise = noiseTexture();
    S.grain = new PIXI.TilingSprite({ texture: S.texNoise, width: W, height: H });
    S.grain.blendMode = 'overlay';
    S.grain.alpha = 0.06;
    S.stage.addChild(S.grain);

    /* ---- EKG canvas (2d) ---- */
    S.ekg = document.getElementById('ekg');
    S.ekgCtx = S.ekg.getContext('2d');

    S.P = {
      rain: 0.5, rainAngle: 7, rainSpeed: 1, rainTint: '#cfe4ff',
      bokeh: 0.5, bokehTint: '#5fd3e8',
      caustics: 0, causticTint: '#3aa0d8',
      grain: 0.06, sparks: 0, sparkTint: '#ffd9a0',
      water: 0, waterTint: '#123a6e',
    };
    S.hits = [];
    S.ready = true;
  };

  /* ---------------- per-frame ---------------- */
  S.update = function (t, P, hits) {
    if (!S.ready) return;
    const app = S.app;
    const rainOn = P.rain;
    const ang = (P.rainAngle * Math.PI) / 180;
    const tint = U.hex2num(P.rainTint);

    for (let li = 0; li < S.rainLayers.length; li++) {
      const L = S.rainLayers[li];
      const alphaScale = rainOn * (li === 0 ? 0.55 : li === 1 ? 0.8 : 1.0);
      for (let i = 0; i < L.arr.length; i++) {
        const { s, p } = L.arr[i];
        if (alphaScale <= 0.005) { s.visible = false; continue; }
        s.visible = true;
        const travel = H + 500;
        let y = (p.y + t * 900 * p.sp * P.rainSpeed) % travel;
        if (y < 0) y += travel;
        y -= 250;
        const x = p.x + y * Math.tan(ang) + Math.sin(t * 0.5 + p.tw) * 10;
        s.x = x; s.y = y;
        s.alpha = p.al * alphaScale * (0.75 + 0.25 * Math.sin(t * p.tws + p.tw)) * 2.2;
        s.tint = tint;
      }
    }

    /* bokeh */
    const bc = U.hex2num(P.bokehTint);
    for (let i = 0; i < S.bokehItems.length; i++) {
      const it = S.bokehItems[i];
      const x = ((it.x + t * it.vx) % (W + 600) + W + 600) % (W + 600) - 300;
      const y = ((it.y + t * it.vy) % (H + 400) + H + 400) % (H + 400) - 200;
      it.s.x = x + Math.sin(t * 0.25 + it.ph) * 26;
      it.s.y = y + Math.cos(t * 0.2 + it.ph) * 18;
      it.s.alpha = it.a * P.bokeh * (0.7 + 0.3 * Math.sin(t * 0.8 + it.ph));
      it.s.tint = bc;
    }

    const g = S.gfx;
    g.clear();
    const gb = S.gfxBelow;
    gb.clear();

    /* caustics : soft horizontal light bands drifting */
    if (P.caustics > 0.01) {
      gb.alpha = P.caustics;
      const ct = U.hex2num(P.causticTint);
      for (let b = 0; b < 5; b++) {
        const yBase = 120 + b * 220 + Math.sin(t * 0.3 + b) * 40;
        gb.moveTo(0, yBase);
        for (let x = 0; x <= W; x += 40) {
          const y = yBase
            + Math.sin(x * 0.0032 + t * (0.55 + b * 0.13) + b) * 34
            + Math.sin(x * 0.0071 - t * (0.31 + b * 0.07)) * 18;
          gb.lineTo(x, y);
        }
        gb.stroke({ width: 26 - b * 2, color: ct, alpha: 0.055 });
      }
    }

    /* water fill */
    if (P.water > 0.01) {
      const wy = H - 200 * P.water;
      g.rect(0, wy, W, H - wy).fill({ color: U.hex2num(P.waterTint), alpha: 0.5 * Math.min(1, P.water) });
      g.moveTo(0, wy);
      for (let x = 0; x <= W; x += 24) g.lineTo(x, wy + Math.sin(x * 0.006 + t * 1.3) * 7);
      g.stroke({ width: 2, color: 0x8fd8ff, alpha: 0.45 * P.water });
    }

    /* spark bursts on hits */
    if (P.sparks > 0.01 && hits && hits.length) {
      const sc = U.hex2num(P.sparkTint);
      for (let h = 0; h < hits.length; h++) {
        const hit = hits[h];
        const age = t - hit.t;
        const life = hit.life || 1.6;
        if (age < 0 || age > life) continue;
        const k = age / life;
        for (let j = 0; j < hit.n; j++) {
          const a = hit.a0 + j * hit.da;
          const v = hit.v * (0.6 + 0.5 * ((j * 37) % 7) / 7);
          const px = hit.x + Math.cos(a) * v * age * 60;
          const py = hit.y + Math.sin(a) * v * age * 60 + 260 * age * age;
          const al = (1 - k) * hit.al;
          g.circle(px, py, hit.r * (1 - k * 0.6)).fill({ color: sc, alpha: al });
        }
      }
    }

    /* expanding rings */
    if (hits && hits.length) {
      for (let h = 0; h < hits.length; h++) {
        const hit = hits[h];
        if (!hit.ring) continue;
        const age = t - hit.t;
        const life = hit.ringLife || 1.15;
        if (age < 0 || age > life) continue;
        const k = age / life;
        const e = 1 - Math.pow(1 - k, 2);
        const R = e * hit.ringMax;
        const col = U.hex2num(hit.ringColor || '#9fe4ff');
        g.circle(hit.x, hit.y, R).stroke({ width: Math.max(0.6, 7 * (1 - k)), color: col, alpha: (1 - k) * 0.85 });
        if (hit.ring2) {
          g.circle(hit.x, hit.y, R * 0.62 + 20).stroke({ width: Math.max(0.5, 3 * (1 - k)), color: col, alpha: (1 - k) * 0.4 });
        }
      }
    }

    /* rain splash on the ground line */
    if (rainOn > 0.05) {
      const f = 0.55;
      const first = Math.max(0, t - 0.55);
      const n0 = Math.floor(first / (1 / 3.2));
      for (let k = n0; k < n0 + 4; k++) {
        const st = k / 3.2 + ((k * 97) % 13) / 40;
        const age = t - st;
        if (age < 0 || age > 0.55) continue;
        const x = ((k * 7919) % 1860) + 30;
        const y = 872 + ((k * 31) % 9) * 12;
        const r = age * 60;
        g.ellipse(x, y, r, r * 0.22).stroke({ width: 1.4, color: 0xbfe0ff, alpha: (1 - age / 0.55) * 0.3 * rainOn });
      }
    }

    /* grain jitter */
    if (S.grain) {
      S.grain.alpha = P.grain;
      const i1 = Math.floor(t * 24);
      S.grain.tilePosition.x = ((i1 * 137) % 256);
      S.grain.tilePosition.y = ((i1 * 311) % 256);
    }

    app.renderer.render(app.stage);
  };

  /* ---------------- heartbeat trace ---------------- */
  /* Waveform template over one beat: small P wave, sharp QRS, T wave.        */
  function template(ph) {
    let v = 0;
    if (ph < 0.14) v = Math.sin(ph / 0.14 * Math.PI) * 0.11;                 // P
    else if (ph < 0.24) v = 0;
    else if (ph < 0.28) v = -0.16 * (ph - 0.24) / 0.04;                      // Q
    else if (ph < 0.33) v = -0.16 + 1.16 * (ph - 0.28) / 0.05;               // R up
    else if (ph < 0.38) v = 1.0 - 1.28 * (ph - 0.33) / 0.05;                 // S
    else if (ph < 0.44) v = -0.28 + 0.24 * (ph - 0.38) / 0.06;
    else if (ph < 0.62) v = -0.04;
    else if (ph < 0.86) v = 0.30 * Math.sin((ph - 0.62) / 0.24 * Math.PI);   // T
    else v = 0;
    return v;
  }

  S.drawEKG = function (t, cfg) {
    const c = S.ekgCtx;
    if (!c) return;
    const w = 1920, h = 200;
    const cy = cfg.cy === undefined ? 96 : cfg.cy;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalCompositeOperation = 'source-over';
    c.globalAlpha = 1;
    c.clearRect(0, 0, w, h);
    const amp = cfg.amp, speed = cfg.speed, alpha = cfg.alpha;
    if (alpha <= 0.01) return;

    const x0 = 40, x1 = 1880;
    const scroll = cfg.scroll;          // px/s : how fast the trace moves left
    const n = 620;
    const pts = [];
    const flat = cfg.flat || 0;         // 0 = normal, 1 = flatline
    const arr = cfg.arrhythmia || 0;
    for (let i = 0; i <= n; i++) {
      const f = i / n;
      const x = U.lerp(x0, x1, f);
      const tt = t - (1 - f) * ((x1 - x0) / scroll);
      let v;
      if (flat > 0.999) v = (U.rng((Math.floor(tt * 30) >>> 0) + 7)() - 0.5) * 0.012;
      else {
        const bs = cfg.beatScale || 1;
        const ph = ((tt - U.phase) / (U.beat * bs)) % 1;
        let ph2 = ph < 0 ? ph + 1 : ph;
        if (arr > 0.01) {
          const j = U.rng((Math.floor((tt - U.phase) / U.beat) >>> 0) + 3)();
          ph2 = (ph2 + (j - 0.5) * 0.34 * arr) % 1;
        }
        v = template(ph2);
        v = U.lerp(v, (U.rng((Math.floor(tt * 60) >>> 0) + 11)() - 0.5) * 0.02, flat);
      }
      pts.push([x, cy - v * amp]);
    }

    c.lineJoin = 'round';
    c.lineCap = 'round';
    /* wide soft under-glow, then the crisp thread */
    c.strokeStyle = cfg.glowColor || 'rgba(95,211,232,0.30)';
    c.lineWidth = (cfg.width || 2.2) * 7;
    c.beginPath();
    pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.stroke();

    c.strokeStyle = cfg.color;
    c.lineWidth = cfg.width || 2.2;
    c.beginPath();
    pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.stroke();

    /* leading point of light */
    const last = pts[pts.length - 1];
    const g2 = c.createRadialGradient(last[0], last[1], 0, last[0], last[1], 18);
    g2.addColorStop(0, cfg.color);
    g2.addColorStop(0.35, (cfg.glowColor || 'rgba(95,211,232,.3)'));
    g2.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g2;
    c.beginPath();
    c.arc(last[0], last[1], 18, 0, 6.29);
    c.fill();

    /* fade both ends so the trace melts into the picture instead of reading as a meter */
    const fade = c.createLinearGradient(0, 0, w, 0);
    fade.addColorStop(0, 'rgba(0,0,0,1)');
    fade.addColorStop(0.10, 'rgba(0,0,0,0.55)');
    fade.addColorStop(0.24, 'rgba(0,0,0,0)');
    fade.addColorStop(0.76, 'rgba(0,0,0,0)');
    fade.addColorStop(0.90, 'rgba(0,0,0,0.55)');
    fade.addColorStop(1, 'rgba(0,0,0,1)');
    c.globalCompositeOperation = 'destination-out';
    c.fillStyle = fade;
    c.fillRect(0, 0, w, h);
    c.globalCompositeOperation = 'source-over';
  };

  global.Stage = S;
})(window);
