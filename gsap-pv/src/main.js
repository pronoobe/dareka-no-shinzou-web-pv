/* bootstrap : build the scene, expose a deterministic renderer for the exporter */
(function (global) {
  'use strict';

  const PV = { ready: false, t: 0 };

  PV.init = async function () {
    let data = global.PV_DATA;
    if (!data) data = await (await fetch('data/pv.json')).json();
    U.setData(data);
    PV.data = data;
    PV.duration = data.duration;

    const dom = {
      stage: document.getElementById('stage'),
      textLayer: document.getElementById('textLayer'),
      subInner: document.getElementById('subInner'),
      titleLayer: document.getElementById('titleLayer'),
      chapterWord: document.getElementById('chapterWord'),
      artLayer: document.getElementById('artLayer'),
      tint: document.getElementById('tint'),
      flash: document.getElementById('flash'),
      strobe: document.getElementById('strobe'),
      sweep: document.getElementById('sweep'),
      grain: document.getElementById('grain'),
      fitScale: 1,
    };
    PV.dom = dom;

    /* film grain texture */
    {
      const c = document.createElement('canvas');
      c.width = c.height = 160;
      const x = c.getContext('2d');
      const img = x.createImageData(160, 160);
      const r = U.rng(1234);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = 120 + r() * 135;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        img.data[i + 3] = 255;
      }
      x.putImageData(img, 0, 0);
      const url = c.toDataURL();
      dom.grain.style.backgroundImage = 'url(' + url + ')';
      dom.grain.style.backgroundRepeat = 'repeat';
    }

    const svg = document.getElementById('artSvg');
    const S = Art.build(svg);
    PV.S = S;
    await Stage.init(document.getElementById('pixiLayer'));
    const L = Lyrics.build(data, dom.textLayer, dom.subInner, dom.titleLayer, dom.chapterWord);
    PV.L = L;

    /* generated background plates : create + wait for the bitmaps */
    dom.plateLayer = document.getElementById('plateLayer');
    dom.plateOver = document.getElementById('plateOver');
    dom.plates = {};
    const waits = [];
    for (const p of Director.PLATES) {
      const d = document.createElement('div');
      d.className = 'plate';
      d.style.backgroundImage = 'url(assets/img/' + p.img + ')';
      d.style.filter = p.filter || Director.PLATE_GRADE;
      (p.over ? dom.plateOver : dom.plateLayer).appendChild(d);
      dom.plates[p.id] = d;
      waits.push(new Promise((res) => {
        const im = new Image();
        im.onload = () => { d.dataset.iw = im.naturalWidth; d.dataset.ih = im.naturalHeight; res(); };
        im.onerror = () => res();
        im.src = 'assets/img/' + p.img;
      }));
    }
    /* orbiting rings : lyric letters, clock face, watching eyes, motes */
    dom.ringLayer = document.getElementById('ringLayer');
    dom.rings = [];
    for (const r of Director.RINGS) {
      const box = document.createElement('div');
      box.className = 'ring';
      const chars = [];
      let n = r.n || 0;
      if (r.kind === 'text') n = r.text.length * r.rep;
      for (let k = 0; k < n; k++) {
        const s = document.createElement('span');
        if (r.kind === 'text') {
          s.textContent = r.text[k % r.text.length];
          s.style.fontSize = r.size + 'px';
          s.style.color = r.color;
        } else if (r.kind === 'ticks') {
          s.className = 'tick';
        } else if (r.kind === 'eyes') {
          s.className = 'eye';
        } else {
          s.className = 'mote';
        }
        box.appendChild(s);
        chars.push(s);
      }
      let hand = null;
      if (r.kind === 'ticks') {
        hand = document.createElement('span');
        hand.className = 'hand';
        box.appendChild(hand);
      }
      /* rings with a CSS rotation orbit around this point */
      if (r.kind === 'ticks' || r.kind === 'eyes') {
        box.style.transformOrigin = r.cx + 'px ' + r.cy + 'px';
      }
      dom.ringLayer.appendChild(box);
      dom.rings.push({ def: r, box: box, chars: chars, n: n, hand: hand });
    }

    await Promise.all(waits);

    Director.build(data, S, L, dom);

    if (document.fonts && document.fonts.ready) await document.fonts.ready;

    PV.fit();
    global.addEventListener('resize', PV.fit);

    PV.renderAt(0);
    PV.ready = true;
    document.body.classList.add('ready');

    /* interactive playback (skipped in the headless exporter) */
    if (!new URLSearchParams(location.search).has('export')) {
      const hint = document.createElement('div');
      hint.id = 'hint';
      hint.innerHTML = '▶ 自動再生中 &nbsp;·&nbsp; 空格 / クリック で一時停止 &nbsp;·&nbsp; auto-playing';
      document.body.appendChild(hint);
      const audio = document.getElementById('audio');
      let started = false;
      const go = () => {
        if (started) return;
        started = true;
        hint.classList.add('gone');
        PV.playClock();
      };
      document.addEventListener('click', () => { if (!started) go(); else PV.toggle(); });
      document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' || e.key === ' ') { e.preventDefault(); if (!started) go(); else PV.toggle(); }
      });
      setTimeout(go, 250);   // no audio : start straight away
    }
  };

  PV.fit = function () {
    const force = new URLSearchParams(location.search).get('scale');
    let s;
    if (force) s = parseFloat(force);
    else s = Math.min(global.innerWidth / 1920, global.innerHeight / 1080);
    PV.dom.fitScale = s;
    PV.dom.stage.style.transform = 'scale(' + s + ')';
  };

  PV.renderAt = function (t) {
    PV.t = t;
    Director.update(t, PV.data, PV.S, PV.L, PV.dom);
  };

  /* ---------------- playback ---------------- */
  PV.play = function (src) {
    const audio = document.getElementById('audio');
    if (src && !audio.src) audio.src = src;
    if (!PV.raf) {
      const loop = () => {
        PV.raf = requestAnimationFrame(loop);
        if (audio.paused) return;
        PV.renderAt(audio.currentTime);
      };
      loop();
    }
    audio.play();
  };
  PV.toggle = function () {
    if (!PV.clock) return PV.playClock();
    if (PV.clock.running) PV.clock.running = false; else PV.clock.running = true;
  };
  /* audio-free playback : the same renderer, driven by a wall clock that loops */
  PV.playClock = function () {
    if (PV.clock) { PV.clock.running = true; return; }
    const c = { t: 0, running: true, last: performance.now() };
    PV.clock = c;
    const step = (now) => {
      const dt = Math.min(0.1, (now - c.last) / 1000);
      c.last = now;
      if (c.running) {
        c.t += dt;
        if (c.t > PV.duration) { c.t = 0; if (PV.onLoop) PV.onLoop(); }
        PV.renderAt(c.t);
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  global.PV = PV;
  PV.readyPromise = PV.init();
})(window);
