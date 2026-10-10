# kind: tests
# [b5-int3] wave 2's polish, for when the Mac mini is back: the dash-reach audit with the new moves (a swim jump + air
# dash, late presses in a long fall, a climb dash toward the wall's top) on every shipped stage at 1/24, and the other half
# of the 1/60 nodes (step=2;off=1 — off=0 ran locally, results in LEAD-REPORT.md); then the repeats the local run could
# only do once.
set -u
D="$JOB_OUT"
for MAP in tidewater kelpline halyard saltpan crossmarket lockgate terraces nantai craters calamari spirhalite treehills cargo; do
  DS=""; [ "$MAP" = cargo ] && DS=1   # (Cargo Terminal is online only: DEVSTAGE boots it offline)
  DEVSTAGE=$DS WATCHDOG=5400000 MAP=$MAP MODE=turf PAGE=tools/botlab/tests/dash-reach.js PAGE_ARGS="dt=24" tools/botlab/run.sh tools/botlab/page.cjs > "$D/reach-$MAP-24.log" 2>&1 &
  DEVSTAGE=$DS WATCHDOG=5400000 MAP=$MAP MODE=turf PAGE=tools/botlab/tests/dash-reach.js PAGE_ARGS="step=2;off=1" tools/botlab/run.sh tools/botlab/page.cjs > "$D/reach-$MAP-60b.log" 2>&1 &
  wait
  echo "== reach $MAP 1/24: $(grep '^RESULT' "$D/reach-$MAP-24.log")"; grep '^FAIL' "$D/reach-$MAP-24.log" | cut -c1-900
  echo "== reach $MAP 1/60 (step=2;off=1): $(grep '^RESULT' "$D/reach-$MAP-60b.log")"; grep '^FAIL' "$D/reach-$MAP-60b.log" | cut -c1-900
done > "$D/reach.txt"
for i in 1 2 3; do
  WATCHDOG=900000 MAP=testbox MODE=turf PAGE=tools/botlab/tests/sub-glide.js tools/botlab/run.sh tools/botlab/page.cjs > "$D/sub-glide-$i.log" 2>&1
  echo "== sub-glide #$i: $(grep '^RESULT' "$D/sub-glide-$i.log")"; grep '^FAIL' "$D/sub-glide-$i.log" | cut -c1-600
  WATCHDOG=900000 MAP=halyard MODE=zones PAGE=tools/botlab/tests/sub-bobber.js PAGE_ARGS=only=zone tools/botlab/run.sh tools/botlab/page.cjs > "$D/zone-$i.log" 2>&1
  echo "== sub-bobber only=zone #$i: $(grep '^RESULT' "$D/zone-$i.log")"; grep '^FAIL' "$D/zone-$i.log" | cut -c1-600
  WATCHDOG=900000 MAP=testbox MODE=turf PAGE=tools/botlab/tests/perf-bobbers.js tools/botlab/run.sh tools/botlab/page.cjs > "$D/perf-bobbers-$i.log" 2>&1
  echo "== perf-bobbers #$i: $(grep '^RESULT' "$D/perf-bobbers-$i.log")"; grep '^FAIL' "$D/perf-bobbers-$i.log" | cut -c1-600
done > "$D/tests.txt"
cat "$D/reach.txt" "$D/tests.txt"
