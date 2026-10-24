// [b5-sub-glide] The Glide Bomb's own sounds (src/game/kits/glide.js; all synthesized, no files). Same format as
// audio.js's def() calls: build(v, pitch, opts) one-shots, loop(v, pitch, opts) → { pitch(q, now), params(o, now) } loops.
//   glide_cook     (loop) the fuse burning in the hand: high-passed fizz with crackles, rising with the cook.
//                  params { k: 0..1 the cook, warn: 0|1 the last half-second before the slip }
//   glide_release  the stone set down and shoved off: a weighty stone-on-ice "thock" (180 → 110 Hz), a noise burst, a whoosh
//   glide_slide    (loop) the slide: a low gritty rumble (band noise 200–600 Hz) whose level and pitch follow its speed,
//                  with a fuse beep (square 1.2 kHz) quickening 3 → 14 a second as the fuse runs out.
//                  params { speed: 0..1 (of 10 m/s), k: 0..1 through the fuse, air: 0|1 }
//   glide_bounce   a "clonk" off a wall (420 → 240 Hz and a click); its volume is the impact speed (the caller's)
//   glide_clink    the cook reaching full: a granite clink with a ring
//   glide_boom     the blast, pitched 1.1 (uncooked) … 0.85 (full cook) by the caller
//   glide_pop      shot down / smashed: a dull "thup" with a fizz (clearly not the blast)
//   glide_plop     sunk in the sea: a heavy plop and bubbles
//   glide_fizzle   a cook dropped in the hand (splatted, dived): the fuse snuffed out
import { SFX } from './audio.js';
import { pts, sweep } from './music.js';

const def = (name, o) => { SFX[name] = o; };
const K = 0.04;
const c01 = (x) => Math.min(1, Math.max(0, +x || 0));
// a gate LFO: silent most of the cycle, a bump once per period (th: how narrow, 0.86 a tick … 0.3 a pulse)
const _gc = new Map();
function gateCurve(th) {
  let c = _gc.get(th);
  if (c) return c;
  const n = 512; c = new Float32Array(n);
  for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * 2 - 1, y = Math.max(0, (x - th) / (1 - th)); c[i] = y * y; }
  _gc.set(th, c);
  return c;
}
function gate(v, T, rate, th, depth, param) {
  const ws = v.ctx.createWaveShaper(); ws.curve = gateCurve(th); v.nodes.push(ws);
  const d = v.gain(depth); ws.connect(d); d.connect(param);
  return { osc: v.osc('sine', rate, T, null, ws), depth: d };
}
// a filtered noise swell (band f0 → f1 over dur)
function swell(v, t, dur, f0, f1, peak, q = 1.4, kind = 'pink') {
  const T = v.t + t, g = v.gain(0, v.out), bp = v.filter('bandpass', f0, q, g);
  sweep(bp.frequency, T, f0, f1, dur);
  pts(g.gain, T, [[0, 0], [dur * 0.55, peak], [dur, 0]]);
  v.noise(kind, T, T + dur + 0.02, bp);
}

def('glide_cook', {
  gain: 0.2, max: 4, jitter: 0, reverb: 0.04, oneShot: 1.0,
  loop(v, p, o) {
    const T = v.t, st = { k: 0, warn: 0, q: p, ...(o?.params || {}) };
    const hg = v.gain(0.1, v.out), hp = v.filter('highpass', 4200, 0.7, hg);   // the fizz
    v.noise('white', T, null, hp);
    const cg = v.gain(0, v.out), cbp = v.filter('bandpass', 2600, 2.5, cg);   // crackles
    v.noise('white', T, null, cbp);
    const cr = gate(v, T, 9, 0.9, 0.5, cg.gain);
    const wg = v.gain(0, v.out), w = v.osc('square', 1500 * p, T, null, v.filter('lowpass', 3600, 0.8, wg));   // the slip warning
    const wgate = gate(v, T, 8, 0.6, 0, wg.gain);
    const apply = (now) => {
      const k = c01(st.k);
      hg.gain.setTargetAtTime(0.05 + 0.2 * k, now, K); hp.frequency.setTargetAtTime((3600 + 2600 * k) * st.q, now, K);
      cr.osc.frequency.setTargetAtTime(6 + 22 * k, now, K); cr.depth.gain.setTargetAtTime(0.25 + 0.55 * k, now, K);
      cbp.frequency.setTargetAtTime((2000 + 1800 * k) * st.q, now, K);
      w.frequency.setTargetAtTime(1500 * st.q, now, K); wgate.depth.gain.setTargetAtTime(st.warn ? 0.22 : 0, now, K);
    };
    apply(T);
    return { pitch(q, now) { st.q = q; apply(now); }, params(o2, now) { Object.assign(st, o2); apply(now); } };
  },
});

def('glide_release', {
  gain: 0.5, max: 3, jitter: 0.04, reverb: 0.08,
  build(v, p) {
    v.tone({ f: 180 * p, f1: 110 * p, sw: 0.08, a: 0.001, d: 0.14, peak: 0.95 });                              // the stone set down
    v.tone({ type: 'triangle', f: 360 * p, f1: 220 * p, sw: 0.06, a: 0.001, d: 0.06, peak: 0.25 });
    v.nz({ ft: 'bandpass', f: 900 * p, q: 1.2, a: 0.0006, d: 0.05, peak: 0.6 });                               // the noise burst
    swell(v, 0.02, 0.22, 700 * p, 2600 * p, 0.32, 1.2);                                                        // a short whoosh off
  },
});

def('glide_slide', {
  gain: 0.42, max: 8, jitter: 0, reverb: 0.04, oneShot: 1.2,
  loop(v, p, o) {
    const T = v.t, st = { speed: 1, k: 0, air: 0, q: p, ...(o?.params || {}) };
    const rg = v.gain(0.3, v.out), lp = v.filter('lowpass', 600, 0.9, rg), bp = v.filter('highpass', 200, 0.7, lp);   // the rumble
    v.noise('brown', T, null, bp);
    const gr = v.gain(0.05, v.out), gbp = v.filter('bandpass', 420, 3, gr);   // grit
    v.noise('white', T, null, gbp);
    const grit = gate(v, T, 17, 0.75, 0.06, gr.gain);
    const bg = v.gain(0, v.out), beep = v.osc('square', 1200 * p, T, null, v.filter('lowpass', 3400, 0.8, bg));   // the fuse beep
    const bgate = gate(v, T, 3, 0.86, 0.16, bg.gain);
    const apply = (now) => {
      const s = c01(st.speed), k = c01(st.k), q = st.q, on = st.air ? 0.25 : 1;
      rg.gain.setTargetAtTime((0.08 + 0.42 * s) * on, now, K); lp.frequency.setTargetAtTime((300 + 320 * s) * q, now, K);
      gbp.frequency.setTargetAtTime((300 + 260 * s) * q, now, K); grit.osc.frequency.setTargetAtTime((9 + 18 * s) * q, now, K); grit.depth.gain.setTargetAtTime((0.03 + 0.08 * s) * on, now, K);
      beep.frequency.setTargetAtTime(1200 * q, now, K); bgate.osc.frequency.setTargetAtTime(3 + 11 * Math.pow(k, 1.4), now, K);
      bgate.depth.gain.setTargetAtTime(0.1 + 0.12 * k, now, K);
    };
    apply(T);
    return { pitch(q, now) { st.q = q; apply(now); }, params(o2, now) { Object.assign(st, o2); apply(now); } };
  },
});

def('glide_bounce', {
  gain: 0.42, max: 4, jitter: 0.06, reverb: 0.06, minGap: 0.05,
  build(v, p) {
    v.tone({ f: 420 * p, f1: 240 * p, sw: 0.06, a: 0.0006, d: 0.1, peak: 0.8 });                               // the clonk
    v.tone({ type: 'triangle', f: 1240 * p, a: 0.0004, d: 0.03, peak: 0.25 });
    v.nz({ ft: 'bandpass', f: 3200 * p, q: 3, a: 0.0003, d: 0.012, peak: 0.55 });                               // the click
  },
});

def('glide_clink', {
  gain: 0.34, max: 2, jitter: 0.02, reverb: 0.18, minGap: 0.05,
  build(v, p) {
    const f = 1650 * p;
    for (const [r, a, d] of [[1, 0.5, 0.3], [2.76, 0.24, 0.16], [5.4, 0.1, 0.08]]) v.tone({ f: f * r, a: 0.0006, d, peak: a });
    v.tone({ t: 0.004, f: 300 * p, f1: 200 * p, sw: 0.04, a: 0.001, d: 0.06, peak: 0.3 });
    v.nz({ ft: 'highpass', f: 5200, a: 0.0003, d: 0.014, peak: 0.35 });
  },
});

def('glide_boom', {
  gain: 0.6, max: 3, jitter: 0.03, reverb: 0.28,
  build(v, p) {
    v.tone({ f: 96 * p, f1: 30 * p, sw: 0.5, a: 0.002, d: 0.72, peak: 1 });                                    // the body
    v.nz({ ft: 'highpass', f: 2100, a: 0.0003, d: 0.04, peak: 0.85 });                                         // the crack
    v.nz({ kind: 'pink', ft: 'lowpass', f: 4800 * p, f1: 170, sw: 0.6, q: 0.9, a: 0.002, d: 0.7, peak: 0.95 });   // the roar
    v.nz({ t: 0.03, f: 1400 * p, f1: 320 * p, sw: 0.5, q: 3, a: 0.004, d: 0.55, peak: 0.6 });
    v.tone({ t: 0.01, f: 520 * p, f1: 160 * p, sw: 0.18, a: 0.001, d: 0.2, peak: 0.3 });                       // a stony thud under it
    for (let i = 0; i < 4; i++) v.nz({ t: 0.08 + i * 0.06 + v.r(0, 0.03), ft: 'bandpass', f: v.r(380, 760) * p, q: 5, a: 0.002, d: 0.06, peak: 0.22 });   // ink plops
    v.nz({ t: 0.06, ft: 'highpass', f: 3000, a: 0.04, d: 0.6, peak: 0.25 });
  },
});

def('glide_pop', {
  gain: 0.42, max: 3, jitter: 0.06, reverb: 0.08,
  build(v, p) {
    v.tone({ f: 210 * p, f1: 90 * p, sw: 0.09, a: 0.001, d: 0.12, peak: 0.75 });                               // the thup
    v.nz({ ft: 'bandpass', f: 1500 * p, q: 1.6, a: 0.0006, d: 0.04, peak: 0.45 });
    swell(v, 0.03, 0.42, 4000 * p, 900 * p, 0.26, 1.1, 'white');                                             // the fizz out
  },
});

def('glide_plop', {
  gain: 0.42, max: 3, jitter: 0.06, reverb: 0.1,
  build(v, p) {
    v.tone({ f: 240 * p, f1: 70 * p, sw: 0.14, a: 0.001, d: 0.18, peak: 0.8 });
    v.nz({ ft: 'lowpass', f: 1400, f1: 300, sw: 0.2, a: 0.002, d: 0.22, peak: 0.5 });
    for (let i = 0; i < 4; i++) v.bub(v.t + 0.06 + v.r(0, 0.3), v.r(300, 800) * p, 0.12, v.r(0.03, 0.06), v.r(1.3, 1.8));
  },
});

def('glide_fizzle', {
  gain: 0.3, max: 2, jitter: 0.05, reverb: 0.05,
  build(v, p) {
    swell(v, 0, 0.4, 5200 * p, 1400 * p, 0.45, 1.0, 'white');                                                // the fuse snuffed
    v.tone({ f: 640 * p, f1: 220 * p, sw: 0.2, a: 0.002, d: 0.22, peak: 0.2 });
    for (let i = 0; i < 3; i++) v.nz({ t: 0.05 + i * 0.07 + v.r(0, 0.03), ft: 'bandpass', f: v.r(2200, 3600) * p, q: 6, a: 0.0004, d: 0.015, peak: 0.25 });   // last crackles
  },
});

export const GLIDE_SOUNDS = ['glide_cook', 'glide_release', 'glide_slide', 'glide_bounce', 'glide_clink', 'glide_boom', 'glide_pop', 'glide_plop', 'glide_fizzle'];
