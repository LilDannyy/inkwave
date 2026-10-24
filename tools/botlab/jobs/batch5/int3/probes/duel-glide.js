// [b5-int3] (scratch) the Glide Bomb probe: how often a bot's fight throw finds its foe, and what holding the cook costs.
// testbox, real brains at normal, a Splattershot each by default. Two scenes (sc=):
//   duel  bot A (team 0, the Glide) against bot B (team 1), 6–9 m apart: A's splats and B's (the hold's cost), A's throws
//   side  bot C (A's teammate, no sub) duels B 4–5 m apart; A stands 6–10 m off B, off to the side of that line: a foe
//         committed to someone else — the throw the lead wants bots to make
// Each round ends at a splat or after secs. Counts A's Glide throws (fight / paint), the hits and damage on B, the splats.
//   MAP=testbox MODE=turf PAGE=tools/botlab/jobs/batch5/int3/probes/duel-glide.js tools/botlab/run.sh tools/botlab/page.cjs
//   PAGE_ARGS='sc=side rounds=60 secs=8 w=shooter fw=shooter set=<GLIDE_BOT key:value,…>'
(async () => {
  const g = window.__inkwave, m = g.match, THREE = await import('three');
  const { PLAYER } = await import('./src/config.js');
  const GL = await import('./src/game/kits/glide.js');
  const { on } = await import('./src/core/ctx.js');
  const G = window.__G;
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const arg = (k, d) => (new RegExp('(?:^|[;& ])' + k + '=([^;& ]+)').exec(window.__pageArgs || '') || [])[1] || d;
  const r2 = (x) => Math.round(x * 100) / 100;
  const DT = 1 / 60;
  const frame = () => { g._skipRender = true; g._frame(DT); g._skipRender = false; };
  g.debug.freeze();
  for (const kv of arg('set', '').split(',').filter(Boolean)) { const [k, v] = kv.split(':'); GL.GLIDE_BOT[k] = +v; }
  const SC = arg('sc', 'side');
  const me = m.local;
  const A = m.actors.find((a) => a.bot && a !== me && a.team === 0), C = m.actors.find((a) => a.bot && a !== me && a !== A && a.team === 0), B = m.actors.find((a) => a.bot && a.team === 1);
  const cast = SC === 'side' ? [A, B, C] : [A, B];
  const zero = (a) => { const it = a.intent; it.move.set(0, 0, 0); it.fire = it.squid = it.jump = it.sub = it.special = false; };
  for (const a of m.actors) if (!cast.includes(a)) { if (a.bot) a.bot.update = () => zero(a); else a.update = () => {}; }
  A.setWeapon(arg('w', 'shooter')); A.setSub('glide'); B.setWeapon(arg('fw', 'shooter')); B.setSub('beacon');
  if (C) { C.setWeapon(arg('cw', 'shooter')); C.setSub('beacon'); }
  for (const a of cast) a.bot.setDifficulty(arg('diff', 'normal'));
  const park = () => m.actors.forEach((a, i) => { if (!cast.includes(a)) { a.pos.set(-24 + (i % 4) * 2, 0.02, 40); a.vel.set(0, 0, 0); } });
  const evs = [];
  const offs = ['hit', 'sub:use', 'splatted'].map((n) => on(n, (e) => evs.push({ n, e, t: G.time })));
  const ROUNDS = +arg('rounds', 60), SECS = +arg('secs', 8);
  GL.resetGlideStats();
  const tot = { rounds: 0, throwsA: 0, glideHits: 0, glideDmg: 0, glideSplats: 0, splatsA: 0, splatsB: 0, splatsC: 0, otherDmgA: 0, roundsWithThrow: 0 };
  const face = (a, b) => { a.yaw = a.aimYaw = Math.atan2(b.pos.x - a.pos.x, b.pos.z - a.pos.z); a.bot.aimYaw = a.yaw; };
  try {
    for (let r = 0; r < ROUNDS; r++) {
      if (m.time < 100) m.time = 170;
      G.subs.clear(); G.projectiles.clear(); G.paint.clear?.();
      for (const a of cast) { if (!a.alive) a.respawn(); a.hp = PLAYER.hp ?? 100; a.ink = 100; a.invuln = 0; if (a.status) a.status.shield = 0; a.bot.target = null; }
      park();
      const ang = (r * 2.39996) % (Math.PI * 2), ca = Math.cos(ang), sa = Math.sin(ang);
      if (SC === 'side') {
        // B at the centre, C 4–5 m off along ang, A 6–10 m off at 60–120° from that line
        const dC = 4 + (r % 3) * 0.5, dA = 6 + (r % 5), side = (r % 2 ? 1 : -1) * (Math.PI / 3 + ((r * 0.618) % 1) * (Math.PI / 3));
        B.pos.set(0, 0.02, -10); C.pos.set(sa * dC, 0.02, -10 + ca * dC);
        A.pos.set(Math.sin(ang + side) * dA, 0.02, -10 + Math.cos(ang + side) * dA);
        face(B, C); face(C, B); face(A, B);
      } else {
        const d0 = 6 + (r % 4);
        A.pos.set(sa * d0 / 2, 0.02, -10 + ca * d0 / 2); B.pos.set(-sa * d0 / 2, 0.02, -10 - ca * d0 / 2);
        face(A, B); face(B, A);
      }
      for (const a of cast) a.vel.set(0, 0, 0);
      A.bot.bombCd = 0.3;
      const e0 = evs.length;
      // (side: B's hp topped up every frame — A's and C's gunfire would end most rounds before a stone arrives; the Glide's
      // hits are counted from the events, a splat where its damage alone reaches 100. Nobody's special charges: a barrage
      // throws stones the kit's bot code never planned)
      const keep = () => { for (const a of cast) a.special = 0; if (SC === 'side' && B.alive) B.hp = PLAYER.hp ?? 100; if (SC === 'side' && C.alive) C.hp = PLAYER.hp ?? 100; };
      for (let i = 0; i < SECS * 60; i++) { keep(); frame(); if (!A.alive || !B.alive || (C && SC === 'side' && !C.alive)) break; }
      // let a stone already thrown finish (its fuse ≤ 2.4 s), the brains still on
      { const SK = (await import("./src/game/kits/registry.js")).SUB_KITS.glide; for (let i = 0; i < 150 && SK.items?.length; i++) { keep(); frame(); } }
      tot.rounds++;
      let thr = 0;
      for (const x of evs.slice(e0)) {
        if (x.n === 'sub:use' && x.e.actor === A && x.e.kind === 'glide') { thr++; tot.throwsA++; }
        if (x.n === 'hit' && x.e.attacker === A && x.e.victim === B) { if (x.e.weaponId === 'glide') { tot.glideHits++; tot.glideDmg += x.e.damage || 0; if (x.e.killed || (SC === 'side' && (x.e.damage || 0) >= 100)) tot.glideSplats++; } else tot.otherDmgA += x.e.damage || 0; }
        if (x.n === 'hit' && x.e.killed) { if (x.e.victim === A) tot.splatsA++; if (x.e.victim === B) tot.splatsB++; if (C && x.e.victim === C) tot.splatsC++; }
      }
      if (thr) tot.roundsWithThrow++;
    }
    const S = GL.GLIDE_STATS;
    R(`glide probe sc=${SC} w=${arg('w', 'shooter')} fw=${arg('fw', 'shooter')} set=${arg('set', '')}: ${tot.rounds} rounds, A threw ${tot.throwsA} (fight ${S.uses_fight || 0}, paint ${S.uses_paint || 0}) in ${tot.roundsWithThrow} rounds | glide hits on B ${tot.glideHits} (${r2(tot.glideHits / Math.max(1, tot.throwsA))} a throw), dmg ${Math.round(tot.glideDmg)}, splats ${tot.glideSplats} | splatted: A ${tot.splatsA}, B ${tot.splatsB}${SC === 'side' ? `, C ${tot.splatsC}` : ''} | A's other dmg on B ${Math.round(tot.otherDmgA)} | plans fight ${S.botFight || 0} (away ${S.botAway || 0}, planted ${S.botPlanted || 0}) cooked ${S.cooked} fizzles ${S.fizzles} held off ${S.botCancel || 0} cook-on ${S.botCookOn || 0}`, true,
      { tot, fightLog: S.fightLog || [], bot: { ...GL.GLIDE_BOT } });
  } catch (e) { R('harness error: ' + e.message, false, String(e.stack).slice(0, 800)); }
  for (const f of offs) f();
  return out;
})();
