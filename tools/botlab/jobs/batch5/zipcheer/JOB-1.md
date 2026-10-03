# JOB-1 (zipcheer) — balance BEFORE: the Zipline and the Cheer Orb as they are today (the old code), and random rolls

Branch `botlab-b5-zipcheer` at the sha named in the message. This commit is the batch's base game code (new-stages
7ee5ad5) plus only the harness: `tools/botlab/match.cjs` (two report lines: how each team's specials ended, and a
`zipcheer` stats line that stays null on this code; a Cheer Orb user held up in the air isn't counted as stuck) and this
folder's `balance.sh` / `agg.cjs`. The new code comes in JOB-2, into the same results folder, so keep
`.botlab/results/zipcheer/bal` (don't delete it after the job).

**Revised (03:30): run it on the OLD code, commit adeacf7, not the branch head** (the branch head now carries the new
code). Check out adeacf7 detached for the run, then go back to the branch to commit the results:

```bash
cd ~/inkwave-botlab && git fetch && git checkout --detach adeacf7 && mkdir -p .botlab/results/zipcheer
caffeinate -i -s bash -c 'SLOTS=3 PAR=3 CFGS="zipO orbO base" tools/botlab/jobs/batch5/zipcheer/balance.sh .botlab/results/zipcheer/bal 2 2' 2>&1 | tee .botlab/results/zipcheer/job1.log
git checkout botlab-b5-zipcheer && git pull
```

(If JOB-1 already ran on a later sha than adeacf7: delete `.botlab/results/zipcheer/bal/*-zipO-*`, `*-orbO-*` and
`*-base-*` and run it again as above.)

96 matches (per mode: 16 Zipline-forced, 16 Cheer-Orb-forced, 16 random; 8 a side × 4 stages), turf 180 s and full
Zone Control, special gauge ×3. About 35–45 min on the mini.

Put in `tools/botlab/jobs/batch5/zipcheer/results/JOB-1.txt`:
- the whole output of `node tools/botlab/jobs/batch5/zipcheer/agg.cjs .botlab/results/zipcheer/bal` (short),
- the count of FAILED lines in job1.log, and for any match log with `CONSOLE n` > 0 or `FRAME ERRORS`: its first 5
  warning lines (not the whole log),
- the sha you ran (it must be adeacf7).

Commit only that file, push to `botlab-b5-zipcheer`.
