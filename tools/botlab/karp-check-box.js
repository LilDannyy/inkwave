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
const RP = (low, high, width, o = {}) => ({ kind: 'ramp', low, high, width, thickness: 0.4, color: '#c8c2b4', pattern: 3, ...o });
const NOINK = { paint: false, color: '#b9b2a4' };
const WALL = { paint: false, roof: true, color: '#b3aa9a', tag: 'kcheck-ring' };
const same = (p, q) => JSON.stringify(p) === JSON.stringify(q);
const isBox = (d, mn, mx) => d.kind === 'box' && same(d.min, mn) && same(d.max, mx);
// the ring wall rebuilt with other openings (each case that needs one: stretches in degrees)
const reRing = (L, list) => { L.half = L.half.filter((p) => p.tag !== 'kcheck-ring'); for (const [a0, a1] of list) L.half.push(...ring(a0, a1)); };
// the main floor (x −20…14, z 0…56) replaced by pieces that leave out the given [x0, x1, z0, z1] rectangles (moats, pits)
const floorWithout = (L, ...holes) => {
  L.half = L.half.filter((d) => !isBox(d, [-20, -1.2, 0], [14, 0, 56]));
  const xs = [...new Set([-20, 14, ...holes.flatMap((h) => [h[0], h[1]])])].sort((a, b) => a - b), zs = [...new Set([0, 56, ...holes.flatMap((h) => [h[2], h[3]])])].sort((a, b) => a - b);
  for (let i = 0; i + 1 < zs.length; i++) for (let j = 0; j + 1 < xs.length; j++) {
    const cx = (xs[j] + xs[j + 1]) / 2, cz = (zs[i] + zs[i + 1]) / 2;
    if (holes.some((h) => cx > h[0] && cx < h[1] && cz > h[2] && cz < h[3])) continue;
    L.half.push(B(xs[j], xs[j + 1], -1.2, 0, zs[i], zs[i + 1]));
  }
};
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
  // [fix2] review 2: the clean box was clean only inside the old 3.0 / 3.8 m windows. #16's kid jumps karpbox's 3 m channel
  // (x 14…17) with its rim nodes 4 m apart (the field's gaps stop at 3.0 m node to node), gaining up to 14 m round by the
  // pier, and off weir B's deck (the two-weir data's, unused here) gains 15.9 m on a field that reads its north ramp 12 m
  // long. Weir B's deck is taken out; karpbox itself (the rules tests' stage) is unchanged.
  // [fix3] review 3: the channel is closed by a 2.6 m rail on its west edge from the alley's wall to the pier (z 20.4…36:
  // beyond a kid's 1.8 m and a carrier's swim-jump, ~2.0 m), and the pier is widened into a bridge over the channel's
  // north end (z 36…44), so nothing pinches the SE opening's mouth: fix round 2's second rail stretch (z 38…44, 2 m) stood
  // in it and left the ring's SE way in under nav's 0.92 m, so the clean box FAILed #5 and x7h lost its field
  L.half = L.half.filter((d) => !isBox(d, [7, 2.3, 26], [11, 2.5, 30]) && !(d.kind === 'ramp' && (same(d.high, [9, 2.5, 26]) || same(d.high, [9, 2.5, 30]))) && !isBox(d, [14, -1.2, 36], [17, 0, 38]));
  add.push(B(13.7, 14, 0, 2.6, 20.4, 36, { paint: false, roof: true, color: '#8a7f70', tag: 'kcheck-channelrail' }), B(14, 17, -1.2, 0, 36, 44, { color: '#b89a74', pattern: 2, tag: 'kcheck-bridge' }));
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
// pattern the target check's text must match, so the case fails for the fault it plants and not a knock-on of it;
// notFail: checks that must NOT fail (a case that proves a false FAIL gone: then `check` is null); phys / carry: the
// case needs #16's kid / the carry walk
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
  // [fix1] review 1: the faults its reviewer planted that passed (or failed by accident), and one case per sub-rule of a
  // check that had none
  // — #7a / #7d: moves across air no edge holds (rising gaps; jumps onto ground off the field)
  { id: 'x7r', check: 7, expect: '\\(a\\) team \\d: an entrance at .*\\[(rising gap|jump onto off-field ground)\\] not seen from the spawn deck', phys: true,
    what: 'H2p: f7\'s ledge replaced by a 2.0 m moat and a 1.0 m landing just inside the ring (off the field), behind f7\'s screen: a running jump 1 m up across the moat',
    layout: (L) => { floorWithout(L, [-17, -15, 45.6, 50.4]); reRing(L, [[149, 175], [185, 204.5], [215.5, 324.5], [335.5, 391]]);
      L.half.push(B(-15.0, -13.0, 0, 1.0, 46.6, 49.4, { ...NOINK, tag: 'kcheck-landing' }), B(-12.5, -12, 0, 3.6, 44, 56, { paint: false, roof: true, color: '#a9a090', tag: 'kcheck-screen' })); } },
  { id: 'x7rb', check: 7, expect: '\\(a\\) team \\d: an entrance at .*\\[(rising gap|jump onto off-field ground)\\] not seen from the spawn deck', phys: true,
    what: 'H2bp: the same with a 1.3 m moat and a 1.5 m landing (a hop over a gap onto ground off the field)',
    layout: (L) => { floorWithout(L, [-16.3, -15, 45.6, 50.4]); reRing(L, [[149, 175], [185, 204.5], [215.5, 324.5], [335.5, 391]]);
      L.half.push(B(-15.0, -13.0, 0, 1.5, 46.6, 49.4, { ...NOINK, tag: 'kcheck-landing' }), B(-12.5, -12, 0, 3.6, 44, 56, { paint: false, roof: true, color: '#a9a090', tag: 'kcheck-screen' })); } },
  { id: 'x7rq', check: 7, expect: '\\(a\\) team \\d: an entrance at .*\\[rising gap\\] not seen from the spawn deck', phys: true,
    what: 'H2q: the 2.0 m moat and 1.0 m landing on the field (a ramp down from it into the ring), screened north of it: a rising gap into the ring',
    layout: (L) => { floorWithout(L, [-17, -15, 45.6, 50.4]); reRing(L, [[149, 175], [185, 204.5], [215.5, 324.5], [335.5, 391]]);
      L.half.push(B(-15.0, -13.0, 0, 1.0, 46.6, 49.4, { ...NOINK, tag: 'kcheck-landing' }), RP([-9.4, 0, 48], [-13, 1.0, 48], 2.8, { ...NOINK, tag: 'kcheck-ramp' }), B(-15.2, -5, 0, 3.6, 50.0, 50.5, { paint: false, roof: true, color: '#a9a090', tag: 'kcheck-screen' })); } },
  // — #7a: the entrance count
  { id: 'x7a', check: 7, expect: '\\(a\\) team \\d: (?:[6-9]|\\d{2}) entrances into its Gate\'s 15 m ring \\(2–5\\)', what: 'two more openings in the ring wall on the deck side (west): six entrances',
    layout: (L) => { reRing(L, [[149, 160], [168, 186], [194, 204.5], [215.5, 324.5], [335.5, 391]]); } },
  // — #7c: a drop into the ring
  { id: 'x7c', check: 7, expect: '\\(c\\) \\d+ drop\\(s\\) > 2\\.5 m into a Gate\'s ring', what: 'a 3 m deck outside a west opening in the ring wall, up a ramp: its edge drops 3 m into the ring',
    layout: (L) => { reRing(L, [[149, 175], [185, 204.5], [215.5, 324.5], [335.5, 391]]); L.half.push(B(-20, -15.4, 0, 3.0, 46.6, 49.4, { ...NOINK, tag: 'kcheck-dropdeck' }), RP([-18.5, 0, 38], [-18.5, 3.0, 46.6], 2.4, { ...NOINK, tag: 'kcheck-ramp' })); } },
  // — #7d's other probes (each find > 10 m of field)
  { id: 'x7t', check: 7, expect: '\\(d\\) \\d+ connection\\(s\\) the graph lacks gaining > 10 m: .*tallWall', what: 'a 5.8 m inkable platform up a long ramp: its far wall a squid climbs (nav stops at 5.5 m)',
    layout: (L) => { L.half.push(B(-20, -16, 0, 5.8, 38, 44, { color: '#cfc7b6', tag: 'kcheck-tower' }), RP([-18, 0, 26.5], [-18, 5.8, 38], 4, { ...NOINK, tag: 'kcheck-ramp' })); } },
  { id: 'x7l', check: 7, expect: '\\(d\\) \\d+ connection\\(s\\) the graph lacks gaining > 10 m: .*longDrop', what: 'a 4 m platform up a long ramp: its far edge drops 4 m (nav stops at 3.4)',
    layout: (L) => { L.half.push(B(-20, -16, 0, 4.0, 38, 44, { ...NOINK, tag: 'kcheck-tower' }), RP([-18, 0, 28.5], [-18, 4.0, 38], 4, { ...NOINK, tag: 'kcheck-ramp' })); } },
  { id: 'x7h', check: 7, expect: '\\(d\\) \\d+ connection\\(s\\) the graph lacks gaining > 10 m: .*highHop', phys: true,
    what: 'a 1.83 m ledge (no ink) in a west opening of the ring wall, a ramp down from it into the ring, the SW opening closed: a kid hops onto it from outside (just beyond the hop rule) instead of walking round to the SE opening',
    layout: (L) => { reRing(L, [[149, 175], [185, 324.5], [335.5, 391]]); L.half.push(B(-17.0, -14.0, 0, 1.83, 46.6, 49.4, { ...NOINK, tag: 'kcheck-ledge' }), RP([-9.4, 0, 48], [-14, 1.83, 48], 2.8, { ...NOINK, tag: 'kcheck-ramp' })); } },
  { id: 'x7g', check: 7, expect: '\\(d\\) \\d+ connection\\(s\\) the graph lacks gaining > 10 m: .*longGap', phys: true, what: 'the GAP\'s far platform moved 1 m on and 0.5 m down: 3.6 m of air (just beyond the gap rule), the long way round 14 m more',
    layout: (L) => { L.half = L.half.filter((d) => !isBox(d, [24.2, -1.2, 12], [26.2, 1, 16]) && !isBox(d, [24.2, -1.2, 16], [26.2, 0.5, 19])); L.half.push(B(24.2, 26.2, -1.2, 0.5, 17, 19, { ...NOINK, tag: 'kcheck-gap2' })); } },
  // — #3: weir → Gate
  { id: 'x3', check: 3, expect: 'weir 1 → Gate [\\d.]+ m \\(≥ 25 m', what: 'the weir past its platform, 13 m from the ring', def: (d) => { d.weirs = [{ at: [0, 0, 36.5], yaw: 0 }]; } },
  // — #5: route 2 too long
  { id: 'x5b', check: 5, expect: 'Pond → weir 1: route 2 [\\d.]+ m = [\\d.]+ × route 1 \\(≤ 1\\.6\\)', what: 'a wall across the deck at z 15 with a 3 m gap on route 1: route 2 goes round by the flank lane',
    layout: (L) => { L.half.push(B(-14, -1.5, 0, 3, 15, 15.4, { paint: false, roof: true, color: '#a99', tag: 'kcheck-barrier' }), B(1.5, 14, 0, 3, 15, 15.4, { paint: false, roof: true, color: '#a99', tag: 'kcheck-barrier' })); } },
  // — #9: what a zone may not touch; a wide entrance
  { id: 'x9d', check: 9, expect: 'zone \\d+ touches .*weir', what: 'a free zone over the weir\'s platform', def: (d) => { d.freeZones.push({ poly: [[-3, 26.5], [3, 26.5], [3, 29.5], [-3, 29.5]], y0: 0.9, y1: 1.5, signs: [[-3.4, 26.4, 180], [3.4, 26.4, 180], [-3.4, 29.6, 0], [3.4, 29.6, 0]] }); } },
  { id: 'x9e', check: 9, expect: 'touches \\d+ route 1 / route 2 node', what: 'a free zone on the floor across the Pond → weir routes', def: (d) => { d.freeZones.push({ poly: [[-4, 10], [4, 10], [4, 13], [-4, 13]], y0: -0.3, y1: 0.3, signs: [[-4.4, 9.6, 180], [4.4, 9.6, 180], [-4.4, 13.4, 0], [4.4, 13.4, 0]] }); } },
  { id: 'x9f', check: 9, expect: 'a [\\d.]+ m entrance at .* needs a sign within 2 m of each end', what: 'an open-floor zone (6 × 8 m) signed at one corner only: one wide entrance, an end unsigned',
    def: (d) => { d.freeZones.push({ poly: [[-13, 11], [-7, 11], [-7, 19], [-13, 19]], y0: -0.3, y1: 0.3, signs: [[-13.4, 10.6, 180]] }); } },
  { id: 'x9g', check: 9, expect: 'touches .*Gate', what: 'a free zone over the Gate', def: (d) => { d.freeZones.push({ poly: [[-2.5, 46], [2.5, 46], [2.5, 50], [-2.5, 50]], y0: -0.3, y1: 0.3, signs: [[-2.9, 45.6, 180], [2.9, 45.6, 180], [-2.9, 50.4, 0], [2.9, 50.4, 0]] }); } },
  // — #13: ways off the deck
  { id: 'x13', check: 13, expect: 'spawn deck: [0-2] way\\(s\\) off \\(≥ 3\\)', what: 'two of the parapet\'s three openings closed',
    layout: (L) => { L.half.push(B(-7, -5, 2.4, 3.4, 56, 56.3, { paint: false, roof: true, color: '#c4bba9', tag: 'kcheck-parapet' }), B(-1, 1, 2.4, 3.4, 56, 56.3, { paint: false, roof: true, color: '#c4bba9', tag: 'kcheck-parapet' })); } },
  // — #14: floor round the Pond
  { id: 'x14', check: 14, expect: '^ring 4\\.5–10 m (?:[0-9]|[1-6][0-9])(?:\\.\\d)? % floor', what: 'the floor east of the Pond cut away (open water x 3…14, z 0…10; mirrored)', layout: (L) => { floorWithout(L, [3, 14, 0, 10]); } },
  // — #15: exact room (a thin post), an approach that can't see the weir
  { id: 'x15t', check: 15, expect: 'solid within 3 m: kcheck-lamp', what: 'T1: a 0.2 m lamp post 2.2 m from the weir\'s centre, on its platform', layout: (L) => { L.half.push(B(1.9, 2.1, 1.2, 4.2, 28.9, 29.1, { paint: false, roof: true, color: '#6f6a63', tag: 'kcheck-lamp' })); } },
  { id: 'x15a', check: 15, expect: 'not seen from the (?:attackers\'|defenders\') approach', what: 'the weir in the alley behind a chicane of two baffles: 8 m back along route 1 the baffle hides it',
    layout: (L) => { L.half.push(B(6, 11.6, 0, 3, 9, 9.3, { paint: false, roof: true, color: '#a99', tag: 'kcheck-baffle' }), B(8.1, 13.7, 0, 3, 12, 12.3, { paint: false, roof: true, color: '#a99', tag: 'kcheck-baffle' })); }, def: (d) => { d.weirs = [{ at: [9.85, 0, 16.8], yaw: 0 }]; } },
  // — #1: a kit post off its ledge
  { id: 'x1', check: 1, expect: 'kit piece\\(s\\) not resting on floor: karp-weir-base', what: 'W5: the weir 2 m off its platform\'s centre line: its east post stands past the platform\'s edge', def: (d) => { d.weirs = [{ at: [2, 1.2, 28], yaw: 0 }]; } },
  // — #11: a carry that sticks; the retreat flag
  { id: 'x11', check: 11, expect: 'stuck episode\\(s\\)|the carry picked', carry: true, what: 'f16w\'s fence with its 0.5 m slot on route 1: the scripted carrier sticks at it',
    layout: (L) => { L.half.push(B(-4, 0.25, 0, 2.5, 13.96, 14.04, { paint: false, roof: true, color: '#8a7f70', tag: 'kcheck-fence' }), B(0.75, 4, 0, 2.5, 13.96, 14.04, { paint: false, roof: true, color: '#8a7f70', tag: 'kcheck-fence' })); } },
  { id: 'x11r', check: 11, expect: 'team \\d: retreat ×3 on at null m', carry: true, what: 'a noRetreat polygon over each whole half: the retreat walk\'s ×3 never comes on',
    def: (d) => { d.noRetreat = [{ poly: [[-20, 0.5], [20, 0.5], [20, 66], [-20, 66]], y0: -2, y1: 5 }]; } },
  // — #4 / #9 must NOT fail: an inkable 1.5 m step a kid hops is no climb
  { id: 'w4', check: null, notFail: [4, 9], phys: true, expect16: 'climbs of ≤ 1\\.8 m tried as hops: [1-9]\\d* of', what: 'W4: the weir\'s platform a 1.5 m inkable box, its ramps gone (nav gives it climb edges; a kid hops it)',
    layout: (L) => { L.half = L.half.filter((d) => !isBox(d, [-4, 0, 26], [4, 1.2, 30]) && !(d.kind === 'ramp' && (same(d.high, [0, 1.2, 26]) || same(d.high, [0, 1.2, 30])))); L.half.push(B(-4, 4, 0, 1.5, 26, 30, { tag: 'kcheck-box' })); }, def: (d) => { d.weirs = [{ at: [0, 1.5, 28], yaw: 0 }]; } },
  // [fix2] review 2: the faults its reviewer planted that passed every check, and the windows' calibration
  // — #7 (issue 1): f7's ledge with its faces off the 1 m grid. nav keeps a floor node ≥ 0.46 m from a face, so where a
  // face falls just past a cell centre the floor node and the top node stand two cells apart (or diagonal): the hop
  // onto the off-field top must still be seen. x0 −17.0 is f7 itself; −17.4 is the reviewer's P1a; and a 45°-turned one
  ...[-17.2, -17.4, -17.6, -17.8].map((x0) => ({ id: `x7m${String(Math.round(-x0 * 10) % 10)}`, check: 7, expect: '\\(a\\) team \\d: an entrance at .*\\[hop over off-field ground\\] not seen from the spawn deck', phys: true,
    what: `f7's ledge from x ${x0}: ${x0 > -17.46 ? `the cell centre at x −17.5 is ${(Math.round((x0 + 17.5) * 100) / 100).toFixed(1)} m from its west face (< 0.46: no node), so the floor node and the top node beside it stand two cells apart` : 'its west face clear of the cell centres (the floor node and the top node one cell apart: the aligned control)'}`,
    layout: (L) => { reRing(L, [[149, 175], [185, 204.5], [215.5, 324.5], [335.5, 391]]); L.half.push(B(x0, -14.0, 0, 1.5, 46.6, 49.4, { ...NOINK, tag: 'kcheck-ledge' }), B(-12.5, -12, 0, 3.6, 44, 56, { paint: false, roof: true, color: '#a9a090', tag: 'kcheck-screen' })); } })),
  { id: 'x7m45', check: 7, expect: '\\(a\\) team \\d: an entrance at .*\\[hop over off-field ground\\] not seen from the spawn deck', phys: true,
    what: 'f7\'s ledge turned 45° (a 3.6 m square, 1.5 m, no ink, its diamond filling the ring wall\'s west opening): every floor node and top node beside a face are diagonal, none orthogonal',
    layout: (L) => { reRing(L, [[149, 175], [185, 204.5], [215.5, 324.5], [335.5, 391]]); L.half.push({ kind: 'obox', center: [-15.5, 0.75, 48], size: [3.6, 1.5, 3.6], rotY: 45, ...NOINK, pattern: 3, tag: 'kcheck-ledge' }, B(-12.5, -12, 0, 3.6, 44, 56, { paint: false, roof: true, color: '#a9a090', tag: 'kcheck-screen' })); } },
  // — #7 (issue 2): P2, a rising gap longer than the old 3.0 m window — a 2.6 m moat in front of a 0.8 m landing inside the
  // ring (on the field: a ramp down from it to the Gate), screened; the nodes 4.0 m apart
  { id: 'x7p2', check: 7, expect: '\\(a\\) team \\d: an entrance at .*\\[rising gap\\] not seen from the spawn deck', phys: true,
    what: 'P2: a 2.6 m moat in front of a 0.8 m landing inside the ring (a ramp down to the Gate), screened: a running jump 0.8 m up, nodes 4.0 m apart',
    layout: (L) => { floorWithout(L, [-17, -14.4, 45.6, 50.4]); reRing(L, [[149, 175], [185, 204.5], [215.5, 324.5], [335.5, 391]]);
      L.half.push(B(-14.4, -12.4, 0, 0.8, 46.6, 49.4, { ...NOINK, tag: 'kcheck-landing' }), RP([-8.4, 0, 48], [-12.4, 0.8, 48], 2.8, { ...NOINK, tag: 'kcheck-ramp' }), B(-14.6, -5, 0, 3.6, 50.0, 50.5, { paint: false, roof: true, color: '#a9a090', tag: 'kcheck-screen' })); } },
  // — #7 (issue 3): P4, a squid climb over 5.5 m onto ground off the field, then a 6 m drop into the ring behind a screen
  // ([fix3] review 3: its real reasons — the 6 m drop off the tower's top into the ring (#7c) and the squid climb up its
  // face (#7d tallWall, 10.1 m). It is no #7a entrance of its own: climbing 6 m and walking over the top to the drop
  // (~7.6 m) saves under 3 m on the field's way in by the SW opening, so D33 reads it as another way to that entrance)
  { id: 'x7p4', check: 7, expect: '\\(c\\) \\d+ drop\\(s\\) > 2\\.5 m into a Gate\'s ring: .*\\(drop off off-field ground \\(a squid climb up\\)\\).*\\(d\\) \\d+ connection\\(s\\) the graph lacks gaining > 10 m: .*tallWall',
    what: 'P4: a 6 m inkable tower through the ring wall (its top off the field: nav climbs stop at 5.5 m), a screen inside: squid up its face, over the wall, drop 6 m into the ring',
    layout: (L) => { L.half.push(B(-19.5, -13.5, 0, 6.0, 44.0, 46.6, { color: '#cfc7b6', tag: 'kcheck-tower' }), B(-11.5, -11, 0, 3.6, 43.5, 56, { paint: false, roof: true, color: '#a9a090', tag: 'kcheck-screen' })); } },
  // — #15 / #1 (issue 4): Wc, the weir on the mover's track (its second stop moved to (18.5, 26)): the parked car stands
  // over the weir's centre and drives through a post
  { id: 'x15m', check: 15, expect: 'a mover sweeps within 3 m: kcar', also: [[1, 'in a mover\'s path']], what: 'Wc: the weir on the east strip where the car parks (its stop moved to (18.5, 26))',
    layout: (L) => { L.movers.cars[0].stops = [[18.5, 10], [18.5, 26]]; }, def: (d) => { d.weirs = [{ at: [18.5, 0, 26], yaw: 90 }]; } },
  // — #9 (issue 5): a noRetreat strip across a free zone on flat floor, no vertex of either inside the other (each 3.8 m
  // or more from the other's vertices: the old vertex-only distance read 3.8 m, over the 3 m limit)
  { id: 'x9n', check: 9, expect: 'a noRetreat polygon within 3 m of team \\d\'s zone', what: 'a 0.4 m noRetreat strip (x −10.2…−9.8, z 4…26) across an open-floor free zone (x −14…−6, z 11…19)',
    def: (d) => { d.freeZones.push({ poly: [[-14, 11], [-6, 11], [-6, 19], [-14, 19]], y0: -0.3, y1: 0.3, signs: [[-14.4, 10.6, 180], [-5.6, 10.6, 180], [-14.4, 19.4, 0], [-5.6, 19.4, 0]] }); d.noRetreat = [{ poly: [[-10.2, 4], [-9.8, 4], [-9.8, 26], [-10.2, 26]], y0: -0.5, y1: 1.0 }]; } },
  // — the windows' calibration (issue 2): platform pairs over the open sea, the kid's real reach against the probes' windows
  { id: 'reach', check: null, reach: true, what: 'REACH: platform pairs over the sea, each a near rim a cell short of its rim node and a far platform `air` m on and `dy` up or down: every pair #16\'s kid makes lies inside the probes\' window at its rise, and each window\'s outer edge lies beyond the last made gap with both rim nodes a cell back',
    layout: (L) => { L.single.push(...reachPieces()); } },
];

// [fix2] the REACH rows: (dy, air) pairs, air the open gap rim to rim along the line, dy the far top's rise over the near
// one. Each row is a near platform (top ≥ 0.6 m) whose rim stands 0.05 m short of the next cell centre — its rim node a
// cell (0.95 m) back from the edge — and a far platform 2.4 m long, both 2 m wide, over the open sea east and west of the
// box (single pieces: the slots avoid every piece of the box and its mirror)
export const REACH_ROWS = [
  [2.0, [0.2, 0.5]], [1.9, [0.3, 1.0, 1.7, 2.4]], [1.8, [0.3, 0.9, 1.5, 2.1, 2.7]], [1.5, [1.4, 2.2, 2.6, 3.0, 3.4]], [1.2, [2.2, 2.6, 3.0, 3.4, 3.8]],
  [0.9, [2.4, 2.8, 3.2, 3.6, 4.0]], [0.6, [2.8, 3.2, 3.6, 4.0, 4.4]], [0, [3.2, 3.6, 4.0, 4.4, 4.8]], [-0.6, [3.6, 4.0, 4.4, 4.8, 5.2]],
  [-1.2, [3.8, 4.2, 4.6, 5.0, 5.4]], [-2.2, [4.2, 4.6, 5.0, 5.4, 5.8]], [-3.4, [4.6, 5.0, 5.4, 5.8, 6.2]],
].flatMap(([dy, airs]) => airs.map((air) => ({ dy, air })));
// the slots: [side (+1 east, −1 west), z0] — 2 m wide rows 3 m apart where the box (and its mirror) has nothing at x ±20…30
const REACH_SLOTS = [
  ...Array.from({ length: 21 }, (_, k) => [1, -55 + 3 * k]),      // east, Alpha's half (the main floor's mirror ends at x 20) on to z 7
  ...Array.from({ length: 11 }, (_, k) => [1, 24 + 3 * k]),       // east, Bravo's half past the mover and the GAP
  ...Array.from({ length: 9 }, (_, k) => [-1, 30 + 3 * k]),       // west, Bravo's half past the flank lane
  [-1, 0], [-1, 3],
  ...Array.from({ length: 11 }, (_, k) => [-1, -55 + 3 * k]),     // west, Alpha's half short of the GAP's mirror
  [-1, -6], [-1, -3],
];
export function reachRows() {
  return REACH_ROWS.map((r, k) => {
    const [side, z0] = REACH_SLOTS[k], yN = Math.max(0.6, 0.6 - r.dy), yF = yN + r.dy;
    const edge = side * 21.45, far = edge + side * r.air;   // (the near rim 0.05 m short of the cell centre at ±21.5)
    return { ...r, side, z0, yN, yF, edge, far, near: [side * 20.5, yN, z0 + 0.5], farAt: [far + side * 0.5, yF, z0 + 0.5] };
  });
}
function reachPieces() {
  const out = [];
  for (const r of reachRows()) {
    const nx = [r.edge - r.side * 4.0, r.edge].sort((a, b) => a - b), fx = [r.far, r.far + r.side * Math.min(2.4, 29.95 - Math.abs(r.far))].sort((a, b) => a - b);
    out.push(B(nx[0], nx[1], -1.2, r.yN, r.z0, r.z0 + 2, { ...NOINK, tag: 'kcheck-reach' }), B(fx[0], fx[1], -1.2, r.yF, r.z0, r.z0 + 2, { ...NOINK, tag: 'kcheck-reach' }));
  }
  return out;
}

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
