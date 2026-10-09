#!/bin/bash
# Bluestone blockout fix round 2: the Electron runs, LOCALLY, one at a time through the shared slot lock (the Mac mini
# is unavailable from 10-09). Scratch.   fix2-local.sh <work dir> [phases: e.g. "ink spawn tower boss tests regions modes"]
#   ink     Turf War 180 s, 4 per era (locked) + 4 on Halyard: both teams' ink (the review's blocker)
#   spawn   spawn-mid.js per era
#   tower   tower-check per era (pieces, holes, clearance, both rides, the rail picture)
#   boss    the era-2 boss check, twice
#   tests   size-budget, stage-audit (turf, tower), climb-audit, cover-map per era
#   regions ink-regions.js per era (where the bots leave the floor bare)
#   modes   Zone Control (era 1 and 3, DIAG) and a tower-match (era 1)
W="$1"; PH="${2:-ink spawn tower boss tests regions modes}"; R=tools/botlab/run.sh; J=tools/botlab/jobs/batch5/bluestone
export BOTLAB_OUT=/Users/danielosling/Desktop/1/inkwave-upstream/.botlab SLOTS=3
mkdir -p "$W"
has() { case " $PH " in *" $1 "*) return 0;; esac; return 1; }
pt() { WATCHDOG=900000 ERA=$1 MAP=${4:-bluestone} MODE=$2 PAGE=$3 $R tools/botlab/page.cjs; }
line() { grep -E '^== |^   stuck |^   held |^   splats by cause|^   DIAG|^CONSOLE|^  \[|FRAME ERRORS|WATCHDOG|HARNESS|MAP MISMATCH' "$1" | grep -v 'no lightmap' | cut -c1-300 | head -12; }
if has ink; then
  for k in a b c d; do
    for e in 1 2 3; do ERA=$e MAP=bluestone MODE=turf SECS=180 DIAG=1 $R tools/botlab/match.cjs > "$W/turf$e$k.log" 2>&1; echo "### turf$e$k"; line "$W/turf$e$k.log"; done
    MAP=halyard MODE=turf SECS=180 $R tools/botlab/match.cjs > "$W/turfH$k.log" 2>&1; echo "### turfH$k"; line "$W/turfH$k.log"
  done
fi
if has spawn; then for e in 1 2 3; do pt $e turf tools/botlab/tests/spawn-mid.js > "$W/spawn-mid$e.log" 2>&1; echo "### spawn-mid era $e"; grep -E '^PASS|^FAIL|^RESULT|WATCHDOG' "$W/spawn-mid$e.log" | cut -c1-400; done; fi
if has tower; then
  for e in 1 2 3; do mkdir -p "$W/tc$e"; ERA=$e MAP=bluestone OUT="$W/tc$e" $R tools/botlab/tower-check.cjs > "$W/towercheck$e.log" 2>&1
    echo "### tower-check era $e"; grep -vE '^     run ' "$W/towercheck$e.log" | grep -E '^== |holes|clearance|ride |RESULT_JSON|WATCHDOG|CONSOLE' | cut -c1-400; done
fi
if has boss; then for k in 1 2; do pt 2 boss $J/boss-check.js > "$W/boss$k.log" 2>&1; echo "### boss$k"; grep -E '^PASS|^FAIL|^RESULT|WATCHDOG' "$W/boss$k.log" | cut -c1-700; done; fi
if has tests; then
  for e in 1 2 3; do
    for t in size-budget climb-audit cover-map; do pt $e turf tools/botlab/tests/$t.js > "$W/$t$e.log" 2>&1; echo "### $t era $e"; grep -E '^PASS|^FAIL|^RESULT|WATCHDOG' "$W/$t$e.log" | sed 's/"b64":"[^"]*"/"b64":…/' | cut -c1-500; done
    for m in turf tower; do pt $e $m tools/botlab/tests/stage-audit.js > "$W/stage-audit-$m$e.log" 2>&1; echo "### stage-audit $m era $e"; grep -E '^FAIL|^RESULT|WATCHDOG' "$W/stage-audit-$m$e.log" | cut -c1-400; done
  done
fi
if has regions; then for e in 1 2 3; do pt $e turf $J/ink-regions.js > "$W/regions$e.log" 2>&1; echo "### ink-regions era $e"; grep -E '^PASS|^FAIL|^RESULT|WATCHDOG' "$W/regions$e.log" | cut -c1-2600; done; fi
if has modes; then
  for e in 1 3; do ERA=$e MAP=bluestone MODE=zones DIAG=1 $R tools/botlab/match.cjs > "$W/zones$e.log" 2>&1; echo "### zones$e"; line "$W/zones$e.log"; done
  ERA=1 MAP=bluestone $R tools/botlab/tower-match.cjs > "$W/towermatch1.log" 2>&1; echo "### towermatch1"; line "$W/towermatch1.log"; grep -E '^RESULT_JSON' "$W/towermatch1.log" | cut -c1-300
fi
echo "### done $(date)"
