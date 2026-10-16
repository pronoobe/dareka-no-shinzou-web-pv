/* Scene line-art, generated as SVG. Everything lives in one <svg> with a group per scene. */
(function (global) {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  const A = {};

  function el(tag, attrs, kids) {
    const n = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (kids) for (const c of [].concat(kids)) n.appendChild(c);
    return n;
  }
  function path(d, attrs) { return el('path', Object.assign({ d: d, fill: 'none' }, attrs || {})); }
  function txt(s, attrs) { const n = el('text', Object.assign({ fill: 'none' }, attrs || {})); n.textContent = s; return n; }
  A.el = el; A.path = path;

  const STROKE = '#c9d6ee';
  const DIM = '#5d6f96';

  /* ---------- defs : gradients + filters ---------- */
  A.defs = function () {
    const d = el('defs');
    const add = (node) => d.appendChild(node);
    add(el('radialGradient', { id: 'gGlow', cx: '50%', cy: '50%', r: '50%' },
      [el('stop', { offset: '0%', 'stop-color': '#8fe6ff', 'stop-opacity': '.85' }),
       el('stop', { offset: '55%', 'stop-color': '#3f8dd8', 'stop-opacity': '.25' }),
       el('stop', { offset: '100%', 'stop-color': '#0b1a3a', 'stop-opacity': '0' })]));
    add(el('radialGradient', { id: 'gGlowSoft', cx: '50%', cy: '50%', r: '50%' },
      [el('stop', { offset: '0%', 'stop-color': '#dce9ff', 'stop-opacity': '.30' }),
       el('stop', { offset: '45%', 'stop-color': '#9fc0ee', 'stop-opacity': '.09' }),
       el('stop', { offset: '100%', 'stop-color': '#0b1a3a', 'stop-opacity': '0' })]));
    add(el('radialGradient', { id: 'gHeart', cx: '50%', cy: '45%', r: '55%' },
      [el('stop', { offset: '0%', 'stop-color': '#ff6b7d', 'stop-opacity': '.55' }),
       el('stop', { offset: '60%', 'stop-color': '#c01330', 'stop-opacity': '.20' }),
       el('stop', { offset: '100%', 'stop-color': '#3a0410', 'stop-opacity': '0' })]));
    add(el('linearGradient', { id: 'gDawn', x1: '0', y1: '0', x2: '0', y2: '1' },
      [el('stop', { offset: '0%', 'stop-color': '#f6c98a', 'stop-opacity': '0' }),
       el('stop', { offset: '60%', 'stop-color': '#e8a05c', 'stop-opacity': '.35' }),
       el('stop', { offset: '100%', 'stop-color': '#f7d9a8', 'stop-opacity': '.75' })]));
    add(el('linearGradient', { id: 'gWater', x1: '0', y1: '0', x2: '0', y2: '1' },
      [el('stop', { offset: '0%', 'stop-color': '#0a2a52', 'stop-opacity': '.15' }),
       el('stop', { offset: '100%', 'stop-color': '#061428', 'stop-opacity': '.95' })]));
    add(el('filter', { id: 'fWarp', x: '-15%', y: '-15%', width: '130%', height: '130%' },
      [el('feTurbulence', { id: 'warpNoise', type: 'fractalNoise', baseFrequency: '0.0016 0.004', numOctaves: '2', seed: '7', result: 'n' }),
       el('feDisplacementMap', { id: 'warpDisp', in: 'SourceGraphic', in2: 'n', scale: '0', xChannelSelector: 'R', yChannelSelector: 'G' })]));
    add(el('filter', { id: 'fBlur', x: '-20%', y: '-20%', width: '140%', height: '140%' },
      [el('feGaussianBlur', { stdDeviation: '9' })]));
    add(el('filter', { id: 'fBlurBig', x: '-30%', y: '-30%', width: '160%', height: '160%' },
      [el('feGaussianBlur', { stdDeviation: '26' })]));
    add(el('filter', { id: 'fGlow' },
      [el('feGaussianBlur', { stdDeviation: '7', result: 'b' }),
       el('feMerge', null, [el('feMergeNode', { in: 'b' }), el('feMergeNode', { in: 'SourceGraphic' })])]));
    return d;
  };

  /* ---------- building blocks ---------- */
  /* a skyline that fills exactly one 1920px tile, so copies of it tile seamlessly
     and the layer can scroll forever with buildings entering / leaving the frame */
  function skylineTile(seed, baseY, maxH, minH, wMin, wMax, color, op, windows, winCol) {
    const r = U.rng(seed);
    let d = 'M 0 ' + baseY;
    let x = 0;
    const win = [];
    while (x < 1920 - 8) {
      let w = wMin + r() * (wMax - wMin);
      if (x + w > 1920) w = 1920 - x;
      const h = minH + Math.pow(r(), 1.5) * (maxH - minH);
      d += ' L ' + x.toFixed(1) + ' ' + (baseY - h).toFixed(1) +
           ' L ' + (x + w).toFixed(1) + ' ' + (baseY - h).toFixed(1);
      if (windows) {
        const cols = Math.max(1, Math.floor(w / 30)), rows = Math.max(1, Math.floor(h / 38));
        for (let c = 0; c < cols; c++) {
          for (let q = 0; q < rows; q++) {
            if (r() < 0.45) win.push([x + 9 + c * 30, baseY - h + 18 + q * 38, 4 + r() * 3, 5 + r() * 4]);
          }
        }
      }
      x += w;
    }
    d += ' L 1920 ' + baseY + ' L 1920 ' + (baseY + 40) + ' L 0 ' + (baseY + 40) + ' Z';
    const g = el('g');
    g.appendChild(path(d, { fill: color, opacity: op }));
    for (const [wx, wy, ww, wh] of win) {
      g.appendChild(el('rect', { x: wx.toFixed(1), y: wy.toFixed(1), width: ww.toFixed(1), height: wh.toFixed(1),
        fill: winCol || '#e8d9a0', opacity: (0.10 + r() * 0.5).toFixed(2) }));
    }
    return g;
  }
  A.skylineTile = skylineTile;

  function skyline(seed, baseY, maxH, minH, wMin, wMax, color, op) {
    const r = U.rng(seed);
    let d = 'M -40 ' + baseY;
    let x = -40;
    const windows = [];
    while (x < 1960) {
      const w = wMin + r() * (wMax - wMin);
      const h = minH + Math.pow(r(), 1.5) * (maxH - minH);
      d += ' L ' + x.toFixed(1) + ' ' + (baseY - h).toFixed(1) +
           ' L ' + (x + w).toFixed(1) + ' ' + (baseY - h).toFixed(1);
      if (r() < 0.35) {
        const aw = 2 + r() * 3, ah = 20 + r() * 60;
        d += ' l 0 ' + (-ah).toFixed(1) + ' l ' + aw.toFixed(1) + ' 0 l 0 ' + ah.toFixed(1);
      }
      const cols = Math.max(1, Math.floor(w / 26)), rows = Math.max(1, Math.floor(h / 34));
      for (let c = 0; c < cols; c++) {
        for (let q = 0; q < rows; q++) {
          if (r() < 0.42) {
            windows.push([x + 8 + c * 26, baseY - h + 16 + q * 34, 4 + r() * 3, 5 + r() * 4]);
          }
        }
      }
      x += w;
    }
    d += ' L 1960 ' + baseY + ' Z';
    const g = el('g');
    g.appendChild(path(d, { fill: color, opacity: op }));
    for (const [wx, wy, ww, wh] of windows) {
      g.appendChild(el('rect', { x: wx.toFixed(1), y: wy.toFixed(1), width: ww.toFixed(1), height: wh.toFixed(1),
        fill: '#e8d9a0', opacity: (0.10 + r() * 0.5).toFixed(2) }));
    }
    return g;
  }

  function waveLine(y, amp, k, ph, attrs) {
    let d = 'M -40 ' + y;
    for (let x = -40; x <= 1960; x += 24) {
      d += ' L ' + x + ' ' + (y + Math.sin(x * k + ph) * amp).toFixed(2);
    }
    return path(d, attrs);
  }

  /* ---------- scenes ---------- */
  A.build = function (svg) {
    const S = {};
    svg.appendChild(A.defs());

    /* --- 1. drowned city : three parallax bands, each a seamless 1920px loop --- */
    {
      const g = el('g', { id: 's-city', opacity: 0 });
      const halo = el('g', { opacity: 0.9 });
      halo.appendChild(el('circle', { cx: 1470, cy: 250, r: 230, fill: 'url(#gGlowSoft)' }));
      halo.appendChild(el('circle', { cx: 1470, cy: 250, r: 56, fill: '#e8f0ff', opacity: 0.34 }));
      halo.appendChild(el('circle', { cx: 1492, cy: 240, r: 52, fill: '#070b18', opacity: 0.92 }));
      g.appendChild(halo);
      g.appendChild(el('ellipse', { cx: 960, cy: 760, rx: 1500, ry: 210, fill: '#2e4f88', opacity: 0.22, filter: 'url(#fBlurBig)' }));

      function band(name, seed, baseY, maxH, minH, wMin, wMax, color, op, windows, blur, mirror) {
        const box = el('g', { id: name });
        for (let c = 0; c < 2; c++) {
          const holder = el('g', { transform: 'translate(' + (-c * 1920) + ',0)' });
          const one = skylineTile(seed, baseY, maxH, minH, wMin, wMax, color, op, windows);
          if (blur) one.setAttribute('filter', 'url(#fBlurBig)');
          holder.appendChild(one);
          if (mirror) {
            const m = el('g', { transform: 'translate(0,' + (2 * baseY) + ') scale(1,-1)', opacity: 0.30, filter: 'url(#fBlur)' });
            const r2 = skylineTile(seed, baseY, maxH, minH, wMin, wMax, '#123059', 1, false);
            m.appendChild(r2);
            holder.appendChild(m);
          }
          box.appendChild(holder);
        }
        g.appendChild(box);
        return box;
      }

      const farBand = band('cityFar', 11, 690, 300, 90, 50, 150, '#0a1226', 0.95, false, true, false);
      const mainBand = band('cityMain', 7, 745, 430, 120, 60, 190, '#060a15', 1, true, false, true);
      const frontBand = band('cityFront', 23, 800, 260, 80, 40, 120, '#0b1428', 0.92, true, false, false);
      const waves = [];
      for (let i = 0; i < 7; i++) {
        const w = waveLine(848 + i * 28, 4 + i, 0.004 + i * 0.0008, i * 1.7,
          { stroke: '#2c5f96', 'stroke-width': 1.6, opacity: 0.5 - i * 0.05 });
        waves.push(w);
        g.appendChild(w);
      }
      g.appendChild(el('line', { x1: 0, y1: 745, x2: 1920, y2: 745, stroke: '#4d7fc4', 'stroke-width': 1.4, opacity: 0.55 }));
      S.city = g; S.cityWaves = waves;
      S.cityBands = [
        { el: farBand, sp: 0.42 },
        { el: mainBand, sp: 1.0 },
        { el: frontBand, sp: 1.55 },
      ];
      svg.appendChild(g);
    }

    /* --- 2. the crowd of monsters : ground line only, the crowd itself is ai art --- */
    {
      const g = el('g', { id: 's-crowd', opacity: 0, filter: 'url(#fWarp)' });
      g.appendChild(el('line', { x1: 0, y1: 830, x2: 1920, y2: 830, stroke: '#3a4a72', 'stroke-width': 1.2, opacity: 0.5 }));
      for (let i = 0; i < 14; i++) {
        g.appendChild(el('line', { x1: i * 150 - 40, y1: 830, x2: i * 150 - 10, y2: 906, stroke: '#1e2b48', 'stroke-width': 1, opacity: 0.5 }));
      }
      S.crowd = g; S.crowdEyes = []; svg.appendChild(g);
    }

    /* --- 3. theatre : the marionette itself is ai art, only the rig stays --- */
    {
      const g = el('g', { id: 's-theatre', opacity: 0 });
      const curtains = el('g', { id: 'curtains' });
      curtains.appendChild(path('M 0 0 L 420 0 C 300 260 330 620 180 1080 L 0 1080 Z', { fill: '#080c18', opacity: 0.9 }));
      curtains.appendChild(path('M 1920 0 L 1500 0 C 1620 260 1590 620 1740 1080 L 1920 1080 Z', { fill: '#080c18', opacity: 0.9 }));
      for (let i = 0; i < 9; i++) {
        curtains.appendChild(path('M ' + (60 + i * 42) + ' 40 C ' + (30 + i * 42) + ' 380 ' + (90 + i * 42) + ' 700 ' + (40 + i * 42) + ' 1060',
          { stroke: '#1d2a4d', 'stroke-width': 2.2, opacity: 0.85 }));
      }
      g.appendChild(curtains);
      g.appendChild(path('M 0 96 C 640 220 1280 220 1920 96 L 1920 0 L 0 0 Z', { fill: '#0a0f20', opacity: 0.95 }));
      const cones = el('g', { opacity: 0.5 });
      for (const [x, w, op] of [[560, 260, 0.5], [1360, 240, 0.42]]) {
        cones.appendChild(path('M ' + x + ' 60 L ' + (x - w) + ' 920 L ' + (x + w) + ' 920 Z',
          { fill: '#dbe8ff', opacity: op * 0.14 }));
      }
      g.appendChild(cones);
      g.appendChild(el('line', { x1: 0, y1: 920, x2: 1920, y2: 920, stroke: '#33406a', 'stroke-width': 1.3, opacity: 0.7 }));
      const m = el('g', { id: 'marionette', transform: 'translate(960,540)' });
      const strings = el('g', { opacity: 0.55 });
      for (const [name, x] of [['armL', -104], ['armR', 104], ['legL', -40], ['legR', 40], ['head', 0]]) {
        strings.appendChild(el('line', { x1: x * 1.3, y1: -560, x2: x * 0.8, y2: name === 'head' ? -230 : (name[0] === 'a' ? -120 : 40),
          stroke: '#93a8cc', 'stroke-width': 1, opacity: 0.55 }));
      }
      m.appendChild(strings);
      m.appendChild(el('line', { x1: -120, y1: -600, x2: 120, y2: -600, stroke: '#93a8cc', 'stroke-width': 3, opacity: 0.5 }));
      g.appendChild(m);
      S.theatre = g; S.curtains = curtains; S.marionette = m; S.marionetteLimbs = null; S.marionetteStrings = strings; svg.appendChild(g);
    }

    /* --- 4. heart --- */
    {
      const g = el('g', { id: 's-heart', opacity: 0 });
      g.appendChild(el('circle', { cx: 960, cy: 520, r: 470, fill: 'url(#gHeart)' }));
      const h = el('g', { id: 'heartBody', transform: 'translate(960,540)' });
      // great vessels
      h.appendChild(path('M -30 -150 C -46 -216 -36 -268 4 -282 C 44 -296 78 -266 74 -214',
        { stroke: '#ff8a99', 'stroke-width': 3.2, opacity: 0.92 }));
      h.appendChild(path('M 58 -186 C 76 -236 106 -262 140 -252 C 172 -242 176 -200 154 -170',
        { stroke: '#8fd0ff', 'stroke-width': 3, opacity: 0.85 }));
      // body
      h.appendChild(path('M 0 196 C -74 132 -168 66 -190 -14 C -212 -96 -172 -178 -114 -196 C -62 -212 -20 -180 0 -134 C 20 -180 62 -212 114 -196 C 172 -178 212 -96 190 -14 C 168 66 74 132 0 196 Z',
        { stroke: '#ff8a99', 'stroke-width': 3.6, fill: 'rgba(255,60,90,0.07)' }));
      // interior muscle / septum
      h.appendChild(path('M 0 -118 C -8 -40 -8 40 0 178', { stroke: '#ff8a99', 'stroke-width': 1.4, opacity: 0.42 }));
      h.appendChild(path('M -150 -60 C -96 -34 -52 -30 0 -44', { stroke: '#ff8a99', 'stroke-width': 1.2, opacity: 0.32 }));
      h.appendChild(path('M 150 -60 C 96 -34 52 -30 0 -44', { stroke: '#ff8a99', 'stroke-width': 1.2, opacity: 0.32 }));
      h.appendChild(path('M -120 60 C -70 74 -30 70 0 52', { stroke: '#ff8a99', 'stroke-width': 1.2, opacity: 0.28 }));
      g.appendChild(h);
      for (let i = 0; i < 3; i++) {
        g.appendChild(el('circle', { cx: 960, cy: 540, r: 200, fill: 'none', stroke: '#ff5d76', 'stroke-width': 1.6, opacity: 0, class: 'heartRing', id: 'heartRing' + i }));
      }
      S.heart = g; S.heartBody = h; svg.appendChild(g);
    }

    /* --- 5. umbrella : the figure is ai art, only the wet ground stays --- */
    {
      const g = el('g', { id: 's-umbrella', opacity: 0 });
      g.appendChild(el('line', { x1: 0, y1: 1000, x2: 1920, y2: 1000, stroke: '#33406a', 'stroke-width': 1.1, opacity: 0.5 }));
      for (let i = 0; i < 9; i++) g.appendChild(waveLine(1006 + i * 16, 3 + i * 0.6, 0.003 + i * 0.0006, i * 1.3,
        { stroke: '#2f5b90', 'stroke-width': 1.2, opacity: 0.5 - i * 0.04 }));
      S.umbrella = g; svg.appendChild(g);
    }

    /* --- 6. submerged : caustics + reaching hand --- */
    {
      const g = el('g', { id: 's-deep', opacity: 0 });
      g.appendChild(el('rect', { x: 0, y: 300, width: 1920, height: 780, fill: 'url(#gWater)' }));
      for (let i = 0; i < 9; i++) g.appendChild(waveLine(320 + i * 78, 10 + i * 2, 0.0035 + i * 0.0004, i * 2.1,
        { stroke: '#7fc6ff', 'stroke-width': 1.3, opacity: 0.30 - i * 0.02 }));
      const hand = el('g', { id: 'deepHand', transform: 'translate(960,1080)' });
      hand.appendChild(path('M -34 0 C -40 -90 -46 -150 -30 -210 C -24 -232 -2 -234 4 -214 C 10 -194 6 -160 6 -140 C 14 -164 20 -196 30 -214 C 38 -228 58 -224 58 -206 C 58 -180 44 -140 40 -116',
        { stroke: '#a9c9f0', 'stroke-width': 3, fill: 'rgba(150,200,255,0.05)' }));
      hand.appendChild(path('M -30 -120 C -44 -132 -62 -140 -74 -132', { stroke: '#a9c9f0', 'stroke-width': 2.6 }));
      hand.appendChild(path('M 40 -108 C 54 -118 70 -122 80 -112', { stroke: '#a9c9f0', 'stroke-width': 2.6 }));
      g.appendChild(hand);
      S.deep = g; S.deepHand = hand; svg.appendChild(g);
    }

    /* --- 7. dream : the doubled figure is ai art --- */
    {
      const g = el('g', { id: 's-dream', opacity: 0 });
      g.appendChild(el('line', { x1: 0, y1: 900, x2: 1920, y2: 900, stroke: '#33406a', 'stroke-width': 1, opacity: 0.5 }));
      for (let i = 0; i < 7; i++) {
        g.appendChild(el('rect', { x: 120 + i * 260, y: 300 - (i % 3) * 60, width: 90, height: 600, fill: 'none', stroke: '#243354', 'stroke-width': 1.6, opacity: 0.7 }));
      }
      S.dream = g; svg.appendChild(g);
    }

    /* --- 8. railway --- */
    {
      const g = el('g', { id: 's-rail', opacity: 0 });
      const vx = 1080, vy = 620;
      g.appendChild(el('line', { x1: 0, y1: vy, x2: 1920, y2: vy, stroke: '#2a3a5e', 'stroke-width': 1.4, opacity: 0.8 }));
      for (const s of [-1, 1]) {
        g.appendChild(path('M ' + (vx + s * 10) + ' ' + vy + ' L ' + (vx + s * 1500) + ' 1080',
          { stroke: '#b9cbe8', 'stroke-width': 3 }));
      }
      for (let i = 0; i < 16; i++) {
        const k = Math.pow(i / 16, 2.1);
        const y = vy + k * 460;
        const w = 20 + k * 1600;
        g.appendChild(el('line', { x1: vx - w * 0.72, y1: y, x2: vx + w * 0.72, y2: y, stroke: '#8ea6c8', 'stroke-width': 1 + k * 3, opacity: 0.8 }));
      }
      g.appendChild(waveLine(300, 14, 0.002, 0.4, { stroke: '#3f5a86', 'stroke-width': 1.4, opacity: 0.5 }));
      // signal
      g.appendChild(el('line', { x1: 380, y1: 900, x2: 380, y2: 560, stroke: '#b9cbe8', 'stroke-width': 3 }));
      g.appendChild(el('rect', { x: 352, y: 500, width: 56, height: 62, fill: 'none', stroke: '#b9cbe8', 'stroke-width': 2.6 }));
      g.appendChild(el('circle', { cx: 380, cy: 518, r: 8, fill: '#ff2b46', opacity: 0.9 }));
      S.rail = g; svg.appendChild(g);
    }

    /* --- 9. ward --- */
    {
      const g = el('g', { id: 's-ward', opacity: 0 });
      g.appendChild(el('rect', { x: 620, y: 240, width: 700, height: 520, fill: '#060b16', stroke: '#8ea6c8', 'stroke-width': 2.4 }));
      for (let i = 1; i < 4; i++) g.appendChild(el('line', { x1: 620 + i * 175, y1: 240, x2: 620 + i * 175, y2: 760, stroke: '#8ea6c8', 'stroke-width': 1.6, opacity: 0.7 }));
      for (let i = 1; i < 3; i++) g.appendChild(el('line', { x1: 620, y1: 240 + i * 173, x2: 1320, y2: 240 + i * 173, stroke: '#8ea6c8', 'stroke-width': 1.6, opacity: 0.7 }));
      g.appendChild(el('line', { x1: 0, y1: 900, x2: 1920, y2: 900, stroke: '#33406a', 'stroke-width': 1.2, opacity: 0.6 }));
      g.appendChild(el('rect', { x: 300, y: 800, width: 320, height: 30, fill: '#070d1c', stroke: '#8ea6c8', 'stroke-width': 2.4 }));
      g.appendChild(el('line', { x1: 340, y1: 800, x2: 340, y2: 900, stroke: '#8ea6c8', 'stroke-width': 2.2 }));
      g.appendChild(el('line', { x1: 580, y1: 800, x2: 580, y2: 900, stroke: '#8ea6c8', 'stroke-width': 2.2 }));
      g.appendChild(el('line', { x1: 250, y1: 400, x2: 250, y2: 900, stroke: '#8ea6c8', 'stroke-width': 2.2 }));
      g.appendChild(el('path', { d: 'M 250 400 C 300 440 300 520 268 560', fill: 'none', stroke: '#8ea6c8', 'stroke-width': 2 }));
      g.appendChild(el('circle', { cx: 268, cy: 578, r: 14, fill: 'none', stroke: '#8ea6c8', 'stroke-width': 2 }));
      S.ward = g; svg.appendChild(g);
    }

    /* --- 10. transmission towers --- */
    {
      const g = el('g', { id: 's-towers', opacity: 0 });
      g.appendChild(waveLine(880, 22, 0.0016, 1.2, { stroke: '#2c3d61', 'stroke-width': 1.6, opacity: 0.8 }));
      function tower(x, base, h, s) {
        const t = el('g', { transform: 'translate(' + x + ',' + base + ') scale(' + s + ')' });
        const w = 92;
        t.appendChild(path('M ' + (-w) + ' 0 L ' + (-w * 0.34) + ' ' + (-h) + ' L ' + (w * 0.34) + ' ' + (-h) + ' L ' + w + ' 0',
          { stroke: '#b9cbe8', 'stroke-width': 3 }));
        for (let i = 0; i < 5; i++) {
          const k = i / 5, k2 = (i + 1) / 5;
          const wA = w * (1 - k * 0.66), wB = w * (1 - k2 * 0.66);
          const yA = -h * k, yB = -h * k2;
          t.appendChild(el('line', { x1: -wA, y1: yA, x2: wB, y2: yB, stroke: '#b9cbe8', 'stroke-width': 1.4, opacity: 0.8 }));
          t.appendChild(el('line', { x1: wA, y1: yA, x2: -wB, y2: yB, stroke: '#b9cbe8', 'stroke-width': 1.4, opacity: 0.8 }));
          t.appendChild(el('line', { x1: -wA, y1: yA, x2: wA, y2: yA, stroke: '#b9cbe8', 'stroke-width': 1.4, opacity: 0.8 }));
        }
        for (const [yy, ww] of [[-0.62 * h, w * 1.9], [-0.82 * h, w * 1.5], [-h, w * 1.1]]) {
          t.appendChild(el('line', { x1: -ww, y1: yy, x2: ww, y2: yy, stroke: '#b9cbe8', 'stroke-width': 2 }));
        }
        return t;
      }
      g.appendChild(tower(430, 880, 620, 1));
      g.appendChild(tower(1180, 880, 520, 0.86));
      g.appendChild(tower(1620, 880, 430, 0.7));
      S.towers = g; svg.appendChild(g);
    }

    /* --- 11. bus stop + ferris wheel --- */
    {
      const g = el('g', { id: 's-bus', opacity: 0 });
      g.appendChild(el('line', { x1: 0, y1: 900, x2: 1920, y2: 900, stroke: '#33406a', 'stroke-width': 1.4, opacity: 0.7 }));
      g.appendChild(el('line', { x1: 470, y1: 900, x2: 470, y2: 470, stroke: '#b9cbe8', 'stroke-width': 3 }));
      g.appendChild(el('rect', { x: 400, y: 380, width: 140, height: 92, rx: 6, fill: 'none', stroke: '#b9cbe8', 'stroke-width': 2.6 }));
      g.appendChild(el('line', { x1: 400, y1: 412, x2: 540, y2: 412, stroke: '#b9cbe8', 'stroke-width': 2 }));
      g.appendChild(txt('BUS', { x: 424, y: 452, fill: DIM, 'font-size': '30', 'font-family': 'Cormorant Garamond, serif', 'letter-spacing': '3' }));
      g.appendChild(el('rect', { x: 250, y: 800, width: 380, height: 22, fill: '#070d1c', stroke: '#b9cbe8', 'stroke-width': 2.2 }));
      g.appendChild(el('line', { x1: 290, y1: 822, x2: 290, y2: 900, stroke: '#b9cbe8', 'stroke-width': 2 }));
      g.appendChild(el('line', { x1: 590, y1: 822, x2: 590, y2: 900, stroke: '#b9cbe8', 'stroke-width': 2 }));
      // ferris wheel
      const fw = el('g', { id: 'ferris', transform: 'translate(1400,540)' });
      fw.appendChild(el('circle', { cx: 0, cy: 0, r: 300, fill: 'none', stroke: '#b9cbe8', 'stroke-width': 3.2 }));
      fw.appendChild(el('circle', { cx: 0, cy: 0, r: 262, fill: 'none', stroke: '#7f96bd', 'stroke-width': 1.4, opacity: 0.7 }));
      for (let i = 0; i < 12; i++) {
        const an = (i / 12) * 6.2832;
        fw.appendChild(el('line', { x1: 0, y1: 0, x2: Math.cos(an) * 300, y2: Math.sin(an) * 300, stroke: '#b9cbe8', 'stroke-width': 1.6, opacity: 0.75 }));
        fw.appendChild(el('rect', { x: Math.cos(an) * 300 - 14, y: Math.sin(an) * 300 - 12, width: 28, height: 24, rx: 4, fill: '#060b16', stroke: '#b9cbe8', 'stroke-width': 2, transform: 'rotate(' + (an * 57.3) + ',' + (Math.cos(an) * 300) + ',' + (Math.sin(an) * 300) + ')' }));
      }
      fw.appendChild(el('circle', { cx: 0, cy: 0, r: 12, fill: '#060b16', stroke: '#b9cbe8', 'stroke-width': 2.6 }));
      fw.appendChild(path('M 0 0 L -190 400 M 0 0 L 190 400 M -190 400 L 190 400', { stroke: '#b9cbe8', 'stroke-width': 3 }));
      g.appendChild(fw);
      S.bus = g; S.ferris = fw; svg.appendChild(g);
    }

    /* --- 12. desk + flower --- */
    {
      const g = el('g', { id: 's-desk', opacity: 0 });
      g.appendChild(el('rect', { x: 300, y: 700, width: 1320, height: 26, fill: '#070d1c', stroke: '#b9cbe8', 'stroke-width': 2.6 }));
      g.appendChild(el('line', { x1: 380, y1: 726, x2: 380, y2: 950, stroke: '#b9cbe8', 'stroke-width': 2.4 }));
      g.appendChild(el('line', { x1: 1540, y1: 726, x2: 1540, y2: 950, stroke: '#b9cbe8', 'stroke-width': 2.4 }));
      const vase = el('g', { transform: 'translate(960,700)' });
      vase.appendChild(path('M -46 0 C -54 -70 -30 -104 -26 -132 L 26 -132 C 30 -104 54 -70 46 0 Z',
        { fill: 'rgba(120,170,230,0.06)', stroke: '#b9cbe8', 'stroke-width': 2.6 }));
      vase.appendChild(el('line', { x1: -50, y1: -132, x2: 50, y2: -132, stroke: '#b9cbe8', 'stroke-width': 2.4 }));
      vase.appendChild(path('M 0 -132 C -8 -190 -20 -230 -6 -280', { stroke: '#9ad3a0', 'stroke-width': 2.4 }));
      for (let i = 0; i < 7; i++) {
        const an = (i / 7) * 6.2832;
        vase.appendChild(el('ellipse', { cx: -6 + Math.cos(an) * 30, cy: -286 + Math.sin(an) * 30, rx: 26, ry: 15,
          fill: 'rgba(255,170,190,0.10)', stroke: '#ffb3c4', 'stroke-width': 2.2, transform: 'rotate(' + (an * 57.3) + ',' + (-6 + Math.cos(an) * 30) + ',' + (-286 + Math.sin(an) * 30) + ')' }));
      }
      vase.appendChild(el('circle', { cx: -6, cy: -286, r: 11, fill: 'rgba(255,220,140,0.25)', stroke: '#ffd98a', 'stroke-width': 2 }));
      // upright chair
      const ch = el('g', { transform: 'translate(480,700)' });
      ch.appendChild(el('rect', { x: -54, y: -8, width: 108, height: 14, fill: '#070d1c', stroke: '#8ea6c8', 'stroke-width': 2.2 }));
      ch.appendChild(path('M -54 -8 C -76 -60 -82 -140 -70 -230', { stroke: '#8ea6c8', 'stroke-width': 2.4 }));
      ch.appendChild(path('M 54 -8 C 76 -60 82 -140 70 -230', { stroke: '#8ea6c8', 'stroke-width': 2.4 }));
      ch.appendChild(el('line', { x1: -70, y1: -230, x2: 70, y2: -230, stroke: '#8ea6c8', 'stroke-width': 2.4 }));
      for (let i = 0; i < 4; i++) ch.appendChild(el('line', { x1: -66 + i * 2, y1: -60 - i * 48, x2: 66 - i * 2, y2: -60 - i * 48, stroke: '#8ea6c8', 'stroke-width': 1.8, opacity: 0.85 }));
      ch.appendChild(el('line', { x1: -44, y1: 6, x2: -54, y2: 120, stroke: '#8ea6c8', 'stroke-width': 2.2 }));
      ch.appendChild(el('line', { x1: 44, y1: 6, x2: 54, y2: 120, stroke: '#8ea6c8', 'stroke-width': 2.2 }));
      g.appendChild(ch);
      g.appendChild(vase);
      g.appendChild(el('line', { x1: 0, y1: 950, x2: 1920, y2: 950, stroke: '#33406a', 'stroke-width': 1.2, opacity: 0.6 }));
      S.desk = g; svg.appendChild(g);
    }

    /* --- 13. ribbon / thread + two hearts --- */
    {
      const g = el('g', { id: 's-thread', opacity: 0 });
      for (const [id, cx, s] of [['threadA', 470, 1], ['threadB', 1450, 0.86]]) {
        const h = el('g', { id: id, transform: 'translate(' + cx + ',540) scale(' + s + ')' });
        h.appendChild(path('M 0 96 C -32 66 -80 38 -94 -4 C -108 -46 -88 -90 -58 -98 C -32 -106 -10 -92 0 -70 C 10 -92 32 -106 58 -98 C 88 -90 108 -46 94 -4 C 80 38 32 66 0 96 Z',
          { stroke: '#ff8a99', 'stroke-width': 3, fill: 'rgba(255,70,100,0.06)' }));
        h.appendChild(el('circle', { cx: 0, cy: 0, r: 130, fill: 'none', stroke: '#ff5d76', 'stroke-width': 1.2, opacity: 0.35 }));
        g.appendChild(h);
      }
      const tl2 = path('', { id: 'threadLine', stroke: '#ffd9e2', 'stroke-width': 2.6, opacity: 0.9, fill: 'none', filter: 'url(#fGlow)' });
      g.appendChild(tl2);
      S.thread = g; S.threadLine = tl2; svg.appendChild(g);
    }

    /* --- 14. dawn horizon --- */
    {
      const g = el('g', { id: 's-dawn', opacity: 0 });
      g.appendChild(el('rect', { x: 0, y: 700, width: 1920, height: 380, fill: 'url(#gDawn)' }));
      g.appendChild(el('circle', { cx: 960, cy: 1000, r: 240, fill: '#ffdca8', opacity: 0.20, filter: 'url(#fBlurBig)' }));
      g.appendChild(el('circle', { cx: 960, cy: 1006, r: 96, fill: '#ffe9c0', opacity: 0.38 }));
      const rays = el('g', { id: 'dawnRays' });
      for (let i = 0; i < 12; i++) {
        const an = -Math.PI + (i / 11) * Math.PI;
        rays.appendChild(el('line', { x1: 960 + Math.cos(an) * 120, y1: 1006 + Math.sin(an) * 120,
          x2: 960 + Math.cos(an) * 820, y2: 1006 + Math.sin(an) * 820,
          stroke: '#ffd79b', 'stroke-width': 1.6, opacity: 0.16 }));
      }
      g.appendChild(rays);
      g.appendChild(el('line', { x1: 0, y1: 1006, x2: 1920, y2: 1006, stroke: '#ffc98a', 'stroke-width': 1.6, opacity: 0.55 }));
      const stars = el('g', { id: 'dawnStars' });
      const r = U.rng(303);
      for (let i = 0; i < 90; i++) {
        stars.appendChild(el('circle', { cx: (r() * 1920).toFixed(0), cy: (r() * 800).toFixed(0), r: (r() * 1.6 + 0.4).toFixed(2), fill: '#e8f0ff', opacity: (r() * 0.7 + 0.15).toFixed(2) }));
      }
      g.appendChild(stars);
      S.dawn = g; S.dawnRays = rays; S.dawnStars = stars; svg.appendChild(g);
    }

    /* --- 15. two figures (F section) : the figures are ai art --- */
    {
      const g = el('g', { id: 's-two', opacity: 0 });
      g.appendChild(el('line', { x1: 0, y1: 940, x2: 1920, y2: 940, stroke: '#33406a', 'stroke-width': 1.2, opacity: 0.6 }));
      for (let i = 0; i < 16; i++) {
        g.appendChild(el('line', { x1: i * 128 - 20, y1: 940, x2: i * 128 + 30, y2: 1010, stroke: '#1e2b48', 'stroke-width': 1, opacity: 0.45 }));
      }
      const a = el('g', { id: 'twoA' });
      const b = el('g', { id: 'twoB' });
      g.appendChild(a); g.appendChild(b);
      const tt = path('', { id: 'twoThread', stroke: '#ffd9e2', 'stroke-width': 1.6, opacity: 0.6, fill: 'none' });
      g.appendChild(tt);
      S.two = g; S.twoA = a; S.twoB = b; S.twoThread = tt; svg.appendChild(g);
    }

    /* --- 16. bloom (final) --- */
    {
      const g = el('g', { id: 's-bloom', opacity: 0 });
      g.appendChild(el('circle', { cx: 960, cy: 520, r: 300, fill: '#ffe6c2', opacity: 0, id: 'bloomCore', filter: 'url(#fBlurBig)' }));
      for (let i = 0; i < 24; i++) {
        const an = (i / 24) * 6.2832;
        g.appendChild(el('line', { id: 'bloomRay' + i, x1: 960, y1: 520,
          x2: 960 + Math.cos(an) * 900, y2: 520 + Math.sin(an) * 900,
          stroke: '#ffe0b0', 'stroke-width': 2, opacity: 0 }));
      }
      S.bloom = g; svg.appendChild(g);
    }

    /* --- horizon / ekg furniture --- */
    {
      const g = el('g', { id: 's-horizon', opacity: 1 });
      g.appendChild(el('line', { id: 'horizonLine', x1: 0, y1: 760, x2: 1920, y2: 760, stroke: '#7fb2ff', 'stroke-width': 1.2, opacity: 0 }));
      S.horizon = g; svg.appendChild(g);
    }

    S.svg = svg;
    return S;
  };

  global.Art = A;
})(window);
