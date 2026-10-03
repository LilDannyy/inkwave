# JOB-3 — Drainbow balance round 3 (the candidate), REVISED — use the head of botlab-drainbow named in the message

Same setup as JOB-2 (`git pull` on `botlab-drainbow`, caffeinate, SLOTS=3). Results → `results/JOB-3.txt`, push.

```bash
SLOTS=3 PAR=3 CFGS="db dblt dbv2 bub base" tools/botlab/jobs/drainbow/balance2.sh .botlab/results/drainbow/bal3 2 2
```

(~136 matches, ~40 min.) `db` is the candidate: everything from JOB-2's `db`, plus its film raining down as ink when its
time runs out, and the other team's bots reading it as a heavy area (they get out even when holding the objective);
`dblt` the same with the light reading (JOB-2's); `dbv2` the candidate bigger / longer / stronger. Put the whole output
of `node tools/botlab/jobs/drainbow/agg2.cjs .botlab/results/drainbow/bal3` in the results file, with the FAILED count
and any match log's warnings (`CONSOLE n` > 0 / `FRAME ERRORS`). No regressions this time.
