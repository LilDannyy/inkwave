#!/bin/bash
# kind: tests
# Highmark Foundry, fix round 8: lava.js three more times with F8b / F8c printed case by case (JOB-14's lavajs-3 and -5 missed
# F8b, JOB-12's lavajs-2 F8c; 5 local runs this round passed both) — to see which case and how.
R=tools/botlab/run.sh
J="$JOB_OUT"
pg() { # name page args mode
  MAP=caldera MODE=${4:-turf} PAGE=$2 PAGE_ARGS="$3" WATCHDOG=900000 $R tools/botlab/page.cjs > "$J/$1.log" 2>&1
}
echo "== lava.js x3"
pg lavajs-6 tools/botlab/tests/lava.js '' & pg lavajs-7 tools/botlab/tests/lava.js '' & pg lavajs-8 tools/botlab/tests/lava.js '' & wait
for n in lavajs-6 lavajs-7 lavajs-8; do { echo "### $n"; grep -E '^RESULT|^FAIL|HARNESS|WATCHDOG|console errors' "$J/$n.log" | cut -c1-200; node tools/botlab/jobs/batch5/caldera/f8.cjs "$J/$n.log"; } > "$J/$n.txt"; done
echo "== SUMMARY"
for f in "$J"/*.txt; do cat "$f"; done
