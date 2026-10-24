#!/bin/bash
# kind: tests
# after: JOB-18
# Highmark Foundry, fix round 9, at the final code (JOB-18 ran at 218bd500, before the Mitts charge drop 6509d4c6 and
# net-lava's retargeted waterline paint 01f7ea2b; its three rule-47 parts, with the rise's clock running, met the 15 min
# watchdog side by side): net-lava alone first; lava-audit rule 47 in smaller parts, two at a time (b LOW+HIGH | b r30+r60;
# b r90+f50 | e all six levels; a,c,d alone); lava.js x3; lava-bots once; review 9's land9-rise alone.
R=tools/botlab/run.sh
J="$JOB_OUT"
pg() { # name page args mode
  MAP=${MAPID:-caldera} MODE=${4:-turf} PAGE=$2 PAGE_ARGS="$3" WATCHDOG=900000 $R tools/botlab/page.cjs > "$J/$1.log" 2>&1
}
sum() { { echo "### $1"; grep -E '^RESULT|^FAIL|HARNESS|WATCHDOG|console errors|FRAME ERRORS' "$J/$1.log" | cut -c1-300 | head -12; } > "$J/$1.txt"; }
A=tools/botlab/tests/lava-audit.js
C=tools/botlab/jobs/batch5/caldera
echo "== net-lava alone"
WIPSTAGES=1 CLIENTS=2 NET=tools/botlab/tests/net-lava.cjs $R tools/botlab/netpage.cjs > "$J/netlava.log" 2>&1
{ echo "### net-lava"; grep -E '^PASS|^FAIL|^RESULT|console|HARNESS|WATCHDOG' "$J/netlava.log" | cut -c1-1500; } > "$J/netlava.txt"
echo "== rule 47 in parts"
pg r47b1 $A 'rules=47;r47=b;r47lv=low,high' & pg r47b2 $A 'rules=47;r47=b;r47lv=r30,r60' & wait
pg r47b3 $A 'rules=47;r47=b;r47lv=r90,f50' & pg r47e $A 'rules=47;r47=e' & wait
pg r47acd $A 'rules=47;r47=a,c,d'
for n in r47b1 r47b2 r47b3 r47e r47acd; do sum $n; node $C/sum47.cjs "$J/$n.log" | grep -v '##    eg' | cut -c1-600 >> "$J/$n.txt"; done
echo "== lava.js x3, lava-bots"
pg lavajs-1 tools/botlab/tests/lava.js '' & pg lavajs-2 tools/botlab/tests/lava.js '' & pg lavajs-3 tools/botlab/tests/lava.js '' & wait
for n in lavajs-1 lavajs-2 lavajs-3; do sum $n; grep -E '^(PASS|FAIL) G9' "$J/$n.log" | cut -c1-300 >> "$J/$n.txt"; node $C/f8c.cjs "$J/$n.log" | cut -c1-400 >> "$J/$n.txt"; grep -E '^FAIL F10' "$J/$n.log" | cut -c1-1200 >> "$J/$n.txt"; done
pg bots tools/botlab/tests/lava-bots.js ''
sum bots; grep -E '^(PASS|FAIL) the gate' "$J/bots.log" | cut -c1-500 >> "$J/bots.txt"; grep -E '^FAIL' "$J/bots.log" | grep -oE '"deaths":\[.*' | cut -c1-1500 >> "$J/bots.txt"
echo "== review 9's land9-rise alone"
pg land9-rise $C/rev9/probe-land9.js 'lv=rise;cap=30'
sum land9-rise; grep -E '^(PASS|FAIL) landings' "$J/land9-rise.log" | cut -c1-260 >> "$J/land9-rise.txt"
echo "== SUMMARY"
for f in "$J"/*.txt; do grep -hE '^### |^RESULT|^## rule 47' "$f"; done
