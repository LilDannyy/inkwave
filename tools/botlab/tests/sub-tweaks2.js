// sub-tweaks2 (2026-10-02, the user: "can you buff the ink that comes out of the trail from the bow, lock the howl box to
// where you use it so it wont snap down below you, let you throw the sprinkler further and applies an ink patch on
// landing, have the tracing bolt go at your crosshair not below it, and whenever you're tracked apply a translucent sonar
// effect on the player so it's more obvious youre being tracked, as well as some sort of particle on you if you're
// poisoned").
//   MAP=testbox MODE=turf PAGE=tools/botlab/tests/sub-tweaks2.js tools/botlab/run.sh tools/botlab/page.cjs
//   PAGE_ARGS='only=bow,wail,sprinkler,tracer,tracked,poison' for a part
//   on a real stage, the Howl Box at its ledges: MAP=halyard (or calamari …) PAGE_ARGS='only=wailmap'
// Staged on testbox (a flat deck, top y 0; the spawn deck A at z −48…−40 stands 2.4 m over it; a wall x 14…15, z ±8,
// 4 m tall); everyone else parked far off, brains stubbed. Hits are logged, not dealt. Checks:
//  - Tideline Bow: a full-draw volley's trail inks ≥ 1.6× (and ≤ 2.3×) what the old drip rule (a 0.32 m drip every
//    2.4 m of flight, counted a frame at a time) inks over the very same flights; the centre arrow's ink is a line (its
//    ground track ≥ 95 % inked, two ink cells wide); a direct hit still does 55;
//  - Howl Box: used on a raised deck its speaker stands on that deck at its height — in the middle, at the ledge's edge
//    (the old rule set it down on the floor 2.4 m below), in the air just over the edge (onto the deck under the feet),
//    higher in the air (hovering at the feet, never lower); on flat ground 1.3 m in front as before; at a wall, clear of
//    it; the beam starts at its mouth; the bots' danger line starts there too; online the ghost stands where the owner's
//    does. 'wailmap' (any stage): the same at the stage's own ledges (the old rule's snap-down spots);
//  - Twirl Sprinkler: a flat throw carries ≥ 1.4× the old (throwSpeed 12), still short of the Pop Pellet's; where it
//    sticks there's an ink patch (floor and wall) before any spray lands; online the owner's patch splats go out and a
//    ghost paints nothing; the aim arc's ring is where it lands; a painting bot's turf check is where its lob lands;
//  - Tracer Bolt: fired at a wall point under the crosshair 10 / 20 / 30 m off, its first strike is that point (≤ 6 cm);
//    its launch direction lies on the line to it; (the old 9° drop would have struck the floor short of it);
//  - tracked: an Echo Orb / Lurk Mine / Tracer / Deep Sonar mark puts the sonar shell on the foe in the tracker's colour,
//    pinging every ~0.9 s (a shell swelling out, a ring on the ground), gone when the tracking ends; on your own kid it's
//    milder; online a remote player's owner's flag shows it (net/netmatch.js applyRemote), and a remote player's own
//    timers run out here (they used to stick);
//  - poison: a Murk Bomb hit sends up murky bubbles and wisps (rising, a few a second), they stop with the poison and
//    fade; capped (everyone poisoned at once stays ≤ 220, one draw); in your own view they cover little of the screen;
//    online from the owner's flag.
(async () => {
  const g = window.__inkwave, m = g.match, dbg = g.debug, THREE = await import('three');
  const { SUBS, SPECIALS, WEAPONS, PLAYER } = await import('./src/config.js');
  const { SUB_KITS, MAIN_KITS } = await import('./src/game/kits/registry.js');
  const BOW = await import('./src/game/kits/bow.js');
  const SF = await import('./src/game/statusFx.js');
  const NM = await import('./src/net/netmatch.js');
  const { PlayerController } = await import('./src/game/player.js');
  const { specialDangers } = await import('./src/game/botSpecials.js');
  const { on } = await import('./src/core/ctx.js');
  const G = window.__G, P = G.projectiles, S = G.subs, K = SUB_KITS, FX = S.statusFx;
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const ONLY = (/only=([\w,]+)/.exec(window.__pageArgs || '') || [])[1];
  const MAP = g.mapDef?.id;
  // (testbox: every part but 'wailmap'; any other stage: 'wailmap' alone)
  const want = (k) => (ONLY ? ONLY.split(',').includes(k) : (k === 'wailmap') === (MAP !== 'testbox'));
  dbg.freeze();
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const DOWN = V(0, -1, 0);
  const r2 = (x) => Math.round(x * 100) / 100, r3 = (x) => Math.round(x * 1000) / 1000, v2 = (v) => [r2(v.x), r2(v.y), r2(v.z)];
  const DT = 1 / 60;
  let hook = null, after = null;   // per-frame scene hooks (before / after each frame)
  const frame = () => { if (hook) hook(); g._skipRender = true; g._frame(DT); g._skipRender = false; if (after) after(); };
  const step = (s, fn) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) { frame(); if (fn && fn(i) === false) return i; } return n; };
  const me = m.local, others = m.actors.filter((a) => a !== me);
  const foes = others.filter((a) => a.team !== me.team), mates = others.filter((a) => a.team === me.team);
  const foe = foes[0], mate = mates[0];
  const zero = (a) => { const it = a.intent; it.move.set(0, 0, 0); it.fire = it.squid = it.jump = it.sub = it.special = false; };
  const stub = (a) => { if (a.bot) a.bot.update = () => zero(a); };
  for (const a of m.actors) stub(a);
  const put = (a, p, yaw = 0) => { a.pos.copy(p); a.pos.y += 0.02; a.vel.set(0, 0, 0); a.yaw = a.aimYaw = yaw; a.aimPitch = 0; if (a.bot) { a.bot.aimYaw = yaw; a.bot.aimPitch = 0; } };
  const tb = MAP === 'testbox';
  const HOME = V(18, 0, -30);
  const parkAll = () => { if (tb) others.forEach((a, i) => put(a, V(-22 + (i % 4) * 2, 0, 30 + Math.floor(i / 4) * 2))); };
  const hit0 = P.applyHit, hits = [];
  P.applyHit = function (att, vic, dmg, wid) { hits.push({ t: G.time, att, vic, dmg: r2(dmg), wid }); };
  const land0 = G.fx?.onDropletLand, speck0 = G.fx?.onSpeck;
  if (G.fx) { G.fx.onDropletLand = null; G.fx.onSpeck = null; }   // (the FX droplets' own random ink: off)
  const start = (e, id) => { e.specialId = id; e.special = e.specialCost(); e._startSpecial(); return e.specialActive; };
  const reset = () => {
    hook = null; after = null; S.viewer = null;
    for (const a of m.actors) { if (a.specialActive) { try { G.specials.end(a, 'test'); } catch (e) { /* */ } a.specialActive = null; } }
    G.specials.clear?.(); S.clear(); P.clear(); MAIN_KITS.bow?.clear?.(); G.paint.clear?.();
    for (const a of m.actors) {
      if (!a.alive) a.respawn();
      a.hp = PLAYER.hp; a.invuln = 0; a.ink = PLAYER.inkMax; a.special = 0; zero(a); a.form = 'kid'; a.superJumpState = null; stub(a);
      a.status.track = 0; a.status.reveal = 0; a.status.poison = 0; a.status.shield = 0;
      a.character.root.visible = true;
    }
    parkAll(); if (tb) put(me, HOME, Math.PI);
    step(0.1);
    hits.length = 0;
  };
  const items = (kind) => S.items.filter((it) => it.kind === kind && it.state !== 'dead');
  const last = (a) => a[a.length - 1];
  const inkAt = (x, z, y = 1) => { const h = G.physics.raycast(V(x, y, z), DOWN, y + 2); return h && h.hit ? G.paint.sample(h.face, h.u, h.v) : -1; };
  const disc = (cx, cz, r0, r1, team, y = 1) => { let n = 0, own = 0; for (let r = Math.max(0.001, r0); r <= r1 + 1e-6; r += 0.1) for (let k = 0; k < 72; k++) { const a = (k / 72) * Math.PI * 2; const v = inkAt(cx + Math.cos(a) * r, cz + Math.sin(a) * r, y); if (v < 0) continue; n++; if (v === team + 1) own++; } return n ? own / n : 0; };
  // a stub of the online session round a scene (as tests/sub-tweaks.js): records what the owner sends; nothing leaves the page
  const sent = [], splatRecs = [];
  const netOn = (extra = {}) => { m.actors.forEach((a, i) => { if (a.nid === undefined) { a.nid = i; a._tnid = true; } }); G.netm = { mute: 0, applying: false, isHost: true, byNid: new Map(), recSplat: (c, r) => splatRecs.push(r), recProj() {}, recBomb() {}, recZone() {}, recTower() {}, recPods() {}, recBoss() {},
    recKit: (a, kind, data) => sent.push({ a, kind, data: JSON.parse(JSON.stringify(data)) }), sendDevHit() {}, shouldApplyHit: () => 'local', sendHit: () => false, applyRemote() {}, sendResult() {}, sendEnd() {}, ...extra }; sent.length = 0; splatRecs.length = 0; };
  const netOff = () => { G.netm = null; for (const a of m.actors) if (a._tnid) { delete a.nid; delete a._tnid; } };
  // a remote player on this screen: its owner's packed tick (net/netmatch.js packActor → unpackActor) played through the
  // real NetMatch.applyRemote every frame
  const remote = (X) => {
    const ctx = { match: m }, st = { S: null };
    netOn({ applyRemote: (a, dt) => NM.NetMatch.prototype.applyRemote.call(ctx, a, dt) });
    X.remote = true;
    X.net = { ready: true, cur: null, err: V(0, 0, 0), ev: V(0, 0, 0), prevGrounded: true, prevVy: 0, loops: {} };
    return {
      // the owner's word: X's packed tick as its owner's screen would send it, with this status there
      owner(track, poison) {
        const keep = { ...X.status }, net = X.remote; X.remote = false;
        X.status.track = track; X.status.trackTeam = 1 - X.team; X.status.reveal = 0; X.status.poison = poison;
        const pk = NM._packActor(X);
        Object.assign(X.status, keep); X.remote = net;
        X.net.cur = NM._unpackActor(pk, 0);
        return pk[10];
      },
      done() { X.remote = false; delete X.net; delete X.netStatus; netOff(); },
    };
  };

  try {
    // ============================================================================================ Tideline Bow
    if (want('bow')) {
      reset();
      const w0 = me.weaponId; me.setWeapon('bow'); step(0.4);   // (the bow in hand: its own muzzle, so its own flights)
      const W = WEAPONS.bow, ps0 = W.paintStick, bp0 = W.burstPaint, team = me.team + 1;
      // the trail's ink alone (its stick and burst paint off for the measurement), in the corridor it flies over
      const area = () => { let n = 0; for (let x = -4; x <= 4 + 1e-6; x += 0.1) for (let z = -33; z <= 0 + 1e-6; z += 0.1) if (inkAt(x, z) === team) n++; return n * 0.01; };
      const volley = () => {
        S.clear(); P.clear(); MAIN_KITS.bow.clear();
        put(me, V(0, 0, -32), 0); step(0.15);
        me.aimYaw = me.yaw = 0; me.aimPitch = 0; me.aimDir.set(0, 0, 1); me.aimPoint.set(me.pos.x, 1.2, 80);   // (aim level, far off)
        G.paint.clear();
        W.paintStick = 0; W.burstPaint = [0, 0];
        let n = 0; const sp0 = G.paint.splat; G.paint.splat = function (c, r, t, o) { if (r > 0 && !o?.cosmetic) n++; return sp0.call(this, c, r, t, o); };
        BOW.looseVolley(me, 1);
        const arr = BOW.BOW_DEBUG.arrows.slice(-3);
        const tracks = arr.map((p) => ({ center: p.center, pts: [p.pos.clone()] }));
        after = () => arr.forEach((p, i) => { if (BOW.BOW_DEBUG.arrows.includes(p) && p.st === 0 && !p.noHit) tracks[i].pts.push(p.pos.clone()); });
        step(1.6);
        after = null; G.paint.splat = sp0; W.paintStick = ps0; W.burstPaint = bp0;
        const now = area();
        // the centre arrow's line: its ground track from 4 m out to the end of its flight, every 10 cm; its width (the
        // inked run across the track, ±0.7 m) every 0.5 m from 6 to 18 m out
        const c = tracks.find((t) => t.center).pts, o = c[0];
        let on = 0, tot = 0; const widths = [];
        const L = c[c.length - 1].distanceTo(o), dx = (c[c.length - 1].x - o.x) / L, dz = (c[c.length - 1].z - o.z) / L;
        for (let d = 4; d <= L - 0.6; d += 0.1) { tot++; if (inkAt(o.x + dx * d, o.z + dz * d) === team) on++; }
        for (let d = 6; d <= Math.min(18, L - 1); d += 0.5) { let w = 0; for (let s = -0.7; s <= 0.7 + 1e-6; s += 0.05) if (inkAt(o.x + dx * d - dz * s, o.z + dz * d + dx * s) === team) w += 0.05; widths.push(r2(w)); }
        widths.sort((a, b) => a - b);
        // the old rule over the same three flights, on a clean floor: a drip every 2.4 m of flight (counted a frame at a
        // time from −1.8, the count reset at each drip), 0.32 m × 0.8–1.2, straight down from the arrow
        G.paint.clear();
        let nOld = 0;
        for (const tr of tracks) {
          let t = -1.8;
          for (let i = 1; i < tr.pts.length; i++) {
            t += tr.pts[i].distanceTo(tr.pts[i - 1]);
            if (t > 2.4) { t = 0; const h = G.physics.raycast(tr.pts[i], DOWN, 4, undefined, true); if (h.hit) { nOld++; G.paint.splat(h.point.clone().addScaledVector(h.normal, 0.1), 0.32 * (0.8 + Math.random() * 0.4), me.team, { seed: Math.random() }); } }
          }
        }
        const old = area();
        G.paint.clear();
        return { now: r2(now), old: r2(old), drips: n, dripsOld: nOld, line: r2(on / Math.max(1, tot)), widthMed: widths[widths.length >> 1], width10: widths[Math.floor(widths.length * 0.1)], flight: r2(L) };
      };
      volley();   // (a first one warms what's made on first use)
      const vs = [volley(), volley(), volley()];
      const avg = (k) => r2(vs.reduce((t, x) => t + x[k], 0) / vs.length);
      const now = avg('now'), old = avg('old'), ratio = r2(now / old);
      R(`Tideline Bow: a full-draw volley's trail inks ${now} m² over flat ground (the old drip rule over the same flights: ${old} m²) — ×${ratio}, ≥ 1.6 and ≤ 2.3`,
        ratio >= 1.6 && ratio <= 2.3, { now, old, ratio, volleys: vs });
      R('…the centre arrow\'s trail is a swimmable line: its ground track ≥ 95 % inked (each volley), two ink cells (≥ 0.45 m) wide at the median',
        vs.every((x) => x.line >= 0.95) && vs.every((x) => x.widthMed >= 0.45), vs.map((x) => ({ line: x.line, widthMed: x.widthMed, width10: x.width10 })));
      // its direct damage is unchanged: a foe 10 m ahead takes the centre arrow's 55
      reset();
      put(me, V(0, 0, -32), 0); put(foe, V(0, 0, -22), Math.PI); step(0.15);
      me.aimYaw = me.yaw = 0; me.aimPitch = 0; me.aimDir.set(0, 0, 1); me.aimPoint.set(me.pos.x, 1.0, -22);
      hits.length = 0; BOW.looseVolley(me, 1); step(0.4);
      const direct = hits.filter((h) => h.vic === foe && h.wid === 'bow').map((h) => h.dmg);
      R('…its direct damage is unchanged: a full-draw centre arrow hits for 55 (config: damageFull 55, sideFull 45)', direct[0] === 55 && W.damageFull === 55 && W.sideFull === 45, { hits: direct });
      if (w0) me.setWeapon(w0);
    }

    // ============================================================================================ Howl Box
    // the old rule (before 2026-10-02), for the record: a ray down from 1.2 m over the spot 1.3 m in front, 4 m long
    const oldWail = (a) => { const f = V(Math.sin(a.aimYaw), 0, Math.cos(a.aimYaw)), at = a.pos.clone().addScaledVector(f, 1.3); const h = G.physics.raycast(at.clone().setY(a.pos.y + 1.2), DOWN, 4, undefined, true); return h.hit && h.normal.y > 0.6 ? h.point.clone() : a.pos.clone(); };
    // a kid (E) uses the Howl Box at p (air: held there in the air), facing yaw: the speaker it sets down
    const wailAt = (E, p, yaw, air = false) => {
      reset();
      const hold = () => { E.pos.copy(p); E.vel.set(0, 0, 0); E.yaw = E.aimYaw = yaw; E.aimPitch = 0; if (E.bot) { E.bot.aimYaw = yaw; E.bot.aimPitch = 0; } };
      hold(); hook = hold; step(0.15);
      const old = oldWail(E);
      const s = start(E, 'wail'); s.autoT = s.t + 0.2;
      let sk = null, at = null, grounded = null;
      step(1.5, () => { sk = G.specials.world.find((w) => w.kind === 'speaker' && w.owner === E); if (sk && !at) { at = E.pos.clone(); grounded = E.grounded; } return !sk; });
      hook = null;
      return { sk, at, grounded, old, air };
    };
    const mouthUp = (sk) => r2(sk.mouth.y - sk.pos.y);
    if (want('wail')) {
      const E = mate;
      const rec = (x) => x.sk && { kid: v2(x.at), grounded: x.grounded, speaker: v2(x.sk.pos), mouth: v2(x.sk.mouth), oldRule: v2(x.old) };
      // a) on the raised deck, in its middle, facing along it
      const a = wailAt(E, V(0, 2.42, -44), Math.PI / 2);
      R('Howl Box on a raised deck (2.4 m up): its speaker stands on that deck, 1.3 m in front, its beam from its mouth (0.7 m up), level',
        a.sk && Math.abs(a.sk.pos.y - 2.4) < 0.03 && Math.abs(Math.hypot(a.sk.pos.x - a.at.x, a.sk.pos.z - a.at.z) - 1.3) < 0.06 && Math.abs(mouthUp(a.sk) - 0.7) < 0.05 && Math.abs(a.sk.dir.y) < 0.01, rec(a));
      // b) at the deck's edge, facing out over the drop
      const b = wailAt(E, V(0, 2.42, -40.25), 0);
      const dz = b.sk && specialDangers().find((d) => d.hit === 'wail' && d.owner === E);
      R('…at the ledge\'s edge facing out: it stays on the deck at its height, never past the edge — just behind the kid, out of its way (the old rule set it down on the floor 2.4 m below)',
        b.sk && Math.abs(b.sk.pos.y - 2.4) < 0.03 && b.sk.pos.z + 0.4 <= -40 + 0.01 && b.sk.pos.z >= -41.4 && b.old.y < 0.1 && b.sk.mouth.y > 3, rec(b));
      R('…the bots\' danger line starts at its mouth up there (botSpecials.js: the speaker\'s mouth and beam)', dz && Math.abs(dz.y - b.sk.mouth.y) < 0.01 && Math.abs(dz.x - b.sk.mouth.x) < 0.01 && Math.abs(dz.z - b.sk.mouth.z) < 0.01,
        dz && { danger: [r2(dz.x), r2(dz.y), r2(dz.z)], mouth: v2(b.sk.mouth), len: r2(dz.len), r: r2(dz.r) });
      // c) in the air just over the edge (0.45 m up): onto the deck under the feet
      const c = wailAt(E, V(0, 2.85, -40.3), 0, true);
      R('…in the air just over the edge (0.45 m up): onto the deck right under the feet, never the floor below',
        c.sk && c.grounded === false && Math.abs(c.sk.pos.y - 2.4) < 0.03 && Math.hypot(c.sk.pos.x - c.at.x, c.sk.pos.z - c.at.z) < 0.05, rec(c));
      // d) higher in the air over the edge (1 m up): it hovers at the feet — never lower
      const d = wailAt(E, V(0, 3.4, -40.3), 0, true);
      R('…higher in the air over the edge (1 m up): it hovers at the feet, right where the kid is',
        d.sk && d.grounded === false && Math.abs(d.sk.pos.y - d.at.y) < 0.03 && Math.hypot(d.sk.pos.x - d.at.x, d.sk.pos.z - d.at.z) < 0.05, rec(d));
      // e) flat ground: as before (1.3 m in front, on the floor); f) up against a wall: back off it, the box clear of it
      const e = wailAt(E, V(0, 0.02, -10), 0);
      const f = wailAt(E, V(13.0, 0.02, 0), Math.PI / 2);
      R('…on flat ground it stands 1.3 m in front on the floor, as it always did; up against a wall it stands back from it (the box clear of the wall face)',
        e.sk && Math.abs(e.sk.pos.y) < 0.03 && Math.abs(e.sk.pos.z - (-10 + 1.3)) < 0.06 && e.sk.pos.distanceTo(e.old) < 0.06 && f.sk && f.sk.pos.x + 0.45 <= 14.01 && f.sk.pos.x > 13.3 && Math.abs(f.sk.pos.y) < 0.03, { flat: rec(e), wall: rec(f) });
      // online: the owner's record puts the ghost speaker where its own stands (another screen)
      netOn();
      let g1 = null;
      try {
        const o = wailAt(E, V(0, 2.42, -40.25), 0);
        const r = sent.find((x) => x.kind === 'sp' && x.data[0] === 2 && x.data[1] === 'sk');
        if (r) { G.specials.netGhost(foe, [2, 'sk', 99901, ...r.data.slice(3)]); g1 = G.specials.world.find((w) => w.ghost && w.gid === 99901); }
        R('online: the ghost speaker on another screen stands where the owner\'s does (on the ledge), its beam from the same mouth',
          o.sk && g1 && g1.pos.distanceTo(o.sk.pos) < 0.02 && g1.mouth.distanceTo(o.sk.mouth) < 0.02 && Math.abs(g1.pos.y - 2.4) < 0.03, { owner: o.sk && v2(o.sk.pos), ghost: g1 && v2(g1.pos), rec: r && r.data });
      } finally { netOff(); }
    }

    // ============================================================================================ Howl Box on a stage's ledges
    if (want('wailmap')) {
      // the stage's ledges where the old rule snapped down: a nav spot (off the spawns) whose floor 1.3 m ahead (the old
      // rule's ray) is ≥ 1 m lower; the 4 biggest drops, ≥ 8 m apart
      const nodes = G.nav.nodes, cand = [];
      for (const n of nodes) {
        if (n.zone >= 0) continue;
        const g0 = G.physics.raycast(V(n.x, n.y + 0.5, n.z), DOWN, 1.2, undefined, true);
        if (!g0.hit || g0.normal.y < 0.6) continue;
        const blk = G.level.blocks[g0.block]; if (blk && (blk.roof || blk.perch || blk.rail || blk.dynamic)) continue;
        const y0 = g0.point.y;
        for (let k = 0; k < 8; k++) {
          const yaw = (k / 8) * Math.PI * 2, fx = Math.sin(yaw), fz = Math.cos(yaw);
          const h = G.physics.raycast(V(n.x + fx * 1.3, y0 + 1.2, n.z + fz * 1.3), DOWN, 4, undefined, true);
          if (h.hit && h.normal.y > 0.6 && h.point.y < y0 - 1) cand.push({ x: n.x, y: y0, z: n.z, yaw, drop: y0 - h.point.y });
        }
      }
      cand.sort((a, b) => b.drop - a.drop);
      const spots = []; for (const c of cand) { if (spots.every((s) => Math.hypot(s.x - c.x, s.z - c.z) > 8)) spots.push(c); if (spots.length >= 4) break; }
      const E = mate, res = [];
      for (const sp of spots) {
        const x = wailAt(E, V(sp.x, sp.y + 0.02, sp.z), sp.yaw);
        res.push({ at: [r2(sp.x), r2(sp.y), r2(sp.z)], yaw: r2(sp.yaw), drop: r2(sp.drop), grounded: x.grounded, speakerY: x.sk ? r2(x.sk.pos.y) : null, mouthY: x.sk ? r2(x.sk.mouth.y) : null, oldY: r2(x.old.y),
          ok: !!x.sk && x.grounded && Math.abs(x.sk.pos.y - sp.y) < 0.06, oldSnapped: x.old.y < sp.y - 0.9 });
      }
      R(`Howl Box on ${MAP}'s ledges (the old rule's snap-down spots, ≥ 2 of them as used): its speaker stands on the ledge, at its height (never on the floor below)`,
        spots.length >= 2 && res.every((r) => r.ok) && res.filter((r) => r.oldSnapped).length >= 2, res);
      // online at the first one: the ghost stands there too
      netOn();
      try {
        const sp = spots[0], o = sp && wailAt(E, V(sp.x, sp.y + 0.02, sp.z), sp.yaw);
        const r = sent.find((x) => x.kind === 'sp' && x.data[0] === 2 && x.data[1] === 'sk');
        if (r) G.specials.netGhost(foe, [2, 'sk', 99902, ...r.data.slice(3)]);
        const gh = G.specials.world.find((w) => w.ghost && w.gid === 99902);
        R(`…online on ${MAP}: the ghost speaker stands on the ledge with the owner's`, o && o.sk && gh && gh.pos.distanceTo(o.sk.pos) < 0.02, { owner: o && o.sk && v2(o.sk.pos), ghost: gh && v2(gh.pos) });
      } finally { netOff(); }
    }

    // ============================================================================================ Twirl Sprinkler
    if (want('sprinkler')) {
      const s = SUBS.sprinkler, T0 = s.throwSpeed;
      // a flat throw (aim level, standing still) from (0, 0, −30) along +z: where it sticks
      const flat = (kind = 'sprinkler', speed) => {
        reset();
        put(me, V(0, 0, -30), 0); step(0.1);
        const sd = SUBS[kind], sp0 = sd.throwSpeed; if (speed) sd.throwSpeed = speed;
        me.aimYaw = me.yaw = 0; me.aimPitch = 0; me.vel.set(0, 0, 0);
        let at = null; const off = on('bomb:explode', (e) => { if (!at && e.team === me.team) at = V(e.pos.x, e.pos.y, e.pos.z); });
        try { S.use(me, sd); } finally { sd.throwSpeed = sp0; }
        const it = last(S.items.filter((x) => x.kind === kind));
        step(2, () => { if (kind === 'sprinkler' && it.state === 'spray') { at = it.pos.clone(); return false; } return !at; });
        off();
        return at ? r2(Math.hypot(at.x - me.pos.x, at.z - me.pos.z)) : null;
      };
      const dOld = flat('sprinkler', 12), dNew = flat(), dPellet = flat('burst');
      const speeds = Object.values(SUBS).filter((x) => x.throwSpeed && x.id !== 'sprinkler' && x.id !== 'boomerang').map((x) => [x.id, x.throwSpeed]);
      R(`Twirl Sprinkler: a flat throw carries ${dNew} m (throwSpeed ${T0}; was ${dOld} m at 12) — ×${r2(dNew / dOld)}, ≥ 1.4; still short of the Pop Pellet's ${dPellet} m (the longest throw: 16)`,
        dNew / dOld >= 1.4 && dNew < dPellet && T0 < Math.max(...speeds.map((x) => x[1])), { dOld, dNew, dPellet, speeds });
      // where it sticks: an ink patch (landPaint) right away — before the first spray lands
      reset();
      put(me, V(0, 0, -30), 0); step(0.1); me.aimYaw = me.yaw = 0; me.aimPitch = 0;
      let patch = null;
      const off = on('sub:land', (e) => { if (e.kind !== 'sprinkler' || patch) return; const c = e.pos; patch = { at: v2(c), core: r2(disc(c.x, c.z, 0, 1.2, me.team)), rim: r2(disc(c.x, c.z, 1.3, 1.6, me.team)), past: r2(disc(c.x, c.z, 2.7, 3.5, me.team)), dropsOut: P.list ? P.list.length : null }; });
      S.use(me, s); step(1.5, () => !patch);
      off();
      R(`…where it sticks (a floor) it splats an ink patch (${s.landPaint} m) before any of its spray lands: ≥ 90 % inked to 1.2 m, ≥ 50 % at 1.3–1.6 m, none past 2.7 m yet`,
        patch && patch.core >= 0.9 && patch.rim >= 0.5 && patch.past <= 0.02, patch);
      // on a wall: the patch is on the wall round it (the wall's face, x = 14)
      reset();
      put(me, V(10, 0, 0.5), Math.PI / 2); step(0.1);
      S._throw(me, s, V(13.0, 1.9, 0.3), V(8, 0, 0), false);
      const w = last(items('sprinkler'));
      step(0.6, () => w.state !== 'spray');
      let wn = 0, wo = 0;
      for (let r = 0.1; r <= 1.1; r += 0.1) for (let k = 0; k < 48; k++) { const a = (k / 48) * Math.PI * 2, y = w.pos.y + Math.sin(a) * r, z = w.pos.z + Math.cos(a) * r; if (y < 0.1) continue; const h = G.physics.raycast(V(13.4, y, z), V(1, 0, 0), 1, undefined, true); if (!h.hit) continue; wn++; if (G.paint.sample(h.face, h.u, h.v) === me.team + 1) wo++; }
      R('…on a wall it sticks with a patch on the wall round it (≥ 85 % inked to 1.1 m)', w.state === 'spray' && Math.abs(w.normal.x + 1) < 0.01 && wn > 100 && wo / wn >= 0.85, { stuck: v2(w.pos), normal: v2(w.normal), cov: r2(wo / Math.max(1, wn)) });
      // online: the owner's patch splats go out; a ghost sprinkler (another player's) paints nothing itself
      reset(); netOn();
      try {
        put(me, V(0, 0, -30), 0); step(0.1); me.aimYaw = me.yaw = 0; me.aimPitch = 0;
        S.use(me, s); const own = last(items('sprinkler'));
        let n0 = -1; step(1.5, () => { if (own.state === 'spray' && n0 < 0) { n0 = splatRecs.filter((r) => r >= 0.5).length; return false; } });
        const rec = sent.find((x) => x.kind === 'subs' && x.data[0] === 0 && x.data[2] === 'sprinkler');
        reset(); netOn();
        S.netGhost(foe, [0, 99903, 'sprinkler', ...rec.data.slice(3)]);
        const gh = S.items.find((x) => x.gid === 99903);
        step(1.2, () => gh.state !== 'spray');
        const ghostInk = disc(gh.pos.x, gh.pos.z, 0, 1.2, foe.team);
        R('online: the owner\'s patch goes out as splats (a body and four blobs); a ghost sprinkler sticking on another screen paints nothing itself (the owner\'s splats arrive)',
          n0 >= 5 && gh.state === 'spray' && ghostInk === 0 && splatRecs.length === 0, { ownerSplats: n0, ghost: gh.state, ghostInk, ghostSent: splatRecs.length });
      } finally { netOff(); }
      // the aim arc's ring (weapons.js updateArc, read off throwSpeed) is where it lands
      reset();
      const sub0 = me.sub; me.setSub('sprinkler');
      put(me, V(0, 0, -30), 0); step(0.1); me.aimYaw = me.yaw = 0; me.aimPitch = 0.05; me.vel.set(0, 0, 0);
      P.updateArc(me, true); const ring = P.arcRing.position.clone(), ringOn = P.arcRing.visible; P.updateArc(me, false);
      S.use(me, s); const th = last(items('sprinkler')); step(1.5, () => th.state !== 'spray');
      R('…the aim arc\'s landing ring is where it sticks (≤ 0.35 m)', ringOn && th.pos.distanceTo(ring) < 0.35, { ring: v2(ring), landed: v2(th.pos) });
      if (sub0) me.setSub(sub0.id);
      // a painting bot's turf check is centred where its lob lands now (bots.js lobDist: its aim pitch, throwSpeed)
      reset();
      const B = mate.bot, rs0 = G.paint.regionStats, rnd0 = Math.random, asked = [];
      put(mate, V(-10, 0, -24), 0); mate.setSub('sprinkler'); mate.ink = PLAYER.inkMax; step(0.05);
      mate.aimPitch = -0.42; mate.bot.aimPitch = -0.42; mate.aimYaw = mate.yaw = 0;
      G.paint.regionStats = function (x, y, z, r, team, o) { asked.push(V(x, y, z)); return rs0.call(this, x, y, z, r, team, o); };
      Math.random = () => 0.001;
      let go = null;
      try { go = B._paintSub(); } finally { Math.random = rnd0; G.paint.regionStats = rs0; }
      mate.aimPitch = -0.42; mate.vel.set(0, 0, 0);
      S.use(mate, SUBS.sprinkler); const bt = last(items('sprinkler')); step(1.5, () => bt.state !== 'spray');
      const off2 = asked[0] ? Math.hypot(asked[0].x - bt.pos.x, asked[0].z - bt.pos.z) : null;
      R('…a painting bot\'s turf check for it is centred where its lob actually lands (≤ 0.6 m), not a fixed 5.5 m ahead', go !== null && asked.length >= 1 && off2 < 0.6,
        { check: asked[0] && v2(asked[0]), landed: v2(bt.pos), off: off2 && r2(off2), lobOut: r2(Math.hypot(bt.pos.x - mate.pos.x, bt.pos.z - mate.pos.z)) });
      mate.setSub(mate.weapon.sub || 'bomb');
    }

    // ============================================================================================ Tracer Bolt
    if (want('tracer')) {
      const shots = [];
      // (the wall at x 14…15 and its mirror at x −15…−14 both span z ±8: shot along a 35° slant at the east wall's face
      // round z = 3, every line is clear of the mirror one)
      const th = (35 * Math.PI) / 180, ux = Math.cos(th), uz = Math.sin(th), yaw = Math.atan2(ux, uz);
      for (const dist of [10, 20, 30]) {
        reset();
        put(me, V(14 - ux * dist, 0, 3 - uz * dist), yaw);
        g.rig.follow(me, true);
        // the crosshair on the wall's face (x = 14) between knee and head height: the camera's pitch nudged until it is
        let ap = null;
        for (const pitch of [0, -0.03, 0.03, -0.06, 0.06, -0.1, 0.1, -0.15, 0.15, -0.2, 0.2]) {
          g.rig.yaw = yaw; g.rig.pitch = pitch; me.aimYaw = me.yaw = yaw; me.aimPitch = pitch;
          step(0.05); if (g.rig.blend) g.rig.blend.active = false; step(0.05);
          PlayerController.prototype.computeAim.call({ a: me });   // (the crosshair point, as the player's controller finds it)
          ap = me.aimPoint.clone();
          if (Math.abs(ap.x - 14) < 0.02 && Math.abs(ap.z) < 7.5 && ap.y > 0.6 && ap.y < 3.4) break;
        }
        const cam = G.rig?.gameCam || G.camera, fwd = cam.getWorldDirection(V(0, 0, 0)), cp = cam.position.clone();
        me.aimDir.copy(fwd);
        const offRay = ap.clone().sub(cp).cross(fwd).length();   // (the crosshair point on the camera's centre ray)
        K.tracer.use(G.subs, me, SUBS.tracer);
        const b = last(K.tracer._bolts), from = b.start.clone(), dir0 = b.dir.clone();
        step(1.2);
        const strike = b.path[1] ? b.path[1].clone() : null;
        const ang = dir0.angleTo(ap.clone().sub(from)) * 180 / Math.PI;
        // what the old 9° drop would have struck
        const od = dir0.clone(), pt = Math.asin(od.y) - 9 * Math.PI / 180, yw = Math.atan2(od.x, od.z); od.set(Math.sin(yw) * Math.cos(pt), Math.sin(pt), Math.cos(yw) * Math.cos(pt));
        const oh = G.physics.raycast(from, od, 40, undefined, true);
        shots.push({ dist, shotLen: r2(from.distanceTo(ap)), marker: v2(ap), strike: strike && v2(strike), miss: strike ? r3(strike.distanceTo(ap)) : null, angleDeg: r3(ang), offRay: r3(offRay), oldStrike: oh.hit ? v2(oh.point) : null, oldMiss: oh.hit ? r2(oh.point.distanceTo(ap)) : null });
      }
      R('Tracer Bolt: fired at a wall point under the crosshair 10 / 20 / 30 m off it strikes that point (≤ 6 cm), sent along the line to it (< 0.1°); the crosshair point is on the camera\'s centre ray — the old 9° drop struck 1.5 m low or the floor short of it',
        shots.every((x) => x.miss != null && x.miss <= 0.06 && x.angleDeg < 0.1 && x.offRay < 0.02 && x.oldMiss > 1), shots);
      R('…its config has no downward offset any more (no pitchDown); the blurb says it flies at the crosshair', SUBS.tracer.pitchDown === undefined && /crosshair/.test(SUBS.tracer.blurb), { blurb: SUBS.tracer.blurb });
    }

    // ============================================================================================ tracked
    if (want('tracked')) {
      reset();
      const F0 = V(0, 0, -6);
      put(foe, F0, Math.PI); step(0.1);
      // an Echo Orb onto the foe
      S._throw(me, SUBS.scan, V(F0.x, 1.6, F0.z), V(0, -1, 0), false);
      step(0.6);
      const r = FX.recs.get(foe), col = G.teamColors[me.team];
      const p0 = foe.visualPos(V(0, 0, 0));
      const on1 = { track: r2(foe.status.track), shell: !!(r && r.shell.visible), colour: r && r.shell.material.uniforms.uColor.value.getHex() === col.getHex(), at: r && r.group.position.distanceTo(p0) < 0.01, transparent: r && r.shell.material.transparent && !r.shell.material.depthWrite };
      // its pings over 2.7 s (a ping = the phase wrapping round), how far the shell swells and the ground ring runs
      let pings = 0, lastK = r ? r.ping.material.uniforms.uK.value : 0, swell = 0, ringR = 0, shellA = 0;
      step(2.7, () => { const k = r.ping.material.uniforms.uK.value; if (k < lastK) pings++; lastK = k; swell = Math.max(swell, r.ping.scale.x); ringR = Math.max(ringR, r.ring.material.uniforms.uR.value * r.ring.scale.x); shellA = Math.max(shellA, r.shell.material.uniforms.uAlpha.value); });
      R(`tracked (Echo Orb): a translucent sonar shell on the foe in the tracker's colour, pinging every ${SF.PULSE} s (a ringed shell swelling out ~1.85× and a ring out along the ground ~1.9 m)`,
        on1.shell && on1.colour && on1.at && on1.transparent && pings >= 2 && pings <= 3 && swell > 1.7 && ringR > 1.7 && shellA > 0.9, { ...on1, pings, swell: r2(swell), ringR: r2(ringR), shellAlpha: r2(shellA) });
      foe.status.track = 0.3; step(0.5);
      R('…it ends with the tracking (no shell, no ping, no ring)', !r.on && !r.shell.visible && !r.ping.visible && !r.ring.visible && foe.status.track === 0, { on: r.on });
      // every source of tracking shows it: a Lurk Mine's blast, a Tracer Bolt hit, Deep Sonar
      const shown = (a) => { const x = FX.recs.get(a); return !!(x && x.on && x.shell.visible); };
      reset();
      put(me, V(-6, 0, -6), 0); step(0.05); S.use(me, SUBS.mine); put(me, HOME, Math.PI); step(1);
      put(foe, V(-4.6, 0, -6), 0); step(1.2);
      const mine = { track: r2(foe.status.track), shown: shown(foe) };
      reset();
      put(me, V(0, 0, -14), 0); put(foe, V(0, 0, -6), Math.PI); step(0.1);
      me.aimYaw = me.yaw = 0; me.aimPitch = 0; me.aimDir.set(0, 0, 1); me.aimPoint.set(0, 1.0, -6);
      K.tracer.use(G.subs, me, SUBS.tracer); step(0.5);
      const tracer = { track: r2(foe.status.track), shown: shown(foe) };
      reset();
      start(me, 'sonar'); step(0.8);
      const sonar = { tracked: foes.filter((a) => a.status.track > 0).length, shown: foes.filter(shown).length, of: foes.length };
      R('…every source shows it: a Lurk Mine\'s blast, a Tracer Bolt hit, Deep Sonar (every foe)', mine.track > 0 && mine.shown && tracer.track > 0 && tracer.shown && sonar.shown === sonar.of && sonar.tracked === sonar.of, { mine, tracer, sonar });
      // on your own kid (the follow view): milder
      reset();
      put(me, V(0, 0, -6), 0); step(0.1);
      S._throw(foe, SUBS.scan, V(0, 1.6, -6), V(0, -1, 0), false); step(0.5);
      const rm = FX.recs.get(me), selfA = rm ? rm.shell.material.uniforms.uAlpha.value : 0, selfRing = rm ? rm.ring.material.uniforms.uAlpha.value : 0;
      R(`…on your own kid it shows too, milder (shell ${SF.PULSE ? '×0.4' : ''}: it never gets in your view)`, G.local === me && rm && rm.shell.visible && rm.shell.material.uniforms.uColor.value.getHex() === G.teamColors[foe.team].getHex() && selfA > 0.2 && selfA <= 0.45,
        { selfAlpha: r2(selfA), ringAlpha: r2(selfRing) });
      // online: a remote player (another screen's) — its owner's tick says it's tracked (applyRemote: a.netStatus)
      reset();
      const X = foes[1] || foe; put(X, V(4, 0, -6), Math.PI); step(0.1);
      const net = remote(X);
      try {
        const f1 = net.owner(8, 0); step(0.3);
        const rx = FX.recs.get(X), ghostOn = { flag: (f1 & NM.NET_FLAGS.tracked) !== 0, netStatus: X.netStatus, localTrack: X.status.track, shown: shown(X), colour: rx && rx.shell.material.uniforms.uColor.value.getHex() === G.teamColors[1 - X.team].getHex() };
        net.owner(0, 0); step(0.2);
        const ghostOff = { netStatus: X.netStatus, shown: shown(X) };
        // a ghost sub on this screen marked it here (its own timer): it runs out here too (Actor.update doesn't run for it)
        X.status.track = 0.4; X.status.trackTeam = me.team; step(0.2); const mid = shown(X); step(0.4);
        const timer = { mid, after: r2(X.status.track), shown: shown(X) };
        R('online: a remote player\'s owner\'s tick (its tracked flag) puts the shell on it here, and its going takes it off; a mark made here runs out here too (it used to stick)',
          ghostOn.flag && ghostOn.netStatus === SF.NET_TRACKED && ghostOn.localTrack === 0 && ghostOn.shown && ghostOn.colour && !ghostOff.shown && timer.mid && timer.after === 0 && !timer.shown, { ghostOn, ghostOff, timer });
      } finally { net.done(); }
    }

    // ============================================================================================ poison
    if (want('poison')) {
      reset();
      const F0 = V(0, 0, -6);
      put(foe, F0, Math.PI); step(0.1);
      const near = (a, r = 1.2) => FX.parts.filter((q) => Math.hypot(q.x - a.pos.x, q.z - a.pos.z) < r);
      // a Murk Bomb's direct hit (poisoned for the whole mist)
      S._throw(me, SUBS.mist, V(F0.x, 1.0, F0.z - 1.4), V(0, 0, 9), false);
      const e0 = FX.stats.emitted;
      let maxN = 0, rising = 0, sampled = 0, bub = 0, wisp = 0;
      step(1.5, () => { const ps = near(foe); maxN = Math.max(maxN, ps.length); for (const q of ps) { sampled++; if (q.vy > 0.3) rising++; if (q.bub) bub++; else wisp++; } });
      const rate = (FX.stats.emitted - e0) / 1.5;
      R('poisoned (a Murk Bomb hit): murky bubbles and wisps rise off the foe, a few at a time (5–18 a second), a handful in the air at once',
        foe.status.poison > 0 && maxN >= 5 && maxN <= 40 && rate >= 5 && rate <= 18 && rising / sampled > 0.95 && bub > 0 && wisp > 0, { poison: r2(foe.status.poison), rate: r2(rate), maxAlive: maxN, bubbles: r2(bub / sampled), mesh: FX.partMesh.visible });
      // they stop with the poison
      let endT = null; const e1 = []; step(7, (i) => { if (endT == null && foe.status.poison <= 0) endT = i; if (endT != null) e1.push(FX.stats.emitted); });
      R('…they stop with the poison (nothing new after it ends) and the last ones fade out (none left ~2 s on)', endT != null && e1[e1.length - 1] === e1[0] && near(foe, 3).length === 0 && FX.parts.length === 0 && !FX.partMesh.visible, { endsAt: endT && r2(endT / 60 + 1.5), after: e1[e1.length - 1] - e1[0], left: FX.parts.length });
      // capped: everyone poisoned at once
      reset();
      let peak = 0; for (const a of m.actors) S.poison(a, 3);
      step(3, () => { peak = Math.max(peak, FX.parts.length); });
      const meshes = []; G.scene.traverse((o) => { if (o === FX.partMesh) meshes.push(o); });
      R('…capped: all 8 players poisoned at once stay ≤ 220 particles, drawn in one instanced mesh', peak <= 220 && peak > 40 && meshes.length === 1, { peak });
      // your own view (the follow camera): they cover little of the screen
      reset();
      put(me, V(0, 0, -6), 0); g.rig.follow(me, true); g.rig.yaw = 0; g.rig.pitch = -0.1; me.aimYaw = me.yaw = 0; step(0.2); if (g.rig.blend) g.rig.blend.active = false;
      S.poison(me, 4);
      let cover = 0, big = 0, closest = 99, n = 0;
      step(2, (i) => {
        if (i < 60) return;
        const cam = G.camera; cam.updateMatrixWorld(); const th = Math.tan((cam.fov * Math.PI) / 360);
        let c = 0;
        for (const q of FX.parts) {
          const d = V(q.x, q.y, q.z).applyMatrix4(cam.matrixWorldInverse); const zv = -d.z; if (zv <= 0.05) continue;
          closest = Math.min(closest, zv);
          const h = (q.size * 0.5) / (zv * th);   // radius in half-screen heights
          big = Math.max(big, h); c += Math.PI * h * h / (4 * cam.aspect);   // (the screen: 2 × 2·aspect half-heights)
        }
        cover = Math.max(cover, c); n++;
      });
      R('…in your own view (the follow camera) they cover little of the screen: < 3 % at any moment, none bigger than 5 % of its height, none right at the lens',
        cover < 0.03 && big * 50 < 5 && closest > 1.2, { coverPct: r2(cover * 100), biggestPctOfHeight: r2(big * 50), closestM: r2(closest), frames: n });
      // online: the owner's flag
      reset();
      const X = foes[1] || foe; put(X, V(4, 0, -6), Math.PI); step(0.1);
      const net = remote(X);
      try {
        net.owner(0, 3); const e2 = FX.stats.emitted; step(0.8);
        const ghostOn = { netStatus: X.netStatus, localPoison: X.status.poison, emitted: FX.stats.emitted - e2, near: near(X).length };
        net.owner(0, 0); step(0.1); const e3 = FX.stats.emitted; step(0.6);
        R('online: a remote player\'s owner\'s tick (its poisoned flag) sends up the bubbles here; off, they stop', ghostOn.netStatus === SF.NET_POISONED && ghostOn.localPoison === 0 && ghostOn.emitted >= 4 && ghostOn.near > 0 && FX.stats.emitted === e3, { ghostOn, afterOff: FX.stats.emitted - e3 });
      } finally { net.done(); }
    }
  } catch (e) {
    R('harness error', false, String(e && e.stack || e).slice(0, 700));
  } finally {
    hook = null; after = null; S.viewer = null; netOff();
    delete P.applyHit; if (P.applyHit !== hit0) P.applyHit = hit0;
    if (G.fx) { G.fx.onDropletLand = land0; G.fx.onSpeck = speck0; }
    for (const a of m.actors) if (a.bot) delete a.bot.update;
    S.clear(); P.clear();
  }
  return out;
})()
