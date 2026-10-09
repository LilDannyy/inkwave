#!/bin/bash
# kind: tests
# JOB-5 — sprules fix round 1, at the final code: the widened regression set (regress.sh — the package's own tests, the
# page tests its hook-ins touch, sfx-cues / audio-pause alone, the online ones; new this round: sub-scale, sub-tweaks,
# track-arrows, hud-lead turf + zones, net-picker, net-lobbykit, net-mock, net-turf), then the package's own tests and
# the two picker tests the SPECIAL_ORDER append broke, twice more each (flakiness). ~60 min.
set -u
R=tools/botlab/jobs/batch5/sprules/regress.sh
O=${JOB_OUT:-.botlab/sprules-j5}; mkdir -p "$O"; S=$O/summary.txt
tails() {   # a test with no RESULT line: its log's last 20 lines
  for f in "$1"/*.log; do grep -q '^RESULT' "$f" || { echo "### $(basename "$f" .log): no RESULT — last lines"; tail -20 "$f" | cut -c1-300; }; done
}
echo "### round 1 @ ${JOB_SHA:-?}: the whole regress.sh" | tee -a "$S"
PAR=${PAR:-3} LOG=.botlab/sprules-j5-1 $R 2>&1 | tee -a "$S"
tails .botlab/sprules-j5-1 | tee -a "$S"
for i in 2 3; do
  echo "### round $i: sp-rules net-sprules net-picker net-lobbykit" | tee -a "$S"
  ONLY='sp-rules net-sprules net-picker net-lobbykit' PAR=${PAR:-3} LOG=.botlab/sprules-j5-$i $R 2>&1 | tee -a "$S"
  tails .botlab/sprules-j5-$i | tee -a "$S"
done
