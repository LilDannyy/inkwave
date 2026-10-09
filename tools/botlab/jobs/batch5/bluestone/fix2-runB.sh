#!/bin/bash
# Bluestone fix round 2 (scratch): ink by region per era, tower-check eras 1-2 at the fixed head, the boss check on
# Halyard twice (the same check, for its roam line's baseline), locally, one at a time.   fix2-runB.sh <work dir>
W="$1"; R=tools/botlab/run.sh; J=tools/botlab/jobs/batch5/bluestone
export BOTLAB_OUT=/Users/danielosling/Desktop/1/inkwave-upstream/.botlab SLOTS=3
mkdir -p "$W"
pt() { WATCHDOG=900000 ERA=$1 MAP=${4:-bluestone} MODE=$2 PAGE=$3 $R tools/botlab/page.cjs; }
for e in 1 2 3; do pt $e turf $J/ink-regions.js > "$W/regions$e.log" 2>&1; echo "### ink-regions era $e"; grep -E '^PASS|^FAIL|^RESULT|WATCHDOG' "$W/regions$e.log" | cut -c1-2600; done
for e in 1 2; do mkdir -p "$W/tc$e"; ERA=$e MAP=bluestone OUT="$W/tc$e" $R tools/botlab/tower-check.cjs > "$W/towercheck$e.log" 2>&1
  echo "### tower-check era $e"; grep -vE '^     run ' "$W/towercheck$e.log" | grep -E '^== |holes|clearance|ride |RESULT_JSON|WATCHDOG|CONSOLE' | cut -c1-400; done
for k in 1 2; do WATCHDOG=900000 MAP=halyard MODE=boss PAGE=$J/boss-check.js $R tools/botlab/page.cjs > "$W/bossH$k.log" 2>&1; echo "### boss Halyard $k"; grep -E '^PASS|^FAIL|^RESULT|WATCHDOG' "$W/bossH$k.log" | grep -E 'roam|idle|moves|home ground \(|RESULT' | cut -c1-500; done
echo "### done $(date)"
