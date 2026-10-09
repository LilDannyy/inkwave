#!/bin/bash
# kind: tests
# int1 JOB-1: the six wave-1 packages merged (b5-int1, before the integrator's fixes) — every package's new tests and
# the lead's page-test regressions, once each (verify.sh SETS="own reg"). Summary → $JOB_OUT/summary.txt; FAIL lines of
# every run → $JOB_OUT/fails.txt.
set -u
D=tools/botlab/jobs/batch5/int1
LOG="$JOB_OUT/logs" PAR=3 SETS="own reg" $D/verify.sh 2>&1 | tee "$JOB_OUT/summary.txt"
for f in "$JOB_OUT"/logs/*.log; do
  if grep -qE '^FAIL|FRAME ERRORS|WATCHDOG|HARNESS|TypeError' "$f"; then echo "--- $(basename "$f")"; grep -E '^FAIL|FRAME ERRORS|WATCHDOG|HARNESS|TypeError|^CONSOLE [1-9]' "$f" | head -12 | cut -c1-1500; fi
done > "$JOB_OUT/fails.txt"
