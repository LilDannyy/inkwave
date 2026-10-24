#!/bin/bash
# kind: tests
# after: JOB-6
# Highmark Foundry, fix round 6, the final head (after JOB-6): an escape keeps its footwork through the device shooting,
# the danger guard and the kits' botAct (stageRoute). lava.js x3, lava-bots x2 (their deaths' trails printed), two Zone
# Control matches and one Turf War match (lava-match.js), net-lava alone, lava-karp once.
R=tools/botlab/run.sh
J="$JOB_OUT"
pg() { # name page args mode
  MAP=caldera MODE=${4:-turf} PAGE=$2 PAGE_ARGS="$3" WATCHDOG=900000 $R tools/botlab/page.cjs > "$J/$1.log" 2>&1
}
sum() { # name -> its RESULT / FAIL / harness lines
  { echo "### $1"; grep -E '^RESULT|^FAIL|HARNESS|WATCHDOG|console errors|FRAME ERRORS' "$J/$1.log" | cut -c1-600 | head -30; } > "$J/$1.txt"
}
echo "== lava.js x3 (parallel)"
pg lavajs-1 tools/botlab/tests/lava.js '' & pg lavajs-2 tools/botlab/tests/lava.js '' & pg lavajs-3 tools/botlab/tests/lava.js '' & wait
for n in 1 2 3; do sum lavajs-$n; grep -E '^(PASS|FAIL) F10' "$J/lavajs-$n.log" | sed 's/"trails":.*//' | cut -c1-500 >> "$J/lavajs-$n.txt"; done
echo "== lava-bots, two Zone Control matches"
pg lavabots-1 tools/botlab/tests/lava-bots.js '' & pg zones-1 tools/botlab/tests/lava-match.js 'mode=zones' & pg zones-2 tools/botlab/tests/lava-match.js 'mode=zones' & wait
echo "== lava-bots again, one Turf War match, lava-karp"
pg lavabots-2 tools/botlab/tests/lava-bots.js '' & pg turf-1 tools/botlab/tests/lava-match.js 'mode=turf;secs=180' & pg karp tools/botlab/tests/lava-karp.js '' bazookarp & wait
for n in 1 2; do sum lavabots-$n; grep -E '^(PASS|FAIL) (ledges|stones|edges) ' "$J/lavabots-$n.log" | grep -v '"lavaDeaths":0' | cut -c1-3500 >> "$J/lavabots-$n.txt"; done
sum karp
{ for n in zones-1 zones-2 turf-1; do echo "### $n"; grep -E '^PASS|^FAIL|^RESULT|HARNESS' "$J/$n.log" | cut -c1-700; done; } > "$J/matches.txt"
echo "== net-lava alone"
WIPSTAGES=1 CLIENTS=2 NET=tools/botlab/tests/net-lava.cjs $R tools/botlab/netpage.cjs > "$J/netlava.log" 2>&1
{ echo "### net-lava"; grep -E '^PASS|^FAIL|^RESULT|console|HARNESS|WATCHDOG' "$J/netlava.log" | cut -c1-400; } > "$J/netlava.txt"
echo "== SUMMARY"
for f in "$J"/*.txt; do grep -hE '^### |^RESULT' "$f"; done
