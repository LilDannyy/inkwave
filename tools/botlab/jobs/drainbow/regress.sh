#!/bin/bash
# Drainbow regressions: the page tests its hook-ins touch, then the ones that fail under load ALONE (sfx-cues,
# audio-pause), then the online ones. Prints each test's RESULT and its FAIL lines.
#   tools/botlab/jobs/drainbow/regress.sh            (env: BOTLAB_OUT / SLOTS for run.sh; PAR for the batch, default 3)
set -u
ROOT=$(cd "$(dirname "$0")/../../../.." && pwd); cd "$ROOT"
PAR=${PAR:-3}
T=tools/botlab/tests; RUN=tools/botlab/run.sh
LOG=${LOG:-$ROOT/.botlab/drainbow-regress}; mkdir -p "$LOG"
one() {   # name env… -- harness
  local name=$1; shift
  env "$@" > "$LOG/$name.log" 2>&1
  echo "== $name: $(grep -E '^RESULT' "$LOG/$name.log" | tail -1) $(grep -c '^FAIL' "$LOG/$name.log") FAIL"
  grep -E '^FAIL|HARNESS|WATCHDOG|MAP MISMATCH' "$LOG/$name.log" | cut -c1-400
}
export -f one; export LOG RUN T
# the batch (PAR at once)
printf '%s\n' \
  "drainbow MAP=testbox MODE=turf PAGE=$T/drainbow.js $RUN tools/botlab/page.cjs" \
  "bot-specials MAP=testbox MODE=turf PAGE=$T/bot-specials.js $RUN tools/botlab/page.cjs" \
  "bot-specials-tower MAP=testbox MODE=tower PAGE=$T/bot-specials.js $RUN tools/botlab/page.cjs" \
  "tower-rules MAP=testbox MODE=tower PAGE=$T/tower-rules.js $RUN tools/botlab/page.cjs" \
  "bot-sight MAP=testbox MODE=turf PAGE=$T/bot-sight.js $RUN tools/botlab/page.cjs" \
  "world-build MAP=halyard PAGE=$T/world-build.js $RUN tools/botlab/page.cjs" \
  "surf MAP=testbox MODE=turf PAGE=$T/surf.js $RUN tools/botlab/page.cjs" \
  | xargs -P "$PAR" -L 1 bash -c 'one "$@"' _
# alone
one sfx-cues MAP=testbox MODE=turf PAGE=$T/sfx-cues.js $RUN tools/botlab/page.cjs
one audio-pause MAP=testbox MODE=turf PAGE=$T/audio-pause.js $RUN tools/botlab/page.cjs
# online
one net-practice CLIENTS=2 Q0=autopilot Q1=autopilot APP_CSP=1 NET=$T/net-practice.cjs $RUN tools/botlab/netpage.cjs
one net-drainbow CLIENTS=2 NET=$T/net-drainbow.cjs $RUN tools/botlab/netpage.cjs
one net-surf CLIENTS=2 NET=$T/net-surf.cjs $RUN tools/botlab/netpage.cjs
