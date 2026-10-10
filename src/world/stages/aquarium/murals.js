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
  // ---- 9: the fish-food hopper's face (1.0 × 1.2 m, 200 px/m): the bin's riveted panel with FISH FOOD stencilled on it,
  // the funnel narrowing into its chute below, the shadow between the splayed legs (the block's own sea-green shows round
  // it); on the hoppers' two faces toward the deck's middle (art round 1: "a teal box with two rivets")
  {
    const X = R.x + 1020, Y = R.y + 258, w = 200, h = 240;
    g.save();
    const ink = 'rgba(30,44,42,0.9)', dk = 'rgba(38,62,56,0.78)';
    // the bin's lip and the rivet rows (top band, the seams)
    g.fillStyle = 'rgba(194,162,108,0.95)'; g.fillRect(X, Y, w, 12);
    g.fillStyle = dk; g.fillRect(X, Y + 12, w, 3); g.fillRect(X, Y + 118, w, 4);
    g.fillStyle = 'rgba(28,40,38,0.85)';
    for (let i = 0; i < 9; i++) { for (const yy of [Y + 22, Y + 112]) { g.beginPath(); g.arc(X + 14 + i * 21.5, yy, 3.2, 0, Math.PI * 2); g.fill(); } }
    for (let j = 0; j < 4; j++) for (const xx of [X + 8, X + w - 8]) { g.beginPath(); g.arc(xx, Y + 36 + j * 20, 3, 0, Math.PI * 2); g.fill(); }
    // FISH FOOD
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(236,228,206,0.92)';
    g.font = font(40); g.fillText('FISH', X + w / 2, Y + 50);
    g.font = font(38); g.fillText('FOOD', X + w / 2, Y + 88);
    // the funnel (a darker trapezoid narrowing to the chute), its seam lines, the chute's mouth, the legs and their shadow
    g.fillStyle = dk; g.beginPath(); g.moveTo(X + 6, Y + 124); g.lineTo(X + w - 6, Y + 124); g.lineTo(X + w / 2 + 26, Y + 196); g.lineTo(X + w / 2 - 26, Y + 196); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(20,32,30,0.8)'; g.lineWidth = 2.5;
    for (const t of [0.33, 0.66]) { g.beginPath(); g.moveTo(X + 6 + t * (w - 12), Y + 124); g.lineTo(X + w / 2 - 26 + t * 52, Y + 196); g.stroke(); }
    g.fillStyle = 'rgba(16,22,22,0.92)'; g.fillRect(X + w / 2 - 22, Y + 196, 44, 30);
    g.fillStyle = 'rgba(194,162,108,0.95)'; g.fillRect(X + w / 2 - 26, Y + 194, 52, 6);
    g.fillStyle = 'rgba(16,22,22,0.55)'; g.fillRect(X + 18, Y + 200, w - 36, 40);
    g.fillStyle = ink; g.fillRect(X + 4, Y + 124, 12, 116); g.fillRect(X + w - 16, Y + 124, 12, 116);
    g.restore();
    out.push({ id: 9, x: X, y: Y, w, h, place: [0, 1.0, 0, 1.2], fx: [0.5, 1] });
  }
  // ---- 10: a feeding hatch's long face (2.0 × 1.2 m, 200 px/m): the raised teak coaming's brass corner straps and its
  // top's brass hinge bar, a ring pull, FEED HATCH stencilled on it, KEEP SHUT under (the block's teak shows between)
  {
    const X = R.x + 1240, Y = R.y + 258, w = 400, h = 240;
    g.save();
    const brass = 'rgba(194,162,108,0.96)', bd = 'rgba(120,92,52,0.95)';
    g.fillStyle = brass; g.fillRect(X, Y, w, 14); g.fillStyle = bd; g.fillRect(X, Y + 14, w, 3);
    for (const xx of [X, X + w - 22]) { g.fillStyle = brass; g.fillRect(xx, Y, 22, h); g.fillStyle = bd; g.fillRect(xx + (xx === X ? 22 : -3), Y, 3, h); for (let j = 0; j < 5; j++) { g.fillStyle = 'rgba(70,52,28,0.9)'; g.beginPath(); g.arc(xx + 11, Y + 34 + j * 44, 3.4, 0, Math.PI * 2); g.fill(); } }
    // hinge knuckles along the top
    for (const xx of [X + 80, X + w - 80]) { g.fillStyle = brass; g.fillRect(xx - 26, Y + 6, 52, 22); g.fillStyle = bd; g.fillRect(xx - 26, Y + 26, 52, 3); }
    // the ring pull
    g.strokeStyle = brass; g.lineWidth = 9; g.beginPath(); g.arc(X + w / 2, Y + 178, 26, 0, Math.PI * 2); g.stroke();
    g.fillStyle = brass; g.fillRect(X + w / 2 - 12, Y + 140, 24, 18);
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(40,32,24,0.82)';
    g.font = font(46); g.fillText('FEED HATCH', X + w / 2, Y + 72);
    g.font = fontB(24); g.fillText('KEEP SHUT · KEEPERS ONLY', X + w / 2, Y + 114);
    g.restore();
    out.push({ id: 10, x: X, y: Y, w, h, place: [0, 2.0, 0, 1.2], fx: [0.5, 1] });
  }
  // ---- 11: the ticket-machine bank's faces (2.4 × 1.5 m, 250 px/m): three Deco machines, each a cream cabinet with a
  // navy screen saying TICKETS, a price card, the coin slot and the ticket tray (the block's grey shows at the plinth)
  {
    const X = R.x + 10, Y = R.y + 536, w = 600, h = 375;
    g.save();
    for (let i = 0; i < 3; i++) {
      const x0 = X + i * 200;
      rr(g, x0 + 8, Y + 6, 184, h - 60, 18); g.fillStyle = 'rgba(236,230,214,0.97)'; g.fill();
      g.fillStyle = 'rgba(155,179,168,0.95)'; for (const yy of [Y + 238, Y + 250, Y + 262]) g.fillRect(x0 + 8, yy, 184, 6);
      rr(g, x0 + 30, Y + 30, 140, 80, 10); g.fillStyle = 'rgba(30,44,70,0.97)'; g.fill();
      g.strokeStyle = 'rgba(194,162,108,1)'; g.lineWidth = 5; rr(g, x0 + 30, Y + 30, 140, 80, 10); g.stroke();
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(255,236,190,1)'; g.font = fontB(30); g.fillText('TICKETS', x0 + 100, Y + 62);
      g.font = fontB(16); g.fillStyle = 'rgba(200,214,226,1)'; g.fillText('GULPER AQUARIUM', x0 + 100, Y + 92);
      // the price card, the coin slot, the buttons, the ticket tray
      g.fillStyle = 'rgba(250,246,236,1)'; g.fillRect(x0 + 36, Y + 124, 128, 62);
      g.fillStyle = 'rgba(45,58,82,1)'; g.font = fontB(15); g.fillText('ADULT · 3 SHELLS', x0 + 100, Y + 142); g.fillText('CHILD · 1 SHELL', x0 + 100, Y + 166);
      g.fillStyle = 'rgba(40,40,44,1)'; g.fillRect(x0 + 140, Y + 196, 30, 8);
      for (let k = 0; k < 3; k++) { g.fillStyle = ['rgba(168,57,47,1)', 'rgba(110,151,138,1)', 'rgba(201,154,60,1)'][k]; g.beginPath(); g.arc(x0 + 48 + k * 26, Y + 206, 9, 0, Math.PI * 2); g.fill(); }
      rr(g, x0 + 58, Y + 276, 84, 26, 6); g.fillStyle = 'rgba(30,30,34,0.95)'; g.fill();
    }
    g.restore();
    out.push({ id: 11, x: X, y: Y, w, h, place: [0, 2.4, 0, 1.5], fx: [0.4, 1] });
  }
  return out;
}
