// [b5-subs] Chain Bobber (kit sub 'bobber'): tools/botlab/jobs/batch5/subs/SPEC.md §C (C10), §0, DECISIONS.md #20.
// The user: "A floating bomb that explodes after being attacked by a weapon. The more you link together, the bigger the
// explosion. They can be connected by a tether if nearby, but enemies can disarm them by shooting them. This uses 40%
// in, and you can throw out as many as you like, but they disappear after a fair bit of time."
//   MAP=testbox MODE=turf PAGE=tools/botlab/tests/sub-bobber.js tools/botlab/run.sh tools/botlab/page.cjs
//   PAGE_ARGS='only=deploy,tether,trigger,damage,disarm,life,movers,interact,net,cue,bots,draw' (MODE=turf)
//   MAP=testbox MODE=tower  … PAGE_ARGS='only=tower'      (the real tower: crushed in its way, riding its deck; bots
//                                                          never settle one within 3.25 m of the track)
//   MAP=podbox MODE=turf    … PAGE_ARGS='only=pod'        (a Treehills pod: rides its plant, lifted by a growing hedge)
//   MAP=halyard MODE=zones  … PAGE_ARGS='only=zone'       (a guard bot sets up a 3–4 chain at its zone)
//   MAP=<a boss stage> MODE=boss … PAGE_ARGS='only=boss'  (HULLBREAKER: one body blast a chain, crablets every blast)
// Staged on testbox (a flat deck, top y 0; a 4 m wall x 14…15, z ±8, and its mirror at x −15…−14); everyone parked far
// off with their brains stubbed unless a scene wakes one; damage to players is real but nobody's hp runs out (set high).
// Checks (C10, numbered as there):
//  1 deploy  — floor +1.0; wall 0.45 m out, clamped 0.6 … 2.2; ceiling → floor +1.0; over the sea +1.0; off a stand-in
//              Bazookarp shell 0.45 m from its surface; over stand-in lava rising −1.6 → 0.5 it rides up to 1.5 and back
//              down, the lava's under(pos, −0.05) never matching it; refused within 6.2 m of the enemy pad ([2, gid, 3]);
//              on a mover over the sea that parks: re-floats at −0.6 keeping its chain, a new [3]; the spot is rounded
//  2 tether  — 4.9 m links, 5.1 m doesn't; a wall blocks, a grate doesn't; ≤ 3 each, nearest first, equal distances: the
//              lower gid pair; N on the lamps; a [5] on every change, a ghost fed the records draws exactly that list
//  3 trigger — the owner's shot on bobber 1 of a 4-chain blows all 4 breadth-first at 0.07 s steps (± 1 frame), R 3.0,
//              180 / 35; a teammate's shot the same; an own Splat Bomb, a Glide / Dash Pellet-sized blast (the generic
//              damageArea path those subs use), a roller's drum, the Ink Tempest's rain each set it off; an own chain's blast
//              sets off a second chain 2 m away (its own N)
//  4 damage  — N = 1 … 8: 60 / 95 / 140 / 180 (held) at the centre, 25 / 30 / 35 / 35 at R, R 1.8 / 2.2 / 2.6 / 3.0 / 3.2 /
//              3.4 / 3.6 / 3.8 (DECISIONS #20); a victim between two bobbers of one chain takes the larger, never the sum
//  5 disarm  — an enemy Spritzer (36), Squall Spinner (26), Twinfire (30) shot each disarm one (no blast, no damage, the
//              chain splits and re-links); an enemy Pop Pellet, a Dash Pellet-sized blast and a lone enemy bobber disarm
//              those in their radius; an enemy Splat Bomb all within 3.3 m, none at 3.4; enemies walking through: nothing;
//              a ghost's shot (netMuted) on a real bobber: nothing; a charger beam stops on one
//  6 life    — expires at 30 s, no blast; the 25th retires the oldest; the owner splatted, they stay (and still go off)
//  7 movers  — a block driven through its float height crushes it within 0.1 s; crushIn's blocks / sphere / where shapes
//              and lavaSweep end it with their how; an era:flip with a block in `on` round it ends it, its floor in `off`
//              re-floats it; it rides a moving block; a block rising under its foot lifts it; one sliding into it shoves
//              it; nowhere to go crushes it; every ending one 'device:down', expiry none; stand-in boss / shell: one blast a
//              chain from the bobber nearest
//  8 bots    — a teammate bot with sight of a chain shoots it when a foe enters R(N) − 0.3 (within reaction + 0.6 s); an
//              enemy bot shoots bobbers near its route (DEV_BOT.bobber); prefer() 0.7 / 1.0 per bot; armed chains as
//              danger discs (≤ 48), none for an unarmed one
//  9 net     — the records ([0] [3] [5] [1] [2] [4]); a ghost's hit goes to its owner ('bobber' / 'bobberPop', with the
//              shooter); a player who leaves takes theirs (dropOwner); the two-client half: net-sub-bobber.cjs
// 10 cue     — a foe in the open in a team chain's reach: the glow and the hint; the foe behind a wall: neither
// plus: Drainbow halves a blast from / across it (from = the bobber), Bubble Guard takes 0, the Mega Stamp's smash
// disarms, a blast reaches specials' world objects (Bubble Blower bubbles), the aim guide, the HUD count and callout,
// the sounds are built.
(async () => {
  const g = window.__inkwave, m = g.match, dbg = g.debug, THREE = await import('three');
  const { SUBS, PLAYER, WEAPONS, SPECIALS } = await import('./src/config.js');
  const { SUB_KITS, KIT_GHOSTS } = await import('./src/game/kits/registry.js');
  const { DEPLOY_STATS, resetDeployStats } = await import('./src/game/deployables.js');
  const { DEV_BOT } = await import('./src/game/deployables-bots.js');
  const { THREAT_STATS } = await import('./src/game/bots.js');
  const { specialDangers } = await import('./src/game/botSpecials.js');
  const { BOBBER_HUD } = await import('./src/game/kits/bobber-hud.js');
  const { BOBBER_BOT } = await import('./src/game/kits/bobber-bots.js');
  const { BOBBER_SOUNDS } = await import('./src/audio/sfx-bobber.js');
  const { SFX } = await import('./src/audio/audio.js');
  const { on } = await import('./src/core/ctx.js');
  const G = window.__G, P = G.projectiles, S = G.subs, K = SUB_KITS.bobber, B = SUBS.bobber;
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const ONLY = (/only=([\w,]+)/.exec(window.__pageArgs || '') || [])[1];
  const want = (k) => (ONLY ? ONLY.split(',').includes(k) : !['tower', 'pod', 'zone', 'boss'].includes(k));
  dbg.freeze();
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const r2 = (x) => Math.round(x * 100) / 100, r3 = (x) => Math.round(x * 1000) / 1000, v3 = (p) => [r2(p.x), r2(p.y), r2(p.z)];
  const DT = 1 / 60;
  let hook = null;
  const frame = () => { if (hook) hook(); g._skipRender = true; g._frame(DT); g._skipRender = false; };
  const step = (s, fn) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) { frame(); if (fn && fn(i) === false) return i; } return n; };
  const me = m.local, others = m.actors.filter((a) => a !== me);
  const foes = others.filter((a) => a.team !== me.team), mates = others.filter((a) => a.team === me.team);
  const foe = foes[0], foe2 = foes[1], mate = mates[0];
  const zero = (a) => { const it = a.intent; it.move.set(0, 0, 0); it.fire = it.squid = it.jump = it.sub = it.special = false; };
  const brain0 = new Map(); for (const a of m.actors) if (a.bot) brain0.set(a, a.bot.update);
  const stub = (a) => { if (a.bot) a.bot.update = () => zero(a); };
  const wake = (a) => { if (a.bot && brain0.has(a)) a.bot.update = brain0.get(a); };
  for (const a of m.actors) stub(a);
  const put = (a, p, yaw = 0) => { a.pos.copy(p); a.pos.y += 0.02; a.vel.set(0, 0, 0); a.yaw = a.aimYaw = yaw; if (a.bot) { a.bot.aimYaw = yaw; a.bot.aimPitch = 0; } };
  const HOME = V(20, 0, -32);
  const parkAll = () => others.forEach((a, i) => put(a, V(-24 + (i % 4) * 2, 0, 32 + Math.floor(i / 4) * 2)));
  const evs = [];
  const offs = ['bomb:explode', 'device:down', 'device:hit', 'bobber:trigger', 'hit', 'sub:end', 'bobber:link', 'bobber:disarm'].map((n) => on(n, (e) => {
    if (n === 'hit' && e.weaponId !== 'bobber') return;
    if ((n === 'bomb:explode' || n === 'sub:end') && e.kind !== 'bobber') return;
    if ((n === 'device:down' || n === 'device:hit') && e.kind !== 'bobber') return;
    evs.push({ t: G.time, n, e });
  }));
  const ev = (n) => evs.filter((x) => x.n === n);
  // what a victim took from chains (their 'hit' events: standing in the ink the blasts paint costs hp too)
  const took = (v) => r2(ev('hit').filter((x) => x.e.victim === v).reduce((a, x) => a + x.e.damage, 0));
  const HP = 1e6;
  const reset = () => {
    hook = null; S.viewer = null;
    if (m.time < 120) m.time = 170;   // (the whole file runs past a 3:00 match: the clock is kept from running out)
    S.clear(); P.clear(); G.paint.clear?.();
    for (const a of m.actors) { if (!a.alive) a.respawn(); a.hp = HP; a.invuln = 0; a.status.shield = 0; zero(a); a.form = 'kid'; a.superJumpState = null; stub(a); a.ink = PLAYER.inkMax; }
    parkAll(); put(me, HOME, Math.PI); me.setSub('bobber');
    step(0.1);
    for (const a of m.actors) { a.hp = HP; a.invuln = 0; }
    K.resetBobberStats(); resetDeployStats();
    evs.length = 0; sent.length = 0;
  };
  const live = () => K.items.filter((it) => it.state === 'live');
  // a bobber dropped from just over (x, y0, z) (or thrown: vel) — settled after ~0.5 s
  const drop = (owner, x, z, y0 = 0.6, vel = V(0, -3, 0)) => K.throwFrom(owner, V(x, y0, z), vel);
  const settle = (s = 0.5) => step(s);
  const pairs = () => { const o = []; for (const it of K.items) for (const t of it.ten) if (it.gid < t.gid) o.push([it.gid, t.gid]); return o.sort((a, b) => a[0] - b[0] || a[1] - b[1]); };
  // the online session stub (records what the owner sends, nothing leaves the page)
  const sent = [];
  const netOn = () => { m.actors.forEach((a, i) => { if (a.nid === undefined) { a.nid = i; a._tnid = true; } }); G.netm = { mute: 0, applying: false, isHost: true, byNid: new Map(m.actors.map((a) => [a.nid, a])), recSplat() {}, recProj() {}, recBomb() {}, recZone() {}, recTower() {}, recPods() {}, recBoss() {},
    recKit: (a, kind, data) => { if (kind === 'bobber') sent.push({ a, data: JSON.parse(JSON.stringify(data)) }); }, sendDevHit: (o, kind, id, d, by) => sent.push({ dev: kind, id, d, by: by?.nid ?? null, to: o?.nid }),
    shouldApplyHit: () => 'local', sendHit: () => false, applyRemote() {}, sendResult() {}, sendEnd() {} }; sent.length = 0; };
  const netOff = () => { G.netm = null; for (const a of m.actors) if (a._tnid) { delete a.nid; delete a._tnid; } };
  const recs = (op) => sent.filter((x) => x.data && x.data[0] === op).map((x) => x.data);
  // a ghost copy of the owner's records under another actor (gids moved by +off, so both live in this page)
  const feed = (ghostOwner, off, from = 0) => {
    for (const s of sent.slice(from)) {
      if (!s.data) continue;
      const d = s.data.slice(), op = d[0];
      if (op === 5) { for (let i = 1; i < d.length; i++) d[i] += off; }
      else if (op === 1) { d[1] += off; for (let i = 4; i < d.length; i += 2) d[i] += off; }
      else if (op === 6) continue;
      else d[1] += off;
      K.ghost(ghostOwner, d);
    }
    return sent.length;
  };

  try {
    // ============================================================================================ 1. deploy
    if (want('deploy')) {
      reset(); netOn();
      try {
        const a = drop(me, 0, 0); settle();
        R('deploy: on a floor it floats 1.0 m over it (±0.03), its spot rounded to 0.01 m, live once open (0.35 s)', a.state === 'live' && Math.abs(a.spot.y - 1.0) <= 0.03 && [a.spot.x, a.spot.y, a.spot.z].every((x) => Math.abs(x * 100 - Math.round(x * 100)) < 1e-6), { spot: v3(a.spot), hover: a.hover });
        const r3s = recs(3).find((d) => d[1] === a.gid);
        R('…and the owner records its spot [3, gid, x, y, z, hover]: exactly the rounded spot', r3s && r3s[2] === a.spot.x && r3s[3] === a.spot.y && r3s[4] === a.spot.z, r3s);
        // walls (the 4 m wall at x 14…15): thrown flat into it at three heights
        const wall = (y) => { const it = K.throwFrom(me, V(13.5, y, 3), V(12, 0, 0)); settle(); return it; };
        const w1 = wall(1.5), w2 = wall(3.5), w3 = wall(0.35);
        R('deploy: against a wall, 0.45 m out from it at the hit height (1.5), clamped to 0.6 … 2.2 m over the floor below (3.5 → 2.2, 0.35 → 0.6)',
          Math.abs(w1.spot.x - 13.55) < 0.03 && Math.abs(w1.spot.y - 1.5) < 0.04 && Math.abs(w2.spot.y - 2.2) < 0.02 && Math.abs(w3.spot.y - 0.6) < 0.02 && w2.state === 'live', { w1: v3(w1.spot), w2: v3(w2.spot), w3: v3(w3.spot) });
        // a ceiling: a slab overhead (a test block)
        const L = G.level, slab = L.addDynamic({ tag: 'test:slab' }); L.moveDynamic(slab, V(-6, 2.65, 10), V(1.5, 0.15, 1.5), 0);
        const c1 = K.throwFrom(me, V(-6, 1.0, 10), V(0, 12, 0)); settle(0.7);
        slab.solid = false; L.moveDynamic(slab, V(1e4, -50, 1e4), V(0.1, 0.1, 0.1), 0);
        R('deploy: off a ceiling it floats 1.0 m over the floor below', Math.abs(c1.spot.y - 1.0) < 0.03 && c1.state === 'live', { spot: v3(c1.spot) });
        // over the sea (off the deck's edge)
        const s1 = K.throwFrom(me, V(27, 1.5, -6), V(6, 0, 0)); step(1.5);
        R(`deploy: over the sea it floats 1.0 m over the water (${PLAYER.waterY + 1})`, Math.abs(s1.spot.y - (PLAYER.waterY + 1)) < 0.03 && s1.spot.x > 28 && s1.state === 'live', { spot: v3(s1.spot) });
        // a stand-in Bazookarp shell (G.objTargets.spheres)
        const sc = V(-8, 1.6, -14), sr = 1.6;
        G.objTargets = { spheres(o) { o.push({ c: sc, r: sr, solid: true }); return o; }, splash() {} };
        const sh = K.throwFrom(me, V(-8, 1.6, -18), V(0, 1.2, 10)); settle(0.7);
        const dsh = sh.spot.distanceTo(sc);
        R('deploy: off a (stand-in) Bazookarp shell it floats 0.45 m out from its surface', sh.state === 'live' && Math.abs(dsh - (sr + B.wallOut)) < 0.05, { spot: v3(sh.spot), fromCentre: r2(dsh), want: sr + B.wallOut });
        delete G.objTargets;
        // stand-in lava over a pit with no floor (the sea beyond x = 30): rising −1.6 → 0.5 over 2 s, then back down
        const lt0 = { t: null, dir: 0 };
        const lavaY = () => { if (lt0.t == null) return -1.6; const u = Math.min(1, (G.time - lt0.t) / 2); return lt0.dir > 0 ? -1.6 + 2.1 * u : 0.5 - 2.1 * u; };
        let under = 0;
        m.lava = { surfaceAt: (x, z) => (x > 30 ? lavaY() : -Infinity), under: (p, d = 0) => p.x > 30 && p.y < lavaY() - d, covers: () => false };
        const lv = K.throwFrom(me, V(29, 1.5, 6), V(6, 0, 0)); step(1.2);
        const y0 = lv.spot.y;
        lt0.t = G.time; lt0.dir = 1;
        let top = -9;
        step(3.2, () => { top = Math.max(top, lv.spot.y); if (m.lava.under(lv.dpos, -0.05)) under++; });
        const yTop = lv.spot.y;
        lt0.t = G.time; lt0.dir = -1;
        step(3.2, () => { if (m.lava.under(lv.dpos, -0.05)) under++; });
        R('deploy: over (stand-in) lava rising −1.6 → 0.5 over 2 s it rides up to 1.5 (eased ≤ 1 m/s, re-checked every 0.25 s) and settles back to −0.6 as it falls; under(pos, −0.05) never matches it',
          Math.abs(y0 - (-0.6)) < 0.03 && Math.abs(yTop - 1.5) < 0.04 && Math.abs(lv.spot.y - (-0.6)) < 0.04 && under === 0 && lv.state === 'live', { y0, top: r2(top), yTop: r2(yTop), back: r2(lv.spot.y), under });
        delete m.lava;
        // refused by the enemy pad
        const pad = G.level.spawnPads[1 - me.team], barrier = G.level.spawnBarrier;
        const dz = Math.sign(pad.z) || 1;
        const n2 = sent.length;
        const rf = drop(me, pad.x + 1, pad.z - dz * (barrier + B.padNoDeploy - 1.0)), ok = drop(me, pad.x + 1, pad.z - dz * (barrier + B.padNoDeploy + 0.6));
        settle();
        const r2s = sent.slice(n2).map((x) => x.data).filter((d) => d && d[0] === 2 && d[1] === rf.gid);
        const note1 = BOBBER_HUD.note;
        R(`deploy: refused within spawnBarrier + 2 = ${barrier + B.padNoDeploy} m of the enemy pad (it fizzles, [2, gid, 3], "${note1}"); just outside it floats`, rf.state === 'dead' && r2s.length === 1 && r2s[0][2] === 3 && ok.state === 'live' && K.BOBBER_STATS.refused === 1 && note1 === 'TOO CLOSE TO THEIR BASE', { refused: rf.state, rec: r2s, ok: ok.state, note1 });
        // refused in a stage's no-place disc: the note names that reason, not the base
        const np0 = G.level.noPlace;
        G.level.noPlace = (p, r) => Math.hypot(p.x - 8, p.z - 4) < 1.5 + r || !!np0?.call(G.level, p, r);
        const rf2 = drop(me, 8, 4); settle();
        G.level.noPlace = np0;
        const note2 = BOBBER_HUD.note;
        R(`deploy: refused in a stage's no-place disc too, its note "${note2}" (not the base's)`, rf2.state === 'dead' && note2 === 'NO ROOM TO FLOAT THERE', { state: rf2.state, note2 });
        // on a mover over the sea that parks: re-floats over the sea, keeps its chain, a new [3]
        K.clear(); sent.length = 0;
        const plat = L.addDynamic({ tag: 'test:float' }); const pc = V(32.0, -0.3, -20); L.moveDynamic(plat, pc, V(2, 0.3, 2), 0); step(2 / 60);
        const onP = drop(me, 32.0, -20, 0.8), deckB = drop(me, 27.9, -20);
        settle(0.6);
        const rode = !!onP.rb?.on, n0 = sent.length;
        step(0.5, () => { pc.x += 0.4 / 60; L.moveDynamic(plat, pc, V(2, 0.3, 2), 0); });
        const movedX = onP.spot.x;
        plat.solid = false; L.moveDynamic(plat, V(1e4, -50, 1e4), V(0.1, 0.1, 0.1), 0);
        step(1.0);
        const new3 = sent.slice(n0).map((x) => x.data).filter((d) => d && d[0] === 3 && d[1] === onP.gid);
        R('deploy: on a mover over the sea it rides it; when the block parks it re-floats 1.0 m over the sea (−0.6), keeps its chain and sends a new [3]',
          rode && movedX > 32.1 && Math.abs(onP.spot.y - (PLAYER.waterY + 1)) < 0.03 && onP.state === 'live' && onP.ten.includes(deckB) && new3.length >= 1, { rode, movedX: r2(movedX), y: r2(onP.spot.y), chain: onP.chain?.n, new3 });
      } finally { netOff(); }
    }

    // ============================================================================================ 2. tethers
    if (want('tether')) {
      reset(); netOn();
      try {
        const a = drop(me, -4, -10), b = drop(me, 0.9, -10); settle();
        const c = drop(me, -4, -20), d = drop(me, 1.1, -20); settle();
        R(`tethers: two bobbers ${r2(a.spot.distanceTo(b.spot))} m apart link; ${r2(c.spot.distanceTo(d.spot))} m apart don't (linkRange ${B.linkRange})`, a.ten.includes(b) && !c.ten.includes(d) && a.chain.n === 2 && c.chain.n === 1, { ab: a.ten.length, cd: c.ten.length });
        // a wall between (the test wall x 14…15) / a grate between (a test grate block)
        K.clear();
        const w1 = drop(me, 12.5, 2), w2 = drop(me, 16.5, 2); settle();
        const L = G.level, gr = L.addDynamic({ tag: 'test:grate', grate: true }); L.moveDynamic(gr, V(-8, 1.5, 20), V(0.1, 1.5, 3), 0);
        const g1 = drop(me, -10, 20), g2 = drop(me, -6, 20); settle();
        gr.solid = false; L.moveDynamic(gr, V(1e4, -50, 1e4), V(0.1, 0.1, 0.1), 0);
        R('tethers: a wall between two (4 m apart) blocks the link; a grate between doesn\'t', !w1.ten.includes(w2) && g1.ten.includes(g2), { wall: w1.ten.length, grate: g1.ten.length, grateBlock: gr.grate });
        // ≤ 3 each, nearest first
        K.clear();
        const hub = drop(me, 0, 0), n1 = drop(me, 2, 0), n2 = drop(me, 0, 3), n3 = drop(me, -3.6, 0), n4 = drop(me, 0, -4.4); settle();
        R('tethers: at most 3 each, nearest first (the hub takes the three nearest; the farthest of four goes elsewhere)', hub.ten.length === 3 && [n1, n2, n3].every((x) => hub.ten.includes(x)) && !hub.ten.includes(n4) && live().every((x) => x.ten.length <= 3),
          { hub: hub.ten.map((x) => r2(x.spot.distanceTo(hub.spot))), n4: n4.ten.length });
        // equal distances: the lower gid pair (four at exactly 3 m round a hub, spawned in order)
        K.clear();
        const h2 = drop(me, 0, 12), e1 = drop(me, 3, 12), e2 = drop(me, 0, 15), e3 = drop(me, -3, 12), e4 = drop(me, 0, 9); settle();
        const lowest = [e1, e2, e3, e4].sort((x, y) => x.gid - y.gid).slice(0, 3);
        R('tethers: at equal distances the lower gid pair wins (a hub with four at 3.0 m takes the three lowest gids)', h2.ten.length === 3 && lowest.every((x) => h2.ten.includes(x)), { hub: h2.ten.map((x) => x.gid), all: [e1, e2, e3, e4].map((x) => x.gid) });
        // N on the lamps
        const lamps = K.lampsOf(h2), lit = lamps.filter((x) => x > 0).length, n5 = h2.chain.n;
        R(`tethers: N (${n5}) shows on the lamps: four lit, one white-hot for each link past four`, n5 === 5 && lit === 4 && lamps.filter((x) => x > 1).length === 1, { lamps: lamps.map(r2), n: n5 });
        const lone = drop(me, 20, -20); settle();
        R('…a lone one: one lamp lit', K.lampsOf(lone).filter((x) => x > 0).length === 1, K.lampsOf(lone).map(r2));
        // [5] on every change; a ghost fed the records draws exactly that list
        K.clear(); sent.length = 0;
        const L5 = [];
        for (let i = 0; i < 5; i++) { drop(me, -10 + i * 3.4, 25 + (i % 2) * 1.5); settle(); L5.push(recs(5).length); }
        const own = pairs(), mine = K.items.filter((x) => !x.ghost);
        const OFF = 50000000;
        feed(mate, OFF);
        step(0.6);
        const gh = K.items.filter((x) => x.ghost);
        const ghostPairs = []; for (const it of gh) for (const t of it.ten) if (it.gid < t.gid) ghostPairs.push([it.gid - OFF, t.gid - OFF]);
        ghostPairs.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
        R('tethers: the owner records its whole tether list [5] on every change; a ghost fed the records draws exactly that list (never linking itself)',
          L5.every((n, i) => i === 0 || n > L5[i - 1]) && gh.length === mine.length && JSON.stringify(ghostPairs) === JSON.stringify(own) && gh.every((x) => x.state === 'live'), { counts: L5, own, ghost: ghostPairs });
      } finally { netOff(); }
    }

    // ============================================================================================ 3. trigger
    if (want('trigger')) {
      reset();
      // a 4-chain in a line, 3 m apart (each links to its neighbours only: 6 m to the next but one)
      const line4 = (owner, x0, z0) => { const L = []; for (let i = 0; i < 4; i++) L.push(drop(owner, x0 + i * 3, z0)); settle(); return L; };
      const C = line4(me, -9, -12);
      const t0 = G.time;
      const hit = S.blockShot(V(C[0].spot.x - 1, C[0].spot.y, C[0].spot.z), V(C[0].spot.x + 0.5, C[0].spot.y, C[0].spot.z), me.team, 36, me);
      step(0.6);
      const ex = ev('bomb:explode'), tr = ev('bobber:trigger')[0];
      const order = ex.map((x) => C.findIndex((b) => b.spot.distanceTo(x.e.pos) < 0.01)), dts = ex.map((x) => r3(x.t - ex[0].t));
      const g4 = tr && K.groups.get(C[0].gid);
      R(`trigger: the owner's shot on bobber 1 of a 4-chain blows all 4 breadth-first (1, 2, 3, 4) at ${B.hopDelay} s hops (± 1 frame), each R 3.0, 180 / 35`,
        hit && ex.length === 4 && JSON.stringify(order) === '[0,1,2,3]' && dts.every((d, i) => Math.abs(d - i * B.hopDelay) <= DT + 1e-3) && ex.every((x) => x.e.radius === 3.0) && g4 && g4.dmax === 180 && g4.dmin === 35 && tr.e.n === 4 && tr.e.by === me,
        { order, dts, radius: ex.map((x) => x.e.radius), n: tr?.e.n, first: r3(ex[0]?.t - t0) });
      // (the review) a blown bobber leaves the spatial hash — ten chains in a row leave nothing in it — and the tether buffer
      // is rewritten only as the chain's sparks come and go (not every frame for the 6 s its group is kept)
      { const hashed = []; let w0 = K.DRAW_STATS.tetherWrites, idle = 0, after = 0;
        for (let r = 0; r < 10; r++) {
          const Q = line4(me, -9, -24 + (r % 3) * 6);
          if (r === 0) { const wi = K.DRAW_STATS.tetherWrites; step(1.0); idle = K.DRAW_STATS.tetherWrites - wi; }
          S.blockShot(V(Q[0].spot.x, 2.5, Q[0].spot.z), V(Q[0].spot.x, 0.4, Q[0].spot.z), me.team, 36, me);
          const wa = K.DRAW_STATS.tetherWrites; step(r === 0 ? 3.0 : 0.6); if (r === 0) after = K.DRAW_STATS.tetherWrites - wa;
          hashed.push(K.near(-60, -60, 60, 60, []).length);
        }
        void w0;
        R('trigger: a blown bobber leaves the spatial hash (after each of 10 four-chains, nothing is left in it) and the tether buffer is rewritten only as the sparks come and go (idle: never; 3 s after a chain: a handful of times, not 180)',
          hashed.every((n) => n === 0) && idle === 0 && after >= 2 && after <= 8, { hashed, idleWrites1s: idle, writes3sAfterChain: after }); }
      // a teammate's shot (from the middle: two levels each way)
      reset();
      const D = line4(me, -9, -12);
      S.blockShot(V(D[1].spot.x, D[1].spot.y + 1, D[1].spot.z), V(D[1].spot.x, D[1].spot.y - 0.5, D[1].spot.z), mate.team, 36, mate);
      step(0.6);
      const ex2 = ev('bomb:explode'), tr2 = ev('bobber:trigger')[0];
      const lv = ex2.map((x) => r3(x.t - ex2[0].t)), ord2 = ex2.map((x) => D.findIndex((b) => b.spot.distanceTo(x.e.pos) < 0.01));
      R('trigger: a teammate\'s shot does the same (from bobber 2: 2, then 1 and 3, then 4), crediting the teammate', ex2.length === 4 && ord2[0] === 1 && new Set(ord2.slice(1, 3)).has(0) && new Set(ord2.slice(1, 3)).has(2) && ord2[3] === 3 && tr2?.e.by === mate && K.BOBBER_STATS.by.mate === 1,
        { order: ord2, dts: lv, by: tr2?.e.by?.name });
      // own blasts, a roller's drum, the Tempest's rain
      const setOff = (label, fn, s = 0.5) => {
        reset();
        const E = line4(me, -9, -12);
        fn(E); step(s);
        const n = ev('bomb:explode').length;
        R(`trigger: ${label} sets the chain off (all 4 go)`, n === 4 && live().length === 0, { blasts: n, left: live().length });
      };
      setOff('an own Splat Bomb', (E) => P._explodeBomb({ pos: V(E[2].spot.x + 1.5, 0, E[2].spot.z + 1.2), team: me.team, owner: me, kind: 'bomb', sp: false }));
      setOff('a Glide Bomb-sized own blast (G.subs.damageArea: R 2.2, 40 to devices — the path the Glide\'s blast takes)', (E) => S.damageArea(V(E[3].spot.x, 0.25, E[3].spot.z + 2.0), 2.2, 40, me.team, me));
      setOff('a Dash Pellet-sized own blast (R 2.2, 25 to devices)', (E) => S.damageArea(V(E[0].spot.x - 1.8, 0.3, E[0].spot.z), 2.2, 25, me.team, me));
      setOff('an own roller\'s drum rolling into it', (E) => { put(mate, V(E[0].spot.x, 0, E[0].spot.z - 1.0), 0); G.deploy.sweep(mate, WEAPONS.roller.rollWidth, 1.35, WEAPONS.roller.rollDamage, new Map(), 0.5); });
      setOff('the own Ink Tempest\'s rain', (E) => { P._spawnCloud({ pos: V(E[1].spot.x, 0.5, E[1].spot.z), team: me.team, owner: mate, dir: V(1, 0, 0) }); }, 0.8);
      // an own chain's blast sets off a second chain 2 m away (a teammate's 2-chain: separate explosions, their own N)
      reset();
      const A = line4(me, -9, -12).slice(0, 3); K.finish(K.items.find((x) => x.spot.x > -1 && x.spot.x < 1 && x.state === 'live'), 0, 'quiet'); step(0.1);
      const b1 = drop(mate, -9, -10), b2 = drop(mate, -12, -10); settle();
      S.blockShot(V(A[2].spot.x, 2, A[2].spot.z), V(A[2].spot.x, 0.5, A[2].spot.z), me.team, 36, me);
      step(0.8);
      const trs = ev('bobber:trigger').map((x) => ({ n: x.e.n, owner: x.e.actor === me ? 'me' : 'mate', by: x.e.by === me ? 'me' : x.e.by === mate ? 'mate' : String(x.e.by?.name) }));
      R('trigger: an own chain\'s blast sets off a second chain 2 m away (its own N: a separate explosion, credited to the blast\'s owner)', trs.length === 2 && trs[0].n === 3 && trs[1].n === 2 && trs[1].owner === 'mate' && trs[1].by === 'me' && live().length === 0, trs);
    }

    // ============================================================================================ 4. damage
    if (want('damage')) {
      const table = [];
      const victim = foe;
      for (let N = 1; N <= 8; N++) {
        const row = { N };
        for (const where of ['centre', 'edge']) {
          reset();
          // a chain of N in a line along x (2.5 m apart), the victim by the first one
          const L = []; for (let i = 0; i < N; i++) L.push(drop(me, -10 + i * 2.5, 0));
          settle();
          const c = L[0].spot, sz = K.sizeOf(N);
          if (where === 'centre') put(victim, V(c.x, 0, c.z - 0.1), 0);
          else { const d = sz.R - 0.004, h = Math.sqrt(d * d - 0.09); put(victim, V(c.x - h, 0, c.z), 0); }   // (its chest 0.3 m under the bobber, R away, on the far side from the rest)
          step(2 / 60); victim.hp = HP; evs.length = 0;
          S.blockShot(V(c.x, 2.5, c.z + 0.05), V(c.x, 0.5, c.z + 0.05), me.team, 36, me);
          step(1.0);
          row[where] = took(victim); row.R = sz.R; row.n = L[0].blast?.n;
        }
        table.push(row);
      }
      const want4 = { 1: [60, 25], 2: [95, 30], 3: [140, 35], 4: [180, 35], 5: [180, 35], 6: [180, 35], 7: [180, 35], 8: [180, 35] }, wantR = [1.8, 2.2, 2.6, 3.0, 3.2, 3.4, 3.6, 3.8];
      R('damage: by chain size N = 1 … 8, at the centre 60 / 95 / 140 / 180 (held at 180 past 4) and at R 25 / 30 / 35 / 35 (held), R 1.8 / 2.2 / 2.6 / 3.0, then +0.2 a link to 3.8 at 8 (DECISIONS #20)',
        table.every((r) => Math.abs(r.centre - want4[r.N][0]) < 0.6 && Math.abs(r.edge - want4[r.N][1]) < 0.8 && Math.abs(r.R - wantR[r.N - 1]) < 1e-6), table);
      // one chain, one explosion: a victim between two bobbers of one chain takes the larger, never the sum (both orders)
      const between = (first) => {
        reset();
        const a = drop(me, 0, 4), b = drop(me, 2.8, 4); settle();
        put(victim, V(1.0, 0, 4), 0); step(2 / 60); victim.hp = HP; evs.length = 0;
        const s = first === 'near' ? a : b;
        S.blockShot(V(s.spot.x, 2.5, s.spot.z), V(s.spot.x, 0.5, s.spot.z), me.team, 36, me);
        step(1.0);
        const ch = V(1.0, 0.72, 4), sz = K.sizeOf(2), da = K.falloff(a.spot.distanceTo(ch), sz.R, sz.dmin, sz.dmax), db = K.falloff(b.spot.distanceTo(ch), sz.R, sz.dmin, sz.dmax);
        return { took: took(victim), near: r2(da), far: r2(db), hits: ev('hit').length };
      };
      const o1 = between('near'), o2 = between('far');
      R('damage: one chain is one explosion — a victim between two of its bobbers takes the larger blast, never the sum (the nearer first: one hit; the farther first: its damage, then only the excess)',
        Math.abs(o1.took - o1.near) < 0.6 && Math.abs(o2.took - o2.near) < 0.6 && o1.far > 0 && o2.hits === 2 && o1.hits === 1, { nearFirst: o1, farFirst: o2 });
      // through a wall: no damage (a line test from the bobber to the chest)
      reset();
      const wb = drop(me, 13.3, 0); settle(); put(victim, V(15.6, 0, 0), 0); step(2 / 60); victim.hp = HP;
      S.blockShot(V(wb.spot.x, 2.5, wb.spot.z), V(wb.spot.x, 0.5, wb.spot.z), me.team, 36, me); step(0.5);
      R('damage: a wall between the bobber and a victim in its radius is cover', took(victim) < 0.01 && ev('bomb:explode').length === 1, { took: took(victim) });
    }

    // ============================================================================================ 5. disarm
    if (want('disarm')) {
      const shotBy = (label, dmg) => {
        reset();
        const a = drop(me, -6, 6), b = drop(me, -3, 6), c = drop(me, 0, 6); settle();
        put(foe, V(-3, 0, 7), 0); step(2 / 60); foe.hp = HP;
        const absorbed = S.blockShot(V(b.spot.x, 2.5, b.spot.z), V(b.spot.x, 0.4, b.spot.z), foe.team, dmg, foe);
        step(0.8);
        R(`disarm: an enemy ${label} shot (${dmg}) is absorbed and disarms the one it hits — it sags and pops (no blast, no damage, one 'device:down' how 'shot'); the chain splits and the rest re-link`,
          absorbed && b.state === 'dead' && ev('bomb:explode').length === 0 && ev('hit').length === 0 && ev('device:down').length === 1 && ev('device:down')[0].e.how === 'shot' && ev('device:down')[0].e.by === foe && a.state === 'live' && c.state === 'live' && !a.ten.includes(c) && a.chain.n === 1 && c.chain.n === 1 && DEPLOY_STATS.down.bobber === 1,
          { b: b.state, blasts: ev('bomb:explode').length, downs: ev('device:down').length, a: a.chain?.n, c: c.chain?.n });
      };
      shotBy('Spritzer', WEAPONS.shooter.damage);
      shotBy('Squall Spinner', WEAPONS.spinner.damage);
      shotBy('Twinfire', WEAPONS.twins.damage);
      // the shooter's hit marker hangs on 'device:hit'
      reset();
      { const a = drop(me, 0, 6); settle(); S.blockShot(V(a.spot.x, 2.5, a.spot.z), V(a.spot.x, 0.4, a.spot.z), foe.team, 8, foe); step(0.1);
        R('disarm: a small hit (a Brolly pellet\'s 8) only wears it down: still live at 17 hp; \'device:hit\' fired for the shooter\'s marker', a.state === 'live' && Math.abs(a.hp - 17) < 1e-6 && ev('device:hit').length === 1 && ev('device:hit')[0].e.attacker === foe, { hp: a.hp, hits: ev('device:hit').length }); }
      // blasts: a Pop Pellet (real), a Dash Pellet-sized blast, a lone enemy bobber
      const blastBy = (label, fn, inR, outR) => {
        reset();
        const ins = inR.map((d) => drop(me, -6 + d, -6)), outs = outR.map((d) => drop(me, -6 + d, -6 + 0.01)); settle();
        // (spread out on z so they don't all link into one chain: it doesn't matter here)
        fn(V(-6, 0, -6)); step(0.9);
        R(`disarm: ${label} disarms the bobbers whose centre is within its radius + 0.2 (no blast from them)`, ins.every((x) => x.state === 'dead') && outs.every((x) => x.state === 'live') && ev('bomb:explode').filter((x) => x.e.team === me.team).length === 0,
          { ins: ins.map((x) => x.state), outs: outs.map((x) => x.state) });
      };
      blastBy('an enemy Pop Pellet (real: R 2.1, 25 to devices)', (c) => { S._throw(foe, SUBS.burst, V(c.x, 0.6, c.z), V(0, -4, 0), false); }, [1.0], [Math.sqrt((2.1 + 0.2 + 0.3) ** 2 - 1) ]);
      blastBy('an enemy Dash Pellet-sized blast (R 2.2, 25 to devices)', (c) => S.damageArea(V(c.x, 0.3, c.z), 2.2, 25, foe.team, foe), [1.5], [Math.sqrt((2.4 + 0.15) ** 2 - 0.49)]);
      blastBy('a lone enemy bobber going off (R 1.8, 25 to devices)', (c) => { const e = drop(foe, c.x, c.z - 0.4, 0.6); step(0.5); K.trigger(e, foe2 || foe); }, [1.2], [2.4]);
      // the Splat Bomb: within 3.1 + 0.2 = 3.3 m (centre to centre), none at 3.4
      reset();
      const hz = (d) => Math.sqrt(d * d - 1);   // (the bomb on the floor, the bobber's centre 1.0 m up)
      const in3 = drop(me, -6 + hz(3.25), -2), out3 = drop(me, -6 - hz(3.4), -2); settle();
      P._explodeBomb({ pos: V(-6, 0, -2), team: foe.team, owner: foe, kind: 'bomb', sp: false }); step(0.6);
      R('disarm: an enemy Splat Bomb disarms every bobber whose centre is within 3.1 + 0.2 = 3.3 m (3.25: gone), none at 3.4', in3.state === 'dead' && out3.state === 'live', { at325: in3.state, at34: out3.state, d: [r2(in3.spot.distanceTo(V(-6, 0, -2))), r2(out3.spot.distanceTo(V(-6, 0, -2)))] });
      // enemies walking through: nothing
      reset();
      const w = drop(me, 0, -4); settle();
      put(foe, V(-2, 0, -4), Math.PI / 2);
      step(1.2, () => { foe.pos.x += 3.5 / 60; foe.pos.y = 0.02; });
      R('disarm: enemy players walking through it do nothing (not solid; it triggers on nothing but fire)', w.state === 'live' && w.hp === B.hp && !evs.some((x) => x.n !== 'bobber:link'), { state: w.state, hp: w.hp, events: evs.map((x) => x.n) });
      // a ghost's shot (netMuted held up) through a real bobber: absorbed, nothing else
      reset(); netOn();
      try {
        const r = drop(me, 0, -4), r2b = drop(me, 3, -4); settle();
        G.netm.mute = 1;
        const ab1 = S.blockShot(V(r.spot.x, 2.5, r.spot.z), V(r.spot.x, 0.4, r.spot.z), foe.team, 36, foe);
        const ab2 = S.blockShot(V(r2b.spot.x, 2.5, r2b.spot.z), V(r2b.spot.x, 0.4, r2b.spot.z), me.team, 36, mate);
        S.damageArea(V(0, 0.3, -4), 3, 60, foe.team, foe);
        G.netm.mute = 0;
        step(0.5);
        R('disarm: a ghost\'s shot or blast replayed here (netMuted) does nothing to a real bobber — the enemy\'s doesn\'t wear it down, a teammate\'s doesn\'t set it off (absorbed all the same: the shooter\'s screen judged it)',
          ab1 && ab2 && r.state === 'live' && r.hp === B.hp && r2b.state === 'live' && ev('bomb:explode').length === 0 && !sent.some((x) => x.dev), { r: [r.state, r.hp], r2: r2b.state });
      } finally { netOff(); }
      // standing fire: the enemy Ink Tempest's rain wears one down (34 a second: gone in under a second)
      reset();
      { const rb = drop(me, 0, 2); settle(); const t0 = G.time; let tD = null;
        P._spawnCloud({ pos: V(0, 0.5, 2), team: foe.team, owner: foe, dir: V(1, 0, 0) });
        step(2.0, () => { if (tD == null && rb.state !== 'live') tD = G.time; });
        R('disarm: an enemy Ink Tempest\'s rain (standing fire, judged on the owner\'s screen) wears a bobber down and disarms it — no blast', tD != null && tD - t0 < 1.4 && rb.state === 'dead' && ev('bomb:explode').length === 0 && ev('device:down')[0]?.e.how === 'shot', { t: tD != null ? r2(tD - t0) : null, state: rb.state }); }
      // a charger beam stops on one
      reset();
      { const bb = drop(me, 0, 2); settle(); put(foe, V(0, 0, 8), Math.PI); step(2 / 60);
        const len = S.blockRay(V(0, bb.spot.y, 8), V(0, 0, -1), 20, foe.team, 140, foe); step(0.6);
        R('disarm: a charger beam stops on it (and disarms it)', len < 6.1 && len > 5.5 && bb.state === 'dead', { len: r2(len), state: bb.state }); }
    }

    // ============================================================================================ 6. life
    if (want('life')) {
      reset(); netOn();
      try {
        const a = drop(me, 0, 0); settle();
        const t0 = G.time;
        step(B.life - 0.5 - 0.6); const at29 = a.state;
        step(1.2);
        const e2 = recs(2).filter((d) => d[1] === a.gid);
        R(`life: it lasts ${B.life} s (blinking the last 3), then fizzles: no blast, no 'device:down', [2, gid, 0]`, at29 === 'live' && a.state === 'dead' && ev('bomb:explode').length === 0 && ev('device:down').length === 0 && e2.length === 1 && e2[0][2] === 0, { at29, end: a.state, rec: e2, t: r2(G.time - t0) });
        // the hidden guard: the 25th retires the oldest
        reset(); netOn();
        const L = []; for (let i = 0; i < 24; i++) L.push(drop(me, -21 + (i % 8) * 6, -30 + Math.floor(i / 8) * 6));
        settle();
        const n24 = live().length;
        me.ink = 100; G.subs.use(me, B); step(1.5);
        const rec0 = recs(2).filter((d) => d[1] === L[0].gid);
        R(`life: no cap but the hidden guard: the ${B.maxPerPlayer + 1}th bobber retires the oldest (it fizzles, [2, gid, 0])`, n24 === 24 && L[0].state === 'dead' && live().length === 24 && K.BOBBER_STATS.guard === 1 && rec0.length === 1 && rec0[0][2] === 0, { n24, now: live().length, first: L[0].state });
      } finally { netOff(); }
      // the owner splatted: they stay, and a teammate still sets them off
      reset();
      const s1 = drop(me, 0, 0), s2 = drop(me, 3, 0); settle();
      me.hp = 1; me.invuln = 0; me.damage(10, foe, 'weapon'); step(0.5);
      const dead = !me.alive, stay = s1.state === 'live' && s2.state === 'live';
      S.blockShot(V(s1.spot.x, 2.5, s1.spot.z), V(s1.spot.x, 0.4, s1.spot.z), mate.team, 36, mate); step(0.5);
      R('life: the owner splatted, their bobbers stay — and a teammate\'s shot still sets them off', dead && stay && ev('bomb:explode').length === 2, { dead, stay, blasts: ev('bomb:explode').length });
      me.respawn(); step(0.2);
    }

    // ============================================================================================ 7. movers, crushes, endings
    if (want('movers')) {
      const L = G.level;
      reset(); netOn();
      try {
        // a block driven through its float height (not its foot)
        const a = drop(me, 0, -14); settle();
        const blk = L.addDynamic({ tag: 'test:ram' }); const c = V(-3, 1.0, -14); L.moveDynamic(blk, c, V(0.5, 0.35, 0.5), 0);
        let tIn = null, tDead = null;
        step(1.5, () => { c.x += 4 / 60; L.moveDynamic(blk, c, V(0.5, 0.35, 0.5), 0); if (tIn == null && L.pointInBlock(blk, a.spot, 0)) tIn = G.time; if (tDead == null && a.state === 'dead') tDead = G.time; });
        blk.solid = false; L.moveDynamic(blk, V(1e4, -50, 1e4), V(0.1, 0.1, 0.1), 0);
        const dd = ev('device:down'), e2 = recs(2).filter((d) => d[1] === a.gid);
        R('movers: a block driven through its float height (not its foot) crushes it within 0.1 s — one \'device:down\' how \'crush\', one count, [2, gid, 2]',
          tDead != null && tIn != null && tDead - tIn <= 0.1 + 1e-3 + DT * 3 && dd.length === 1 && dd[0].e.how === 'crush' && DEPLOY_STATS.crushed.bobber === 1 && e2.length === 1 && e2[0][2] === 2, { dt: tIn != null && tDead != null ? r3(tDead - tIn) : null, downs: dd.map((x) => x.e.how), rec: e2 });
        // crushIn's three shapes and lavaSweep
        const shapes = [];
        const tmp = [];
        const blk2 = (b) => { const q = L.addDynamic({ tag: 'test:crush' }); L.moveDynamic(q, b.spot.clone(), V(0.3, 0.3, 0.3), 0); tmp.push(q); return q; };
        const gone = () => { for (const q of tmp.splice(0)) { q.solid = false; L.moveDynamic(q, V(1e4, -50, 1e4), V(0.1, 0.1, 0.1), 0); } };
        for (const [how, mk] of [['crush', (b) => ({ blocks: [blk2(b)], rider: null })], ['shell', (b) => ({ sphere: { c: b.spot.clone().add(V(0.5, 0, 0)), r: 0.8 } })], ['lava', (b) => ({ where: (p) => p.distanceTo(b.dpos) < 0.01 })]]) {
          reset();
          const b = drop(me, 0, -14); settle();
          const n = G.deploy.crushIn(mk(b), how);
          gone();
          step(0.1);
          shapes.push({ how, n, state: b.state, downs: ev('device:down').map((x) => x.e.how) });
        }
        reset();
        const lb = drop(me, 0, -14); settle();
        const nl = K.lavaSweep((p) => p.distanceTo(lb.dpos) < 0.01); step(0.1);
        shapes.push({ how: 'lavaSweep', n: nl, state: lb.state, downs: ev('device:down').map((x) => x.e.how) });
        R('movers: G.deploy.crushIn with each shape (blocks, sphere, where) and the kit\'s lavaSweep end it with that how — one \'device:down\' each',
          shapes.every((s) => s.n === 1 && s.state === 'dead' && s.downs.length === 1) && shapes[0].downs[0] === 'crush' && shapes[1].downs[0] === 'shell' && shapes[2].downs[0] === 'lava' && shapes[3].downs[0] === 'lava', shapes);
        // era flips (bluestone's event): a block in `on` round its sphere ends it; its floor in `off` re-floats it
        reset();
        const e1 = drop(me, 0, -14), e2b = K.throwFrom(me, V(14.5, 4.6, 0), V(0, -2, 0)); settle(0.7);
        const wallB = e2b.floorB, wallBlk = L.blocks[wallB];
        const q = L.addDynamic({ tag: 'test:era' }); L.moveDynamic(q, e1.spot.clone(), V(0.6, 0.6, 0.6), 0);
        const { emit } = await import('./src/core/ctx.js');
        emit('era:flip', { group: 0, on: [q.id], off: [] });
        q.solid = false; L.moveDynamic(q, V(1e4, -50, 1e4), V(0.1, 0.1, 0.1), 0);
        const y0 = e2b.spot.y;
        wallBlk.solid = false; emit('era:flip', { group: 0, on: [], off: [wallB] }); step(2.4); wallBlk.solid = true;
        const flips = ev('device:down').map((x) => x.e.how);
        R('movers: an era:flip with a block in `on` round its sphere ends it (\'device:down\' how \'flip\'); one with its floor in `off` makes it re-float (5.0 → 1.0, still live, no event)',
          e1.state === 'dead' && flips.length === 1 && flips[0] === 'flip' && Math.abs(y0 - 5.0) < 0.03 && e2b.state === 'live' && Math.abs(e2b.spot.y - 1.0) < 0.03, { flips, y0, y1: r2(e2b.spot.y), floor: wallB });
        // riding a moving block, lifted by one rising under its foot, shoved by one sliding into it, crushed with nowhere to go
        reset();
        const plat = L.addDynamic({ tag: 'test:plat' }); const pc = V(-8, 0.25, 14); L.moveDynamic(plat, pc, V(2, 0.25, 2), 0); step(2 / 60);
        const rd = drop(me, -8, 14, 1.2); settle(0.6);
        const s0 = rd.spot.clone(), riding = !!rd.rb?.on;
        step(1.0, () => { pc.x += 1.5 / 60; pc.y += 0.4 / 60; L.moveDynamic(plat, pc, V(2, 0.25, 2), 0); });
        const d1 = rd.spot.clone().sub(s0);
        const r4 = recs(4).filter((d) => d[1] === rd.gid);
        R('movers: on a moving block it rides it (its foot on the block, floating 1.0 m over it; the owner\'s [4] ride word under its own kind)', riding && Math.abs(d1.x - 1.5) < 0.06 && Math.abs(d1.y - 0.4) < 0.04 && Math.abs(rd.spot.y - (pc.y + 0.25 + 1.0)) < 0.03 && r4.length >= 1 && r4[0].length > 5, { moved: v3(d1), y: r2(rd.spot.y), r4: r4[0] });
        plat.solid = false; L.moveDynamic(plat, V(1e4, -50, 1e4), V(0.1, 0.1, 0.1), 0); step(1.0);
        // lifted
        const lf = drop(me, 8, 14); settle();
        const riser = L.addDynamic({ tag: 'test:riser' }); const rc = V(8, -0.6, 14); L.moveDynamic(riser, rc, V(1.2, 0.5, 1.2), 0);
        step(1.0, () => { rc.y = Math.min(0.3, rc.y + 1.0 / 60); L.moveDynamic(riser, rc, V(1.2, 0.5, 1.2), 0); });
        const lifted = !!lf.rb?.on && Math.abs(lf.spot.y - (rc.y + 0.5 + 1.0)) < 0.05 && lf.state === 'live';
        riser.solid = false; L.moveDynamic(riser, V(1e4, -50, 1e4), V(0.1, 0.1, 0.1), 0); step(0.8);
        // shoved (a block sliding into its foot along the floor) and crushed (pinned against the wall)
        const sv = drop(me, 4, 22); settle();
        const ram = L.addDynamic({ tag: 'test:shover' }); const sc2 = V(1.5, 0.3, 22); L.moveDynamic(ram, sc2, V(0.6, 0.3, 0.6), 0);
        const sx0 = sv.spot.x;
        step(1.2, () => { sc2.x += 2.5 / 60; L.moveDynamic(ram, sc2, V(0.6, 0.3, 0.6), 0); });
        const shoved = sv.state === 'live' && sv.spot.x - sx0 > 0.4;
        ram.solid = false; L.moveDynamic(ram, V(1e4, -50, 1e4), V(0.1, 0.1, 0.1), 0);
        const pin = drop(me, 13.2, 3); settle();
        // (a block 90 m long: the way out round either end is off the deck — nowhere to go but through the wall)
        const pr = L.addDynamic({ tag: 'test:pinner' }); const pc2 = V(11.0, 0.3, 3); L.moveDynamic(pr, pc2, V(0.6, 0.3, 45), 0);
        const d0 = ev('device:down').length;
        step(1.2, () => { pc2.x = Math.min(13.35, pc2.x + 2 / 60); L.moveDynamic(pr, pc2, V(0.6, 0.3, 45), 0); });
        const pinD = ev('device:down').slice(d0);
        pr.solid = false; L.moveDynamic(pr, V(1e4, -50, 1e4), V(0.1, 0.1, 0.1), 0);
        R('movers: a block rising under its foot lifts it onto its top (riding it); one sliding into its foot shoves it aside; one pinning it to a wall with nowhere to go crushes it (one \'device:down\' how \'crush\')',
          lifted && shoved && pin.state === 'dead' && pinD.length === 1 && pinD[0].e.how === 'crush', { lifted, shoved, sx: [r2(sx0), r2(sv.spot.x)], pin: pin.state, downs: pinD.map((x) => x.e.how) });
        // one 'device:down' per ending, from each emitter; expiry and the owner leaving: none
        reset();
        const x1 = drop(me, 0, 0); settle(); S.blockShot(V(x1.spot.x, 2.5, x1.spot.z), V(x1.spot.x, 0.4, x1.spot.z), foe.team, 36, foe); step(0.6);
        const x2 = drop(me, 3, 0); settle(); K.dropOwner(me); step(0.1);
        R('movers: every ending fires exactly one \'device:down\' (shot down: one); an owner leaving (dropOwner) none', x1.state === 'dead' && x2.state === 'dead' && ev('device:down').length === 1, ev('device:down').map((x) => x.e.how));
        // the boss's body / the shell: a stand-in G.objTargets — splash called once per chain, from the bobber nearest the sphere
        reset();
        const calls = [];
        const shc = V(9.5, 1.2, -24);
        G.objTargets = { spheres(o) { o.push({ c: shc, r: 1.5, solid: true }); return o; }, splash: (a, c, Rr, mx, mn, wid) => calls.push({ c: v3(c), R: Rr, mx, mn, wid }) };
        const ch6 = []; for (let i = 0; i < 6; i++) ch6.push(drop(me, -6 + i * 2.5, -24));
        settle();
        S.blockShot(V(ch6[0].spot.x, 2.5, ch6[0].spot.z), V(ch6[0].spot.x, 0.4, ch6[0].spot.z), me.team, 36, me); step(1.0);
        delete G.objTargets;
        const nearest = ch6.slice().sort((p, q2) => p.spot.distanceTo(shc) - q2.spot.distanceTo(shc))[0];
        R('movers: the (stand-in) Bazookarp shell takes exactly one blast a chain — G.objTargets.splash once, from the bobber nearest it, at the chain\'s size',
          calls.length === 1 && calls[0].c.join() === v3(nearest.spot).join() && calls[0].R === K.sizeOf(6).R && calls[0].mx === 180, { calls, nearest: v3(nearest.spot) });
      } finally { netOff(); }
    }

    // ============================================================================================ interactions (specials)
    if (want('interact')) {
      // Drainbow: a blast reaching someone inside an enemy bubble is halved (from = the bobber)
      reset();
      const db0 = G.drainbow, cuts = [];
      G.drainbow = { ...(db0 || {}), live: true, pass() {}, cut: (att, vic, dmg, shot, from) => { cuts.push({ vic: vic === foe, dmg: r2(dmg), from: from ? v3(from) : null }); return dmg * 0.5; }, rayShot: () => null };
      try {
        const a = drop(me, 0, 0); settle(); put(foe, V(0, 0, 0.2), 0); step(2 / 60); foe.hp = HP;
        evs.length = 0; S.blockShot(V(0, 2.5, 0), V(0, 0.4, 0), me.team, 36, me); step(0.5);
        R('interact: Drainbow — a blast reaching a victim in an enemy bubble goes through its cut (from = the bobber) and lands halved', cuts.length === 1 && cuts[0].from.join() === v3(a.spot).join() && Math.abs(took(foe) - 30) < 0.6, { cuts, took: took(foe) });
      } finally { G.drainbow = db0; }
      // Bubble Guard: 0 damage
      reset();
      { const a = drop(me, 0, 0); settle(); put(foe, V(0, 0, 0.2), 0); step(2 / 60); foe.hp = HP; G.specials.giveShield(foe, 4, null); step(0.1);
        S.blockShot(V(0, 2.5, 0), V(0, 0.4, 0), me.team, 36, me); step(0.5);
        R('interact: a foe in a Bubble Guard takes 0 from a chain (its hp untouched)', HP - foe.hp < 0.01 && ev('bomb:explode').length === 1, { lost: r2(HP - foe.hp) });
        foe.status.shield = 0; }
      // the Mega Stamp's swing guard (SUB_KITS.bobber.smash, called from specials.js guardSweep)
      reset();
      { const a = drop(me, 0, 0), b = drop(me, 0, -6); settle();
        K.smash(V(0, 1.0, 1.5), 2.5, foe.team, (p) => p.z < 1.5);
        step(0.6);
        R('interact: the Mega Stamp\'s swing guard disarms an enemy bobber in front of it (not one behind / out of reach)', a.state === 'dead' && b.state === 'live' && ev('bomb:explode').length === 0, { a: a.state, b: b.state }); }
      // a chain's blast reaches the specials' world objects (Bubble Blower bubbles: specials.areaHit — own team sets one off)
      reset();
      { const calls = [];
        const w = { kind: 'testobj', dead: false, hitArea: (c, r, dmg, team, owner) => calls.push({ r, dmg, team, owner: owner === me }), update() { return true; }, dispose() {} };
        G.specials.world.push(w);
        const a = drop(me, 0, 0); settle(); S.blockShot(V(0, 2.5, 0), V(0, 0.4, 0), me.team, 36, me); step(0.4);
        G.specials.world.splice(G.specials.world.indexOf(w), 1);
        R('interact: a chain\'s blast reaches the specials\' world objects (specials.areaHit: an own Bubble Blower bubble goes off), as the owner\'s, own team', calls.length === 1 && calls[0].team === me.team && calls[0].owner && calls[0].dmg === K.sizeOf(1).dev, calls); }
      // the sounds
      R(`interact: its sounds are built (${BOBBER_SOUNDS.join(', ')})`, BOBBER_SOUNDS.every((n) => SFX[n] && typeof SFX[n].build === 'function'), BOBBER_SOUNDS.filter((n) => !SFX[n]));
    }

    // ============================================================================================ 9. net (one page: the records)
    if (want('net')) {
      reset(); netOn();
      try {
        me.ink = 100; me.aimYaw = 0; me.aimPitch = -0.1; put(me, V(0, 0, -8), 0); step(2 / 60);
        G.subs.use(me, B); step(1.2);
        const it = K.items[0];
        const r0 = recs(0)[0], r3s = recs(3)[0];
        R('net: a throw records [0, gid, x, y, z, vx, vy, vz] (rounded); the settle [3, gid, x, y, z, hover]', r0 && r0[1] === it.gid && r0.length === 8 && r3s && r3s[1] === it.gid && r3s.length === 6, { r0, r3s });
        // a ghost (another player's bobber) hit here: enemy fire → netHurt 'bobber' with the shooter; team fire → 'bobberPop'
        K.ghost(foe, [0, 77001, 2, 0.6, 4, 0, -3, 0]); K.ghost(foe, [3, 77001, 2, 1, 4, 1]); step(0.6);
        K.ghost(mate, [0, 77002, -2, 0.6, 4, 0, -3, 0]); K.ghost(mate, [3, 77002, -2, 1, 4, 1]); step(0.6);
        const gF = K.items.find((x) => x.gid === 77001), gM = K.items.find((x) => x.gid === 77002);
        sent.length = 0;
        S.blockShot(V(2, 2.5, 4), V(2, 0.4, 4), me.team, 36, me);
        S.blockShot(V(-2, 2.5, 4), V(-2, 0.4, 4), me.team, 36, me);
        step(0.2);
        const dh = sent.filter((x) => x.dev);
        R('net: a shot on a ghost: enemy fire goes to its owner as a device hit (\'bobber\', its damage, the shooter as by); a teammate\'s ghost gets team fire on its own channel (\'bobberPop\', 1, by) — the ghosts untouched here till their owners answer',
          gF.state === 'live' && gM.state === 'live' && dh.some((x) => x.dev === 'bobber' && x.id === 77001 && x.d === 36 && x.by === me.nid) && dh.some((x) => x.dev === 'bobberPop' && x.id === 77002 && x.d === 1 && x.by === me.nid), dh);
        // the owner's side: netHurt (enemy) and bobberPop (team, crediting the shooter)
        const own = drop(me, 6, 8); const own2 = drop(me, 9, 8); settle(); sent.length = 0;
        K.netHurt(own.gid, 30, foe); step(0.6);
        KIT_GHOSTS.bobberPop.netHurt(own2.gid, 1, mate); step(0.4);
        const t1 = recs(1)[0], t2 = recs(2).find((d) => d[1] === own.gid);
        R('net: the owner\'s copy takes a remote enemy hit (netHurt 30 → disarmed, [2, gid, 1]) and a remote team shot (bobberPop → the chain goes, [1, gid0, N, by …] with the shooter)', own.state === 'dead' && t2 && t2[2] === 1 && t1 && t1[1] === own2.gid && t1[3] === mate.nid, { t1, t2 });
        // a ghost chain [1]: every bobber blows here at the hop times, nobody's ink painted here
        K.ghost(foe, [0, 77003, 5, 0.6, -4, 0, -3, 0]); K.ghost(foe, [3, 77003, 5, 1, -4, 1]); K.ghost(foe, [0, 77004, 8, 0.6, -4, 0, -3, 0]); K.ghost(foe, [3, 77004, 8, 1, -4, 1]);
        K.ghost(foe, [5, 77003, 77004]); step(0.6);
        const evs0 = evs.length, sp0 = G.paint.splat; let painted = 0; G.paint.splat = function (c, r, t, o) { if (!o?.cosmetic) painted++; return sp0.apply(this, arguments); };
        put(me, V(5.3, 0, -4), 0); step(2 / 60); me.hp = HP;
        foe.remote = true;   // (another player's chain: its owner is on another screen — so the victim's screen records the hit [6])
        try { K.ghost(foe, [1, 77003, 2, foe.nid, 77004, 1]); step(0.5); } finally { foe.remote = false; }
        G.paint.splat = sp0;
        const bx = evs.slice(evs0).filter((x) => x.n === 'bomb:explode'), myHit = evs.slice(evs0).filter((x) => x.n === 'hit' && x.e.victim === me);
        const r6 = recs(6);
        R('net: a ghost chain [1, gid0, N, by, gid, hop …] blows every bobber here at its own hop times (paint: the owner\'s, none here); a victim this screen owns is judged here (its damage, the [6] hit record for the owner\'s marker)',
          bx.length === 2 && Math.abs(bx[1].t - bx[0].t - B.hopDelay) <= DT + 1e-3 && painted === 0 && myHit.length === 1 && r6.length === 1 && r6[0][1] === 77003, { blasts: bx.length, painted, myHit: myHit.length, r6 });
        // a player who leaves: dropOwner ends theirs on this screen at once (no blast, no event)
        K.ghost(foe, [0, 77005, -6, 0.6, -6, 0, -3, 0]); K.ghost(foe, [3, 77005, -6, 1, -6, 1]); step(0.6);
        const n0 = evs.length, dropped = K.dropOwner(foe);
        R('net: a player who leaves takes their bobbers with them (dropOwner: gone at once, quietly — no blast, no \'device:down\')', dropped >= 1 && !K.items.some((x) => x.owner === foe && x.state !== 'dead') && !evs.slice(n0).some((x) => x.n === 'bomb:explode' || x.n === 'device:down'), { dropped });
        me.hp = HP;
      } finally { netOff(); }
    }

    // ============================================================================================ 10. the teammate cue
    if (want('cue')) {
      reset();
      const Lc = [];
      for (let i = 0; i < 4; i++) Lc.push(drop(mate, 13.0, -3 + i * 2));
      settle();
      put(me, V(4, 0, 1), Math.PI / 2); me.setWeapon('shooter'); g.rig.follow(me, true); g.rig.yaw = Math.PI / 2; g.rig.pitch = 0.05; me.aimYaw = Math.PI / 2;
      step(0.3);
      // (what the tether shader reads: the glow column of the team's uploaded per-tether attribute, aS.z)
      const glowUp = () => { const st = K.draw.sets[mate.team]; const o = []; if (st) for (let k = 0; k < st.tn; k++) o.push(st.aS.array[k * 4 + 2]); return o; };
      const up0 = glowUp();
      put(foe, V(11.5, 0, 1), 0); step(0.4);
      const glowA = Lc.every((x) => x.glow), hintA = BOBBER_HUD.hint, glowCnt = BOBBER_HUD.glowChains, promptA = BOBBER_HUD.prompt, upA = glowUp();
      put(foe, V(15.6, 0, 1), 0); step(0.4);
      const glowB = Lc.some((x) => x.glow), hintB = BOBBER_HUD.hint, upB = glowUp();
      // the other team never sees it
      S.viewer = foe.team; step(0.3); put(foe, V(11.5, 0, 1), 0); step(0.3);
      const enemyGlow = Lc.some((x) => x.glow) || BOBBER_HUD.glowChains > 0;
      S.viewer = null;
      R('cue: a foe in the open within R(N) − 0.3 of a teammate\'s chain — the chain glows on your screen (its tethers: the glow uploaded to every one of its tethers\' instances, read back from the GPU buffer) and "Shoot to set off" sits on its nearest bobber you have a line to in reach (+ the prompt)',
        glowA && glowCnt === 1 && up0.length === 5 && up0.every((x) => x === 0) && upA.length === 5 && upA.every((x) => x === 1) && Lc.some((x) => x.gid === hintA) && /Shoot your team/.test(promptA || ''), { glowA, hintA, glowCnt, promptA, tetherGlow: { before: up0, during: upA } });
      R('cue: the same foe behind a wall from you (in the chain\'s reach all the same): neither the glow (flags and uploaded tethers) nor the hint; the other team never sees either', !glowB && upB.length === 5 && upB.every((x) => x === 0) && hintB == null && !enemyGlow, { glowB, tetherGlow: upB, hintB, enemyGlow });
    }

    // ============================================================================================ 8. bots
    if (want('bots')) {
      // hold-fire (every bot, whatever its sub): its shot along a line through an own idle bobber (no foe near it) is held —
      // for every kind of gun, the bow's burst a [ring, full] pair (read as a NaN, it held nothing: its arrows were most of
      // the matches' strays), the Brolly's pellets, a blaster's blob; one 3 m off the line to the side of a bow's 8° fan at
      // 9 m is held too, the same off a Splattershot's line is not; a draw it had going is dropped, not loosed
      {
        const res = {};
        for (const [wid, dx, want] of [['shooter', 0, true], ['bow', 0, true], ['brolly', 0, true], ['blaster', 0, true], ['bow', 1.2, true], ['shooter', 3.0, false]]) {
          reset();
          drop(me, dx, 9); settle();
          put(mate, V(0, 0, 0), 0); mate.setWeapon(wid); mate.bot.reset(); mate.bot._bob = null; mate.bot._bobHF = null; mate.bot.aimYaw = 0; mate.bot.aimPitch = 0;
          const it = mate.intent; zero(mate); it.fire = true;
          K.botAct(mate.bot, DT, it, new THREE.Vector3(), false);
          res[`${wid}${dx ? '+' + dx : ''}`] = !it.fire === want;
        }
        reset();
        drop(me, 0, 9); settle();
        put(mate, V(0, 0, 0), 0); mate.setWeapon('bow'); mate.bot.reset(); mate.bot._bob = null; mate.bot._bobHF = null; mate.bot.aimYaw = 0; mate.bot.aimPitch = 0;
        const wr = mate.weaponRunner; wr.charging = true; wr.charge = 0.6; zero(mate); mate.intent.fire = true;
        K.botAct(mate.bot, DT, mate.intent, new THREE.Vector3(), false);
        res.drawDropped = !wr.charging && !mate.intent.fire;
        R('bots: hold-fire — a teammate\'s shot through an own idle bobber is held (Splattershot, Tideline Bow, Brolly, blaster; a bow\'s fan reaches 1.2 m to the side at 9 m); 3 m off a Splattershot\'s line it fires; a bow\'s draw is dropped, not loosed', Object.values(res).every(Boolean), res);
      }
      // [b5-int3] a teammate bot's sub throw that would go off by an own idle web is held at the press — through the real
      // brain (bots.js think → the kits' botAct → the hold → _tail's press on _bombAim: the one press every bot throw takes,
      // a zone ink lob, a tower lob, a fight bomb, a paint sub, a kit sub), for kinds the first hold (6afe6c06: Splat Bomb,
      // Cling Charge, Pop Pellet, Sprinkler) didn't know: a Waddle Bomb, a Skitter Bomb, a Shaker, a Tracer Bolt, a Whirl
      // Boomerang; the same throw turned away is pressed. And the kit weapons' paths: a Cutlass's charged cut at the web is
      // dropped, not loosed (letting go of the trigger loosed it: the matches' 'blast:blade' strays), a Mitts leap won't land
      // its smash by the web, a Glide Bomb won't stop its blast by it, a Dash Pellet's gap close won't pop by it
      {
        const res = {}, held = {};
        for (const kind of ['bomb', 'waddle', 'seeker', 'shaker', 'tracer', 'boomerang']) {
          for (const [tag, yaw] of [['at', 0], ['away', Math.PI]]) {
            reset();
            for (let i = 0; i < 3; i++) drop(me, 0, 4.5 + i * 3);   // (my web: z 4.5 / 7.5 / 10.5 down the mate's line)
            settle();
            put(mate, V(0, 0, 0), yaw); mate.setWeapon('shooter'); mate.setSub(kind); mate.bot.reset(); mate.ink = 100;
            const up = brain0.get(mate);
            mate.bot.update = function (dt) { this._bombAim = true; this.bombCd = 0; this.aimYaw = mate.aimYaw = yaw; this.aimPitch = mate.aimPitch = kind === 'tracer' ? -0.05 : 0; return up.call(this, dt); };
            step(1 / 60);
            stub(mate);
            const pressed = !!mate.intent.sub || !!mate.bot._releaseBomb;
            res[kind + ':' + tag] = tag === 'at' ? !pressed : pressed;
            held[kind + ':' + tag] = pressed ? 'pressed' : 'held';
          }
        }
        R('bots: a teammate bot\'s sub throw that would go off by an own idle web is held at the press (the real brain, its aim pinned at the web) — Splat Bomb, Waddle Bomb, Skitter Bomb, Shaker, Tracer Bolt, Whirl Boomerang; turned away, each is pressed',
          Object.values(res).every(Boolean), held);
        // the Cutlass: a full charge at the web, the trigger let go by the hold — dropped, no cut, no wave
        reset();
        drop(me, 0, 3.2); settle();
        put(mate, V(0, 0, 0), 0); mate.setWeapon('blade'); mate.bot.reset(); mate.bot._bob = null; mate.bot._bobHF = null; mate.bot.aimYaw = 0; mate.bot.aimPitch = 0;
        step(2 / 60);
        const wrB = mate.weaponRunner, KB = wrB.kit;
        let bladeOk = false, bladeInfo = { kit: !!KB };
        if (KB) {
          KB.charging = true; KB.held = true; KB.charge = 1; KB.full = true; zero(mate); mate.intent.fire = true;
          K.botAct(mate.bot, DT, mate.intent, new THREE.Vector3(), false);
          bladeOk = !KB.charging && !mate.intent.fire;
          bladeInfo = { charging: KB.charging, fire: mate.intent.fire };
          const t0 = K.items.filter((it) => it.state === 'live').length;
          step(0.3);
          bladeInfo.liveAfter = K.items.filter((it) => it.state === 'live').length; bladeInfo.live0 = t0;
          bladeOk = bladeOk && bladeInfo.liveAfter === t0;
        }
        R('bots: a Cutlass bot\'s charged cut at an own idle web is dropped by its hold-fire (no cut, no wave: the web stands)', bladeOk, bladeInfo);
        // the kits' own bot paths ask webHit: a blast at the web's middle is refused, one 8 m off isn't; with a foe the team
        // knows standing in the web, it's fair (the chain goes off on the foe)
        reset();
        const W3 = []; for (let i = 0; i < 3; i++) W3.push(drop(me, 0, 4.5 + i * 3)); settle();
        const onWeb = !!K.webHit(me.team, 0, 0, 7.5, 2.2), offWeb = !!K.webHit(me.team, 8, 0, 7.5, 2.2);
        put(mate, V(0, 0, 0), 0); put(foe, V(0.5, 0, 8), Math.PI); wake(mate); step(0.6);
        const withFoe = !!K.webHit(me.team, 0, 0, 7.5, 2.2), seesFoe = !!mate.bot.sight?.sees(foe);
        stub(mate); parkAll();
        R('bots: webHit (the Glide\'s release, the Dash Pellet\'s pop, the Mitts\' leap landing ask it) — a blast at an own idle web is refused, 8 m off it isn\'t, with a foe the team sees in the web it isn\'t',
          onWeb && !offWeb && !withFoe && seesFoe, { onWeb, offWeb, withFoe, seesFoe });
      }
      // a teammate bot with sight of a chain shoots it when a foe enters R(N) − 0.3 — several trials (PAGE_ARGS reps=N,
      // default 5), every one within the time: one lucky run proves nothing about a 0.2 m target
      const REPS = +((/reps=(\d+)/.exec(window.__pageArgs || '') || [])[1] || 5);
      const trials = [];
      for (let k = 0; k < REPS; k++) {
        reset();
        // (the chain runs away from the bot; the foe comes in by its far end — out of the bot's own reach, so a duel isn't
        // the better shot: the chain is)
        const C = []; for (let i = 0; i < 3; i++) C.push(drop(me, 0, 3.5 + i * 3));
        settle();
        put(mate, V(0, 0, -2.0), 0); mate.setWeapon('shooter'); mate.bot.reset(); mate.bot._bob = null; mate.bot._bobSkip = null;
        // (it holds its ground — its brain runs, its legs don't: what it looks at and shoots is its own call. Not pinned in
        // place: a pinned bot that wants to walk hops to get unstuck, which no player standing there would do)
        { const up = brain0.get(mate); mate.bot.update = function (dt) { const r = up.call(this, dt); mate.intent.move.set(0, 0, 0); mate.intent.jump = false; return r; }; }
        put(foe, V(0, 0, 17.5), Math.PI);   // (in its sight first — it turns to face it — out of its reach, no chain near it)
        hook = null;
        step(1.0);
        const before = ev('bobber:trigger').length, cs0 = THREAT_STATS.chainShots || 0, bb0 = { ...BOBBER_BOT };
        put(foe, V(0.5, 0, 10.4), Math.PI);   // (12.4 m off: well in its sight, just out of its reach, 11.9)
        const tIn = G.time; let tGo = null;
        step(3.0, () => { foe.pos.y = 0.02; foe.vel.set(0, 0, 0); if (tGo == null && ev('bobber:trigger').length > before) tGo = G.time; });
        stub(mate); hook = null;
        const trg = ev('bobber:trigger')[before];
        trials.push({ dt: tGo != null ? r2(tGo - tIn) : null, by: trg?.e.by === mate, shots: (THREAT_STATS.chainShots || 0) - cs0, fired: BOBBER_BOT.fired - bb0.fired, gaveUp: BOBBER_BOT.gaveUp - bb0.gaveUp });
      }
      const allow = mate.bot.diff.reaction + 0.6;
      R(`bots: a teammate bot with sight of a chain shoots it when a foe enters R(N) − 0.3, within its reaction ${mate.bot.diff.reaction} + 0.6 s, credited to it — ${trials.filter((x) => x.dt != null && x.dt <= allow + 0.1 && x.by).length} of ${REPS} trials (times ${trials.map((x) => x.dt).join(', ')} s)`,
        trials.every((x) => x.dt != null && x.dt <= allow + 0.1 && x.by && x.shots > 0), { trials, allow });
      // an enemy bot shoots bobbers near its route (wave 1's device shooting: DEV_BOT.bobber)
      reset();
      const nb = drop(me, 2, -2); settle();
      put(foe, V(-2, 0, -9), 0); foe.setWeapon('shooter'); wake(foe);
      const devB0 = DEV_BOT.bobber;
      step(6, () => nb.state !== 'live' ? false : undefined);
      stub(foe);
      R('bots: an enemy bot with nothing better to shoot shoots an enemy bobber it can see (wave 1\'s device shooting: DEV_BOT.bobber, disarmed)', DEV_BOT.bobber > devB0 && nb.state !== 'live', { picks: DEV_BOT.bobber - devB0, state: nb.state });
      // prefer(): 0.7 near a bot's route ahead / within R(N) of it, 1.0 otherwise — per bot
      reset();
      const pb = drop(me, 0, 0); settle();
      const d = K.devices([]).find((x) => x.obj === pb);
      put(foe, V(1.0, 0, 0.5), 0); put(foe2, V(12, 0, 12), 0); step(2 / 60);
      const pA = d.prefer(foe.bot), pB = d.prefer(foe2.bot);
      R('bots: prefer(brain) is per bot — 0.7 for a bot standing in its reach, 1.0 for one far off its route', pA === 0.7 && pB === 1, { near: pA, far: pB });
      // danger discs: an armed chain (a foe of the chain's team seen with a line to it) — one disc per bobber, ≤ 48; unarmed none
      reset();
      for (let i = 0; i < 3; i++) drop(me, -3 + i * 3, 4);
      settle();
      put(foe, V(0, 0, 10), Math.PI); put(me, V(0, 0, 0), 0); wake(foe);
      hook = () => { foe.ink = 0; };   // (awake to see, out of ink: it doesn't shoot them)
      step(1.0);
      const L1 = specialDangers().filter((x) => x.src === 'bobber');
      const known = !!foe.bot.sight.sees(me);
      put(me, HOME, 0);
      R(`bots: an armed enemy chain (its owner seen by them, with a line to it) is a danger to their bots — one disc per bobber, R(N) + 0.3, lethal from N = 3, lingering, tIn 0.3`,
        L1.length === 3 && L1.every((x) => Math.abs(x.r - (K.sizeOf(3).R + 0.3)) < 1e-6 && x.lethal === 2 && x.linger && Math.abs(x.tIn - 0.3) < 1e-6), { discs: L1.length, r: L1.map((x) => r2(x.r)), known });
      step(2.2);
      const L2 = specialDangers().filter((x) => x.src === 'bobber');
      hook = null; stub(foe);
      R('bots: …an unarmed one (no foe of the chain\'s team known near it for 1.5 s) is none', L2.length === 0, { discs: L2.length });
      // 48 at most: three owners' webs of 24 (72 bobbers, every one of an armed chain — each owner in the foe's sight by
      // its web), so there are more candidates than the cap and the cap has to bite
      reset();
      const owners3 = [me, mate, mates[1] || mate];
      for (let i = 0; i < 72; i++) drop(owners3[Math.floor(i / 24)], -24 + (i % 12) * 4.2, -20 + Math.floor(i / 12) * 4.2);
      settle(0.6);
      owners3.forEach((o, i) => put(o, V(-10 + i * 8, 0, -4), 0));
      put(foe, V(0, 0, 4), Math.PI); wake(foe);
      hook = () => { foe.ink = 0; };
      step(1.2);
      const L3 = specialDangers().filter((x) => x.src === 'bobber');
      hook = null; stub(foe);
      R(`bots: at most ${B.dangerCap} bobber discs in all — a web of ${live().length} with ${BOBBER_BOT.cands} armed candidates, more than the cap: ${L3.length} discs`, BOBBER_BOT.cands > B.dangerCap && L3.length === B.dangerCap,
        { discs: L3.length, cands: BOBBER_BOT.cands, live: live().length, armedChains: BOBBER_BOT.armed });
    }

    // ============================================================================================ drawing, HUD, guide
    if (want('draw')) {
      reset();
      const L = []; for (let i = 0; i < 6; i++) L.push(drop(me, -6 + i * 2.6, -6));
      settle();
      g._skipRender = false; g._frame(DT);
      const calls = K.draw.calls(), ds = { ...K.DRAW_STATS };
      R('draw: the bobbers and their tethers are drawn instanced — 4 draw calls a team for every bobber, 1 for every tether (no mesh per bobber)', calls === 5 && ds.bobbers === 6 && ds.tethers === 5 && !G.scene.children.some((o) => o.name === 'bobber'), { calls, ds });
      // the HUD: your count, the CHAIN ×N callout with its ticks
      const H = g.hud;
      const cnt = H?.subBadge?.querySelector('.iw-bobc');
      R('draw: the HUD count by the sub badge shows your live bobbers (×6) with the oldest one\'s time ring', !!cnt && cnt.classList.contains('is-on') && /×6/.test(cnt.textContent), cnt && cnt.textContent);
      put(foe, V(L[2].spot.x, 0, L[2].spot.z + 0.3), 0); step(2 / 60); foe.hp = HP;
      S.blockShot(V(L[0].spot.x, 2.5, L[0].spot.z), V(L[0].spot.x, 0.4, L[0].spot.z), me.team, 36, me); step(0.5);
      const cx = H?.xh?.querySelector('.iw-bobx');
      R('draw: "CHAIN ×6" by the crosshair when your chain goes off, one tick per foe it caught', !!cx && cx.classList.contains('is-on') && /×6/.test(cx.textContent) && cx.querySelectorAll('span i').length === 1, { text: cx?.textContent, ticks: cx?.querySelectorAll('span i').length });
      // (the review) it never prints over the turf points the same chain's paint pops up by the crosshair: up and left of
      // the reticle, the pops below and right of it — at this window's size and at 960 × 600
      { const rc = (e) => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom }; }, hit = (p, q) => p.l < q.r && q.l < p.r && p.t < q.b && q.t < p.b;
        const xr = rc(H.xh), bx = rc(cx), pops = [...H.xh.querySelectorAll('.iw-tpop')].map(rc), tank = H.xh.querySelector('.iw-tank'), chip = H.xh.querySelector('.iw-subaim');
        const others = [...pops, ...(tank ? [rc(tank)] : []), ...(chip ? [rc(chip)] : [])];
        R(`draw: the CHAIN callout sits up and left of the reticle, clear of the turf pops (${pops.length} on screen), the ink tank and the sub chip`, bx.r <= xr.l - 20 && bx.b <= xr.t - 20 && !others.some((q) => hit(bx, q)), { callout: bx, centre: [xr.l, xr.t], pops }); }
      // the aim guide: the float marker over the landing ring, preview tethers to yours within 5 m, the ×N label
      reset();
      const g1 = drop(me, 0, 4), g2 = drop(me, 2, 4); settle();
      put(me, V(0, 0, -4), 0);
      const mb = me.bot.update; me.bot.update = () => { zero(me); me.intent.sub = true; me.bot.aimYaw = 0; me.bot.aimPitch = -0.35; };
      me.aimYaw = 0; me.aimPitch = -0.35;
      step(3 / 60);
      const gd = BOBBER_HUD.guide;
      me.aimYaw = 0; me.aimPitch = -0.35;
      const sp = K.predictSpot(me);
      me.ink = 0; me.bot.update = mb; step(2 / 60);
      R('draw: the aim guide (holding the throw): the float spot 1.0 m over where it lands, preview tethers to your bobbers within 5 m (and a line), "×N" the chain it would make', !!gd && !!sp && Math.abs(gd.y - sp.y) < 0.02 && Math.abs(gd.z - sp.z) < 0.3 && gd.links >= 1 && gd.n === 3, { gd, sp: sp && v3(sp) });
    }

    // ============================================================================================ MODE=tower: the real tower
    if (want('tower') && m.tower) {
      reset(); netOn();
      const T = m.tower, rules0 = T._rules;
      try {
        let drive = 0;
        T._rules = function () { if (drive) { this.s = Math.min(this.path.len[0] - 0.5, this.s + drive / 60); this.moving = 1; } else this.moving = 0; };
        const at = (s) => T.path.at(s, V(0, 0, 0));
        const s0 = T.s;
        // one on its deck (dropped onto it), one in its way, one beside its way (3.6 m off the centre line)
        const deckB = K.throwFrom(me, V(T.pos.x + 0.8, T.top + 0.6, T.pos.z + 0.8), V(0, -3, 0));
        const p1 = at(s0 + 4), p2 = at(s0 + 6), d2 = V(p2.x - at(s0 + 5.5).x, 0, p2.z - at(s0 + 5.5).z).normalize();
        const way = drop(me, p1.x, p1.z), side = drop(me, p2.x + d2.z * 3.6, p2.z - d2.x * 3.6);
        settle(0.6);
        const ridingDeck = !!deckB.rb?.on && G.deploy.isTowerBlock(deckB.rb.on.b);
        const rel = () => V(Math.hypot(deckB.spot.x - T.pos.x, deckB.spot.z - T.pos.z), deckB.spot.y - T.top, 0);
        const offs0 = rel();
        drive = 1.5;
        step(6.5);
        drive = 0;
        const offs1 = rel();
        const downs = ev('device:down').map((x) => x.e.how);
        R('tower: a bobber in the tower\'s way is crushed (one \'device:down\' how \'crush\'); one on its deck rides it (its spot on the deck kept); one 3.6 m off its line is left alone',
          way.state === 'dead' && ridingDeck && deckB.state === 'live' && offs0.distanceTo(offs1) < 0.2 && side.state === 'live' && downs.length === 1 && downs[0] === 'crush', { way: way.state, deck: deckB.state, riding: ridingDeck, drift: r2(offs0.distanceTo(offs1)), side: side.state, downs, s: [r2(s0), r2(T.s)], wayAt: v3(way.spot), state: m.state, winner: T.winner });
      } finally { T._rules = rules0; netOff(); }
      // bots in Tower Command: no bot bobber settles within 3.25 m of the track's centre line
      reset();
      const { towerPlan } = await import('./src/game/bots.js');
      // (one team's bots playing it out — the other team parked: a free run to the tower's way, and every throw they make
      // is one to judge; a full 4 v 4 fight on this small deck leaves them few quiet moments to set one up)
      const bots = m.actors.filter((a) => a.bot && a.team === me.team && a !== me);
      for (const a of bots) { a.setSub('bobber'); a.ink = 100; wake(a); }
      const spots = [];
      const offL = on('sub:land', (e) => { if (e.kind === 'bobber') spots.push(e.pos.clone()); });
      m.duration = 9999; m.time = 9999;
      // (60 s, and on to 120 s until four have settled; the other team parked as elsewhere — splatted, they stand on their
      // pad — so these bots fight as well as push; unopposed, the push reaches the goal in about 30 s, so the knockout is
      // held off meanwhile; their tanks kept at 70 or more: the ink economy isn't what this judges, where throws land is)
      const Tw = m.tower, end0 = Tw?._end;
      if (Tw) Tw._end = function () {};
      const tw0 = G.time;
      try { step(120, () => { for (const a of bots) a.ink = Math.max(a.ink, 70); if (G.time - tw0 >= 60 && spots.length >= 4) return false; }); }
      finally { if (Tw) Tw._end = end0; }
      const twT = Math.round(G.time - tw0);
      offL(); for (const a of bots) stub(a);
      const P2 = towerPlan();
      const dTrack = (p) => { let best = 1e9; for (let i = 1; i < P2.pts.length; i++) { const A = P2.pts[i - 1], Bp = P2.pts[i], dx = Bp.x - A.x, dz = Bp.z - A.z, Lq = dx * dx + dz * dz, t = Lq > 1e-9 ? Math.max(0, Math.min(1, ((p.x - A.x) * dx + (p.z - A.z) * dz) / Lq)) : 0; best = Math.min(best, Math.hypot(A.x + dx * t - p.x, A.z + dz * t - p.z)); } return best; };
      const near = spots.filter((p) => dTrack(p) < 3.25);
      // (how many settle in a minute or two is up to the fight — 0 to 9 in runs — so the planning rule is also asked
      // directly: one of these bots stood at 30 spots 1–9 m off the track, either side, along the tower's next 20 m, its set-up roll
      // forced each time; every spot it plans must be clear of the tower's way too)
      S.clear();   // (no chain under way: each ask is a new chain's set-up)
      const a0 = bots[0], b0 = a0.bot, pos0 = a0.pos.clone(), rnd0 = Math.random, plans = [];
      const fw = P2.fwdOf(a0.team);
      for (let i = 0; i < 30; i++) {
        // (along the tower's next 20 m — where a bot's set-ups go — 1–9 m off the line, either side)
        const sA = P2.T.s + fw * (1 + (i / 30) * 20), A = P2.at(sA), Bq = P2.at(sA + fw);
        const tx = Bq.x - A.x, tz = Bq.z - A.z, tl = Math.hypot(tx, tz) || 1, off = (1 + (i % 5) * 2) * (i % 2 ? 1 : -1);
        const x = A.x - (tz / tl) * off, z = A.z + (tx / tl) * off;
        put(a0, V(x, G.level.groundHeight(x, z, 5), z), Math.atan2(tx, tz));
        a0.ink = 100; a0.lastDamage = 99; b0.bombCd = 0; b0._bobRollT = -1; b0._bobberAt = null; b0._bobPlan = null; b0._bobNoSpotT = 0;   // (each a new chain's first link)
        let first = true; Math.random = () => (first ? ((first = false), 0) : rnd0());
        try { K.bot.paint(b0); } finally { Math.random = rnd0; }
        if (b0._bobberAt) plans.push(b0._bobberAt.clone());
      }
      b0._bobberAt = null; put(a0, pos0);
      const nearPlans = plans.filter((p) => dTrack(p) < 3.25);
      R(`tower: bots playing Tower Command with the bobber never settle one within 3.25 m of the track's centre line (${spots.length} settled in ${twT} s, nearest ${spots.length ? r2(Math.min(...spots.map(dTrack))) : '-'} m; ${plans.length} of 30 forced set-ups planned, nearest ${plans.length ? r2(Math.min(...plans.map(dTrack))) : '-'} m)`,
        near.length === 0 && plans.length >= 10 && nearPlans.length === 0, { settled: spots.length, nearest: spots.length ? r2(Math.min(...spots.map(dTrack))) : null, near: near.map(v3), plans: plans.length, nearPlans: nearPlans.map(v3), BOBBER_BOT, stats: K.BOBBER_STATS, state: m.state, subs: bots.map((a) => a.sub?.kind) });
    }

    // ============================================================================================ MODE=turf on podbox: a pod
    if (want('pod') && m.pods) {
      reset(); netOn();
      try {
        const Pd = m.pods, L = G.level;
        m.duration = 99999; m.time = m.duration - Pd.t;
        const p = Pd.pods.find((q) => q.kind === 'wall' && q.id === 'gate') || Pd.pods.find((q) => q.kind === 'wall');
        const along = (k, y) => V(p.x + k * p.c, y, p.z - k * p.s);
        const fy = L.groundHeight(along(1.6, 0).x, along(1.6, 0).z, 3);
        const b = K.throwFrom(me, along(1.6, fy + 0.6), V(0, -3, 0)); settle(0.6);
        const y0 = b.spot.y;
        Pd.grow(p, me.team, Pd.t);
        step(Pd.T.grow + 0.6);
        const tb = p.topPart.blk, ty = tb.center.y + tb.half.y;
        const onTop = !!b.rb?.on && p.parts.some((q) => q.blk === b.rb.on.b) && Math.abs(b.spot.y - (ty + 1.0)) < 0.06;
        const out2 = !b.rb?.on && b.state === 'live';
        R(`pod: a bramble wall growing under a bobber's foot lifts it onto its top and it rides it (or shoves it out — never crushed inside): ${onTop ? 'on top' : out2 ? 'shoved' : b.state}`, (onTop || out2) && b.state === 'live', { y0, y: r2(b.spot.y), top: r2(ty), onTop, state: b.state });
      } finally { netOff(); }
    }

    // ============================================================================================ MODE=zones: every guard sets up a chain
    if (want('zone') && m.zones) {
      S.clear(); P.clear(); K.resetBobberStats(); evs.length = 0;
      const { zonePlan } = await import('./src/game/bots.js');
      // (my team's three bots — mid-range kits — against nobody: they take the zone until the plan makes one a guard; from
      // then all three are held guards of the active zone (the plan reshuffles roles every few seconds: a bot it made guard
      // for 2 s isn't a guard's test), and each must have a 3–4 chain at its zone within 20 s)
      const team = me.team, bots = m.actors.filter((a) => a.bot && a.team === team && a !== me);
      for (const a of bots) { a.setWeapon('shooter'); a.setSub('bobber'); wake(a); a.ink = 100; }
      m.duration = 9999; m.time = 9999;
      const t0 = G.time;
      step(75, () => { void zonePlan(); if (bots.some((a) => a.bot.zRole === 'guard')) return false; });
      const zp = zonePlan(), roleOf0 = zp?.roleOf;
      const guardsAt = G.time - t0, bestOf = new Map(), atZone = new Map();
      if (zp) zp.roleOf = function (a) { return bots.includes(a) ? { role: 'guard', zone: this.Z.active.zones[0].id } : roleOf0.call(this, a); };
      BOBBER_BOT.logOn = true; BOBBER_BOT.log.length = 0;   // (the bots' set-up decisions: printed for a guard that falls short)
      // (and the objective doesn't rotate in the 20 s: a guard whose zone moves away mid-window has nothing to guard)
      const swap0 = m.zones.nextSwap; m.zones.nextSwap = Infinity;
      const tg = G.time;
      try {
        step(20, () => {
          const zi = zp.Z.active.zones[0].id, c = zp.Z.zones[zi].center, Rz = zp.info[zi].R;
          for (const a of bots) {
            if (a.bot.zRole === 'guard') atZone.set(a, (atZone.get(a) || 0) + 1 / 60);
            for (const x of K.items) if (x.owner === a && x.state === 'live' && Math.hypot(x.spot.x - c[0], x.spot.z - c[2]) < Rz + 6) bestOf.set(a, Math.max(bestOf.get(a) || 0, x.chain?.n || 1));
          }
        });
      } finally { if (zp) zp.roleOf = roleOf0; BOBBER_BOT.logOn = false; m.zones.nextSwap = swap0; }
      for (const a of bots) stub(a);
      const bests = bots.map((a) => bestOf.get(a) || 0);
      const short = bots.filter((a) => (bestOf.get(a) || 0) < 3).map((a) => ({ who: a.name, log: BOBBER_BOT.log.filter((e) => e.who === a.name).map((e) => ({ ...e, t: r2(e.t - tg) })) }));
      R(`zone: every guard bot with the bobber sets up a 3–4 chain at its zone within 20 s of being a guard (${bots.length} guards from ${r2(guardsAt)} s, best chains ${bests.join(', ')})`,
        guardsAt < 75 && bots.length === 3 && bests.every((n) => n >= 3), { guardsAt: r2(guardsAt), best: bests, guardS: bots.map((a) => r2(atZone.get(a) || 0)), short, BOBBER_BOT: { ...BOBBER_BOT, log: undefined } });
    }

    // ============================================================================================ MODE=boss: HULLBREAKER
    if (want('boss') && G.boss) {
      reset(); for (const a of m.actors) a.invuln = 99;
      const Bs = G.boss, calls = [];
      const sp0 = Bs.splash.bind(Bs), hp0 = Bs.hp;
      Bs.splash = function (a, c, Rr, mx, mn, wid, o) { if (wid === 'bobber') calls.push({ body: o?.body !== false }); return sp0(a, c, Rr, mx, mn, wid, o); };
      const hs = Bs.model.hitShapes.find((h) => h.active && !h.weak), bc = hs.pos.clone();
      const dir = V(me.pos.x - bc.x, 0, me.pos.z - bc.z).normalize(), side = V(-dir.z, 0, dir.x);
      const C = []; for (let i = 0; i < 6; i++) { const p = bc.clone().addScaledVector(dir, hs.r + 1.6).addScaledVector(side, (i - 2.5) * 2.2); C.push(drop(me, p.x, p.z, G.level.groundHeight(p.x, p.z, p.y + 3) + 0.6)); }
      settle(0.7);
      const n = live().length;
      S.blockShot(V(C[0].spot.x, C[0].spot.y + 1, C[0].spot.z), V(C[0].spot.x, C[0].spot.y - 0.5, C[0].spot.z), me.team, 36, me); step(1.0);
      Bs.splash = sp0;
      const bodyN = calls.filter((c) => c.body).length, crabN = calls.filter((c) => !c.body).length;
      R(`boss: a chain of ${n} beside HULLBREAKER — boss.splash with body: true exactly once and body: false for the rest (crablets every blast); the body's hp drops by one blast's damage at most`,
        n === 6 && bodyN === 1 && crabN === 5 && hp0 - Bs.hp <= 180 + 1e-6, { n, bodyN, crabN, hpDrop: r2(hp0 - Bs.hp) });
    }
  } catch (e) { R('harness error: ' + e.message, false, String(e.stack).slice(0, 1200)); }
  for (const f of offs) f();
  for (const a of m.actors) wake(a);
  return out;
})();
