// track-arrows (2026-10-02, the user, with a Splatoon screenshot of a tracked enemy: "can you replace the tracking effect
// again, this time to have an arrow circle around the player using the colour of the enemy, and if you're the one
// tracking the player, a thin line directly to the middle of the player. dont show their name." — then: "everyone on the
// tracking team should get a line not just the user. anyone on the tracking team sees the line and the arrow through
// walls. if im tracked then i just see arrow on me. if my teammates is getting tracked, i see the arrow but not through
// walls") — src/game/statusFx.js
//   MAP=testbox MODE=turf PAGE=tools/botlab/tests/track-arrows.js tools/botlab/run.sh tools/botlab/page.cjs
//   PAGE_ARGS='only=arrow,clear,sources,walls,clamp,line,net,names,poison' for a part
// Staged on testbox (a flat deck, top y 0; a wall x 14…15, z ±8, 4 m tall); everyone else parked far off, brains
// stubbed, hits not dealt. StatusFx.viewer stands in for whose screen it is (null: yours). Checks:
//  - the old sonar shell (and its ground ping ring) is gone;
//  - arrow: an Echo Orb on a foe puts ONE arrow round it — one strip mesh (drawn depth-tested, and for the trackers once
//    more where it's hidden), the arrow cut from it: an upright cylinder band ~1 m round, facing out, at waist / chest
//    height, spanning ~312°, its shaft 0.22–0.3 m tall, its head ~1.8× that; both sides drawn (inside first) — in the
//    tracking team's colour; it turns round them the way it points (a turn every 2–3 s) and bobs; gone when the tracking
//    ends; a Lurk Mine, a Tracer Bolt and Deep Sonar do it too; on your own kid it's fainter, depth-tested, no line;
//  - walls, per role (rendered: a 320×180 target, the same frame with the looks on / off): the tracking team — you who
//    threw it and your teammate who didn't — see the arrow and each their own line through the wall (an occluded
//    GreaterDepth pass, a line with no depth test); the tracked player's teammate sees none of it through the wall and
//    no line, in the open the arrow (depth-tested); the tracked player: the arrow on their kid, no line;
//  - clamp: the arrow's head on screen stays between MIN_F and MAX_F of the screen's height, far off and up close (never
//    shrinking below S_MIN round the kid);
//  - line: on every tracking-team screen whoever threw (one per tracked enemy: Deep Sonar → four), from that player's
//    chest to the middle of the tracked one's (a squid's too), in their colour, ~1.75 px, translucent, through walls;
//    none for the tracked player or their teammates, none after the track ends, none while you're splatted;
//  - net: the tick's tracked flag is all it takes (two teams: tracked = by the other one) — no extra field; a remote
//    player its owner says is tracked wears the arrow in your colour, through walls, with your line, on your screen; on
//    its teammate's screen the arrow depth-tested, no line; untracked: nothing;
//  - names: no name tag over a tracked enemy (the HUD's markers carry allies only; nothing in the DOM names them), and
//    the looks themselves are only meshes and a line (no sprite, no text);
//  - poison: the bubbles still rise off a poisoned player (tracked at the same time too).
(async () => {
  const g = window.__inkwave, m = g.match, dbg = g.debug, THREE = await import('three');
  const { SUBS, PLAYER } = await import('./src/config.js');
  const { SUB_KITS, MAIN_KITS } = await import('./src/game/kits/registry.js');
  const SF = await import('./src/game/statusFx.js');
  const NM = await import('./src/net/netmatch.js');
  const G = window.__G, P = G.projectiles, S = G.subs, K = SUB_KITS, FX = S.statusFx;
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const ONLY = (/only=([\w,]+)/.exec(window.__pageArgs || '') || [])[1];
  const want = (k) => !ONLY || ONLY.split(',').includes(k);
  dbg.freeze();
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const r2 = (x) => Math.round(x * 100) / 100, r3 = (x) => Math.round(x * 1000) / 1000, v2 = (v) => [r2(v.x), r2(v.y), r2(v.z)];
  const DT = 1 / 60;
  let hook = null;
  const frame = () => { if (hook) hook(); g._skipRender = true; g._frame(DT); g._skipRender = false; };
  const step = (s, fn) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) { frame(); if (fn && fn(i) === false) return i; } return n; };
  const me = m.local, others = m.actors.filter((a) => a !== me);
  const foes = others.filter((a) => a.team !== me.team), mates = others.filter((a) => a.team === me.team);
  const foe = foes[0], foe2 = foes[1], mate = mates[0];
  const zero = (a) => { const it = a.intent; it.move.set(0, 0, 0); it.fire = it.squid = it.jump = it.sub = it.special = false; };
  const stub = (a) => { if (a.bot) a.bot.update = () => zero(a); };
  for (const a of m.actors) stub(a);
  const put = (a, p, yaw = 0) => { a.pos.copy(p); a.pos.y += 0.02; a.vel.set(0, 0, 0); a.yaw = a.aimYaw = yaw; a.aimPitch = 0; if (a.bot) { a.bot.aimYaw = yaw; a.bot.aimPitch = 0; } };
  const HOME = V(18, 0, -30);
  const parkAll = () => others.forEach((a, i) => put(a, V(-22 + (i % 4) * 2, 0, 30 + Math.floor(i / 4) * 2)));
  const hit0 = P.applyHit;
  P.applyHit = function () {};
  const land0 = G.fx?.onDropletLand, speck0 = G.fx?.onSpeck;
  if (G.fx) { G.fx.onDropletLand = null; G.fx.onSpeck = null; }
  const start = (e, id) => { e.specialId = id; e.special = e.specialCost(); e._startSpecial(); return e.specialActive; };
  const reset = () => {
    hook = null; FX.viewer = null; S.viewer = null;
    for (const a of m.actors) { if (a.specialActive) { try { G.specials.end(a, 'test'); } catch (e) { /* */ } a.specialActive = null; } }
    G.specials.clear?.(); S.clear(); P.clear(); G.paint.clear?.();
    for (const a of m.actors) {
      if (!a.alive) a.respawn();
      a.hp = PLAYER.hp; a.invuln = 0; a.ink = PLAYER.inkMax; a.special = 0; zero(a); a.form = 'kid'; a.superJumpState = null; stub(a);
      a.status.track = 0; a.status.reveal = 0; a.status.poison = 0; a.status.shield = 0;
      a.character.root.visible = true;
    }
    parkAll(); put(me, HOME, Math.PI);
    if (g.rig.mode !== 'follow') g.rig.follow(me, true);
    step(0.1);
  };
  const rec = (a) => FX.recs.get(a);
  const arrowOn = (a) => { const r = rec(a); return !!(r && r.on && r.band.visible); };
  const lineOn = (a) => { const r = rec(a); return !!(r && r.line && r.line.visible); };
  const hex = (c) => c.getHex();
  // the camera held on a shot (the rig's cinematic: the looks billboard to it)
  const shotCam = (from, look) => { g.rig.cinematic(from, from, look, look, 99, () => {}); step(0.1); };
  // the scene rendered to a small target with the game's own camera → its pixels
  const RT = new THREE.WebGLRenderTarget(320, 180), buf = () => new Uint8Array(320 * 180 * 4);
  const shot = () => { const Rn = G.renderer, b = buf(); G.camera.updateMatrixWorld(); Rn.setRenderTarget(RT); Rn.clear(); Rn.render(G.scene, G.camera); Rn.readRenderTargetPixels(RT, 0, 0, 320, 180, b); Rn.setRenderTarget(null); return b; };
  const diff = (a, b) => { let n = 0; for (let i = 0; i < a.length; i += 4) if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 24) n++; return n; };
  // pixels the given looks add to the frame (rendered with them, then without)
  const pixels = (objs) => { const vis = objs.map((o) => o.visible); const on = shot(); objs.forEach((o) => { o.visible = false; }); const off = shot(); objs.forEach((o, i) => { o.visible = vis[i]; }); return diff(on, off); };
  // a stub of the online session (as tests/sub-tweaks2.js): nothing leaves the page
  const netOn = (extra = {}) => { m.actors.forEach((a, i) => { if (a.nid === undefined) { a.nid = i; a._tnid = true; } }); G.netm = { mute: 0, applying: false, isHost: true, byNid: new Map(), recSplat() {}, recProj() {}, recBomb() {}, recZone() {}, recTower() {}, recPods() {}, recBoss() {},
    recKit() {}, sendDevHit() {}, shouldApplyHit: () => 'local', sendHit: () => false, applyRemote() {}, sendResult() {}, sendEnd() {}, ...extra }; };
  const netOff = () => { G.netm = null; for (const a of m.actors) if (a._tnid) { delete a.nid; delete a._tnid; } };
  // a remote player on this screen: its owner's packed tick played through the real NetMatch.applyRemote every frame
  const remote = (X) => {
    netOn();
    const ctx = { match: m, byNid: new Map(m.actors.map((a) => [a.nid, a])) };
    G.netm.applyRemote = (a, dt) => NM.NetMatch.prototype.applyRemote.call(ctx, a, dt);
    X.remote = true;
    X.net = { ready: true, cur: null, err: V(0, 0, 0), ev: V(0, 0, 0), prevGrounded: true, prevVy: 0, loops: {} };
    return {
      // the owner's tick: X packed as its owner's screen would send it, tracked there (by the other team) or not
      owner(tracked, time = 8) {
        const keep = { ...X.status }, net = X.remote; X.remote = false;
        X.status.track = tracked ? time : 0; X.status.trackTeam = tracked ? 1 - X.team : -1; X.status.reveal = 0; X.status.poison = 0;
        const pk = NM._packActor(X);
        Object.assign(X.status, keep); X.remote = net;
        X.net.cur = NM._unpackActor(pk, 0);
        return pk;
      },
      done() { X.remote = false; delete X.net; delete X.netStatus; netOff(); },
    };
  };

  try {
    // ============================================================================================ the wrapped arrow
    if (want('arrow')) {
      reset();
      const capsules = () => { let n = 0; G.scene.traverse((o) => { if (o.isMesh && o.geometry?.type === 'CapsuleGeometry' && o.material?.isShaderMaterial) n++; }); return n; };
      const caps0 = capsules();
      const F0 = V(0, 0, -6);
      put(foe, F0, Math.PI); put(me, V(0, 0, -14), 0); foe.setWeapon('shooter'); step(0.1);   // (a compact kit: the band at its own radius)
      // an Echo Orb onto the foe
      S._throw(me, SUBS.scan, V(F0.x, 1.6, F0.z), V(0, -1, 0), false);
      step(0.6);
      const r = rec(foe), p0 = foe.visualPos(V(0, 0, 0));
      const mine = []; G.scene.traverse((o) => { if (o.isMesh && (o === r.band || o === r.bandX || o.geometry === r.band.geometry)) mine.push(o); });
      R('the old sonar shell is gone (no shell / ping / ground ring, no capsule shell mesh) and so are the chevrons: ONE arrow — one strip geometry, drawn by a depth-tested mesh (+ the trackers\' hidden-part pass on the same strip)',
        r && !('shell' in r) && !('ping' in r) && !('ring' in r) && !('arrows' in r) && !('pts' in r) && SF.PULSE === undefined && SF.ARROWS === undefined && capsules() === caps0
        && r.band.geometry === r.bandX.geometry && mine.length === 2 && r.band.geometry.index.count / 3 === SF.bandGeometry().index.count / 3, { keys: r && Object.keys(r), caps: [caps0, capsules()], meshesOnTheStrip: mine.length });
      // its shape: the strip is a piece of upright cylinder wall (unit radius, put at r.R by the shader: BAND_R round a kid
      // with a compact weapon), facing out, spanning ~ARC, the head's height; the arrow cut from it is the game's squid
      // icon on its side — its head (the mantle and fins) ~1.8× the shaft (its body)
      const geo = r.band.geometry, P = geo.attributes.position.array, N = geo.attributes.normal.array, PY = geo.attributes.aPY.array;
      let rmin = 9, rmax = 0, out = 1, ymin = 9, ymax = -9, amin = 9, amax = -9;
      for (let i = 0, k = 0; i < P.length; i += 3, k += 2) {
        const rr = Math.hypot(P[i], P[i + 2]); rmin = Math.min(rmin, rr); rmax = Math.max(rmax, rr); ymin = Math.min(ymin, P[i + 1]); ymax = Math.max(ymax, P[i + 1]);
        out = Math.min(out, (N[i] * P[i] + N[i + 2] * P[i + 2]) / rr - Math.abs(N[i + 1]));
        amin = Math.min(amin, PY[k]); amax = Math.max(amax, PY[k]);
      }
      let tall = 0, cols = 0; for (let k = 0; k < PY.length; k += 4) { cols++; if (Math.abs(PY[k + 1]) > SF.SHAFT_H / 2 + 0.05) tall++; }
      const mats = r.band.material, deg = (x) => r2(x * 180 / Math.PI);
      const shape = { BAND_R: SF.BAND_R, R: r3(r.R), worldR: r3(r.band.scale.x), unit: [r3(rmin), r3(rmax)], outward: r3(out), height: [r2(ymin), r2(ymax)], shaft: r3(SF.SHAFT_H), head: r3(SF.HEAD_H), ratio: r2(SF.HEAD_H / SF.SHAFT_H), arcDeg: deg(SF.ARC), stripDeg: deg(amax - amin),
        sides: mats.map((m) => m.side), groups: geo.groups.length, uR: mats.every((m) => m.uniforms.uR.value === r.R), tallShare: r2(tall / cols) };
      R(`…its shape: an upright cylinder band ${SF.BAND_R} m round (hugging the kid), facing out, spanning ${shape.arcDeg}° (its head nearly meets its tail); shaft ${shape.shaft} m, head ${shape.ratio}× that; both sides drawn, its inside first; the strip hugs it (head-tall only at the ends)`,
        SF.BAND_R >= 0.6 && SF.BAND_R <= 0.65 && shape.R === SF.BAND_R && shape.uR && Math.abs(rmin - 1) < 1e-3 && Math.abs(rmax - 1) < 1e-3 && out > 0.999 && SF.SHAFT_H >= 0.22 && SF.SHAFT_H <= 0.3 && shape.ratio >= 1.7 && shape.ratio <= 1.9
        && shape.arcDeg >= 300 && shape.arcDeg <= 320 && shape.stripDeg >= shape.arcDeg && shape.stripDeg < shape.arcDeg + 15 && ymax >= SF.HEAD_H / 2 && ymax < SF.HEAD_H / 2 + 0.08 && ymin === -ymax
        && shape.groups === 2 && shape.sides[0] === THREE.BackSide && shape.sides[1] === THREE.FrontSide && shape.tallShare > 0.1 && shape.tallShare < 0.35, shape);
      // the squid's eyes in its head: rendered straight on (the camera square to the head, the arrow on / off), two
      // separate white eyes, one above the other with a clear gap, each with a dark pupil
      {
        const eyeAng = SF.ARC - 33 * 0.0098 / r.R;   // (the eyes sit 33 icon units back from the tip)
        r.band.updateMatrixWorld();
        const eye = V(Math.sin(eyeAng), 0, Math.cos(eyeAng)).applyMatrix4(r.band.matrixWorld);   // (the strip is unit-radius: the mesh's scale is the band's)
        const outw = eye.clone().sub(r.band.position).setY(0).normalize();
        const cam = G.camera, keep = { p: cam.position.clone(), q: cam.quaternion.clone(), fov: cam.fov };
        cam.position.copy(eye).addScaledVector(outw, 0.9); cam.fov = 40; cam.updateProjectionMatrix(); cam.lookAt(eye); cam.updateMatrixWorld();
        FX.update(0);
        const on = shot(); const vis = [r.band.visible, r.bandX.visible]; r.band.visible = r.bandX.visible = false; const off = shot(); r.band.visible = vis[0]; r.bandX.visible = vis[1];
        // bright (eye white) and dark (pupil / rim) pixels the arrow adds, as rows of the image: the white rows in runs
        const Wd = 320, Hd = 180, white = new Uint8Array(Wd * Hd), dark = new Uint8Array(Wd * Hd);
        for (let i = 0, k = 0; i < on.length; i += 4, k++) {
          const ch = Math.abs(on[i] - off[i]) + Math.abs(on[i + 1] - off[i + 1]) + Math.abs(on[i + 2] - off[i + 2]) > 24;
          if (!ch) continue;
          if (on[i] > 200 && on[i + 1] > 200 && on[i + 2] > 200) white[k] = 1; else if (on[i] < 25 && on[i + 1] < 25 && on[i + 2] < 25) dark[k] = 1;
        }
        // connected white blobs (4-neighbour flood fill), biggest two (a third white blob only counts against it in the
        //  eyes' column: the gloss streak and its sparkle can catch a few white pixels elsewhere on the head)
        const lab = new Int32Array(Wd * Hd), blobs = [];
        for (let k = 0; k < Wd * Hd; k++) {
          if (!white[k] || lab[k]) continue;
          const id = blobs.length + 1, st = [k]; lab[k] = id; let n = 0, y0 = Hd, y1 = 0, x0 = Wd, x1 = 0;
          while (st.length) { const j = st.pop(), x = j % Wd, y = (j / Wd) | 0; n++; y0 = Math.min(y0, y); y1 = Math.max(y1, y); x0 = Math.min(x0, x); x1 = Math.max(x1, x);
            for (const nb of [j - 1, j + 1, j - Wd, j + Wd]) if (nb >= 0 && nb < Wd * Hd && white[nb] && !lab[nb] && Math.abs((nb % Wd) - x) <= 1) { lab[nb] = id; st.push(nb); } }
          blobs.push({ n, y0, y1, x0, x1 });
        }
        blobs.sort((a2, b2) => b2.n - a2.n);
        const [e1, e2] = blobs;
        const pupil = (b2) => { let n = 0; for (let y = b2.y0; y <= b2.y1; y++) for (let x = b2.x0; x <= b2.x1; x++) if (dark[y * Wd + x]) n++; return n; };
        const eyes = { blobs: blobs.length, sizes: blobs.slice(0, 3).map((b2) => b2.n), stacked: !!(e1 && e2) && Math.abs((e1.x0 + e1.x1) - (e2.x0 + e2.x1)) / 2 < 6, gapPx: e1 && e2 ? Math.max(e1.y0, e2.y0) - Math.min(e1.y1, e2.y1) - 1 : null, pupils: e1 && e2 ? [pupil(e1), pupil(e2)] : null };
        cam.position.copy(keep.p); cam.quaternion.copy(keep.q); cam.fov = keep.fov; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
        R('…the squid\'s eyes sit in its head: straight on, two white eyes one above the other with a clear gap (not an 8), each with a dark pupil',
          e1 && e2 && e2.n > e1.n * 0.6 && e2.n > 40 && !blobs.slice(2).some((b2) => b2.n >= e2.n * 0.2 && Math.abs((b2.x0 + b2.x1) - (e1.x0 + e1.x1)) / 2 < 6) && eyes.stacked && eyes.gapPx >= 3 && eyes.pupils[0] > 5 && eyes.pupils[1] > 5, eyes);
      }
      // where it sits: round the foe at waist / chest height, the tracking team's colour, near-opaque
      const at = { dx: r3(r.band.position.x - p0.x), dz: r3(r.band.position.z - p0.z), y: r2(r.band.position.y - p0.y), scale: r3(r.band.scale.y), size: r3(r.size), team: r.team,
        colour: hex(mats[0].uniforms.uColor.value) === hex(G.teamColors[me.team]), notFoeColour: hex(mats[0].uniforms.uColor.value) !== hex(G.teamColors[foe.team]), alpha: r2(mats[0].uniforms.uAlpha.value) };
      R(`…round the foe (centred on it, ${SF.BAND_Y} m up: waist / chest), in the tracking team's colour (the foe's enemy), near-opaque`,
        Math.abs(at.dx) < 1e-3 && Math.abs(at.dz) < 1e-3 && Math.abs(at.y - SF.BAND_Y) < 0.05 && at.y > 0.7 && at.y < 1.1 && at.scale === at.size && at.team === me.team && at.colour && at.notFoeColour && at.alpha >= 0.95, at);
      // it turns round them the way it points (the camera still, so its size holds): a turn every 2π/SPIN; the head's tip
      // moves along the arrow's own heading; it bobs a little
      shotCam(V(F0.x, 6, F0.z - 6), V(F0.x, 0.8, F0.z));
      const tipW = (phi) => V(Math.sin(phi), 0, Math.cos(phi)).applyMatrix4(r.band.matrixWorld);
      r.band.updateMatrixWorld(); const rot0 = r.band.rotation.y, tip0 = tipW(SF.ARC), heading = tip0.clone().sub(tipW(SF.ARC - 0.05)).setY(0).normalize();
      step(1 / 60); r.band.updateMatrixWorld(); const moved = tipW(SF.ARC).sub(tip0).setY(0).normalize();
      let bmin = 9, bmax = -9; const rotA = r.band.rotation.y;
      step(1, () => { bmin = Math.min(bmin, r.band.position.y); bmax = Math.max(bmax, r.band.position.y); });
      const wrap = (d) => ((d % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI) - Math.PI, rot1 = r.band.rotation.y;
      step(2, () => { bmin = Math.min(bmin, r.band.position.y); bmax = Math.max(bmax, r.band.position.y); });   // (a whole bob)
      const spin = { perSec: r3(wrap(rot1 - rotA)), period: r2(2 * Math.PI / SF.SPIN), alongHeading: r3(moved.dot(heading)), bob: r3(bmax - bmin), first: r3(wrap(rotA - rot0)) };
      g.rig.follow(me, true);
      R(`…it turns round them the way it points (${spin.period} s a turn: the head's tip moves along its heading) and bobs a little`,
        Math.abs(spin.perSec - wrap(SF.SPIN)) < 0.03 && spin.period >= 2 && spin.period <= 3 && spin.alongHeading > 0.99 && spin.bob > 0.04 && spin.bob < 0.1, spin);
      // the tracking team sees it through walls: the hidden-part pass (GreaterDepth, drawn first), the depth-tested one over it
      const xr = { xray: r.bandX.visible, depthFunc: r.bandX.material.every((m) => m.depthFunc === THREE.GreaterDepth), base: r.band.material.every((m) => m.depthFunc === THREE.LessEqualDepth && m.depthTest), first: r.bandX.renderOrder < r.band.renderOrder, statsX: FX.stats.xray };
      foe.status.track = 0.3; step(0.5);
      const off = { on: r.on, band: r.band.visible, xray: r.bandX.visible, line: lineOn(foe), track: foe.status.track, bands: FX.stats.bands, lines: FX.stats.lines };
      R('…and it ends with the tracking (no arrow, no hidden-part pass, no line)', xr.xray && xr.depthFunc && xr.base && xr.first && !off.on && !off.band && !off.xray && !off.line && off.track === 0 && off.bands === 0 && off.lines === 0, { off, xr });
      // on your own kid (the follow view): fainter, depth-tested, the tracking team's (the foes') colour, no line
      reset();
      put(me, V(0, 0, -6), 0); step(0.1);
      S._throw(foe, SUBS.scan, V(0, 1.6, -6), V(0, -1, 0), false); step(0.6);
      const rm = rec(me), self = rm && { on: arrowOn(me), alpha: r2(rm.band.material[0].uniforms.uAlpha.value), xray: rm.bandX.visible, colour: hex(rm.band.material[0].uniforms.uColor.value) === hex(G.teamColors[foe.team]), line: lineOn(me), lines: FX.stats.lines };
      R(`…round your own kid it shows too, fainter (×${SF.SELF_A}), depth-tested, in the colour of the team that tracked you; no line`,
        G.local === me && self && self.on && self.alpha === SF.SELF_A && !self.xray && self.colour && !self.line && self.lines === 0, self);
    }

    // ============================================================================================ clear of the kid
    if (want('clear')) {
      // three kits — a compact one (the Spritzer), a long one (the charger's barrel), the widest (an open brolly) — idle,
      // walking and shooting, through more than a whole turn of the arrow: nothing of the kid (body or weapon: every
      // vertex) within the band's height reaches the band
      const v = V(0, 0, 0), c = V(0, 0, 0), res = {};
      const kidReach = (a, y0, y1) => {
        a.character.root.updateMatrixWorld(true); a.visualPos(c); let best = 0;
        a.character.root.traverseVisible((o) => {
          if (!o.isMesh || !o.geometry?.attributes?.position) return;
          const n = o.geometry.attributes.position.count, stp = o.isSkinnedMesh ? Math.max(1, Math.floor(n / 3000)) : 1;
          for (let i = 0; i < n; i += stp) { o.getVertexPosition(i, v); v.applyMatrix4(o.matrixWorld); if (v.y < y0 || v.y > y1) continue; best = Math.max(best, Math.hypot(v.x - c.x, v.z - c.z)); }
        });
        return best;
      };
      for (const wid of ['shooter', 'charger', 'brolly']) {
        reset();
        put(foe, V(0, 0, -6), Math.PI); put(me, V(0, 0, -11), 0); step(0.05);
        foe.setWeapon(wid); step(0.3);
        S.track(foe, me.team, 99); step(0.3);
        const r = rec(foe), o = { worst: 9, maxR: 0, minR: 9, samples: 0, maxReach: 0, maxRl: 0, maxS: 0 };
        for (const pose of ['idle', 'walk', 'shoot']) {
          put(foe, V(0, 0, -6), Math.PI);
          foe.bot.update = () => { zero(foe); foe.ink = PLAYER.inkMax; foe.aimYaw = foe.bot.aimYaw = Math.PI; foe.aimPitch = foe.bot.aimPitch = 0; if (pose === 'walk') foe.intent.move.set(0.7, 0, -0.7); if (pose === 'shoot') foe.intent.fire = true; };
          step(2.8, (i) => {
            if (i % 4) return;
            const sc = r.band.scale.y, y = r.band.position.y, hh = (SF.HEAD_H / 2) * sc;
            const reach = kidReach(foe, y - hh, y + hh), Rw = r.band.scale.x;
            o.worst = Math.min(o.worst, Rw - reach); o.maxR = Math.max(o.maxR, Rw); o.minR = Math.min(o.minR, Rw); o.maxReach = Math.max(o.maxReach, reach); o.maxRl = Math.max(o.maxRl, r.R); o.maxS = Math.max(o.maxS, r.size); o.samples++;
          });
          stub(foe);
        }
        res[wid] = { gapCm: r2(o.worst * 100), reachM: r3(o.maxReach), radius: [r3(o.minR), r3(o.maxR)], ownRadius: r3(o.maxRl), size: r2(o.maxS), samples: o.samples };
      }
      // what it costs: every other player tracked at once (seven arrows, each measuring its kid's hands), a frame's update
      reset();
      others.forEach((a, i) => { put(a, V(-9 + i * 3, 0, -4), Math.PI); S.track(a, 1 - a.team, 99); });
      step(0.3);
      const t0 = performance.now(); for (let i = 0; i < 240; i++) FX.update(1 / 60); const perFrame = (performance.now() - t0) / 240;
      res.cost = { bands: FX.stats.bands, msPerFrame: r3(perFrame) };
      const turn = 2 * 2.8 * SF.SPIN > 2 * Math.PI;
      R(`clear: the band never cuts the kid or their weapon — a Spritzer (it stays ${SF.BAND_R} m round), a charger and an open brolly (it opens out round them), idle / walking / shooting through more than a whole turn; seven at once cost under 1 ms a frame`,
        turn && ['shooter', 'charger', 'brolly'].every((k) => res[k].gapCm > 0.5 && res[k].samples > 100) && res.cost.bands === others.length && res.cost.msPerFrame < 1 && res.shooter.ownRadius === SF.BAND_R && res.shooter.size === 1 && res.charger.ownRadius > SF.BAND_R && res.brolly.ownRadius > SF.BAND_R, res);
    }

    // ============================================================================================ every source
    if (want('sources')) {
      const got = (a) => { const r = rec(a); return { track: r2(a.status.track), arrow: arrowOn(a), colour: !!r && hex(r.band.material[0].uniforms.uColor.value) === hex(G.teamColors[me.team]), line: lineOn(a) }; };
      reset();
      put(me, V(-6, 0, -6), 0); step(0.05); S.use(me, SUBS.mine); put(me, V(-6, 0, -16), 0); step(1);
      put(foe, V(-4.6, 0, -6), 0); step(1.2);
      const mine = got(foe);
      reset();
      put(me, V(0, 0, -14), 0); put(foe, V(0, 0, -6), Math.PI); step(0.1);
      me.aimYaw = me.yaw = 0; me.aimPitch = 0; me.aimDir.set(0, 0, 1); me.aimPoint.set(0, 1.0, -6);
      K.tracer.use(G.subs, me, SUBS.tracer); step(0.5);
      const tracer = got(foe);
      reset();
      foes.forEach((f, i) => put(f, V(-6 + i * 4, 0, -4), Math.PI)); put(me, V(0, 0, -14), 0); step(0.1);
      start(me, 'sonar'); step(0.8);
      const sonar = foes.map(got);
      const lines = foes.map((f) => rec(f)?.line).filter((l) => l && l.visible);
      const ends = foes.map((f) => { const r = rec(f); const c = f.visualPos(V(0, 0, 0)); c.y += SF.CHEST; return r ? r2(r.to.distanceTo(c)) : 9; });
      R('every source puts the arrow on in your colour, with your line: a Lurk Mine\'s blast, a Tracer Bolt hit, Deep Sonar (every foe: one line each, to each)',
        [mine, tracer, ...sonar].every((x) => x.track > 0 && x.arrow && x.colour && x.line) && lines.length === foes.length && FX.stats.lines === foes.length && Math.max(...ends) < 0.02,
        { mine, tracer, sonar, lines: lines.length, ends });
    }

    // ============================================================================================ through walls, per role
    if (want('walls')) {
      reset();
      // the foe behind the wall (x 14…15, 4 m tall); you 9 m off in front of it (you threw it), your teammate beside you
      // (didn't), the foe's teammate further along; each camera over that player's shoulder
      put(foe, V(18, 0, 0), -Math.PI / 2); put(me, V(9, 0, 0), Math.PI / 2); put(mate, V(9, 0, -4), Math.PI / 2); put(foe2, V(9, 0, 4), Math.PI / 2); step(0.1);
      S._throw(me, SUBS.scan, V(18, 1.6, 0), V(0, -1, 0), false); step(0.6);
      const r = rec(foe);
      const chestOf = (a) => a.visualPos(V(0, 0, 0)).add(V(0, SF.CHEST, 0));
      const view = (who, from) => {
        FX.viewer = who; shotCam(from, V(18, 0.8, who.pos.z * 0.3));
        if (r.line) r.line.material.resolution.set(320, 180);   // (its width in the small target's pixels)
        return { blocked: !G.physics.los(from, V(18, 0.8, 0)), xray: r.bandX.visible, px: pixels([r.band, r.bandX]), line: lineOn(foe), lines: FX.stats.lines,
          linePx: r.line && r.line.visible ? pixels([r.line]) : 0, fromChest: r.line && r.line.visible ? r2(r.from.distanceTo(chestOf(who))) : null, alpha: r2(r.band.material[0].uniforms.uAlpha.value),
          colour: !!r.line && hex(r.line.material.color) === hex(G.teamColors[who.team]) };
      };
      const you = view(me, V(5, 1.9, 0.6));
      const yourMate = view(mate, V(5, 1.9, -3.4));
      const theirMate = view(foe2, V(5, 1.9, 4.6));
      theirMate.depthTest = r.band.material.every((m) => m.depthTest && m.depthFunc === THREE.LessEqualDepth);
      // the tracked player themself: the arrow on their kid, no line
      FX.viewer = foe; step(0.05);
      const tracked = { arrow: arrowOn(foe), alpha: r2(r.band.material[0].uniforms.uAlpha.value), xray: r.bandX.visible, line: lineOn(foe), lines: FX.stats.lines };
      // … and the foe's teammate with it out in the open: the arrow, depth-tested
      put(foe, V(11, 0, 4.5), -Math.PI / 2); FX.viewer = foe2; shotCam(V(5, 1.9, 4.6), V(11, 0.8, 4.5));
      const open = { px: pixels([r.band, r.bandX]), xray: r.bandX.visible, alpha: r2(r.band.material[0].uniforms.uAlpha.value), line: lineOn(foe) };
      FX.viewer = null;
      R('walls: the tracking team sees the foe\'s arrow through the wall (an occluded GreaterDepth pass) and each their own line through it from their own chest, in their colour — you who threw it and your teammate who didn\'t',
        [you, yourMate].every((v) => v.blocked && v.xray && v.px > 60 && v.line && v.lines === 1 && v.linePx > 15 && v.fromChest !== null && v.fromChest < 0.35 && v.colour), { you, yourMate });
      R('…the tracked player\'s teammate: depth-tested (none of it through the wall), no line; in the open the arrow. The tracked player: the arrow on their own kid (fainter), no line',
        theirMate.blocked && !theirMate.xray && theirMate.depthTest && theirMate.px < 4 && !theirMate.line && theirMate.lines === 0 && open.px > 60 && !open.xray && open.alpha >= 0.9 && !open.line
        && tracked.arrow && tracked.alpha === SF.SELF_A && !tracked.xray && !tracked.line && tracked.lines === 0, { theirMate, open, tracked });
      g.rig.follow(me, true);
    }

    // ============================================================================================ size on screen
    if (want('clamp')) {
      reset();
      put(foe, V(0, 0, 10), Math.PI); step(0.1); S.track(foe, me.team, 99); step(0.3);
      const r = rec(foe);
      // the arrow's head height on screen, as a share of the screen's height (its drawn height at the band's depth)
      const onScreen = () => {
        const cam = G.camera; cam.updateMatrixWorld(); const fw = cam.getWorldDirection(V(0, 0, 0)), th = Math.tan((cam.fov * Math.PI) / 360);
        const z = r.band.position.clone().sub(cam.position).dot(fw);
        return r3((SF.HEAD_H * r.band.scale.y) / (2 * z * th));
      };
      shotCam(V(0, 22, -60), V(0, 0.8, 10));
      const far = { share: onScreen(), size: r2(r.size), R: r3(r.R), worldR: r3(r.band.scale.x), dist: r2(G.camera.position.distanceTo(foe.pos)) };
      shotCam(V(0.5, 1.3, 8.4), V(0, 0.85, 10));
      const near = { share: onScreen(), size: r2(r.size), R: r3(r.R), worldR: r3(r.band.scale.x) };
      shotCam(V(4, 2.4, 2), V(0, 0.8, 10));
      const mid = { share: onScreen(), size: r2(r.size), worldR: r3(r.band.scale.x) };
      R(`clamp: far off (${far.dist} m) the arrow grows (its head at least ${r2(SF.MIN_F * 100)} % of the screen\'s height); up close and in between it keeps its own size — its radius never under ${SF.BAND_R} m`,
        far.share >= SF.MIN_F * 0.99 && far.size > 1 && far.worldR > SF.BAND_R && near.size === 1 && near.worldR >= SF.BAND_R && mid.size === 1 && mid.worldR >= SF.BAND_R,
        { far, near, mid, MIN_F: SF.MIN_F });
      g.rig.follow(me, true);
    }

    // ============================================================================================ the line
    if (want('line')) {
      reset();
      put(me, V(0, 0, -14), 0); put(foe, V(1.5, 0, -6), Math.PI); put(mate, V(-6, 0, -12), 0.4); step(0.1);
      S._throw(me, SUBS.scan, V(1.5, 1.6, -6), V(0, -1, 0), false); step(0.6);
      const r = rec(foe), l = r.line;
      const chest = foe.visualPos(V(0, 0, 0)); chest.y += SF.CHEST;
      const mine = me.visualPos(V(0, 0, 0)); mine.y += SF.CHEST;
      const mm = l && l.material;
      const yours = { line: lineOn(foe), lines: FX.stats.lines, toChest: r2(r.to.distanceTo(chest)), fromY: r2(r.from.y - mine.y), fromOff: r2(Math.hypot(r.from.x - mine.x, r.from.z - mine.z)),
        toward: r3(((r.from.x - mine.x) * (chest.x - mine.x) + (r.from.z - mine.z) * (chest.z - mine.z)) / (Math.hypot(r.from.x - mine.x, r.from.z - mine.z) * Math.hypot(chest.x - mine.x, chest.z - mine.z))),
        colour: mm && hex(mm.color) === hex(G.teamColors[me.team]), px: mm && mm.linewidth, worldUnits: mm && mm.worldUnits, depthTest: mm && mm.depthTest, opacity: mm && r2(mm.opacity), transparent: mm && mm.transparent, isLine2: !!(l && l.isLine2) };
      R(`line: on your team's screen a thin line (Line2, ${SF.LINE_PX} px on screen) from your chest (${SF.CHEST} m up, a step toward them) to the middle of theirs, in your colour, translucent, through walls`,
        yours.line && yours.lines === 1 && yours.toChest < 0.01 && Math.abs(yours.fromY) < 0.01 && Math.abs(yours.fromOff - 0.3) < 0.01 && yours.toward > 0.999 && yours.colour && yours.px >= 1.5 && yours.px <= 2 && !yours.worldUnits && yours.depthTest === false && yours.opacity > 0.5 && yours.opacity < 0.9 && yours.transparent && yours.isLine2, yours);
      // it follows them: they walk and turn squid → it ends at the squid's middle
      put(foe, V(4, 0, -4), Math.PI); foe.bot.update = () => { zero(foe); foe.intent.squid = true; }; step(0.4);
      const sq = foe.visualPos(V(0, 0, 0)); sq.y += SF.CHEST_SQ;
      const follow = { form: foe.form, toSquid: r2(r.to.distanceTo(sq)), line: lineOn(foe) };
      stub(foe); step(0.4);
      // your teammate's screen (they didn't throw it): their own line, from their chest, the arrow through walls
      FX.viewer = mate; step(0.05);
      const mc = mate.visualPos(V(0, 0, 0)); mc.y += SF.CHEST;
      const mateView = { line: lineOn(foe), lines: FX.stats.lines, from: r2(r.from.distanceTo(mc)), xray: r.bandX.visible, colour: hex(r.line.material.color) === hex(G.teamColors[mate.team]) };
      // the tracked player's screen and their teammate's: no line
      FX.viewer = foe; step(0.05); const trackedView = { line: lineOn(foe), lines: FX.stats.lines, arrow: arrowOn(foe) };
      FX.viewer = foe2; step(0.05); const theirMate = { line: lineOn(foe), lines: FX.stats.lines, arrow: arrowOn(foe), xray: r.bandX.visible };
      FX.viewer = null; step(0.05);
      R('…it follows them (to a squid\'s middle); your teammate who didn\'t throw it gets their own line (from their chest) on their screen; the tracked player and their teammates get none',
        follow.form === 'squid' && follow.line && follow.toSquid < 0.01 && mateView.line && mateView.lines === 1 && mateView.from < 0.35 && mateView.xray && mateView.colour
        && !trackedView.line && trackedView.lines === 0 && trackedView.arrow && !theirMate.line && theirMate.lines === 0 && theirMate.arrow && !theirMate.xray, { follow, mateView, trackedView, theirMate });
      // only your teammate tracked them: you get the line all the same; their Deep Sonar: a line to every foe
      reset();
      put(me, V(0, 0, -14), 0); put(foe, V(0, 0, -6), Math.PI); step(0.1);
      S._throw(mate, SUBS.scan, V(0, 1.6, -6), V(0, -1, 0), false); step(0.6);
      const mateThrew = { arrow: arrowOn(foe), line: lineOn(foe), lines: FX.stats.lines };
      reset();
      foes.forEach((f, i) => put(f, V(-6 + i * 4, 0, -4), Math.PI)); put(me, V(0, 0, -14), 0); step(0.1);
      start(mate, 'sonar'); step(0.8);
      const sonar = { lines: FX.stats.lines, of: foes.length, ends: foes.map((f) => { const c = f.visualPos(V(0, 0, 0)); c.y += SF.CHEST; return r2(rec(f).to.distanceTo(c)); }) };
      // the track ends: nothing
      reset();
      put(me, V(0, 0, -14), 0); put(foe, V(0, 0, -6), Math.PI); step(0.1);
      S._throw(me, SUBS.scan, V(0, 1.6, -6), V(0, -1, 0), false); step(0.6);
      const was = lineOn(foe); foe.status.track = 0.2; step(0.4);
      const ended = { was, line: lineOn(foe), lines: FX.stats.lines };
      // splatted: your lines go while you're down
      S.track(foe, me.team, 99); step(0.1); const up = lineOn(foe); me.alive = false; FX.update(0); const down = lineOn(foe); me.alive = true; FX.update(0);
      R('…a teammate\'s track gives you a line too (their Deep Sonar: one to every foe); none once the track ends, none while you\'re splatted',
        mateThrew.arrow && mateThrew.line && mateThrew.lines === 1 && sonar.lines === sonar.of && Math.max(...sonar.ends) < 0.02 && ended.was && !ended.line && ended.lines === 0 && up && !down, { mateThrew, sonar, ended, up, down });
    }

    // ============================================================================================ online
    if (want('net')) {
      reset();
      const X = foe2 || foe; put(X, V(4, 0, -6), Math.PI); put(me, V(0, 0, -14), 0); step(0.1);
      const net = remote(X);
      try {
        // the owner's screen says they're tracked: the tick's flag alone (two teams: by the other one, yours)
        const pk = net.owner(true); const up = NM._unpackActor(pk, 0);
        step(0.3);
        const r = rec(X);
        const yours = { flag: (pk[10] & NM.NET_FLAGS.tracked) !== 0, upFlag: (up.f & NM.NET_FLAGS.tracked) !== 0, fields: pk.length, netStatus: X.netStatus, localTrack: X.status.track, arrow: arrowOn(X), xray: r.bandX.visible, line: lineOn(X),
          colour: hex(r.band.material[0].uniforms.uColor.value) === hex(G.teamColors[me.team]) };
        // … on its teammate's screen: the arrow depth-tested, no line
        FX.viewer = foe; step(0.05);
        const theirs = { arrow: arrowOn(X), xray: r.bandX.visible, line: lineOn(X), lines: FX.stats.lines };
        FX.viewer = null; step(0.05);
        // … not tracked
        const pk0 = net.owner(false); step(0.2);
        const none = { flag: (pk0[10] & NM.NET_FLAGS.tracked) !== 0, netStatus: X.netStatus, arrow: arrowOn(X), line: lineOn(X), fields: pk0.length };
        // a mark this screen's own (ghost) subs put on a remote player runs out here too (Actor.update doesn't run for it)
        X.status.track = 0.4; X.status.trackTeam = me.team; step(0.2); const mid = arrowOn(X); step(0.4);
        none.timer = { mid, after: r2(X.status.track), arrow: arrowOn(X) };
        R('net: the tick\'s tracked flag is all it takes (24 fields as before: two teams, so tracked = by the other one): a remote player its owner says is tracked wears the arrow in your colour through walls with your line here; on its teammate\'s screen the arrow depth-tested, no line; untracked: nothing; a mark made here runs out here',
          yours.flag && yours.upFlag && yours.fields === 24 && yours.netStatus === SF.NET_TRACKED && yours.localTrack === 0 && yours.arrow && yours.xray && yours.line && yours.colour
          && theirs.arrow && !theirs.xray && !theirs.line && theirs.lines === 0 && !none.flag && none.netStatus === 0 && !none.arrow && !none.line && none.fields === 24
          && none.timer.mid && none.timer.after === 0 && !none.timer.arrow, { yours, theirs, none });
      } finally { net.done(); }
    }

    // ============================================================================================ no names
    if (want('names')) {
      reset();
      put(me, V(0, 0, -14), 0); put(foe, V(0, 0, -6), Math.PI); step(0.1);
      let fr = null; const hu = g.hud, u0 = hu && hu.update;
      if (hu) hu.update = function (dt, f) { fr = f; return u0.call(this, dt, f); };
      try {
        S._throw(me, SUBS.scan, V(0, 1.6, -6), V(0, -1, 0), false); step(0.6);
        const tracked = foe.status.track > 0 && arrowOn(foe);
        const mk = fr ? fr.markers : null;
        const named = mk ? mk.filter((x) => x.name === foe.name || x.tracked) : null;
        const dom = [...document.querySelectorAll('.iw-mk')].filter((e) => e.style.display !== 'none' && (/TRACKED/.test(e.textContent) || (!!foe.name && e.textContent.includes(foe.name))));
        const allies = mk ? mk.map((x) => x.name) : null;
        // the looks are meshes and a line: no sprite, no canvas text
        const r = rec(foe), objs = [r.band, r.bandX, r.line].filter(Boolean);
        const kinds = objs.map((o) => (o.isLine2 ? 'Line2' : o.isMesh ? 'Mesh' : o.type));
        const texts = objs.filter((o) => o.isSprite || [].concat(o.material).some((mt) => Object.values(mt.uniforms || {}).some((u) => u && u.value && u.value.isTexture))).length;
        R('names: no name over a tracked enemy — the HUD\'s world markers carry your allies only (none for the foe, none marked tracked), nothing on screen names them, and the looks are meshes and a line (no sprite, no text)',
          tracked && mk && named.length === 0 && dom.length === 0 && allies.every((n) => mates.some((a) => a.name === n)) && texts === 0 && kinds.every((k) => k === 'Mesh' || k === 'Line2'),
          { tracked, markers: allies, named: named && named.length, dom: dom.length, kinds });
      } finally { if (hu) hu.update = u0; }
    }

    // ============================================================================================ poison still
    if (want('poison')) {
      reset();
      put(foe, V(0, 0, -6), Math.PI); put(me, V(0, 0, -14), 0); step(0.1);
      const near = (a, rr = 1.4) => FX.parts.filter((q) => Math.hypot(q.x - a.pos.x, q.z - a.pos.z) < rr);
      S._throw(me, SUBS.mist, V(0, 1.0, -7.4), V(0, 0, 9), false);
      S.track(foe, me.team, 3);
      const e0 = FX.stats.emitted; let maxN = 0, bub = 0, wisp = 0;
      step(1.5, () => { const ps = near(foe); maxN = Math.max(maxN, ps.length); for (const q of ps) { if (q.bub) bub++; else wisp++; } });
      const rate = (FX.stats.emitted - e0) / 1.5;
      const both = { poison: r2(foe.status.poison), rate: r2(rate), maxAlive: maxN, bubbles: bub > 0, wisps: wisp > 0, arrow: arrowOn(foe), line: lineOn(foe), mesh: FX.partMesh.visible };
      put(foe, V(10, 0, 20), Math.PI); foe.status.poison = 0; step(0.1); const e1 = FX.stats.emitted; step(2.2);
      const stop = { after: FX.stats.emitted - e1, left: FX.parts.length };
      R('poison: the murky bubbles and wisps still rise off a poisoned foe (5–18 a second; with the arrow and line on at the same time), stop with it and fade',
        both.poison > 0 && rate >= 5 && rate <= 18 && maxN >= 5 && both.bubbles && both.wisps && both.arrow && both.line && both.mesh && stop.after === 0 && stop.left === 0, { both, stop });
    }
  } catch (e) {
    R('harness error', false, String(e && e.stack || e).slice(0, 700));
  } finally {
    hook = null; FX.viewer = null; S.viewer = null; netOff();
    delete P.applyHit; if (P.applyHit !== hit0) P.applyHit = hit0;
    if (G.fx) { G.fx.onDropletLand = land0; G.fx.onSpeck = speck0; }
    for (const a of m.actors) if (a.bot) delete a.bot.update;
    S.clear(); P.clear();
    RT.dispose();
    g.rig.follow(me, true);
  }
  return out;
})()
