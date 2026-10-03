# JOB-4 — Drainbow: the final defaults, confirmed at a larger count (branch botlab-drainbow)

`git pull` on `botlab-drainbow`, caffeinate, SLOTS=3. Results → `results/JOB-4.txt`, push.

```bash
SLOTS=3 PAR=3 CFGS="db bub base" tools/botlab/jobs/drainbow/balance2.sh .botlab/results/drainbow/bal4 3 3
```

(108 matches, ~35 min: 24 turf + 24 zones for the Drainbow and for Bubble Guard, 12 turf for random rolls.) `db` is now
JOB-3's `dblt` (the light reading) with the owner's extension conversion raised (15 s per full meter). Put the whole
output of `node tools/botlab/jobs/drainbow/agg2.cjs .botlab/results/drainbow/bal4` in the results file, with the FAILED
count and any match log's warnings. Then, if time allows, the regressions: `SLOTS=3 PAR=3 tools/botlab/jobs/drainbow/regress.sh`
(all of its output; net-surf now passes Q0/Q1=autopilot).
