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
  R('the stage murals are drawn (ids 4–8: portholes, the glass board, sea salt, feeding deck, hazard)', mt?.stage === 'aquarium' && [4, 5, 6, 7, 8].every((i) => mt.murals[i] && mt.murals[i].rect[2] > 0), { stage: mt?.stage });
  const muralFaces = {}; for (const f of L.faces) if (f.mural >= 4) muralFaces[f.mural] = (muralFaces[f.mural] || 0) + 1;
  R('the murals sit on faces (portholes on the promenades\' court faces, the board, the crates, the riser, the bund)', muralFaces[4] >= 20 && muralFaces[5] >= 2 && muralFaces[6] >= 6 && muralFaces[7] >= 2 && muralFaces[8] >= 2, muralFaces);
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
