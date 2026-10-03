#!/bin/bash
# batch 5 "deploy" regressions (deployables can be shot; the tower crushes devices; devices ride moving floors): the page
# tests in a batch (PAR at once), then the ones that fail under load ALONE (sfx-cues, audio-pause), then the online ones,
# then Tower Command bot matches. Prints each test's RESULT and its FAIL lines (and each match's summary + DEPLOY line).
#   tools/botlab/jobs/batch5/deploy/regress.sh              (env: BOTLAB_OUT / SLOTS for run.sh; PAR, default 3)
#   ONLY="deployables surf" tools/botlab/jobs/batch5/deploy/regress.sh     (just those names)
set -u
ROOT=$(cd "$(dirname "$0")/../../../../.." && pwd); cd "$ROOT"
PAR=${PAR:-3}; ONLY=${ONLY:-}
T=tools/botlab/tests; RUN=tools/botlab/run.sh
LOG=${LOG:-$ROOT/.botlab/b5-deploy-regress}; mkdir -p "$LOG"
one() {   # name env… harness
  local name=$1; shift
  env "$@" > "$LOG/$name.log" 2>&1
  echo "== $name: $(grep -E '^RESULT' "$LOG/$name.log" | tail -1) $(grep -c '^FAIL' "$LOG/$name.log") FAIL"
  grep -E '^FAIL|HARNESS|WATCHDOG|MAP MISMATCH|console errors: [^n]' "$LOG/$name.log" | cut -c1-600
}
match() {   # name env… (tower-match.cjs)
  local name=$1; shift
  env "$@" WATCHDOG=900000 $RUN tools/botlab/tower-match.cjs > "$LOG/$name.log" 2>&1
  echo "== $name"; grep -E '^== |DEPLOY|FRAME ERRORS|^CONSOLE|WATCHDOG|MAP MISMATCH' "$LOG/$name.log" | cut -c1-400
  grep -A20 '^CONSOLE [1-9]' "$LOG/$name.log" | grep '^  ' | head -8
}
want() { [ -z "$ONLY" ] && return 0; case " $ONLY " in *" $1 "*) return 0;; esac; return 1; }
export -f one; export LOG RUN T
batch=(
  "deployables MAP=testbox MODE=turf PAGE=$T/deployables.js $RUN tools/botlab/page.cjs"
  "deployables-tower MAP=testbox MODE=tower PAGE=$T/deployables.js PAGE_ARGS=only=tower $RUN tools/botlab/page.cjs"
  "deployables-rail MAP=calamari MODE=turf PAGE=$T/deployables.js PAGE_ARGS=only=rail $RUN tools/botlab/page.cjs"
  "deployables-hedge MAP=podbox MODE=turf PAGE=$T/deployables.js PAGE_ARGS=only=hedge $RUN tools/botlab/page.cjs"
  "sub-tweaks MAP=testbox MODE=turf PAGE=$T/sub-tweaks.js $RUN tools/botlab/page.cjs"
  "sub-tweaks2 MAP=testbox MODE=turf PAGE=$T/sub-tweaks2.js $RUN tools/botlab/page.cjs"
  "sub-scale MAP=testbox MODE=turf PAGE=$T/sub-scale.js $RUN tools/botlab/page.cjs"
  "surf MAP=testbox MODE=turf PAGE=$T/surf.js $RUN tools/botlab/page.cjs"
  "surf-tower MAP=podbox MODE=tower PAGE=$T/surf-movers.js $RUN tools/botlab/page.cjs"
  "surf-hedge MAP=podbox MODE=turf PAGE=$T/surf-movers.js PAGE_ARGS=only=hedge $RUN tools/botlab/page.cjs"
  "surf-calamari MAP=calamari MODE=turf PAGE=$T/surf-movers.js $RUN tools/botlab/page.cjs"
  "tower-rules MAP=testbox MODE=tower PAGE=$T/tower-rules.js $RUN tools/botlab/page.cjs"
  "tower-ink MAP=testbox MODE=tower PAGE=$T/tower-ink.js $RUN tools/botlab/page.cjs"
  "bot-specials MAP=testbox MODE=turf PAGE=$T/bot-specials.js $RUN tools/botlab/page.cjs"
  "bot-specials-tower MAP=testbox MODE=tower PAGE=$T/bot-specials.js $RUN tools/botlab/page.cjs"
  "movers MAP=calamari MODE=turf PAGE=$T/movers.js $RUN tools/botlab/page.cjs"
  "pods MAP=podbox MODE=turf PAGE=$T/pods.js $RUN tools/botlab/page.cjs"
)
for b in "${batch[@]}"; do want "${b%% *}" && echo "$b"; done | xargs -P "$PAR" -L 1 bash -c 'one "$@"' _
# alone
want sfx-cues && one sfx-cues MAP=testbox MODE=turf PAGE=$T/sfx-cues.js $RUN tools/botlab/page.cjs
want audio-pause && one audio-pause MAP=testbox MODE=turf PAGE=$T/audio-pause.js $RUN tools/botlab/page.cjs
# online
want net-deploy && one net-deploy CLIENTS=2 Q0=autopilot Q1=autopilot NET=$T/net-deploy.cjs $RUN tools/botlab/netpage.cjs
want net-deploy-tower && one net-deploy-tower CLIENTS=2 Q0=autopilot Q1=autopilot NET_ARGS=scene=tower NET=$T/net-deploy.cjs $RUN tools/botlab/netpage.cjs
want net-surf && one net-surf CLIENTS=2 Q0=autopilot Q1=autopilot NET=$T/net-surf.cjs $RUN tools/botlab/netpage.cjs
want net-surf-tower && one net-surf-tower CLIENTS=2 Q0=autopilot Q1=autopilot NET_ARGS=scene=tower NET=$T/net-surf.cjs $RUN tools/botlab/netpage.cjs
want net-practice && one net-practice CLIENTS=2 Q0=autopilot Q1=autopilot NET=$T/net-practice.cjs $RUN tools/botlab/netpage.cjs
want net-turf && one net-turf CLIENTS=2 Q0=autopilot Q1=autopilot NET=$T/net-turf.cjs $RUN tools/botlab/netpage.cjs
# Tower Command bot matches (devices crushed / shot down without errors): MATCHES="halyard calamari …"
for M in ${MATCHES:-}; do want "tm-$M" || want tower-matches && match "tm-$M" MAP=$M; done
exit 0
