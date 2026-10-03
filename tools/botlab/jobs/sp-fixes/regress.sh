#!/bin/bash
# sp-fixes regressions (Drainbow one shade + blind bots; Surf N' Turf on moving things): the page tests they touch in a
# batch (PAR at once), then the ones that fail under load ALONE (sfx-cues, audio-pause), then the online ones. Prints
# each test's RESULT and its FAIL lines.
#   tools/botlab/jobs/sp-fixes/regress.sh                 (env: BOTLAB_OUT / SLOTS for run.sh; PAR, default 3)
#   ONLY="drainbow surf" tools/botlab/jobs/sp-fixes/regress.sh     (just those names)
set -u
ROOT=$(cd "$(dirname "$0")/../../../.." && pwd); cd "$ROOT"
PAR=${PAR:-3}; ONLY=${ONLY:-}
T=tools/botlab/tests; RUN=tools/botlab/run.sh
LOG=${LOG:-$ROOT/.botlab/spfix-regress}; mkdir -p "$LOG"
one() {   # name env… harness
  local name=$1; shift
  env "$@" > "$LOG/$name.log" 2>&1
  echo "== $name: $(grep -E '^RESULT' "$LOG/$name.log" | tail -1) $(grep -c '^FAIL' "$LOG/$name.log") FAIL"
  grep -E '^FAIL|HARNESS|WATCHDOG|MAP MISMATCH|console errors: [^n]' "$LOG/$name.log" | cut -c1-600
}
want() { [ -z "$ONLY" ] && return 0; case " $ONLY " in *" $1 "*) return 0;; esac; return 1; }
export -f one; export LOG RUN T
batch=(
  "drainbow MAP=testbox MODE=turf PAGE=$T/drainbow.js $RUN tools/botlab/page.cjs"
  "surf MAP=testbox MODE=turf PAGE=$T/surf.js $RUN tools/botlab/page.cjs"
  "surf-roof MAP=podbox MODE=turf PAGE=$T/surf.js PAGE_ARGS=only=roof $RUN tools/botlab/page.cjs"
  "surf-tower MAP=podbox MODE=tower PAGE=$T/surf-movers.js $RUN tools/botlab/page.cjs"
  "surf-hedge MAP=podbox MODE=turf PAGE=$T/surf-movers.js PAGE_ARGS=only=hedge $RUN tools/botlab/page.cjs"
  "surf-calamari MAP=calamari MODE=turf PAGE=$T/surf-movers.js $RUN tools/botlab/page.cjs"
  "bot-specials MAP=testbox MODE=turf PAGE=$T/bot-specials.js $RUN tools/botlab/page.cjs"
  "bot-specials-tower MAP=testbox MODE=tower PAGE=$T/bot-specials.js $RUN tools/botlab/page.cjs"
  "tower-rules MAP=testbox MODE=tower PAGE=$T/tower-rules.js $RUN tools/botlab/page.cjs"
  "movers MAP=calamari MODE=turf PAGE=$T/movers.js $RUN tools/botlab/page.cjs"
  "bot-sight MAP=testbox MODE=turf PAGE=$T/bot-sight.js $RUN tools/botlab/page.cjs"
  "world-build MAP=halyard PAGE=$T/world-build.js $RUN tools/botlab/page.cjs"
)
for b in "${batch[@]}"; do want "${b%% *}" && echo "$b"; done | xargs -P "$PAR" -L 1 bash -c 'one "$@"' _
# alone
want sfx-cues && one sfx-cues MAP=testbox MODE=turf PAGE=$T/sfx-cues.js $RUN tools/botlab/page.cjs
want audio-pause && one audio-pause MAP=testbox MODE=turf PAGE=$T/audio-pause.js $RUN tools/botlab/page.cjs
# online
want net-drainbow && one net-drainbow CLIENTS=2 NET=$T/net-drainbow.cjs $RUN tools/botlab/netpage.cjs
want net-surf && one net-surf CLIENTS=2 Q0=autopilot Q1=autopilot NET=$T/net-surf.cjs $RUN tools/botlab/netpage.cjs
want net-surf-tower && one net-surf-tower CLIENTS=2 Q0=autopilot Q1=autopilot NET=$T/net-surf.cjs NET_ARGS='scene=tower' $RUN tools/botlab/netpage.cjs
want net-practice && one net-practice CLIENTS=2 Q0=autopilot Q1=autopilot APP_CSP=1 NET=$T/net-practice.cjs $RUN tools/botlab/netpage.cjs
exit 0
