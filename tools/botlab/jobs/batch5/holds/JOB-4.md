# JOB-4 — batch 5 `holds`: the full regression set on the final head (branch botlab-b5-holds)

`git fetch && git checkout botlab-b5-holds && git pull`, caffeinate, SLOTS=3. Results →
`tools/botlab/jobs/batch5/holds/results/JOB-4.txt` on botlab-b5-holds (commit + push), with `git rev-parse --short HEAD`.

Since JOB-2 (8b8b351) the character code changed twice (the blaster's closer aim; the Tidal Slam two-handed), so the whole
set runs again on the final head (~20 min):

```bash
SLOTS=3 PAR=3 REP=3 tools/botlab/jobs/batch5/holds/regress.sh
```

It runs `holds` ×3, `world-build`, `hud-lead` (turf / zones / tower), `input-swim`, `loadout-picker` (three at a time);
`net-mock`; `net-holds` (roller + brolly, brush + blaster); three 90 s all-bot matches. Put its whole output in the
results file (each `==` line, FAIL lines, the matches' `by weapon` / `CONSOLE` lines, any `[net] cN uncaught:` line).
If anything FAILs, add the first 40 lines of that run's log from `.botlab/b5-holds-regress/<name>.log`.
