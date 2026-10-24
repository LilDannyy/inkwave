// Gulper Aquarium's dusk glow against a fresh splat (DESIGN.md §5.7 / §6.2 "Dusk palette": no tank glow brighter than 60 %
// of a fresh ink splat at the same exposure). A shoot.cjs PRE script (TIME=dusk): splats both teams' ink on the court floor
// beside the Great Tank, frames the tank's south-east glass, the Reef Window and a bubble column with the ink in view, and
// reads the game's own frame (post, tone mapping, output colour): the relative luminance of each glow against each splat.
//   MAP=aquarium TIME=dusk MODE=turf PRE=tools/botlab/scenes/aquarium-glow.js SHOTS='[…]' tools/botlab/run.sh tools/botlab/shoot.cjs
(async () => {
  const g = window.__inkwave, G = window.__G, THREE = await import('three'), gl = G.renderer.getContext();
  const V = (a) => new THREE.Vector3(a[0], a[1], a[2]);
  g.debug.freeze?.();
  for (const a of g.match.actors) { a.character.setVisible(false); a.character.root.visible = false; }
  // (a steady measure, art round 2: the stage art's palette, and the fish and bubbles out of the sample points — a shark
  // passing a glow point swung the share run to run)
  // PRE_ARGS 'pal' measures every team palette in turn (one table row each), a view's name prefix measures only it
  const { TEAM_PALETTES } = await import('./src/config.js');
  G.scene.traverse((o) => { if (/^aq-(swimmers|bubbles|colbubbles|krill)$/.test(o.name)) o.visible = false; });
  const allPal = String(window.__preArgs || '') === 'pal';
  if (!allPal) { const pal = TEAM_PALETTES.find((p) => p.id === 'tangerine-cobalt'); if (pal) g._setPalette(pal); }
  G.paint.clear?.();
  const lum = (c) => { const L = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); return 0.2126 * L(c[0] / 255) + 0.7152 * L(c[1] / 255) + 0.0722 * L(c[2] / 255); };
  const read = (p) => {
    const v = p.clone().project(G.camera), W = gl.drawingBufferWidth, H = gl.drawingBufferHeight, x = Math.round((v.x + 1) / 2 * W), y = Math.round((v.y + 1) / 2 * H), n = 5, px = new Uint8Array(n * n * 4);
    gl.readPixels(x - 2, y - 2, n, n, gl.RGBA, gl.UNSIGNED_BYTE, px);
    let r = 0, gg = 0, b = 0; for (let i = 0; i < px.length; i += 4) { r += px[i]; gg += px[i + 1]; b += px[i + 2]; }
    return [r / n / n, gg / n / n, b / n / n];
  };
  const shots = [
    // [name, camera from, look, glow points (on the glass, between the mullions), splats [[x, z, team]]] — each view sees
    // its splats on the floor in front and the glow behind them (pictures: the same cameras through shoot.cjs SHOTS, PLAY=1
    // keeps the ink in them)
    ['great tank', [-4.5, 1.8, -16.5], [-2.87, 1.1, -6.93], [[-2.87, 1.5, -6.93], [-2.2, 1.1, -7.2], [-3.6, 1.3, -6.6]], [[-3.4, -11.9, 0], [-0.4, -12.9, 1]]],
    ['reef window', [15.0, 1.9, -6.0], [25.0, 1.4, -19.0], [[25.0, 2.1, -19.0], [26.9, 1.6, -16.0], [23.0, 1.9, -21.4]], [[20.2, -13.0, 0], [22.0, -10.2, 1]], 70],   // (fix round 3: both splats in frame — one read off the frame's foot, then a coral's plinth — on a fixed fov 70)
    ['bubble column', [4.0, 2.4, -12.5], [0, 2.0, -20.0], [[0.3, 2.2, -20.3], [-0.4, 3.2, -20.35]], [[1.5, -15.6, 0], [-1.5, -15.6, 1]]],
  ];
  const out = [], only = allPal ? '' : String(window.__preArgs || '');
  // (fix round 3: a view may fix its lens — the Reef Window's is framed at fov 70 like the picture shoot.cjs takes with the
  // same camera; on the game's own fov, or the intro's, its splats fell off the frame and read black. The others keep the
  // lens they were measured with)
  const fov0 = g.settings.fov;
  for (const pal of allPal ? TEAM_PALETTES : [null]) {
  if (pal) g._setPalette(pal);
  for (const [name, from, look, pts, splats, fov] of shots) {
    if (only && !name.startsWith(only)) continue;
    g.settings.fov = fov || fov0;
    G.paint.clear?.();
    for (const [x, z, t] of splats) for (let k = 0; k < 3; k++) G.paint.splat(V([x, 0.05, z]), 0.9, t);
    g.rig.cinematic(V(from), V(from), V(look), V(look), 99, () => {});
    for (let i = 0; i < 30; i++) g.debug.step(1000 / 60);
    const glow = pts.map((p) => read(V(p))), ink = splats.map(([x, z]) => read(V([x, 0.03, z])));
    // the glow's own share: the same points with the water's glow from within switched off — and (fix round 3) the reef's
    // and the touch pools' own light (aq-exhibits: the reef is lit only by its lid lamp, so off it is dark)
    let water = null, ex = null; G.scene.traverse((o) => { if (o.name === 'aq-water') water = o.material; if (o.name === 'aq-exhibits') ex = o.material; });
    const g0 = water ? water.userData.glow : 0, e0 = ex ? ex.userData.glow : 0;
    if (water) water.userData.glow = 0;
    if (ex) ex.userData.glow = 0;
    g.debug.step(1000 / 60); g.debug.step(1000 / 60);
    const unlit = pts.map((p) => read(V(p)));
    if (water) water.userData.glow = g0;
    if (ex) ex.userData.glow = e0;
    g.debug.step(1000 / 60);
    const share = Math.max(...glow.map((c, i) => lum(c) - lum(unlit[i])));
    const scr = (p) => { const v = V(p).project(G.camera); return [Math.round((v.x + 1) / 2 * 1600), Math.round((1 - v.y) / 2 * 900)]; };
    const gl0 = Math.max(...glow.map(lum)), inkL = ink.map(lum);
    const hsl = (c) => { const o = {}; new THREE.Color(c[0] / 255, c[1] / 255, c[2] / 255).getHSL(o); return o; };
    out.push({ name, palette: pal?.id, glowMax: +gl0.toFixed(4), glowShare: +share.toFixed(4), ink: inkL.map((v) => +v.toFixed(4)), glowShareToInk: inkL.map((v) => +(share / v).toFixed(3)), ratioToDimmerInk: +(gl0 / Math.min(...inkL)).toFixed(3),
      glowHue: glow.map((c) => Math.round(hsl(c).h * 360)), glowSat: glow.map((c) => +hsl(c).s.toFixed(2)), glowRGB: glow.map((c) => c.map(Math.round)), inkRGB: ink.map((c) => c.map(Math.round)), glowPx: pts.map(scr), inkPx: splats.map(([x, z]) => scr([x, 0.03, z])) });
  }
  }
  g.settings.fov = fov0;
  if (!only) G.paint.clear?.();
  return { night: G.env?.U?.uNight?.value, shots: out };
})()
