# kind: tests
# [b5-int3] wave 2's polish: perf-bobbers (phase 4: with and without bobbers, +3 ms allowed) three times at the final
# code, on a quiet machine. Was JOB-2.sh here (36a34713), which collides by name with the lead's JOB-2.sh on
# fork/botlab-b5-int3; its Carp Field half is dropped — the Mac mini's sweep at b97b3eb (MEASUREMENTS.txt §F: every
# stage under 60 ms at match start, worst cargo 43.4 ms) closed it, and nothing since touches the field. perf-bobbers ran
# there at b97b3eb (5/5, 5/5, 4/5: phase 4 p95 10.6 ms once); the bobber bots and weapons.js's round order changed since.
set -u
D="$JOB_OUT"
for i in 1 2 3; do
  WATCHDOG=900000 MAP=testbox MODE=turf PAGE=tools/botlab/tests/perf-bobbers.js tools/botlab/run.sh tools/botlab/page.cjs > "$D/perf-bobbers-$i.log" 2>&1
  echo "== perf-bobbers #$i: $(grep '^RESULT' "$D/perf-bobbers-$i.log")"; grep -E '^FAIL|phase' "$D/perf-bobbers-$i.log" | cut -c1-600
done > "$D/quiet.txt"
cat "$D/quiet.txt"
