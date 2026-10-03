# JOB-2 — Drainbow balance round 2 (variants) + regressions after the Surf merge (branch botlab-drainbow)

`git fetch && git checkout botlab-drainbow && git pull` in `~/inkwave-botlab`; `caffeinate`; SLOTS=3.
Results → `tools/botlab/jobs/drainbow/results/JOB-2.txt` (commit + push to `botlab-drainbow`).

## 1. Balance (168 matches, ~45 min at PAR=3)

```bash
SLOTS=3 PAR=3 tools/botlab/jobs/drainbow/balance2.sh .botlab/results/drainbow/bal2 2 2
```

Configs (one team's specials forced, both sides, mirrored weapon comps, SPCHARGE=3, four stages): `db` (the Drainbow
as now: bots place it in reach of a fight / ON the zone / by the tower, fight from inside it, footprint ink, the
owner's share counted while it's near), `dbnh` (no holding inside), `dbnp` (no footprint ink), `dbv2` (bigger, longer,
stronger drain), `bub` (Bubble Guard), `base` (random rolls, turf only). Resumable.

Put in the results file: the whole output of `node tools/botlab/jobs/drainbow/agg2.cjs .botlab/results/drainbow/bal2`,
the number of FAILED lines, and the first 10 warning lines of any match log with `CONSOLE n` > 0 or `FRAME ERRORS`.

## 2. Regressions (~20 min)

```bash
SLOTS=3 PAR=3 tools/botlab/jobs/drainbow/regress.sh
```

All of its output (one `== <test>: RESULT a/b  n FAIL` line per test + FAIL lines). Expected: surf 42/42, net-practice
29/29, net-surf 12/12. If something FAILs, rerun that test once alone and report both runs.
