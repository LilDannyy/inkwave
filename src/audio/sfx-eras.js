// Bluestone Junction's era sounds (src/game/eras.js plays them; all synthesized, like every other SFX): Commander
// Tartar is an old telephone, so the jump is told with a telephone's voice — a two-tone bell burst, the click of a
// receiver, then the clock-light front's swell and its ticking whoosh.
//   era_bell     the pre-bell (J − 20): ONE distant ring from the dome (a soft two-tone burst, long reverb)
//   era_ring     Tartar's ring (J − 10, J − 5, and short ones J − 3 … J − 1; params.n 'short'): a two-tone 400 / 480 Hz
//                bell burst on a wooden resonance, the old double-gong telephone
//   era_kiosk    a street telephone kiosk ringing with him (positional, thinner and higher)
//   era_strike   a clock striking (the striker clock's hammer on a bronze bell)
//   era_pickup   Tartar lifts his receiver (J − 1): a click, a rattle, a dial-tone breath
//   era_swell    the front leaves the dome (J): a rising chord of bells under a whoosh, and a low boom
//   era_front    loop riding the front where it passes you: a ticking whoosh (clock escapement through filtered air)
//   era_pop      a piece switching as the front reaches it (positional): a glassy tick-chime
import { SFX } from './audio.js';
import { pts, sweep, bell } from './music.js';

const def = (name, o) => { if (!SFX[name]) SFX[name] = o; };

// the telephone's double gong: two bells struck alternately by a hammer at ~20 Hz for `dur` seconds
function gong(v, T, dur, f1, f2, vel, rate = 20) {
  const n = Math.max(2, Math.round(dur * rate));
  for (let i = 0; i < n; i++) bell(v, T + i / rate, i % 2 ? f2 : f1, vel * (0.75 + 0.25 * Math.sin((i / n) * Math.PI)), { d: 0.22, ratio: 2.76, index: 1.2 });
  // the wooden case's resonance under it
  const g = v.gain(0, v.out), bp = v.filter('bandpass', 260, 2.5, g);
  pts(g.gain, T, [[0, 0], [0.04, vel * 0.35], [dur, vel * 0.3], [dur + 0.25, 0]]);
  v.noise('pink', T, T + dur + 0.3, bp);
}

def('era_bell', {
  gain: 0.42, max: 1, jitter: 0, reverb: 0.75,
  build(v, p) { gong(v, v.t, 1.1, 400 * p, 480 * p, 0.5, 16); },
});
def('era_ring', {
  gain: 0.62, max: 2, jitter: 0, reverb: 0.45,
  build(v, p, o = {}) {
    const short = o && o.n === 'short';
    gong(v, v.t, short ? 0.38 : 1.4, 400 * p, 480 * p, 0.95);
    if (!short) gong(v, v.t + 1.75, 1.0, 400 * p, 480 * p, 0.85);
  },
});
def('era_kiosk', {
  gain: 0.5, max: 6, jitter: 0.03, reverb: 0.3,
  build(v, p) { gong(v, v.t, 1.2, 640 * p, 760 * p, 0.6, 24); },
});
def('era_strike', {
  gain: 0.55, max: 2, jitter: 0.01, reverb: 0.6,
  build(v, p) {
    bell(v, v.t, 220 * p, 1, { d: 2.6, ratio: 2.4, index: 2.2 });
    bell(v, v.t, 330 * p, 0.4, { d: 1.8, ratio: 3.1, index: 1.4 });
    v.nz({ ft: 'bandpass', f: 2400, q: 4, a: 0.001, d: 0.04, peak: 0.5 });
  },
});
def('era_pickup', {
  gain: 0.7, max: 1, jitter: 0, reverb: 0.25,
  build(v, p) {
    v.nz({ ft: 'bandpass', f: 3000 * p, q: 6, a: 0.001, d: 0.03, peak: 0.9 });                 // the click
    for (let i = 0; i < 5; i++) v.nz({ t: 0.06 + i * 0.035 + v.r(0, 0.01), ft: 'bandpass', f: v.r(1500, 2600), q: 5, a: 0.001, d: 0.025, peak: 0.35 });   // the rattle
    v.tone({ t: 0.22, f: 350 * p, a: 0.05, d: 0.7, peak: 0.18 }); v.tone({ t: 0.22, f: 440 * p, a: 0.05, d: 0.7, peak: 0.16 });   // the dial tone's breath
  },
});
def('era_swell', {
  gain: 0.8, max: 1, jitter: 0, reverb: 0.6,
  build(v, p) {
    const T = v.t;
    for (const [f, d] of [[262, 0], [330, 0.08], [392, 0.16], [523, 0.24], [659, 0.36]]) bell(v, T + d, f * p, 0.55, { d: 2.2, ratio: 3.0, index: 1.5 });
    v.tone({ f: 70 * p, f1: 36 * p, sw: 1.4, a: 0.02, d: 1.8, peak: 0.85 });                     // the boom
    const g = v.gain(0, v.out), bp = v.filter('bandpass', 400, 0.9, g);                         // the whoosh rising
    sweep(bp.frequency, T, 300, 2600, 1.6);
    pts(g.gain, T, [[0, 0], [0.9, 0.55], [2.0, 0]]);
    v.noise('pink', T, T + 2.05, bp);
  },
});
def('era_front', {
  gain: 0.5, max: 1, jitter: 0, reverb: 0.2, oneShot: 3,
  loop(v, p) {
    const T = v.t, amp = v.gain(0.7, v.out), bp = v.filter('bandpass', 900 * p, 0.8, amp);
    v.noise('pink', T, null, bp);
    v.lfo(0.7, 500, bp.frequency, T, null);
    // the escapement: a tick at 8 Hz (an LFO gating a bright band of noise)
    const tg = v.gain(0, v.out), hp = v.filter('highpass', 3200, 1.2, tg);
    v.noise('white', T, null, hp);
    v.lfo(8, 0.35, tg.gain, T, null, 'square');
  },
});
def('era_pop', {
  gain: 0.4, max: 6, jitter: 0.06, reverb: 0.35,
  build(v, p) { bell(v, v.t, 880 * p * v.r(0.94, 1.06), 0.5, { d: 0.45, ratio: 2.0, index: 0.8 }); v.nz({ ft: 'highpass', f: 4000, a: 0.001, d: 0.06, peak: 0.25 }); },
});
