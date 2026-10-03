# JOB-3 (zipcheer) — balance AFTER: the new Zipline and the new Cheer Orb forced on one team

Branch `botlab-b5-zipcheer` at the sha named in the message. Run it AFTER JOB-1 (same folder: JOB-1's old-code numbers
`zipO` / `orbO` must still be in `.botlab/results/zipcheer/bal`, so the summary sets old against new).

**Revised again (the lead's standing order tonight: 8 matches per mode and config): `1 1` now, not `2 2`.** If you already ran this job (all of it or part) and only the push was lost, don't run anything again and don't delete anything: the command above skips every finished match (`balance.sh` is resumable), so re-running it just finishes what's missing, and `agg.cjs` counts every match in the folder (extra ones from a `2 2` run are welcome). If the results file is already written on your side, just commit and push it.

```bash
cd ~/inkwave-botlab && git fetch && git checkout botlab-b5-zipcheer && git pull
caffeinate -i -s bash -c 'SLOTS=3 PAR=3 CFGS="zipN orbN" tools/botlab/jobs/batch5/zipcheer/balance.sh .botlab/results/zipcheer/bal 1 1' 2>&1 | tee .botlab/results/zipcheer/job3.log
```

32 matches (per mode: 8 new-Zipline-forced, 8 new-Cheer-Orb-forced; 4 a side × 4 stages; trimmed 03:25 — no
what-if set), turf 180 s and full Zone Control, special gauge ×3.

Put in `tools/botlab/jobs/batch5/zipcheer/results/JOB-3.txt`:
- the whole output of `node tools/botlab/jobs/batch5/zipcheer/agg.cjs .botlab/results/zipcheer/bal` (short; it covers
  JOB-1's configs too),
- the count of FAILED lines in job3.log, and for any match log with `CONSOLE n` > 0 or `FRAME ERRORS`: its first 5
  warning lines (not the whole log),
- the sha you ran.

Commit only that file, push to `botlab-b5-zipcheer`.
