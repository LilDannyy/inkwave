// [b5-subs] Chain Bobber sounds (src/game/kits/bobber.js plays them, mostly through the cue director: src/audio/cues.js
// SUB_CUE.bobber). All synthesized; the format is audio.js's: build(v, pitch, opts) one-shots.
//   bobber_throw    the throw: a light "bloop" whoosh (a rising hollow pop over a short air swell)
//   bobber_inflate  it pops open and rises to its float spot: a "fwip" (noise swept 600 → 2400 Hz) and a small squeak
//   bobber_link     a tether made: a "zing", sine 900 → 1800 Hz — the kit plays it a semitone higher per link of the chain
//                   (pitch 2^((N − 2) / 12))
//   bobber_fuse     the spark racing down a tether: a dry crackle, one per hop
//   bobber_boom     a hop level of a chain going off: N = 1 is a pellet-sized pop, N ≥ 4 a big low boom. The kit plays it at
//                   pitch 1.15 − 0.08 × (N − 1) and the build reads its size from that pitch (1.15 → pop … ≤ 0.91 → boom);
//                   its gain rises with N (the play's volume)
//   bobber_disarm   disarmed by enemy fire: a deflating "pfffw" and a fizzle
//   bobber_expire   its time up: a quiet pip-pop
//   bobber_doo      (yours only, 2D) a foe disarmed one of your bobbers: a quiet low "doo"
//   bobber_snap     a tether snapping (stretched, its line cut, a bobber gone): a tiny tick and a twang
import { SFX } from './audio.js';
import { pts, sweep } from './music.js';

const def = (name, o) => { SFX[name] = o; };
const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
// a filtered noise swell (band sweeps f0 → f1 over dur)
function swell(v, t, dur, f0, f1, peak, q = 1.4, kind = 'pink') {
  const T = v.t + t, g = v.gain(0, v.out), bp = v.filter('bandpass', f0, q, g);
  sweep(bp.frequency, T, f0, f1, dur);
  pts(g.gain, T, [[0, 0], [dur * 0.5, peak], [dur, 0]]);
  v.noise(kind, T, T + dur + 0.02, bp);
}

def('bobber_throw', {
  gain: 0.3, max: 4, jitter: 0.06, reverb: 0.05, minGap: 0.05,
  build(v, p) {
    v.tone({ f: 330 * p, f1: 760 * p, sw: 0.06, a: 0.002, d: 0.08, peak: 0.55 });                       // the bloop
    v.tone({ t: 0.012, type: 'triangle', f: 660 * p, f1: 1250 * p, sw: 0.05, a: 0.002, d: 0.05, peak: 0.16 });
    swell(v, 0, 0.2, 700 * p, 2600 * p, 0.32, 1.1);                                                       // air
  },
});

def('bobber_inflate', {
  gain: 0.3, max: 6, jitter: 0.05, reverb: 0.06, minGap: 0.03,
  build(v, p) {
    swell(v, 0, 0.16, 600 * p, 2400 * p, 0.55, 1.6, 'white');                                           // the fwip
    v.tone({ t: 0.09, type: 'square', f: 1500 * p, f1: 2100 * p, sw: 0.05, a: 0.003, d: 0.05, peak: 0.07, to: v.filter('lowpass', 3600, 0.8, v.out) });   // squeak
    v.tone({ t: 0.02, f: 210 * p, f1: 330 * p, sw: 0.12, a: 0.004, d: 0.12, peak: 0.3 });              // rubber body filling
  },
});

def('bobber_link', {
  gain: 0.2, max: 6, jitter: 0, reverb: 0.1, minGap: 0.03,
  build(v, p) {
    v.tone({ f: 900 * p, f1: 1800 * p, sw: 0.09, a: 0.002, d: 0.16, peak: 0.42 });
    v.tone({ t: 0.004, type: 'triangle', f: 2700 * p, f1: 3600 * p, sw: 0.06, a: 0.001, d: 0.07, peak: 0.08 });   // the wire's shimmer
  },
});

def('bobber_fuse', {
  gain: 0.26, max: 6, jitter: 0.1, reverb: 0.04, minGap: 0.02,
  build(v, p) {
    for (let i = 0; i < 5; i++) v.nz({ t: i * 0.012 + v.r(0, 0.006), ft: 'bandpass', f: v.r(2600, 5200) * p, q: 5, a: 0.0003, d: 0.008, peak: v.r(0.35, 0.65) });   // crackle
    v.nz({ ft: 'highpass', f: 4000 * p, a: 0.002, d: 0.06, peak: 0.18 });                               // the fizz along it
  },
});

def('bobber_boom', {
  gain: 0.62, max: 6, jitter: 0.03, reverb: 0.12, minGap: 0.03,
  build(v, p) {
    const big = clamp((1.15 - p) / 0.24, 0, 1);   // 0: a lone bobber's pop … 1: a 4-chain (and more: lower still)
    const q = p / (1.15 - 0.24 * big);            // (what's left of the pitch once the size is read off it: the jitter)
    // the pop (fades out as it grows)
    v.tone({ f: 620 * q, f1: 160 * q, sw: 0.07, a: 0.0008, d: 0.1, peak: 0.6 * (1 - 0.6 * big) });
    v.nz({ ft: 'bandpass', f: 2600 * q, q: 2, a: 0.0006, d: 0.04, peak: 0.5 * (1 - 0.4 * big) });
    // the body: a lower, longer boom the bigger the chain (Splat Bomb grade at 4)
    const f0 = 150 * p, len = 0.16 + 0.22 * big;
    v.tone({ f: f0, f1: f0 * 0.32, sw: len, a: 0.002, d: len, peak: 0.45 + 0.55 * big });
    v.nz({ kind: 'pink', ft: 'lowpass', f: 2600 * p, f1: 300, sw: len, q: 1.3, a: 0.002, d: len, peak: 0.55 + 0.4 * big });
    v.nz({ t: 0.008, f: 1500 * p, f1: 330 * p, sw: len, q: 5, a: 0.003, d: len + 0.04, peak: 0.55 + 0.35 * big });   // wet splort
    if (big > 0.3) v.nz({ t: 0.02, kind: 'brown', ft: 'lowpass', f: 420, a: 0.01, d: 0.35 * big, peak: 0.5 * big });   // the thump under it
    v.nz({ ft: 'highpass', f: 4200, a: 0.002, d: 0.12 + 0.12 * big, peak: 0.22 });                     // air
  },
});

def('bobber_disarm', {
  gain: 0.36, max: 4, jitter: 0.06, reverb: 0.06, minGap: 0.04,
  build(v, p) {
    swell(v, 0, 0.34, 3200 * p, 700 * p, 0.5, 1.0, 'white');                                            // pfffw (deflating)
    v.tone({ f: 520 * p, f1: 170 * p, sw: 0.3, a: 0.004, d: 0.3, peak: 0.22 });                          // the rubber sagging
    for (let i = 0; i < 4; i++) v.nz({ t: 0.18 + i * 0.05 + v.r(0, 0.02), ft: 'bandpass', f: v.r(2400, 4400) * p, q: 6, a: 0.0004, d: 0.018, peak: 0.22 });   // fizzle
  },
});

def('bobber_expire', {
  gain: 0.2, max: 4, jitter: 0.05, reverb: 0.05, minGap: 0.04,
  build(v, p) {
    v.tone({ type: 'triangle', f: 1560 * p, a: 0.001, d: 0.04, peak: 0.4 });                              // pip
    v.tone({ t: 0.07, f: 520 * p, f1: 210 * p, sw: 0.06, a: 0.001, d: 0.07, peak: 0.45 });               // pop
    swell(v, 0.07, 0.22, 2400 * p, 900 * p, 0.18, 1.2, 'white');
  },
});

def('bobber_doo', {
  gain: 0.22, max: 2, jitter: 0, reverb: 0.08, minGap: 0.12,
  build(v, p) {
    const lp = v.filter('lowpass', 1100, 0.7, v.out);
    v.tone({ type: 'triangle', f: 233 * p, f1: 196 * p, sw: 0.22, a: 0.01, h: 0.08, d: 0.16, peak: 0.5, to: lp });
    v.tone({ f: 116 * p, a: 0.01, h: 0.06, d: 0.14, peak: 0.3 });
  },
});

def('bobber_snap', {
  gain: 0.22, max: 4, jitter: 0.08, reverb: 0.04, minGap: 0.03,
  build(v, p) {
    v.nz({ ft: 'bandpass', f: 4200 * p, q: 4, a: 0.0003, d: 0.012, peak: 0.6 });                        // tick
    v.tone({ type: 'triangle', f: 1300 * p, f1: 520 * p, sw: 0.1, a: 0.001, d: 0.11, peak: 0.18 });      // twang
  },
});

export const BOBBER_SOUNDS = ['bobber_throw', 'bobber_inflate', 'bobber_link', 'bobber_fuse', 'bobber_boom', 'bobber_disarm', 'bobber_expire', 'bobber_doo', 'bobber_snap'];
