# JOB-3 (zipcheer) — balance AFTER: the new Zipline and the new Cheer Orb forced on one team (and a what-if)

Branch `botlab-b5-zipcheer` at the sha named in the message. Run it AFTER JOB-1 (same folder: JOB-1's old-code numbers
`zipO` / `orbO` / `base` must still be in `.botlab/results/zipcheer/bal`, so the summary sets old against new).

```bash
cd ~/inkwave-botlab && git fetch && git checkout botlab-b5-zipcheer && git pull
caffeinate -i -s bash -c 'SLOTS=3 PAR=3 CFGS="zipN orbN orbH" TUNE_orbH="booyah.heldDamage=0.5" tools/botlab/jobs/batch5/zipcheer/balance.sh .botlab/results/zipcheer/bal 2 2' 2>&1 | tee .botlab/results/zipcheer/job3.log
```

96 matches (per mode: 16 new-Zipline-forced, 16 new-Cheer-Orb-forced, 16 Cheer-Orb-forced with a what-if: half damage
while held up in the air; 8 a side × 4 stages), turf 180 s and full Zone Control, special gauge ×3. About 35–45 min.

Put in `tools/botlab/jobs/batch5/zipcheer/results/JOB-3.txt`:
- the whole output of `node tools/botlab/jobs/batch5/zipcheer/agg.cjs .botlab/results/zipcheer/bal` (short; it covers
  JOB-1's configs too),
- the count of FAILED lines in job3.log, and for any match log with `CONSOLE n` > 0 or `FRAME ERRORS`: its first 5
  warning lines (not the whole log),
- the sha you ran.

Commit only that file, push to `botlab-b5-zipcheer`.
