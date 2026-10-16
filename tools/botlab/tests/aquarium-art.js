// Gulper Aquarium's art pass (tools/botlab/jobs/batch5/stages/aquarium, the art phase): the dressing adds no collider, the
// stand-ins it draws are hidden off-limits blocks with no paint, the stage surfaces and murals are the stage's, the
// glass / water / fish / jellies / penguins / bathysphere are in the scene, and Feeding Time (looks only) runs at 1:00
// left: the bathysphere bobs, the bell rings, the krill drift, the Great Tank's sharks wheel faster — and nothing a player
// can touch changes (the clock, every actor's hp and position, the turf). Fix round 3 (section 7): the touch pools'
// dressing keeps to the pool block, the reef and the pools' water are one mesh, the rays are eagle rays, the Deep Dome's tube
// is unlit, the Fin Pavilion's fascia is dressed off the deck. Fix round 4 (section 8): the Lookouts and telescope bays are
// drawn under the ink (render, skirting, speed lines, portholes) and the ink still shows on them, their props and the
// planters' stand within 8.5 cm of their faces and off their walkable tops, the planters' faces are cream stone, the touch
// pools' rockery breaks their outline at every corner and along the rim. Fix round 5 (section 9, the complete eye-level sweep): Penguin Point's
// rock faces and tops, the ice pile, the pump sets, the dais, the Ticket Hall, the stairs' flanks, the Kelp Balconies, the
// pavilion's flank walls and the deckchair stacks are dressed under the ink (pixel reads, both halves), this round's props
// stand within 8.5 cm of what they dress and off its walkable top, the grand stair has its granite nosing.
//   MAP=aquarium MODE=turf PAGE=tools/botlab/tests/aquarium-art.js tools/botlab/run.sh tools/botlab/page.cjs
(async () => {
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info });
  const g = window.__inkwave, G = window.__G, L = G.level, m = g.match;
  // 1. the dressing: a headless build of every placement — no colliders
  const { PropKit } = await import('./src/world/props.js');
  const { dressingFor } = await import('./src/world/dressing.js');
  const kit = new PropKit(null, { headless: true });
  let cols = 0, n = 0, types = new Set();
  for (const it of dressingFor('aquarium')) { const r = kit.add(it.type, it); cols += r.colliders.length; n++; types.add(it.type); }
  R('the dressing adds no collider (props are visual only)', n > 100 && cols === 0, { placements: n, types: types.size, colliders: cols });
  // 2. the stand-ins it draws: hidden, off-limits, no paint, solid (they stand as solid as the blockout's)
  const STAND = ['jelly', 'bubble-column', 'reef-window', 'lamp-column', 'coral', 'clam', 'helmet', 'lectern', 'post-box', 'buckets', 'feeding-chute', 'outcrop', 'forklift', 'gulper-head', 'gulper-neck'];
  const st = L.blocks.filter((b) => STAND.includes(b.tag));
  const bad = st.filter((b) => !b.hidden || !b.roof || !b.solid || b.faces.some((f) => f >= 0 && L.faces[f].paintable));
  R('every stand-in drawn by the dressing is a hidden, solid, off-limits block with no paint', st.length >= 60 && bad.length === 0, { n: st.length, bad: bad.slice(0, 5).map((b) => b.tag) });
  // 3. the stage surfaces and murals
  const SURF = (await import('./src/world/stages/aquarium/surfaces.js')).SURF;
  const used = new Set(L.blocks.filter((b) => !b.hidden).map((b) => b.pattern));
  R('the stage surfaces (terrazzo, teak, render on slots 67–69) carry the floors and walls', [SURF.terrazzo, SURF.teak, SURF.render].every((s) => used.has(s)), { SURF });
  const mt = g.murals?.userData;
  R('the stage murals are drawn (ids 4–11: portholes, the glass board, sea salt, feeding deck, hazard, the hoppers, the hatches, the ticket machines)', mt?.stage === 'aquarium' && [4, 5, 6, 7, 8, 9, 10, 11].every((i) => mt.murals[i] && mt.murals[i].rect[2] > 0), { stage: mt?.stage });
  const muralFaces = {}; for (const f of L.faces) if (f.mural >= 4) muralFaces[f.mural] = (muralFaces[f.mural] || 0) + 1;
  R('the murals sit on faces (portholes on the promenades\' court faces, the board, the crates, the riser, the bund; the hoppers\' and hatches\' faces toward the deck\'s middle, the ticket machines)', muralFaces[4] >= 20 && muralFaces[5] >= 2 && muralFaces[6] >= 6 && muralFaces[7] >= 2 && muralFaces[8] >= 2 && muralFaces[9] >= 8 && muralFaces[10] >= 8 && muralFaces[11] >= 4, muralFaces);
  // 3b. the floor art (floorart.js through the pipe engine's levelMaterial hook): in the level program, and the plaza's
  // compass rose shows (its brass hub against the terrazzo 3 m off it, seen from above)
  {
    const key = g.levelMat?.customProgramCacheKey?.() || '';
    const gl = G.renderer.getContext(), V = (a) => new G.camera.position.constructor(a[0], a[1], a[2]);
    const { W } = await import('./src/world/stages/aquarium/geo.js');
    const [rx, rz] = W(24.9, 2.6);
    g.rig.cinematic(V([rx + 0.3, 9, rz + 0.3]), V([rx + 0.3, 9, rz + 0.3]), V([rx, 0, rz]), V([rx, 0, rz]), 99, () => {});
    for (let i = 0; i < 30; i++) g.debug.step(1000 / 60);
    const px = (p) => { const v = V(p).project(G.camera), w = gl.drawingBufferWidth, h = gl.drawingBufferHeight, a = new Uint8Array(4); gl.readPixels(Math.round((v.x + 1) / 2 * w), Math.round((v.y + 1) / 2 * h), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, a); return [...a.slice(0, 3)]; };
    const hub = px([rx, 0, rz]), off = px([rx - 3.2, 0, rz + 0.4]);
    const d = Math.abs(hub[0] - off[0]) + Math.abs(hub[1] - off[1]) + Math.abs(hub[2] - off[2]);
    R('the floor art is in the level program (key -aqart) and the ferry plaza\'s compass rose shows (its brass hub ≠ the terrazzo 3 m off)', /-aqart/.test(key) && d > 40, { key, hub, off });
  }
  // 4. the looks in the scene
  const names = new Set(); G.scene.traverse((o) => { if (o.name) names.add(o.name); });
  const want = ['aq-glass', 'aq-water', 'aq-kelp', 'aq-swimmers', 'aq-jellies', 'aq-colbubbles', 'aq-krill', 'aq-bathysphere', 'aq-dome-streak'];
  R('the glass, water, fish and penguins (one mesh), jellies, bubble columns, krill, bathysphere and the Deep Dome\'s streak are built', want.every((w) => names.has(w)), { missing: want.filter((w) => !names.has(w)) });
  let sw = null; G.scene.traverse((o) => { if (o.name === 'aq-swimmers') sw = o; });
  const nAttr = sw ? Object.keys(sw.geometry.attributes).length : 0;
  R('every fish and penguin swims in one draw call (sharks, rays, the turtle, reef fish, garibaldi, the silver school, penguins), within 8 vertex attributes',
    sw && sw.geometry.isInstancedBufferGeometry && !sw.isInstancedMesh && sw.geometry.instanceCount >= 120 && nAttr <= 8,
    { swimmers: sw?.geometry.instanceCount, verts: sw?.geometry.attributes.position.count, attributes: sw ? Object.keys(sw.geometry.attributes) : null });
  // 4b. every program links and the frames raise no GL error (LEAD-REVIEW art round 1: the swimmers' program failed to
  // link — 16 attributes — and every frame logged "useProgram: program not valid", which page.cjs never sees; a GL error
  // flag after the frames catches it, and so does LINK_STATUS)
  {
    const gl = G.renderer.getContext(), V = (a) => new G.camera.position.constructor(a[0], a[1], a[2]);
    // the Great Tank from its south viewing step at eye height, then the Arch Tank overhead from the hall, the penguin cove
    // and a Reef Window: every looks program compiles in these views
    const views = [[[0.6, 1.5, -11.5], [0, 1.3, 0]], [[0.5, 1.6, -29], [0, 7.6, -22.5]], [[-6.2, 3.0, -43.5], [-14.8, 0.6, -46.8]], [[18, 1.6, -9], [24.5, 1.8, -20.8]], [[-10, 1.7, -9.2], [-9, 1.3, -14.3]]];
    while (gl.getError() !== gl.NO_ERROR) { /* clear */ }
    for (const [from, look] of views) { g.rig.cinematic(V(from), V(from), V(look), V(look), 99, () => {}); for (let i = 0; i < 3; i++) g.debug.step(1000 / 60); }
    const err = gl.getError();
    const bad = [];
    for (const p of G.renderer.info.programs || []) if (!gl.getProgramParameter(p.program, gl.LINK_STATUS)) bad.push({ name: p.name, log: (gl.getProgramInfoLog(p.program) || '').slice(0, 160) });
    R('every shader program links, and the frames raise no GL error (the swimmers draw)', bad.length === 0 && err === gl.NO_ERROR, { programs: (G.renderer.info.programs || []).length, bad, glError: err });
    // the sharks show in the Great Tank: the view from the south viewing step with the swimmers on, then off — they change
    // a share of the tank's pixels (dark grey bodies against the water)
    const readBox = () => {
      const W = gl.drawingBufferWidth, H = gl.drawingBufferHeight, x0 = Math.round(W * 0.2), y0 = Math.round(H * 0.3), w = Math.round(W * 0.6), h = Math.round(H * 0.35);
      const px = new Uint8Array(w * h * 4); gl.readPixels(x0, y0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px); return px;
    };
    const tankView = views[0];
    g.rig.cinematic(V(tankView[0]), V(tankView[0]), V(tankView[1]), V(tankView[1]), 99, () => {});
    for (let i = 0; i < 40; i++) g.debug.step(1000 / 60);   // (the camera settles on the shot)
    const on = readBox();
    sw.visible = false; g.debug.step(1000 / 60);
    const off = readBox();
    g.debug.step(1000 / 60);
    const off2 = readBox();
    sw.visible = true; g.debug.step(1000 / 60);
    const diff = (a, b) => { let n = 0; for (let i = 0; i < a.length; i += 4) if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 30) n++; return n / (a.length / 4); };
    const share = diff(on, off), noise = diff(off, off2);
    R('the sharks, the ray, the turtle and the silver school show in the Great Tank from its viewing step (swimmers on vs off: ≥ 1.5 % of the tank\'s pixels change, over the frame-to-frame noise)', share - noise >= 0.015, { changedShare: +share.toFixed(4), noise: +noise.toFixed(4) });
  }
  // 6. art round 2 (LEAD-REVIEW art round 2)
  {
    const meshVerts = (pred, fn) => { G.scene.traverse((o) => { if (o.isMesh && pred(o)) { const P = o.geometry.attributes.position, e = o.matrixWorld.elements; for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i), z = P.getZ(i); fn(e[0] * x + e[4] * y + e[8] * z + e[12], e[1] * x + e[5] * y + e[9] * z + e[13], e[2] * x + e[6] * y + e[10] * z + e[14]); } } }); };
    // (a) the glass panes stand clear of the walls and lids they met (the shark tunnel's hatched staircase and streaks
    // were the Arch Tank's glass z-fighting the pylon walls at x ±6 and the lid's underside at 9.0)
    // (a box's corners: the Arch Tank's top corners, above the riser shafts' glazing that tops out at 8.4)
    let gx = 0, gy = 0; meshVerts((o) => o.name === 'aq-glass', (x, y, z) => { if (Math.abs(z) > 18.9 && Math.abs(z) < 31.1 && y > 8.5 && y < 9.2 && Math.abs(x) < 6.2) { gx = Math.max(gx, Math.abs(x)); gy = Math.max(gy, y); } });
    R('the Arch Tanks\' glass is drawn inside its collider, off the hall\'s pylon walls (|x| < 6) and the lid (y < 9.0): no coplanar faces to z-fight', gx > 5.9 && gx < 5.995 && gy > 8.9 && gy < 8.995, { maxX: +gx.toFixed(3), maxY: +gy.toFixed(3) });
    // (b) the gulper heads' jaws stay at their face: nothing of the dressing stands on the mouth's approach (it reached
    // x 13.2 at the floor: the chin bar and the jaw bones' ends)
    let jx = 0; meshVerts((o) => /^props:/.test(o.name), (x, y, z) => { if (Math.abs(z) < 1.6 && y < 2.7 && Math.abs(x) > 12 && Math.abs(x) < 14.5) jx = Math.max(jx, Math.abs(x)); });
    R('nothing of a gulper head stands more than 0.2 m in front of its collider\'s face (x 12.7): the jaws are off the mouth\'s approach', jx > 12.6 && jx <= 12.9, { maxX: +jx.toFixed(3) });
    // (c) the wing's small dressing is solid: the benches, the A-boards and the luggage are hidden off-limits blocks, the
    // ferry queue's rope a rail (it was drawn with no collider: players ran through it)
    const tagged = (t) => L.blocks.filter((b) => b.tag === t);
    const solid = ['bench', 'aboard', 'luggage'].map((t) => [t, tagged(t)]), rope = tagged('queue-rope');
    R('the bench, the A-boards and the luggage stand on hidden, solid, off-limits blocks; the queue rope is a rail', solid.every(([t, l]) => l.length >= 2 && l.every((b) => b.hidden && b.solid && b.roof)) && rope.length === 2 && rope.every((b) => b.rail),
      { counts: Object.fromEntries(solid.map(([t, l]) => [t, l.length])), rope: rope.length });
    // (d) the deck stair's flanks are dressed (floorart.js): a porthole into the tank reads dark blue-green against the white
    // render beside it (the bare stonestep flank was one flat grey)
    {
      const gl = G.renderer.getContext(), V = (a) => new G.camera.position.constructor(a[0], a[1], a[2]);
      const ax = [-Math.SQRT1_2, -Math.SQRT1_2], pr = [Math.SQRT1_2, -Math.SQRT1_2], at = (t, y, l) => [t * ax[0] + l * pr[0], y, t * ax[1] + l * pr[1]];
      const cam = at(9.2, 1.1, -5.5), look = at(9.2, 0.8, -2.0);
      g.rig.cinematic(V(cam), V(cam), V(look), V(look), 99, () => {});
      for (let i = 0; i < 20; i++) g.debug.step(1000 / 60);
      const px = (p) => { const v = V(p).project(G.camera), w = gl.drawingBufferWidth, h = gl.drawingBufferHeight, a = new Uint8Array(4); gl.readPixels(Math.round((v.x + 1) / 2 * w), Math.round((v.y + 1) / 2 * h), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, a); return [...a.slice(0, 3)]; };
      // (the porthole's water, clear of its jelly and fish; the render under the speed lines beside it)
      const port = px(at(8.38, 0.76, -2.0)), wall = px(at(10.0, 0.4, -2.0)), lum = (c) => 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2];
      R('the deck stair\'s flank is dressed: a porthole reads dark blue-green against the render beside it', lum(port) < 0.75 * lum(wall) && port[1] > 2 * port[0] && port[2] > 2 * port[0], { port, wall });
    }
    // (e) the moon-jelly columns are the traced shader (art round 2), not the printed one
    let jm = null; G.scene.traverse((o) => { if (o.name === 'aq-jellies') jm = o.material; });
    R('the moon-jelly columns trace their inside (aq-jelly3)', jm && jm.customProgramCacheKey?.() === 'aq-jelly3', { key: jm?.customProgramCacheKey?.() });
  }
  // 7. fix round 3 (LEAD-NOTES 2026-10-16): dressing and shaders only
  {
    const meshVerts = (pred, fn) => { G.scene.traverse((o) => { if (o.isMesh && pred(o)) { const P = o.geometry.attributes.position, e = o.matrixWorld.elements; for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i), z = P.getZ(i); fn(e[0] * x + e[4] * y + e[8] * z + e[12], e[1] * x + e[5] * y + e[9] * z + e[13], e[2] * x + e[6] * y + e[10] * z + e[14], o, i); } } }); };
    // (a) the touch pools' dressing (rockery skin, boulders, panels, handrail, sign) keeps within 8.5 cm of the pool
    // block's faces or over its top: nothing reaches out over the walkable dais (both halves)
    let far = 0, nOn = 0, at = null;
    meshVerts((o) => /^props:/.test(o.name), (x, y, z, o) => {
      for (const s of [1, -1]) {
        const px = s * x, pz = s * z;   // (the twin turned onto Alpha's pool)
        if (px < -12.0 || px > -6.0 || pz < -16.0 || pz > -12.6 || y < 0.98 || y > 2.4) continue;
        const dx = Math.max(-11.5 - px, 0, px + 6.5), dz = Math.max(-15.6 - pz, 0, pz + 13.0), d = Math.hypot(dx, dz);
        nOn++; if (d > far) { far = d; at = [+x.toFixed(2), +y.toFixed(2), +z.toFixed(2), o.name]; }
      }
    });
    R('the touch pools\' dressing stands within 8.5 cm of the pool block or over it: nothing out on the dais', nOn > 2000 && far <= 0.085, { verts: nOn, farthest: +far.toFixed(3), at });
    // (b) the Reef Windows' reef and the touch pools' panels: one mesh (one draw call) for both halves — the reef lit (kind
    // 0), the panels' water traced (kind 1: eight panels and four portholes), the lid lamps (kind 2), the clownfish circling
    // their anemones (kind 3) — with its own glow
    let ex = null; G.scene.traverse((o) => { if (o.name === 'aq-exhibits') ex = o; });
    const kinds = [0, 0, 0, 0]; let reefN = 0;
    if (ex) { const E = ex.geometry.attributes.aEx.array, P = ex.geometry.attributes.position.array; for (let i = 0, v = 0; i < E.length; i += 4, v++) { kinds[Math.round(E[i])]++; if (E[i] === 0 && Math.hypot(P[v * 3], P[v * 3 + 2]) > 30.5) reefN++; } }
    R('the reef and the touch pools\' water are one mesh, both halves: a reef in both windows, its clownfish, eight panels and four portholes traced, the lid lamps, its own glow', !!ex && ex.material.customProgramCacheKey?.() === 'aq-exhibits2' && kinds[1] === 2 * (4 * 6 + 2 * 60) && kinds[2] > 0 && kinds[3] > 1000 && reefN > 50000 && typeof ex.material.userData.glow === 'number',
      { kinds, reefVerts: reefN, tris: ex ? ex.geometry.attributes.position.count / 3 : 0 });
    // (c) the rays are eagle rays: their span about twice their body's length, a pale belly (seen from the tunnel floor)
    let sw = null; G.scene.traverse((o) => { if (o.name === 'aq-swimmers') sw = o; });
    let x0 = 9, x1 = -9, z0 = 9, z1 = -9, belly = 0, nb = 0;
    if (sw) { const A = sw.geometry.attributes, P = A.position, C = A.color, N = A.normal, V = A.aV; for (let i = 0; i < P.count; i++) { if (Math.round(V.getW(i)) !== 1 || V.getY(i) === 0) continue; x0 = Math.min(x0, P.getX(i)); x1 = Math.max(x1, P.getX(i)); z0 = Math.min(z0, P.getZ(i)); z1 = Math.max(z1, P.getZ(i)); if (N.getY(i) < -0.5) { belly += 0.2126 * C.getX(i) + 0.7152 * C.getY(i) + 0.0722 * C.getZ(i); nb++; } } }
    const span = x1 - x0, body = z1 - z0;
    R('the rays are eagle rays: the wings span about twice the body\'s length, pointed tips, a pale belly', span > 1.7 * body && span < 2.6 * body && nb > 20 && belly / nb > 0.55, { span: +span.toFixed(2), body: +body.toFixed(2), belly: +(belly / Math.max(1, nb)).toFixed(2) });
    // (d) the Deep Dome's tube is unlit glass (it read as a white bar at dusk); small lamps on its collars light it
    const { SCENERY_KIT } = await import('./src/world/environment.js'), THREE = await import('three');
    const { buildFar } = await import('./src/world/stages/aquarium/far.js');
    const C30 = Math.cos(Math.PI / 6), far0 = buildFar({ ...SCENERY_KIT, THREE }, { W: (s, w) => [0.5 * s + C30 * w, -32.5 - C30 * s + 0.5 * w] });
    let tubeGlow = -1, lamps = 0;
    for (const gg of far0.static) { gg.computeBoundingBox(); const b = gg.boundingBox, gl0 = Math.max(...gg.attributes.glow.array); if (b.max.x - b.min.x > 150 && b.max.y - b.min.y < 12) tubeGlow = Math.max(tubeGlow, gl0); else if (b.max.x - b.min.x < 0.4 && b.min.y > 3 && gl0 > 0.3) lamps++; }
    R('the Deep Dome\'s tube is unlit glass, with a small lamp on each of its nine collars', tubeGlow === 0 && lamps === 9, { tubeGlow, lamps });
    // (e) the Fin Pavilion's plaza fascia is dressed (pilasters, frieze, skirting, portholes, roundels) from 4–8 cm in front of
    // its face, nothing on the spawn deck's walkable top (3.38)
    let nf = 0, out = 0, top = 0;
    meshVerts((o) => /^props:/.test(o.name), (x, y, z) => {
      for (const s of [1, -1]) {
        const X = s * x, Z = s * z, dz = Z + 32.5, bs = 0.5 * X - C30 * dz, bw = C30 * X + 0.5 * dz;
        if (bs < 30.85 || bs > 31.0 || Math.abs(bw) > 13.05 || y < -0.1) continue;
        nf++; out = Math.max(out, 31.0 - bs); top = Math.max(top, y);
      }
    });
    R('the Fin Pavilion\'s plaza fascia is dressed within 8.5 cm of its face and below the spawn deck\'s top', nf > 1000 && out <= 0.085 && top < 3.36, { verts: nf, proud: +out.toFixed(3), top: +top.toFixed(3) });
  }
  // 8. fix round 4 (LEAD-REVIEW art round 4): dressing and shaders only
  {
    const gl = G.renderer.getContext(), V = (a) => new G.camera.position.constructor(a[0], a[1], a[2]);
    const { LOOKOUT: LK, TBAY: TB, PLANTERS: PL, TOUCH: TP, W: Wb } = await import('./src/world/stages/aquarium/geo.js');
    const DEG = Math.PI / 180, dir = (a) => [Math.cos(a * DEG), Math.sin(a * DEG)], C30 = Math.cos(30 * DEG);
    const lum = (c) => 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2];
    const px = (p) => { const v = V(p).project(G.camera), w = gl.drawingBufferWidth, h = gl.drawingBufferHeight, a = new Uint8Array(4 * 9); gl.readPixels(Math.round((v.x + 1) / 2 * w) - 1, Math.round((v.y + 1) / 2 * h) - 1, 3, 3, gl.RGBA, gl.UNSIGNED_BYTE, a); const c = [0, 0, 0]; for (let i = 0; i < 9; i++) for (let k = 0; k < 3; k++) c[k] += a[i * 4 + k] / 9; return c.map(Math.round); };
    const shot = (from, look, n = 24) => { g.rig.cinematic(V(from), V(from), V(look), V(look), 99, () => {}); for (let i = 0; i < n; i++) g.debug.step(1000 / 60); };
    g.debug.freeze?.();
    const tw = (p, s) => [s * p[0], p[1], s * p[2]];   // (Alpha's point turned onto Bravo's twin)
    // (a) the Lookout's sea face, both halves: white render over a black-granite skirting with faience speed lines (it was
    // one dark brown slab); then team ink splatted on it still shows (the art is under the ink)
    const [dL0, dL1] = dir(LK.a), pL = [-dL1, dL0], atL = (u, v, y) => [dL0 * u + pL[0] * v, y, dL1 * u + pL[1] * v];
    const look = [], inked = [];
    for (const s of [1, -1]) {
      G.paint.clear?.();
      shot(tw(atL(LK.r1 + 2.6, 0.3, 3.0), s), tw(atL(LK.r1, 0.3, 2.95), s));
      const body = px(tw(atL(LK.r1, 0.55, 2.72), s)), skirt = px(tw(atL(LK.r1, 0.55, 2.47), s)), line = px(tw(atL(LK.r1, 0.55, 3.13), s));
      look.push({ body, skirt, line });
      G.paint.splat(V(tw(atL(LK.r1 + 0.05, 0.55, 2.72), s)), 0.45, 0, { instant: true });
      for (let i = 0; i < 6; i++) g.debug.step(1000 / 60);
      const ink = px(tw(atL(LK.r1, 0.55, 2.72), s));
      inked.push({ ink, moved: Math.abs(ink[0] - body[0]) + Math.abs(ink[1] - body[1]) + Math.abs(ink[2] - body[2]) });
    }
    G.paint.clear?.();
    R('the Lookouts\' sea faces are dressed (both halves): white render over a black-granite skirting, faience speed lines', look.every((c) => lum(c.body) > lum(c.skirt) + 40 && lum(c.body) > 2.5 * lum(c.skirt) && c.line[1] > c.line[0] + 6), look);
    R('ink splatted on a Lookout\'s face shows over its dressing (the art is under the ink)', inked.every((c) => c.moved > 90), inked);
    // (b) the telescope bay's riser, both halves: render over a granite kerb (it was one dark brown slab)
    const [dB0, dB1] = dir(TB.a), pB = [-dB1, dB0], atB = (u, v, y) => [dB0 * u + pB[0] * v, y, dB1 * u + pB[1] * v];
    const bay = [];
    for (const s of [1, -1]) {
      shot(tw(atB(TB.r0 - 2.2, 2.3, 3.3), s), tw(atB(TB.r0, 2.3, 2.7), s));
      bay.push({ riser: px(tw(atB(TB.r0, 2.3, 2.63), s)), kerb: px(tw(atB(TB.r0, 2.3, 2.46), s)) });
    }
    R('the telescope bays\' risers are dressed (both halves): render over a granite kerb', bay.every((c) => lum(c.riser) > lum(c.kerb) + 40), bay);
    // (c) the deck planters' faces are cream cast stone (they were green boxes): red over blue, red at least green
    const dp = [];
    for (const s of [1, -1]) {
      // (its face toward mid, 0.6 m off its plate, between the speed lines and the coping)
      const b = PL.box[1], wm = (b.w[0] + b.w[1]) / 2, [fx, fz] = Wb(b.s[0], wm + 0.6), [cx, cz] = Wb(b.s[0] - 3, wm + 0.6);
      shot(tw([cx, b.y0 + 1.0, cz], s), tw([fx, b.y0 + 0.6, fz], s));
      dp.push({ body: px(tw([fx, b.y0 + 0.78, fz], s)), plinth: px(tw([fx, b.y0 + 0.06, fz], s)) });
    }
    R('the spawn decks\' planters are dressed, not green boxes (both halves): cast stone over a granite plinth, not green', dp.every((c) => lum(c.body) > lum(c.plinth) + 35 && c.body[1] - Math.max(c.body[0], c.body[2]) < 5), dp);
    // (d) the props this round adds stand within 8.5 cm of the faces they dress and off the walkable tops: the Lookout (its
    // deck 3.6), the telescope bay (3.0), every planter (its top)
    const meshVerts = (pred, fn) => { G.scene.traverse((o) => { if (o.isMesh && pred(o)) { const P = o.geometry.attributes.position, e = o.matrixWorld.elements; for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i), z = P.getZ(i); fn(e[0] * x + e[4] * y + e[8] * z + e[12], e[1] * x + e[5] * y + e[9] * z + e[13], e[2] * x + e[6] * y + e[10] * z + e[14]); } } }); };
    // (the props of these builders alone, both halves: a headless kit keeps every part's geometry and placement)
    const { PropKit: PK } = await import('./src/world/props.js'), { dressingFor: DF } = await import('./src/world/dressing.js');
    const kit4 = new PK(null, { headless: true });
    for (const it of DF('aquarium')) if (['aquarium_promenade', 'aquarium_planterdeco', 'aquarium_planterdress'].includes(it.type)) kit4.add(it.type, it);
    const ownVerts = (fn) => { const v = new G.camera.position.constructor(); for (const parts of kit4._buckets.values()) for (const p of parts) { const P = p.g.attributes.position; for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i).applyMatrix4(p.m); fn(v.x, v.y, v.z); } } };
    const st = { lookOut: 0, lookOn: 0, bayOut: 0, bayOn: 0, plOut: 0, plOn: 0, n: 0, atL: null, atB: null, atP: null, atBon: null };
    ownVerts((x, y, z) => {
      for (const s of [1, -1]) {
        const X = s * x, Z = s * z;
        // the Lookout: outside its footprint by up to 0.15 m (its faces' dressing), or over its walkable deck
        { const u = X * dL0 + Z * dL1, v = X * pL[0] + Z * pL[1];
          // (beyond its court face's corners: the promenade coping's own joint pilasters, round 2)
          if (y > LK.floor + 0.01 && y < LK.top && u > LK.r0 - 0.15 && u < LK.r1 + 0.15 && Math.abs(v) < LK.half + 0.15 && !(u < LK.r0 && Math.abs(v) > LK.half)) {
            const d = Math.hypot(Math.max(LK.r0 - u, 0, u - LK.r1), Math.max(Math.abs(v) - LK.half, 0));
            if (d > 0) { if (d > st.lookOut) st.atL = [+x.toFixed(2), +y.toFixed(2), +z.toFixed(2)]; st.lookOut = Math.max(st.lookOut, d); st.n++; }
          }
          if (u > LK.rb + 0.02 && u < LK.r1 && Math.abs(v) < LK.half && y > LK.top - 0.003 && y < LK.top + 0.8) st.lookOn++; }
        // the telescope bay (its coin telescopes stand on it at r 30.2, and the souvenir kiosk on its inner edge: left out)
        { const u = X * dB0 + Z * dB1, v = X * pB[0] + Z * pB[1];
          if (Math.abs(v) > TB.kiosk + 0.03 && y > LK.floor + 0.01 && y < TB.top && u > TB.r0 - 0.15 && u < TB.r1 + 0.15 && Math.abs(v) < TB.half + 0.15) {
            const d = Math.hypot(Math.max(TB.r0 - u, 0, u - TB.r1), Math.max(Math.abs(v) - TB.half, 0));
            if (d > 0) { if (d > st.bayOut) st.atB = [+x.toFixed(2), +y.toFixed(2), +z.toFixed(2)]; st.bayOut = Math.max(st.bayOut, d); st.n++; }
          }
          if (u > TB.r0 + 0.02 && u < 29.8 && Math.abs(v) > TB.kiosk + 0.03 && Math.abs(v) < TB.half && y > TB.top - 0.003 && y < TB.top + 0.8) { st.bayOn++; st.atBon = [+x.toFixed(2), +y.toFixed(2), +z.toFixed(2)]; } }
        // the planters
        for (const o of PL.oct) {
          const px0 = X - o.c[0], pz0 = Z - o.c[1], m = Math.max(Math.abs(px0), Math.abs(pz0), Math.SQRT1_2 * Math.max(Math.abs(px0 + pz0), Math.abs(px0 - pz0)));
          if (y < o.top && m > o.r && m < o.r + 0.15) { if (m - o.r > st.plOut) st.atP = [+x.toFixed(2), +y.toFixed(2), +z.toFixed(2)]; st.plOut = Math.max(st.plOut, m - o.r); st.n++; }
          if (m < o.r - 0.02 && y > o.top - 0.27 - 0.003 && y < o.top + 0.8) { const k = [Math.abs(px0), Math.SQRT1_2 * Math.abs(px0 + pz0), Math.abs(pz0), Math.SQRT1_2 * Math.abs(px0 - pz0)]; let t = -9; for (let j = 0; j < 4; j++) if (k[(j + 2) % 4] <= o.r * Math.tan(Math.PI / 8) + 1e-3) t = Math.max(t, o.top - 0.09 * j); if (y > t - 0.003) st.plOn++; }
        }
        for (const b of PL.box) {
          const dz = Z + 32.5, bs = 0.5 * X - C30 * dz, bw = C30 * X + 0.5 * dz;
          const d = Math.hypot(Math.max(b.s[0] - bs, 0, bs - b.s[1]), Math.max(b.w[0] - bw, 0, bw - b.w[1]));
          if (y > b.y0 + 0.01 && y < b.top && d > 0 && d < 0.15) { if (d > st.plOut) st.atP = [+x.toFixed(2), +y.toFixed(2), +z.toFixed(2)]; st.plOut = Math.max(st.plOut, d); st.n++; }
          if (d === 0 && y > b.top - 0.003 && y < b.top + 0.8) st.plOn++;
        }
      }
    });
    R('the Lookouts\', the telescope bays\' and the planters\' dressing stands within 8.5 cm of their faces and nothing on their walkable tops',
      st.n > 300 && st.lookOut <= 0.085 && st.bayOut <= 0.085 && st.plOut <= 0.085 && st.lookOn === 0 && st.bayOn === 0 && st.plOn === 0,
      { verts: st.n, lookout: +st.lookOut.toFixed(3), bay: +st.bayOut.toFixed(3), planters: +st.plOut.toFixed(3), onTops: [st.lookOn, st.bayOn, st.plOn], at: [st.atL, st.atB, st.atP, st.atBon] });
    // (e) the touch pools' rockery breaks the pool's outline (it read as a painted box with thin fins at the corners): at
    // each corner, both halves, rock stands ≥ 4 cm out of both faces within 0.25 m of the corner and rises ≥ 0.15 m over the
    // rim; the rim's rocks rise ≥ 0.2 m over it along each long face and each end
    const [px_, py_, pz_] = TP.pos, hw = TP.w / 2, hd = TP.d / 2, top = py_ + TP.h;
    const corner = {}, rimUp = {};
    meshVerts((o) => /^props:/.test(o.name), (x, y, z) => {
      for (const s of [1, -1]) {
        const lx = s * x - px_, lz = s * z - pz_;
        if (Math.abs(lx) > hw + 0.09 || Math.abs(lz) > hd + 0.09 || y < py_) continue;
        const cx = Math.sign(lx), cz = Math.sign(lz), key = `${s}${cx}${cz}`;
        const ox = Math.abs(lx) - hw, oz = Math.abs(lz) - hd;
        if (ox > -0.25 && oz > -0.25) { const c = corner[key] || (corner[key] = { outX: 0, outZ: 0, up: 0 }); if (oz < 0.0) c.outX = Math.max(c.outX, ox); if (ox < 0.0) c.outZ = Math.max(c.outZ, oz); c.up = Math.max(c.up, y - top); }
        if (y > top) { const side = Math.abs(lz) > hd - 0.3 && Math.abs(lx) < hw - 0.6 ? `${s}z${cz}` : Math.abs(lx) > hw - 0.3 && Math.abs(lz) < hd - 0.6 ? `${s}x${cx}` : null; if (side) rimUp[side] = Math.max(rimUp[side] || 0, y - top); }
      }
    });
    const cs = Object.values(corner), rs = Object.values(rimUp);
    R('the touch pools\' rockery wraps every corner (≥ 4 cm out of both faces, rising ≥ 0.15 m over the rim) and rises ≥ 0.2 m over the rim on every side, both halves',
      cs.length === 8 && cs.every((c) => c.outX >= 0.04 && c.outZ >= 0.04 && c.up >= 0.15) && rs.length === 8 && rs.every((u) => u >= 0.2),
      { corners: Object.fromEntries(Object.entries(corner).map(([k, c]) => [k, [+c.outX.toFixed(3), +c.outZ.toFixed(3), +c.up.toFixed(2)]])), rim: Object.fromEntries(Object.entries(rimUp).map(([k, u]) => [k, +u.toFixed(2)])) });
  }
  // 9. fix round 5 (LEAD-NOTES after review 5: the complete eye-level sweep, out/art/r5-sweep-*): every piece it marked bare
  // is drawn under the ink and reads as what it is, both halves; this round's props stand within 8.5 cm of the blocks they
  // dress and off their walkable tops; the grand stair's granite nosing covers the promenade's cells at its head
  {
    const gl = G.renderer.getContext(), V = (a) => new G.camera.position.constructor(a[0], a[1], a[2]);
    const { PENGUIN: PG, PUMPS: PU, DAIS: DA, TICKET: TK, W: Wb } = await import('./src/world/stages/aquarium/geo.js');
    const DEG = Math.PI / 180, dir = (a) => [Math.cos(a * DEG), Math.sin(a * DEG)];
    const lum = (c) => 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2];
    const px = (p) => { const v = V(p).project(G.camera), w = gl.drawingBufferWidth, h = gl.drawingBufferHeight, a = new Uint8Array(4 * 9); gl.readPixels(Math.round((v.x + 1) / 2 * w) - 1, Math.round((v.y + 1) / 2 * h) - 1, 3, 3, gl.RGBA, gl.UNSIGNED_BYTE, a); const c = [0, 0, 0]; for (let i = 0; i < 9; i++) for (let k = 0; k < 3; k++) c[k] += a[i * 4 + k] / 9; return c.map(Math.round); };
    const shot = (from, look, n = 24) => { G.paint.clear?.(); g.rig.cinematic(V(from), V(from), V(look), V(look), 99, () => {}); for (let i = 0; i < n; i++) g.debug.step(1000 / 60); };
    const tw = (p, s) => [s * p[0], p[1], s * p[2]];
    const W3 = (s, w, y) => { const [x, z] = Wb(s, w); return [x, y, z]; };
    const P3 = (a, r, y, c = [0, 0], l = 0) => { const d = dir(a); return [c[0] + d[0] * r - d[1] * l, y, c[1] + d[1] * r + d[0] * l]; };
    const std = (cs) => { const l = cs.map(lum), m = l.reduce((a, b) => a + b, 0) / l.length; return +Math.sqrt(l.reduce((a, b) => a + (b - m) ** 2, 0) / l.length).toFixed(1); };
    const cv = (cs) => { const m = cs.map(lum).reduce((a, b) => a + b, 0) / cs.length; return +(std(cs) / Math.max(m, 1)).toFixed(3); };   // (relative: a face in shade has less contrast)
    const brains = m.actors.map((a) => a.bot); for (const a of m.actors) a.bot = null;   // (the bots stand still: nothing inks the faces read)
    g.debug.freeze?.();
    // (a) Penguin Point: the rock terrace's plaza face and the upper rock's plaza face are rockwork — stones and crevices
    // along the face, a dark granite foot, a white snow lip (they were flat concrete), both halves
    const rock = [];
    for (const s of [1, -1]) {
      shot(tw(W3(6, -6.5, 0.9), s), tw(W3(6, -10, 0.65), s));
      rock.push({ face: 'terrace', s, cv: cv(Array.from({ length: 15 }, (_, i) => px(tw(W3(5.3 + i * 0.1, -10, 0.62), s)))), foot: px(tw(W3(6, -10, 0.05), s)), lip: px(tw(W3(6, -10, 1.17), s)) });
      shot(tw(W3(15, -7.0, 1.5), s), tw(W3(15, -12, 1.2), s));
      rock.push({ face: 'upper', s, cv: cv(Array.from({ length: 15 }, (_, i) => px(tw(W3(14.2 + i * 0.1, -12, 1.0), s)))), foot: px(tw(W3(15, -12, 0.05), s)), lip: px(tw(W3(15, -12, 2.37), s)) });
    }
    R('Penguin Point\'s rock faces are rockwork, both halves: stones and crevices along them, a granite foot, a snow lip', rock.every((c) => c.cv > 0.12 && lum(c.lip) > lum(c.foot) + 60), rock);
    // (b) the rock terrace's top: pale rock slabs with snow lying on them toward the glass (it was one concrete slab)
    const tops = [];
    for (const s of [1, -1]) {
      shot(tw(W3(4, -10.5, 4.6), s), tw(W3(4.5, -14.5, 1.2), s));
      const g9 = []; for (let i = 0; i < 8; i++) for (let j = 0; j < 6; j++) g9.push(px(tw(W3(3.6 + i * 0.8, -11.6 - j * 1.0, 1.2), s)));
      tops.push({ s, std: std(g9), max: Math.round(Math.max(...g9.map(lum))) });
    }
    R('the rock terrace\'s top is pale rock slabs with snow on them, both halves (not one flat slab)', tops.every((c) => c.std > 10 && c.max > 180), tops);
    // (c) ink splatted on the terrace's face shows over its rockwork (the art is under the ink)
    shot(W3(6, -6.5, 0.9), W3(6, -10, 0.65));
    const bare = px(W3(6, -10, 0.62)); G.paint.splat(V(W3(6, -9.95, 0.62)), 0.45, 0, { instant: true }); for (let i = 0; i < 6; i++) g.debug.step(1000 / 60);
    const inked = px(W3(6, -10, 0.62)), moved = Math.abs(inked[0] - bare[0]) + Math.abs(inked[1] - bare[1]) + Math.abs(inked[2] - bare[2]);
    R('ink splatted on Penguin Point\'s rockwork shows over it (the art is under the ink)', moved > 90, { bare, inked, moved });
    // (d) the ice pile is ice (blue-white blocks) and the pump sets painted machinery (sea-green drum, a hazard band), both halves
    const ice = [], pump = [];
    for (const s of [1, -1]) {
      const ix = PG.ice.b[1], iz = (PG.ice.b[2] + PG.ice.b[3]) / 2;
      shot(tw([ix + 2.2, 2.2, iz], s), tw([ix, 1.7, iz], s));
      ice.push({ s, c: px(tw([ix, 1.62, iz + 0.12], s)) });
      const fx = PU.box[0], fz = (PU.box[2] + PU.box[3]) / 2;
      shot(tw([fx - 2.6, 0.9, fz], s), tw([fx, 0.6, fz], s));
      const hz = Array.from({ length: 9 }, (_, i) => px(tw([fx, 0.135, fz - 0.4 + i * 0.1], s)));
      pump.push({ s, drum: px(tw([fx, 0.63, fz + 0.35], s)), hazardMax: Math.round(Math.max(...hz.map(lum))), hazardMin: Math.round(Math.min(...hz.map(lum))) });
    }
    R('the ice pile is stacked ice (blue-white) and the pump sets are painted machinery (a sea-green drum over a hazard band), both halves',
      ice.every((c) => c.c[2] > c.c[0] + 15) && pump.every((c) => c.drum[1] > c.drum[0] + 3 && c.hazardMax > 3 * c.hazardMin + 20), { ice, pump });
    // (e) cast stone over a darker granite plinth: the touch pool's dais (east end), the Ticket Hall's plaza face (with a faience
    // speed line), the grand stair's flank, the Kelp Balcony's face, the Fin Pavilion's flank wall by its stair; both halves
    const faces = [];
    const pair = (name, s, from, look, body, foot, extra) => { shot(tw(from, s), tw(look, s)); const r = { name, s, body: px(tw(body, s)), foot: px(tw(foot, s)) }; if (extra) r.line = px(tw(extra, s)); faces.push(r); };
    const pS = [-Math.sin(-152 * DEG), Math.cos(-152 * DEG)];   // (the grand stair's south side, out of its flank: (0.469, −0.883))
    const gsF = (y) => { const [x, , z] = P3(-152, 18.5, 0); return [x + pS[0] * 3.0, y, z + pS[1] * 3.0]; };
    // (the Kelp Balcony's end face toward the promenade: its last segment's side, bearings 240 … 255 round the W drum)
    const kb = (o, y) => { const a = 247.5 * DEG, dm = [Math.cos(a), Math.sin(a)], pm = [-dm[1], dm[0]]; return [-25 + 6.0 * dm[0] + (0.94 + o) * pm[0], y, 6.0 * dm[1] + (0.94 + o) * pm[1]]; };
    for (const s of [1, -1]) {
      pair('dais', s, [-3.5, 0.8, -15.6], [DA.b[1], 0.4, -15.6], [DA.b[1], 0.25, -15.6], [DA.b[1], 0.05, -15.6]);
      pair('ticket', s, [6.0, 0.9, -49.5], [6.0, 0.5, TK.b[2]], [6.0, 0.45, TK.b[2]], [6.0, 0.07, TK.b[2]], [6.0, 0.8, TK.b[2]]);
      pair('grandStair', s, gsF(0.8).map((v, i) => (i === 1 ? v : v + (i === 0 ? pS[0] : pS[1]) * 3.0)), gsF(0.5), gsF(0.4), gsF(0.07));
      pair('kelpBalcony', s, kb(4.5, 3.3), kb(0, 2.9), kb(0, 2.85), kb(0, 2.47));
      pair('pavilionFlank', s, W3(34, 15.0, 2.9), W3(34, 13.0, 1.7), W3(34, 13.0, 2.0), W3(34, 13.0, 1.25));
    }
    R('the dais, the Ticket Hall\'s plaza face, the grand stair\'s flanks, the Kelp Balconies and the pavilion\'s flank walls are dressed, both halves: stone or render over a granite foot (a speed line on the Ticket Hall)',
      faces.every((c) => lum(c.body) > lum(c.foot) + 30 && (!c.line || c.line[1] > c.line[0])), faces);
    // (f) the deckchair stack: striped canvas in layers (it was a coral box), both halves
    const chairs = [];
    for (const s of [1, -1]) {
      shot(tw(P3(-158, 26.0, 3.3), s), tw(P3(-158, 28.3, 2.95), s));
      chairs.push({ s, std: std(Array.from({ length: 11 }, (_, i) => px(tw(P3(-158, 28.3, 2.97, [0, 0], -0.5 + i * 0.1), s)))) });
    }
    R('the deckchair stacks are folded striped chairs in layers, both halves (not a plain box)', chairs.every((c) => c.std > 15), chairs);
    // (g) this round's props: within 8.5 cm (horizontally) of a block they dress and never on its walkable top (a headless
    // build of their placements alone, both halves)
    {
      const { PropKit: PK } = await import('./src/world/props.js'), { dressingFor: DF } = await import('./src/world/dressing.js');
      const { LAYOUT: LY } = await import('./src/world/stages/aquarium/layout.js');
      const TYPES = ['aquarium_plate', 'aquarium_penguinplaque', 'aquarium_baskinglumps', 'aquarium_pumpdress', 'aquarium_raketrim'];   // (the hut's windows: on an off-limits block, its round-1 roof overhangs it)
      const DRESSED = ['penguin-rocks', 'upper-rock', 'basking-rock', 'ice-pile', 'pump-set', 'touch-dais', 'touch-step', 'ticket-hall', 'helmet-bed', 'viewing-step', 'shark-bench', 'grand-stair', 'penguin-steps', 'ticket-stair', 'deck-ramp'];
      const kit5 = new PK(null, { headless: true });
      let nIt = 0; for (const it of DF('aquarium')) if (TYPES.includes(it.type)) { kit5.add(it.type, it); nIt++; }
      const mir = (d) => (d.kind === 'box' ? { ...d, min: [-d.max[0], d.min[1], -d.max[2]], max: [-d.min[0], d.max[1], -d.min[2]] } : d.kind === 'obox' ? { ...d, center: [-d.center[0], d.center[1], -d.center[2]] } : { ...d, low: [-d.low[0], d.low[1], -d.low[2]], high: [-d.high[0], d.high[1], -d.high[2]] });
      const blocks = LY.half.filter((d) => DRESSED.includes(d.tag) && !(d.notIn === 'tower' && false)).flatMap((d) => [d, mir(d)]);
      // (footprint distance outside a piece, and its top over (x, z) when inside)
      const fp = (d, x, z) => {
        if (d.kind === 'box') { const dx = Math.max(d.min[0] - x, 0, x - d.max[0]), dz = Math.max(d.min[2] - z, 0, z - d.max[2]); return [Math.hypot(dx, dz), d.max[1], Math.min(x - d.min[0], d.max[0] - x, z - d.min[2], d.max[2] - z)]; }
        if (d.kind === 'obox') { const a = d.rotY * DEG, c = Math.cos(a), s = Math.sin(a), dx = x - d.center[0], dz = z - d.center[2], u = dx * c - dz * s, v = dx * s + dz * c, hu = d.size[0] / 2, hv = d.size[2] / 2; return [Math.hypot(Math.max(Math.abs(u) - hu, 0), Math.max(Math.abs(v) - hv, 0)), d.center[1] + d.size[1] / 2, Math.min(hu - Math.abs(u), hv - Math.abs(v))]; }
        const [lx, ly, lz] = d.low, [hx, hy, hz] = d.high, run = Math.hypot(hx - lx, hz - lz), ux = (hx - lx) / run, uz = (hz - lz) / run, dx = x - lx, dz = z - lz, al = dx * ux + dz * uz, lat = -dx * uz + dz * ux;
        return [Math.hypot(Math.max(Math.abs(lat) - d.width / 2, 0), Math.max(-al, 0, al - run)), ly + (Math.max(0, Math.min(run, al)) * (hy - ly)) / run, Math.min(d.width / 2 - Math.abs(lat), al, run - al)];
      };
      const st = { n: 0, far: 0, atFar: null, onTop: 0, atTop: null };
      const v3 = new G.camera.position.constructor();
      for (const parts of kit5._buckets.values()) for (const p of parts) {
        const P = p.g.attributes.position;
        for (let i = 0; i < P.count; i++) {
          v3.fromBufferAttribute(P, i).applyMatrix4(p.m); st.n++;
          let best = 9, on = null, hugs = false;
          for (const d of blocks) {
            const [out, top, inset] = fp(d, v3.x, v3.z);
            best = Math.min(best, out);
            if (out === 0 && inset > 0.02 && v3.y > top + 0.003 && v3.y < top + 1.5) on = d;
            if (out <= 0.085 && top > v3.y + 0.003) hugs = true;                    // (hugging a face that rises above it, or inside a taller block)
          }
          if (on && !hugs) { st.onTop++; st.atTop = [on.tag, +v3.x.toFixed(2), +v3.y.toFixed(2), +v3.z.toFixed(2)]; }
          if (best > st.far) { st.far = best; st.atFar = [+v3.x.toFixed(2), +v3.y.toFixed(2), +v3.z.toFixed(2)]; }
        }
      }
      R('this round\'s props (plates, the PENGUIN POINT plaque, the basking rock\'s lumps, the pumps\' pipework, the stairs\' string-courses) stand within 8.5 cm of the blocks they dress and none on a walkable top, both halves',
        nIt >= 17 && st.n > 3000 && st.far <= 0.085 && st.onTop === 0, { placements: nIt, verts: st.n, farthest: +st.far.toFixed(3), at: st.atFar, onTop: st.onTop, atTop: st.atTop });
      // (h) the grand stair's granite nosing (the lead's call): a stone block across each stair's head, not inked, 8.5 cm
      // proud; no promenade cell reaches past it onto the stair (they ran out over its top tread in a sawtooth)
      const nos = L.blocks.filter((b) => b.tag === 'stair-nosing');
      const ax = dir(-152), pr = [-ax[1], ax[0]];
      let reach = 99;
      for (const d of LY.half.filter((q) => q.tag === 'promenade')) for (const [x, z] of [[d.min[0], d.min[2]], [d.max[0], d.min[2]], [d.max[0], d.max[2]], [d.min[0], d.max[2]]]) {
        const r = x * ax[0] + z * ax[1], l = x * pr[0] + z * pr[1];
        if (Math.abs(l) < 2.99 && r < 22) reach = Math.min(reach, r);
      }
      const ndef = LY.half.find((q) => q.tag === 'stair-nosing');
      R('the grand stair\'s head has its granite nosing on both halves (not inked, 8.5 cm proud) and no promenade cell reaches past it onto the stair',
        nos.length === 2 && nos.every((b) => b.faces.every((f) => f < 0 || !L.faces[f].paintable)) && ndef && Math.abs(ndef.center[1] + ndef.size[1] / 2 - 2.485) < 1e-6 && reach >= 20.95 - 0.02,
        { blocks: nos.length, top: ndef ? +(ndef.center[1] + ndef.size[1] / 2).toFixed(3) : null, cellsFrom: +reach.toFixed(3) });
    }
    m.actors.forEach((a, i) => { a.bot = brains[i]; });
    G.paint.clear?.();
  }
  let bathy = null; G.scene.traverse((o) => { if (o.name === 'aq-bathysphere') bathy = o; });
  // 5. Feeding Time at 1:00 left: looks only
  const plays = []; const play0 = G.audio?.play?.bind(G.audio);
  if (G.audio) G.audio.play = (name, o) => { plays.push(name); return play0(name, o); };
  // (stepped: the backdrop runs on the environment's clock, which the audit step advances with the sim)
  const blk = L.blocks.find((b) => b.tag === 'bathysphere'), blk0 = blk ? blk.center.toArray().join() : null, nBlocks = L.blocks.length;
  g.debug.freeze?.();
  m.time = 60.4;
  const y0 = bathy.position.y, c0 = bathy.userData.clocks.uFT.value, c20 = bathy.userData.clocks.uFT2.value;
  const t0 = m.time;
  for (let i = 0; i < 240; i++) g.debug.step(1000 / 60);
  const S = bathy.userData.feeding(), y1 = bathy.position.y;
  const dT = bathy.userData.clocks.uFT.value - c0, dT2 = bathy.userData.clocks.uFT2.value - c20;
  R('Feeding Time starts at 1:00 left: the bathysphere bobs, the bell rings three times, krill drift down, the sharks wheel faster',
    S.t > 2 && y1 > y0 + 0.1 && S.rung === 3 && S.krill > 0.3 && dT2 > dT * 1.3 && plays.filter((p) => p === 'aq_bell' || p === 'pipe_chime').length >= 3,
    { t: +(S.t || 0).toFixed(2), bob: +(y1 - y0).toFixed(3), rung: S.rung, krill: +S.krill.toFixed(2), clock: +dT.toFixed(2), sharkClock: +dT2.toFixed(2), sounds: plays.slice(0, 6) });
  R('Feeding Time changes no rule: the clock runs on as stepped (4 s), the bathysphere\'s collider stays where it was, no block is added',
    Math.abs((t0 - m.time) - 4) < 0.2 && blk && blk.center.toArray().join() === blk0 && L.blocks.length === nBlocks, { ran: +(t0 - m.time).toFixed(2), blocks: L.blocks.length });
  if (G.audio && play0) G.audio.play = play0;
  return out;
})()
