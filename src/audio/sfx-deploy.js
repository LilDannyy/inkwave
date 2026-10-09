// [b5-deploy] Deployables' own sounds (src/game/deployables.js plays them through the cue director; all synthesized).
// Same format as audio.js's def() calls: build(v, pitch, opts) one-shots.
//   device_hit    enemy fire striking a sprinkler / beacon / Skitter Bomb: a hard plastic "tok" with a little ink spatter
//                 (rate-limited per device; the buoy keeps its own ping)
//   device_pop    a sprinkler / beacon shot down: a plastic crack, a burst of air and ink, a few bits clattering
//                 (on top of its own break: sprinkler_break / beacon_break)
//   seeker_pop    a Skitter Bomb popped by enemy fire: a small pop and a fizzle — clearly not its blast
//   device_crunch the tower running a device over: a heavy crunch (the tower's weight), plastic splintering, a metal
//                 squeal, debris
import { SFX } from './audio.js';
import { pts, sweep } from './music.js';

const def = (name, o) => { SFX[name] = o; };
// a filtered noise swell (band sweeps f0 → f1 over dur)
function swell(v, t, dur, f0, f1, peak, q = 1.4, kind = 'pink') {
  const T = v.t + t, g = v.gain(0, v.out), bp = v.filter('bandpass', f0, q, g);
  sweep(bp.frequency, T, f0, f1, dur);
  pts(g.gain, T, [[0, 0], [dur * 0.55, peak], [dur, 0]]);
  v.noise(kind, T, T + dur + 0.02, bp);
}

def('device_hit', {
  gain: 0.36, max: 4, jitter: 0.12, reverb: 0.05, minGap: 0.04,
  build(v, p) {
    v.tone({ type: 'triangle', f: 1250 * p, f1: 760 * p, sw: 0.03, a: 0.0008, d: 0.05, peak: 0.55 });   // the hard plastic tok
    v.nz({ ft: 'bandpass', f: 3400 * p, q: 3, a: 0.0005, d: 0.025, peak: 0.45 });
    v.nz({ t: 0.01, f: 2400 * p, f1: 1100 * p, sw: 0.05, q: 2, a: 0.001, d: 0.05, peak: 0.22 });           // ink spatter
  },
});

def('device_pop', {
  gain: 0.5, max: 3, jitter: 0.05, reverb: 0.12,
  build(v, p) {
    v.nz({ ft: 'bandpass', f: 1800 * p, q: 1.5, a: 0.0005, d: 0.05, peak: 0.85 });                          // the crack
    v.tone({ f: 260 * p, f1: 80 * p, sw: 0.12, a: 0.001, d: 0.16, peak: 0.7 });                              // its body giving
    swell(v, 0.01, 0.28, 2600 * p, 500 * p, 0.45, 1.0);                                                   // air + ink out
    for (let i = 0; i < 5; i++) v.nz({ t: 0.08 + i * 0.045 + v.r(0, 0.02), ft: 'bandpass', f: v.r(2200, 4800) * p, q: 6, a: 0.0005, d: 0.02, peak: 0.3 });   // bits
  },
});

def('seeker_pop', {
  gain: 0.42, max: 3, jitter: 0.08, reverb: 0.08,
  build(v, p) {
    v.tone({ f: 620 * p, f1: 180 * p, sw: 0.07, a: 0.0008, d: 0.09, peak: 0.6 });                            // pop
    v.nz({ ft: 'bandpass', f: 2600 * p, q: 2.5, a: 0.0005, d: 0.03, peak: 0.5 });
    swell(v, 0.03, 0.4, 4200 * p, 900 * p, 0.3, 1.2, 'white');                                            // the fizzle out
    for (let i = 0; i < 3; i++) v.nz({ t: 0.12 + i * 0.06 + v.r(0, 0.02), ft: 'bandpass', f: v.r(1800, 3200) * p, q: 7, a: 0.0005, d: 0.02, peak: 0.22 });   // clatter
  },
});

def('device_crunch', {
  gain: 0.6, max: 3, jitter: 0.04, reverb: 0.18,
  build(v, p) {
    v.tone({ f: 95 * p, f1: 38 * p, sw: 0.25, a: 0.002, d: 0.32, peak: 1.0 });                              // the tower's weight
    v.nz({ kind: 'brown', ft: 'lowpass', f: 900, f1: 200, sw: 0.25, a: 0.002, d: 0.26, peak: 0.8 });
    for (let i = 0; i < 9; i++) v.nz({ t: i * 0.022 + v.r(0, 0.012), ft: 'bandpass', f: v.r(900, 3600) * p, q: v.r(3, 7), a: 0.0004, d: v.r(0.015, 0.035), peak: v.r(0.4, 0.75) });   // splintering
    v.tone({ t: 0.03, type: 'sawtooth', f: 1900 * p, f1: 1300 * p, sw: 0.18, a: 0.01, d: 0.2, peak: 0.08, to: v.filter('bandpass', 1600, 4, v.out) });   // a metal squeal
    for (let i = 0; i < 4; i++) v.nz({ t: 0.18 + i * 0.07 + v.r(0, 0.03), ft: 'bandpass', f: v.r(1500, 4200) * p, q: 6, a: 0.0005, d: 0.025, peak: 0.25 });   // debris
  },
});

export const DEPLOY_SOUNDS = ['device_hit', 'device_pop', 'seeker_pop', 'device_crunch'];
