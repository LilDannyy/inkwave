// Bluestone Junction — stage decals / signage for the mural atlas (mural ids 4…11; see src/world/murals.js), drawn into the
// stage region R = { x, y, w, h } (2048 × 1008 px). Each entry: its canvas rect and where it sits on its face (metres:
// u along the face, v up from the face's bottom edge). A layout block shows one with `mural: [{ n: [nx, ny, nz], id }]`;
// mirrored half blocks carry it to Bravo's twin (a 180° turn: the lettering reads the right way on both). Murals sit
// UNDER the ink.
//
// The era engine shows each id only in the eras LAYOUT.eras.murals gives it (src/fx/eraFx.js, the fragMural slot: the
// mask is tested per fragment against the fragment's own era, so the front paints a mural in or out as it passes):
//   4  all   the circus hour ring: twelve bronze Roman numerals at r 18 round the dome, XII toward Bravo (the circus floor)
//   6  2–3   the café mural on the Young & Jackfish's lane wall over Degrayling Lane: cups, fish-folk, the dome
//   7  2–3   HOKI LANE's street art along the viaduct: squids, fish-folk, a giant telephone; chalky, low in saturation
//            (team ink stays the loudest colour), painted in by the wave at jump 1
//   8  2     TODAY's tram stop markings on Swimston's carriageway beside the tram (white lines, TRAM STOP)
//   9  1     the 1880s ghost sign high on the GPO's north wall, CABLE TRAMS 3d · FLOUNDERS ST (painted out at jump 1)
//   11 3     the 3000s' light seams on the Royal Arcade's Swimston wall, with the flood line FLOOD LEVEL 3026 ▲
// (5 and 10, the concourse dial and the turntable ring, are the art pass's.)
// Palette: mid-value, saturation ≤ 0.35 on anything large; the highlights are the era engine's white-gold #f4e9c8.
import { WORDS, WORD_GRID } from './levelart.js';
export const MURAL = { hourRing: 4, cafe: 6, hoki: 7, tramStop: 8, ghostSign: 9, seams: 11 };

const rng = (seed) => { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; };
function fit(g, s, maxW, px, fontFn) { let p = px; g.font = fontFn(p); while (g.measureText(s).width > maxW && p > 8) { p -= 2; g.font = fontFn(p); } return p; }
// chalky wear: small erase flecks so the wall shows through (a painted wall, not a sticker)
function chalk(g, x, y, w, h, seed, n) {
  const r = rng(seed);
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); g.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < n; i++) { g.fillStyle = `rgba(0,0,0,${0.15 + r() * 0.5})`; g.fillRect(x + r() * w, y + r() * h, 1 + r() * 4, 1 + r() * 3); }
  g.restore();
}

// Hoki Lane's street art as light (the 3000s): the source rect's pieces → their outlines (white-gold, opaque) over a faint
// pale ghost of their fills, into the destination rect (same size)
function hokiLight(g, sx, sy, w, h, dx, dy) {
  const src = g.getImageData(sx, sy, w, h).data, N = w * h;
  const L = new Float32Array(N), A = new Float32Array(N);
  for (let i = 0; i < N; i++) { const a = src[i * 4 + 3] / 255; A[i] = a; L[i] = ((0.299 * src[i * 4] + 0.587 * src[i * 4 + 1] + 0.114 * src[i * 4 + 2]) / 255) * a; }
  const blur = (F) => { const T = new Float32Array(N), O = new Float32Array(N), r = 2; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let s = 0, n = 0; for (let k = -r; k <= r; k++) { const xx = x + k; if (xx >= 0 && xx < w) { s += F[y * w + xx]; n++; } } T[y * w + x] = s / n; }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let s = 0, n = 0; for (let k = -r; k <= r; k++) { const yy = y + k; if (yy >= 0 && yy < h) { s += T[yy * w + x]; n++; } } O[y * w + x] = s / n; } return O; };
  const Lb = blur(L), Ab = blur(A);
  const out = g.createImageData(w, h), o = out.data;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, at = (xx, yy) => { const cx = Math.min(w - 1, Math.max(0, xx)), cy = Math.min(h - 1, Math.max(0, yy)); return cy * w + cx; };
    const gx = Math.abs(Lb[at(x + 2, y)] - Lb[at(x - 2, y)]) + Math.abs(Ab[at(x + 2, y)] - Ab[at(x - 2, y)]) * 0.6;
    const gy = Math.abs(Lb[at(x, y + 2)] - Lb[at(x, y - 2)]) + Math.abs(Ab[at(x, y + 2)] - Ab[at(x, y - 2)]) * 0.6;
    const e = Math.min(1, Math.max(0, (gx + gy - 0.09) / 0.12));
    const ghost = Ab[i] * 0.3;
    o[i * 4] = Math.round(226 + (244 - 226) * e); o[i * 4 + 1] = Math.round(226 + (233 - 226) * e); o[i * 4 + 2] = Math.round(236 + (200 - 236) * e);
    o[i * 4 + 3] = Math.round(255 * Math.max(e, ghost));
  }
  g.putImageData(out, dx, dy);
}

export function drawMurals(g, R, kit) {
  const out = [];
  const serif = (px) => `700 ${px}px Georgia, "Times New Roman", serif`;
  const fontB = kit.fontB, font = kit.font;

  // ---------------------------------------------------------------- 4: the circus hour ring (the circus floor's top, 40 × 40 m)
  // the face: u = −x (from x 20), v = +z (from z −20); canvas left = x 20, canvas top = z 20 (Bravo)
  {
    const S = 1000, ppm = S / 40, X0 = R.x, Y0 = R.y;
    const T = (x, z) => [X0 + (20 - x) * ppm, Y0 + (20 - z) * ppm];
    g.save(); g.beginPath(); g.rect(X0, Y0, S, S); g.clip();
    g.clearRect(X0, Y0, S, S);
    const [cx, cy] = T(0, 0);
    // the ring's two bronze bands (r 16.6 and 19.4) and its minute ticks
    g.strokeStyle = 'rgba(122, 96, 58, 0.78)';
    for (const r of [16.6, 19.4]) { g.lineWidth = 0.22 * ppm; g.beginPath(); g.arc(cx, cy, r * ppm, 0, Math.PI * 2); g.stroke(); }
    g.lineWidth = 0.12 * ppm;
    for (let k = 0; k < 60; k++) {
      if (k % 5 === 0) continue;
      const a = (k / 60) * Math.PI * 2, d = [-Math.sin(a), Math.cos(a)];
      const [x1, y1] = T(d[0] * 18.9, d[1] * 18.9), [x2, y2] = T(d[0] * 19.25, d[1] * 19.25);
      g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
    }
    // the numerals: XII at +z (Bravo), clockwise as seen from above; each one's foot toward the ring's outside (read by a
    // kid on the ring looking in at the dome)
    const N = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2, dx = -Math.sin(a), dz = Math.cos(a), [px, py] = T(dx * 18, dz * 18);
      g.save(); g.translate(px, py); g.rotate(Math.atan2(dx, -dz));
      fit(g, N[i], 3.4 * ppm, 1.9 * ppm, serif);
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = 'rgba(60, 44, 24, 0.55)'; g.fillText(N[i], 0.08 * ppm, 0.1 * ppm);
      g.fillStyle = 'rgba(150, 118, 70, 0.9)'; g.fillText(N[i], 0, 0);
      g.restore();
    }
    chalk(g, X0, Y0, S, S, 41, 9000);
    g.restore();
    out.push({ id: MURAL.hourRing, x: X0, y: Y0, w: S, h: S, place: [0, 40, 0, 40], fx: [0.6, 0.9] });
  }

  // ---------------------------------------------------------------- 7: HOKI LANE's street art (the viaduct's lane face)
  // the viaduct's east face: u = −z from z −14, v up from its foot at y −1.8; the art runs from z −25.5 (where Prow Place
  // ends) to z −49, from 0.15 to 3.6 m over the lane: 23.5 × 3.45 m at 38 px/m
  {
    const ppm = 38, Wm = 23.5, Hm = 3.45, X = R.x + 1040, Y = R.y, w = Math.round(Wm * ppm), h = Math.round(Hm * ppm);
    g.save(); g.beginPath(); g.rect(X, Y, w, h); g.clip(); g.clearRect(X, Y, w, h);
    const r = rng(7);
    // a pale wash behind the pieces (the wall primed by the artists), torn at its edges
    g.fillStyle = 'rgba(214, 206, 190, 0.55)';
    g.beginPath(); g.moveTo(X, Y + h * 0.12);
    for (let i = 0; i <= 40; i++) g.lineTo(X + (i / 40) * w, Y + h * (0.05 + 0.1 * r()));
    for (let i = 40; i >= 0; i--) g.lineTo(X + (i / 40) * w, Y + h * (0.9 + 0.08 * r()));
    g.closePath(); g.fill();
    // chalky colour fields (≤ 35 % saturation)
    const cols = ['#8fa3ad', '#b39b86', '#93a58a', '#a594a8', '#c2b38c', '#8c9aa6'];
    for (let i = 0; i < 9; i++) { kit.blob ? kit.blob(g, X + 60 + i * (w - 120) / 8, Y + h * (0.35 + 0.3 * r()), h * (0.22 + 0.12 * r()), i * 1.7, cols[i % cols.length]) : null; }
    // the giant telephone (Tartar, painted by the lane): a cream body, brass dial, the handset on its cradle, curly cord
    {
      const cx = X + w * 0.5, cy = Y + h * 0.56, s = h * 0.36;
      g.fillStyle = '#d8ccb0'; g.beginPath(); g.ellipse(cx, cy + s * 0.25, s * 1.15, s * 0.75, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#9c8456'; g.beginPath(); g.arc(cx, cy + s * 0.3, s * 0.46, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#d8ccb0'; g.beginPath(); g.arc(cx, cy + s * 0.3, s * 0.2, 0, Math.PI * 2); g.fill();
      for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 1.6 + 0.7; g.fillStyle = '#5b4a33'; g.beginPath(); g.arc(cx + Math.cos(a) * s * 0.33, cy + s * 0.3 + Math.sin(a) * s * 0.33, s * 0.055, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = '#4a4036'; g.beginPath(); g.ellipse(cx, cy - s * 0.55, s * 1.25, s * 0.22, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#4a4036'; g.beginPath(); g.arc(cx - s * 1.2, cy - s * 0.5, s * 0.26, 0, Math.PI * 2); g.arc(cx + s * 1.2, cy - s * 0.5, s * 0.26, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#4a4036'; g.lineWidth = s * 0.07;
      g.beginPath(); for (let k = 0; k <= 60; k++) { const t = k / 60, x = cx + s * 1.1 + t * s * 2.4, y = cy + s * 0.6 + Math.sin(t * 40) * s * 0.12 - t * s * 0.4; k ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
      // the eyes the lane gave him
      g.fillStyle = '#2f2a24'; g.beginPath(); g.arc(cx - s * 0.5, cy - s * 0.1, s * 0.09, 0, Math.PI * 2); g.arc(cx + s * 0.5, cy - s * 0.1, s * 0.09, 0, Math.PI * 2); g.fill();
    }
    // squids and fish-folk across the wall
    if (kit.squid) for (let i = 0; i < 7; i++) { const x = X + 70 + i * (w - 140) / 6; if (Math.abs(x - (X + w * 0.5)) < h * 0.8) continue; kit.squid(g, x, Y + h * (0.5 + 0.08 * Math.sin(i * 2.1)), h / 190, cols[(i + 2) % cols.length], '#e8e0cc'); }
    for (let i = 0; i < 4; i++) {
      const fx = X + w * (0.12 + i * 0.25), fy = Y + h * 0.62, s = h * 0.22;
      g.fillStyle = '#7d8c95'; g.beginPath(); g.ellipse(fx, fy, s * 0.9, s * 0.45, 0.2 * (i % 2 ? 1 : -1), 0, Math.PI * 2); g.fill();
      g.beginPath(); g.moveTo(fx - s * 0.85, fy); g.lineTo(fx - s * 1.35, fy - s * 0.35); g.lineTo(fx - s * 1.35, fy + s * 0.35); g.closePath(); g.fill();
      g.fillStyle = '#e8e0cc'; g.beginPath(); g.arc(fx + s * 0.45, fy - s * 0.1, s * 0.13, 0, Math.PI * 2); g.fill();
    }
    // HOKI LANE, sprayed in big outlined letters at the lane's mouth, and tags
    g.textAlign = 'left'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    fit(g, 'HOKI LANE', w * 0.3, h * 0.42, font);
    g.lineWidth = h * 0.05; g.strokeStyle = '#3e3a36'; g.strokeText('HOKI LANE', X + w * 0.03, Y + h * 0.3);
    g.fillStyle = '#c8b9a0'; g.fillText('HOKI LANE', X + w * 0.03, Y + h * 0.3);
    g.font = fontB(Math.round(h * 0.13)); g.fillStyle = 'rgba(62, 58, 54, 0.8)';
    for (const [k, t] of [[0.72, 'TARTAR WAS HERE'], [0.86, 'RING RING'], [0.36, 'KEEP UP']]) g.fillText(t, X + w * k, Y + h * 0.84);
    // (fix round 1) the 3000s' version (DESIGN §5.1: "the murals turned to slow-moving light"): the same pieces as outlines of
    // white-gold light over a faint pale ghost of their shapes, made from this drawing before its chalk wear (an edge filter
    // on a blurred copy: the shapes' outlines, not the grain), drawn 480 px below it (R.y + 480: the level art samples it
    // there in era 3 and runs the light slowly along the lines)
    if (g.getImageData) hokiLight(g, X, Y, w, h, X, Y + 480);
    chalk(g, X, Y, w, h, 77, 5200);
    g.restore();
    out.push({ id: MURAL.hoki, x: X, y: Y, w, h, place: [11.5, Wm, 1.95, Hm], fx: [0.75, 1] });
  }

  // ---------------------------------------------------------------- 9: the 1880s ghost sign (the GPO's north wall, 3–6 m)
  // its face: u = +x from x −16, v up from 3 m: 5.7 × 2.5 m at 64 px/m
  {
    const ppm = 64, Wm = 5.7, Hm = 2.5, X = R.x + 1040, Y = R.y + 140, w = Math.round(Wm * ppm), h = Math.round(Hm * ppm);
    g.save(); g.beginPath(); g.rect(X, Y, w, h); g.clip(); g.clearRect(X, Y, w, h);
    g.fillStyle = 'rgba(112, 52, 40, 0.82)'; g.fillRect(X + 4, Y + 4, w - 8, h - 8);
    g.strokeStyle = 'rgba(226, 214, 186, 0.8)'; g.lineWidth = 5; g.strokeRect(X + 14, Y + 14, w - 28, h - 28);
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(232, 222, 196, 0.92)';
    fit(g, 'CABLE TRAMS 3d', w - 60, h * 0.36, serif); g.fillText('CABLE TRAMS 3d', X + w / 2, Y + h * 0.38);
    fit(g, '· FLOUNDERS ST ·', w - 90, h * 0.2, serif); g.fillText('· FLOUNDERS ST ·', X + w / 2, Y + h * 0.7);
    chalk(g, X, Y, w, h, 9, 2600);   // (a ghost sign: weathered half away)
    g.restore();
    out.push({ id: MURAL.ghostSign, x: X, y: Y, w, h, place: [0.4, Wm, 0.3, Hm], fx: [0.9, 1] });
  }

  // ---------------------------------------------------------------- 6: the café mural (the hotel's lane wall over Degrayling Lane)
  // its face (the hotel's south face, −0.7 … 3 m): u = −x from x −9.5, v up from y −0.7: 3.7 × 2.0 m from 0.15 m over the lane
  {
    const ppm = 70, Wm = 3.7, Hm = 2.0, X = R.x + 1440, Y = R.y + 140, w = Math.round(Wm * ppm), h = Math.round(Hm * ppm);
    g.save(); g.beginPath(); g.rect(X, Y, w, h); g.clip(); g.clearRect(X, Y, w, h);
    g.fillStyle = 'rgba(196, 180, 150, 0.8)'; g.beginPath(); g.roundRect(X + 6, Y + 6, w - 12, h - 12, 18); g.fill();
    // the dome over the cups
    g.fillStyle = 'rgba(122, 140, 120, 0.85)'; g.beginPath(); g.arc(X + w / 2, Y + h * 0.5, h * 0.3, Math.PI, 0); g.fill();
    g.fillRect(X + w / 2 - h * 0.33, Y + h * 0.5, h * 0.66, h * 0.06);
    for (const [k, c] of [[0.2, '#8a6f55'], [0.8, '#7d6650']]) {
      const cx = X + w * k, cy = Y + h * 0.58;
      g.fillStyle = c; g.beginPath(); g.moveTo(cx - 30, cy - 22); g.lineTo(cx + 30, cy - 22); g.lineTo(cx + 22, cy + 22); g.lineTo(cx - 22, cy + 22); g.closePath(); g.fill();
      g.strokeStyle = c; g.lineWidth = 7; g.beginPath(); g.arc(cx + 32, cy - 4, 11, -Math.PI / 2, Math.PI / 2); g.stroke();
      g.strokeStyle = 'rgba(236, 228, 210, 0.7)'; g.lineWidth = 3; for (const o of [-10, 4]) { g.beginPath(); g.moveTo(cx + o, cy - 30); g.quadraticCurveTo(cx + o + 8, cy - 42, cx + o, cy - 54); g.stroke(); }
    }
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#3b3229';
    fit(g, 'ESPRESSO', w * 0.5, h * 0.17, fontB); g.fillText('ESPRESSO', X + w / 2, Y + h * 0.16);
    fit(g, 'THE YOUNG & JACKFISH', w * 0.8, h * 0.11, fontB); g.fillText('THE YOUNG & JACKFISH', X + w / 2, Y + h * 0.85);
    chalk(g, X, Y, w, h, 6, 1400);
    g.restore();
    out.push({ id: MURAL.cafe, x: X, y: Y, w, h, place: [0.4, Wm, 0.85, Hm], fx: [0.8, 1] });
  }

  // ---------------------------------------------------------------- 8: today's tram stop markings (Swimston's carriageway top)
  // its face: u = −x from x −16, v = +z from z −50; the markings over u 0 … 8.5, v 10 … 24 (z −40 … −26) at 24 px/m
  {
    const ppm = 24, Wm = 8.5, Hm = 14, X = R.x + 1720, Y = R.y + 140, w = Math.round(Wm * ppm), h = Math.round(Hm * ppm);
    const T = (x, z) => [X + (-16 - x) * ppm, Y + (-26 - z) * ppm];   // world → canvas (canvas top = z −26, left = x −16)
    g.save(); g.beginPath(); g.rect(X, Y, w, h); g.clip(); g.clearRect(X, Y, w, h);
    g.strokeStyle = 'rgba(232, 228, 216, 0.85)'; g.fillStyle = 'rgba(232, 228, 216, 0.85)';
    // the platform line along the tram's east side (x −21.4, z −35 … −27) and the stop's box
    g.lineWidth = 0.16 * ppm;
    { const [a0, b0] = T(-21.4, -35), [a1, b1] = T(-21.4, -27); g.beginPath(); g.moveTo(a0, b0); g.lineTo(a1, b1); g.stroke(); }
    g.setLineDash([0.9 * ppm, 0.6 * ppm]);
    { const [a0, b0] = T(-24.4, -35.6), [a1, b1] = T(-21.2, -26.6); g.strokeRect(Math.min(a0, a1), Math.min(b0, b1), Math.abs(a1 - a0), Math.abs(b1 - b0)); }
    g.setLineDash([]);
    // TRAM STOP across the lane south of the tram (read by a kid walking north up Swimston: its foot to the south)
    { const [px, py] = T(-20.2, -37.6); g.save(); g.translate(px, py); fit(g, 'TRAM STOP', 6.6 * ppm, 1.4 * ppm, fontB); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('TRAM STOP', 0, 0); g.restore(); }
    // the zig-zag kerb lines on the east track's approach
    g.lineWidth = 0.12 * ppm; g.beginPath();
    for (let k = 0; k <= 10; k++) { const [px, py] = T(-17 - (k % 2) * 0.6, -39.6 + k * 0.6); k ? g.lineTo(px, py) : g.moveTo(px, py); }
    g.stroke();
    chalk(g, X, Y, w, h, 8, 1600);
    g.restore();
    out.push({ id: MURAL.tramStop, x: X, y: Y, w, h, place: [0, Wm, 10, Hm], fx: [1, 1] });
  }

  // ---------------------------------------------------------------- 11: the 3000s' light seams and the flood line (the arcade's Swimston wall, 3–6 m)
  // its face: u = −z from z −28, v up from 3 m: 13.4 × 2.7 m at 40 px/m
  {
    const ppm = 40, Wm = 13.4, Hm = 2.7, X = R.x + 1040, Y = R.y + 330, w = Math.round(Wm * ppm), h = Math.round(Hm * ppm);
    g.save(); g.beginPath(); g.rect(X, Y, w, h); g.clip(); g.clearRect(X, Y, w, h);
    const glow = (x0, y0, x1, y1, wd) => {
      g.strokeStyle = 'rgba(244, 233, 200, 0.28)'; g.lineWidth = wd * 3.2; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
      g.strokeStyle = 'rgba(255, 248, 228, 0.95)'; g.lineWidth = wd; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
    };
    // seams: a lattice of light following the old facade's lines (piers every 2.2 m, a cornice line, diagonals)
    for (let k = 0; k <= 6; k++) { const x = X + 10 + k * (w - 20) / 6; glow(x, Y + 6, x, Y + h - 6, 3); }
    glow(X + 6, Y + h * 0.22, X + w - 6, Y + h * 0.22, 3);
    for (let k = 0; k < 6; k++) { const x0 = X + 10 + k * (w - 20) / 6, x1 = x0 + (w - 20) / 6; glow(x0, Y + h * 0.22, x1, Y + h - 8, 2); }
    // the flood line: a band at the 3026 high water and its plate
    g.fillStyle = 'rgba(70, 86, 98, 0.55)'; g.fillRect(X, Y + h * 0.62, w, h * 0.06);
    glow(X, Y + h * 0.62, X + w, Y + h * 0.62, 2.5);
    g.fillStyle = 'rgba(30, 34, 40, 0.78)'; g.beginPath(); g.roundRect(X + w * 0.34, Y + h * 0.66, w * 0.32, h * 0.24, 10); g.fill();
    g.fillStyle = 'rgba(244, 233, 200, 0.98)'; g.textAlign = 'center'; g.textBaseline = 'middle';
    fit(g, 'FLOOD LEVEL 3026 ▲', w * 0.3, h * 0.16, fontB); g.fillText('FLOOD LEVEL 3026 ▲', X + w / 2, Y + h * 0.78);
    g.restore();
    out.push({ id: MURAL.seams, x: X, y: Y, w, h, place: [0.3, Wm, 0.15, Hm], fx: [0.2, 0.3] });
  }
  // ---------------------------------------------------------------- (fix round 3) the words read up close (levelart.js WORDS)
  // white letters (their coverage in alpha) centred in 200 × 42 px cells, 26 px or smaller to fit; the level art (bsWord)
  // colours them per era — gilt and paint in the 1880s' serif, paint and light in TODAY's and the 3000s' sans
  {
    const G = WORD_GRID;
    g.save(); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ffffff';
    WORDS.forEach(([t, f], i) => {
      const x = R.x + G.x + (i % G.cols) * G.cw, y = R.y + G.y + Math.floor(i / G.cols) * G.ch;
      g.clearRect(x, y, G.cw, G.ch);
      fit(g, t, G.cw - 16, 26, f === 'serif' ? serif : fontB);
      g.fillText(t, x + G.cw / 2, y + G.ch / 2 + 1);
    });
    g.restore();
  }
  return out;
}
