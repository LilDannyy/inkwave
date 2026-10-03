// [b5-zipcheer] The Cheer Orb rework's sounds (src/game/sp-cheer.js plays them; all synthesized, the same format as
// audio.js's def() calls: build(v, pitch) one-shots).
//   orb_lift     the Cheer Orb's user lifting off into the air: a breathy whoosh up under a rising shimmer, a soft
//                "hover" hum settling at the top
//   cheer_wisp   a cheer's wisp leaving the cheerer: a light airy "fwee" up, a sprinkle of high notes
//   cheer_orb    a wisp reaching the orb: a bright two-note chime over a soft charge-up thrum (the orb swells)
//   cheer_gain   (the cheerer only) its wisp landing in your special gauge: a quick rising twinkle, a bubbly plink
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

def('orb_lift', {
  gain: 0.42, max: 2, jitter: 0.03, reverb: 0.2,
  build(v, p) {
    const T = v.t;
    swell(v, 0, 0.5, 300 * p, 2200 * p, 0.6, 1.2);
    const g = v.gain(0, v.out), end = pts(g.gain, T, [[0, 0], [0.08, 0.18], [0.45, 0.2], [0.8, 0]]);   // the rising shimmer
    const o = v.osc('triangle', 260 * p, T, end + 0.01, g);
    sweep(o.frequency, T, 260 * p, 640 * p, 0.45);
    v.lfo(9, 18, o.detune, T, end);
    v.tone({ t: 0.38, f: 196 * p, f1: 210 * p, sw: 0.4, a: 0.05, d: 0.45, peak: 0.16 });              // hover hum
    [76, 81, 88].forEach((m, i) => bell(v, T + 0.12 + i * 0.09, mtof(m) * p, 0.06, { d: 0.4 }));
  },
});

def('cheer_wisp', {
  gain: 0.2, max: 4, jitter: 0.06, reverb: 0.15, minGap: 0.05,
  build(v, p) {
    const T = v.t;
    swell(v, 0, 0.26, 1200 * p, 5200 * p, 0.35, 2.2);
    v.tone({ f: 660 * p, f1: 1320 * p, sw: 0.18, a: 0.01, d: 0.2, peak: 0.14 });
    [91, 95, 98].forEach((m, i) => v.tone({ t: 0.05 + i * 0.04, f: mtof(m) * p, a: 0.002, d: 0.12, peak: 0.07 }));
  },
});

def('cheer_orb', {
  gain: 0.3, max: 4, jitter: 0.04, reverb: 0.22, minGap: 0.05,
  build(v, p) {
    const T = v.t;
    bell(v, T, mtof(88) * p, 0.16, { d: 0.5 });
    bell(v, T + 0.06, mtof(93) * p, 0.12, { d: 0.55 });
    const g = v.gain(0, v.out), end = pts(g.gain, T, [[0, 0], [0.03, 0.3], [0.22, 0.12], [0.36, 0]]);   // charge-up thrum
    const o = v.osc('sawtooth', 110 * p, T, end + 0.01, v.filter('lowpass', 900, 1.4, g));
    sweep(o.frequency, T, 110 * p, 220 * p, 0.3);
    swell(v, 0, 0.18, 2400 * p, 6000 * p, 0.18, 2.5, 'white');
  },
});

def('cheer_gain', {
  gain: 0.24, max: 3, jitter: 0.02, reverb: 0.12, minGap: 0.05,
  build(v, p) {
    const T = v.t;
    [79, 84, 88, 91].forEach((m, i) => v.tone({ t: i * 0.035, f: mtof(m) * p, a: 0.002, d: 0.1, peak: 0.12 }));
    v.tone({ t: 0.14, f: 520 * p, f1: 980 * p, sw: 0.07, a: 0.003, d: 0.1, peak: 0.2 });              // bubbly plink
    bell(v, T + 0.16, mtof(96) * p, 0.08, { d: 0.35 });
  },
});
