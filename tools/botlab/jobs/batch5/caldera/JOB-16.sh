#!/bin/bash
# kind: tests
# Highmark Foundry, fix round 9 (after review 9): the round's code b083a41e and tests 35cee2be. check-maps every variant;
# lava-audit rule 47 in three parts (a,c,d | b,e at LOW, HIGH, r30 | b,e at r60, r90, f50: the corrected reach bar, the
# rescue from the kid's own move, the squid climbs); the audit's other rules and rule 44 at LOW / HIGH; lava.js x3 (G9, F8c's
# trail); lava-bots; Zone Control x2; boss-check caldera x5 and calamari / treehills / kelpline at this code and with int4's
# boss code (f687b4c2) for the baseline; review 9's own probes (wall9, held9 A/B/C, far9, land9); lava-karp; net-lava alone.
R=tools/botlab/run.sh
J="$JOB_OUT"
pg() { # name page args mode   (MAPID: the stage, caldera by default)
  MAP=${MAPID:-caldera} MODE=${4:-turf} PAGE=$2 PAGE_ARGS="$3" WATCHDOG=900000 $R tools/botlab/page.cjs > "$J/$1.log" 2>&1
}
sum() { # name -> its RESULT / FAIL / harness lines
  { echo "### $1"; grep -E '^RESULT|^FAIL|HARNESS|WATCHDOG|console errors|FRAME ERRORS' "$J/$1.log" | cut -c1-400 | head -12; } > "$J/$1.txt"
}
A=tools/botlab/tests/lava-audit.js
C=tools/botlab/jobs/batch5/caldera
B=tools/botlab/jobs/stretch/boss-check.js
echo "== check-maps, every caldera variant"
{ echo "### check-maps"; for v in caldera caldera.zones caldera.tower caldera.practice caldera.bazookarp caldera.boss caldera.attract caldera.karp; do node build/check-maps.mjs $v 2>&1 | grep -E "^caldera|rule|problem|FAIL|Error" | head -4; done; } > "$J/checkmaps.txt"
echo "== rule 47: a,c,d | b,e at low,high,r30 | b,e at r60,r90,f50"
pg r47acd $A 'rules=47;r47=a,c,d' & pg r47be1 $A 'rules=47;r47=b,e;r47lv=low,high,r30' & pg r47be2 $A 'rules=47;r47=b,e;r47lv=r60,r90,f50' & wait
for n in r47acd r47be1 r47be2; do sum $n; node $C/sum47.cjs "$J/$n.log" | cut -c1-700 >> "$J/$n.txt"; done
echo "== the audit's other rules; rule 44 at LOW and HIGH"
pg audit-rest $A 'rules=14,21,22,25,38,42,45,46' & pg r44-low $A 'rules=44;lv=low' & pg r44-high $A 'rules=44;lv=high' & wait
for n in audit-rest r44-low r44-high; do sum $n; grep -E '^(PASS|FAIL) rule 44' "$J/$n.log" | grep -iE "largest|20 m" | cut -c1-400 >> "$J/$n.txt"; done
echo "== lava.js x3"
pg lavajs-1 tools/botlab/tests/lava.js '' & pg lavajs-2 tools/botlab/tests/lava.js '' & pg lavajs-3 tools/botlab/tests/lava.js '' & wait
for n in lavajs-1 lavajs-2 lavajs-3; do sum $n; grep -E '^(PASS|FAIL) (G9|F8c)' "$J/$n.log" | cut -c1-600 >> "$J/$n.txt"; done
echo "== lava-bots, Zone Control x2"
pg bots tools/botlab/tests/lava-bots.js '' & pg zones-1 tools/botlab/tests/lava-match.js 'mode=zones' & pg zones-2 tools/botlab/tests/lava-match.js 'mode=zones' & wait
for n in bots zones-1 zones-2; do sum $n; grep -E '^(PASS|FAIL)' "$J/$n.log" | grep -iE 'lava death|deaths|lookout|organ' | cut -c1-500 >> "$J/$n.txt"; done
echo "== boss-check: caldera x5, calamari, treehills, kelpline"
pg boss-1 $B '' boss & pg boss-2 $B '' boss & pg boss-3 $B '' boss & wait
pg boss-4 $B '' boss & pg boss-5 $B '' boss & MAPID=calamari pg boss-calamari $B '' boss & wait
MAPID=treehills pg boss-treehills $B '' boss & MAPID=kelpline pg boss-kelpline $B '' boss & wait
echo "== boss-check baseline: calamari, treehills, kelpline with int4's boss code (f687b4c2)"
git show f687b4c2:src/boss/bossBrain.js > src/boss/bossBrain.js; git show f687b4c2:src/boss/bossNav.js > src/boss/bossNav.js
MAPID=calamari pg base-calamari $B '' boss & MAPID=treehills pg base-treehills $B '' boss & MAPID=kelpline pg base-kelpline $B '' boss & wait
git checkout -- src/boss/bossBrain.js src/boss/bossNav.js
for n in boss-1 boss-2 boss-3 boss-4 boss-5 boss-calamari boss-treehills boss-kelpline base-calamari base-treehills base-kelpline; do sum $n; grep -E '^(PASS|FAIL) (home ground|it roams|it never|\(information\) seconds)' "$J/$n.log" | sed 's/"trail":.*//' | cut -c1-300 >> "$J/$n.txt"; done
echo "== review 9's probes: wall9, held9 A/B/C, far9, land9 (HIGH, rise); lava-karp"
pg wall9 $C/rev9/probe-wall9.js '' & pg held9 $C/rev9/probe-held9.js 'parts=A,B,C' & pg far9 $C/rev9/probe-far9.js '' & wait
pg land9-high $C/rev9/probe-land9.js 'lv=high;cap=60' & pg land9-rise $C/rev9/probe-land9.js 'lv=rise;cap=30' & pg karp tools/botlab/tests/lava-karp.js '' bazookarp & wait
for n in wall9 held9 far9 land9-high land9-rise karp; do sum $n; grep -E '^(PASS|FAIL)' "$J/$n.log" | grep -vE '^(PASS|FAIL) (wall |B row )' | cut -c1-500 | head -8 >> "$J/$n.txt"; done
echo "== net-lava alone"
WIPSTAGES=1 CLIENTS=2 NET=tools/botlab/tests/net-lava.cjs $R tools/botlab/netpage.cjs > "$J/netlava.log" 2>&1
{ echo "### net-lava"; grep -E '^PASS|^FAIL|^RESULT|console|HARNESS|WATCHDOG' "$J/netlava.log" | cut -c1-300; } > "$J/netlava.txt"
echo "== SUMMARY"
for f in "$J"/*.txt; do grep -hE '^### |^RESULT|^## rule 47' "$f"; done
