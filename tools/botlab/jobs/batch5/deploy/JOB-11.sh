#!/bin/bash
# kind: tests
# deploy JOB-11 (fix round 1, resumed 2026-10-09): JOB-10 at 9eb29bf showed the package's own bot checks flaky — the
# Vortex-Strike scene failed in both full deployables runs (once with the device AI on, once OFF), "a foe in sight comes
# first" 2 of 8, "giving up" 1 of 6, surf's "a bot shoots an enemy buoy down" 1 of 6. Same code as JOB-10: this job is
# the diagnosis (the whole FAIL lines, their JSON, come back in fails.txt) and tells the builder the runner is up.
#   deployables (all) ×3, deployables only=bots ×6, surf ×6 — 3 at a time
set -u
mkdir -p "$JOB_OUT/x"
x() {   # name i env…
  local n=$1 i=$2; shift 2
  local L="$JOB_OUT/x/$n-$i.log"
  env WATCHDOG=900000 "$@" tools/botlab/run.sh tools/botlab/page.cjs > "$L" 2>&1
  echo "== $n $i: $(grep -E '^RESULT' "$L" | tail -1)"
  grep -E '^FAIL' "$L" | cut -c1-300
}
export -f x; export JOB_OUT
T=tools/botlab/tests
echo "### deploy JOB-11 at $(git rev-parse --short HEAD)"
{ for i in 1 2 3; do echo "deployables $i MAP=testbox MODE=turf PAGE=$T/deployables.js"; done
  for i in 1 2 3 4 5 6; do echo "bots $i MAP=testbox MODE=turf PAGE=$T/deployables.js PAGE_ARGS=only=bots"; echo "surf $i MAP=testbox MODE=turf PAGE=$T/surf.js"; done; } \
  | xargs -P 3 -L 1 bash -c 'x "$@"' _ | tee "$JOB_OUT/summary.txt"
for f in "$JOB_OUT"/x/*.log; do
  if grep -qE '^FAIL|FRAME ERRORS|WATCHDOG|HARNESS' "$f"; then echo "--- $(basename "$f")"; grep -E '^FAIL|FRAME ERRORS|WATCHDOG|HARNESS' "$f" | cut -c1-2600; fi
done > "$JOB_OUT/fails.txt"
echo "SUMMARY $(grep -c '^== ' "$JOB_OUT/summary.txt") runs, $(grep -c '^FAIL' "$JOB_OUT/summary.txt") FAIL lines"
