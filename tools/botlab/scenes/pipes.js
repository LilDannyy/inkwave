// Pictures of the Tubeway (src/game/pipes.js) on Gulper Aquarium, through hud-shots.cjs (the HUD on where it matters):
//   MAP=aquarium SCENES=tools/botlab/scenes/pipes.js PRE_ARGS=<set> OUT=/dir tools/botlab/run.sh tools/botlab/hud-shots.cjs
// sets: rider (a Kelp Line ride UP as the rider sees it: 6 frames) · bystander (an enemy rider through the Great Tank as a
// player on the court sees it: 4 frames) · mouths (a two-way and a one-way mouth, its OUT end, a lit exit) · tide (the
// warning in the HUD and in the world) · map (the corner map with the network, a rider and its lit exit) · spawn (the
// spawn's play camera, both teams, and Alpha's with a teammate riding the Express)
(() => {
  const g = window.__inkwave, set = String(window.__preArgs || 'rider');
  const dbg = g.debug, M = () => g.match, P = () => g.match.pipes;
  const step = (s) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) dbg.step(1000 / 60); };
  let THREE = null;
  const V = (a) => new THREE.Vector3(a[0], a[1], a[2]);
  const me = () => M().local;
  const freeze = () => { dbg.freeze(); for (const a of M().actors) { if (a.bot) a.bot.update = () => {}; a.intent.move.set(0, 0, 0); a.intent.fire = a.intent.squid = a.intent.jump = a.intent.sub = a.intent.special = false; if (a.specialActive) __G.specials?.end?.(a, 'shots'); a.pipeCd = 0; } };
  const leg = (id) => P().legs.find((l) => l.id === id);
  const put = (a, x, y, z, yaw) => { a.pos.set(x, y, z); a.vel.set(0, 0, 0); if (yaw !== undefined) { a.yaw = yaw; a.aimYaw = yaw; } };
  const away = (a, k) => put(a, -30 + k * 4, 0, k % 2 ? -12 : 12);
  const cine = (from, look, fov = 62) => { g.settings.fov = fov; g.rig.cinematic(V(from), V(from), V(look), V(look), 99, () => {}); step(1 / 60); };
  const follow = () => { g.settings.fov = window.__fov0 ?? g.settings.fov; g.rig.follow(me(), true); };
  const hud = (on) => { g.hud?.setVisible(on); };
  const facing = (a, e) => Math.atan2(-e.out[0], -e.out[2]);
  const scenes = [];
  // (everyone alive and at full health first: a player splatted during the warm-up play would leave the splat screen's
  // camera and desaturation over every picture)
  const init = async () => {
    THREE = await import('three'); if (window.__fov0 === undefined) window.__fov0 = g.settings.fov; freeze();
    for (const a of M().actors) { if (!a.alive) a.respawn(); a.hp = 100; }
    step(1.6); for (const a of M().actors) { a.invuln = 0; a.hp = 100; }
  };
  const S = (name, fn, wait) => scenes.push({ name, set: async () => { if (!THREE) await init(); return fn(); }, wait });
  if (set === 'rider') {
    // a Kelp Line ride UP from Alpha's Reef Hall (the low stop in the E drum's foot) to Bravo's promenade
    let e;
    S('ride-1-at-the-mouth', () => {
      const a = me(); e = leg('kelp').ends[0];
      for (const [k, o] of M().actors.entries()) if (o !== a) away(o, k);
      put(a, e.approach[0] + e.out[0] * 1.6, e.approach[1], e.approach[2] + e.out[2] * 1.6, facing(a, e));
      follow(); hud(true); g.rig.yaw = facing(a, e); g.rig.pitch = -0.12;
      for (let i = 0; i < 24; i++) { a.intent.move.set(-e.out[0] * 0.35, 0, -e.out[2] * 0.35); dbg.step(1000 / 60); }
      a.intent.move.set(0, 0, 0); step(0.2);
      return { prompt: P().prompt(a) };
    });
    S('ride-2-suck', () => { const a = me(); for (let i = 0; i < 60 && !a.pipe; i++) { a.intent.move.set(-e.out[0], 0, -e.out[2]); dbg.step(1000 / 60); } a.intent.move.set(0, 0, 0); step(0.12); return { phase: a.pipe?.phase }; });
    S('ride-3-up-the-kelp-drum', () => { step(0.32); const a = me(); return { phase: a.pipe?.phase, u: a.pipe?.u, y: a.pos.y, water: P().camInWater }; });
    S('ride-4-over-their-promenade', () => { step(0.55); const a = me(); return { u: a.pipe?.u, y: a.pos.y }; });
    S('ride-5-turning-to-the-exit', () => { const a = me(); const L = leg('kelp').len; for (let i = 0; i < 90 && a.pipe && a.pipe.phase === 'ride' && (L - a.pipe.u) / a.pipe.v > 0.3; i++) dbg.step(1000 / 60);
      const c = __G.camera.position; return { left: a.pipe && (L - a.pipe.u) / a.pipe.v, pos: a.pos.toArray().map((v) => +v.toFixed(2)), cam: c.toArray().map((v) => +v.toFixed(2)), form: a.anim.form, chip: !!document.querySelector('.iw-pp-ride.is-on'), boom: +g.rig.curDist.toFixed(2) }; });
    S('ride-6-pop', () => { const a = me(); for (let i = 0; i < 40 && a.pipe && a.pipe.phase !== 'pop'; i++) dbg.step(1000 / 60); step(0.22); return { phase: a.pipe?.phase, y: a.pos.y }; });
  }
  if (set === 'bystander') {
    // a player on the court's west side watches an enemy ride the Gulper Run east → west under the Glass Walk
    let bot;
    const go = (t) => () => { const a = bot; for (let i = 0; i < 300 && a.pipe && P()._T(a.pipe) < t; i++) dbg.step(1000 / 60); return { phase: a.pipe?.phase, s: a.pipe?.s, lit: P().lit.map((L) => L.n) }; };
    S('bystander-1-exit-lit', () => {
      const a = me();
      bot = M().actors.find((o) => o.team !== a.team && o.bot);
      for (const [k, o] of M().actors.entries()) if (o !== a && o !== bot) away(o, k);
      const gl = leg('gulper');
      // (on the court's SW side, looking past the west gulper head into the Great Tank)
      const yaw = Math.atan2(-6 + 16, 0 + 8.5);
      put(a, -16, 0, -8.5, yaw); follow(); hud(true); g.rig.yaw = yaw; g.rig.pitch = -0.12; step(0.4);
      const eE = gl.ends[0]; put(bot, eE.approach[0], eE.approach[1], eE.approach[2]); step(0.1);
      P().debugRide(bot, 'gulper', 0);
      return go(0.45)();
    });
    S('bystander-2-under-the-glass-walk', go(0.95));
    S('bystander-3-chime', go(1.35));
    S('bystander-4-pop', () => { const a = bot; for (let i = 0; i < 120 && a.pipe && a.pipe.phase !== 'pop'; i++) dbg.step(1000 / 60); step(0.12); return { phase: a.pipe?.phase }; });
  }
  if (set === 'mouths') {
    S('mouth-two-way-arch', () => { hud(false); for (const [k, o] of M().actors.entries()) away(o, k); const e = leg('arch').ends[0]; cine([e.pos[0] + e.out[0] * 5.5 + 1.2, 2.1, e.pos[2] + e.out[2] * 5.5 + 1.6], [e.pos[0], 1.3, e.pos[2]]); step(0.3); return 1; });
    S('mouth-one-way-in-express', () => { const e = leg('express').ends[0]; cine([e.pos[0] + e.out[0] * 5.0 - 1.5, 2.2, e.pos[2] + e.out[2] * 5.0 + 1.0], [e.pos[0], 1.2, e.pos[2]]); step(0.3); return 1; });
    S('mouth-one-way-out-express', () => { const e = leg('express').ends[1]; cine([e.pos[0] + e.out[0] * 5.0 + 1.5, 3.2, e.pos[2] + e.out[2] * 5.0], [e.pos[0], 2.2, e.pos[2]]); step(0.3); return 1; });
    S('mouth-two-way-lit-by-a-rider', () => {
      const bot = M().actors.find((o) => o !== me() && o.team !== me().team), e = leg('arch').ends[1];
      const a0 = leg('arch').ends[0]; put(bot, a0.approach[0], a0.approach[1], a0.approach[2]); step(0.05); P().debugRide(bot, 'arch', 0); step(0.9);
      cine([e.pos[0] + e.out[0] * 5.0 - 1.2, 3.9, e.pos[2] + e.out[2] * 5.0 + 0.8], [e.pos[0], 3.4, e.pos[2]]); return { lit: P().lit[e.i].n };
    });
  }
  if (set === 'tide') {
    S('tide-warning-hud', () => {
      const a = me(), e = leg('kelp').ends[0];
      for (const [k, o] of M().actors.entries()) if (o !== a) away(o, k);
      M().time = M().duration - 82.6; P().S.clock.t = 82.6; dbg.step(1000 / 60);
      put(a, e.approach[0] + e.out[0] * 3.2 - 0.6, e.approach[1], e.approach[2] + e.out[2] * 3.2, facing(a, e)); follow(); hud(true); g.rig.yaw = facing(a, e); g.rig.pitch = -0.08;
      step(1.0); return { flow: P().flow(), line: document.querySelector('.iw-pp-line.is-on')?.textContent };
    });
    S('tide-warning-world-gauges', () => {
      hud(false); cine([7.5, 10.4, -15.0], [4.5, 10.6, -25.0], 42);
      step(0.4); return { flow: P().flow() };
    });
    S('tide-flip-world', () => {
      for (let i = 0; i < 600 && P().flow().dir === 'ab'; i++) dbg.step(1000 / 60);
      step(0.5); return { flow: P().flow() };
    });
    S('tide-flip-hud', () => {
      const a = me(), e = leg('kelp').ends[0];
      for (let i = 0; i < 90 && P().flow().phase !== 'run'; i++) dbg.step(1000 / 60);
      follow(); hud(true); g.rig.yaw = facing(a, e); step(0.6);
      return { flow: P().flow(), line: document.querySelector('.iw-pp-line.is-on')?.textContent };
    });
  }
  if (set === 'map') {
    S('map-rider-and-lit-exit', () => {
      const a = me(), bot = M().actors.find((o) => o.bot && o.team !== a.team);
      for (const [k, o] of M().actors.entries()) if (o !== a && o !== bot) away(o, k);
      const e = leg('express~').ends[0]; put(bot, e.approach[0], e.approach[1], e.approach[2]); step(0.05);
      P().debugRide(bot, 'express~', 0); step(1.3);
      follow(); hud(true); step(0.1);
      return { rider: bot.pipe?.phase, revealed: true };
    });
    // the same map at four times the size, laid over the screen (the corner map is ~ 110 px wide): the network, the
    // enemy rider's dot on the Express, its lit exit's ring, the Kelp Lines' arrows
    S('map-enlarged', () => {
      const mm = g.minimap; mm._compose(0);
      const c = document.createElement('canvas'), k = Math.min((innerHeight - 40) / mm.h, (innerWidth - 40) / mm.w);
      c.width = Math.round(mm.w * k); c.height = Math.round(mm.h * k);
      const x = c.getContext('2d'); x.imageSmoothingEnabled = true; x.drawImage(mm.canvas, 0, 0, c.width, c.height);
      c.id = 'aq-mapbig'; Object.assign(c.style, { position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', zIndex: 99999, borderRadius: '18px', boxShadow: '0 0 0 4px #15121c, 0 0 40px rgba(0,0,0,.6)', background: '#123' });
      document.body.appendChild(c);
      return { w: c.width, h: c.height };
    });
  }
  if (set === 'spawn') {
    S('spawn-play-camera-alpha', () => {
      const a = me();
      for (const [k, o] of M().actors.entries()) if (o !== a) away(o, k);
      const pad = __G.level.spawnPads[a.team];
      put(a, pad.x, pad.y, pad.z, Math.atan2(-pad.x, -pad.z)); hud(false); follow(); g.rig.yaw = Math.atan2(-pad.x, -pad.z); g.rig.pitch = -0.13;
      step(1.2);
      const c = __G.camera; window.__spawnCam = { p: c.position.toArray(), d: c.getWorldDirection(new THREE.Vector3()).toArray() };
      return window.__spawnCam;
    });
    S('spawn-play-camera-alpha-express-rider', () => {
      const a = me(), mate = M().actors.find((o) => o !== a && o.team === a.team), lg = leg(a.team === 0 ? 'express' : 'express~');
      const e = lg.ends[0]; put(mate, e.approach[0], e.approach[1], e.approach[2]); step(0.05);
      P().debugRide(mate, lg.id, 0); for (let i = 0; i < 200 && mate.pipe && mate.pipe.u < 33; i++) dbg.step(1000 / 60);
      return { u: mate.pipe?.u };
    });
    S('spawn-play-camera-bravo', () => {
      const c = window.__spawnCam, p = c.p, d = c.d;
      step(2.5);
      cine([-p[0], p[1], -p[2]], [-p[0] - d[0] * 20, p[1] + d[1] * 20, -p[2] - d[2] * 20], window.__fov0);
      step(0.2);
      return 1;
    });
  }
  window.__hudScenes = scenes;
  return scenes.map((s) => ({ name: s.name, wait: s.wait }));
})()
