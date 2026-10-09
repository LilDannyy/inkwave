# JOB-1 — b5-tuning: Zone Control rules (old vs two candidates) and the roller's speed (before / after)

Branch `botlab-b5-tuning` (fork). `git fetch fork && git checkout botlab-b5-tuning && git pull`, `caffeinate` for the run,
`SLOTS=3`. Results → `tools/botlab/jobs/batch5/tuning/results/JOB-1.txt` on the same branch, then push.

```bash
cd ~/inkwave-botlab
SLOTS=3 PAR=3 tools/botlab/jobs/batch5/tuning/sweep.sh .botlab/results/b5-tuning/job1 zones "old A B" 8
SLOTS=3 PAR=3 tools/botlab/jobs/batch5/tuning/sweep.sh .botlab/results/b5-tuning/job1 roller "before after" 8
node tools/botlab/jobs/batch5/tuning/agg.cjs .botlab/results/b5-tuning/job1
```

- Part 1: 96 Zone Control matches (5:00 + overtime): 4 stages (halyard, saltpan, crossmarket, craters) × 3 rule sets × 8.
  `old` = the rules before this change (TUNE puts them back), `A` / `B` = two candidates. Weapons mirrored across the
  teams, four comps cycled, the same comp per stage + run number in every set.
- Part 2: 64 Turf War matches (3:00): 4 stages (tidewater, halyard, crossmarket, lockgate) × roller at the old speed
  (`before`, TUNE roller.rollSpeed=4.4) and the new one (`after`) × 8; a roller on each team.
- The sweep is resumable (a match with its JSON already there is skipped), so a re-run after an interruption is fine.

**What to put in results/JOB-1.txt** (compact — no raw match logs):
1. The whole output of the final `agg.cjs` line (it's short: one block per config and stage).
2. The count of FAILED lines from the two sweeps, and, for any match log with `CONSOLE n` (n > 0) or `FRAME ERRORS`,
   its file name and those lines (cut to 300 characters).
3. Wall time of each part.
