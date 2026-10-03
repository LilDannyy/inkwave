# JOB-3 — b5-sprules: the barrage balance, small (replaces JOB-1)

Branch `botlab-b5-sprules` (fork), at the sha named in the message. `git fetch fork && git checkout botlab-b5-sprules &&
git pull`, `caffeinate`, `SLOTS=3`. Results → `tools/botlab/jobs/batch5/sprules/results/JOB-3.txt` on the same branch,
then push.

**JOB-1 is withdrawn** (the lead's order tonight: 8 matches per mode and config; one big balance run happens after
integration). If JOB-1 is still waiting in your queue, drop it. If it ran (all or part of it), its matches in
`.botlab/results/b5-sprules/job1` are reused: the script skips every match whose JSON is already there, and the summary
covers everything in that folder.

```bash
cd ~/inkwave-botlab
CFGS='wad mys base' SLOTS=3 PAR=3 tools/botlab/jobs/batch5/sprules/balance.sh .botlab/results/b5-sprules/job1 1 1
```

- At most 48 matches (3:00 each; Zone Control 3:00 + overtime): 4 stages (halyard, crossmarket, craters, spirhalite) ×
  Turf War and Zone Control × 3 configs × 2 = 8 a cell. `wad` = one team forced to barrage_waddle (once a side per
  stage), `mys` = forced to barrage_mystery, `base` = random special rolls on both teams. Weapons mirrored across the
  teams, the special gauge ×3 (SPCHARGE=3).

**What to put in results/JOB-3.txt** (compact, no raw match logs):
1. The whole output of `node tools/botlab/jobs/batch5/sprules/agg.cjs .botlab/results/b5-sprules/job1` (it prints
   itself at the end of the run).
2. How many matches the folder holds per mode and config, and how many of them this run played (the rest were JOB-1's).
3. The count of FAILED lines, and for any match log with `CONSOLE n` (n > 0) or `FRAME ERRORS`: its file name and those
   lines (cut to 300 characters).
4. The wall time.
