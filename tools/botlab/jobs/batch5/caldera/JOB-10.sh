#!/bin/bash
# kind: tests
# after: JOB-9
# Highmark Foundry, fix round 7, the final code (after JOB-9): karpVeto gains the 4 gap pairs the crown moved (JOB-9's
# lava-karp K8). lava-karp; boss-check x10 with the idle spot recorded (jobs/batch5/caldera/boss-idle.js: JOB-9's boss-4
# stood still 46 s once, 9 local runs never over 6 s); net-lava alone at the end (the final head).
R=tools/botlab/run.sh
J="$JOB_OUT"
pg() { # name page args mode
  MAP=caldera MODE=${4:-turf} PAGE=$2 PAGE_ARGS="$3" WATCHDOG=900000 $R tools/botlab/page.cjs > "$J/$1.log" 2>&1
}
sum() { # name -> its RESULT / FAIL / harness lines
  { echo "### $1"; grep -E '^RESULT|^FAIL|HARNESS|WATCHDOG|console errors|FRAME ERRORS' "$J/$1.log" | cut -c1-600 | head -30; } > "$J/$1.txt"
}
B=tools/botlab/jobs/batch5/caldera/boss-idle.js
echo "== lava-karp, boss-idle x2"
pg karp tools/botlab/tests/lava-karp.js '' bazookarp & pg boss-1 $B '' boss & pg boss-2 $B '' boss & wait
sum karp; grep -E '^(PASS|FAIL) K8' "$J/karp.log" | cut -c1-400 >> "$J/karp.txt"
echo "== boss-idle x8 (3 + 3 + 2)"
pg boss-3 $B '' boss & pg boss-4 $B '' boss & pg boss-5 $B '' boss & wait
pg boss-6 $B '' boss & pg boss-7 $B '' boss & pg boss-8 $B '' boss & wait
pg boss-9 $B '' boss & pg boss-10 $B '' boss & wait
for n in 1 2 3 4 5 6 7 8 9 10; do sum boss-$n; grep -E '^(PASS|FAIL) it never|^PASS \(information\) seconds' "$J/boss-$n.log" | sed 's/"brainKeys":.*//' | cut -c1-900 >> "$J/boss-$n.txt"; done
echo "== net-lava alone"
WIPSTAGES=1 CLIENTS=2 NET=tools/botlab/tests/net-lava.cjs $R tools/botlab/netpage.cjs > "$J/netlava.log" 2>&1
{ echo "### net-lava"; grep -E '^PASS|^FAIL|^RESULT|console|HARNESS|WATCHDOG' "$J/netlava.log" | cut -c1-400; } > "$J/netlava.txt"
echo "== SUMMARY"
for f in "$J"/*.txt; do grep -hE '^### |^RESULT' "$f"; done
