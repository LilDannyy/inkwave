// fix round 9 scratch: rule 47 b's steer-back deaths on the Mitts-reachable outer wall tops — a trail per case
//   PAGE_ARGS cases=x,y,z,h;x,y,z,h  t=50
(async () => {
  const g = window.__inkwave, out = [];
  const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const THREE = await import('three');
  const W = __G.lavaWorld, Lv = g.match?.lava, dbg = g.debug; dbg.freeze();
  for (const a of g.match.actors) if (a.bot) { a.bot.update = () => {}; a.intent.move.set(0, 0, 0); }
  const V = (x, y, z) => new THREE.Vector3(x, y, z), r2 = (v) => Math.round(v * 100) / 100;
  const lvl = __G.level, dt = 1 / 60;
  const kid = g.match.actors.find((a) => a.bot && a !== g.match.local), it = kid.intent;
  const PA = String(window.__pageArgs || ''), arg = (k, d) => new RegExp(k + '=([^&]+?)(?:&|$)').exec(PA)?.[1] ?? d;
  const T = +arg('t', '50');
  const cases = arg('cases', '').split(';').filter(Boolean).map((s) => s.split(',').map(Number));
  const wpn = arg('w', '');
  if (wpn) kid.setWeapon(wpn);
  for (const [x, y, z, hd, mode0] of cases) {
    Lv.debugT(T);
    const h = (hd * Math.PI) / 180, back = mode0 !== 0;
    kid.isBot = true; kid.carry = null; if (!kid.alive) kid.respawn(); kid.spawnAt(V(x, y + 0.3, z), 0); kid.invuln = 0; kid.hp = 100; kid.form = 'kid'; kid.vel.set(6.5 * Math.cos(h), 0, 6.5 * Math.sin(h)); it.move.set(0, 0, 0);
    let touched = -1, blk = -1, away = false, sx = 0, sz = 0; const tr = [];
    for (let f = 0; f < 240; f++) {
      if (touched >= 0 && kid.grounded && !(kid.ground.hit && kid.ground.block === blk)) away = true;
      if (kid.roofDir && (kid.roofDir.x || kid.roofDir.z)) { sx = -kid.roofDir.x; sz = -kid.roofDir.z; }
      if (back && touched >= 0 && !away && (sx || sz)) it.move.set(sx, 0, sz); else it.move.set(0, 0, 0);
      kid.update(dt);
      const gb = kid.grounded && kid.ground.hit ? lvl.blocks[kid.ground.block] : null;
      if (touched < 0 && gb && kid.isRoofFor(gb)) { touched = f; blk = gb.id; }
      tr.push([f, r2(kid.pos.x), r2(kid.pos.y), r2(kid.pos.z), gb ? (gb.tag || '') + '#' + gb.id + (gb.roof ? 'R' : '') : 'air', r2(kid.vel.x), r2(kid.vel.z), kid.roofDir ? [r2(kid.roofDir.x), r2(kid.roofDir.z)] : null, r2(kid.roofT || 0), kid.roofHeld > 0 ? 'H' : '', r2(it.move.x), r2(it.move.z)]);
      if (!kid.alive) break;
      if (touched >= 0 && f - touched > 150) break;
    }
    R('case ' + [x, y, z, hd].join(','), kid.alive, { alive: kid.alive, lavaY: r2(Lv.y), weapon: kid.weaponId, tr: tr.filter((r, i) => i % 2 === 0 || i > tr.length - 6).slice(0, 80) });
  }
  return out;
})();
