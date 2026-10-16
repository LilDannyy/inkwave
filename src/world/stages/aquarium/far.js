// Gulper Aquarium — the islet's edges and the far scenery of its own (owner: the aquarium stage; built by backdrop.js with
// the environment's SCENERY_KIT, so this imports nothing). The Inkopolis-bay scenery stays on (the city across the bay,
// the port, the lighthouse, the bridge, the ferris wheel, the sailboats: this IS an islet in the bay); round it:
//   seawall   the islet's granite sea wall: a dark plinth along every edge of the drum and both blades, at the waterline
//   dome      the Deep Dome, a glass observatory dome on stilts 240 m out east, joined to the islet by a Tubeway tube on
//             pylons (unlit glass; a small lamp on each brass collar at dusk); a glowing streak runs along it every few
//             seconds (animate)
//   light     a red-and-white breakwater light on its rubble mole north-east, its lamp lit at dusk
export function buildFar(kit, P) {
  const { box, cyl, sph, xf, beam, prep } = kit;
  const T = kit.THREE, DEG = Math.PI / 180;
  const st = [], plain = [];
  const GR = '#3f4448', GL = '#5a5f62', CAP = '#8d8f8c';
  // ---- the sea wall: segments from A to B (the deck edge), standing out by `out` on the sea side n
  const wall = (A, Bp, inside = [0, 0], out = 0.7) => {
    const dx = Bp[0] - A[0], dz = Bp[1] - A[1], L = Math.hypot(dx, dz);
    if (L < 0.05) return;
    let nx = dz / L, nz = -dx / L;
    const mx = (A[0] + Bp[0]) / 2, mz = (A[1] + Bp[1]) / 2;
    if ((mx - inside[0]) * nx + (mz - inside[1]) * nz < 0) { nx = -nx; nz = -nz; }   // (always out to sea)
    const cx = (A[0] + Bp[0]) / 2 + nx * out * 0.5, cz = (A[1] + Bp[1]) / 2 + nz * out * 0.5, ry = Math.atan2(-dz, dx);
    st.push(xf(box(L + 0.06, 1.25, out, GR), cx, -2.15, cz, ry));
    st.push(xf(box(L + 0.06, 0.12, out + 0.08, CAP), cx, -1.48, cz, ry));
  };
  // the drum's sea edges (Alpha's, then turned): the promenade's sea face r 31.4 (α −171 … −110), the Reef Window's outer
  // wall r 32.55 (α −70 … −2.6), the plant room to the balcony (α −2.6 … 12)
  const arc = (r, a0, a1, n) => { for (let i = 0; i < n; i++) { const t0 = a0 + ((a1 - a0) * i) / n, t1 = a0 + ((a1 - a0) * (i + 1)) / n; for (const s of [1, -1]) wall([s * r * Math.cos(t0 * DEG), s * r * Math.sin(t0 * DEG)], [s * r * Math.cos(t1 * DEG), s * r * Math.sin(t1 * DEG)]); } };
  arc(31.45, -110, -171, 20);
  arc(32.6, -2.6, -70, 22);
  arc(32.6, 13, -2.6, 5);
  // the blades (Alpha's in the blade frame; turned): the leading edge (the Pump Hall's back wall and the plaza's sea edge),
  // the spawn deck's back curve, the pavilion stairs' outer sides
  const W = P.W;
  const chain = (pts, inS = 20) => { for (let i = 0; i < pts.length - 1; i++) for (const s of [1, -1]) { const a = W(...pts[i]), b = W(...pts[i + 1]), c = W(inS, 0); wall([s * a[0], s * a[1]], [s * b[0], s * b[1]], [s * c[0], s * c[1]]); } };
  chain([[3.6, 19.55], [10, 19.55]]); chain([[10.6, 18.05], [19, 18.05]]); chain([[19.6, 16.55], [21, 16.55]]); chain([[21, 16.86], [31.2, 16.86]]); chain([[31.2, 16.32], [39.6, 16.32]], 35);
  const back = (w) => 41 + 2 * (1 - (w / 16) ** 2);
  chain(Array.from({ length: 11 }, (_, i) => { const w = 16 - 3.2 * i; return [back(w) + 0.02, w]; }), 36);
  chain([[39.6, -16.32], [31.0, -16.32]], 35);
  // ---- the Deep Dome: 240 m out east on six stilts, its glass dome lit at dusk; the tube to the islet on pylons
  const dx = 262, dz = 18, dy = 7;
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; st.push(xf(cyl(0.9, 1.1, dy + 4, 8, GL), dx + Math.cos(a) * 14, -1.6 + (dy + 4) / 2 - 4, dz + Math.sin(a) * 14)); }
  st.push(xf(cyl(19, 19, 2.4, 28, '#d8d2c4'), dx, dy, dz));
  st.push(xf(cyl(19.4, 19.4, 0.5, 28, '#a8895a'), dx, dy + 1.4, dz));
  const domeG = new T.SphereGeometry(17.5, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  st.push(xf(prep(domeG, '#9ec6cc', 0.35), dx, dy + 1.6, dz));
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; st.push(beam(dx + Math.cos(a) * 17.6, dy + 1.6, dz + Math.sin(a) * 17.6, dx + Math.cos(a) * 3, dy + 18.6, dz + Math.sin(a) * 3, 0.3, '#a8895a')); }
  st.push(xf(sph(1.4, 10, 8, '#a8895a'), dx, dy + 19.1, dz));
  // the tube: from the E plant room's sea face (x 33, y 4) out to the dome (x 243, y 9), on pylons every 21 m
  const A = [33.5, 4.2, 2.0], Bq = [dx - 19.5, dy + 3.0, dz];
  const tubeG = new T.CylinderGeometry(0.9, 0.9, 1, 14, 1, true);
  const L = Math.hypot(Bq[0] - A[0], Bq[1] - A[1], Bq[2] - A[2]);
  // (fix round 3: the tube's glass glowed (0.15) and read at dusk as one white bar across the sea, the brightest thing on the
  // stage side of the spawn's view — now it stays unlit and a little greyer; only the travelling streak and the collars'
  // small lamps light it at dusk, DESIGN.md §5.6)
  { const g = prep(tubeG, '#b9ccd0', 0); g.scale(1, L, 1); g.rotateZ(-Math.PI / 2); g.rotateZ(Math.atan2(Bq[1] - A[1], Math.hypot(Bq[0] - A[0], Bq[2] - A[2]))); g.rotateY(-Math.atan2(Bq[2] - A[2], Bq[0] - A[0])); g.translate((A[0] + Bq[0]) / 2, (A[1] + Bq[1]) / 2, (A[2] + Bq[2]) / 2); st.push(g); }
  for (let i = 1; i < 10; i++) {
    const t = i / 10, x = A[0] + (Bq[0] - A[0]) * t, y = A[1] + (Bq[1] - A[1]) * t, z = A[2] + (Bq[2] - A[2]) * t;
    st.push(xf(box(0.7, y + 1.6 - 0.9, 0.7, GL), x, (y - 0.9 - 1.6) / 2, z));
    st.push(xf(cyl(1.05, 1.05, 0.35, 14, '#a8895a'), x, y, z, 0, 0, Math.PI / 2));
    st.push(xf(sph(0.13, 8, 6, '#ffe2b0', 0.55), x, y + 1.12, z));   // (the collar's lamp: lit at dusk)
  }
  // the streak: a warm capsule running out along the tube every 7 s
  const streakMat = new T.MeshBasicMaterial({ color: '#fff0d0', transparent: true, opacity: 0.0, depthWrite: false });
  const streak = new T.Mesh(new T.CapsuleGeometry(0.55, 3.0, 4, 10), streakMat);
  streak.rotation.z = Math.PI / 2; streak.rotation.y = -Math.atan2(Bq[2] - A[2], Bq[0] - A[0]); streak.name = 'aq-dome-streak';
  // ---- the breakwater light (north-east, 170 m): a rubble mole, a red-and-white tower, its lamp
  const lx = 120, lz = 118;
  for (let i = 0; i < 26; i++) { const t = i / 25; st.push(xf(sph(3 + (i % 3), 6, 4, '#8a8780'), lx - 40 + t * 46, -2.2, lz - 22 + t * 24, i, 0, 0, 1, 0.55, 1)); }
  st.push(xf(cyl(2.6, 3.2, 3, 12, '#cfc9bd'), lx + 6, -0.6, lz + 2));
  for (let k = 0; k < 4; k++) st.push(xf(cyl(1.75 - k * 0.12, 1.85 - k * 0.12, 3, 14, k % 2 ? '#f1ece2' : '#b9443a'), lx + 6, 2.4 + k * 3, lz + 2));
  st.push(xf(cyl(1.1, 1.1, 1.6, 12, '#fff3d8', 1.0), lx + 6, 14.2, lz + 2));
  st.push(xf(cyl(0.2, 1.4, 1.0, 12, '#9c3a32'), lx + 6, 15.5, lz + 2));
  const animate = (t, night) => {
    const per = 7, u = (t % per) / per;
    const k = Math.min(1, u * 6) * Math.min(1, (1 - u) * 6);
    streak.position.set(A[0] + (Bq[0] - A[0]) * u, A[1] + (Bq[1] - A[1]) * u, A[2] + (Bq[2] - A[2]) * u);
    streakMat.opacity = (0.45 + 0.4 * night) * k;
    streak.visible = night > 0.3;   // (a dusk sight: no draw call by day)
  };
  return { static: st, plain, objects: [streak], animate };
}
