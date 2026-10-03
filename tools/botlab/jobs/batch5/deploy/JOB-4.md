# JOB-4 — batch 5 "deploy": bot-specials' Ink Jet check and sub-tweaks' windup escape, head vs base ×6 (branch botlab-b5-deploy)

Can run before JOB-3 if JOB-3 hasn't started (this one is short). `git fetch fork && git checkout botlab-b5-deploy &&
git pull`, caffeinate, `export SLOTS=3`. Results → `tools/botlab/jobs/batch5/deploy/results/JOB-4.txt` (commit + push). (~20 min)

The question (the lead's): is "Ink Jet: a hard charger mid-charge gets out of a blast's path …" (bot-specials) failing
more often on this branch than on the base? Locally the bots' device code never engages in bot-specials (DEV_BOT picks
0), so it may be chance; this measures both. Same for sub-tweaks' "a hard bot … caught in a windup's blast …".

```bash
ab() {   # $1: tag (head / base)
  mkdir -p .botlab/b5-deploy-j4-$1
  for i in 1 2 3 4 5 6; do echo "bs $i"; echo "st $i"; done | xargs -P 3 -L 1 bash -c 'f=.botlab/b5-deploy-j4-'$1'/$0-$1.log;
    if [ $0 = bs ]; then MAP=testbox MODE=turf PAGE=tools/botlab/tests/bot-specials.js WATCHDOG=900000 tools/botlab/run.sh tools/botlab/page.cjs > $f 2>&1;
    else MAP=testbox MODE=turf PAGE=tools/botlab/tests/sub-tweaks.js PAGE_ARGS=only=windup WATCHDOG=900000 tools/botlab/run.sh tools/botlab/page.cjs > $f 2>&1; fi;
    echo "### '$1' $0 $1: $(grep -E "^RESULT" $f)"; grep -E "Ink Jet: a hard|caught in a windup" $f | grep -oE "^(PASS|FAIL)|\{\"avgDmgOn[^}]*\}" | tr "\n" " "; echo'
}
ab head 2>&1 | tee .botlab/b5-deploy-j4-head.txt
git checkout -q --detach 7ee5ad5 && ab base 2>&1 | tee .botlab/b5-deploy-j4-base.txt; git checkout -q botlab-b5-deploy
```

Put both outputs into the results file, and on top: head vs base, how many of the 6 bot-specials runs failed the Ink Jet
check (with its avgDmgOn / avgDmgOff each run) and any other FAIL line, and how many of the 6 sub-tweaks windup runs
failed. Do not paste raw logs.
