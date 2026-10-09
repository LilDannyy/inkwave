# JOB-2 — batch 5 `holds`, the final head (branch botlab-b5-holds)

`git fetch && git checkout botlab-b5-holds && git pull`, caffeinate, SLOTS=3. Results →
`tools/botlab/jobs/batch5/holds/results/JOB-2.txt` on botlab-b5-holds (commit + push).

Same as JOB-1 on the newest commit, plus the two-client test (if JOB-1 already ran on this head, skip JOB-1's
leftovers and run only this):

```bash
SLOTS=3 PAR=3 REP=3 tools/botlab/jobs/batch5/holds/regress.sh
```

Runs `holds` ×3, `world-build`, `hud-lead` (turf / zones / tower), `input-swim`, `loadout-picker` (three at a time);
`net-mock`; `net-holds` twice (roller + brolly, brush + blaster); three 90 s all-bot matches. Put its whole output in the
results file with the commit it ran on (`git rev-parse --short HEAD`). If anything FAILs, add the first 40 lines of that
run's log from `.botlab/b5-holds-regress/<name>.log`.
