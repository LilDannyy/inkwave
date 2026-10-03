# JOB-3 — b5-tuning: the roller before / after (JOB-1 part 2, restated; no results ever came back for it)

**If you already ran JOB-1 part 2 (the roller) and only the push was lost: do not run it again.** Put its agg output in
`results/JOB-3.txt` (with a line saying it is JOB-1 part 2 from your earlier run, and at which sha) and push.

Otherwise: branch `botlab-b5-tuning` (fork), `git fetch fork && git checkout botlab-b5-tuning && git pull`, `caffeinate`,
`SLOTS=3`. Results → `tools/botlab/jobs/batch5/tuning/results/JOB-3.txt` on the same branch, then push.

```bash
cd ~/inkwave-botlab
SLOTS=3 PAR=3 tools/botlab/jobs/batch5/tuning/sweep.sh .botlab/results/b5-tuning/job3 roller "before after" 2
node tools/botlab/jobs/batch5/tuning/agg.cjs .botlab/results/b5-tuning/job3
```

- 16 Turf War matches (3:00), the size the lead set: 4 stages (tidewater, halyard, crossmarket, lockgate) × 2 configs ×
  2 runs. `before` = the roller at its old speed (TUNE roller.rollSpeed=4.4), `after` = the branch (6.5 m/s). A roller
  on each team, the rest of the roster cycled, mirrored across the teams; the same comp per stage + run in both configs.
- Resumable (a match with its JSON already there is skipped).

**What to put in results/JOB-3.txt** (compact — no raw match logs):
1. The whole output of the final `agg.cjs` line (one block per config and stage).
2. The count of FAILED lines, and, for any match log with `CONSOLE n` (n > 0) or `FRAME ERRORS`, its file name and those
   lines (cut to 300 characters).
3. Wall time.
