// [karp-face] Bazookarp's sounds (SPEC §6.8), all synthesized, and the little director that plays them (KarpCues,
// owned by the HUD's KarpHud: it hears the engine's events and runs the carrier's loops). Positional unless marked.
//   karp_shell_hit   a soft wet tick per hit of this screen's own on the Roe Shell; its pitch rises with your team's side
//                    of the meter (params: the pitch)
//   karp_shell_warn  a crack and a whine when the meter passes 75 % (either way)
//   karp_burst       the shell bursting: a wet pop, a glassy shatter and a bass drop
//   karp_pickup      a rising gulp sting (2D for the one who grabbed it)
//   karp_drop        a thud and a fizz where it was dropped (the shell re-forming)
//   karp_charge      a loop while the carrier charges: a rising hum (params { k }), a ding at full (karp_full)
//   karp_full        the full-charge ding (2D, the carrier)
//   karp_fire        the Carp Shot leaving the mouth: a fat whomp with a gulp in it
//   karp_land        a shot landing: a plop, then the hiss of the swell
//   karp_blast       the shot's blast, sized by its charge (pitch / volume)
//   karp_fuse_tick   the carrier's last 10 s, every second (2D for the carrier; faster and higher under ×3)
//   karp_fuse_fast   a rattle loop while the fuse burns ×3 (the carrier only, 2D)
//   karp_hiss        the last 3 s of a carrier's fuse: a steaming hiss and sizzle on the carrier, rising (positional for
//                    everyone near — the teammates' warning to step away, SPEC §6.7; 2D for the carrier)
//   karp_explode     the Carp Blast: a huge boom with a sub drop and a long wash
//   karp_reset       a whoosh up as it leaves for the Pond, a splash where it lands (karp_splash)
//   karp_weir        a fanfare, then water draining (a weir lowered)
//   karp_gate        a gong and a rising rumble (a Dragon Gate rising)
//   karp_alarm       a two-note alarm when their carrier is 85 % of the way to your open Gate (count ≤ 15), ≤ 1 per 10 s
import { G, on } from '../core/ctx.js';
import { SFX } from './audio.js';
import { pts, sweep, kick, crash, bell, brass, mtof, pulseWave } from './music.js';

const def = (name, o) => { SFX[name] = o; };
const K = 0.05;

def('karp_shell_hit', {
  gain: 0.2, max: 4, jitter: 0.06, reverb: 0.05, minGap: 0.07,
  build(v, p) {
    v.tone({ f: 520 * p, f1: 300 * p, sw: 0.05, a: 0.001, d: 0.06, peak: 0.5 });
    v.nz({ ft: 'bandpass', f: 1800 * p, q: 3, a: 0.0006, d: 0.035, peak: 0.35 });
    v.tone({ t: 0.004, type: 'triangle', f: 1300 * p, f1: 900 * p, sw: 0.03, a: 0.001, d: 0.03, peak: 0.12 });
  },
});
def('karp_shell_warn', {
  gain: 0.34, max: 1, jitter: 0, reverb: 0.15, minGap: 0.8,
  build(v, p) {
    const T = v.t;
    for (let i = 0; i < 4; i++) v.nz({ t: i * 0.035 + v.r(0, 0.01), ft: 'bandpass', f: v.r(2600, 4200) * p, q: 6, a: 0.0004, d: 0.025, peak: 0.45 });   // the crack
    const g = v.gain(0, v.out), o = v.osc('sawtooth', 880 * p, T, T + 0.7, v.filter('bandpass', 1400 * p, 4, g));
    sweep(o.frequency, T, 880 * p, 1500 * p, 0.6);
    pts(g.gain, T, [[0, 0], [0.06, 0.32], [0.5, 0.22], [0.7, 0]]);
    v.lfo(18, 40 * p, o.frequency, T, T + 0.7);
  },
});
def('karp_burst', {
  gain: 0.62, max: 2, jitter: 0.03, reverb: 0.3,
  build(v, p) {
    const T = v.t;
    v.tone({ f: 260 * p, f1: 70 * p, sw: 0.09, a: 0.001, d: 0.18, peak: 0.9 });                               // the pop
    v.nz({ kind: 'pink', ft: 'lowpass', f: 3200, f1: 500, sw: 0.25, a: 0.001, d: 0.3, peak: 0.85 });            // wet splash
    for (let i = 0; i < 9; i++) v.tone({ t: 0.01 + i * 0.022 + v.r(0, 0.01), f: v.r(2400, 5200) * p, a: 0.0005, d: v.r(0.03, 0.08), peak: 0.16 });   // glassy shards
    kick(v, T + 0.02, 0.9, { f0: 95 * p, f1: 32, d: 0.55 });                                                    // the bass drop
    crash(v, T + 0.02, 0.25, { d: 0.9 });
  },
});
def('karp_pickup', {
  gain: 0.42, max: 2, jitter: 0, reverb: 0.15, minGap: 0.3,
  build(v, p) {
    const T = v.t;
    const g = v.gain(0, v.filter('lowpass', 2400, 1.2, v.out)), o = v.osc('sine', 180 * p, T, T + 0.4, g);   // the gulp
    pts(o.frequency, T, [[0, 180 * p], [0.12, 520 * p], [0.18, 260 * p], [0.32, 640 * p]]);
    pts(g.gain, T, [[0, 0], [0.02, 0.6], [0.3, 0.5], [0.4, 0]]);
    const lp = v.filter('lowpass', 5200, 0.8, v.out), pw = pulseWave(v.ctx, 0.3);
    [67, 71, 74, 79].forEach((m, i) => v.tone({ t: 0.16 + i * 0.06, type: pw, f: mtof(m) * p, a: 0.003, h: 0.05, d: 0.12, peak: 0.2, to: lp }));
    bell(v, T + 0.38, mtof(91) * p, 0.16, { d: 0.6 });
  },
});
def('karp_drop', {
  gain: 0.42, max: 2, jitter: 0.04, reverb: 0.12,
  build(v, p) {
    v.tone({ f: 120 * p, f1: 45 * p, sw: 0.12, a: 0.001, d: 0.22, peak: 0.9 });
    v.nz({ kind: 'brown', ft: 'lowpass', f: 900, a: 0.002, d: 0.12, peak: 0.5 });
    v.nz({ t: 0.06, ft: 'highpass', f: 3000, f1: 6000, sw: 0.4, a: 0.02, d: 0.45, peak: 0.22 });           // the fizz of the re-forming shell
  },
});
def('karp_charge', {
  gain: 0.2, max: 2, jitter: 0, reverb: 0.06, oneShot: 2,
  loop(v, p, o) {
    const T = v.t, st = { k: 0, q: p, ...(o?.params || {}) };
    const g = v.gain(0.0, v.filter('lowpass', 2600, 1.4, v.out));
    const a = v.osc('sawtooth', 110 * p, T, null, g), b = v.osc('square', 165 * p, T, null, v.gain(0.35, g));
    v.lfo(9, 0.12, g.gain, T, null);
    const apply = (now) => { const f = (110 + 330 * st.k) * st.q; a.frequency.setTargetAtTime(f, now, K); b.frequency.setTargetAtTime(f * 1.5, now, K); g.gain.setTargetAtTime(0.35 + 0.35 * st.k, now, 0.06); };
    apply(T);
    return { pitch(q, now) { st.q = q; apply(now); }, params(o2, now) { Object.assign(st, o2); apply(now); } };
  },
});
def('karp_full', {
  gain: 0.34, max: 1, jitter: 0, reverb: 0.12, minGap: 0.2,
  build(v, p) { bell(v, v.t, mtof(88) * p, 0.3, { d: 0.5 }); v.tone({ f: 2640 * p, a: 0.001, d: 0.18, peak: 0.25 }); },
});
def('karp_fire', {
  gain: 0.56, max: 3, jitter: 0.04, reverb: 0.15,
  build(v, p) {
    v.tone({ f: 150 * p, f1: 46 * p, sw: 0.16, a: 0.002, d: 0.26, peak: 1 });                               // the whomp
    v.nz({ kind: 'pink', ft: 'lowpass', f: 1500, f1: 240, sw: 0.14, q: 1.3, a: 0.002, d: 0.15, peak: 0.85 });
    const T = v.t, g = v.gain(0, v.out), o = v.osc('sine', 300 * p, T, T + 0.25, v.filter('lowpass', 1800, 1, g));   // the gulp out
    pts(o.frequency, T, [[0, 300 * p], [0.08, 160 * p], [0.2, 90 * p]]);
    pts(g.gain, T, [[0, 0], [0.01, 0.45], [0.22, 0]]);
  },
});
def('karp_land', {
  gain: 0.4, max: 4, jitter: 0.05, reverb: 0.1,
  build(v, p) {
    v.tone({ f: 420 * p, f1: 160 * p, sw: 0.05, a: 0.001, d: 0.08, peak: 0.7 });                             // the plop
    v.nz({ ft: 'bandpass', f: 900 * p, q: 2, a: 0.001, d: 0.08, peak: 0.4 });
    v.nz({ t: 0.04, ft: 'highpass', f: 2600, f1: 4800, sw: 0.4, a: 0.05, d: 0.36, peak: 0.32 });            // the swell's hiss (0.45 s)
  },
});
def('karp_blast', {
  gain: 0.6, max: 4, jitter: 0.04, reverb: 0.25,
  build(v, p) {
    const T = v.t;
    kick(v, T, 0.9, { f0: 120 * p, f1: 38, d: 0.35 });
    v.nz({ kind: 'pink', ft: 'lowpass', f: 2400 * p, f1: 300, sw: 0.3, a: 0.001, d: 0.35, peak: 0.9 });
    v.nz({ ft: 'highpass', f: 1800, a: 0.0006, d: 0.05, peak: 0.45 });
  },
});
def('karp_fuse_tick', {
  gain: 0.32, max: 1, jitter: 0, reverb: 0.04, minGap: 0.15,
  build(v, p) {
    const lp = v.filter('lowpass', 4800, 0.8, v.out);
    v.tone({ type: 'square', f: 1240 * p, a: 0.001, h: 0.03, d: 0.04, peak: 0.28, to: lp });
    v.tone({ t: 0.004, f: 620 * p, a: 0.001, d: 0.05, peak: 0.2 });
  },
});
def('karp_fuse_fast', {
  gain: 0.16, max: 1, jitter: 0, reverb: 0.02, oneShot: 2,
  loop(v, p) {
    const T = v.t, g = v.gain(0, v.out);
    v.noise('white', T, null, v.filter('bandpass', 3400 * p, 5, g));
    v.lfo(24, 0.5, g.gain, T, null);                                                                          // the rattle
    const h = v.osc('square', 880 * p, T, null, v.gain(0.06, v.filter('lowpass', 2000, 1, v.out)));
    v.lfo(12, 60 * p, h.frequency, T, null);
    g.gain.setValueAtTime(0.5, T);
    return { pitch() {}, params() {} };
  },
});
def('karp_hiss', {
  gain: 0.3, max: 1, jitter: 0, reverb: 0.06, oneShot: 2,
  loop(v, p, o) {
    const T = v.t, st = { k: (o && o.params && o.params.k) || 0 };
    const g = v.gain(0, v.out), bp = v.filter('bandpass', 5200 * p, 1.6, g);
    v.noise('white', T, null, bp);                                                                            // the steam
    const sz = v.gain(0, v.filter('highpass', 2400, 0.8, v.out));
    v.noise('white', T, null, sz); v.lfo(31, 0.5, sz.gain, T, null);                                          // the sizzle
    const apply = (now) => { g.gain.setTargetAtTime(0.32 + 0.5 * st.k, now, 0.08); sz.gain.setTargetAtTime(0.1 + 0.25 * st.k, now, 0.08); bp.frequency.setTargetAtTime((4200 + 2600 * st.k) * p, now, 0.1); };
    apply(T);
    return { pitch() {}, params(o2, now) { Object.assign(st, o2); apply(now); } };
  },
});
def('karp_explode', {
  gain: 0.75, max: 1, jitter: 0, reverb: 0.4,
  build(v, p) {
    const T = v.t;
    kick(v, T, 1, { f0: 90 * p, f1: 24, d: 0.9 });
    kick(v, T + 0.05, 0.7, { f0: 60 * p, f1: 20, d: 1.1 });
    v.nz({ kind: 'pink', ft: 'lowpass', f: 4200, f1: 180, sw: 1.0, a: 0.001, d: 1.2, peak: 1 });
    v.nz({ kind: 'brown', ft: 'lowpass', f: 700, a: 0.01, d: 1.6, peak: 0.7 });
    crash(v, T + 0.01, 0.5, { d: 1.6 });
  },
});
def('karp_reset', {
  gain: 0.36, max: 1, jitter: 0, reverb: 0.25, minGap: 0.5,
  build(v, p) {
    const T = v.t, g = v.gain(0, v.out), bp = v.filter('bandpass', 400 * p, 2.5, g);
    v.noise('pink', T, T + 1.0, bp);
    sweep(bp.frequency, T, 400 * p, 3200 * p, 0.7);
    pts(g.gain, T, [[0, 0], [0.15, 0.8], [0.7, 0.5], [1.0, 0]]);
    bell(v, T + 0.1, mtof(84) * p, 0.12, { d: 0.6 });
  },
});
def('karp_splash', {
  gain: 0.5, max: 2, jitter: 0.04, reverb: 0.2,
  build(v, p) {
    v.tone({ f: 200 * p, f1: 60 * p, sw: 0.1, a: 0.001, d: 0.2, peak: 0.8 });
    v.nz({ kind: 'pink', ft: 'lowpass', f: 5200, f1: 700, sw: 0.4, a: 0.001, d: 0.5, peak: 0.85 });
  },
});
def('karp_weir', {
  gain: 0.34, max: 1, jitter: 0, reverb: 0.25, minGap: 0.6,
  build(v, p) {
    const T = v.t, lp = v.filter('lowpass', 5200, 0.8, v.out), pw = pulseWave(v.ctx, 0.25);
    [60, 64, 67, 72].forEach((m, i) => v.tone({ t: i * 0.07, type: pw, f: mtof(m) * p, a: 0.002, h: 0.05, d: 0.12, peak: 0.22, to: lp }));
    for (const [m, pan] of [[67, -0.3], [72, 0.3], [76, 0]]) brass(v, T + 0.3, mtof(m) * p, 0.42, 0.3, { to: v.pan(pan, v.out), bright: 5200, a: 0.01, r: 0.3 });
    kick(v, T + 0.3, 0.6);
    // the curtain draining: a falling gurgle
    const g = v.gain(0, v.out), bp = v.filter('bandpass', 1400 * p, 3, g);
    v.noise('pink', T + 0.5, T + 1.6, bp);
    sweep(bp.frequency, T + 0.5, 1400 * p, 300 * p, 1.0);
    pts(g.gain, T + 0.5, [[0, 0], [0.1, 0.5], [0.9, 0.2], [1.1, 0]]);
    v.lfo(11, 0.25, g.gain, T + 0.5, T + 1.6);
  },
});
def('karp_gate', {
  gain: 0.4, max: 1, jitter: 0, reverb: 0.45, minGap: 0.8,
  build(v, p) {
    const T = v.t;
    for (const [f, d, pk] of [[98, 2.2, 0.6], [147.2, 1.8, 0.35], [196.5, 1.4, 0.25], [263, 1.0, 0.18], [349, 0.7, 0.1]]) v.tone({ f: f * p, a: 0.004, d, peak: pk });   // the gong
    const g = v.gain(0, v.out), o = v.osc('sawtooth', 40 * p, T + 0.1, T + 1.8, v.filter('lowpass', 300, 1.2, g));   // the rising rumble
    sweep(o.frequency, T + 0.1, 40 * p, 90 * p, 1.4);
    pts(g.gain, T + 0.1, [[0, 0], [0.4, 0.4], [1.3, 0.5], [1.7, 0]]);
    crash(v, T + 1.3, 0.25, { d: 1.2 });
  },
});
def('karp_alarm', {
  gain: 0.36, max: 1, jitter: 0, reverb: 0.08, minGap: 2,
  build(v, p) {
    const lp = v.filter('lowpass', 4200, 0.9, v.out);
    for (let i = 0; i < 2; i++) {
      v.tone({ t: i * 0.42, type: 'square', f: 988 * p, a: 0.004, h: 0.16, d: 0.03, peak: 0.26, to: lp });
      v.tone({ t: i * 0.42 + 0.2, type: 'square', f: 740 * p, a: 0.004, h: 0.16, d: 0.03, peak: 0.26, to: lp });
    }
  },
});
export const KARP_SOUNDS = ['karp_shell_hit', 'karp_shell_warn', 'karp_burst', 'karp_pickup', 'karp_drop', 'karp_charge', 'karp_full', 'karp_fire', 'karp_land', 'karp_blast',
  'karp_fuse_tick', 'karp_fuse_fast', 'karp_hiss', 'karp_explode', 'karp_reset', 'karp_splash', 'karp_weir', 'karp_gate', 'karp_alarm'];

// ---- the director: the events → the cues; the carrier's loops (charge hum, ×3 rattle) and its fuse ticks
export class KarpCues {
  constructor() {
    const A = () => G.audio, me = () => G.match?.local;
    const mine = (a) => !!a && a === me();
    this.loops = { charge: null, fast: null, hiss: null };
    this.played = [];   // (tests: the last cues, newest last)
    const play = (name, o = {}) => { this.played.push(name); if (this.played.length > 40) this.played.shift(); return A()?.play?.(name, o); };
    this.play = play;
    this._warnSide = 0; this._alarmT = -1e9; this._fuseN = null;
    this.unsubs = [
      on('karp:hit', ({ team, meter }) => { const m = G.match?.karp; const hp = m?.shell?.hp || 1000, k = (team === 0 ? 1 : -1) * (meter || 0) / hp; play('karp_shell_hit', { pos: m?.shell?.center?.(), pitch: 0.85 + 0.5 * Math.max(0, k) }); }),
      on('karp:burst', ({ pos }) => play('karp_burst', { pos })),
      on('karp:pickup', ({ actor }) => play('karp_pickup', mine(actor) ? { volume: 1 } : { pos: actor?.pos, volume: 0.8 })),
      on('karp:drop', ({ pos, how }) => { if (how !== 'moved' || pos) play('karp_drop', { pos, volume: how === 'moved' ? 0.5 : 1 }); }),
      on('karp:full', ({ actor }) => { if (mine(actor)) play('karp_full'); }),
      on('karp:shot', ({ actor, from }) => play('karp_fire', mine(actor) ? { volume: 0.9 } : { pos: from, volume: 0.9 })),
      on('karp:land', ({ pos }) => play('karp_land', { pos })),
      on('karp:blast', ({ pos, charge }) => play('karp_blast', { pos, volume: 0.6 + 0.4 * (charge || 0), pitch: 1.15 - 0.35 * (charge || 0) })),
      on('karp:explode', ({ pos }) => play('karp_explode', { pos })),
      on('karp:reset', ({ from }) => play('karp_reset', { pos: from })),
      on('karp:phase', ({ phase, prev }) => { if (prev === 'resetting' && phase === 'reforming') play('karp_splash', { pos: G.match?.karp?.R?.pond }); }),
      on('karp:plant', ({ team }) => play('karp_weir', { volume: team === me()?.team ? 1 : 0.7 })),
      on('karp:gate', ({ team }) => { const g = G.match?.karp?.gates?.[team]; play('karp_gate', { pos: g?.pos, ref: 30 }); }),
    ];
  }
  // every frame (KarpHud.update): the carrier's loops and ticks, the shell's warning, the alarm
  update(dt, f) {
    const Kp = G.match?.karp, me = G.match?.local, A = G.audio;
    const stop = (k) => { const h = this.loops[k]; if (h) { h.stop?.(0.08); this.loops[k] = null; } };
    if (!Kp || !f || !me) { stop('charge'); stop('fast'); stop('hiss'); return; }
    // the charge hum (the local carrier)
    const g = me.carry?.gun, charging = !!(f.carrying && g && g.charging && me.form !== 'squid');
    if (charging && !this.loops.charge) this.loops.charge = A?.loop?.('karp_charge', { volume: 0.9, params: { k: 0 } }) || null;
    if (!charging) stop('charge');
    else this.loops.charge?.set?.({ params: { k: g.c } });
    // the ×3 rattle and the last 10 s (the carrier only)
    const fast = !!(f.carrying && f.rate > 1);
    if (fast && !this.loops.fast) this.loops.fast = A?.loop?.('karp_fuse_fast', { volume: 0.8 }) || null;
    if (!fast) stop('fast');
    const n = f.carrying ? Math.ceil(f.fuseShown) : null;
    if (n !== this._fuseN) { if (n != null && n <= 10 && n >= 1 && this._fuseN != null) this.play('karp_fuse_tick', { pitch: n <= 3 ? 1.25 : fast ? 1.12 : 1 }); this._fuseN = n; }
    // the hiss: any carrier's last 3 s, on the carrier (its teammates' warning to step away; the carrier hears it 2D)
    const H = Kp.holder, left = H ? (f.carrying ? f.fuseShown : f.fuse) : 99;
    if (H && H.alive && left <= 3 && left > 0) {
      const k = Math.min(1, Math.max(0, 1 - left / 3));
      if (!this.loops.hiss) this.loops.hiss = A?.loop?.('karp_hiss', f.carrying ? { volume: 0.8, params: { k } } : { pos: H.pos, volume: 1, params: { k } }) || null;
      this.loops.hiss?.set?.(f.carrying ? { params: { k } } : { pos: H.pos, params: { k } });
    } else stop('hiss');
    // the shell's warning at 75 % (once each time the meter climbs past it, either way)
    const k = f.shell === 'intact' && f.hp > 0 ? f.meter / f.hp : 0, side = k >= 0.75 ? 1 : k <= -0.75 ? -1 : 0;
    if (side && side !== this._warnSide) this.play('karp_shell_warn', { pos: Kp.shell.center() });
    this._warnSide = side;
    // the alarm: their carrier ≤ 15 from our open Gate
    const them = 1 - (f.viewer ?? me.team);
    if (f.holder && f.holderTeam === them && f.gates?.[them]?.up && f.count[them] <= 15) {
      const now = performance.now();
      if (now - this._alarmT > 10000) { this._alarmT = now; this.play('karp_alarm'); }
    }
    void dt;
  }
  dispose() { this.unsubs.forEach((u) => u()); for (const k in this.loops) { this.loops[k]?.stop?.(0.05); this.loops[k] = null; } }
}
