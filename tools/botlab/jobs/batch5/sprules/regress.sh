#!/bin/bash
# [b5-sprules] regressions: the package's own tests, the page tests its hook-ins touch, the audio ones ALONE, then the
# online ones (fix round 1: + sub-scale, sub-tweaks, track-arrows, hud-lead ×2, net-picker, net-lobbykit, net-mock, net-turf). Prints each test's RESULT and its FAIL lines.
#   tools/botlab/jobs/batch5/sprules/regress.sh        (env: BOTLAB_OUT / SLOTS for run.sh; PAR for the batch, default 3;
#                                                       ONLY='sp-rules net-sprules': just those, in their usual way)
set -u
ROOT=$(cd "$(dirname "$0")/../../../../.." && pwd); cd "$ROOT"
PAR=${PAR:-3}; ONLY=${ONLY:-}
T=tools/botlab/tests; RUN=tools/botlab/run.sh
LOG=${LOG:-$ROOT/.botlab/b5-sprules-regress}; mkdir -p "$LOG"
one() {   # name env… -- harness
  local name=$1; shift
  if [ -n "$ONLY" ] && ! [[ " $ONLY " == *" $name "* ]]; then return 0; fi
  env "$@" > "$LOG/$name.log" 2>&1
  echo "== $name: $(grep -E '^RESULT' "$LOG/$name.log" | tail -1) $(grep -c '^FAIL' "$LOG/$name.log") FAIL"
  grep -E '^FAIL|HARNESS|WATCHDOG|MAP MISMATCH|^console errors: [^n]' "$LOG/$name.log" | cut -c1-400
}
export -f one; export LOG RUN T ONLY
# the batch (PAR at once)
printf '%s\n' \
  "sp-rules MAP=testbox MODE=turf PAGE=$T/sp-rules.js WATCHDOG=900000 $RUN tools/botlab/page.cjs" \
  "bot-specials MAP=testbox MODE=turf PAGE=$T/bot-specials.js $RUN tools/botlab/page.cjs" \
  "drainbow MAP=testbox MODE=turf PAGE=$T/drainbow.js $RUN tools/botlab/page.cjs" \
  "surf MAP=testbox MODE=turf PAGE=$T/surf.js $RUN tools/botlab/page.cjs" \
  "sub-tweaks2 MAP=testbox MODE=turf PAGE=$T/sub-tweaks2.js $RUN tools/botlab/page.cjs" \
  "loadout-picker MAP=testbox PAGE=$T/loadout-picker.js $RUN tools/botlab/page.cjs" \
  "sub-scale MAP=testbox MODE=turf PAGE=$T/sub-scale.js WATCHDOG=900000 $RUN tools/botlab/page.cjs" \
  "sub-tweaks MAP=testbox MODE=turf PAGE=$T/sub-tweaks.js WATCHDOG=900000 $RUN tools/botlab/page.cjs" \
  "track-arrows MAP=testbox MODE=turf PAGE=$T/track-arrows.js $RUN tools/botlab/page.cjs" \
  "hud-lead-turf MAP=testbox MODE=turf PAGE=$T/hud-lead.js $RUN tools/botlab/page.cjs" \
  "hud-lead-zones MAP=testbox MODE=zones PAGE=$T/hud-lead.js $RUN tools/botlab/page.cjs" \
  | xargs -P "$PAR" -L 1 bash -c 'one "$@"' _
# alone
one sfx-cues MAP=testbox MODE=turf PAGE=$T/sfx-cues.js $RUN tools/botlab/page.cjs
one audio-pause MAP=testbox MODE=turf PAGE=$T/audio-pause.js $RUN tools/botlab/page.cjs
# online
one net-sprules CLIENTS=2 Q0=autopilot Q1=autopilot NET=$T/net-sprules.cjs WATCHDOG=900000 $RUN tools/botlab/netpage.cjs
one net-drainbow CLIENTS=2 NET=$T/net-drainbow.cjs $RUN tools/botlab/netpage.cjs
one net-surf CLIENTS=2 Q0=autopilot Q1=autopilot NET=$T/net-surf.cjs $RUN tools/botlab/netpage.cjs
one net-practice CLIENTS=2 Q0=autopilot Q1=autopilot APP_CSP=1 NET=$T/net-practice.cjs $RUN tools/botlab/netpage.cjs
one net-splatfeed CLIENTS=2 Q0=autopilot Q1=autopilot NET=$T/net-splatfeed.cjs $RUN tools/botlab/netpage.cjs
# (fix round 1: the online tests the SPECIAL_ORDER append reaches — the pickers walk to its last tile — and a whole
# online Turf War)
one net-picker CLIENTS=2 Q0=autopilot Q1=autopilot NET=$T/net-picker.cjs $RUN tools/botlab/netpage.cjs
one net-lobbykit CLIENTS=2 Q0=autopilot Q1=autopilot NET=$T/net-lobbykit.cjs $RUN tools/botlab/netpage.cjs
one net-mock CLIENTS=1 Q0='netmock=1&mockauto=0' NET=$T/net-mock.cjs $RUN tools/botlab/netpage.cjs
one net-turf CLIENTS=2 Q0=autopilot Q1=autopilot NET=$T/net-turf.cjs $RUN tools/botlab/netpage.cjs
