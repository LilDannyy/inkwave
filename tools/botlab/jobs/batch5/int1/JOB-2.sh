#!/bin/bash
# kind: tests
# int1 JOB-2: the full verification of the merged wave 1 with the integrator's fixes (b5-int1 head): every new test of the
# six packages + int1's, the lead's page-test regressions, the online tests one at a time, the known issues' repeats
# (bot-specials / jump-ui 960x600 / surf x6), bot matches on the 12 offline stages x Turf War / Zone Control / Tower
# Command (random loadouts), then sfx-cues and audio-pause alone. (JOB-1 was not picked up within 20 min: the integrator
# runs this set locally too; this is the Mac mini's copy for when the runner is back.)
set -u
D=tools/botlab/jobs/batch5/int1
LOG="$JOB_OUT/logs" PAR=3 $D/verify.sh 2>&1 | tee "$JOB_OUT/summary.txt"
for f in "$JOB_OUT"/logs/*.log; do
  if grep -qE '^FAIL|FRAME ERRORS|WATCHDOG|HARNESS|TypeError' "$f"; then echo "--- $(basename "$f")"; grep -E '^FAIL|FRAME ERRORS|WATCHDOG|HARNESS|TypeError|^CONSOLE [1-9]' "$f" | head -12 | cut -c1-1500; fi
done > "$JOB_OUT/fails.txt"
