# JOB-2 — b5-tuning: the package's tests (×3), the proof they fail without the change, and the regressions

Branch `botlab-b5-tuning` (fork). `git fetch fork && git checkout botlab-b5-tuning && git pull`, `caffeinate` for the run.
Results → `tools/botlab/jobs/batch5/tuning/results/JOB-2.txt` on the same branch, then push. Independent of JOB-1 (run it
alongside if slots allow; SLOTS=3 is the cap either way).

```bash
cd ~/inkwave-botlab
export SLOTS=3 WATCHDOG=900000
T=tools/botlab; L=.botlab/results/b5-tuning/job2; mkdir -p $L
# 1. the package's own tests, three times each (flakiness)
for i in 1 2 3; do
  MAP=testbox MODE=turf  PAGE=$T/tests/tuning.js $T/run.sh $T/page.cjs > $L/tuning-turf-$i.log 2>&1
  MAP=testbox MODE=zones PAGE=$T/tests/tuning.js $T/run.sh $T/page.cjs > $L/tuning-zones-$i.log 2>&1
  CLIENTS=1 Q0='netmock=1&mockauto=0' NET=$T/tests/weapon-names.cjs $T/run.sh $T/netpage.cjs > $L/names-$i.log 2>&1
done
# 2. the same checks on the old values / the old UI: these runs are EXPECTED to fail (that's the proof)
MAP=testbox MODE=turf  PAGE=$T/tests/tuning.js PAGE_ARGS=old $T/run.sh $T/page.cjs > $L/old-tuning-turf.log 2>&1
MAP=testbox MODE=zones PAGE=$T/tests/tuning.js PAGE_ARGS=old $T/run.sh $T/page.cjs > $L/old-tuning-zones.log 2>&1
git checkout 7ee5ad5 -- src/ui/menus.js styles/ui.css
CLIENTS=1 Q0='netmock=1&mockauto=0' NET=$T/tests/weapon-names.cjs NET_ARGS='only=main,setup,loadout,hub,lobby,kits' $T/run.sh $T/netpage.cjs > $L/old-names.log 2>&1
git checkout HEAD -- src/ui/menus.js styles/ui.css; git status --short src styles   # (must print nothing)
# 3. regressions, once each
for M in turf zones tower; do MAP=testbox MODE=$M PAGE=$T/tests/hud-lead.js $T/run.sh $T/page.cjs > $L/hud-lead-$M.log 2>&1; done
MAP=testbox PAGE=$T/tests/loadout-picker.js $T/run.sh $T/page.cjs > $L/loadout-picker.log 2>&1
CLIENTS=2 Q0=autopilot Q1=autopilot NET=$T/tests/net-lobbykit.cjs $T/run.sh $T/netpage.cjs > $L/net-lobbykit.log 2>&1
CLIENTS=1 Q0='netmock=1&mockauto=0' NET=$T/tests/net-mock.cjs $T/run.sh $T/netpage.cjs > $L/net-mock.log 2>&1
MAP=testbox PAGE=$T/tests/input-swim.js $T/run.sh $T/page.cjs > $L/input-swim.log 2>&1
MAP=testbox MODE=turf PAGE=$T/tests/bot-sight.js $T/run.sh $T/page.cjs > $L/bot-sight.log 2>&1
```

Up to three of the runs in each block may go at once (they don't share state). The steps in block 2 must run in
order (the names run between the two `git checkout`s).

**What to put in results/JOB-2.txt** (compact — no raw logs): for every log, one line `<log>: <RESULT line>`, then
each of its FAIL lines (cut to 400 characters) and any `console errors` / `CONSOLE` / `WATCHDOG` line. Wall time.
