# Beta fix round 1 (the lead, 2026-10-23): what the first week of beta play and the merge left open

The PUBLIC BETA (new-stages 632398c3 = b5-int4) shipped on 2026-10-17 by the user's rule (DECISIONS #33). This round
fixes what the beta's own issue log and the integration's unfinished proof show, on branch `b5-beta1` (worktree
`/Users/danielosling/Desktop/1/st-b5-beta1`, from new-stages 632398c3). Read COMMON.md, then this, then the int4
report (`tools/botlab/jobs/batch5/int4/LEAD-REPORT.md`) for what Codex's integration did and did not prove.

## 1. The desktop issue log (the user's play on 2026-10-17, 65 entries: `beta1/issues-desktop-2026-10-17.log`;
`node tools/botlab/issues-summary.cjs <log>` prints the table)
- **Stuck bots over 5 s**: Bazookarp on aquarium (10), bluestone (9), lockgate (4), halyard (3); Zone Control on
  aquarium (6: the known Great Tank jump edge, `stages/aquarium/LEAD-NOTES.md` "The Mac mini's pipes on / off set")
  and bluestone (3); Tower Command on bluestone (3); Turf War on bluestone (2). For each (stage, mode): reproduce with
  2 bot matches (DIAG=1 prints every episode with its position, path and hold), find the cause (an unmakeable nav
  edge, a held press, a Bazookarp carrier with no route on a placeholder layout, a pipe refusal, an era piece), fix
  it at the root in the owning module, and prove ≤ 1 % stuck with no episode over 5 s in 2 matches each.
- **`no lightmap for caldera` (Turf War, 5 times)**: Highmark Foundry ships with no baked lightmap at all (its art
  phase is pending). Bake `caldera` and `caldera.tower` now (tools/botlab/bake.cjs; stage-audit "lightmap applied")
  so the beta is lit; the `.bazookarp` variants of every stage may stay unbaked until their layouts are final, but the
  warning must not fire for them (a silent fallback for a missing mode-variant lightmap, logged once at debug level).
- **Slow frames**: 300–520 ms frames at the start of Turf War on halyard, nantai, treehills, calamari, tidewater,
  bluestone; **4,899 ms on aquarium** and **2,001 ms on bluestone** (both in their first matches). Find what each
  first frame does (the paint atlas's first use was measured at 160–260 ms by the Mac mini; a lightmap or texture
  upload; the union-world nav; the aquarium's fish / glass materials compiling) with `performance.now()` probes, and
  move the work into loading (warm the shaders, upload the textures, build the atlas before the intro ends) so the
  first frame of play is under 100 ms on every stage; prove it with a page test that measures the first 3 s of play
  on each of the 16 stages.

## 2. The hosted issue log's server (tools/host/selfhost.cjs; the Mac mini helper's finding)
- `issues.log` is written inside the site root, so `GET /issues.log` serves it publicly: write it outside the root
  (`path.join(ROOT, '..', 'issues.log')`, rotations too) and answer 404 for any GET of it.
- Behind cloudflared every request's `remoteAddress` is 127.0.0.1, so the 20-per-minute limit is shared by every
  player: key the limiter on `CF-Connecting-IP` (then `X-Forwarded-For`, then `remoteAddress`), and give the fallback
  bucket 200 a minute. Keep `issue-host.cjs` passing; extend it with a header-keyed case.

## 3. The integration's unfinished proof (int4 LEAD-REPORT.md "Still open"), on this branch
- Run, one at a time, at a load average under 4: `net-eras.cjs`, `net-lava.cjs`, `net-pipes.cjs`, `net-stagemods.cjs`,
  `net-lobbykit.cjs`, `net-practice.cjs`, `net-karp.cjs` with 2 and with 3 clients, `lava-karp.js`, `sfx-cues.js`
  (alone, last), `eras-jump.js` `only=frames`, and `karp-match.cjs` on karpbox and halyard. Every failure is a merge
  defect to fix at the root.
- Explain and fix the single console lines in the three caldera bot matches and the Bluestone Tower match (also
  1.5 % stuck there), the `lava` 58/59 check, and `bot-specials` 18/19 (the Bubble Blower counter-play check).
- Accepted for the beta, NOT this round's: `lava-audit` rules 21 and 44 (the caldera round), the aquarium's dressing
  list (its own round), Bluestone's era re-skins (the art phase).

## Proof and report
Every fix with a check that fails without it; the page tests this touches re-run; pictures only where a look changed
(the lit caldera: 4 views, day and dusk, before / after). Report in COMMON.md's format to
`tools/botlab/jobs/batch5/beta1/LEAD-REPORT.md`, with the issue-log entries mapped to causes and fixes.
