// The dusk palette test on Gulper Aquarium (DESIGN.md §6.2 "Dusk palette"): every team palette inked on the Feeding Deck
// and in the Reef Hall at dusk, through hud-shots.cjs (the HUD hidden): is the ink the most saturated, brightest colour
// in each frame, above the tanks' warm glow?
//   MAP=aquarium TIME=dusk SCENES=tools/botlab/scenes/aquarium-palettes.js OUT=/dir tools/botlab/run.sh tools/botlab/hud-shots.cjs
(() => {
  const g = window.__inkwave, dbg = g.debug, G = window.__G;
  const step = (s) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) dbg.step(1000 / 60); };
  let THREE = null, P = null, inked = false;
  const VIEWS = { deck: [[-9.5, 6.2, 9.5], [1.5, 1.6, -2.0]], arcade: [[14.5, 2.4, -6.5], [22.0, 1.2, -19.5]] };
  const ink = () => {
    // team 0 over the deck's south half and the Reef Hall's north end, team 1 over the deck's north half and its south end
    for (let k = 0; k < 26; k++) { const a = k * 2.4, r = 1.0 + (k % 6) * 1.0, x = Math.cos(a) * r, z = Math.sin(a) * r; G.paint.splat(new THREE.Vector3(x, 2.5, z), 1.4, z < 0 ? 0 : 1, { seed: k / 26 }); }
    for (let k = 0; k < 18; k++) { const a = (-60 + k * 2.6) * Math.PI / 180, r = 23 + (k % 4) * 1.3; G.paint.splat(new THREE.Vector3(Math.cos(a) * r, 0.2, Math.sin(a) * r), 1.5, k < 9 ? 1 : 0, { seed: k / 18 }); }
  };
  const scenes = [];
  for (let i = 0; i < 5; i++) for (const view of ['deck', 'arcade']) {
    scenes.push({ name: `dusk-palette-${i}-${view}`, set: async () => {
      if (!THREE) { THREE = await import('three'); P = (await import('./src/config.js')).TEAM_PALETTES; dbg.freeze(); for (const a of g.match.actors) { a.character.setVisible(false); a.character.root.visible = false; if (a.bot) a.bot.update = () => {}; } }
      g.hud?.setVisible(false);
      g._setPalette(P[i]);
      if (!inked) { G.paint.clear(); ink(); inked = true; }
      const [from, look] = VIEWS[view];
      g.rig.cinematic(new THREE.Vector3(...from), new THREE.Vector3(...from), new THREE.Vector3(...look), new THREE.Vector3(...look), 99, () => {});
      step(0.2);
      return { palette: P[i].id };
    } });
  }
  window.__hudScenes = scenes;
  return scenes.map((s) => ({ name: s.name }));
})()
