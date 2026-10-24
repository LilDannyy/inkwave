#!/bin/bash
# kind: tests
# Highmark Foundry, fix round 8 (after review 8): the audit and the reviewer's probes at the round's code. lava-audit in five
# parts (the widened rule 47 alone runs ~25 min locally; the 15 min watchdog): rules 14/21/22/25/38/42/45/46, rule 44 (the
# steered march off every take-off, the finer look, the 14 m margin), rule 47 a/c/d, rule 47 b at LOW/HIGH/rise 30 % and at
# rise 60/90 %, fall 50 %. Review 8's probes (copied into rev8/ as they were, and probe-hold8w: probe-hold8 with its Mitts
# leaps watched 3 s after landing as its header says): probe-roof8, probe-hold8 (+w), probe-perch8, probe-steer8 HIGH and
# LOW, probe-steer8-local. Then lava-leap, lava-notch.
R=tools/botlab/run.sh
J="$JOB_OUT"
V=tools/botlab/jobs/batch5/caldera/rev8
A=tools/botlab/tests/lava-audit.js
pg() { # name page args mode
  MAP=caldera MODE=${4:-turf} PAGE=$2 PAGE_ARGS="$3" WATCHDOG=900000 $R tools/botlab/page.cjs > "$J/$1.log" 2>&1
}
sum() { # name -> its RESULT / FAIL / harness lines
  { echo "### $1"; grep -E '^RESULT|^FAIL|HARNESS|WATCHDOG|console errors|FRAME ERRORS' "$J/$1.log" | cut -c1-700 | head -30; } > "$J/$1.txt"
}
echo "== check-maps, every caldera variant"
{ echo "### check-maps"; for v in caldera caldera.zones caldera.tower caldera.practice caldera.bazookarp caldera.boss caldera.attract caldera.karp; do node build/check-maps.mjs $v 2>&1 | grep -E "^caldera|rule|problem|FAIL|Error" | head -4; done; } > "$J/checkmaps.txt"
echo "== audit: rules 14 21 22 25 38 42 45 46 / 44 / 47 a,c,d"
pg audit-rest $A 'rules=14,21,22,25,38,42,45,46' & pg audit-44 $A 'rules=44' & pg audit-47acd $A 'rules=47;r47=a,c,d' & wait
echo "== audit: rule 47 b (two halves); probe-roof8"
pg audit-47b1 $A 'rules=47;r47=b;r47lv=low,high,r30' & pg audit-47b2 $A 'rules=47;r47=b;r47lv=r60,r90,f50' & pg roof8 $V/probe-roof8.js '' & wait
echo "== probe-hold8, probe-hold8w, probe-perch8"
pg hold8 $V/probe-hold8.js '' & pg hold8w $V/probe-hold8w.js '' & pg perch8 $V/probe-perch8.js '' & wait
echo "== probe-steer8 HIGH / LOW, probe-steer8-local"
pg steer8-high $V/probe-steer8.js 'lv=high;hd=16;sf=4,8,12;st=45,90' & pg steer8-low $V/probe-steer8.js 'lv=low;hd=16;sf=4,8,12;st=45,90' & pg steer8-local $V/probe-steer8-local.js '' & wait
echo "== lava-leap, lava-notch"
pg leap tools/botlab/tests/lava-leap.js '' & pg notch tools/botlab/tests/lava-notch.js '' & wait
for n in audit-rest audit-44 audit-47acd audit-47b1 audit-47b2 roof8 hold8 hold8w perch8 steer8-high steer8-low steer8-local leap notch; do sum $n; done
# (the numbers: rule 44's gate row and rule 47's totals; each probe's verdict rows, cut)
for n in audit-44; do grep -E '^(PASS|FAIL) rule 44: a plain' "$J/$n.log" | sed 's/"low":{"n".*//' | cut -c1-1500 >> "$J/$n.txt"; done
for n in audit-47acd audit-47b1 audit-47b2; do grep -E '^(PASS|FAIL) rule 47' "$J/$n.log" | grep -o '"total":{[^}]*}' >> "$J/$n.txt"; done
for n in roof8 hold8 hold8w perch8 steer8-high steer8-low steer8-local; do grep -E '^(PASS|FAIL)' "$J/$n.log" | cut -c1-900 >> "$J/$n.txt"; done
echo "== SUMMARY"
for f in "$J"/*.txt; do grep -hE '^### |^RESULT' "$f"; done
