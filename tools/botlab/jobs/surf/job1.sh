#!/bin/bash
# JOB-1 — Surf N' Turf: the regression batch, then the balance matches. From the repo root:
#   SLOTS=3 tools/botlab/jobs/surf/job1.sh [regress] [balance]      (no args: both)
# Writes raw output under $BOTLAB_OUT/surf-job1/ and prints the summaries (agg.cjs) at the end.
HERE="$(cd "$(dirname "$0")" && pwd)"; ROOT="$(cd "$HERE/../../../.." && pwd)"; cd "$ROOT"
export SLOTS=${SLOTS:-3}
OUT="${BOTLAB_OUT:-$ROOT/.botlab}/surf-job1"; mkdir -p "$OUT/t" "$OUT/m"
want() { [ $# -eq 0 ] || [ ${#ARGS[@]} -eq 0 ] && return 0; for a in "${ARGS[@]}"; do [ "$a" = "$1" ] && return 0; done; return 1; }
ARGS=("$@")
page() { local name=$1; shift; env "$@" tools/botlab/run.sh tools/botlab/page.cjs > "$OUT/t/$name.txt" 2>&1; echo "[$name] $(grep -E '^RESULT|HARNESS' "$OUT/t/$name.txt" | tail -1)"; }
net() { local name=$1; shift; env "$@" tools/botlab/run.sh tools/botlab/netpage.cjs > "$OUT/t/$name.txt" 2>&1; echo "[$name] $(grep -E '^RESULT' "$OUT/t/$name.txt" | tail -1)"; }
if want regress; then
  echo "== regressions @ $(git rev-parse --short HEAD)"
  # the sound ones ALONE (they fail under load)
  page sfx-cues MAP=testbox MODE=turf PAGE=tools/botlab/tests/sfx-cues.js
  page audio-pause MAP=testbox MODE=turf PAGE=tools/botlab/tests/audio-pause.js
  # the rest, three at a time
  { page surf MAP=testbox MODE=turf PAGE=tools/botlab/tests/surf.js
    page bot-specials MAP=testbox MODE=turf PAGE=tools/botlab/tests/bot-specials.js
    page bot-specials-tower MAP=testbox MODE=tower PAGE=tools/botlab/tests/bot-specials.js PAGE_ARGS=only=tower; } &
  { page track-arrows MAP=testbox MODE=turf PAGE=tools/botlab/tests/track-arrows.js
    page tower-rules MAP=testbox MODE=tower PAGE=tools/botlab/tests/tower-rules.js
    page bot-sight MAP=testbox MODE=turf PAGE=tools/botlab/tests/bot-sight.js; } &
  { page world-build MAP=halyard PAGE=tools/botlab/tests/world-build.js
    page hud-lead-turf MAP=testbox MODE=turf PAGE=tools/botlab/tests/hud-lead.js
    page hud-lead-zones MAP=testbox MODE=zones PAGE=tools/botlab/tests/hud-lead.js
    page hud-lead-tower MAP=testbox MODE=tower PAGE=tools/botlab/tests/hud-lead.js; } &
  wait
  # online, one at a time (each runs 2 clients in one Electron)
  net net-practice CLIENTS=2 Q0=autopilot Q1=autopilot APP_CSP=1 NET=tools/botlab/tests/net-practice.cjs
  net net-turf CLIENTS=2 Q0=autopilot Q1=autopilot NET=tools/botlab/tests/net-turf.cjs
  net net-surf CLIENTS=2 Q0=autopilot Q1=autopilot NET=tools/botlab/tests/net-surf.cjs
fi
if want balance; then
  echo "== balance @ $(git rev-parse --short HEAD)"
  # sets: BASE (random specials, as shipped — Surf N' Turf in the pool), SURF (team A all on Surf N' Turf, team B random),
  # MIRROR (everyone on it: how it plays out, its numbers); Turf War 180 s on four stages, Zone Control on the same
  L="$OUT/jobs.txt"; : > "$L"
  for map in halyard crossmarket craters spirhalite; do
    for i in $(seq 1 10); do echo "base $map turf $i -" >> "$L"; echo "surf $map turf $i team0=surf" >> "$L"; done
    for i in $(seq 1 4); do echo "mirror $map turf $i all=surf" >> "$L"; done
    for i in $(seq 1 6); do echo "base $map zones $i -" >> "$L"; echo "surf $map zones $i team0=surf" >> "$L"; done
  done
  export OUTM="$OUT/m"
  run1() { local tag=$1 map=$2 mode=$3 i=$4 sp=$5; [ "$sp" = "-" ] && sp=""; local f="$OUTM/$tag-$map-$mode-$i";
    [ -s "$f.json" ] && return 0
    OUT="$f.json" MAP=$map MODE=$mode SECS=180 SPECIALS="$sp" tools/botlab/run.sh tools/botlab/match.cjs > "$f.txt" 2>&1; }
  export -f run1
  xargs -P "$SLOTS" -L 1 bash -c 'run1 "$@"' _ < "$L"
  node "$HERE/agg.cjs" "$OUT/m"
fi
