# JOB-1 — b5-sprules: balance of the Waddle Bomb Barrage and the Mystery Bomb Barrage

Branch `botlab-b5-sprules` (fork). `git fetch fork && git checkout botlab-b5-sprules && git pull`, `caffeinate` for the
run, `SLOTS=3`. Results → `tools/botlab/jobs/batch5/sprules/results/JOB-1.txt` on the same branch, then push.

```bash
cd ~/inkwave-botlab
SLOTS=3 PAR=3 tools/botlab/jobs/batch5/sprules/balance.sh .botlab/results/b5-sprules/job1 2 2
```

- 128 matches (3:00 each; Zone Control 3:00 + overtime): 4 stages (halyard, crossmarket, craters, spirhalite) × Turf War
  and Zone Control × 4 configs × 4 (two runs a side for the forced ones; four side-0 runs for the baseline) = 16 a cell.
  `wad` = one team forced to barrage_waddle, `mys` = forced to barrage_mystery, `bar` = forced to the existing Splat Bomb
  Barrage (a reference), `base` = random special rolls on both teams. Weapons mirrored across the teams (four comps
  cycled), the special gauge ×3 (SPCHARGE=3).
- Resumable: a match whose JSON is already there is skipped, so a re-run after an interruption is fine.

**What to put in results/JOB-1.txt** (compact — no raw match logs):
1. The whole output of `node tools/botlab/jobs/batch5/sprules/agg.cjs .botlab/results/b5-sprules/job1` (one block per
   mode and config).
2. The count of FAILED lines, and for any match log with `CONSOLE n` (n > 0) or `FRAME ERRORS`: its file name and those
   lines (cut to 300 characters).
3. The wall time.
