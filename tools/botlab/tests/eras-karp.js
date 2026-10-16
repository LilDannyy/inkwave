// Bluestone Junction's era engine — Bazookarp (tools/botlab/jobs/batch5/stages/bluestone/ENGINE.md H21, §6 step 12b; the
// Bazookarp SPEC §2.7, §3.2 step 6, §9.4; docs/STAGE-MODS.md "The subs SPEC and Bazookarp interfaces"), on the stage itself:
//   MAP=bluestone PAGE=tools/botlab/tests/eras-karp.js tools/botlab/run.sh tools/botlab/page.cjs
// The Bazookarp engine (wave 2's karp-engine: src/game/karpField.js, src/game/bazookarp.js) is not on this branch. The era
// side of H21 is the registry's query surface, and this test drives it two ways:
//   A (always) a stand-in field built exactly as the karp engine builds its states (G.match.stage.karpStates() → one state
//     per era, its nodes those valid in that era), listening as it does (era:done → setState(stateOf(era)), era:warn →
//     the danger rule on): it switches at each done and is never rebuilt; a carrier on ground a group opened before done
//     has no own node in the state in force (the field keeps its last value); the drop spot, from the warning to done,
//     never picks a node in a changing piece's box (G.match.stage.danger(node, 0)) nor one a later era removes
//     (G.match.stage.restMask(era): valid in the era in force and every later one); in the 3000s a drop on the Halo
//     stays on the Halo (SPEC Q19)
//   B (when the karp module is present: a 'bazookarp' match builds match.karp) the same on the real KarpField — its states
//     keyed 0 (as built), 1, 2, 3; field.state follows each done; the field object is never rebuilt; L (the Pond's
//     reading) per state within ±0.5 m; a carrier between a flip and done reads null; the drop spot never a danger node.
//     Without the module B reports SKIP (cleanly: no failure, nothing half-run).
(async () => {
  const g = window.__inkwave, out = [];
  const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const THREE = await import('three');
  const CTX = await import('./src/core/ctx.js');
  const dbg = g.debug;
  const step = (s) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) dbg.step(1000 / 60); };
  const waitPlaying = async () => { for (let i = 0; i < 400; i++) { if (g.match?.state === 'playing') return true; await new Promise((r) => setTimeout(r, 100)); } return false; };
  const calm = () => { for (const a of g.match.actors) { if (a.bot) a.bot.update = () => {}; if (a.intent) { a.intent.move?.set(0, 0, 0); a.intent.fire = a.intent.squid = a.intent.jump = a.intent.sub = a.intent.special = false; } } };

  // ============================================================================================ A: the stand-in field
  dbg.unfreeze?.();
  await g.api.startMatch({ mapId: 'bluestone', mode: 'turf', duration: 90 });
  await waitPlaying(); dbg.freeze(); calm();
  let m = g.match, E = m.eras, W = __G.eraWorld, L = __G.level, nav = __G.nav, S = m.stage;
  if (!E || !S) { R('the era engine runs on bluestone', false); return out; }
  const tAt = (t) => step(Math.max(0, t - E.S.clock.t));
  // A1: the states the registry hands the field
  const st = S.karpStates(), N = nav.nodes.length;
  const near = (x, y, z) => { let best = -1, bd = Infinity; for (const n of nav.nodes) { if (!nav.anyValid[n.id]) continue; const d = (n.x - x) ** 2 + ((n.y - y) * 2) ** 2 + (n.z - z) ** 2; if (d < bd) { bd = d; best = n.id; } } return best; };
  const crate = L.blocks.find((b) => b.tag === 'crates-stack' && b.center.z < 0), halo = L.blocks.find((b) => b.tag === 'halo' && b.center.z < 0);
  const nCrate = near(crate.center.x, 0, crate.center.z), nHalo = near(halo.center.x, 5.4, halo.center.z), nStreet = near(-20, 0, -40);
  const okAt = (id) => st.map((s) => (s.nodeOk(id) ? 1 : 0)).join('');
  R('H21: G.match.stage.karpStates() hands the carrier field one state per era (keys 1, 2, 3), each the nodes valid in that era: the Halo in the 3000s only, the Degrayling crates\' footprint from TODAY, the street in all three',
    st.length === 3 && st.map((s) => s.key).join('') === '123' && okAt(nHalo) === '001' && okAt(nCrate) === '011' && okAt(nStreet) === '111',
    { keys: st.map((s) => s.key), halo: okAt(nHalo), crates: okAt(nCrate), street: okAt(nStreet), nodes: N });
  // the stand-in: built once at load as karpField builds its states (state 0 = the world as built, then the stage's);
  // a backwards Dijkstra per state from Bravo's Gate (the layout's gate, Alpha's attack) over the edges the state allows
  const K = L.layout.bazookarp, gate = K.gate.at, U = nav.nodes;
  const Stub = { builds: 0, switches: [], danger: false, state: 0, states: [] };
  const okN0 = Uint8Array.from(nav.valid);
  const mk = (key, okN, bit) => {
    const D = new Float32Array(N).fill(Infinity), seeds = U.filter((n) => okN[n.id] && Math.hypot(n.x - gate[0], n.z - gate[1]) < 2.5).map((n) => n.id);
    const q = [...seeds]; for (const s of seeds) D[s] = 0;
    // (a small Dijkstra: the graph is ~6 k nodes; edges are symmetric enough for a reading)
    while (q.length) { let bi = 0; for (let i = 1; i < q.length; i++) if (D[q[i]] < D[q[bi]]) bi = i; const u = q.splice(bi, 1)[0];
      for (const e of U[u].nb) { if (!okN[e.to] || (bit && e.em !== undefined && !(e.em & bit))) continue; const nd = D[u] + e.cost; if (nd < D[e.to]) { if (D[e.to] === Infinity) q.push(e.to); D[e.to] = nd; } } }
    return { key, okN, D };
  };
  Stub.states.push(mk(0, okN0, 1));
  for (const s of st) { const ok = new Uint8Array(N); for (let i = 0; i < N; i++) ok[i] = nav.anyValid[i] && s.nodeOk(i) ? 1 : 0; Stub.states.push(mk(s.key, ok, 1 << (s.key - 1))); }
  Stub.builds++;
  Stub.stateOf = (key) => { const i = Stub.states.findIndex((s) => s.key === key); return i < 0 ? 0 : i; };
  Stub.fieldAt = (pos) => { const S0 = Stub.states[Stub.state]; let best = -1, bd = 0.9 * 0.9; for (const n of U) { if (!S0.okN[n.id] || Math.abs(n.y - pos.y) > 0.5) continue; const d = (n.x - pos.x) ** 2 + (n.z - pos.z) ** 2; if (d < bd) { bd = d; best = n.id; } } return best < 0 ? null : S0.D[best]; };
  // the drop spot: a ring search for a rest of the state in force (and every later one: restMask), skipping danger nodes
  Stub.dropSpot = (p) => {
    const rm = S.restMask(E.era), cand = [];
    for (const n of U) { if (!rm[n.id] || !nav.valid[n.id]) continue; const d = Math.hypot(n.x - p.x, n.z - p.z) + Math.abs(n.y - p.y) * 0.5; if (d < 12) cand.push([d, n.id]); }
    cand.sort((a, b) => a[0] - b[0]);
    for (const [, id] of cand) if (!(Stub.danger && S.danger(U[id], 0))) return id;
    return -1;
  };
  const offs = [CTX.on('era:done', ({ era }) => { Stub.danger = false; const s = Stub.stateOf(era); if (s !== Stub.state) { Stub.state = s; Stub.switches.push([+E.S.clock.t.toFixed(2), era, s]); } }),
    CTX.on('era:warn', () => { Stub.danger = true; })];
  // A2–A4 on the real schedule (jumps at 30 and 60 s of the 1:30)
  const J1 = E.sched.jumps[0], J2 = E.sched.jumps[1];
  const F1 = J1.at + W.groups[crate.eraG].rg / W.speed;
  tAt(F1 + 0.3);
  const onOpened = new THREE.Vector3(U[nCrate].x, U[nCrate].y + 0.05, U[nCrate].z);
  const midJump = { era: E.era, stubState: Stub.states[Stub.state].key, read: Stub.fieldAt(onOpened), crateSolid: crate.solid };
  // the drop spot from a point inside the crates' box while the jump runs (warning → done)
  const dropMid = Stub.dropSpot(new THREE.Vector3(crate.center.x, 0, crate.center.z)), dropMidDanger = dropMid >= 0 && S.danger(U[dropMid], 0);
  tAt(J1.at + W.doneOff + 0.2);
  const afterDone = { era: E.era, stubState: Stub.states[Stub.state].key, read: Stub.fieldAt(onOpened) };
  // jump 2: the drop spot from inside a changing piece's box (the boat shed → the boat stair) during the warning
  tAt(J2.at - 5);
  const shed = L.blocks.find((b) => b.tag === 'boat-shed' && b.center.z < 0);
  const dropWarn = Stub.dropSpot(new THREE.Vector3(shed.center.x, 0, shed.center.z)), dropWarnDanger = dropWarn >= 0 && S.danger(U[dropWarn], 0);
  tAt(J2.at + W.doneOff + 0.3);
  // Q19: in the 3000s a drop on the Halo stays on the Halo
  const dropHalo = Stub.dropSpot(new THREE.Vector3(U[nHalo].x, U[nHalo].y, U[nHalo].z)), hy = dropHalo >= 0 ? U[dropHalo].y : null;
  // the danger rule where it bites: a top that goes (the Halo in a rewind 3 → 1, Practice's schedule — the only walkable
  // tops that vanish on the Z). In its warning the nearest rest to a point on the Halo is a Halo node, inside the Halo's
  // box: the drop spot must pass it over for the ground
  const Jr = E.debugJump(1, { inS: 6 }); step(0.5);
  Stub.danger = true;
  const hp = new THREE.Vector3(U[nHalo].x, U[nHalo].y, U[nHalo].z);
  const plain = (() => { const rm = S.restMask(E.era); let best = -1, bd = Infinity; for (const n of U) { if (!rm[n.id] || !nav.valid[n.id]) continue; const d = Math.hypot(n.x - hp.x, n.z - hp.z) + Math.abs(n.y - hp.y) * 0.5; if (d < bd) { bd = d; best = n.id; } } return best; })();
  const plainDanger = plain >= 0 && S.danger(U[plain], 0), dropRw = Stub.dropSpot(hp), dropRwDanger = dropRw >= 0 && S.danger(U[dropRw], 0);
  tAt(Jr.at + W.doneOff + 0.3);
  const dangerAfter = plain >= 0 && S.danger(U[plain], 0);
  Stub.danger = false;
  // every rest the drop spot can pick in era e is valid in e and every later era
  const restOk = [1, 2, 3].map((e) => { const rm = S.restMask(e); let bad = 0, n = 0; for (let i = 0; i < N; i++) if (rm[i]) { n++; for (let k = e; k <= 3; k++) if (!nav.eraValid[k - 1][i]) { bad++; break; } } return { e, rests: n, bad }; });
  offs.forEach((f) => f());
  R('H21: the field switches at each done to that era\'s state (1 → 2 → 3, and back to 1 in the test\'s rewind) and is built once, at load (never mid-match)',
    Stub.builds === 1 && Stub.switches.length === 3 && Stub.switches[0][1] === 2 && Stub.switches[1][1] === 3 && Stub.switches[2][1] === 1 && Math.abs(Stub.switches[0][0] - (J1.at + W.doneOff)) < 0.05 && Math.abs(Stub.switches[1][0] - (J2.at + W.doneOff)) < 0.05,
    { switches: Stub.switches, note: 'the third is the test\'s rewind (debugJump 3 → 1)', builds: Stub.builds, dones: [J1.at + W.doneOff, J2.at + W.doneOff].map((x) => +x.toFixed(2)) });
  R('H21 (rev 2): a carrier on ground a group opened before done (the crates\' footprint, between their flip and done) has no own node in the state in force — the field keeps its last value; after done it reads',
    !midJump.crateSolid && midJump.era === 1 && midJump.stubState === 0 && midJump.read === null && afterDone.stubState === 2 && Number.isFinite(afterDone.read), { midJump, afterDone });
  R('H21: the drop spot never picks a node in a changing piece\'s box from the warning to done (G.match.stage.danger) — in a rewind\'s warning the nearest rest to a point on the Halo is a Halo node in its box, and the drop goes to the ground instead; nor a node a later era removes (restMask: valid in the era in force and every later one); in the 3000s a drop on the Halo stays on the Halo (Q19)',
    dropMid >= 0 && !dropMidDanger && dropWarn >= 0 && !dropWarnDanger && plainDanger && dropRw >= 0 && !dropRwDanger && U[dropRw].y < 3 && !dangerAfter && restOk.every((r) => r.bad === 0 && r.rests > 1000) && dropHalo >= 0 && hy > 5,
    { dropMid: dropMid >= 0 ? [U[dropMid].x, U[dropMid].y, U[dropMid].z] : null, dropWarn: dropWarn >= 0 ? [U[dropWarn].x, U[dropWarn].y, U[dropWarn].z] : null,
      rewind: { plain: plain >= 0 ? [U[plain].x, U[plain].y, U[plain].z] : null, plainDanger, drop: dropRw >= 0 ? [U[dropRw].x, U[dropRw].y, U[dropRw].z] : null, dropDanger: dropRwDanger, dangerAfterDone: dangerAfter },
      restOk, dropHalo: dropHalo >= 0 ? [U[dropHalo].x, U[dropHalo].y, U[dropHalo].z] : null });

  // ============================================================================================ B: the real karp module
  let hasKarp = false;
  try { await import('./src/game/karpField.js'); hasKarp = true; } catch (e) { hasKarp = false; }
  if (!hasKarp) {
    R('SKIP (the karp module is not on this branch: src/game/karpField.js absent) — part B runs at integration, when a bazookarp match builds match.karp', true, { karpField: false });
    return out;
  }
  dbg.unfreeze?.();
  await g.api.startMatch({ mapId: 'bluestone', mode: 'bazookarp' });
  await waitPlaying(); dbg.freeze(); calm();
  m = g.match; E = m.eras; W = __G.eraWorld; L = __G.level; nav = __G.nav; S = m.stage;
  const KP = m.karp;
  if (!KP || !KP.field) { R('B: a bazookarp match on bluestone builds match.karp with its field', false, { mode: m.mode, karp: !!KP }); return out; }
  const F = KP.field, F0 = F, build0 = F.stats.buildMs, keys = F.states.map((s) => s.key);
  const sw = []; const off2 = CTX.on('karp:field', ({ state }) => sw.push([+E.S.clock.t.toFixed(2), state, F.stateKey()]));
  const Lread = F.states.map((s, i) => [0, 1].map((t) => { const r = F.fieldAt(t, KP.R.pond, undefined, i); return r ? +r.d.toFixed(2) : null; }));
  const tAt2 = (t) => step(Math.max(0, t - E.S.clock.t));
  const Jb = E.sched.jumps[0], Fb = Jb.at + W.groups[crate.eraG].rg / W.speed;
  tAt2(Fb + 0.3);
  const crateN = (() => { let best = -1, bd = Infinity; for (const n of nav.nodes) { if (!nav.anyValid[n.id]) continue; const d = (n.x - crate.center.x) ** 2 + (n.y) ** 2 + (n.z - crate.center.z) ** 2; if (d < bd) { bd = d; best = n.id; } } return best; })();
  const pos = new THREE.Vector3(nav.nodes[crateN].x, nav.nodes[crateN].y + 0.05, nav.nodes[crateN].z);
  const readMid = F.fieldAt(0, pos);
  const dM = F.dropSpot(new THREE.Vector3(crate.center.x, 0, crate.center.z), 0, (n) => KP._dynOk(n));
  tAt2(Jb.at + W.doneOff + 0.3);
  const readAfter = F.fieldAt(0, pos);
  off2();
  const Lspan = [0, 1].map((t) => { const v = Lread.map((x) => x[t]).filter((x) => x !== null); return v.length ? +(Math.max(...v) - Math.min(...v)).toFixed(2) : null; });
  R('B: the real KarpField on bluestone — states keyed 0 (as built), 1, 2, 3; field.state follows the done (TODAY); never rebuilt; L per state within ±0.5 m; a carrier between a flip and done reads null; the drop spot never a danger node',
    keys.join(',') === '0,1,2,3' && F === KP.field && F === F0 && F.stats.buildMs === build0 && F.stateKey() === 2 && Lspan.every((s) => s !== null && s <= 0.5) && readMid === null && !!readAfter && (dM < 0 || !S.danger(nav.nodes[dM], 0)),
    { keys, switches: sw, Lread, Lspan, readMid, readAfter: readAfter && +readAfter.d.toFixed(2), drop: dM });
  return out;
})()
