#!/bin/bash
# kind: tests
# after: JOB-12
# Highmark Foundry, fix round 8: the widened rule 47 again after 4c61604c (no steer-back on tops no kid reaches: JOB-11's
# rule 47 b deaths were steer-backs off the outer caldera walls) and rule 44, with their numbers (nums.cjs) — rule 44 /
# rule 47 a,c,d / rule 47 b at LOW, HIGH, rise 30 % / rule 47 b at rise 60 / 90 %, fall 50 %.
R=tools/botlab/run.sh
J="$JOB_OUT"
A=tools/botlab/tests/lava-audit.js
N=tools/botlab/jobs/batch5/caldera/nums.cjs
pg() { # name page args mode
  MAP=caldera MODE=${4:-turf} PAGE=$2 PAGE_ARGS="$3" WATCHDOG=900000 $R tools/botlab/page.cjs > "$J/$1.log" 2>&1
}
echo "== rule 44, rule 47 a/c/d, rule 47 b (1)"
pg audit-44 $A 'rules=44' & pg audit-47acd $A 'rules=47;r47=a,c,d' & pg audit-47b1 $A 'rules=47;r47=b;r47lv=low,high,r30' & wait
echo "== rule 47 b (2)"
pg audit-47b2 $A 'rules=47;r47=b;r47lv=r60,r90,f50'
for n in audit-44 audit-47acd audit-47b1 audit-47b2; do { echo "### $n"; grep -E '^RESULT|^FAIL|HARNESS|WATCHDOG|console errors' "$J/$n.log" | cut -c1-200; node $N "$J/$n.log" | cut -c1-330; } > "$J/$n.txt"; done
echo "== SUMMARY"
for f in "$J"/*.txt; do grep -hE '^### |^RESULT|^## ' "$f"; done
