# JOB-3 — Drainbow balance round 3 (the candidate: + its film raining down as ink when its time runs out)

Same setup as JOB-2 (`git pull` on `botlab-drainbow`, caffeinate, SLOTS=3). Results → `results/JOB-3.txt`, push.

```bash
SLOTS=3 PAR=3 CFGS="db dbv2 bub base" tools/botlab/jobs/drainbow/balance2.sh .botlab/results/drainbow/bal3 2 2
```

(~104 matches, ~30 min.) Put the whole output of `node tools/botlab/jobs/drainbow/agg2.cjs .botlab/results/drainbow/bal3`
in the results file, with the FAILED count and any match log's warnings (`CONSOLE n` > 0 / `FRAME ERRORS`). No
regressions this time.
