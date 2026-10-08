// Gulper Aquarium blockout: LAYOUT.bazookarp measured on the real nav graph (the Bazookarp engine and its checker are not
// built yet, so this is a stand-in for bazookarp/SPEC.md §9.1's numbers, carrier routes = nav paths with climbs off):
//   MAP=aquarium PAGE=tools/botlab/jobs/batch5/aquarium/karp-data.js tools/botlab/run.sh tools/botlab/page.cjs
// #1 L = Pond → Gate (both teams, |L_A − L_B| ≤ 2 %), #2 the weir at 40–55 % of L, #3 weir → Gate ≥ 45 % of L and ≥ 25 m,
// #4 route 2 to the weir and to the Gate (2.5 m off route 1 except within 6 m of either end, ≤ 1.6× route 1), the named
// route hints walked through their waypoints, #6 pad → Gate 12–20 m and the apron blocks (≥ 1.2 m within 4 m of route 1
// between the deck's edge and the Gate), #8 the Gate's height and its cone off the pad → Pond line, #9 / #15 nothing solid
// within 3 m of the weir (0.3–3.6 m up), #10 / #14 the Pond's 4.5–10 m ring ≥ 70 % floor and the shell seen from 8 points.
(async () => {
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info });
  const L = __G.level, nav = __G.nav, THREE = await import('three');
  const K = L.layout.bazookarp;
  if (!K) { R('LAYOUT.bazookarp present', false, {}); return out; }
  const V = new THREE.Vector3(), r1 = (v) => Math.round(v * 10) / 10;
  const P3 = (p) => (p.length === 3 ? { x: p[0], y: p[1], z: p[2] } : { x: p[0], y: L.groundHeight(p[0], p[1], 20), z: p[1] });
  const turn = (p) => ({ x: -p.x, y: p.y, z: -p.z });
  const node = (p, r = 1.2) => { let best = -1, bd = Infinity; nav.nodes.forEach((n, i) => { if (!nav.valid[i]) return; const d = Math.hypot(n.x - p.x, n.z - p.z) + Math.abs(n.y - p.y) * 2; if (d < bd && Math.hypot(n.x - p.x, n.z - p.z) < r) { bd = d; best = i; } }); return best; };
  const plen = (p) => { let s = 0; for (let i = 1; i < p.length; i++) { const u = nav.nodes[p[i - 1]], v = nav.nodes[p[i]]; s += Math.hypot(v.x - u.x, v.y - u.y, v.z - u.z); } return s; };
  const path = (a, b, team, avoid = null) => nav.path(a, b, team, 400000, true, avoid);
  const pond = P3(K.start), weir = P3(K.weirs[0].at), gate = P3(K.gate.at);
  const pads = L.spawnPads;
  const res = {};
  for (const [team, f] of [[0, (p) => p], [1, turn]]) {
    const a = node(f(pond)), w = node(f(weir)), g = node(f(gate));
    const pw = path(a, w, team), wg = path(w, g, team), pg = path(a, g, team);
    if (!pw || !wg || !pg) { R(`team ${team}: carrier paths exist`, false, { a, w, g, pw: !!pw, wg: !!wg, pg: !!pg }); continue; }
    const Lpg = plen(pg), Lpw = plen(pw), Lwg = plen(wg);
    // route 2: avoid nodes within 2.5 m of route 1 except within 6 m of either end
    const r2 = (p1, s, t) => {
      const av = new Uint8Array(nav.nodes.length), S = nav.nodes[s], T = nav.nodes[t];
      nav.nodes.forEach((n, i) => {
        if (Math.hypot(n.x - S.x, n.z - S.z) < 6 || Math.hypot(n.x - T.x, n.z - T.z) < 6) return;
        for (const k of p1) { const m = nav.nodes[k]; if (Math.hypot(n.x - m.x, n.z - m.z) < 2.5 && Math.abs(n.y - m.y) < 2) { av[i] = 1; break; } }
      });
      const p2 = nav.path(s, t, team, 400000, true, av);
      return p2 ? r1(plen(p2)) : null;
    };
    const pad = pads[team === 0 ? 1 : 0];   // the defenders' pad (Alpha attacks Bravo's)
    const G = nav.nodes[g];
    res['t' + team] = { L: r1(Lpg), weirPct: Math.round((100 * Lpw) / (Lpw + Lwg)), pondWeir: r1(Lpw), weirGate: r1(Lwg), weirGatePctL: Math.round((100 * Lwg) / Lpg),
      route2Weir: r2(pw, a, w), route2Gate: r2(wg, w, g), padGate: r1(Math.hypot(pad.x - G.x, pad.z - G.z)) };
    // the apron: blocks ≥ 1.2 m tall standing within 4 m of the defenders' route from the pad to the Gate, below the deck
    const dp = path(node({ x: pad.x, y: pad.y, z: pad.z }), g, team === 0 ? 1 : 0);
    if (dp) {
      const low = dp.map((k) => nav.nodes[k]).filter((n) => n.y < 1.0);
      const seen = new Set();
      for (const n of low) for (const id of L.queryBlocks(n.x - 4, n.z - 4, n.x + 4, n.z + 4, [])) {
        const b = L.blocks[id]; if (!b.solid || b.rail || b.hidden || b.dynamic) continue;
        const top = b.center.y + b.half.y, bot = b.center.y - b.half.y; if (top - Math.max(bot, 0) < 1.2 || top > 6 || bot > 0.5) continue;
        if (Math.max(b.half.x, b.half.z) > 3) continue;   // (floors and walls aren't apron blocks)
        V.set(n.x, b.center.y, n.z); if (L.distToBlock ? L.distToBlock(b, V) > 4 : Math.hypot(b.center.x - n.x, b.center.z - n.z) > 4 + Math.max(b.half.x, b.half.z)) continue;
        seen.add(b.tag || id);
      }
      res['t' + team].apron = [...seen];
    }
    // named routes through their waypoints
    const named = {};
    for (const [nm, wps] of Object.entries(K.routes || {})) {
      let at = node(f(P3(wps[0]))), tot = 0, ok = at >= 0;
      for (const w2 of wps.slice(1)) { const b = node(f(P3(w2)), 1.5); if (b < 0) { ok = false; named[nm] = 'no node at ' + JSON.stringify(w2); break; } const p = path(at, b, team); if (!p) { ok = false; named[nm] = 'no path to ' + JSON.stringify(w2); break; } tot += plen(p); at = b; }
      if (ok) named[nm] = r1(tot);
    }
    res['t' + team].named = named;
  }
  const t0 = res.t0, t1 = res.t1;
  if (t0 && t1) {
    R('#1 L = Pond → Gate 55–85 m, both teams within 2 %', t0.L >= 55 && t0.L <= 85 && Math.abs(t0.L - t1.L) / t0.L <= 0.02, { L: [t0.L, t1.L] });
    R('#2 weir at 40–55 % of L', [t0, t1].every((t) => t.weirPct >= 40 && t.weirPct <= 55), { pct: [t0.weirPct, t1.weirPct], pondWeir: [t0.pondWeir, t1.pondWeir] });
    R('#3 weir → Gate ≥ 45 % of L and ≥ 25 m', [t0, t1].every((t) => t.weirGatePctL >= 45 && t.weirGate >= 25), { m: [t0.weirGate, t1.weirGate], pctL: [t0.weirGatePctL, t1.weirGatePctL] });
    R('#4 route 2 (2.5 m off route 1) ≤ 1.6× route 1, to the weir and to the Gate', [t0, t1].every((t) => t.route2Weir && t.route2Gate && t.route2Weir <= 1.6 * t.pondWeir && t.route2Gate <= 1.6 * t.weirGate),
      { weir: [[t0.pondWeir, t0.route2Weir], [t1.pondWeir, t1.route2Weir]], gate: [[t0.weirGate, t0.route2Gate], [t1.weirGate, t1.route2Gate]] });
    R('named route hints walk (carrier: no climbs)', [t0, t1].every((t) => Object.values(t.named).every((v) => typeof v === 'number')), { t0: t0.named, t1: t1.named });
    R('#6 pad → Gate 12–20 m; ≥ 2 apron blocks', [t0, t1].every((t) => t.padGate >= 12 && t.padGate <= 20 && (t.apron || []).length >= 2), { padGate: [t0.padGate, t1.padGate], apron: [t0.apron, t1.apron] });
  }
  // #8 the Gate: a level below the pad, in the ±40° cone of the pad → Pond line
  { const pad = pads[1], g = gate, a = Math.atan2(g.z - pad.z, g.x - pad.x), b = Math.atan2(pond.z - pad.z, pond.x - pad.x);
    let d = Math.abs(a - b) * 180 / Math.PI; if (d > 180) d = 360 - d;
    R('#8 Gate y ≤ pad y + 0.2, within 40° of the pad → Pond line', g.y <= pad.y + 0.2 && d <= 40, { gateY: r1(g.y), padY: r1(pad.y), coneDeg: r1(d) }); }
  // #9 / #15 the weir's room
  { let hit = null; const w = weir;
    for (let r = 0; r <= 3.0 && !hit; r += 0.25) for (let k = 0; k < 32 && !hit; k++) for (let y = 0.3; y <= 3.6 && !hit; y += 0.3) {
      const a = (k / 32) * Math.PI * 2; V.set(w.x + r * Math.cos(a), w.y + y, w.z + r * Math.sin(a)); if (L.pointInside(V, 0)) hit = [r1(V.x), r1(V.y), r1(V.z), r];
    }
    R('#15 nothing solid within 3 m of the weir (0.3–3.6 m up)', !hit, { weir: [weir.x, weir.z], hit }); }
  // #14 the Pond
  { let fl = 0, n = 0; for (let r = 4.75; r < 10; r += 0.5) for (let k = 0; k < 64; k++) { const a = (k / 64) * Math.PI * 2, x = r * Math.cos(a), z = r * Math.sin(a); n++; const y = L.groundHeight(x, z, 6); if (y > -1 && !L.pointInside(V.set(x, y + 0.3, z), 0)) fl++; }
    let seen = 0; for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2, x = 7 * Math.cos(a), z = 7 * Math.sin(a); const y = Math.max(L.groundHeight(x, z, 6), 0) + 1.6; let clear = true; for (let t = 0.05; t < 0.95; t += 0.02) { V.set(x + (0 - x) * t, y + (pond.y + 1.3 - y) * t, z + (0 - z) * t); if (L.pointInside(V, 0)) { clear = false; break; } } if (clear) seen++; }
    R('#14 the Pond: ≥ 70 % of the 4.5–10 m ring is floor; the shell (1.3 m up) seen from ≥ 6 of 8 points at 7 m', fl / n >= 0.7 && seen >= 6, { floorPct: Math.round((100 * fl) / n), seenFrom: seen }); }
  R('free zones / noRest polygons', true, { freeZones: K.freeZones.length, noRest: (K.noRest || []).length, signs: K.freeZones.map((z) => z.signs.length) });
  return out;
})()
