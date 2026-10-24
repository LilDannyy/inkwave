#!/bin/bash
# kind: tests
# after: JOB-13
# Highmark Foundry, fix round 8: lava.js three more times (JOB-12's lavajs-2 missed F8c once — race 7, one node of 76 not
# up within 4 s, no death; 3 local runs and JOB-12's lavajs-1 passed it) and boss-check (the idle spot recorded) three more.
R=tools/botlab/run.sh
J="$JOB_OUT"
pg() { # name page args mode
  MAP=caldera MODE=${4:-turf} PAGE=$2 PAGE_ARGS="$3" WATCHDOG=900000 $R tools/botlab/page.cjs > "$J/$1.log" 2>&1
}
B=tools/botlab/jobs/batch5/caldera/boss-idle.js
echo "== lava.js x3"
pg lavajs-3 tools/botlab/tests/lava.js '' & pg lavajs-4 tools/botlab/tests/lava.js '' & pg lavajs-5 tools/botlab/tests/lava.js '' & wait
echo "== boss-check x3"
pg boss-6 $B '' boss & pg boss-7 $B '' boss & pg boss-8 $B '' boss & wait
for n in lavajs-3 lavajs-4 lavajs-5 boss-6 boss-7 boss-8; do { echo "### $n"; grep -E '^RESULT|^FAIL|HARNESS|WATCHDOG|console errors' "$J/$n.log" | cut -c1-400; grep -E '^(PASS|FAIL) F8c' "$J/$n.log" | grep -oE '"n":[0-9]+,"died":[0-9]+,"notUp":[0-9]+|"slowest":[0-9.]+' | tr '\n' ' '; grep -oE '"maxIdle_s":[0-9]+' "$J/$n.log"; } > "$J/$n.txt"; done
echo "== SUMMARY"
for f in "$J"/*.txt; do cat "$f"; done
