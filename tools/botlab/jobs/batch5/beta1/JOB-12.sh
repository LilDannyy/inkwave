#!/bin/bash
# kind: tests
# after: JOB-11
# Beta fix round 1, JOB-12: the lava-bots gate again, final code (56b84448: the long ink step off lava stages) against the base (1378ceb2 + the
# issue log's clone fix), six runs each, alternating — JOB-10: the final code 3 of 6, the base 6 of 6.
set -u
J=${JOB_OUT:-.botlab/beta1-job12}
mkdir -p "$J/logs" "$J/base"
echo "### beta1 JOB-12 head ${JOB_SHA:-?}"
# (the base: 1378ceb2 — the round before any gameplay change in bots.js — with d3e4f164's issueLog.js on top, as JOB-6's:
# the shipped issue log throws inside the frame on Highmark Foundry)
git archive 1378ceb2 | tar -x -C "$J/base" && ln -s "$PWD/node_modules" "$J/base/node_modules" && git show d3e4f164 -- src/core/issueLog.js | (cd "$J/base" && patch -p1 -s) && echo "## base: 1378ceb2 + d3e4f164 issueLog.js"
lb() { local n=$1 dir=$2
  ( cd "$dir" && env WATCHDOG=1500000 MAP=caldera MODE=turf PAGE=tools/botlab/tests/lava-bots.js tools/botlab/run.sh tools/botlab/page.cjs ) > "$J/logs/$n.log" 2>&1
  grep -h -E '^RESULT' "$J/logs/$n.log" | sed "s/^/[$n] /"
  grep -h -E '^(PASS|FAIL) the gate' "$J/logs/$n.log" | grep -o '"esc":[0-9]*,"fight":[0-9]*,"list":.*' | cut -c1-380 | sed "s/^/[$n] /"; }
for k in 1 2 3 4 5 6; do lb "final-$k" "$PWD"; lb "base-$k" "$J/base"; done
echo "### done"
