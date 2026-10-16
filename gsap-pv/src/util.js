/* shared helpers: deterministic rng, beat clock, small math */
(function (global) {
  'use strict';

  const U = {};

  /* deterministic PRNG (mulberry32) */
  U.rng = function (seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  U.lerp = (a, b, t) => a + (b - a) * t;
  U.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  U.smoothstep = (t) => t * t * (3 - 2 * t);
  U.range = (t, a, b) => U.clamp((t - a) / (b - a || 1e-6), 0, 1);
  U.easeOut = (t) => 1 - Math.pow(1 - t, 3);
  U.easeIn = (t) => t * t * t;
  U.easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  /* js map() with easing between keyframes [[t,val],...] */
  U.track = function (t, keys, ease) {
    ease = ease || U.easeInOut;
    if (t <= keys[0][0]) return keys[0][1];
    const n = keys.length;
    if (t >= keys[n - 1][0]) return keys[n - 1][1];
    for (let i = 0; i < n - 1; i++) {
      const [t0, v0] = keys[i], [t1, v1] = keys[i + 1];
      if (t >= t0 && t <= t1) return U.lerp(v0, v1, ease((t - t0) / (t1 - t0 || 1e-6)));
    }
    return keys[n - 1][1];
  };

  /* colour helpers */
  U.mix = function (c1, c2, t) {
    const p = (c) => [parseInt(c.substr(1, 2), 16), parseInt(c.substr(3, 2), 16), parseInt(c.substr(5, 2), 16)];
    const a = p(c1), b = p(c2);
    const v = a.map((x, i) => Math.round(U.lerp(x, b[i], t)));
    return '#' + v.map((x) => x.toString(16).padStart(2, '0')).join('');
  };
  U.hex2num = (c) => parseInt(c.replace('#', ''), 16);

  /* payload data + derived clock, filled by main.js */
  U.data = null;
  U.setData = function (d) {
    U.data = d;
    U.beats = d.beats;
    U.beat = d.beat;
    U.phase = d.phase;
    U.dur = d.duration;
  };
  /* index of the beat at or just before t */
  U.beatIndex = function (t) { return Math.floor((t - U.phase) / U.beat); };
  /* fractional position within the current beat */
  U.beatPhase = function (t) { return ((t - U.phase) / U.beat) % 1; };
  U.barIndex = function (t) { return Math.floor((t - U.phase) / (U.beat * 4)); };
  /* decaying pulse on every beat : p(t) in [0,1] */
  U.beatPulse = function (t, k, decay) {
    const ph = U.beatPhase(t);
    return Math.pow(1 - ph, decay === undefined ? 4 : decay) * (k === undefined ? 1 : k);
  };
  /* pulse only on bar heads */
  U.barPulse = function (t, decay) {
    const ph = ((t - U.phase) / (U.beat * 4)) % 1;
    return Math.pow(1 - ph, decay === undefined ? 3 : decay);
  };

  global.U = U;
})(window);
