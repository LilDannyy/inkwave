#!/bin/bash
# kind: tests
# Beta fix round 1, JOB-4: the round's proof on its final code.
#  1. first-frames.cjs on every stage (Cargo with DEVSTAGE=1), twice (the frames and the waits between them).
#  2. The stuck bots, 2 matches each (DIAG=1): Bazookarp on aquarium, bluestone, lockgate, halyard; Zone Control on
#     aquarium, bluestone; Tower Command and Turf War on bluestone — the brief's bar: ≤ 1 % stuck, no episode over 5 s;
#     plus an all-bobber Bluestone Turf War (the Chain Bobber's holds) and the caldera matches (their console lines).
#  3. The page tests this round touched: issue-log, bot-stuck, lightmaps, stage-mods, world-build, eras-world, pipes,
#     sub-bobber, bobber-web, holds, bot-climb, karp-bots, lava-bots (×2), beta-content, lava (F8), bot-specials (×2: int4's
#     18/19); node issue-host.cjs; then net-karp with 2 and 3 clients (8c).
set -u
J=${JOB_OUT:-.botlab/beta1-job4}
PAR=${PAR:-3}
mkdir -p "$J/logs"
echo "### beta1 JOB-4 head ${JOB_SHA:-?}"
summ() { grep -E '^== |^   stuck |^      plan |^   STUCK|^   DIAG|^CONSOLE|^  \[|^RESULT|FRAME ERRORS|^WATCHDOG|^HARNESS|MAP MISMATCH|^   frame @|^   between|^PASS|^FAIL|^   fast fuse|^   carrier-stuck' "$1" | cut -c1-420 | head -150; }
# 1. first frames (alone)
for k in 1 2; do
  DEVSTAGE=1 WATCHDOG=1800000 tools/botlab/run.sh tools/botlab/first-frames.cjs > "$J/logs/first-frames-$k.log" 2>&1
  summ "$J/logs/first-frames-$k.log" > "$J/first-frames-$k.txt"
  grep -E '^PASS|^FAIL|^RESULT|^WATCHDOG|^HARNESS' "$J/logs/first-frames-$k.log" | cut -c1-260 | sed "s/^/[ff$k] /"
done
# 2. matches, PAR at a time
run() { local n=$1; shift
  ( env WATCHDOG=1200000 "$@" > "$J/logs/$n.log" 2>&1; summ "$J/logs/$n.log" > "$J/$n.txt"
    grep -h -E '^RESULT karp|^   stuck [0-9.]+%|bots stuck|^   STUCK|FRAME ERRORS|^WATCHDOG|^HARNESS|MAP MISMATCH|^CONSOLE' "$J/logs/$n.log" | cut -c1-260 | sed "s/^/[$n] /" ) & }
i=0; step() { i=$((i + 1)); if (( i % PAR == 0 )); then wait; fi; }
for s in aquarium bluestone lockgate halyard; do for k in 1 2; do run "karp-$s-$k" MAP=$s DIAG=1 tools/botlab/run.sh tools/botlab/karp-match.cjs; step; done; done
for s in aquarium bluestone; do for k in 1 2; do run "zones-$s-$k" MAP=$s MODE=zones DIAG=1 tools/botlab/run.sh tools/botlab/match.cjs; step; done; done
for k in 1 2; do run "tower-bluestone-$k" MAP=bluestone DIAG=1 tools/botlab/run.sh tools/botlab/tower-match.cjs; step; done
for k in 1 2; do run "turf-bluestone-$k" MAP=bluestone MODE=turf SECS=180 DIAG=1 tools/botlab/run.sh tools/botlab/match.cjs; step; done
run "turf-bluestone-bobber" MAP=bluestone MODE=turf SECS=180 SUBS='all=bobber' DIAG=1 tools/botlab/run.sh tools/botlab/match.cjs; step
run "turf-caldera" MAP=caldera MODE=turf SECS=180 tools/botlab/run.sh tools/botlab/match.cjs; step
run "zones-caldera" MAP=caldera MODE=zones tools/botlab/run.sh tools/botlab/match.cjs; step
run "tower-caldera" MAP=caldera tools/botlab/run.sh tools/botlab/tower-match.cjs; step
wait
# 3. page tests, one at a time
pt() { local n=$1; shift
  env WATCHDOG=1500000 "$@" tools/botlab/run.sh tools/botlab/page.cjs > "$J/logs/pt-$n.log" 2>&1
  grep -E '^FAIL|^RESULT|^WATCHDOG|HARNESS' "$J/logs/pt-$n.log" | cut -c1-300 | sed "s/^/[$n] /"; grep -E '^PASS|^FAIL|^RESULT' "$J/logs/pt-$n.log" | cut -c1-300 | head -60 > "$J/pt-$n.txt"; }
pt issue-log MAP=halyard PAGE=tools/botlab/tests/issue-log.js
pt bot-stuck MAP=aquarium MODE=turf PAGE=tools/botlab/tests/bot-stuck.js
pt lightmaps MAP=halyard PAGE=tools/botlab/tests/lightmaps.js
pt stage-mods MAP=testbox PAGE=tools/botlab/tests/stage-mods.js
pt world-build MAP=halyard PAGE=tools/botlab/tests/world-build.js
pt eras-world MAP=bluestone PAGE=tools/botlab/tests/eras-world.js
pt pipes MAP=aquarium PAGE=tools/botlab/tests/pipes.js
pt sub-bobber MAP=testbox MODE=turf PAGE=tools/botlab/tests/sub-bobber.js
pt bobber-web MAP=halyard MODE=zones PAGE=tools/botlab/tests/bobber-web.js
pt holds MAP=testbox MODE=turf PAGE=tools/botlab/tests/holds.js
pt bot-climb MAP=lockgate MODE=turf PAGE=tools/botlab/tests/bot-climb.js
pt karp-bots MAP=karpbox MODE=bazookarp PAGE=tools/botlab/tests/karp-bots.js
pt lava-bots MAP=caldera MODE=turf PAGE=tools/botlab/tests/lava-bots.js
pt beta-content MAP=bluestone PAGE=tools/botlab/tests/beta-content.js
pt lava MAP=caldera MODE=turf PAGE=tools/botlab/tests/lava.js
pt lava-bots-2 MAP=caldera MODE=turf PAGE=tools/botlab/tests/lava-bots.js
pt bot-specials MAP=testbox MODE=turf PAGE=tools/botlab/tests/bot-specials.js
pt bot-specials-2 MAP=testbox MODE=turf PAGE=tools/botlab/tests/bot-specials.js
node tools/botlab/tests/issue-host.cjs > "$J/issue-host.txt" 2>&1; grep -E '^FAIL|^RESULT' "$J/issue-host.txt" | sed 's/^/[issue-host] /'
# 4. net-karp again (8c's read moved to the events), 2 and 3 clients, the load first
for c in 2 3; do
  echo "## net-karp-$c  load $(uptime | sed 's/.*averages*: //')"
  Q2=''; [ $c = 3 ] && Q2='autopilot&wipmodes'
  env WATCHDOG=1500000 CLIENTS=$c Q0='autopilot&wipmodes' Q1='autopilot&wipmodes' Q2="$Q2" NET=tools/botlab/tests/net-karp.cjs tools/botlab/run.sh tools/botlab/netpage.cjs > "$J/logs/net-karp-$c.log" 2>&1
  grep -E '^FAIL|^RESULT|^WATCHDOG|HARNESS' "$J/logs/net-karp-$c.log" | cut -c1-300 | sed "s/^/[net-karp-$c] /"; grep -E '^PASS|^FAIL|^RESULT' "$J/logs/net-karp-$c.log" | cut -c1-300 > "$J/net-karp-$c.txt"
done
echo "### done"
