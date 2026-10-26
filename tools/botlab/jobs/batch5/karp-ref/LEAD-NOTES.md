# Bazookarp reference layouts (WP4b) — the lead's notes and rulings (2026-10-26)

Codex built this work package until its credits ran out (last commit c4f422d7, 00:10; uncommitted edits left in
src/game/karpField.js, src/world/bazookarp-data.js, src/world/maps.js, src/world/stages/lockgate/layout.js and props.js).
An Opus builder takes over from here. The brief is CODEX-BRIEF.md; the rules below were given to Codex by message and are
binding (DECISIONS.md #34 and its addendum hold the core; this file holds the rest).

## State when Codex stopped
- **Lockgate passes:** `RESULT lockgate ok L=55.86/55.73 weir=49 gate=13.1 routes=2/2 zones=2 hops=62+3893 walks=8/8+8/8
  swim=fail 7d=0/0/0`, all 16 checks, #9 WARN only; bake lockgate.bazookarp fresh (hash 11544930). Its Pond sits on the lower
  towpath deck (the bridge crest is nav-disconnected from both spawns; the Pond may be nudged off the exact centre to the
  nearest valid floor — keep that bounded and symmetric). Open: what "swim=fail" means in the RESULT line and what #9's WARN
  is — the report must say.
- **Halyard, in progress:** `carrierField.gapClasses` implemented in the shared field builder and the checker (bounded
  selectors, mirrored unless oneWay, perNode cap, class tags, #16 proof, per-class generated / kept / vetoed, the > 50 % veto
  guard, cumulative L before / after); `gate.entrances` declarations with checker comparison; the 1.5× graph-reach clause in
  #7; docs / BUILDER.md updated by Codex (verify). Classes so far: north risers (24 / 12 / 12, longest 3.24 m), south
  transfer (6 / 6 / 0), swim (4 / 3 / 1), Long Pier mid-edge hop (16 / 8 / 8, longest 7.17 m) after the ramp's nav ends were
  extended; L unchanged at 55.43 / 55.30 throughout. #16: 748 impossible edges vetoed, then 45 more; all 4,633 added edges
  proven. Remaining when it stopped: ~109 #7d rows by class; #16 "4 Gate entrances not walkable" (see the free-zone rule
  below); 7a counts 7 physical entrances against the declared 5; #12 needs a fresh Halyard bake; then the matches, PHYS and
  CARRY, pictures, report.

## Rulings (binding)
1. **Nodes absolute, edges by class** (DECISIONS #34): every standable floor a carrier can reach is a graph node or an
   off-limits top that never holds a kid; unmodelled physical moves are grouped by origin area → destination area and each
   class is (a) MODELLED (≤ 20 m), (b) BLOCKED physically in the bazookarp variant only — never Halyard's base layout — or
   (c) TOLERATED if ≤ 20 m and it shortens the shortest spawn → Pond / Pond → Gate route by ≤ 10 % of the modelled L.
2. **Model by class, not by edge:** one parametrised `gapClasses` rule per class
   (`{ name, kind: 'hop'|'swimJump'|'gangway', from{x,z,y}, to{x,z,y}, maxLen ≤ 20, oneWay?, perNode = 2 }`), #16 the proof;
   a class losing more than half its candidates to #16 has the wrong bounds — tighten, don't keep it sparse.
3. **L is protected:** measure the shortest spawn → Pond and Pond → Gate before and after each class; if modelling shortens
   either by more than 10 % of the current L (55.43 / 55.30), STOP and report the numbers — the lead decides.
4. **The 1.5× reach clause:** a #7d candidate whose endpoints the graph already joins by a path ≤ 1.5× the straight-line
   distance is not a missing connection. Where the ramp exists in the world but its nav join detours (the Long Pier), fix the
   model to match the world (ramp endpoints / landings), then class any remaining short hop up the pier edge.
5. **A single modelled move is never longer than 20 m.** A legitimate crossing over 20 m is split into ≤ 20 m legs through a
   visible intermediate landing that exists in the bazookarp variant (pontoon, buoy ledge, step), or blocked. The 13 spawn
   north-edge rise / swim candidates (20.4–24.4 m): separate swimJump and hop classes; split only if both L values stay
   within 10 %, else block — Codex chose to block the direct crossing.
6. **The west-side cluster is accidental:** the two vaults (28.7 / 32.1 m) and the six off-field roof hops (37.7–39.2 m) are
   blocked — roofs by the map standard first (an unreachable roof is non-inkable and slides a kid off), a visible
   Bazookarp-only barrier (rail, chain, crates — never an invisible wall) only for the vaults or where the roof rule does not
   apply; each barrier pictured in the report; check-maps for halyard.bazookarp must still pass.
7. **Gate ring entrances are declared by the layout** (Halyard: five, as accepted); the checker compares physical entrances
   against the declaration; an undeclared physical entrance is declared and its move modelled (a swim-jump entry is
   legitimate, SPEC S21) or blocked — say which per entrance.
8. **The entrance walk starts at the Carp-Free Zone's boundary:** a carrier cannot be inside the zone by design, so an
   entrance walk that starts inside it resolves to the nearest carrier node just outside the boundary and is measured from
   there (the checker adapts; neither the zone nor the geometry changes). Document beside #16 in BUILDER.md.
9. #16's physically rejected edges are vetoed (hopVeto) and #7 re-run after; graph edges the physics cannot make never stay.

## Done means
Both reference layouts pass tools/botlab/karp-check-page.js — all 16 checks, PHYS and CARRY modes, `MAP=all` summary — with
the class table (per class: outcome, generated / kept / vetoed, longest kept, L before / after) and the entrance table in the
report; a fresh bake for each (`tools/botlab/run.sh tools/botlab/bake.cjs <stage>`); two bot Bazookarp matches per stage
(tools/botlab/karp-match.cjs) with no bot stuck over 5 s; pictures (JPEG < 300 KB) of the Gate ring, the gangway, each
barrier and the Pond, committed under tools/botlab/jobs/batch5/karp-ref/out/; LEAD-REPORT.md in COMMON.md's format; the
rules of this file and DECISIONS #34 recorded in tools/botlab/karp-stages/BUILDER.md for the 14 per-stage layouts to come.
