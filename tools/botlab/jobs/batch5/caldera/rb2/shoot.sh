#!/bin/bash
# shoot.sh name lava mode shots [ENV=..]  — one Electron instance under the shared lock
cd /Users/danielosling/Desktop/1/st-b5-caldera
F=/private/tmp/claude-501/-Users-danielosling-Desktop-1/dd09cb28-6f60-4591-8992-4f7ec6fb49a8/scratchpad/fx2
export BOTLAB_OUT=/Users/danielosling/Desktop/1/inkwave-upstream/.botlab SLOTS=3
name=$1 lava=$2 mode=$3 shots=$4; shift 4
env "$@" LAVA=$lava MAP=caldera TIME=day MODE=$mode OUT=$F/shots/$name SHOTS="$shots" tools/botlab/run.sh tools/botlab/shoot.cjs > $F/logs/shoot-$name.log 2>&1
echo "== $name exit $? $(grep -E '^REPORT|SHOT FAIL|MISMATCH|Error' $F/logs/shoot-$name.log | cut -c1-300)"
