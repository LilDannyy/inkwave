#!/bin/bash
# Bluestone blockout fix round 3: the Electron runs, LOCALLY, one at a time through the shared slot lock (the Mac mini
# is unavailable from 10-09). Scratch.   fix3-local.sh <work dir> [phases]
#   ink      Turf War ink: match.cjs era 3 ×N (the pass line) and ink-regions per era (where the bots ink)
#   tests    spawn-mid, size-budget, stage-audit (turf, tower), climb-audit, cover-map per era; Halyard's cover map
#   tower    tower-check per era (pieces, holes, clearance, both rides, the rail picture)
#   modes    Zone Control eras 1, 2, 3 and a fourth (era 3), Halyard Zone Control; tower-match eras 1, 2, 3 and a fourth
#   boss     the era-2 boss check, twice
#   perf     shoot.cjs REPORT at load per era and on Halyard (day, top + play)
W="$1"; PH="${2:-tests tower modes boss perf}"; R=tools/botlab/run.sh; J=tools/botlab/jobs/batch5/bluestone
export BOTLAB_OUT=/Users/danielosling/Desktop/1/inkwave-upstream/.botlab SLOTS=3
mkdir -p "$W"
has() { case " $PH " in *" $1 "*) return 0;; esac; return 1; }
pt() { WATCHDOG=900000 ERA=$1 MAP=${4:-bluestone} MODE=$2 PAGE=$3 $R tools/botlab/page.cjs; }
line() { grep -E '^== |^   stuck |^   held |^   neutral|^   captures|^   splats by cause|^   DIAG|^   checkpoints|^   knockout|^CONSOLE|^  \[|FRAME ERRORS|WATCHDOG|HARNESS|MAP MISMATCH' "$1" | grep -v 'no lightmap' | cut -c1-300 | head -16; }
if has ink; then
  for k in ${INK_TAGS:-a b c d e f g h}; do ERA=3 MAP=bluestone MODE=turf SECS=180 DIAG=1 $R tools/botlab/match.cjs > "$W/turf3$k.log" 2>&1; echo "### turf3$k"; line "$W/turf3$k.log" | head -3; done
  for e in ${REG_ERAS:-1 2 3}; do for k in ${REG_TAGS:-a b}; do pt $e turf $J/ink-regions.js > "$W/regions$e$k.log" 2>&1; echo "### ink-regions era $e $k"; grep -E '^PASS ink|^FAIL|WATCHDOG' "$W/regions$e$k.log" | cut -c1-1600; done; done
fi
if has tests; then
  for e in 1 2 3; do
    for t in spawn-mid size-budget climb-audit cover-map; do pt $e turf tools/botlab/tests/$t.js > "$W/$t$e.log" 2>&1; echo "### $t era $e"; grep -E '^PASS|^FAIL|^RESULT|WATCHDOG' "$W/$t$e.log" | sed 's/"b64":"[^"]*"/"b64":…/' | cut -c1-500; done
    for m in turf tower; do pt $e $m tools/botlab/tests/stage-audit.js > "$W/stage-audit-$m$e.log" 2>&1; echo "### stage-audit $m era $e"; grep -E '^FAIL|^RESULT|WATCHDOG' "$W/stage-audit-$m$e.log" | cut -c1-400; done
  done
  pt 1 turf tools/botlab/tests/cover-map.js halyard > "$W/cover-mapH.log" 2>&1; echo "### cover-map Halyard"; grep -E '^RESULT|WATCHDOG' "$W/cover-mapH.log" | cut -c1-300
fi
if has tower; then
  for e in 1 2 3; do mkdir -p "$W/tc$e"; ERA=$e MAP=bluestone OUT="$W/tc$e" $R tools/botlab/tower-check.cjs > "$W/towercheck$e.log" 2>&1
    echo "### tower-check era $e"; grep -vE '^     run ' "$W/towercheck$e.log" | grep -E '^== |holes|clearance|ride |RESULT_JSON|WATCHDOG|CONSOLE' | cut -c1-500; done
fi
if has modes; then
  for c in 1 2 3 3b; do e=${c:0:1}; ERA=$e MAP=bluestone MODE=zones DIAG=1 $R tools/botlab/match.cjs > "$W/zones$c.log" 2>&1; echo "### zones era $c"; line "$W/zones$c.log"; done
  MAP=halyard MODE=zones $R tools/botlab/match.cjs > "$W/zonesH.log" 2>&1; echo "### zones Halyard"; line "$W/zonesH.log"
  for c in 1 2 3 1b; do e=${c:0:1}; ERA=$e MAP=bluestone $R tools/botlab/tower-match.cjs > "$W/towermatch$c.log" 2>&1; echo "### tower-match era $c"; line "$W/towermatch$c.log"; grep -E '^RESULT_JSON' "$W/towermatch$c.log" | cut -c1-400; done
fi
if has boss; then for k in 1 2; do pt 2 boss $J/boss-check.js > "$W/boss$k.log" 2>&1; echo "### boss$k"; grep -E '^PASS|^FAIL|^RESULT|WATCHDOG' "$W/boss$k.log" | cut -c1-700; done; fi
if has perf; then
  for e in 1 2 3; do ERA=$e MAP=bluestone TIME=day MODE=turf OUT="$W/perf$e" SHOTS='top,play' $R tools/botlab/shoot.cjs > "$W/perf$e.log" 2>&1; echo "### perf era $e"; grep -E '^REPORT' "$W/perf$e.log" | cut -c1-400; done
  MAP=halyard TIME=day MODE=turf OUT="$W/perfH" SHOTS='top,play' $R tools/botlab/shoot.cjs > "$W/perfH.log" 2>&1; echo "### perf Halyard"; grep -E '^REPORT' "$W/perfH.log" | cut -c1-400
fi
echo "### done $(date)"
