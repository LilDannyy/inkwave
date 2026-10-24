#!/bin/bash
# kind: tests
# after: JOB-11
# Highmark Foundry, fix round 8, the round's code (as JOB-11): lava-bots once; lava.js twice; Zone Control twice
# (lava-match mode=zones); boss-check five in a row with the idle spot recorded (boss-idle.js) and boss-foot.js (the boss put
# down round the causeway's south end); lava-karp (the moved stump and the Ladle parapet against the carrier field's veto
# list); net-lava alone at the end.
R=tools/botlab/run.sh
J="$JOB_OUT"
pg() { # name page args mode
  MAP=caldera MODE=${4:-turf} PAGE=$2 PAGE_ARGS="$3" WATCHDOG=900000 $R tools/botlab/page.cjs > "$J/$1.log" 2>&1
}
sum() { # name -> its RESULT / FAIL / harness lines
  { echo "### $1"; grep -E '^RESULT|^FAIL|HARNESS|WATCHDOG|console errors|FRAME ERRORS' "$J/$1.log" | cut -c1-700 | head -30; } > "$J/$1.txt"
}
B=tools/botlab/jobs/batch5/caldera/boss-idle.js
echo "== lava-bots, lava.js x2"
pg bots tools/botlab/tests/lava-bots.js '' & pg lavajs-1 tools/botlab/tests/lava.js '' & pg lavajs-2 tools/botlab/tests/lava.js '' & wait
echo "== Zone Control x2, lava-karp"
pg zones-1 tools/botlab/tests/lava-match.js 'mode=zones' & pg zones-2 tools/botlab/tests/lava-match.js 'mode=zones' & pg karp tools/botlab/tests/lava-karp.js '' bazookarp & wait
echo "== boss-check (idle spot recorded) x5, boss-foot"
pg boss-1 $B '' boss & pg boss-2 $B '' boss & pg boss-3 $B '' boss & wait
pg boss-4 $B '' boss & pg boss-5 $B '' boss & pg boss-foot tools/botlab/jobs/batch5/caldera/boss-foot.js '' boss & wait
for n in bots lavajs-1 lavajs-2 zones-1 zones-2 karp boss-1 boss-2 boss-3 boss-4 boss-5 boss-foot; do sum $n; done
for n in zones-1 zones-2 bots; do grep -E '^(PASS|FAIL)' "$J/$n.log" | grep -iE 'lava death|deaths|lookout|organ' | cut -c1-600 >> "$J/$n.txt"; done
for n in boss-1 boss-2 boss-3 boss-4 boss-5; do grep -E '^(PASS|FAIL) it never|^PASS \(information\) seconds' "$J/$n.log" | sed 's/"brainKeys":.*//' | cut -c1-1200 >> "$J/$n.txt"; done
grep -E '^(PASS|FAIL) boss-foot' "$J/boss-foot.log" | cut -c1-500 >> "$J/boss-foot.txt"
grep -E '^(PASS|FAIL) K8' "$J/karp.log" | cut -c1-400 >> "$J/karp.txt"
echo "== net-lava alone"
WIPSTAGES=1 CLIENTS=2 NET=tools/botlab/tests/net-lava.cjs $R tools/botlab/netpage.cjs > "$J/netlava.log" 2>&1
{ echo "### net-lava"; grep -E '^PASS|^FAIL|^RESULT|console|HARNESS|WATCHDOG' "$J/netlava.log" | cut -c1-400; } > "$J/netlava.txt"
echo "== SUMMARY"
for f in "$J"/*.txt; do grep -hE '^### |^RESULT' "$f"; done
