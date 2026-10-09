// [b5-subs] The Scrap Sentry (src/game/kits/sentry.js; tools/botlab/jobs/batch5/subs/SPEC.md §B, its B10 list) and the
// one destroyer it rides on, G.deploy.crushIn (§0.3). The user: "A deployable that the player can place down, and it will
// shoot in a turret mode. It shoots with its Splattershot-like weapon. The weapon is made from recycled materials."
//   MAP=testbox MODE=turf PAGE=tools/botlab/tests/sub-sentry.js tools/botlab/run.sh tools/botlab/page.cjs
//   MAP=testbox MODE=tower … PAGE_ARGS='only=tower'      MAP=halyard MODE=zones … PAGE_ARGS='only=zones'
//   PAGE_ARGS='only=place,spawn,unfold,sight,fire,skip,life,device,crush,movers,net,bots,hud' (MODE=turf, the default set)
// Staged on testbox (a flat deck, top y 0; a 4 m wall x 14…15, z ±8; pads at z ±44, spawnBarrier 4.2); everyone parked
// far off with their brains stubbed but where a scene says; hits logged, not dealt, where a scene says so. Checks:
//  - place: on flat ground 0.9 m ahead; at the feet when a wall is closer; refused (one "Can't use", the ink kept, the
//    callout's reason line) in mid-air 3 m up, on a roof, in water, 6 m from the enemy pad, by a teammate's sentry 3.9 m
//    off — placed at 4.1 m, and beside its own older one (replaced: [2, gid, 3]); a lava stand-in (G.match.lava): refused
//    where it is or comes within 1 s, placed on the dry half; every reason is B9's text;
//  - spawn: a foe 5.0 m from its own pad is never locked or fired on (5 s); at 5.4 m it is; a sentry carried on a test
//    mover to 8.0 m from the enemy pad folds ([2, gid, 3]); spawnBarrier 5.0 moves every threshold (9.0 / 6.0 m);
//  - unfold: no round before 0.6 s, even with a foe in its face;
//  - sight: a kid in the open at 10 m locked (the lock 0.4 s ± 1 frame to the first round) and fired on; behind the wall
//    or at 12 m not; a still squid in its own ink at 3 m not, at 1.5 m yes; a swimmer at 6 m noticed after ≥ 0.45 s; the
//    rays come out of botSight's shared budget (SIGHT_STATS.rays); a stand-in Bazookarp shell between: not locked;
//  - fire: bursts of 3, 0.11 s apart, 0.5 s between, 22 a hit, weaponId 'sentry'; the 5th hit on a dummy 6 m off at
//    1.43 s ± 2 frames from the lock's start (spread off); every round hits still dummies at 8, 10, 11 m (level and 1.5 m
//    lower: the drop solved); a dummy strafing at 6 m/s at 9 m takes under 35 % of 200+ rounds (spread on);
//  - skip: a Bubble Guard, more than 1 s of spawn protection, a Kraken: never locked; it takes the hurtable foe instead;
//  - life: the tank drains over 15 s; at 15 s it folds with no blast and no 'device:down' ([2, gid, 0]); its owner
//    splatted, it folds at once ([2, gid, 3]);
//  - device: 4 Spritzer rounds (not 3), 1 full charge, 2 Splat Bombs (not 1), 1 roller roll take it down (each its
//    'device:down' { how 'shot', by }, the owner's "SENTRY DOWN" note, [2, gid, 1]); its own team's shot passes through,
//    its own bomb does nothing; 'device:hit' gives the shooter's marker and the white flash shows; a ghost shot (netMuted)
//    only flashes it; a hit on a ghost sentry goes to its owner (sendDevHit, with the attacker);
//  - crush: G.deploy.crushIn with blocks / sphere / where / standingOn / liquid, the kit's lavaSweep and a scripted
//    era:flip (floor in off; a block in on round it) each end it with the matching how — every ending exactly one
//    'device:down' and one counter step; the tower's crush leaves a Lurk Mine to be pushed (the lead's rule: crushIn's
//    blocks shape is the user's list); the stage registry forwards (G.match.stage.crushIn);
//  - movers: on a moving block it rides (3 m along, turned 0.5 rad) and keeps firing, the owner's word [4, …, tag, …]; a
//    block rising under it lifts it on, one coming from the side shoves it out, one boxing it in against walls crushes it
//    (wave 1's _pushes: one 'device:down'); its block taken away: no floor below → it ends with no event;
//  - net: the owner's records ([0] set down, [3] lock, [6] burst, [5] hp, [2] end) and a ghost built from them unfolds,
//    locks, flashes its bursts and ends on the owner's word; dropOwner ends a leaver's ghost at once, quietly;
//  - bots: a Spritzer bot it locks onto shoots it down; a roller bot it locks onto, out of reach, leaves its range or
//    sight within 3 s; a bot with nothing better picks an idle enemy sentry (DEV_BOT.sentry); a fighting bot sets one
//    down; it's a turret threat and a route-only danger (botSpecials: no escape from it);
//  - hud: holding the sub shows the guide (the ghost and the 11 m ring; team colour when good, grey + × when not); the
//    life ring on the badge runs down; the minimap draws it;
//  - tower (MODE=tower): the tower's body crushes it ('device:down' how 'crush', [2, gid, 2]); on the deck it rides and
//    fires; a rider bot sets one on the deck;
//  - zones (MODE=zones): a guard bot sets one down at its zone.
(async () => {
  const g = window.__inkwave, m = g.match, dbg = g.debug, THREE = await import('three');
  const { SUBS, PLAYER, WEAPONS } = await import('./src/config.js');
  const { SUB_KITS } = await import('./src/game/kits/registry.js');
  const DEP = await import('./src/game/deployables.js');
  const DB = await import('./src/game/deployables-bots.js');
  const { SIGHT_STATS } = await import('./src/game/botSight.js');
  const BS = await import('./src/game/botSpecials.js');
  const { on, emit } = await import('./src/core/ctx.js');
  const SEN = await import('./src/game/kits/sentry.js');
  const G = window.__G, P = G.projectiles, S = G.subs, K = SUB_KITS.sentry, ST = DEP.DEPLOY_STATS, s = SUBS.sentry;
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const ONLY = (/only=([\w,]+)/.exec(window.__pageArgs || '') || [])[1];
  const DEFAULT = 'place,spawn,unfold,sight,fire,skip,life,device,crush,movers,net,bots,hud';
  const want = (k) => (ONLY || DEFAULT).split(',').includes(k);
  dbg.freeze();
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const r2 = (x) => Math.round(x * 100) / 100, r3 = (x) => Math.round(x * 1000) / 1000, v2 = (v) => [r2(v.x), r2(v.y), r2(v.z)];
  const DT = 1 / 60;
  let hook = null;
  const frame = () => { if (hook) hook(); g._skipRender = true; g._frame(DT); g._skipRender = false; };
  const step = (sec, fn) => { const n = Math.max(1, Math.round(sec * 60)); for (let i = 0; i < n; i++) { frame(); if (fn && fn(i) === false) return i; } return n; };
  const me = m.local, others = m.actors.filter((a) => a !== me);
  const foes = others.filter((a) => a.team !== me.team), mates = others.filter((a) => a.team === me.team);
  const foe = foes[0], foe2 = foes[1], foe3 = foes[2], mate = mates[0];
  const zero = (a) => { const it = a.intent; it.move.set(0, 0, 0); it.fire = it.squid = it.jump = it.sub = it.special = false; };
  const stub = (a) => { if (a.bot) { if (!a.bot._u0) a.bot._u0 = a.bot.update; a.bot.update = () => { zero(a); if (a._int) a._int(a.intent); }; } };
  const unstub = (a) => { if (a.bot && a.bot._u0) { a.bot.update = a.bot._u0; a.bot.reset(); } };
  for (const a of m.actors) stub(a);
  const put = (a, p, yaw = 0) => { a.pos.copy(p); a.pos.y += 0.02; a.vel.set(0, 0, 0); a.yaw = a.aimYaw = yaw; a.aimPitch = 0; a.grounded = true; if (a.bot) { a.bot.aimYaw = yaw; a.bot.aimPitch = 0; } };
  const BOX = /box$/.test(G.level.layout?.id || ''), pad = (t) => G.level.spawnPads[t];
  const HOME = BOX ? V(-20, 0, -30) : V(pad(me.team).x, pad(me.team).y, pad(me.team).z);
  const parkAll = () => others.forEach((a, i) => put(a, BOX ? V(-22 + (i % 4) * 2, 0, 34 + Math.floor(i / 4) * 2) : V(pad(a.team).x + (i % 4) - 1.5, pad(a.team).y, pad(a.team).z + Math.floor(i / 4) - 0.5)));
  if (G.fx) { G.fx.onDropletLand = null; G.fx.onSpeck = null; }
  const weapons0 = new Map(m.actors.map((a) => [a, a.weaponId])), subs0 = new Map(m.actors.map((a) => [a, a.subId]));
  const sub0 = { ...s };
  const hit0 = P.applyHit;
  let hits = [];
  const logHits = (on1) => { P.applyHit = on1 ? function (att, vic, dmg, wid) { hits.push({ t: G.time, att, vic, dmg, wid }); } : hit0; };
  const reset = () => {
    hook = null; logHits(false); Object.assign(s, sub0);
    if (m.duration) m.time = m.duration;
    for (const a of m.actors) { if (a.specialActive) { try { G.specials.end(a, 'test'); } catch (e) { /* */ } a.specialActive = null; } }
    G.specials.clear(); S.clear(); P.clear(); G.paint.clear();
    for (const a of m.actors) {
      if (!a.alive) a.respawn();
      a.hp = PLAYER.hp; a.invuln = 0; a.ink = PLAYER.inkMax; a.special = 0; zero(a); a.form = 'kid'; a.superJumpState = null; stub(a); a._int = null;
      a.status.track = 0; a.status.reveal = 0; a.status.poison = 0; a.status.shield = 0; a.status.trackTeam = -1; a.lastDamage = 99;
      if (a.weaponId !== weapons0.get(a)) a.setWeapon(weapons0.get(a));
      a.weaponRunner.reset();
    }
    if (me.subId !== 'sentry') me.setSub('sentry');
    if (mate.subId !== 'sentry') mate.setSub('sentry');
    parkAll(); put(me, HOME, 0);
    if (G.match) G.match.lava = undefined;
    G.objTargets = undefined;
    step(0.1);
    hits = [];
  };
  // events
  const evs = [];
  for (const n of ['device:hit', 'device:down', 'bomb:explode', 'sub:destroyed', 'sub:cantuse', 'sub:note', 'sentry:lock', 'sentry:fire', 'sub:use', 'sub:end'])
    on(n, (e) => evs.push({ n, t: G.time, kind: e.kind || (e.obj ? 'sentry' : null), how: e.how, by: e.attacker || e.by || null, dmg: e.damage, reason: e.reason, text: e.text, obj: e.obj || null, target: e.target || null, actor: e.actor || null, why: e.why }));
  const since = (i, n) => evs.slice(i).filter((e) => e.n === n);
  let markers = 0;
  if (g.hud?.hitMarker) { const hm = g.hud.hitMarker.bind(g.hud); g.hud.hitMarker = (k) => { markers++; return hm(k); }; }
  // the local session stub (deployables.js's): records what the owner sends; nothing leaves the page
  const sent = [];
  const netOn = () => { m.actors.forEach((a, i) => { if (a.nid === undefined) { a.nid = i; a._tnid = true; } }); G.netm = { mute: 0, applying: false, isHost: true, byNid: new Map(m.actors.map((a) => [a.nid, a])), recSplat() {}, recProj() {}, recBomb() {}, recZone() {}, recTower() {}, recPods() {}, recBoss() {}, recMover() {}, recStage() {},
    recKit: (a, kind, data) => sent.push({ a, kind, data: JSON.parse(JSON.stringify(data)), t: G.time }), sendDevHit: (o, kind, id, d, by) => sent.push({ dh: true, kind, id, d, by }), shouldApplyHit: () => 'local', sendHit: () => false, applyRemote() {}, sendResult() {}, sendEnd() {} }; sent.length = 0; };
  const netOff = () => { G.netm = null; for (const a of m.actors) if (a._tnid) { delete a.nid; delete a._tnid; } };
  const recs = (gid, op) => sent.filter((x) => x.kind === 'sentry' && x.data && x.data[1] === gid && (op === undefined || x.data[0] === op)).map((x) => x.data);
  // the release of the held sub, through the weapon runner (the "Can't use" path and the ink, as a player's)
  const release = (a) => { const wr = a.weaponRunner; wr.aimingSub = true; wr.update(DT, { fire: false, firePressed: false, sub: false, subReleased: true, jump: false, squid: false, move: V(0, 0, 0) }); };
  const live = () => K.items.filter((x) => x.state !== 'dead');
  const mine = (o = me) => K.items.find((x) => x.owner === o && x.state !== 'dead' && !x.ghost);
  // set down by `o` standing at p facing yaw (through use(): the real spot rules) → the sentry, or null
  const plant = (o, p, yaw = 0) => { put(o, p, yaw); o.ink = PLAYER.inkMax; G.subs.use(o, SUBS.sentry); return mine(o) || null; };
  const ready = (it) => step(s.setup + 0.05, () => it.state !== 'watch');
  const aimAt = (a, p) => { const dx = p.x - a.pos.x, dz = p.z - a.pos.z, dy = p.y - (a.pos.y + 1.1); a.yaw = a.aimYaw = Math.atan2(dx, dz); a.aimPitch = Math.atan2(dy, Math.hypot(dx, dz)); if (a.bot) { a.bot.aimYaw = a.aimYaw; a.bot.aimPitch = a.aimPitch; } a.aimPoint.copy(p); };
  const L = G.level;
  const blocks = [];
  const box = (c, half, o = {}) => { const b = L.addDynamic({ tag: o.tag || `test:sentry${blocks.length}`, ...o }); L.moveDynamic(b, c, half, o.yaw || 0); blocks.push(b); return b; };
  const unbox = (b) => { b.solid = false; L.moveDynamic(b, V(1e4, -60, 1e4 + blocks.indexOf(b) * 3), V(0.1, 0.1, 0.1), 0); };
  const deckBlock = (p) => G.physics.raycast(V(p.x, p.y + 0.5, p.z), V(0, -1, 0), 2).block;

  try {
    // ============================================================================================ placement
    if (want('place')) {
      reset();
      put(me, V(0, 0, -6), 0); release(me);
      const it = mine();
      R('placed on flat ground 0.9 m ahead along the aim (through the runner: ink −65)', it && Math.abs(it.pos.z - (-5.1)) < 0.02 && Math.abs(it.pos.x) < 0.02 && Math.abs(it.pos.y) < 0.02 && Math.abs(me.ink - (PLAYER.inkMax - s.inkCost)) < 1e-6, it && { at: v2(it.pos), ink: me.ink });
      reset();
      const w = plant(me, V(13.0, 0, 0), Math.PI / 2);
      R('a wall closer than the spot ahead (0.4 m clearance): at the feet instead', w && Math.abs(w.pos.x - 13.0) < 0.03, w && v2(w.pos));
      // the refusals, through the runner: "Can't use" once, the ink kept, the reason line under it (B9's words)
      const refuse = (label, setup, want) => {
        reset(); setup(); const ink0 = me.ink, e0 = evs.length, n0 = live().length;
        if (g.hud) g.hud._denyT = -1e9;   // (the callout's own 140 ms guard against repeats: these come back to back)
        release(me);
        const cu = since(e0, 'sub:cantuse'), made = live().length - n0, why = g.hud?.denyWhy?.textContent;
        return { label, cantuse: cu.length, reason: cu[0]?.reason, hud: why, ink: me.ink === ink0, made, ok: cu.length === 1 && cu[0].reason === want && why === want && me.ink === ink0 && made === 0 };
      };
      const ground = K.WHY.ground;
      const rows = [];
      rows.push(refuse('mid-air 3 m up', () => { put(me, V(0, 3, -6), 0); me.grounded = false; }, ground));
      const roof = box(V(6, 0.5, -16), V(1.5, 0.5, 1.5), { roof: true, tag: 'test:roof' });
      rows.push(refuse('on a roof (a railcar roof is one)', () => { put(me, V(6, 1.0, -16), 0); }, ground));
      unbox(roof);
      const sea = box(V(-10, -1.9, -16), V(2, 0.1, 2), { tag: 'test:seafloor' });
      rows.push(refuse('in water (a floor under the sea)', () => { put(me, V(-10, -1.8, -16), 0); }, ground));
      unbox(sea);
      rows.push(refuse('6 m from the enemy pad', () => { put(me, V(0, 0, pad(1 - me.team).z - 6 * Math.sign(pad(1 - me.team).z)), 0); }, K.WHY.spawn));
      R(`refused with "Can't use" (once), the ink kept and the callout's reason line: ${rows.map((r) => `${r.label} — "${r.reason}"`).join('; ')}`, rows.every((r) => r.ok), rows);
      // a teammate's live sentry
      reset();
      const ms = plant(mate, V(0, 0, -10), 0);
      const tz = ms.pos.z;
      const near = refuse('3.9 m from a teammate\'s', () => { plant(mate, V(0, 0, -10), 0); put(me, V(0, 0, tz - 3.9), 0); }, K.WHY.spacing);
      reset();
      const ms2 = plant(mate, V(0, 0, -10), 0); const tz2 = ms2.pos.z;
      put(me, V(0, 0, tz2 - 4.1), 0); release(me);
      const far = mine(); const d41 = far ? r2(Math.hypot(far.pos.x - ms2.pos.x, far.pos.z - ms2.pos.z)) : null;
      R(`a teammate's live sentry 3.9 m away: refused ("${near.reason}"); at 4.1 m: placed (${d41} m from it; facing it — the spot ahead is too close, the feet aren't)`, near.ok && far && Math.abs(d41 - 4.1) < 0.05, { near, placedAt: d41 });
      // its own older one 1 m off doesn't block: replaced (folded: [2, gid, 3])
      reset(); netOn();
      try {
        const a1 = plant(me, V(0, 0, -6), 0);
        const a2 = plant(me, V(0, 0, -5.4), 0);
        step(0.05);
        R('its own older sentry 1 m off doesn\'t block it: the new one stands, the old one folds ([2, gid, 3]); one each', a1 && a2 && a1 !== a2 && a1.state === 'dead' && a2.state !== 'dead' && recs(a1.gid, 2).some((d) => d[2] === 3) && live().filter((x) => x.owner === me).length === 1, { old: a1 && a1.state, recs: a1 && recs(a1.gid) });
      } finally { netOff(); }
      // a lava stand-in (caldera's contract): x < 0 is lava now; 0 ≤ x < 2 is where it arrives within 1 s
      reset();
      G.match.lava = { surfaceAt: (x) => (x < 0 ? 0.3 : -Infinity), under: () => false, covers: (x, z, gy, ahead) => x < 0 || (ahead >= 1 && x < 2) };
      const lv = [refuse('lava now', () => { G.match.lava = { surfaceAt: (x) => (x < 0 ? 0.3 : -Infinity), under: () => false, covers: (x, z, gy, ahead) => x < 0 || (ahead >= 1 && x < 2) }; put(me, V(-4, 0, -6), 0); }, ground),
        refuse('lava within 1 s', () => { G.match.lava = { surfaceAt: (x) => (x < 0 ? 0.3 : -Infinity), under: () => false, covers: (x, z, gy, ahead) => x < 0 || (ahead >= 1 && x < 2) }; put(me, V(1, 0, -6), 0); }, ground)];
      reset(); G.match.lava = { surfaceAt: (x) => (x < 0 ? 0.3 : -Infinity), under: () => false, covers: (x, z, gy, ahead) => x < 0 || (ahead >= 1 && x < 2) };
      const dry = plant(me, V(5, 0, -6), 0);
      R(`a lava stand-in (G.match.lava.covers): refused where it is ("${lv[0].reason}") and where it arrives within 1 s; placed on the dry half`, lv.every((r) => r.ok) && !!dry, { lv, dry: dry && v2(dry.pos) });
      G.match.lava = undefined;
      // a stage module's no-place disc (G.level.noPlace)
      reset();
      const np0 = L.noPlace; L.noPlace = (p, r) => Math.hypot(p.x - 3, p.z + 6) < 2 + r;
      const np = refuse('a no-place disc', () => { put(me, V(3, 0, -6.9), 0); }, ground);
      L.noPlace = np0;
      R('a stage module\'s no-place disc (G.level.noPlace) refuses it', np.ok, np);
    }

    // ============================================================================================ spawn rules
    if (want('spawn')) {
      // a foe standing 5.0 m from its own pad, in the open, 9 m from the sentry: never locked or fired on; at 5.4 m it is
      const fp = pad(foe.team), toward = -Math.sign(fp.z);
      const scene = (dPad, sb) => {
        reset(); logHits(true);
        const sb0 = L.spawnBarrier; if (sb != null) L.spawnBarrier = sb;
        try {
          const fz = fp.z + toward * dPad;
          const it = plant(me, V(0, 0, fz + toward * 9 - toward * 0.9), toward > 0 ? 0 : Math.PI);
          put(me, HOME, 0);
          put(foe, V(0, 0, fz), Math.PI);
          const e0 = evs.length;
          step(5, () => { foe.hp = PLAYER.hp; });
          return { locks: since(e0, 'sentry:lock').filter((e) => e.target === foe).length, shots: since(e0, 'sentry:fire').length, d: r2(Math.hypot(foe.pos.x - fp.x, foe.pos.z - fp.z)), sentry: it && r2(it.pos.distanceTo(foe.pos)) };
        } finally { L.spawnBarrier = sb0; logHits(false); }
      };
      const a = scene(5.0), b = scene(5.4);
      R('a foe 5.0 m from its own pad (in the open, 9 m off) is never locked or fired on in 5 s; at 5.4 m it is (spawnBarrier + 1)', a.locks === 0 && a.shots === 0 && b.locks >= 1 && b.shots > 0, { at50: a, at54: b });
      const c = scene(5.8, 5.0), d = scene(6.2, 5.0);
      // placement with spawnBarrier 5.0: 8.8 m refused, 9.2 m placed
      reset();
      const sb0 = L.spawnBarrier; L.spawnBarrier = 5.0;
      const ep = pad(1 - me.team), tw = -Math.sign(ep.z);
      put(me, V(0, 0, ep.z + tw * 8.8), tw > 0 ? Math.PI : 0); const e1 = evs.length; release(me); const ref = since(e1, 'sub:cantuse')[0]?.reason;
      reset(); L.spawnBarrier = 5.0;
      put(me, V(0, 0, ep.z + tw * 9.2), tw > 0 ? Math.PI : 0); release(me); const ok92 = !!mine();
      L.spawnBarrier = sb0;
      R(`spawnBarrier 5.0 moves the thresholds with it: targeting 6.0 m (5.8 never locked, 6.2 locked), placement 9.0 m (8.8 refused "${ref}", 9.2 placed)`, c.locks === 0 && d.locks >= 1 && ref === K.WHY.spawn && ok92, { at58: c, at62: d, ref, ok92 });
      // carried on a test mover toward the enemy pad: it folds at 8.2 m ([2, gid, 3])
      reset(); netOn();
      try {
        const half = V(1.2, 0.3, 1.2), cc = V(0, 0.3, ep.z + tw * 14);
        const mv = box(cc, half, { tag: 'test:carrier' });
        put(me, V(cc.x, 0.6, cc.z), tw > 0 ? 0 : Math.PI); me.pos.y = 0.62;
        const it = plant(me, V(cc.x, 0.6, cc.z + tw * 0.0), tw > 0 ? Math.PI : 0); put(me, HOME, 0);
        step(0.1);
        let foldAt = null;
        step(4, () => { cc.z -= tw * 2 / 60; L.moveDynamic(mv, cc, half, 0); if (foldAt == null && it.state === 'dead') { foldAt = r2(Math.hypot(it.pos.x - ep.x, it.pos.z - ep.z)); return false; } });
        unbox(mv);
        R(`a sentry riding a test mover toward the enemy pad folds as it gets within spawnBarrier + 4 (at ${foldAt} m), with [2, gid, 3]`, it && it.rb && foldAt != null && foldAt <= 8.2 && foldAt > 7.9 && recs(it.gid, 2).some((x) => x[2] === 3), { foldAt, recs: it && recs(it.gid) });
      } finally { netOff(); }
    }

    // ============================================================================================ unfold
    if (want('unfold')) {
      reset();
      put(foe, V(0, 0, -2), Math.PI);
      const e0 = evs.length, t0 = G.time;
      const it = plant(me, V(0, 0, -6), 0); put(me, HOME, 0);
      step(1.2, () => { foe.hp = PLAYER.hp; });
      const first = since(e0, 'sentry:fire')[0];
      R(`it unfolds for ${s.setup} s (shootable, not firing): its first round ${first ? r3(first.t - t0) : '—'} s after it was set down, a foe 3 m in front of it`, first && first.t - t0 >= s.setup - 1e-6, { first: first && r3(first.t - t0) });
    }

    // ============================================================================================ sight
    if (want('sight')) {
      // a kid at 10 m in the open: locked (0.4 s ± 1 frame from the lock to its first round) and fired on
      reset(); logHits(true);
      const it = plant(me, V(0, 0, -10), 0); put(me, HOME, 0); ready(it);
      const r0 = SIGHT_STATS.rays;
      put(foe, V(0, 0, it.pos.z + 10), Math.PI);
      const e0 = evs.length;
      step(1.5, () => { foe.hp = PLAYER.hp; });
      const lk = since(e0, 'sentry:lock')[0], f1 = since(e0, 'sentry:fire')[0];
      const lockDt = lk && f1 ? r3(f1.t - lk.t) : null;
      R(`a kid 10 m off in the open: locked (${lockDt} s from the lock to its first round: ${s.lock} s ± 1 frame) and fired on; its looks used botSight's shared ray budget (${SIGHT_STATS.rays - r0} rays)`, lk && lk.target === foe && Math.abs(lockDt - s.lock) <= DT + 1e-6 && hits.some((h) => h.vic === foe) && SIGHT_STATS.rays > r0, { lockDt, hits: hits.length, rays: SIGHT_STATS.rays - r0 });
      // behind the wall / at 12 m: not
      const notSeen = (setup) => { reset(); logHits(true); const t = plant(me, V(10, 0, 0), Math.PI / 2); put(me, HOME, 0); ready(t); setup(t); const e = evs.length; step(2, () => { foe.hp = PLAYER.hp; }); return { locks: since(e, 'sentry:lock').length, shots: since(e, 'sentry:fire').length }; };
      const wall = notSeen(() => put(foe, V(17.5, 0, 0), -Math.PI / 2));
      const far = notSeen((t) => put(foe, V(t.pos.x - 12.2, 0, t.pos.z), Math.PI / 2));
      R('a kid behind the wall (8 m off) is not locked, nor one 12 m off in the open', wall.locks === 0 && wall.shots === 0 && far.locks === 0 && far.shots === 0, { wall, far });
      // squids in their own ink: still at 3 m not seen, at 1.5 m seen; a swimmer at 6 m noticed after ≥ 0.45 s
      const squid = (d, swim) => {
        reset(); logHits(true);
        const t = plant(me, V(0, 0, -10), 0); put(me, HOME, 0); ready(t);
        const c = V(0, 0, t.pos.z + d);
        // (a still one sits in a patch of its ink; a swimmer swims a lane of it across the sentry's front, ~9 m/s)
        for (let x = swim ? -8 : -2.5; x <= (swim ? 8 : 2.5); x += 2.5) G.paint.splat(V(x, 0.2, c.z), 2.6, foe.team, { seed: 5 + x });
        put(foe, swim ? V(-7, 0, c.z) : c, swim ? Math.PI / 2 : Math.PI);
        foe._int = (it2) => { it2.squid = true; if (swim) it2.move.set(1, 0, 0); };
        const e = evs.length, tS = G.time;
        let swimmingAt = null;
        step(swim ? 1.4 : 2.5, () => { foe.hp = PLAYER.hp; foe.pos.z = c.z; if (swim && swimmingAt == null && foe.anim?.form === 'swim' && Math.hypot(foe.vel.x, foe.vel.z) > 2) swimmingAt = G.time; if (!swim) { foe.pos.x = c.x; foe.vel.set(0, foe.vel.y, 0); } });
        foe._int = null;
        const lk2 = since(e, 'sentry:lock').filter((x) => x.target === foe)[0];
        return { locks: since(e, 'sentry:lock').filter((x) => x.target === foe).length, form: foe.anim?.form, noticeAfter: lk2 && swimmingAt != null ? r3(lk2.t - swimmingAt) : lk2 ? r3(lk2.t - tS) : null };
      };
      const sq3 = squid(3, false), sq15 = squid(1.5, false), sw6 = squid(6, true);
      R(`a still squid in its own ink: not seen at 3 m (${sq3.locks} locks), seen at 1.5 m (${sq15.locks}); a swimmer at 6 m noticed ${sw6.noticeAfter} s after it was in its view swimming (≥ 0.45 s)`,
        sq3.locks === 0 && sq15.locks >= 1 && sw6.locks >= 1 && sw6.noticeAfter >= 0.45 - 1e-6, { sq3, sq15, sw6 });
      // a stand-in Bazookarp shell between it and a foe in range: never locked
      reset(); logHits(true);
      const t2 = plant(me, V(0, 0, -10), 0); put(me, HOME, 0); ready(t2);
      put(foe, V(0, 0, t2.pos.z + 8), Math.PI);
      const shell = { c: V(0, 0.8, t2.pos.z + 4), r: 1.8, solid: true };
      G.objTargets = { spheres: (o) => { o.push(shell); return o; }, splash() {} };
      const e3 = evs.length; step(2, () => { foe.hp = PLAYER.hp; });
      const shellLocks = since(e3, 'sentry:lock').length;
      G.objTargets = undefined;
      const e4 = evs.length; step(1, () => { foe.hp = PLAYER.hp; });
      R('a stand-in Bazookarp shell (G.objTargets.spheres) between it and a foe in range: not locked; the shell gone, it is', shellLocks === 0 && since(e4, 'sentry:lock').length >= 1, { shellLocks, after: since(e4, 'sentry:lock').length });
    }

    // ============================================================================================ fire
    if (want('fire')) {
      // bursts of 3, 0.11 s apart, 0.5 s between, 22 a hit; the 5th hit at 1.43 s ± 2 frames from the lock's start (6 m)
      reset(); logHits(true); s.spread = 0;
      const it = plant(me, V(0, 0, -10), 0); put(me, HOME, 0); ready(it);
      put(foe, V(0, 0, it.pos.z + 6), Math.PI);
      const e0 = evs.length;
      step(3.2, () => { foe.hp = PLAYER.hp; });
      const lk = since(e0, 'sentry:lock')[0], fs = since(e0, 'sentry:fire').map((e) => e.t), hs = hits.filter((h) => h.vic === foe);
      const gaps = fs.slice(1, 7).map((t, i) => r3(t - fs[i]));
      const fifth = hs[4] && lk ? r3(hs[4].t - lk.t) : null;
      R(`bursts of 3: gaps ${gaps.join(' / ')} s (0.11, 0.11, 0.5 …, ± 1 frame); every hit 22, credited 'sentry' to its owner`,
        gaps.length >= 5 && Math.abs(gaps[0] - 0.11) <= DT && Math.abs(gaps[1] - 0.11) <= DT && Math.abs(gaps[2] - 0.5) <= DT && Math.abs(gaps[3] - 0.11) <= DT && hs.length >= 5 && hs.every((h) => h.dmg === 22 && h.wid === 'sentry' && h.att === me), { gaps, hits: hs.slice(0, 6).map((h) => [r3(h.t - (lk ? lk.t : 0)), h.dmg, h.wid]) });
      R(`a standing dummy 6 m off (spread off): the 5th hit ${fifth} s from the lock's start (1.43 s ± 2 frames)`, fifth != null && Math.abs(fifth - 1.43) <= 2 * DT + 1e-6, { fifth });
      // every round hits still dummies at 8, 10, 11 m (level), and on a platform 1.5 m up, at 8, 10, 11 m below it
      const allHit = (lift) => {
        reset(); logHits(true); s.spread = 0;
        let plat = null, y = 0;
        if (lift) { plat = box(V(-8, 0.75, -20), V(1.6, 0.75, 1.6), { tag: 'test:perch' }); y = 1.5; }
        const t = plant(me, V(-8, y, -20.9), 0); put(me, HOME, 0); ready(t);
        const res = [];
        for (const d of [8, 10, 11]) {
          put(foe, V(t.pos.x, 0, t.pos.z + d), Math.PI);
          const e = evs.length, h0 = hits.length;
          step(2.6, () => { foe.hp = PLAYER.hp; t.t = Math.min(t.t, 5); });
          const shots = since(e, 'sentry:fire').length;
          // (then it holds its fire — no lock — while the last rounds land)
          hook = () => { t.lockT = 0; t.locked = false; foe.hp = PLAYER.hp; };
          step(0.7); hook = null;
          const hh = hits.slice(h0).filter((h) => h.vic === foe).length;
          res.push({ d, shots, hits: hh });
        }
        if (plat) unbox(plat);
        return res;
      };
      const lvl = allHit(false), low = allHit(true);
      R(`the drop is solved (spread off): every round hits still dummies at 8 / 10 / 11 m — level ${lvl.map((r) => `${r.hits}/${r.shots}`).join(', ')}; 1.5 m below ${low.map((r) => `${r.hits}/${r.shots}`).join(', ')}`,
        [...lvl, ...low].every((r) => r.shots >= 3 && r.hits === r.shots), { lvl, low });
      // a dummy strafing at 6 m/s at 9 m (spread on): under 35 % of 200+ rounds
      reset(); logHits(true); s.life = 1e4;
      const t3 = plant(me, V(0, 0, -16), 0); put(me, HOME, 0); ready(t3);
      const cz = t3.pos.z + 9; let x = 0, dir = 1;
      put(foe, V(0, 0, cz), Math.PI);
      const e5 = evs.length, h5 = hits.length;
      hook = () => { x += dir * 6 * DT; if (Math.abs(x) > 3) { x = Math.sign(x) * 3; dir = -dir; } foe.pos.set(x, 0.02, cz); foe.vel.set(dir * 6, 0, 0); foe.hp = PLAYER.hp; };
      let n = 0; step(60, () => { n = evs.length; return since(e5, 'sentry:fire').length < 210; });
      hook = null;
      const shots = since(e5, 'sentry:fire').length, hh = hits.slice(h5).filter((h) => h.vic === foe).length;
      R(`a dummy strafing at 6 m/s at 9 m (spread on, ${s.spread}°): ${hh} of ${shots} rounds hit (${r2(hh / Math.max(1, shots) * 100)} %: under 35 %, crude aim, no lead)`, shots >= 200 && hh / shots < 0.35, { shots, hits: hh });
      void n;
    }

    // ============================================================================================ skips
    if (want('skip')) {
      const skip = (setup, label) => {
        reset(); logHits(true);
        const it = plant(me, V(0, 0, -10), 0); put(me, HOME, 0); ready(it);
        put(foe, V(0, 0, it.pos.z + 5), Math.PI); put(foe2, V(3, 0, it.pos.z + 8), Math.PI);
        setup(foe);
        const e0 = evs.length;
        step(2, () => { foe2.hp = PLAYER.hp; setup.keep?.(foe); });
        const lk = since(e0, 'sentry:lock');
        const res = { label, foe: lk.filter((e) => e.target === foe).length, other: lk.filter((e) => e.target === foe2).length, hitsFoe: hits.filter((h) => h.vic === foe).length };
        if (foe.specialActive) { try { G.specials.end(foe, 'test'); } catch (e) { /* */ } foe.specialActive = null; }
        foe.status.shield = 0; foe.invuln = 0;
        return res;
      };
      const bub = skip(Object.assign((a) => { a.status.shield = 6; }, { keep: (a) => { a.status.shield = 6; } }), 'Bubble Guard');
      const inv = skip(Object.assign((a) => { a.invuln = 2.5; }, { keep: (a) => { a.invuln = 2.5; } }), 'spawn protection');
      const kr = skip((a) => { a.specialId = 'kraken'; a.special = a.specialCost(); a._startSpecial(); }, 'Kraken');
      R(`it never locks the untouchable — ${[bub, inv, kr].map((r) => `${r.label}: ${r.foe}`).join(', ')} — and takes the hurtable foe further off instead`, [bub, inv, kr].every((r) => r.foe === 0 && r.other >= 1 && r.hitsFoe === 0), [bub, inv, kr]);
    }

    // ============================================================================================ life
    if (want('life')) {
      reset(); netOn();
      try {
        const it = plant(me, V(0, 0, -10), 0); put(me, HOME, 0);
        const lv = [];
        let e0 = evs.length;
        step(16, (i) => { if (i % 60 === 0) lv.push(r2(it.m.win.scale.y)); return it.state !== 'dead'; });
        const t15 = r2(it.t);
        const falls = lv.every((x, i) => i === 0 || x <= lv[i - 1]) && lv[0] > 0.9 && lv[lv.length - 1] < 0.15;
        R(`its tank drains over its life (${lv.join(' ')}); at ${t15} s it folds — no blast, no 'device:down', [2, gid, 0]`, falls && Math.abs(t15 - s.life) <= DT * 1.5 && !since(e0, 'bomb:explode').length && !since(e0, 'device:down').length && recs(it.gid, 2).some((x) => x[2] === 0), { lv, t: t15, recs: recs(it.gid, 2) });
        reset(); netOn();
        const it2 = plant(me, V(0, 0, -10), 0); step(0.3);
        e0 = evs.length;
        me.hp = PLAYER.hp; me.splat(null, 'test'); step(0.05);
        R('its owner splatted: it folds at once ([2, gid, 3]), no \'device:down\'', it2.state === 'dead' && recs(it2.gid, 2).some((x) => x[2] === 3) && !since(e0, 'device:down').length, { state: it2.state, recs: recs(it2.gid, 2) });
        if (!me.alive) me.respawn();
      } finally { netOff(); }
    }

    // ============================================================================================ device rules
    if (want('device')) {
      const C = V(0, 0, -8);
      const SRC = {
        spritzer: { want: 4, run(sh, it) { const p = V(it.pos.x - 5, it.pos.y + 0.36, it.pos.z); P.fireCustom(sh, p, V(1, 0, 0), { type: 'shot', speed: 40, damage: WEAPONS.shooter.damage, range: 12, straight: 1, grav: 0, drag: 0, weaponId: 'shooter' }); step(0.2); } },
        charger: { want: 1, prep(sh) { sh.setWeapon('charger'); }, run(sh, it) { const p = V(it.pos.x, it.pos.y + 0.36, it.pos.z); put(sh, V(p.x - 9, 0, p.z), Math.PI / 2); step(0.05); aimAt(sh, p); step(2 / 60); aimAt(sh, p); P.fireCharger(sh, WEAPONS.charger, 1); step(2 / 60); } },
        bomb: { want: 2, run(sh, it) { P._explodeBomb({ pos: V(it.pos.x + 1.2, it.pos.y + 0.2, it.pos.z), team: sh.team, owner: sh, sp: false }); step(2 / 60); } },
        roller: { want: 1, prep(sh) { sh.setWeapon('roller'); }, run(sh, it) { put(sh, V(it.pos.x - 3.2, 0, it.pos.z), Math.PI / 2); step(0.05); sh._int = (x) => { x.fire = true; x.move.set(1, 0, 0); }; step(0.9, () => it.state !== 'dead'); sh._int = null; zero(sh); step(0.05); } },
      };
      const rows = {};
      for (const [k, src] of Object.entries(SRC)) {
        reset(); netOn();
        try {
          src.prep?.(foe); foe.ink = PLAYER.inkMax;
          const it = plant(me, C, Math.PI); put(me, HOME, 0);
          put(foe, V(C.x + 9, 0, C.z + 9), 0);
          const e0 = evs.length, m0 = markers, d0 = ST.down.sentry || 0;
          let n = 0, flashed = false;
          while (it.state !== 'dead' && n < 8) { src.run(foe, it); n++; if (it.flashOn || it.flash > 0) flashed = true; if (k === 'roller') break; }
          step(0.05);
          const dn = since(e0, 'device:down'), note = since(e0, 'sub:note');
          rows[k] = { uses: n, want: src.want, down: dn.length, how: dn[0]?.how, by: dn[0]?.by === foe, step: (ST.down.sentry || 0) - d0, note: note[0]?.text, rec: recs(it.gid, 2).map((x) => x[2]), markers: markers - m0, flashed, hpLeft: it.hp };
        } finally { netOff(); if (foe.weaponId !== weapons0.get(foe)) foe.setWeapon(weapons0.get(foe)); }
      }
      R(`120 hp: down to ${Object.entries(rows).map(([k, r]) => `${r.uses} ${k}`).join(', ')} (the spec: 4 Spritzer rounds, 1 full charge, 2 Splat Bombs, 1 roller roll) — each one 'device:down' { how 'shot', by the shooter } and one counter step, the owner's "SENTRY DOWN", [2, gid, 1]`,
        Object.values(rows).every((r) => r.uses === r.want && r.down === 1 && r.how === 'shot' && r.by && r.step === 1 && r.note === 'SENTRY DOWN' && r.rec.length === 1 && r.rec[0] === 1), rows);
      // the hit marker (the shooter's: the local player) and the white flash
      reset();
      const it = plant(mate, C, 0); put(mate, HOME.clone().add(V(3, 0, 0)), 0);
      const m0 = markers;
      P.fireCustom(foe, V(C.x - 5, 0.36, it.pos.z), V(1, 0, 0), { type: 'shot', speed: 40, damage: 36, range: 12, straight: 1, grav: 0, drag: 0, weaponId: 'shooter' });
      let fl = false; step(0.2, () => { if (it.flashOn) fl = true; });
      const mFoe = markers - m0;
      const ms0 = markers;
      // (the local player's own shot at an enemy sentry: a sentry of the other team's owner)
      const es = plant(foe, V(6, 0, -8), Math.PI); put(foe, V(22, 0, 4), 0);
      put(me, V(1, 0, -8), Math.PI / 2);
      P.fireCustom(me, V(1.5, 0.36, es.pos.z), V(1, 0, 0), { type: 'shot', speed: 40, damage: 36, range: 12, straight: 1, grav: 0, drag: 0, weaponId: 'shooter' });
      step(0.25);
      R(`'device:hit' gives the shooter's hit marker (the local player's shot: ${markers - ms0}; a bot's: ${mFoe}) and the hit flashes it white`, markers - ms0 >= 1 && mFoe === 0 && fl, { local: markers - ms0, bot: mFoe, flash: fl });
      // own team's fire: a shot passes through (not absorbed), a bomb does nothing
      reset();
      const own = plant(me, C, 0); put(me, HOME, 0);
      const absorbed = S.blockShot(V(C.x - 3, 0.36, own.pos.z), V(C.x + 3, 0.36, own.pos.z), me.team, 36, mate);
      P._explodeBomb({ pos: V(own.pos.x + 1, 0.2, own.pos.z), team: me.team, owner: mate, sp: false }); step(0.05);
      R('its own team\'s fire does nothing: a shot isn\'t even absorbed, a bomb leaves it at 120', !absorbed && own.hp === s.hp && own.state !== 'dead', { absorbed, hp: own.hp });
      // a ghost shot (netMuted): a flash, nothing else
      reset(); netOn();
      try {
        const it2 = plant(me, C, 0); put(me, HOME, 0); step(0.05);
        G.netm.mute++;
        const blk = S.blockShot(V(C.x - 3, 0.36, it2.pos.z), V(C.x + 3, 0.36, it2.pos.z), foe.team, 36, foe);
        G.netm.mute--;
        const f2 = it2.flash > 0;
        R('a ghost shot (netMuted) passing through it only flashes it: no damage, no record', blk && f2 && it2.hp === s.hp && !recs(it2.gid, 5).length, { hp: it2.hp, flash: f2 });
        // a hit on a remote player's (a ghost) sentry goes to its owner, with the attacker
        K.ghost(foe, [0, 777001, 4, 0, -14, 0, 1, 0, Math.PI]);
        const gh = K.items.find((x) => x.gid === 777001);
        put(me, V(-1, 0, -14), Math.PI / 2);
        P.fireCustom(me, V(1.5, 0.36, -14), V(1, 0, 0), { type: 'shot', speed: 40, damage: 36, range: 12, straight: 1, grav: 0, drag: 0, weaponId: 'shooter' });
        step(0.2);
        const dh = sent.filter((x) => x.dh && x.kind === 'sentry');
        R('a hit on a ghost sentry (a remote player\'s) goes to its owner (sendDevHit kind \'sentry\', its gid, the damage, the attacker); its hp here untouched', gh && dh.length === 1 && dh[0].id === 777001 && dh[0].d === 36 && dh[0].by === me && gh.hp === s.hp, { dh: dh.map((x) => ({ id: x.id, d: x.d, by: x.by && x.by.nid })), hp: gh && gh.hp });
        // the owner's side: netHurt with the attacker → down, its 'device:down'.by
        const it3 = mine();
        const e9 = evs.length;
        K.netHurt(it3.gid, 130, foe2);
        const dn = since(e9, 'device:down')[0];
        R('the owner\'s side of it (netHurt, the attacker passed on): down, \'device:down\'.by is that attacker, [2, gid, 1]', dn && dn.by === foe2 && dn.how === 'shot' && recs(it3.gid, 2).some((x) => x[2] === 1), { by: dn && dn.by && dn.by.nid });
      } finally { netOff(); }
    }

    // ============================================================================================ the one destroyer
    if (want('crush')) {
      const C = V(2, 0, -10);
      const once = (label, how, kill) => {
        reset(); netOn();
        try {
          const it = plant(me, C, 0); put(me, HOME, 0); step(0.05);
          const e0 = evs.length, c0 = { ...ST.crushed }, d0 = { ...ST.down };
          const n = kill(it);
          step(0.05);
          const dn = since(e0, 'device:down');
          const dc = Object.keys({ ...ST.crushed, ...c0 }).reduce((s2, k) => s2 + ((ST.crushed[k] || 0) - (c0[k] || 0)), 0) + Object.keys({ ...ST.down, ...d0 }).reduce((s2, k) => s2 + ((ST.down[k] || 0) - (d0[k] || 0)), 0);
          return { label, ret: n, gone: it.state === 'dead', events: dn.length, how: dn[0]?.how, steps: dc, rec: recs(it.gid, 2).map((x) => x[2]), ok: it.state === 'dead' && dn.length === 1 && dn[0].how === how && dc === 1 && recs(it.gid, 2).length === 1 && recs(it.gid, 2)[0][2] === 2 };
        } finally { netOff(); }
      };
      const rows = [];
      rows.push(once('blocks', 'crush', (it) => { const b = box(V(it.pos.x, 0.5, it.pos.z), V(0.6, 0.6, 0.6), { tag: 'test:crusher' }); const n = G.deploy.crushIn({ blocks: [b] }, 'crush'); unbox(b); return n; }));
      rows.push(once('sphere', 'shell', (it) => G.deploy.crushIn({ sphere: { c: V(it.pos.x + 0.8, 0.6, it.pos.z), r: 1 } }, 'shell')));
      rows.push(once('where', 'lava', (it) => G.deploy.crushIn({ where: (p) => p.distanceTo(it.pos) < 0.05 }, 'lava')));
      rows.push(once('standingOn', 'flip', (it) => G.deploy.crushIn({ standingOn: [deckBlock(it.pos)] }, 'flip')));
      rows.push(once('liquid', 'lava', () => G.deploy.crushIn({ liquid: -3 }, 'lava')));
      rows.push(once('lavaSweep', 'lava', (it) => K.lavaSweep((p) => p.distanceTo(it.pos) < 0.05)));
      rows.push(once('era:flip off', 'flip', (it) => { emit('era:flip', { group: 0, on: [], off: [deckBlock(it.pos)], r: 0 }); return 1; }));
      rows.push(once('era:flip on', 'flip', (it) => { const b = box(V(it.pos.x, 0.4, it.pos.z), V(0.8, 0.4, 0.8), { tag: 'test:eraon' }); emit('era:flip', { group: 0, on: [b.id], off: [], r: 0 }); unbox(b); return 1; }));
      rows.push(once('stage registry', 'lava', (it) => (G.match.stage ? G.match.stage.crushIn({ where: (p) => p.distanceTo(it.pos) < 0.05 }, 'lava') : G.deploy.crushIn({ where: (p) => p.distanceTo(it.pos) < 0.05 }, 'lava'))));
      R(`G.deploy.crushIn and the kit's own endings each end it with the matching how, exactly one 'device:down' and one counter step, [2, gid, 2]: ${rows.map((r) => `${r.label} → ${r.how}`).join(', ')}`, rows.every((r) => r.ok), rows);
      // the blocks shape is the user's list: a sprinkler / beacon in the box ends, a Lurk Mine is left (wave 1 pushes it)
      reset();
      const gh = G.physics.raycast(V(-6, 3, -14), V(0, -1, 0), 6);
      const bea = S._plant(foe, SUBS.beacon, gh.point.clone(), gh.normal.clone(), 0, gh, false);
      const gm = G.physics.raycast(V(-4.6, 3, -14), V(0, -1, 0), 6);
      const mn = S._plant(foe, SUBS.mine, gm.point.clone(), gm.normal.clone(), 0, gm, false);
      const sen = plant(me, V(-5.3, 0, -15.5), 0); put(me, HOME, 0); step(0.05);
      const big = box(V(-5.3, 0.6, -14), V(1.6, 0.6, 1.6), { tag: 'test:bigcrush' });
      const nb = G.deploy.crushIn({ blocks: [big] }, 'crush'); unbox(big);
      const nm = G.deploy.crushIn({ sphere: { c: mn.pos.clone(), r: 0.5 } }, 'shell');
      R(`the blocks shape (the tower's) is the user's list: a Hop Beacon and a sentry in it end (${nb}), a Lurk Mine is left for wave 1 to push aside; the sphere shape (the shell) ends the mine too (${nm})`, nb === 2 && bea.state === 'dead' && sen.state === 'dead' && nm === 1 && mn.state === 'dead', { nb, nm, beacon: bea.state, mine: mn.state, sentry: sen.state });
    }

    // ============================================================================================ movers
    if (want('movers')) {
      reset(); netOn();
      try {
        // riding: on a moving block's top, 3 m along and turned 0.5 rad — at its spot, still firing
        const half = V(1.6, 0.3, 1.6), cc = V(-8, 0.3, -12);
        const plat = box(cc, half, { tag: 'test:ride' });
        const top = cc.y + half.y;
        put(me, V(cc.x, top, cc.z - 0.6), 0); me.pos.y = top + 0.02;
        const it = plant(me, V(cc.x, top, cc.z - 0.6), 0); put(me, HOME, 0);
        ready(it); step(0.05);
        const rec4 = recs(it.gid, 4);
        const loc = (p) => { const d = p.clone().sub(plat.center); return [d.dot(plat.axes[0]), d.dot(plat.axes[1]), d.dot(plat.axes[2])]; };
        const l0 = loc(it.pos), y0 = SEN && it.m.outer.rotation.y;
        logHits(true);
        put(foe, V(cc.x + 2, 0, cc.z + 8), Math.PI);
        let yaw = 0, drift = 0;
        const e0 = evs.length;
        step(2, () => { cc.x += 1.5 / 60; yaw += 0.25 / 60; L.moveDynamic(plat, cc, half, yaw); foe.hp = PLAYER.hp; const l = loc(it.pos); drift = Math.max(drift, Math.hypot(l[0] - l0[0], l[1] - l0[1], l[2] - l0[2])); });
        const turned = r2(angle(it.m.outer.rotation.y - y0));
        R(`on a moving block it rides (3 m along, turned 0.5 rad: at its spot within ${r3(drift)} m, its base turned ${turned} rad) and keeps firing (${since(e0, 'sentry:fire').length} rounds); the owner's word [4, gid, …, 'test:ride', …]`,
          it.state === 'watch' && drift < 0.05 && Math.abs(turned - 0.5) < 0.03 && since(e0, 'sentry:fire').length >= 3 && rec4.length >= 1 && rec4[0][5] === 'test:ride', { drift: r3(drift), turned, rec4 });
        logHits(false);
        // its block taken away, no floor under it (out over the sea): it ends, no event
        step(2.2, () => { cc.x = Math.max(-32, cc.x - 14 / 60); L.moveDynamic(plat, cc, half, 0); });
        const e1 = evs.length;
        plat.solid = false; L.moveDynamic(plat, V(1e4, -60, 1e4), V(0.1, 0.1, 0.1), 0);
        step(0.1);
        R('its block taken away with no floor below: it ends ([2, gid, 2]) with no \'device:down\'', it.state === 'dead' && !since(e1, 'device:down').length && recs(it.gid, 2).length === 1, { state: it.state, at: v2(it.pos), recs: recs(it.gid, 2) });
        // a block rising under it lifts it onto its top; one coming from the side shoves it out
        reset(); netOn();
        const s2 = plant(me, V(6, 0, -12), 0); put(me, HOME, 0); ready(s2);
        const lc = V(s2.pos.x, -0.45, s2.pos.z), lh = V(0.9, 0.4, 0.9);
        const lift = box(lc, lh, { tag: 'test:lift' });
        step(1.2, () => { lc.y = Math.min(0.3, lc.y + 0.9 / 60); L.moveDynamic(lift, lc, lh, 0); });
        const lifted = s2.rb.on && s2.rb.on.b === lift && Math.abs(s2.pos.y - (lc.y + lh.y)) < 0.03;
        unbox(lift); step(0.2);
        const s3 = plant(me, V(6, 0, -18), 0); put(me, HOME, 0); ready(s3);
        const p3 = s3.pos.clone(), sc = V(3.5, 0.6, s3.pos.z), sh = V(0.7, 0.6, 0.7);
        const shover = box(sc, sh, { tag: 'test:shove' });
        step(1.2, () => { sc.x += 1.6 / 60; L.moveDynamic(shover, sc, sh, 0); });
        const shoved = s3.state !== 'dead' && s3.pos.distanceTo(p3) > 0.4 && !L.pointInBlock(shover, V(s3.pos.x, s3.pos.y + 0.2, s3.pos.z), 0);
        unbox(shover);
        R(`a block rising under it lifts it onto its top (riding it: ${!!lifted}); one coming from the side shoves it out (${r2(s3.pos.distanceTo(p3))} m, never inside it)`, lifted && shoved, { lifted, shoved, s2: v2(s2.pos), s3: v2(s3.pos) });
        // boxed in against the wall (walls on its other sides): crushed — one 'device:down' (wave 1's), [2, gid, 2]
        reset(); netOn();
        const s4 = plant(me, V(13.0, 0, 0), Math.PI / 2); put(me, HOME, 0); ready(s4);
        s4.pos.set(13.62, 0, 0);
        const w1 = box(V(12.8, 1, 1.15), V(1.2, 1, 0.5), { tag: 'test:sideA' }), w2 = box(V(12.8, 1, -1.15), V(1.2, 1, 0.5), { tag: 'test:sideB' });
        const pc = V(11.4, 0.7, 0), ph = V(0.5, 0.7, 0.55);
        const pusher = box(pc, ph, { tag: 'test:pusher' });
        const e2 = evs.length;
        step(1.5, () => { pc.x = Math.min(13.4, pc.x + 1.4 / 60); L.moveDynamic(pusher, pc, ph, 0); return s4.state !== 'dead'; });
        const dn = since(e2, 'device:down');
        for (const b of [w1, w2, pusher]) unbox(b);
        R(`boxed in by walls, a block pushing into it crushes it: exactly one 'device:down' (how '${dn[0]?.how}'), [2, gid, 2]`, s4.state === 'dead' && dn.length === 1 && dn[0].how === 'crush' && recs(s4.gid, 2).length === 1 && recs(s4.gid, 2)[0][2] === 2, { state: s4.state, events: dn.length, recs: recs(s4.gid, 2) });
      } finally { netOff(); }
    }

    // ============================================================================================ online records + ghosts
    if (want('net')) {
      reset(); netOn();
      try {
        logHits(true);
        const it = plant(me, V(0, 0, -10), 0); put(me, HOME, 0); ready(it);
        put(foe, V(0, 0, it.pos.z + 6), Math.PI);
        step(2, () => { foe.hp = PLAYER.hp; });
        it.hp = 100; K.netHurt(it.gid, 30, foe); step(0.2);
        const r0 = recs(it.gid, 0)[0], r3l = recs(it.gid, 3), r6 = recs(it.gid, 6), r5 = recs(it.gid, 5);
        R('the owner records: [0, gid, x, y, z, nx, ny, nz, yaw] set down, [3, gid, nid] its lock, [6, gid, yaw, pitch] each burst, [5, gid, hp] after hits',
          r0 && Math.abs(r0[2] - it.pos.x) < 0.02 && Math.abs(r0[4] - it.pos.z) < 0.02 && r0[6] === 1 && r3l.some((d) => d[2] === foe.nid) && r6.length >= 2 && r5.some((d) => d[2] === 70), { r0, r3: r3l, r6: r6.length, r5 });
        // a ghost from those records, on this screen: it unfolds there, locks (the tell), flashes its bursts, ends on [2]
        const gid = 778001, p = it.pos;
        const fx0 = []; const mz0 = G.fx?.muzzle; if (G.fx) G.fx.muzzle = (...a) => { fx0.push(G.time); return mz0?.apply(G.fx, a); };
        K.ghost(mate, [0, gid, r2(p.x + 3), r2(p.y), r2(p.z), 0, 1, 0, 0]);
        const gh = K.items.find((x) => x.gid === gid);
        step(0.8);
        const e0 = evs.length;
        K.ghost(mate, [3, gid, foe.nid]);
        step(0.1);
        const lk = since(e0, 'sentry:lock').filter((e) => e.obj === gh);
        K.ghost(mate, [6, gid, 0, 0]);
        step(0.4);
        const flashes = fx0.length;
        const shotsBefore = sent.filter((x) => x.kind === 'sentry' && x.data[1] === gid).length;
        K.ghost(mate, [2, gid, 1]);
        step(0.05);
        if (G.fx) G.fx.muzzle = mz0;
        R(`a ghost from the records: set down there (${gh && v2(gh.pos)}), unfolded (${gh && gh.state}), the lock tell on [3] (${lk.length}), ${flashes} muzzle flashes on [6] (3), gone on [2, gid, 1] (shot down: the tin burst); it never records nor fires real rounds`,
          gh && lk.length === 1 && flashes >= 3 && gh.state === 'dead' && gh.why === 'shot' && shotsBefore === 0, { flashes, lock: lk.length, state: gh && gh.state, why: gh && gh.why });
        // dropOwner: a leaver's ghost goes at once, quietly
        K.ghost(foe, [0, 778002, 3, 0, -20, 0, 1, 0, 0]);
        const g2 = K.items.find((x) => x.gid === 778002);
        const e1 = evs.length;
        K.dropOwner(foe);
        R('dropOwner (its owner left the room): its ghost is gone at once, with no \'device:down\' and no record', g2 && g2.state === 'dead' && !since(e1, 'device:down').length, { state: g2 && g2.state });
      } finally { netOff(); logHits(false); }
    }

    // ============================================================================================ bots
    if (want('bots')) {
      const hideFoes = (x, keep = []) => m.actors.filter((a) => a.team !== x.team && !keep.includes(a)).forEach((a, i) => put(a, V(21 + (i % 3) * 1.5, 0, -3 + Math.floor(i / 3) * 1.5), 0));
      // a Spritzer bot it locks onto shoots it down
      reset();
      foe.setWeapon('shooter'); foe.ink = PLAYER.inkMax;
      const it = plant(me, V(0, 0, -8), 0);
      put(me, V(20, 0, 30), 0);   // (the owner far off, out of the bot's sight: only the sentry to deal with)
      hideFoes(foe); put(foe, V(0, 0, it.pos.z + 9), Math.PI);
      unstub(foe);
      let lockT = null, downT = null;
      const e0 = evs.length;
      step(6, () => { foe.ink = PLAYER.inkMax; foe.hp = PLAYER.hp; if (lockT == null && since(e0, 'sentry:lock').length) lockT = G.time; if (it.state === 'dead') { downT = G.time; return false; } });
      stub(foe);
      const dn = since(e0, 'device:down')[0];
      R(`a Spritzer bot it locks onto shoots it down (${downT && lockT ? r2(downT - lockT) + ' s after the lock' : 'not'}; the threat system: a turret locked on it)`, it.state === 'dead' && dn && dn.by === foe, { lockT, downT, by: dn && dn.by && dn.by.nid });
      foe.setWeapon(weapons0.get(foe));
      // a roller bot it locks onto, out of reach: leaves its range or sight within 3 s
      reset();
      foe.setWeapon('roller'); foe.ink = PLAYER.inkMax;
      // (the owner 14 m behind it, in the roller's sight: the roller comes for them, past the sentry — locked on the way)
      const it2 = plant(me, V(0, 0, -8), 0); put(me, V(0, 0, it2.pos.z - 14), 0);
      hideFoes(foe); put(foe, V(0, 0, it2.pos.z + 9), Math.PI);
      // (its walk up to an enemy device to roll it — deployables-bots — off for this scene: locked out of its reach,
      // the threat system's evade is what's tested; with it on, a roller walks into its flick window and flicks it)
      DB.DEV_AI.enabled = false;
      unstub(foe);
      let lock2 = null, outT = null;
      const e1 = evs.length, trace = [];
      const eye = () => V(it2.pos.x, it2.pos.y + s.eyeH, it2.pos.z);
      let evaded = false;
      step(6, (i) => { foe.hp = PLAYER.hp; me.hp = PLAYER.hp; if (lock2 != null && foe.bot.thrAct === 'evade' && foe.bot.thr?.obj === it2) evaded = true; if (i % 15 === 0) trace.push([r2(G.time), foe.bot.mode, foe.bot.thrAct, !!foe.bot.thr, r2(Math.hypot(foe.pos.x - it2.pos.x, foe.pos.z - it2.pos.z)), r2(foe.intent.move.x), r2(foe.intent.move.z)]); if (lock2 == null && since(e1, 'sentry:lock').length) lock2 = G.time; if (lock2 != null && outT == null) { const d = Math.hypot(foe.pos.x - it2.pos.x, foe.pos.z - it2.pos.z); if (d > s.range + 0.3 || !G.physics.los(eye(), V(foe.pos.x, foe.pos.y + 1, foe.pos.z))) { outT = G.time; return false; } } });
      stub(foe); DB.DEV_AI.enabled = true;
      R(`a roller bot it locks onto, out of reach (coming for its owner past it): evades (the threat system: ${evaded}) and is out of its range or sight ${outT && lock2 ? r2(outT - lock2) + ' s' : 'never'} after the lock (within 3 s)`, lock2 != null && outT != null && outT - lock2 <= 3 && evaded, { lock2, outT, evaded, at: v2(foe.pos), trace });
      foe.setWeapon(weapons0.get(foe));
      // with nothing better to shoot: a bot picks an idle enemy sentry (deployables-bots.js: DEV_BOT.sentry)
      reset();
      foe.setWeapon('shooter'); foe.ink = PLAYER.inkMax;
      const it3 = plant(me, V(0, 0, -8), Math.PI); put(me, V(20, 0, 30), 0);
      hideFoes(foe); put(foe, V(0, 0, it3.pos.z + 12.6), Math.PI);
      const p0 = DB.DEV_BOT.sentry;
      unstub(foe);
      step(3, () => { foe.ink = PLAYER.inkMax; foe.hp = PLAYER.hp; return DB.DEV_BOT.sentry === p0; });
      stub(foe);
      R(`a bot with nothing better to shoot picks an idle enemy sentry it can see (deployables-bots: DEV_BOT.sentry ${p0} → ${DB.DEV_BOT.sentry})`, DB.DEV_BOT.sentry > p0, { picks: DB.DEV_BOT.sentry - p0 });
      foe.setWeapon(weapons0.get(foe));
      // the danger model: an enemy sentry is a route-only danger (linger, turret: no escape, no guard)
      reset();
      const it4 = plant(me, V(0, 0, -8), 0); put(me, HOME, 0); step(0.1);
      const dl = BS.specialDangers().find((d) => d.src === 'sentry' && d.obj === it4);
      R('botSpecials lists it: a disc of its range, a sight line needed (los), lethal 1, lingering (route cost), big; a turret (no escape or guard from it)', dl && dl.r === s.range && dl.los && dl.lethal === 1 && dl.linger && dl.vis === 'big' && dl.turret, dl && { r: dl.r, los: dl.los, lethal: dl.lethal, linger: dl.linger, vis: dl.vis, turret: dl.turret });
      // the threat descriptor and its score: 2.0 locked on the bot in range, 0.6 in range, 0 out of it
      reset();
      const it5 = plant(me, V(0, 0, -8), 0); put(me, HOME, 0); ready(it5);
      put(foe, V(0, 0, it5.pos.z + 7), Math.PI);
      step(1.2, () => { foe.hp = PLAYER.hp; });
      const thr = K.threats([]).find((x) => x.obj === it5);
      const sc = [foe.bot._threatScore(thr), foe2.bot._threatScore(thr)];
      put(foe2, V(0, 0, it5.pos.z + 8), Math.PI); const scIn = foe2.bot._threatScore(thr);
      R(`a turret threat (bots.js _threatScore): ${sc[0]} locked on the bot in range, ${scIn} in range, ${sc[1]} out of it`, thr && thr.turret && sc[0] === 2 && scIn === 0.6 && sc[1] === 0, { sc, scIn });
      // a fighting bot sets one down 0.9 m ahead toward the fight (its own fight hook: a foe 6–14 m off)
      reset();
      mate.ink = PLAYER.inkMax; mate.lastDamage = 9;
      put(mate, V(0, 0, -8), 0);
      const b = mate.bot; let went = false;
      for (let i = 0; i < 400 && !went; i++) went = K.bot.fight(b, 9);
      const bcd = b.bombCd;
      R(`a fighting bot sets one down (bot.fight: a foe 6–14 m off, not hit for 1 s, 2.5 % a frame; then bombCd ${r2(bcd)} s, 10–14)`, went && bcd >= 10 && bcd <= 14, { went, bombCd: bcd });
    }

    // ============================================================================================ HUD + guide
    if (want('hud')) {
      reset();
      put(me, V(0, 0, -6), 0);
      me._int = (x) => { x.sub = true; };   // (holding the sub button)
      step(0.15);
      const gd = K._guide();
      const okLook = !!gd && gd.root.visible && gd.ok && !gd.cross.visible && gd.mat.color.getHex() === me.color.getHex() && Math.abs(gd.ring.scale.x - s.range) < 1e-6;
      put(me, V(0, 3, -6), 0); me.grounded = false;
      step(0.15, () => { me.pos.y = 3.02; me.vel.set(0, 0, 0); });
      const badLook = !!gd && gd.root.visible && !gd.ok && gd.cross.visible && gd.mat.color.getHex() !== me.color.getHex();
      me._int = null; put(me, V(0, 0, -6), 0); step(0.1); S.clear();
      R('holding the sub shows the guide: a ghost of it where it would go and its 11 m ring — team colour when the spot is good, grey with a "×" when it isn\'t (mid-air)', okLook && badLook && !gd.root.visible, { okLook, badLook });
      const it = plant(me, V(0, 0, -6), 0); put(me, HOME, 0);
      step(0.5);
      const le = K._life(), k1 = le && +le.dataset.k;
      step(3);
      const k2 = le && +le.dataset.k;
      R(`while your sentry stands the sub badge carries its life ring, running down (${k1} → ${k2})`, le && le.style.opacity === '1' && k1 > k2 && Math.abs(k1 - k2 - 3 / s.life) < 0.02, { k1, k2 });
      // the minimap: its turret mark and 11 m circle (drawn by the kit's drawMap)
      const calls = [];
      const fake = new Proxy({}, { get: (t, k) => (k in t ? t[k] : (...a) => { calls.push(k); }), set: (t, k, v) => { t[k] = v; return true; } });
      K.drawMap(fake, { toCanvas: (x, z, o) => { o.x = x; o.y = z; return o; } }, { x: 0, y: 0 }, 2, ['#f00', '#00f'], me.team);
      R('the minimap draws it (a turret glyph, its range circle at 30 %, its life ring for its own team)', calls.filter((c) => c === 'arc').length >= 3 && calls.includes('stroke'), { calls: calls.length });
      void it;
    }

    // ============================================================================================ Tower Command
    if (want('tower') && m.tower) {
      reset(); netOn();
      const T = m.tower, rules0 = T._rules;
      try {
        let drive = 0;
        T._rules = function () { if (drive) { this.s = Math.min(this.path.len[0] - 0.5, this.s + drive / 60); this.moving = 1; } else this.moving = 0; };
        const at = (q) => T.path.at(q, V(0, 0, 0)), dirAt = (q) => { const a = at(q - 0.3), b = at(q + 0.3); return V(b.x - a.x, 0, b.z - a.z).normalize(); };
        const s0 = T.s;
        // one in its way, ahead along the track, set down by a foe
        const ahead = at(s0 + 4.5), d0 = dirAt(s0 + 4.5);
        const inWay = plant(foe, V(ahead.x, ahead.y, ahead.z).addScaledVector(d0, -0.9), Math.atan2(d0.x, d0.z));
        put(foe, V(22, 0, 4), 0);
        // one on its deck, set down by a kid standing there
        const deck = (lx, lz) => { const c = Math.cos(T.yaw), sn = Math.sin(T.yaw); return V(T.pos.x + c * lx + sn * lz, T.top, T.pos.z - sn * lx + c * lz); };
        const dp = deck(0, -0.9); put(me, dp, 0); me.pos.y = T.top + 0.02;
        const onDeck = plant(me, dp, 0); put(me, HOME, 0);
        step(0.7);
        const ride0 = onDeck && onDeck.rb.on && onDeck.rb.on.b.tag;
        const off0 = onDeck && onDeck.pos.clone().sub(T.pos);
        logHits(true);
        put(foe2, V(T.pos.x + 7, 0, T.pos.z + 3), 0);
        const e0 = evs.length;
        drive = 1.5;
        let seenAt = null;
        step(5, () => { foe2.hp = PLAYER.hp; if (seenAt == null && inWay.state === 'dead') seenAt = r2(T.s - s0); });
        drive = 0;
        const dn = since(e0, 'device:down').filter((e) => e.how === 'crush');
        const drift = onDeck ? r3(onDeck.pos.clone().sub(T.pos).distanceTo(off0)) : null;
        R(`the moving tower's body crushes a sentry in its way (${seenAt} m on; 'device:down' how 'crush', [2, gid, 2])`, inWay && inWay.state === 'dead' && seenAt != null && dn.length >= 1 && recs(inWay.gid, 2).some((x) => x[2] === 2), { seenAt, events: dn.length, recs: inWay && recs(inWay.gid, 2) });
        R(`one set down on its deck rides it (${ride0}; drift ${drift} m over ${r2(T.s - s0)} m) and keeps firing (${since(e0, 'sentry:fire').filter((e) => e.obj === onDeck).length} rounds), never crushed`, onDeck && onDeck.state === 'watch' && ride0 === 'tower' && drift < 0.06 && since(e0, 'sentry:fire').some((e) => e.obj === onDeck), { ride0, drift, state: onDeck && onDeck.state });
      } finally { T._rules = rules0; netOff(); logHits(false); }
      // a rider bot sets one down on the deck
      reset();
      const X = mates[0] || me === m.local ? mates[0] : null;
      if (X) {
        X.setSub('sentry'); X.ink = PLAYER.inkMax; unstub(X);
        X.pos.set(T.pos.x + 0.5, T.top + 0.05, T.pos.z + 0.5); X.vel.set(0, 0, 0);
        let got = null;
        step(12, () => { X.ink = PLAYER.inkMax; const it = K.items.find((x) => x.owner === X && x.state !== 'dead'); if (it) { got = it; return false; } });
        stub(X);
        R(`a Tower Command rider bot sets one down on the deck (${got ? got.rb.on?.b.tag || 'not riding' : 'none in 12 s'}; role ${X.bot.tRole})`, got && got.rb.on && got.rb.on.b.tag === 'tower', { role: X.bot.tRole, got: !!got });
      }
    }

    // ============================================================================================ Zone Control
    if (want('zones') && m.zones) {
      reset();
      // our team holds the live zone (flooded with our ink; the other team parked at its pad): its bots guard it
      for (const z of m.zones.active.zones) m.zones._zoneOwner(z, me.team);
      for (const a of m.actors) if (a !== me && a.team === me.team) a.setSub('sentry');
      for (const a of m.actors) if (a.bot && a !== me && a.team === me.team) unstub(a);
      let got = null, by = null;
      const seen = {}, calls = { paint: 0, guard: 0 }, pt0 = K.bot.paint;
      K.bot.paint = (b) => { calls.paint++; if (b.zRole === 'guard') calls.guard++; return pt0(b); };
      step(60, (i) => { for (const a of m.actors) a.ink = PLAYER.inkMax;
        if (i % 120 === 0) for (const a of m.actors) if (a.bot && a.team === me.team && a !== me) { const z = m.zones.zones[a.bot.zZone]; (seen[a.nid ?? a.name] ||= []).push([a.bot.zRole, a.bot.mode, z ? r2(Math.hypot(a.pos.x - z.center[0], a.pos.z - z.center[2]) - (z.reach || 0)) : null, r2(a.bot.bombCd)]); }
        const it = K.items.find((x) => x.state !== 'dead' && x.owner.bot?.zRole === 'guard'); if (it) { got = it; by = it.owner; return false; } });
      K.bot.paint = pt0;
      for (const a of m.actors) stub(a);
      let edge = null;
      if (got) { const z = m.zones.zones[by.bot.zZone]; edge = z ? r2(Math.hypot(got.pos.x - z.center[0], got.pos.z - z.center[2]) - (z.reach || 0)) : null; }
      R(`a Zone Control guard bot sets one down by its zone (${got ? `${edge} m from its edge` : 'none in 60 s'})`, got && edge != null && Math.abs(edge) <= 7, { edge, role: by && by.bot.zRole, calls, uses: SEN.SENTRY_STATS.botUses, roles: Object.fromEntries(Object.entries(seen).map(([k, v]) => [k, [...new Set(v.map((x) => x[0]))]])) });
    }
  } catch (e) { R('HARNESS ' + e.message, false, (e.stack || '').split('\n').slice(0, 4)); }
  finally {
    logHits(false); Object.assign(s, sub0); hook = null;
    for (const b of blocks) if (b.solid !== false) unbox(b);
    DB.DEV_AI.enabled = true;
    for (const a of m.actors) { if (a.subId !== subs0.get(a) && subs0.get(a)) a.setSub(subs0.get(a)); unstub(a); }
  }
  return out;

  function angle(x) { while (x > Math.PI) x -= Math.PI * 2; while (x < -Math.PI) x += Math.PI * 2; return x; }
})()
