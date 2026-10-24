#!/bin/bash
# kind: tests
# Beta fix round 1, review 1, JOB-18: bot-stuck was 6/7, 7/7, 6/7 in JOB-17 and the failing check's line was not kept
# (no summary file): bot-stuck ×6 on the same code, every PASS / FAIL line kept.
set -u
J=${JOB_OUT:-.botlab/beta1-job18}
mkdir -p "$J/logs"; J=$(cd "$J" && pwd)
echo "### beta1 JOB-18 head ${JOB_SHA:-?}"
for k in 1 2 3 4 5 6; do
  env WATCHDOG=1500000 MAP=aquarium MODE=turf PAGE=tools/botlab/tests/bot-stuck.js tools/botlab/run.sh tools/botlab/page.cjs > "$J/logs/bot-stuck-$k.log" 2>&1
  echo "[bot-stuck-$k] $(grep -E '^RESULT' "$J/logs/bot-stuck-$k.log" | tail -1)"
  grep -E '^FAIL' "$J/logs/bot-stuck-$k.log" | cut -c1-900 | sed "s/^/[bot-stuck-$k] /"
  grep -E '^PASS|^FAIL' "$J/logs/bot-stuck-$k.log" | cut -c1-1400 > "$J/bot-stuck-$k.txt"
done
echo "### done"
