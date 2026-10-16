// Highmark Foundry's lava sounds (src/game/lava.js plays them; all synthesized, like every other SFX). Rising and
// falling never share a sound: a rise is the Surge Bell (3 slow tolls, then fast) + the siren winding UP + the erupt
// + the rumble swelling; a fall is two short steam-whistle blasts + the siren winding DOWN + the hiss + the drain.
//   lava_rumble     loop, global: sub-bass 28–45 Hz under filtered brown noise (the module sets its level)
//   lava_erupt      the rise starting: a deep boom and a ripping gout
//   lava_hiss       the fall starting: a long steam hiss
//   lava_drain      loop, during falls: a deep gurgle
//   lava_sizzle     ink burned off, a shot / device fizzling, a lava splat
//   lava_pop        a stone breaking the surface (chains clanking taut)
//   lava_lock       a rest reached HIGH: the Organs' basalt grinding home
//   lava_tick       the countdown's last 3 s (lower before a fall)
//   lava_bell       the warning before a rise: the Surge Bell, 3 slow tolls then 6 fast
//   lava_siren_up   a hand-siren winding UP in pitch over the 10 s rise
//   lava_siren_down the same siren winding DOWN over the 10 s fall
//   lava_whistle    params.kind 'warn': two short steam-whistle blasts (the fall warning); 'clear': one long low all-clear
import { SFX } from './audio.js';
import { pts, sweep, bell } from './music.js';

const def = (name, o) => { if (!SFX[name]) SFX[name] = o; };
function swell(v, t, dur, f0, f1, peak, q = 1.2, kind = 'pink') {
  const T = v.t + t, g = v.gain(0, v.out), bp = v.filter('bandpass', f0, q, g);
  sweep(bp.frequency, T, f0, f1, dur);
  pts(g.gain, T, [[0, 0], [dur * 0.4, peak], [dur, 0]]);
  v.noise(kind, T, T + dur + 0.02, bp);
}

def('lava_rumble', {
  gain: 0.42, max: 1, jitter: 0, reverb: 0.15, oneShot: 3,
  loop(v, p) {
    const T = v.t, amp = v.gain(0.9, v.out), lp = v.filter('lowpass', 120 * p, 0.9, amp);
    v.osc('sine', 31 * p, T, null, lp); v.osc('sine', 44 * p, T, null, v.gain(0.6, lp));
    v.lfo(0.23, 0.35, amp.gain, T, null);
    const ng = v.gain(0.5, v.out), nf = v.filter('lowpass', 260, 0.7, ng);
    v.noise('brown', T, null, nf);
    v.lfo(0.4, 0.25, ng.gain, T, null);
  },
});

def('lava_erupt', {
  gain: 0.8, max: 2, jitter: 0.02, reverb: 0.4,
  build(v, p) {
    v.tone({ f: 70 * p, f1: 28 * p, sw: 1.2, a: 0.01, d: 1.6, peak: 1 });
    v.tone({ type: 'triangle', f: 110 * p, f1: 40 * p, sw: 0.8, a: 0.01, d: 1.0, peak: 0.5 });
    v.nz({ kind: 'brown', ft: 'lowpass', f: 900, f1: 160, sw: 1.4, a: 0.02, d: 1.5, peak: 0.9 });
    swell(v, 0.05, 1.6, 300, 1400, 0.45, 0.9);
    for (let i = 0; i < 9; i++) v.nz({ t: 0.15 + i * 0.11 + v.r(0, 0.06), ft: 'bandpass', f: v.r(1200, 3200), q: 3, a: 0.001, d: 0.05, peak: 0.22 });
  },
});

def('lava_hiss', {
  gain: 0.6, max: 2, jitter: 0.02, reverb: 0.35,
  build(v, p) {
    const T = v.t, g = v.gain(0, v.out), hp = v.filter('highpass', 2400 * p, 0.7, g);
    pts(g.gain, T, [[0, 0], [0.25, 0.75], [1.4, 0.45], [2.6, 0]]);
    v.noise('white', T, T + 2.7, hp);
    swell(v, 0, 2.2, 5200, 1800, 0.35, 0.8, 'white');
  },
});

def('lava_drain', {
  gain: 0.35, max: 1, jitter: 0, reverb: 0.2, oneShot: 2.5,
  loop(v, p) {
    const T = v.t, amp = v.gain(0.7, v.out), bp = v.filter('bandpass', 180 * p, 2.2, amp);
    v.noise('brown', T, null, bp);
    v.lfo(3.1, 90, bp.frequency, T, null, 'triangle');
    v.lfo(1.7, 0.45, amp.gain, T, null);
    const g2 = v.gain(0.25, v.out); v.osc('sine', 52 * p, T, null, v.filter('lowpass', 90, 1, g2));
  },
});

def('lava_sizzle', {
  gain: 0.38, max: 5, jitter: 0.12, reverb: 0.05, minGap: 0.05,
  build(v, p) {
    v.nz({ ft: 'highpass', f: 3800 * p, q: 0.8, a: 0.004, d: 0.32, peak: 0.6 });
    for (let i = 0; i < 6; i++) v.nz({ t: v.r(0, 0.25), ft: 'bandpass', f: v.r(2500, 6500), q: 4, a: 0.0005, d: 0.012, peak: 0.35 });
  },
});

def('lava_pop', {
  gain: 0.5, max: 4, jitter: 0.08, reverb: 0.12, minGap: 0.03,
  build(v, p) {
    v.tone({ f: 160 * p, f1: 420 * p, sw: 0.06, a: 0.002, d: 0.09, peak: 0.6 });
    v.nz({ kind: 'pink', f: 700 * p, q: 2, a: 0.001, d: 0.08, peak: 0.4 });
    for (let i = 0; i < 4; i++) v.tone({ t: 0.08 + i * 0.06, type: 'triangle', f: v.r(1900, 2600), a: 0.001, d: 0.05, peak: 0.12 });   // the chain
  },
});

def('lava_lock', {
  gain: 0.6, max: 2, jitter: 0.03, reverb: 0.3,
  build(v, p) {
    v.nz({ kind: 'brown', ft: 'lowpass', f: 600, f1: 180, sw: 0.7, a: 0.02, d: 0.8, peak: 0.7 });
    v.tone({ f: 58 * p, f1: 44 * p, sw: 0.4, a: 0.005, d: 0.6, peak: 0.8 });
    v.tone({ t: 0.5, f: 90 * p, f1: 60 * p, sw: 0.15, a: 0.002, d: 0.3, peak: 0.6 });
  },
});

def('lava_tick', {
  gain: 0.5, max: 2, jitter: 0, reverb: 0.1, minGap: 0.3,
  build(v, p) { v.tone({ type: 'square', f: 880 * p, a: 0.001, d: 0.07, peak: 0.25, to: v.filter('lowpass', 3000, 1, v.out) }); v.tone({ f: 1760 * p, a: 0.001, d: 0.05, peak: 0.12 }); },
});

// the Surge Bell (1.6 m bronze): a strike = FM bell + its hum and tierce partials, a long ring
function toll(v, T, f, vel) {
  bell(v, T, f, vel, { d: 2.6, ratio: 2.76, index: 1.4 });
  v.tone({ at: T, f: f * 0.5, a: 0.004, d: 3.2, peak: vel * 0.45 });        // hum
  v.tone({ at: T, f: f * 1.19, a: 0.003, d: 1.8, peak: vel * 0.18 });       // tierce
  v.tone({ at: T, type: 'triangle', f: f * 2.0, a: 0.002, d: 0.9, peak: vel * 0.12 });
}
def('lava_bell', {
  gain: 0.55, max: 1, jitter: 0, reverb: 0.5,
  build(v, p) {
    const f = 196 * p;
    for (let i = 0; i < 3; i++) toll(v, v.t + i * 1.5, f, 0.9);
    for (let i = 0; i < 6; i++) toll(v, v.t + 4.6 + i * 0.55, f * 1.0, 0.65);
  },
});

// a hand-siren: a sawtooth + square through a resonant band, its pitch winding over `dur`, three slow wobbles
function siren(v, p, f0, f1, dur) {
  const T = v.t, g = v.gain(0, v.out), bp = v.filter('bandpass', f0 * 2, 1.6, g), lp = v.filter('lowpass', 2600, 0.7, bp);
  const o1 = v.osc('sawtooth', f0 * p, T, T + dur + 0.1, lp), o2 = v.osc('square', f0 * p * 1.005, T, T + dur + 0.1, v.gain(0.35, lp));
  for (const o of [o1, o2]) { sweep(o.frequency, T, f0 * p, f1 * p, dur); v.lfo(0.32, f0 * 0.06, o.frequency, T, T + dur + 0.1); }
  sweep(bp.frequency, T, f0 * 2, f1 * 2, dur);
  pts(g.gain, T, [[0, 0], [0.6, 0.32], [dur - 1.2, 0.36], [dur, 0]]);
}
def('lava_siren_up', { gain: 0.5, max: 1, jitter: 0, reverb: 0.4, build(v, p) { siren(v, p, 170, 760, 10); } });
def('lava_siren_down', { gain: 0.5, max: 1, jitter: 0, reverb: 0.4, build(v, p) { siren(v, p, 760, 150, 10); } });

// a steam whistle: three detuned pipes + breath noise; two short blasts (warn) or one long low all-clear
function blast(v, T, f, len, peak) {
  const g = v.gain(0, v.out), lp = v.filter('lowpass', f * 5, 0.8, g);
  for (const [k, m] of [[1, 0.5], [1.5, 0.3], [2.01, 0.22]]) v.osc('triangle', f * k, T, T + len + 0.1, v.gain(m, lp));
  v.noise('white', T, T + len + 0.1, v.filter('bandpass', f * 3, 2, v.gain(0.25, g)));
  pts(g.gain, T, [[0, 0], [0.06, peak], [len - 0.1, peak * 0.9], [len, 0]]);
}
def('lava_whistle', {
  gain: 0.5, max: 2, jitter: 0, reverb: 0.45,
  build(v, p, o) {
    if (o?.params?.kind === 'clear') blast(v, v.t, 233 * p, 2.4, 0.5);
    else { blast(v, v.t, 466 * p, 0.55, 0.6); blast(v, v.t + 0.8, 466 * p, 0.55, 0.6); }
  },
});
