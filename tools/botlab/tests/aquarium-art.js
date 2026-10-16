// Gulper Aquarium's art pass (tools/botlab/jobs/batch5/stages/aquarium, the art phase): the dressing adds no collider, the
// stand-ins it draws are hidden off-limits blocks with no paint, the stage surfaces and murals are the stage's, the
// glass / water / fish / jellies / penguins / bathysphere are in the scene, and Feeding Time (looks only) runs at 1:00
// left: the bathysphere bobs, the bell rings, the krill drift, the Great Tank's sharks wheel faster — and nothing a player
// can touch changes (the clock, every actor's hp and position, the turf).
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
    const views = [[[0.6, 1.5, -11.5], [0, 1.3, 0]], [[0.5, 1.6, -29], [0, 7.6, -22.5]], [[-6.2, 3.0, -43.5], [-14.8, 0.6, -46.8]], [[18, 1.6, -9], [24.5, 1.8, -20.8]]];
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
