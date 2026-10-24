#!/bin/bash
# kind: tests
# after: JOB-16
# Beta fix round 1, review 1, JOB-17: the brief's 16 stages (DEVSTAGE=1 adds Cargo Terminal) the cold way twice more on the
# final code — first-frames-cold.sh: per stage the frames and waits under 100 ms, no program compiled in them (a Mitts
# punch and a flood forced), none in 20 s more of play with every special charged — bot-stuck ×3 again, its pocket, and
# 19 matches on the stages where bots got pinned or stranded (the final bots.js).
set -u
J=${JOB_OUT:-.botlab/beta1-job17}
mkdir -p "$J/logs"; J=$(cd "$J" && pwd)
echo "### beta1 JOB-17 head ${JOB_SHA:-?}"
for k in 1 2; do
  env DEVSTAGE=1 WATCHDOG=900000 tools/botlab/first-frames-cold.sh > "$J/logs/ffcold-$k.log" 2>&1
  echo "[ffcold-$k] $(grep -E '^RESULT' "$J/logs/ffcold-$k.log" | tail -1)"
  grep -E '^FAIL' "$J/logs/ffcold-$k.log" | cut -c1-330 | sed "s/^/[ffcold-$k] /"
  grep -E '^== ' "$J/logs/ffcold-$k.log" | sed -E 's/^== ([a-z]+) .*load ([0-9]+) ms.*worst intro ([0-9.]+) ms.*worst play ([0-9.]+) ms.*worst gap between frames ([0-9.]+) ms.*/\1 load \2 | intro \3 | play \4 | gap \5/' > "$J/ffcold-$k-stages.txt"
  grep -E '^== |^(PASS|FAIL)|^RESULT|^   lineup|^   frame @|^   between frames @[0-9]|FRAME ERRORS|HARNESS|WATCHDOG' "$J/logs/ffcold-$k.log" | cut -c1-300 | head -150 > "$J/ffcold-$k.txt"
done
for k in 1 2 3; do
  env WATCHDOG=1500000 MAP=aquarium MODE=turf PAGE=tools/botlab/tests/bot-stuck.js tools/botlab/run.sh tools/botlab/page.cjs > "$J/logs/bot-stuck-$k.log" 2>&1
  echo "[bot-stuck-$k] $(grep -E '^RESULT' "$J/logs/bot-stuck-$k.log" | tail -1)"; grep -E '^FAIL' "$J/logs/bot-stuck-$k.log" | cut -c1-330 | sed "s/^/[bot-stuck-$k] /"
  grep -oE '"worst":[0-9.]+' "$J/logs/bot-stuck-$k.log" | head -1 | sed "s/^/[bot-stuck-$k] refill /"
done
# the final bots.js (the dead-end strand, the pinned watch out of fights): bot-stuck's pocket and matches on the stages
# where bots got pinned or stranded, each printing its stranded / pinned super jumps and why
env WATCHDOG=1500000 MAP=bluestone MODE=turf PAGE_ARGS='only=pocket' PAGE=tools/botlab/tests/bot-stuck.js tools/botlab/run.sh tools/botlab/page.cjs > "$J/logs/pocket.log" 2>&1
echo "[pocket] $(grep -E '^RESULT' "$J/logs/pocket.log" | tail -1)"
run() { local n=$1; shift
  ( env WATCHDOG=1200000 "$@" > "$J/logs/$n.log" 2>&1
    grep -h -E '^RESULT karp|^   stuck [0-9.]+%|bots stuck|^   STUCK|^   STRANDED|FRAME ERRORS|^WATCHDOG|^HARNESS|^CONSOLE' "$J/logs/$n.log" | cut -c1-300 | sed "s/^/[$n] /" ) & }
i=0; step() { i=$((i + 1)); if (( i % 3 == 0 )); then wait; fi; }
for s in halyard aquarium bluestone treehills lockgate nantai; do for k in 1 2; do run "turf-$s-$k" MAP=$s MODE=turf SECS=180 tools/botlab/run.sh tools/botlab/match.cjs; step; done; done
for s in halyard aquarium; do run "zones-$s" MAP=$s MODE=zones tools/botlab/run.sh tools/botlab/match.cjs; step; done
for s in aquarium halyard; do run "karp-$s" MAP=$s tools/botlab/run.sh tools/botlab/karp-match.cjs; step; done
run "tower-bluestone" MAP=bluestone tools/botlab/run.sh tools/botlab/tower-match.cjs; step
wait
echo "### done"
