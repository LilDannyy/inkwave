// Eco-Forest Treehills — pictures with sprout-pod hedges up (tools/botlab/shoot.cjs's flow + a setup step): boots a match,
// freezes it, grows the hedges GROW asks for (pod id:team, the team's ink filling its meter), stands a kid on a hedge
// top (TOP=pod id: the owner's kid, the rest hidden), then shoots the SHOTS cameras (custom [{name, from, look, fov}]).
//   MAP=treehills GROW='meadow-w:0,meadow-e:1' TOP=meadow-w OUT=/dir SHOTS='[{"name":"x","from":[..],"look":[..]}]' \
//     tools/botlab/run.sh tools/botlab/jobs/new-stages/out/treehills/podshots.cjs
const { app } = require('electron');
const fs = require('fs');
require(process.env.S + '/offscreen-boot.cjs');
const MAP = process.env.MAP || 'treehills', TIME = process.env.TIME || 'day', MODE = process.env.MODE || 'turf';
const OUT = process.env.OUT || '.', W = +(process.env.W || 1600), H = +(process.env.H || 900);
const SHOTS = JSON.parse(process.env.SHOTS || '[]');
const GROW = (process.env.GROW || '').split(',').filter(Boolean).map((s) => { const [id, t] = s.split(':'); return [id, +t]; });
const TOP = process.env.TOP || '';
setTimeout(() => { console.log('WATCHDOG'); app.exit(1); }, 120000 + SHOTS.length * 8000);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let claimed = false;
app.on('browser-window-created', (_, win) => {
  if (claimed) return; claimed = true;
  let frame = null; win.webContents.on('paint', (_e, _d, img) => { frame = img; });
  win.webContents.once('did-finish-load', async () => {
    win.setContentSize(W, H);
    const js = (c) => win.webContents.executeJavaScript(c, true);
    for (let i = 0; i < 120; i++) { if (await js('!!window.__inkwave?.api')) break; await wait(250); }
    await js('window.__inkwave._onPointerUnlock = () => {}; 0');
    fs.mkdirSync(OUT, { recursive: true });
    await js(`window.__inkwave.api.startMatch({ mapId: '${MAP}', duration: 180, time: '${TIME}', mode: '${MODE}' })`);
    { const got = await js(`(window.__inkwave.mapDef && window.__inkwave.mapDef.id) || null`); if (got !== MAP) { console.log(`MAP MISMATCH: asked for ${MAP}, the game built ${got}`); app.exit(3); return; } }
    for (let i = 0; i < 240; i++) { if (await js(`window.__inkwave.match?.state === 'playing'`)) break; await wait(250); }
    await wait(2500);
    const info = await js(`(async () => {
      const g = window.__inkwave, m = g.match, P = m.pods, THREE = await import('three');
      g.debug.freeze();
      const step = (s) => { for (let i = 0, n = Math.round(s * 60); i < n; i++) g.debug.step(1000 / 60); };
      // everyone stands still (the setup's hedges and the kid on top stay put)
      for (const a of m.actors) if (a.bot) a.bot.update = () => { const it = a.intent; it.move.set(0, 0, 0); it.fire = it.squid = it.jump = it.sub = it.special = false; };
      __G.projectiles.clear(); __G.paint.clear();
      m.duration = 99999; m.time = m.duration - P.t;
      const byId = (id) => P.pods.find((p) => p.id === id);
      const grow = ${JSON.stringify(GROW)}, done = [];
      for (const [id, t] of grow) {
        const p = byId(id); if (!p) { done.push([id, 'missing']); continue; }
        const c = new THREE.Vector3(p.x, p.y + p.def.bulbY + 0.2, p.z);
        for (let i = 0; i < 60 && p.meter[t] < 1.2 && p.state === 'dormant'; i++) __G.paint.splat(c, 0.8, t);
        done.push([id, t]);
      }
      step(1.0);
      __G.paint.clear();
      const top = byId('${TOP}');
      let kid = null;
      for (const a of m.actors) { a.character.setVisible?.(false); a.character.root.visible = false; }
      if (top) {
        kid = m.actors.find((a) => a.team === top.owner && !a.isLocal) || m.actors.find((a) => a.team === top.owner);
        kid.pos.set(top.x + 0.5 * top.c, top.y + top.h + 0.3, top.z - 0.5 * top.s); kid.vel.set(0, 0, 0); kid.form = 'kid';
        kid.character.root.visible = true; kid.character.setVisible?.(true);
        step(0.8);
      }
      g.hud?.setVisible(false); g.menus?.show(null);
      document.querySelectorAll('.iw-hud, .iw-ui, #fade').forEach((e) => { e.style.visibility = 'hidden'; });
      window.__fov0 = g.settings.fov;
      return { pods: P.pods.filter((p) => p.state === 'stand').map((p) => [p.id, p.owner]), grown: done, kid: kid && [kid.name, +kid.pos.y.toFixed(2), kid.grounded] };
    })()`);
    console.log('SETUP ' + JSON.stringify(info));
    for (const spec of SHOTS) {
      await js(`(async () => {
        const g = window.__inkwave, THREE = await import('three'), V = (a) => new THREE.Vector3(a[0], a[1], a[2]);
        const P = ${JSON.stringify(spec)};
        g.settings.fov = P.fov || 70;
        g.rig.cinematic(V(P.from), V(P.from), V(P.look), V(P.look), 99, () => {});
        for (let i = 0; i < 4; i++) g.debug.step(1000 / 60);
        return true;
      })()`);
      await wait(1100);
      await js(`window.__inkwave.debug.step(1000 / 60)`); await wait(400);
      const f = `${OUT}/${MAP}-${TIME}-${spec.name}.png`;
      if (frame) fs.writeFileSync(f, frame.toPNG());
      console.log('shot', f);
    }
    await js(`window.__inkwave.settings.fov = window.__fov0; 0`);
    app.quit();
  });
});
