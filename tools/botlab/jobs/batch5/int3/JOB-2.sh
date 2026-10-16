# kind: tests
# [b5-int3] wave 2's polish, the measurements that need a quiet machine (this Mac was at load 14–20, and 400+ at times):
# the Carp Field's build at match start per state on every stage (the SPEC's 60 ms budget; WP1 report §6 had craters and
# calamari over), three times; perf-bobbers (phase 4: with and without bobbers, +3 ms allowed), three times.
set -u
D="$JOB_OUT"
for i in 1 2 3; do
  DEVSTAGE=1 WATCHDOG=1800000 MAP=karpbox MODE=bazookarp PAGE=tools/botlab/tests/karp-field.js tools/botlab/run.sh tools/botlab/page.cjs > "$D/karp-field-$i.log" 2>&1
  echo "== karp-field #$i: $(grep '^RESULT' "$D/karp-field-$i.log")"; grep -E '^FAIL|load|warm' "$D/karp-field-$i.log" | cut -c1-900
  WATCHDOG=900000 MAP=testbox MODE=turf PAGE=tools/botlab/tests/perf-bobbers.js tools/botlab/run.sh tools/botlab/page.cjs > "$D/perf-bobbers-$i.log" 2>&1
  echo "== perf-bobbers #$i: $(grep '^RESULT' "$D/perf-bobbers-$i.log")"; grep -E '^FAIL|phase' "$D/perf-bobbers-$i.log" | cut -c1-600
done > "$D/quiet.txt"
cat "$D/quiet.txt"
