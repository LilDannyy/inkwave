// Surf N' Turf sounds (src/game/sp-surf.js plays them; all synthesized). Same format as audio.js's def() calls:
// build(v, pitch, opts) one-shots (opts.params carries extras).
//   surf_ready   the special on: the buoy machine powering up in your hands (a rising servo whine + a sonar blip)
//   surf_throw   the throw: an arm swing and a hollow plastic whump
//   surf_deploy  it lands and anchors: a heavy plastic clunk, a chain rattle, then the buoy bell (two struck notes)
//   surf_pulse   each ring going out: a rising "whoom" (a filtered swell, a sub drop, a swept tone) — params.n (0 …
//                pulses − 1) makes each one bigger, longer and higher than the last
//   surf_hit     a ring catching someone: a wet slap + a bright sting (the mark's own chime follows from the mark)
//   surf_dodge   jumping a ring: a quick airy whoosh under you, a little "fwip" up
//   surf_pop     the buoy shot down: a plastic crack, a burst of air and ink, the bell's last clank
//   sting_surf   an enemy popped it (the cue director's sting: src/audio/cues.js `sting_<kind>`): a three-note rising
//                sea-shanty motif over a swell
import { SFX } from './audio.js';
import { mtof, pts, sweep, bell } from './music.js';

const def = (name, o) => { SFX[name] = o; };
// a filtered noise swell (band sweeps f0 → f1 over dur)
function swell(v, t, dur, f0, f1, peak, q = 1.4, kind = 'pink') {
  const T = v.t + t, g = v.gain(0, v.out), bp = v.filter('bandpass', f0, q, g);
  sweep(bp.frequency, T, f0, f1, dur);
  pts(g.gain, T, [[0, 0], [dur * 0.55, peak], [dur, 0]]);
  v.noise(kind, T, T + dur + 0.02, bp);
}

def('surf_ready', {
  gain: 0.34, max: 2, jitter: 0, reverb: 0.12,
  build(v, p) {
    v.tone({ type: 'sawtooth', f: 180 * p, f1: 520 * p, sw: 0.32, a: 0.02, d: 0.34, peak: 0.12, to: v.filter('lowpass', 1600, 1.2, v.out) });
    v.tone({ t: 0.05, type: 'triangle', f: 340 * p, f1: 900 * p, sw: 0.3, a: 0.02, d: 0.3, peak: 0.16 });
    v.tone({ t: 0.32, f: mtof(84) * p, f1: mtof(84) * p * 0.98, sw: 0.4, a: 0.002, d: 0.45, peak: 0.35 });   // sonar blip
    v.tone({ t: 0.32, f: mtof(91) * p, a: 0.002, d: 0.12, peak: 0.08 });
  },
});

def('surf_throw', {
  gain: 0.5, max: 2, jitter: 0.04, reverb: 0.06,
  build(v, p) {
    swell(v, 0, 0.22, 500 * p, 2400 * p, 0.55, 1.6);
    v.tone({ t: 0.03, f: 190 * p, f1: 120 * p, sw: 0.1, a: 0.003, d: 0.12, peak: 0.5 });          // hollow whump
    v.nz({ t: 0.03, f: 900 * p, q: 3, a: 0.002, d: 0.05, peak: 0.25 });
  },
});

def('surf_deploy', {
  gain: 0.62, max: 3, jitter: 0.02, reverb: 0.22,
  build(v, p) {
    // the clunk: a heavy plastic body thudding down + a knock
    v.tone({ f: 120 * p, f1: 52 * p, sw: 0.16, a: 0.002, d: 0.22, peak: 0.95 });
    v.nz({ kind: 'pink', ft: 'lowpass', f: 1800, f1: 400, sw: 0.15, a: 0.001, d: 0.14, peak: 0.6 });
    v.tone({ type: 'triangle', f: 420 * p, f1: 300 * p, sw: 0.05, a: 0.001, d: 0.06, peak: 0.35 });
    // a little chain rattle as it rights itself
    for (let i = 0; i < 5; i++) v.nz({ t: 0.06 + i * 0.035 + v.r(0, 0.01), ft: 'bandpass', f: v.r(3200, 5200), q: 6, a: 0.0005, d: 0.02, peak: 0.18 });
    // the buoy bell: two struck notes, a ring that hangs
    bell(v, v.t + 0.2, mtof(76) * p, 0.55, { d: 1.4, ratio: 2.76, index: 1.2 });
    bell(v, v.t + 0.48, mtof(71) * p, 0.4, { d: 1.6, ratio: 2.76, index: 1.1 });
  },
});

def('surf_pulse', {
  gain: 0.55, max: 4, jitter: 0, reverb: 0.2,
  build(v, p, o) {
    const n = Math.max(0, Math.min(7, o?.params?.n ?? 0)), k = n / 5;   // 0 … 1 over the six rings
    const len = 0.55 + 0.35 * k, up = 1 + 0.25 * k;
    // the swell: a band of noise rising like water drawing up a wave
    swell(v, 0, len, 220 * p, (1400 + 900 * k) * p, 0.5 + 0.35 * k, 1.1);
    // the "whoom": a low tone that swells and climbs
    const g = v.gain(0, v.filter('lowpass', 900 + 600 * k, 1, v.out)), T = v.t;
    pts(g.gain, T, [[0, 0], [len * 0.35, 0.55 + 0.3 * k], [len, 0]]);
    const o1 = v.osc('sine', 70 * p * up, T, T + len + 0.02, g), o2 = v.osc('triangle', 140 * p * up, T, T + len + 0.02, v.gain(0.35, g));
    sweep(o1.frequency, T, 60 * p * up, 120 * p * up, len); sweep(o2.frequency, T, 120 * p * up, 260 * p * up, len);
    // the ribbon's shimmer on top (a swept tone, brighter for the later rings)
    v.tone({ t: 0.05, type: 'triangle', f: (520 + 140 * n) * p, f1: (1050 + 260 * n) * p, sw: len * 0.8, a: 0.04, d: len * 0.75, peak: 0.12 + 0.05 * k });
  },
});

def('surf_hit', {
  gain: 0.6, max: 4, jitter: 0.04, reverb: 0.1, minGap: 0.04,
  build(v, p) {
    v.tone({ f: 260 * p, f1: 90 * p, sw: 0.09, a: 0.002, d: 0.12, peak: 0.7 });                     // wet slap
    v.nz({ kind: 'pink', f: 1500 * p, f1: 500 * p, sw: 0.12, q: 2.5, a: 0.002, d: 0.13, peak: 0.6 });
    v.tone({ t: 0.02, type: 'square', f: mtof(88) * p, a: 0.002, d: 0.08, peak: 0.08, to: v.filter('lowpass', 4200, 1, v.out) });   // sting
    v.tone({ t: 0.07, type: 'square', f: mtof(95) * p, a: 0.002, d: 0.14, peak: 0.07, to: v.filter('lowpass', 4800, 1, v.out) });
  },
});

def('surf_dodge', {
  gain: 0.42, max: 3, jitter: 0.05, reverb: 0.05, minGap: 0.05,
  build(v, p) {
    swell(v, 0, 0.26, 700 * p, 3600 * p, 0.6, 1.8, 'white');
    v.tone({ t: 0.04, type: 'triangle', f: 600 * p, f1: 1500 * p, sw: 0.12, a: 0.004, d: 0.13, peak: 0.18 });   // the "fwip" up
  },
});

def('surf_pop', {
  gain: 0.62, max: 2, jitter: 0.03, reverb: 0.2,
  build(v, p) {
    v.nz({ ft: 'highpass', f: 2600, a: 0.0005, d: 0.05, peak: 0.7 });                                  // the crack
    v.tone({ f: 160 * p, f1: 40 * p, sw: 0.28, a: 0.002, d: 0.32, peak: 0.85 });                      // its body going
    swell(v, 0.01, 0.42, 2600 * p, 300 * p, 0.55, 0.9, 'pink');                                        // the air rushing out
    for (let i = 0; i < 4; i++) v.bub(v.t + 0.05 + v.r(0, 0.2), v.r(300, 700) * p, 0.25, v.r(0.03, 0.05), 1.8);   // ink
    bell(v, v.t + 0.08, mtof(70) * p, 0.25, { d: 0.5, ratio: 2.4, index: 2.2 });                       // the bell's last clank
  },
});

def('sting_surf', {
  gain: 0.3, max: 2, jitter: 0, reverb: 0.3,
  build(v, p) {
    swell(v, 0, 0.5, 300 * p, 1600 * p, 0.35, 1.0);
    [[0.05, 69], [0.16, 74], [0.27, 78]].forEach(([t, m]) => {
      v.tone({ t, type: 'triangle', f: mtof(m) * p, a: 0.004, d: 0.22, peak: 0.42 });
      v.tone({ t, f: mtof(m) * p * 2, a: 0.002, d: 0.08, peak: 0.08 });
    });
    bell(v, v.t + 0.38, mtof(81) * p, 0.3, { d: 0.8, ratio: 2.76, index: 1.2 });
  },
});

export const SURF_SOUNDS = ['surf_ready', 'surf_throw', 'surf_deploy', 'surf_pulse', 'surf_hit', 'surf_dodge', 'surf_pop', 'sting_surf'];
