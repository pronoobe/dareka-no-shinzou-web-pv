/* lyric text layer: japanese lines with per-line typographic treatments (karaoke-synced
   to the vocal note onsets), chinese subtitles, title cards */
(function (global) {
  'use strict';

  const L = { lines: [], subs: [], titles: [] };

  /* geometry + motion profile for each treatment */
  const TR = {
    ink: { top: 372, size: 86, align: 'center', maxW: 1620, mode: 'stagger', stag: 0.022, rise: 22, dur: 0.13 },
    rise: { top: 404, size: 92, align: 'center', maxW: 1600, mode: 'rise', stag: 0.02, rise: 96, dur: 0.22 },
    sink: { top: 300, size: 92, align: 'center', maxW: 1600, mode: 'sink', stag: 0.02, rise: -84, dur: 0.22 },
    stamp: { top: 336, size: 112, align: 'center', maxW: 1740, mode: 'stamp', stag: 0.01, dur: 0.2, exit: 'cut' },
    echo: { top: 372, size: 100, align: 'center', maxW: 1640, mode: 'echo', stag: 0.02, dur: 0.14 },
    scatter: { top: 350, size: 92, align: 'center', maxW: 1560, mode: 'scatter', stag: 0.018, dur: 0.22 },
    vertical: { top: 78, right: 86, size: 62, align: 'right', maxW: 520, mode: 'stagger', vert: true, stag: 0.03, rise: 20, dur: 0.13 },
    leftSlide: { top: 404, left: 132, size: 84, align: 'left', maxW: 1280, mode: 'leftSlide', stag: 0.02, dur: 0.22 },
    band: { top: 368, size: 88, align: 'center', maxW: 1600, mode: 'band', stag: 0.012, dur: 0.13 },
    corner: { top: 726, left: 132, size: 60, align: 'left', maxW: 1400, mode: 'corner', stag: 0.018, dur: 0.13 },
    hookBig: { top: 296, size: 152, align: 'center', maxW: 1500, mode: 'hookBig', stag: 0.02, dur: 0.2, exit: 'cut' },
    list1: { top: 286, left: 120, size: 96, align: 'left', maxW: 1200, mode: 'list', dur: 0.26, exit: 'cut' },
    list2: { top: 596, left: 210, size: 104, align: 'left', maxW: 1400, mode: 'list', dur: 0.26, exit: 'cut' },
    list3: { top: 350, left: 120, size: 88, align: 'left', maxW: 1500, mode: 'list', dur: 0.26, exit: 'cut' },
    list4: { top: 640, left: 300, size: 92, align: 'left', maxW: 1300, mode: 'list', dur: 0.26, exit: 'cut' },
    list5: { top: 372, size: 94, align: 'center', maxW: 1640, mode: 'list', dur: 0.28, exit: 'cut' },
  };

  function fit(len, base, max) { return Math.round(Math.min(base, max / (len * 1.06))); }

  L.TR = TR;

  L.build = function (data, textLayer, subInner, titleLayer, chapterWord) {
    L.data = data;
    for (const ln of data.lines) {
      const spec = TR[ln.tr] || TR.ink;
      const div = document.createElement('div');
      div.className = 'line tr-' + ln.tr + (spec.vert ? ' vert' : '');
      const len = ln.jp.replace(/[\s　]/g, '').length;
      const size = fit(len, spec.size, spec.maxW);
      div.style.fontSize = size + 'px';
      div.style.top = spec.top + 'px';
      if (spec.left !== undefined) { div.style.left = spec.left + 'px'; div.style.width = 'auto'; }
      if (spec.right !== undefined) { div.style.right = spec.right + 'px'; div.style.left = 'auto'; }
      div.style.textAlign = spec.align;
      if (spec.vert) div.style.writingMode = 'vertical-rl';

      const band = document.createElement('div');
      band.className = 'band';
      div.appendChild(band);

      const chars = [];
      for (const ch of ln.jp) {
        if (ch === '　' || ch === ' ') {
          const sp = document.createElement('span');
          sp.className = 'ch sp';
          sp.innerHTML = '&nbsp;';
          sp.style.width = (size * 0.42) + 'px';
          div.appendChild(sp);
          continue;
        }
        const sp = document.createElement('span');
        sp.className = 'ch';
        sp.textContent = ch;
        div.appendChild(sp);
        chars.push(sp);
      }
      const gl = document.createElement('div');
      gl.className = 'glowline';
      div.appendChild(gl);
      textLayer.appendChild(div);
      L.lines.push({ el: div, chars: chars, glow: gl, band: band, data: ln, spec: spec, size: size });
    }

    /* chinese subtitles */
    for (const ln of data.lines) {
      const d = document.createElement('div');
      d.className = 'sub-line';
      const inner = document.createElement('span');
      inner.className = 'sub-txt';
      inner.textContent = ln.cn;
      d.appendChild(inner);
      const bar = document.createElement('i');
      bar.className = 'sub-bar';
      d.appendChild(bar);
      subInner.appendChild(d);
      L.subs.push({ el: d, txt: inner, bar: bar, data: ln });
    }

    /* title cards */
    const t1 = document.createElement('div');
    t1.className = 'ttl ttl-v';
    t1.style.left = '1560px';
    t1.style.top = '150px';
    t1.style.fontSize = '58px';
    for (const c of 'だれかの心臓になれたなら') {
      const s = document.createElement('span');
      s.className = 'ch';
      s.textContent = c;
      t1.appendChild(s);
    }
    titleLayer.appendChild(t1);

    const t2 = document.createElement('div');
    t2.className = 'credit';
    t2.style.left = '1452px';
    t2.style.top = '168px';
    t2.style.writingMode = 'vertical-rl';
    t2.style.fontFamily = "'Zen Kaku Gothic New', sans-serif";
    t2.style.fontSize = '22px';
    t2.style.letterSpacing = '0.35em';
    t2.textContent = 'ユリイ・カノン feat. GUMI';
    titleLayer.appendChild(t2);

    const t3 = document.createElement('div');
    t3.className = 'ttl ttl-h';
    t3.style.writingMode = 'horizontal-tb';
    t3.style.left = '0px';
    t3.style.top = '400px';
    t3.style.width = '1920px';
    t3.style.textAlign = 'center';
    t3.style.fontSize = '92px';
    t3.style.fontWeight = '600';
    t3.style.letterSpacing = '0.14em';
    t3.textContent = 'だれかの心臓になれたなら';
    titleLayer.appendChild(t3);

    const t4 = document.createElement('div');
    t4.className = 'credit credit-c';
    t4.style.left = '0px';
    t4.style.top = '560px';
    t4.style.width = '1920px';
    t4.style.textAlign = 'center';
    t4.style.fontFamily = "'Noto Serif SC', serif";
    t4.style.fontSize = '34px';
    t4.style.letterSpacing = '0.3em';
    t4.textContent = '若能成为谁的心脏';
    titleLayer.appendChild(t4);

    const t5 = document.createElement('div');
    t5.className = 'credit credit-c';
    t5.style.left = '0px';
    t5.style.top = '660px';
    t5.style.width = '1920px';
    t5.style.textAlign = 'center';
    t5.style.fontSize = '20px';
    t5.style.letterSpacing = '0.5em';
    t5.textContent = 'EURYI CANON  ·  feat. GUMI';
    titleLayer.appendChild(t5);

    L.titles = { v: t1, vcredit: t2, h: t3, hcn: t4, hcredit: t5 };
    L.chapterWord = chapterWord;
    return L;
  };

  global.Lyrics = L;
})(window);
