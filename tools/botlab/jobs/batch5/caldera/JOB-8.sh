#!/bin/bash
# kind: tests
# after: JOB-7
# Highmark Foundry, fix round 6, the final head (after JOB-7): the air guard flies its candidates in the model. lava-bots x2
# (their deaths' trails printed), lava.js x3, two Zone Control matches and one Turf War match (lava-match.js).
R=tools/botlab/run.sh
J="$JOB_OUT"
pg() { # name page args mode
  MAP=caldera MODE=${4:-turf} PAGE=$2 PAGE_ARGS="$3" WATCHDOG=900000 $R tools/botlab/page.cjs > "$J/$1.log" 2>&1
}
sum() { # name -> its RESULT / FAIL / harness lines
  { echo "### $1"; grep -E '^RESULT|^FAIL|HARNESS|WATCHDOG|console errors|FRAME ERRORS' "$J/$1.log" | cut -c1-600 | head -30; } > "$J/$1.txt"
}
echo "== lava-bots x2, lava.js"
pg lavabots-1 tools/botlab/tests/lava-bots.js '' & pg lavabots-2 tools/botlab/tests/lava-bots.js '' & pg lavajs-1 tools/botlab/tests/lava.js '' & wait
echo "== lava.js x2, one Zone Control match"
pg lavajs-2 tools/botlab/tests/lava.js '' & pg lavajs-3 tools/botlab/tests/lava.js '' & pg zones-1 tools/botlab/tests/lava-match.js 'mode=zones' & wait
echo "== one Zone Control match, one Turf War match"
pg zones-2 tools/botlab/tests/lava-match.js 'mode=zones' & pg turf-1 tools/botlab/tests/lava-match.js 'mode=turf;secs=180' & wait
for n in 1 2; do sum lavabots-$n; grep -E '^(PASS|FAIL) (ledges|stones|edges) |^(PASS|FAIL) the gate' "$J/lavabots-$n.log" | grep -v '"lavaDeaths":0' | cut -c1-3500 >> "$J/lavabots-$n.txt"; done
for n in 1 2 3; do sum lavajs-$n; grep -E '^(PASS|FAIL) F10' "$J/lavajs-$n.log" | sed 's/"trails":.*//' | cut -c1-500 >> "$J/lavajs-$n.txt"; done
{ for n in zones-1 zones-2 turf-1; do echo "### $n"; grep -E '^PASS|^FAIL|^RESULT|HARNESS' "$J/$n.log" | cut -c1-500; done; } > "$J/matches.txt"
echo "== SUMMARY"
for f in "$J"/*.txt; do grep -hE '^### |^RESULT' "$f"; done
