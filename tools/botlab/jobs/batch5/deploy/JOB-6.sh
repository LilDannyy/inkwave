#!/bin/bash
# kind: tests
# deploy JOB-6 (fix round 1; the autonomous runner's protocol): bots' device footwork before the tower / climb / danger
# guard, the give-up clock per device, the tower pushing a Lurk Mine aside, Skitter Bomb 60 hp, standing fire without
# per-frame garbage, a departed player's devices adopted by the host.
# 1. the full regression set (regress.sh: 17 page tests 3 at a time, sfx-cues / audio-pause alone, 7 two-client tests incl.
#    the new net-deploy scene=leave) + 4 Tower Command bot matches;
# 2. the package's own tests and the bot ones twice more (flakiness);
# 3. sub-tweaks' windup check (restored to the original: the Skitter Bomb unshootable in its bot rounds) ×6 on this head
#    and ×6 on the base 7ee5ad5 (a copy in $JOB_OUT/base) — the same check on both now.
# Summary → $JOB_OUT/summary.txt (+ windup.txt); the first 40 lines of any failing log → $JOB_OUT/fails.txt.
set -u
D=tools/botlab/jobs/batch5/deploy
S="$JOB_OUT/summary.txt"
echo "### deploy JOB-6 at $(git rev-parse --short HEAD)" | tee "$S"
LOG="$JOB_OUT/logs" PAR=3 MATCHES="halyard calamari treehills saltpan" $D/regress.sh 2>&1 | tee -a "$S"
for i in 2 3; do
  echo "### repeat $i" | tee -a "$S"
  LOG="$JOB_OUT/logs-$i" PAR=3 ONLY="deployables deployables-tower deployables-rail deployables-hedge sub-tweaks bot-specials bot-specials-tower net-deploy net-deploy-tower net-deploy-leave" $D/regress.sh 2>&1 | tee -a "$S"
done
# 3. windup: head vs base
mkdir -p "$JOB_OUT/base" "$JOB_OUT/wind"
git archive 7ee5ad5 | tar -x -C "$JOB_OUT/base" && ln -s "$PWD/node_modules" "$JOB_OUT/base/node_modules"
wind() {   # tag root i
  local tag=$1 root=$2 i=$3 L="$JOB_OUT/wind/$1-$3.log"
  (cd "$root" && env WATCHDOG=900000 MAP=testbox MODE=turf PAGE=tools/botlab/tests/sub-tweaks.js PAGE_ARGS=only=windup tools/botlab/run.sh tools/botlab/page.cjs > "$L" 2>&1)
  local line; line=$(grep -E '^(PASS|FAIL) a hard bot' "$L" | head -1)
  echo "== windup $tag $i: $(grep -E '^RESULT' "$L" | tail -1) | ${line:0:4} | $(echo "$line" | grep -o '{.*' | cut -c1-900)"
}
export -f wind; export JOB_OUT
echo "### windup (sub-tweaks only=windup): head $(git rev-parse --short HEAD) vs base 7ee5ad5" | tee "$JOB_OUT/windup.txt"
for i in 1 2 3 4 5 6; do echo "head $PWD $i"; echo "base $JOB_OUT/base $i"; done | xargs -P 3 -L 1 bash -c 'wind "$@"' _ | sort | tee -a "$JOB_OUT/windup.txt"
for f in "$JOB_OUT"/logs*/*.log "$JOB_OUT"/wind/*.log; do
  if grep -qE '^FAIL|FRAME ERRORS|WATCHDOG|HARNESS' "$f"; then echo "--- $f"; grep -E '^FAIL|FRAME ERRORS|WATCHDOG|HARNESS|^CONSOLE [1-9]|^  \[' "$f" | head -20 | cut -c1-600; fi
done > "$JOB_OUT/fails.txt"
echo "SUMMARY $(grep -c '^== ' "$S") runs, $(grep -c '^FAIL' "$S") FAIL lines; windup head FAIL $(grep -c '^== windup head.*| FAIL' "$JOB_OUT/windup.txt")/6, base FAIL $(grep -c '^== windup base.*| FAIL' "$JOB_OUT/windup.txt")/6"
