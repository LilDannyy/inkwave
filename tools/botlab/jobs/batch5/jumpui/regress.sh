#!/bin/bash
# jumpui regressions (b5-jumpui: super-jump alerts / named landing tags, Ink Jet / Zipline return marks): the page tests
# in a batch (PAR at once), then sfx-cues ALONE (it fails under load), then the online ones. Prints each test's RESULT and
# its FAIL lines.
#   tools/botlab/jobs/batch5/jumpui/regress.sh               (env: BOTLAB_OUT / SLOTS for run.sh; PAR, default 3)
#   ONLY="jump-ui net-jump-ui" tools/botlab/jobs/batch5/jumpui/regress.sh     (just those names)
#   REP=3: the jump-ui / net-jump-ui runs repeated (names -1 … -REP)
set -u
ROOT=$(cd "$(dirname "$0")/../../../../.." && pwd); cd "$ROOT"
PAR=${PAR:-3}; ONLY=${ONLY:-}; REP=${REP:-1}
T=tools/botlab/tests; RUN=tools/botlab/run.sh
LOG=${LOG:-$ROOT/.botlab/jumpui-regress}; mkdir -p "$LOG"
one() {   # name env… harness
  local name=$1; shift
  env "$@" > "$LOG/$name.log" 2>&1
  echo "== $name: $(grep -E '^RESULT' "$LOG/$name.log" | tail -1) $(grep -c '^FAIL' "$LOG/$name.log") FAIL"
  grep -E '^FAIL|HARNESS|WATCHDOG|MAP MISMATCH|console errors: [^n]|timed out' "$LOG/$name.log" | cut -c1-600
}
want() { [ -z "$ONLY" ] && return 0; local b=${1%-[0-9]*}; case " $ONLY " in *" $1 "*|*" $b "*) return 0;; esac; return 1; }
export -f one; export LOG RUN T
batch=()
for i in $(seq 1 "$REP"); do batch+=("jump-ui-$i MAP=testbox MODE=turf WATCHDOG=900000 PAGE=$T/jump-ui.js $RUN tools/botlab/page.cjs"); done
batch+=(
  "jump-ui-zones MAP=testbox MODE=zones WATCHDOG=900000 PAGE=$T/jump-ui.js $RUN tools/botlab/page.cjs"
  "hud-lead MAP=testbox MODE=turf WATCHDOG=900000 PAGE=$T/hud-lead.js $RUN tools/botlab/page.cjs"
  "hud-lead-zones MAP=testbox MODE=zones WATCHDOG=900000 PAGE=$T/hud-lead.js $RUN tools/botlab/page.cjs"
  "hud-lead-tower MAP=testbox MODE=tower WATCHDOG=900000 PAGE=$T/hud-lead.js $RUN tools/botlab/page.cjs"
  "map-reveal MAP=testbox MODE=turf WATCHDOG=900000 PAGE=$T/map-reveal.js $RUN tools/botlab/page.cjs"
  "input-swim MAP=testbox WATCHDOG=900000 PAGE=$T/input-swim.js $RUN tools/botlab/page.cjs"
  "bot-specials MAP=testbox MODE=turf WATCHDOG=900000 PAGE=$T/bot-specials.js $RUN tools/botlab/page.cjs"
)
for b in "${batch[@]}"; do want "${b%% *}" && echo "$b"; done | xargs -P "$PAR" -L 1 bash -c 'one "$@"' _
# alone
want sfx-cues && one sfx-cues MAP=testbox MODE=turf WATCHDOG=900000 PAGE=$T/sfx-cues.js $RUN tools/botlab/page.cjs
# online (one at a time)
for i in $(seq 1 "$REP"); do want "net-jump-ui-$i" && one "net-jump-ui-$i" CLIENTS=2 WATCHDOG=900000 NET=$T/net-jump-ui.cjs $RUN tools/botlab/netpage.cjs; done
for i in $(seq 1 "$REP"); do want "net-jump-ui-tower-$i" && one "net-jump-ui-tower-$i" CLIENTS=2 WATCHDOG=900000 NET=$T/net-jump-ui.cjs NET_ARGS=scene=tower $RUN tools/botlab/netpage.cjs; done
want net-practice && one net-practice CLIENTS=2 Q0=autopilot Q1=autopilot WATCHDOG=900000 NET=$T/net-practice.cjs $RUN tools/botlab/netpage.cjs
want net-turf && one net-turf CLIENTS=2 Q0=autopilot Q1=autopilot WATCHDOG=900000 NET=$T/net-turf.cjs $RUN tools/botlab/netpage.cjs
exit 0
