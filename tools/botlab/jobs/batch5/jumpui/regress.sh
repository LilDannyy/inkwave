#!/bin/bash
# jumpui regressions (b5-jumpui: super-jump alerts / named landing tags, Ink Jet / Zipline return marks): the page tests
# in a batch (PAR at once), then sfx-cues ALONE (it fails under load), then the online ones. Prints each test's RESULT and
# its FAIL lines.
#   tools/botlab/jobs/batch5/jumpui/regress.sh               (env: BOTLAB_OUT / SLOTS for run.sh; PAR, default 3)
#   ONLY="jump-ui net-jump-ui" tools/botlab/jobs/batch5/jumpui/regress.sh     (just those names)
#   REP=3: the jump-ui / net-jump-ui runs repeated (names -1 … -REP)
#   (jump-ui in every mode — Turf War, Zone Control, Tower Command, Boss Battle — at every size: the offscreen window's
#   1512×945, 1280×720 and 960×600 (W / H, page.cjs), all its checks; the Turf War one at 1512×945 REP times.
#   ONLY="jump-ui" the Turf War ones (the REP runs, 1280, 960); "jump-ui-zones" Zone Control at each size;
#   "jump-ui-zones-960" one cell; "jump-ui-all" the whole matrix)
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
want() { [ -z "$ONLY" ] && return 0; local b=${1%-[0-9]*}; case " $ONLY " in *" $1 "*|*" $b "*) return 0;; esac
  case "$1" in jump-ui-*) case " $ONLY " in *" jump-ui-all "*) return 0;; esac;; esac; return 1; }
export -f one; export LOG RUN T
batch=()
for i in $(seq 1 "$REP"); do batch+=("jump-ui-$i MAP=testbox MODE=turf WATCHDOG=900000 PAGE=$T/jump-ui.js $RUN tools/botlab/page.cjs"); done
# the matrix: every mode at every size (turf at 1512×945: the REP runs above)
for md in turf zones tower boss; do
  n=jump-ui; [ "$md" != turf ] && n="jump-ui-$md"
  [ "$md" != turf ] && batch+=("$n MAP=testbox MODE=$md WATCHDOG=900000 PAGE=$T/jump-ui.js $RUN tools/botlab/page.cjs")
  batch+=("$n-1280 MAP=testbox MODE=$md W=1280 H=720 WATCHDOG=900000 PAGE=$T/jump-ui.js $RUN tools/botlab/page.cjs")
  batch+=("$n-960 MAP=testbox MODE=$md W=960 H=600 WATCHDOG=900000 PAGE=$T/jump-ui.js $RUN tools/botlab/page.cjs")
done
batch+=(
  "tower-ink MAP=testbox MODE=tower WATCHDOG=900000 PAGE=$T/tower-ink.js $RUN tools/botlab/page.cjs"
  "sub-tweaks MAP=testbox MODE=turf WATCHDOG=900000 PAGE=$T/sub-tweaks.js $RUN tools/botlab/page.cjs"
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
