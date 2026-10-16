// [b5-karp-checker] The checker's self-test stage (SPEC §4.4 "Self-test", §10.1): karpbox (tools/botlab/karpbox.js) with
// the pieces and data that make it a stage SPEC §9.1 passes — the clean case — and one planted fault per check, each
// alone, which must make its own check FAIL. Never shipped; bazookarp-check.cjs (KARP_SELFTEST=1) imports it in the
// game page: defineCase(id) registers MAP_LAYOUTS.karpbox for that case before the match starts.
//
// The clean box (Bravo's half; the Level mirrors it for Alpha's):
//   • a 3 m stone ring wall (r 15.5 round the Gate at (0, 0, 48), roof, no ink) with two 3 m openings, SW and SE: the
//     Gate's ring is entered through them (and over the spawn deck's two outer corners: four entrances), and the walk
//     from the Pond round to them makes L ≈ 58 m;
//   • a 1 m parapet on the spawn deck's front with three 2 m openings (three ways off the deck) and two 1.4 m crates on
//     the apron (cover between the deck and the Gate);
//   • karpbox's plateau beside the deck taken out and its climb box made a roofed crate (no climb-only high ground left
//     but the spawn deck, which its zone covers whole), its big drop-outside zone left out (it would cover a route), the
//     spawn-deck zone signed at both of its entrances;
//   • everything else as karpbox: weir A on its 1.2 m platform, the flank lane with its 1.5 m hop step, the 2.6 m gap,
//     the alley, the channel and pier, the mover, the pod plot, the carrierBlock.
import { KARPBOX_DEF, karpboxLayout } from './karpbox.js';
import { ARC } from '../../src/world/mapkit.js';

const B = (x0, x1, y0, y1, z0, z1, o = {}) => ({ kind: 'box', min: [x0, y0, z0], max: [x1, y1, z1], color: '#d8d2c4', pattern: 3, ...o });
const WALL = { paint: false, roof: true, color: '#b3aa9a', tag: 'kcheck-ring' };
const ring = (a0, a1, o = {}) => ARC(0, 48, 15.5, 0.5, 0, 3, a0, a1, Math.max(2, Math.round((a1 - a0) / 5)), { ...WALL, ...o });
// the ring wall's stretches (degrees: 0 = +x, 90 = +z): openings at 204.5–215.5 (SW) and 324.5–335.5 (SE)
const RING = [[149, 204.5], [215.5, 324.5], [335.5, 391]];
function cleanPieces() {
  const L = karpboxLayout();
  // karpbox's plateau (x 10…18, z 48…56) out; its climb box a roofed crate
  L.half = L.half.filter((d) => !(d.kind === 'box' && d.min[0] === 10 && d.max[0] === 18 && d.min[2] === 48));
  L.half = L.half.map((d) => (d.kind === 'box' && d.min[0] === -12 && d.max[0] === -8 && d.min[2] === 8 ? { ...d, paint: false, roof: true, color: '#b9a37e', tag: 'kcheck-crate' } : d));
  const add = [];
  for (const [a0, a1] of RING) add.push(...ring(a0, a1));
  // the spawn deck's parapet (1 m, on the deck's 2.4 m top), openings at x −7…−5, −1…1, 5…7
  for (const [x0, x1] of [[-8, -7], [-5, -1], [1, 5], [7, 8]]) add.push(B(x0, x1, 2.4, 3.4, 56, 56.3, { paint: false, roof: true, color: '#c4bba9', tag: 'kcheck-parapet' }));
  // two crates on the apron
  for (const x of [-3, 3]) add.push(B(x - 0.6, x + 0.6, 0, 1.4, 51.4, 52.6, { paint: false, roof: true, color: '#b48a5a', pattern: 6, tag: 'kcheck-apron' }));
  L.half.push(...add);
  return L;
}
const cleanDef = () => ({
  start: [0, 0],
  weirs: [{ at: [0, 1.2, 28], yaw: 0 }],
  gate: { at: [0, 0, 48], yaw: 0 },
  freeZones: [{ poly: [[-8, 56], [8, 56], [8, 65], [-8, 65]], y0: 2.1, y1: 2.7, signs: [[-7.6, 56.8, 180], [7.6, 56.8, 180]] }],
  carrierBlock: KARPBOX_DEF.carrierBlock,
  noRest: [], noRetreat: [],
  testStates: KARPBOX_DEF.testStates,
});

// each case: { id, check, what, expect, layout(L), def(d) } — layout / def edit the clean ones (one fault each); expect: a
// pattern the target check's text must match, so the case fails for the fault it plants and not a knock-on of it
export const CASES = [
  { id: 'clean', check: null, what: 'the clean box' },
  { id: 'f1', check: 1, expect: 'sign at .* in team \\d\'s spawn zone', what: 'a NO CARP sign standing in the spawn zone', def: (d) => { d.freeZones[0].signs.push([2.0, 58, 180]); } },
  { id: 'f2', check: 2, expect: '\\(Δ (?:[3-9]|[1-9]\\d)(?:\\.\\d)? %\\)', what: 'a wall on Bravo\'s half only (a `single`): Alpha\'s walk 50 % longer, L_A ≠ L_B', layout: (L) => { L.single.push(B(-14, 14, 0, 3, 22.5, 23, { paint: false, roof: true, color: '#a99', tag: 'kcheck-asym' })); } },
  { id: 'f3', check: 3, expect: 'weir 1 at count \\d+ \\([\\d.]+ %: band 45–60\\)', what: 'the weir at 85 % of the way (count ≈ 15)', def: (d) => { d.weirs = [{ at: [0, 0, 40], yaw: 0 }]; } },
  { id: 'f4', check: 4, expect: 'Pond → weir 1 has no climb-free carrier route', what: 'the weir on a 3 m box only a climb reaches', layout: (L) => { L.half.push(B(-12.5, -5.5, 0, 3, 11.5, 17.5, { color: '#cfc7b6', tag: 'kcheck-climbweir' })); }, def: (d) => { d.weirs = [{ at: [-9, 3, 14.5], yaw: 0 }]; } },
  { id: 'f5', check: 5, expect: 'Pond → weir 1: no second route', what: 'the weir at the end of a 3 m dead-end corridor (one way in, 12 m long)', layout: (L) => { L.half.push(B(-19.3, -19, 0, 3, 30, 44.3, { paint: false, roof: true, tag: 'kcheck-corridor' }), B(-16, -15.7, 0, 3, 30, 44.3, { paint: false, roof: true, tag: 'kcheck-corridor' }), B(-19.3, -15.7, 0, 3, 44, 44.3, { paint: false, roof: true, tag: 'kcheck-corridor' })); }, def: (d) => { d.weirs = [{ at: [-17.5, 0, 41.5], yaw: 0 }]; } },
  { id: 'f6', check: 6, expect: '= [0-9](?:\\.\\d)? s walking \\(11\\.5–18\\)', what: 'a third opening in the ring wall, straight in from the south: Pond → Gate ≈ 10 s', layout: (L) => { L.half = L.half.filter((p) => p.tag !== 'kcheck-ring'); for (const [a0, a1] of [[149, 204.5], [215.5, 264.5], [275.5, 324.5], [335.5, 391]]) L.half.push(...ring(a0, a1)); } },
  { id: 'f7', check: 7, expect: '\\(a\\) team \\d: an entrance at .*\\[hop over off-field ground\\] not seen from the spawn deck', what: 'a 1.5 m non-inkable ledge through the ring wall into the Gate\'s ring that only a hop climbs, screened from the spawn deck', phys: true,
    layout: (L) => { L.half = L.half.filter((p) => p.tag !== 'kcheck-ring'); for (const [a0, a1] of [[149, 175], [185, 204.5], [215.5, 324.5], [335.5, 391]]) L.half.push(...ring(a0, a1));
      L.half.push(B(-17.0, -14.0, 0, 1.5, 46.6, 49.4, { paint: false, color: '#b9b2a4', tag: 'kcheck-ledge' }), B(-12.5, -12, 0, 3.6, 44, 56, { paint: false, roof: true, color: '#a9a090', tag: 'kcheck-screen' })); } },
  { id: 'f8', check: 8, expect: '° off the pad → Pond line \\(±40°\\)', what: 'the Gate 45° off the pad → Pond line', def: (d) => { d.gate = { at: [12.5, 0, 47.5], yaw: 0 }; } },
  { id: 'f9', check: 9, expect: 'an entrance at .* with no sign within 2 m', what: 'a free-zone entrance with no sign', def: (d) => { d.freeZones[0].signs = [[-7.6, 56.8, 180]]; } },
  { id: 'f10', check: 10, expect: 'on its own half dips [\\d.]+ m in progress', what: 'low walls either side of the Pond: the own-half route walks back toward its own base', layout: (L) => { L.half.push(B(-17, 14, 0, 1.0, 2.6, 3.0, { paint: false, roof: true, color: '#b9b2a4', tag: 'kcheck-pondwall' })); } },
  { id: 'f11', check: 11, expect: 'drop coverage: \\d+ of \\d+ splats bad', what: 'a noRest polygon over 26 m of the routes: splats there find no resting spot within 12 m', def: (d) => { d.noRest = [{ poly: [[-20, 4], [14, 4], [14, 30], [-20, 30]], y0: -0.5, y1: 1.5 }]; } },
  { id: 'f12', check: 12, expect: 'not tagged for it: kcheck-leak', what: 'a crate tagged notIn: \'turf\' (it leaks into Zone Control and Tower Command too)', layout: (L) => { L.half.push(B(-18, -17, 0, 1, 33, 34, { notIn: 'turf', color: '#b48a5a', tag: 'kcheck-leak' })); } },
  { id: 'f13', check: 13, expect: 'apron: 0 cover block', what: 'the apron\'s crates gone (no cover between the deck and the Gate)', layout: (L) => { L.half = L.half.filter((p) => p.tag !== 'kcheck-apron'); } },
  { id: 'f14', check: 14, expect: 'the shell seen from [0-5]/8 directions', what: 'two 3 m walls 5.5 m out from the Pond (N and NE; mirrored S and SW): seen from 3 of 8', layout: (L) => { L.half.push(B(-1, 1, 0, 3, 5.3, 5.8, { paint: false, roof: true, tag: 'kcheck-pondblock' }), { kind: 'obox', center: [3.9, 1.5, 3.9], size: [2, 3, 0.5], rotY: 45, paint: false, roof: true, color: '#d8d2c4', pattern: 3, tag: 'kcheck-pondblock' }); } },
  { id: 'f15', check: 15, expect: 'solid within 3 m: kcheck-pillar', what: 'a pillar 2 m from the weir', layout: (L) => { L.half.push(B(1.0, 1.6, 1.2, 4.2, 29.4, 30.0, { paint: false, roof: true, tag: 'kcheck-pillar' })); } },
  { id: 'f16', check: 16, expect: '\\d+ made, [1-9]\\d* not \\([1-9]\\d* hops, \\d+ gaps up / level, \\d+ gaps down\\) → hopVeto', what: 'an awning over the flank lane\'s 1.5 m step: the field adds the hop, no kid makes it', phys: true, layout: (L) => { L.half.push(B(-20, -14.5, 1.7, 1.8, 13.7, 14.0, { paint: false, roof: true, color: '#8a7f70', tag: 'kcheck-awning' })); } },
  { id: 'f16w', check: 16, expect: 'NOT WALKED: team \\d Pond → weir 1, route 1', what: 'a 2.5 m thin fence across the Pond → weir approach with a 0.5 m slot on route 1\'s line: the graph walks through the slot (its centre ray passes), no carrier\'s 0.76 m body fits', phys: true,
    layout: (L) => { L.half.push(B(-4, 0.25, 0, 2.5, 13.96, 14.04, { paint: false, roof: true, color: '#8a7f70', tag: 'kcheck-fence' }), B(0.75, 4, 0, 2.5, 13.96, 14.04, { paint: false, roof: true, color: '#8a7f70', tag: 'kcheck-fence' })); } },
  // SPEC §4.4's own list, beyond one fault per check
  { id: 'x5', check: 5, expect: 'the weirs 8 m apart \\(≥ 12\\)', what: 'two weirs 8 m apart', def: (d) => { d.weirs = [{ at: [0, 1.2, 28], yaw: 0 }, { at: [0, 0, 36], yaw: 0 }]; } },
  { id: 'x7b', check: 7, expect: '\\(b\\) \\d+ climb edge\\(s\\) on climb shortcuts saving > 20 %', what: 'a climb shortcut: the ring\'s only opening far round by the deck, and an inkable stretch of its wall facing the Pond (a climb saves 30 %)', layout: (L) => { L.half = L.half.filter((p) => p.tag !== 'kcheck-ring'); for (const [a0, a1] of [[149, 155], [166, 255], [285, 391]]) L.half.push(...ring(a0, a1)); L.half.push(B(-4, 4, 0, 3, 32.0, 33.2, { color: '#cfc7b6', tag: 'kcheck-climbwall' })); } },
  { id: 'x7d', check: 7, expect: '\\(d\\) \\d+ connection\\(s\\) the graph lacks gaining > 10 m: lowGap', what: 'a squid-only gap (0.7 m headroom) through the ring wall into the Gate\'s ring', layout: (L) => { L.half = L.half.filter((p) => p.tag !== 'kcheck-ring'); for (const [a0, a1] of [[149, 204.5], [215.5, 235], [245, 324.5], [335.5, 391]]) L.half.push(...ring(a0, a1)); L.half.push(...ARC(0, 48, 15.5, 0.5, 0.7, 3, 235, 245, 2, { ...WALL, tag: 'kcheck-ring-low' })); } },
  { id: 'x9a', check: 9, expect: 'reachable by its carrier, the enemy only by climbing, \\d+/\\d+ nodes in its zones', what: 'a climb-only 3 m plateau with a zone over half of it', layout: (L) => { L.half.push(B(-19, -16, 0, 3, 30, 38, { color: '#cfc7b6', tag: 'kcheck-plateau' })); }, def: (d) => { d.freeZones.push({ poly: [[-19, 30], [-16, 30], [-16, 34], [-19, 34]], y0: 2.7, y1: 3.3, signs: [[-15.6, 32, 90]] }); } },
  { id: 'x9b', check: 9, expect: 'a noRetreat polygon within 3 m of', what: 'a noRetreat polygon over the spawn deck\'s zone', def: (d) => { d.noRetreat = [{ poly: [[-6, 52], [6, 52], [6, 58], [-6, 58]], y0: -0.5, y1: 3 }]; } },
  // stage states, generically (karp-check-states.js): a module's karpStates() with its audit query; the wall it raises in
  // state 'w' stands 2.6 m from the weir — #15 must pass in state 0 and FAIL in state 'w' (that page loaded with its query)
  { id: 'states', check: 15, allStates: true, what: 'a stage module\'s second state (G.match.stage.karpStates(), its world on ?kcstate=w) puts a wall 2.6 m from the weir', layout: (L) => { L.kcstates = { wall: [-1, 1, 30.6, 31.0, 3] }; } },
  { id: 'x9c', check: 9, expect: 'node\\(s\\) not on its owner\'s half', what: 'a free zone poking 2 m over the halfway line', def: (d) => { d.freeZones.push({ poly: [[-20, -2], [-16, -2], [-16, 4], [-20, 4]], y0: -0.3, y1: 0.3, signs: [[-15.6, 1, 90]] }); } },
];

export function caseOf(id) {
  const c = CASES.find((q) => q.id === id) || CASES[0];
  const L = cleanPieces(), d = cleanDef();
  if (c.layout) c.layout(L);
  if (c.def) c.def(d);
  L.bazookarp = d;
  return { c, L };
}
// register karpbox for case `id` (before startMatch)
export async function defineCase(id) {
  const { MAPS } = await import('../../src/config.js');
  const { MAP_LAYOUTS } = await import('../../src/world/maps.js');
  if (!MAPS.find((m) => m.id === 'karpbox')) MAPS.push({ id: 'karpbox', name: 'Karp Box', blurb: '', theme: 'day', times: { day: 'day', dusk: 'sunset' } });
  const { c, L } = caseOf(id);
  if (L.kcstates) (await import('./karp-check-states.js')).registerKcStates();
  MAP_LAYOUTS.karpbox = L;
  void c;
  return true;
}
