// Two-handed holds (batch 5, "make the player hold brush rollers blasters and brollys with both hands"): pictures of a kid
// holding each weapon in each state, from the front / the off-hand (left) side / the back / the weapon (right) side.
// For tools/botlab/hud-shots.cjs (any MAP; testbox is a clean flat deck):
//   MAP=testbox MODE=turf PLAY=1 CROP=0,0,1,1 SCENES=tools/botlab/scenes/holds.js OUT=/dir tools/botlab/run.sh tools/botlab/hud-shots.cjs
// PRE_ARGS='w=brush,roller s=stand,run v=front,left' picks weapons / states / views (default: the four two-handed weapons,
// every state, the four views); the stitched sheets: tools/botlab/jobs/batch5/holds/sheets.py.
// Scenes are named <weapon>-<state>-<view>: the first view of a state sets it up (a real actor, its intents driven: the
// weapon runner, the pose layers and the IK all run as in a match), the other views only move the camera and render the
// same frozen frame again.
//   states: stand (idle 2 s) · run (full speed) · fire (the weapon's main action held: blaster / brolly shots, the brush's
//   swipes, the roller's flick) · roll (fire held while moving: the roller's roll, the brush's dash; the brolly's open
//   canopy) · jump (the rise, near the apex) · lobby / victory / defeat / idle / locker (the menu and podium dances)
(async () => {
  const g = window.__inkwave, m = g.match, dbg = g.debug, THREE = await import('three');
  const G = window.__G;
  dbg.freeze();
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const DT = 1 / 60;
  const step = (s) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) dbg.step(1000 / 60); };
  const me = m.local, others = m.actors.filter((a) => a !== me);
  const kid = others.find((a) => a.team === me.team) || others[0];
  const drive = { move: V(0, 0, 0), fire: false, jump: false };
  const zero = (a) => { const it = a.intent; it.move.set(0, 0, 0); it.fire = it.squid = it.jump = it.sub = it.special = false; };
  for (const a of m.actors) if (a.bot) a.bot.update = () => { zero(a); if (a === kid) { a.intent.move.copy(drive.move); a.intent.fire = drive.fire; a.intent.jump = drive.jump; a.aimYaw = a.yaw; a.aimPitch = 0; if (a.bot) { a.bot.aimYaw = a.yaw; a.bot.aimPitch = 0; } } };
  // everyone else parked far off and hidden
  m.actors.forEach((a, i) => { if (a === kid) return; a.pos.set(-24 + (i % 4) * 1.5, 0.02, 36 + Math.floor(i / 4) * 1.5); a.vel.set(0, 0, 0); a.character.setVisible?.(false); a.character.root.visible = false; a.update = () => {}; });
  for (const a of m.actors) { if (!a.alive) a.respawn?.(); a.hp = 1e6; a.invuln = 0; }
  const hideHud = () => { g.hud?.setVisible(false); document.querySelectorAll('.iw-hud, .iw-ui, #fade').forEach((e) => { e.style.visibility = 'hidden'; }); };
  const put = (p, yaw = 0) => { kid.pos.copy(p); kid.pos.y += 0.02; kid.vel.set(0, 0, 0); kid.yaw = kid.aimYaw = yaw; kid.aimPitch = 0; };
  // the camera: a view round the kid (kid space: +z ahead of the kid, +x its left), looking at its chest
  const VIEWS = { front: [0, 0.95, 3.4], left: [3.4, 0.95, 0.2], back: [0, 1.05, -3.4], right: [-3.4, 0.95, 0.2], high: [2, 2.6, 2.4] };
  // close-ups of the off hand: 'hand' from ahead and to its left, 'handb' from its side (the wrist), 'handd' from below
  const NEAR = { hand: [0.3, 0.1, 0.4], handb: [0.45, 0.12, -0.12], handd: [0.12, -0.42, 0.22] };
  const camAt = (view) => {
    const c = kid.character.root, p = c.position, y = kid.yaw;
    const cs = Math.cos(y), sn = Math.sin(y);
    if (NEAR[view]) {
      const v = NEAR[view], look = new THREE.Vector3(); kid.character.bones.handL.getWorldPosition(look);
      return { from: V(look.x + v[0] * cs + v[2] * sn, look.y + v[1], look.z - v[0] * sn + v[2] * cs), look };
    }
    const v = VIEWS[view];
    const from = V(p.x + v[0] * cs + v[2] * sn, p.y + v[1], p.z - v[0] * sn + v[2] * cs), look = V(p.x, p.y + 0.74, p.z);
    return { from, look };
  };
  const hold = (view) => { const { from, look } = camAt(view); g.settings.fov = 38; g.rig.cinematic(from, from, look, look, 99, () => {}); };
  const render = (view) => {
    const { from, look } = camAt(view), cam = G.camera;
    cam.position.copy(from); cam.lookAt(look); cam.fov = 30; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    if (G.renderer?.shadowMap) G.renderer.shadowMap.needsUpdate = true;
    g.R.render();
  };
  const settle = (s) => { for (let i = 0, n = Math.round(s * 60); i < n; i++) { kid.ink = 100; dbg.step(1000 / 60); } };
  const START = V(0, 0, -6);
  const STATES = {
    stand: () => { put(START, 0); settle(2.2); },
    run: () => { put(V(0, 0, -5), 0); drive.move.set(0, 0, 1); settle(1.6); },
    fire: (w) => {
      put(START, 0);
      settle(0.6);
      if (w === 'roller') { drive.fire = true; settle(0.05); drive.fire = false; settle(0.17); return; }        // mid-whip of the flick
      if (w === 'brush') { drive.fire = true; settle(0.55); return; }
      if (w === 'brolly') { drive.fire = true; settle(0.06); drive.fire = false; settle(0.05); return; }
      drive.fire = true; settle(0.3); drive.fire = false; settle(0.12);                                         // blaster: the shot's pump
    },
    roll: (w) => {
      put(V(0, 0, -5), 0);
      if (w === 'brolly' || w === 'blaster') { settle(0.4); drive.fire = true; settle(0.6); return; }        // brolly: the canopy held open
      drive.move.set(0, 0, 1); settle(0.3); drive.fire = true; settle(1.2);
    },
    jump: () => { put(START, 0); settle(0.8); drive.jump = true; settle(0.05); drive.jump = false; settle(0.22); },
  };
  const DANCES = { lobby: 'lobby_pose', victory: 'victory', defeat: 'defeat', idle: 'menu_idle', locker: 'locker_idle' };
  const arg = (k) => { const r = new RegExp(`(?:^|\\s)${k}=([\\w,]+)`).exec(window.__preArgs || ''); return r ? r[1].split(',').filter(Boolean) : null; };
  const WEAPONS = arg('w') || ['brush', 'roller', 'blaster', 'brolly'];
  // what-ifs: '… tune:{"roller":{"carry":{…}}}' replaces those fields of the weapon's hold (as tests/holds.js)
  const TUNE = (() => { const a = window.__preArgs || '', i = a.indexOf('tune:'); return i >= 0 ? JSON.parse(a.slice(i + 5)) : null; })();
  const STATE_LIST = arg('s') || ['stand', 'run', 'fire', 'roll', 'jump', 'lobby', 'victory', 'defeat'];
  const VIEW_LIST = arg('v') || ['front', 'left', 'back', 'right'];
  const reset = () => { drive.move.set(0, 0, 0); drive.fire = false; drive.jump = false; kid.character.setDance?.(null); };
  const scenes = [];
  for (const w of WEAPONS) for (const st of STATE_LIST) VIEW_LIST.forEach((view, vi) => {
    scenes.push({ name: `${w}-${st}-${view}`, wait: 60, set: async () => {
      hideHud();
      if (vi === 0) {
        reset(); kid.setWeapon(w); kid.character.root.visible = true; kid.character.setVisible?.(true);
        if (TUNE && TUNE[w]) Object.assign(kid.character.hold, TUNE[w]);
        hold('front');
        const dv = /^(victory|defeat)(\d)$/.exec(st);
        if (DANCES[st] || dv) { put(START, 0); settle(0.4); kid.character.setDance(dv ? dv[1] : DANCES[st]); kid.character.danceVar = dv ? +dv[2] : 0; settle(dv ? [[1.0, 1.9, 0.9], [1.5, 2.5, 1.5]][dv[1] === 'victory' ? 0 : 1][+dv[2]] : st === 'victory' ? 1.0 : st === 'lobby' ? 1.0 : 1.5); }
        else STATES[st](w);
        hold('front'); dbg.step(1000 / 60);
      }
      render(view);
      const ch = kid.character;
      return { w, st, view, at: [+kid.pos.x.toFixed(2), +kid.pos.y.toFixed(2), +kid.pos.z.toFixed(2)], yaw: +kid.yaw.toFixed(2), kind: ch.weaponKind, anim: ch.animKind, wTwo: +(ch.wTwo || 0).toFixed(2), grounded: kid.grounded, rolling: !!kid.weaponRunner?.rolling };
    }, moment: () => { let n = 0; const f = () => { render(view); if (++n < 3) requestAnimationFrame(f); }; requestAnimationFrame(f); } });
  });
  window.__hudScenes = scenes;
  return scenes.map((s) => ({ name: s.name }));
})();
