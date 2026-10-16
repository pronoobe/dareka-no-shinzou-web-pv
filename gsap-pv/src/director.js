/* Director: master GSAP timeline + per-frame analytic state (text, heartbeat, fx, params). */
(function (global) {
  'use strict';

  const D = { tl: null };
  const W = 1920, H = 1080;

  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function smooth(t) { return t * t * (3 - 2 * t); }

  /* per-section mood: continuous params used by pixi + fx */
  const MOOD = {
    intro: { rain: 0.10, rainTint: '#bcd8ff', bokeh: 0.25, bokehTint: '#3f6fae', caustics: 0, water: 0, grain: 0.05, tint: '#05070f', tintA: 0.0, warp: 0 },
    A1: { rain: 0.55, rainTint: '#c6dcff', bokeh: 0.45, bokehTint: '#4f86c8', caustics: 0, water: 0.06, grain: 0.06, tint: '#081226', tintA: 0.06, warp: 0 },
    inter1: { rain: 0.75, rainTint: '#a8c6ff', bokeh: 0.6, bokehTint: '#3a6fbe', caustics: 0.10, water: 0.35, grain: 0.07, tint: '#0a1b3c', tintA: 0.14, warp: 0.5 },
    B1: { rain: 0.6, rainTint: '#b9c9ef', bokeh: 0.5, bokehTint: '#7a4a9e', caustics: 0, water: 0.10, grain: 0.09, tint: '#1a0f2c', tintA: 0.16, warp: 1 },
    C1: { rain: 0.45, rainTint: '#d8c8a8', bokeh: 0.65, bokehTint: '#b98a4a', caustics: 0, water: 0, grain: 0.07, tint: '#1a1206', tintA: 0.12, warp: 0.2 },
    S1: { rain: 0.35, rainTint: '#ffd0dc', bokeh: 0.7, bokehTint: '#e0556e', caustics: 0, water: 0, grain: 0.05, tint: '#2a0610', tintA: 0.16, warp: 0 },
    A2: { rain: 0.6, rainTint: '#c6dcff', bokeh: 0.4, bokehTint: '#4f86c8', caustics: 0, water: 0.08, grain: 0.06, tint: '#081226', tintA: 0.08, warp: 0.1 },
    D1: { rain: 1.0, rainTint: '#b0d6ff', bokeh: 0.35, bokehTint: '#2f6fc0', caustics: 0.35, water: 0.55, grain: 0.08, tint: '#062246', tintA: 0.24, warp: 0.2 },
    inter2: { rain: 0.7, rainTint: '#8fc0ff', bokeh: 0.5, bokehTint: '#1f6fc8', caustics: 0.85, water: 0.95, grain: 0.07, tint: '#04203f', tintA: 0.32, warp: 0.6 },
    D2: { rain: 0.55, rainTint: '#bcd8ff', bokeh: 0.6, bokehTint: '#6fa9e8', caustics: 0.35, water: 0.30, grain: 0.07, tint: '#0a2246', tintA: 0.20, warp: 0.4 },
    E: { rain: 0.65, rainTint: '#cfd8e8', bokeh: 0.3, bokehTint: '#8a7a6a', caustics: 0.05, water: 0.05, grain: 0.11, tint: '#1a1410', tintA: 0.16, warp: 0.35 },
    F: { rain: 0.5, rainTint: '#c2d2ff', bokeh: 0.35, bokehTint: '#4a6ba8', caustics: 0, water: 0, grain: 0.07, tint: '#0a1024', tintA: 0.10, warp: 0 },
    G: { rain: 0.35, rainTint: '#e0d0c0', bokeh: 0.5, bokehTint: '#c08a5a', caustics: 0, water: 0, grain: 0.06, tint: '#1c1206', tintA: 0.10, warp: 0 },
    H: { rain: 0.25, rainTint: '#ffe0c0', bokeh: 0.8, bokehTint: '#e8a05c', caustics: 0, water: 0, grain: 0.05, tint: '#2a1608', tintA: 0.14, warp: 0 },
    I: { rain: 0.3, rainTint: '#ffe8d0', bokeh: 0.9, bokehTint: '#ffc98a', caustics: 0, water: 0, grain: 0.05, tint: '#2e1a08', tintA: 0.12, warp: 0 },
    outro: { rain: 0.22, rainTint: '#cfe0ff', bokeh: 0.4, bokehTint: '#7f9ad0', caustics: 0.05, water: 0.02, grain: 0.05, tint: '#070b16', tintA: 0.06, warp: 0 },
  };

  /* orbiting rings : lyric letters / clock face / watching eyes / motes.
     Each ring is a fixed set of elements positioned analytically every frame. */
  const RINGS = [
    { id: 'love', kind: 'text', text: '「愛をください」', rep: 3, R: 248, ry: 0.94, size: 32, speed: 0.075,
      color: 'rgba(238,244,255,.62)', cx: 960, cy: 548, t0: 53.9, t1: 67.4, fi: 1.0, fo: 1.4, pulse: 1 },
    { id: 'title', kind: 'text', text: 'だれかの心臓になれたなら', rep: 2, R: 366, ry: 0.92, size: 24, speed: -0.05,
      color: 'rgba(226,236,255,.44)', cx: 960, cy: 528, t0: 160.9, t1: 190.0, fi: 1.4, fo: 3.0, pulse: 1 },
    { id: 'clock', kind: 'ticks', n: 60, R: 268, ry: 0.94, cx: 960, cy: 470, speed: 0.16,
      t0: 67.7, t1: 81.4, fi: 1.2, fo: 1.2,
      handSpeed: 0.42 },
    { id: 'eyes', kind: 'eyes', n: 14, R: 430, ry: 0.78, cx: 960, cy: 520, speed: 0.028,
      t0: 28.0, t1: 40.5, fi: 1.4, fo: 1.0, pulse: 1 },
    { id: 'motes', kind: 'motes', n: 22, R: 300, ry: 0.95, cx: 960, cy: 520, speed: 0.09,
      t0: 175.4, t1: 196.0, fi: 2.0, fo: 6.0, pulse: 1 },
  ];
  D.RINGS = RINGS;

  /* Camera model. Each plate carries
       focus : where the subject (GUMI) sits inside the image (0..1, auto-detected
               from her mint-green hair by tools/…/analysis/focus.txt)
       tgt0/1: where that subject should sit on screen (1920x1080) at the start / end
       z0/z1 : zoom envelope over the section
       shots : content-aware accents (e.g. push in when a specific line lands)
     The transform is solved so the subject lands on the target, then clamped so the
     plate can never expose an edge. */
  const PLATE_GRADE = 'brightness(.66) saturate(.94) contrast(1.05)';
  const PLATES = [
    { id: 'city', img: 'g_city.jpg', t0: 0.3, t1: 15.4, op: 0.76, rev: 'waterUp', rd: 2.4, fi: 2.2, fo: 1.4,
      focus: [0.352, 0.62], tgt0: [700, 540], tgt1: [880, 660], z0: 1.0, z1: 1.10,
      shots: [{ t: 11.24, z: 1.34, hold: 2.4, dx: -44, dy: -20, rin: 1.6, rout: 2.4 }] },
    { id: 'city2', img: 'g_city.jpg', t0: 66.9, t1: 81.4, op: 0.68, rev: 'iris', rd: 1.6, fi: 1.4, fo: 1.5,
      focus: [0.352, 0.62], tgt0: [1000, 470], tgt1: [770, 660], z0: 1.16, z1: 1.05,
      shots: [{ t: 74.2, z: 1.36, hold: 2.6, dx: 58, dy: 26, rin: 1.7, rout: 2.4 }] },
    { id: 'crowd', img: 'g_crowd.jpg', t0: 27.7, t1: 40.7, op: 0.84, rev: 'glitch', rd: 0.5, fi: 2.0, fo: 1.4,
      pulse: 1, over: 1, filter: 'brightness(.82) saturate(1.02) contrast(1.06)',
      focus: [0.512, 0.575], tgt0: [940, 440], tgt1: [980, 690], z0: 1.24, z1: 1.06,
      shots: [{ t: 31.76, z: 1.56, hold: 3.0, dx: -70, dy: 34, rin: 1.8, rout: 2.6, face: 1 }] },
    { id: 'theatre', img: 'g_theatre.jpg', t0: 40.1, t1: 54.3, op: 0.88, rev: 'curtain', rd: 2.0, fi: 2.0, fo: 1.5,
      filter: 'brightness(.80) saturate(1.0) contrast(1.04)',
      focus: [0.494, 0.447], tgt0: [960, 400], tgt1: [930, 640], z0: 1.06, z1: 1.20,
      shots: [{ t: 51.10, z: 1.70, hold: 3.2, dx: -60, dy: 34, rin: 1.9, rout: 2.4, face: 1 }] },
    { id: 'heart', img: 'g_heart.jpg', t0: 53.5, t1: 67.5, op: 0.80, rev: 'bloom', rd: 1.6, fi: 1.4, fo: 1.8,
      pulse: 1, filter: 'brightness(.86) saturate(1.08) contrast(1.02)',
      focus: [0.369, 0.447], tgt0: [720, 460], tgt1: [820, 640], z0: 1.05, z1: 1.20,
      shots: [{ t: 57.83, z: 1.54, hold: 3.4, dx: 42, dy: 30, rin: 1.8, rout: 2.8 }] },
    { id: 'heart2', img: 'g_heart.jpg', t0: 161.5, t1: 175.9, op: 0.84, rev: 'bloom', rd: 1.6, fi: 1.4, fo: 2.6,
      pulse: 1, filter: 'brightness(.86) saturate(1.14) contrast(1.02) sepia(.30) hue-rotate(-20deg)',
      focus: [0.369, 0.447], tgt0: [840, 430], tgt1: [700, 640], z0: 1.12, z1: 1.05,
      shots: [{ t: 168.49, z: 1.62, hold: 3.4, dx: -54, dy: 36, rin: 1.9, rout: 2.8, face: 1 }] },
    { id: 'girl', img: 'g_girl.jpg', t0: 80.5, t1: 94.4, op: 0.78, rev: 'rainDiag', rd: 2.0, fi: 2.2, fo: 1.6,
      filter: 'brightness(.74) saturate(.98) contrast(1.05)',
      focus: [0.685, 0.34], tgt0: [1140, 380], tgt1: [980, 660], z0: 1.05, z1: 1.18,
      shots: [{ t: 88.24, z: 1.76, hold: 3.6, dx: -56, dy: 40, rin: 1.9, rout: 2.8, face: 1 }] },
    { id: 'deep', img: 'g_deep.jpg', t0: 93.5, t1: 107.9, op: 0.82, rev: 'waterUp', rd: 2.6, fi: 2.6, fo: 1.5,
      filter: 'brightness(.80) saturate(1.05) contrast(1.03)',
      focus: [0.49, 0.44], tgt0: [960, 400], tgt1: [938, 640], z0: 1.10, z1: 1.32 },
    { id: 'dream', img: 'g_dream.jpg', t0: 107.5, t1: 120.6, op: 0.74, rev: 'iris', rd: 1.8, fi: 2.0, fo: 1.2,
      filter: 'brightness(.78) saturate(.95) contrast(1.04)',
      focus: [0.533, 0.40], tgt0: [900, 420], tgt1: [1010, 630], z0: 1.10, z1: 1.22,
      shots: [{ t: 114.11, z: 1.58, hold: 3.0, dx: -44, dy: 30, rin: 1.8, rout: 2.6, face: 1 }] },
    { id: 'rail', img: 'plate_rail.jpg', t0: 120.1, t1: 121.75, op: 0.82, rev: 'glitch', rd: 0.3, fi: 0.22, fo: 0.16,
      focus: [0.5, 0.5], tgt0: [960, 520], tgt1: [940, 570], z0: 1.18, z1: 1.06 },
    { id: 'ward', img: 'plate_ward.jpg', t0: 121.5, t1: 122.5, op: 0.80, rev: 'glitch', rd: 0.3, fi: 0.22, fo: 0.16,
      focus: [0.4, 0.45], tgt0: [960, 520], tgt1: [940, 570], z0: 1.16, z1: 1.08 },
    { id: 'towers', img: 'plate_towers.jpg', t0: 122.45, t1: 123.95, op: 0.78, rev: 'glitch', rd: 0.3, fi: 0.22, fo: 0.16,
      focus: [0.42, 0.47], tgt0: [960, 520], tgt1: [900, 580], z0: 1.15, z1: 1.04 },
    { id: 'ferris', img: 'plate_ferris.jpg', t0: 123.8, t1: 127.15, op: 0.80, rev: 'glitch', rd: 0.3, fi: 0.22, fo: 0.16,
      focus: [0.5, 0.5], tgt0: [960, 500], tgt1: [1000, 590], z0: 1.14, z1: 1.04 },
    { id: 'desk', img: 'plate_desk.jpg', t0: 127.05, t1: 130.6, op: 0.78, rev: 'glitch', rd: 0.3, fi: 0.22, fo: 0.6,
      focus: [0.45, 0.45], tgt0: [960, 520], tgt1: [930, 600], z0: 1.13, z1: 1.06 },
    { id: 'two', img: 'g_two.jpg', t0: 134.8, t1: 149.6, op: 0.84, rev: 'rainDiag', rd: 2.0, fi: 2.0, fo: 1.6,
      filter: 'brightness(.82) saturate(1.05) contrast(1.04)',
      focus: [0.5, 0.42], tgt0: [960, 420], tgt1: [915, 640], z0: 1.12, z1: 1.06,
      shots: [{ t: 145.42, z: 1.36, hold: 3.2, dx: 40, dy: 30, rin: 1.8, rout: 3.0 }] },
    { id: 'dawn', img: 'g_dawn.jpg', t0: 149.9, t1: 161.4, op: 0.62, rev: 'waterUp', rd: 3.0, fi: 2.6, fo: 2.0,
      focus: [0.78, 0.42], tgt0: [1240, 400], tgt1: [1000, 600], z0: 1.04, z1: 1.18 },
    { id: 'dawn2', img: 'g_dawn.jpg', t0: 175.7, t1: 212.0, op: 0.60, rev: 'bloom', rd: 3.6, fi: 3.0, fo: 16.0,
      focus: [0.78, 0.42], tgt0: [1240, 420], tgt1: [820, 620], z0: 1.02, z1: 1.20 },
  ];
  D.PLATES = PLATES;
  D.PLATE_GRADE = PLATE_GRADE;

  /* ---------------------------------------------------------------- */
  /* analytic state                                                    */
  /* ---------------------------------------------------------------- */
  function moodAt(t, data) {
    const secs = data.sections;
    let cur = secs[0], prev = secs[0];
    for (let i = 0; i < secs.length; i++) {
      if (t >= secs[i].t0) { cur = secs[i]; prev = secs[i - 1] || secs[i]; }
    }
    const a = MOOD[cur.id], b = MOOD[prev.id];
    const k = clamp01((t - cur.t0) / 1.6);
    const out = {};
    for (const key in a) {
      if (typeof a[key] === 'number') out[key] = b[key] + (a[key] - b[key]) * smooth(k);
      else out[key] = k > 0.5 ? a[key] : b[key];
    }
    out.id = cur.id;
    out.sec = cur;
    return out;
  }

  D.ekgAt = function (t, data) {
    const m = moodAt(t, data);
    const id = m.id;
    const cfg = {
      alpha: 0.9, amp: 54, speed: 1, scroll: 250, width: 2.4, color: 'rgba(200,235,255,0.95)',
      glowColor: 'rgba(95,211,232,0.30)', cy: 92, ticks: false, baseline: false, flat: 0, arrhythmia: 0,
    };
    const set = (o) => Object.assign(cfg, o);
    if (t < 1.35) { set({ alpha: 0.9, amp: 26, scroll: 120, cy: 96, color: 'rgba(180,215,255,0.9)', flat: 1 }); }
    else if (id === 'A1') set({ amp: 52, scroll: 250, cy: 96 });
    else if (id === 'B1') set({ amp: 62, scroll: 300, cy: 84, arrhythmia: 0.45, color: 'rgba(255,190,205,0.95)', glowColor: 'rgba(255,60,90,0.28)' });
    else if (id === 'C1') set({ amp: 56, scroll: 265, cy: 100, arrhythmia: 0.15 });
    else if (id === 'S1') set({ amp: 74, scroll: 330, cy: 88, width: 3.1, color: 'rgba(255,225,235,1)', glowColor: 'rgba(255,70,100,0.40)' });
    else if (id === 'A2') set({ amp: 64, scroll: 460, cy: 104, arrhythmia: 0.25 });
    else if (id === 'D1') set({ amp: 54, scroll: 255, cy: 108, color: 'rgba(175,225,255,0.95)' });
    else if (id === 'inter2') set({ amp: 38, scroll: 145, cy: 120, alpha: 0.62, color: 'rgba(150,205,255,0.9)', glowColor: 'rgba(60,140,235,0.25)' });
    else if (id === 'D2') set({ amp: 54, scroll: 265, cy: 104, arrhythmia: 0.3 });
    else if (id === 'E') set({ amp: 58, scroll: 350, cy: 96, arrhythmia: 0.5 });
    else if (id === 'F') set({ amp: 48, scroll: 240, cy: 98, color: 'rgba(200,220,255,0.95)' });
    else if (id === 'G') set({ amp: 42, scroll: 215, cy: 86, alpha: 0.8 });
    else if (id === 'H') set({ amp: 84, scroll: 360, cy: 82, width: 3.2, color: 'rgba(255,232,205,1)', glowColor: 'rgba(240,170,90,0.42)' });
    else if (id === 'I') set({ amp: 80, scroll: 320, cy: 88, width: 3, color: 'rgba(255,235,210,1)', glowColor: 'rgba(255,190,120,0.4)' });
    else if (id === 'outro') {
      const k = clamp01((t - 187.9) / 3.0);
      set({ amp: 88 * (1 - k) + 36 * k, scroll: 190, alpha: 1 - 0.15 * k, color: 'rgba(255,230,200,0.95)', glowColor: 'rgba(255,190,120,0.3)' });
    }
    if (id === 'F') {
      // one heart still beats, the other is failing
      const k = clamp01((t - 135.34) / 15);
      cfg.flat = 0.25 + 0.55 * k;
    }
    if (id === 'outro') {
      const k = clamp01((t - 191) / 8);
      cfg.flat = k * 0.8;
      cfg.scroll = 110;
      cfg.ticks = false;
      if (t > 203) {
        cfg.alpha = clamp01(1 - (t - 203) / 22) * 0.9;
        cfg.amp = 44;
        cfg.flat = 0.25;
        cfg.beatScale = 8;                    // one slow beat every two bars
        cfg.color = 'rgba(200,225,255,0.85)';
        cfg.glowColor = 'rgba(120,170,230,0.22)';
      }
      if (t > 226) { cfg.alpha *= clamp01(1 - (t - 226) / 3.6); }
      if (t > 223 && t < 226.4) { cfg.beatScale = 8; cfg.amp = 62; }   // last strong beat
      if (t >= 226.4) { cfg.flat = 1; cfg.amp = 26; }
    }
    // global fade at the very end
    if (t > 229.4) cfg.alpha *= clamp01(1 - (t - 229.4) / 0.9);
    return cfg;
  };

  /* the animation objects (scenes, titles, ...) are driven by the gsap timeline */

  function buildHits(data) {
    const hits = [];
    for (const h of data.hits) {
      const sec = data.sections.find((s) => s.id === h.sec);
      if (h.type === 'section') {
        hits.push({ t: h.t, x: 960, y: 500, n: 0, a0: 0, da: 0, v: 0, r: 3, al: 0, life: 0,
                    ring: 1, ringMax: h.sec === 'S1' || h.sec === 'H' ? 1100 : 900, ringLife: 1.35,
                    ringColor: (h.sec === 'S1' || h.sec === 'H') ? '#ff9db0' : '#9fe4ff', ring2: 1 });
      } else if (h.type === 'hook' || h.type === 'hook2') {
        const gold = h.type === 'hook2';
        hits.push({ t: h.t, x: 960, y: 470, n: 70, a0: 0, da: 6.283 / 70, v: 2.2, r: 5, al: 0.85, life: 1.7,
                    ring: 1, ringMax: gold ? 980 : 820, ringLife: 1.1,
                    ringColor: gold ? '#ffd08a' : '#ffb0c0', ring2: 1, sparkTint: gold ? '#ffd9a0' : '#ffc2cf' });
      } else if (h.type === 'list') {
        hits.push({ t: h.t, x: 960, y: 560, n: 26, a0: 0, da: 6.283 / 26, v: 1.4, r: 4, al: 0.7, life: 1.1,
                    ring: 1, ringMax: 520, ringLife: 0.8, ringColor: '#cfe4ff', ring2: 0, sparkTint: '#dfe8ff' });
      } else if (h.type === 'lastbeat') {
        hits.push({ t: h.t, x: 960, y: 520, n: 0, a0: 0, da: 0, v: 0, r: 6, al: 0.9, life: 2.4,
                    ring: 1, ringMax: 1400, ringLife: 2.2, ringColor: '#ffe0c0', ring2: 1 });
      }
    }
    return hits;
  }

  /* ---------------------------------------------------------------- */
  /* gsap timeline                                                     */
  /* ---------------------------------------------------------------- */
  D.build = function (data, S, L, dom) {
    const tl = gsap.timeline({ paused: true });
    D.tl = tl;
    D.hits = buildHits(data);
    buildTremor(data);
    const sec = (id) => data.sections.find((s) => s.id === id);

    /* --- helper: scene in/out --- */
    function sceneIn(el, t0, dur, e) {
      tl.set(el, { opacity: 0 }, 0);
      tl.set(el, { opacity: 0 }, t0);
      tl.to(el, { opacity: 1, duration: dur, ease: e || 'power2.out' }, t0);
    }
    function sceneOut(el, t1, dur) {
      tl.to(el, { opacity: 0, duration: dur || 0.9, ease: 'power2.in' }, t1);
    }

    /* plates : link every plate to the lyrics that play over it so the picture can
       yield to the text (entry push / exit settle) */
    for (const p of PLATES) {
      const tops = {};
      for (const ln of L.lines) tops[ln.data.i] = ln.spec.top;
      p.camLink = data.lines.filter((l) => l.t0 > p.t0 - 0.25 && l.t1 < p.t1 + 0.25).map((l) => ({
        t0: l.t0, t1: l.t1, top: tops[l.i] === undefined ? 372 : tops[l.i],
        push: /^(stamp|hookBig|list[0-9])$/.test(l.tr) ? 0.05 : 0.022,
      }));
    }

    /* ============ scenes ============ */
    sceneIn(S.city, 0.6, 1.6);
    sceneOut(S.city, 40.0, 2.5);
    sceneIn(S.city, 67.0, 1.2);         // A2 again
    sceneOut(S.city, 81.0, 1.5);
    sceneIn(S.crowd, 27.6, 2.2);
    sceneOut(S.crowd, 39.8, 1.6);
    sceneIn(S.theatre, 40.0, 2.4);
    sceneOut(S.theatre, 53.6, 1.4);
    sceneIn(S.heart, 53.9, 1.6);
    sceneOut(S.heart, 66.6, 2.0);
    sceneIn(S.heart, 160.8, 1.6);       // final chorus
    sceneOut(S.heart, 176.0, 3.2);
    sceneIn(S.umbrella, 80.6, 2.0);
    sceneOut(S.umbrella, 93.4, 1.8);
    sceneIn(S.deep, 93.6, 2.2);
    sceneOut(S.deep, 107.4, 1.6);
    sceneIn(S.dream, 107.6, 2.0);
    sceneOut(S.dream, 120.0, 1.4);
    /* E : five cuts */
    sceneIn(S.rail, 120.20, 0.18);
    sceneOut(S.rail, 121.45, 0.14);
    sceneIn(S.ward, 121.55, 0.18);
    sceneIn(S.towers, 121.55, 0.18);
    sceneOut(S.ward, 123.68, 0.14);
    sceneOut(S.towers, 123.68, 0.14);
    sceneIn(S.bus, 123.78, 0.18);
    sceneOut(S.bus, 126.98, 0.14);
    sceneIn(S.desk, 127.08, 0.18);
    sceneOut(S.desk, 130.30, 0.5);
    sceneIn(S.two, 134.9, 1.4);
    sceneOut(S.two, 149.6, 1.8);
    sceneIn(S.thread, 149.9, 1.6);
    sceneOut(S.thread, 161.6, 1.4);
    sceneIn(S.dawn, 149.9, 4.0);
    sceneOut(S.dawn, 187.0, 5.0);
    sceneIn(S.bloom, 175.2, 2.6);
    sceneOut(S.bloom, 205.0, 9.0);

    /* the reflection flip during the first interlude */
    tl.set(S.city, { scale: 1 }, 0);
    tl.to(S.city, { scale: 1.06, y: -18, duration: 14, ease: 'sine.inOut' }, 1.0);

    /* threads (G / F) are drawn analytically; strings of the marionette draw down */
    if (window.DrawSVGPlugin) {
      tl.set('#marionette line', { drawSVG: '0%' }, 0);
      tl.to('#marionette line', { drawSVG: '100%', duration: 1.4, ease: 'power2.inOut', stagger: 0.06 }, 40.4);
    }
    tl.set('#horizonLine', { opacity: 0 }, 0);
    if (window.DrawSVGPlugin) {
      tl.set('#horizonLine', { drawSVG: '0%' }, 0.05);
      tl.to('#horizonLine', { drawSVG: '100%', duration: 1.1, ease: 'power3.inOut' }, 0.05);
    }
    tl.to('#horizonLine', { opacity: 0.55, duration: 0.8 }, 1.0);
    tl.to('#horizonLine', { opacity: 0, duration: 4.0, ease: 'power2.in' }, 26.0);

    /* ============ the doll hangs and turns slowly (beats) ============ */
    if (S.marionette) {
      const b = data.beat;
      for (let k = 0; k < 12; k++) {
        const t = 41.6 + k * b * 2;
        const s = k % 2 === 0 ? 1 : -1;
        tl.to(S.marionette, { rotation: s * 3.4, duration: b * 1.9, ease: 'sine.inOut' }, t);
      }
    }

    /* ============ chapter words ============ */
    tl.set(dom.chapterWord, { opacity: 0 }, 0);
    for (const s of data.sections) {
      if (s.id === 'intro') continue;
      tl.set(dom.chapterWord, { text: s.word, opacity: 0 }, Math.max(0, s.t0 - 0.01));
      tl.to(dom.chapterWord, { opacity: 0.55, duration: 0.9, ease: 'power2.out' }, s.t0);
      tl.to(dom.chapterWord, { opacity: 0, duration: Math.min(1.2, (s.t1 - s.t0) * 0.25), ease: 'power2.in' },
         s.t1 - Math.min(1.2, (s.t1 - s.t0) * 0.25));
    }

    /* ============ title cards ============ */
    const T = L.titles;
    tl.set([T.v, T.vcredit, T.h, T.hcn, T.hcredit], { opacity: 0 }, 0);
    tl.set(T.v, { opacity: 0, filter: 'blur(14px)' }, 15.4);
    tl.to(T.v, { opacity: 1, filter: 'blur(0px)', duration: 1.6, ease: 'power2.out' }, 15.6);
    tl.to(T.vcredit, { opacity: 0.75, duration: 1.4 }, 16.5);
    tl.to(T.v, { opacity: 0, duration: 2.2 }, 25.0);
    tl.to(T.vcredit, { opacity: 0, duration: 2.2 }, 25.0);

    tl.set(T.h, { opacity: 0, y: 18 }, 189.5);
    tl.set(T.hcn, { opacity: 0, y: 14 }, 189.5);
    tl.set(T.hcredit, { opacity: 0 }, 189.5);
    tl.to(T.h, { opacity: 1, y: 0, duration: 2.4, ease: 'power2.out' }, 190.0);
    tl.to(T.hcn, { opacity: 0.85, y: 0, duration: 2.4 }, 191.0);
    tl.to(T.hcredit, { opacity: 0.5, duration: 2.0 }, 193.0);
    tl.to([T.h, T.hcn], { opacity: 0, duration: 6.0, ease: 'power2.in' }, 199.5);
    tl.to(T.hcredit, { opacity: 0, duration: 4.0 }, 199.0);

    /* the final bloom lingers through the quiet outro before dissolving */
    tl.to(S.bloom, { opacity: 0.55, duration: 6.0 }, 200.0);
    tl.to(S.bloom, { opacity: 0, duration: 12.0, ease: 'power2.in' }, 208.0);

    /* ============ subtitle tweens (entrance varies with the treatment) ============ */
    L.subs.forEach((s) => {
      const a = s.data.t0, b = s.data.t1;
      const tr = s.data.tr || 'ink';
      let from = { opacity: 0, y: 12, x: 0, scale: 1 };
      let to = { opacity: 1, y: 0, x: 0, scale: 1, duration: 0.42, ease: 'power2.out' };
      let exitDur = 0.36;
      if (tr === 'stamp' || tr === 'hookBig' || tr.indexOf('list') === 0) {
        from = { opacity: 0, y: 0, x: 26, scale: 1.06 };
        to = { opacity: 1, y: 0, x: 0, scale: 1, duration: 0.16, ease: 'power3.out' };
        exitDur = tr.indexOf('list') === 0 ? 0.14 : 0.28;
      } else if (tr === 'vertical' || tr === 'corner') {
        from = { opacity: 0, y: 0, x: -30, scale: 0.98 };
        to = { opacity: 1, y: 0, x: 0, scale: 1, duration: 0.2, ease: 'power2.out' };
      } else if (tr === 'echo' || tr === 'scatter') {
        from = { opacity: 0, y: 0, x: 0, scale: 1.1 };
        to = { opacity: 1, y: 0, x: 0, scale: 1, duration: 0.22, ease: 'power2.out' };
      }
      tl.set(s.el, from, 0);
      tl.set(s.el, from, a);
      tl.to(s.el, to, a + 0.04);
      tl.to(s.el, { opacity: 0, y: -8, duration: exitDur, ease: 'power2.in' }, b - exitDur + 0.02);
    });

    /* ============ light bloom / flashes per section ============ */
    const flash = dom.flash;
    tl.set(flash, { opacity: 0 }, 0);
    const F = [[1.35, 0.55], [28.46, 0.3], [40.72, 0.34], [54.33, 0.5], [56.17, 0.22], [57.83, 0.5],
               [59.5, 0.22], [61.14, 0.5], [64.23, 0.3], [67.58, 0.3], [81.66, 0.26], [107.9, 0.3],
               [120.56, 0.34], [121.58, 0.26], [123.81, 0.34], [127.11, 0.3], [130.47, 0.26],
               [135.34, 0.36], [150.36, 0.24], [161.90, 0.5], [165.27, 0.24], [168.49, 0.28],
               [171.87, 0.34], [175.59, 0.28], [181.74, 0.44], [187.9, 0.55]];
    for (const [t, a] of F) {
      tl.set(flash, { opacity: a }, t);
      tl.to(flash, { opacity: 0, duration: 0.34, ease: 'power2.out' }, t + 0.02);
    }
    return tl;
  };

  /* ---------------------------------------------------------------- */
  /* text : one animation profile per line treatment                   */
  /* ---------------------------------------------------------------- */
  let lastState = [];

  function tf(x, y, r, s) {
    return 'translate(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px) rotate(' + r.toFixed(2) + 'deg) scale(' + s.toFixed(3) + ')';
  }
  function easeOutB(t) { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }

  function lineState(ln, t) {
    const d = ln.data;
    if (t < d.t0) return 0;
    if (t < d.t1) return 1;
    return 2;
  }

  function resetLine(ln) {
    const el = ln.el;
    el.style.opacity = '0';
    el.style.transform = 'none';
    el.style.textShadow = '';
    for (const c of ln.chars) { c.style.opacity = '0'; c.style.transform = 'none'; }
    if (ln.glow) ln.glow.style.opacity = '0';
    if (ln.band) ln.band.style.opacity = '0';
  }

  function finishLine(ln) {
    const el = ln.el;
    el.style.opacity = '1';
    el.style.transform = 'none';
    el.style.textShadow = '';
    for (const c of ln.chars) { c.style.opacity = '1'; c.style.transform = 'none'; }
  }

  function animateLine(ln, t) {
    const d = ln.data, sp = ln.spec, n = ln.chars.length;
    const t0 = d.t0, t1 = d.t1;
    const mode = sp.mode;
    const K = (d.k && d.k.length === n) ? d.k : null;
    const act = (k) => (K ? K[k] : t0 + k * sp.stag);

    /* ---- exit : never starts before the last sung character has lit up ---- */
    const cut = sp.exit === 'cut';
    const lastK = K ? K[n - 1] : t0;
    const exStart = cut ? t1 - 0.11
      : Math.max(Math.min(t1 - 0.14, lastK + 0.16), t1 - 0.62);
    const q = clamp01((t - exStart) / (cut ? 0.11 : 0.44));
    const exitY = cut ? 0 : -16 * q;
    const outOp = 1 - (cut ? Math.min(1, q * 1.25) : q);

    /* ---- entrance ---- */
    let containOp = 1, cx = 0, cy = 0, cr = 0, cs = 1;

    if (mode === 'stamp') {
      const p = clamp01((t - t0) / 0.18);
      const e = 1 - Math.pow(1 - p, 4);
      cs = 1.46 - 0.46 * e;
      cr = -1.6 * (1 - e);
      containOp = clamp01((t - t0) / 0.06);
      if (p < 1) containOp *= 1;
    } else if (mode === 'hookBig') {
      const p = clamp01((t - t0) / 0.34);
      const e = 1 - Math.pow(1 - p, 5);
      cx = 470 * (1 - e);
      cs = 1.1 - 0.1 * e;
      containOp = clamp01((t - t0) / 0.1);
    } else if (mode === 'leftSlide' || mode === 'list') {
      containOp = clamp01((t - t0) / 0.05);
      if (mode === 'list') {
        const p = clamp01((t - t0) / 0.16);
        cs = 1.18 - 0.18 * (1 - Math.pow(1 - p, 3));
      }
    } else if (mode === 'corner') {
      const p = clamp01((t - t0) / 0.3);
      cy = 16 * (1 - p);
      containOp = clamp01((t - t0) / 0.12);
    } else {
      containOp = 1;
    }

    ln.el.style.opacity = (containOp * outOp).toFixed(3);
    ln.el.style.transform = tf(cx, cy + exitY, cr, cs);

    /* chroma split for echo / impacts */
    if (mode === 'echo') {
      const p = clamp01((t - t0) / 0.5);
      const off = 15 * (1 - p);
      ln.el.style.textShadow = off > 0.4
        ? (off.toFixed(1) + 'px 0 0 rgba(255,40,80,.55), ' + (-off).toFixed(1) + 'px 0 0 rgba(40,210,255,.55), 0 0 26px rgba(3,6,14,.95), 0 3px 14px rgba(0,0,0,.9)')
        : '';
    }

    /* ---- per character ---- */
    const reveal = (mode === 'band') ? null : true;
    for (let k = 0; k < n; k++) {
      const ch = ln.chars[k], a = act(k);
      const p = clamp01((t - a) / sp.dur);
      const e = easeOut(p);
      let op = e, x = 0, y = 0, r = 0, s = 1;

      if (mode === 'ink' || mode === 'echo' || mode === 'vertical' || mode === 'corner') {
        op = 0.085 + 0.915 * e;                    // karaoke : dim until sung
        y = (1 - e) * (mode === 'vertical' ? 14 : 24);
        s = 0.965 + 0.035 * e;
      } else if (mode === 'rise') {
        y = (1 - e) * 104;
        r = (1 - e) * 7;
        s = 0.92 + 0.08 * e;
        op = Math.min(1, e * 1.5);
      } else if (mode === 'sink') {
        const eb = easeOutB(clamp01((t - a) / (sp.dur + 0.16)));
        y = -(1 - eb) * 92;
        op = Math.min(1, clamp01((t - a) / 0.16) * 1.3);
        s = 0.94 + 0.06 * eb;
      } else if (mode === 'scatter') {
        const ang = (k * 137.5) * Math.PI / 180;
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
        const pp = clamp01((t - t0 - k * 0.012) / 0.16);
        s = 1.3 - 0.3 * (1 - Math.pow(1 - pp, 3));
        op = 1;
      } else if (mode === 'hookBig') {
        const pp = clamp01((t - t0 - k * 0.02) / 0.3);
        const ee = 1 - Math.pow(1 - pp, 4);
        x = (1 - ee) * 260;
        s = 1.12 - 0.12 * ee;
        op = Math.min(1, pp * 1.4);
      } else if (mode === 'list') {
        const pp = clamp01((t - t0 - k * 0.014) / 0.24);
        const ee = 1 - Math.pow(1 - pp, 3);
        s = 1.5 - 0.5 * ee;
        r = (1 - ee) * ((k % 2 ? 8 : -8));
        op = Math.min(1, pp * 1.5);
      } else if (mode === 'band') {
        const frac = n > 1 ? k / (n - 1) : 0;
        const sweep = clamp01((t - t0) / 0.62) * 1.4 - 0.1;
        const hit = clamp01((sweep - frac) * 7);
        op = 0.07 + 0.93 * hit;
        s = 0.97 + 0.03 * hit;
      }
      ch.style.opacity = op.toFixed(3);
      ch.style.transform = (x || y || r || s !== 1) ? tf(x, y, r, s) : 'none';
    }

    /* ---- accents ---- */
    if (ln.glow) {
      if (mode === 'vertical') {
        ln.glow.style.opacity = '0';
      } else {
        const gp = clamp01((t - t0 - 0.06) / 0.5);
        const gw = (mode === 'stamp' || mode === 'hookBig' || mode === 'list') ? 1.0
          : (mode === 'corner' ? 0.5 : 0.86);
        ln.glow.style.opacity = (0.9 * Math.min(1, gp * 1.6) * outOp).toFixed(3);
        ln.glow.style.transform = 'scaleX(' + (0.15 + gw * easeOut(gp)).toFixed(3) + ')';
      }
    }
    if (ln.band) {
      if (mode === 'band' || mode === 'hookBig' || mode === 'list') {
        const bp = clamp01((t - t0) / (mode === 'band' ? 0.55 : 0.3));
        ln.band.style.opacity = (0.95 * (1 - bp) * outOp).toFixed(3);
        ln.band.style.transform = 'translateY(-50%) translateX(' + ((bp * 220 - 110).toFixed(2)) + '%) scaleX(' +
          (mode === 'band' ? 0.7 : 1.5).toFixed(2) + ')';
      } else {
        ln.band.style.opacity = '0';
      }
    }
    /* hooks breathe on the beat */
    if (d.kind === 'hook' || d.kind === 'hook2') {
      const beat = 1 + 0.016 * U.beatPulse(t, 1, 5);
      ln.el.style.transform = tf(cx, cy + exitY, cr, cs * beat);
    }
  }

  /* subtitles: entrance varies, plus a karaoke progress bar */
  function animateSubs(t, L) {
    for (const s of L.subs) {
      const a = s.data.t0, b = s.data.t1;
      if (t < a || t > b) { s.bar.style.width = '0%'; continue; }
      const p = clamp01((t - a) / (b - a - 0.3));
      s.bar.style.width = (p * 100).toFixed(1) + '%';
    }
  }

  D.update = function (t, data, S, L, dom) {
    /* scene / title / subtitle animation */
    D.tl.time(t);

    const m = moodAt(t, data);

    /* pixi params */
    const P = {
      rain: m.rain, rainTint: m.rainTint, bokeh: m.bokeh, bokehTint: m.bokehTint,
      caustics: m.caustics, causticTint: '#4fa8e8', water: m.water, waterTint: '#0f2f5c',
      grain: m.grain, sparks: 1, sparkTint: '#ffd9a0', rainAngle: 6 + Math.sin(t * 0.13) * 2.5,
      rainSpeed: 1 + 0.25 * Math.sin(t * 0.07) + (m.id === 'D1' ? 0.25 : 0),
    };
    P.sparks = (m.id === 'S1' || m.id === 'H' || m.id === 'I' || m.id === 'D1') ? 1 : 0.35;

    /* svg warp (distortion) */
    const disp = document.getElementById('warpDisp');
    if (disp) {
      const warp = m.warp * (m.id === 'B1' ? (14 + 10 * Math.sin(t * 0.9) + 6 * Math.sin(t * 2.3)) : 26 * m.warp);
      disp.setAttribute('scale', warp.toFixed(2));
      const turb = document.getElementById('warpNoise');
      if (turb) turb.setAttribute('seed', String(3 + Math.floor(t * 2)));
    }

    /* tint + camera (beat punch, cut punch, shake) */
    dom.tint.style.background = m.tint;
    dom.tint.style.opacity = m.tintA.toFixed(3);
    const ho = heartOn(t);
    dom.heartHo = ho;
    const cam = cameraAt(t, data, m, ho);
    const tre = tremor(t, data.hits);
    const scale = dom.fitScale || 1;
    dom.stage.style.transform = 'scale(' + scale + ') translate(' + tre.x.toFixed(2) + 'px,' +
      tre.y.toFixed(2) + 'px) rotate(' + tre.r.toFixed(3) + 'deg) scale(' + cam.s.toFixed(4) + ')';

    /* plates + rings + transitions */
    plates(t, dom);
    rings(t, dom);
    sceneReveals(t, S);
    transients(t, data, m, dom);

    /* ---- japanese lines ---- */
    const tl2 = L.lines;
    for (let i = 0; i < tl2.length; i++) {
      const ln = tl2[i];
      const st = lineState(ln, t);
      if (lastState[i] !== st) {
        if (st === 0) resetLine(ln);
        else if (st === 2) { finishLine(ln); ln.el.style.opacity = '0'; }
        lastState[i] = st;
      }
      if (st === 1) animateLine(ln, t);
    }
    animateSubs(t, L);

    /* chroma split on the active line right after an impact */
    let hitAge = 1e9, hitType = '';
    for (const h of data.hits) {
      const a = t - h.t;
      if (a >= 0 && a < hitAge) { hitAge = a; hitType = h.type; }
    }
    if (hitAge < 0.26 && hitType !== 'list') {
      const k = 1 - hitAge / 0.26;
      const off = 7 * k;
      for (const ln of L.lines) {
        if (t >= ln.data.t0 && t < ln.data.t1 && ln.spec.mode !== 'echo') {
          ln.el.style.textShadow = off.toFixed(1) + 'px 0 22px rgba(255,40,80,.42), ' +
            (-off).toFixed(1) + 'px 0 22px rgba(40,210,255,.42), 0 0 26px rgba(3,6,14,.95), 0 3px 14px rgba(0,0,0,.9)';
        }
      }
    }

    /* ---- heartbeat ---- */
    const cfg = D.ekgAt(t, data);
    Stage.drawEKG(t, cfg);

    /* ---- scene-specific analytic flourishes ---- */
    flourishes(t, data, S, L, dom, m, tre);

    Stage.update(t, P, D.hits);
  };

  /* camera : only a gentle take breath and a soft accent on hard cuts.
     Movement between frames comes from the rhythmic tremor, not from hit shakes. */
  function cameraAt(t, data, m, ho) {
    let s = 1 + ho * (0.0026 * U.beatPulse(t, 1, 5) + 0.007 * U.barPulse(t, 2.4));
    for (const l of data.lines) {
      const age = t - l.t0;
      if (age < 0 || age > 0.8) continue;
      const hard = l.tr && l.tr.match(/^(stamp|hookBig|list[0-9])$/);
      const k = Math.exp(-Math.max(0, age) * 3.4) * (1 - Math.exp(-Math.max(0, age) * 22));
      s += (hard ? 0.016 : 0.006) * k;
    }
    return { s: s, x: 0, y: 0, r: 0 };
  }

  /* transient overlays: light sweep on cuts, strobe on the chorus bar */
  function transients(t, data, m, dom) {
    /* sweeps */
    let sweepP = -1;
    for (const h of data.hits) {
      if (h.type !== 'section' && h.type !== 'hook' && h.type !== 'hook2') continue;
      const age = t - h.t;
      if (age < 0 || age > 0.5) continue;
      const p = age / 0.5;
      if (p > sweepP) sweepP = p;
    }
    if (sweepP >= 0 && dom.sweep) {
      const e = 1 - Math.pow(1 - sweepP, 2);
      dom.sweep.style.opacity = (0.52 * (1 - sweepP * 0.7)).toFixed(3);
      dom.sweep.style.transform = 'skewX(-11deg) translateX(' + (-500 + e * 2600).toFixed(0) + 'px)';
    } else if (dom.sweep && dom.sweep.dataset.on === '1') {
      dom.sweep.style.opacity = '0'; dom.sweep.dataset.on = '0';
    }
    if (sweepP >= 0) dom.sweep.dataset.on = '1';

    /* chorus / driving sections : soft strobe on the bar head */
    const drive = (m.id === 'S1' || m.id === 'H' || m.id === 'D1' || m.id === 'I');
    let st = drive ? 0.075 * Math.pow(1 - ((t - data.phase) / (data.beat * 4)) % 1, 14) : 0;
    if (m.id === 'E' || m.id === 'F') st = 0.05 * Math.pow(1 - ((t - data.phase) / (data.beat * 4)) % 1, 16);
    if (m.id === 'B1') st = 0.09 * Math.pow(1 - ((t - data.phase) / (data.beat * 4)) % 1, 12);
    if (dom.strobe) {
      dom.strobe.style.background = (m.id === 'B1') ? '#ff2b46' : '#ffffff';
      dom.strobe.style.opacity = st < 0.004 ? '0' : st.toFixed(3);
    }
  }

  /* orbiting rings : positions are a pure function of t */
  function rings(t, dom) {
    if (!dom.rings) return;
    for (const r of dom.rings) {
      const d = r.def;
      const a = Math.min(clamp01((t - d.t0) / (d.fi || 1.2)), clamp01((d.t1 - t) / (d.fo || 1.2)));
      if (a <= 0.004) {
        if (r.box.dataset.on === '1') { r.box.style.opacity = '0'; r.box.dataset.on = '0'; }
        continue;
      }
      r.box.dataset.on = '1';
      const beat = d.pulse ? U.beatPulse(t, 1, 3) : 0;
      const R = d.R + (d.pulse ? 16 * beat : 0);
      const spin = t * d.speed;

      if (d.kind === 'text') {
        r.box.style.opacity = (a * 1).toFixed(3);
        for (let k = 0; k < r.n; k++) {
          const th = spin + (k / r.n) * 6.28318;
          const x = d.cx + Math.cos(th) * R;
          const y = d.cy + Math.sin(th) * R * d.ry;
          const sc = 1 + 0.14 * beat;
          const el = r.chars[k];
          el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) translate(-50%,-50%) rotate(' +
            ((th + 1.5708) * 57.2958).toFixed(1) + 'deg) scale(' + sc.toFixed(3) + ')';
          el.style.opacity = (0.45 + 0.55 * (0.5 + 0.5 * Math.cos(th * 2 - t * 0.9))).toFixed(3);
        }
      } else if (d.kind === 'ticks') {
        r.box.style.opacity = (a * 0.9).toFixed(3);
        r.box.style.transform = 'rotate(' + (spin * 57.2958).toFixed(2) + 'deg)';
        for (let k = 0; k < r.n; k++) {
          const th = (k / r.n) * 6.28318;
          const long = (k % 5 === 0);
          const el = r.chars[k];
          el.style.height = (long ? 26 : 12) + 'px';
          el.style.opacity = long ? '0.85' : '0.4';
          el.style.transform = 'translate(' + (d.cx + Math.cos(th) * R).toFixed(1) + 'px,' +
            (d.cy + Math.sin(th) * R * d.ry).toFixed(1) + 'px) rotate(' + (th * 57.2958 + 90).toFixed(1) + 'deg)';
        }
        if (r.hand) {
          const th = -1.5708 + t * (d.handSpeed || 0.42);
          r.hand.style.transform = 'translate(' + d.cx.toFixed(1) + 'px,' + d.cy.toFixed(1) + 'px) rotate(' + (th * 57.2958).toFixed(2) + 'deg)';
          r.hand.style.opacity = (0.85 * a).toFixed(3);
        }
      } else if (d.kind === 'eyes') {
        r.box.style.opacity = (a * (0.35 + 0.65 * Math.pow(1 - U.beatPhase(t), 8))).toFixed(3);
        r.box.style.transform = 'rotate(' + (spin * 57.2958).toFixed(2) + 'deg)';
        for (let k = 0; k < r.n; k++) {
          const th = (k / r.n) * 6.28318;
          const el = r.chars[k];
          const blink = 0.5 + 0.5 * Math.sin(t * 3.1 + k * 2.7);
          el.style.transform = 'translate(' + (d.cx + Math.cos(th) * R).toFixed(1) + 'px,' +
            (d.cy + Math.sin(th) * R * d.ry).toFixed(1) + 'px) translate(-50%,-50%) scale(' + (0.7 + 0.5 * blink).toFixed(2) + ')';
        }
      } else if (d.kind === 'motes') {
        r.box.style.opacity = (a * 0.9).toFixed(3);
        for (let k = 0; k < r.n; k++) {
          const th = spin + (k / r.n) * 6.28318;
          const rise = ((t * 26 + k * 41) % 260);
          const R2 = R * (0.35 + 0.75 * (1 - rise / 260));
          const el = r.chars[k];
          el.style.transform = 'translate(' + (d.cx + Math.cos(th) * R2).toFixed(1) + 'px,' +
            (d.cy - rise + Math.sin(th) * R2 * d.ry).toFixed(1) + 'px) translate(-50%,-50%)';
          el.style.opacity = (0.25 + 0.75 * (1 - rise / 260)).toFixed(3);
        }
      }
    }
  }

  /* the svg scene line art shares the plate's reveal vocabulary so a scene change
     reads as one gesture instead of two independent fades */
  const SCENE_REV = [
    { key: 'city', rev: 'waterUp', t0: 0.9, rd: 1.6 },
    { key: 'city', rev: 'iris', t0: 67.0, rd: 1.0 },
    { key: 'theatre', rev: 'curtain', t0: 40.4, rd: 1.3 },
    { key: 'heart', rev: 'bloom', t0: 53.9, rd: 1.1 },
    { key: 'heart', rev: 'bloom', t0: 160.8, rd: 1.1 },
    { key: 'umbrella', rev: 'rainDiag', t0: 80.7, rd: 1.4 },
    { key: 'deep', rev: 'waterUp', t0: 93.8, rd: 1.8 },
    { key: 'dream', rev: 'iris', t0: 107.7, rd: 1.3 },
    { key: 'two', rev: 'rainDiag', t0: 135.0, rd: 1.4 },
    { key: 'dawn', rev: 'waterUp', t0: 150.0, rd: 2.6 },
    { key: 'bloom', rev: 'bloom', t0: 175.4, rd: 1.6 },
  ];
  function sceneReveals(t, S) {
    const active = {};
    for (const r of SCENE_REV) {
      if (t >= r.t0 - 0.02 && t <= r.t0 + r.rd) {
        if (!(r.key in active)) active[r.key] = revealClip(r.rev, clamp01((t - r.t0) / r.rd)) || 'none';
      } else if (!(r.key in active)) {
        active[r.key] = 'none';
      }
    }
    for (const r of SCENE_REV) {
      const el = S[r.key];
      if (!el) continue;
      const clip = active[r.key] || 'none';
      if (clip !== (el.dataset.clip || '')) {
        el.style.clipPath = clip;
        el.dataset.clip = clip;
      }
    }
  }

  /* Camera for the line-art layer. One composited transform on #artLayer, so the
     whole scene can push in / drift / tilt without re-laying out the svg. */
  const ART_CAM = {
    intro: { z: [1.00, 1.035], x: [0, 0], y: [0, -4], r: [0, 0.15] },
    A1: { z: [1.015, 1.135], x: [14, -34], y: [6, -12], r: [-0.30, 0.30] },
    inter1: { z: [1.06, 1.23], x: [-24, 26], y: [4, -16], r: [0.45, -0.55] },
    B1: { z: [1.04, 1.17], x: [-16, 16], y: [0, -8], r: [-0.40, 0.40] },
    C1: { z: [1.03, 1.12], x: [0, 0], y: [0, -8], r: [0.30, -0.30] },
    S1: { z: [1.02, 1.14], x: [-8, 8], y: [0, -6], r: [0.2, -0.2] },
    A2: { z: [1.13, 1.02], x: [22, -20], y: [-8, 6], r: [0.50, -0.30] },
    D1: { z: [1.02, 1.17], x: [0, 0], y: [-8, 12], r: [-0.20, 0.40] },
    inter2: { z: [1.10, 1.25], x: [0, 0], y: [8, -8], r: [0.30, -0.40] },
    D2: { z: [1.04, 1.15], x: [-12, 14], y: [0, -4], r: [-0.25, 0.25] },
    E: { z: [1.07, 1.11], x: [0, 0], y: [0, -6], r: [0.3, -0.3] },
    F: { z: [1.03, 1.13], x: [0, 0], y: [0, -8], r: [-0.2, 0.2] },
    G: { z: [1.02, 1.13], x: [0, 0], y: [0, -6], r: [-0.3, 0.3] },
    H: { z: [1.02, 1.17], x: [0, 0], y: [-4, -14], r: [0, 0.4] },
    I: { z: [1.05, 1.19], x: [0, 0], y: [-6, -18], r: [0.3, 0] },
    outro: { z: [1.10, 1.27], x: [0, 0], y: [-10, -22], r: [0.2, -0.2] },
  };
  function artCamAt(t, data, m) {
    const a = ART_CAM[m.id] || ART_CAM.A1;
    const u = clamp01((t - m.sec.t0) / Math.max(0.001, m.sec.t1 - m.sec.t0));
    const e = U.easeInOut(u);
    return {
      z: U.lerp(a.z[0], a.z[1], e),
      x: U.lerp(a.x[0], a.x[1], e),
      y: U.lerp(a.y[0], a.y[1], e),
      r: U.lerp(a.r[0], a.r[1], e),
    };
  }

  /* ---------------------------------------------------------------- */
  /* rhythmic tremor                                                   */
  /*                                                                   */
  /* The frame no longer gets a uniform "hit shake" : instead a continuous  */
  /* tremor whose RATE follows how busy the singing is (measured from the   */
  /* per-character note onsets) - slow and calm on held notes, fast on the  */
  /* rapid runs - so it speeds up and slows down with the music itself.     */
  /* ---------------------------------------------------------------- */
  const TRE = { grid: 0.05, act: null, ph: null, n: 0 };

  function buildTremor(data) {
    const G = TRE.grid, n = Math.ceil(data.duration / G) + 2;
    const act = new Float32Array(n);
    for (const l of data.lines) {
      if (!l.k) continue;
      for (const tt of l.k) {
        const i = Math.round(tt / G);
        if (i >= 0 && i < n) act[i] += 1;
      }
    }
    for (const b of data.beats) {
      const i = Math.round(b / G);
      if (i >= 0 && i < n) act[i] += 0.45;
    }
    const W = Math.round(0.55 / G);
    const sm = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      let s = 0;
      const j0 = Math.max(0, i - W), j1 = Math.min(n - 1, i + W);
      for (let j = j0; j <= j1; j++) s += act[j];
      sm[i] = s / (j1 - j0 + 1);
    }
    let mx = 1e-6;
    for (let i = 0; i < n; i++) if (sm[i] > mx) mx = sm[i];
    for (let i = 0; i < n; i++) sm[i] = Math.min(1, sm[i] / (mx * 0.72));
    const ph = new Float32Array(n);
    for (let i = 1; i < n; i++) ph[i] = ph[i - 1] + (2.0 + 5.0 * sm[i]) * G;
    TRE.act = sm; TRE.ph = ph; TRE.n = n;
  }

  /* Where the heart itself is on screen : all pulsing / wobble motion is gated by
     this, so the frame stays perfectly still until the heart motif appears.
     [start, end, weight] */
  const HEART_WIN = [[53.4, 67.6, 1.0], [160.7, 176.2, 1.0], [175.4, 198.0, 0.8]];
  function heartOn(t) {
    let v = 0;
    for (const [a, b, w] of HEART_WIN) {
      const k = Math.min(clamp01((t - a) / 1.2), clamp01((b - t) / 1.8)) * w;
      if (k > v) v = k;
    }
    return v;
  }
  D.heartOn = heartOn;

  /* No steady global shake: the frame is still, and gets one short accent
     only when a scene / chorus actually turns over. */
  function tremor(t, hits) {
    let a = 0;
    if (hits) {
      for (const h of hits) {
        const age = t - h.t;
        if (age < 0 || age > 0.62) continue;
        const w = h.type === 'section' ? 1 : (h.type === 'hook' || h.type === 'hook2' ? 0.5 : 0.3);
        const k = w * Math.exp(-Math.max(0, age) * 7.2) * (1 - Math.exp(-Math.max(0, age) * 40));
        if (k > a) a = k;
      }
    }
    const ho = heartOn(t);
    const amp = 5.4 * a * ho;
    return {
      x: amp * Math.sin(t * 39),
      y: amp * 0.8 * Math.sin(t * 32 + 1.1),
      r: 0.24 * a * ho * Math.sin(t * 28 + 0.4),
      ph: t * 6.2, act: a * ho, ho: ho,
    };
  }
  D.tremor = tremor;

  /* themed reveal masks : the vocabulary follows the lyric imagery */
  function revealClip(rev, p) {
    if (!rev || p >= 1) return '';
    const q = 1 - p;
    switch (rev) {
      case 'waterUp': return 'inset(' + (q * 100).toFixed(2) + '% 0% 0% 0%)';
      case 'curtain': return 'inset(0% ' + (q * 50).toFixed(2) + '% 0% ' + (q * 50).toFixed(2) + '%)';
      case 'iris': return 'circle(' + (p * 78).toFixed(2) + '% at 50% 46%)';
      case 'bloom': return 'circle(' + (p * 88).toFixed(2) + '% at 50% 52%)';
      case 'rainDiag': {
        const y = q * 132;
        return 'polygon(-12% ' + y.toFixed(1) + '%, 112% ' + (y - 26).toFixed(1) + '%, 112% 112%, -12% 112%)';
      }
      case 'glitch': return '';
      default: return '';
    }
  }

  /* the camera solve : keep the subject on its screen target, then clamp so the
     plate can never expose an edge */
  const EW = 2016, EH = 1176, EOFF = 48;   // .plate is inset -48px
  function plateCam(el, p, t) {
    const iw = parseFloat(el.dataset.iw) || 1280, ih = parseFloat(el.dataset.ih) || 704;
    const k = Math.max(EW / iw, EH / ih);
    const ox = (EW - iw * k) / 2, oy = (EH - ih * k) / 2;
    const span = Math.max(0.001, p.t1 - p.t0);
    const u = clamp01((t - p.t0) / span);
    const eu = U.easeInOut(u);
    let z = U.lerp(p.z0, p.z1, eu);
    let fx = p.focus[0], fy = p.focus[1];
    let Tx = U.lerp(p.tgt0[0], p.tgt1[0], eu);
    let Ty = U.lerp(p.tgt0[1], p.tgt1[1], eu);
    /* content accents : ease in, hold with a slow drift, ease back out */
    if (p.shots) {
      for (const s of p.shots) {
        const u = t - s.t;
        const rin = s.rin || 1.6, hold = s.hold === undefined ? 1.8 : s.hold, rout = s.rout || 2.4;
        if (u < -0.2 || u > rin + hold + rout) continue;
        const pin = U.smoothstep(clamp01(u / rin));
        const pout = 1 - U.smoothstep(clamp01((u - rin - hold) / rout));
        const k = Math.min(pin, pout);
        if (k <= 0) continue;
        z *= 1 + (s.z - 1) * k;
        /* after the push settles, drift slowly to keep the subject alive */
        const dr = U.smoothstep(clamp01((u - rin * 0.6) / (rin + hold)));
        Tx += (s.dx || 0) * dr;
        Ty += (s.dy || 0) * dr;
        if (s.face) fy -= 0.05 * k;
      }
    }
    /* the picture yields to the lyrics : a nudge on entry, a settle on exit */
    if (p.camLink) {
      for (const l of p.camLink) {
        const age = t - l.t0, left = l.t1 - t;
        if (age > -0.1 && age < 0.75) {
          const kk = Math.exp(-Math.max(0, age) * 3.2) * (1 - Math.exp(-Math.max(0, age) * 26));
          z *= 1 + l.push * kk;
          Ty += (l.top < 540 ? 7 : -7) * kk;
        }
        if (left < 0.3 && left > -0.8) {
          const kk = Math.exp(-Math.abs(Math.min(0, left)) * 3.4);
          z *= 1 - 0.012 * kk;
          Ty -= (l.top < 540 ? 4 : -4) * kk;
        }
      }
    }
    /* beat punch + bar breathing : kept gentle so it never reads as a jolt */
    z *= 1 + 0.006 * U.beatPulse(t, 1, 3) + 0.008 * U.barPulse(t, 2.4);
    /* solve translate so the subject lands on (Tx,Ty) */
    const Sx = ox + fx * iw * k, Sy = oy + fy * ih * k;
    let tx = (Tx + EOFF) - z * Sx;
    let ty = (Ty + EOFF) - z * Sy;
    /* clamp inside the frame */
    const loX = 1920 - EW * z + EOFF, hiX = EOFF;
    const loY = 1080 - EH * z + EOFF, hiY = EOFF;
    tx = Math.min(hiX, Math.max(loX, tx));
    ty = Math.min(hiY, Math.max(loY, ty));
    return 'translate(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px) scale(' + z.toFixed(4) + ')';
  }

  /* generated background plates with deterministic ken-burns drift */
  function plates(t, dom) {
    if (!dom.plates) return;
    for (const p of PLATES) {
      const el = dom.plates[p.id];
      if (!el) continue;
      const fi = p.fi || 1.1, fo = p.fo || 1.1;
      let a = Math.min(clamp01((t - p.t0) / fi), clamp01((p.t1 - t) / fo));
      if (a <= 0.003) {
        if (el.dataset.on === '1') { el.style.opacity = '0'; el.dataset.on = '0'; }
        continue;
      }
      /* glitch arrival : a fast flicker instead of a smooth fade */
      if (p.rev === 'glitch' && (t - p.t0) < 0.55) {
        const g = t - p.t0;
        a *= 0.35 + 0.65 * (Math.sin(g * 78) * 0.5 + 0.5);
      }
      el.style.opacity = (a * p.op).toFixed(3);
      el.dataset.on = '1';
      el.style.transform = plateCam(el, p, t);
      if (p.pulse && dom.heartHo > 0.01) {
        const pl = 1 + 0.008 * U.beatPulse(t, 1, 4) * dom.heartHo;
        el.style.transform += ' scale(' + pl.toFixed(4) + ')';
      }
      /* themed reveal */
      if (p.rev) {
        const rp = clamp01((t - p.t0) / (p.rd || fi));
        const clip = revealClip(p.rev, rp);
        if (clip !== (el.dataset.clip || '')) { el.style.clipPath = clip || 'none'; el.dataset.clip = clip; }
      }
    }
  }

  /* continuous scene flourishes that would be awkward as tweens */
  function flourishes(t, data, S, L, dom, m, tre) {
    /* marionette strings sway instead of a limb dance */
    if (S.marionetteStrings && t > 40.4 && t < 54.4) {
      const k = U.beatPulse(t, 1, 2.2);
      const sw = Math.sin(t * 2.2);
      S.marionetteStrings.setAttribute('transform', 'rotate(' + (sw * 2.2 + k * 1.4).toFixed(2) + ', 0, -560)');
    }
    /* heart rings */
    if (S.heartRing0) {
      for (let i = 0; i < 3; i++) {
        const el = document.getElementById('heartRing' + i);
        if (!el) continue;
        const off = i * 0.24;
        const ph = ((t - data.phase) / data.beat) % 1;
        const q = (ph + off) % 1;
        const beat = Math.floor((t - data.phase) / data.beat - off);
        const px = (t > 53.9 && t < 68.0) || (t > 160.8 && t < 177.0);
        el.setAttribute('r', (170 + q * 430).toFixed(1));
        el.setAttribute('opacity', px ? (0.5 * (1 - q) * Math.exp(-(beat % 4) * 0.35)).toFixed(3) : '0');
      }
    }
    /* the fragile thread (G) + the two figures (F) */
    if (S.threadLine && t > 149.9 && t < 163) {
      const sag = 60 + Math.sin(t * 0.7) * 18;
      const jitter = Math.sin(t * 11) * 4 + Math.sin(t * 3.3) * 6;
      const d = 'M 470 540 C 700 ' + (540 + sag) + ' 1220 ' + (540 + sag + jitter) + ' 1450 540';
      S.threadLine.setAttribute('d', d);
      S.threadLine.setAttribute('opacity', (0.5 + 0.35 * Math.abs(Math.sin(t * 0.9))).toFixed(2));
    }
    if (S.twoThread && t > 134.9 && t < 150.5) {
      const p = clamp01((t - 135.34) / 15);
      const d = 'M 700 700 C 860 ' + (520 + 40 * p) + ' 1060 ' + (520 - 30 * p) + ' 1220 700';
      S.twoThread.setAttribute('d', d);
      S.twoThread.setAttribute('opacity', (0.6 * (1 - p)).toFixed(2));
    }
    /* dawn stars disappear as the light rises */
    if (S.dawnStars && t > 149 && t < 176) {
      const p = clamp01((t - 152) / 20);
      S.dawnStars.setAttribute('opacity', (1 - p).toFixed(2));
    }
    /* bloom rays */
    if (t > 175 && S.svg) {
      const p = clamp01((t - 175.2) / 12);
      const core = document.getElementById('bloomCore');
      if (core) core.setAttribute('opacity', (0.85 * p).toFixed(3));
      for (let i = 0; i < 24; i++) {
        const el = document.getElementById('bloomRay' + i);
        if (el) el.setAttribute('opacity', (0.30 * p * (0.6 + 0.4 * Math.sin(t * 0.8 + i))).toFixed(3));
      }
    }
    /* crowd eyes blink on beats */
    if (S.crowdEyes && S.crowdEyes.length && t > 28 && t < 40.5) {
      const ph = ((t - data.phase) / data.beat) % 1;
      const on = ph < 0.14 ? 1 - ph / 0.14 : 0;
      const v = (0.25 + 0.75 * on).toFixed(3);
      for (const e of S.crowdEyes) e.style.opacity = v;
    }
    /* ferris wheel: stopped, but drifts a hair */
    if (S.ferris && t > 123.7 && t < 127.1) {
      S.ferris.setAttribute('transform', 'translate(1400,540) rotate(' + (Math.sin(t * 0.5) * 2.2).toFixed(2) + ')');
    }
    /* hand-drawn "boil" + beat-driven camera on the line-art layer.
       One composited transform on the layer keeps this cheap in software rendering. */
    /* the line art keeps a faint hand-drawn boil, at a constant calm rate */
    const boilA = 0.40;
    const bx = Math.sin(t * 6.1) * boilA + Math.sin(t * 2.7) * 0.22;
    const by = Math.cos(t * 5.3 + 0.7) * boilA + Math.cos(t * 2.3) * 0.22;
    const beat = U.beatPulse(t, 1, 4);
    const bar = U.barPulse(t, 3);
    const hoA = tre ? tre.ho : 0;
    const bscale = (1 + 0.004 * Math.sin(t * 0.6)) * (1 + hoA * (0.003 * beat + 0.005 * bar));
    const brot = 0.22 * Math.sin(t * 0.62) + 0.08 * Math.sin(t * 1.7) + hoA * 0.09 * beat;
    const cam = artCamAt(t, data, m);
    if (dom.artLayer) {
      dom.artLayer.style.transform =
        'translate(' + (bx + cam.x).toFixed(2) + 'px,' + (by + cam.y).toFixed(2) +
        'px) rotate(' + (brot + cam.r).toFixed(3) + 'deg) scale(' + (bscale * cam.z).toFixed(4) + ')';
    }
    /* the heart beats as a graphic object too */
    if (S.heartBody) {
      const kk = (t > 53.5 && t < 68.0) || (t > 160.7 && t < 176.5);
      const hb = U.beatPulse(t, 1, 3);
      S.heartBody.setAttribute('transform', 'translate(960,540) rotate(' + ((kk ? 3.2 * Math.sin(t * 2.6) + 4.5 * hb : 0)).toFixed(2) +
        ') scale(' + (kk ? (1 + 0.035 * hb) : 1).toFixed(4) + ')');
    }
    /* towers / bus / ward lean with the wind */
    if (S.towers && t > 120 && t < 125) {
      S.towers.setAttribute('transform', 'rotate(' + (Math.sin(t * 0.9) * 0.5 + 0.3 * beat).toFixed(3) + ', 960, 900)');
    }
    if (S.bus && t > 123.6 && t < 127.3) {
      S.bus.setAttribute('transform', 'translate(' + (Math.sin(t * 0.7) * 3).toFixed(2) + ',' + (Math.sin(t * 1.3) * 2).toFixed(2) + ')');
    }
    /* flowing water in the city reflection */
    if (S.cityWaves) {
      for (let i = 0; i < S.cityWaves.length; i++) {
        const el = S.cityWaves[i];
        const off = ((t * (16 + i * 5)) % 120) - 60;
        el.setAttribute('transform', 'translate(' + off.toFixed(1) + ',0)');
      }
    }
    /* the city scrolls left-to-right forever : three parallax bands, each a
       seamless 1920px loop, so buildings keep entering and leaving the frame */
    if (S.cityBands) {
      const dist = 24 * Math.max(0, t - 0.4) + 0.62 * Math.pow(Math.max(0, t - 0.4), 2);
      for (let i = 0; i < S.cityBands.length; i++) {
        const b = S.cityBands[i];
        const off = (dist * b.sp) % 1920;
        b.el.setAttribute('transform', 'translate(' + off.toFixed(1) + ',0)');
      }
    }
    /* dawn rays rotate slowly */
    if (S.dawnRays && t > 149) {
      S.dawnRays.setAttribute('transform', 'rotate(' + (Math.sin(t * 0.12) * 2.6).toFixed(2) + ', 960, 1006)');
    }
    /* theatre curtains breathe and swing on the beat */
    if (S.curtains && t > 40.4 && t < 54.4) {
      const b = 1 + 0.016 * Math.sin(t * 1.7) + 0.02 * beat;
      const sx = Math.sin(t * 0.8) * 5 + beat * 6;
      S.curtains.setAttribute('transform', 'translate(' + sx.toFixed(1) + ',0) scale(' + b.toFixed(4) + ',1)');
    }
  }

  D.moodAt = moodAt;
  global.Director = D;
})(window);
