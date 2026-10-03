// INKWAVE — the Drainbow's sounds (src/game/sp-drainbow.js plays them; procedural like the rest of src/audio/audio.js,
// which calls defineDrainbowSounds() next to the cue sounds and lists DRAINBOW_SOUNDS with the specials — the cue bus).
//   drainbow_blow    the bubble blown up at your feet (its start: cues.js SPECIAL_START): a soapy rising "bwoop",
//                    a breathy swell and a glassy run up through the rainbow
//   drainbow_hum     the bubble standing there (a positional loop; params.boost 0 … 1 while it's being fed longer life)
//   drainbow_cross   someone passing through its film: a soft bloop and a chime (pitch 1 in, ~0.84 out)
//   drainbow_fizz    an enemy shot losing half its ink at the film: a short sizzle and a falling chirp
//   drainbow_pop     its end: a sharp soap-film pop, a falling plop, sparkles and droplets
//   drainbow_in      (you, drained) the wave sweeping the colour out of your view: a shimmering whoosh falling away
//   drainbow_out     (you) the colour sweeping back: the same whoosh rising, a bright chime at the end
//   drainbow_drain   (you, drained) a low bubbly suck under everything while you're in it (2D loop)
//   drainbow_gain    (you, gaining) a small rising twinkle as ink / special flows in
//   drainbow_extend  (the owner) the bubble fed more life: a rising three-note chime
//   sting_drainbow   an enemy (a teammate: softer) popped one (cues.js _sting)
import { mtof, pts, sweep, bell } from './music.js';

export const DRAINBOW_SOUNDS = ['drainbow_blow', 'drainbow_hum', 'drainbow_cross', 'drainbow_fizz', 'drainbow_pop', 'drainbow_in', 'drainbow_out',
  'drainbow_drain', 'drainbow_gain', 'drainbow_extend', 'sting_drainbow'];

const K = 0.05;

export function defineDrainbowSounds(def, L) {
  const { texture, bloops, plips, whoosh } = L;

  def('drainbow_blow', {
    gain: 0.6, max: 2, jitter: 0.02, reverb: 0.22,
    build(v, p) {
      const T = v.t;
      // the soapy body: a sine gliding up with a wobble, a touch of triangle under it
      const g = v.gain(0, v.out), o = v.osc('sine', 170 * p, T, T + 0.62, g);
      sweep(o.frequency, T, 170 * p, 520 * p, 0.46);
      v.lfo(11, 14, o.frequency, T, T + 0.62);
      pts(g.gain, T, [[0, 0], [0.05, 0.55], [0.42, 0.42], [0.6, 0]]);
      v.tone({ type: 'triangle', f: 85 * p, f1: 260 * p, sw: 0.45, a: 0.02, d: 0.42, peak: 0.22 });
      // breath filling it
      whoosh(v, 0, 0.5, 400 * p, 1400 * p, 2600 * p, 0.3, { q: 1.1 });
      // the rainbow: a glassy run up
      [76, 79, 83, 86, 91].forEach((m, i) => v.tone({ t: 0.12 + i * 0.055, f: mtof(m) * p, a: 0.003, d: 0.32, peak: 0.13 }));
      bell(v, T + 0.45, mtof(96) * p, 0.14, { d: 0.7 });
      // the bloop as it settles
      v.tone({ t: 0.5, f: 540 * p, f1: 360 * p, sw: 0.09, a: 0.003, d: 0.14, peak: 0.35 });
      plips(v, 0.5, 4, 0.25, [900, 2200], 0.12, p);
    },
  });

  def('drainbow_hum', {
    gain: 0.1, max: 6, jitter: 0, reverb: 0.2, oneShot: 1.5,
    loop(v, p) {
      const T = v.t, g = v.gain(0.55, v.out);
      const a = v.osc('sine', 523 * p, T, null, g), b = v.osc('sine', 784 * p, T, null, v.gain(0.45, g)), c = v.osc('triangle', 1046 * p, T, null, v.gain(0.12, g));
      const w = v.lfo(0.7, 9, a.detune, T, null); w.depth.connect(b.detune);
      v.lfo(0.45, 0.16, g.gain, T, null);
      // a faint fizz of the film (louder when it's fed)
      const fz = v.gain(0.04, v.out);
      v.buffer(texture(v.ctx, 'bubbles_bright'), T, null, v.filter('bandpass', 3200, 0.8, fz), p);
      return {
        pitch(q, now) { a.frequency.setTargetAtTime(523 * q, now, K); b.frequency.setTargetAtTime(784 * q, now, K); c.frequency.setTargetAtTime(1046 * q, now, K); },
        params(o, now) { const k = Math.min(1, Math.max(0, +o.boost || 0)); fz.gain.setTargetAtTime(0.04 + 0.16 * k, now, 0.1); c.frequency.setTargetAtTime(1046 * p * (1 + 0.5 * k), now, 0.1); },
      };
    },
  });

  def('drainbow_cross', {
    gain: 0.42, max: 6, jitter: 0.04, reverb: 0.14, minGap: 0.05,
    build(v, p) {
      const T = v.t;
      // the film giving way: a wobbling bloop …
      const g = v.gain(0, v.out), o = v.osc('sine', 330 * p, T, T + 0.3, g);
      sweep(o.frequency, T, 330 * p, 640 * p, 0.12);
      sweep(o.frequency, T + 0.12, 640 * p, 470 * p, 0.16);
      v.lfo(16, 22, o.frequency, T, T + 0.3);
      pts(g.gain, T, [[0, 0], [0.012, 0.6], [0.12, 0.35], [0.28, 0]]);
      // … and a little chime as it closes behind you
      bell(v, T + 0.07, mtof(88) * p, 0.16, { d: 0.45 });
      v.tone({ t: 0.09, f: mtof(95) * p, a: 0.002, d: 0.22, peak: 0.08 });
      v.nz({ ft: 'highpass', f: 5000, a: 0.002, d: 0.05, peak: 0.08 });
    },
  });

  def('drainbow_fizz', {
    gain: 0.32, max: 5, jitter: 0.08, reverb: 0.05, minGap: 0.045,
    build(v, p) {
      v.nz({ ft: 'highpass', f: 3800, a: 0.002, d: 0.11, peak: 0.6 });
      v.buffer(texture(v.ctx, 'sizzle'), v.t, v.t + 0.16, v.filter('highpass', 2600, 0.7, v.gain(0.35, v.out)), p);
      v.tone({ f: 1500 * p, f1: 520 * p, sw: 0.09, a: 0.002, d: 0.09, peak: 0.22 });
      plips(v, 0.01, 2, 0.06, [1500, 2600], 0.1, p);
    },
  });

  def('drainbow_pop', {
    gain: 0.62, max: 2, jitter: 0.03, reverb: 0.26,
    build(v, p) {
      const T = v.t;
      // the film snapping: a bright click and a wet tear
      v.nz({ ft: 'highpass', f: 2600, a: 0.0006, d: 0.035, peak: 0.95 });
      v.nz({ t: 0.004, f: 1800 * p, f1: 500 * p, sw: 0.12, q: 2.2, a: 0.002, d: 0.14, peak: 0.6 });
      // the plop
      v.tone({ f: 620 * p, f1: 180 * p, sw: 0.16, a: 0.002, d: 0.2, peak: 0.55 });
      v.tone({ type: 'triangle', f: 210 * p, f1: 90 * p, sw: 0.2, a: 0.004, d: 0.24, peak: 0.25 });
      // sparkles falling through the rainbow, droplets after
      [96, 93, 88, 84, 79].forEach((m, i) => v.tone({ t: 0.03 + i * 0.045, f: mtof(m) * p, a: 0.002, d: 0.25, peak: 0.11 }));
      bloops(v, 0.06, 5, 0.3, [500, 1100], 0.22, p);
      plips(v, 0.1, 6, 0.45, [1400, 3200], 0.1, p);
      const fz = v.gain(0, v.out);
      v.buffer(texture(v.ctx, 'bubbles_bright'), T + 0.05, T + 0.7, v.filter('bandpass', 2800, 0.8, fz), p);
      pts(fz.gain, T, [[0, 0], [0.08, 0.3], [0.7, 0]]);
    },
  });

  // (2D: the drained player's own) the colour washing out — the shimmer falls away and the world goes flat
  def('drainbow_in', {
    gain: 0.5, max: 1, jitter: 0, reverb: 0.25, minGap: 0.25,
    build(v, p) {
      const T = v.t;
      whoosh(v, 0, 1.0, 3400 * p, 1300 * p, 300 * p, 0.55, { q: 1.3, env: [[0, 0], [0.15, 1], [0.55, 0.6], [1, 0]] });
      [91, 88, 84, 79, 76, 72].forEach((m, i) => v.tone({ t: i * 0.07, f: mtof(m) * p, f1: mtof(m) * 0.94 * p, sw: 0.3, a: 0.004, d: 0.36, peak: 0.12 }));
      v.tone({ t: 0.05, f: 140 * p, f1: 62 * p, sw: 0.7, a: 0.05, d: 0.75, peak: 0.42 });   // the suck
      const fz = v.gain(0, v.out);
      v.buffer(texture(v.ctx, 'bubbles'), T, T + 1.0, v.filter('lowpass', 900, 0.8, fz), 0.8 * p);
      pts(fz.gain, T, [[0, 0], [0.2, 0.35], [1.0, 0]]);
    },
  });
  def('drainbow_out', {
    gain: 0.5, max: 1, jitter: 0, reverb: 0.25, minGap: 0.25,
    build(v, p) {
      whoosh(v, 0, 0.9, 300 * p, 1300 * p, 3400 * p, 0.5, { q: 1.3, env: [[0, 0], [0.4, 0.7], [0.8, 1], [1, 0]] });
      [72, 76, 79, 84, 88, 91].forEach((m, i) => v.tone({ t: 0.08 + i * 0.07, f: mtof(m) * 0.95 * p, f1: mtof(m) * p, sw: 0.2, a: 0.004, d: 0.32, peak: 0.12 }));
      bell(v, v.t + 0.55, mtof(96) * p, 0.2, { d: 0.9 });
      plips(v, 0.55, 5, 0.3, [1600, 3400], 0.09, p);
    },
  });

  def('drainbow_drain', {
    gain: 0.16, max: 1, jitter: 0, reverb: 0.05, oneShot: 1.5,
    loop(v, p) {
      const T = v.t, g = v.gain(0.8, v.out);
      v.buffer(texture(v.ctx, 'bubbles'), T, null, v.filter('lowpass', 700, 0.9, g), 0.7 * p);
      v.noise('brown', T, null, v.filter('lowpass', 260, 1.2, v.gain(0.5, v.out)));
      v.lfo(1.6, 0.35, g.gain, T, null);
      return {};
    },
  });

  def('drainbow_gain', {
    gain: 0.24, max: 2, jitter: 0.05, reverb: 0.12, minGap: 0.2,
    build(v, p) {
      [[0, 84], [0.05, 88], [0.1, 91]].forEach(([t, m]) => v.tone({ t, f: mtof(m) * p, a: 0.002, d: 0.16, peak: 0.3 }));
      plips(v, 0.02, 2, 0.1, [1800, 2800], 0.14, p);
    },
  });

  def('drainbow_extend', {
    gain: 0.3, max: 2, jitter: 0, reverb: 0.2, minGap: 0.3,
    build(v, p) {
      const T = v.t;
      [[0, 79], [0.07, 84], [0.14, 88]].forEach(([t, m]) => bell(v, T + t, mtof(m) * p, 0.24, { d: 0.5 }));
      v.tone({ t: 0.14, f: mtof(91) * p, a: 0.003, d: 0.4, peak: 0.1 });
    },
  });

  // someone popped a Drainbow: a bubble wobbling up, then the rainbow run falling grey (a minor turn at the end)
  def('sting_drainbow', {
    gain: 0.3, max: 2, jitter: 0, reverb: 0.3,
    build(v, p) {
      const T = v.t, g = v.gain(0, v.out), o = v.osc('sine', 260 * p, T, T + 0.3, g);
      sweep(o.frequency, T, 260 * p, 700 * p, 0.2);
      v.lfo(13, 18, o.frequency, T, T + 0.3);
      pts(g.gain, T, [[0, 0], [0.03, 0.5], [0.22, 0.3], [0.3, 0]]);
      [[0.18, 84], [0.26, 81], [0.34, 77], [0.42, 72]].forEach(([t, m]) => bell(v, T + t, mtof(m) * p, 0.26, { d: 0.35 }));
    },
  });
}
