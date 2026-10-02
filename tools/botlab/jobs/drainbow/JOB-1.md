# JOB-1 — Drainbow: balance batch + regressions (branch botlab-drainbow)

Checkout: `git fetch && git checkout botlab-drainbow && git pull` in `~/inkwave-botlab`. Keep `caffeinate` running.
SLOTS=3 for everything. Results go to `tools/botlab/jobs/drainbow/results/JOB-1.txt` (commit + push to `botlab-drainbow`).

## 1. Balance (~100 matches, ~25–35 min at PAR=3)

```bash
SLOTS=3 PAR=3 tools/botlab/jobs/drainbow/balance.sh .botlab/results/drainbow/bal1 3 2
```

That runs, on halyard / crossmarket / craters / spirhalite, with mirrored weapon comps and SPCHARGE=3:
Turf War 180 s × 3 per stage for each of db0, db1 (one team all Drainbow), bub0, bub1 (one team all Bubble Guard),
base (random rolls); Zone Control × 2 per stage for db0, db1, bub0, bub1. It's resumable (rerun skips finished matches).

Put in the results file: the whole output of
`node tools/botlab/jobs/drainbow/agg.cjs .botlab/results/drainbow/bal1`, plus the count of FAILED lines, and for any
match log containing `CONSOLE n` with n > 0 or `FRAME ERRORS`, its first 10 warning lines (grep the `.log` files).

## 2. Regressions (~15 min)

```bash
SLOTS=3 PAR=3 tools/botlab/jobs/drainbow/regress.sh
```

It prints one `== <test>: RESULT a/b  n FAIL` line per test and the FAIL lines. Put all of it in the results file.
If a test FAILs, rerun that one test on the base commit `aee9469` (e.g. `git worktree add /tmp/base aee9469`, run the
same command there) and report whether the same check fails there too. Expected: net-practice 29/29.
