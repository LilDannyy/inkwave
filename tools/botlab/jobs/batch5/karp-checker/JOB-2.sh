#!/bin/bash
# kind: tests
# after: JOB-1
# karp-checker (WP4a), for the record: the all-stages table (bazookarp-check MAP=all, every shipped stage) as a repeat
# of the local run, on its own: it took ~35–60 min here at load 230–760, so its watchdog (2.5 h) fits the runner's 3 h.
set -u
echo "== bazookarp-check MAP=all (every shipped stage)"
MAP=all SHOTS=0 WATCHDOG=9000000 OUT="$JOB_OUT/all" \
  tools/botlab/run.sh tools/botlab/bazookarp-check.cjs 2>&1 | grep -E '^RESULT|^\||console errors' | cut -c1-400 | tee "$JOB_OUT/all-stages.txt"
