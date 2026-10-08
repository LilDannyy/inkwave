#!/bin/bash
# Bluestone Junction blockout page tests, one era per call, one Electron at a time (scratch):  tests.sh <era> <work dir>
#   spawn-mid, size-budget, stage-audit (turf and tower), climb-audit, cover-map (+ its open stretches and picture)
E="$1"; W="$2"; R=tools/botlab/run.sh
mkdir -p "$W"
pt() { WATCHDOG=900000 ERA=$E MAP=${3:-bluestone} MODE=$2 PAGE=tools/botlab/tests/$1.js $R tools/botlab/page.cjs > "$W/$1-$2-era$E.log" 2>&1; }
pt spawn-mid turf; pt size-budget turf; pt stage-audit turf; pt stage-audit tower; pt climb-audit turf; pt cover-map turf
for f in spawn-mid-turf size-budget-turf stage-audit-turf stage-audit-tower climb-audit-turf; do
  echo "### $f era $E"; grep -E '^PASS|^FAIL|^RESULT|WATCHDOG' "$W/$f-era$E.log" | cut -c1-500
done
echo "### cover-map era $E"; grep -E '^RESULT|WATCHDOG' "$W/cover-map-turf-era$E.log"
python3 tools/botlab/jobs/batch5/bluestone/cover-stretches.py "$W/cover-map-turf-era$E.log" "era $E" | head -3
(cd tools/botlab/jobs/batch5/bluestone && ERA=$E node --import ./three-hook.mjs cover-stretches.mjs "$W/cover-map-turf-era$E.log" | head -12)
python3 tools/botlab/cover-map.py "$W/cover-map-turf-era$E.log" "$W/cover-era$E.png" "Bluestone Junction, era $E: distance to cover (cover-map.js)" > /dev/null
