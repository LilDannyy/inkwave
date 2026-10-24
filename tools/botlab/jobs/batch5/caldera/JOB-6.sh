#!/bin/bash
# kind: tests
# Highmark Foundry, fix round 6, second pass (after JOB-5): the proofs again at the head with the lookout's busy release
# counting only time without headway (F10), the escape's route kept in a fight (stageRoute: the Zone Control death), the
# boss's kept crossing and its wedge turns. lava.js x3, boss-check x5, net-lava alone, lava-bots x2 (its deaths' trails
# printed), two Zone Control matches and one Turf War match (lava-match.js).
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
echo "== boss-check x5 (3 + 2)"
pg boss-1 tools/botlab/jobs/stretch/boss-check.js '' boss & pg boss-2 tools/botlab/jobs/stretch/boss-check.js '' boss & pg boss-3 tools/botlab/jobs/stretch/boss-check.js '' boss & wait
pg boss-4 tools/botlab/jobs/stretch/boss-check.js '' boss & pg boss-5 tools/botlab/jobs/stretch/boss-check.js '' boss & wait
{ for n in 1 2 3 4 5; do echo "### boss-$n"; grep -E '^RESULT|^FAIL|it roams|seconds on each half|idle|HARNESS' "$J/boss-$n.log" | sed 's/"trail":.*//' | cut -c1-300; done; } > "$J/boss.txt"
echo "== net-lava alone"
WIPSTAGES=1 CLIENTS=2 NET=tools/botlab/tests/net-lava.cjs $R tools/botlab/netpage.cjs > "$J/netlava.log" 2>&1
{ echo "### net-lava"; grep -E '^PASS|^FAIL|^RESULT|console|HARNESS|WATCHDOG' "$J/netlava.log" | cut -c1-400; } > "$J/netlava.txt"
echo "== lava-bots, two Zone Control matches"
pg lavabots-1 tools/botlab/tests/lava-bots.js '' & pg zones-1 tools/botlab/tests/lava-match.js 'mode=zones' & pg zones-2 tools/botlab/tests/lava-match.js 'mode=zones' & wait
echo "== lava-bots again, one Turf War match"
pg lavabots-2 tools/botlab/tests/lava-bots.js '' & pg turf-1 tools/botlab/tests/lava-match.js 'mode=turf;secs=180' & wait
for n in 1 2; do sum lavabots-$n; grep -E '^(PASS|FAIL) (ledges|stones|edges) ' "$J/lavabots-$n.log" | grep -v '"lavaDeaths":0' | cut -c1-3500 >> "$J/lavabots-$n.txt"; done
{ for n in zones-1 zones-2 turf-1; do echo "### $n"; grep -E '^PASS|^FAIL|^RESULT|HARNESS' "$J/$n.log" | cut -c1-700; done; } > "$J/matches.txt"
echo "== SUMMARY"
for f in "$J"/*.txt; do grep -hE '^### |^RESULT' "$f"; done
