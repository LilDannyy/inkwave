#!/bin/bash
# kind: tests
# after: JOB-8
# Highmark Foundry, fix round 7 (after review 7), the final code: no roof slide into the lava (actor._roofLandWet), rule 44
# with air steering and the crown's NE / NW edges closed, the Mitts leap (no leap off a roof; the air guard never steers a
# kit leap). check-maps every caldera variant; lava-audit (all rules), lava-leap, lava-notch; lava-bots once (its deaths'
# trails printed); lava.js x2; boss-check x5; two Zone Control matches; lava-karp; net-lava alone at the end.
R=tools/botlab/run.sh
J="$JOB_OUT"
pg() { # name page args mode
  MAP=caldera MODE=${4:-turf} PAGE=$2 PAGE_ARGS="$3" WATCHDOG=900000 $R tools/botlab/page.cjs > "$J/$1.log" 2>&1
}
sum() { # name -> its RESULT / FAIL / harness lines
  { echo "### $1"; grep -E '^RESULT|^FAIL|HARNESS|WATCHDOG|console errors|FRAME ERRORS' "$J/$1.log" | cut -c1-600 | head -30; } > "$J/$1.txt"
}
echo "== check-maps, every caldera variant"
{ echo "### check-maps"; for v in caldera caldera.zones caldera.tower caldera.practice caldera.bazookarp caldera.boss caldera.attract caldera.karp; do node build/check-maps.mjs $v 2>&1 | grep -E "^caldera|rule|problem|FAIL|Error" | head -4; done; } > "$J/checkmaps.txt"
echo "== lava-audit (all rules), lava-leap, lava-notch"
pg audit tools/botlab/tests/lava-audit.js '' & pg leap tools/botlab/tests/lava-leap.js '' & pg notch tools/botlab/tests/lava-notch.js '' & wait
sum audit; grep -E '^(PASS|FAIL) rule (44:|47:|25:|21:)' "$J/audit.log" | cut -c1-700 >> "$J/audit.txt"
grep -E '^(PASS|FAIL) rule 44 \(information\): running jumps off rider' "$J/audit.log" | cut -c1-900 >> "$J/audit.txt"
sum leap; sum notch
echo "== lava-bots, lava.js x2"
pg lavabots-1 tools/botlab/tests/lava-bots.js '' & pg lavajs-1 tools/botlab/tests/lava.js '' & pg lavajs-2 tools/botlab/tests/lava.js '' & wait
sum lavabots-1; grep -E '^(PASS|FAIL) (ledges|stones|edges) |^(PASS|FAIL) the gate' "$J/lavabots-1.log" | grep -v '"lavaDeaths":0' | cut -c1-3500 >> "$J/lavabots-1.txt"
for n in 1 2; do sum lavajs-$n; grep -E '^(PASS|FAIL) F10' "$J/lavajs-$n.log" | sed 's/"trails":.*//' | cut -c1-500 >> "$J/lavajs-$n.txt"; done
echo "== boss-check x5 (3 + 2), two Zone Control matches, lava-karp"
pg boss-1 tools/botlab/jobs/stretch/boss-check.js '' boss & pg boss-2 tools/botlab/jobs/stretch/boss-check.js '' boss & pg boss-3 tools/botlab/jobs/stretch/boss-check.js '' boss & wait
pg boss-4 tools/botlab/jobs/stretch/boss-check.js '' boss & pg boss-5 tools/botlab/jobs/stretch/boss-check.js '' boss & pg karp tools/botlab/tests/lava-karp.js '' bazookarp & wait
for n in 1 2 3 4 5; do sum boss-$n; done; sum karp
pg zones-1 tools/botlab/tests/lava-match.js 'mode=zones' & pg zones-2 tools/botlab/tests/lava-match.js 'mode=zones' & wait
{ for n in zones-1 zones-2; do echo "### $n"; grep -E '^PASS|^FAIL|^RESULT|HARNESS' "$J/$n.log" | cut -c1-700; done; } > "$J/matches.txt"
echo "== net-lava alone"
WIPSTAGES=1 CLIENTS=2 NET=tools/botlab/tests/net-lava.cjs $R tools/botlab/netpage.cjs > "$J/netlava.log" 2>&1
{ echo "### net-lava"; grep -E '^PASS|^FAIL|^RESULT|console|HARNESS|WATCHDOG' "$J/netlava.log" | cut -c1-400; } > "$J/netlava.txt"
echo "== SUMMARY"
for f in "$J"/*.txt; do grep -hE '^### |^RESULT|ok$' "$f"; done
