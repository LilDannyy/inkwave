# Bazookarp carrier field

Each stage's `BAZOOKARP_DEFS.<stage>.carrierField` describes carrier-specific moves that the navigation grid cannot
infer. Keep rules grouped by route class so the graph and bot can reason about the same movement.

`gapClasses` accepts bounded, mirrored rules:

```js
{
  name: 'north pier gangway',
  kind: 'gangway', // 'hop' | 'swimJump' | 'gangway'
  from: { x: [-12, -8], z: [20, 24], y: [0, 1.3] },
  to:   { x: [-12, -8], z: [16, 20], y: [0.5, 2.4] },
  maxLen: 8,
  perNode: 2,       // optional; shortest two targets per source by default
  oneWay: false,    // optional; omit reverse travel for a one-way drop
}
```

The builder considers nodes inside each endpoint box, keeps each source's `perNode` shortest candidates up to
`maxLen` (which cannot exceed 20 m), and mirrors the rule across the stage unless `oneWay` is true. `hop` is a running
jump and keeps the SPEC #7d bar. A documented `swimJump` or `gangway` is a modeled route and uses the 20 m bar.
`hopVeto` entries remove individual directions that the #16 physical proof cannot make. Tighten a class if more than
half its generated candidates are vetoed. The checker reports class counts, longest kept edge and modeled route
lengths before and after adding the class.

Carrier graph coverage is absolute: every standable floor node is represented unless it is an off-limits top that can
never hold the carrier (DECISIONS #32). For other #7d findings, group by origin and destination area: model intended
routes, block accidental moves with Bazookarp-only physical geometry, or tolerate only an unmodeled shortcut ≤20 m
that shortens neither spawn → Pond nor Pond → Gate by more than 10% of modeled L. Anything longer than 20 m must be
modeled or blocked. Declare a Gate's intended entrance count as `gate.entrances`; the physical ring crossings must
match that count and each must be visible or modeled under SPEC S21.

`tolerate` holds the classes a layout leaves unmodelled on purpose (DECISIONS #34 (c)), in the same box shape
(`{ name, from, to, maxLen <= 20, oneWay? }`, mirrored). The field ignores them; `bazookarp-check` weighs them: the
class's #7d moves go into the graph as extra one-way edges, cumulatively after the modelled classes, and the shortest
spawn -> Pond and Pond -> Gate are measured for both teams (`KarpField.routeLengths` / `classLengths`, computed on
demand, never at match start). Within 10 % of L the class is tolerated and listed; past it the check fails. A prop
placement can make its colliders off-limits tops in one mode (`roofCols: true` on a mode-only copy) — the map
standard's way to close a top a carrier should not reach (`tools/botlab/jobs/batch5/karp-stages/BUILDER.md`).
