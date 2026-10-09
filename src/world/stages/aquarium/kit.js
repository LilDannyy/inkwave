// Gulper Aquarium — the stage's prop kit (owner: the aquarium stage). makeKit(D, H) returns the palette and the shared
// geometry helpers of the stage's prop builders (props.js, arch.js, dress.js): plain boxes, cached cylinders and lathes,
// a stroke font for the Deco lettering (raised brass letters, painted stencils, neon lit at dusk: the glyph set and
// ribbon builder are Calamari County's, src/world/stages/calamari/kit.js, copied so the stages stay independent),
// portholes, speed-line bands, globe lamps, brass handrails, enamel roundels. H = PropKit's PACK_HELPERS (THREE + helpers),
// D = the prop definition table. Imports nothing (THREE comes in through H).
export function makeKit(D, H) {
  const { THREE, col, shade, mixc, PI, TAU, HP } = H;
  const NS = (m) => (H.noShadow ? H.noShadow(m) : m);

  // ------------------------------------------------------------------------------------------ palette (DESIGN.md §5.4)
  const K = {
    render: '#ece6da', renderSh: '#d9d2c4', terrazzo: '#d6cfc0', teak: '#8f7a63', teakDk: '#6e5c49', faience: '#9bb3a8',
    brass: '#c2a26c', brassLt: '#dcc18c', brassDk: '#957744', bronze: '#7a5c34', bronzeDk: '#4f3a20', bronzeLt: '#9a7b4a',
    granite: '#33373b', graniteLt: '#55595d', seagreen: '#6e978a', seagreenDk: '#4f7166', steel: '#7d8a90', steelDk: '#4d575c',
    rivet: '#5e6b70', glassblock: '#cfe0e0', rock: '#a9aeb0', rockDk: '#8d8a84', ice: '#e8f1f3', sand: '#cdbb93',
    coral: '#c99a8a', coralDk: '#a77c6e', coralLt: '#ddb6a6', kelp: '#5b5a33', jelly: '#f2eefa',
    cream: '#f1ead9', white: '#f4f1ea', black: '#222428', ink: '#2b2d33', navy: '#2d3a52', red: '#a8392f', redDk: '#7e2a24',
    buff: '#d8c49a', mustard: '#c99a3c', wood: '#a9825a', woodDk: '#7a5a3a', rope: '#cdb991', canvas: '#e9e1cf',
    stripeA: '#e6dccb', stripeB: '#6e978a', rubber: '#34353c', lit: '#fff1d6', litWarm: '#ffe2b0', neon: '#fff4e6',
    lilac: '#ece6f4', plush: '#8d969c', yellow: '#d9b54a', water: '#173a48', hazard: '#d2a63c',
  };

  // ------------------------------------------------------------------------------------------ geometry
  class GB {
    constructor() { this.p = []; this.n = []; this.uv = []; this.c = []; this.idx = []; }
    v(x, y, z, nx, ny, nz, r = 1, g = r, b = r) { this.p.push(x, y, z); this.n.push(nx, ny, nz); this.uv.push(0, 0); this.c.push(r, g, b); return this.p.length / 3 - 1; }
    tri(a, b, c) {
      const P = this.p, N = this.n;
      const ax = P[a * 3], ay = P[a * 3 + 1], az = P[a * 3 + 2];
      const e1x = P[b * 3] - ax, e1y = P[b * 3 + 1] - ay, e1z = P[b * 3 + 2] - az;
      const e2x = P[c * 3] - ax, e2y = P[c * 3 + 1] - ay, e2z = P[c * 3 + 2] - az;
      const cx = e1y * e2z - e1z * e2y, cy = e1z * e2x - e1x * e2z, cz = e1x * e2y - e1y * e2x;
      if (cx * cx + cy * cy + cz * cz < 1e-18) return;
      const s = cx * (N[a * 3] + N[b * 3] + N[c * 3]) + cy * (N[a * 3 + 1] + N[b * 3 + 1] + N[c * 3 + 1]) + cz * (N[a * 3 + 2] + N[b * 3 + 2] + N[c * 3 + 2]);
      if (s < 0) this.idx.push(a, c, b); else this.idx.push(a, b, c);
    }
    quad(a, b, c, d) { this.tri(a, b, c); this.tri(a, c, d); }
    geo() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
      g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
      g.setIndex(this.idx);
      return g;
    }
  }
  const TPL = new Map();
  const tpl = (key, fn) => { let g = TPL.get(key); if (!g) { g = fn(); TPL.set(key, g); } return g; };
  const kf = (a) => (typeof a === 'number' ? a.toFixed(4) : String(a));
  const pboxGeo = () => tpl('pbox', () => new THREE.BoxGeometry(1, 1, 1));
  // plain (unbevelled) box: 12 triangles, for flush / small / many parts
  const pbox = (B, mat, c, w, h, d, x, y, z, o = {}) => B.add(mat, pboxGeo(), c, x, y, z, { ...o, sx: w, sy: h, sz: d });
  const cylGeo = (rt, rb, h, seg, open = false, t0 = 0, tl = TAU) => tpl(['cy', rt, rb, h, seg, open ? 1 : 0, t0, tl].map(kf).join('|'), () => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open, t0, tl));
  // a cylinder of radius r, height h, centred (x, y, z); o.seg, o.open, o.rt (top radius), o.t0 / o.tl (a part of it)
  const cyl = (B, mat, c, r, h, x, y, z, o = {}) => B.add(mat, cylGeo(o.rt ?? r, r, h, o.seg ?? 16, !!o.open, o.t0 ?? 0, o.tl ?? TAU), c, x, y, z, o);
  const latheG = (key, prof, seg = 16) => tpl('la|' + key + '|' + seg, () => H.latheGeo(prof, seg));
  const sphG = (r, ws = 12, hs = 8, th = PI) => tpl(['sp', r, ws, hs, th].map(kf).join('|'), () => new THREE.SphereGeometry(r, ws, hs, 0, TAU, 0, th));
  const torG = (R, r, rs = 6, ts = 24, arc = TAU) => tpl(['to', R, r, rs, ts, arc].map(kf).join('|'), () => new THREE.TorusGeometry(R, r, rs, ts, arc));
  // a box between two points (a strut, a brace, a beam): t × t section, P → Q in the current frame
  function strut(B, mat, c, P, Q, t, o = {}) {
    const dx = Q[0] - P[0], dy = Q[1] - P[1], dz = Q[2] - P[2], L = Math.hypot(dx, dy, dz);
    if (L < 1e-4) return;
    const ry = Math.atan2(dx, dz), rx = -Math.asin(Math.max(-1, Math.min(1, dy / L)));
    B.add(mat, pboxGeo(), c, (P[0] + Q[0]) / 2, (P[1] + Q[1]) / 2, (P[2] + Q[2]) / 2, { ...o, ry, rx, sx: o.w ?? t, sy: o.h ?? t, sz: L });
  }
  // a round rod between two points
  function rod(B, mat, c, P, Q, r, o = {}) {
    const dx = Q[0] - P[0], dy = Q[1] - P[1], dz = Q[2] - P[2], L = Math.hypot(dx, dy, dz);
    if (L < 1e-4) return;
    const v = new THREE.Vector3(dx / L, dy / L, dz / L), q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), v), e = new THREE.Euler().setFromQuaternion(q, 'YXZ');
    B.add(mat, cylGeo(r, r, L, o.seg ?? 6), c, (P[0] + Q[0]) / 2, (P[1] + Q[1]) / 2, (P[2] + Q[2]) / 2, { ...o, rx: e.x, ry: e.y, rz: e.z });
  }

  // ------------------------------------------------------------------------------------------ stroke font
  const EA = (cx, cy, rx, ry, a0, a1, n = 12) => { const o = []; for (let i = 0; i <= n; i++) { const a = ((a0 + (a1 - a0) * (i / n)) * PI) / 180; o.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return o; };
  const LOOP = (cx, cy, rx, ry, n = 24) => ({ c: EA(cx, cy, rx, ry, 0, 360, n).slice(0, n) });
  const GL = {
    A: [0.66, [[0, 0], [0.33, 1], [0.66, 0]], [[0.13, 0.33], [0.53, 0.33]]],
    B: [0.58, [[0, 0], [0, 1]], [[0, 1], ...EA(0.3, 0.755, 0.245, 0.245, 90, -90, 12), [0, 0.51]], [[0, 0.51], ...EA(0.32, 0.255, 0.255, 0.255, 90, -90, 12), [0, 0]]],
    C: [0.64, EA(0.34, 0.5, 0.34, 0.5, 46, 314, 22)],
    D: [0.6, [[0, 0], [0, 1]], [[0, 1], ...EA(0.16, 0.5, 0.44, 0.5, 90, -90, 16), [0, 0]]],
    E: [0.5, [[0.5, 1], [0, 1], [0, 0], [0.5, 0]], [[0, 0.52], [0.42, 0.52]]],
    F: [0.5, [[0.5, 1], [0, 1], [0, 0]], [[0, 0.52], [0.42, 0.52]]],
    G: [0.68, [...EA(0.34, 0.5, 0.34, 0.5, 46, 360, 22), [0.4, 0.5]]],
    H: [0.6, [[0, 0], [0, 1]], [[0.6, 0], [0.6, 1]], [[0, 0.52], [0.6, 0.52]]],
    I: [0, [[0, 0], [0, 1]]],
    J: [0.5, [[0.5, 1], ...EA(0.25, 0.3, 0.25, 0.3, 0, -172, 12)]],
    K: [0.58, [[0, 0], [0, 1]], [[0.56, 1], [0.02, 0.38]], [[0.22, 0.6], [0.6, 0]]],
    L: [0.48, [[0, 1], [0, 0], [0.48, 0]]],
    M: [0.76, [[0, 0], [0, 1], [0.38, 0.3], [0.76, 1], [0.76, 0]]],
    N: [0.62, [[0, 0], [0, 1], [0.62, 0], [0.62, 1]]],
    O: [0.74, LOOP(0.37, 0.5, 0.37, 0.5, 28)],
    P: [0.56, [[0, 0], [0, 1]], [[0, 1], ...EA(0.29, 0.735, 0.265, 0.265, 90, -90, 12), [0, 0.47]]],
    Q: [0.74, LOOP(0.37, 0.5, 0.37, 0.5, 28), [[0.46, 0.22], [0.78, -0.04]]],
    R: [0.58, [[0, 0], [0, 1]], [[0, 1], ...EA(0.29, 0.735, 0.265, 0.265, 90, -90, 12), [0, 0.47]], [[0.26, 0.47], [0.6, 0]]],
    S: [0.56, [...EA(0.28, 0.75, 0.27, 0.25, 28, 270, 12), ...EA(0.28, 0.25, 0.28, 0.25, 90, -152, 12).slice(1)]],
    T: [0.62, [[0, 1], [0.62, 1]], [[0.31, 1], [0.31, 0]]],
    U: [0.6, [[0, 1], ...EA(0.3, 0.32, 0.3, 0.32, 180, 360, 14), [0.6, 1]]],
    V: [0.66, [[0, 1], [0.33, 0], [0.66, 1]]],
    W: [0.92, [[0, 1], [0.23, 0], [0.46, 0.72], [0.69, 0], [0.92, 1]]],
    X: [0.62, [[0, 1], [0.62, 0]], [[0, 0], [0.62, 1]]],
    Y: [0.64, [[0, 1], [0.32, 0.48], [0.64, 1]], [[0.32, 0.48], [0.32, 0]]],
    Z: [0.56, [[0, 1], [0.56, 1], [0, 0], [0.56, 0]]],
    0: [0.56, LOOP(0.28, 0.5, 0.28, 0.5, 26)],
    1: [0.3, [[0, 0.78], [0.26, 1], [0.26, 0]]],
    2: [0.54, [...EA(0.27, 0.72, 0.27, 0.28, 160, -30, 12), [0, 0], [0.56, 0]]],
    3: [0.54, EA(0.26, 0.75, 0.25, 0.25, 150, -90, 12), EA(0.27, 0.26, 0.28, 0.26, 90, -150, 12)],
    4: [0.6, [[0.44, 0], [0.44, 1], [0, 0.3], [0.6, 0.3]]],
    5: [0.54, [[0.5, 1], [0.07, 1], [0.05, 0.52], ...EA(0.29, 0.34, 0.28, 0.34, 150, -150, 14)]],
    6: [0.56, [...EA(0.28, 0.5, 0.28, 0.5, 62, 180, 10), [0, 0.3]], LOOP(0.28, 0.3, 0.28, 0.3, 20)],
    7: [0.54, [[0, 1], [0.54, 1], [0.18, 0]]],
    8: [0.56, LOOP(0.28, 0.76, 0.23, 0.24, 18), LOOP(0.28, 0.27, 0.28, 0.27, 20)],
    9: [0.56, LOOP(0.28, 0.7, 0.28, 0.3, 20), [[0.56, 0.7], ...EA(0.28, 0.5, 0.28, 0.5, 0, -118, 10)]],
    '-': [0.36, [[0, 0.45], [0.36, 0.45]]],
    "'": [0, [[0, 1], [0, 0.8]]],
    '→': [0.7, [[0, 0.5], [0.7, 0.5]], [[0.42, 0.8], [0.7, 0.5], [0.42, 0.2]]],
    '←': [0.7, [[0.7, 0.5], [0, 0.5]], [[0.28, 0.8], [0, 0.5], [0.28, 0.2]]],
    '↑': [0.6, [[0.3, 0], [0.3, 1]], [[0, 0.7], [0.3, 1], [0.6, 0.7]]],
    '↓': [0.6, [[0.3, 1], [0.3, 0]], [[0, 0.3], [0.3, 0], [0.6, 0.3]]],
    '/': [0.4, [[0, 0], [0.4, 1]]],
    ':': [0.001, [[0, 0.72], [0, 0.73]], [[0, 0.22], [0, 0.23]]],
    ',': [0.001, [[0.04, 0.1], [-0.04, -0.16]]],
  };
  const DOTS = { '·': [[0, 0.46]], '.': [[0, 0]] };
  const SPACE = 0.34;
  function ribbon(g, pts, closed, hw, d) {
    const n = pts.length;
    const N = pts.map((p, i) => {
      const a = closed ? pts[(i - 1 + n) % n] : i > 0 ? pts[i - 1] : null;
      const c = closed ? pts[(i + 1) % n] : i < n - 1 ? pts[i + 1] : null;
      const nrm = (u, v) => { const dx = v[0] - u[0], dy = v[1] - u[1], l = Math.hypot(dx, dy) || 1; return [-dy / l, dx / l]; };
      const n1 = a ? nrm(a, p) : null, n2 = c ? nrm(p, c) : null;
      if (!n1) return [n2[0], n2[1], 1];
      if (!n2) return [n1[0], n1[1], 1];
      let mx = n1[0] + n2[0], my = n1[1] + n2[1]; const ml = Math.hypot(mx, my) || 1; mx /= ml; my /= ml;
      return [mx, my, Math.min(1.6, 1 / Math.max(0.3, mx * n2[0] + my * n2[1]))];
    });
    const walls = d > 1e-5;
    const rings = pts.map((p, i) => {
      const [nx, ny, k] = N[i];
      const L = [p[0] + nx * k * hw, p[1] + ny * k * hw], Rr = [p[0] - nx * k * hw, p[1] - ny * k * hw];
      const r = [g.v(L[0], L[1], d, 0, 0, 1), g.v(Rr[0], Rr[1], d, 0, 0, 1)];
      if (walls) r.push(g.v(L[0], L[1], d, nx, ny, 0), g.v(L[0], L[1], 0, nx, ny, 0), g.v(Rr[0], Rr[1], d, -nx, -ny, 0), g.v(Rr[0], Rr[1], 0, -nx, -ny, 0));
      return r;
    });
    const segs = closed ? n : n - 1, np = rings[0].length;
    for (let i = 0; i < segs; i++) { const A = rings[i], Bq = rings[(i + 1) % n]; for (let j = 0; j < np; j += 2) g.quad(A[j], A[j + 1], Bq[j + 1], Bq[j]); }
  }
  function disc(g, cx, cy, r, d, seg, a0 = 0, a1 = TAU) {
    const full = a1 - a0 > TAU - 1e-4, walls = d > 1e-5;
    const c0 = g.v(cx, cy, d, 0, 0, 1), f = [], wt = [], wb = [];
    const n = full ? seg : seg + 1;
    for (let k = 0; k < n; k++) {
      const a = a0 + ((a1 - a0) * k) / seg, cs = Math.cos(a), sn = Math.sin(a);
      f.push(g.v(cx + cs * r, cy + sn * r, d, 0, 0, 1));
      if (walls) { wt.push(g.v(cx + cs * r, cy + sn * r, d, cs, sn, 0)); wb.push(g.v(cx + cs * r, cy + sn * r, 0, cs, sn, 0)); }
    }
    for (let k = 0; k < seg; k++) { const j = full ? (k + 1) % seg : k + 1; g.tri(c0, f[k], f[j]); if (walls) g.quad(wt[k], wb[k], wb[j], wt[j]); }
  }
  function glyph(ch, wt, dep, ds = 8) {
    return tpl(['gl', ch, wt, dep, ds].map(kf).join('|'), () => {
      const s = 1 - wt, hw = wt / 2, T = (p) => [hw + p[0] * s, hw + p[1] * s];
      const g = new GB();
      if (DOTS[ch]) { for (const p of DOTS[ch]) { const q = T(p); disc(g, hw * 1.15, q[1], hw * 1.15, dep, ds); } return { geo: g.geo(), adv: wt * 1.3 }; }
      const def = GL[ch];
      if (!def) return { geo: null, adv: SPACE };
      const [w, ...strokes] = def;
      strokes.forEach((st, si) => {
        const d = dep > 0 ? dep - si * 0.004 : si * 0.0004;
        const closed = !Array.isArray(st);
        let pts = (closed ? st.c : st).map(T);
        pts = pts.filter((p, i) => i === 0 || Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) > 1e-4);
        if (pts.length < 2) { const q = pts[0]; disc(g, q[0], q[1], hw * 1.1, d, ds); return; }
        if (closed) { ribbon(g, pts, true, hw, d); return; }
        let cur = [pts[0]];
        const joints = [];
        for (let i = 1; i < pts.length; i++) {
          cur.push(pts[i]);
          if (i < pts.length - 1) {
            const a = pts[i - 1], p = pts[i], c = pts[i + 1];
            const t1 = Math.atan2(p[1] - a[1], p[0] - a[0]), t2 = Math.atan2(c[1] - p[1], c[0] - p[0]);
            let dt = Math.abs(t2 - t1); if (dt > PI) dt = TAU - dt;
            if (dt > 0.6) { ribbon(g, cur, false, hw, d); cur = [pts[i]]; joints.push(pts[i]); }
          }
        }
        if (cur.length > 1) ribbon(g, cur, false, hw, d);
        const endCap = (p, q) => { const a = Math.atan2(p[1] - q[1], p[0] - q[0]); disc(g, p[0], p[1], hw, d, Math.max(3, Math.round(ds / 2)), a - HP, a + HP); };
        endCap(pts[0], pts[1]); endCap(pts[pts.length - 1], pts[pts.length - 2]);
        for (const p of joints) disc(g, p[0], p[1], hw, d, ds);
      });
      return { geo: g.geo(), adv: w * s + wt };
    });
  }
  const textW = (str, wt = 0.17, track = 0.12) => { let w = 0; const cs = [...str]; cs.forEach((ch, i) => { w += ch === ' ' ? SPACE : glyph(ch, wt, 0.1).adv; if (i < cs.length - 1) w += track; }); return w; };
  // a line of letters facing +Z in the current frame (raised letters, or flat paint with flat: true); returns width.
  // o.lit: the letters are neon / lit (the glow material: half strength by day, full at dusk), o.glow its strength
  function letters(B, str, o = {}) {
    const h = o.h ?? 0.3, wt = o.wt ?? 0.17, flat = !!o.flat, dep = flat ? 0 : o.dep ?? 0.08, track = o.track ?? 0.12;
    const W = textW(str, wt, track) * h;
    let x = o.align === 'left' ? 0 : o.align === 'right' ? -W : -W / 2;
    const cs = [...str];
    const m = o.lit ? 'glow' : o.mat ?? 'metal';
    cs.forEach((ch, i) => {
      if (ch === ' ') { x += (SPACE + track) * h; return; }
      const gi = glyph(ch, wt, dep, flat || h < 0.15 ? 6 : 8);
      if (gi.geo) B.add(NS(m), gi.geo, o.c ?? K.brass, (o.x ?? 0) + x, o.y ?? 0, o.z ?? 0, { s: h, sz: flat ? 1 : h, glow: o.lit ? o.glow ?? 1.6 : undefined, ao: false });
      x += (gi.adv + (i < cs.length - 1 ? track : 0)) * h;
    });
    return W;
  }
  // a vertical line of letters (the fin tower's neon), top to bottom, each centred on x; returns the height used
  function lettersV(B, str, o = {}) {
    const h = o.h ?? 1.0, gap = o.gap ?? 0.25, cs = [...str];
    cs.forEach((ch, i) => letters(B, ch, { ...o, h, y: (o.y ?? 0) - i * (h + gap) - h, align: 'centre' }));
    return cs.length * (h + gap) - gap;
  }
  // a signboard (face frame, centred at x, bottom y): board + border + letters; returns its width
  function sign(B, text, x, y, o = {}) {
    const h = o.h ?? 0.22, pad = o.pad ?? 0.14, W = o.w ?? textW(text, o.wt ?? 0.18, o.track ?? 0.12) * h + pad * 2, Hh = o.hh ?? h + pad * 1.4;
    B.box(o.boardMat ?? 'paint', o.board ?? K.navy, W, Hh, 0.05, x, y + Hh / 2, 0.025, { r: 0.012 });
    if (o.border !== false) {
      pbox(B, NS('metal'), o.border ?? K.brass, W + 0.04, 0.035, 0.06, x, y + Hh, 0.03);
      pbox(B, NS('metal'), o.border ?? K.brass, W + 0.04, 0.035, 0.06, x, y, 0.03);
    }
    letters(B, text, { h, x, y: y + (Hh - h) / 2, z: 0.051, c: o.c ?? K.cream, flat: true, wt: o.wt ?? 0.18, track: o.track ?? 0.12, mat: 'paint', lit: o.lit, glow: o.glow });
    if (o.sub) letters(B, o.sub, { h: o.subH ?? h * 0.55, x, y: y + 0.05, z: 0.051, c: o.subC ?? o.c ?? K.cream, flat: true, wt: 0.2, mat: 'paint' });
    return W;
  }

  // ------------------------------------------------------------------------------------------ Deco parts (face frame:
  // x along the face, y up, +z out of it)
  // a porthole: brass ring (torus), a glass disc (lit = the glow material, warm at dusk), four bolts
  function porthole(B, x, y, r = 0.3, o = {}) {
    B.add('metal', torG(r, r * 0.16, 6, 20), o.ring ?? K.brass, x, y, 0.02, {});
    B.add(o.lit ? NS('glow') : NS('gloss'), tpl('phd|' + kf(r), () => new THREE.CircleGeometry(r * 0.9, 18)), o.glass ?? (o.lit ? K.lit : '#3e5560'), x, y, 0.012, { glow: o.lit ? o.glowK ?? 1.1 : undefined });
  }
  // speed lines: n raised bands along local x from x0 to x1 at heights y, y + gap … (render or faience)
  function speed(B, x0, x1, y, o = {}) {
    const n = o.n ?? 3, gap = o.gap ?? 0.14, t = o.t ?? 0.06, d = o.d ?? 0.04;
    for (let i = 0; i < n; i++) pbox(B, NS(o.mat ?? 'gloss'), o.c ?? K.faience, x1 - x0, t, d, (x0 + x1) / 2, y + i * gap, d / 2);
  }
  // a Deco globe lamp on a short brass stem (centre of the globe at y); lit at dusk
  function globe(B, x, y, z, r = 0.22, o = {}) {
    B.add(NS('glow'), sphG(r, 14, 10), o.c ?? K.lit, x, y, z, { glow: o.glow ?? 1.25 });
    B.add('metal', latheG('gcup', [[0, 0], [0.5, 0], [0.62, 0.18], [0.5, 0.22], [0, 0.22]], 14), o.brass ?? K.brass, x, y - r * 1.05, z, { s: r * 1.6 });
    B.add('metal', torG(r * 0.98, r * 0.06, 4, 16), o.brass ?? K.brass, x, y, z, { rx: HP });
  }
  // a brass handrail along P → Q (in the current frame) with ball ends
  function handrail(B, P, Q, o = {}) {
    rod(B, 'metal', o.c ?? K.brass, P, Q, o.r ?? 0.03, { seg: 8 });
    if (o.balls !== false) for (const p of [P, Q]) B.add('metal', sphG(o.ball ?? 0.055, 10, 8), o.c ?? K.brass, p[0], p[1], p[2], {});
  }
  // an enamel roundel (disc sign, both faces optional): ring + field + letters (one or two lines)
  function roundel(B, x, y, r, lines, o = {}) {
    B.add('metal', torG(r, r * 0.08, 6, 28), o.ring ?? K.brass, x, y, 0.03, {});
    B.add('gloss', cylGeo(r, r, 0.04, 28), o.field ?? K.navy, x, y, 0.02, { rx: HP });
    const L = [].concat(lines);
    const hh = o.h ?? r * 0.32;
    L.forEach((t, i) => letters(B, t, { h: hh * (i === 0 ? 1 : 0.75), x, y: y + (L.length === 1 ? -hh / 2 : i === 0 ? 0.02 * r : -hh * 0.95 - 0.04 * r), z: 0.042, c: o.c ?? K.cream, flat: true, mat: 'paint', wt: 0.19, track: 0.1 }));
  }
  // rivets along a line (tiny domes, no shadow): from P to Q every `step`
  function rivets(B, P, Q, step = 0.25, o = {}) {
    const L = Math.hypot(Q[0] - P[0], Q[1] - P[1], Q[2] - P[2]), n = Math.max(1, Math.floor(L / step));
    for (let i = 0; i <= n; i++) { const t = i / n; B.add(NS('metal'), sphG(o.r ?? 0.025, 6, 4, HP), o.c ?? K.rivet, P[0] + (Q[0] - P[0]) * t, P[1] + (Q[1] - P[1]) * t, P[2] + (Q[2] - P[2]) * t, { rx: o.rx ?? HP }); }
  }

  return {
    K, NS, GB, TPL, tpl, kf, pbox, pboxGeo, cylGeo, cyl, latheG, sphG, torG, strut, rod, textW, letters, lettersV, sign,
    porthole, speed, globe, handrail, roundel, rivets, col, shade, mixc, PI, TAU, HP, THREE,
  };
}
