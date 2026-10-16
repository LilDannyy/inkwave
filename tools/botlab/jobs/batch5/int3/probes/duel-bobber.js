// [b5-int3] (scratch) the duel probe for the Chain Bobber: bot A (team 0) against bot B (team 1) on testbox, both real brains at
// normal, a Splattershot each by default, 6 m to 9 m apart; each round ends at a splat or after secs; counts A's and B's
// splats and the sub's own numbers.
//   MAP=testbox MODE=turf PAGE=tools/botlab/jobs/batch5/int3/probes/duel-bobber.js tools/botlab/run.sh tools/botlab/page.cjs
//   PAGE_ARGS='w=shooter fw=shooter rounds=60 secs=6 sub=<A's sub> set=<SNAP key:value,…>'
(async () => {
  const g = window.__inkwave, m = g.match, THREE = await import('three');
  const { PLAYER } = await import('./src/config.js');
  const { SUB_KITS } = await import('./src/game/kits/registry.js');
  const BB = await import('./src/game/kits/bobber-bots.js');
  const { on } = await import('./src/core/ctx.js');
  const G = window.__G, K = SUB_KITS.bobber;
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const arg = (k, d) => (new RegExp('(?:^|[;& ])' + k + '=([^;& ]+)').exec(window.__pageArgs || '') || [])[1] || d;
  const V = (x, y, z) => new THREE.Vector3(x, y, z), r2 = (x) => Math.round(x * 100) / 100;
  const DT = 1 / 60;
  const frame = () => { g._skipRender = true; g._frame(DT); g._skipRender = false; };
  g.debug.freeze();
  for (const kv of arg('set', '').split(',').filter(Boolean)) { const [k, v] = kv.split(':'); BB.SNAP[k] = +v; }
  const me = m.local, A = m.actors.find((a) => a.bot && a !== me && a.team === 0) || m.actors.find((a) => a.bot && a.team === 0), B = m.actors.find((a) => a.bot && a.team === 1);
  const zero = (a) => { const it = a.intent; it.move.set(0, 0, 0); it.fire = it.squid = it.jump = it.sub = it.special = false; };
  for (const a of m.actors) if (a !== A && a !== B) { if (a.bot) a.bot.update = () => zero(a); else a.update = () => {}; }
  A.setWeapon(arg('w', 'shooter')); A.setSub(arg('sub', 'bobber')); B.setWeapon(arg('fw', 'shooter')); B.setSub('beacon');
  A.bot.setDifficulty(arg('diff', 'normal')); B.bot.setDifficulty(arg('diff', 'normal'));
  const park = () => m.actors.forEach((a, i) => { if (a !== A && a !== B) { a.pos.set(-24 + (i % 4) * 2, 0.02, 40); a.vel.set(0, 0, 0); } });
  const evs = [];
  const offs = ['hit', 'bobber:trigger', 'splatted'].map((n) => on(n, (e) => evs.push({ n, e, t: G.time })));
  const ROUNDS = +arg('rounds', 40), SECS = +arg('secs', 6);
  let dmgBob = 0, killsBob = 0, killsA = 0, killsB = 0, dmgA = 0;
  try {
    for (let r = 0; r < ROUNDS; r++) {
      if (m.time < 100) m.time = 170;
      G.subs.clear(); G.projectiles.clear(); G.paint.clear?.();
      for (const a of [A, B]) { if (!a.alive) a.respawn(); a.hp = PLAYER.hp ?? 100; a.ink = 100; a.invuln = 0; a.status.shield = 0; }
      park();
      const ang = (r * 2.39996) % (Math.PI * 2), d0 = 6 + (r % 4);
      A.pos.set(Math.sin(ang) * d0 / 2, 0.02, -10 + Math.cos(ang) * d0 / 2); B.pos.set(-Math.sin(ang) * d0 / 2, 0.02, -10 - Math.cos(ang) * d0 / 2);
      A.vel.set(0, 0, 0); B.vel.set(0, 0, 0);
      A.yaw = A.aimYaw = Math.atan2(B.pos.x - A.pos.x, B.pos.z - A.pos.z); B.yaw = B.aimYaw = A.yaw + Math.PI;
      A.bot.aimYaw = A.yaw; B.bot.aimYaw = B.yaw; A.bot.bombCd = 0.5;
      const e0 = evs.length;
      for (let i = 0; i < SECS * 60; i++) { frame(); if (!A.alive || !B.alive) break; }
      for (const x of evs.slice(e0)) {
        if (x.n === 'hit' && x.e.attacker === A && x.e.victim === B) { dmgA += x.e.damage || 0; if (x.e.weaponId === 'bobber') { dmgBob += x.e.damage || 0; if (x.e.killed) killsBob++; } if (x.e.killed) killsA++; }
        if (x.n === 'hit' && x.e.attacker === B && x.e.killed) killsB++;
      }
    }
    const S = K.BOBBER_STATS, Bt = BB.BOBBER_BOT;
    const L = Bt.snapLog || [];
    const live = L.filter((x) => x.ev === 'live');
    R(`snap probe w=${arg('w', 'shooter')} fw=${arg('fw', 'shooter')} set=${arg('set', '')}: snaps ${Bt.snaps || 0} aimed ${Bt.snapAims || 0} fired ${Bt.snapShots || 0} left ${Bt.snapLeft || 0} | set off ${S.triggers} caught ${S.hitTriggers} splats ${S.splats} | bobber dmg ${Math.round(dmgBob)} of A's ${Math.round(dmgA)} | A splats ${killsA} (bobber ${killsBob}) B splats ${killsB} | thrown ${S.thrown}`, true,
      { live: live.map((x) => x.near).sort((a, b) => a - b), throws: L.filter((x) => x.ev === 'throw').map((x) => [x.d, x.fv]), src: S.src, via: S.via, viaW: S.viaW });
  } catch (e) { R('harness error: ' + e.message, false, String(e.stack).slice(0, 800)); }
  for (const f of offs) f();
  return out;
})();
