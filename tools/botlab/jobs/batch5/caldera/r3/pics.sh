#!/bin/bash
# Highmark Foundry r3: the picture runs and the performance REPORTs beside Halyard's, one Electron instance at a time.
cd "$(dirname "$0")/../../../../../.."
export BOTLAB_OUT=/Users/danielosling/Desktop/1/inkwave-upstream/.botlab SLOTS=3
R=tools/botlab/run.sh; S=${SHOTDIR:-/private/tmp/claude-501/-Users-danielosling-Desktop-1/dd09cb28-6f60-4591-8992-4f7ec6fb49a8/scratchpad/cal-r3/shots}
O=tools/botlab/jobs/batch5/caldera/out/r3-local/checks; mkdir -p "$O"
SHAPE='{"name":"shape","from":[-0.02,250,0],"look":[0,0,0],"fov":35}'
MIDS='{"name":"mid1","from":[1.5,2.9,-10.8],"look":[-1,3.5,4],"fov":80},{"name":"mid2","from":[11.5,2.9,8.5],"look":[-4,2.2,-5],"fov":80},{"name":"mid3","from":[-12.5,4.0,-1.0],"look":[6,2.0,-1],"fov":80}'
HIGHCAMS="[$SHAPE,$MIDS,{\"name\":\"slump\",\"from\":[-13.2,2.8,-5.5],\"look\":[-27,0.4,-9],\"fov\":80},{\"name\":\"lookout\",\"from\":[-10,6.3,-12.8],\"look\":[0,2.0,2],\"fov\":80},{\"name\":\"arm\",\"from\":[10.5,8.5,-21.5],\"look\":[19.5,0,-33],\"fov\":70}]"
run() { local name=$1; shift; env "$@" $R tools/botlab/shoot.cjs > "$O/shoot-$name.log" 2>&1; echo "== $name: $(grep -E '^REPORT|SHOT FAIL' "$O/shoot-$name.log" | cut -c1-330)"; }
want() { [ -z "$ONLY" ] || [[ " $ONLY " == *" $1 "* ]]; }
want high && run high MAP=caldera TIME=day MODE=turf LAVA=high OUT=$S/high SHOTS="top,aerialA,$HIGHCAMS"
want zones && run zones MAP=caldera TIME=day MODE=zones LAVA=low OUT=$S/low SHOTS='top'
want tower && run tower MAP=caldera TIME=day MODE=tower LAVA=low OUT=$S/low SHOTS='top'
want ink && run ink MAP=caldera TIME=day MODE=turf LAVA=low PLAY=20 OUT=$S/ink SHOTS='top,mid'
if want perf; then
  run perf-halyard MAP=halyard TIME=day MODE=turf OUT=$S/perf SHOTS='top'
  run perf-caldera-low MAP=caldera TIME=day MODE=turf LAVA=low OUT=$S/perf SHOTS='top'
  run perf-caldera-high MAP=caldera TIME=day MODE=turf LAVA=high OUT=$S/perf SHOTS='top'
  run perf-halyard2 MAP=halyard TIME=day MODE=turf OUT=$S/perf SHOTS='top'
fi
echo "RESULT done"
