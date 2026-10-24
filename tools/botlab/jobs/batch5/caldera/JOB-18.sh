#!/bin/bash
# kind: tests
# after: JOB-17
# Highmark Foundry, fix round 9, the final code (+ the rescue's wait for a node within 6 m, d615b39d; rule 47 b's clock
# running at the rise's and the fall's levels, a01dc415; an escape drops a Mitts charge, 6509d4c6 — F8c traced): lava-audit rule 47 in three parts; lava.js x3; lava-bots; Zone Control
# x2; boss-check caldera x5; review 9's probes (held9 A/B/C, far9, land9 at HIGH and through the rise, wall9); net-lava
# alone. (JOB-16's check-maps, the audit's other rules, rule 44, lava-karp and the other stages' boss-checks stand: the
# geometry and the boss code are as there.)
R=tools/botlab/run.sh
J="$JOB_OUT"
pg() { # name page args mode
  MAP=${MAPID:-caldera} MODE=${4:-turf} PAGE=$2 PAGE_ARGS="$3" WATCHDOG=900000 $R tools/botlab/page.cjs > "$J/$1.log" 2>&1
}
sum() { { echo "### $1"; grep -E '^RESULT|^FAIL|HARNESS|WATCHDOG|console errors|FRAME ERRORS' "$J/$1.log" | cut -c1-400 | head -12; } > "$J/$1.txt"; }
A=tools/botlab/tests/lava-audit.js
C=tools/botlab/jobs/batch5/caldera
B=tools/botlab/jobs/stretch/boss-check.js
echo "== rule 47: a,c,d | b,e at low,high,r30 | b,e at r60,r90,f50"
pg r47acd $A 'rules=47;r47=a,c,d' & pg r47be1 $A 'rules=47;r47=b,e;r47lv=low,high,r30' & pg r47be2 $A 'rules=47;r47=b,e;r47lv=r60,r90,f50' & wait
for n in r47acd r47be1 r47be2; do sum $n; node $C/sum47.cjs "$J/$n.log" | cut -c1-700 >> "$J/$n.txt"; done
echo "== lava.js x3"
pg lavajs-1 tools/botlab/tests/lava.js '' & pg lavajs-2 tools/botlab/tests/lava.js '' & pg lavajs-3 tools/botlab/tests/lava.js '' & wait
for n in lavajs-1 lavajs-2 lavajs-3; do sum $n; grep -E '^(PASS|FAIL) G9' "$J/$n.log" | cut -c1-400 >> "$J/$n.txt"; node $C/f8c.cjs "$J/$n.log" | cut -c1-400 >> "$J/$n.txt"; done
echo "== lava-bots, Zone Control x2"
pg bots tools/botlab/tests/lava-bots.js '' & pg zones-1 tools/botlab/tests/lava-match.js 'mode=zones' & pg zones-2 tools/botlab/tests/lava-match.js 'mode=zones' & wait
for n in bots zones-1 zones-2; do sum $n; grep -E '^(PASS|FAIL)' "$J/$n.log" | grep -iE 'lava death|deaths|lookout|organ' | cut -c1-500 >> "$J/$n.txt"; done
grep -E '^FAIL' "$J/bots.log" | grep -oE '"deaths":\[.*' | cut -c1-1500 >> "$J/bots.txt"
echo "== boss-check: caldera x5"
pg boss-1 $B '' boss & pg boss-2 $B '' boss & pg boss-3 $B '' boss & wait
pg boss-4 $B '' boss & pg boss-5 $B '' boss & wait
for n in boss-1 boss-2 boss-3 boss-4 boss-5; do sum $n; grep -E '^(PASS|FAIL) (home ground|it roams|it never|\(information\) seconds)' "$J/$n.log" | sed 's/"trail":.*//' | cut -c1-300 >> "$J/$n.txt"; done
echo "== review 9's probes"
pg wall9 $C/rev9/probe-wall9.js '' & pg held9 $C/rev9/probe-held9.js 'parts=A,B,C' & pg far9 $C/rev9/probe-far9.js '' & wait
pg land9-high $C/rev9/probe-land9.js 'lv=high;cap=60' & wait
pg land9-rise $C/rev9/probe-land9.js 'lv=rise;cap=30'   # (alone: JOB-16 ran it beside land9-high and it met the 15 min watchdog)
for n in wall9 held9 far9 land9-high land9-rise; do sum $n; grep -E '^(PASS|FAIL)' "$J/$n.log" | grep -vE '^(PASS|FAIL) (wall |B row )' | cut -c1-500 | head -8 >> "$J/$n.txt"; done
echo "== net-lava alone"
WIPSTAGES=1 CLIENTS=2 NET=tools/botlab/tests/net-lava.cjs $R tools/botlab/netpage.cjs > "$J/netlava.log" 2>&1
{ echo "### net-lava"; grep -E '^PASS|^FAIL|^RESULT|console|HARNESS|WATCHDOG' "$J/netlava.log" | cut -c1-1500; } > "$J/netlava.txt"
echo "== SUMMARY"
for f in "$J"/*.txt; do grep -hE '^### |^RESULT|^## rule 47' "$f"; done
