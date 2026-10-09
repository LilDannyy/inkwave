#!/bin/bash
# shoot.sh name lava mode shots  — one Electron instance under the shared lock
cd /Users/danielosling/Desktop/1/st-b5-caldera
S=/private/tmp/claude-501/-Users-danielosling-Desktop-1/dd09cb28-6f60-4591-8992-4f7ec6fb49a8/scratchpad/rb1
export BOTLAB_OUT=/Users/danielosling/Desktop/1/inkwave-upstream/.botlab SLOTS=3
name=$1 lava=$2 mode=$3 shots=$4; shift 4
env "$@" LAVA=$lava MAP=caldera TIME=day MODE=$mode OUT=$S/shots/$name SHOTS="$shots" tools/botlab/run.sh tools/botlab/shoot.cjs > $S/logs/shoot-$name.log 2>&1
echo "== $name exit $? $(grep -E '^REPORT|SHOT FAIL|MISMATCH|Error' $S/logs/shoot-$name.log | cut -c1-300)"
