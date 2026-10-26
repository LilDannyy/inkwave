// Highmark Foundry — stage decals / signage for the mural atlas (mural ids 4…11; see src/world/murals.js).
// Murals sit UNDER the ink, so they go on faces players ink.
//
// DESIGN.md §5.4:
//   4: HIGHMARK FOUNDRY · BELLOWS CALDERA · EST. 1931 in cast-iron letters (Casting Hall gable)
//   5: HIGH MARK line: white painted stripe at 0.8 m with "HIGH MARK — DO NOT STAND BELOW THIS LINE DURING A SURGE"
//   6: CASTING FLOOR — EBB ONLY, SLUMP PATH — FLOODS AT EVERY SURGE and crossed-boot pictograms
//   7: PUMICE RACE — HIGH LAVA ONLY with chain arrows
//   8: Tide Board: cycle drawn as a wave (EBB · SURGE · HIGH MARK · FALL) with timetable
//   9: Foundry mark (ladle in a ring) and POUR FLOOR cast in the plates
//  10: SPILLWAY — NO STANDING DURING A SURGE, black-and-white hazard chevrons
//  11: LADLE RAIL — MIND THE CARS arrows, TAP 1 / TAP 2, CUPOLA No.1, PATTERN SHOP, WEIGHBRIDGE 20 T, DISPATCH
export const MURAL = {
  gable: 4,
  highmark: 5,
  warning: 6,
  pumice: 7,
  tideboard: 8,
  pourfloor: 9,
  spillway: 10,
  stencils: 11,
};

function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
function fit(g, s, maxW, px, fontFn) {
  let p = px; g.font = fontFn(p);
  while (g.measureText(s).width > maxW && p > 8) { p -= 2; g.font = fontFn(p); }
  return p;
}

export function drawMurals(g, R, kit) {
  const out = [];
  const { font, fontB } = kit;
  const X0 = R.x, Y0 = R.y;

  // Foundry identity palette (DESIGN §5.3):
  const WHITE = '#f1ede4', CREAM = '#efe8d4', GREEN = '#2f5a48', IRON = '#26292d', IRON_LT = '#4a4e54';
  const RUST = '#8b3a2b', ASH = '#d8d4cb', CHARCOAL = '#1a1c1e';

  // Seeded wear/weathering helper (uses source-over so sign backplates remain 100% opaque,
  // preventing underlying stage surface crack lines from bleeding through)
  let seed = 42;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  function wear(x, y, w, h, n = 30, maxR = 5) {
    g.save(); g.globalCompositeOperation = 'source-over';
    g.fillStyle = CHARCOAL;
    for (let i = 0; i < n; i++) {
      g.globalAlpha = 0.06 + rnd() * 0.12;
      g.beginPath();
      g.ellipse(x + rnd() * w, y + rnd() * h, 1 + rnd() * maxR, 1 + rnd() * maxR * 0.5, rnd() * 3, 0, Math.PI * 2);
      g.fill();
    }
    g.restore();
  }

  // -------------------------------------------------------------------------------------------------
  // 4: HIGHMARK FOUNDRY gable plate (680 × 160 px, 4.4 × 1.1 m)
  // -------------------------------------------------------------------------------------------------
  {
    const x = X0 + 8, y = Y0 + 8, w = 680, h = 150;
    g.save();
    g.fillStyle = IRON; rr(g, x, y, w, h, 10); g.fill();
    g.strokeStyle = IRON_LT; g.lineWidth = 4; rr(g, x + 4, y + 4, w - 8, h - 8, 8); g.stroke();
    // Rivets
    g.fillStyle = '#686d75';
    for (const rx of [x + 12, x + w - 12]) for (const ry of [y + 12, y + h - 12]) {
      g.beginPath(); g.arc(rx, ry, 5, 0, Math.PI * 2); g.fill();
    }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    fit(g, 'HIGHMARK FOUNDRY', w - 120, 42, fontB);
    g.fillStyle = CREAM; g.fillText('HIGHMARK FOUNDRY', x + w / 2, y + 54);
    g.font = font(20); g.fillStyle = ASH;
    g.fillText('BELLOWS CALDERA  ·  EST. 1931', x + w / 2, y + 104);
    wear(x, y, w, h, 20);
    g.restore();
    out.push({ id: MURAL.gable, x, y, w, h, place: [0.6, 4.2, 0.25, 1.1], fx: [0, 0] });
  }

  // -------------------------------------------------------------------------------------------------
  // 5: HIGH MARK painted line & plate (1024 × 80 px, 0.8 × 0.22 m on lamp plinth)
  // -------------------------------------------------------------------------------------------------
  {
    const x = X0 + 700, y = Y0 + 8, w = 1024, h = 80;
    g.save();
    g.fillStyle = WHITE; g.fillRect(x, y + 16, w, 48);
    g.fillStyle = CHARCOAL;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = fontB(20);
    const txt = '▲  HIGH MARK  —  DO NOT STAND BELOW THIS LINE  ▲';
    fit(g, txt, w - 60, 24, fontB);
    g.fillText(txt, x + w / 2, y + 40);
    wear(x, y, w, h, 35);
    g.restore();
    out.push({ id: MURAL.highmark, x, y, w, h, place: [0.05, 0.8, 0.72, 0.22], fx: [0, 0] });
  }

  // -------------------------------------------------------------------------------------------------
  // 6: CASTING FLOOR — EBB ONLY & SLUMP PATH (560 × 240 px, 2.2 × 1.0 m)
  // -------------------------------------------------------------------------------------------------
  {
    const x = X0 + 8, y = Y0 + 170, w = 560, h = 230;
    g.save();
    g.fillStyle = '#1c1e22'; rr(g, x, y, w, h, 12); g.fill();
    g.strokeStyle = '#d48834'; g.lineWidth = 6; rr(g, x + 6, y + 6, w - 12, h - 12, 8); g.stroke();
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#e8a042'; g.font = fontB(30);
    g.fillText('CASTING FLOOR', x + w / 2, y + 38);
    g.font = fontB(22); g.fillStyle = WHITE;
    g.fillText('EBB ONLY  ·  FLOODS AT SURGE', x + w / 2, y + 76);
    // Crossed boots symbol
    g.strokeStyle = '#c8202a'; g.lineWidth = 5;
    g.beginPath();
    g.moveTo(x + w / 2 - 20, y + 102); g.lineTo(x + w / 2 + 20, y + 142);
    g.moveTo(x + w / 2 + 20, y + 102); g.lineTo(x + w / 2 - 20, y + 142);
    g.stroke();
    g.font = font(18); g.fillStyle = ASH;
    g.fillText('SLUMP PATH: DANGER OF SURGE', x + w / 2, y + 172);
    wear(x, y, w, h, 20);
    g.restore();
    out.push({ id: MURAL.warning, x, y, w, h, place: [2.2, 2.2, 0.15, 0.9], fx: [0, 0] });
  }

  // -------------------------------------------------------------------------------------------------
  // 7: PUMICE RACE — HIGH LAVA ONLY (500 × 150 px, 2.0 × 0.6 m)
  // -------------------------------------------------------------------------------------------------
  {
    const x = X0 + 580, y = Y0 + 170, w = 500, h = 150;
    g.save();
    g.fillStyle = GREEN; rr(g, x, y, w, h, 10); g.fill();
    g.strokeStyle = WHITE; g.lineWidth = 4; rr(g, x + 5, y + 5, w - 10, h - 10, 6); g.stroke();
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = fontB(32); g.fillStyle = WHITE;
    g.fillText('PUMICE RACE', x + w / 2, y + 42);
    g.font = fontB(24); g.fillStyle = CREAM;
    g.fillText('HIGH LAVA ONLY  ▶▶▶', x + w / 2, y + 84);
    g.font = fontB(18); g.fillStyle = ASH;
    g.fillText('KEEP TO CHAINED BOULDERS', x + w / 2, y + 120);
    wear(x, y, w, h, 20);
    g.restore();
    out.push({ id: MURAL.pumice, x, y, w, h, place: [0.3, 1.8, 0.9, 0.6], fx: [0, 0] });
  }

  // -------------------------------------------------------------------------------------------------
  // 8: TIDE BOARD wave cycle (560 × 340 px, 1.8 × 1.2 m)
  // -------------------------------------------------------------------------------------------------
  {
    const x = X0 + 1090, y = Y0 + 100, w = 560, h = 330;
    g.save();
    panel(g, x, y, w, h, CREAM, GREEN);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = fontB(28); g.fillStyle = GREEN;
    g.fillText('BELLOWS CALDERA TIDE TABLE', x + w / 2, y + 38);
    // Draw tide wave diagram
    g.strokeStyle = RUST; g.lineWidth = 5;
    g.beginPath();
    const bx = x + 40, by = y + 160, bw = w - 80;
    for (let i = 0; i <= 60; i++) {
      const u = i / 60, wx = bx + u * bw, wy = by - Math.sin(u * Math.PI * 2) * 55;
      if (i === 0) g.moveTo(wx, wy); else g.lineTo(wx, wy);
    }
    g.stroke();
    // High mark dash line
    g.strokeStyle = CHARCOAL; g.lineWidth = 2; g.setLineDash([6, 6]);
    g.beginPath(); g.moveTo(bx, by - 55); g.lineTo(bx + bw, by - 55); g.stroke();
    g.setLineDash([]);
    g.font = fontB(16); g.fillStyle = CHARCOAL;
    g.fillText('HIGH MARK (+0.8 m)', x + w / 2, by - 68);
    g.fillText('EBB (-0.6 m)', x + w / 2, by + 68);
    g.font = font(18); g.fillStyle = GREEN;
    g.fillText('EBB  ·  SURGE  ·  HIGH MARK  ·  FALL', x + w / 2, y + 275);
    g.font = font(14); g.fillStyle = IRON_LT;
    g.fillText('CYCLE PERIOD: 90 SECONDS', x + w / 2, y + 302);
    wear(x, y, w, h, 25);
    g.restore();
    out.push({ id: MURAL.tideboard, x, y, w, h, place: [0.3, 1.8, 0.3, 1.2], fx: [0, 0] });
  }

  // -------------------------------------------------------------------------------------------------
  // 9: POUR FLOOR cast mark (440 × 440 px, 3.2 × 3.2 m)
  // -------------------------------------------------------------------------------------------------
  {
    const x = X0 + 8, y = Y0 + 420, w = 440, h = 440, cx = x + w / 2, cy = y + h / 2;
    g.save();
    g.fillStyle = IRON; g.beginPath(); g.arc(cx, cy, 200, 0, Math.PI * 2); g.fill();
    g.strokeStyle = IRON_LT; g.lineWidth = 8; g.stroke();
    g.beginPath(); g.arc(cx, cy, 175, 0, Math.PI * 2); g.lineWidth = 3; g.stroke();
    // Ladle icon in ring
    g.fillStyle = ASH;
    g.beginPath(); g.arc(cx, cy - 20, 48, 0, Math.PI); g.fill();
    g.fillRect(cx - 10, cy - 85, 20, 70);
    g.fillRect(cx - 50, cy - 85, 100, 14);
    // Pour flame
    g.fillStyle = '#ff9436';
    g.beginPath();
    g.moveTo(cx + 42, cy - 10); g.quadraticCurveTo(cx + 70, cy + 30, cx + 55, cy + 60);
    g.quadraticCurveTo(cx + 40, cy + 30, cx + 42, cy - 10);
    g.fill();
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = fontB(32); g.fillStyle = WHITE;
    g.fillText('POUR FLOOR', cx, cy + 105);
    g.font = font(20); g.fillStyle = ASH;
    g.fillText('HIGHMARK WORKS', cx, cy + 145);
    wear(x, y, w, h, 35);
    g.restore();
    out.push({ id: MURAL.pourfloor, x, y, w, h, place: [3.4, 3.2, 3.4, 3.2], fx: [0, 0] });
  }

  // -------------------------------------------------------------------------------------------------
  // 10: SPILLWAY hazard plate (640 × 160 px, 4.0 × 0.9 m)
  // -------------------------------------------------------------------------------------------------
  {
    const x = X0 + 460, y = Y0 + 440, w = 640, h = 150;
    g.save();
    g.fillStyle = CHARCOAL; rr(g, x, y, w, h, 10); g.fill();
    // Hazard chevrons on top and bottom border
    const chW = 30;
    for (let bx = x; bx < x + w; bx += chW * 2) {
      g.fillStyle = '#e8b024';
      g.beginPath();
      g.moveTo(bx, y); g.lineTo(bx + chW, y); g.lineTo(bx + chW * 0.5, y + 20); g.lineTo(bx - chW * 0.5, y + 20);
      g.fill();
      g.beginPath();
      g.moveTo(bx, y + h - 20); g.lineTo(bx + chW, y + h - 20); g.lineTo(bx + chW * 0.5, y + h); g.lineTo(bx - chW * 0.5, y + h);
      g.fill();
    }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = fontB(32); g.fillStyle = '#f03a28';
    g.fillText('SPILLWAY — KEEP CLEAR', x + w / 2, y + 54);
    g.font = fontB(22); g.fillStyle = WHITE;
    g.fillText('NO STANDING DURING A SURGE', x + w / 2, y + 95);
    wear(x, y, w, h, 25);
    g.restore();
    out.push({ id: MURAL.spillway, x, y, w, h, place: [0.1, 2.4, 0.15, 0.9], fx: [0, 0] });
  }

  // -------------------------------------------------------------------------------------------------
  // 11: WORKS STENCILS (640 × 260 px, 3.2 × 1.1 m)
  // -------------------------------------------------------------------------------------------------
  {
    const x = X0 + 1120, y = Y0 + 450, w = 640, h = 260;
    g.save();
    g.fillStyle = '#22252a'; rr(g, x, y, w, h, 8); g.fill();
    g.textAlign = 'left'; g.textBaseline = 'middle';
    g.fillStyle = CREAM; g.font = fontB(28);
    g.fillText('LADLE RAIL ◀◀ MIND THE CARS', x + 24, y + 36);
    g.font = fontB(24);
    g.fillText('TAP 1  ·  TAP 2  ·  CUPOLA No. 1', x + 24, y + 84);
    g.fillText('PATTERN SHOP  ·  BAY 3', x + 24, y + 132);
    g.fillText('WEIGHBRIDGE 20 T  ·  TESTED 1931', x + 24, y + 180);
    g.fillStyle = '#e8a042'; g.font = fontB(20);
    g.fillText('DISPATCH — INKOPOLIS MUNICIPAL CASTINGS', x + 24, y + 224);
    wear(x, y, w, h, 20);
    g.restore();
    out.push({ id: MURAL.stencils, x, y, w, h, place: [0.9, 3.2, 4.1, 1.2], fx: [0, 0] });
  }

  return out;
}

function panel(g, x, y, w, h, bg, border) {
  g.fillStyle = bg; g.fillRect(x, y, w, h);
  g.strokeStyle = border; g.lineWidth = 8; g.strokeRect(x + 8, y + 8, w - 16, h - 16);
  g.lineWidth = 3; g.strokeRect(x + 18, y + 18, w - 36, h - 36);
}
