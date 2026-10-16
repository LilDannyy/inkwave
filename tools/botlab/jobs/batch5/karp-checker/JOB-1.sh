#!/bin/bash
# kind: tests
# karp-checker (WP4a), for the record: what this Mac (load average 230–760) could not judge. The Carp Field's load
# budget per state (SPEC §3.2 step 5: 60 ms) on a quiet machine, then the checker's self-test as a repeat of the local
# run. The all-stages table is its own job (JOB-2: one job has 3 hours). Pushed only by the lead (this package's
# builder pushes nothing).
set -u
echo "== karp-field.js: the field on karpbox and every stage, its two load-cost rows"
DEVSTAGE=1 MAP=karpbox MODE=bazookarp PAGE=tools/botlab/tests/karp-field.js WATCHDOG=900000 OUT="$JOB_OUT/karp-field.json" \
  tools/botlab/run.sh tools/botlab/page.cjs 2>&1 | grep -E '^(PASS|FAIL|RESULT)' | cut -c1-600 | tee "$JOB_OUT/karp-field.txt"
echo "== bazookarp-check self-test (every case of karp-check-box.js)"
KARP_SELFTEST=1 SHOTS=0 WATCHDOG=5400000 OUT="$JOB_OUT/self" \
  tools/botlab/run.sh tools/botlab/bazookarp-check.cjs 2>&1 | grep -E '^(SELFTEST|RESULT)|console errors' | cut -c1-300 | tee "$JOB_OUT/selftest.txt"
