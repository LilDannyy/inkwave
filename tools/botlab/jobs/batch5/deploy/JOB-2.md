# JOB-2 — batch 5 "deploy": the full regression set at the newest commit, repeats, Tower Command A/B (branch botlab-b5-deploy)

Supersedes JOB-1 (run JOB-2 instead; if JOB-1 is already running, let it finish, then run JOB-2 anyway).
`git fetch fork && git checkout botlab-b5-deploy && git pull`, caffeinate, `export SLOTS=3`. Results →
`tools/botlab/jobs/batch5/deploy/results/JOB-2.txt` on botlab-b5-deploy (commit + push). (~70–90 min)

Since JOB-1: Skitter Bomb 30 hp; bots notice enemy devices a little past their reach and walk up; a tower rider shoots
devices only from the deck; tower-match.cjs takes SUBS (equip subs) and DEV_AI=0 (bots leave enemy devices alone).

## 1. The full regression set, once (17 page tests 3 at a time, sfx-cues / audio-pause alone, 6 two-client tests)

```bash
LOG=.botlab/b5-deploy-j2-full PAR=3 tools/botlab/jobs/batch5/deploy/regress.sh 2>&1 | tee .botlab/b5-deploy-j2-full.txt
```

## 2. Two more passes of this package's own tests and the bot ones (flakiness)

```bash
for i in 2 3; do LOG=.botlab/b5-deploy-j2-$i ONLY="deployables deployables-tower deployables-rail deployables-hedge bot-specials bot-specials-tower net-deploy net-deploy-tower" PAR=3 tools/botlab/jobs/batch5/deploy/regress.sh; done 2>&1 | tee .botlab/b5-deploy-j2-rep.txt
```

## 3. Tower Command bot matches with devices: bots shooting devices ON vs OFF (the A/B)

Alpha carries sprinklers and Bravo beacons (then swapped), on four stages; each once with the bots' device shooting on
(default) and once off (DEV_AI=0). 16 full matches, 3 at a time:

```bash
mkdir -p .botlab/b5-deploy-j2-tm
for M in halyard calamari treehills saltpan; do for S in 'team0=sprinkler;team1=beacon' 'team0=beacon;team1=sprinkler'; do for AI in 1 0; do
  echo "$M|$S|$AI"; done; done; done | xargs -S 4096 -P 3 -I{} bash -c 'IFS="|" read M S AI <<< "{}"; f=.botlab/b5-deploy-j2-tm/$M-${S//[^a-z0-9]/}-ai$AI.log; MAP=$M SUBS="$S" DEV_AI=$AI WATCHDOG=900000 tools/botlab/run.sh tools/botlab/tower-match.cjs > $f 2>&1; echo "### $M | $S | DEV_AI=$AI"; grep -E "^== |^   subs|DEPLOY|FRAME ERRORS|^CONSOLE|WATCHDOG|MAP MISMATCH" $f | cut -c1-400' 2>&1 | tee .botlab/b5-deploy-j2-tm.txt
```

Put the three outputs (`.botlab/b5-deploy-j2-full.txt`, `-rep.txt`, `-tm.txt`, already compact) into the results file.
If a test fails, add its FAIL lines from its log (`grep -E '^FAIL|Error|WATCHDOG' … | head -40`). Do not paste raw logs.
If Electron dies at boot, rerun that one test once.
