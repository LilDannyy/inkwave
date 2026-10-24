// Review 9: the rescue's 6 m — a kid put down on the north part of Slump hornito #862 / #1688 at HIGH: the engine's own
// rescueLog entry (d) and stats.rescueFar; and the audit's way of reading the distance after 40 rescues (the log is capped)
(async () => {
  const g = window.__inkwave, out = [];
  const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const THREE = await import('three');
  const Lv = g.match?.lava, dbg = g.debug; dbg.freeze();
  for (const a of g.match.actors) if (a.bot) { a.bot.update = () => {}; a.intent.move.set(0, 0, 0); }
  const kid = g.match.actors.find((a) => a.bot && a !== g.match.local), lvl = __G.level, dt = 1 / 60, V = (x, y, z) => new THREE.Vector3(x, y, z);
  const r2 = (v) => Math.round(v * 100) / 100;
  const rows = [];
  for (const id of [862, 1688, 863]) {
    const b = lvl.blocks[id], top = b.center.y + b.half.y, s = id === 1688 ? -1 : 1;
    for (const dz of [0.6, 0.3, 0]) {
      Lv.debugT(48);
      kid.isBot = true; if (!kid.alive) kid.respawn(); kid.spawnAt(V(b.center.x, top + 0.3, b.center.z + s * dz), 0); kid.invuln = 0; kid.vel.set(0, 0, 0);
      const far0 = Lv.stats.rescueFar || 0, n0 = Lv.stats.rescues || 0, L0 = (Lv.stats.rescueLog || []).length; const p0 = kid.pos.clone(); let moved = null;
      for (let f = 0; f < 90; f++) { const q = kid.pos.clone(); kid.update(dt); Lv.debugT(48 + f / 60); if (Math.hypot(kid.pos.x - q.x, kid.pos.z - q.z) > 1) { moved = [r2(q.x), r2(q.z), r2(kid.pos.x), r2(kid.pos.z), r2(Math.hypot(kid.pos.x - q.x, kid.pos.z - q.z))]; break; } }
      const RL = Lv.stats.rescueLog || [];
      rows.push({ id, tag: b.tag, put: [r2(p0.x), r2(p0.z)], moved, rescues: (Lv.stats.rescues || 0) - n0, rescueFarInc: (Lv.stats.rescueFar || 0) - far0, logLen: RL.length, logGrew: RL.length > L0, auditReads: RL.length ? RL[RL.length - 1].d : null });
    }
  }
  R('rescue distance: engine log vs the kid\'s own move vs what lava-audit rule 47 reads', true, { rows, statsRescues: Lv.stats.rescues, statsRescueFar: Lv.stats.rescueFar || 0 });
  // 45 more rescues at hornito #863 (short), then one at #862's north (far): what the audit's reading gives
  for (let i = 0; i < 45; i++) { const b = lvl.blocks[863]; Lv.debugT(48); kid.spawnAt(V(b.center.x, b.center.y + b.half.y + 0.3, b.center.z), 0); kid.invuln = 0; for (let f = 0; f < 60; f++) { kid.update(dt); Lv.debugT(48 + f / 60); } }
  const b = lvl.blocks[862]; Lv.debugT(48); kid.spawnAt(V(b.center.x, b.center.y + b.half.y + 0.3, b.center.z + 0.6), 0); kid.invuln = 0;
  let mv = null; for (let f = 0; f < 90; f++) { const q = kid.pos.clone(); kid.update(dt); Lv.debugT(48 + f / 60); if (Math.hypot(kid.pos.x - q.x, kid.pos.z - q.z) > 1) { mv = r2(Math.hypot(kid.pos.x - q.x, kid.pos.z - q.z)); break; } }
  const RL = Lv.stats.rescueLog || [];
  R('after 40 rescues the log stops: the audit reads a stale distance', true, { realMove: mv, logLen: RL.length, auditReads: RL[RL.length - 1]?.d, rescues: Lv.stats.rescues, rescueFar: Lv.stats.rescueFar || 0 });
  return out;
})();
