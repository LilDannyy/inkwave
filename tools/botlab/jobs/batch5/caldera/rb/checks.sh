#!/bin/bash
# round B page checks, one Electron instance at a time under the shared lock: checks.sh [names…]
cd /Users/danielosling/Desktop/1/st-b5-caldera
export BOTLAB_OUT=/Users/danielosling/Desktop/1/inkwave-upstream/.botlab SLOTS=3 WATCHDOG=900000
S=/private/tmp/claude-501/-Users-danielosling-Desktop-1/dd09cb28-6f60-4591-8992-4f7ec6fb49a8/scratchpad/rb1; O=$S/logs
R=tools/botlab/run.sh
page() { local name=$1 lava=$2 mode=$3 test=$4; LAVA=$lava MAP=caldera MODE=$mode PAGE=tools/botlab/tests/$test $R tools/botlab/page.cjs > "$O/$name.log" 2>&1; echo "== $name: $(grep -E '^PASS|^FAIL|^RESULT' "$O/$name.log" | cut -c1-260 | tr '\n' ' ')"; }
want() { [ -z "$ALL" ] || [[ " $ALL " == *" $1 "* ]]; }
ALL="$*"
if want tower; then for L in low high; do LAVA=$L MAP=caldera RIDE=0 SHOTS=0 $R tools/botlab/tower-check.cjs > "$O/towercheck-$L.log" 2>&1; echo "== towercheck-$L: $(grep -E 'RESULT|holes|clearance|length' "$O/towercheck-$L.log" | cut -c1-300 | tr '\n' ' ')"; done; fi
for L in low high; do
  want spawn && page spawn-mid-$L $L turf spawn-mid.js
  want climb && page climb-audit-$L $L turf climb-audit.js
  want cover && page cover-map-$L $L turf cover-map.js
  want size && page size-budget-$L $L turf size-budget.js
done
want size && page size-budget-bazookarp-high high bazookarp size-budget.js
if want audit; then for M in turf zones tower; do page audit-$M low $M stage-audit.js; done; fi
if want rides; then LAVA=low MAP=caldera OUT=$S/tc $R tools/botlab/tower-check.cjs > "$O/towercheck-rides-low.log" 2>&1; echo "== rides: $(grep -E 'RESULT|ride|knock' "$O/towercheck-rides-low.log" | cut -c1-300 | tr '\n' ' ')"; fi
echo "RESULT checks done"
