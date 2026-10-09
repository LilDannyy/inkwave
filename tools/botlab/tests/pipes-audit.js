// The Tubeway against the built stage (aquarium ENGINE.md §5 rules 9, 12, 13 and step 12; DESIGN.md §6.2's rider picture
// test as a pixel probe): what the blockout-time scripts measured on the plan, re-measured with the engine's real pops,
// landings and looks.
//   MAP=aquarium PAGE=tools/botlab/tests/pipes-audit.js tools/botlab/run.sh tools/botlab/page.cjs
//   PAGE_ARGS='only=pops,cover,sight,glow'
//   • pops (rule 9): from every exit that is ever an exit, pops steered −45 … +45° (7 headings) level and high, the stick
//     held through the flight as a player would: each comes down on walkable floor (not water, not a roof, not the sea,
//     at most 3.4 m under the mouth's floor) inside the 0.8 s shield
//   • cover (rule 12): within 4 m of every landing point cover ≥ 1.0 m tall, and at least two walking ways off it that
//     leave ≥ 90° apart (the nav graph, pipe edges off)
//   • sight (rule 13, restated): every end that is ever IN — its ring (the mouth's centre, 0.15 m out) seen from eye
//     height at ≥ 90 % of the walkable points 2–6 m out within ±30° of its axis, and from ≥ 10 points 10 m or more away
//   • glow (DESIGN.md §6.2): a rider mid-ride lights its tube in its own ink colour where a bystander looks — the Great
//     Tank from the court, the Glass Walk's deck light from the deck through a full coat of the other team's ink, an
//     open-air span from below — a pixel probe at the rider's projected point, with and without the rider
(async () => {
  const g = window.__inkwave, out = [], T0 = performance.now();
  const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info, (k, v) => (typeof v === 'number' ? +v.toFixed(3) : v))) });
  const args = String(window.__pageArgs || ''), only = /only=([\w,]+)/.exec(args)?.[1]?.split(',') || null, part = (p) => !only || only.includes(p);
  const THREE = await import('three');
  const D = await import('./src/world/pipes-data.js');
  const dbg = g.debug, M = g.match, P = M.pipes, L = __G.level, nav = __G.nav, ph = __G.physics;
  if (!P) { R('the stage has the pipe engine (match.pipes)', false); return out; }
  dbg.freeze();
  for (const a of M.actors) { if (a.bot) a.bot.update = () => {}; a.intent.move.set(0, 0, 0); a.intent.fire = a.intent.squid = a.intent.jump = a.intent.sub = a.intent.special = false; }
  const step = (s) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) dbg.step(1000 / 60); };
  const pad = L.spawnPads[1];
  const park = (keep) => M.actors.forEach((a, k) => { if (keep.includes(a)) return; a.pos.set(pad.x + ((k % 4) - 1.5) * 1.7, pad.y, pad.z + (k < 4 ? -1.6 : 1.6)); a.vel.set(0, 0, 0); });
  const ids = [];
  const exits = []; for (const leg of P.legs) for (const k of [0, 1]) if (leg.ends[k].inWhen !== 'never') exits.push([leg, k, leg.ends[1 - k]]);

  // ============================================================================================ rule 9: the pop region
  if (part('pops')) try {
    const A = M.actors.find((a) => a.bot && !a.isLocal);
    park([A]);
    const bad = [], all = [];
    for (const [leg, k, ex] of exits) for (const high of [false, true]) for (const deg of [-45, -30, -15, 0, 15, 30, 45]) {
      for (const a of M.actors) { a.pipeCd = 0; if (a.pipe) P._abort(a, 'audit'); }
      if (!A.alive) A.respawn();
      A.hp = 100; A.invuln = 0;
      const e = leg.ends[k];
      A.pos.set(e.approach[0], e.approach[1], e.approach[2]); A.vel.set(0, 0, 0); dbg.step(1000 / 60);
      P.debugRide(A, leg.id, k);
      const yaw = Math.atan2(ex.out[0], ex.out[2]) + (deg * Math.PI) / 180;
      let n = 0, popN = -1, popT = null, landed = null, dead = false;
      while (n < 600) {
        const p = A.pipe, left = p ? (leg.len - (p.u || 0)) / p.v : 0;
        if (!p || p.phase === 'pop' || left < 0.45) { A.intent.move.set(Math.sin(yaw), 0, Math.cos(yaw)); A.intent.jump = high && (!p || p.phase !== 'pop'); }
        else { A.intent.move.set(0, 0, 0); A.intent.jump = false; }
        dbg.step(1000 / 60); n++;
        if (!A.alive) { dead = true; break; }
        if (A.pipe?.phase === 'pop' && popN < 0) popN = n;
        if (popN >= 0 && !A.pipe) { landed = A.pos.clone(); popT = (n - popN) / 60; break; }
      }
      A.intent.move.set(0, 0, 0); A.intent.jump = false;
      let roof = false, sea = false;
      if (landed) {
        L.queryBlocks(landed.x - 0.05, landed.z - 0.05, landed.x + 0.05, landed.z + 0.05, ids);
        for (const id of ids) { const b = L.blocks[id]; if (b.solid && b.roof && !b.pipe && Math.abs(b.center.y + b.half.y - landed.y) < 0.15 && L.pointInBlock(b, new THREE.Vector3(landed.x, landed.y - 0.05, landed.z), 0)) roof = true; }
        sea = landed.y < L.liquidY(landed.x, landed.z) + 0.2;
      }
      const row = { leg: leg.id, exit: ex.name, high, deg, popT, d: landed ? Math.hypot(landed.x - ex.pos[0], landed.z - ex.pos[2]) : null, dy: landed ? landed.y - ex.floorY : null };
      all.push(row);
      if (!landed || dead || popT > 0.8 || roof || sea || landed.y < ex.floorY - 3.4) bad.push({ ...row, roof, sea, dead });
    }
    R(`rule 9: every pop from every exit (${exits.length} directed legs × 7 headings −45 … +45° × level / high, the stick held) comes down on walkable floor — not water, not a roof, not the sea, ≤ 3.4 m under the mouth — inside the 0.8 s shield`,
      bad.length === 0 && all.length === exits.length * 14, { pops: all.length, bad });
    const far = all.slice().sort((a, b) => b.d - a.d)[0], slow = all.slice().sort((a, b) => b.popT - a.popT)[0], low = all.slice().sort((a, b) => a.dy - b.dy)[0];
    R('rule 9: the farthest pop, the longest airtime, the deepest drop', true, { far, slow, low });
    park([]);
  } catch (err) { R('ERROR in a part: ' + err.message, false, String(err.stack).split('\n').slice(0, 4)); }

  // ============================================================================================ rule 12: exit protection
  if (part('cover')) try {
    const rows = [];
    const seenLand = new Set();
    for (const [, , ex] of exits) {
      if (seenLand.has(ex.i)) continue; seenLand.add(ex.i);
      const lp = new THREE.Vector3(ex.land[0], ex.land[1], ex.land[2]);
      // cover: a solid block (not glass, not a railing, not a pipe) within 4 m whose top stands ≥ 1.0 m over the landing
      let cover = null;
      L.queryBlocks(lp.x - 4, lp.z - 4, lp.x + 4, lp.z + 4, ids);
      for (const id of ids) {
        const b = L.blocks[id];
        if (!b.solid || b.pipe || b.grate || b.bakeClear) continue;
        const top = b.center.y + Math.abs(b.axes[0].y) * b.half.x + Math.abs(b.axes[1].y) * b.half.y + Math.abs(b.axes[2].y) * b.half.z;
        if (top < lp.y + 1.0) continue;
        // (its nearest point to the landing, at the landing's height + 0.5)
        const q = new THREE.Vector3(lp.x, lp.y + 0.5, lp.z).sub(b.center), c = b.center.clone();
        for (let k2 = 0; k2 < 3; k2++) { const ax = b.axes[k2], h = k2 === 0 ? b.half.x : k2 === 1 ? b.half.y : b.half.z; c.addScaledVector(ax, Math.max(-h, Math.min(h, q.dot(ax)))); }
        const d = Math.hypot(c.x - lp.x, c.z - lp.z);
        if (d <= 4 && (!cover || d < cover.d)) cover = { d, tag: b.tag || '#' + id, top: +(top - lp.y).toFixed(2) };
      }
      // ways off: walking from the landing node (pipe edges off), the bearings of the nodes reached 5–8 m out
      const s = nav.nearest(lp, 0.8);
      const dist = new Map([[s, 0]]), q2 = [s], bearings = [];
      while (q2.length) {
        let bi = 0; for (let i = 1; i < q2.length; i++) if (dist.get(q2[i]) < dist.get(q2[bi])) bi = i;
        const u = q2.splice(bi, 1)[0], du = dist.get(u);
        const nu = nav.nodes[u], r = Math.hypot(nu.x - lp.x, nu.z - lp.z);
        if (r >= 5) { bearings.push(Math.atan2(nu.x - lp.x, nu.z - lp.z)); continue; }
        for (const e of nu.nb) { if (e.type === 'pipe' || !nav.valid[e.to]) continue; const nd = du + (e.cost ?? 1); if (nd > 10) continue; if (!dist.has(e.to) || nd < dist.get(e.to)) { if (!dist.has(e.to)) q2.push(e.to); dist.set(e.to, nd); } }
      }
      let spread = 0; for (const a1 of bearings) for (const a2 of bearings) { let d = Math.abs(a1 - a2); if (d > Math.PI) d = 2 * Math.PI - d; spread = Math.max(spread, d); }
      rows.push({ exit: `${P.legs[ex.leg].id}:${ex.k ? 'B' : 'A'} ${ex.name}`, cover, ways: bearings.length, spreadDeg: Math.round((spread * 180) / Math.PI) });
    }
    R('rule 12: within 4 m of every landing cover ≥ 1.0 m tall, and walking ways off it that leave ≥ 90° apart (pipe edges off)', rows.every((r) => r.cover && r.spreadDeg >= 90), rows);
  } catch (err) { R('ERROR in a part: ' + err.message, false, String(err.stack).split('\n').slice(0, 4)); }

  // ============================================================================================ rule 13: no hidden mouths
  if (part('sight')) try {
    const eye = new THREE.Vector3(), tgt = new THREE.Vector3(), rows = [];
    for (const e of P.ends) {
      if (e.inWhen === 'never') continue;
      tgt.set(e.pos[0] + e.out[0] * 0.15, e.pos[1], e.pos[2] + e.out[2] * 0.15);
      let near = 0, nearSeen = 0, far = 0; const hid = [];
      for (let i = 0; i < nav.nodes.length; i++) {
        if (!nav.valid[i]) continue;
        const n = nav.nodes[i], dx = n.x - e.pos[0], dz = n.z - e.pos[2], d = Math.hypot(dx, dz);
        if (Math.abs(n.y - e.floorY) > 3 && d < 6) continue;
        eye.set(n.x, n.y + 1.5, n.z);
        const along = (dx * e.out[0] + dz * e.out[2]) / (d || 1);
        if (d >= 2 && d <= 6 && along >= Math.cos(Math.PI / 6) && Math.abs(n.y - e.floorY) < 0.5) {
          near++;
          if (ph.los(eye, tgt)) nearSeen++;
          else { const h = ph.segment(eye, tgt, undefined, false); hid.push(h.hit ? L.blocks[h.block].tag || '#' + h.block : '?'); }
        } else if (d >= 10 && along > 0 && ph.los(eye, tgt)) far++;
      }
      rows.push({ end: `${P.legs[e.leg].id}:${e.k ? 'B' : 'A'} ${e.name}`, near, pct: near ? +(nearSeen / near).toFixed(3) : 0, far, hiddenBy: [...new Set(hid)] });
    }
    R('rule 13 (restated): every end that is ever IN is seen from eye height at ≥ 90 % of the floor 2–6 m in front (±30°) and from ≥ 10 points 10 m+ away', rows.every((r) => r.near > 0 && r.pct >= 0.9 && r.far >= 10), rows);
  } catch (err) { R('ERROR in a part: ' + err.message, false, String(err.stack).split('\n').slice(0, 4)); }

  // ============================================================================================ the rider's glow, in pixels
  if (part('glow')) try {
    // the game's own frame (its post, tone mapping and output colour), read straight after debug.step renders it
    const gl = __G.renderer.getContext();
    const readAt = (p) => {
      const v = p.clone().project(__G.camera), W = gl.drawingBufferWidth, H = gl.drawingBufferHeight;
      const x = Math.round((v.x + 1) / 2 * W), y = Math.round((v.y + 1) / 2 * H), n = 7, px = new Uint8Array(n * n * 4);
      gl.readPixels(x - 3, y - 3, n, n, gl.RGBA, gl.UNSIGNED_BYTE, px);
      let r = 0, gg = 0, bb = 0; for (let i = 0; i < px.length; i += 4) { r += px[i]; gg += px[i + 1]; bb += px[i + 2]; }
      return new THREE.Color(r / n / n / 255, gg / n / n / 255, bb / n / n / 255);
    };
    const hsl = (c) => { const o = {}; c.getHSL(o); return o; };
    const hueD = (a, b) => { let d = Math.abs(a - b); if (d > 0.5) d = 1 - d; return d * 360; };
    const srgb = (t) => { const c = __G.teamColors[t].clone(); c.convertLinearToSRGB?.(); return c; };
    const rider = M.actors.find((a) => a.bot && a.team === 1), other = 0;
    const V = (a) => new THREE.Vector3(a[0], a[1], a[2]);
    const shotCam = (from, look) => { g.rig.cinematic(V(from), V(from), V(look), V(look), 99, () => {}); };
    const probe = (name, legId, k, u, from, look, prep) => {
      park([rider]);
      for (const a of M.actors) { a.pipeCd = 0; if (a.pipe) P._abort(a, 'audit'); }
      if (prep) prep();
      const lg = P.legs.find((l) => l.id === legId), e = lg.ends[k];
      shotCam(from, look);
      rider.pos.set(e.approach[0], e.approach[1], e.approach[2]); step(0.1);
      P.debugRide(rider, legId, k);
      for (let i = 0; i < 400 && rider.pipe && !(rider.pipe.phase === 'ride' && rider.pipe.u >= u); i++) dbg.step(1000 / 60);
      dbg.step(1000 / 60);
      // where the glow is: on the rider (its body is drawn there too), on the glass over it, 1 m back on its trail; on a
      // run under a deck, on the deck light straight above it
      const p = rider.pipe, q = {}, pins = [];
      if (lg.look.deckLight && from[1] > lg.look.deckLight[4] + 0.5) pins.push(['deck', new THREE.Vector3(rider.pos.x, lg.look.deckLight[4] + 0.02, rider.pos.z)]);
      else {
        pins.push(['rider', new THREE.Vector3(rider.pos.x, rider.pos.y + 0.3, rider.pos.z)]);
        pins.push(['glass over it', new THREE.Vector3(rider.pos.x, rider.pos.y + 1.0, rider.pos.z)]);
        D.legAt(lg, Math.max(0, Math.min(lg.len, p.s - p.dir * 1.0)), q); pins.push(['trail 1 m', new THREE.Vector3(q.x, q.y, q.z)]);
      }
      const on = pins.map(([, v]) => readAt(v));
      // the same view with nobody in the tube
      P._abort(rider, 'audit'); park([]); dbg.step(1000 / 60);
      const off = pins.map(([, v]) => readAt(v));
      const tc = srgb(rider.team), hT = hsl(tc);
      // (hue tells a team apart: the rider's within 30° of its team's colour and saturated; nobody inside, it isn't)
      const rows = pins.map(([w], i) => { const a1 = hsl(on[i]), a0 = hsl(off[i]); return { at: w, on: '#' + on[i].getHexString(), off: '#' + off[i].getHexString(), hueOn: Math.round(hueD(a1.h, hT.h)), satOn: +a1.s.toFixed(2), hueOff: Math.round(hueD(a0.h, hT.h)), satOff: +a0.s.toFixed(2), ok: hueD(a1.h, hT.h) <= 30 && a1.s >= 0.25 && (hueD(a0.h, hT.h) > 45 || a1.s > a0.s + 0.15) }; });
      R(`glow: ${name}: the rider's own ink colour where it rides (hue within 30° of its team's and saturated, where the same spot with nobody inside is not)`, rows.some((r) => r.ok),
        { team: '#' + tc.getHexString(), other: '#' + srgb(other).getHexString(), rows });
    };
    // the Great Tank from the court, 12.5 m south of the Gulper Run's middle, at eye height
    probe('the Gulper Run through the Great Tank\'s side glass, from the court (12.5 m)', 'gulper', 0, 12.5, [0, 1.6, -12.5], [0, 0.9, 0]);
    // the Glass Walk from the deck, through a full coat of the other team's ink
    probe('the Gulper Run under the Glass Walk, from the deck (6.5 m), through a full coat of the other team\'s ink', 'gulper', 0, 12.5, [0, 4.0, -6.5], [0, 2.4, 0],
      () => { for (let x = -8; x <= 8; x += 0.8) for (let z = -2; z <= 2; z += 0.8) __G.paint.splat(new THREE.Vector3(x, 2.5, z), 1.0, other, { seed: 0.5 }); });
    // an open-air span: Bravo's Express over the Gate Terrace, from the terrace below
    probe('the Express\'s open-air span, from the Gate Terrace below (about 12 m)', 'express~', 0, 30, [-1, 1.6, 31], [-5, 8, 37]);
    g.rig.follow(M.local || M.actors[0], true);
    park([]);
  } catch (err) { R('ERROR in a part: ' + err.message, false, String(err.stack).split('\n').slice(0, 4)); }

  R(`(ran in ${((performance.now() - T0) / 1000).toFixed(0)} s)`, true);
  return out;
})();
