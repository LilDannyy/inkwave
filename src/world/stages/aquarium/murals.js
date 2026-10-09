// Gulper Aquarium — stage decals / signage for the mural atlas (mural ids 4…11; see src/world/murals.js). Murals sit
// UNDER the ink, so they go on the faces players ink (the props' signage is on off-limits blocks only).
//
// drawMurals(g, R, kit) draws into the stage region R = { x, y, w, h } (px; 2048 × 1008) and returns the table entries
// { id, x, y, w, h, place: [x0, xLen, y0, yLen], fx } (place in metres on the face: u along the face, v up from the face's
// bottom edge; one placement per id, whatever face carries it). A layout piece shows one with `mural: [{ n, id }]`.
// Every image keeps a transparent border (the shader clamps to the edge texel outside the placement).
//
//   4  a Jelly Gallery porthole (the gallery under the Sea Promenade is out of play): on every court face of the
//      promenade's coping and balustrades (r 21), 0.9 m round, its centre 1.0 m over the court
//   5  ALL WATER IS BEHIND GLASS · INKLINGS KEEP DRY: on the Ticket Hall's gate face (x 2.4 … 7.6, 0.2 … 0.95 m)
//   6  SEA SALT 25 kg: a stencil on the Pump Hall's salt crates
//   7  FEEDING DECK · KEEPERS ONLY: on the Feeding Steps' riser (the hall side), with a wave border
//   8  a hazard band along the top of the Pump Hall bund's aisle face
export const MURAL = { porthole: 4, water: 5, salt: 6, feeding: 7, hazard: 8 };

function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
function fit(g, s, maxW, px, fontFn) { let p = px; g.font = fontFn(p); while (g.measureText(s).width > maxW && p > 8) { p -= 2; g.font = fontFn(p); } return p; }

export function drawMurals(g, R, kit) {
  const out = [];
  const font = kit.font, fontB = kit.fontB;
  const NAVY = '#2d3a52', CREAM = '#f1ead9', BRASS = '#a8895a', BRASS2 = '#c9ab72';
  // ---- 4: the porthole, 220 × 220 px (0.9 m) at (R.x, R.y)
  {
    const X = R.x + 4, Y = R.y + 4, S = 212, cx = X + S / 2, cy = Y + S / 2;
    g.save();
    // brass ring with its bolts, a deep blue-green window with two moon jellies and the light falling through
    g.fillStyle = BRASS; g.beginPath(); g.arc(cx, cy, S * 0.48, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#7d643d'; g.beginPath(); g.arc(cx, cy, S * 0.4, 0, Math.PI * 2); g.fill();
    const wg = g.createRadialGradient(cx - 18, cy - 24, 6, cx, cy, S * 0.37);
    wg.addColorStop(0, '#5f8f98'); wg.addColorStop(0.6, '#2b5865'); wg.addColorStop(1, '#173a48');
    g.fillStyle = wg; g.beginPath(); g.arc(cx, cy, S * 0.37, 0, Math.PI * 2); g.fill();
    for (const [jx, jy, js] of [[-22, -10, 1], [28, 22, 0.7]]) {
      g.fillStyle = 'rgba(242,238,250,0.82)'; g.beginPath(); g.ellipse(cx + jx, cy + jy, 22 * js, 15 * js, 0, Math.PI, 0); g.fill();
      g.strokeStyle = 'rgba(242,238,250,0.6)'; g.lineWidth = 2;
      for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(cx + jx + k * 7 * js, cy + jy); g.quadraticCurveTo(cx + jx + k * 9 * js + 6, cy + jy + 20 * js, cx + jx + k * 7 * js, cy + jy + 36 * js); g.stroke(); }
    }
    g.fillStyle = 'rgba(255,255,255,0.18)'; g.beginPath(); g.ellipse(cx - 30, cy - 34, 36, 14, -0.6, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#5c4a2c';
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; g.beginPath(); g.arc(cx + Math.cos(a) * S * 0.44, cy + Math.sin(a) * S * 0.44, 5, 0, Math.PI * 2); g.fill(); }
    g.restore();
    out.push({ id: MURAL.porthole, x: X, y: Y, w: S, h: S, place: [0.22, 0.9, 2.55, 0.9], fx: [0.5, 1] });
  }
  // ---- 5: ALL WATER IS BEHIND GLASS board, 1260 × 190 px (5.2 × 0.78 m)
  {
    const X = R.x + 240, Y = R.y + 6, w = 1260, h = 184;
    g.save();
    rr(g, X + 4, Y + 4, w - 8, h - 8, 22); g.fillStyle = NAVY; g.fill();
    g.lineWidth = 6; g.strokeStyle = BRASS; rr(g, X + 14, Y + 14, w - 28, h - 28, 16); g.stroke();
    g.textAlign = 'center'; g.textBaseline = 'middle';
    fit(g, 'ALL WATER IS BEHIND GLASS', w - 200, 78, font); g.fillStyle = CREAM; g.fillText('ALL WATER IS BEHIND GLASS', X + w / 2, Y + 72);
    g.font = fontB(36); g.fillStyle = BRASS2; g.fillText('INKLINGS KEEP DRY  ·  GULPER AQUARIUM  ·  EST. 1936', X + w / 2, Y + 138);
    kit.squid(g, X + 70, Y + h / 2 + 6, 0.9, CREAM, NAVY); kit.squid(g, X + w - 70, Y + h / 2 + 6, 0.9, CREAM, NAVY);
    g.restore();
    out.push({ id: MURAL.water, x: X, y: Y, w, h, place: [0.4, 5.2, 0.2, 0.76], fx: [0.6, 1] });
  }
  // ---- 6: SEA SALT 25 kg stencil, 300 × 220 px (1.2 × 0.88 m)
  {
    const X = R.x + 1520, Y = R.y + 6, w = 300, h = 220;
    g.save();
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(40,38,34,0.86)';
    g.font = font(60); g.fillText('SEA SALT', X + w / 2, Y + 74);
    g.font = fontB(52); g.fillText('25 kg', X + w / 2, Y + 140);
    g.font = fontB(22); g.fillText('GULPER AQUARIUM · PUMP HALL', X + w / 2, Y + 188);
    g.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 26; i++) g.fillRect(X + 20 + i * 11, Y + 40, 3, 140);   // (stencil bridges)
    g.restore();
    out.push({ id: MURAL.salt, x: X, y: Y, w, h, place: [0.2, 1.2, 0.25, 0.88], fx: [0.9, 1] });
  }
  // ---- 7: FEEDING DECK · KEEPERS ONLY on the Feeding Steps' riser, 1000 × 270 px (3.7 × 1.0 m)
  {
    const X = R.x + 4, Y = R.y + 250, w = 1000, h = 270;
    g.save();
    g.fillStyle = 'rgba(155,179,168,0.9)';
    for (let i = 0; i < 25; i++) { const x = X + 20 + i * 39; g.beginPath(); g.moveTo(x, Y + 30); g.quadraticCurveTo(x + 10, Y + 12, x + 20, Y + 30); g.quadraticCurveTo(x + 30, Y + 48, x + 39, Y + 30); g.lineTo(x + 39, Y + 38); g.quadraticCurveTo(x + 30, Y + 56, x + 20, Y + 38); g.quadraticCurveTo(x + 10, Y + 20, x, Y + 38); g.fill(); }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    fit(g, 'FEEDING DECK', w - 120, 104, font); g.fillStyle = '#7d643d'; g.fillText('FEEDING DECK', X + w / 2 + 3, Y + 128 + 3); g.fillStyle = BRASS2; g.fillText('FEEDING DECK', X + w / 2, Y + 128);
    g.font = fontB(40); g.fillStyle = NAVY; g.fillText('KEEPERS ONLY  ·  FEEDINGS 11:00 & 15:00', X + w / 2, Y + 214);
    g.restore();
    out.push({ id: MURAL.feeding, x: X, y: Y, w, h, place: [0.15, 3.7, 0.1, 1.0], fx: [0.7, 1] });
  }
  // ---- 8: the hazard band (black / yellow, 45°): a 9 m strip (2048 × 64 px) along the bund's aisle faces near the top
  {
    const X = R.x, Y = R.y + 936, w = 2048, h = 64;
    g.save();
    g.beginPath(); g.rect(X, Y + 8, w, h - 16); g.clip();
    g.fillStyle = '#d2a63c'; g.fillRect(X, Y + 8, w, h - 16);
    g.fillStyle = '#26272b';
    for (let i = -2; i < 34; i++) { const x = X + i * 64; g.beginPath(); g.moveTo(x, Y + h - 8); g.lineTo(x + 32, Y + h - 8); g.lineTo(x + 32 + 48, Y + 8); g.lineTo(x + 48, Y + 8); g.closePath(); g.fill(); }
    g.restore();
    out.push({ id: MURAL.hazard, x: X, y: Y, w, h, place: [0, 9.0, 2.9, 0.26], fx: [0.9, 1] });
  }
  return out;
}
