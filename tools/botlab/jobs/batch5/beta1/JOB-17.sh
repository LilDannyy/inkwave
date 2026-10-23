#!/bin/bash
# kind: tests
# after: JOB-16
# Beta fix round 1, review 1, JOB-17: the brief's 16 stages (DEVSTAGE=1 adds Cargo Terminal) the cold way twice more on the
# final code — first-frames-cold.sh: per stage the frames and waits under 100 ms, no program compiled in them (a Mitts
# punch and a flood forced), none in 20 s more of play with every special charged — and bot-stuck ×3 again.
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
echo "### done"
