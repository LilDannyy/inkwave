# JOB-5 — batch 5 "deploy": the full regression set at the final head + a small Turf War balance set, new vs old (branch botlab-b5-deploy)

Replaces JOB-3 (never run). `git fetch fork && git checkout botlab-b5-deploy && git pull`, caffeinate, `export SLOTS=3`.
Results → `tools/botlab/jobs/batch5/deploy/results/JOB-5.txt` on botlab-b5-deploy (commit + push; git pull first, never
force). (~60–75 min)

Since JOB-2: bots forget an enemy device a clear() took away (deployables-bots.js live(), botSpecials.js reset); the
deployables test's rail section now also checks a Lurk Mine and a Calamari railcar.

## 1. The full regression set, once, with 4 Tower Command bot matches

```bash
LOG=.botlab/b5-deploy-j5-full PAR=3 MATCHES="halyard calamari treehills saltpan" tools/botlab/jobs/batch5/deploy/regress.sh 2>&1 | tee .botlab/b5-deploy-j5-full.txt
```

## 2. Turf War balance, the lead's small set: 8 matches per code (new = this branch, old = 7ee5ad5)

Alpha carries the devices (Skitter Bomb, Twirl Sprinkler, Hop Beacon, Skitter Bomb), Bravo Splat Bombs; weapons mirrored.
3-minute Turf War, halyard ×4 + saltpan ×4, on each code. 16 matches.

```bash
bal() {   # $1: tag (new / old)
  mkdir -p .botlab/b5-deploy-j5-$1
  for M in halyard saltpan; do for i in 1 2 3 4; do echo "$M $i"; done; done | xargs -P 3 -L 1 bash -c 'f=.botlab/b5-deploy-j5-'$1'/$0-$1.log;
    MAP=$0 MODE=turf SECS=180 WEAPONS=shooter,roller,charger,splatling,shooter,roller,charger,splatling SUBS=seeker,sprinkler,beacon,seeker,bomb,bomb,bomb,bomb WATCHDOG=600000 tools/botlab/run.sh tools/botlab/match.cjs > $f 2>&1;
    echo "### '$1' $0 $1"; grep -E "^== |splats by cause|DEPLOY|^   loadouts|FRAME ERRORS|^CONSOLE|WATCHDOG" $f | cut -c1-330'
}
bal new 2>&1 | tee .botlab/b5-deploy-j5-new.txt
git checkout -q --detach 7ee5ad5 && bal old 2>&1 | tee .botlab/b5-deploy-j5-old.txt; git checkout -q botlab-b5-deploy
```

Put the three outputs (already compact) into the results file, and on top:
- part 1: a verdict line (n of m tests full; every FAIL line; any CONSOLE / FRAME ERRORS in the matches). If a test
  fails, add its FAIL lines from its log (`grep -E '^FAIL|Error|WATCHDOG' … | head -40`). If Electron dies at boot,
  rerun that one test once.
- part 2: a small table per code (new / old): Alpha's mean turf %, Bravo's mean turf %, Alpha wins / 8, and the mean
  splats per match by cause `seeker`, `sprinkler` (its drops, whatever name "splats by cause" gives them) and `bomb`;
  on the new code the summed DEPLOY line (hits, shot down by kind, skitter pops, bots' picks).
Do not paste raw logs.
