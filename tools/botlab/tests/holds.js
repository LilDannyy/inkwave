// Two-handed holds (batch 5; the user: "make the player hold brush rollers blasters and brollys with both hands"):
//   MAP=testbox MODE=turf PAGE=tools/botlab/tests/holds.js tools/botlab/run.sh tools/botlab/page.cjs
// A real actor (its weapon runner, physics, the character's pose layers and arm IK, as in a match) is driven through each
// state by scripted intents; every sampled frame measures the LEFT (off) hand against the weapon:
//  - grip: the hand's grip hole (the axis its fingers wrap) to the weapon's off-hand handle (def.gripL ± HANDLE_HALF
//    along it; the blaster's rides its pump) — on the weapon: ≤ GRIP_TOL;
//  - the elbow: its inside angle (shoulder–elbow–wrist) in [ELB_MIN, ELB_MAX] and its bend pointing down / out / back, never
//    up into the body (kid space: the elbow's offset from the shoulder→wrist line);
//  - the wrist: the hand's bend off the forearm (swing) ≤ WR_SWING, its twist about the forearm ≤ WR_TWIST.
//  - the head: the weapon's long axis clear of the head (HEAD_CLR: the head's radius + the weapon's own).
//  - the deck: the weapon's lowest vertex over the ground ≥ -FLOOR_TOL (a resting drum sits a little in) in the poses that
//    hold still (FLOOR_STATES and the fidgets).
// The brush, the roller, the blaster and the brolly ('both'): on the weapon, natural elbow / wrist, in every state —
// stand (2 s idle), run, fire (blaster / brolly shots, brush swipes, roller flick), roll (fire held while moving: roller
// roll, brush dash, blaster strafing shots; the brolly's canopy held open), jump, run-jump, a fall onto the deck, the
// respawn drop, the Tidal Slam's tuck / hang / slam (its launch fling excepted), every idle fidget it can pick (and it
// never picks one that needs a free hand), and the menu / podium dances: the lobby / loadout pose, the two menu idles,
// each victory and defeat variant, the locker one-shots.
// Every other weapon ('others', run first): its hold is not a two-handed one, and its off hand does what it did — each
// state's IK weight on the foregrip (±0.02), mean wrist-to-authored-grip distance (±5 cm) and mean left-hand position
// in kid space (±8 cm) against tools/botlab/tests/holds-baseline.json, recorded on the code before this change (7ee5ad5,
// PAGE_ARGS='only=others record' prints it). The tolerances are the run-to-run spread of the same code (the sim is not
// bit-for-bit repeatable: up to 4.4 cm, 3 cm and 0 measured); a free hand put on a weapon moves 25–60 cm.
// Bots: a short all-bot fight on the deck with the four weapons — every kid-form frame of a bot holding one (no sub in the
// hand, no special; not the instant it pops in / out, shrunk to nothing) has its off hand on the weapon; and it is a real
// fight (they move, swim, fire, splat each other).
// PAGE_ARGS: 'only=both,others,bots' (parts) · 'w=brush,roller' (weapons) · 'record' (print the baseline JSON) · 'dump'.
(async () => {
  const g = window.__inkwave, m = g.match, dbg = g.debug, THREE = await import('three');
  const { WEAPON_ORDER } = await import('./src/config.js');
  const { GRIP_HOLE_L } = await import('./src/game/character-weapons.js');
  const G = window.__G;
  const ARGS = window.__pageArgs || '';
  const arg = (k) => { const r = new RegExp(`(?:^|\\s)${k}=([\\w,]+)`).exec(ARGS); return r ? r[1].split(',').filter(Boolean) : null; };
  const ONLY = arg('only'), RECORD = /(^|\s)record(\s|$)/.test(ARGS), DUMP = /(^|\s)dump(\s|$)/.test(ARGS);
  const part = (p) => !ONLY || ONLY.includes(p);
  // what-ifs: PAGE_ARGS '… tune:{"roller":{"carry":{"p":[…],"r":[…]}}}' replaces those fields of the weapon's hold
  const TUNE = (() => { const i = ARGS.indexOf('tune:'); return i >= 0 ? JSON.parse(ARGS.slice(i + 5)) : null; })();
  if (m.state !== 'playing') return [{ name: 'the match is playing', ok: false, info: m.state }];
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const BOTH = ['brush', 'roller', 'blaster', 'brolly'];
  const OTHERS = WEAPON_ORDER.filter((w) => !BOTH.includes(w));
  const W_ONLY = arg('w');
  const GRIP_TOL = 0.025, ELB_MIN = 28, ELB_MAX = 172, WR_SWING = 80, WR_TWIST = 100, BEND_MAX = 0.9;   // (measured: elbow 60–161°, swing ≤ 71°, twist ≤ 87°)
  // the deck: the weapon's lowest vertex over the ground, in the poses that hold still (standing, running, the slam's
  // landing, every menu / podium dance; a resting drum sits ~3 cm in). Not checked: the landings of a jump / fall / the
  // respawn drop and the roll's pressed drum, a few frames deep (7–50 cm) in the one-handed hold before this change too
  const FLOOR_TOL = 0.045, FLOOR_STATES = new Set(['stand', 'run', 'leap', 'lobby', 'idle', 'locker', 'lockershots', 'victory0', 'victory1', 'victory2', 'defeat0', 'defeat1', 'defeat2']);
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const DEG = 180 / Math.PI;
  dbg.freeze();
  // deterministic: a seeded Math.random for the run (FX, paint, bots), restored at the end
  const rnd0 = Math.random; let seed = 7;
  Math.random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const A = G.audio; const play0 = A?.play, loop0 = A?.loop; if (A) { A.play = () => null; A.loop = () => ({ set() {}, stop() {} }); }
  const DT = 1 / 60;
  // (the clock held well short of the end: the whole run is ~10 min of sim and an ended match stops its actors)
  const frame = () => { m.time = Math.max(m.time, 150); g._skipRender = true; try { g._frame(DT); } finally { g._skipRender = false; } };
  const me = m.local, others = m.actors.filter((a) => a !== me);
  const kid = others.find((a) => a.team === me.team) || others[0];
  const drive = { move: V(0, 0, 0), fire: false, jump: false };
  const zero = (a) => { const it = a.intent; it.move.set(0, 0, 0); it.fire = it.squid = it.jump = it.sub = it.special = false; };
  const brains = new Map(); for (const a of m.actors) if (a.bot) brains.set(a, a.bot.update);
  const updates = new Map(); for (const a of m.actors) updates.set(a, a.update);
  const scripted = () => {
    for (const a of m.actors) if (a.bot) a.bot.update = () => { zero(a); if (a === kid) { a.intent.move.copy(drive.move); a.intent.fire = drive.fire; a.intent.jump = drive.jump; a.aimYaw = a.yaw; a.aimPitch = 0; a.bot.aimYaw = a.yaw; a.bot.aimPitch = 0; } };
    m.actors.forEach((a, i) => { if (a === kid) return; a.pos.set(-24 + (i % 4) * 1.5, 0.02, 36 + Math.floor(i / 4) * 1.5); a.vel.set(0, 0, 0); a.update = () => {}; });
  };
  scripted();
  for (const a of m.actors) { if (!a.alive) a.respawn?.(); a.hp = 1e6; a.invuln = 0; }
  // the camera parked over the deck (the character's LOD and life level read it)
  const camHold = () => { const p = kid.pos; g.rig.cinematic(V(p.x + 2.5, p.y + 1.6, p.z + 3), V(p.x + 2.5, p.y + 1.6, p.z + 3), V(p.x, p.y + 0.8, p.z), V(p.x, p.y + 0.8, p.z), 99, () => {}); };
  const put = (p, yaw = 0) => { kid.pos.copy(p); kid.pos.y += 0.02; kid.vel.set(0, 0, 0); kid.yaw = kid.aimYaw = yaw; kid.aimPitch = 0; };
  const reset = () => { drive.move.set(0, 0, 0); drive.fire = false; drive.jump = false; kid.character.setDance(null); };

  // ---- measuring the off hand
  const ch0 = kid.character;
  const _t = V(0, 0, 0), _h = V(0, 0, 0), _s = V(0, 0, 0), _e = V(0, 0, 0), _u = V(0, 0, 0), _f = V(0, 0, 0), _ax = V(0, 0, 0);
  const _q = new THREE.Quaternion(), _qk = new THREE.Quaternion(), _qt = new THREE.Quaternion(), _m = new THREE.Matrix4();
  const restFA = ch0.bones.handL.position.clone().normalize();   // the forearm's axis in its own frame (the twist axis)
  // each weapon's off-hand handle: the segment of its axis the hand may hold (weapon space: the foregrip ± half), its
  // round shafts being longer (the hand may slide on the rubber), the pump riding with its stroke
  const HANDLE_HALF = { roller: 0.065, brush: 0.065, blaster: 0.02, brolly: 0.012 };
  // the head stays clear of the weapon: the head's centre (head bone + its centre offset) to the weapon's long axis
  // (from above the grip to the muzzle / drum / bristles), at least the head's radius (~0.12) + the weapon's own (the
  // shaft ~1.5 cm, the blaster's ink bulb ~6.6 cm, the furled canopy ~4 cm)
  const HEAD_C = V(0, 0.164, 0.014), HEAD_CLR = { roller: 0.135, brush: 0.135, blaster: 0.19, brolly: 0.16 };
  const _w0 = V(0, 0, 0), _w1 = V(0, 0, 0), _hc = V(0, 0, 0), _bb = new THREE.Box3();
  const _a0 = V(0, 0, 0), _a1 = V(0, 0, 0), _hz = V(0, 0, 0), _gy = V(0, 0, 0), _gz = V(0, 0, 0), _hp = V(0, 0, 0);
  const measure = (ch) => {
    ch.root.updateMatrixWorld(true);
    const w = ch.weapon, d = w.def, B = ch.bones;
    // legacy (the baseline's fingerprint): the wrist against where the weapon's authored grip puts it
    _t.copy(d.handL.pos); if (w.pump) _t.z -= 0.036 * w.pump;
    w.off.localToWorld(_t);
    B.handL.getWorldPosition(_h);
    const dw = _h.distanceTo(_t);
    // on the weapon: the hand's grip hole (the axis its fingers wrap) on the handle segment, the hand's own axis along it
    const gl = d.gripL || { pos: d.handL.pos, handZ: V(0, 0, 1), handY: V(0, 1, 0) };
    _gy.copy(gl.handY).normalize(); _gz.copy(gl.handZ).addScaledVector(_gy, -gl.handZ.dot(_gy)).normalize();
    const half = HANDLE_HALF[ch.weaponKind] ?? 0.01, pz = w.pump ? -0.036 * w.pump : 0;
    _a0.copy(gl.pos).addScaledVector(_gz, -half); _a1.copy(gl.pos).addScaledVector(_gz, half); _a0.z += pz; _a1.z += pz;
    w.off.localToWorld(_a0); w.off.localToWorld(_a1);
    _hp.copy(GRIP_HOLE_L); B.handL.localToWorld(_hp);
    const seg = new THREE.Line3(_a0, _a1), cl = seg.closestPointToPoint(_hp, true, V(0, 0, 0));
    const ks = ch.kid.getWorldScale(_u).y, dist = _hp.distanceTo(cl) / ks;
    B.handL.getWorldQuaternion(_q); _hz.set(0, 0, 1).applyQuaternion(_q);
    _ax.subVectors(_a1, _a0).normalize();
    const axErr = Math.acos(Math.min(1, Math.abs(_hz.dot(_ax)))) * DEG;
    B.uArmL.getWorldPosition(_s); B.fArmL.getWorldPosition(_e);
    _u.subVectors(_s, _e); _f.subVectors(_h, _e);
    const elbow = _u.angleTo(_f) * DEG;
    // the elbow's bend direction, kid space (+x the kid's left, +y up, +z ahead): its offset from the shoulder→wrist line
    _ax.subVectors(_h, _s).normalize();
    _u.subVectors(_e, _s); _u.addScaledVector(_ax, -_u.dot(_ax));
    ch.kid.getWorldQuaternion(_qk); _u.applyQuaternion(_qk.invert());
    const bl = _u.length(); if (bl > 1e-6) _u.multiplyScalar(1 / bl);
    const bendIn = bl > 0.01 ? -_u.x + _u.y : 0;   // inward (toward the body's right) and up: the broken way
    // the wrist: the hand's local rotation off the forearm, split into the twist about the forearm axis and the swing
    _q.copy(B.handL.quaternion);
    const p = _q.x * restFA.x + _q.y * restFA.y + _q.z * restFA.z;
    _qt.set(restFA.x * p, restFA.y * p, restFA.z * p, _q.w).normalize();
    const twist = 2 * Math.acos(Math.min(1, Math.abs(_qt.w))) * DEG;
    const swing = 2 * Math.acos(Math.min(1, Math.abs(_qt.clone().invert().premultiply(_q).w))) * DEG;
    // the left hand in kid space (the "unchanged" fingerprint)
    _m.copy(ch.kid.matrixWorld).invert(); const hk = _h.clone().applyMatrix4(_m);
    const reach = _s.distanceTo(cl) / ch.kid.getWorldScale(_u).y;
    // head clearance
    const mz = d.muzzle || V(0, 0, 0.3);
    _w0.set(0, mz.y, 0); _w1.copy(mz); w.off.localToWorld(_w0); w.off.localToWorld(_w1);
    _hc.copy(HEAD_C); B.head.localToWorld(_hc);
    const head = new THREE.Line3(_w0, _w1).closestPointToPoint(_hc, true, V(0, 0, 0)).distanceTo(_hc) / ch.kid.getWorldScale(_u).y;
    // the floor: the weapon's lowest point over the ground under the kid (m; below 0: through the deck)
    _bb.makeEmpty(); w.pivot.traverseVisible((o) => { if (o.isMesh) _bb.expandByObject(o, true); });   // (every vertex: a box would sink a tilted drum)
    const ap = ch.root.position, gy = G.level?.groundHeight?.(ap.x, ap.z, ap.y + 0.5);
    const floor = gy > -Infinity ? _bb.min.y - gy : 9;
    return { dist, dw, axErr, elbow, bend: bendIn, bl, twist, swing, hk, reach, head, floor, rootUp: gy > -Infinity ? ap.y - gy : 9, ks, wTwo: ch.wTwo || 0 };
  };
  // per state: worst values over the sampled frames + the mean hand position
  const stats = () => ({ flMin: 9, flAt: -1, hdMin: 9, hdAt: -1, axMax: 0, dwSum: 0, rMax: 0, n: 0, dMax: 0, dAt: -1, eMin: 999, eMax: 0, bendMax: -9, swMax: 0, twMax: 0, hx: 0, hy: 0, hz: 0, dSum: 0, two: 0 });
  const sample = (S, t) => {
    const r = measure(kid.character);
    S.rMax = Math.max(S.rMax, r.reach); S.axMax = Math.max(S.axMax, r.axErr); S.dwSum += r.dw;
    S.n++; if (r.dist > S.dMax) { S.dMax = r.dist; S.dAt = +t.toFixed(2); }
    S.eMin = Math.min(S.eMin, r.elbow); S.eMax = Math.max(S.eMax, r.elbow);
    if (r.bl > 0.01) S.bendMax = Math.max(S.bendMax, r.bend);
    S.swMax = Math.max(S.swMax, r.swing); S.twMax = Math.max(S.twMax, r.twist);
    S.hx += r.hk.x; S.hy += r.hk.y; S.hz += r.hk.z; S.dSum += r.dist; S.two += r.wTwo;
    if (r.head < S.hdMin) { S.hdMin = r.head; S.hdAt = +t.toFixed(2); }
    if (r.floor < S.flMin) { S.flMin = r.floor; S.flAt = +t.toFixed(2); S.flRoot = r.rootUp; }
  };
  const fin = (S) => ({ floor: +S.flMin.toFixed(3), floorAt: S.flAt, floorRoot: +(S.flRoot ?? 9).toFixed(3), head: +S.hdMin.toFixed(3), headAt: S.hdAt, reach: +S.rMax.toFixed(3), ax: +S.axMax.toFixed(1), n: S.n, dMax: +S.dMax.toFixed(4), dAt: S.dAt, elbow: [+S.eMin.toFixed(1), +S.eMax.toFixed(1)], bend: +S.bendMax.toFixed(2), swing: +S.swMax.toFixed(1), twist: +S.twMax.toFixed(1),
    hand: [+(S.hx / S.n).toFixed(3), +(S.hy / S.n).toFixed(3), +(S.hz / S.n).toFixed(3)], dMean: +(S.dSum / S.n).toFixed(4), dw: +(S.dwSum / S.n).toFixed(4), two: +(S.two / S.n).toFixed(3) });
  // run `s` seconds of sim; sample every `every` frames once `from` s have passed
  const run = (S, s, from = 0, every = 1, each) => { const n = Math.round(s * 60); for (let i = 0; i < n; i++) { kid.ink = 100; kid.hp = 1e6; if (each) each(i / 60); frame(); if (S && i / 60 >= from && i % every === 0) sample(S, i / 60); } };

  const START = V(0, 0, -6);
  const fireSeq = (w, S) => {
    if (w === 'roller' || w === 'bucket') { drive.fire = true; run(S, 0.05); drive.fire = false; run(S, 0.9); return; }   // a flick (heave): the whole swing
    if (w === 'brolly') { drive.fire = true; run(S, 0.06); drive.fire = false; run(S, 0.6); drive.fire = true; run(S, 0.06); drive.fire = false; run(S, 0.6); return; }   // two taps
    drive.fire = true; run(S, 1.7); drive.fire = false; run(S, 0.5);                                                        // held: swipes / shots / charge …
  };
  const STATES = {
    stand: (w, S) => { put(START, 0); kid.character.nextFidget = 99; run(null, 0.6); run(S, 2.0, 0, 2); },
    run: (w, S) => { put(V(0, 0, -26), 0); drive.move.set(0, 0, 1); run(null, 0.7); run(S, 1.1); },
    fire: (w, S) => { put(START, 0); kid.character.nextFidget = 99; run(null, 0.5); fireSeq(w, S); },
    roll: (w, S) => {
      put(V(0, 0, -26), 0);
      if (w === 'brolly') { kid.character.nextFidget = 99; run(null, 0.4); drive.fire = true; run(S, 1.3); drive.fire = false; run(S, 0.4); return; }   // the canopy: open, held, launched
      drive.move.set(0, 0, 1); run(null, 0.3); drive.fire = true; run(S, 1.6);
    },
    jump: (w, S) => { put(START, 0); run(null, 0.6); drive.jump = true; run(S, 0.05); drive.jump = false; run(S, 1.0); },
    runjump: (w, S) => { put(V(0, 0, -26), 0); drive.move.set(0, 0, 1); run(null, 0.8); drive.jump = true; run(S, 0.05); drive.jump = false; run(S, 1.0); },
    fall: (w, S) => { put(V(0, 3.2, -6), 0); kid.grounded = false; run(S, 1.6); },
    spawn: (w, S) => { kid.respawn(); kid.hp = 1e6; run(S, 1.6); },
    // the Tidal Slam, the real special (the actor leaps metres up, hangs, dives and lands in its crouch): the tuck, the
    // hang, the dive and the landing — not its launch (0.24 s: the free arm is flung up as the kid springs off, the one
    // moment the off hand lets go besides a sub throw)
    leap: (w, S) => { put(START, 0); run(null, 0.5); kid.specialId = 'slam'; kid._startSpecial(); run(null, 0.26); run(S, 2.4); },
  };
  const DANCES = { lobby: ['lobby_pose', 0, 7.1], idle: ['menu_idle', 0, 8.1], locker: ['locker_idle', 0, 9.1],
    victory0: ['victory', 0, 3.9], victory1: ['victory', 1, 4.7], victory2: ['victory', 2, 3.3],
    defeat0: ['defeat', 0, 6.1], defeat1: ['defeat', 1, 6.6], defeat2: ['defeat', 2, 5.3] };
  const dance = (st) => (w, S) => {
    const [name, v, len] = DANCES[st];
    put(START, 0); kid.character.nextFidget = 99; run(null, 0.5);
    kid.character.setDance(name); kid.character.danceVar = v;
    run(null, 0.8); run(S, len, 0, 3);
    kid.character.setDance(null); run(null, 0.6);
  };
  for (const k in DANCES) STATES[k] = dance(k);
  // the locker one-shots (admire / hair flip / wink) over the locker idle
  STATES.lockershots = (w, S) => {
    put(START, 0); kid.character.nextFidget = 99; run(null, 0.5);
    kid.character.setDance('locker_idle'); run(null, 0.8);
    for (const t of ['admire', 'hairflip', 'wink']) { kid.character.trigger(t); run(S, 1.7, 0, 2); }
    kid.character.setDance(null); run(null, 0.6);
  };
  const STATE_LIST = arg('s') || ['stand', 'run', 'fire', 'roll', 'jump', 'runjump', 'fall', 'spawn', ...Object.keys(DANCES), 'lockershots'];
  const BOTH_STATES = arg('s') || [...STATE_LIST, 'leap'];   // (the four only: the others' baseline predates it)

  const results = {};
  const measureWeapon = (w, LIST = STATE_LIST) => {
    reset(); kid.setWeapon(w); kid.character.setDance(null);
    if (TUNE && TUNE[w]) Object.assign(kid.character.hold, TUNE[w]);
    if (!kid.alive) kid.respawn();
    put(START, 0); run(null, 0.5);
    const res = {};
    for (const st of LIST) {
      reset(); camHold();
      const S = stats();
      try { STATES[st](w, S); } catch (e) { res[st] = { error: e.message }; continue; }
      reset();
      res[st] = fin(S);
    }
    return res;
  };

  // ---- every other weapon: the off hand as it was
  if (part('others')) {
    let base = null;
    try { base = await (await fetch('./tools/botlab/tests/holds-baseline.json', { cache: 'no-store' })).json(); } catch (e) { /* recording */ }
    const rec = {};
    for (const w of (W_ONLY || OTHERS).filter((x) => OTHERS.includes(x) || RECORD)) {
      const res = results[w] = measureWeapon(w);
      if (!RECORD) R(`${w}: not a two-handed hold`, !kid.character.hold.both, kid.character.weaponKind);
      rec[w] = {};
      for (const st of STATE_LIST) { const r = res[st]; if (r && !r.error) rec[w][st] = { hand: r.hand, d: r.dw, two: r.two }; }
      if (RECORD || !base) continue;
      const bad = []; let mh = 0, md = 0, mt = 0;
      for (const st of STATE_LIST) {
        const a = rec[w][st], b = base[w] && base[w][st]; if (!a || !b) { bad.push(st + ': missing'); continue; }
        const dh = Math.hypot(a.hand[0] - b.hand[0], a.hand[1] - b.hand[1], a.hand[2] - b.hand[2]);
        mh = Math.max(mh, dh); md = Math.max(md, Math.abs(a.d - b.d)); mt = Math.max(mt, Math.abs(a.two - b.two));
        if (dh > 0.08 || Math.abs(a.d - b.d) > 0.05 || Math.abs(a.two - b.two) > 0.02) bad.push(`${st}: Δhand ${(dh * 100).toFixed(1)} cm, grip ${b.d}→${a.d}, two ${b.two}→${a.two}`);
      }
      R(`${w}: the off hand unchanged in every state (vs the recorded baseline)`, !bad.length, bad.length ? bad : { states: STATE_LIST.length, maxHandCm: +(mh * 100).toFixed(1), maxGrip: +md.toFixed(3), maxTwo: +mt.toFixed(3) });
    }
    if (RECORD) R('baseline', true, rec);
    else if (!base) R('baseline file present', false, 'tools/botlab/tests/holds-baseline.json missing (PAGE_ARGS=record)');
  }

  // ---- the four two-handed weapons
  const both = (W_ONLY || BOTH).filter((w) => BOTH.includes(w));
  if (part('both')) for (const w of both) {
    const res = results[w] = measureWeapon(w, BOTH_STATES);
    for (const st of BOTH_STATES) {
      const r = res[st]; if (!r) continue;
      if (r.error) { R(`${w} ${st}: ran`, false, r.error); continue; }
      const grip = r.dMax <= GRIP_TOL, elb = r.elbow[0] >= ELB_MIN && r.elbow[1] <= ELB_MAX && r.bend <= BEND_MAX, wr = r.swing <= WR_SWING && r.twist <= WR_TWIST;
      R(`${w} ${st}: the off hand on the weapon (≤ ${GRIP_TOL * 100} cm) every frame`, grip, { dMax: r.dMax, at: r.dAt, n: r.n });
      R(`${w} ${st}: a natural elbow and wrist`, elb && wr, { elbow: r.elbow, bend: r.bend, swing: r.swing, twist: r.twist });
      R(`${w} ${st}: the weapon clear of the head (≥ ${HEAD_CLR[w]} m from its centre)`, r.head >= HEAD_CLR[w], { head: r.head, at: r.headAt });
      if (FLOOR_STATES.has(st)) R(`${w} ${st}: the weapon not through the deck (lowest point ≥ ${-FLOOR_TOL * 100} cm)`, r.floor >= -FLOOR_TOL, { floor: r.floor, at: r.floorAt, root: r.floorRoot });
    }
    // idle fidgets: none that needs the free hand is ever picked, and each one it can pick keeps the hand on
    {
      const ch = kid.character, picks = new Set();
      for (let i = 0; i < 200; i++) { ch._startFidget(); picks.add(ch.fidget); ch.fidget = -1; }
      const FID = ['goggles', 'twirl', 'look', 'stretch', 'tank', 'bounce', 'shake'];
      const names = [...picks].map((i) => FID[i]);
      R(`${w}: idle fidgets never need the off hand (picks)`, !names.some((n) => n === 'goggles' || n === 'tank' || n === 'stretch'), names);
      const S = stats();
      put(START, 0); run(null, 0.6);
      const fl = {};   // (each fidget's lowest weapon point)
      for (const id of picks) { const f0 = S.flMin; S.flMin = 9; ch.idleT = 0; ch.nextFidget = 99; ch.fidget = id; ch.fidgetT = 0; ch.lastFidget = id; run(S, 2.4, 0, 2); fl[FID[id]] = +S.flMin.toFixed(3); S.flMin = Math.min(f0, S.flMin); }
      const r = { ...fin(S), fl };
      R(`${w}: idle fidgets keep the off hand on (and the weapon off the head and the deck)`, r.dMax <= GRIP_TOL && r.elbow[0] >= ELB_MIN && r.swing <= WR_SWING && r.twist <= WR_TWIST && r.head >= HEAD_CLR[w] && r.floor >= -FLOOR_TOL, r);
      res.fidgets = r;
    }
  }

  // ---- bots: a short all-bot fight with the four weapons, every eligible frame on the weapon
  if (part('bots')) {
    for (const [a, f] of brains) if (a.bot) a.bot.update = f;
    for (const [a, f] of updates) a.update = f;
    m.actors.forEach((a, i) => { a.setWeapon(BOTH[i % 4]); a.hp = 100; if (!a.alive) a.respawn(); });
    g.rig.follow?.(me, true);
    // (that it is a real fight: the bots move, swim, shoot / swing and splat each other — counted alongside)
    const act = { moved: 0, swimS: 0, shots: 0, throws: 0, deaths: 0 }, last = new Map(), trig0 = new Map();
    for (const a of m.actors) {
      last.set(a, a.pos.clone()); const ch = a.character, t0 = ch.trigger; trig0.set(ch, t0);
      ch.trigger = function (name, arg) { if (name === 'shoot' || name === 'flick') act.shots++; else if (name === 'throw') act.throws++; else if (name === 'spawn') act.deaths++; return t0.call(this, name, arg); };
    }
    let n = 0, bad = 0, worst = 0, popping = 0; const per = {}, badAt = [];
    for (let i = 0; i < 60 * 30; i++) {
      frame();
      for (const a of m.actors) { const p = last.get(a); if (a.pos.distanceTo(p) < 2) act.moved += a.pos.distanceTo(p); p.copy(a.pos); if (a.form !== 'kid') act.swimS += DT; }
      if (i % 3) continue;
      for (const a of m.actors) {
        const ch = a.character;
        if (!a.alive || a.form !== 'kid' || ch.form !== 'kid' || a.specialActive || ch.bombHeld || ch.wSub > 0.05 || ch.tr[2] < 0.62 || ch.formT < 0.5 || ch.dance || !BOTH.includes(ch.weaponKind)) continue;
        const r = measure(ch);
        if (r.ks < 0.5) { popping++; continue; }   // (the kid popping in / out: shrunk to nothing, distances divided by ~0)
        n++;
        const k = ch.weaponKind; per[k] = per[k] || { n: 0, bad: 0, worst: 0 }; per[k].n++;
        if (r.dist > GRIP_TOL) { bad++; per[k].bad++; if (badAt.length < 4) badAt.push({ k, d: +r.dist.toFixed(3), ks: +r.ks.toFixed(2), form: ch.form, formT: +ch.formT.toFixed(2), spawn: +ch.tr[8].toFixed(2), land: +ch.tr[3].toFixed(2), jump: +ch.tr[4].toFixed(2), dance: ch.dance, hidden: ch.weaponHidden }); }
        worst = Math.max(worst, r.dist); per[k].worst = Math.max(per[k].worst, +r.dist.toFixed(3));
      }
    }
    for (const [ch, t0] of trig0) ch.trigger = t0;
    act.moved = Math.round(act.moved / m.actors.length); act.swimS = Math.round(act.swimS / m.actors.length);
    R('bots: a real fight (each bot moves > 40 m on average, swims, shoots / swings, splats happen)', act.moved > 40 && act.swimS > 1 && act.shots > 50 && act.deaths > 0, act);
    R('bots: the off hand on the weapon on every eligible frame (30 s fight)', n > 200 && bad === 0, { frames: n, off: bad, worst: +worst.toFixed(3), popping, per, badAt });
    scripted();
  }

  R('the match still playing at the end (every part measured live actors)', m.state === 'playing', m.state);
  Math.random = rnd0; if (A) { A.play = play0; A.loop = loop0; }
  if (DUMP) R('dump', true, results);
  return out;
})();
