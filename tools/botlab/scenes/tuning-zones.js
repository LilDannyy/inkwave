// Scenes for tools/botlab/hud-shots.cjs: the Zone Control HUD and zone marks in a contest, under the forgiving rules
// (b5-tuning: take at ZONES.control, the hold over the line before a flip). Real ink (paint splats), so the floor, the
// marks and the HUD's share bars all agree.
//   MAP=saltpan MODE=zones PLAY=2 SCENES=tools/botlab/scenes/tuning-zones.js OUT=/dir tools/botlab/run.sh tools/botlab/hud-shots.cjs
//   contest   your team holds the centre; theirs has inked it back from their side to between the warn line and the
//             neutralise line (ZONES.warn … ZONES.contest): the "contested" pulse. Three viewpoints (contest = from the
//             zone's edge, contest-in = on it, contest-side = beside it); Saltpan's open centre shows it best
//   flip      theirs past the neutralise line on one zone: it holds there ZONES.flipHold s before it goes neutral
//   take      a neutral centre, your team over the take line (short of the old 80 %): the take waiting on the hold
// The local kid stands on your side of the zone, looking across it (flip / take: on the zone, the floor in view).
(async () => {
  const g = window.__inkwave, m = g.match, dbg = g.debug, G = __G, THREE = await import('three');
  dbg.freeze();
  const step = (s) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) dbg.step(1000 / 60); };
  for (const a of m.actors) if (a.bot) a.bot.update = () => {};
  for (const a of m.actors) { a.intent.move.set(0, 0, 0); a.intent.fire = false; a.intent.squid = false; }
  const me = m.local.team, them = 1 - me, Z = m.zones;
  Z.nextSwap = 999;
  const zs = () => Z.active.zones;
  const inPoly = (poly, x, z) => { let ins = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, zi] = poly[i], [xj, zj] = poly[j]; if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) ins = !ins; } return ins; };
  const V = (x, y, z) => new THREE.Vector3(x, y, z), DOWN = V(0, -1, 0);
  // ink `team` over zone z from the side toward `from`'s spawn until its share reaches `want` (0.7 m splats on a 0.8 m grid)
  const inkFrom = (z, team, from, want) => {
    const parts = z.def.polys || [z.def.poly], pts = parts.flat(), p = G.level.spawnPads[from];
    const ax = p.x - z.center[0], az = p.z - z.center[2], al = Math.hypot(ax, az) || 1;
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    for (const [x, zz] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, zz); z1 = Math.max(z1, zz); }
    const spots = [];
    for (let x = x0 + 0.3; x < x1; x += 0.8) for (let zz = z0 + 0.3; zz < z1; zz += 0.8) {
      if (!parts.some((q) => inPoly(q, x, zz))) continue;
      const top = (z.def.y1 ?? 6) + 1.5, h = G.physics.raycast(V(x, top, zz), DOWN, top - (z.def.y0 ?? -2) + 1);
      if (!h || !h.hit) continue;
      spots.push({ x, y: top - h.dist, z: zz, k: ((x - z.center[0]) * ax + (zz - z.center[2]) * az) / al });
    }
    spots.sort((a, b) => b.k - a.k);   // nearest `from`'s side first
    const share = () => { let n = 0; for (const c of z.cells) if (G.paint.grid[c] === team + 1) n++; return n / Math.max(1, z.cells.length); };
    for (const s of spots) { if (share() >= want) break; G.paint.splat(V(s.x, s.y + 0.2, s.z), 0.7, team, { seed: Math.random() }); }
    return +share().toFixed(3);
  };
  // the kid at the centre's edge on our side, facing across it
  const c = zs().reduce((s, z) => [s[0] + z.center[0] / zs().length, s[1] + z.center[1] / zs().length, s[2] + z.center[2] / zs().length], [0, 0, 0]);
  const pad = G.level.spawnPads[me], dx = pad.x - c[0], dz = pad.z - c[2], dl = Math.hypot(dx, dz) || 1;
  const L = m.local, R = Math.max(...zs().map((z) => Math.hypot(z.center[0] - c[0], z.center[2] - c[2]))) + 6;
  // where the kid stands: 'edge' (outside the zone on our side, looking across it), 'in' (on the zone near our edge,
  // looking at their side, the floor in view), 'side' (beside the zone, looking along the line between the two inks)
  const Rz = Math.max(...zs().flatMap((z) => (z.def.polys || [z.def.poly]).flat().map(([x, zz]) => Math.hypot(x - c[0], zz - c[2]))));
  const place = (view = 'edge') => {
    let px, pz, fx, fz;
    if (view === 'side') { const sx = -dz / dl, sz = dx / dl; px = c[0] + sx * (Rz + 2); pz = c[2] + sz * (Rz + 2); fx = -sx; fz = -sz; }
    else { const r = view === 'in' ? Rz * 0.55 : R; px = c[0] + (dx / dl) * r; pz = c[2] + (dz / dl) * r; fx = -dx / dl; fz = -dz / dl; }
    L.pos.set(px, c[1] + 0.3, pz); L.vel.set(0, 0, 0);
    const pitch = view === 'edge' ? -0.3 : -0.42;
    L.yaw = L.aimYaw = Math.atan2(fx, fz); L.aimPitch = pitch;
    if (g.rig) { g.rig.yaw = L.yaw; g.rig.pitch = pitch; }
  };
  for (const a of m.actors) if (a !== L) { const p = G.level.spawnPads[a.team]; a.pos.set(p.x, p.y + 0.3, p.z); a.vel.set(0, 0, 0); }
  // (the call-outs — WE'VE GOT CONTROL / WE LOST CONTROL / WE TOOK THE LEAD — are timed in real time: wait them out)
  const callouts = () => new Promise((r) => setTimeout(r, 3600));
  const neutral = async () => { const held = Z.owner >= 0 || zs().some((z) => z.owner >= 0); for (const z of zs()) { z.pend = null; if (z.owner >= 0) Z._zoneOwner(z, -1); } if (Z.owner >= 0) Z._setOwner(-1); for (const z of zs()) Z._flood(z, -1); step(1.2); if (held) await callouts(); };
  const take = async () => { for (const z of zs()) inkFrom(z, me, me, 1); step(4.5); await callouts(); };
  const { ZONES } = await import('./src/config.js');
  const info = (extra) => ({ ...extra, owner: Z.owner, zones: zs().map((z) => ({ owner: z.owner, share: z.share.map((s) => +s.toFixed(2)), pending: z.pend ? z.pend.to : null })) });
  const S = [];
  const contest = (view) => async () => { await neutral(); place(view); await take(); place(view); const got = zs().map((z) => inkFrom(z, them, them, (ZONES.warn + ZONES.contest) / 2 - 0.02)); step(0.45); place(view); step(0.1); return info({ got, view }); };
  for (const v of ['edge', 'in', 'side']) S.push({ name: v === 'edge' ? 'contest' : 'contest-' + v, set: contest(v) });
  S.push({ name: 'flip', set: async () => { await neutral(); place('in'); await take(); place('in'); const got = inkFrom(zs()[0], them, them, ZONES.contest + 0.02); step(0.3); place('in'); return info({ got }); } });
  S.push({ name: 'take', set: async () => { await neutral(); place('in'); const got = zs().map((z) => inkFrom(z, me, me, ZONES.control + 0.02)); step(0.3); place('in'); return info({ got }); } });
  window.__hudScenes = S;
  return S.map((s) => ({ name: s.name }));
})()
