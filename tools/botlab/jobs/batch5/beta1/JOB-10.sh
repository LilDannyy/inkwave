#!/bin/bash
# kind: tests
# after: JOB-9
# Beta fix round 1, JOB-10: Highmark Foundry's lava-bots gate, final code against the round's base (632398c3, a git
# archive in $JOB_OUT), six runs each, alternating — this Mac's last final-code run met 1 escape + 1 fight death (both
# chargers, 75–76 s); the runs since the mid-hop start left lava stages: 5 of 6 passed. Each run's deaths listed.
set -u
J=${JOB_OUT:-.botlab/beta1-job10}
mkdir -p "$J/logs" "$J/base"
echo "### beta1 JOB-10 head ${JOB_SHA:-?}"
git archive 632398c3 | tar -x -C "$J/base" && ln -s "$PWD/node_modules" "$J/base/node_modules" && echo "## base: 632398c3"
lb() { local n=$1 dir=$2
  ( cd "$dir" && env WATCHDOG=1500000 MAP=caldera MODE=turf PAGE=tools/botlab/tests/lava-bots.js tools/botlab/run.sh tools/botlab/page.cjs ) > "$J/logs/$n.log" 2>&1
  grep -h -E '^RESULT' "$J/logs/$n.log" | sed "s/^/[$n] /"
  grep -h -E '^(PASS|FAIL) the gate' "$J/logs/$n.log" | grep -o '"esc":[0-9]*,"fight":[0-9]*,"list":.*' | cut -c1-380 | sed "s/^/[$n] /"; }
for k in 1 2 3 4 5 6; do lb "final-$k" "$PWD"; lb "base-$k" "$J/base"; done
echo "### done"
