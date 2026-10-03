# JOB-3 — batch 5 "deploy": Turf War balance, old code vs new, a team carrying each device (branch botlab-b5-deploy)

After JOB-2 (queue it behind). `git fetch fork && git checkout botlab-b5-deploy && git pull`, caffeinate,
`export SLOTS=3`. Results → `tools/botlab/jobs/batch5/deploy/results/JOB-3.txt` on botlab-b5-deploy (commit + push). (~20 min)

The question: does making devices shootable (Skitter Bomb 30 hp, now poppable; Sprinkler 70 → 100 hp; Hop Beacon
50 → 120 hp; bots shooting enemy devices) swing a match? Alpha carries one device kind, Bravo its default subs; 3-minute
Turf War on two stages, 5 runs each, on the NEW code (the branch) and the OLD code (7ee5ad5, detached). 60 matches.

```bash
run() {   # $1: tag (new / old)
  mkdir -p .botlab/b5-deploy-j3-$1
  for M in halyard saltpan; do for S in 'team0=seeker' 'team0=sprinkler' 'team0=beacon'; do for i in 1 2 3 4 5; do echo "$M|$S|$i"; done; done; done |
    xargs -S 4096 -P 3 -I{} bash -c 'IFS="|" read M S I <<< "{}"; f=.botlab/b5-deploy-j3-'$1'/$M-${S//[^a-z0-9]/}-$I.log; MAP=$M MODE=turf SECS=180 SUBS="$S" WATCHDOG=600000 tools/botlab/run.sh tools/botlab/match.cjs > $f 2>&1;
      echo "### '$1' $M | $S | $I"; grep -E "^== |splats by cause|DEPLOY|^   loadouts|FRAME ERRORS|^CONSOLE|WATCHDOG" $f | cut -c1-330'
}
run new 2>&1 | tee .botlab/b5-deploy-j3-new.txt
git checkout -q --detach 7ee5ad5 && run old 2>&1 | tee .botlab/b5-deploy-j3-old.txt; git checkout -q botlab-b5-deploy
```

Put both outputs (already compact: per match its `==` turf line, splats by cause, loadouts, DEPLOY line on the new code)
into the results file, and on top a small table per (stage, device, code): Alpha's mean turf %, Bravo's mean turf %,
Alpha wins / 5, and the mean count of splats by the device's own cause (`seeker` / `sprinkler` / `drop` if that is how a
sprinkler's drops are named in "splats by cause"). Do not paste raw logs.
