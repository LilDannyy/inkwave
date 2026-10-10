// The lava stage audit on Highmark Foundry (ENGINE.md §5's rules marked (A) that tests/lava.js does not cover, and the
// (C) ones check-maps cannot see without the built level; ENGINE §6 step 12):
//   MAP=caldera MODE=turf PAGE=tools/botlab/tests/lava-audit.js WATCHDOG=900000 tools/botlab/run.sh tools/botlab/page.cjs
//   rule 14  every drowning floor is ≤ 12 m walking from floor that never drowns, and the way never drops below it
//   rule 22  clear sky over every rider: nothing static over its travel or within 2.2 m over its HIGH top
//   rule 25  a lookout: cover ≤ 1.0 m tall along ≤ half its edge, ≥ 2 open sides, ≤ 22 m from both teams' dry floor at
//            HIGH, its HIGH top ≤ 4.6 m over the floor its climb starts from
//   rule 38  the surfaces in the region are mid-value rock (sRGB luminance ≥ 0.35), never black
//   rule 42  no view out of the arena shows void (rays from the high ground and the pads, below the horizon)
//   rule 44  no unplanned jumps across lava: every gap between standable floors over lava is a seam (≤ 0.3 m) or
//            ≥ 4.5 m; physically, a kid's running jump never crosses one; what a swim jump and a jump + the Dash
//            Pellet's 3.5 m air dash could cross, listed with the nav detour it saves (the lead's list)
//   rule 45  the region's outline lies ≥ 0.5 m inside every bank it meets (never along a face), in solid bank whose top
//            is ≥ HIGH + 0.3; open edges only at the lips (into a falls polygon)
//   rule 46  the nav built with its grid shifted 0.25 m and 0.5 m (x, z): every step link still yields its edges, the
//            Organ climb exists at both poses and the Race chain head → stones → head at HIGH
(async () => {
  const g = window.__inkwave, out = [];
  const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const THREE = await import('three');
  const C = await import('./src/game/lavaCore.js');
  const { PLAYER } = await import('./src/config.js');
  const W = __G.lavaWorld, Lv = g.match?.lava;
  R('the lava module runs on the stage', !!W && !!Lv);
  if (!W || !Lv) return out;
  const dbg = g.debug; dbg.freeze();
  for (const a of g.match.actors) if (a.bot) { a.bot.update = () => {}; a.intent.move.set(0, 0, 0); a.intent.fire = a.intent.squid = a.intent.jump = false; }
  const step = (s, hz = 60) => { const n = Math.max(1, Math.round(s * hz)); for (let i = 0; i < n; i++) dbg.step(1000 / hz); };
  const setT = (t) => { Lv.debugT(t); step(1 / 60); };
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const r2 = (v) => Math.round(v * 100) / 100;
  const lvl = __G.level, nav = __G.nav, M = W.navMeta, H = W.high, LO = W.low, K = C.LAVA.kill;
  const qb = [], hp = new THREE.Vector3();
  const solidAt = (x, y, z, dyn = false) => { hp.set(x, y, z); for (const id of lvl.queryBlocks(x - 0.01, z - 0.01, x + 0.01, z + 0.01, qb)) { const b = lvl.blocks[id]; if (b.solid && (dyn || !b.dynamic) && lvl.pointInBlock(b, hp, 0.001)) return b; } return null; };

  // ---------------------------------------------------------------------------------------------- rule 14: exits
  try {
    let worst = 0, worstAt = null, drops = [], none = [], n = 0, maxDip = 0;
    for (const nd of nav.nodes) {
      if (!nav.valid[nd.id] || M.kind[nd.id] !== 1) continue;
      n++;
      const e = M.exit[nd.id];
      if (!(e >= 0)) { none.push([r2(nd.x), r2(nd.y), r2(nd.z)]); continue; }
      const p = nav.path(nd.id, e, 0);
      if (!p) { none.push([r2(nd.x), r2(nd.y), r2(nd.z)]); continue; }
      let m = 0, lowest = Infinity;
      for (let i = 1; i < p.length; i++) { const a = nav.nodes[p[i - 1]], b = nav.nodes[p[i]]; m += Math.hypot(b.x - a.x, b.z - a.z); lowest = Math.min(lowest, b.y); }
      if (m > worst) { worst = m; worstAt = [r2(nd.x), r2(nd.y), r2(nd.z)]; }
      // (a dip down a step's height to the same floor — a 0.1–0.2 m stair foot onto the shelf — is no drop toward the lava)
      if (lowest < nd.y - 0.25) drops.push([r2(nd.x), r2(nd.y), r2(nd.z), r2(lowest)]);
      maxDip = Math.max(maxDip, nd.y - lowest);
    }
    R('rule 14: every drowning floor is ≤ 12 m walking from floor that never drowns (the paper said ≤ 10.0), and the way out never drops below it (by more than a step, 0.25 m)', n > 300 && !none.length && worst <= 12 && !drops.length,
      { nodes: n, worstM: r2(worst), worstAt, noWay: none.slice(0, 6), drops: drops.slice(0, 6), nDrops: drops.length, maxDipM: r2(maxDip) });
  } catch (e) { R('rule 14: exits: the check itself threw', false, { error: String(e && e.stack || e).slice(0, 400) }); }

  // ---------------------------------------------------------------------------------------------- rule 22: clear sky
  try {
    const bad = [];
    for (const r of W.riders) {
      const top1 = r.sink ? H + r.sink.rel[1] : r.top1, bot = (r.sink ? LO + r.sink.rel[0] : r.top0) - r.depth;
      for (const p of r.parts) {
        if (!p.body) continue;
        const q = C.partPose(r, p, 0, {}), c = Math.cos(q.yaw), s = Math.sin(q.yaw);
        for (let u = -q.hx + 0.1; u <= q.hx - 0.1 + 1e-6; u += 0.3) for (let v = -q.hz + 0.1; v <= q.hz - 0.1 + 1e-6; v += 0.3) {
          const x = q.cx + u * c + v * s, z = q.cz - u * s + v * c;
          for (let y = bot + 0.05; y <= top1 + 2.2; y += 0.1) { const b = solidAt(x, y, z); if (b) { bad.push([r.id, r2(x), r2(y), r2(z), b.tag || '#' + b.id]); break; } }
          if (bad.length > 20) break;
        }
      }
    }
    R('rule 22: clear sky over every rider — nothing static anywhere over its travel or within 2.2 m over its HIGH top (columns sampled every 0.3 m, 0.1 m up)', !bad.length, { bad: bad.slice(0, 10), riders: W.riders.length });
  } catch (e) { R('rule 22: clear sky: the check itself threw', false, { error: String(e && e.stack || e).slice(0, 400) }); }

  // ---------------------------------------------------------------------------------------------- rule 25: the lookout
  try {
    setT(50);
    const rows = [];
    for (const r of W.riders.filter((q) => !q.sink && q.look?.role === 'lookout')) {
      const RR = Lv.riders.find((q) => q.r === r), top = RR.top;
      // the six edges of its hexagon (corners on its ±x), sampled 0.25 m inside: the cover over each sample (any solid
      // up to 2 m over the deck within 0.35 m outward), its height
      const edges = [];
      for (let k = 0; k < 6; k++) {
        const a0 = r.yaw + (k * Math.PI) / 3, a1 = r.yaw + ((k + 1) * Math.PI) / 3, mid = (a0 + a1) / 2, nx = Math.cos(mid), nz = -Math.sin(mid);
        let covered = 0, maxH = 0;
        for (let i = 1; i <= 7; i++) {
          const f = i / 8, ax = Math.cos(a0) * (1 - f) + Math.cos(a1) * f, az = -(Math.sin(a0) * (1 - f) + Math.sin(a1) * f);
          const px = r.x + ax * r.r - nx * 0.25, pz = r.z + az * r.r - nz * 0.25;
          let h = 0;
          for (let y = 0.05; y <= 2.0; y += 0.05) for (const o of [0, 0.35]) if (solidAt(px + nx * o, top + y, pz + nz * o, true)) h = Math.max(h, y);
          if (h > 0.04) covered++;
          maxH = Math.max(maxH, h);
        }
        edges.push({ k, covered, maxH: r2(maxH) });
      }
      const coverShare = edges.reduce((s, e) => s + e.covered, 0) / 42, open = edges.filter((e) => e.covered === 0).length, coverH = Math.max(...edges.map((e) => e.maxH));
      // both teams' dry floor at HIGH within 22 m (each half by z), and the climb's start
      const dry = [0, 1].map((t) => { let d = Infinity; for (const nd of nav.nodes) { if (!nav.valid[nd.id] || M.kind[nd.id] !== 0 || (t === 0 ? nd.z > 0 : nd.z < 0)) continue; d = Math.min(d, Math.hypot(nd.x - r.x, nd.z - r.z)); } return r2(d); });
      let foot = null;
      for (const s of W.steps) { const e = s.a.pt ? s.a : s.b.pt ? s.b : null, o = e === s.a ? s.b : s.a; if (!e || o.rider == null || o.rider < 0) continue; const q = W.riders[o.rider]; if (q && !q.sink && Math.hypot(q.x - r.x, q.z - r.z) < 12) { foot = lvl.groundHeight(e.pt[0], e.pt[1], 5); break; } }
      rows.push({ id: r.id, top: r2(top), coverShare: r2(coverShare), coverH, open, dry, foot, over: foot === null ? null : r2(top - foot), edges });
    }
    R('rule 25: each lookout — cover ≤ 1.0 m tall along ≤ half its edge, ≥ 2 open sides, ≤ 22 m from both teams\' dry floor at HIGH, its HIGH top ≤ 4.6 m over its climb\'s foot',
      rows.length === 2 && rows.every((x) => x.coverH <= 1.0 + 1e-6 && x.coverShare <= 0.5 && x.open >= 2 && x.dry.every((d) => d <= 22) && x.over !== null && x.over <= 4.6), rows);
  } catch (e) { R('rule 25: the lookout: the check itself threw', false, { error: String(e && e.stack || e).slice(0, 400) }); }

  // ---------------------------------------------------------------------------------------------- rule 38: surface value
  try {
    const lum = (c) => { const f = (v) => v; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
    const seen = new Map(), dark = [];
    for (const b of lvl.blocks) {
      if (b.dynamic || b.hidden || !b.color) continue;
      const top = b.center.y + b.half.y, bot = b.center.y - b.half.y;
      if (bot > H + 0.3 || top < LO - 0.1) continue;
      let inR = false;
      for (const su of [-1, -0.5, 0, 0.5, 1]) for (const sv of [-1, -0.5, 0, 0.5, 1]) { const x = b.center.x + b.axes[0].x * b.half.x * su + b.axes[2].x * b.half.z * sv, z = b.center.z + b.axes[0].z * b.half.x * su + b.axes[2].z * b.half.z * sv; if (W.inRegion(x, z)) inR = true; }
      if (!inR) continue;
      const hex = '#' + (b.color.isColor ? b.color.getHexString() : new THREE.Color(b.color).getHexString()), iv = parseInt(hex.slice(1), 16), L = lum({ r: ((iv >> 16) & 255) / 255, g: ((iv >> 8) & 255) / 255, b: (iv & 255) / 255 });
      if (!seen.has(hex)) seen.set(hex, { hex, lum: r2(L), n: 0, tags: new Set() });
      const e = seen.get(hex); e.n++; if (b.tag) e.tags.add(b.tag);
    }
    for (const e of seen.values()) if (e.lum < 0.35) dark.push({ hex: e.hex, lum: e.lum, n: e.n, tags: [...e.tags].slice(0, 5) });
    R('rule 38: the surfaces in the region (below HIGH + 0.3) are mid-value rock — sRGB luminance ≥ 0.35 (#5f5f5f or lighter): the stain darkens them to ~0.7×, which is what reads as "the dark glazed floor floods"', !dark.length,
      { dark: dark.sort((a, b) => b.n - a.n).slice(0, 10), colours: [...seen.values()].map((e) => ({ hex: e.hex, lum: e.lum, n: e.n })).sort((a, b) => b.n - a.n).slice(0, 14) });
  } catch (e) { R('rule 38: surface value: the check itself threw', false, { error: String(e && e.stack || e).slice(0, 400) }); }

  // ---------------------------------------------------------------------------------------------- rule 45: the outline
  try {
    const B = W.box, nx = B.nx, nz = B.nz, Mk = W.mask, RES = B.res, bad = [], lips = [];
    let minIn = Infinity;
    let n = 0;
    for (let j = 1; j < nz - 1; j += 2) for (let i = 1; i < nx - 1; i += 2) {
      const k = j * nx + i;
      if (!Mk[k]) continue;
      let ox = 0, oz = 0;
      if (!Mk[k - 1]) ox -= 1; if (!Mk[k + 1]) ox += 1; if (!Mk[k - nx]) oz -= 1; if (!Mk[k + nx]) oz += 1;
      if (!ox && !oz) continue;
      n++;
      const l = Math.hypot(ox, oz); ox /= l; oz /= l;
      const x = B.x0 + (i + 0.5) * RES, z = B.z0 + (j + 0.5) * RES;
      const bank = solidAt(x, H + 0.05, z);
      if (bank) {
        // inside a bank: how far in from its face toward the lava (march inward until no solid at the high mark)
        let d = 0; while (d < 1.5 && solidAt(x - ox * d, H + 0.05, z - oz * d)) d += 0.05;
        const top = lvl.groundHeight(x, z, 60);
        minIn = Math.min(minIn, d);
        if (d < 0.45 - 1e-6 || top < H + 0.3 - 1e-6) bad.push({ at: [r2(x), r2(z)], inset: r2(d), top: r2(top), tag: bank.tag || '#' + bank.id });
      } else {
        const gh = lvl.groundHeight(x, z, H + 0.05);
        if (gh > -Infinity && gh > LO - 0.5) bad.push({ at: [r2(x), r2(z)], floorAtOutline: r2(gh) });
        else if (W.fallsIn(x, z) || [0, 1, 2, 3, 4, 5, 6, 7].some((q) => W.fallsIn(x + Math.cos(q * 0.785) * 0.8, z + Math.sin(q * 0.785) * 0.8))) lips.push([r2(x), r2(z)]);
        else bad.push({ at: [r2(x), r2(z)], open: true });
      }
    }
    R('rule 45: the region\'s outline lies ≥ 0.5 m inside every bank it meets (never along a face), in bank ≥ HIGH + 0.3; open only at the lips, into a falls polygon (every 2nd outline texel)', n > 500 && !bad.length && lips.length > 0,
      { outline: n, lips: lips.length, minInsetM: r2(minIn), bad: bad.slice(0, 12), nBad: bad.length });
  } catch (e) { R('rule 45: the outline: the check itself threw', false, { error: String(e && e.stack || e).slice(0, 400) }); }

  // ---------------------------------------------------------------------------------------------- rule 42: views out
  try {
    // a ray meets the level's colliders (physics), the lava surface (its plane inside the region) or a far-scenery mesh
    // (every visible mesh but the level's own, the sky / background shells, particles and big unindexed soups)
    const { Hit } = await import('./src/game/physics.js');
    const hit = new Hit(), rc = new THREE.Raycaster(), scene = __G.scene, skip = new Set([g.levelMesh, g.grateMesh].filter(Boolean));
    rc.far = 3000;
    const targets = [];
    scene.traverse((o) => { if (!o.visible || skip.has(o) || !(o.isMesh || o.isInstancedMesh) || o.name === 'lava:surface') return; const m = Array.isArray(o.material) ? o.material[0] : o.material; if (m && m.side === THREE.BackSide) return; if (o.geometry && !o.geometry.boundingSphere) o.geometry.computeBoundingSphere(); const r = o.geometry?.boundingSphere?.radius || 0, tris = o.geometry ? (o.geometry.index ? o.geometry.index.count : o.geometry.attributes?.position?.count || 0) / 3 : 0; if (!o.geometry?.attributes?.position) return; if (r * Math.max(o.scale.x, o.scale.y, o.scale.z) > 1500 || tris > 60000) return; targets.push(o); });
    const meets = (p, d) => {
      if (__G.physics.raycast(p, d, 600, hit, false).hit) return true;
      if (d.y < 0) { const t = (Lv.y - p.y) / d.y, x = p.x + d.x * t, z = p.z + d.z * t; if (t > 0 && W.inRegion(x, z)) return true; }
      rc.set(p, d); return rc.intersectObjects(targets, false).length > 0;
    };
    const pts = [...lvl.spawnPads.map((p) => V(p.x, p.y + 1.5, p.z))];
    const ring = nav.nodes.filter((nd) => nav.valid[nd.id]).map((nd) => [nd, Math.hypot(nd.x, nd.z)]).sort((a, b) => b[1] - a[1]).slice(0, 400).sort((a, b) => b[0].y - a[0].y);
    for (const [nd] of ring) { if (pts.length >= 26) break; if (pts.every((p) => Math.hypot(p.x - nd.x, p.z - nd.z) > 12)) pts.push(V(nd.x, nd.y + 1.5, nd.z)); }
    const voids = [], per = [];
    for (const p of pts) {
      let miss = 0;
      for (let k = 0; k < 24; k++) for (const pitch of [-0.05, -0.14, -0.26, -0.45]) {
        const a = (k * Math.PI) / 12, d = V(Math.cos(a) * Math.cos(pitch), Math.sin(pitch), Math.sin(a) * Math.cos(pitch));
        if (!meets(p, d)) { miss++; if (voids.length < 12) voids.push([r2(p.x), r2(p.y), r2(p.z), Math.round((a * 180) / Math.PI), r2(pitch)]); }
      }
      per.push(miss);
    }
    const total = per.reduce((s, v) => s + v, 0);
    R('rule 42: no view out of the arena shows void — 96 rays below the horizon from each pad and the 24 highest spots on its outer ring all meet the level, the lava or far scenery (env.sea is off: nothing under the backdrop)', total === 0,
      { viewpoints: pts.length, raysMissing: total, of: pts.length * 96, perView: per, eg: voids, sceneryMeshes: targets.length, backdrop: (lvl.layout?.env?.backdrop ? 'layout.env.backdrop' : 'none') });
  } catch (e) { R('rule 42: views out: the check itself threw', false, { error: String(e && e.stack || e).slice(0, 400) }); }

  // ---------------------------------------------------------------------------------------------- rule 44: gaps, jumps
  const jumps = {};
  try {
  for (const level of ['low', 'high']) {
    setT(level === 'low' ? 10 : 50);
    // edge nodes over lava, and in 16 directions the first floor across (a march in 0.1 m over the region's lava)
    // (a floor within a hop of the node's level, standable now; open lava = nothing standable at all above the surface —
    // a drop to a lower dry floor is no lava gap)
    const ghAt = (x, z, y) => lvl.groundHeight(x, z, y + 1.3);
    const floorNear = (x, z, y) => { const gh = ghAt(x, z, y); return gh > -Infinity && gh > y - 1.3 && gh > Lv.y + K - 0.01 ? gh : null; };
    const lavaAt = (x, z, y) => { const gh = ghAt(x, z, y); return (gh === -Infinity || gh <= Lv.y + K - 0.01) && (W.inRegion(x, z) || W.fallsIn(x, z)); };
    const gaps = [], cands = [];
    for (const nd of nav.nodes) {
      if (!nav.valid[nd.id]) continue;
      if (Lv.covers(nd.x, nd.z, nd.y)) continue;   // (under the lava now)
      for (let k = 0; k < 16; k++) {
        const a = (k * Math.PI) / 8, dx = Math.cos(a), dz = Math.sin(a);
        let edge = null, far = null, gy = null;
        for (let s = 0.1; s <= 9.0; s += 0.1) {
          const x = nd.x + dx * s, z = nd.z + dz * s, f = floorNear(x, z, nd.y);
          if (edge === null) { if (f === null) { if (!lavaAt(x, z, nd.y)) break; edge = s; } continue; }
          if (f !== null) { far = s; gy = f; break; }
          if (!lavaAt(x, z, nd.y)) break;   // (not over lava any more: a lower floor, a wall)
        }
        if (edge === null || far === null) continue;
        const gap = far - edge;
        if (gap > 0.35 && gap < 4.4 && Math.abs(gy - nd.y) <= 1.25) gaps.push([r2(nd.x), r2(nd.y), r2(nd.z), Math.round((a * 180) / Math.PI), r2(gap), r2(gy)]);
        else if (gap >= 4.4 && gap <= 9.0 && gy - nd.y <= 1.3) cands.push({ id: nd.id, x: nd.x, y: nd.y, z: nd.z, dx, dz, edge, far, gy, gap });
      }
    }
    // physically (the kid stepped on its own, actor.update): from 2.5 m behind the edge, running (and swimming in its own
    // ink) straight at it and jumping at the edge — where does it come down?
    const kid = g.match.actors.find((a) => a.bot), it = kid.intent, dt = 1 / 60;
    const P = __G.paint;
    const tryJump = (c, swim) => {
      const sx = c.x + c.dx * (c.edge - 2.6), sz = c.z + c.dz * (c.edge - 2.6), sy = lvl.groundHeight(sx, sz, c.y + 0.6);
      if (!(sy > c.y - 0.6)) return null;
      if (swim) for (let s = -0.2; s <= 2.4; s += 0.5) P.splat(V(sx + c.dx * s, sy + 0.05, sz + c.dz * s), 0.9, kid.team, { instant: true, seed: s });
      kid.spawnAt(V(sx, sy + 0.05, sz), 0); kid.invuln = 99; kid.vel.set(0, 0, 0); kid.form = 'kid';
      it.move.set(0, 0, 0); it.jump = it.squid = it.fire = it.sub = it.special = false;
      for (let i = 0; i < 3; i++) kid.update(dt);
      let jumped = false;
      for (let f = 0; f < 150; f++) {
        it.move.set(c.dx, 0, c.dz); it.squid = swim;
        const along = (kid.pos.x - c.x) * c.dx + (kid.pos.z - c.z) * c.dz;
        it.jump = !jumped && along >= c.edge - 0.35;
        if (it.jump) jumped = true;
        kid.update(dt);
        if (!kid.alive) return { died: true, along: r2((kid.pos.x - c.x) * c.dx + (kid.pos.z - c.z) * c.dz) };
        if (jumped && f > 4 && kid.grounded) break;
      }
      const along = (kid.pos.x - c.x) * c.dx + (kid.pos.z - c.z) * c.dz;
      const gb = kid.ground && lvl.blocks[kid.ground.block];
      return { crossed: kid.alive && kid.grounded && along > c.edge + 0.5 && Math.abs(kid.pos.y - c.gy) < 0.3, along: r2(along), y: r2(kid.pos.y), alive: kid.alive, at: [r2(kid.pos.x), r2(kid.pos.z)], on: gb ? (gb.tag || (gb.dynamic ? 'rider' : '#' + gb.id)) : null };
    };
    // one candidate per node and heading band (the shortest gap), up to 260
    cands.sort((a, b) => a.gap - b.gap);
    const pick = [], seenK = new Set();
    for (const c of cands) { const kk = Math.round(c.x / 2) + ',' + Math.round(c.z / 2) + ',' + Math.round(Math.atan2(c.dz, c.dx) / (Math.PI / 4)); if (seenK.has(kk)) continue; seenK.add(kk); pick.push(c); if (pick.length >= 260) break; }
    const runX = [], swimX = [], dashX = [];
    // the run-jump's reach on the flat (from the physics, at 6 m/s): the air dash adds 3.5 m (subs SPEC: airDashDist)
    for (const c of pick) {
      const run = tryJump(c, false);
      if (run && run.crossed) runX.push({ from: [r2(c.x), r2(c.y), r2(c.z)], dir: Math.round((Math.atan2(c.dz, c.dx) * 180) / Math.PI), edge: r2(c.edge), far: r2(c.far), gap: r2(c.gap), landed: run.at, along: run.along, on: run.on });
      const sw = tryJump(c, true);
      if (sw && sw.crossed) swimX.push(c);
      if (run && run.along != null && run.along >= c.edge - 0.4 && (run.along - c.edge) + 3.5 >= c.gap) dashX.push(c);
    }
    P.clear();
    // the nav detour each of them saves (the lead's list: connections the nav graph lacks, gain > 10 m)
    const detour = (c) => { const m = nav.nearest(V(c.x + c.dx * (c.far + 0.4), c.gy, c.z + c.dz * (c.far + 0.4)), 0.6, true); if (m < 0) return null; const p = nav.path(c.id, m, 0); if (!p) return Infinity; let L = 0; for (let i = 1; i < p.length; i++) { const a = nav.nodes[p[i - 1]], b = nav.nodes[p[i]]; L += Math.hypot(b.x - a.x, b.z - a.z); } return L - (c.far + 0.4); };
    const list = (arr) => arr.map((c) => ({ from: [r2(c.x), r2(c.y), r2(c.z)], gap: r2(c.gap), gain: r2(detour(c)) })).filter((x) => x.gain === Infinity || x.gain > 10).sort((a, b) => b.gain - a.gain);
    jumps[level] = { edgesChecked: cands.length, tried: pick.length, gaps, runCross: runX, swim: list(swimX), dash: list(dashX) };
  }
  R('rule 44: no unplanned jumps across lava at LOW or HIGH — every gap between standable floors over lava is a seam (≤ 0.3 m) or ≥ 4.5 m, and physically a kid\'s running jump crosses none',
    !jumps.low.gaps.length && !jumps.high.gaps.length && !jumps.low.runCross.length && !jumps.high.runCross.length,
    { low: { gaps: jumps.low.gaps.slice(0, 8), nGaps: jumps.low.gaps.length, runCross: jumps.low.runCross.slice(0, 6), tried: jumps.low.tried }, high: { gaps: jumps.high.gaps.slice(0, 8), nGaps: jumps.high.gaps.length, runCross: jumps.high.runCross.slice(0, 6), tried: jumps.high.tried } });
  R('rule 44 (the lead\'s list): lava gaps a swim jump out of your own ink, or a jump plus the Dash Pellet\'s 3.5 m air dash, could cross, where the nav detour saved is over 10 m (informational: these are the design\'s ≥ 4.5 m gaps)', true,
    { low: { swim: jumps.low.swim.slice(0, 10), nSwim: jumps.low.swim.length, dash: jumps.low.dash.slice(0, 10), nDash: jumps.low.dash.length }, high: { swim: jumps.high.swim.slice(0, 10), nSwim: jumps.high.swim.length, dash: jumps.high.dash.slice(0, 10), nDash: jumps.high.dash.length } });

  } catch (e) { R('rule 44: the check itself threw', false, { error: String(e && e.stack || e).slice(0, 400) }); }

  // ---------------------------------------------------------------------------------------------- rule 46: grid shift
  try {
    const keep = { nav: W.nav, navMeta: W.navMeta, links: W.links, linkEnds: W._linkEnds, gapCuts: W.gapCuts, problems: W.navProblems };
    const B0 = { ...lvl.bounds }, rows = [];
    const climbs = (nv) => {
      const MM = nv.lavaMeta, kindOf = (id) => MM.kind[id];
      const ofR = (id, pose) => nv.nodes.filter((nd) => MM.rider[nd.id] === W.riders.findIndex((r) => r.id === id) && MM.pose[nd.id] === pose).map((nd) => nd.id);
      const run = (from, to, pose, noFloor) => {
        nv.ext = { edge: (e, t) => ((MM.kind[t] === 2 && MM.pose[t] !== pose) || (noFloor && MM.kind[t] === 1) ? Infinity : 0), node: () => true };
        const p = from >= 0 && to.length ? nv.path(from, to[0], 0) : null;
        nv.ext = null;
        return p ? p.map(kindOf).join('') : null;
      };
      const isl = nv.nearest(V(-10, 1.2, -3.6), 0.8), isl2 = nv.nearest(V(10, 1.2, 3.6), 0.8);
      const sH = nv.nearest(V(-18.74, 1.2, -14.4), 0.8), nH = nv.nearest(V(-23.64, 1.2, -0.19), 0.8);
      return { organLow: run(isl, ofR('organL', 0), 0), organHigh: run(isl, ofR('organL', 1), 1), organHigh2: run(isl2, ofR('organL~', 1), 1), raceHigh: run(sH, [nH], 1, true) };
    };
    for (const [dx, dz] of [[0, 0], [0.25, 0], [0.5, 0], [0, 0.25], [0, 0.5]]) {
      lvl.bounds.minX = B0.minX + dx; lvl.bounds.maxX = B0.maxX + dx; lvl.bounds.minZ = B0.minZ + dz; lvl.bounds.maxZ = B0.maxZ + dz;
      W.links = []; W._linkEnds = []; W.gapCuts = 0;
      let nv = null, err = null;
      try { nv = W.buildNav(lvl, __G.physics); } catch (e) { err = String(e).slice(0, 200); }
      const c = nv ? climbs(nv) : {};
      rows.push({ shift: [dx, dz], problems: W.navProblems.length, err, nodes: nv ? nv.nodes.length : 0, ...c,
        ok: !!nv && !W.navProblems.length && !!c.organLow && /2/.test(c.organLow) && !!c.organHigh && /2/.test(c.organHigh) && !!c.organHigh2 && !!c.raceHigh && (c.raceHigh.match(/2/g) || []).length >= 5 });
    }
    Object.assign(lvl.bounds, B0);
    W.nav = keep.nav; W.navMeta = keep.navMeta; W.links = keep.links; W._linkEnds = keep.linkEnds; W.gapCuts = keep.gapCuts; W.navProblems = keep.problems;
    // (buildNav cleared the level's dynamic blocks: the riders back in)
    Lv.placed = false; for (const RR of Lv.riders) RR.blocks = []; Lv.placeRiders();
    R('rule 46: with the nav grid shifted 0.25 m and 0.5 m in x and in z, every step link still yields its edges and the climbs exist (island → A → B → L at LOW and at HIGH on both sides, the Race head → 5 stones → head at HIGH)', rows.every((x) => x.ok), rows);
  } catch (e) { R('rule 46: grid shift: the check itself threw', false, { error: String(e && e.stack || e).slice(0, 400) }); }
  void PLAYER;
  return out;
})();
