#!/bin/bash
# Bluestone blockout round C (scratch): the Electron runs, LOCALLY, one at a time through the shared slot lock (the Mac
# mini is unavailable).   rc-local.sh <work dir> "<phases>"   (ERAS="1 2 3" by default)
#   tower    tower-check per era (pieces, holes, clearance, both rides, the rail picture)
#   tests    spawn-mid, size-budget, climb-audit, cover-map, stage-audit (turf, tower) per era
#   others   Halyard's and Crossroads Market's cover maps (the comparison)
#   ink      Turf War ink: match.cjs era 3 × INK_N (default 4)
#   regions  rc-ink-regions.js per era in ERAS × REG_N (default 2)
#   zones    Zone Control: match.cjs MODE=zones per era in ERAS
#   tmatch   tower-match per era in ERAS
#   boss     the era-2 boss check
#   perfH    Halyard's shoot.cjs REPORT at load (the pictures' runs give Bluestone's)
W="$1"; PH="$2"; ERAS="${ERAS:-1 2 3}"; R=tools/botlab/run.sh; J=tools/botlab/jobs/batch5/bluestone
cd "$(dirname "$0")/../../../../.." || exit 1
export BOTLAB_OUT=/Users/danielosling/Desktop/1/inkwave-upstream/.botlab SLOTS=3
mkdir -p "$W"
echo "# head $(git rev-parse --short HEAD)"
has() { case " $PH " in *" $1 "*) return 0;; esac; return 1; }
pt() { WATCHDOG=900000 ERA=$1 MAP=${4:-bluestone} MODE=$2 PAGE=$3 $R tools/botlab/page.cjs; }
line() { grep -E '^== |^   stuck |^   held |^   neutral|^   captures|^   splats by cause|^   DIAG|^   checkpoints|^   knockout|^CONSOLE|^  \[|FRAME ERRORS|WATCHDOG|HARNESS|MAP MISMATCH' "$1" | grep -v 'no lightmap' | cut -c1-300 | head -16; }
st() { echo "--- $(date +%H:%M:%S) $*"; }
if has tower; then for e in $ERAS; do st tower-check $e; mkdir -p "$W/tc$e"; WATCHDOG=900000 ERA=$e MAP=bluestone OUT="$W/tc$e" $R tools/botlab/tower-check.cjs > "$W/towercheck$e.log" 2>&1
  echo "### tower-check era $e"; grep -vE '^     run ' "$W/towercheck$e.log" | grep -E '^== |holes|clearance|ride |RESULT_JSON|WATCHDOG|CONSOLE' | cut -c1-400; done; fi
if has tests; then for e in $ERAS; do
  for t in spawn-mid size-budget climb-audit cover-map; do st $t $e; pt $e turf tools/botlab/tests/$t.js > "$W/$t$e.log" 2>&1; echo "### $t era $e"; grep -E '^PASS|^FAIL|^RESULT|WATCHDOG' "$W/$t$e.log" | sed 's/"b64":"[^"]*"/"b64":…/' | cut -c1-500; done
  for m in turf tower; do st stage-audit $m $e; pt $e $m tools/botlab/tests/stage-audit.js > "$W/stage-audit-$m$e.log" 2>&1; echo "### stage-audit $m era $e"; grep -E '^FAIL|^RESULT|WATCHDOG' "$W/stage-audit-$m$e.log" | cut -c1-400; done
done; fi
if has others; then for m in halyard crossmarket; do st cover-map $m; pt 1 turf tools/botlab/tests/cover-map.js $m > "$W/cover-map-$m.log" 2>&1; echo "### cover-map $m"; grep -E '^RESULT|^PASS|^FAIL|WATCHDOG' "$W/cover-map-$m.log" | sed 's/"b64":"[^"]*"/"b64":…/' | cut -c1-400; done; fi
if has ink; then for k in $(seq ${INK_K0:-1} ${INK_N:-4}); do st turf3 $k; ERA=3 MAP=bluestone MODE=turf SECS=180 DIAG=1 WATCHDOG=900000 $R tools/botlab/match.cjs > "$W/turf3r$k.log" 2>&1; echo "### turf3 r$k"; line "$W/turf3r$k.log" | head -4; done; fi
if has regions; then for e in $ERAS; do for k in $(seq 1 ${REG_N:-2}); do st regions $e $k; pt $e turf $J/rc-ink-regions.js > "$W/regions$e-$k.log" 2>&1; echo "### ink-regions era $e run $k"; grep -E '^PASS ink|^FAIL|WATCHDOG' "$W/regions$e-$k.log" | cut -c1-1600; done; done; fi
if has zones; then for e in $ERAS; do st zones $e; ERA=$e MAP=bluestone MODE=zones DIAG=1 WATCHDOG=900000 $R tools/botlab/match.cjs > "$W/zones$e.log" 2>&1; echo "### zones era $e"; line "$W/zones$e.log"; done; fi
if has tmatch; then for e in $ERAS; do st tower-match $e; ERA=$e MAP=bluestone WATCHDOG=900000 $R tools/botlab/tower-match.cjs > "$W/towermatch$e.log" 2>&1; echo "### tower-match era $e"; line "$W/towermatch$e.log"; grep -E '^RESULT_JSON' "$W/towermatch$e.log" | cut -c1-400; done; fi
if has boss; then st boss; pt 2 boss $J/boss-check.js > "$W/boss.log" 2>&1; echo "### boss"; grep -E '^PASS|^FAIL|^RESULT|WATCHDOG' "$W/boss.log" | cut -c1-700; fi
if has perfH; then st perf halyard; MAP=halyard TIME=day MODE=turf OUT="$W/perfH" SHOTS='top,play' $R tools/botlab/shoot.cjs > "$W/perfH.log" 2>&1; echo "### perf Halyard"; grep -E '^REPORT' "$W/perfH.log" | cut -c1-400; fi
st done
