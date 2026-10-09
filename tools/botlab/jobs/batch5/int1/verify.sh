#!/bin/bash
# batch5 int1 (the wave-1 integration, b5-int1): the verification set, as one list. Runs on the Mac mini (a JOB-<n>.sh
# calls it) and locally (PAR=1). Each entry: "<group> <name> ENV=… <harness>"; groups:
#   own     every new test of the six wave-1 packages (tuning, holds, deploy, sprules, zipcheer, jumpui) + int1's own
#   reg     the page-test regressions the lead listed
#   net     the online (two-client) tests — run one at a time ("alone": a two-client timing check fails under load)
#   rep     the known issues' repeats (bot-specials, jump-ui 960×600, surf; 6 each)
#   match   bot matches: the 12 offline stages × Turf War / Zone Control / Tower Command, random loadouts
#   audio   sfx-cues and audio-pause, one at a time, nothing else running
# Env: SETS (default "own reg net rep match audio"), ONLY (names, space separated: just those), PAR (parallel runs in
# the page groups and the matches; net + audio always 1), REP (rep's count, 6), SECS_TURF (Turf War seconds, 180),
# DUR_TOWER (Tower Command seconds, 300; Zone Control is always match.cjs's full 5:00), STAGES (the 12 offline ones),
# LOG (where the logs go). Prints one "== name: RESULT …" line per run, its FAIL lines, and a SUMMARY.
set -u
ROOT=$(cd "$(dirname "$0")/../../../../.." && pwd); cd "$ROOT"
PAR=${PAR:-3}; REP=${REP:-6}; ONLY=${ONLY:-}; SETS=${SETS:-own reg net rep match audio}
SECS_TURF=${SECS_TURF:-180}; DUR_TOWER=${DUR_TOWER:-300}
STAGES=${STAGES:-tidewater kelpline halyard saltpan crossmarket lockgate terraces nantai craters calamari spirhalite treehills}
T=tools/botlab/tests; RUN=tools/botlab/run.sh
LOG=${LOG:-$ROOT/.botlab/b5-int1-verify}; mkdir -p "$LOG"
export T RUN LOG
one() {   # name env… harness: a page / net test
  local name=$1; shift
  env WATCHDOG=900000 "$@" > "$LOG/$name.log" 2>&1
  echo "== $name: $(grep -E '^RESULT' "$LOG/$name.log" | tail -1) $(grep -c '^FAIL' "$LOG/$name.log") FAIL"
  grep -E '^FAIL|HARNESS|WATCHDOG|MAP MISMATCH|console errors: [^n]|c[0-9] console: [^n]|uncaught|Uncaught' "$LOG/$name.log" | cut -c1-700 | head -12
}
mat() {   # name env… harness: a bot match — its line, stuck %, frame errors, console lines
  local name=$1; shift
  env WATCHDOG=1500000 "$@" > "$LOG/$name.log" 2>&1
  local st=$(grep -oE 'stuck [0-9.]+%' "$LOG/$name.log" | head -1)
  local fe=$(grep -oE 'FRAME ERRORS [0-9]+' "$LOG/$name.log" | head -1)
  local co=$(grep -oE '^CONSOLE [0-9]+' "$LOG/$name.log" | head -1)
  local dv=$(grep -oE 'device mode [0-9.]+ s/bot \(walking [0-9.]+\) \| picks [0-9]+' "$LOG/$name.log" | head -1)
  echo "== $name: $(grep -cE '^RESULT_JSON' "$LOG/$name.log") result | ${st:-stuck ?} | ${fe:-FRAME ERRORS 0} | ${co:-CONSOLE ?} | ${dv:-}"
  grep -E '^== |WATCHDOG|HARNESS|MAP MISMATCH|^  \[' "$LOG/$name.log" | cut -c1-300 | head -8
}
export -f one mat
want() { [ -z "$ONLY" ] && return 0; case " $ONLY " in *" $1 "*) return 0;; esac; return 1; }
list() {   # the whole list, "<group> <name> ENV=… harness"
  local P="tools/botlab/page.cjs" N="tools/botlab/netpage.cjs"
  # ---- own: the six packages' new tests (+ int1's)
  echo "own tuning-turf MAP=testbox MODE=turf PAGE=$T/tuning.js $RUN $P"
  echo "own tuning-zones MAP=testbox MODE=zones PAGE=$T/tuning.js $RUN $P"
  echo "own weapon-names CLIENTS=1 Q0=netmock=1&mockauto=0 NET=$T/weapon-names.cjs $RUN $N"
  echo "own holds MAP=testbox MODE=turf PAGE=$T/holds.js $RUN $P"
  echo "own deployables MAP=testbox MODE=turf PAGE=$T/deployables.js $RUN $P"
  echo "own deployables-tower MAP=testbox MODE=tower PAGE=$T/deployables.js PAGE_ARGS=only=tower $RUN $P"
  echo "own deployables-rail MAP=calamari MODE=turf PAGE=$T/deployables.js PAGE_ARGS=only=rail $RUN $P"
  echo "own deployables-hedge MAP=podbox MODE=turf PAGE=$T/deployables.js PAGE_ARGS=only=hedge $RUN $P"
  echo "own sp-rules MAP=testbox MODE=turf PAGE=$T/sp-rules.js $RUN $P"
  echo "own zipcheer MAP=testbox MODE=turf PAGE=$T/zipcheer.js $RUN $P"
  echo "own zipcheer-tower MAP=testbox MODE=tower PAGE=$T/zipcheer.js $RUN $P"
  echo "own jump-ui MAP=testbox MODE=turf PAGE=$T/jump-ui.js $RUN $P"
  echo "own jump-ui-zones MAP=testbox MODE=zones PAGE=$T/jump-ui.js $RUN $P"
  echo "own jump-ui-tower MAP=testbox MODE=tower PAGE=$T/jump-ui.js $RUN $P"
  echo "own jump-ui-boss MAP=testbox MODE=boss PAGE=$T/jump-ui.js $RUN $P"
  echo "own jump-ui-1280 MAP=testbox MODE=turf W=1280 H=720 PAGE=$T/jump-ui.js $RUN $P"
  echo "own jump-ui-zones-960 MAP=testbox MODE=zones W=960 H=600 PAGE=$T/jump-ui.js $RUN $P"
  echo "own jump-ui-tower-960 MAP=testbox MODE=tower W=960 H=600 PAGE=$T/jump-ui.js $RUN $P"
  [ -f $T/int1.js ] && echo "own int1 MAP=testbox MODE=turf PAGE=$T/int1.js $RUN $P"
  [ -f $T/int1.js ] && echo "own int1-tower MAP=testbox MODE=tower PAGE=$T/int1.js $RUN $P"
  # ---- reg: the lead's page-test regressions
  echo "reg drainbow MAP=testbox MODE=turf PAGE=$T/drainbow.js $RUN $P"
  echo "reg surf MAP=testbox MODE=turf PAGE=$T/surf.js $RUN $P"
  echo "reg surf-movers-tower MAP=podbox MODE=tower PAGE=$T/surf-movers.js $RUN $P"
  echo "reg surf-movers-hedge MAP=podbox MODE=turf PAGE=$T/surf-movers.js PAGE_ARGS=only=hedge $RUN $P"
  echo "reg surf-movers-calamari MAP=calamari MODE=turf PAGE=$T/surf-movers.js $RUN $P"
  echo "reg movers MAP=calamari MODE=turf PAGE=$T/movers.js $RUN $P"
  echo "reg movers-zones MAP=calamari MODE=zones PAGE=$T/movers.js $RUN $P"
  echo "reg bot-specials MAP=testbox MODE=turf PAGE=$T/bot-specials.js $RUN $P"
  echo "reg bot-specials-tower MAP=testbox MODE=tower PAGE=$T/bot-specials.js $RUN $P"
  echo "reg track-arrows MAP=testbox MODE=turf PAGE=$T/track-arrows.js $RUN $P"
  echo "reg tower-rules MAP=testbox MODE=tower PAGE=$T/tower-rules.js $RUN $P"
  echo "reg tower-ink MAP=testbox MODE=tower PAGE=$T/tower-ink.js $RUN $P"
  echo "reg bot-sight MAP=testbox MODE=turf PAGE=$T/bot-sight.js $RUN $P"
  echo "reg world-build MAP=halyard PAGE=$T/world-build.js $RUN $P"
  echo "reg hud-lead-turf MAP=testbox MODE=turf PAGE=$T/hud-lead.js $RUN $P"
  echo "reg hud-lead-zones MAP=testbox MODE=zones PAGE=$T/hud-lead.js $RUN $P"
  echo "reg hud-lead-tower MAP=testbox MODE=tower PAGE=$T/hud-lead.js $RUN $P"
  echo "reg map-reveal MAP=testbox MODE=turf PAGE=$T/map-reveal.js $RUN $P"
  echo "reg input-swim MAP=testbox PAGE=$T/input-swim.js $RUN $P"
  echo "reg pad-mapping MAP=testbox PAGE=$T/pad-mapping.js PAGE_ARGS2=phase=2 $RUN $P"
  echo "reg loadout-picker MAP=testbox PAGE=$T/loadout-picker.js $RUN $P"
  echo "reg sub-tweaks MAP=testbox MODE=turf PAGE=$T/sub-tweaks.js $RUN $P"
  echo "reg sub-tweaks2 MAP=testbox MODE=turf PAGE=$T/sub-tweaks2.js $RUN $P"
  echo "reg sub-scale MAP=testbox MODE=turf PAGE=$T/sub-scale.js $RUN $P"
  echo "reg pods MAP=podbox MODE=turf PAGE=$T/pods.js $RUN $P"
  [ -f $T/wip-stages.js ] && echo "reg wip-stages MAP=testbox PAGE=$T/wip-stages.js $RUN $P"
  # ---- net: online, one at a time
  echo "net net-practice CLIENTS=2 Q0=autopilot Q1=autopilot APP_CSP=1 NET=$T/net-practice.cjs $RUN $N"
  echo "net net-turf CLIENTS=2 Q0=autopilot Q1=autopilot NET=$T/net-turf.cjs $RUN $N"
  echo "net net-surf CLIENTS=2 Q0=autopilot Q1=autopilot NET=$T/net-surf.cjs $RUN $N"
  echo "net net-surf-tower CLIENTS=2 Q0=autopilot Q1=autopilot NET_ARGS=scene=tower NET=$T/net-surf.cjs $RUN $N"
  echo "net net-drainbow CLIENTS=2 NET=$T/net-drainbow.cjs $RUN $N"
  echo "net net-server CLIENTS=1 APP_CSP=1 NET=$T/net-server.cjs $RUN $N"
  echo "net net-splatfeed CLIENTS=2 Q0=autopilot Q1=autopilot NET=$T/net-splatfeed.cjs $RUN $N"
  echo "net net-lobbykit CLIENTS=2 Q0=autopilot Q1=autopilot NET=$T/net-lobbykit.cjs $RUN $N"
  echo "net net-picker CLIENTS=2 Q0=autopilot Q1=autopilot NET=$T/net-picker.cjs $RUN $N"
  echo "net net-mock CLIENTS=1 Q0=netmock=1&mockauto=0 NET=$T/net-mock.cjs $RUN $N"
  echo "net net-holds-a CLIENTS=2 Q0=autopilot Q1=autopilot NET=$T/net-holds.cjs NET_ARGS=a=roller;b=brolly $RUN $N"
  echo "net net-holds-b CLIENTS=2 Q0=autopilot Q1=autopilot NET=$T/net-holds.cjs NET_ARGS=a=brush;b=blaster $RUN $N"
  echo "net net-deploy CLIENTS=2 Q0=autopilot Q1=autopilot NET=$T/net-deploy.cjs $RUN $N"
  echo "net net-deploy-tower CLIENTS=2 Q0=autopilot Q1=autopilot NET_ARGS=scene=tower NET=$T/net-deploy.cjs $RUN $N"
  echo "net net-deploy-leave CLIENTS=2 Q0=autopilot Q1=autopilot NET_ARGS=scene=leave NET=$T/net-deploy.cjs $RUN $N"
  echo "net net-sprules CLIENTS=2 Q0=autopilot Q1=autopilot NET=$T/net-sprules.cjs $RUN $N"
  echo "net net-zipcheer CLIENTS=2 NET=$T/net-zipcheer.cjs $RUN $N"
  echo "net net-jump-ui CLIENTS=2 NET=$T/net-jump-ui.cjs $RUN $N"
  echo "net net-jump-ui-tower CLIENTS=2 NET=$T/net-jump-ui.cjs NET_ARGS=scene=tower $RUN $N"
  [ -f $T/net-late-special.cjs ] && echo "net net-late-special CLIENTS=2 Q0=autopilot Q1=autopilot NET=$T/net-late-special.cjs $RUN $N"
  # ---- rep: the known issues, 6 each
  for i in $(seq 1 "$REP"); do
    echo "rep bot-specials-r$i MAP=testbox MODE=turf PAGE=$T/bot-specials.js $RUN $P"
    echo "rep jump-ui-960-r$i MAP=testbox MODE=turf W=960 H=600 PAGE=$T/jump-ui.js $RUN $P"
    echo "rep surf-r$i MAP=testbox MODE=turf PAGE=$T/surf.js $RUN $P"
  done
  # ---- match: 12 stages × 3 modes, random loadouts
  for s in $STAGES; do
    echo "match m-$s-turf MAP=$s MODE=turf SECS=$SECS_TURF $RUN tools/botlab/match.cjs"
    echo "match m-$s-zones MAP=$s MODE=zones $RUN tools/botlab/match.cjs"
    echo "match m-$s-tower MAP=$s DUR=$DUR_TOWER OTMAX=60 $RUN tools/botlab/tower-match.cjs"
  done
  # ---- audio: alone
  echo "audio sfx-cues MAP=testbox MODE=turf PAGE=$T/sfx-cues.js $RUN $P"
  echo "audio audio-pause MAP=testbox MODE=turf PAGE=$T/audio-pause.js $RUN $P"
}
pick() { list | while read -r g n rest; do case " $SETS " in *" $g "*) want "$n" && echo "$n $rest";; esac; done; }
echo "### int1 verify at $(git rev-parse --short HEAD): groups [$SETS]${ONLY:+ only [$ONLY]}, PAR $PAR"
for g in $SETS; do
  sel=$(SETS=$g pick)
  [ -z "$sel" ] && continue
  echo "## $g ($(echo "$sel" | wc -l | tr -d ' ') runs)"
  case $g in
    net|audio) echo "$sel" | xargs -P 1 -L 1 bash -c 'one "$@"' _ ;;
    match) echo "$sel" | xargs -P "$PAR" -L 1 bash -c 'mat "$@"' _ ;;
    *) echo "$sel" | xargs -P "$PAR" -L 1 bash -c 'one "$@"' _ ;;
  esac
done
echo "SUMMARY: $(grep -l '^RESULT' "$LOG"/*.log 2>/dev/null | wc -l | tr -d ' ') page/net logs with a RESULT; FAIL lines $(cat "$LOG"/*.log 2>/dev/null | grep -c '^FAIL'); WATCHDOG $(cat "$LOG"/*.log 2>/dev/null | grep -c WATCHDOG)"
exit 0
