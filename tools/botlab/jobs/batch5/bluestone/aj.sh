#!/bin/bash
# fix round 3: the review's real-vs-instant pair (its method, art3/tools/q4.sh) with the 'mid' preset camera added; $1 = out dir, $2 = time
cd /Users/danielosling/Desktop/1/st-b5-bluestone
A=/private/tmp/claude-501/-Users-danielosling-Desktop-1/dd09cb28-6f60-4591-8992-4f7ec6fb49a8/scratchpad/fix3
export BOTLAB_OUT=/Users/danielosling/Desktop/1/inkwave-upstream/.botlab SLOTS=3 WATCHDOG=900000
V='{"mid": {"from": [6.72, 7, -32], "look": [0, 1, 12.8], "fov": 82}, "swimston": {"from": [-19.5, 2.75, -50.5], "look": [-21, 3.6, -26], "fov": 72}, "circus": {"from": [1.2, 1.75, -16.4], "look": [0, 5.4, -3], "fov": 74}, "knee": {"from": [-17.9, 1.75, -32.0], "look": [-27, 3.0, -13], "fov": 74}, "quay": {"from": [-8.2, 1.75, -45], "look": [-3, 2.4, -24], "fov": 74}}'
mkdir -p $1
env SET=afterjump TIME=$2 PALETTE=tangerine-cobalt VIEWS="$V" OUT=$1 AJ_AT=${AJ_AT:-2,6} W=${W:-1600} H=${H:-900} tools/botlab/run.sh $A/tools/fx3-shots.cjs > $1/run-$2.log 2>&1
echo "== $2 $(grep -c '^shot' $1/run-$2.log) shots $(grep -E 'CONSOLE|WATCHDOG|ERR' $1/run-$2.log | head -3 | tr '\n' ' ')"
grep LIGHTS $1/run-$2.log
