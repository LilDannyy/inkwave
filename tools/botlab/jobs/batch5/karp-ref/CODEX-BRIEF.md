# karp-ref: the two Bazookarp reference layouts (a brief for Codex from the batch lead, 2026-10-25)

You are building Bazookarp WP4b for INKWAVE: **Halyard Marina** and **Lockgate** get real Bazookarp layouts, good enough
to be the template every other stage builder copies. Worktree `/Users/danielosling/Desktop/1/st-b5-karp-ref` (branch
`b5-karp-ref`, from `new-stages` 8082e99a: the public beta with the Bazookarp engine, face, bots and checker all in).
Work only here. Read `tools/botlab/jobs/batch5/COMMON.md` first (how to run Electron tests under the shared lock, the git
identity, what never to touch), then in this order:
- `tools/botlab/jobs/batch5/REQUEST.md` ("New mode: bazookarp" and the research summary after it: the user's rules);
- `tools/botlab/jobs/batch5/DECISIONS.md` (#1–18 and #32–33: binding answers);
- `tools/botlab/jobs/batch5/bazookarp/SPEC.md` §4 (the layout data, mode-only pieces, placement rules, the checker), §9
  (the per-stage brief: §9.1 what every layout must satisfy, §9.2 what you deliver, §9.3 the notes for halyard and
  lockgate), §11 WP4b;
- `tools/botlab/jobs/batch5/karp-stages/BUILDER.md` (the checker's own template for a layout builder) and the checker's
  report `tools/botlab/jobs/batch5/karp-checker/LEAD-REPORT.md` (how `bazookarp-check.cjs` judges, its usage, the
  all-stages table: halyard's and lockgate's first-cut data fail it today, as expected);
- `tools/botlab/jobs/batch5/stages/STAGE-RULES.md` ("The user's standing rules for stages": mid matters most, cover every
  6–10 m, kid reach 1.8 m, off-limits tops, mode-only variants via `onlyIn` / `notIn`, the Long Stages standard);
- `tools/botlab/jobs/stretch/BRIEF.md` and its halyard / lockgate Bazookarp notes;
- the two stages: `src/world/stages/halyard/` and `src/world/stages/lockgate/` (their existing tower and zone variants
  show how a mode-only piece is written), `src/world/bazookarp-data.js` (the first-cut entries you retire into each
  stage's own layout), `src/world/variants.js`, `tools/botlab/bazookarp-check.cjs`, `tools/botlab/karp-match.cjs`,
  `tools/botlab/karp-agg.py`.

## What you build
For each stage: `LAYOUT.bazookarp` data in the stage's own layout (the Pond at the exact centre; weirs at 40–55 % of the
way from the Pond to the Gate, "closer to the middle"; Pond → Gate 55–85 m walking; ≥ 2 routes to each weir and to the
Gate with the second ≤ 1.6× the first; 2–5 attacker entrances into the Gate's 15 m ring and no hidden one; no
unreachable high ground over the route; the Gate in front of the spawn or a level below it, 12–20 m from the pad; the
free zone on the spawn deck, signed; sane drop spots; the carrier field reading), and the Bazookarp-only pieces that
make it so (`onlyIn: 'bazookarp'` / `notIn: 'bazookarp'`): big redesigns are allowed ("feel free to do vast stage
redesigns to make all stages playable"), in the stage's own style and dressing, never bare boxes; the other modes'
builds byte-identical (check-maps and the thumbnails). Mid must stay a fight. Then play it: 3–4 `karp-match.cjs` runs
per stage at normal through `karp-agg.py` (first pop, knockouts, time to each weir, fallbacks, stuck): the §9.1
targets are judged in the lead's balance pass, but a layout where bots never reach a weir or the Gate is not done.
Bake the `.bazookarp` lightmap variants at the end (`tools/botlab/run.sh tools/botlab/bake.cjs <stage>`; `stage-audit`
says "lightmap applied"). Pictures (JPEG < 300 KB, committed) in `tools/botlab/jobs/batch5/karp-ref/out/`: the
checker's top-down per stage, the Pond, each weir from the attackers' side, the Gate from the street and from the deck,
the free-zone signs, a carrier's view down the main route, the minimap.

## Proof
`bazookarp-check.cjs` RESULT ok on both stages (every check; #16's physical walks included); check-maps on both and
every variant; spawn-mid, cover-map, climb-audit unchanged for the other modes and run on the bazookarp variant too;
tower-check unchanged; the match numbers; stage-audit on the baked variants; `bazookarp-rules`, `karp-bots`, `int3`
still passing. Report in COMMON.md's format to `tools/botlab/jobs/batch5/karp-ref/LEAD-REPORT.md`: the layout per stage
with every number, the pieces added or changed and why, the match table, pictures, what the per-stage builders should
copy, what is unfinished. An independent reviewer judges it against SPEC §9 and the user's stage rules; expect to be
asked to redo things.

## Rules
Electron only through `tools/botlab/run.sh` with `BOTLAB_OUT=/Users/danielosling/Desktop/1/inkwave-upstream/.botlab
SLOTS=3` (another builder shares this Mac today: queue patiently; `WATCHDOG=900000`). Never `npm start`; never touch
`/Users/danielosling/Desktop/1/inkwave` or any `dist/`; never kill a process you did not start; never the deployed relay
or the live tunnel; no audio files; nothing under `.botlab/` committed. Commit small and often, author
`LilDannyy <94884334+LilDannyy@users.noreply.github.com>`, messages ending with a `Co-Authored-By:` line naming your
model. Push only `b5-karp-ref` to the fork (`git push fork b5-karp-ref`), never `new-stages` or a PR. When done, message
the lead's session (`Inkwave local setup`) with one paragraph: the head commit, the checker's RESULT lines, and the
report's path.
