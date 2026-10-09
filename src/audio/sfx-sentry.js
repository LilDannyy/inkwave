// [b5-subs] The Scrap Sentry's own sounds (src/game/kits/sentry.js plays them through the cue director, G.cues; all
// synthesized — a turret built from beach junk: tin cans, a squeezy bottle, coat-hanger springs and a little servo).
// Same format as audio.js's def() calls: build(v, pitch) one-shots, loop(v, pitch, opts) loops.
//   sentry_place    set down (cue 'throw'): a tin clatter — three short metallic partials (1.8 / 2.9 / 4.6 kHz) and a thud
//   sentry_unfold   unfolded (cue 'land'): a ratchet of 6 rapid clicks and a spring "boing"
//   sentry_idle     standing (a quiet positional loop, ~10 m): a 90 Hz servo hum with random creaks; params { busy }
//   sentry_lock     a new target (cue 'warn'): "bip-bip", two square-wave notes at 1.6 kHz
//   sentry_shot     each round: a tinny Spritzer "pft" (shoot_shooter at pitch 1.25) and a 2.4 kHz tin ping
//   sentry_hit      enemy fire on it: a tin clank (on top of wave 1's device_hit)
//   sentry_sputter  running dry (from 12 s): three noise coughs
//   sentry_fold     timed out / folded: the ratchet run down
//   sentry_break    shot down (cue 'end'): a can crumple (noise swept down), a clank, a falling spring boing
//   sentry_note     the owner's "SENTRY DOWN" sting (hud.js _subNote): a sad two-note tin clink
import { SFX } from './audio.js';
import { pts, sweep } from './music.js';

const def = (name, o) => { SFX[name] = o; };
const K = 0.04;   // param smoothing (s)
// a short struck-tin partial: a sine with a fast bright attack, a little detune for the rattle
function tin(v, t, f, d, peak) {
  v.tone({ t, f, a: 0.0006, d, peak });
  v.tone({ t, f: f * 1.013, a: 0.0006, d: d * 0.7, peak: peak * 0.5 });
}
// a coat-hanger spring "boing": a sine bent up then down with a wobble
function boing(v, t, f0, f1, dur, peak) {
  const T = v.t + t, g = v.gain(0, v.out);
  const o = v.osc('sine', f0, T, T + dur + 0.05, g);
  pts(o.frequency, T, [[0, f0], [dur * 0.25, f1], [dur, f0 * 0.8]]);
  pts(g.gain, T, [[0, 0], [0.005, peak], [dur, 0]]);
  v.lfo(14, f0 * 0.06, o.frequency, T, T + dur);
}
// a ratchet: n clicks spaced gap s apart, starting at t (rising or falling in pitch)
function ratchet(v, t, n, gap, f0, f1, peak) {
  for (let i = 0; i < n; i++) {
    const k = n > 1 ? i / (n - 1) : 0;
    v.nz({ t: t + i * gap + v.r(0, 0.004), ft: 'bandpass', f: f0 + (f1 - f0) * k, q: 7, a: 0.0003, d: 0.012, peak });
    v.tone({ t: t + i * gap, type: 'square', f: (f0 + (f1 - f0) * k) * 0.25, a: 0.0003, d: 0.008, peak: peak * 0.2, to: v.filter('lowpass', 2400, 0.8, v.out) });
  }
}

def('sentry_place', {
  gain: 0.42, max: 3, jitter: 0.05, reverb: 0.08,
  build(v, p) {
    v.tone({ f: 140 * p, f1: 60 * p, sw: 0.07, a: 0.001, d: 0.09, peak: 0.7 });                          // the thud
    v.nz({ kind: 'brown', ft: 'lowpass', f: 900, a: 0.001, d: 0.05, peak: 0.4 });
    tin(v, 0.004, 1800 * p, 0.09, 0.32); tin(v, 0.022, 2900 * p, 0.07, 0.24); tin(v, 0.041, 4600 * p, 0.05, 0.18);   // the clatter
    for (let i = 0; i < 3; i++) v.nz({ t: 0.06 + i * 0.03 + v.r(0, 0.01), ft: 'bandpass', f: v.r(3000, 5200) * p, q: 8, a: 0.0004, d: 0.015, peak: 0.16 });
  },
});

def('sentry_unfold', {
  gain: 0.36, max: 3, jitter: 0.04, reverb: 0.06,
  build(v, p) {
    ratchet(v, 0, 6, 0.045, 2600 * p, 3800 * p, 0.42);                                                     // legs ratcheting out
    boing(v, 0.3, 320 * p, 560 * p, 0.32, 0.22);                                                           // the head pops up
    tin(v, 0.3, 2200 * p, 0.06, 0.14);
  },
});

def('sentry_idle', {
  gain: 0.12, max: 4, jitter: 0, reverb: 0.06, oneShot: 2,
  loop(v, p, o) {
    const T = v.t, st = { busy: 0, q: p, ...(o?.params || {}) };
    const hg = v.gain(0.3, v.filter('lowpass', 700, 0.9, v.out));
    const h1 = v.osc('sawtooth', 90 * p, T, null, hg), h2 = v.osc('triangle', 180.5 * p, T, null, v.gain(0.25, hg));
    v.lfo(0.7, 0.08, hg.gain, T, null);
    // creaks: a narrow noise band gated by a slow irregular pair of LFOs (rarely lines up: a creak now and then)
    const cg = v.gain(0, v.out); v.noise('white', T, null, v.filter('bandpass', 1500, 9, cg));
    v.lfo(0.37, 0.05, cg.gain, T, null); v.lfo(0.53, 0.05, cg.gain, T, null);
    const apply = (now) => { const q = st.q * (st.busy ? 1.18 : 1); h1.frequency.setTargetAtTime(90 * q, now, K); h2.frequency.setTargetAtTime(180.5 * q, now, K); hg.gain.setTargetAtTime(st.busy ? 0.42 : 0.3, now, 0.08); };
    apply(T);
    return { pitch(q, now) { st.q = q; apply(now); }, params(o2, now) { Object.assign(st, o2); apply(now); } };
  },
});

def('sentry_lock', {
  gain: 0.3, max: 3, jitter: 0, reverb: 0.06, minGap: 0.12,
  build(v, p) {
    const lp = v.filter('lowpass', 5200, 0.8, v.out);
    v.tone({ type: 'square', f: 1600 * p, a: 0.002, h: 0.045, d: 0.02, peak: 0.24, to: lp });
    v.tone({ t: 0.1, type: 'square', f: 1600 * p, a: 0.002, h: 0.06, d: 0.03, peak: 0.26, to: lp });
    v.tone({ t: 0.1, f: 3200 * p, a: 0.002, h: 0.04, d: 0.03, peak: 0.08 });
  },
});

def('sentry_shot', {
  gain: 0.55, max: 6, jitter: 0.05, reverb: 0.06, minGap: 0.03,
  build(v, p) {
    SFX.shoot_shooter?.build(v, p * 1.25);                                                                 // a tinny Spritzer pft
    tin(v, 0.002, 2400 * p, 0.05, 0.22);                                                                   // the tin ping
  },
});

def('sentry_hit', {
  gain: 0.36, max: 4, jitter: 0.08, reverb: 0.06, minGap: 0.05,
  build(v, p) {
    tin(v, 0, 1450 * p, 0.08, 0.38); tin(v, 0.003, 2350 * p, 0.06, 0.24);
    v.nz({ ft: 'bandpass', f: 3100 * p, q: 3, a: 0.0004, d: 0.03, peak: 0.3 });
  },
});

def('sentry_sputter', {
  gain: 0.34, max: 3, jitter: 0.06, reverb: 0.05, minGap: 0.4,
  build(v, p) {
    for (let i = 0; i < 3; i++) {
      const t = i * v.r(0.11, 0.16);
      v.nz({ t, kind: 'pink', ft: 'bandpass', f: v.r(600, 900) * p, f1: v.r(300, 420) * p, sw: 0.08, q: 1.3, a: 0.004, d: 0.08, peak: 0.6 });
      v.tone({ t, f: 120 * p, f1: 80 * p, sw: 0.06, a: 0.003, d: 0.06, peak: 0.25 });
    }
  },
});

def('sentry_fold', {
  gain: 0.34, max: 3, jitter: 0.04, reverb: 0.06,
  build(v, p) {
    ratchet(v, 0, 6, 0.05, 3600 * p, 2200 * p, 0.36);                                                      // run down
    v.tone({ t: 0.3, f: 220 * p, f1: 110 * p, sw: 0.12, a: 0.002, d: 0.14, peak: 0.35 });                  // settles
    tin(v, 0.31, 1700 * p, 0.07, 0.16);
  },
});

def('sentry_break', {
  gain: 0.5, max: 3, jitter: 0.05, reverb: 0.12,
  build(v, p) {
    // the can crumpling: a noise band swept down, gritty
    const T = v.t, g = v.gain(0, v.out), bp = v.filter('bandpass', 4200 * p, 2.2, g);
    sweep(bp.frequency, T, 4200 * p, 600 * p, 0.32);
    pts(g.gain, T, [[0, 0], [0.01, 0.8], [0.12, 0.5], [0.34, 0]]);
    v.noise('white', T, T + 0.36, bp);
    for (let i = 0; i < 6; i++) v.nz({ t: i * 0.035 + v.r(0, 0.012), ft: 'bandpass', f: v.r(1800, 4400) * p, q: v.r(4, 8), a: 0.0004, d: 0.02, peak: 0.4 });
    tin(v, 0.02, 1300 * p, 0.14, 0.4); tin(v, 0.05, 2100 * p, 0.1, 0.25);                                 // the clank
    v.tone({ f: 120 * p, f1: 50 * p, sw: 0.2, a: 0.002, d: 0.22, peak: 0.55 });
    // the spring boinging off, falling
    const T2 = T + 0.12, g2 = v.gain(0, v.out), o = v.osc('sine', 700 * p, T2, T2 + 0.5, g2);
    pts(o.frequency, T2, [[0, 700 * p], [0.45, 180 * p]]);
    pts(g2.gain, T2, [[0, 0], [0.01, 0.2], [0.45, 0]]);
    v.lfo(18, 40 * p, o.frequency, T2, T2 + 0.45);
  },
});

def('sentry_note', {
  gain: 0.3, max: 1, jitter: 0, reverb: 0.08,
  build(v, p) { tin(v, 0, 1760 * p, 0.12, 0.3); tin(v, 0.12, 1320 * p, 0.2, 0.32); },
});

export const SENTRY_SOUNDS = ['sentry_place', 'sentry_unfold', 'sentry_idle', 'sentry_lock', 'sentry_shot', 'sentry_hit', 'sentry_sputter', 'sentry_fold', 'sentry_break', 'sentry_note'];
