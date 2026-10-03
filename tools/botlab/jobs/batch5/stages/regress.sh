#!/bin/bash
# batch5 stages (the stage-module registry, [b5-stagehooks]) regressions: the registry's own page / two-client tests
# (REP times), the lead's regression list (PAR at once), the bot matches (calamari / treehills / halyard × turf / zones /
# tower: console errors, stuck %), check-maps, and the cost A/B (stage-mods-perf.js on this head and on BASE, alternated).
#   tools/botlab/jobs/batch5/stages/regress.sh          (env: BOTLAB_OUT / SLOTS for run.sh; PAR 3, REP 2, BASE 9f2cdef)
#   ONLY="stage-mods net-stagemods" tools/botlab/jobs/batch5/stages/regress.sh
set -u
ROOT=$(cd "$(dirname "$0")/../../../../.." && pwd); cd "$ROOT"
PAR=${PAR:-3}; REP=${REP:-2}; ONLY=${ONLY:-}; BASE=${BASE:-9f2cdef}
T=tools/botlab/tests; RUN=tools/botlab/run.sh
LOG=${LOG:-$ROOT/.botlab/b5-stages-regress}; mkdir -p "$LOG"
one() {   # name env… harness
  local name=$1; shift
  env WATCHDOG=900000 "$@" > "$LOG/$name.log" 2>&1
  echo "== $name: $(grep -E '^RESULT' "$LOG/$name.log" | tail -1) $(grep -c '^FAIL' "$LOG/$name.log") FAIL"
  grep -E '^FAIL|HARNESS|WATCHDOG|MAP MISMATCH|console errors: [^n]|^c[0-9] console: [^n]|uncaught' "$LOG/$name.log" | cut -c1-600
}
match() {   # name env…: an all-bot match; stuck %, console errors
  local name=$1; shift
  env WATCHDOG=900000 "$@" $RUN tools/botlab/match.cjs > "$LOG/$name.log" 2>&1
  echo "== $name: $(grep -oE 'stuck [0-9.]+%' "$LOG/$name.log" | head -1) | $(grep -cE '^RESULT_JSON' "$LOG/$name.log") result line(s)"
  grep -E '^== |FRAME ERRORS|^CONSOLE|WATCHDOG|HARNESS|MAP MISMATCH|console errors' "$LOG/$name.log" | cut -c1-400 | head -12
}
want() { [ -z "$ONLY" ] && return 0; case " $ONLY " in *" $1 "*) return 0;; esac; return 1; }
export -f one; export LOG RUN T
batch=()
for i in $(seq 1 "$REP"); do batch+=("stage-mods-$i MAP=testbox PAGE=$T/stage-mods.js $RUN tools/botlab/page.cjs"); done
batch+=(
  "world-build MAP=halyard PAGE=$T/world-build.js $RUN tools/botlab/page.cjs"
  "movers MAP=calamari MODE=turf PAGE=$T/movers.js $RUN tools/botlab/page.cjs"
  "pods MAP=podbox MODE=turf PAGE=$T/pods.js $RUN tools/botlab/page.cjs"
  "treehills-pods MAP=treehills MODE=turf PAGE=$T/treehills-pods.js $RUN tools/botlab/page.cjs"
  "treehills-pods-tower MAP=treehills MODE=tower PAGE=$T/treehills-pods.js $RUN tools/botlab/page.cjs"
  "surf-movers MAP=podbox MODE=tower PAGE=$T/surf-movers.js $RUN tools/botlab/page.cjs"
  "surf-movers-hedge MAP=podbox MODE=turf PAGE=$T/surf-movers.js PAGE_ARGS=only=hedge $RUN tools/botlab/page.cjs"
  "tower-rules MAP=testbox MODE=tower PAGE=$T/tower-rules.js $RUN tools/botlab/page.cjs"
  "bot-sight MAP=testbox MODE=turf PAGE=$T/bot-sight.js $RUN tools/botlab/page.cjs"
  "climb-audit MAP=halyard PAGE=$T/climb-audit.js $RUN tools/botlab/page.cjs"
  "climb-audit-treehills MAP=treehills PAGE=$T/climb-audit.js $RUN tools/botlab/page.cjs"
  "wip-stages MAP=bluestone PAGE=$T/wip-stages.js $RUN tools/botlab/page.cjs"
)
for b in "${batch[@]}"; do n="${b%% *}"; want "${n%-[0-9]*}" || want "$n" && echo "$b"; done | xargs -P "$PAR" -L 1 bash -c 'one "$@"' _
if want net-stagemods; then for i in $(seq 1 "$REP"); do one net-stagemods-$i CLIENTS=2 NET=$T/net-stagemods.cjs $RUN tools/botlab/netpage.cjs; done; fi
want net-stageclock && one net-stageclock CLIENTS=2 NET=$T/net-stageclock.cjs $RUN tools/botlab/netpage.cjs
want net-practice && one net-practice CLIENTS=2 Q0=autopilot Q1=autopilot APP_CSP=1 NET=$T/net-practice.cjs $RUN tools/botlab/netpage.cjs
want net-turf && one net-turf CLIENTS=2 Q0=autopilot Q1=autopilot NET=$T/net-turf.cjs $RUN tools/botlab/netpage.cjs
want check-maps && { echo "== check-maps: $(node build/check-maps.mjs 2>&1 | grep -c 'issue')" ; node build/check-maps.mjs 2>&1 | grep -E 'issue|  - ' | head -10; }
if want match; then
  for m in calamari treehills halyard; do for mode in turf zones tower; do echo "match-$m-$mode MAP=$m MODE=$mode"; done; done |
    xargs -P "$PAR" -L 1 bash -c 'n=$1; shift; env WATCHDOG=900000 "$@" '"$RUN"' tools/botlab/match.cjs > "$LOG/$n.log" 2>&1; echo "== $n: $(grep -oE "stuck [0-9.]+%" "$LOG/$n.log" | head -1) | $(grep -cE "^RESULT_JSON" "$LOG/$n.log") result line(s)"; grep -E "FRAME ERRORS|^CONSOLE|WATCHDOG|HARNESS|MAP MISMATCH" "$LOG/$n.log" | cut -c1-400 | head -8' _
fi
if want perf; then
  # the cost on a stage without a module: this head against BASE (a git archive beside it, sharing node_modules), alternated
  B="$LOG/base-$BASE"; mkdir -p "$B"; git archive "$BASE" | tar -x -C "$B"; ln -s "$ROOT/node_modules" "$B/node_modules"
  for i in 1 2 3; do
    for side in head base; do
      R="$ROOT"; [ "$side" = base ] && R="$B"
      (cd "$R" && env WATCHDOG=900000 MAP=halyard PAGE="$ROOT/$T/stage-mods-perf.js" "$R/tools/botlab/run.sh" tools/botlab/page.cjs > "$LOG/perf-$side-$i.log" 2>&1)
      echo "== perf-$side-$i: $(grep -oE '\{"raycast20k.*\}' "$LOG/perf-$side-$i.log" | head -1)"
    done
  done
fi
exit 0
