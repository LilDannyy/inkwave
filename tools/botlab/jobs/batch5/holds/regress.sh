#!/bin/bash
# batch5 holds regressions (both hands on the brush / roller / blaster / brolly): the holds test (REP times), the page
# tests the lead listed (PAR at once), net-mock and net-holds (two clients, both weapon pairs), the lobby line-up's HEY!
# (lobby-shots.cjs, the offline room), then 90 s all-bot matches
# (the four weapons mirrored, and the default loadouts). Prints each run's RESULT and FAIL lines and the matches' console errors.
#   tools/botlab/jobs/batch5/holds/regress.sh            (env: BOTLAB_OUT / SLOTS for run.sh; PAR default 3, REP default 3)
#   ONLY="holds world-build" tools/botlab/jobs/batch5/holds/regress.sh     (just those names)
set -u
ROOT=$(cd "$(dirname "$0")/../../../../.." && pwd); cd "$ROOT"
PAR=${PAR:-3}; REP=${REP:-3}; ONLY=${ONLY:-}
T=tools/botlab/tests; RUN=tools/botlab/run.sh
LOG=${LOG:-$ROOT/.botlab/b5-holds-regress}; mkdir -p "$LOG"
one() {   # name env… harness
  local name=$1; shift
  env WATCHDOG=900000 "$@" > "$LOG/$name.log" 2>&1
  echo "== $name: $(grep -E '^RESULT' "$LOG/$name.log" | tail -1) $(grep -c '^FAIL' "$LOG/$name.log") FAIL"
  grep -E '^FAIL|HARNESS|WATCHDOG|MAP MISMATCH|console errors: [^n]|uncaught' "$LOG/$name.log" | cut -c1-600
}
match() {   # name env…: a 90 s all-bot match; its splats per weapon and its console warnings / errors
  local name=$1; shift
  env WATCHDOG=900000 SECS=90 "$@" $RUN tools/botlab/match.cjs > "$LOG/$name.log" 2>&1
  echo "== $name: $(grep -cE '^RESULT_JSON' "$LOG/$name.log") result line(s)"
  grep -E '^== |by weapon|FRAME ERRORS|^CONSOLE|^  \[|WATCHDOG|HARNESS|MAP MISMATCH' "$LOG/$name.log" | cut -c1-400 | head -24
}
want() { [ -z "$ONLY" ] && return 0; case " $ONLY " in *" $1 "*) return 0;; esac; return 1; }
export -f one; export LOG RUN T
batch=()
for i in $(seq 1 "$REP"); do batch+=("holds-$i MAP=testbox MODE=turf PAGE=$T/holds.js $RUN tools/botlab/page.cjs"); done
batch+=(
  "world-build MAP=halyard PAGE=$T/world-build.js $RUN tools/botlab/page.cjs"
  "hud-lead MAP=testbox MODE=turf PAGE=$T/hud-lead.js $RUN tools/botlab/page.cjs"
  "hud-lead-zones MAP=testbox MODE=zones PAGE=$T/hud-lead.js $RUN tools/botlab/page.cjs"
  "hud-lead-tower MAP=testbox MODE=tower PAGE=$T/hud-lead.js $RUN tools/botlab/page.cjs"
  "input-swim MAP=testbox PAGE=$T/input-swim.js $RUN tools/botlab/page.cjs"
  "loadout-picker MAP=testbox PAGE=$T/loadout-picker.js $RUN tools/botlab/page.cjs"
)
for b in "${batch[@]}"; do n="${b%% *}"; want "${n%-[0-9]*}" || want "$n" && echo "$b"; done | xargs -P "$PAR" -L 1 bash -c 'one "$@"' _
want net-mock && one net-mock CLIENTS=1 Q0='netmock=1&mockauto=0' NET=$T/net-mock.cjs $RUN tools/botlab/netpage.cjs
want net-holds && one net-holds-a CLIENTS=2 Q0=autopilot Q1=autopilot NET=$T/net-holds.cjs NET_ARGS='a=roller;b=brolly' $RUN tools/botlab/netpage.cjs
want net-holds && one net-holds-b CLIENTS=2 Q0=autopilot Q1=autopilot NET=$T/net-holds.cjs NET_ARGS='a=brush;b=blaster' $RUN tools/botlab/netpage.cjs
want lobby && { mkdir -p "$LOG/lobby"; one lobby-hey CLIENTS=1 Q0='netmock=1&mockauto=0' NET=tools/botlab/jobs/batch5/holds/lobby-shots.cjs NET_ARGS=lobby-room OUT="$LOG/lobby" $RUN tools/botlab/netpage.cjs; }
want match && {
  match match-four MAP=halyard MODE=turf WEAPONS='brush,roller,blaster,brolly,brush,roller,blaster,brolly'
  match match-four-zones MAP=crossmarket MODE=zones WEAPONS='brolly,blaster,roller,brush,brolly,blaster,roller,brush'
  match match-default MAP=calamari MODE=turf
}
exit 0
