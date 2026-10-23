#!/bin/bash
# kind: tests
# Highmark Foundry, the lava engine's fix round 6 (after review 6): the proofs on a quiet machine. lava.js three runs (F10's busy
# release, F8b's case D), boss-check five in a row (the far-half bias), lava-bots.js once, net-lava.cjs alone (the online rule:
# a quiet machine), two Zone Control matches (lava-match.js), and lava-audit (full=1) / lava-notch / lava-karp once each.
R=tools/botlab/run.sh
J="$JOB_OUT"
pg() { # name page args mode
  MAP=caldera MODE=${4:-turf} PAGE=$2 PAGE_ARGS="$3" WATCHDOG=900000 $R tools/botlab/page.cjs > "$J/$1.log" 2>&1
}
sum() { # name -> its RESULT / FAIL / harness lines
  { echo "### $1"; grep -E '^RESULT|^FAIL|HARNESS|WATCHDOG|console errors|FRAME ERRORS' "$J/$1.log" | cut -c1-600 | head -30; } > "$J/$1.txt"
}
echo "== lava.js x3 (parallel)"
pg lavajs-1 tools/botlab/tests/lava.js '' & pg lavajs-2 tools/botlab/tests/lava.js '' & pg lavajs-3 tools/botlab/tests/lava.js '' & wait
for n in 1 2 3; do sum lavajs-$n; done
echo "== boss-check x5 (3 + 2)"
pg boss-1 tools/botlab/jobs/stretch/boss-check.js '' boss & pg boss-2 tools/botlab/jobs/stretch/boss-check.js '' boss & pg boss-3 tools/botlab/jobs/stretch/boss-check.js '' boss & wait
pg boss-4 tools/botlab/jobs/stretch/boss-check.js '' boss & pg boss-5 tools/botlab/jobs/stretch/boss-check.js '' boss & wait
{ for n in 1 2 3 4 5; do echo "### boss-$n"; grep -E '^RESULT|^FAIL|it roams|seconds on each half|HARNESS' "$J/boss-$n.log" | sed 's/"trail":.*//' | cut -c1-300; done; } > "$J/boss.txt"
echo "== net-lava alone"
WIPSTAGES=1 CLIENTS=2 NET=tools/botlab/tests/net-lava.cjs $R tools/botlab/netpage.cjs > "$J/netlava.log" 2>&1
{ echo "### net-lava"; grep -E '^PASS|^FAIL|^RESULT|console|HARNESS|WATCHDOG' "$J/netlava.log" | cut -c1-400; } > "$J/netlava.txt"
echo "== lava-bots, two Zone Control matches"
pg lavabots tools/botlab/tests/lava-bots.js '' & pg zones-1 tools/botlab/tests/lava-match.js 'mode=zones' & pg zones-2 tools/botlab/tests/lava-match.js 'mode=zones' & wait
sum lavabots
{ for n in 1 2; do echo "### zones-$n"; grep -E '^PASS|^FAIL|^RESULT|HARNESS' "$J/zones-$n.log" | cut -c1-500; done; } > "$J/zones.txt"
echo "== lava-audit (full=1), lava-notch, lava-karp"
pg audit tools/botlab/tests/lava-audit.js 'full=1' & pg notch tools/botlab/tests/lava-notch.js '' & pg karp tools/botlab/tests/lava-karp.js '' bazookarp & wait
{ echo "### lava-audit"; grep -E '^(PASS|FAIL) rule [0-9]+:|^RESULT' "$J/audit.log" | cut -c1-260; } > "$J/audit.txt"
sum notch; sum karp
echo "== SUMMARY"
for f in "$J"/*.txt; do grep -hE '^### |^RESULT' "$f"; done
