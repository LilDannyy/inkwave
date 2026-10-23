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
        // (walk the pipes in order round the column from the crown's open end: the largest angular step is the open side)
        let gapAt = 0, big = -1; for (let i = 0; i < ord.length; i++) { const a0 = ang(ord[i]), a1 = ang(ord[(i + 1) % ord.length]); const da = ((a1 - a0) + 4 * Math.PI) % (2 * Math.PI); if (da > big) { big = da; gapAt = i; } }
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
  for (const level of ['low', 'high']) {
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
    const tryJump = (c, swim, pressF = null, runup = 2.6, carry = false) => {
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
      let jumped = false, jf = -1, over = false;
      for (let f = 0; f < 200; f++) {
        it.move.set(c.dx, 0, c.dz); it.squid = swim && (pressF == null || jf < 0 || f - jf < pressF);
        const along = (kid.pos.x - c.x) * c.dx + (kid.pos.z - c.z) * c.dz;
        it.jump = !jumped && along >= c.edge - 0.35;
        if (it.jump) { jumped = true; jf = f; }
        it.sub = pressF != null && jf >= 0 && f - jf === pressF;
        kid.update(dt);
        if (!kid.alive) { kid.carry = null; return { died: true, along: r2((kid.pos.x - c.x) * c.dx + (kid.pos.z - c.z) * c.dz) }; }
        if (jumped && !kid.grounded && !over && lavaAt(kid.pos.x, kid.pos.z, kid.pos.y)) over = true;
        if (jumped && f - jf > 4 && kid.grounded) break;
      }
      kid.carry = null;
      const along = (kid.pos.x - c.x) * c.dx + (kid.pos.z - c.z) * c.dz;
      const gb = kid.ground && lvl.blocks[kid.ground.block];
      const gl = lvl.groundHeight(kid.pos.x, kid.pos.z, kid.pos.y + 0.3);
      const side = Math.abs((kid.pos.x - c.x) * c.dz - (kid.pos.z - c.z) * c.dx);   // (off the line it was aimed along)
      return { crossed: kid.alive && kid.grounded && over && along > c.lava0 + 0.3 && gl > Lv.y + K - 0.01 && !Lv.covers(kid.pos.x, kid.pos.z, kid.pos.y),
        off: side > 1.0, side: r2(side), along: r2(along), y: r2(kid.pos.y), alive: kid.alive, at: [r2(kid.pos.x), r2(kid.pos.z)], at3: [kid.pos.x, kid.pos.y, kid.pos.z], on: gb ? (gb.tag || (gb.dynamic ? 'rider' : '#' + gb.id)) : null };
    };
    // the nav detour each of them saves ("gain": the nav walk from the take-off node to the node where it came down,
    // minus the flight; 999 = no way round on foot now; null = no nav node within reach of where it landed — counted)
    const detour = (c, r) => { const q = V(r.at3[0], r.at3[1], r.at3[2]); let m = nav.nearest(q, 0.6, true); if (m < 0) m = nav.nearest(q, 1.4, true); if (m < 0) return null; const p = nav.path(c.id, m, 0); if (!p) return 999; let L = 0; for (let i = 1; i < p.length; i++) { const a = nav.nodes[p[i - 1]], b = nav.nodes[p[i]]; L += Math.hypot(b.x - a.x, b.z - a.z); } return Math.min(999, L - Math.hypot(q.x - c.x, q.z - c.z)); };
    const runX = [], skillX = [];
    // (the dash jumps physically: the real Dash Pellet, an air dash pressed on the rise, at the apex and on the fall — 8 /
    // 18 / 30 frames after the jump — from a running jump and from a swim jump out of own ink; the farthest first)
    const dashTries = [[true, 30], [true, 18], [false, 30], [false, 18], [true, 8], [false, 8]];
    for (const c of cands) {
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
    jumps[level] = { edgesChecked: cands.length, deep: cands.filter((c) => c.deep).length, strip: cands.filter((c) => c.strip).length, gaps, runCross: runX, skill: skillX, carry: carryX };
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
  const allRun = [...jumps.low.runCross, ...jumps.high.runCross];
  const runMax = allRun.reduce((m, x) => Math.max(m, x.gain ?? 0), 0);
  R('rule 44: a plain running jump across the lava at LOW or HIGH saves at most 20 m against the dry way round, the largest under 15 m (the lead\'s option 1 and margin; the march takes any standable floor across the lava down to the lava, take-offs that drop onto a dry strip first, and run-ups of 2.6 / 1.5 / 0.8 m; every sample past a 0.35 m seam tried; a flight landing > 1 m off its line counted, flagged off; gains from where it landed)',
    allRun.every((x) => x.gain !== null && x.gain <= 20) && runMax < 15,
    { largestM: r2(runMax), margin: 'under 15 m', marginMet: runMax < 15, low: { ...sum(jumps.low.runCross), edges: jumps.low.edgesChecked, deepEdges: jumps.low.deep, stripEdges: jumps.low.strip, places: places(jumps.low.runCross).length }, high: { ...sum(jumps.high.runCross), edges: jumps.high.edgesChecked, deepEdges: jumps.high.deep, stripEdges: jumps.high.strip, places: places(jumps.high.runCross).length } });
  for (const lv of ['low', 'high']) { const pl = places(jumps[lv].runCross); for (let q = 0; q * 12 < pl.length; q++) R(`rule 44 running-jump places: ${lv} ${q}`, true, pl.slice(q * 12, (q + 1) * 12)); R(`rule 44 running jumps, the largest gains: ${lv}`, true, top(jumps[lv].runCross, 15)); }
  const over = (L) => L.filter((x) => !(x.gain <= 20));
  // (fix round 5, option 1: swim and dash jumps over the lava are accepted skill movement — listed, no gate. Fix round 6,
  // the lead after review 6: the Bazookarp carrier swims its own ink and makes swim jumps too — accepted as skill movement
  // in general; what a carrier may bypass is judged per stage by the Bazookarp checker's shortcut probes (#7d) when
  // Highmark's Bazookarp layout is built. Its dash jumps are out: it carries no sub)
  R('rule 44 (information): the skill routes — swim jumps out of own ink and jumps + the Dash Pellet\'s air dash across the lava, accepted as skill movement (the lead\'s option 1); a Bazookarp carrier makes the swim jumps too (its own ink, SPEC S21) but no dash jumps (no sub): judged per stage by the Bazookarp checker #7d when Highmark\'s layout is built (the carrier list: below); how many save over 20 / 40 m against the dry way round (DESIGN §3.5)',
    true, { low: sum(jumps.low.skill), high: sum(jumps.high.skill) });
  for (const lv of ['low', 'high']) { const pl = places(over(jumps[lv].skill)); for (let q = 0; q * 12 < pl.length; q++) R(`rule 44 places saving > 20 m: ${lv} ${q}`, true, pl.slice(q * 12, (q + 1) * 12)); }
  R('rule 44 (information): the Bazookarp carrier\'s swim jumps — every swim crossing saving > 10 m tried again with the carrier\'s movement (actor.carry: speeds × 0.8, no sub); the list for the Bazookarp layout builder (karp-stages/, PAGE_ARGS full=1)',
    true, { low: sum(jumps.low.carry), high: sum(jumps.high.carry), topLow: top(jumps.low.carry, 8), topHigh: top(jumps.high.carry, 8) });
  // (the gap march's 0.35–4.4 m samples: in the gate above since fix round 4; here how many there are and what crossed them)
  R('rule 44 (information): the gap march\'s 0.35–4.4 m samples between standable floors over lava — each one tried (in the gates above)', true, { low: { n: jumps.low.gaps.length, run: jumps.low.runCross.filter((x) => x.gap < 4.4).length, skill: jumps.low.skill.filter((x) => x.gap < 4.4).length, eg: jumps.low.gaps.slice(0, 6) }, high: { n: jumps.high.gaps.length, run: jumps.high.runCross.filter((x) => x.gap < 4.4).length, skill: jumps.high.skill.filter((x) => x.gap < 4.4).length, eg: jumps.high.gaps.slice(0, 6) } });
  // (the whole lists, for DESIGN §3.5 and the Bazookarp layout: PAGE_ARGS full=1)
  if (/(^|[;&])full=1/.test(String(window.__pageArgs || ''))) R('rule 44 (information): every crossing (LOW, HIGH)', true, { low: { run: jumps.low.runCross, skill: jumps.low.skill, carry: jumps.low.carry }, high: { run: jumps.high.runCross, skill: jumps.high.skill, carry: jumps.high.carry } });   // (PAGE_ARGS full=1)

  } catch (e) { R('rule 44: the check itself threw', false, { error: String(e && e.stack || e).slice(0, 400) }); }

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
