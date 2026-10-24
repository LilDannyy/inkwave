// The lava stage audit on Highmark Foundry (ENGINE.md §5's rules marked (A) that tests/lava.js does not cover, and the
// (C) ones check-maps cannot see without the built level; ENGINE §6 step 12):
//   MAP=caldera MODE=turf PAGE=tools/botlab/tests/lava-audit.js WATCHDOG=900000 tools/botlab/run.sh tools/botlab/page.cjs
//   rule 14  every drowning floor is ≤ 12 m walking from floor that never drowns, and the way never drops below it
//   rule 21  (fix round 4) no pinch beside a Pumice stone at HIGH: a static top beside one is a seam ≤ 0.3 m or ≥ 2.5 m away
//            (fix round 6: from EVERY standable static top within 2.5 m, the true shortest distance across lava, corners in)
//   rule 22  clear sky over every rider: nothing static over its travel or within 2.2 m over its HIGH top
//   rule 25  a lookout: cover ≤ 1.0 m tall along ≤ half its edge, ≥ 2 open sides, ≤ 22 m from both teams' dry floor at
//            HIGH, its HIGH top ≤ 4.6 m over the floor its climb starts from
//   rule 38  the surfaces in the region are mid-value rock (sRGB luminance ≥ 0.35), never black
//   rule 42  no view out of the arena shows void (rays from the high ground and the pads, below the horizon)
//   rule 44  jumps across the lava (the lead's decision after review 5: DESIGN §3.5's option 1): a plain running jump
//            across lava saves at most 20 m against the dry way round and the largest under 15 m (the gate); swim jumps
//            out of own ink and jumps + the Dash Pellet's air dash are skill movement, listed with the nav detour they
//            save, no gate; a Bazookarp carrier's swim jumps are listed for the Bazookarp layout (the lead after review 6:
//            judged per stage by its checker's #7d). Every edge node, 16 headings, gaps to 11 m, every candidate (no sample
//            cap), a crossing = a flight over lava that comes down alive on floor past it. Fix round 6 (review 6): the far
//            floor is any standable floor across the lava (not only within 1.3 m below), a take-off may drop onto a lower
//            dry strip (≤ 3 m) before the lava, and each jump is tried from 2.6, 1.5 and 0.8 m behind the edge.
//            PAGE_ARGS full=1: every crossing
//   rule 45  the region's outline lies ≥ 0.5 m inside every bank it meets (never along a face), in solid bank whose top
//            is ≥ HIGH + 0.3; open edges only at the lips (into a falls polygon)
//   rule 46  the nav built with its grid shifted 0.25 m and 0.5 m (x, z): every step link still yields its edges, the
//            Organ climb exists at both poses and the Race chain head → stones → head at HIGH
//   rule 47  (fix round 7, review 7; widened in fix round 8, review 8) no roof top beside the lava slides a kid into it,
//            holds it as a perch or flings it: (a) the hop-on probe, (b) every point of every top, still or drifting, at LOW,
//            HIGH and the rise's / fall's levels, (c) Mitts leaps, running and swim jumps, walk-offs and hops during the rise
//            onto every top that holds, (d) Mitts leaps onto the tall tops; 0 deaths, 0 flings, 0 perches, rescues ≤ 6 m
//   PAGE_ARGS rules=21,44: only those rules (to iterate); every rule without it
(async () => {
  const g = window.__inkwave, out = [];
  const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const THREE = await import('three');
  const C = await import('./src/game/lavaCore.js');
  const { PLAYER } = await import('./src/config.js');
  const W = __G.lavaWorld, Lv = g.match?.lava;
  const partPose = C.partPose;
  R('the lava module runs on the stage', !!W && !!Lv);
  if (!W || !Lv) return out;
  // (PAGE_ARGS rules=21,44: only those rules; every rule without it)
  const onlyR = /rules=([^;&]+)/.exec(String(window.__pageArgs || ''))?.[1]?.split(','), want = (k) => !onlyR || onlyR.includes(k);
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
  if (want('14')) try {
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
  if (want('22')) try {
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

  // ---------------------------------------------------------------------------------------------- rule 21: no pinch beside a stone
  // (fix round 4: ENGINE rule 21 — every gap beside a rider is a seam ≤ 0.3 m or open lava ≥ 2.5 m wide — was never audited.
  // At HIGH, each Pumice stone's outline every 0.25 m, marched straight out: the first static top within 0.4 m of the stone's
  // top; another stone first is walkable (no gap); a static top 0.3–2.5 m out over lava is a pinch a foot can drop into —
  // a bot fell into such a notch at the north head's lake corner in a Zone Control match.)
  // (fix round 6, review 6 issue 2: that march stopped 0.1 m short of every corner and only went straight out, so the gaps
  // at the stones' corners — races 4, 6 and 7, where kids died walking off at an angle — were never measured. Now, on top of
  // it, every stone's outline every 0.1 m, corners included, fanned from its normal to ±67.5° (every 7.5°; a corner takes
  // both faces' fans), marched out 2.5 m over a 0.05 m map of the static tops (any solid from just over the lava's kill
  // height to a step over the stone's top) and the riders: a top reached after a stretch of over 0.3 m where a foot
  // (footRadius 0.24 m) touches nothing — not the stone, not a rider, not a top — is a pinch (another stone reached first
  // is walkable, as in the march above: the Race's own seams and steps): the gap there is wider than a
  // seam the foot bridges and narrower than open lava. (A walk that grazes a top's face within a foot's reach, e.g. off a
  // stone's end past a kerb 0.2 m beside it, is no gap: the foot is on the kerb.) Each pinch is listed with the walk's
  // length over the lava, its open stretch, and the true shortest distance from where it met the top to the stone)
  if (want('21')) try {
    setT(50);
    const pinch = [], per = {};
    for (const RR of Lv.riders.filter((q) => q.r.sink && q.solid)) {
      const r = RR.r, top = RR.top;
      for (const p of r.parts) {
        if (!p.body) continue;
        const q = C.partPose(r, p, top, {}), c = Math.cos(q.yaw), sn = Math.sin(q.yaw);
        const edges = [[q.hx, null, c, -sn], [-q.hx, null, -c, sn], [null, q.hz, sn, c], [null, -q.hz, -sn, -c]];
        for (const [u0, v0, nx, nz] of edges) {
          const L = u0 === null ? q.hx : q.hz;
          for (let t = -L + 0.1; t <= L - 0.1 + 1e-6; t += 0.25) {
            const u = u0 === null ? t : u0, v = v0 === null ? t : v0, ex = q.cx + u * c + v * sn, ez = q.cz - u * sn + v * c;
            let hit = null;
            for (let d = 0.05; d <= 2.5 && !hit; d += 0.05) {
              const x = ex + nx * d, z = ez + nz * d;
              if (Lv.riders.some((o) => o !== RR && o.solid && C.inRider(o.r, x, z, 0) && Math.abs(o.top - top) < 0.4)) { hit = 'rider'; break; }
              for (let y = top + 0.35; y >= top - 0.4; y -= 0.05) { const b = solidAt(x, y, z); if (b) { hit = [d, b.tag || '#' + b.id, y]; break; } }
            }
            if (Array.isArray(hit) && hit[0] > 0.3 && hit[0] < 2.5) { const k = r.id; per[k] = Math.max(per[k] || 0, hit[0]); if (pinch.length < 40) pinch.push(['straight', r.id, r2(ex), r2(ez), r2(hit[0]), hit[1]]); }
          }
        }
      }
    }
    // the corner-inclusive fans (fix round 6)
    // (OPEN: an open stretch a kid crosses unharmed — walking at ~3 m/s it is unsupported 0.1 s and drops 0.13 m of the 0.30 m
    // between the stone's top and the kill height; running or as a squid less. The diagonal walks in lava-notch.js are the
    // physical proof)
    const RES = 0.05, FOOT = PLAYER.footRadius ?? 0.24, OPEN = 0.3, lo = Lv.y + K + 0.02, cells = new Map();
    const solidR = Lv.riders.filter((q) => q.solid);
    let fans = 0, walks = 0;
    for (const RR of Lv.riders.filter((q) => q.r.sink && q.solid)) {
      const r = RR.r, top = RR.top, hi = top + 0.35;
      // the stone's outline every 0.1 m with its outward normal(s); corners carry both faces' normals
      const outl = [];
      for (const p of r.parts) {
        if (!p.body) continue;
        const q = C.partPose(r, p, top, {}), c = Math.cos(q.yaw), sn = Math.sin(q.yaw);
        for (const [u0, v0, nx, nz] of [[q.hx, null, c, -sn], [-q.hx, null, -c, sn], [null, q.hz, sn, c], [null, -q.hz, -sn, -c]]) {
          const L = u0 === null ? q.hx : q.hz, n = Math.max(2, Math.round((2 * L) / 0.1));
          for (let i = 0; i <= n; i++) { const t = -L + (2 * L * i) / n, u = u0 === null ? t : u0, v = v0 === null ? t : v0; outl.push([q.cx + u * c + v * sn, q.cz - u * sn + v * c, nx, nz]); }
        }
      }
      let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
      for (const [x, z] of outl) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
      const gx0 = x0 - 2.8, gz0 = z0 - 2.8, NX = Math.ceil((x1 - x0 + 5.6) / RES) + 1, NZ = Math.ceil((z1 - z0 + 5.6) / RES) + 1;
      // the map: 1 this stone, 2 another rider, 3 a static solid in the band (its block id kept), 0 lava / nothing
      const kind = new Uint8Array(NX * NZ), blk = new Int32Array(NX * NZ).fill(-1), sup = new Uint8Array(NX * NZ);
      for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) {
        const x = gx0 + i * RES, z = gz0 + j * RES, k = j * NX + i;
        if (C.inRider(r, x, z, 0)) { kind[k] = 1; continue; }
        if (solidR.some((o) => o !== RR && C.inRider(o.r, x, z, 0))) { kind[k] = 2; continue; }
        for (let y = hi; y >= lo; y -= 0.05) { const b = solidAt(x, y, z); if (b) { kind[k] = 3; blk[k] = b.id; break; } }
      }
      // a foot's reach: any cell within FOOT of the stone, a rider or a static solid
      const R0 = Math.ceil(FOOT / RES), disk = [];
      for (let dj = -R0; dj <= R0; dj++) for (let di = -R0; di <= R0; di++) if ((di * RES) ** 2 + (dj * RES) ** 2 <= FOOT * FOOT + 1e-9) disk.push([di, dj]);
      for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) {
        if (!kind[j * NX + i]) continue;
        for (const [di, dj] of disk) { const ii = i + di, jj = j + dj; if (ii >= 0 && jj >= 0 && ii < NX && jj < NZ) sup[jj * NX + ii] = 1; }
      }
      const at = (x, z) => { const i = Math.round((x - gx0) / RES), j = Math.round((z - gz0) / RES); return i < 0 || j < 0 || i >= NX || j >= NZ ? -1 : j * NX + i; };
      const wOf = (x, z) => { let d = Infinity; for (const [px, pz] of outl) d = Math.min(d, (px - x) ** 2 + (pz - z) ** 2); return Math.sqrt(d); };
      // corners: the outline points shared by two faces get both normals
      const pts = new Map();
      for (const [x, z, nx, nz] of outl) { const key = Math.round(x * 50) + ',' + Math.round(z * 50); const e = pts.get(key) || { x, z, ns: [] }; e.ns.push([nx, nz]); pts.set(key, e); }
      for (const e of pts.values()) {
        const heads = new Set();
        for (const [nx, nz] of e.ns) { const a0 = Math.atan2(nz, nx); for (let o = -67.5; o <= 67.5 + 1e-6; o += 7.5) heads.add(Math.round(((a0 + (o * Math.PI) / 180) * 180) / Math.PI / 7.5)); }
        fans++;
        for (const hk of heads) {
          const a = (hk * 7.5 * Math.PI) / 180, ux = Math.cos(a), uz = Math.sin(a);
          let run = 0, open = 0, hit = null;
          for (let s = 0.03; s <= 2.5; s += RES) {
            const k = at(e.x + ux * s, e.z + uz * s);
            if (k < 0) break;
            if (kind[k] === 1) { if (s > 0.2) break; continue; }   // (back over the stone: a walk along its own face)
            if (kind[k] === 2) break;                               // (another stone first: walkable — the Race's own seams and steps)
            if (kind[k] === 3) { hit = { s, k }; break; }
            if (!sup[k]) { run += RES; open = Math.max(open, run); } else run = 0;
          }
          walks++;
          if (!hit || open <= OPEN + 1e-6) continue;
          const hx = e.x + ux * hit.s, hz = e.z + uz * hit.s, b = blk[hit.k] >= 0 ? lvl.blocks[blk[hit.k]] : null;
          const w = wOf(hx, hz), ck = r.id + ':' + Math.round(hx * 2) / 2 + ',' + Math.round(hz * 2) / 2;
          const row = [r.id, r2(e.x), r2(e.z), Math.round((a * 180) / Math.PI), r2(hit.s), r2(open), r2(w), b ? b.tag || '#' + b.id : '?', [r2(hx), r2(hz)]];
          const old = cells.get(ck); if (!old || old[4] < row[4]) cells.set(ck, row);
          per[r.id] = Math.max(per[r.id] || 0, w);
        }
      }
    }
    const fanP = [...cells.values()].sort((p, q) => q[6] - p[6]);
    const byStone = {}; for (const p of fanP) byStone[p[0]] = (byStone[p[0]] || 0) + 1;
    R('rule 21: no pinch beside a Pumice stone at HIGH — every static top beside one is a seam (≤ 0.3 m) or ≥ 2.5 m away across open lava: straight out from each face (every 0.25 m), and (fix round 6) fanned out to ±67.5° from every 0.1 m of the outline, corners included, no walk over the lava to a top within 2.5 m with a stretch of over 0.3 m where the foot (0.24 m) touches nothing (another stone first: walkable)',
      !pinch.length && !fanP.length && fans > 100,
      { straight: pinch.length, fanCells: fanP.length, fans, walks, byStone, widestByStone: Object.fromEntries(Object.entries(per).map(([k, v]) => [k, r2(v)])), egStraight: pinch.slice(0, 10),
        egFan: fanP.slice(0, 120), cols: 'stone, from x, z, heading°, walk m over lava to the top, its open stretch m, the true shortest distance from where it met the top to the stone m, tag, met at' });
  } catch (e) { R('rule 21: no pinch beside a stone: the check itself threw', false, { error: String(e && e.stack || e).slice(0, 400) }); }

  // ---------------------------------------------------------------------------------------------- rule 25: the lookout
  if (want('25')) try {
    setT(50);
    const rows = [];
    // (fix round 6, the lead after review 6: the lookout's crown of pipes along its lava-facing rim is a screen, not cover —
    // the lead asked for a barrier a kid can't run-jump over that keeps the sightlines. Cover is measured without the pipes;
    // the crown is measured for what it must be: ≥ 60 % open along its line at 0.5, 1.0 and 1.5 m over the deck, no open
    // stretch a kid's body fits through at 0.5 and 1.0 m (≤ 0.62 m; a kid is 0.76 m across — over the 1.0 m stub, which
    // fills the south edge's middle, is no way through for a 1.45 m body), every pipe ≤ 0.3 m across and ≥ 2.0 m tall (a
    // kid reaches 1.8 m))
    const pipeIds = new Set();
    for (const Q of Lv.riders) (Q.r.parts || []).forEach((p, k) => { if (p.pipe && Q.blocks?.[k]) pipeIds.add(Q.blocks[k].id); });
    const solidNP = (x, y, z) => { hp.set(x, y, z); for (const id of lvl.queryBlocks(x - 0.01, z - 0.01, x + 0.01, z + 0.01, qb)) { const b = lvl.blocks[id]; if (b.solid && !pipeIds.has(b.id) && lvl.pointInBlock(b, hp, 0.001)) return b; } return null; };
    const pipeAt = (x, y, z) => { hp.set(x, y, z); for (const id of lvl.queryBlocks(x - 0.01, z - 0.01, x + 0.01, z + 0.01, qb)) { const b = lvl.blocks[id]; if (b.solid && pipeIds.has(b.id) && lvl.pointInBlock(b, hp, 0.001)) return b; } return null; };
    const solidAny = (x, y, z) => { hp.set(x, y, z); for (const id of lvl.queryBlocks(x - 0.01, z - 0.01, x + 0.01, z + 0.01, qb)) { const b = lvl.blocks[id]; if (b.solid && lvl.pointInBlock(b, hp, 0.001)) return b; } return null; };
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
          for (let y = 0.05; y <= 2.0; y += 0.05) for (const o of [0, 0.35]) if (solidNP(px + nx * o, top + y, pz + nz * o)) h = Math.max(h, y);
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
      // the crown: its pipes (this rider's), the line through their centres sampled every 0.02 m at three heights
      const pipes = r.parts.map((p, k) => (p.pipe ? partPose(r, p, top, {}) : null)).filter(Boolean);
      let crown = null;
      if (pipes.length) {
        const ang = (q) => Math.atan2(q.cz - r.z, q.cx - r.x), ord = [...pipes].sort((a, b) => ((ang(a) - ang(pipes[0]) + 4 * Math.PI) % (2 * Math.PI)) - ((ang(b) - ang(pipes[0]) + 4 * Math.PI) % (2 * Math.PI)));
        // (walk the pipes in order round the column from the crown's open end: the largest angular step is the open side —
        // fix round 7: of equal steps (the north flat and the south flat are both a 60° step since the north-east and
        // north-west edges are crowned whole) the one the stub does not stand in)
        const stubIn = (p, q) => { const mx = (p.cx + q.cx) / 2, mz = (p.cz + q.cz) / 2, ix = r.x - mx, iz = r.z - mz, il = Math.hypot(ix, iz) || 1; return !!(solidAny(mx, top + 0.5, mz) || solidAny(mx + (ix / il) * 0.3, top + 0.5, mz + (iz / il) * 0.3)); };
        let gapAt = 0, big = -1; for (let i = 0; i < ord.length; i++) { const a0 = ang(ord[i]), a1 = ang(ord[(i + 1) % ord.length]); const da = ((a1 - a0) + 4 * Math.PI) % (2 * Math.PI); if (da > big + 1e-3 || (da > big - 1e-3 && !stubIn(ord[i], ord[(i + 1) % ord.length]))) { big = Math.max(big, da); gapAt = i; } }
        const seq = [...ord.slice(gapAt + 1), ...ord.slice(0, gapAt + 1)];
        let len = 0, openLen = 0, maxRun = 0, run = 0, n = 0;   // (openness: along the pipes' line, the stub's stretch left out)
        for (const hy of [0.5, 1.0, 1.5]) { run = 0;
          for (let i = 0; i + 1 < seq.length; i++) { const a = seq[i], b = seq[i + 1], L = Math.hypot(b.cx - a.cx, b.cz - a.cz);
            for (let t = 0; t < L; t += 0.02) { const x = a.cx + ((b.cx - a.cx) * t) / L, z = a.cz + ((b.cz - a.cz) * t) / L; n++;
              const ix0 = r.x - x, iz0 = r.z - z, il0 = Math.hypot(ix0, iz0) || 1, stub = !pipeAt(x, top + 0.5, z) && (solidAny(x, top + 0.5, z) || solidAny(x + (ix0 / il0) * 0.3, top + 0.5, z + (iz0 / il0) * 0.3));
              if (!stub) len += 0.02;
              if (pipeAt(x, top + hy, z)) { run = 0; continue; }
              // (the stub: cover, counted above; it stands 0.17 m in from the south edge, so the line through the pipes'
              // centres runs just outside it — a body crossing the line there meets it 0.3 m in)
              const ix = r.x - x, iz = r.z - z, il = Math.hypot(ix, iz) || 1;
              if (solidAny(x, top + hy, z) || solidAny(x + (ix / il) * 0.3, top + hy, z + (iz / il) * 0.3)) { run = 0; continue; }
              if (!stub) openLen += 0.02; run += 0.02; if (hy < 1.2) maxRun = Math.max(maxRun, run); } } }
        crown = { pipes: pipes.length, open: r2(openLen / len), maxOpenRun: r2(maxRun), widest: r2(Math.max(...pipes.map((q) => 2 * Math.max(q.hx, q.hz)))), lowest: r2(Math.min(...pipes.map((q) => q.hy * 2))) };
      }
      rows.push({ id: r.id, top: r2(top), coverShare: r2(coverShare), coverH, open, dry, foot, over: foot === null ? null : r2(top - foot), crown, edges });
    }
    R('rule 25: each lookout — cover ≤ 1.0 m tall along ≤ half its edge, ≥ 2 open sides, ≤ 22 m from both teams\' dry floor at HIGH, its HIGH top ≤ 4.6 m over its climb\'s foot; its crown of pipes (fix round 6) a screen, not cover: ≥ 60 % open, no gap a kid fits (≤ 0.62 m), pipes ≤ 0.3 m across and ≥ 2.0 m tall',
      rows.length === 2 && rows.every((x) => x.coverH <= 1.0 + 1e-6 && x.coverShare <= 0.5 && x.open >= 2 && x.dry.every((d) => d <= 22) && x.over !== null && x.over <= 4.6
        && (!x.crown || (x.crown.open >= 0.6 && x.crown.maxOpenRun <= 0.62 && x.crown.widest <= 0.3 + 1e-6 && x.crown.lowest >= 2.0 - 1e-6))), rows);
  } catch (e) { R('rule 25: the lookout: the check itself threw', false, { error: String(e && e.stack || e).slice(0, 400) }); }

  // ---------------------------------------------------------------------------------------------- rule 38: surface value
  if (want('38')) try {
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
  if (want('45')) try {
    const B = W.box, nx = B.nx, nz = B.nz, Mk = W.mask, RES = B.res, bad = [], lips = [];
    let minIn = Infinity;
    let n = 0;
    // (fix round 3: every outline texel — every 2nd one in x and z sampled one half's texels and not their twins)
    for (let j = 1; j < nz - 1; j++) for (let i = 1; i < nx - 1; i++) {
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
        // (fix round 3: the face is where the solid ends for 0.15 m — a hairline crack between two bank blocks (the Rim
        // Ridge's columns against the north head's, 5 cm) is no face the lava's edge could show along)
        const sol = (dd) => solidAt(x - ox * dd, H + 0.05, z - oz * dd);
        let d = 0; while (d < 1.5 && (sol(d) || sol(d + 0.05) || sol(d + 0.1))) d += 0.05;
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
    // (fix round 3: one fitted half turned 180° — the whole mask is its own 180° twin)
    let asym = 0; for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) if (Mk[j * nx + i] !== Mk[(nz - 1 - j) * nx + (nx - 1 - i)]) asym++;
    R('rule 45: the region\'s outline lies ≥ 0.5 m inside every bank it meets (never along a face), in bank ≥ HIGH + 0.3; open only at the lips, into a falls polygon (every outline texel); one fitted half, turned 180° (the mask is its own twin)', n > 1000 && !bad.length && lips.length > 0 && asym === 0 && W.fitTwin,
      { outline: n, lips: lips.length, minInsetM: r2(minIn), bad: bad.slice(0, 12), nBad: bad.length, asymTexels: asym, fitTwin: !!W.fitTwin, twinChanged: W.fitTwinChanged, fitAdded: W.fitAdded });
  } catch (e) { R('rule 45: the outline: the check itself threw', false, { error: String(e && e.stack || e).slice(0, 400) }); }

  // ---------------------------------------------------------------------------------------------- rule 42: views out
  if (want('42')) try {
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
    // (fix round 5, review 5 issue 5: from where a player stands over each lip — the Spillway Bridge's deck, its middle and its
    // bay-side end, and the Horn Step, both halves: the lavafall's backdrop gap is checked from there, not only from the
    // pads and the highest spots)
    const nRing = pts.length, GEO = await import('./src/world/stages/caldera/geo.js'), lipViews = [];
    { const hs = GEO.HORN_STEP_SE, hc = [hs.reduce((a, q) => a + q[0], 0) / hs.length, hs.reduce((a, q) => a + q[1], 0) / hs.length];
      for (const [x, z, name] of [[...GEO.A((GEO.BR_S[0] + GEO.BR_S[1]) / 2, 0), 'bridge'], [...GEO.A(GEO.BR_S[1] - 0.6, 0), 'bridge end'], [...hc, 'horn step']]) for (const tw of [1, -1]) {
        const gx = x * tw, gz = z * tw, gy = lvl.groundHeight(gx, gz, 4);
        if (gy > -Infinity) { pts.push(V(gx, gy + 1.5, gz)); lipViews.push(name + (tw < 0 ? '~' : '')); }
      } }
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
    R('rule 42: no view out of the arena shows void — 96 rays below the horizon from each pad, the 24 highest spots on its outer ring, and over each lip from the Spillway Bridge and the Horn Step (fix round 5), all meet the level, the lava or far scenery (env.sea is off: nothing under the backdrop)', total === 0,
      { viewpoints: pts.length, raysMissing: total, of: pts.length * 96, perView: per, lipViews: Object.fromEntries(lipViews.map((n, k) => [n, per[nRing + k]])), eg: voids, sceneryMeshes: targets.length, backdrop: (lvl.layout?.env?.backdrop ? 'layout.env.backdrop' : 'none') });
  } catch (e) { R('rule 42: views out: the check itself threw', false, { error: String(e && e.stack || e).slice(0, 400) }); }

  // ---------------------------------------------------------------------------------------------- rule 44: gaps, jumps
  const jumps = {};
  if (want('44')) try {
  const kid = g.match.actors.find((a) => a.bot), it = kid.intent, dt = 1 / 60;
  const P = __G.paint;
  const sub0 = kid.subId || null;
  // (fix round 3, the takeover) the kid's own reach on flat ground, the real physics (the causeway at LOW, x −1.5, a lane
  // with nothing in it): how far each kind of jump flies from its take-off to where the feet come back to its level.
  // A swim jump keeps the swim's 11.8 m/s through the air (a squid in the air keeps its momentum): it flies ~8.5 m, so a
  // "≥ 6.5 m" gap is no bar to it; it peaks 1.70 m over the take-off
  const reach = {};
  {
    setT(10);
    const X = -1.5, Z0 = -21.5, sy = lvl.groundHeight(X, Z0, 5);
    for (const [name, swim, pf] of [['run', false, null], ['swim', true, null], ['run+dash@18', false, 18], ['run+dash@30', false, 30], ['swim+dash@18', true, 18], ['swim+dash@30', true, 30]]) {
      P.clear();
      if (swim) for (let s = -0.2; s <= 3.2; s += 0.5) P.splat(V(X, sy + 0.05, Z0 + s), 0.9, kid.team, { instant: true, seed: s });
      kid.spawnAt(V(X, sy + 0.05, Z0), 0); kid.invuln = 99; kid.vel.set(0, 0, 0); kid.form = 'kid';
      if (pf != null && kid.subId !== 'dash') kid.setSub?.('dash');
      kid.ink = 100; it.move.set(0, 0, 0); it.jump = it.squid = it.fire = it.sub = it.special = false;
      for (let i = 0; i < 3; i++) kid.update(dt);
      let jf = -1, jz = 0, peak = 0;
      for (let f = 0; f < 200; f++) {
        it.move.set(0, 0, 1); it.squid = swim && (pf == null || jf < 0 || f - jf < pf);
        it.jump = jf < 0 && kid.pos.z - Z0 >= 2.6; if (it.jump) { jf = f; jz = kid.pos.z; }
        it.sub = pf != null && jf >= 0 && f - jf === pf;
        kid.update(dt);
        if (jf >= 0) peak = Math.max(peak, kid.pos.y - sy);
        if (jf >= 0 && f - jf > 4 && kid.grounded) break;
      }
      reach[name] = { m: r2(kid.pos.z - jz), peak: r2(peak), landedAt: r2(kid.pos.y - sy) };
    }
    if (sub0 && kid.subId !== sub0) kid.setSub?.(sub0);
    P.clear();
  }
  // (PAGE_ARGS r44=steer: only the steered rider-top march, to iterate on the crown; the gate then reads only that)
  // (PAGE_ARGS lv=high: one level; fine=0.15,3.75: the Organ-top pass's grid (m) and heading step (°); sf=6,8,10: the frames
  // after the jump the stick turns at — a finer look than the gate's 0.3 m, 7.5°, 8 frames)
  const steerOnly = /(^|[;&])r44=steer/.test(String(window.__pageArgs || ''));
  const PA = String(window.__pageArgs || ''), lvOnly = /(^|[;&])lv=(low|high)/.exec(PA)?.[2];
  const fineArg = /(^|[;&])fine=([0-9.]+),([0-9.]+)/.exec(PA), FG = fineArg ? Number(fineArg[2]) : 0.3, FD = fineArg ? Number(fineArg[3]) : 7.5;
  const SF = (/(^|[;&])sf=([0-9,]+)/.exec(PA)?.[2] || '8').split(',').map(Number);
  // (fix round 8: the steered march off every take-off and the rider tops turns the stick at 4, 8 and 12 frames — sfx=)
  const SFX = (/(^|[;&])sfx=([0-9,]+)/.exec(PA)?.[2] || '4,8,12').split(',').map(Number);
  for (const level of ['low', 'high']) {
    if (lvOnly && level !== lvOnly) { jumps[level] = { edgesChecked: 0, deep: 0, strip: 0, gaps: [], runCross: [], skill: [], carry: [], steer: [], seam: [], leap: [], steerCands: 0, steerTried: 0, anyCands: 0, anyTried: 0, fineTried: 0, fine: {} }; continue; }
    setT(level === 'low' ? 10 : 50);
    // edge nodes over lava, and in 16 directions the first floor across (a march in 0.1 m over the region's lava).
    // (fix round 6, review 6 issue 1 — the march looked in too few places: it took a far floor only within 1.3 m below the
    // take-off and only where the lava began right at the take-off's edge, so Organ L's HIGH top, 3.4 m over the Race,
    // launched 24 running jumps saving 20–38.6 m it never tried. Now the far floor is ANY standable floor across the lava,
    // down to the lava itself; a take-off whose edge drops first onto a lower dry strip (≤ 3 m of it) and then the lava
    // counts too; and each jump is tried from 2.6, 1.5 and 0.8 m behind the edge — the first run-up that fits on the top
    // and crosses. Out to 11 m — a swim jump + an air dash flies 10 m — and EVERY candidate tried)
    const ghAt = (x, z, y) => lvl.groundHeight(x, z, y + 1.3);
    // (the region only: a falls polygon past a lip is a chute to fall down, not lava to jump over)
    const lavaAt = (x, z, y) => { const gh = ghAt(x, z, y); return (gh === -Infinity || gh <= Lv.y + K - 0.01) && W.inRegion(x, z); };
    const gaps = [], cands = [];
    for (const nd of nav.nodes) {
      if (!nav.valid[nd.id]) continue;
      if (Lv.covers(nd.x, nd.z, nd.y)) continue;   // (under the lava now)
      // (a stone's or a column's node at a pose it is not at now: no floor under it this instant)
      const gh0 = lvl.groundHeight(nd.x, nd.z, nd.y + 0.3); if (!(Math.abs(gh0 - nd.y) < 0.3)) continue;
      for (let k = 0; k < 16; k++) {
        const a = (k * Math.PI) / 8, dx = Math.cos(a), dz = Math.sin(a);
        let edge = null, lava0 = null, far = null, gy = null;
        for (let s = 0.1; s <= 12.0; s += 0.1) {
          const x = nd.x + dx * s, z = nd.z + dz * s, gh = ghAt(x, z, nd.y), lv = lavaAt(x, z, nd.y);
          if (edge === null) { if (lv || gh < nd.y - 0.3) edge = s; else continue; }   // (the take-off top ends: lava or a drop)
          if (lv) { if (lava0 === null) lava0 = s; continue; }
          if (lava0 === null) { if (s - edge > 3.0) break; continue; }                    // (a lower dry strip first: ≤ 3 m of it)
          if (gh > Lv.y + K - 0.01) { far = s; gy = gh; break; }                          // (any standable floor across, down to the lava)
        }
        if (edge === null || lava0 === null || far === null) continue;
        const gap = far - lava0;   // (the lava's own width along the line; a seam ≤ 0.35 m is no gap)
        if (gap <= 0.35 || far - edge > 11.0 || gy - nd.y > 1.3) continue;
        const strip = lava0 - edge > 0.15, deep = nd.y - gy > 1.3;
        cands.push({ id: nd.id, x: nd.x, y: nd.y, z: nd.z, dx, dz, edge, lava0, far, gy, gap, strip, deep });
        if (gap < 4.4) gaps.push([r2(nd.x), r2(nd.y), r2(nd.z), Math.round((a * 180) / Math.PI), r2(gap), r2(gy)]);
      }
    }
    // physically (the kid stepped on its own, actor.update): from `runup` m behind the edge, running (and swimming in its
    // own ink) straight at it and jumping at the edge — where does it come down? A crossing is a flight over the lava
    // (airborne over a lava cell) that comes down alive past the lava's start on floor the lava does not cover (fix round
    // 6: any such floor — the far floor of the march or another one it met; a flight landing > 1 m off its line is flagged
    // 'off'; its gain is always measured from where it landed). `carry`: the Bazookarp carrier's movement (actor.carry set:
    // every speed × 0.8, no sub)
    const RUNUPS = [2.6, 1.5, 0.8];
    // (fix round 7) `steer`: the stick turned by that angle 8 frames after the jump (air steering); `lavaRun`: the longest
    // stretch of the flight where the kid's whole footprint (centre and 0.24 m round it) is over lava (a seam its feet span
    // is no gap); `crossed2` (rider-top take-offs, c.own): such a stretch over 0.35 m, down alive past it on floor the lava
    // does not cover, not on its own rider
    const FOOT = PLAYER.footRadius;
    const footLava = (x, z, y) => lavaAt(x, z, y) && lavaAt(x + FOOT, z, y) && lavaAt(x - FOOT, z, y) && lavaAt(x, z + FOOT, y) && lavaAt(x, z - FOOT, y);
    const tryJump = (c, swim, pressF = null, runup = 2.6, carry = false, steer = 0, sfr = 8) => {
      const sx = c.x + c.dx * (c.edge - runup), sz = c.z + c.dz * (c.edge - runup), sy = lvl.groundHeight(sx, sz, c.y + 0.6);
      if (!(sy > c.y - 0.35)) return null;   // (the run-up does not fit on the take-off's top)
      if (swim) { P.clear(); for (let s = -0.2; s <= runup - 0.2; s += 0.5) P.splat(V(sx + c.dx * s, sy + 0.05, sz + c.dz * s), 0.9, kid.team, { instant: true, seed: s }); }
      kid.carry = null;
      kid.spawnAt(V(sx, sy + 0.05, sz), 0); kid.invuln = 99; kid.vel.set(0, 0, 0); kid.form = 'kid';
      if (pressF != null && kid.subId !== 'dash') kid.setSub?.('dash');
      kid.ink = 100;
      if (carry) kid.carry = { since: 0, sp: null, kick: null };
      it.move.set(0, 0, 0); it.jump = it.squid = it.fire = it.sub = it.special = false;
      for (let i = 0; i < 3; i++) kid.update(dt);
      let jumped = false, jf = -1, over = false, run = 0, maxRun = 0, cRun = 0, cMax = 0, px = 0, pz = 0;
      const sdx = c.dx * Math.cos(steer) - c.dz * Math.sin(steer), sdz = c.dx * Math.sin(steer) + c.dz * Math.cos(steer);
      for (let f = 0; f < 200; f++) {
        if (steer && jf >= 0 && f - jf >= sfr) it.move.set(sdx, 0, sdz); else it.move.set(c.dx, 0, c.dz);
        it.squid = swim && (pressF == null || jf < 0 || f - jf < pressF);
        const along = (kid.pos.x - c.x) * c.dx + (kid.pos.z - c.z) * c.dz;
        it.jump = !jumped && along >= c.edge - 0.35;
        if (it.jump) { jumped = true; jf = f; }
        it.sub = pressF != null && jf >= 0 && f - jf === pressF;
        kid.update(dt);
        if (!kid.alive) { kid.carry = null; return { died: true, along: r2((kid.pos.x - c.x) * c.dx + (kid.pos.z - c.z) * c.dz) }; }
        if (jumped && !kid.grounded && !over && lavaAt(kid.pos.x, kid.pos.z, kid.pos.y)) over = true;
        if (jumped && !kid.grounded && footLava(kid.pos.x, kid.pos.z, kid.pos.y)) { run += Math.hypot(kid.pos.x - px, kid.pos.z - pz); maxRun = Math.max(maxRun, run); } else run = 0;
        if (jumped && !kid.grounded && lavaAt(kid.pos.x, kid.pos.z, kid.pos.y)) { cRun += Math.hypot(kid.pos.x - px, kid.pos.z - pz); cMax = Math.max(cMax, cRun); } else cRun = 0;
        px = kid.pos.x; pz = kid.pos.z;
        if (jumped && f - jf > 4 && kid.grounded) break;
      }
      kid.carry = null;
      const along = (kid.pos.x - c.x) * c.dx + (kid.pos.z - c.z) * c.dz;
      const gb = kid.ground && lvl.blocks[kid.ground.block];
      const gl = lvl.groundHeight(kid.pos.x, kid.pos.z, kid.pos.y + 0.3);
      const side = Math.abs((kid.pos.x - c.x) * c.dz - (kid.pos.z - c.z) * c.dx);   // (off the line it was aimed along)
      const dry = kid.alive && kid.grounded && gl > Lv.y + K - 0.01 && !Lv.covers(kid.pos.x, kid.pos.z, kid.pos.y);
      return { crossed: dry && over && along > c.lava0 + 0.3, crossed2: !!c.own && dry && maxRun > 0.35 && !(gb && c.own.has(gb.id)), seam: !!c.own && dry && maxRun <= 0.35 && cMax > 0.35 && !(gb && c.own.has(gb.id)), lavaRun: r2(maxRun), centreRun: r2(cMax),
        off: side > 1.0, side: r2(side), along: r2(along), y: r2(kid.pos.y), alive: kid.alive, at: [r2(kid.pos.x), r2(kid.pos.z)], at3: [kid.pos.x, kid.pos.y, kid.pos.z], on: gb ? (gb.tag || (gb.dynamic ? 'rider' : '#' + gb.id)) : null };
    };
    // the nav detour each of them saves ("gain": the nav walk from the take-off node to the node where it came down,
    // minus the flight; 999 = no way round on foot now; null = no nav node within reach of where it landed — counted)
    const detour = (c, r) => { const q = V(r.at3[0], r.at3[1], r.at3[2]); let m = nav.nearest(q, 0.6, true); if (m < 0) m = nav.nearest(q, 1.4, true); if (m < 0) return null; const p = nav.path(c.id, m, 0); if (!p) return 999; let L = 0; for (let i = 1; i < p.length; i++) { const a = nav.nodes[p[i - 1]], b = nav.nodes[p[i]]; L += Math.hypot(b.x - a.x, b.z - a.z); } return Math.min(999, L - Math.hypot(q.x - c.x, q.z - c.z)); };
    const runX = [], skillX = [];
    // (the dash jumps physically: the real Dash Pellet, an air dash pressed on the rise, at the apex and on the fall — 8 /
    // 18 / 30 frames after the jump — from a running jump and from a swim jump out of own ink; the farthest first)
    const dashTries = [[true, 30], [true, 18], [false, 30], [false, 18], [true, 8], [false, 8]];
    for (const c of steerOnly ? [] : cands) {
      const row = { from: [r2(c.x), r2(c.y), r2(c.z)], dir: Math.round((Math.atan2(c.dz, c.dx) * 180) / Math.PI), gap: r2(c.gap), drop: r2(c.y - c.gy), strip: c.strip || undefined, edgeAt: [r2(c.x + c.dx * c.edge), r2(c.z + c.dz * c.edge)], farAt: [r2(c.x + c.dx * c.far), r2(c.z + c.dz * c.far)] };
      let done = false, fit = null;
      for (const ru of RUNUPS) {
        const run = tryJump(c, false, null, ru);
        if (!run) continue;
        if (fit === null) fit = ru;
        if (run.crossed) { runX.push({ ...row, how: 'run', runup: ru, off: run.off, side: run.side, landed: run.at, landedY: run.y, on: run.on, gain: r2(detour(c, run)) }); done = true; break; }
      }
      if (done || fit === null) continue;
      const sw = tryJump(c, true, null, fit);
      if (sw && sw.crossed) { skillX.push({ ...row, how: 'swim', runup: fit, off: sw.off, side: sw.side, landed: sw.at, landedY: sw.y, on: sw.on, gain: r2(detour(c, sw)), c }); continue; }
      for (const [s2, f] of dashTries) { const r = tryJump(c, s2, f, fit); if (r && r.crossed) { skillX.push({ ...row, how: (s2 ? 'swim+dash@' : 'run+dash@') + f, runup: fit, off: r.off, side: r.side, landed: r.at, landedY: r.y, on: r.on, gain: r2(detour(c, r)) }); break; } }
    }
    // (fix round 7, review 7 issue 2 — the march flew every jump straight, and a kid steers in the air: off Organ L's HIGH top
    // a jump out through the crown's open north-east half, steered 45° right 8 frames up, came down on the causeway saving
    // 16.5 m.) From every rider-top node (the Organs, the stones) whose top ends within 3 m along a heading, whatever lies
    // past it: the first run-up of 2.6 / 1.5 / 0.8 m that fits, the stick turned 0 / ±45 / ±90° 8 frames after the jump; a
    // crossing is `crossed2` (over 0.35 m with the whole footprint over lava, down alive past it, not on its own rider); per
    // node and heading the steer that saves the most counts. In the gate with the straight running jumps
    const STEERS = [0, Math.PI / 4, -Math.PI / 4, Math.PI / 2, -Math.PI / 2];
    const steerX = [], seamX = []; let steerTried = 0, steerCands = 0;
    // one take-off, one run-up: every steer (and steer frame) → the crossing that saves the most, and the most-saving "seam
    // flight" (over lava only where the feet would span it: the notch's 0.15–0.2 m seams round the Organs — listed, no gate);
    // null when the run-up does not fit
    const steerTry = (c, ru, gainOf, row, sfs = SF, steers = STEERS) => {
      let best = null, seam = null, fits = false;
      for (const st of steers) for (const sf of st ? sfs : [8]) {
        const q = tryJump(c, false, null, ru, false, st, sf);
        if (!q) return null;
        fits = true; steerTried++;
        if (!q.crossed2 && !q.seam) continue;
        const gain = gainOf(q), x = { ...row, how: 'run+steer' + Math.round((st * 180) / Math.PI) + (sfs.length > 1 && st ? '@' + sf : ''), gap: q.lavaRun, lavaRun: q.lavaRun, centreRun: q.centreRun, drop: r2(c.y - q.y), landed: q.at, landedY: q.y, on: q.on, gain: gain === null ? null : r2(gain) };
        if (q.crossed2) { if (!best || (gain ?? 999) > (best.gain ?? -1)) best = x; }
        else if (!seam || (gain ?? 999) > (seam.gain ?? -1)) seam = x;
      }
      return fits ? { best, seam } : null;
    };
    for (const nd of nav.nodes) {
      if (!nav.valid[nd.id] || M.kind[nd.id] !== 2 || M.pose[nd.id] !== (level === 'high' ? 1 : 0)) continue;
      const gh0 = lvl.groundHeight(nd.x, nd.z, nd.y + 0.3); if (!(Math.abs(gh0 - nd.y) < 0.3)) continue;
      const RR = Lv.riders.find((q) => q.r === W.riders[M.rider[nd.id]]), own = new Set((RR?.blocks || []).map((b) => b && b.id));
      for (let k = 0; k < 16; k++) {
        const a = (k * Math.PI) / 8, dx = Math.cos(a), dz = Math.sin(a);
        let edge = null;
        for (let s2 = 0.1; s2 <= 3.0; s2 += 0.1) { const x = nd.x + dx * s2, z = nd.z + dz * s2; if (lavaAt(x, z, nd.y) || ghAt(x, z, nd.y) < nd.y - 0.3) { edge = s2; break; } }
        if (edge === null) continue;
        const c = { id: nd.id, x: nd.x, y: nd.y, z: nd.z, dx, dz, edge, lava0: edge, own, rider: RR?.r?.id };
        steerCands++;
        for (const ru of RUNUPS) {
          const t = steerTry(c, ru, (q) => detour(c, q), { from: [r2(c.x), r2(c.y), r2(c.z)], rider: c.rider, dir: Math.round((a * 180) / Math.PI), runup: ru }, SFX);
          if (!t) continue;
          if (t.best) steerX.push(t.best);
          if (t.seam) seamX.push(t.seam);
          break;
        }
      }
    }
    // (and the Organ tops finer, as the reviewer's probe-crown7c: the lookout is the launch pad. Every point of a 0.3 m grid
    // 0.25–1.15 m in from the rim, not in a part, every 7.5° that leaves the top within 1.2 m; run-ups 0.8 / 1.5 / 2.6 m —
    // the first at which any steer crosses — the five steers, the most saved; the gain from the top's nav node nearest the
    // point (on the top). Organ L's HIGH top at fix round 6's geometry: 16.9 m, as review 7's 16.5 / 16.9)
    const fine = { points: 0, grid: FG, deg: FD, steerFrames: SF };
    {
      const hp2 = V(0, 0, 0), qb2 = [], NG = Math.round(2.7 / FG);
      for (const RR of Lv.riders) {
        const r = RR.r; if (r.kind !== 'float') continue;
        const top = RR.top, own = new Set(RR.blocks.map((b) => b && b.id));
        const inPart = (x0, z0) => { for (let k = 0; k < 9; k++) { const a2 = (k * Math.PI) / 4, rr = k === 8 ? 0 : 0.42, x = x0 + Math.cos(a2) * rr, z = z0 + Math.sin(a2) * rr;
          for (const y of [top + 0.3, top + 0.9]) { hp2.set(x, y, z); for (const id of lvl.queryBlocks(x - 0.01, z - 0.01, x + 0.01, z + 0.01, qb2)) { const b = lvl.blocks[id]; if (b.solid && b.dynamic && own.has(b.id) && b.center.y > top && lvl.pointInBlock(b, hp2, 0.001)) return true; } } } return false; };
        for (let ix = -NG; ix <= NG; ix++) for (let iz = -NG; iz <= NG; iz++) {
          const wx = r.x + ix * FG, wz = r.z + iz * FG;
          if (!C.inRider(r, wx, wz, -0.25) || C.inRider(r, wx, wz, -1.15)) continue;
          if (Math.abs(lvl.groundHeight(wx, wz, top + 0.3) - top) > 0.05 || inPart(wx, wz)) continue;
          const m0 = nav.nearest(V(wx, top, wz), 0.6, true); if (m0 < 0 || Math.abs(nav.nodes[m0].y - top) > 0.3) continue;
          const n0 = nav.nodes[m0]; fine.points++;
          for (let k = 0; k < Math.round(360 / FD); k++) {
            const a = (k * FD * Math.PI) / 180, dx = Math.cos(a), dz = Math.sin(a);
            let ex = null; for (let s2 = 0.05; s2 <= 1.3; s2 += 0.05) if (!C.inRider(r, wx + dx * s2, wz + dz * s2)) { ex = s2; break; }
            if (ex === null) continue;
            const c = { id: m0, x: wx, y: top, z: wz, dx, dz, edge: 0.35, lava0: 0.35, own, rider: r.id };
            let seam = null;
            for (const ru of [0.8, 1.5, 2.6]) {
              const sx = wx - dx * ru, sz = wz - dz * ru;
              if (!C.inRider(r, sx, sz, -0.2) || Math.abs(lvl.groundHeight(sx, sz, top + 0.3) - top) > 0.05 || inPart(sx, sz)) continue;
              const t = steerTry(c, ru + 0.35, (q) => detour({ id: m0, x: n0.x, z: n0.z }, q), { from: [r2(wx), r2(top), r2(wz)], rider: r.id, fine: true, dir: Math.round((a * 180) / Math.PI), runup: ru });
              if (!t) continue;
              if (t.seam && (!seam || (t.seam.gain ?? 999) > (seam.gain ?? -1))) seam = t.seam;
              if (t.best) { steerX.push(t.best); break; }
            }
            if (seam) seamX.push(seam);
          }
        }
      }
    }
    // (fix round 8, review 8 issue 5 — the steered march looked only off rider tops: probe-steer8 found 14.46 m off the
    // island's coping onto race 7~ steered at 4 frames, a fine search 14.96 m at 30°.) From EVERY take-off as well: each
    // valid static nav node standing dry within 3.5 m of lava, 16 headings (22.5°); the take-off where its floor ends along
    // the heading within 3 m (a drop or the lava), else the node itself (a run along a walkway, then a jump off its side:
    // no straight jump then); the first run-up of 2.6 / 1.5 / 0.8 m that fits; the stick turned 0 / ±45 / ±90° at 4, 8 and
    // 12 frames (sfx=). Then, round the 4 that save the most at this level, a finer look (start ±0.3 m, heading ±9° in 3°,
    // the stick ±15 … ±90° in 15° at 4 / 8 / 12 frames, the seed's run-up). In the gate with the rest
    let anyCands = 0, anyTried = 0, fineTried = 0;
    const anyX = [];
    if (!steerOnly || /(^|[;&])r44=any/.test(PA)) {
      const t0any = steerTried;
      for (const nd of nav.nodes) {
        if (!nav.valid[nd.id] || M.kind[nd.id] === 2 || Lv.covers(nd.x, nd.z, nd.y)) continue;
        const gh0 = lvl.groundHeight(nd.x, nd.z, nd.y + 0.3); if (!(Math.abs(gh0 - nd.y) < 0.3)) continue;
        let near = false;
        for (let k = 0; k < 16 && !near; k++) { const a = (k * Math.PI) / 8; for (let s2 = 0.3; s2 <= 3.5 && !near; s2 += 0.3) if (lavaAt(nd.x + Math.cos(a) * s2, nd.z + Math.sin(a) * s2, nd.y)) near = true; }
        if (!near) continue;
        for (let k = 0; k < 16; k++) {
          const a = (k * Math.PI) / 8, dx = Math.cos(a), dz = Math.sin(a);
          let edge = null;
          for (let s2 = 0.1; s2 <= 3.0; s2 += 0.1) { const x = nd.x + dx * s2, z = nd.z + dz * s2; if (lavaAt(x, z, nd.y) || ghAt(x, z, nd.y) < nd.y - 0.3) { edge = s2; break; } }
          const c = { id: nd.id, x: nd.x, y: nd.y, z: nd.z, dx, dz, edge: edge ?? 0.35, lava0: edge ?? 0.35, own: new Set() };
          anyCands++;
          for (const ru of RUNUPS) {
            const t = steerTry(c, ru, (q) => detour(c, q), { from: [r2(c.x), r2(c.y), r2(c.z)], any: true, edge: edge === null ? 'none' : r2(edge), dir: Math.round((a * 180) / Math.PI), runup: ru }, SFX, edge === null ? STEERS.slice(1) : STEERS);
            if (!t) continue;
            if (t.best) anyX.push(t.best);
            if (t.seam) seamX.push(t.seam);
            break;
          }
        }
      }
      anyTried = steerTried - t0any;
      // the finer look round the 4 most-saving (any take-off or rider top)
      const FST = [0]; for (let d = 15; d <= 90; d += 15) FST.push((d * Math.PI) / 180, (-d * Math.PI) / 180);
      const seeds = [...anyX, ...steerX].filter((x) => x.gain !== null).sort((p, q) => q.gain - p.gain).slice(0, 4);
      const t0f = steerTried;
      for (const sd of seeds) {
        const n0 = nav.nearest(V(sd.from[0], sd.from[1], sd.from[2]), 0.6, true); if (n0 < 0) continue;
        const RRr = M.kind[n0] === 2 ? Lv.riders.find((q) => q.r === W.riders[M.rider[n0]]) : null, own = new Set((RRr?.blocks || []).map((b) => b && b.id));
        for (const ox of [-0.3, 0, 0.3]) for (const oz of [-0.3, 0, 0.3]) for (let dh = -9; dh <= 9; dh += 3) {
          const x0 = sd.from[0] + ox, z0 = sd.from[2] + oz, y0 = lvl.groundHeight(x0, z0, sd.from[1] + 0.3);
          if (!(Math.abs(y0 - sd.from[1]) < 0.15)) continue;
          const a = ((sd.dir + dh) * Math.PI) / 180, dx = Math.cos(a), dz = Math.sin(a);
          let edge = null;
          for (let s2 = 0.1; s2 <= 3.0; s2 += 0.1) { const x = x0 + dx * s2, z = z0 + dz * s2; if (lavaAt(x, z, y0) || ghAt(x, z, y0) < y0 - 0.3) { edge = s2; break; } }
          const c = { id: n0, x: x0, y: y0, z: z0, dx, dz, edge: edge ?? 0.35, lava0: edge ?? 0.35, own, rider: RRr?.r?.id };
          const t = steerTry(c, sd.runup, (q) => detour(c, q), { from: [r2(x0), r2(y0), r2(z0)], fine8: true, rider: RRr?.r?.id, edge: edge === null ? 'none' : r2(edge), dir: sd.dir + dh, runup: sd.runup }, SFX, edge === null ? FST.slice(1) : FST);
          if (t && t.best) anyX.push(t.best);
        }
      }
      fineTried = steerTried - t0f;
    }
    // (fix round 7, the lead after review 7: the Sponge Mitts' leap over the lava is skill movement like a swim jump — not
    // off a roof top (actor.js / mitts.js: no charge there), and a bot's leap obeys its 2 s look-ahead. Listed, no gate.) From
    // every edge candidate of the march, a leap from its edge along its heading at half and full charge, aim level, by the
    // kit's own predictLeap (MITTS: the arc it draws as the preview ring): a crossing comes down on the ground, dry, past
    // over 0.35 m with the whole footprint over lava; the gain as the march's
    const leapX = [];
    if (!steerOnly) {
      const { MITTS } = await import('./src/game/kits/mitts.js');
      // (leapVelocity reads only a bot's yaw / pitch / charge and the cling: a plain object — MITTS.K would register a
      // runner the kit's tick then walks)
      const kk = { botWant: -1, botYaw: 0, botPitch: 0, cling: false }, land = { kind: 'none', pos: V(0, 0, 0), normal: V(0, 1, 0), hitPt: V(0, 0, 0), block: -1, t: 0, n: 0 }, lv0 = V(0, 0, 0), st0 = V(0, 0, 0);
      for (const c of cands) {
        const yaw = Math.atan2(c.dx, c.dz), sx = c.x + c.dx * (c.edge - 0.35), sz = c.z + c.dz * (c.edge - 0.35), sy = lvl.groundHeight(sx, sz, c.y + 0.6);
        if (!(sy > c.y - 0.35)) continue;
        let best = null;
        for (const ch of [0.5, 1]) {
          kk.botWant = ch; kk.botYaw = yaw; kk.botPitch = 0; MITTS.leapVelocity(kid, kk, ch, lv0); kk.botWant = -1;
          MITTS.predictLeap(st0.set(sx, sy, sz), lv0, land, null);
          if (land.kind !== 'ground') continue;
          const L = land.pos, gl = lvl.groundHeight(L.x, L.z, L.y + 0.3);
          if (!(gl > Lv.y + K - 0.01) || Lv.covers(L.x, L.z, L.y)) continue;
          const dx = L.x - sx, dz = L.z - sz, d = Math.hypot(dx, dz) || 1;
          let run = 0, mx = 0; for (let q = 0.1; q < d; q += 0.1) { if (footLava(sx + (dx / d) * q, sz + (dz / d) * q, sy + 0.3)) { run += 0.1; mx = Math.max(mx, run); } else run = 0; }
          if (mx <= 0.35) continue;
          const gain = detour(c, { at3: [L.x, L.y, L.z] });
          if (!best || (gain ?? 999) > (best.gain ?? -1)) best = { from: [r2(c.x), r2(c.y), r2(c.z)], dir: Math.round((Math.atan2(c.dz, c.dx) * 180) / Math.PI), how: 'leap@' + ch, gap: r2(mx), drop: r2(sy - L.y), landed: [r2(L.x), r2(L.z)], landedY: r2(L.y), on: land.block >= 0 ? (lvl.blocks[land.block]?.tag || '#' + land.block) : null, gain: gain === null ? null : r2(gain) };
        }
        if (best) leapX.push(best);
      }
    }
    // (fix round 6, review 6 issue 3: the Bazookarp carrier swims its own ink (SPEC S21, 9.44 m/s), so its swim jumps are
    // skill movement like everyone's. Every swim crossing saving > 10 m is tried again with the carrier's movement
    // (actor.carry set): the list the Bazookarp layout builder places the Pond, the weirs and the Gate against — karp-stages/)
    const carryX = [];
    for (const x of skillX) {
      if (x.how !== 'swim' || !(x.gain > 10)) continue;
      const q = tryJump(x.c, true, null, x.runup, true);
      if (q && q.crossed) carryX.push({ from: x.from, dir: x.dir, gap: x.gap, runup: x.runup, landed: q.at, landedY: q.y, on: q.on, kidGain: x.gain, gain: r2(detour(x.c, q)) });
    }
    for (const x of skillX) delete x.c;
    if (sub0 && kid.subId !== sub0) kid.setSub?.(sub0);
    P.clear();
    jumps[level] = { edgesChecked: cands.length, deep: cands.filter((c) => c.deep).length, strip: cands.filter((c) => c.strip).length, gaps, runCross: runX, skill: skillX, carry: carryX, steer: [...steerX, ...anyX], steerRider: steerX.length, steerAny: anyX.length, anyCands, anyTried, fineTried, seam: seamX, leap: leapX, steerCands, steerTried, fine };
  }
  // the places: crossings folded onto Alpha's half (the 180° turn) and grouped by the 3 m cell of their start
  const places = (L) => {
    const m = new Map();
    for (const x of L) {
      const [fx, fz] = x.from[2] < 0 || (x.from[2] === 0 && x.from[0] < 0) ? [x.from[0], x.from[2]] : [-x.from[0], -x.from[2]];
      const k = Math.round(fx / 3) * 3 + ',' + Math.round(fz / 3) * 3;
      const e = m.get(k) || { at: [Math.round(fx / 3) * 3, Math.round(fz / 3) * 3], n: 0, ys: new Set(), how: new Set(), gap: [99, 0], gain: [999, -999], on: new Set(), eg: x };
      e.n++; e.ys.add(x.from[1]); e.how.add((x.how || 'run').split('@')[0]); e.on.add(x.on); e.gap = [Math.min(e.gap[0], x.gap), Math.max(e.gap[1], x.gap)]; e.gain = [Math.min(e.gain[0], x.gain), Math.max(e.gain[1], x.gain)];
      if (x.gain > e.eg.gain) e.eg = x;
      m.set(k, e);
    }
    return [...m.values()].sort((a, b) => b.gain[1] - a.gain[1]).map((e) => ({ at: e.at, n: e.n, y: [...e.ys], how: [...e.how], gap: e.gap, gain: e.gain, on: [...e.on], eg: { from: e.eg.from, dir: e.eg.dir, runup: e.eg.runup, landed: e.eg.landed, how: e.eg.how } }));
  };
  R('rule 44 (information): the kid\'s jump reach on flat ground — metres from take-off to touch-down, the feet\'s peak over the take-off', true, reach);
  const sum = (L) => ({ n: L.length, off: L.filter((x) => x.off).length, short: L.filter((x) => x.gap < 4.4).length, deep: L.filter((x) => x.drop > 1.3).length, strip: L.filter((x) => x.strip).length, unmeasured: L.filter((x) => x.gain === null).length, over5: L.filter((x) => !(x.gain <= 5)).length, over10: L.filter((x) => !(x.gain <= 10)).length, over15: L.filter((x) => !(x.gain <= 15)).length, over20: L.filter((x) => !(x.gain <= 20)).length, over40: L.filter((x) => !(x.gain <= 40)).length, maxGain: L.reduce((m, x) => Math.max(m, x.gain ?? 0), 0) });
  const top = (L, k) => [...L].sort((a, b) => (b.gain ?? -1) - (a.gain ?? -1)).slice(0, k).map((x) => ({ from: x.from, dir: x.dir, gap: x.gap, drop: x.drop, strip: x.strip, how: x.how, runup: x.runup, off: x.off || undefined, landed: x.landed, landedY: x.landedY, on: x.on, gain: x.gain }));
  // (fix round 5, the lead's decision after review 5 — DESIGN §3.5 option 1: plain running jumps are judged by the 20 m
  // skill-route bar, the largest under 15 m. Fix round 6, the lead after review 6: the gate stands on the corrected march
  // (any floor below, dry strips, 2.6 / 1.5 / 0.8 m run-ups); the 15 m margin is part of the gate; a crossing whose gain
  // could not be measured fails it)
  const allRun = [...jumps.low.runCross, ...jumps.high.runCross, ...jumps.low.steer, ...jumps.high.steer];   // (fix round 7: and the steered jumps off rider tops)
  const runMax = allRun.reduce((m, x) => Math.max(m, x.gain ?? 0), 0);
  const steerMax = [...jumps.low.steer, ...jumps.high.steer].reduce((m, x) => Math.max(m, x.gain ?? 0), 0);   // (fix round 8: rider tops, every take-off, the finer look)
  R('rule 44: a plain running jump across the lava at LOW or HIGH saves at most 20 m against the dry way round, the largest under 15 m (the lead\'s option 1 and margin; the march takes any standable floor across the lava down to the lava, take-offs that drop onto a dry strip first, and run-ups of 2.6 / 1.5 / 0.8 m; every sample past a 0.35 m seam tried; a flight landing > 1 m off its line counted, flagged off; gains from where it landed; fix round 8: steered in the air at 4 / 8 / 12 frames off every take-off and rider top, the 4 most-saving searched finer, every steered one under 14 m)',
    allRun.every((x) => x.gain !== null && x.gain <= 20) && runMax < 15 && steerMax < 14,
    { largestM: r2(runMax), margin: 'under 15 m; every steered one under 14 m (fix round 8, the lead after review 8)', marginMet: runMax < 15, steerMax: r2(steerMax), steerMarginMet: steerMax < 14,
      steerTop: [...jumps.low.steer, ...jumps.high.steer].filter((x) => x.gain !== null).sort((p, q) => q.gain - p.gain).slice(0, 6).map((x) => ({ from: x.from, dir: x.dir, runup: x.runup, how: x.how, any: x.any || x.fine8 || undefined, lavaRun: x.lavaRun, landed: x.landed, on: x.on, gain: x.gain })),
      steerFlights: { low: [jumps.low.anyCands, jumps.low.anyTried, jumps.low.fineTried], high: [jumps.high.anyCands, jumps.high.anyTried, jumps.high.fineTried] }, steeredMax: { low: r2(jumps.low.steer.reduce((m, x) => Math.max(m, x.gain ?? 0), 0)), high: r2(jumps.high.steer.reduce((m, x) => Math.max(m, x.gain ?? 0), 0)) }, low: { ...sum(jumps.low.runCross), edges: jumps.low.edgesChecked, deepEdges: jumps.low.deep, stripEdges: jumps.low.strip, places: places(jumps.low.runCross).length }, high: { ...sum(jumps.high.runCross), edges: jumps.high.edgesChecked, deepEdges: jumps.high.deep, stripEdges: jumps.high.strip, places: places(jumps.high.runCross).length } });
  for (const lv of ['low', 'high']) { const pl = places(jumps[lv].runCross); for (let q = 0; q * 12 < pl.length; q++) R(`rule 44 running-jump places: ${lv} ${q}`, true, pl.slice(q * 12, (q + 1) * 12)); R(`rule 44 running jumps, the largest gains: ${lv}`, true, top(jumps[lv].runCross, 15)); }
  // (fix round 7: the steered running jumps off rider tops, in the gate above)
  R('rule 44 (information): running jumps off rider tops steered in the air (0 / ±45 / ±90° after 8 frames; a crossing has over 0.35 m with the whole footprint over lava) — in the gate above', true,
    { low: { ...sum(jumps.low.steer), headings: jumps.low.steerCands, flights: jumps.low.steerTried, fine: jumps.low.fine, byRider: [...new Set(jumps.low.steer.map((x) => x.rider))].map((id) => [id, jumps.low.steer.filter((x) => x.rider === id).reduce((m, x) => Math.max(m, x.gain ?? 0), 0)]) },
      high: { ...sum(jumps.high.steer), headings: jumps.high.steerCands, flights: jumps.high.steerTried, fine: jumps.high.fine, byRider: [...new Set(jumps.high.steer.map((x) => x.rider))].map((id) => [id, jumps.high.steer.filter((x) => x.rider === id).reduce((m, x) => Math.max(m, x.gain ?? 0), 0)]) },
      topLow: top(jumps.low.steer, 12), topHigh: top(jumps.high.steer, 15) });
  // (the flights off rider tops that pass over lava only where a kid's feet would span it — the 0.15–0.2 m seams of the
  // notch round the Organs, crossed at a slant — and come down on the island: drops off the column past the notch, not
  // crossings of the lava. Their "gain" is the climb down the Organs the nav takes (it has no 3.45 m drop link); review 7
  // discounted them by hand ("only 0.4–0.8 m of lava"). Listed, no gate)
  R('rule 44 (information): seam flights off rider tops — over lava only where the feet span it (the centre over lava > 0.35 m, the footprint ≤ 0.35 m): drops past the notch, no gate', true,
    { low: { n: jumps.low.seam.length, maxGain: r2(jumps.low.seam.reduce((m, x) => Math.max(m, x.gain ?? 0), 0)), maxCentreRun: r2(jumps.low.seam.reduce((m, x) => Math.max(m, x.centreRun ?? 0), 0)) },
      high: { n: jumps.high.seam.length, maxGain: r2(jumps.high.seam.reduce((m, x) => Math.max(m, x.gain ?? 0), 0)), maxCentreRun: r2(jumps.high.seam.reduce((m, x) => Math.max(m, x.centreRun ?? 0), 0)), on: [...new Set(jumps.high.seam.map((x) => x.on))] },
      topHigh: [...jumps.high.seam].sort((a, b) => (b.gain ?? -1) - (a.gain ?? -1)).slice(0, 6) });
  const over = (L) => L.filter((x) => !(x.gain <= 20));
  // (fix round 5, option 1: swim and dash jumps over the lava are accepted skill movement — listed, no gate. Fix round 6,
  // the lead after review 6: the Bazookarp carrier swims its own ink and makes swim jumps too — accepted as skill movement
  // in general; what a carrier may bypass is judged per stage by the Bazookarp checker's shortcut probes (#7d) when
  // Highmark's Bazookarp layout is built. Its dash jumps are out: it carries no sub)
  R('rule 44 (information): the skill routes — swim jumps out of own ink and jumps + the Dash Pellet\'s air dash across the lava (and the Mitts leap, below: the lead after review 7), accepted as skill movement (the lead\'s option 1); a Bazookarp carrier makes the swim jumps too (its own ink, SPEC S21) but no dash jumps (no sub): judged per stage by the Bazookarp checker #7d when Highmark\'s layout is built (the carrier list: below); how many save over 20 / 40 m against the dry way round (DESIGN §3.5)',
    true, { low: sum(jumps.low.skill), high: sum(jumps.high.skill) });
  for (const lv of ['low', 'high']) { const pl = places(over(jumps[lv].skill)); for (let q = 0; q * 12 < pl.length; q++) R(`rule 44 places saving > 20 m: ${lv} ${q}`, true, pl.slice(q * 12, (q + 1) * 12)); }
  // (fix round 7, the lead after review 7: a Mitts leap over the lava is skill movement like a swim jump — never off a roof
  // top (no charge there: actor.js / mitts.js, lava-leap.js A), and a bot's leap flies as it was planned with the 2 s
  // look-ahead (bots.js: no air guard in a kit leap, lava-leap.js B))
  R('rule 44 (information): Sponge Mitts leaps over the lava — skill movement like the swim jumps (the lead after review 7); never off a roof top; from every edge of the march at half and full charge, aim level, by the kit\'s predictLeap; how many save over 20 / 40 m (no gate)',
    true, { low: sum(jumps.low.leap), high: sum(jumps.high.leap), topLow: top(jumps.low.leap, 8), topHigh: top(jumps.high.leap, 8) });
  R('rule 44 (information): the Bazookarp carrier\'s swim jumps — every swim crossing saving > 10 m tried again with the carrier\'s movement (actor.carry: speeds × 0.8, no sub); the list for the Bazookarp layout builder (karp-stages/, PAGE_ARGS full=1)',
    true, { low: sum(jumps.low.carry), high: sum(jumps.high.carry), topLow: top(jumps.low.carry, 8), topHigh: top(jumps.high.carry, 8) });
  // (the gap march's 0.35–4.4 m samples: in the gate above since fix round 4; here how many there are and what crossed them)
  R('rule 44 (information): the gap march\'s 0.35–4.4 m samples between standable floors over lava — each one tried (in the gates above)', true, { low: { n: jumps.low.gaps.length, run: jumps.low.runCross.filter((x) => x.gap < 4.4).length, skill: jumps.low.skill.filter((x) => x.gap < 4.4).length, eg: jumps.low.gaps.slice(0, 6) }, high: { n: jumps.high.gaps.length, run: jumps.high.runCross.filter((x) => x.gap < 4.4).length, skill: jumps.high.skill.filter((x) => x.gap < 4.4).length, eg: jumps.high.gaps.slice(0, 6) } });
  // (the whole lists, for DESIGN §3.5 and the Bazookarp layout: PAGE_ARGS full=1)
  if (/(^|[;&])full=1/.test(String(window.__pageArgs || ''))) R('rule 44 (information): every crossing (LOW, HIGH)', true, { low: { run: jumps.low.runCross, steer: jumps.low.steer, skill: jumps.low.skill, leap: jumps.low.leap, carry: jumps.low.carry }, high: { run: jumps.high.runCross, steer: jumps.high.steer, skill: jumps.high.skill, leap: jumps.high.leap, carry: jumps.high.carry } });   // (PAGE_ARGS full=1)

  } catch (e) { R('rule 44: the check itself threw', false, { error: String(e && e.stack || e).slice(0, 400) }); }

  // ---------------------------------------------------------------------------------------------- rule 47: roof slides
  // (fix round 7, review 7 issue 1 — the reviewer's probe-roofslide7b as a rule: cover on Highmark is a `roof` block, and so
  // is every lava rider part, and the roof slide took the nearest way off whatever lay past it: race 3's boulder dropped 42
  // of 50 landings into the lava at HIGH, Organ L's stub 30 of 64. actor._roofExit / _roofExitDist now refuse a way off whose
  // landing the lava takes (_roofLandWet); on a stage with a hazard the slide owns the move along the way it checked.)
  // Fix round 8 (review 8: the hold made perches in the HIGH lava and flung held kids at 7–9 m/s; the landing march ignored
  // air braking; the rule looked in too few places). The lead's rule: a kid on an off-limits top whose every way off is lava
  // is held 0.6 s where it stands and RESCUED (lava.js rescue: the nearest dry node within 6 m, a brief invulnerability,
  // never splatted, never thrown); a held kid is never flung (the slide's clock restarts while held). Every trial is
  // watched for a DEATH after touching the top, a FLING (held, then off the top without the rescue and dead, or launched
  // faster than the slow push: over 3.6 m/s), a PERCH (alive on an off-limits top 3 s after touching it) and the RESCUES
  // (how far: ≤ 6 m). The gate: 0 deaths, 0 flings, 0 perches, no rescue over 6 m, in every part:
  //   a  the hop-on probe (review 7's probe-roofslide7b, as before): every flat roof block with lava within 3 m that a kid
  //      can hop onto from floor 0.4–1.7 m below, 16 sides × 3 offsets × 2 run-ups, idle or steering back; LOW and HIGH
  //   b  every point of every roof top beside the lava (review 8's probe-roof8): put down still, or drifting at 6.5 m/s in 8
  //      headings (a landing's momentum: a drop from above, a leap, a swim jump), the stick idle; or drifting along the top's
  //      4 axes and steering back against the slide (on the top and in the air off it); at LOW, HIGH, the first rise's 30 /
  //      60 / 90 % and the first fall's 50 %
  //   c  every way onto the tops that held a kid in b (review 8's probe-hold8 and probe-perch8): Sponge Mitts leaps (the
  //      kit's predictLeap aimed at the top from every dry nav node within 14 m), plain running jumps and swim jumps out of
  //      own ink (from every dry node within 9.5 m, steered at the top in the air), a walk / hop off higher floor, and for
  //      cover standing on floor that drowns a hop onto it every 0.05 s from 1.2 s before that floor turns deadly; then
  //      idle until 3 s after touching it
  //   d  Mitts leaps onto every tall top beside the lava (1.8–3.6 m over the dry floor round it: the Tide Boards, review 8
  //      issue 2's 54 of 738 into the lava), stick idle, LOW and HIGH
  //   PAGE_ARGS r47=a,b,c,d (the parts; all by default), r47lv=low,high,r30,r60,r90,f50 (b's levels)
  if (want('47')) try {
    const kid = g.match.actors.find((a) => a.bot && a !== g.match.local) || g.match.actors.find((a) => a.bot), it = kid.intent, dt = 1 / 60;
    const PA = String(window.__pageArgs || ''), parts = (/r47=([^;&]+)/.exec(PA)?.[1] || 'a,b,c,d').split(',');
    const LVS = (/r47lv=([^;&]+)/.exec(PA)?.[1] || 'low,high,r30,r60,r90,f50').split(',');
    const { MITTS } = await import('./src/game/kits/mitts.js');
    const { Hit } = await import('./src/game/physics.js');
    const phys = __G.physics, DOWN = V(0, -1, 0), O3 = V(0, 0, 0), H3 = new Hit(), w0 = kid.weaponId, P8 = __G.paint;
    const hitBlock = (x, z, y) => { const h = phys.raycast(O3.set(x, y, z), DOWN, 3, H3); return h.hit ? { y: H3.point.y, block: H3.block } : null; };
    const ext = (b, dx, dz) => Math.abs(b.half.x * (b.axes[0].x * dx + b.axes[0].z * dz)) + Math.abs(b.half.z * (b.axes[2].x * dx + b.axes[2].z * dz));
    const topOf = (b) => b.center.y + b.half.y * b.axes[1].y;
    const lavaAt = (x, z, y) => { const gh = lvl.groundHeight(x, z, y); return (gh === -Infinity || gh <= Lv.y + K - 0.01) && W.inRegion(x, z); };
    const reset = (pos, vel) => { kid.isBot = true; kid.carry = null; if (!kid.alive) kid.respawn(); kid.spawnAt(pos, 0); kid.invuln = 0; kid.hp = 100; kid.form = 'kid'; kid.ink = 100; kid.vel.copy(vel || V(0, 0, 0)); it.move.set(0, 0, 0); it.fire = it.jump = it.squid = it.sub = it.special = false; };
    // the watch: each frame after kid.update
    const watch = () => ({ touched: false, f0: -1, onRoof: false, held: false, prevHeld: false, tp: kid.netTp || 0, relaunch: 0, launchF: -1, launchV: 0, rescued: 0, rescueD: 0, died: false, block: -1 });
    const look = (m, f) => {
      const gb = kid.grounded && kid.ground.hit ? lvl.blocks[kid.ground.block] : null, onRoof = !!(gb && kid.isRoofFor(gb));
      if (onRoof) { if (!m.touched) { m.touched = true; m.f0 = f; m.block = gb.id; } }
      const h = kid.roofHeld > 0;
      if (h) m.held = true;
      if (m.prevHeld && !h) {
        if ((kid.netTp || 0) !== m.tp) { m.rescued++; const RL = Lv.stats.rescueLog; m.rescueD = Math.max(m.rescueD, RL && RL.length ? RL[RL.length - 1].d : 99); }
        else { m.relaunch++; m.launchF = f; }
      }
      if (m.launchF >= 0 && f === m.launchF + 1) m.launchV = Math.max(m.launchV, Math.hypot(kid.vel.x, kid.vel.z));
      m.tp = kid.netTp || 0; m.prevHeld = h; m.onRoof = onRoof;
      if (!kid.alive && m.touched) m.died = true;
    };
    const verdict = (m) => { m.flung = m.relaunch > 0 && (m.died || m.launchV > 3.6); m.perched = kid.alive && m.onRoof; return m; };
    const tally = () => ({ trials: 0, touched: 0, died: 0, flung: 0, perched: 0, held: 0, rescued: 0, rescueFar: 0, rescueMaxM: 0, relaunched: 0, eg: [] });
    const add = (T, m, info) => {
      T.trials++; if (!m.touched) return;
      T.touched++; if (m.held) T.held++; if (m.rescued) T.rescued++; if (m.relaunch) T.relaunched++;
      T.rescueMaxM = Math.max(T.rescueMaxM, m.rescueD); if (m.rescueD > 6) T.rescueFar++;
      const bad = m.died || m.flung || m.perched || m.rescueD > 6;
      if (m.died) T.died++; if (m.flung) T.flung++; if (m.perched) T.perched++;
      if (bad && T.eg.length < 6) T.eg.push({ ...info, block: lvl.blocks[m.block]?.tag || '#' + m.block, died: m.died, flung: m.flung, perched: m.perched, rescueD: r2(m.rescueD), launchV: r2(m.launchV), end: [r2(kid.pos.x), r2(kid.pos.y), r2(kid.pos.z)] });
    };
    const ok = (T) => !T.died && !T.flung && !T.perched && !T.rescueFar;
    // the stage times: LOW / HIGH, the first rise's 30 / 60 / 90 %, the first fall's 50 %; the first rise's warning
    const times = { low: 10, high: 50 };
    { let prev = null, risen = false; for (let t = 0; t <= 170; t += 0.25) { setT(t); const e = (Lv.y - LO) / (H - LO);
        if (prev !== null) { for (const [k, f] of [['r30', 0.3], ['r60', 0.6], ['r90', 0.9]]) if (times[k] === undefined && prev < f && e >= f) times[k] = t;
          if (e >= 0.999) risen = true; if (risen && times.f50 === undefined && prev > 0.5 && e <= 0.5) times.f50 = t; }
        prev = e; } }
    const out47 = { times };
    const holders = new Map();   // block id → the levels it held a kid at (b)

    // ---- a: the hop-on probe
    if (parts.includes('a')) {
      const res = {};
      for (const level of ['low', 'high']) {
        setT(times[level]);
        const cands = [];
        for (const b of lvl.blocks) {
          if (!b || !b.roof || !b.solid || b.axes[1].y < 0.99) continue;
          const top = b.center.y + b.half.y;
          if (top < Lv.y || b.half.x > 6 || b.half.z > 6) continue;   // (a big building is no hop-on)
          let near = false;
          for (let k = 0; k < 16 && !near; k++) { const a = (k * Math.PI) / 8, dx = Math.cos(a), dz = Math.sin(a), e = ext(b, dx, dz);
            for (let s = e + 0.1; s <= e + 3.0 && !near; s += 0.3) if (lavaAt(b.center.x + dx * s, b.center.z + dz * s, top - 0.05)) near = true; }
          if (near) cands.push(b);
        }
        const T = tally(), byMode = { idle: [0, 0], save: [0, 0] }; let reach = 0;
        for (const b of cands) {
          const top = b.center.y + b.half.y; let bl = 0;
          for (let k = 0; k < 16; k++) {
            const a = (k * Math.PI) / 8, dx = Math.cos(a), dz = Math.sin(a), e = ext(b, dx, dz), w = ext(b, -dz, dx);
            for (const latF of [-0.6, 0, 0.6]) for (const ru of [0.6, 1.1]) {
              const lat = latF * w, sx = b.center.x - dx * (e + 0.5 + ru) - dz * lat, sz = b.center.z - dz * (e + 0.5 + ru) + dx * lat;
              const fy = lvl.groundHeight(sx, sz, top - 0.05);
              if (!(fy > -50) || top - fy < 0.4 || top - fy > 1.7 || fy <= Lv.y + K + 0.05 || Lv.covers(sx, sz, fy)) continue;
              const fy2 = lvl.groundHeight(sx + dx * ru, sz + dz * ru, top - 0.05); if (Math.abs(fy2 - fy) > 0.3) continue;   // (a level run-up)
              for (const mode of ['idle', 'save']) {
                reset(V(sx, fy + 0.05, sz));
                for (let i = 0; i < 4; i++) kid.update(dt);
                if (!kid.grounded || !kid.alive) continue;
                let jumped = false, on = false; const m = watch(), x0 = kid.pos.x, z0 = kid.pos.z;
                for (let f = 0; f < 260; f++) {
                  if (on) { const gb = kid.grounded && kid.ground.hit ? lvl.blocks[kid.ground.block] : null; if ((gb && !gb.roof) || mode === 'idle') it.move.set(0, 0, 0); else { const hx = sx - kid.pos.x, hz = sz - kid.pos.z, hl = Math.hypot(hx, hz) || 1; it.move.set(hx / hl, 0, hz / hl); } }
                  else if (jumped) { const hx = b.center.x - kid.pos.x, hz = b.center.z - kid.pos.z, hl = Math.hypot(hx, hz) || 1; it.move.set(hx / hl, 0, hz / hl); }
                  else it.move.set(dx, 0, dz);
                  const along = (kid.pos.x - x0) * dx + (kid.pos.z - z0) * dz;
                  it.jump = !jumped && along >= ru - 0.05; if (it.jump) jumped = true;
                  kid.update(dt); look(m, f);
                  if (!on && kid.grounded && kid.ground.hit && kid.ground.block === b.id) on = true;
                  if (!kid.alive) break;
                  if (on && f - m.f0 > 180) break;
                  if (!on && jumped && kid.grounded && f > 50) break;
                }
                if (!on) continue;
                verdict(m); add(T, m, { part: 'a', level, from: [r2(sx), r2(fy), r2(sz)], heading: Math.round((a * 180) / Math.PI), mode, on: b.tag || '#' + b.id }); bl++;
                byMode[mode][0]++; if (m.died) byMode[mode][1]++;
              }
            }
          }
          if (bl) reach++;
        }
        res[level] = { roofBlocksNearLava: cands.length, reachable: reach, byMode, ...T };
      }
      out47.a = res;
    }

    // ---- b: every point of every roof top beside the lava, still or drifting, idle or steering back
    if (parts.includes('b')) {
      const res = {};
      for (const lvKey of LVS) {
        if (times[lvKey] === undefined) { res[lvKey] = 'no time'; continue; }
        setT(times[lvKey]);
        const LY = Lv.y, cands = [];
        for (const b of lvl.blocks) {
          if (!b || !b.roof || !b.solid || b.axes[1].y < 0.5 || b.half.x > 8 || b.half.z > 8) continue;
          const top = topOf(b);
          if (top < LY + K) continue;
          let near = false;
          for (let k = 0; k < 16 && !near; k++) { const a = (k * Math.PI) / 8, dx = Math.cos(a), dz = Math.sin(a), e = ext(b, dx, dz);
            for (let s = e + 0.1; s <= e + 4.0 && !near; s += 0.3) if (lavaAt(b.center.x + dx * s, b.center.z + dz * s, top + 0.5)) near = true; }
          if (near) cands.push(b);
        }
        const T = tally(); const perB = new Map();
        for (const b of cands) {
          const ax = b.axes[0], az = b.axes[2], top0 = topOf(b);
          const nu = Math.max(1, Math.min(4, Math.round((b.half.x * 2) / 0.3))), nv = Math.max(1, Math.min(4, Math.round((b.half.z * 2) / 0.3)));
          for (let iu = 0; iu < nu; iu++) for (let iv = 0; iv < nv; iv++) {
            const u = nu === 1 ? 0 : -b.half.x + 0.12 + (iu * (2 * b.half.x - 0.24)) / (nu - 1), v = nv === 1 ? 0 : -b.half.z + 0.12 + (iv * (2 * b.half.z - 0.24)) / (nv - 1);
            const x = b.center.x + ax.x * u + az.x * v, z = b.center.z + ax.z * u + az.z * v;
            const hb = hitBlock(x, z, top0 + 1.0); if (!hb || hb.block !== b.id) continue;
            const modes = [['still', null, false]];
            for (let k = 0; k < 8; k++) modes.push(['drift', (k * Math.PI) / 4, false]);
            for (let k = 0; k < 4; k++) modes.push(['back', (k * Math.PI) / 2 + Math.atan2(ax.z, ax.x), true]);   // (drifting along its axes, then steering back against the slide)
            for (const [mode, h, back] of modes) {
              reset(V(x, hb.y + 0.3, z), V(h === null ? 0 : 6.5 * Math.cos(h), 0, h === null ? 0 : 6.5 * Math.sin(h)));
              const m = watch(); let offF = 0, away = false, sx = 0, sz = 0;
              for (let f = 0; f < 240; f++) {
                // (steering back: against the slide — the way off it took — while on the top it came down on and in the air off it;
                // on other ground, idle. A steer across the slide is the player's own way: not this rule's)
                if (m.touched && kid.grounded && !(kid.ground.hit && kid.ground.block === m.block)) away = true;
                if (kid.roofDir && (kid.roofDir.x || kid.roofDir.z)) { sx = -kid.roofDir.x; sz = -kid.roofDir.z; }
                if (back && m.touched && !away && (sx || sz)) it.move.set(sx, 0, sz); else it.move.set(0, 0, 0);
                kid.update(dt); look(m, f);
                if (m.touched && !m.onRoof && kid.grounded) offF++; else if (m.onRoof) offF = 0;
                if (!kid.alive || offF > 12 || (m.touched && f - m.f0 >= 180)) break;
              }
              if (m.touched) { verdict(m); if (m.held) { const s = holders.get(b.id) || new Set(); s.add(lvKey); holders.set(b.id, s); } }
              add(T, m, { part: 'b', level: lvKey, at: [r2(x), r2(hb.y), r2(z)], mode, h: h === null ? null : Math.round((h * 180) / Math.PI) });
              if (m.touched && (m.held || m.died)) { const k = b.tag || '#' + b.id, p = perB.get(k) || [0, 0, 0]; p[0]++; if (m.held) p[1]++; if (m.died) p[2]++; perB.set(k, p); }
            }
          }
        }
        res[lvKey] = { t: times[lvKey], y: r2(LY), roofBlocks: cands.length, ...T, heldBy: [...perB].map(([k, p]) => [k, ...p]).slice(0, 16) };
      }
      out47.b = res;
    }

    // ---- c: every way onto the tops that held a kid in b
    if (parts.includes('c')) {
      // (b not run: the tops that hold, found the cheap way — a kid put down still on the centre and four points round it,
      // 0.75 s, at each of b's levels: any hold)
      if (!parts.includes('b')) for (const lvKey of LVS) {
        if (times[lvKey] === undefined) continue;
        setT(times[lvKey]);
        for (const b of lvl.blocks) {
          if (!b || !b.roof || !b.solid || b.axes[1].y < 0.5 || b.half.x > 8 || b.half.z > 8) continue;
          const top = topOf(b);
          if (top < Lv.y + K) continue;
          let near = false;
          for (let k = 0; k < 16 && !near; k++) { const a = (k * Math.PI) / 8, dx = Math.cos(a), dz = Math.sin(a), e = ext(b, dx, dz);
            for (let s2 = e + 0.1; s2 <= e + 4.0 && !near; s2 += 0.3) if (lavaAt(b.center.x + dx * s2, b.center.z + dz * s2, top + 0.5)) near = true; }
          if (!near) continue;
          for (const [u, v] of [[0, 0], [0.6, 0.6], [-0.6, 0.6], [0.6, -0.6], [-0.6, -0.6]]) {
            const x = b.center.x + b.axes[0].x * u * b.half.x + b.axes[2].x * v * b.half.z, z = b.center.z + b.axes[0].z * u * b.half.x + b.axes[2].z * v * b.half.z;
            const hb = hitBlock(x, z, top + 1.0); if (!hb || hb.block !== b.id) continue;
            reset(V(x, hb.y + 0.3, z)); let h = false;
            for (let f = 0; f < 45 && kid.alive; f++) { kid.update(dt); if (kid.roofHeld > 0) h = true; }
            if (h) { const s2 = holders.get(b.id) || new Set(); s2.add(lvKey); holders.set(b.id, s2); break; }
          }
        }
      }
      const res = { holders: [...holders].map(([id, s]) => [lvl.blocks[id].tag || '#' + id, id, [...s]]) };
      const land = { kind: 'none', pos: V(0, 0, 0), normal: V(0, 1, 0), hitPt: V(0, 0, 0), block: -1, t: 0, n: 0 }, vv = V(0, 0, 0);
      const kk = { botWant: -1, botYaw: 0, botPitch: 0, cling: false };
      const dryNode = (nd) => nav.valid[nd.id] && !Lv.covers(nd.x, nd.z, nd.y) && Math.abs(lvl.groundHeight(nd.x, nd.z, nd.y + 0.3) - nd.y) < 0.3;
      // fly a leap with velocity v from `from`, then idle until 3 s after touching a roof
      const flyLeap = (from, v) => {
        reset(V(from.x, from.y + 0.05, from.z));
        for (let i = 0; i < 2; i++) kid.update(dt);
        const r = kid.weaponRunner, k3 = MITTS.K(r); k3.charging = false; k3.cling = false; k3.hang = false;
        kid.pos.set(from.x, from.y, from.z); kid.vel.copy(v); kid.grounded = false; kid.coyote = 0; kid.jumpBuffer = 0;
        k3.leaping = true; k3.leapT = 0; k3.slid = false; k3.leapV.set(v.x, 0, v.z); k3.leapH = Math.hypot(v.x, v.z); k3.trail = 0; k3.trailP.copy(kid.pos);
        const m = watch(); let first = null;
        for (let f = 0; f < 420; f++) { kid.update(dt); look(m, f); if (first === null && kid.grounded) first = kid.ground.block; if (!kid.alive) break; if (m.touched && f - m.f0 >= 180) break; if (!m.touched && first !== null && f > 240) break; }
        return { m: verdict(m), first };
      };
      const levels = ['low', 'high'];
      const T = { mitts: tally(), run: tally(), swim: tally(), walk: tally(), rise: tally() };
      for (const level of levels) {
        setT(times[level]);
        for (const [id, s] of holders) {
          if (!s.has(level) && !(level === 'high' && [...s].some((x) => x !== 'low'))) continue;
          const b = lvl.blocks[id], top = topOf(b);
          // Mitts leaps (up to 120 that the predictor lands on it)
          kid.setWeapon('mitts');
          let nL = 0;
          for (const nd of nav.nodes) {
            if (nL >= 120) break;
            const dx = b.center.x - nd.x, dz = b.center.z - nd.z, d = Math.hypot(dx, dz);
            if (d > 14 || d < 2 || nd.y < top - 2 || nd.y > top + 4 || !dryNode(nd)) continue;
            const from = V(nd.x, nd.y, nd.z);
            for (const dyaw of [0, 0.06, -0.06]) for (const c of [0.3, 0.45, 0.6, 0.75, 0.9, 1]) for (const pitch of [-0.2, 0, 0.2, 0.4]) {
              if (nL >= 120) break;
              kk.botWant = c; kk.botYaw = Math.atan2(dx, dz) + dyaw; kk.botPitch = pitch; MITTS.leapVelocity(kid, kk, c, vv); kk.botWant = -1;
              MITTS.predictLeap(from, vv, land, null);
              if (land.kind !== 'ground' || land.block !== b.id) continue;
              nL++;
              const { m } = flyLeap(from, vv.clone());
              add(T.mitts, m, { part: 'c', how: 'mitts', level, on: b.tag || '#' + id, from: [r2(nd.x), r2(nd.y), r2(nd.z)], c, pitch });
            }
          }
          kid.setWeapon(w0);
          // plain running jumps and swim jumps out of own ink, steered at the top in the air (up to 60 each)
          for (const how of ['run', 'swim']) {
            let n = 0;
            for (const nd of nav.nodes) {
              if (n >= 60) break;
              const ddx = b.center.x - nd.x, ddz = b.center.z - nd.z, d = Math.hypot(ddx, ddz);
              if (d > 9.5 || d < 2 || nd.y < top - (how === 'swim' ? 1.2 : 0.9) || nd.y > top + 3 || !dryNode(nd)) continue;
              const dx = ddx / d, dz = ddz / d;
              let edge = null; for (let s = 0.1; s <= 3; s += 0.1) { if (lavaAt(nd.x + dx * s, nd.z + dz * s, nd.y + 1.3) || lvl.groundHeight(nd.x + dx * s, nd.z + dz * s, nd.y + 1.3) < nd.y - 0.3) { edge = s; break; } }
              if (edge === null) continue;
              for (const ru of [2.6, 1.5]) {
                const sx = nd.x + dx * (edge - ru), sz = nd.z + dz * (edge - ru), sy = lvl.groundHeight(sx, sz, nd.y + 0.6);
                if (!(Math.abs(sy - nd.y) < 0.35)) continue;
                if (how === 'swim') { P8?.clear?.(); for (let s = -0.2; s <= ru - 0.2; s += 0.5) P8?.splat?.(V(sx + dx * s, sy + 0.05, sz + dz * s), 0.9, kid.team, { instant: true, seed: s }); }
                reset(V(sx, sy + 0.05, sz));
                for (let i = 0; i < 3; i++) kid.update(dt);
                let jumped = false, jf = -1; const m = watch();
                for (let f = 0; f < 420; f++) {
                  const along = (kid.pos.x - nd.x) * dx + (kid.pos.z - nd.z) * dz;
                  if (m.touched) it.move.set(0, 0, 0);
                  else if (jumped && f - jf > 2) { const hx = b.center.x - kid.pos.x, hz = b.center.z - kid.pos.z, hl = Math.hypot(hx, hz); it.move.set(hl > 0.15 ? hx / hl : 0, 0, hl > 0.15 ? hz / hl : 0); } else it.move.set(dx, 0, dz);
                  it.squid = how === 'swim' && !jumped;
                  it.jump = !jumped && along >= edge - 0.35; if (it.jump) { jumped = true; jf = f; }
                  kid.update(dt); look(m, f);
                  if (!kid.alive) break;
                  if (m.touched && f - m.f0 >= 180) break;
                  if (!m.touched && jumped && f - jf > 120) break;
                }
                it.squid = false;
                if (!m.touched) continue;
                n++; verdict(m); add(T[how], m, { part: 'c', how, level, on: b.tag || '#' + id, from: [r2(nd.x), r2(nd.y), r2(nd.z)], ru });
              }
            }
          }
          P8?.clear?.();
          // a walk / hop off higher dry floor (0.3–3.5 m over the top, within 4.5 m)
          for (const nd of nav.nodes) {
            const ddx = b.center.x - nd.x, ddz = b.center.z - nd.z, d = Math.hypot(ddx, ddz);
            if (d > 4.5 || d < 0.8 || nd.y < top + 0.3 || nd.y > top + 3.5 || !dryNode(nd)) continue;
            for (const hop of [false, true]) {
              reset(V(nd.x, nd.y + 0.05, nd.z)); for (let i = 0; i < 2; i++) kid.update(dt);
              let jumped = false; const y0 = kid.pos.y, m = watch();
              for (let f = 0; f < 330; f++) {
                const hx = b.center.x - kid.pos.x, hz = b.center.z - kid.pos.z, hl = Math.hypot(hx, hz);
                if (m.touched) it.move.set(0, 0, 0); else it.move.set(hl > 0.2 ? hx / hl : 0, 0, hl > 0.2 ? hz / hl : 0);
                it.jump = hop && !jumped && kid.grounded && lvl.groundHeight(kid.pos.x + (hx / (hl || 1)) * 0.5, kid.pos.z + (hz / (hl || 1)) * 0.5, y0 + 0.2) < y0 - 0.3; if (it.jump) jumped = true;
                kid.update(dt); look(m, f);
                if (!kid.alive || (m.touched && f - m.f0 >= 180)) break;
              }
              if (m.touched) { verdict(m); add(T.walk, m, { part: 'c', how: hop ? 'hop-off' : 'walk-off', level, on: b.tag || '#' + id, from: [r2(nd.x), r2(nd.y), r2(nd.z)] }); }
            }
          }
        }
      }
      // cover standing on floor that drowns: a hop onto it from that floor every 0.05 s from 1.2 s before the floor turns deadly
      const sched = []; for (let t = 0; t <= 120; t += 0.1) { Lv.debugT(t); sched.push([t, Lv.y]); }
      for (const [id] of holders) {
        const b = lvl.blocks[id], top = topOf(b), floor = top - b.half.y * 2;
        if (floor > H + K) continue;   // (its floor never drowns)
        let td = null; for (const [t, y] of sched) if (td === null && t > 20 && y + K > floor) td = t;
        if (td === null) continue;
        for (let t = td - 1.2; t <= td + 0.1; t += 0.05) for (let k = 0; k < 8; k++) {
          const a = (k * Math.PI) / 4, ex = Math.max(b.half.x, b.half.z) + 1.05, sx = b.center.x + Math.cos(a) * ex, sz = b.center.z + Math.sin(a) * ex;
          Lv.debugT(t);
          const fy = lvl.groundHeight(sx, sz, top - 0.05);
          if (!(Math.abs(fy - floor) < 0.3) || Lv.covers(sx, sz, fy)) continue;
          reset(V(sx, fy + 0.05, sz)); for (let i = 0; i < 2; i++) kid.update(dt);
          let jumped = false; const x0 = kid.pos.x, z0 = kid.pos.z, m = watch();
          for (let f = 0; f < 60 * (td - t + 4); f++) {
            if (f % 3 === 0) Lv.debugT(t + f / 60);
            const hx = b.center.x - kid.pos.x, hz = b.center.z - kid.pos.z, hl = Math.hypot(hx, hz);
            if (!m.touched && (!jumped || f < 40)) it.move.set(hl > 0.2 ? hx / hl : 0, 0, hl > 0.2 ? hz / hl : 0); else it.move.set(0, 0, 0);
            it.jump = !jumped && Math.hypot(kid.pos.x - x0, kid.pos.z - z0) >= 0.5; if (it.jump) jumped = true;
            kid.update(dt); look(m, f);
            if (!kid.alive || (m.touched && f - m.f0 >= 180)) break;
          }
          if (m.touched) { verdict(m); add(T.rise, m, { part: 'c', how: 'rise-hop', on: b.tag || '#' + id, hopAt: r2(t), td: r2(td), from: [r2(sx), r2(fy), r2(sz)] }); }
        }
      }
      setT(times.high);
      Object.assign(res, T);
      out47.c = res;
    }

    // ---- d: Mitts leaps onto every tall top beside the lava, stick idle
    if (parts.includes('d')) {
      const res = [];
      const land = { kind: 'none', pos: V(0, 0, 0), normal: V(0, 1, 0), hitPt: V(0, 0, 0), block: -1, t: 0, n: 0 }, vv = V(0, 0, 0);
      const kk = { botWant: -1, botYaw: 0, botPitch: 0, cling: false };
      kid.setWeapon('mitts');
      for (const level of ['low', 'high']) {
        setT(times[level]);
        const T = tally(); const blocks = [];
        for (const b of lvl.blocks) {
          if (!b || !b.roof || !b.solid || b.dynamic || b.axes[1].y < 0.99 || b.half.x > 4 || b.half.z > 4) continue;
          const top = topOf(b);
          let near = false, fmax = -Infinity, fmin = Infinity;
          for (let k = 0; k < 16; k++) { const a = (k * Math.PI) / 8, dx = Math.cos(a), dz = Math.sin(a), e = ext(b, dx, dz);
            for (let s = e + 0.3; s <= e + 3.0; s += 0.3) { const x = b.center.x + dx * s, z = b.center.z + dz * s; if (lavaAt(x, z, top + 0.5)) { near = true; continue; } const hb = hitBlock(x, z, top - 0.05); if (hb && !lvl.blocks[hb.block]?.roof) { fmax = Math.max(fmax, hb.y); fmin = Math.min(fmin, hb.y); } } }
          if (!near || !(top - fmin >= 1.8 && top - fmax <= 3.6)) continue;   // (1.8 m over the floor at its foot, ≤ 3.6 over the highest round it)
          blocks.push(b);
        }
        for (const b of blocks) {
          const top = topOf(b); let n = 0, landed = 0, died = 0;
          for (const nd of nav.nodes) {
            if (n >= 800) break;
            if (!nav.valid[nd.id] || Lv.covers(nd.x, nd.z, nd.y)) continue;
            const dx = b.center.x - nd.x, dz = b.center.z - nd.z, d = Math.hypot(dx, dz);
            if (d > 9 || d < 1.5 || nd.y > top) continue;
            const from = V(nd.x, nd.y, nd.z);
            for (const dyaw of [0, 0.1, -0.1]) for (const c of [0.3, 0.5, 0.7, 0.9]) for (const pitch of [0, 0.3, 0.6]) {
              kk.botWant = c; kk.botYaw = Math.atan2(dx, dz) + dyaw; kk.botPitch = pitch; MITTS.leapVelocity(kid, kk, c, vv); kk.botWant = -1;
              MITTS.predictLeap(from, vv, land, null);
              if (land.kind !== 'ground' || land.block !== b.id) continue;
              n++;
              reset(V(from.x, from.y + 0.05, from.z)); for (let i = 0; i < 2; i++) kid.update(dt);
              const k3 = MITTS.K(kid.weaponRunner); k3.charging = false; k3.cling = false; k3.hang = false;
              kid.pos.copy(from); kid.vel.copy(vv); kid.grounded = false; kid.coyote = 0; kid.jumpBuffer = 0;
              k3.leaping = true; k3.leapT = 0; k3.slid = false; k3.leapV.set(vv.x, 0, vv.z); k3.leapH = Math.hypot(vv.x, vv.z); k3.trail = 0; k3.trailP.copy(kid.pos);
              const m = watch(); let first = null;
              for (let f = 0; f < 420; f++) { kid.update(dt); look(m, f); if (first === null && kid.grounded) first = kid.ground.block; if (!kid.alive) break; if (m.touched && f - m.f0 >= 180) break; if (!m.touched && first !== null && f > 240) break; }
              if (first !== b.id) continue;
              landed++; verdict(m); if (m.died) died++;
              add(T, m, { part: 'd', level, on: b.tag || '#' + b.id, from: [r2(nd.x), r2(nd.y), r2(nd.z)], c, pitch });
            }
          }
          (T.blocks ||= []).push([b.tag || '#' + b.id, [r2(b.center.x), r2(top), r2(b.center.z)], n, landed, died]);
        }
        res.push({ level, ...T });
      }
      kid.setWeapon(w0);
      out47.d = res;
    }
    kid.carry = null; kid.setWeapon(w0); setT(times.high);
    const allT = [];
    if (out47.a) allT.push(out47.a.low, out47.a.high);
    if (out47.b) for (const v of Object.values(out47.b)) if (typeof v === 'object') allT.push(v);
    if (out47.c) allT.push(out47.c.mitts, out47.c.run, out47.c.swim, out47.c.walk, out47.c.rise);
    if (out47.d) allT.push(...out47.d);
    const sumT = (k) => allT.reduce((s, x) => s + (x[k] || 0), 0);
    out47.total = { touched: sumT('touched'), died: sumT('died'), flung: sumT('flung'), perched: sumT('perched'), held: sumT('held'), rescued: sumT('rescued'), rescueFar: sumT('rescueFar'), rescueMaxM: Math.max(0, ...allT.map((x) => x.rescueMaxM || 0)), relaunched: sumT('relaunched') };
    R('rule 47: no roof top beside the lava slides a kid into it, holds it as a perch or flings it — (a) the hop-on probe, (b) every point of every top, still / drifting, idle / steering back, at LOW, HIGH, the rise\'s 30 / 60 / 90 % and the fall\'s 50 %, (c) Mitts leaps, running and swim jumps, walk-offs and hops during the rise onto every top that holds, (d) Mitts leaps onto the tall tops: 0 deaths, 0 flings, 0 perches, every rescue within 6 m (fix round 8: the lead\'s rescue; review 8\'s probe-roof8 / probe-hold8 / probe-perch8)',
      allT.length > 0 && allT.every(ok) && (!out47.a || (out47.a.low.touched > 1000 && out47.a.high.touched > 1000)), out47);
  } catch (e) { R('rule 47: roof slides: the check itself threw', false, { error: String(e && e.stack || e).slice(0, 400) }); }

  // ---------------------------------------------------------------------------------------------- rule 46: grid shift
  if (want('46')) try {
    const keep = { nav: W.nav, navMeta: W.navMeta, links: W.links, linkEnds: W._linkEnds, gapCuts: W.gapCuts, problems: W.navProblems };
    const B0 = { ...lvl.bounds }, rows = [];
    const climbs = (nv) => {
      const MM = nv.lavaMeta, kindOf = (id) => MM.kind[id];
      const ofR = (id, pose) => nv.nodes.filter((nd) => MM.rider[nd.id] === W.riders.findIndex((r) => r.id === id) && MM.pose[nd.id] === pose).map((nd) => nd.id);
      // (fix round 6: the climb to ANY of the column's top nodes at that pose — with the lookout's crown a grid shift can leave
      // one node in a pocket between two pipes, and the first node listed was the only one tried)
      const run = (from, to, pose, noFloor) => {
        nv.ext = { edge: (e, t) => ((MM.kind[t] === 2 && MM.pose[t] !== pose) || (noFloor && MM.kind[t] === 1) ? Infinity : 0), node: () => true };
        let p = null;
        for (const t of to) { if (from < 0) break; p = nv.path(from, t, 0); if (p) break; }
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
