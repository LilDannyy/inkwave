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
// Fix round 6 (section 10, review 6's list): the Feeding Step's sides and top, the Kelp Ramps' parapets, the whale-tail benches,
// the trolley stacks and the ice-cream carts drawn under the ink; the lectern, the deep Kelp stops and the plant rooms dressed;
// this round's props within 8.5 cm and off walkable tops; the Penguin Steps' nosing out to r 31.4.
// Fix round 7 (section 11, review 7's list): the Ticket Hall booth's glazing proud of its block on both TICKETS faces; every
// kiosk's back carries its trade's board and the frieze's speed lines, the ice-cream kiosks' sides their shutters, the ferry
// kiosks' free sides a door; the luggage scale's stencil and riveted panel under the ink; this round's props within 8.5 cm,
// under the cornices and the scale's top (pixel reads, both halves; they fail at de3bd111).
// Fix round 8 (section 12, review 8's list): the Express OUT stop's long faces carry their speed lines over the stop's own
// floor (they were drawn inside the rock terrace), the Ticket Hall booth's base its price plates and skirting, the Reef
// Window's short west run its speed lines and its open ends render jambs; this round's props within 8.5 cm of their blocks
// and under their tops (pixel reads, both halves; they fail at a2f28b8d). Section 8 runs with the bots' brains off and its
// planters' paint cleared before each read (8(c) failed once in two runs: Bravo's bots inked their deck's planter).
// Fix round 9 (section 13, review 9's list): the Arch Line's riser shafts carry their plates, skirting and white glazed tile
// (both shafts, both halves), their parts stand ≥ 0.15 m clear of the riser's glass and inside the shafts in the dressing's
// existing buckets; the Kelp Balcony's end face is render to its drum end; the Express IN stop has the OUT stop's skirting
// and portholes; the Reef Window's jambs a porthole into the reef (pixel reads, both halves; they fail at 4df530c8).
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
    // (fix round 8, LEAD-REVIEW 8: 8(c) read Bravo's planter red in one run of two — the bots, still thinking, inked their
    // deck between the section's start and the read. Their brains are off for the section, as in sections 9–11, what they
    // had in flight is cleared, and each planter view clears the paint with their bodies hidden)
    const brains8 = m.actors.map((a) => a.bot); for (const a of m.actors) a.bot = null;
    G.projectiles?.clear?.(); G.subs?.clear?.(); G.specials?.clear?.();
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
    const dp = [], shown = m.actors.map((a) => a.character?.root?.visible);
    for (const a of m.actors) if (a.character?.root) a.character.root.visible = false;
    for (const s of [1, -1]) {
      // (its face toward mid, 0.6 m off its plate, between the speed lines and the coping)
      const b = PL.box[1], wm = (b.w[0] + b.w[1]) / 2, [fx, fz] = Wb(b.s[0], wm + 0.6), [cx, cz] = Wb(b.s[0] - 3, wm + 0.6);
      G.paint.clear?.();
      shot(tw([cx, b.y0 + 1.0, cz], s), tw([fx, b.y0 + 0.6, fz], s));
      dp.push({ body: px(tw([fx, b.y0 + 0.78, fz], s)), plinth: px(tw([fx, b.y0 + 0.06, fz], s)) });
    }
    m.actors.forEach((a, i) => { if (a.character?.root && shown[i] != null) a.character.root.visible = shown[i]; });
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
    m.actors.forEach((a, i) => { a.bot = brains8[i]; });
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
    G.projectiles?.clear?.(); G.subs?.clear?.(); G.specials?.clear?.(); G.paint.clear?.();   // (review 10: nothing in flight inks the rock faces read)
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
      const R6 = ['FEEDING DECK', 'WHALE BENCH', 'KELP RAMP', 'GELATO'];   // (fix round 6's plates: section 10 reads them against their own blocks)
      let nIt = 0; for (const it of DF('aquarium')) if (TYPES.includes(it.type) && !(it.type === 'aquarium_plate' && R6.includes(it.lines?.[0]?.[0]))) { kit5.add(it.type, it); nIt++; }
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
  // 10. fix round 6 (LEAD-REVIEW 6, the list LEAD-NOTES "After review 6" binds): the Feeding Step's sides and top, the Kelp
  // Ramps' parapets, the whale-tail benches, the trolley stacks and the ice-cream carts are drawn under the ink (pixel reads,
  // both halves; the ink still shows on them), the lectern's court face, the deep Kelp stops' panels and the plant rooms'
  // faces are dressed, this round's props stand within 8.5 cm of what they dress and off its walkable top, and the Penguin
  // Steps' nosing now covers the promenade's cells at their head
  {
    const gl = G.renderer.getContext(), V = (a) => new G.camera.position.constructor(a[0], a[1], a[2]);
    const DEG = Math.PI / 180, dir = (a) => [Math.cos(a * DEG), Math.sin(a * DEG)];
    const lum = (c) => 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2];
    const px = (p) => { const v = V(p).project(G.camera), w = gl.drawingBufferWidth, h = gl.drawingBufferHeight, a = new Uint8Array(4 * 9); gl.readPixels(Math.round((v.x + 1) / 2 * w) - 1, Math.round((v.y + 1) / 2 * h) - 1, 3, 3, gl.RGBA, gl.UNSIGNED_BYTE, a); const c = [0, 0, 0]; for (let i = 0; i < 9; i++) for (let k = 0; k < 3; k++) c[k] += a[i * 4 + k] / 9; return c.map(Math.round); };
    const shot = (from, look, n = 24) => { G.paint.clear?.(); g.rig.cinematic(V(from), V(from), V(look), V(look), 99, () => {}); for (let i = 0; i < n; i++) g.debug.step(1000 / 60); };
    const tw = (p, s) => [s * p[0], p[1], s * p[2]];
    const std = (cs) => { const l = cs.map(lum), m = l.reduce((a, b) => a + b, 0) / l.length; return +Math.sqrt(l.reduce((a, b) => a + (b - m) ** 2, 0) / l.length).toFixed(1); };
    const brains = m.actors.map((a) => a.bot); for (const a of m.actors) a.bot = null;
    g.debug.freeze?.();
    // (a) the Feeding Step: its side faces render over a granite skirting, a faience speed line, a teak fascia (they were plain
    // cream render), its top teak planks with a brass border (it was plain render), both halves
    const fs = [];
    for (const s of [1, -1]) {
      shot(tw([4.6, 1.5, -7.6], s), tw([2.0, 0.6, -8.8], s));
      const f = (y) => px(tw([2.005, y, -9.3], s));
      const side = { s, body: f(0.5), skirt: f(0.045), line: f(0.7), fascia: f(1.12) };
      shot(tw([0, 2.9, -12.8], s), tw([0, 1.2, -8.3], s));
      const g9 = []; for (let i = 0; i < 7; i++) for (let j = 0; j < 5; j++) g9.push(px(tw([-1.2 + i * 0.4, 1.2, -9.4 + j * 0.37], s)));
      fs.push({ ...side, topStd: std(g9), topRB: Math.round(g9.reduce((a, c) => a + c[0] - c[2], 0) / g9.length), border: px(tw([0.6, 1.2, -9.63], s)) });
    }
    R('the Feeding Step\'s sides are dressed (render over a granite skirting, a faience speed line, a teak fascia) and its top is teak planks in a brass border, both halves',
      fs.every((c) => lum(c.body) > lum(c.skirt) + 30 && c.line[1] > c.line[0] + 3 && c.fascia[0] > c.fascia[2] + 8 && c.topStd > 5 && c.topRB > 8 && c.border[0] > c.border[2] + 25), fs);
    // (b) the Kelp Ramp's parapet: its court face has the faience speed lines under its coping (it was plain render), its
    // ramp face a granite skirting along the ramp, both halves
    const kp = [];
    for (const s of [1, -1]) {
      const nC = dir(-37.5), oC = (y, k = 7.745) => [-25 + nC[0] * k, y, nC[1] * k];
      shot(tw([-15.5, 1.7, -9.5], s), tw([-21.0, 2.4, -5.5], s));
      const court = { s, body: px(tw(oC(1.9), s)), line: px(tw(oC(2.26), s)) };
      const nI = dir(-52.5), iI = (y) => [-25 + nI[0] * 7.425, y, nI[1] * 7.425];
      shot(tw([-19.0, 2.9, 0.5], s), tw([-21.5, 2.6, -5.0], s));
      kp.push({ ...court, rampBody: px(tw(iI(2.25), s)), rampSkirt: px(tw(iI(1.97), s)) });
    }
    R('the Kelp Ramps\' parapets are dressed, both halves: faience speed lines along the court face under the coping, a granite skirting along the ramp face',
      kp.every((c) => c.line[1] > c.line[0] + 3 && lum(c.body) > lum(c.line) + 8 && lum(c.rampBody) > lum(c.rampSkirt) + 30), kp);
    // (c) the whale-tail bench: slats and brass rails on its long face (it was a plain plank box); (d) the trolley stack:
    // the cage's bars over the shade inside; (e) the ice-cream cart: candy stripes round its skirt; both halves
    const misc = [];
    for (const s of [1, -1]) {
      shot(tw([-1.0, 1.0, -60.25], s), tw([-1.0, 0.65, -58.6], s));   // (square to its long face, 1.65 m off: the slats resolve)
      const slats = Array.from({ length: 65 }, (_, i) => px(tw([-1.9 + i * 0.0277, 0.65, -58.605], s)));   // (0.0277 m apart: never in step with the 0.1 m slats)
      const rail = px(tw([-1.9, 0.8, -58.605], s)), kick = px(tw([-1.75, 0.04, -58.605], s)), apron = px(tw([-1.75, 0.3, -58.605], s));
      shot(tw([6.2, 1.7, -56.9], s), tw([8.2, 0.7, -60.3], s));
      const cage = Array.from({ length: 60 }, (_, i) => { const t = -0.8 + i * 0.027; return px(tw([7.905 + 0.866 * t, 1.1, -59.795 + 0.5 * t], s)); });   // (0.027 m apart over the 0.12 m bars)
      shot(tw([-5.5, 1.7, -36.0], s), tw([-5.5, 0.7, -39.75], s));
      const stripes = Array.from({ length: 13 }, (_, i) => px(tw([-6.1 + i * 0.1, 0.2, -38.995], s)));
      const cl = cage.map(lum);
      const sm = slats.map(lum).reduce((a, b) => a + b, 0) / slats.length;
      misc.push({ s, slatStd: std(slats), slatCv: +(std(slats) / Math.max(sm, 1)).toFixed(3), kickRatio: +(lum(kick) / Math.max(lum(apron), 1)).toFixed(2), rail, cageSpan: Math.round(Math.max(...cl) - Math.min(...cl)), cageMean: Math.round(cl.reduce((a, b) => a + b, 0) / cl.length), stripeStd: std(stripes) });
    }
    R('the whale-tail benches have upright slats on their long faces (relative contrast, read square to the face: one half stands in the upper rock\'s shade), the trolley stacks are nested cages (bars over the shade), the ice-cream carts candy stripes, both halves',
      misc.every((c) => c.slatCv > 0.1 && c.cageSpan > 20 && c.cageMean < 40 && c.stripeStd > 10), misc);
    // (f) ink splatted on the Feeding Step's side and on the parapet's court face shows over their dressing
    const inkR = [];
    for (const [from, look, at, n] of [[[4.6, 1.5, -7.6], [2.0, 0.6, -8.8], [2.005, 0.7, -9.3], [1, 0, 0]], [[-15.5, 1.7, -9.5], [-21.0, 2.4, -5.5], [-25 + dir(-37.5)[0] * 7.745, 2.0, dir(-37.5)[1] * 7.745], [dir(-37.5)[0], 0, dir(-37.5)[1]]]]) {
      shot(from, look);
      const bare = px(at); G.paint.splat(V([at[0] + n[0] * 0.02, at[1], at[2] + n[2] * 0.02]), 0.4, 0, { instant: true }); for (let i = 0; i < 6; i++) g.debug.step(1000 / 60);
      const ink = px(at); inkR.push({ bare, ink, moved: Math.abs(ink[0] - bare[0]) + Math.abs(ink[1] - bare[1]) + Math.abs(ink[2] - bare[2]) });
    }
    R('ink splatted on the Feeding Step\'s side and on the parapet\'s court face shows over their dressing (the art is under the ink)', inkR.every((c) => c.moved > 90), inkR);
    // (g) the lectern's court face: THE TUBEWAY map's navy plate (it was plain render); the deep Kelp stop's side: a sea-green
    // enamel panel (it was dark brass); the plant room's face over the Kelp Balcony: a louvred vent (it was render)
    const fx = [];
    for (const s of [1, -1]) {
      shot(tw([-4.6, 1.6, -15.0], s), tw([-7.5, 0.6, -18.0], s));
      const plate = px(tw([-7.5, 0.33, -17.729], s));
      const C = [-20.58, -22.85], lx = [-0.743, 0.669], lz = [-0.669, -0.743], o = [C[0] - 1.22 * lx[0] + 0.6 * lz[0] - 0.05 * lx[0], C[1] - 1.22 * lx[1] + 0.6 * lz[1] - 0.05 * lx[1]];
      shot(tw([-16.6, 4.1, -24.9], s), tw([-20.3, 3.0, -22.6], s));
      const panel = px(tw([o[0], 2.6, o[1]], s));
      const n = dir(105), u = dir(15), F = [25.104 + u[0] * 6.075 + n[0] * 0.42, -0.386 + u[1] * 6.075 + n[1] * 0.42];   // (the E drum's face; Alpha's: its twin)
      shot(tw([27.2, 5.3, 5.6], -s), tw([30.5, 4.8, 1.6], -s));
      const vent = px(tw([F[0] - u[0] * 0.5, 4.62, F[1] - u[1] * 0.5], -s)), wall = px(tw([F[0] + u[0] * 1.4, 5.25, F[1] + u[1] * 1.4], -s));
      fx.push({ s, plate, panel, vent, wall });
    }
    R('the lectern\'s court face carries THE TUBEWAY map plate, the deep Kelp stop a sea-green enamel panel, the plant room\'s balcony face a louvred vent, both halves',
      fx.every((c) => c.plate[2] > c.plate[0] + 10 && c.panel[1] > c.panel[0] + 5 && lum(c.wall) > lum(c.vent) + 30), fx);
    // (h) this round's props: within 8.5 cm (horizontally) of a block they dress and never on its walkable top (a headless
    // build of their placements alone, both halves)
    {
      const { PropKit: PK } = await import('./src/world/props.js'), { dressingFor: DF } = await import('./src/world/dressing.js');
      const { LAYOUT: LY } = await import('./src/world/stages/aquarium/layout.js');
      const TYPES = ['aquarium_cornerguard', 'aquarium_fluke', 'aquarium_pilaster', 'aquarium_trolleystack'];
      const PLATES = ['FEEDING DECK', 'WHALE BENCH', 'KELP RAMP', 'GELATO'];
      const DRESSED = ['feeding-step', 'whale-bench', 'kelp-parapet', 'trolley-stack', 'icecream-cart'];
      const kit6 = new PK(null, { headless: true });
      let nIt = 0; for (const it of DF('aquarium')) if (TYPES.includes(it.type) || (it.type === 'aquarium_plate' && PLATES.includes(it.lines?.[0]?.[0]))) { kit6.add(it.type, it); nIt++; }
      const mir = (d) => (d.kind === 'box' ? { ...d, min: [-d.max[0], d.min[1], -d.max[2]], max: [-d.min[0], d.max[1], -d.min[2]] } : d.kind === 'obox' ? { ...d, center: [-d.center[0], d.center[1], -d.center[2]] } : { ...d, low: [-d.low[0], d.low[1], -d.low[2]], high: [-d.high[0], d.high[1], -d.high[2]] });
      const blocks = LY.half.filter((d) => DRESSED.includes(d.tag)).flatMap((d) => [d, mir(d)]);
      const fp = (d, x, z) => {
        if (d.kind === 'box') { const dx = Math.max(d.min[0] - x, 0, x - d.max[0]), dz = Math.max(d.min[2] - z, 0, z - d.max[2]); return [Math.hypot(dx, dz), d.max[1], Math.min(x - d.min[0], d.max[0] - x, z - d.min[2], d.max[2] - z)]; }
        if (d.kind === 'obox') { const a = d.rotY * DEG, c = Math.cos(a), s = Math.sin(a), dx = x - d.center[0], dz = z - d.center[2], u = dx * c - dz * s, v = dx * s + dz * c, hu = d.size[0] / 2, hv = d.size[2] / 2; return [Math.hypot(Math.max(Math.abs(u) - hu, 0), Math.max(Math.abs(v) - hv, 0)), d.center[1] + d.size[1] / 2, Math.min(hu - Math.abs(u), hv - Math.abs(v))]; }
        const [lx, ly, lz] = d.low, [hx, hy, hz] = d.high, run = Math.hypot(hx - lx, hz - lz), ux = (hx - lx) / run, uz = (hz - lz) / run, dx = x - lx, dz = z - lz, al = dx * ux + dz * uz, lat = -dx * uz + dz * ux;
        return [Math.hypot(Math.max(Math.abs(lat) - d.width / 2, 0), Math.max(-al, 0, al - run)), ly + (Math.max(0, Math.min(run, al)) * (hy - ly)) / run, Math.min(d.width / 2 - Math.abs(lat), al, run - al)];
      };
      const st = { n: 0, far: 0, atFar: null, onTop: 0, atTop: null };
      const v3 = new G.camera.position.constructor();
      for (const parts of kit6._buckets.values()) for (const p of parts) {
        const P = p.g.attributes.position;
        for (let i = 0; i < P.count; i++) {
          v3.fromBufferAttribute(P, i).applyMatrix4(p.m); st.n++;
          let best = 9, on = null, hugs = false;
          for (const d of blocks) {
            const [out, top, inset] = fp(d, v3.x, v3.z);
            best = Math.min(best, out);
            if (out === 0 && inset > 0.02 && v3.y > top + 0.003 && v3.y < top + 1.5) on = d;
            if (out <= 0.085 && top > v3.y + 0.003) hugs = true;
          }
          if (on && !hugs) { st.onTop++; st.atTop = [on.tag, +v3.x.toFixed(2), +v3.y.toFixed(2), +v3.z.toFixed(2)]; }
          if (best > st.far) { st.far = best; st.atFar = [+v3.x.toFixed(2), +v3.y.toFixed(2), +v3.z.toFixed(2)]; }
        }
      }
      R('this round\'s props (the Feeding Step\'s plates and corner guards, the flukes, the parapet\'s pilasters and plate, the trolleys\' casters and push bars, the carts\' menu boards) stand within 8.5 cm of the blocks they dress and none on a walkable top, both halves',
        nIt >= 24 && st.n > 3000 && st.far <= 0.085 && st.onTop === 0, { placements: nIt, verts: st.n, farthest: +st.far.toFixed(3), at: st.atFar, onTop: st.onTop, atTop: st.atTop });
      // (i) the Penguin Steps' granite nosing (LEAD-REVIEW 6): out to r 31.4, so no promenade cell reaches past its face over
      // the steps' top tread (they reached r 31.35 against its old r 31.2)
      const ax = dir(-120.275), pr = [-ax[1], ax[0]];
      let reach = 0;
      for (const d of LY.half.filter((q) => q.tag === 'promenade')) for (const [x, z] of [[d.min[0], d.min[2]], [d.max[0], d.min[2]], [d.max[0], d.max[2]], [d.min[0], d.max[2]]]) {
        const r = x * ax[0] + z * ax[1], l = x * pr[0] + z * pr[1];
        if (Math.abs(l) < 2.45 && r > 29.5 && r < 33) reach = Math.max(reach, r);
      }
      const nd = LY.half.find((q) => q.tag === 'penguin-nosing'), a = nd.rotY * DEG, hu = nd.size[0] / 2, hv = nd.size[2] / 2;
      const nr = Math.max(...[[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([i, k]) => { const x = nd.center[0] + Math.cos(a) * hu * i + Math.sin(a) * hv * k, z = nd.center[2] - Math.sin(a) * hu * i + Math.cos(a) * hv * k; return x * ax[0] + z * ax[1]; }));
      R('the Penguin Steps\' granite nosing covers the promenade\'s cells at their head (they ran out past it in a row of teak teeth)', nr >= 31.39 && reach > 30.5 && reach <= nr + 0.005, { nosingTo: +nr.toFixed(3), cellsTo: +reach.toFixed(3) });
    }
    m.actors.forEach((a, i) => { a.bot = brains[i]; });
    G.paint.clear?.();
  }
  // 11. fix round 7 (LEAD-REVIEW 7, the list LEAD-NOTES "After review 7" binds): the Ticket Hall booth's glazing stands proud
  // of its block on both TICKETS faces; every kiosk's other faces are dressed (the trade's boards: the ice-cream flavours
  // board and side shutters, the souvenir posters, the ferry route board and service door; the frieze's faience speed lines
  // round every face); the luggage scale's faces carry their stencil and riveted panel under the ink; this round's props
  // stand within 8.5 cm of their blocks, under the kiosks' cornices and the scale's top, never on a walkable top
  {
    const gl = G.renderer.getContext(), V = (a) => new G.camera.position.constructor(a[0], a[1], a[2]);
    const DEG = Math.PI / 180;
    const lum = (c) => 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2];
    const px = (p) => { const v = V(p).project(G.camera), w = gl.drawingBufferWidth, h = gl.drawingBufferHeight, a = new Uint8Array(4 * 9); gl.readPixels(Math.round((v.x + 1) / 2 * w) - 1, Math.round((v.y + 1) / 2 * h) - 1, 3, 3, gl.RGBA, gl.UNSIGNED_BYTE, a); const c = [0, 0, 0]; for (let i = 0; i < 9; i++) for (let k = 0; k < 3; k++) c[k] += a[i * 4 + k] / 9; return c.map(Math.round); };
    const shot = (from, look, n = 24) => { G.paint.clear?.(); g.rig.cinematic(V(from), V(from), V(look), V(look), 99, () => {}); for (let i = 0; i < n; i++) g.debug.step(1000 / 60); };
    const tw = (p, s) => [s * p[0], p[1], s * p[2]];
    const med = (a) => { const b = [...a].sort((x, y) => x - y); return b[b.length >> 1]; };
    const brains = m.actors.map((a) => a.bot); for (const a of m.actors) a.bot = null;
    const fov0 = g.settings.fov; g.settings.fov = 70;   // (the slot profile's saved fov can be narrow: the reads need the frame)
    g.debug.freeze?.();
    const { dressingFor: DF } = await import('./src/world/dressing.js');
    // (a) the ticket booth: both z faces read the teal glass at y 2.8 (they read the block's cream render), both halves
    const booth = [];
    for (const s of [1, -1]) {
      shot(tw([9.1, 2.9, -37.6], s), tw([9.1, 2.6, -41.0], s));
      const n = [8.45, 8.75].map((x) => px(tw([x, 2.8, -39.955], s)));   // (west of the canopy column standing in front of its east half)
      const nb = px(tw([8.6, 2.1, -39.955], s));                           // (the booth's render base under it, on the same face)
      shot(tw([10.5, 2.9, -44.5], s), tw([9.1, 2.6, -41.0], s));
      const f = [8.65, 9.55].map((x) => px(tw([x, 2.8, -42.045], s))), fb = px(tw([9.1, 2.1, -42.045], s));
      booth.push({ s, north: n, northBase: nb, south: f, southBase: fb });
    }
    R('the Ticket Hall booth\'s glazing stands proud of its block: both TICKETS faces read teal glass at 2.8 m (darker than the render base under it, blue), not the block\'s cream render, both halves',
      booth.every((c) => c.north.every((k) => lum(k) < 0.6 * lum(c.northBase) && k[2] > k[0] + 20) && c.south.every((k) => lum(k) < 0.6 * lum(c.southBase) && k[2] > k[0] + 20)), booth);
    // the kiosks (their placements, both halves; the round's own faces dress the same frames): a point on face s (0 the front, 1 local +x, 2 the back, 3 −x),
    // fx along it, fy over the kiosk's foot, fz out of the block's face; a camera 2.4 m out at eye level, square to it (the
    // backs: 2.6 m out and 0.7 m to one side, past the telescope post behind the promenade's souvenir kiosk)
    const KF = DF('aquarium').filter((p) => p.type === 'aquarium_kiosk' && p.kind !== 'timetable');
    const kw = (p, s, fx, fy, fz) => {
      const F = s % 2 ? p.w / 2 : p.d / 2, ph = (s * Math.PI) / 2, t = p.rotY || 0;
      const lx = fx * Math.cos(ph) + (fz + F) * Math.sin(ph), lz = -fx * Math.sin(ph) + (fz + F) * Math.cos(ph);
      return [p.pos[0] + lx * Math.cos(t) + lz * Math.sin(t), p.pos[1] + fy, p.pos[2] - lx * Math.sin(t) + lz * Math.cos(t)];
    };
    const kshot = (p, s) => shot(kw(p, s, s === 2 ? -0.7 : 0, 1.7, s === 2 ? 2.6 : 2.4), kw(p, s, 0, 1.45, 0));
    const ks = [];
    for (const p of KF) {
      const top = p.h - 0.345, row = { kind: p.kind, at: p.pos.map((v) => +v.toFixed(1)) };
      // the back: the trade's board (dark: sea-green, sea-blue or navy) against the render pilaster at its corner; the
      // frieze's middle faience speed line
      kshot(p, 2);
      const pil = px(kw(p, 2, -(p.w / 2 - 0.04), 1.2, 0.051));
      const field = p.kind === 'icecream' ? [[-0.15, 1.13], [0.2, 1.13], [0.5, 1.13], [0.75, 1.13], [0.05, 1.42], [0.35, 1.42], [0.65, 1.42], [-0.85, 1.9], [0.85, 1.25]]
        : p.kind === 'souvenir' ? [[0.45, 1.12], [0.6, 1.12], [-0.45, 1.12], [-0.6, 1.12], [0.5, 1.45], [0.6, 1.5], [-0.6, 1.7], [0.6, 1.7]]
          : [[0.7, 1.2], [-0.7, 1.2], [0.7, 1.5], [-0.7, 1.5], [0.25, 1.5], [-0.25, 1.5], [0, 1.27]];
      const fv = field.map(([x, y]) => px(kw(p, 2, x, y, 0.06)));
      row.board = { med: Math.round(med(fv.map(lum))), pil: Math.round(lum(pil)), gb: Math.round(med(fv.map((c) => Math.max(c[1], c[2]) - c[0]))) };
      row.line = px(kw(p, 2, 0.3, top - 0.1175, 0.06)); row.gap = px(kw(p, 2, 0.3, top - 0.152, 0.04));
      // the sides: the ice-cream kiosk's striped shutters (cream and faience stripes along a row), the ferry kiosk's navy
      // service door on its free side (local −x)
      if (p.kind === 'icecream') for (const s of [1, 3]) {
        kshot(p, s);
        const r = Array.from({ length: 29 }, (_, i) => px(kw(p, s, -0.7 + i * 0.05, 1.35, 0.045)));
        // (the stripes alternate in hue: g − r swings across the row, in sun or in shade)
        const gr = r.map((c) => c[1] - c[0]), hi = Math.max(...gr), lo = Math.min(...gr), mid = (hi + lo) / 2;
        row['shutter' + s] = { span: hi - lo, faience: gr.filter((v) => v > mid + 3).length, cream: gr.filter((v) => v < mid - 3).length };
      }
      if (p.kind === 'ferry') {
        kshot(p, 3);
        const dv = [[0.2, 0.6], [-0.2, 0.6], [0.2, 0.85], [-0.2, 0.85], [-0.2, 1.6], [0, 0.5]].map(([x, y]) => px(kw(p, 3, x, y, 0.065)));
        const dp = px(kw(p, 3, -(p.d / 2 - 0.04), 1.2, 0.051));
        row.door = { med: Math.round(med(dv.map(lum))), pil: Math.round(lum(dp)), bluish: dv.filter((c) => c[2] >= c[0]).length };
      }
      ks.push(row);
    }
    R('every kiosk\'s back carries its trade\'s board (ice cream: the sea-green flavours board; souvenirs: the sea-blue GIFTS poster; ferry: the navy route board), darker than the render pilaster at its corner, both halves',
      ks.length === 8 && ks.every((c) => c.board.med < 0.62 * c.board.pil && c.board.gb > 0), ks.map((c) => ({ kind: c.kind, at: c.at, board: c.board })));
    R('the kiosks\' frieze carries the faience speed lines round the back (they read the block\'s cream under the cornice), both halves',
      ks.every((c) => c.line[1] - c.line[0] > c.gap[1] - c.gap[0] + 6), ks.map((c) => ({ kind: c.kind, at: c.at, line: c.line, gap: c.gap })));
    R('the ice-cream kiosks\' sides are striped service shutters (cream and faience stripes), the ferry kiosks\' free sides a navy service door, both halves',
      ks.filter((c) => c.kind === 'icecream').length === 2 && ks.filter((c) => c.kind === 'ferry').length === 2
        && ks.every((c) => c.kind !== 'icecream' || [1, 3].every((s) => c['shutter' + s].span >= 12 && c['shutter' + s].faience >= 6 && c['shutter' + s].cream >= 6))
        && ks.every((c) => c.kind !== 'ferry' || (c.door.med < 0.62 * c.door.pil && c.door.bluish >= 5)),
      ks.filter((c) => c.kind !== 'souvenir').map((c) => ({ kind: c.kind, at: c.at, shutter1: c.shutter1, shutter3: c.shutter3, door: c.door })));
    // (b) the luggage scale (x 2.6 … 3.8, z −40.85 … −39.85, 1.2 → 2.4): its long faces stencilled (dark letters along the
    // LUGGAGE line), its back a raised frame round a recessed panel; ink splatted on it shows over it, both halves
    const sc = [];
    for (const s of [1, -1]) {
      const r = { s };
      // (the north face from the north-east: a canopy column stands square in front of it; the letters' east half)
      for (const [k, z, from] of [['north', -39.85, [5.18, 2.9, -38.37]], ['south', -40.85, [3.2, 2.9, -43.15]]]) {
        shot(tw(from, s), tw([3.2, 1.95, z], s));
        const L = Array.from({ length: 26 }, (_, i) => lum(px(tw([3.1 + i * 0.0185, 2.063, z + Math.sign(z + 40.35) * 0.003], s))));
        r[k] = { min: Math.round(Math.min(...L)), max: Math.round(Math.max(...L)) };
      }
      shot(tw([0.4, 2.9, -40.35], s), tw([2.6, 1.9, -40.35], s));
      r.back = { frame: Math.round(lum(px(tw([2.597, 2.0, -39.925], s)))), panel: Math.round(lum(px(tw([2.597, 2.0, -40.2], s)))) };   // (the frame 7.5 cm in from the edge: off its bevel and its rivets)
      sc.push(r);
    }
    R('the luggage scale\'s long faces carry LUGGAGE · WEIGH HERE · MAX 25 KG stencilled (dark letters on the brass) and its back a raised frame round a recessed panel, both halves',
      sc.every((c) => ['north', 'south'].every((k) => c[k].max - c[k].min > 15 && c[k].min < 0.5 * c[k].max) && c.back.frame > 1.1 * c.back.panel), sc);
    shot([5.18, 2.9, -38.37], [3.2, 1.95, -39.85]);
    const sb = px([3.4, 1.7, -39.85]); G.paint.splat(V([3.4, 1.7, -39.83]), 0.4, 0, { instant: true }); for (let i = 0; i < 6; i++) g.debug.step(1000 / 60);
    const si = px([3.4, 1.7, -39.85]), moved = Math.abs(si[0] - sb[0]) + Math.abs(si[1] - sb[1]) + Math.abs(si[2] - sb[2]);
    R('ink splatted on the luggage scale\'s face shows over its panel (the art is under the ink)', moved > 90, { bare: sb, inked: si, moved });
    // (c) this round's props: the kiosks' faces within 8.5 cm of their blocks and under the cornice (its underside h − 0.345
    // over the foot), the scale's trim within 8.5 cm and under its top; none on a walkable top (a headless build, both halves)
    {
      const { PropKit: PK } = await import('./src/world/props.js');
      const { LAYOUT: LY } = await import('./src/world/stages/aquarium/layout.js');
      const kit7 = new PK(null, { headless: true });
      let nIt = 0; for (const it of DF('aquarium')) if (it.type === 'aquarium_kioskfaces' || it.type === 'aquarium_scaletrim') { kit7.add(it.type, it); nIt++; }
      const mir = (d) => (d.kind === 'box' ? { ...d, min: [-d.max[0], d.min[1], -d.max[2]], max: [-d.min[0], d.max[1], -d.min[2]] } : { ...d, center: [-d.center[0], d.center[1], -d.center[2]] });
      const blocks = LY.half.filter((d) => ['kiosk', 'ferry-kiosk', 'souvenir-kiosk', 'luggage-scale'].includes(d.tag)).flatMap((d) => [d, mir(d)]);
      const cap = (d) => (d.tag === 'luggage-scale' ? d.max[1] : d.center[1] + d.size[1] / 2 - 0.345);
      const fp = (d, x, z) => {
        if (d.kind === 'box') { const dx = Math.max(d.min[0] - x, 0, x - d.max[0]), dz = Math.max(d.min[2] - z, 0, z - d.max[2]); return Math.hypot(dx, dz); }
        const a = d.rotY * DEG, c = Math.cos(a), s = Math.sin(a), dx = x - d.center[0], dz = z - d.center[2], u = dx * c - dz * s, v = dx * s + dz * c;
        return Math.hypot(Math.max(Math.abs(u) - d.size[0] / 2, 0), Math.max(Math.abs(v) - d.size[2] / 2, 0));
      };
      const st = { n: 0, far: 0, atFar: null, over: 0, atOver: null };
      const v3 = new G.camera.position.constructor();
      for (const parts of kit7._buckets.values()) for (const p of parts) {
        const P = p.g.attributes.position;
        for (let i = 0; i < P.count; i++) {
          v3.fromBufferAttribute(P, i).applyMatrix4(p.m); st.n++;
          let best = 9, near = null;
          for (const d of blocks) { const o = fp(d, v3.x, v3.z); if (o < best) { best = o; near = d; } }
          if (best > st.far) { st.far = best; st.atFar = [+v3.x.toFixed(2), +v3.y.toFixed(2), +v3.z.toFixed(2)]; }
          if (near && v3.y > cap(near) + 0.002) { st.over++; st.atOver = [near.tag, +v3.x.toFixed(2), +v3.y.toFixed(2), +v3.z.toFixed(2)]; }
        }
      }
      R('this round\'s props (the kiosks\' skirting, pilasters, frieze, speed lines and boards; the scale\'s kick plates and maker\'s plate) stand within 8.5 cm of their blocks, under the kiosks\' cornices and the scale\'s top, both halves',
        nIt === 10 && st.n > 3000 && st.far <= 0.085 && st.over === 0, { placements: nIt, verts: st.n, farthest: +st.far.toFixed(3), at: st.atFar, overTop: st.over, atOver: st.atOver });
    }
    g.settings.fov = fov0;
    m.actors.forEach((a, i) => { a.bot = brains[i]; });
    G.paint.clear?.();
  }
  // 12. fix round 8 (LEAD-REVIEW 8, the list LEAD-NOTES "After review 8" binds): the Express OUT stop's long faces carry the
  // IN stop's speed lines 0.62 m over the stop's own floor (they were drawn at 0.62 over the foundations' frame, inside
  // Penguin Point's 1.2 m rock terrace), the Ticket Hall booth's base its price plates and granite skirting, the Reef
  // Window's short west run its speed lines and its open ends (α −70, the Service Gate's −67 and −58) render jambs where
  // the reef showed through; this round's props stand within 8.5 cm of their blocks and under their tops
  {
    const gl = G.renderer.getContext(), V = (a) => new G.camera.position.constructor(a[0], a[1], a[2]);
    const DEG = Math.PI / 180;
    const lum = (c) => 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2];
    const px = (p) => { const v = V(p).project(G.camera), w = gl.drawingBufferWidth, h = gl.drawingBufferHeight, a = new Uint8Array(4 * 9); gl.readPixels(Math.round((v.x + 1) / 2 * w) - 1, Math.round((v.y + 1) / 2 * h) - 1, 3, 3, gl.RGBA, gl.UNSIGNED_BYTE, a); const c = [0, 0, 0]; for (let i = 0; i < 9; i++) for (let k = 0; k < 3; k++) c[k] += a[i * 4 + k] / 9; return c.map(Math.round); };
    const shot = (from, look, n = 24) => { G.paint.clear?.(); g.rig.cinematic(V(from), V(from), V(look), V(look), 99, () => {}); for (let i = 0; i < n; i++) g.debug.step(1000 / 60); };
    const tw = (p, s) => [s * p[0], p[1], s * p[2]];
    const med = (a) => { const b = [...a].sort((x, y) => x - y); return b[b.length >> 1]; };
    const gr = (c) => c[1] - c[0];
    const brains = m.actors.map((a) => a.bot); for (const a of m.actors) a.bot = null;
    const fov0 = g.settings.fov; g.settings.fov = 70;
    g.debug.freeze?.();
    const { W: Wb } = await import('./src/world/stages/aquarium/geo.js');
    // (a) the OUT stop (the blade frame bl(−3.7, −15.0): local x = w + 15, local z = −(s + 3.7); its long faces at local
    // x ±1.2 on the 1.2 m terrace): its middle speed line (1.96) greener than the render between it and the lowest (1.89),
    // on the court face from 2.6 m out and on the glass face from the 0.8 m strip beside the penguin glass, both halves
    const blp = (lx, y, lz) => { const [x, z] = Wb(-3.7 - lz, -15.0 + lx); return [x, y, z]; };
    const stop = [];
    for (const s of [1, -1]) for (const [face, cx, cy, lzs] of [['court', 3.8, 2.9, [0.9, -0.9]], ['glass', -1.95, 2.0, [0.3, -0.3]]]) {
      const fx = Math.sign(cx) * 1.2;
      shot(tw(blp(cx, cy, 0), s), tw(blp(fx, 1.96, 0), s));
      for (const lz of lzs) {
        const line = px(tw(blp(fx + Math.sign(cx) * 0.046, 1.96, lz), s)), gap = px(tw(blp(fx + Math.sign(cx) * 0.003, 1.89, lz), s));
        stop.push({ s, face, lz, line, gap, d: gr(line) - gr(gap) });
      }
    }
    R('the Express OUT stop\'s long faces carry their faience speed lines over the stop\'s own floor (0.62 m over the 1.2 m terrace: greener than the render between them), both faces, both halves',
      stop.length === 8 && stop.every((c) => c.d > 6), stop);
    // (b) the booth's base (x 8.2 … 10, z −42 … −40, 1.2 → 2.2, its faces 3 cm out): on both TICKETS faces the navy price
    // plate (1.47 … 1.83) darker than the render pilaster at the corner, and blue; on the plaza face (+x) the granite
    // skirting darker than that face's pilaster, both halves
    const booth = [];
    for (const s of [1, -1]) {
      const r = { s };
      for (const [k, z, n, from, fxs] of [['north', -39.97, 1, [8.4, 2.6, -37.9], [-0.5, -0.25, -0.1]], ['south', -42.03, -1, [9.1, 2.6, -44.6], [-0.5, -0.25, 0.25, 0.5]]]) {
        shot(tw(from, s), tw([9.1 + (k === 'north' ? -0.25 : 0), 1.65, z], s));
        const zf = z + n * 0.013;   // (the plate's board, 1.2 cm proud of the base)
        const fv = []; for (const x of fxs) for (const y of [1.5, 1.645, 1.8]) fv.push(px(tw([9.1 + x, y, zf], s)));
        const pil = px(tw([9.1 - 0.87, 1.65, z + n * 0.021], s));
        r[k] = { med: Math.round(med(fv.map(lum))), pil: Math.round(lum(pil)), blue: Math.round(med(fv.map((c) => c[2] - c[0]))) };
      }
      shot(tw([12.6, 1.7, -41.0], s), tw([10.0, 1.5, -41.0], s));
      r.plaza = { skirt: Math.round(lum(px(tw([10.046, 1.27, -41.45], s)))), pil: Math.round(lum(px(tw([10.051, 1.75, -40.03], s)))) };
      booth.push(r);
    }
    R('the Ticket Hall booth\'s base carries its price plates (navy, darker than the render pilaster at its corner) on both TICKETS faces and a granite skirting on its plaza face, both halves',
      booth.every((c) => ['north', 'south'].every((k) => c[k].med < 0.62 * c[k].pil && c[k].blue > 0) && c.plaza.skirt < 0.6 * c.plaza.pil), booth);
    // (c) the Reef Window: the short west run's outer face (the chord α −70 … −67; the outer wall's face r 32.55) carries
    // the speed lines (0.76 greener than the render at 0.69), and its ends are render jambs carrying them too (the reef
    // showed through the open ends): the Service Gate's α −67 and −58, each seen from across the gate, both halves
    const pol = (a, r, y) => [r * Math.cos(a * DEG), y, r * Math.sin(a * DEG)];
    const onChord = (ac, rm, lx, y, lz) => { const n = [Math.cos(ac * DEG), Math.sin(ac * DEG)], t = [Math.sin(ac * DEG), -Math.cos(ac * DEG)]; return [n[0] * (rm + lz) + t[0] * lx, y, n[1] * (rm + lz) + t[1] * lx]; };
    const c67 = { ac: -68.5, rm: (30.5 + 32.5 * Math.cos(1.5 * DEG)) / 2, hl: 32.5 * Math.sin(1.5 * DEG) };
    const da = 55.4 / 14, c58 = { ac: -58 + da / 2, rm: (30.5 + 32.5 * Math.cos((da / 2) * DEG)) / 2, hl: 32.5 * Math.sin((da / 2) * DEG) };
    const reef = [];
    for (const s of [1, -1]) {
      const r = { s };
      shot(tw(pol(-68.5, 35.3, 1.4), s), tw(pol(-68.5, 32.55, 0.8), s));
      r.outer = [-0.35, 0.35].map((lx) => { const line = px(tw(onChord(c67.ac, c67.rm, lx, 0.76, 32.559 - c67.rm), s)), gap = px(tw(onChord(c67.ac, c67.rm, lx, 0.69, 32.551 - c67.rm), s)); return { line, gap, d: gr(line) - gr(gap) }; });
      const jr = (c, e, lz) => { const line = px(tw(onChord(c.ac, c.rm, e * (c.hl + 0.041), 0.76, lz), s)), gap = px(tw(onChord(c.ac, c.rm, e * (c.hl + 0.031), 0.69, lz), s)); return { line, gap, d: gr(line) - gr(gap) }; };
      shot(tw(pol(-58.8, 31.5, 1.6), s), tw(pol(-66.6, 31.6, 1.1), s));
      r.j67 = [-0.4, 0.4].map((lz) => jr(c67, -1, lz));
      shot(tw(pol(-66.2, 31.5, 1.6), s), tw(pol(-58.4, 31.6, 1.1), s));
      r.j58 = [-0.4, 0.4].map((lz) => jr(c58, 1, lz));
      reef.push(r);
    }
    R('the Reef Window\'s short west run carries the faience speed lines on its outer face, and the Service Gate\'s jambs are render jambs carrying the speed lines too (the reef showed through them), both halves',
      reef.every((c) => c.outer.every((o) => o.d > 6) && [...c.j67, ...c.j58].every((j) => j.d > 6)), reef);
    // (d) this round's props (the stop's faces, the booth's base, the window's jambs and run): within 8.5 cm in plan of the
    // blocks they dress, none over a block's top (a headless build, both halves)
    {
      const { PropKit: PK } = await import('./src/world/props.js');
      const { dressingFor: DF } = await import('./src/world/dressing.js');
      const { LAYOUT: LY } = await import('./src/world/stages/aquarium/layout.js');
      const kit8 = new PK(null, { headless: true });
      const T8 = ['aquarium_stopfaces', 'aquarium_boothbase', 'aquarium_reefjambs'];
      let nIt = 0; for (const it of DF('aquarium')) if (T8.includes(it.type)) { kit8.add(it.type, it); nIt++; }
      const mir = (d) => (d.kind === 'box' ? { ...d, min: [-d.max[0], d.min[1], -d.max[2]], max: [-d.min[0], d.max[1], -d.min[2]] } : { ...d, center: [-d.center[0], d.center[1], -d.center[2]] });
      const blocks = LY.half.filter((d) => ['express-stop-out', 'ticket-booth', 'reef-window'].includes(d.tag)).flatMap((d) => [d, mir(d)]);
      const topOf = (d) => (d.kind === 'box' ? d.max[1] : d.center[1] + d.size[1] / 2);
      const fp = (d, x, z) => {
        if (d.kind === 'box') { const dx = Math.max(d.min[0] - x, 0, x - d.max[0]), dz = Math.max(d.min[2] - z, 0, z - d.max[2]); return Math.hypot(dx, dz); }
        const a = d.rotY * DEG, c = Math.cos(a), sn = Math.sin(a), dx = x - d.center[0], dz = z - d.center[2], u = dx * c - dz * sn, v = dx * sn + dz * c;
        return Math.hypot(Math.max(Math.abs(u) - d.size[0] / 2, 0), Math.max(Math.abs(v) - d.size[2] / 2, 0));
      };
      const st = { n: 0, far: 0, atFar: null, over: 0, atOver: null, per: {} };
      const v3 = new G.camera.position.constructor();
      for (const parts of kit8._buckets.values()) for (const p of parts) {
        const P = p.g.attributes.position;
        for (let i = 0; i < P.count; i++) {
          v3.fromBufferAttribute(P, i).applyMatrix4(p.m); st.n++;
          let best = 9, near = null;
          for (const d of blocks) { const o = fp(d, v3.x, v3.z); if (o < best) { best = o; near = d; } }
          if (near) st.per[near.tag] = Math.max(st.per[near.tag] || 0, +best.toFixed(3));
          if (best > st.far) { st.far = best; st.atFar = [near?.tag, +v3.x.toFixed(2), +v3.y.toFixed(2), +v3.z.toFixed(2)]; }
          if (near && v3.y > topOf(near) + 0.002) { st.over++; st.atOver = [near.tag, +v3.x.toFixed(2), +v3.y.toFixed(2), +v3.z.toFixed(2)]; }
        }
      }
      R('this round\'s props (the OUT stop\'s skirting, pilasters, speed lines, portholes and ARRIVALS plate; the booth base\'s skirting, pilasters, speed lines, ledges, grilles and plates; the Reef Window\'s jambs, pilasters, lines and plate) stand within 8.5 cm of their blocks and under their tops, both halves',
        nIt === 6 && st.n > 3000 && st.far <= 0.085 && st.over === 0, { placements: nIt, verts: st.n, farthest: +st.far.toFixed(3), at: st.atFar, perBlock: st.per, overTop: st.over, atOver: st.atOver });
    }
    g.settings.fov = fov0;
    m.actors.forEach((a, i) => { a.bot = brains[i]; });
    G.paint.clear?.();
  }
  // 13. fix round 9 (LEAD-REVIEW 9, the list LEAD-NOTES "After review 9" binds): the Arch Line's riser shafts (empty white
  // boxes behind 2.25 × 8.4 m of glass) carry their dressing — the navy ARCH LINE · RISER plate on the back wall facing the
  // glass, the granite skirting under white glazed tile (cooler than the hall's render) — on both shafts, both halves; their
  // parts (ladder, guide brackets, plate, lamps) stand ≥ 0.15 m clear of the riser's glass and inside the shafts, in the
  // dressing's existing material buckets (no draw call added); the Kelp Balcony's end face is render at u 5.0 (plain teak at
  // 4df530c8); the Express IN stop's long faces carry the OUT stop's skirting and portholes; the Reef Window's jambs a
  // porthole into the reef; this round's props within 8.5 cm of their blocks and under their tops (they fail at 4df530c8)
  {
    const gl = G.renderer.getContext(), V = (a) => new G.camera.position.constructor(a[0], a[1], a[2]);
    const DEG = Math.PI / 180;
    const lum = (c) => 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2];
    const px = (p) => { const v = V(p).project(G.camera), w = gl.drawingBufferWidth, h = gl.drawingBufferHeight, a = new Uint8Array(4 * 9); gl.readPixels(Math.round((v.x + 1) / 2 * w) - 1, Math.round((v.y + 1) / 2 * h) - 1, 3, 3, gl.RGBA, gl.UNSIGNED_BYTE, a); const c = [0, 0, 0]; for (let i = 0; i < 9; i++) for (let k = 0; k < 3; k++) c[k] += a[i * 4 + k] / 9; return c.map(Math.round); };
    const shot = (from, look, n = 24) => { G.paint.clear?.(); g.rig.cinematic(V(from), V(from), V(look), V(look), 99, () => {}); for (let i = 0; i < n; i++) g.debug.step(1000 / 60); };
    const tw = (p, s) => [s * p[0], p[1], s * p[2]];
    const med = (a) => { const b = [...a].sort((x, y) => x - y); return b[b.length >> 1]; };
    const brains = m.actors.map((a) => a.bot); for (const a of m.actors) a.bot = null;
    const fov0 = g.settings.fov; g.settings.fov = 70;
    g.debug.freeze?.();
    const hide = m.actors.map((a) => a.character.root.visible); for (const a of m.actors) a.character.root.visible = false;
    // (a) the shafts, read with the glass in front of them hidden (the hall's glass, the riser's tube and collars: through
    // them every value is lifted 40–100 by the glass's tint and the sun's reflection; the pictures show them with it): from
    // the hall floor at 1.7 m, 2.6 m off the glass (the review's x9-shaft-0 / -3), the plate's median (12 points on its
    // board) darker than the tile under it and blue; the granite skirting at 8 cm on the court-side wall by the glass darker
    // than the tile over it (the render's own contact shadow there is 0.7–0.8 of it); from inside the glass line, a column
    // across two tile joints on that wall (the joints' dips: the render has none)
    const glassy = []; G.scene.traverse((o) => { if (['aq-glass', 'pipes:glass', 'pipes:glass-back', 'pipes:hardware'].includes(o.name)) glassy.push([o, o.visible]); });
    for (const [o] of glassy) o.visible = false;
    const shafts = [];
    for (const s of [1, -1]) for (const sx of [1, -1]) {
      const y0 = sx > 0 ? 2.3 : 1.4, xb = sx * 8.487;
      shot(tw([sx * 2.6, 1.7, -27.1], s), tw([sx * 8.47, y0 + 0.4, -27.13], s));
      const pv = []; for (const dz of [-0.4, -0.2, 0.2, 0.4]) for (const dy of [0.04, 0.17, 0.31]) pv.push(px(tw([xb, y0 + dy, -27.13 + dz], s)));
      const tile = px(tw([xb, sx > 0 ? 2.185 : 1.285, -26.675], s));          // (a tile's middle under the plate)
      const plate = { med: Math.round(med(pv.map(lum))), blue: Math.round(med(pv.map((c) => c[2] - c[0]))), tile: Math.round(lum(tile)) };
      shot(tw([sx * 3.0, 1.3, -27.4], s), tw([sx * 6.8, 0.5, -26.2], s));
      const skirt = Math.round(lum(px(tw([sx * 6.625, 0.08, -26.004], s)))), over = Math.round(lum(px(tw([sx * 6.625, 1.135, -26.004], s))));
      shot(tw([sx * 6.3, 1.2, -27.3], s), tw([sx * 7.3, 1.12, -26.0], s));
      const col = []; for (let y = 0.98; y <= 1.3; y += 0.01) col.push(lum(px(tw([sx * 7.225, y, -26.003], s))));
      shafts.push({ s, shaft: sx > 0 ? 'east' : 'west', plate, skirt, over, joints: +(Math.min(...col) / med(col)).toFixed(2) });
    }
    for (const [o, v] of glassy) o.visible = v;
    R('the riser shafts are dressed (read with the glass hidden): the ARCH LINE · RISER plate on each back wall (navy: darker than the tile under it, blue), the granite skirting under the tile, the tile\'s joints, both shafts, both halves',
      shafts.length === 4 && glassy.length >= 2 && shafts.every((c) => c.plate.med < 0.5 * c.plate.tile && c.plate.blue > 5 && c.skirt < 0.5 * c.over && c.joints < 0.8), { glassHidden: glassy.map(([o]) => o.name), shafts });
    // (b) the shafts' parts: a headless build of both placements — every vertex ≥ 1.03 m from the Arch Line's centreline
    // (its glass r 0.88 + 0.15; the twin's for Bravo's), inside its shaft (x ±6.15 … ±8.5, z −28.25 … −26.0, 0 … 8.4), and
    // in the material buckets the rest of the dressing already has (one draw call each: none added)
    {
      const { PropKit: PK } = await import('./src/world/props.js');
      const { dressingFor: DF } = await import('./src/world/dressing.js');
      const { PIPES, allLegs, centreline } = await import('./src/world/stages/aquarium/tubeway.js');
      const kitA = new PK(null, { headless: true }), kitB = new PK(null, { headless: true });
      let nIt = 0; for (const it of DF('aquarium')) { if (it.type === 'aquarium_shafts') { kitB.add(it.type, it); nIt++; } else kitA.add(it.type, it); }
      const CL = [];
      for (const L of allLegs(PIPES).filter((l) => l.id.startsWith('arch'))) {
        const c = centreline(L, 0.05);
        for (let i = 1; i < c.length; i++) { const a = c[i - 1], b = c[i], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) / 0.02)); for (let k = 0; k <= n; k++) CL.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n, a[2] + ((b[2] - a[2]) * k) / n]); }
      }
      const st = { n: 0, min: 9, atMin: null, under110: 0, out: 0, atOut: null };
      const v3 = new G.camera.position.constructor();
      for (const parts of kitB._buckets.values()) for (const p of parts) {
        const P = p.g.attributes.position;
        for (let i = 0; i < P.count; i++) {
          v3.fromBufferAttribute(P, i).applyMatrix4(p.m); st.n++;
          let d = 9; for (const q of CL) { const e = Math.hypot(v3.x - q[0], v3.y - q[1], v3.z - q[2]); if (e < d) d = e; }
          if (d < st.min) { st.min = d; st.atMin = [+v3.x.toFixed(2), +v3.y.toFixed(2), +v3.z.toFixed(2)]; }
          if (d < 1.1) st.under110++;
          const ax = Math.abs(v3.x), az = v3.z * Math.sign(v3.z);   // (Bravo's twin: (x, z) → (−x, −z))
          if (ax < 6.14 || ax > 8.51 || az < 25.99 || az > 28.26 || v3.y < -0.01 || v3.y > 8.41) { st.out++; st.atOut = [+v3.x.toFixed(2), +v3.y.toFixed(2), +v3.z.toFixed(2)]; }
        }
      }
      // (and from the riser's brass collars, r 0.95: the Tubeway's hardware mesh, every vertex of it within the shafts)
      const hwV = []; G.scene.traverse((o) => { if (o.name === 'pipes:hardware') { const P = o.geometry.attributes.position; for (let i = 0; i < P.count; i++) { const x = P.getX(i), z = P.getZ(i); if (Math.abs(x) > 6.0 && Math.abs(x) < 8.6 && Math.abs(z) > 25.9 && Math.abs(z) < 28.4) hwV.push([x, P.getY(i), z]); } } });
      let minHw = 9;
      for (const parts of kitB._buckets.values()) for (const p of parts) {
        const P = p.g.attributes.position;
        for (let i = 0; i < P.count; i++) { v3.fromBufferAttribute(P, i).applyMatrix4(p.m); for (const q of hwV) { const e = Math.hypot(v3.x - q[0], v3.y - q[1], v3.z - q[2]); if (e < minHw) minHw = e; } }
      }
      st.collarVerts = hwV.length; st.minToCollar = +minHw.toFixed(3);
      const keysA = new Set(kitA._buckets.keys()), keysB = [...kitB._buckets.keys()];
      R('the riser shafts\' parts (the caged ladder, the guide brackets, the plates, the caged lamps) stand ≥ 0.15 m clear of the riser\'s glass (≥ 1.03 m from its centreline) and inside their shafts, both halves, in the dressing\'s existing material buckets (no draw call added)',
        nIt === 2 && st.n > 5000 && st.min >= 1.03 && st.out === 0 && keysB.every((k) => keysA.has(k)),
        { placements: nIt, verts: st.n, minClear: +st.min.toFixed(3), at: st.atMin, vertsUnder110: st.under110, collarVerts: st.collarVerts, minToCollar: st.minToCollar, outside: st.out, atOut: st.atOut, buckets: keysB, newBuckets: keysB.filter((k) => !keysA.has(k)) });
    }
    // (c) the Kelp Balcony's open end (the W drum's bearing-255 end face, Alpha's frame: u along the segment's bearing 247.5
    // from the drum's centre, v 0.9397): render at u 5.0 as at u 6.6 (the gate left u < 5.6 plain teak), at 2.9 m, both halves
    const balc = [];
    for (const s of [1, -1]) {
      const am = 247.5 * DEG, dm = [Math.cos(am), Math.sin(am)], pm = [-dm[1], dm[0]];
      const at = (u, y) => [-25 + u * dm[0] + 0.9417 * pm[0], y, u * dm[1] + 0.9417 * pm[1]];
      shot(tw([-23.6, 4.1, -6.5], s), tw(at(5.8, 3.0), s));
      const a = px(tw(at(5.0, 2.9), s)), b = px(tw(at(6.6, 2.9), s));
      balc.push({ s, u50: a, u66: b, ratio: +(lum(a) / Math.max(1, lum(b))).toFixed(2) });
    }
    R('the Kelp Balcony\'s open end face is render at u 5.0 as at u 6.6 (its inner metre was plain dark teak: darker and red over blue), both halves', balc.every((c) => c.ratio > 0.8 && c.u50[2] >= c.u50[0]), balc);
    // (d) the Express IN stop (the blade frame bl(22.75, 14.65): local x = w − 14.65, local z = −(s − 22.75); its long faces
    // at local z ±1.75 from the plaza's floor): the granite skirting (0.08) darker than the render at 0.4, the porthole glass
    // either side of the roundel (±1.42, 1.9) darker than the render at (±1.0, 1.9), both faces, both halves
    const { W: Wb } = await import('./src/world/stages/aquarium/geo.js');
    const blp = (lx, y, lz) => { const [x, z] = Wb(22.75 - lz, 14.65 + lx); return [x, y, z]; };
    const stopIn = [];
    // (the plaza face: the court face stands over the Pump Hall's bund, 1.2 m, behind the third sand filter 1.5 m off it)
    for (const s of [1, -1]) for (const fz of [-1]) {
      shot(tw(blp(0, 1.7, fz * 4.8), s), tw(blp(0, 1.4, fz * 1.75), s));
      const f = (lx, y) => px(tw(blp(lx, y, fz * 1.753), s));
      const ren = lum(f(0.95, 0.4)), sk = lum(f(0.95, 0.08)), pt = [-1.42, 1.42].map((x) => lum(px(tw(blp(x, 1.9, fz * 1.762), s)))), pr = [-1.0, 1.0].map((x) => lum(f(x, 1.9)));
      stopIn.push({ s, face: fz > 0 ? 'court' : 'plaza', render: Math.round(ren), skirt: Math.round(sk), ports: pt.map(Math.round), beside: pr.map(Math.round) });
    }
    R('the Express IN stop\'s plaza face carries the OUT stop\'s kiosk pass: a granite skirting (darker than the render over it) and a porthole either side of the TUBEWAY roundel (darker than the render beside it), both halves',
      stopIn.length === 2 && stopIn.every((c) => c.skirt < 0.6 * c.render && c.ports.every((p, i) => p < 0.6 * c.beside[i])), stopIn);
    // (e) the Reef Window's jambs (the Service Gate's α −67 and −58, round 8's shots across the gate): a porthole into the
    // reef at 1.6 m on the window side of the rib, its dark glass darker than the render over it at 2.5 m, both halves
    const onChord = (ac, rm, lx, y, lz) => { const n = [Math.cos(ac * DEG), Math.sin(ac * DEG)], t = [Math.sin(ac * DEG), -Math.cos(ac * DEG)]; return [n[0] * (rm + lz) + t[0] * lx, y, n[1] * (rm + lz) + t[1] * lx]; };
    const c67 = { ac: -68.5, rm: (30.5 + 32.5 * Math.cos(1.5 * DEG)) / 2, hl: 32.5 * Math.sin(1.5 * DEG) };
    const da = 55.4 / 14, c58 = { ac: -58 + da / 2, rm: (30.5 + 32.5 * Math.cos((da / 2) * DEG)) / 2, hl: 32.5 * Math.sin((da / 2) * DEG) };
    const pol = (a, r, y) => [r * Math.cos(a * DEG), y, r * Math.sin(a * DEG)];
    const jambs = [];
    for (const s of [1, -1]) {
      const zc = (c) => ((30.43 - c.rm) + (32.55 - c.rm)) / 2 - 0.62;
      const rd = (c, e) => { const g0 = px(tw(onChord(c.ac, c.rm, e * (c.hl + 0.039), 1.6, zc(c)), s)), r0 = px(tw(onChord(c.ac, c.rm, e * (c.hl + 0.031), 2.5, zc(c)), s)); return { glass: Math.round(lum(g0)), render: Math.round(lum(r0)) }; };
      shot(tw(pol(-58.8, 31.5, 1.6), s), tw(pol(-66.6, 31.2, 1.8), s));
      const j67 = rd(c67, -1);
      shot(tw(pol(-66.2, 31.5, 1.6), s), tw(pol(-58.4, 31.2, 1.8), s));
      const j58 = rd(c58, 1);
      jambs.push({ s, j67, j58 });
    }
    R('the Reef Window\'s Service Gate jambs carry a brass-ringed porthole into the reef at 1.6 m (its dark glass darker than the render over it), both jambs, both halves',
      jambs.every((c) => [c.j67, c.j58].every((j) => j.glass < 0.6 * j.render)), jambs);
    // (f) this round's IN-stop parts within 8.5 cm in plan of the stop's block and under its top (a headless build, both halves)
    {
      const { PropKit: PK } = await import('./src/world/props.js');
      const { dressingFor: DF } = await import('./src/world/dressing.js');
      const { LAYOUT: LY } = await import('./src/world/stages/aquarium/layout.js');
      const kit9 = new PK(null, { headless: true });
      let nIt = 0; for (const it of DF('aquarium')) if (it.type === 'aquarium_stopinfaces') { kit9.add(it.type, it); nIt++; }
      const d0 = LY.half.find((d) => d.tag === 'express-stop-in');
      const mir = (d) => ({ ...d, center: [-d.center[0], d.center[1], -d.center[2]] });
      const blocks = [d0, mir(d0)], topOf = (d) => d.center[1] + d.size[1] / 2;
      const fp = (d, x, z) => { const a = d.rotY * DEG, c = Math.cos(a), sn = Math.sin(a), dx = x - d.center[0], dz = z - d.center[2], u = dx * c - dz * sn, v = dx * sn + dz * c; return Math.hypot(Math.max(Math.abs(u) - d.size[0] / 2, 0), Math.max(Math.abs(v) - d.size[2] / 2, 0)); };
      const st = { n: 0, far: 0, atFar: null, over: 0 };
      const v3 = new G.camera.position.constructor();
      for (const parts of kit9._buckets.values()) for (const p of parts) {
        const P = p.g.attributes.position;
        for (let i = 0; i < P.count; i++) {
          v3.fromBufferAttribute(P, i).applyMatrix4(p.m); st.n++;
          const o = Math.min(...blocks.map((d) => fp(d, v3.x, v3.z)));
          if (o > st.far) { st.far = o; st.atFar = [+v3.x.toFixed(2), +v3.y.toFixed(2), +v3.z.toFixed(2)]; }
          if (v3.y > topOf(d0) + 0.002) st.over++;
        }
      }
      R('this round\'s IN-stop parts (skirting, pilasters, speed lines, portholes) stand within 8.5 cm of the stop\'s block and under its top, both halves',
        nIt === 2 && d0?.kind === 'obox' && st.n > 1000 && st.far <= 0.085 && st.over === 0, { placements: nIt, kind: d0?.kind, verts: st.n, farthest: +st.far.toFixed(3), at: st.atFar, overTop: st.over });
    }
    m.actors.forEach((a, i) => { a.character.root.visible = hide[i]; });
    g.settings.fov = fov0;
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
