# JOB-1 — Drainbow: one shade + blind bots (branch botlab-spfix)

`git fetch && git checkout botlab-spfix && git pull`, caffeinate, SLOTS=3. Results → `tools/botlab/jobs/sp-fixes/results/JOB-1.txt`
on botlab-spfix (commit + push).

What changed: inside an enemy Drainbow the other team's bots can't tell their own ink from theirs (they paint
everything they pass, a refill leads them out of the bubble first, they keep painting on the way out). Config switch
`drainbow.botBlind` (1 = new, 0 = old) so the balance A/B runs on the same code.

## 1. Regressions (the Drainbow side; ~15 min)

```bash
ONLY="drainbow bot-specials bot-specials-tower bot-sight net-drainbow" SLOTS=3 PAR=3 tools/botlab/jobs/sp-fixes/regress.sh
```

All of its output into the results file.

## 2. Balance A/B: Drainbow (blind bots) vs Drainbow (old reading) vs Bubble Guard (~30 min, 96 matches)

```bash
SLOTS=3 PAR=3 CFGS="db dbx bub" DBX='drainbow.botBlind=0' tools/botlab/jobs/drainbow/balance2.sh .botlab/results/spfix/bal1 2 2
node tools/botlab/jobs/drainbow/agg2.cjs .botlab/results/spfix/bal1
```

(`db` = the new default, botBlind 1; `dbx` = botBlind 0, i.e. as before.) Put the whole agg2 output in the results
file, with the FAILED count and any match log's CONSOLE / FRAME ERRORS warnings.
