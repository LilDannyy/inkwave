# JOB-1 — Surf N' Turf (special `surf`): regressions + balance

Branch `botlab-surf` (the commit this file came with). From `~/inkwave-botlab`, with `caffeinate` running:

```bash
git fetch && git checkout botlab-surf && git pull
SLOTS=3 tools/botlab/jobs/surf/job1.sh regress 2>&1 | tee /tmp/surf-job1-regress.txt
SLOTS=3 tools/botlab/jobs/surf/job1.sh balance 2>&1 | tee /tmp/surf-job1-balance.txt
```

`job1.sh regress` runs, in this order: `sfx-cues` and `audio-pause` ALONE (nothing else running), then three at a time
`surf`, `bot-specials` (turf + tower), `track-arrows`, `tower-rules`, `bot-sight`, `world-build`, `hud-lead` (turf / zones
/ tower), then one at a time the online ones `net-practice` (APP_CSP=1, expect 29), `net-turf` (expect 9), `net-surf`
(expect 12). Raw output: `$BOTLAB_OUT/surf-job1/t/<name>.txt`.

**If any regression test doesn't fully pass**, rerun just that test at the base commit `aee9469` (e.g. a `git worktree add
/tmp/base aee9469`, symlink node_modules, same command) so we can tell an old failure from a new one, and include both
results.

`job1.sh balance` runs 176 bot matches (≤ 3 at once): on halyard, crossmarket, craters, spirhalite — Turf War 180 s:
10 `base` (random specials as shipped) + 10 `surf` (team A all on Surf N' Turf, team B random) + 4 `mirror` (everyone on
it); Zone Control: 6 `base` + 6 `surf`. It skips runs already done (re-runnable). At the end it prints the summaries
(`agg.cjs`).

## What to commit

`tools/botlab/jobs/surf/results/JOB-1.txt` containing:
1. every regression test's `RESULT n/m` line (and for a failing one: its FAIL lines + the base-commit run's result);
2. the whole output of `node tools/botlab/jobs/surf/agg.cjs $BOTLAB_OUT/surf-job1/m`;
3. any `CONSOLE` warning/error lines from the match runs that aren't the usual lightmap one (grep the `m/*.txt`).
