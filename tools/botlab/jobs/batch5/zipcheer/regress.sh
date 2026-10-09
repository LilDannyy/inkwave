#!/bin/bash
# [b5-zipcheer] regressions: this package's own tests, then the ones the lead listed — page tests in a batch (PAR at
# once), the audio ones ALONE (sfx-cues, audio-pause), then the online ones one at a time. Prints each test's RESULT and
# its FAIL lines (compact).
#   tools/botlab/jobs/batch5/zipcheer/regress.sh                 (env: BOTLAB_OUT / SLOTS for run.sh; PAR, default 3)
#   ONLY="zipcheer net-zipcheer" tools/botlab/jobs/batch5/zipcheer/regress.sh     (just those names)
set -u
ROOT=$(cd "$(dirname "$0")/../../../../.." && pwd); cd "$ROOT"
PAR=${PAR:-3}; ONLY=${ONLY:-}
T=tools/botlab/tests; RUN=tools/botlab/run.sh
LOG=${LOG:-$ROOT/.botlab/zipcheer-regress}; mkdir -p "$LOG"
one() {   # name env… harness
  local name=$1; shift
  env WATCHDOG=900000 "$@" > "$LOG/$name.log" 2>&1
  echo "== $name: $(grep -E '^RESULT' "$LOG/$name.log" | tail -1) $(grep -c '^FAIL' "$LOG/$name.log") FAIL"
  grep -E '^FAIL|HARNESS|WATCHDOG|MAP MISMATCH|console errors: [^n]' "$LOG/$name.log" | cut -c1-600
}
want() { [ -z "$ONLY" ] && return 0; case " $ONLY " in *" $1 "*) return 0;; esac; return 1; }
export -f one; export LOG RUN T
batch=(
  "zipcheer MAP=testbox MODE=turf PAGE=$T/zipcheer.js $RUN tools/botlab/page.cjs"
  "zipcheer-tower MAP=testbox MODE=tower PAGE=$T/zipcheer.js $RUN tools/botlab/page.cjs"
  "tower-rules MAP=testbox MODE=tower PAGE=$T/tower-rules.js $RUN tools/botlab/page.cjs"
  "bot-specials MAP=testbox MODE=turf PAGE=$T/bot-specials.js $RUN tools/botlab/page.cjs"
  "bot-specials-tower MAP=testbox MODE=tower PAGE=$T/bot-specials.js $RUN tools/botlab/page.cjs"
  "hud-lead MAP=testbox MODE=turf PAGE=$T/hud-lead.js $RUN tools/botlab/page.cjs"
  "hud-lead-zones MAP=testbox MODE=zones PAGE=$T/hud-lead.js $RUN tools/botlab/page.cjs"
  "input-swim MAP=testbox PAGE=$T/input-swim.js $RUN tools/botlab/page.cjs"
  "track-arrows MAP=testbox MODE=turf PAGE=$T/track-arrows.js $RUN tools/botlab/page.cjs"
)
for b in "${batch[@]}"; do want "${b%% *}" && echo "$b"; done | xargs -P "$PAR" -L 1 bash -c 'one "$@"' _
# alone
want sfx-cues && one sfx-cues MAP=testbox MODE=turf PAGE=$T/sfx-cues.js $RUN tools/botlab/page.cjs
want audio-pause && one audio-pause MAP=testbox MODE=turf PAGE=$T/audio-pause.js $RUN tools/botlab/page.cjs
# online
want net-zipcheer && one net-zipcheer CLIENTS=2 NET=$T/net-zipcheer.cjs $RUN tools/botlab/netpage.cjs
want net-practice && one net-practice CLIENTS=2 Q0=autopilot Q1=autopilot APP_CSP=1 NET=$T/net-practice.cjs $RUN tools/botlab/netpage.cjs
want net-turf && one net-turf CLIENTS=2 Q0=autopilot Q1=autopilot NET=$T/net-turf.cjs $RUN tools/botlab/netpage.cjs
exit 0
