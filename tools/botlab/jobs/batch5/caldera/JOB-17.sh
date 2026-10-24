#!/bin/bash
# kind: tests
# after: JOB-16
# Highmark Foundry, fix round 9: lava.js x3 at the corrected G9 (JOB-16's head 458231a9 judged a hidden HUD line by its
# leftover is-rescue class; G9 now reads a shown one: is-on and is-rescue) — G9 and F8c printed with their trails.
R=tools/botlab/run.sh
J="$JOB_OUT"
pg() { # name page args mode
  MAP=caldera MODE=${4:-turf} PAGE=$2 PAGE_ARGS="$3" WATCHDOG=900000 $R tools/botlab/page.cjs > "$J/$1.log" 2>&1
}
echo "== lava.js x3"
pg lavajs-4 tools/botlab/tests/lava.js '' & pg lavajs-5 tools/botlab/tests/lava.js '' & pg lavajs-6 tools/botlab/tests/lava.js '' & wait
for n in lavajs-4 lavajs-5 lavajs-6; do { echo "### $n"; grep -E '^RESULT|^FAIL|HARNESS|WATCHDOG|console errors' "$J/$n.log" | cut -c1-300; grep -E '^(PASS|FAIL) (G9|F8c)' "$J/$n.log" | cut -c1-900; } > "$J/$n.txt"; done
echo "== SUMMARY"
for f in "$J"/*.txt; do grep -hE '^### |^RESULT' "$f"; done
