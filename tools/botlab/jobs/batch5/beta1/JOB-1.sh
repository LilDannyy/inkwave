#!/bin/bash
# kind: tests
# Beta fix round 1, JOB-1 (the shipped build + the harness's DIAG / ISSUELOG lines): reproduce what the beta's issue log
# shows, before any fix.
#  1. first-frames.cjs on every stage (Cargo with DEVSTAGE=1): each stage's first match from a fresh page, every frame from
#     the moment it is on screen through the intro and 3 s of play, with the parts of each slow frame.
#  2. The stuck bots, 2 matches each with DIAG=1: Bazookarp on aquarium, bluestone, lockgate, halyard; Zone Control on
#     aquarium, bluestone; Tower Command and Turf War on bluestone. Each prints the harness's episodes (< 1 m in 3 s while
#     wanting to move) and the in-game issue log's stuck-bot entries of the same match (ISSUELOG).
#  3. The console lines of the int4 caldera matches (Turf War, Zone Control, Tower Command) and Bluestone Tower: one each.
set -u
J=${JOB_OUT:-.botlab/beta1-job1}
PAR=${PAR:-3}
mkdir -p "$J/logs"
echo "### beta1 JOB-1 head ${JOB_SHA:-?}"
# a compact summary of one run's log (the result lines, every stuck episode with its plans, the console lines), ≤ 150 lines
summ() { grep -E '^== |^   stuck |^      plan |^   STUCK|^   DIAG|^CONSOLE|^  \[|^RESULT|FRAME ERRORS|^WATCHDOG|^HARNESS|MAP MISMATCH|^   frame @|^   first frames|^PASS|^FAIL|^   ERAS shoves|^   fast fuse|^   carrier-stuck' "$1" | cut -c1-420 | head -150; }

# 1. first frames (alone: it measures real frame times)
DEVSTAGE=1 WATCHDOG=1500000 tools/botlab/run.sh tools/botlab/first-frames.cjs > "$J/logs/first-frames.log" 2>&1
summ "$J/logs/first-frames.log" > "$J/first-frames.txt"
grep -E '^== |^PASS|^FAIL|^RESULT|^WATCHDOG|^HARNESS' "$J/logs/first-frames.log"

# 2 + 3. the matches, PAR at a time
run() {   # run <name> <env…> <harness>
  local n=$1; shift
  ( env WATCHDOG=1200000 "$@" > "$J/logs/$n.log" 2>&1; summ "$J/logs/$n.log" > "$J/$n.txt"
    grep -h -E '^RESULT|^   stuck [0-9.]+%|^   STUCK|FRAME ERRORS|^WATCHDOG|^HARNESS|MAP MISMATCH|^CONSOLE' "$J/logs/$n.log" | cut -c1-300 | sed "s/^/[$n] /" ) &
}
i=0
step() { i=$((i + 1)); if (( i % PAR == 0 )); then wait; fi; }
for s in aquarium bluestone lockgate halyard; do for k in 1 2; do run "karp-$s-$k" MAP=$s DIAG=1 tools/botlab/run.sh tools/botlab/karp-match.cjs; step; done; done
for s in aquarium bluestone; do for k in 1 2; do run "zones-$s-$k" MAP=$s MODE=zones DIAG=1 tools/botlab/run.sh tools/botlab/match.cjs; step; done; done
for k in 1 2; do run "tower-bluestone-$k" MAP=bluestone DIAG=1 tools/botlab/run.sh tools/botlab/tower-match.cjs; step; done
for k in 1 2; do run "turf-bluestone-$k" MAP=bluestone MODE=turf SECS=180 DIAG=1 tools/botlab/run.sh tools/botlab/match.cjs; step; done
run "turf-caldera" MAP=caldera MODE=turf SECS=180 tools/botlab/run.sh tools/botlab/match.cjs; step
run "zones-caldera" MAP=caldera MODE=zones tools/botlab/run.sh tools/botlab/match.cjs; step
run "tower-caldera" MAP=caldera tools/botlab/run.sh tools/botlab/tower-match.cjs; step
wait
echo "### done"
