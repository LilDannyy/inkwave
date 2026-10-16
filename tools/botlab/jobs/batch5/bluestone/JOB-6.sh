#!/bin/bash
# kind: tests
# Bluestone eras, engine phase second half (2026-10-16), for the record (the Mac mini was unavailable to this phase; it
# runs once the branch is pushed): what needs a quiet machine.
#   - eras-jump 'first' (a fresh page's first jump: no program compiled, the warning frame's update) ×3 and 'frames'
#     (no frame over 50 ms from J − 0.5 to done + 1.5; the Bravo viewer and the kept world at another time of day —
#     'theme' — each frame split into the era update, the render and the rest: the final review's issue 5) ×3, each on
#     its own fresh page
#   - the load and perf REPORT: Halyard and Bluestone eras 1 / 2 / 3 and jumps 1 → 2 / 2 → 3, alternated, ×2
#   - net-eras.cjs (two clients and a late joiner: the flip skew is the machine's frame timing on a loaded Mac), then the
#     contract's lagged run (ENGINE §4.7: netlag 150 / jitter 50, turf: flip skew < 0.4 s, the clocks within 0.15 s)
R=tools/botlab/run.sh
J="$JOB_OUT"
P=tools/botlab/jobs/batch5/bluestone/perf-pre.js
for k in a b c; do
  MAP=bluestone PAGE=tools/botlab/tests/eras-jump.js PAGE_ARGS='only=first' WATCHDOG=900000 $R tools/botlab/page.cjs > "$J/first$k.log" 2>&1
  MAP=bluestone PAGE=tools/botlab/tests/eras-jump.js PAGE_ARGS='only=frames' WATCHDOG=900000 $R tools/botlab/page.cjs > "$J/frames$k.log" 2>&1
  { echo "### first $k"; grep -E '^(PASS|FAIL)|^RESULT' "$J/first$k.log" | cut -c1-600; echo "### frames $k"; grep -E '^(PASS|FAIL)|^RESULT' "$J/frames$k.log" | cut -c1-600; } > "$J/timing$k.txt"
done
for k in 1 2; do
  MAP=halyard SHOTS=spawnA OUT="$J/s" PRE=$P $R tools/botlab/shoot.cjs > "$J/perf-halyard-$k.log" 2>&1
  for e in 1 2 3; do MAP=bluestone SHOTS=spawnA OUT="$J/s" PAGEQ="era=$e" PRE=$P $R tools/botlab/shoot.cjs > "$J/perf-era$e-$k.log" 2>&1; done
  for j in jump12 jump23; do MAP=bluestone SHOTS=spawnA OUT="$J/s" PRE=$P PRE_ARGS=$j $R tools/botlab/shoot.cjs > "$J/perf-$j-$k.log" 2>&1; done
done
for f in "$J"/perf-*.log; do echo "### $(basename $f)"; grep -E '^PRE|^REPORT' "$f" | cut -c1-600; done > "$J/perf.txt"
CLIENTS=2 URLQ=wipstages WIPSTAGES=1 NET=tools/botlab/tests/net-eras.cjs WATCHDOG=1200000 $R tools/botlab/netpage.cjs > "$J/net-eras.log" 2>&1
grep -E '^(PASS|FAIL)|^RESULT|HARNESS' "$J/net-eras.log" | cut -c1-700 > "$J/net-eras.txt"
CLIENTS=2 URLQ='wipstages&netlag=150&netjitter=50' WIPSTAGES=1 NET=tools/botlab/tests/net-eras.cjs NET_ARGS='only=turf' WATCHDOG=1200000 $R tools/botlab/netpage.cjs > "$J/net-eras-lag.log" 2>&1
grep -E '^(PASS|FAIL)|^RESULT|HARNESS' "$J/net-eras-lag.log" | cut -c1-900 > "$J/net-eras-lag.txt"
echo "RESULT done"
