// Spirhalite Islands — nav map (scratch): an ASCII picture of the nav graph over Alpha's half (+ the centre), one char per
// 1 m cell. Reached from Alpha's pad (walk / jump / drop / climb) AND able to walk back: by height, '.' ~0, ':' 0.3–1,
// '1' ~1.3, '2' ~2.5, '3' pad; wet cells (open water ≤ 1.2 m) as ',' at ~0 (',' 'w' for 0.3–1). Nodes the pad can't
// reach: 'X'. No node: ' '. Minimap orientation: +x left, rows from z = +6 down to −46.
(async () => {
  const G = window.__G, nav = G.nav, nodes = nav.nodes, N = nodes.length;
  const pad = G.level.spawnPads[0];
  const s = nav.nearest({ x: pad.x, y: pad.y, z: pad.z }, 1.2, true);
  const reach = new Uint8Array(N), st = [s]; reach[s] = 1;
  while (st.length) { const k = st.pop(); for (const e of nodes[k].nb) if (!reach[e.to]) { reach[e.to] = 1; st.push(e.to); } }
  const Z0 = window.__MAPZ0 ?? 8, Z1 = window.__MAPZ1 ?? -46;
  const rows = [];
  rows.push('     ' + Array.from({ length: nav.nx }, (_, ix) => { const x = nav.x0 + (nav.nx - 1 - ix) * nav.step; return Math.abs(Math.round(x)) % 10 === 0 && x - Math.floor(x) === 0.5 ? '|' : ' '; }).join(''));
  for (let z = Z0; z >= Z1; z--) {
    const iz = Math.round((z - nav.z0) / nav.step); if (iz < 0 || iz >= nav.nz) continue;
    let line = '';
    for (let ix = nav.nx - 1; ix >= 0; ix--) {
      const ids = nav.cells[iz * nav.nx + ix];
      if (!ids || !ids.length) { line += ' '; continue; }
      // the top-most node of the cell
      let n = null; for (const id of ids) if (!n || nodes[id].y > n.y) n = nodes[id];
      let c;
      if (!reach[n.id] || !nav.valid[n.id]) c = 'X';
      else if (n.y > 2.9) c = '3'; else if (n.y > 2.0) c = '2'; else if (n.y > 1.05) c = '1'; else if (n.y > 0.2) c = n.wet === 2 ? 'w' : ':'; else c = n.wet === 2 ? ',' : '.';
      line += c;
    }
    rows.push(String(z).padStart(4) + ' ' + line);
  }
  window.__navMapText = rows.join('\n');
  // edges of named cells
  const cellAt = (x, z) => { const ix = Math.round((x - nav.x0) / nav.step), iz = Math.round((z - nav.z0) / nav.step); return nav.cells[iz * nav.nx + ix] || []; };
  const ed = {};
  for (const [nm, x, z] of window.__EDGES || [['bS-28', 0.5, -28], ['bS-27', 0.5, -27], ['bS-26', 0.5, -26], ['bS-22', 0.5, -22], ['bS-21', 0.5, -21], ['bS-20', 0.5, -20], ['bN-12', 0.5, -12], ['bN-11', 0.5, -11], ['bN-6', 0.5, -6], ['bN-5', 0.5, -5]]) ed[nm] = cellAt(x, z).map((id) => ({ y: +nodes[id].y.toFixed(2), wet: nodes[id].wet, reach: reach[id], nb: nodes[id].nb.map((e) => `${nodes[e.to].x},${nodes[e.to].z}@${nodes[e.to].y.toFixed(1)}${e.type[0]}`).join(' ') }));
  return [{ name: 'nav map (see NAVMAP lines)', ok: true, info: { reached: reach.reduce((a, b) => a + b, 0), of: N } }, { name: 'edges', ok: true, info: ed },
    ...rows.map((r) => ({ name: 'NAVMAP ' + r, ok: true }))];
})()
