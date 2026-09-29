// Eco-Forest Treehills — stage decals / signage for the mural atlas (mural ids 4…11; see src/world/murals.js). Drawn into
// the stage region R of the atlas; each entry: its canvas rect, where it sits on its face (metres).
//   emblem   the Commons Meadow's centre slab (30 × 28 m): a ring mown into the lawn (lighter and darker stripes) with
//            the dome's geodesic node inside (a hexagon of six triangles), the mowers' turning circles round it (drawn
//            180°-symmetric, like the stage)
//   sign     ECO-FOREST TREEHILLS in pale stencil along the tree-hill's upper retaining wall, facing the meadow
//   label    the base terrace in front of the spawn stair: a painted floor label (BIOME 07, a big arrow to the meadow)
//   pad      a landing-pad circle on the base terrace (the Tower Command goal sits on it)
//   biome    BIOME 07 · COMMONS MEADOW stencilled along the band's low wall
export const MURAL = { emblem: 4, sign: 5, label: 6, pad: 7, biome: 8 };

export function drawMurals(g, R, kit) {
  const out = [];
  const font = (px) => `800 ${px}px Rubik, "Arial Black", sans-serif`;
  // ---------------------------------------------------------------- the mown emblem (30 × 28 m at 24 px/m)
  {
    const PPM = 24, W = 30 * PPM, H = 28 * PPM, x0 = R.x, y0 = R.y, cx = x0 + W / 2, cy = y0 + H / 2;
    g.save();
    g.beginPath(); g.rect(x0, y0, W, H); g.clip();
    const ring = (r0, r1, a) => { g.fillStyle = a > 0 ? `rgba(236,248,214,${a})` : `rgba(28,52,20,${-a})`; g.beginPath(); g.arc(cx, cy, r1 * PPM, 0, Math.PI * 2); g.arc(cx, cy, r0 * PPM, 0, Math.PI * 2, true); g.fill(); };
    ring(4.6, 5.4, 0.2);
    ring(5.4, 5.8, -0.12);
    ring(0, 4.6, -0.06);
    // the dome's geodesic node mown inside it: a hexagon of six triangles meeting at the centre (like the grid's nodes)
    g.lineJoin = 'round'; g.lineCap = 'round'; g.strokeStyle = 'rgba(236,248,214,0.2)'; g.lineWidth = 0.5 * PPM;
    const hx = (k) => [cx + Math.cos((k / 6) * Math.PI * 2) * 3.9 * PPM, cy + Math.sin((k / 6) * Math.PI * 2) * 3.9 * PPM];
    g.beginPath(); for (let k = 0; k <= 6; k++) { const [px, py] = hx(k); if (k) g.lineTo(px, py); else g.moveTo(px, py); } g.stroke();
    for (let k = 0; k < 3; k++) { const [ax, ay] = hx(k), [bx, by] = hx(k + 3); g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke(); }
    g.fillStyle = 'rgba(236,248,214,0.2)'; g.beginPath(); g.arc(cx, cy, 0.7 * PPM, 0, Math.PI * 2); g.fill();
    // mowers' turning circles: faint scuffs round the emblem and at the slab's ends
    g.strokeStyle = 'rgba(40,60,26,0.07)'; g.lineWidth = 0.7 * PPM;
    for (const [dx, dy, r] of [[-9, -8, 2.2], [9, 8, 2.2], [-11, 7, 1.8], [11, -7, 1.8]]) { g.beginPath(); g.arc(cx + dx * PPM, cy + dy * PPM, r * PPM, 0, Math.PI * 2); g.stroke(); }
    g.restore();
    out.push({ id: MURAL.emblem, x: x0, y: y0, w: W, h: H, place: [0, 30, 0, 28], fx: [1, 0.6] });
  }
  // ---------------------------------------------------------------- the sign on the upper tier's wall (18 × 1.1 m)
  {
    const PPM = 60, W = 18 * PPM, H = Math.round(1.1 * PPM), x0 = R.x + 736, y0 = R.y;
    g.save();
    g.clearRect(x0, y0, W, H);
    g.font = font(50); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = 'rgba(238,242,232,0.92)';
    const txt = 'ECO-FOREST   TREEHILLS';
    g.fillText(txt, x0 + W / 2 + 40, y0 + H / 2 + 2);
    // the round badge before the name
    const bx = x0 + W / 2 - g.measureText(txt).width / 2 - 20, by = y0 + H / 2;
    g.fillStyle = 'rgba(238,242,232,0.92)'; g.beginPath(); g.arc(bx, by, 26, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(47,109,176,0.95)'; g.beginPath(); g.arc(bx, by, 21, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(238,242,232,0.95)'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.arc(bx, by, 12, 0.5, 4.8); g.stroke();
    g.restore();
    out.push({ id: MURAL.sign, x: x0, y: y0, w: W, h: H, place: [6, 18, 3.85, 1.1], fx: [0.5, 0.8] });
  }
  // ---------------------------------------------------------------- the floor label (5 × 6 m at 40 px/m)
  {
    const PPM = 40, W = 5 * PPM, H = 6 * PPM, x0 = R.x + 736, y0 = R.y + 80;
    g.save();
    g.clearRect(x0, y0, W, H);
    g.fillStyle = 'rgba(238,241,232,0.82)';
    // a big chevron arrow toward the meadow (up the canvas = +z for Alpha)
    const ax = x0 + W / 2;
    g.beginPath(); g.moveTo(ax, y0 + 0.2 * PPM); g.lineTo(ax + 1.5 * PPM, y0 + 1.7 * PPM); g.lineTo(ax + 0.6 * PPM, y0 + 1.7 * PPM); g.lineTo(ax + 0.6 * PPM, y0 + 2.6 * PPM);
    g.lineTo(ax - 0.6 * PPM, y0 + 2.6 * PPM); g.lineTo(ax - 0.6 * PPM, y0 + 1.7 * PPM); g.lineTo(ax - 1.5 * PPM, y0 + 1.7 * PPM); g.closePath(); g.fill();
    g.font = font(46); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('BIOME 07', ax, y0 + 3.5 * PPM);
    g.font = font(18); g.fillText('COMMONS MEADOW', ax, y0 + 4.4 * PPM);
    g.fillRect(x0 + 0.4 * PPM, y0 + 5.0 * PPM, W - 0.8 * PPM, 0.08 * PPM);
    g.restore();
    out.push({ id: MURAL.label, x: x0, y: y0, w: W, h: H, place: [0.17, 5, 6.9, 6], fx: [0.9, 1] });
  }
  // ---------------------------------------------------------------- the landing-pad circle (5 × 5 m at 40 px/m)
  {
    const PPM = 40, S = 5 * PPM, x0 = R.x + 960, y0 = R.y + 80, cx = x0 + S / 2, cy = y0 + S / 2;
    g.save();
    g.clearRect(x0, y0, S, S);
    g.strokeStyle = 'rgba(232,184,74,0.85)'; g.lineWidth = 0.22 * PPM;
    g.beginPath(); g.arc(cx, cy, 2.2 * PPM, 0, Math.PI * 2); g.stroke();
    g.strokeStyle = 'rgba(238,241,232,0.8)'; g.lineWidth = 0.1 * PPM;
    g.beginPath(); g.arc(cx, cy, 1.8 * PPM, 0, Math.PI * 2); g.stroke();
    // ticks round the ring, the pad's number
    for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; g.beginPath(); g.moveTo(cx + Math.cos(a) * 1.9 * PPM, cy + Math.sin(a) * 1.9 * PPM); g.lineTo(cx + Math.cos(a) * 2.05 * PPM, cy + Math.sin(a) * 2.05 * PPM); g.stroke(); }
    g.fillStyle = 'rgba(238,241,232,0.8)'; g.font = font(40); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('07', cx, cy + 2);
    g.restore();
    out.push({ id: MURAL.pad, x: x0, y: y0, w: S, h: S, place: [0.3, 5, 5.5, 5], fx: [0.9, 1] });
  }
  // ---------------------------------------------------------------- the band wall stencil (11.5 × 0.9 m at 60 px/m)
  {
    const PPM = 60, W = 11.5 * PPM, H = Math.round(0.9 * PPM), x0 = R.x + 1180, y0 = R.y + 80;
    g.save();
    g.clearRect(x0, y0, W, H);
    g.font = font(36); g.textAlign = 'left'; g.textBaseline = 'middle';
    g.fillStyle = 'rgba(236,240,230,0.9)';
    g.fillText('BIOME 07  ·  COMMONS MEADOW', x0 + 10, y0 + H / 2 + 2);
    g.restore();
    out.push({ id: MURAL.biome, x: x0, y: y0, w: W, h: H, place: [8.4, 11.5, 2.7, 0.9], fx: [0.6, 0.8] });
  }
  return out;
}
